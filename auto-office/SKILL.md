---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office. Router office — the current agent plans and interviews to 95% clarity, routes each task to a codex / agy / claude executor by capability and live quota, and runs goal-locked to closeout with no further go-aheads. Opus gates the plan and the code. Never self-triggered.
---

# Auto Office

The office that chooses the office. The executor's **brand** is selected; its **tier is fixed**. One
plan approval, then the run continues to closeout without asking again.

```
Planner ──▶ Plan-reviewer ──▶ retires │ Planner ──▶ PM ──▶ Executor(s) ──▶ Worker | inline
(self-reviews,  (Opus-tier, planner's │  (only when >1 executor;    (brand+tier per plan)
 plans, fixes)   brand, low effort)   │   a separate CLI subagent)
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Planner** | The current agent (you) | Interview → brand per task → **self-review** → plan + GOAL → approval; drive the loop; fix inline; close out | Take a task away from review; approve work, its own included |
| **Plan-reviewer** | Fresh, planner's brand, Opus-tier **low** | One adversarial pass over the plan, before user approval, then **retires** | Distribute work; return; hold a later gate |
| **PM** | CLI subagent, executor tier, ≥2 executors only | Hand out the briefs the plan wrote; collect results | Hold a planner-held action or a gate; re-decide routing |
| **Executor** | One per repo, brand per plan, **sonnet-tier high always** | Implement its slice; may fan out in-session | Approve its own work; exceed the ceiling |
| **Worker** | Per task; brand **and tier** per plan | One task, never a second writer | Widen scope; be promoted mid-run |
| **Reviewer (code)** | Fresh `opus` medium (`codex-sol` high when Codex *plans*) | Adversarial gate every round | Fix what it gates |

**Core principle: no one gates their own work, and inline work is still reviewed.** The planner *may*
implement — a spawn to move one line costs more than the line — and still never approves the result.

## Invocation gate and caller overrides

Runs **only when the caller explicitly invokes** `/auto-office` or names this skill — never because a
task "looks routable." A dispatched subagent reading this file is not the planner: follow your brief.
A non-Claude planner is invoked with `/auto-office` **plus this plugin directory's absolute path**, so
it can read the spokes directly ([delegation-map.md](references/delegation-map.md)).

Anything after `/auto-office` overrides discernment and is echoed in the kickoff line: `use codex`,
`executor: agy`, `reviewer: codex`, `no loop`, `skip cleanup`, `plan approved: <path>`. A caller
override is the **only** thing that may change a default — the executor tier included — and none may
skip independent review, let an executor review itself, drop a reviewer floor, remove a phase, or
widen the blast radius implicitly.

## Routing, in one screen

Brand by fit — **codex** for backend / data / infra / long-horizon correctness (preferred default),
**agy** for frontend, recon, bulk breadth, **claude** for cross-cutting ambiguity. Full rubric:
[auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced** — planner fans out → CLI, executor fans out → in-session, a
delegation that buys nothing → inline. Near-ties are not deliberated: same tier, both fit, pick one.

**Headroom is measured, then weighed — never a hardcoded gate.** Probe first; a low number is a cost
to price, not a veto, and UNKNOWN means unavailable. State it **per window, with reset times**, in
the kickoff line. Agy drifts past **3 consecutive tasks** — hard cap.

**Model and effort are fixed by role** (table above); `xhigh`/`ultra`/`max` and model substitutions
are **user-invoked only**.

## Non-bypassable safety rules

- One executor per repo, one writer per tree, ever. Sub-delegation is not a second writer, and a
  planner inline write never overlaps a live executor in that tree.
- **No self-approval, ever** — not the executor on its diff, not the planner on its inline fix.
- Executor is **sonnet-tier high** always; a worker's tier is the plan's call, never raised mid-run.
- Explicit plan approval before dispatch — silence is not approval.
- Fresh Opus code reviewer, resumed across rounds; **`CHANGES REQUIRED`** re-enters the fix loop; no
  approval without pasted evidence; **5-round cap** per task.
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; at **2** consecutive
  `CHANGES REQUIRED` on one task, presume `PLAN DEFECT` and re-plan it.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output, and live-system writes need a read-back.
- Irreversible production work is `PLANNER-HELD`, excluded from every brief, and the one thing the
  loop **stops** for. The loop never widens its blast radius or adds a repo or environment, and
  user-owned decisions get a recommendation, never inference.

Implements office-core `1.2.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After plan approval this is **end-to-end**. Don't ask for go-aheads between phases; report progress
and keep moving. Caps, stops: [auto-loop](skills/auto-loop/SKILL.md).

