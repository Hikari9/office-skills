---
name: codex-cli
description: Mechanics of driving `codex exec` safely — models, worktrees, telemetry. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner, at every phase that dispatches a `codex exec` process.
Assumes: the Office Kernel is already in the packet.

## Model selection

Pass `-m` explicitly on every invocation — never rely on a default.

- `gpt-5.6-luna`, `xhigh` reasoning effort — ordinary implementation (executor default).
- `gpt-5.6-sol`, high reasoning effort — hard diagnosis, or any reviewer dispatch.

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
  launch can carry the tools (see `claude-office/skills/claude-cli` → the allowlist section).
- **Do not conclude "delegates can't do MCP work."** The failure is per-brand and per-config, and
  the same task frequently succeeds on another brand's launch form.
- **Where the API is reachable over plain HTTP, prefer it.** An MCP server refusing or lacking a
  tool is not the underlying system refusing it — REST has done what an MCP allowlist would not,
  more than once.
- **Reads, including production reads, are in scope for a delegate.** The true shape of a record
  often exists only in production; pin the shape in the prompt and require one real record pasted
  back.

## One writer per working tree

Never run two Codex processes against one working tree. Parallel work requires **separate
worktrees and disjoint `Touches:` paths** — not just separate prompts. Before dispatch, confirm no
other writer is already live in that tree.

**Preserve pre-existing dirty changes.** Diff the tree before dispatch; anything already
uncommitted is a protected path, named as such in the prompt, never touched by the dispatched
process.

## Before every dispatch

Record `BASE=$(git rev-parse HEAD)` in the current tree before handing off. The executor's commit
range and the reviewer's diff package both key off this value.

## Telemetry per launch

Record, per `office-core/schemas/run-event.schema.json`: the `codex exec` launch id, worktree id,
`BASE` commit, selected spokes, model name and effort, and (for reviewer dispatches) the review
round. This is what makes a duplicate writer or a skipped review observable after the fact — a
transcript keyword match does not substitute for it.

## Watching it run — never pipe the dispatch

**Launch it as a background task with no pipes on stdout, then give the user the harness's
`.output` path.** Same rule `agy-cli` already carries — it is per dispatch mechanism, not per brand.

```bash
codex exec --yolo -m <model> --cd "<abs repo path>" "$(cat <brief>)" < /dev/null 2>&1
# run_in_background: true, timeout: 600000 — then hand the user the returned .output path
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
  Passing `--cd` fails instantly with `error: unexpected argument '--cd' found`. The resumed session
  keeps its original working directory, so `--cd` is unnecessary — but tell the agent which directory
  it should be in and have it confirm, rather than assuming.

  ```bash
  codex exec resume --dangerously-bypass-approvals-and-sandbox --model <model> <session-id> \
    "<continuation prompt>" < /dev/null 2>&1
  # run_in_background: true, timeout: 600000
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
