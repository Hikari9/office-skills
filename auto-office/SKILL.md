---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office; never self-triggered by task shape. Router office — the Planner routes approved graph slices through parallel executors in isolated worktrees.
---

# Auto Office

The office chooser. The invoking model always holds core's **Planner** role
([roles-and-authority.md](office-core/protocol/roles-and-authority.md)) — "orchestrator" below just
names its control-plane behavior, not a second role. It drafts the plan itself for compatibility, or
dispatches an optional dedicated **plan drafter** (an added role, never the Planner) that returns a
serialized draft before the Planner continues the existing lifecycle. Executor, scout, and reviewer
routing follow the current usage-aware defaults in `auto-routing`.

```
PLANNER / orchestrator (user's entry; owns state, dispatch, lifecycle, gates)
  ├─ drafts the plan: itself (compatibility) | dedicated plan drafter → serialized draft handoff
  ├─▶ Plan-reviewer ─▶ retires                         [full gear only]
  ├─▶ Executor lanes (one or more per repo, one worktree each)
  └─▶ Planner collates ready arrivals → Reviewer → closeout
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Planner (orchestrator)** | Invoking model | Intent, state, lifecycle, dispatch, monitoring, approval, review state, closeout | Auto-route itself or give up a gate to the plan drafter |
| **Plan drafter** *(added role)* | Same session, or a dedicated call | Draft plan + serialized handoff | Ask user, dispatch executors, hold a gate, or change routing |
| **Plan-reviewer** | Fresh `gpt-5.6-luna` **xhigh**, Opus **low** fallback; full only | One adversarial pass, then retires | A dedicated drafter's brand does not override this route |
| **Executor** | One per writer/worktree; one or more per repo when the graph benefits from parallel slices. Gemini Flash medium → Sonnet high → Codex Luna xhigh | Its approved graph slice end to end; bootstrap, commit, handoff | Self-approve, exceed ceiling, edit a sibling worktree, or merge |
| **Worker** | Per task; declared triple | One task under Executor | Widen scope or self-promote |
| **Reviewer** | Fresh `gpt-5.6-luna` **xhigh**, Opus **low** fallback | Adversarial gate | Fix its own findings |

Drafter contract/dispatch/boundary: [`references/planner-handoff.md`](references/planner-handoff.md).
**Core:** no one gates their own work; inline work is still independently reviewed. The Planner
engineers the graph for wall-clock time and effectiveness coverage, dispatches one or more lanes per
repo when useful, and collates the first eligible handoff. Each lane owns a separate worktree. No PM.
Planner-implements is allowed only for a fix whose brief would exceed the edit — never for volume.

## Invocation gate and caller overrides

Runs **only on an explicit `/auto-office`** or this skill named — never because a task "looks
routable." A dispatched subagent reading this file is not the planner: follow your brief. A non-Claude
planner is invoked with `/auto-office` **plus this plugin directory's absolute path**
([delegation-map.md](references/delegation-map.md)).

Anything after `/auto-office` overrides discernment and is echoed in the kickoff line: `use codex`,
`express`, `full`, `direct`, `no loop`, `skip cleanup`, `plan approved: <path>`,
`planner_mode=auto|dedicated|inline`, `planner=<harness/model@effort>`, and
`planner_isolation=required`. Default `planner_mode=auto`: if a plan is needed and the orchestrator
is not a supported drafter triple, ask Opus Medium, Fable, Astra, or inline. Dedicated
default/fallback: `claude/opus-5@medium` → `codex/gpt-6-astra@low`. `planner_mode=inline` preserves
the old same-call behavior. A caller override is the
**only** thing that may change a default, executor tier and gear included (`express` and `direct`
are permitted even for prod-facing work) — and none may let an executor review itself, drop a floor,
or widen blast radius implicitly.

## Fit test — first

Before planning, probe all three quota tools and choose the gear; re-probe before executor/reviewer
dispatch. Run each of `auto-office/scripts/{codex,claude,agy}-usage.py` as a separate `python3`
invocation — not one combined command; see [`quota-probe.md`](references/quota-probe.md). Ask
whether the run has irreversible risk, real size/breadth, unresolved ambiguity, or likely
independent-review yield.

| Condition | Gear |
|---|---|
| Irreversible or catastrophic risk | **full** |
| No such risk, but ≥2 of size/ambiguity/review | **express** |
| Otherwise | **direct** — no office |

Express promotes to full before dispatch if it needs >1 executor, >1 repo, or ~4+ tasks. It drops
phases, never floors. State the gear and reasoning; quota is a routing cost, not a downgrade reason.
See [`quota-probe.md`](references/quota-probe.md) and core's *Fit test*.

## Routing, in one screen

Brand by the ordered defaults — **Gemini Flash medium** first, **Claude Sonnet high** second, and
**Codex Luna xhigh** third; frontend/fullstack/backend fit and benchmark scores remain weaker
Planner inputs. Rubric: [auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced:** Herdr when `HERDR_ENV=1`, otherwise the existing
CLI/in-session/inline route. The Planner records drafter selection; the drafted plan records
task assignments; the executor performs them.

**After a drafted handoff, the Planner (orchestrator) owns** user decisions, approval/review state,
lifecycle, dispatch, and irreversible actions. The executor owns implementation, fixes, commits, and
its draft PR; the dedicated plan drafter keeps no run state and holds no gate. **Five fields the
executor may never amend** — `goal`, `done_criteria`, `blast_radius`, `named_actions`, `non_goals`;
it amends the *how* freely, reporting hash + rationale.

**Headroom is probed at fit-test and before dispatch.** Usage is a planner input, not a hard threshold;
when it cannot be measured, Gemini remains the default safe choice until a launch or quota failure
forces a fallback. Live-system delegation names its tools, pins shape, and requires read-back.
Model/effort changes are caller-owned.

## Non-bypassable safety rules

- One or more executors per repo are allowed when the approved graph benefits from parallelism or
  coverage. Each gets its own branch/worktree; the Planner collates the first eligible handoff,
  subject to dependencies and review. One writer per tree remains mandatory, except one Tester with
  disjoint test/config paths and locked commits. A planner inline write never overlaps a live executor.
- With `HERDR_ENV=1`, read [`herdr`](office-core/skills/herdr/SKILL.md): delegated agents use visible
  panes (right, then below), never in-session; otherwise existing CLI/in-session routing remains.
- **The Planner dispatches the dedicated plan drafter during Phase 1 when selected, then ready
  executor lanes, the code reviewer, and Phase 1 scouts.** The graph names each lane's slice,
  dependencies, `Touches:` set, worktree, branch, and handoff. After bootstrap, an Executor may
  dispatch task workers and Tester under core; an undeclared Planner-launched task worker is a
  protocol violation.
- **No self-approval, ever** — not the executor on its diff, not the Planner on its inline fix.
- Executor selection follows the ordered, usage-aware Gemini → Sonnet → Codex ladder; a worker's tier
  is the plan's call, never raised mid-run.
- A delegation buys tier, isolation, parallelism, **or price** — and **every inline row states in a
  clause what a delegation would have bought.** File and task count are never the test.
- One final plan approval after all Phase 1 gates and amendments, before dispatch — silence is not
  approval.
- Fresh Codex Luna xhigh code reviewer, with Opus low only as fallback; resume vs. fresh per round is a cost call, not a default (see
  `review-states.md`). **`CHANGES REQUIRED`** sends the planner to a disposition checkpoint; no
  approval without pasted evidence; **5-round cap** (2 in express).
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; two `CHANGES REQUIRED`
  findings on one task force a planner reflection and recommendation, not an automatic re-plan.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output; live-system writes need a read-back.
- Planner-held actions are **the Planner's to perform**, never delegated. They stop the run only when
  the plan did not **name them verbatim** with preconditions (dry run, revert target, read-back). The
  loop never widens blast radius or adds a repo/environment.

Implements office-core `9.0.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After approval, continue end-to-end: validate the handoff, self-review/plan-review, approve, dispatch,
verify, review/fix, record milestones, then close out. No extra go-aheads except external sends or
unanticipated user-owned decisions.

