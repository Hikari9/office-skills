---
name: codex-cli
description: Mechanics of driving `codex exec` safely — models, worktrees, telemetry. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner, only when Dispatch routing selects the Codex CLI path.
Assumes: the Office Kernel is already in the packet.

When the planner and assigned worker are both Codex, the hub routes the worker to a fresh
in-session Codex subagent instead. This spoke's CLI mechanics do not apply to that path.

## Model and effort selection

**Pass BOTH `-m <model>` and `-c model_reasoning_effort="<effort>"` on every invocation — never rely
on a default for either.**

- `gpt-5.6-luna`, `high` effort — ordinary implementation (executor default).
- `gpt-5.6-luna`, `xhigh` effort — **plan** review, hard diagnosis, and **code** review of a
  high-blast-radius leg (the code-review default).
- `gpt-5.6-luna`, `high` effort — **code** review of a low-blast-radius leg: docs,
  evidence-checking, applied-state claims the planner can verify with a `git grep` plus a
  `--dry-run`. The dispatcher prices this per leg; see `auto-office/skills/auto-routing`
  → *Review effort is priced per leg*. Never below `high`, and never for plan review.

`gpt-5.6-sol` is no longer a routing option in this office; Luna covers both lanes.

**`codex exec` has no `--effort` flag.** Effort is a config key, so it is set with `-c`:
`-c model_reasoning_effort="xhigh"`. A dispatch passing only `-m` silently inherits
`model_reasoning_effort` from `~/.codex/config.toml` — commonly `medium`. **Verified 2026-08-25:
that is exactly what every office was doing**, so the role tables said `xhigh` and the process ran
whatever the operator's config happened to say. Treat a missing `-c model_reasoning_effort=` as a
**defect in the dispatch, not a detail** — the same rule `auto-routing` already applies to a
`claude --model` without `--effort`.

**Read the effort back out of the launch banner.** An unrecognised value is **not** rejected: the
banner prints `reasoning effort: bogus` and the session runs anyway (verified 2026-08-25, Codex
v0.149.1). The banner's `model:` and `reasoning effort:` lines are the only proof of what actually
launched; record both in telemetry, and never infer them from the command you meant to type.

## The safety boundary

`codex exec --yolo` runs with no sandbox and no approval stop. The prompt you write plus the
stated blast-radius ceiling **are** the entire safety boundary for that process — there is no
mechanism behind them. Write the ceiling as its own named block, state exclusions explicitly, and
copy it verbatim into the prompt; do not summarize it.

## Live-system access is the CLI's own, not the planner's

`--yolo` removes the sandbox and every approval stop, so **within the local machine** the executor
can do what the planner can. **MCP servers are the exception, and they are the one that matters
here:** a `codex exec` session sees the servers configured for *Codex*, not the connectors the
planner's harness happens to hold. A task needing Rock, Basecamp, or Sheets is not automatically
reachable just because `--yolo` is set.

- **Check before routing, not after the dispatch comes back empty.** Confirm the server is
  configured for this CLI; if it is not, either configure it or route that task to a brand whose
  launch can carry the tools (see `auto-office/skills/claude-cli` → the allowlist section).
- **Do not conclude "delegates can't do MCP work."** The failure is per-brand and per-config, and
  the same task frequently succeeds on another brand's launch form.
- **Where the API is reachable over plain HTTP, prefer it.** An MCP server refusing or lacking a
  tool is not the underlying system refusing it — REST has done what an MCP allowlist would not,
  more than once.
- **Reads, including production reads, are in scope for a delegate.** The true shape of a record
  often exists only in production; pin the shape in the prompt and require one real record pasted
  back.

## Independent writers per working tree

Never run two independent Codex processes against one working tree. Parallel work requires
**separate worktrees and disjoint `Touches:` paths** — not just separate prompts. The coordinated
Executor-owned Tester is the only in-tree exception and follows
`office-core/protocol/tester-worker.md` for path ownership and Git locking. Before dispatch, confirm
no uncoordinated writer is already live in that tree.

