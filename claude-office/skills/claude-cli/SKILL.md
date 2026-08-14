---
name: claude-cli
description: The claude CLI adapter — --cli vs --in-session, the fork gotcha, session/worktree identity. Loaded by the claude-office hub; not invoked directly.
---

# Claude Runtime

Loaded by: the planner, before dispatch.
Assumes: the Office Kernel is already in the packet.

Full inline-vs-delegate method, the model decision matrix, effort tuning, worktree fan-out, and
the complete list of verified CLI pitfalls live in
[`../../references/discernment.md`](../../references/discernment.md) — read it before launching
anything. This file states the parts of that mechanism that are load-bearing for the office's
execution-mode contract, and is where a **new** mechanism gotcha gets written first.

## `--cli` vs `--in-session`

**`--cli` is the default.** The executor launches as a `claude --bg --remote-control` background
agent (see discernment.md's invocation section for the exact command, model/effort flags, and
`--add-dir`).

**The default permission form is a scoped `--allowedTools` allowlist, never the blanket flag.**
`--dangerously-skip-permissions` is the *fallback*, because the auto-mode classifier denies it
outright in this workspace. Verified working launch shape, 2026-08-04:

```bash
echo "<brief>" | SHELL=/bin/bash claude --bg --remote-control "[ROLE] <repo> — <task>" \
  --model sonnet --effort high --add-dir "<pre-created worktree>" \
  --allowedTools "Read Write Edit Grep Glob Bash(git *) Bash(corepack pnpm *)"
```

### The allowlist carries no MCP tools unless you name them

**This is the single most misread behaviour of this launch form.** The allowlist above grants file
and shell access and **nothing else** — every MCP server the planner can reach (Rock, Basecamp,
Sheets, Vercel, any connector) is absent from the launched agent. The agent then reports it cannot
reach the system, and the work bounces back to the planner, and the whole episode reads as *"delegates
can't do MCP work"* when the truth is *"this dispatch never granted it."*

**A brief whose task touches a live system enumerates that system's tools in the launch:**

```bash
  --allowedTools "Read Write Edit Grep Glob Bash(git *) \
                  mcp__<server>__<tool> mcp__<server>__<other_tool>"
```

- **Read the real tool names before launching** — they are the `mcp__<server-id>__<tool>` strings
  from the planner's own tool list, and a guessed name grants nothing and fails silently.
- **Grant the reads generously, including production reads.** The true shape of a record frequently
  exists only in production, and an agent reasoning from a preview fixture that does not match it is
  the expensive failure. Reads are cheap and reversible.
- **Writes follow the brief.** Preview and staging writes are ordinary delegated work. A production
  write is planner-held — the planner performs it — so it is not in the delegate's allowlist at all.
- **A tool refusing a call is not the system refusing it.** The allowlist, the classifier, and the
  MCP server's own permissions are three separate gates. Say which one refused before reporting a
  capability as missing; an MCP write refusal has already been mistaken once for "Rock cannot do
  this," when plain REST did it fine.