```
resolve plan drafter → detect triple/plan need → prompt if needed → serialized draft handoff → validate
  task: dispatch → verify → review/fix → APPROVED
  finish: final gate → remove plan → ready PR → merge → sync/report
```

`planner_mode=auto` detects whether a plan is needed and whether the invoking triple is a supported
drafter candidate; an unsupported triple prompts before planning. `planner_mode=inline` drafts
in-session, same as before v2. Dedicated mode keeps the Planner as sole gate-holder after the
drafter returns and its draft is validated — not v3 routing or a new executor/reviewer architecture.

The branch, plan, local run state, and allowed PR comments are the resume record through closeout.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.

| Phase / need | Load |
|---|---|
| Phase 1 — interview, plan + GOAL + milestones + named actions, self-review, approval (**full** adds plan-review) | [auto-planning](skills/auto-planning/SKILL.md) |
| Phase 1 — drafter mode, drafter triple, dispatch form, model+effort | [auto-routing](skills/auto-routing/SKILL.md) |
| Routing — the local ledger, read **before** the benchmarks | [routing-outcomes.md](references/routing-outcomes.md) · [model-benchmarks.md](references/model-benchmarks.md) |
| Dedicated plan-drafter request/response and serialized artifact | [planner-handoff.md](references/planner-handoff.md) |
| Phase 2+ — goal loop, milestone landing, caps, stops, drift checks | [auto-loop](skills/auto-loop/SKILL.md) |
| Every dispatch — sibling spoke to load, forced-invocation path | [delegation-map.md](references/delegation-map.md) |
| Milestone landing and final closeout (unless `skip cleanup`) | [auto-closeout](skills/auto-closeout/SKILL.md) |
| Headroom, probed at fit-test and before every dispatch | [quota-probe.md](references/quota-probe.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing, the loop, and the claude route**; codex and agy mechanics load from the
sibling office. Where two rules bind the **same** gate the stricter wins; a sibling's *role*
narrowing is never imported.

## Telemetry and maintenance

**The harness records it; you do not.** `eval/hooks/session-end.mjs` reads the transcript and emits
run events; `eval/hooks/pre-compact.mjs` preserves run state across a compaction; the `Stop` hook
prints the `compact:` recommendation at every lull. Install with `node eval/hooks/install.mjs`.
Nothing in a run emits, counts, or remembers an event — including plan-drafter metadata, which lives
in the serialized handoff, run report, and existing routing-outcome fields, using the established
`brand`, `model`, `effort`, and `dispatch_form` fields for the actual call.

Bump `plugin.json` `version` to match the new `CHANGELOG.md` heading, re-vendor core if changed, run
`check-plugins.sh` from the **office-skills root**.

**Docs compile, they do not accrete.** An essay that adds tokens without changing a decision is a
defect in the document. Procedure and log: [routing-outcomes.md](references/routing-outcomes.md) →
*Weekly compaction*. A shared invariant is a core change proposal, never a local edit.

## Red flags

**Rationalisations this office produces, with what was true instead:**
[red-flags.md](references/red-flags.md). Reach for it when you catch yourself about to
self-invoke, do a task inline, reclaim a task from the executor, keep a live-system tool,
skip a review round, stop the loop for something the plan already named, or hold a PR
to the end.
