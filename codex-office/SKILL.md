---
name: codex-office
description: Use only when explicitly named for production-facing or irreversible repository work. The active planner plans and closes out; Codex planners use in-session Codex subagents for Codex workers, while non-Codex planners use CLI workers.
---

# Codex Office

A strict four-phase delivery process — **plan, execute, adversarial review, closeout** — for
production-facing or irreversible repository work. The active planner plans and closes out; worker
dispatch uses the routing rule below. This file is orientation and dispatch only; procedure lives
in the spokes it routes to.

## Roles

| Role | Owner | Default model | Responsibility |
|---|---|---|---|
| Planner | Active Codex session | current session | scope, plan, escalation, closeout |
| Executor | Fresh Codex in-session subagent when planner and assignee are Codex; otherwise the assignee's CLI | `gpt-5.6-luna`, high | implements the approved plan |
| Reviewer | Separate fresh Codex in-session subagent when planner and assignee are Codex; otherwise the assignee's CLI | `gpt-5.6-luna`, xhigh | adversarial gate and re-review |

## Invocation gate and caller overrides

Runs **only** on explicit invocation of `codex-office` by name — never because a task "looks like"
office work. If you are reading this file as a dispatched worker, you are **not** the planner;
follow your brief instead, this hub does not apply to you.

Caller tweaks after invocation are honored and echoed back in the kickoff line (model tier per
role, skip a phase with an approved plan path, extra reviewer rubric items, skip closeout). No
caller override may: skip an independent review, reuse the executor as its own reviewer, downgrade
the reviewer below its stated floor, or widen the blast-radius ceiling implicitly.

## Dispatch routing

Route each assigned worker by the **planner brand** and **assignee brand**:

- If both the planner and the assigned executor or reviewer are Codex, use a fresh in-session
  Codex subagent. The reviewer is a new subagent identity, separate from both the planner and
  executor; in-session does not mean inline planner work or executor reuse.
- If the planner is not Codex — for example Claude or Agy — use the assignee's CLI adapter. A
  Codex assignee therefore runs through `codex exec` when the planner is Claude or Agy.
- If the planner is Codex but the assignee is another brand, use that brand's CLI adapter.

The assignee brand is the model family, not the display tier. A Codex model at any permitted tier
still qualifies for the Codex in-session path. Record the selected form as `in-session` or `cli` in
run telemetry.

## Fit test — first, before anything, and it picks a gear

Before scoping or planning, price the run. Ask: (1) irreversible, production-facing, or externally
visible? (2) real volume or parallel breadth? (3) needs an interview? (4) would an adversarial reader
plausibly catch something?

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | All four phases. One-way door — never downgraded. |
| No to (1), **2+** yeses across (2)–(4) | **express** | Short plan → execute → **one** adversarial review → land it. **Cap 2 review rounds**; a second `CHANGES REQUIRED` promotes the run to full. |
| No to (1), **≤1** yes | **direct** | No office. Do the work under the normal safety rules, then stop. |

Express promotes to full before dispatch if the run needs more than one executor, more than one
repo, or more than roughly three tasks. It drops **phases, never floors** — no self-approval, the
fresh adversarial gate, evidence over exit codes, and read-backs all still bind. Say the gear in two
or three sentences and proceed. Full rule: `office-core/protocol/roles-and-authority.md` → *Fit test*.

## Non-bypassable safety rules

- Explicit invocation only; never self-triggered.
- The planner does not implement the plan; the executor never approves its own work.
- One writer per working tree; parallel work needs separate worktrees and disjoint paths.
- `codex exec --yolo` has no sandbox or approval stop — the prompt and the stated blast-radius
  ceiling are the entire safety boundary.
- When routing to Codex CLI, pass **both** `-m <model>` and
  `-c model_reasoning_effort="<effort>"` to every `codex exec`.
  There is no `--effort` flag; `-m` alone inherits the operator's config default (often `medium`),
  and an unrecognised effort is accepted silently — read the launch banner back.
- Executor authority is local edits and commits only; pushes, PRs, deploys, remote config,
  messages, and credentials are forbidden unless the prompt names that exact action. Those stay the
  **planner's** to perform — and the planner performs them without a fresh go-ahead only when the
  plan's `named_actions:` names them verbatim with a dry run, a revert target, and a read-back.