**`codex exec resume` is the sharpest way to break this rule, because it does not look like a
dispatch.** It takes no `--cd` and silently lands in the *caller's* cwd, not the session's — so a
resume issued from a planner sitting in another repo puts a full-authority writer in whatever tree
the planner happens to be in. Verified 2026-08-29; see the `resume` bullet under *Known sharp edges*
for the banner read-back that catches it. **`--cd` on a fresh `exec` is the only way to aim a Codex
process; every other path inherits.**

**Preserve pre-existing dirty changes.** Diff the tree before dispatch; anything already
uncommitted is a protected path, named as such in the prompt, never touched by the dispatched
process.

## Before every dispatch

Record `BASE=$(git rev-parse HEAD)` in the current tree before handing off. The executor's commit
range and the reviewer's diff package both key off this value.

## Telemetry per launch

Record, per `office-core/schemas/run-event.schema.json`: the `codex exec` launch id, worktree id,
`BASE` commit, selected spokes, **the model name and effort as echoed by the launch banner**, and (for reviewer dispatches) the review
round. This is what makes a duplicate writer or a skipped review observable after the fact — a
transcript keyword match does not substitute for it.

## Watching it run — never pipe the dispatch

**Launch it as a background task with no pipes on stdout, then give the user the harness's
`.output` path.** Same rule `agy-cli` already carries — it is per dispatch mechanism, not per brand.

```bash
codex exec --yolo -m <model> -c model_reasoning_effort="<effort>" \
  --cd "<abs repo path>" "$(cat <brief>)" < /dev/null 2>&1
# run_in_background: true, timeout: 600000 — then hand the user the returned .output path
# Then read the launch banner: `model:` and `reasoning effort:` must match what you intended.
```

**Name the session by role.** The first line of the brief is `[ROLE] <repo> — <task>` — `[PLANNER]`,
`[PM]`, `[EXECUTOR]`, `[WORKER]`, `[REVIEW]`, `[PLAN-REVIEW]` — so a job list is readable at a glance.
Pass the same string to any label flag the brand exposes. The prefix is a display convenience and
**never an identifier**: match on session or worktree identity, never on a label.


- **Pass an explicit `timeout` on every dispatch, or the harness kills it mid-work.** Under Claude
  Code the Bash tool's `timeout` applies to backgrounded tasks too, and its **default is 120000 ms**.
  A dispatch launched without it dies around the 3-minute mark — long enough to look like real work,
  far too short for a build (~90 s) plus a unit suite (~60 s), let alone mutation testing that re-runs
  the suite per mutation. Set `timeout: 600000` (the 10-minute maximum) on every launch.
  Measured 2026-08-04: an unset-timeout reviewer dispatch was killed at **exactly 180 s** after a
  *successful* command, leaving no verdict and no error record in the rollout — while two control
  dispatches carrying `timeout: 600000` ran 4m30s and 8m00s to clean completion. The rollout's last
  `token_count` showed 63,948 tokens against a 258,400 window, so **do not misread this as a context
  limit**; there is no error to find, which is precisely what makes it easy to misdiagnose.
- **Suspect this before believing an "external process cap" exists.** The same repo's handoffs had
  spent a whole run attributing truncated work to processes being "killed from outside" — a Playwright
  browser download cut off at 60%, a ~232 s live sequence that could never finish. Both fit the 120 s
  default exactly. Folklore about a hostile environment is cheap to acquire and expensive to design
  around; measure the lifetime with a throwaway `for i in $(seq 1 16); do echo tick; sleep 30; done`
  before restructuring real work to fit an imagined ceiling.
- **`< /dev/null` is mandatory.** `codex exec` reads stdin even when given a positional prompt.
  Backgrounded without it, it blocks forever: observed once at 2h27m of wall clock at 0.17 s of CPU,
  looking alive the whole time.
- **The 10-minute maximum is real, and `resume` is the answer** — not `nohup`, which costs the
  completion notification. Split long reviewer or executor sessions across dispatches with
  `codex exec resume <session-id>` (or `--last`), which preserves the session's context and its
  work-so-far. A killed dispatch is recoverable the same way: resume it rather than paying again for
  the conclusions it already reached.
