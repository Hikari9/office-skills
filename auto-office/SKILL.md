---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office; never self-triggered by task shape. Router office — a fit test picks the gear, then ONE codex / agy / claude executor per repo runs the approved plan end to end.
---

# Auto Office

The office chooser. The user's invoking model is always the **orchestrator**; v2
never auto-routes it. The planner may be that same session for compatibility, or
an optional dedicated call that returns a serialized plan before the orchestrator
continues the existing lifecycle. Executor and reviewer routing stay unchanged.

```
ORCHESTRATOR (user's entry; owns state, dispatch, lifecycle)
  ├─ planner: same call (compatibility) | dedicated model → serialized handoff
  ├─▶ Plan-reviewer ─▶ retires                         [full gear only]
  └─▶ ONE Executor per repo ─▶ Workers → Reviewer → closeout
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Orchestrator** | User's invoking model | Intent, state, lifecycle, dispatch, monitoring, review state, closeout | Auto-route itself or delegate lifecycle to planner |
| **Planner** | Same session for compatibility, or dedicated call | Plan + serialized handoff | Ask user, dispatch executors, or change executor/reviewer routes |
| **Plan-reviewer** | Fresh existing control-plane route, Opus **low**; full only | One adversarial pass, then retires | Dedicated planner choice does not override route |
| **Executor** | One per repo; fixed sonnet-tier high | Whole approved plan end to end; bootstrap, commit, handoff | Self-approve, exceed ceiling, or merge |
| **Worker** | Per task; declared triple | One task under Executor | Widen scope or self-promote |
| **Reviewer** | Fresh Opus **low** (`codex-luna` only when Codex is control-plane planner) | Adversarial gate | Fix its own findings |

The dedicated-planner contract and v2-only boundary are in
[`references/planner-handoff.md`](references/planner-handoff.md).
**Core:** no one gates their own work; inline work is still independently reviewed. The planner
(orchestrator after a dedicated handoff) designs dispatch; one executor performs the whole plan per
repo. No PM; ≥2 repos means ≥2 executors. Planner-implements is allowed only for a fix whose brief
would exceed the edit — never for volume.

## Invocation gate and caller overrides

Runs **only on an explicit `/auto-office`** or this skill named — never because a task "looks
routable." A dispatched subagent reading this file is not the planner: follow your brief. A non-Claude
planner is invoked with `/auto-office` **plus this plugin directory's absolute path**
([delegation-map.md](references/delegation-map.md)).

Anything after `/auto-office` overrides discernment and is echoed in the kickoff line: `use codex`,
`express`, `full`, `direct`, `no loop`, `skip cleanup`, `plan approved: <path>`,
`planner_mode=auto|dedicated|orchestrator`, `planner=<harness/model@effort>`, and
`planner_isolation=required`. The v2 default is `planner_mode=auto`: if a plan is needed and the
orchestrator is not a supported planner triple, ask whether to use Opus Medium, Fable, Astra, or
inline. Dedicated default/fallback remain `claude/opus-5@medium` → `codex/gpt-6-astra@low`.
`planner_mode=orchestrator` explicitly preserves the old behavior. A caller override is the
**only** thing that may change a default, executor tier and gear included (`express` and `direct`
are permitted even for prod-facing work) — and none may let an executor review itself, drop a floor,
or widen blast radius implicitly.

## Fit test — first

Before planning, probe all three quota tools and choose the gear; re-probe before executor/reviewer
dispatch. Use `python3 auto-office/scripts/{codex,claude,agy}-usage.py`. Ask whether the run has
irreversible risk, real size/breadth, unresolved ambiguity, or likely independent-review yield.

| Condition | Gear |
|---|---|
| Irreversible or catastrophic risk | **full** |
| No such risk, but ≥2 of size/ambiguity/review | **express** |
| Otherwise | **direct** — no office |

Express promotes to full before dispatch if it needs >1 executor, >1 repo, or ~4+ tasks. It drops
phases, never floors. State the gear and reasoning; quota is a routing cost, not a downgrade reason.
See [`quota-probe.md`](references/quota-probe.md) and core's *Fit test*.

## Routing, in one screen

Brand by fit — **claude** cross-cutting ambiguity (preferred default), **codex** backend/data/infra/long-horizon,
**agy** frontend, recon, and bulk breadth. Rubric:
[auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced:** Herdr when `HERDR_ENV=1`, otherwise the existing
CLI/in-session/inline route. The orchestrator records planner selection; the planning step records
task assignments; the executor performs them. See [auto-routing](skills/auto-routing/SKILL.md).

**After handoff, the orchestrator owns** user decisions, approval/review state, lifecycle, dispatch,
and irreversible actions. The executor owns implementation, fixes, commits, and its draft PR; the
dedicated planner keeps no run state. The five frozen fields are `goal`, `done_criteria`,
`blast_radius`, `named_actions`, and `non_goals`.

**Headroom is probed at fit-test and before dispatch; UNKNOWN is unavailable.** Agy has a three-task
cap. Live-system delegation names its tools, pins shape, and requires read-back. Model/effort changes
are caller-owned.

## Non-bypassable safety rules

- One executor per repo; one implementation writer per tree, except one Tester with disjoint
  test/config paths and locked commits. A planner inline write never overlaps a live executor.
- With `HERDR_ENV=1`, read [`herdr`](office-core/skills/herdr/SKILL.md): delegated agents use visible
  panes (right, then below), never in-session; otherwise existing CLI/in-session routing remains.
- **The orchestrator dispatches the dedicated planner during Phase 1 when selected, then the executor,
  code reviewer, and Phase 1 read-only scouts.** After bootstrap, the Executor may dispatch task
  workers and Tester under the core contract. A planner-launched numbered-task worker is a protocol
  violation.
- **No self-approval, ever** — not the executor on its diff, not the orchestrator/control-plane planner
  on its inline fix.
- Executor is **sonnet-tier high** always; a worker's tier is the plan's call, never raised mid-run.
- A delegation buys tier, isolation, parallelism, **or price** — and **every inline row states in a
  clause what a delegation would have bought.** File and task count are never the test.
- One final plan approval after all Phase 1 gates and amendments, before dispatch — silence is not
  approval.
- Fresh Opus code reviewer; resume vs. fresh per round is a cost call, not a default (see
  `review-states.md`). **`CHANGES REQUIRED`** sends the planner to a disposition checkpoint; no
  approval without pasted evidence; **5-round cap** (2 in express).
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; two `CHANGES REQUIRED`
  findings on one task force a planner reflection and recommendation, not an automatic re-plan.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output; live-system writes need a read-back.
- Planner-held actions are **the orchestrator/control-plane planner's to perform**, never delegated. They stop the run only when
  the plan did not **name them verbatim** with preconditions (dry run, revert target, read-back). The
  loop never widens blast radius or adds a repo/environment.

Implements office-core `9.0.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After approval, continue end-to-end: validate the handoff, self-review/plan-review, approve, dispatch,
verify, review/fix, record milestones, then close out. No extra go-aheads except external sends or
unanticipated user-owned decisions.