- **Land each milestone as its criteria go green** — commit, PR, merge the chain — rather than
  batching the run into one closeout. The merged branch is the re-entry point.
- **Dispatch live-system work with its access**: enumerate the MCP/API tools in the launch,
  production **reads** included, and pin the data shape in the prompt with a read-back required.
- A successful process exit is not evidence; the gate is the repository's full validation
  commands with real, pasted output.
- A deployment or migration is planner-held unless explicitly authorized, and is verified by a
  read-back of the live artifact and observable behavior.
- Preserve pre-existing dirty worktree changes as protected paths.
- The reviewer is fresh and separate, whether dispatched in-session or through CLI; verdicts are `APPROVED`, `CHANGES REQUIRED`, or
  `PLAN DEFECT`; no approval without real validation output; 5-round cap.
- Never silently skip review or reuse the executor as reviewer.

## Protocol version

This plugin implements office-core protocol `2.0.0`, vendored at `office-core/` in this plugin.
The vendored copy is authoritative for an installed plugin; the repo-root `office-core/` is the
development source. Mandatory read: `office-core/protocol/roles-and-authority.md`.

**Declared narrowing of core.** Core `2.0.0` lets the planner implement inline; this office
does **not** — the planner never implements the plan here. Narrowing is legal, and it is stated so a
reader of both files need not guess which governs.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.


Never load the whole office corpus for any role — each role gets the Office Kernel plus the spokes
below it selects, and nothing else.

| Phase / need | Load | When |
|---|---|---|
| Plan contract | `office-core/protocol/plan-contract.md` | Planner, before writing the plan |
| Review verdicts | `office-core/protocol/review-states.md` | Planner, before dispatching the reviewer |
| Driving `codex exec` safely | `skills/codex-cli/SKILL.md` | Any phase whose routing selects Codex CLI |
| Executor role and packet contract | `skills/codex-executor/SKILL.md` | Phase 2, building or receiving the executor dispatch |
| Reviewer role and fix loop | `skills/codex-reviewer/SKILL.md` | Phase 3, building or receiving the reviewer dispatch |
| Closeout and planner-held actions | `skills/codex-closeout/SKILL.md` | Phase 4, planner only |

## The four phases

1. **Plan.** Explore read-only, write an approval-ready plan (context, global constraints,
   verbatim blast-radius ceiling, numbered tasks with dependencies and model strategy,
   verification, out-of-scope). Obtain explicit approval before dispatch. Load
   `office-core/protocol/plan-contract.md`.
2. **Execute.** Record `BASE=$(git rev-parse HEAD)`, assign one executor per repository using
   Dispatch routing, read its handoff, and resolve every Upline item before review. Load
   `skills/codex-executor/SKILL.md` and `skills/codex-cli/SKILL.md` only when the route is CLI.
3. **Review.** Assign a fresh reviewer using Dispatch routing; triage findings and reassign fixes
   via a fresh scoped executor; cap at 5 rounds. Load `skills/codex-reviewer/SKILL.md` and
   `skills/codex-cli/SKILL.md` only when the route is CLI.
4. **Closeout.** Verify the gate, commit, and PR only when authorized; report plan, commit range,
   review rounds, gate result, and anything unresolved. Load `skills/codex-closeout/SKILL.md`.

**At the close of every phase**, end the status post with `compact: yes | no — <reason>` per
`office-core/protocol/evidence-and-handoff.md` § Run-state durability. It informs; it never asks,
and it never blocks the phase transition. A `no` means run state lives only in your context —
write it to a file, which turns it into a `yes`.

## Run telemetry

**The harness records it; you do not.** `eval/hooks/session-end.mjs` reads the session transcript
and emits one event per `office-core/schemas/run-event.schema.json` per explicit dispatch. It ran
this way because the previous rule — "record an event at each dispatch" — was an instruction to the
model, and produced zero records in three weeks.

Install with `node eval/hooks/install.mjs`. Nothing in a run needs to emit, count, or remember an
event.

## Maintenance and release

Bump `version` in `.claude-plugin/plugin.json`, add a `CHANGELOG.md` entry, re-vendor core and run
`scripts/check-plugins.sh` from the repo root if core changed. Record durable runtime lessons (a
flag that misbehaved, a worktree collision, a launch quirk) in `skills/codex-cli/SKILL.md`,
not in this hub.