Pair the grant with the brief's **shape pin** — entity, operation, field names, ID provenance,
expected envelope, and a read-back of one real record. Access is the half that looks like the
problem; shape is the half that actually goes wrong. Core:
[`../../office-core/protocol/evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md).

**Name the session by role.** The first line of the brief is `[ROLE] <repo> — <task>` — `[PLANNER]`,
`[PM]`, `[EXECUTOR]`, `[WORKER]`, `[REVIEW]`, `[PLAN-REVIEW]` — so a job list is readable at a glance.
Pass the same string to any label flag the brand exposes. The prefix is a display convenience and
**never an identifier**: match on session or worktree identity, never on a label.


**The prompt must be piped on stdin.** Passing it as a positional argument returns
`idle — send a prompt to start`: the agent registers but never begins, and a planner that reports the
launch id without checking `state` will wait forever on an agent that was never given work.

### Never pre-emptively downgrade to `--in-session`

discernment.md's two-refusals rule means **two refusals observed in the current run**. A denial
recorded in a past run, a ledger row, or this file is *not* evidence about now — classifier behavior
and settings change, and `permissions.allow` in this workspace already carries `Bash(claude*)`.

- **Attempt the CLI launch. Read the actual result.** Only a real refusal in this run authorizes the
  fallback.
- A plan that assigned `cli` is an **assignment**. Substituting `--in-session` because CLI "was
  blocked before" is the executor re-deciding its own routing, which is a `PLAN DEFECT` to surface,
  not a call the dispatcher makes.
- If you do fall back, say which form you used and why in one line — a too-narrow allowlist stalls
  silently, so the caller needs to know which one is running.

Evidence this rule exists: on 2026-08-04 a planner skipped straight to `--in-session`, citing a
2026-08-03 ledger row. A probe run minutes later launched, ran, and wrote its output file with the
allowlist form on the first try. The stale note cost a correct dispatch form for no reason.

**`--in-session` is the opt-out**, passed by the caller at invocation. It restores an in-session
Agent-tool subagent as the executor instead. The reviewer is **always** in-session regardless of
this setting — it never runs as a `--cli` background agent.

## The fork gotcha, in full

`--resume <id> --bg` against a live session — whether `busy` or `blocked/idle` — **forks
unconditionally**, verified on 2.1.220. It returns a brand-new session id and leaves the original
running untouched: `claude agents --json` then shows two writers against one working tree. Your
steering message never reaches the original; it starts a sibling conversation instead.

**Never resume a running or blocked `--cli` agent with `--resume ... --bg` to steer it.** That is
not a steering mechanism — it is a covert second writer. If a fork already happened: keep the
fork (it carries the original transcript plus your message), `claude stop` the original, re-point
any monitor/handoff reference at the new session id, and confirm via `claude agents --json` that
exactly one writer remains before letting anything continue.

## Live-question handling: prefer `claude-cli-send-message` over fork-and-recover

A raised question from a blocked `--cli` agent — a numbered `AskUserQuestion`-style menu **or** an
open-ended free-text/custom answer — is a cheap reply, not a fork-and-recover cycle.
[`../claude-cli-send-message/SKILL.md`](../claude-cli-send-message/SKILL.md) answers either in place via `claude attach`
with verified keystroke recipes: digit + `\r` for a menu; select-a-free-text-option then send the
text as its own, separate call, for free text. **Never combine digit-selection and text in one
send** — that reliably degrades to a silent default-option selection. **Never lead a free-text
answer with `/`** — it gets intercepted as a real CLI slash command on every tested surface.

Reserve the fork-and-recover path — or passing `--in-session` up front — for genuine mid-run
steering (a new instruction, not an answer to a question the agent itself raised). Load
`claude-cli-send-message`'s scope gate before using it: it applies only to an already-`blocked` agent with a
readable menu/prompt, never to steering a `busy`/`working` one.

## A dispatched agent can move the branch under you

`--add-dir <the tree you are working in>` is not isolation. Observed 2026-08-02: a planner dispatched
a CLI agent with `--add-dir` pointing at its own working tree and a brief saying "create your own
branch off `main`". The agent complied — by checking out `main` in the shared tree first, then adding
its worktree. It left the shared checkout on `main`. The planner's next two commits and a
`git push … HEAD` went to `main`, which was a production deploy.

- **Pre-create the agent's worktree and `--add-dir` that**, or dispatch from a tree the planner is
  not using. Do not rely on the brief's wording to keep the agent off your branch.
- **The one-writer-per-tree rule needs restating as one-*checkout*-per-tree.** Two agents never
  edited the same file here; the damage was `git checkout`, which the invariant did not name.
- After any dispatch returns, `git rev-parse --abbrev-ref HEAD` before doing anything that writes.

## Session and worktree identity (duplicate-writer protection)

Before dispatch, confirm no other writer is live in the target tree. Match on **session id**
(`claude agents --json`'s `.id`/`.sessionId`, not `.name` — a stdin-piped prompt can make `.name`
come back as the entire prompt text) and on the **worktree's actual path**, never on a
`--remote-control` display label. A newer overlapping writer is stopped before it can edit.

## What to record per launch

For the run-telemetry event this office emits at each explicit dispatch (see the hub's Run
Telemetry section): launch id, the returned session id, the worktree id/path, which role this
launch is (executor/reviewer), the model and effort used, and — if this launch is a fork — the
id it forked from and why (`question` / `recovery` / `steering` / `quota` / `stall`).

## New mechanism gotchas go here

When a run discovers a durable CLI behavior — a flag that didn't behave as documented, a
verification command that reports nothing useful, a launch that silently ignored an argument —
write it into [`../../references/discernment.md`](../../references/discernment.md)'s "Known
pitfalls" section, and note the cross-reference here if it changes this file's contract (the
`--cli`/`--in-session` split, the fork rule, or identity matching). Sharpen an existing principle
rather than appending a scenario.

## See also

- [`../../references/discernment.md`](../../references/discernment.md) — model selection, effort
  tuning, stdin prompts, unattended permissions, parallel worktrees, and the full pitfalls list.
- [`../claude-cli-send-message/SKILL.md`](../claude-cli-send-message/SKILL.md) — the answer-in-place mechanism.
