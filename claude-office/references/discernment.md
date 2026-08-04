# Discernment: inline vs. delegate, and the claude CLI as executor

Use this to decide whether to execute a task **INLINE** in the primary session or delegate implementation work to a **native `claude` background agent** (`claude --bg`) that can be attached to and steered live — not a fire-and-forget shell process, and not `claude -p`/`--print` (that's a one-shot pipe, not a live-managed agent). This is also the mechanism behind `claude-office`'s Phase 2A (`--cli` executor, the default).

## Triage gate: inline vs. delegated execution

| Execution mode | When to use | Why |
|---|---|---|
| **INLINE (current session)** | Quick edits (**1–3 files max**); minor bugfixes, typos, import adjustments, small component updates; clear deterministic changes with zero ambiguity; tasks blocking immediate conversation progress | Maximum token efficiency: reuses active context directly, avoids CLI process startup overhead, sub-agent system prompt loading, stdin prompt piping, and status polling |
| **DELEGATED (`claude --bg`)** | Multi-file features or refactors (>3 files); long-horizon, multi-step work while you prep downstream tasks; pick `haiku`/`sonnet`/`opus` from the decision matrix below | Concurrency & isolation: keeps the primary turn free for high-level steering while isolating complex or multi-file background work |

> **Rule of thumb:** if writing the delegated stdin prompt brief takes longer than making the edits directly, execute **INLINE**.

## Golden rules

1. **Announce the mode before executing — one terse line, every time.** Before touching files or dispatching an agent: `Mode: <INLINE|haiku|sonnet|opus> — Why: <≤8 words>`. One line, no elaboration. Multi-phase task (e.g. haiku triage → sonnet implement)? Re-announce only on a mode change.
2. **Always pass the model explicitly with `--model`.** Never rely on the session default — it drifts with `/config`, fast mode, and settings. Aliases resolve to the latest of each family: `opus`, `sonnet`, `haiku`.
3. **Pair the model with `--effort`. Default to `high` for `sonnet`, `medium` for `opus`.** Opus 5 at `medium` effort delivers frontier agentic intelligence with optimal latency and cost savings. For `haiku`, discern between `low` (pure mechanical) and `medium` (fast exploration/triage). Escalate `opus` to `high` effort for top-tier security-critical or maximum-rigor frontier challenges; reserve `xhigh` for a specific hard task where `high` visibly underperforms, and `max` for correctness-critical one-offs. Levels: `low` `medium` `high` `xhigh` `max`.
4. **Launch as a native background agent with `claude --bg`, prompt piped on stdin.** `--bg` starts the agent and returns immediately; manage it with `claude agents`.
   - **Steerable (default):** add `--remote-control "<descriptive name>"` so you can attach and steer it live.
   - **Fire-and-forget:** `--bg --name "<descriptive name>"` when you won't intervene.
   - **Never** shell-background an interactive `claude --remote-control … &` — that creates an orphaned no-TTY process that may run but isn't reliably registered as a Remote Control background session.
   - **Pipe the prompt on stdin, not as a trailing CLI arg.** Briefs are long `.md` files; stdin avoids ARG_MAX and shell-quoting hazards.
5. **Unattended operation uses `--dangerously-skip-permissions`, with prompt-enforced guardrails.** A background agent that hits a permission prompt it can't surface will stall. Pass it (or a pre-granted `--allowedTools` allowlist) and make the prompt name the absolute repo/worktree and branch, precise in-scope work, protected/out-of-scope paths, allowed side effects, and validation commands. Restrict invocations to a known repo — never an untrusted prompt/repo.
6. **Commit boundary.** The worker may commit to the designated branch/worktree when the prompt permits it. It must not push, open a PR, deploy, alter remote configuration, send messages, or touch credentials unless the caller explicitly authorizes that action.
7. **Tell it not to stop and ask.** A background agent can end a turn on a clarifying question, burning a round trip. Every prompt should end with: *"Do not stop to ask questions; make reasonable decisions yourself and implement the entire brief."*
8. **Review after.** The worker's output is a draft: independently inspect its diff/commits, run validation (`pnpm lint`/`pnpm build`, tests — see the project's build gate), and review before pushing or deploying.

## Model decision matrix (current as of July 2026)