```
resolve planner → detect triple/plan need → prompt if needed → serialized handoff → validate
  task: dispatch → verify → review/fix → APPROVED
  finish: final gate → remove plan → ready PR → merge → sync/report
```

`planner_mode=auto` detects whether a plan is needed and whether the invoking triple is a supported
planner; an unsupported triple prompts before planning. `planner_mode=orchestrator` makes the handoff
an in-session compatibility step. Dedicated mode keeps the orchestrator as the sole controller after
the planner returns. v3 may deepen the split; this PR does not add v3 routing or a new executor/reviewer
architecture.

The branch, plan, local run state, and allowed PR comments are the resume record through closeout.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.

| Phase / need | Load |
|---|---|
| Phase 1 — interview, plan + GOAL + milestones + named actions, self-review, approval (**full** adds plan-review) | [auto-planning](skills/auto-planning/SKILL.md) |
| Phase 1 — planner mode, planner triple, dispatch form, model+effort | [auto-routing](skills/auto-routing/SKILL.md) |
| Routing — the local ledger, read **before** the benchmarks | [routing-outcomes.md](references/routing-outcomes.md) · [model-benchmarks.md](references/model-benchmarks.md) |
| Dedicated planner request/response and serialized artifact | [planner-handoff.md](references/planner-handoff.md) |
| Phase 2+ — goal loop, milestone landing, caps, stops, drift checks | [auto-loop](skills/auto-loop/SKILL.md) |
| Every dispatch — sibling spoke to load, forced-invocation path | [delegation-map.md](references/delegation-map.md) |
| Milestone landing and final closeout (unless `skip cleanup`) | [auto-closeout](skills/auto-closeout/SKILL.md) |
| Headroom, probed at fit-test and before every dispatch | [quota-probe.md](references/quota-probe.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing, the loop, and the claude route**; codex and agy mechanics load from the
sibling office. Where two rules bind the **same** gate the stricter wins; a sibling's *role*
narrowing is never imported.

## Telemetry and maintenance

**The harness records it; you do not.** Hooks emit run events; planner metadata lives in the
serialized handoff, run report, and existing routing-outcome fields. Actual calls use the established
`brand`, `model`, `effort`, and `dispatch_form` fields. Install with `node eval/hooks/install.mjs`.

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
