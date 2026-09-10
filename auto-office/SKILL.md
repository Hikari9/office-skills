---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office; never self-triggered by task shape. Router office — a fit test picks the gear, then ONE codex / agy / claude executor per repo runs the approved plan end to end.
---

# Auto Office

The office chooser and control plane. The invoking model is the **Orchestrator**
([roles-and-authority.md](office-core/protocol/roles-and-authority.md)) — registry, routing,
amendments, lifecycle, landing. The **Planner** is a separate *interactive* role: recon, its own
user interview, requirements freeze, plan, plan adversary, plan packet. The orchestrator distributes
that packet and never re-reviews it technically.

```
ORCHESTRATOR ── FAMILY A ─ Planner ⟷ user, then Plan adversary → frozen reqs + plan packet
             │            ├─▶ Executor A1 ⟷ Code adversary (or inline tier) → landing packet
             │            ├─▶ Executor A2 ⟷ Code adversary                  → landing packet
             │            └─▶ Integration adversary — ONLY if A1/A2 compose or merge
             └── FAMILY B … independent repo/issue, own versions, runs concurrently
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Orchestrator** | Invoking model | Provisional intent, tracking issue, family registry, routing, amendments, dispatch, approval/review state, closeout, merge | Re-review the plan technically, auto-route itself, or hold a producer's disposition |
| **Planner** | Dedicated interactive call (or inline) | Recon, user interview, requirements freeze, plan, self-review, its own plan adversary, plan packet | Dispatch executors, hold the code gate, or keep run state |
| **Plan adversary** | Fresh, planner-spawned, Opus **low** | One pass on the plan before it returns | Overrule the planner's evidenced disposition |
| **Executor** | One per repo; fixed sonnet-tier high | Whole frozen plan end to end; bootstrap, commit, its local review loop, landing packet | Self-approve unreviewed, exceed ceiling, or merge |
| **Worker** | Per task; declared triple | One task under Executor | Widen scope or self-promote |
| **Code adversary** | Fresh Opus **low** (`codex-luna` only when Codex is the orchestrator) | Challenge the executor's work | Fix its own findings, or overrule an evidenced rejection |
| **Integration adversary** | Fresh, orchestrator-spawned; **only at an integration boundary** | Do the combined landings compose and meet the frozen requirements | Run for a single-executor family; re-review each diff line by line |

Planner contract and packet: [`planner-handoff.md`](references/planner-handoff.md). Families, focus,
amendments, versions: [`family-registry.md`](references/family-registry.md).
**Core:** no one gates their own work; the producer disposes of each finding and the adversary
challenges it. One executor per repo performs the whole plan. No PM; ≥2 repos means ≥2 executors.
Orchestrator-implements only for a fix whose brief would exceed the edit — never for volume.

## Invocation gate and caller overrides

Runs **only on an explicit `/auto-office`** or this skill named — never because a task "looks
routable." A dispatched subagent reading this file is not the orchestrator: follow your brief. A
non-Claude orchestrator is invoked with `/auto-office` **plus this plugin directory's absolute path**
([delegation-map.md](references/delegation-map.md)).

Anything after `/auto-office` overrides discernment and is echoed in the kickoff line: `use codex`,
`express`, `full`, `direct`, `no loop`, `skip cleanup`, `plan approved: <path>`,
`planner_mode=auto|dedicated|inline`, `planner=<harness/model@effort>`,
`planner_isolation=required`, `review=inline|adversarial`, `family=<id>`. Default
`planner_mode=auto`: if a plan is needed and the orchestrator is not a supported planner triple, ask
Opus Medium, Fable, Astra, or inline. Dedicated default/fallback: `claude/opus-5@medium` →
`codex/gpt-6-astra@low`. `planner_mode=inline` plans in the invoking session, which then wears both
hats and still may not gate its own writing. A caller override is the **only** thing that may change
a default, executor tier and gear included (`express` and `direct` are permitted even for prod-facing
work) — and none may let an executor review itself, drop a floor, or widen blast radius implicitly.

## Fit test — first

Before planning, probe all three quota tools and choose the gear; re-probe before executor/reviewer
dispatch. Run each of `auto-office/scripts/{codex,claude,agy}-usage.py` as a separate `python3`
invocation — see [`quota-probe.md`](references/quota-probe.md). Ask whether the run has irreversible
risk, real size/breadth, unresolved ambiguity, or likely independent-review yield.

| Condition | Gear |
|---|---|
| Irreversible or catastrophic risk | **full** |
| No such risk, but ≥2 of size/ambiguity/review | **express** |
| Otherwise | **direct** — no office |

Express promotes to full before dispatch if it needs >1 executor, >1 repo, or ~4+ tasks. It drops
phases, never floors. State the gear and reasoning; quota is a routing cost, not a downgrade reason.

## Routing, in one screen

Brand by fit — **claude** cross-cutting ambiguity (preferred default), **codex** backend/data/infra/long-horizon,
**agy** frontend, recon, and bulk breadth. Rubric: [auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced:** Herdr when `HERDR_ENV=1`, otherwise the existing
CLI/in-session/inline route. The returned plan records task assignments; the executor performs them.

**After the packet returns the orchestrator owns** approval/review state, lifecycle, dispatch,
amendments, and irreversible actions — not a second technical plan review. The executor owns
implementation, its local review loop, the disposition of every finding against its own work,
commits, and its draft PR. **Five fields the executor may never amend** — `goal`, `done_criteria`,
`blast_radius`, `named_actions`, `non_goals`; it amends the *how* freely, reporting hash + rationale.

**Three versions move independently:** routing-only amendments bump `routing_version` and never wake
the planner; a requirement that fits the plan bumps `requirements_version` as a delta packet;
anything touching architecture, interfaces, dependency order, milestones, or done criteria pauses
only affected work and wakes the planner ([family-registry.md](references/family-registry.md)).

**Headroom is probed at fit-test and before dispatch; UNKNOWN is unavailable.** Agy has a three-task
cap. Live-system delegation names its tools, pins shape, and requires read-back. Model/effort changes
are caller-owned.

## Non-bypassable safety rules

- One executor per repo; one implementation writer per tree, except one Tester with disjoint
  test/config paths and locked commits. A planner inline write never overlaps a live executor.
- With `HERDR_ENV=1`, read [`herdr`](office-core/skills/herdr/SKILL.md): delegated agents use visible
  panes (right, then below), never in-session; otherwise existing CLI/in-session routing remains.
- **The orchestrator dispatches the planner, the executors, Phase 1 scouts, and an integration
  adversary only at an integration boundary.** The planner spawns its plan adversary; the executor
  spawns its code adversary (at the declared triple), task workers, and Tester. An
  orchestrator-launched numbered-task worker is a protocol violation.
- **No self-approval, ever.** `review=inline` drops the adversary for cheap, reversible, low-risk
  work only — never the validation evidence, never the run's main correctness or security risk.
- **No final adversary over a single-executor family**; only two or more *dependent or merging*
  landings buy an integration adversary.
- Executor is **sonnet-tier high** always; a worker's tier is the plan's call, never raised mid-run.
- A delegation buys tier, isolation, parallelism, **or price**, and **every inline row states what a
  delegation would have bought.** File and task count are never the test.
- One final plan approval before dispatch — silence is not approval.
- Fresh Opus code adversary; resume vs. fresh per round is a cost call (`review-states.md`).
  **`CHANGES REQUIRED`** gets a per-finding disposition from the **executor** (`accepted_fixed` /
  `rejected_with_evidence` / `unresolved`) and a per-round one from the orchestrator; no approval
  without pasted evidence; **5-round cap** (2 in express). Unresolvable conflicting evidence is
  `TRUE_CONFLICT` and goes to the user.
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; two `CHANGES REQUIRED`
  findings on one task force a planner reflection and recommendation, not an automatic re-plan.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output; live-system writes need a read-back.
- Planner-held actions are **the orchestrator's to perform**, never delegated. They stop the run only
  when the plan did not **name them verbatim** with preconditions (dry run, revert target,
  read-back). The loop never widens blast radius or adds a repo/environment.

Implements office-core `18.0.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After approval, continue end-to-end: validate the packet, approve, dispatch, verify, review/fix,
record milestones, then close out. No extra go-aheads except external sends or unanticipated
user-owned decisions.

