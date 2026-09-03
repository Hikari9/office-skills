---
name: agy-cli
description: The agy CLI adapter — launch form, flag order, workspace, quota, recovery. Loaded by the agy-office hub; not invoked directly.
---

# Agy Runtime

Loaded by: planner, before dispatch.
Assumes: the Office Kernel is already in the packet.

When `HERDR_ENV=1`, this is not the dispatch surface. Load
[`herdr`](../../office-core/skills/herdr/SKILL.md) and start the assigned `agy` agent in a Herdr
pane. Use this spoke when Herdr is absent or not detected.

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
- `--model "<slug>"` — **resolve Flash latest at dispatch**:
  `--model "$(<plugin>/scripts/agy-model.sh high)"`. agy publishes no `latest` alias, so any slug
  written into a document is pinned to the day it was written. The resolver reads `agy models`
  behind a 5s timeout and falls back to a pinned slug, so it never stalls a launch.
  Never omit `--model`: agy's bare default is a Flash tier chosen for it, not by you.
- `--add-dir "<abs path>"` — **does not reliably set the workspace.** The prompt text itself must
  state the absolute workspace root and forbid the scratch dir; the flag alone has produced "no
  active workspace selected."
- `--print` — **must come last, immediately before the prompt, or the prompt is silently
  swallowed and you get a greeting.** Any flag between `--print` and the prompt text reproduces
  this. A greeting/banner response with exit 0 is this bug, not a routing signal — fix the
  ordering and relaunch; nothing was done.
  Newer agy builds catch the common case explicitly rather than greeting you:
  `Error: --print took "--model" as its prompt, so the intended prompt was left as an argument and
  ignored.` Same bug, louder. The `=` form (`--prompt="$(cat brief.md)"`, `--prompt` being an
  alias for `--print`) binds the value to the flag and makes ordering irrelevant — prefer it.
- `--effort low|medium|high` — **Gemini-only.** Passing it with a Claude slug hard-fails at launch:
  `Error: invalid model selection (--model "claude-opus-4-6-thinking" --effort "low"): --effort is
  not supported for model "claude-opus-4-6-thinking"`. The Claude slugs encode their own thinking
  budget, so there is no effort knob to set. If a house convention names an effort tier for
  reviewers, that convention simply does not apply to an agy Claude dispatch — say so rather than
  substituting a tier.

**Stdin piping does not work.** Use the positional argument (`--print "$(cat <file>)"`), never a
pipe into `agy`'s stdin.

## agy is an outage fallback, not only a Gemini runner

`agy models` lists more than Gemini. As of 2026-09-03 it also offers `claude-opus-4-6-thinking`,
`claude-sonnet-4-6` and `gpt-oss-120b-medium`. These route through agy's own provider path, so an
Anthropic-side outage that makes Claude Code subagents die with `API Error: 529 Overloaded` does
**not** take them down — an agy Claude dispatch is the way to keep a review or a stint moving
through one. Confirm with `agy models` at dispatch rather than trusting this list; the slugs are
version-pinned and will age.

`agy-model.sh` resolves **Flash** slugs only. It matches `^gemini-[0-9]+\.[0-9]+-flash-<effort>$`,
so it cannot return a Pro or Claude slug and will hand back its Flash fallback if you ask it to.
For a Claude dispatch, read `agy models` and pass the slug literally.

## Live-system access is agy's own, not the planner's

`--dangerously-skip-permissions` removes every approval stop locally, but an `agy` process reaches
the **MCP servers configured for agy** — not the connectors the planner's harness holds. A task
needing Rock, Basecamp, or Sheets is not reachable just because permissions are skipped.

- **Check before routing.** If the server is not configured for this CLI, route that task to a brand
  whose launch can carry the tools (`auto-office/skills/claude-cli` → the allowlist section)
  rather than concluding delegates cannot do MCP work at all.
- **Prefer plain HTTP where the API allows it** — an MCP server lacking a tool is not the underlying
  system refusing the call.
- **Reads, production included, are ordinary delegated work.** Pin the entity, fields, ID provenance
  and expected envelope in the brief, and require one real record pasted back. With agy this matters
  more than elsewhere: it invents plausible shapes confidently, and a pinned shape is the only thing
  a fabrication can collide with.

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

## Launching agy inside a Herdr pane (learned 2026-09-03)

`herdr agent start --kind agy` is not a thing; agy runs as a plain command in a pane. Three rules:

1. **Never pass the brief inline through `herdr pane run`.** The pane types the command into a
   live shell, so a multi-line brief with quotes leaves the shell stuck at `quote>` and nothing
   runs. Write a wrapper script instead and run that:
   ```bash
   cat > /abs/work/run.sh <<'EOF2'
   #!/bin/bash
   cd /abs/work || exit 1
   exec agy --dangerously-skip-permissions --print-timeout 10m \
     --model "$(~/.claude/skills/agy-office/scripts/agy-model.sh high)" \
     --add-dir /abs/work --print "$(cat /abs/work/brief.md)"
   EOF2
   herdr pane run <PANE_ID> bash /abs/work/run.sh
   ```
2. **Wait for the shell prompt before `pane run`.** A pane split moments earlier may still be
   restoring its session; a command typed before the prompt appears is swallowed. Poll
   `herdr pane read <PANE_ID>` for the prompt line first.
3. **`--print` shows nothing until the run ends.** A pane that displays only the echoed command
   is not stuck. Confirm liveness with `pgrep -f "<model slug>"`, then read the pane tail when the
   process exits. A `quote>` line in the pane, by contrast, IS stuck: close the pane and relaunch
   (`herdr pane send-keys` key names are limited; closing is faster).
