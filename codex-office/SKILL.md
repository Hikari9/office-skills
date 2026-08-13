---
name: codex-office
description: Use only when explicitly named for production-facing or irreversible repository work. The active Codex session plans and closes out; fresh Codex CLI sessions execute and adversarially review.
---

# Codex Office

A strict four-phase delivery process — **plan, execute, adversarial review, closeout** — for
production-facing or irreversible repository work. The active session plans and closes out; fresh
`codex exec` sessions execute and adversarially review. This file is orientation and dispatch only;
procedure lives in the spokes it routes to.

## Roles

| Role | Owner | Default model | Responsibility |
|---|---|---|---|
| Planner | Active Codex session | current session | scope, plan, escalation, closeout |
| Executor | Fresh `codex exec` session | `gpt-5.6-terra` | implements the approved plan |
| Reviewer | Separate fresh `codex exec` session | `gpt-5.6-sol` high effort | adversarial gate and re-review |

## Invocation gate and caller overrides

Runs **only** on explicit invocation of `codex-office` by name — never because a task "looks like"
office work. If you are reading this file as a dispatched worker, you are **not** the planner;
follow your brief instead, this hub does not apply to you.

Caller tweaks after invocation are honored and echoed back in the kickoff line (model tier per
role, skip a phase with an approved plan path, extra reviewer rubric items, skip closeout). No
caller override may: skip an independent review, reuse the executor as its own reviewer, downgrade
the reviewer below its stated floor, or widen the blast-radius ceiling implicitly.

## Fit test — first, before anything

Before scoping or planning, price the run: does this office buy anything here? Any irreversibility
/ production exposure / external visibility, or two or more of {real volume or parallel breadth,
needs an interview, would benefit from an adversarial reader} → run all four phases. None of it →
**say so in two or three sentences and do the work directly**, under the same safety rules, then
stop. Never downgrade a one-way-door run; never invent a half-office. A caller override decides it
either way. Full rule: `office-core/protocol/roles-and-authority.md` → *Fit test*.

## Non-bypassable safety rules

- Explicit invocation only; never self-triggered.
- The planner does not implement the plan; the executor never approves its own work.
- One writer per working tree; parallel work needs separate worktrees and disjoint paths.
- `codex exec --yolo` has no sandbox or approval stop — the prompt and the stated blast-radius
  ceiling are the entire safety boundary.
- Pass `-m` explicitly to every `codex exec`.
- Executor authority is local edits and commits only; pushes, PRs, deploys, remote config,
  messages, and credentials are forbidden unless the prompt names that exact action.
- A successful process exit is not evidence; the gate is the repository's full validation
  commands with real, pasted output.
- A deployment or migration is planner-held unless explicitly authorized, and is verified by a
  read-back of the live artifact and observable behavior.
- Preserve pre-existing dirty worktree changes as protected paths.
- The reviewer is fresh and separate; verdicts are `APPROVED`, `CHANGES REQUIRED`, or
  `PLAN DEFECT`; no approval without real validation output; 5-round cap.
- Never silently skip review or reuse the executor as reviewer.

## Protocol version

This plugin implements office-core protocol `1.5.0`, vendored at `office-core/` in this plugin.
The vendored copy is authoritative for an installed plugin; the repo-root `office-core/` is the
development source. Mandatory read: `office-core/protocol/roles-and-authority.md`.

**Declared narrowing of core.** Core `1.5.0` lets the planner implement inline; this office
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
| Driving `codex exec` safely | `skills/codex-cli/SKILL.md` | Any phase that dispatches a Codex process |
| Executor role and packet contract | `skills/codex-executor/SKILL.md` | Phase 2, building or receiving the executor dispatch |
| Reviewer role and fix loop | `skills/codex-reviewer/SKILL.md` | Phase 3, building or receiving the reviewer dispatch |
| Closeout and planner-held actions | `skills/codex-closeout/SKILL.md` | Phase 4, planner only |

## The four phases

1. **Plan.** Explore read-only, write an approval-ready plan (context, global constraints,
   verbatim blast-radius ceiling, numbered tasks with dependencies and model strategy,
   verification, out-of-scope). Obtain explicit approval before dispatch. Load
   `office-core/protocol/plan-contract.md`.
2. **Execute.** Record `BASE=$(git rev-parse HEAD)`, dispatch one executor per repository, read
   its handoff, resolve every Upline item before review. Load `skills/codex-executor/SKILL.md`
   (and `skills/codex-cli/SKILL.md` for the dispatch mechanics).
3. **Review.** Dispatch a fresh reviewer; triage findings and re-dispatch fixes via a fresh scoped
   executor; cap at 5 rounds. Load `skills/codex-reviewer/SKILL.md`.
4. **Closeout.** Verify the gate, commit, and PR only when authorized; report plan, commit range,
   review rounds, gate result, and anything unresolved. Load `skills/codex-closeout/SKILL.md`.

**At the close of every phase**, end the status post with `compact: yes | no — <reason>` per
`office-core/protocol/evidence-and-handoff.md` § Run-state durability. It informs; it never asks,
and it never blocks the phase transition. A `no` means run state lives only in your context —
write it to a file, which turns it into a `yes`.

## Run telemetry

At each explicit dispatch, record an event per `office-core/schemas/run-event.schema.json`: the
`codex exec` launch id, worktree id, base commit, selected spokes, model name and effort, and the
reviewer round. This is what makes a duplicate writer or a missing review observable after the
fact. A transcript keyword match is not an invocation and does not produce one of these events.

## Maintenance and release

Bump `version` in `.claude-plugin/plugin.json`, add a `CHANGELOG.md` entry, re-vendor core and run
`scripts/check-plugins.sh` from the repo root if core changed. Record durable runtime lessons (a
flag that misbehaved, a worktree collision, a launch quirk) in `skills/codex-cli/SKILL.md`,
not in this hub.