Claude Opus 5 is the flagship model for complex reasoning and agentic coding, with thinking enabled by default and enhanced tool use. Pricing per 1M tokens (input/output): Opus 5 $5/$25, Sonnet 5 $3/$15 ($2/$10 intro through 2026-08-31), Haiku 4.5 $1/$5.

**Default to `sonnet` (`high` effort) for standard implementation work. Escalate to `opus` (`medium` effort) when tasks need higher reasoning tier. Use `opus` (`high` effort) for top-tier frontier challenges or deep security-critical architecture.**

| Task shape | `--model` | Full ID | `--effort` | Why |
|---|---|---|---|---|
| **Default workhorse** — most delegated implementation: features, code implementations, standard debugging, UI acceptance testing, refactors with a clear spec, test writing, code review, docs | `sonnet` | `claude-sonnet-5` | `high` | Near-Opus quality on coding/agentic at $3/$15. The default first pick. |
| **Higher-tier** — escalate here when tasks need higher reasoning tier (multi-file refactors, subtle concurrency/correctness bugs, long-horizon agentic work, cross-cutting design, volatile components) or when Sonnet stalls | `opus` | `claude-opus-5` | `medium` | `medium` effort provides frontier-level agentic intelligence with optimal latency and token efficiency ($5/$25). |
| **Mechanical/bulk & exploration** — codemods, renames, boilerplate, multi-file deterministic edits, first-pass exploration/triage | `haiku` | `claude-haiku-4-5` | `low`/`medium` | Fastest/cheapest ($1/$5); 200K context, 64K output. `low` for pure mechanical edits, `medium` for fast exploration/triage. (Quick 1–3 file edits should be done INLINE.) |
| **Frontier / maximum rigor** — hardest frontier problems, deep security-critical architecture, or when Opus medium falls short | `opus` | `claude-opus-5` | `high` | Maximum reasoning depth and rigor for top-tier architectural problems, security audits, complex cross-cutting overhauls. |

Heuristics:
- **On a failed/low-quality attempt**, just amend it yourself if you are on a higher tier. If the attempt drifted too much and warrants a re-run, step it up one model tier (`sonnet` → `opus`).
- When a newer Claude family ships, re-run this research (search "<family> SWE-bench coding benchmark" and "Artificial Analysis <family> intelligence index") and update this matrix — do not keep using a stale generation.

### Effort guidance

| Level | Use for | Cost/behavior |
|---|---|---|
| `low`/`medium` | Mechanical `haiku` work (`low`), exploration/triage (`medium`); **`medium` is default for `opus`** | Efficient tool calls, lower latency, optimal token burn |
| `high` | **Default for `sonnet`**; frontier/security tier for `opus` | Deep reasoning, near-frontier stability |
| `xhigh` | A specific hard task where `high` visibly underperforms | ~2× the tokens of `high` on long runs; reserve, don't default |
| `max` | Correctness-critical one-offs only | Diminishing returns; prone to overthinking — avoid as a habit |

Note: Claude Code's own built-in default is `xhigh`, and the broader ecosystem recommends `xhigh` for coding. Default to `high` (Sonnet) / `medium` (Opus) instead for cost stability and speed; step up per-task, not by default.

## Invocation

```bash
cat /path/to/prompt.md | \
  SHELL=/bin/bash claude --bg --remote-control "Fix login redirect bug" \
    --model sonnet --effort high \
    --add-dir /absolute/path/to/repo \
    --dangerously-skip-permissions
```

- `--model <alias|id>` — required (rule 2).
- `--effort <level>` — required (rule 3).
- `--bg` — background agent, returns immediately; manage with `claude agents`.
- `--remote-control "<name>"` — enables live attach/steer; drop it and use `--name "<name>"` for fire-and-forget.
- `--add-dir <dir>` — grant tool access to the repo (and any sibling dirs the task needs).
- `--dangerously-skip-permissions` — unattended operation (rule 5). Prefer a scoped `--allowedTools "Bash(git *) Edit Write"` allowlist when you can enumerate the surface.
- Prompt on **stdin**, never a trailing arg (rule 4).

Verify it registered before reporting it steerable. **Match on the session id the launch printed, not on the name** — when the prompt is piped on stdin, the `name` field in the listing can come back as the entire prompt text rather than the `--remote-control` label, so a `select(.name=="…")` filter matches nothing (observed 2026-07-28):

```bash
claude agents --json | jq --arg id "<id from launch output>" \
  '.[] | select(.id|startswith($id)) | {id,kind,model,state,status}'
# expect kind: "background", state: "working"
```