`self-review → plan-review → approve → GOAL locked → per task: dispatch → verify → Opus review → fix
→ every done-criterion green → closeout → run report with the cost retrospective`

It stops early for exactly four things: a `PLANNER-HELD` step, a destructive or production-facing
write, an external send, or a genuinely user-owned decision. Everything else it decides.

## Routing table

| Phase / need | Load |
|---|---|
| Phase 1 — interview, plan + GOAL, **self-review, the one plan-review pass**, approval | [auto-planning](skills/auto-planning/SKILL.md) |
| Phase 1 — brand per unit of work, dispatch form, model+effort; headroom, both windows | [auto-routing](skills/auto-routing/SKILL.md) · [quota-probe.md](references/quota-probe.md) |
| Routing — this workspace's ledger, read **before** the benchmarks | [routing-outcomes.md](references/routing-outcomes.md) · [model-benchmarks.md](references/model-benchmarks.md) |
| Phase 2+ — goal loop, caps, stop conditions, drift checks | [auto-loop](skills/auto-loop/SKILL.md) |
| Every dispatch — sibling spoke to load, forced-invocation path | [delegation-map.md](references/delegation-map.md) |
| Phase 4 (unless `skip cleanup`) — commit, PR, cost retrospective, self-heal | [auto-closeout](skills/auto-closeout/SKILL.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing and the loop** and no CLI or sub-agent mechanics of its own — every phase
loads the sibling spoke for the chosen brand, and the stricter rule always wins.

## Run telemetry

One event per `office-core/schemas/run-event.schema.json` at each explicit dispatch — core 1.2.0
carries `brand`, `effort`, `dispatch_form`, `review_rounds`, `plan_review_rounds`, `brief_defects`,
`tokens_out`, `wall_clock_s` — plus `routing_reason`, `headroom_percent` per tool **per window**,
`benchmark_snapshot_date`, `loop_iteration`, `reroute_from`. Match on session/worktree identity, not
a display label.

## Maintenance

Bump `version`, add a `CHANGELOG.md` entry, re-vendor core if it changed, run
`scripts/check-plugins.sh`. A shared invariant is a proposed core change, never a local edit, and
editing these skills at all is Opus-planner-only.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "This is routable, I'll auto-invoke" | Only an explicit `/auto-office` invokes this. |
| "Codex is at 14%, so it's out" | No threshold exists. Weigh it, state it, spend it if it's worth it. |
| "Quota's thin, I'll not mention it" | It goes in the kickoff line, or the user can't override. |
| "This task is hard, I'll use Opus" | The executor is pinned; a bigger *worker* is legal only if the plan declared it. |
| "I fixed it inline, so it's mine to approve" | Lifting planner-implements did not lift planner-never-approves. Fresh reviewer, every time. |
| "Agy is on task 5 and doing fine" | It forgets past 3. Re-brief or re-route. |
| "The plan's done, I'll ask before executing" | You have approval. The run is end-to-end. |
| "It's autonomous, so I'll deploy too" | Irreversible prod is `PLANNER-HELD`. The loop stops. |
| "Executor says done" | It cannot approve its own work. Review is not optional. |
| "Agy wrote it, agy can review it" | The **code** gate is a fresh Opus reviewer. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "Benchmarks in my head are current" | Read the snapshot; refresh it if stale. |
| "The loop can add one more repo" | That widens the blast radius. Not the loop's call. |