- **`resume` takes a DIFFERENT flag set from `exec` — `--cd` is rejected.** Its usage is
  `codex exec resume --dangerously-bypass-approvals-and-sandbox --model <MODEL> <SESSION_ID> [PROMPT]`.
  `-c model_reasoning_effort=` is accepted here too and is **required**: a resume inherits the
  session's context, **not** its effort. Verified 2026-08-25 — resuming an `xhigh` session without
  the flag launched at `reasoning effort: medium`, the config default. A long run split across
  resumes silently degrades from the second dispatch onward if you drop it.
  Passing `--cd` fails instantly with `error: unexpected argument '--cd' found`.

- **`resume` does NOT keep the session's working directory — it inherits the CALLER's cwd, and
  there is no flag to correct it.** This file previously claimed the opposite; that was wrong and
  it is the more dangerous half of the `--cd` rejection, because the two combine into a session
  you cannot aim. Verified 2026-08-29, Codex v0.150.1: a session originally launched with
  `--cd /Users/rico/Git/rock-favor/.worktrees/si-t14`, resumed from a planner whose cwd was
  `/Users/rico/Git/rock-dashboards`, came back with

  ```
  workdir: /Users/rico/Git/rock-dashboards
  session id: 01a04ccc-fa85-7963-8b06-6caaea4839e7   # same session, different tree
  ```

  That tree had a **live executor writing in it**. A resume is a full-authority `--yolo` writer, so
  this is the duplicate-writer failure the one-writer-per-tree rule exists to prevent — arriving
  through the one command in this file that looks like it cannot cause it.

  **The rule: read the resume banner's `workdir:` line before letting it run, every time.** Treat it
  exactly like the `model:` and `reasoning effort:` read-back two bullets up — same banner, same
  discipline, and for the same reason: the flags you passed are not the state you got.

  If the `workdir` is wrong, **you cannot fix it in place** — `resume` rejects `--cd`. Kill it and
  relaunch a fresh `codex exec --yolo --cd <worktree>` instead:

  ```bash
  pkill -f "<session-id>"          # then confirm: pgrep -f "<session-id>" | wc -l  => 0
  ```

  Losing the session history costs little **when the findings live in a file in the worktree**
  rather than only in the transcript — which is another reason briefs and review findings belong on
  disk. Write them there and a misrouted resume becomes a 10-second recovery instead of a re-run.

  Telling the agent which directory it should be in and having it confirm is still worth doing, but
  it is a second line of defence, not the control. The banner is the control: the agent's own
  confirmation arrives after it has already been placed in the wrong tree.

  ```bash
  codex exec resume --dangerously-bypass-approvals-and-sandbox --model <model> \
    -c model_reasoning_effort="<effort>" <session-id> \
    "<continuation prompt>" < /dev/null 2>&1
  # run_in_background: true, timeout: 600000
  # Then read the banner: `model:`, `reasoning effort:`, AND `workdir:` must all be what you meant.
  # cd to the target worktree before resuming, since the resume inherits your cwd.
  ```

  Find the session id in the launch banner (`session id:` line) or from the newest rollout under
  `~/.codex/sessions/<yyyy>/<mm>/<dd>/`.
- **Budget the split explicitly in the continuation prompt.** Give the agent the wall-clock ceiling
  and the measured cost of its tools, then require a checkpoint token (e.g. `RESUME_NEEDED`) at a
  natural boundary. Without that it will either rush a verdict to beat a clock it cannot see, or be
  killed mid-thought again. Also require a clean `git status --short` **at every checkpoint**, not
  only at the end — otherwise a resume begins on a tree still carrying the last round's mutations.

- **Never pipe through `tail` or `head`.** They buffer the *entire* stream until the process exits,
  so the harness's task-output file sits at 0 bytes for the whole run: the liveness check this
  office requires has nothing to read, and the user has nothing to watch. Observed 2026-08-02 on a
  ~19m T1 dispatch — the planner fell back to polling `git log` and `pgrep`, and the user had to ask
  for a log path mid-run. You only get to read the file after exit either way, so the pipe buys
  nothing and costs live visibility.
- **Never write logs into the target repo.** The harness `.output` path is already outside it — use
  that. Observed 2026-08-02: a planner "helpfully" created `.run-logs/` in the user's repo plus a
  `.gitignore` entry, and the user's verdict was *"fair initiative, but that's a bit intrusive."*
  The handoff file is the artifact that belongs in the repo; the log is not. If you genuinely need a
  path the harness does not provide, use the session scratchpad or `$TMPDIR` — never the worktree.