```
resolve planner → detect triple/plan need → prompt if needed → planner interviews the user
  → requirements freeze → plan + planner self-review + plan adversary → plan packet → validate shape
  task: dispatch → verify → executor's local review/fix → APPROVED → landing packet
  finish: integration adversary (only at an integration boundary) → remove plan → ready PR → merge
```

`planner_mode=auto` detects whether a plan is needed and whether the invoking triple is a supported
planner candidate; an unsupported triple prompts before planning. The orchestrator validates the
packet's *shape* — sections, `base_sha`, `requirements_freeze`, disposed `plan_review` findings,
metadata, the three versions — and takes the single user approval; it does not re-do the
engineering.

The branch, plan, local run state, and allowed PR comments are the resume record through closeout.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.

| Phase / need | Load |
|---|---|
| Phase 1 — recon, planner-led interview, requirements freeze, plan + GOAL + milestones + named actions, self-review, plan adversary, approval | [auto-planning](skills/auto-planning/SKILL.md) |
| Phase 1 — planner mode, planner triple, review tier, dispatch form, model+effort | [auto-routing](skills/auto-routing/SKILL.md) |
| Families, conversational focus, amendments, the three versions | [family-registry.md](references/family-registry.md) |
| Routing — the local ledger, read **before** the benchmarks | [routing-outcomes.md](references/routing-outcomes.md) · [model-benchmarks.md](references/model-benchmarks.md) |
| Interactive planner brief, plan packet, and freeze contract | [planner-handoff.md](references/planner-handoff.md) |
| Phase 2+ — goal loop, milestone landing, caps, stops, drift checks | [auto-loop](skills/auto-loop/SKILL.md) |
| Every dispatch — sibling spoke to load, forced-invocation path | [delegation-map.md](references/delegation-map.md) |
| Milestone landing and final closeout (unless `skip cleanup`) | [auto-closeout](skills/auto-closeout/SKILL.md) |
| Headroom, probed at fit-test and before every dispatch | [quota-probe.md](references/quota-probe.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing, the loop, and the claude route**; codex and agy mechanics load from the
sibling office. Where two rules bind the **same** gate the stricter wins; a sibling's *role*
narrowing is never imported.

## Telemetry and maintenance

**The harness records it; you do not.** `eval/hooks/session-end.mjs` emits run events;
`eval/hooks/pre-compact.mjs` preserves run state across a compaction; the `Stop` hook prints the
`compact:` recommendation at every lull. Install with `node eval/hooks/install.mjs`. Planner metadata
lives in the plan packet, run report, and routing-outcome fields, using the established `brand`,
`model`, `effort`, and `dispatch_form` fields for the actual call.

Bump `plugin.json` `version` to match the new `CHANGELOG.md` heading, re-vendor core if changed, run
`check-plugins.sh` from the **office-skills root**.

**Docs compile, they do not accrete.** An essay that adds tokens without changing a decision is a
defect in the document. Procedure: [routing-outcomes.md](references/routing-outcomes.md) → *Weekly
compaction*. A shared invariant is a core change proposal, never a local edit.

## Red flags

**Rationalisations this office produces, with what was true instead:**
[red-flags.md](references/red-flags.md). Reach for it when you catch yourself about to self-invoke,
do a task inline, reclaim a task from the executor, keep a live-system tool, skip a review round,
re-review the planner's plan, add an adversary a single-executor family does not need, stop the loop
for something the plan already named, or hold a PR to the end.
