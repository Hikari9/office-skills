---
name: claude-office
description: Use ONLY when explicitly invoked via /claude-office, for irreversible or production-facing work. Four-phase office — planner interviews to 95% clarity, Sonnet executor implements, fresh Opus reviewer adversarially gates on build/test evidence, planner closes loop. Never self-triggered.
---

# Claude Office

Three roles, one session, for irreversible or production-facing work.

| Role | Who | Default model | Job |
|---|---|---|---|
| **Planner** | The current agent (you) | session default | Interview → plan → approval; triage/apply review fixes; close out |
| **Executor** | One dispatched subagent | `sonnet`, high | Implement the whole plan via subagents; self-check every task before handoff |
| **Reviewer** | One fresh dispatched subagent | `opus`, low | Adversarial final review + each fix round; holds the approval gate |

**Core principle:** the planner never implements; the executor never approves its own work. Each
gate is held by someone who did not do the work being gated.

## Invocation gate and caller overrides

Runs **only** on `/claude-office` (or the skill named directly) — never because a task "looks like
office work." If you are reading this as a dispatched subagent, you are not the planner; ignore
this file and follow the brief you were given.

Anything after `/claude-office` is an override. Honor it, echo it in the kickoff line, keep every
other default:

| Tweak | Example | Effect |
|---|---|---|
| Executor/reviewer model | `use opus as executor` | Change that role's `model` |
| Named agent type | `executor: general-purpose` | Change `subagent_type` |
| **`--in-session`** | `--in-session` | Executor runs in-session instead of `--cli`; reviewer stays in-session either way |
| Skip a phase | `plan approved: docs/plans/x.md` | Start at Phase 2 |
| No closeout | `skip cleanup` | Stop after Reviewer approval |
| Extra gates | `reviewer must also check a11y` | Append to rubric |

**Only a caller tweak may change a default.** No override may skip independent review, reuse the
executor as its own reviewer, downgrade the reviewer below this office's floor, remove a
structural phase, or widen the blast-radius ceiling implicitly.

## Fit test — first, before anything, and it picks a gear

Before interviewing or planning, price the run. Ask: (1) irreversible, production-facing, or
externally visible? (2) real volume or parallel breadth? (3) needs an interview? (4) would an
adversarial reader plausibly catch something?

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | All four phases. One-way door — never downgraded. |
| No to (1), **2+** yeses across (2)–(4) | **express** | Short plan → execute → **one** Opus review → land it. **Cap 2 review rounds**; a second `CHANGES REQUIRED` promotes the run to full. |
| No to (1), **≤1** yes | **direct** | No office. Do the work under the normal safety rules, then stop. |

Express promotes to full before dispatch if the run needs more than one executor, more than one
repo, or more than roughly three tasks. It drops **phases, never floors**: no self-approval, the
fresh Opus gate, evidence over exit codes, and read-backs all still bind.

Given this office exists for irreversible and production-facing work, **most `/claude-office` runs
answer yes to (1) and are therefore full.** Express is here so a bounded, reversible task invoked by
name is not charged for four phases. State the gear in two or three sentences and proceed. Full rule:
`office-core/protocol/roles-and-authority.md` → *Fit test*.

## Execution mode

**`--cli` is the default**: the executor runs as a `claude --bg --remote-control` background
agent. `--in-session` restores an Agent-tool subagent. The **reviewer is always in-session**.
`--resume`/`--bg` against a live session forks instead of steering it — never resume a
running/blocked agent that way. A raised question is a cheap `claude-cli-send-message` reply, not a
fork-and-recover cycle. Mechanism: [claude-cli](skills/claude-cli/SKILL.md); answer:
[claude-cli-send-message](skills/claude-cli-send-message/SKILL.md).

## Non-bypassable safety rules

- One executor per repo; one writer per working tree, ever.
- Planner never implements; executor never approves its own work.
- GitHub tracking issue filed by default, before exploring.
- Explicit approval before dispatch — silence is not approval.
- Fresh Opus reviewer, resumed across rounds; 3 verdicts; no approval without pasted evidence; 5-round cap.
- `PLAN DEFECT` exits the fix loop instead of consuming a round.
- A successful exit is not evidence; the gate is the plan's validation commands with real output.
- Live-system writes need a read-back, not an exit code.
- Irreversible prod work is `PLANNER-HELD` — **the planner performs it, never the executor**. It runs
  without a fresh go-ahead only when the plan's `named_actions:` names it verbatim with its dry run,
  revert target, and read-back. Unnamed, or a precondition failed, and it stops.
- **Land each milestone as its criteria go green** — commit, PR, merge the chain — rather than
  batching everything into one closeout. The merged branch is the run's re-entry point.
- **Delegated work is dispatched with the access it needs**, MCP tools enumerated in the launch,
  production **reads** included; the brief pins the data shape and the executor reads it back.
- User-owned decisions get a recommendation, never inference.

## Protocol version

Implements office-core `2.0.0`, vendored at `office-core/` (authoritative once installed; the
repo-root copy is the dev source). Mandatory read: `office-core/protocol/roles-and-authority.md`.

**Declared narrowing of core.** Core `2.0.0` lets the planner implement inline; this office
does **not** — the planner never implements the plan here. Narrowing is legal, and it is stated so a
reader of both files need not guess which governs.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.