`model` in that listing may be `null` even on a correctly-launched agent, so it is **not** a reliable way to confirm which model ran — confirm from the agent's own output or its handoff report instead. Treat `kind` and `state` as the signal that the launch took.

Exit code 0 does **not** mean the work is done — the agent may have ended on a question (rule 7). Read its final message / attach via Remote Control. Follow up with:

```bash
claude --resume <SESSION_ID> --model sonnet --effort high \
  --dangerously-skip-permissions "your answer / next instruction"
```

Or `-c`/`--continue` for the most recent conversation in the current directory; add `--fork-session` to branch off a new session ID instead of mutating the original.

## Background agents and steering

- `claude agents` — interactive manager (TTY).
- `claude agents --json` — scriptable list of active interactive + background sessions (`--all` also includes completed ones; `--cwd <path>` scopes to one repo). **Always use `--json` for scripted checks** — without it the command requires a TTY and matches nothing from a tool call.
- Watch `.state` (`working` → `done`); a finished agent stays in the listing rather than disappearing.

## Orchestrating while it runs (don't sit idle)

- **Work on inline changes** — keep progressing quick inline tasks while the other agent isn't finished.
- **The worker commits to git**, so never run two workers against the *same working tree* at once, and never edit that tree yourself while a run is active. Serialize implementers that share a tree; give genuinely independent tasks their own **worktree** (below).
- **Do the non-conflicting prep.** Pre-write the next task's prompt file(s), stage briefs, gather context reads so the next dispatch is instant the moment the current one passes review.
- **Match prep depth to duration.** A mechanical `haiku` task finishes fast (shallow prep); an `opus` `high`/`xhigh` multi-file task runs many minutes (pre-write a downstream prompt or two).
- Foreground `sleep` is blocked here — rely on the background-task completion notification rather than polling.

## Fanning out parallel tasks (worktrees)

Two tasks can run at once only when both hold:

1. **No data dependency** — task B doesn't import/consume a symbol, file, or route shape that task A *creates*.
2. **No file contention** — the tasks write disjoint files:
   ```bash
   comm -12 <(files_of taskA) <(files_of taskB)   # must be empty
   ```
   Watch for a *shared config file* one task edits that changes how the other's tests run.

Rules of thumb: same tree → **serialize**; different repo → always parallel-safe; independent + disjoint files + deps landed → **parallelize in a worktree**.

```bash
BASE=$(git -C /path/to/repo rev-parse HEAD)     # shared tip, before either commits
WT=/path/to/repo-<taskslug>
git -C /path/to/repo worktree add "$WT" -b feat/<taskslug> "$BASE"
ln -s /path/to/repo/node_modules "$WT/node_modules"   # deps identical; skip reinstall
# dispatch from the worktree so the agent's cwd is the worktree:
( cd "$WT" && cat /path/to/brief.md | claude --bg --name "<taskslug>" \
    --model sonnet --effort high --add-dir "$WT" --dangerously-skip-permissions )
```

**Ban `git stash` in every worktree brief.** `refs/stash` is a single ref in the shared `.git`, so a stash/pop in one worktree can land another worktree's changes in the wrong tree — and the *recovery* usually means running `git checkout --` inside a sibling worktree, which breaches the blast-radius ceiling you just wrote (observed 2026-07-28: one implementer's `git stash pop` contaminated a peer unit's tree, and the fix crossed the ceiling). Give workers the safe substitutes in the brief: edit-and-restore the file directly, or `git worktree add --detach <base>` for a throwaway comparison tree. This applies to anything sharing a `.git`, so it is a property of the fan-out, not of any one task.