- **State the log path in the dispatch status line.** A user who has to ask where the output went is
  a user who could not have intervened.
- Read only the tail of that file *after* completion; live output must never be pulled into the
  planner's context.

`agy-office/skills/agy-cli` carries the same rule. It is stated in both because the mistake is per
dispatch mechanism, not per brand.

## Known sharp edges and recovery

- **Launch it through the harness, not `nohup … &`.** Under Claude Code, start `codex exec` with
  the Bash tool's `run_in_background: true` so a completion notification fires. A shell-backgrounded
  `nohup codex exec … &` is invisible to the harness: the process runs and exits with **no
  notification**, and the planner sits waiting on work that finished. Observed 2026-08-01 — a
  completed `codex exec` went unnoticed for ~1h38m of pure wall-clock. If you have already launched
  one this way, poll for liveness **as defined below** plus the handoff file's mtime rather than
  assuming it is still running.
- **`pgrep -f "codex exec …"` is NOT a liveness check for codex — it matches the harness's wrapper
  shell.** The Bash tool runs the dispatch inside `/bin/zsh -c …`, so the *shell's* command line
  contains the whole `codex exec` invocation and matches the pattern. That wrapper can outlive its
  codex child by a long way: observed 2026-08-02, two wrappers still resident 55 and 46 minutes
  after their codex processes had exited and their reports were on disk. A planner polling this way
  sees "still alive" forever and either waits on nothing or, worse, talks itself into a re-dispatch.
  Check for the **binary** instead, and confirm with the artifact:

  ```bash
  ps -eo pid,comm | awk '$2=="codex"'   # empty  => no codex process, regardless of pgrep
  ```

  **`comm == "codex"` is NOT universal — on an nvm-installed CLI it is `node`.** Measured
  2026-08-25 on darwin with codex under `~/.nvm/versions/node/v24.13.1/bin/codex`: the live
  dispatch showed `comm == node` (two PIDs: the JS entrypoint plus the vendored
  `codex-darwin-arm64` binary), so the `$2=="codex"` filter returned **empty while the executor
  was actively working and its output file was growing**. A planner trusting it would have
  declared the run dead and re-dispatched into a tree that already had a live writer — the exact
  corruption this section exists to prevent. The `comm=="codex"` check is safe only in the
  *negative-to-positive* direction; a hit means alive, a miss means nothing.

  **Match on the worktree path instead — it is unique per dispatch and brand-agnostic:**

  ```bash
  pgrep -f "<abs worktree path>" | wc -l    # 0 => dead; >0 => alive
  ```

  And confirm with two independent signals before concluding death: the output file's size
  must be *static* across two samples, **and** the process count zero. A growing `.output` with
  a "dead" process reading means your liveness check is wrong, not that the file is haunted.

  **Never use `pgrep -fl` on a codex dispatch.** The entire brief lives in the command line, so
  `-l` prints the whole prompt — twice, once per PID. Observed this run: a single `pgrep -fl`
  dumped ~14 KB of brief text into the planner's context for a one-bit answer. Use
  `pgrep -f <path> | wc -l`, or pipe through `cut -c1-120`.

  Same run, the inverse error: a dispatch the harness reported as `killed` was read as "still alive"
  from a `pgrep` hit and written up as a race with teardown. It was not a race — it was the wrapper.
  The safe rule survives either way (**never re-dispatch into a tree until death is confirmed**), but
  confirm it against `comm == codex` and the handoff file, never against a `pgrep -f` string match.
- **Killing those wrappers kills any Monitor still armed on them.** Monitors watching the same
  pattern exit non-zero (144) when you clean up orphans. Harmless if the underlying work already
  completed — but check the handoff files before assuming a monitor failure means a failed task.
- A `codex exec` process that exits 0 has not necessarily done anything — exit status is not
  evidence (see `office-core/protocol/evidence-and-handoff.md`). Always require the handoff file
  and its gate output.
- If a dispatched process appears to have touched a path outside its named scope, stop before
  dispatching anything else into that tree; diff against `BASE` and reconcile before continuing.
- New durable runtime lessons — a flag that behaved unexpectedly, a launch that silently ignored an
  argument, a worktree collision — get written into this file, not into the hub.
