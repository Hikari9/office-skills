---
name: agy-cli
description: The agy CLI adapter — launch form, flag order, workspace, quota, recovery. Loaded by the agy-office hub; not invoked directly.
---

# Agy Runtime

Loaded by: planner, before dispatch.
Assumes: the Office Kernel is already in the packet.

**The `agy` skill is the living record of the CLI's sharp edges.** Load it before your first
dispatch and do not reconstruct any of this from memory — append what you learn there, not here.
This spoke is the runtime contract this office depends on; the `agy` skill is the general
reference for anyone invoking the CLI.

## Launch form (exact)

```bash
agy --dangerously-skip-permissions --print-timeout 45m \
  --model "<exact display name>" --add-dir "<abs repo/worktree path>" \
  --print "$(cat <prompt file>)"
```

**Name the session by role.** The first line of the brief is `[ROLE] <repo> — <task>` — `[PLANNER]`,
`[PM]`, `[EXECUTOR]`, `[WORKER]`, `[REVIEW]`, `[PLAN-REVIEW]` — so a job list is readable at a glance.
Pass the same string to any label flag the brand exposes. The prefix is a display convenience and
**never an identifier**: match on session or worktree identity, never on a label.


- `--dangerously-skip-permissions` — required for unattended work.
- `--print-timeout 45m` — defaults to 5m; **always raise it** or the run dies mid-task.
- `--model "<exact display name>"` — the literal string from `agy models` (see
  [routing.md](../../references/routing.md) for the current catalog). Never omit this: agy's own
  default is Flash, where the invented-signature failures were observed.
- `--add-dir "<abs path>"` — **does not reliably set the workspace.** The prompt text itself must
  state the absolute workspace root and forbid the scratch dir; the flag alone has produced "no
  active workspace selected."
- `--print` — **must come last, immediately before the prompt, or the prompt is silently
  swallowed and you get a greeting.** Any flag between `--print` and the prompt text reproduces
  this. A greeting/banner response with exit 0 is this bug, not a routing signal — fix the
  ordering and relaunch; nothing was done.

**Stdin piping does not work.** Use the positional argument (`--print "$(cat <file>)"`), never a
pipe into `agy`'s stdin.

## Launching and watching it

**Launch as a background task with no pipes on stdout**, then give the user the `.output` path so
they can watch it themselves. Piping through `tail`/`head` buffers until exit and kills live
tailing — you only get to read the file after the process exits either way, so don't route stdout
through anything that defeats that. Read only the tail of the `.output` file after completion.

While it runs: do non-conflicting prep only — **never edit the tree it is writing to.**

## Quota and stall detection

agy runs on a token quota that has died mid-orchestration before. **A stall after a few narration
lines is quota, not slowness.** Check `git status`/`git log` when this happens — usually nothing
was written. Confirm quota with the user before a long plan, and have Claude subagents ready as
the fallback worker.

## Recovery

- A **clarifying-question stall** or a focused correction: `agy --continue` or
  `--conversation <id>`, same flag-ordering rules apply.
- A **greeting/banner** (swallowed prompt): fix the flag order and relaunch. Nothing was done.
- A **quota stall**: relaunch fresh, or fall back to a Claude subagent for the remainder — see
  [routing.md](../../references/routing.md).

## What to record per launch (for telemetry)

The agy launch id, the exact `--model` display name, the workspace/worktree absolute path, the
`BASE` commit, `--print-timeout` value used, and whether the launch stalled, was swallowed, or
completed. This feeds the `worker.dispatched`/`worker.completed` events the hub's run-telemetry
section describes.

## Links

- The **`agy` skill** — CLI mechanics, model catalog, sessions, quota, live tailing. Read it first.
- [`../../references/routing.md`](../../references/routing.md) — model tiers and the ~3-task
  dispatch ceiling.
- [`../../references/executor-brief.md`](../../references/executor-brief.md) — what the prompt
  text itself must contain (this file only covers the launch, not the brief).