Each role gets the Office Kernel plus its selected spokes only — never the whole corpus.

| Phase / need | Load | When |
|---|---|---|
| Plan-authoring (issues, interview floor, claims) | [claude-planning](skills/claude-planning/SKILL.md) | Phase 1 |
| `--cli`/`--in-session`, fork gotcha, identity | [claude-cli](skills/claude-cli/SKILL.md) | Before dispatch |
| Executor packet, one-per-repo, Upline | [claude-executor](skills/claude-executor/SKILL.md) | Phase 2 |
| Reviewer gate, verdicts, evidence, round cap | [claude-reviewer](skills/claude-reviewer/SKILL.md) | Phase 3 |
| Commit/PR/sync/close-loops | [claude-closeout](skills/claude-closeout/SKILL.md) | Phase 4, unless `skip cleanup` |
| Answering a blocked `--cli` question | [claude-cli-send-message](skills/claude-cli-send-message/SKILL.md) | Executor blocked |
| Fan-out justification, tier/isolation/parallelism | [routing.md](references/routing.md) | Tagging tasks |
| Upline ownership, blast-radius ceiling | [escalation.md](references/escalation.md) | Unresolved item |
| Handing off this conversation | [handoff.md](references/handoff.md) | Only if asked |
| Shared plan/evidence/verdict floor | `office-core/protocol/*` | Doubt about core |

## The Four Phases

**Phase 1 — Plan (Planner).** Announce mode, file the tracking issue, interview to 95% clear,
write the plan, get explicit approval. Load [claude-planning](skills/claude-planning/SKILL.md).

**Phase 2 — Execute (Executor).** Record `BASE`, launch the executor (`--cli` default, brief per
[executor-brief.md](references/executor-brief.md)). Prep non-conflicting work only; never edit
its tree; read its handoff file. Load [claude-executor](skills/claude-executor/SKILL.md).

**Phase 3 — Adversarial Review (Reviewer).** Dispatch a fresh in-session Opus reviewer with the
plan, Global Constraints, handoff, and a diff-package file. Triage/fix `CHANGES REQUIRED`; route
`PLAN DEFECT` by owner. Only `APPROVED` exits. Load [claude-reviewer](skills/claude-reviewer/SKILL.md).

**Phase 4 — Closeout (Planner).** Commit, verify the gate, PR + automerge, sync main, remove the
worktree, close every open Upline entry. Skipped only on `skip cleanup`. Load
[claude-closeout](skills/claude-closeout/SKILL.md).

**Phase 4 runs once per milestone, not once per run.** Every milestone whose done-criteria go green
gets its own gate → commit → PR → merge, immediately, and then the run continues. Sync, worktree
removal, and loop closure are terminal and run only after the last one — removing the worktree at
milestone 1 of 3 destroys the run.

**At the close of every phase**, end the status post with `compact: yes | no — <reason>` per
[`evidence-and-handoff.md` § Run-state durability](office-core/protocol/evidence-and-handoff.md).
It informs; it never asks, and it never blocks the phase transition. A `no` means run state lives
only in your context — write it to a file, which turns it into a `yes`.

## Composing with other skills

Owns the **orchestration shape** only. Domain/platform skills stack freely — load them, feed
rules into Global Constraints. A more specific/safer skill wins; user instructions outrank both.
No second orchestration skill inside this one.

## Run telemetry

Record one event per `office-core/schemas/run-event.schema.json` at each **explicit** dispatch:
launch id, session id, worktree id, active writer, fork event/reason, question/recovery reason,
selected spokes, reviewer round. **Compare session/worktree identity, never a display label** —
stop a newer overlapping writer before it edits. A transcript keyword match is not an invocation.

## Maintenance and release

Bump `version`, add a `CHANGELOG.md` entry, and — if core changed — re-vendor `office-core/` and
run `scripts/check-plugins.sh`.

Route each lesson: routing → [routing.md](references/routing.md); CLI gotchas →
[claude-cli](skills/claude-cli/SKILL.md); a shared invariant → propose as a core change,
never edit locally. Sharpen a principle over appending a scenario; nothing durable to add is a
legitimate outcome.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "I'll just implement it myself" | The planner does not implement the plan. That's the gate. |
| "The executor's report says it's done" | It cannot approve its own work. Phase 3 is not optional. |
| "I'll review it myself instead of spawning Opus" | Worst reviewer for code you've read all session. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "The executor can just do the deploy too" | Irreversible prod work is `PLANNER-HELD` — you perform it, never the executor. |
| "It's a prod apply, so I stop and ask" | Only if the plan didn't name it. A `named_actions:` entry with its preconditions met runs. |
| "The plan says 'deploy when done'" | That names nothing. Exact command, target, dry run, revert, read-back — or it's a stop. |
| "I'll PR everything at the end" | Land each milestone as it goes, or the run has no re-entry point. |
| "The delegate can't reach Rock" | Not unless you named the MCP tools in its launch. That's a dispatch bug, not a capability limit. |
| "The user probably wants X, I'll decide" | User-owned decisions get a recommendation, never inference. |
| "Finding contradicts the plan, so it's wrong" | Plans are hypotheses. That's `PLAN DEFECT` or a user call. |
| "The apply script exited 0, so it's deployed" | Live-system evidence is a read-back, not an exit code. |
| "This looks like office work, I'll invoke it" | Only `/claude-office` invokes this. |