Tell the worker it is NOT in the main checkout — state the worktree path, the branch, that deps are linked, the exact files it owns, and the files it must not touch. After it lands **and passes review**, integrate onto mainline (cherry-pick the single commit when files are disjoint), remove the worktree (`git worktree remove "$WT"` — don't `rm -rf` before unlinking node_modules), then run the full suite/typecheck on the integrated tree.

## Prompt template

```
# Task: <one line>
You are working in <absolute repo/worktree path> on branch `<branch>` (already checked out;
your cwd is this directory).
<Runtime/tooling facts: package manager (pnpm), validate commands, conventions file to read.>

## Background
<Why + verified facts the agent can't easily discover.>

## Work items
<Numbered, specific, with file paths and exact behaviors.>

## Operating guardrails
- Work only in `<absolute repo/worktree path>` on branch `<branch>`.
- In scope: <specific files, behaviors, task boundaries>.
- Do not modify: <protected paths, credentials, generated files, other tasks' files>.
- Allowed side effects: <local edits and commits only, unless broader actions are named>.
- You may commit only to the designated branch/worktree; do not push, open a PR, deploy,
  alter remote configuration, send messages, or touch credentials unless explicitly authorized.
- Validate with <commands>; they must pass before you finish.
- Do not stop to ask questions; make reasonable decisions yourself and implement the entire brief.
```

## Known pitfalls

- **`-p`/`--print` is not the delegation path.** It's a one-shot pipe, not a live-managed agent. Use `--bg` (+ `--remote-control`).
- **Clarifying-question stall.** Even with a full brief, the worker may end turn 1 asking for confirmation. Include the do-not-stop instruction (rule 7); recover with `claude --resume <id> "<answer>"`.
- **Don't shell-background interactive `--remote-control` with `&`.** Orphaned no-TTY process, not registered as a background session. Use `--bg --remote-control`.
- **Permission stall.** A `--bg` agent without `--dangerously-skip-permissions` (or an adequate `--allowedTools` allowlist) blocks on the first permission prompt it can't surface.
- **The auto-mode classifier can block `--dangerously-skip-permissions` outright** (observed 2026-07-25: the whole `claude --bg … --dangerously-skip-permissions` command was denied). Don't retry it verbatim — relaunch with a scoped allowlist instead, e.g. `--allowedTools "Read Write Edit Grep Glob Bash(git *) Bash(corepack pnpm *)"`. Prefer the allowlist as the default and keep the blanket flag as the fallback. Tell the caller which one you used, since a too-narrow allowlist stalls silently.
- **The classifier can block the whole `claude --bg` launch, allowlist and all** (observed 2026-07-29: both `--dangerously-skip-permissions` *and* a tightly scoped `--allowedTools` form of the same command were denied). At that point the documented fallback above has itself failed, so **stop escalating**: two refusals of the same launch shape is an environment restriction, not a quoting problem, and further variants read as working around a denial. Fall back to the in-session executor (`--in-session`, Phase 2B) — same brief, same gates, you lose only live attach/steer — and tell the caller in one line that the classifier refused, plus the fix below. Budget for this: it costs two failed calls before you start Phase 2 for real.
  - **The unblock is an `autoMode.allow` entry, NOT a `permissions.allow` rule** (corrected 2026-08-02, after suggesting the wrong one cost a round trip). These are **independent gates**: on the machine where this was re-observed, `Bash(claude*)` was *already* in `permissions.allow` and the launch was still refused, because `permissions.defaultMode: "auto"` routes the nested launch through the classifier regardless. Adding more `Bash(claude …)` patterns changes nothing. What works is a top-level `autoMode: { "allow": ["$defaults", "<prose describing the nested --bg launch>"] }` — keep `"$defaults"` as the first element or every built-in rule is dropped.
  - **You cannot apply this yourself, and should not try.** The classifier also refuses edits to the settings file that governs it — correctly, since an agent widening its own authority is precisely what it exists to prevent, and a user saying "go ahead" does not change that. Hand the caller the snippet and let them paste it. It takes effect in a **new** session, so the current run still needs the in-session fallback.
- **`claude agents` without `--json` requires a TTY** — a liveness check built on it (`claude agents | grep <id>`) reports every agent as gone. **Always use `claude agents --json`.**
- **`claude logs <id>` is not a polling mechanism** (observed 2026-08-02). It replays the raw TTY stream — ANSI escapes, cursor addressing, full-screen repaints — so a young session returned **47 KB for a handful of readable lines**, and it grows with session length. `| tail` does not help: the escape sequences are not line-oriented, so tailing lands you mid-repaint. The liveness signal is `claude agents --json`'s `.state` (`working` / `blocked` / absent); `logs` is for a human who has attached. An agent that greps `logs` for progress burns its own context for no signal — and on a long-running executor that is the *same* self-inflicted cost as the unwatched dispatch this liveness rule exists to prevent.
- **Two distinct ids, and the jq filter crashes on the wrong one** (observed 2026-07-28). `.id` in the listing is an 8-char prefix, usable only for liveness matching; **steering with `--resume` needs the full `.sessionId` UUID** or it fails with "not a UUID and does not match any session title". Also, some listing entries have a null `.id`, so the documented `select(.id|startswith($id))` aborts the whole filter with `startswith() requires string inputs`. Guard it: `select(.id != null) | select(.id|tostring|startswith($id))`.
- **`--resume` against a live `--bg` session now hard-refuses instead of silently double-writing (verified 2.1.220).** Without `--bg`, it errors outright — `Error: Session <id> is currently running as a background agent (bg). Use 'claude agents' to find and attach to it, or add --fork-session to branch off a copy.` — the same refusal whether the target is `busy` or `blocked/idle`. That refusal is safe. The dangerous case is `--bg` itself: see the fork gotcha immediately below.
- **`--resume … --bg` silently discards a trailing-arg prompt** (observed 2026-07-28). The launch prints `backgrounded · <newid> (idle — send a prompt to start)` and nothing runs: you have spawned an idle session, not resumed work. Pipe the prompt on **stdin** for resumes too, not just for long briefs, and check the launch output for `(idle — …)` before reporting the agent as working. Clean up the stray session with `claude stop <id>`.
- **`--resume <id> --bg` forks unconditionally — this is a distinct bug from the one above.** Even with the prompt correctly piped on stdin (so it isn't discarded), the launch returns a *brand-new* session id and leaves the original running untouched; `claude agents --json` then shows both alive, one working tree, one `.git/index`, two writers. Verified on 2.1.220 with a controlled before/after id-set diff, reproduced both while the target was `busy`/`working` and while it was `blocked`/`waiting` on a raised question — **state does not matter, the fork is unconditional.** Your steering message never reaches the original; it starts a sibling conversation instead.
  - **Answering a blocked agent's raised question is cheap keystroke automation, not a screen-scraping exercise — verified on 2.1.220 (2026-08-01).** `printf '<digit>\r' | claude attach <id>` (no PTY needed — a plain pipe works) selects option `<digit>` and submits it: 4 consecutive fresh scratch agents, each blocked on a 3-option `AskUserQuestion`-style menu, answered correctly (bare `\r` → default option 1; `2\r` → option 2; `3\r` twice more → option 3), confirmed by an on-disk side effect that encodes *which* option was chosen, with the id set unchanged (no fork) every time. Full runbook, verification steps, and failure modes: **`claude-office/skills/claude-cli-send-message/SKILL.md`**. Load that file to actually answer a blocked agent — don't improvise from this paragraph.
    - **What still doesn't work:** plain `\n` (linefeed) delivers nothing over a non-PTY pipe — the CLI needs `\r` (carriage return) as Enter. Arrow-key navigation (`\x1b[B` down, `\x1b[A` up) reliably **fails** even over a real PTY (`expect`) with delays between bytes — it lands on the default option regardless of how many downs were sent (verified twice, plain pipe and PTY alike). **Digits, not arrows, are the mechanism** — always prefer a numbered option's digit key. Sending free text or a bogus digit straight at a still-showing menu doesn't error either — it silently submits the **default** option, discarding the text (verified twice); a free-text answer needs its own recipe (below), not a raw send at the menu.
    - **Free-text/custom answers are also verified now (2026-08-01), 4 clean runs.** Select a canned `Other`/`Custom` option where the menu offers one (single digit, no `\r` — submits immediately and opens a dedicated text field) or `Type something` (digit highlights, needs a **separate** `\r` to actually select it, then drops into an open-chat state that shares input parsing with the live REPL). Then send the answer as its **own, separate** `attach` call, `\r`-terminated. Content is delivered byte-for-byte, including multi-clause sentences with punctuation and an em dash — but **never combine digit-selection and text in one `printf`/one send**: a one-shot `'4PURPLE\r'` reliably degrades to the same silent-default-selection failure as a raw menu send. One real gotcha specific to free text: multi-byte content can land in the box without its trailing `\r` submitting — if state stays `blocked` with the text still visible, send a bare `\r` on its own to submit it, don't resend the text. **Prefix safety:** a leading digit is safe (delivered literally once the field is open); leading `!` was safe in one run; leading `/` is **unsafe everywhere tested** — it's intercepted as a real slash command (`Unknown command: /...`) rather than reaching the model, on every free-text surface including `Other`/`Custom`, not just `Type something`. Full recipe, evidence, and the prefix table: `claude-office/skills/claude-cli-send-message/SKILL.md`.
    - **Practical consequence:** a `--bg` agent's raised question — numbered menu *or* open-ended free text — is now answerable in place at the cost of one or two short-lived `attach` calls, not a fork-and-recover cycle. `SKILL.md`'s `--cli` caveat and `escalation.md`'s blocking-cost note have been updated accordingly.
  - **Recovery when a fork already happened:** keep the fork — it carries the original transcript plus your message — `claude stop` the original rather than leaving it parked, re-point any monitor or handoff reference at the new session id, and confirm via `claude agents --json` that exactly one writer remains against the shared working tree before letting anything continue.
  - **The `--remote-control "<name>"` label is not an id.** `claude attach`/`claude stop`/the job registry only match on the session id (short `.id` prefix or full `.sessionId` UUID) — `claude attach "<name>"` returns `No job matching '<name>'` even for the exact name passed at launch. Always resolve to an id first (`claude agents --json`).
- **`state=blocked, status=idle` means finished, not stalled.** A `--bg` agent that completed its turn sits in exactly that state, and the word "blocked" invites the wrong diagnosis (permission stall, deadlock). Never infer completion *or* trouble from the state name — read the agent's workspace: `handoff.md` existing and the ledger's `Task <N>: complete` lines are the only reliable done-signal.
- **A CLI executor can stop mid-plan without writing a handoff, and nothing announces it.** Detect it structurally: no `handoff.md`, and a ledger whose completion lines stop short of the plan's task count (a task with a written brief but no report is where it died). Recovery: two `--resume` attempts to finish a stalled unit produced nothing and one died on a transient API error — the thing that worked was dispatching an **in-session Agent-tool subagent** scoped to "finish tasks N..end, run the gate, write the handoff", pointed at the existing ledger with an explicit *do not redo completed work*. Reach for that after one failed resume, not three.
- **`claude logs <id>` is raw ANSI/TTY frame capture — a liveness signal, not a transcript.** Expect ~200KB of escape codes for a normal run; stripped of escapes it is mostly spinner repaints, not readable text. Never pipe it into your own context to find out what an agent did or diagnose what it's doing — the workspace ledger, task reports and handoff are the diagnostic surface for that. The one thing it's good for is confirming the process is still alive. To read a menu question a `--bg` agent raised (not to diagnose it), strip the ANSI and grep the tail for the question text — e.g. `claude logs <id> | sed -E 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\][^\x07]*\x07//g' | tail -c 4000` — and treat that as the workaround it is, not a reliable transcript reader.
- **A background agent may be forced into a worktree by an isolation guard**, and it will branch from whatever HEAD it finds. Two consequences worth pre-empting in the brief: (a) if that worktree lives *inside* the repo (e.g. `.claude/worktrees/…`), `deno fmt --check` / lint / any glob-driven gate scans the duplicated tree and reports phantom failures at roughly double the file count — remove the worktree before trusting a red gate; (b) the worktree is created **locked** and `git worktree remove` refuses until `git worktree unlock <path>`; (c) `claude stop`/`claude rm` will not silently discard that worktree if it holds unpushed commits — expect back `kept <id> — worktree has commits that are not pushed anywhere` (verified) — but the worktree can hold the agent's *most recent and most complete* work while the main checkout still shows a stale snapshot, and a forced removal (`git worktree remove --force`, or deleting the directory by hand) destroys that silently. **Always `git status`/diff a worktree before removing it** — an unread removal destroys work `git log` on the main tree cannot show you, because it was never committed there. Also expect it to lack gitignored files the gate needs (`.env`), which a permission classifier will likely block it from copying — so tell it up front to pass env vars inline on the command instead of hunting for a file.
- **Same-tree contention.** Never two workers on one working tree; never edit a tree a worker is writing. Use worktrees for parallel tasks.
- **Verify which model ran — but not from `claude agents --json`.** Its `model` field can be `null` for a healthy background agent, and its `name` can be the whole piped prompt instead of the `--remote-control` label. Match on the launch-printed session id for liveness (`kind`/`state`), and confirm the model from the agent's own output or handoff report.
- **Prompt on stdin for long briefs.** Trailing-arg prompts risk ARG_MAX and quoting bugs.

## See also

- **`superpowers:using-git-worktrees`** — isolated workspaces for parallel dispatch.
