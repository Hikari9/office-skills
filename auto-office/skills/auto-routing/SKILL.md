---
name: auto-routing
description: The discernment engine — which brand is the executor, which brand and tier each worker gets, how work is dispatched, and how the benchmark snapshot stays honest across model upgrades. Loaded by the auto-office hub; not invoked directly.
---

# Auto Routing

**Three decisions, all made by the planner at plan time**, and never conflated:

1. **Which brand is the executor** — one per repo. Owns the working tree. The only writer. Its
   model and effort are **fixed** by the table below.
2. **Which brand, model, and effort each worker gets** — per task. Routed by fit, and **not pinned
   to the executor's tier.** A worker may be a different brand, a bigger model, or both.
3. **How each unit of work is dispatched** — CLI, in-session, or inline. **Derived**, not chosen: it
   follows from who is dispatching whom (see *Dispatch form* below).

Decisions 1 and 2 stay separate because they are different kinds of decision. The executor holds the
tree for the whole run, so pinning it is what makes the run's cost predictable and its authority
singular. A worker is a bounded, single-question spend under supervision — so buying a higher tier
for one genuinely hard sub-question is cheap, reviewable, and often the correct call.

This is also what core requires. The [delegation test](../../office-core/protocol/roles-and-authority.md)
says a delegation must buy **tier, isolation, or parallelism**. Pin a worker to the executor's tier
and delegation can never buy tier — one of core's three legitimate reasons to delegate would be dead
on arrival.

The planner assigns; the executor executes the assignment. If reality disagrees with the
assignment — the brand cannot do this, the file does not exist, the stated cause is false — that is
a `PLAN DEFECT` or a `BRIEF DEFECT`, **not** a licence for the executor to re-decide the routing.
Putting the decision in the plan is what makes a bad route reviewable before it is paid for.

A worker is never a second writer: it works inside the executor's tree under its supervision, or
returns an artifact (a finding, a patch, a report) the executor applies. Getting *that* wrong is the
failure this office exists to prevent. Fan-out is cheap; two writers corrupt a tree.

## Route by capability role, not by model name

Model names churn. These roles do not. Read
[model-benchmarks.md](../../references/model-benchmarks.md) for the numbers currently backing each
row, and refresh it when stale — never route from memory of a leaderboard.

| Capability role | Current best tool | What it is for | Known failure mode |
|---|---|---|---|
| **Decider** | claude (Opus) | Plans, arbitration, gate-holding, resolving contradictions, ambiguous cross-cutting work | Slow and expensive per token — spend it on decisions, not typing |
| **Backend builder** | codex | Backend, data, migrations, infra, refactors, long-horizon implementation | Weekly quota is finite — price it in, don't ignore it |
| **Fast scout / bulk hand** | agy | Web search, docs research, codebase recon, high-volume mechanical edits, frontend/UI | Drifts off-instruction past ~3 chained tasks; can be confidently wrong and internally consistent |

Agy's weakness is **duration**, not capability. So give it breadth, never depth: many parallel
single-shot tasks, each returning a cheaply verifiable artifact. Give claude the opposite shape —
one long chain where holding context is the value.

## Brand selection

Probe all three tools' headroom first ([quota-probe.md](../../references/quota-probe.md)). Then
pick on **fit**, and only afterwards weigh headroom as a cost:

```
caller named a brand?  → use it, echo the override, stop here

best-fit brand, ignoring quota:
    irreversible-prod, gnarly ambiguity, cross-cutting, correctness-over-speed  → claude
    backend / data / infra / migrations / long-horizon, or a mixed plan         → codex
    frontend-heavy, short, speed-bound, or bulk mechanical                      → agy

then weigh headroom on that brand (see below), and either commit or shift.
```

The operator's stated preference is **codex in general**, with agy or claude when codex has no juice
left. That is a preference to honor, not a rule to apply blindly against fit.

## Model + effort per role

Not derived from the benchmark table, and a leaderboard movement does not change them.

| Role | claude | codex | agy | Fixed? |
|---|---|---|---|---|
| Planner | `opus` (the session) | `codex-sol` | `agy` | fixed |
| **Plan-reviewer** | `opus` **low** | `codex-sol` **low** | `agy` **high** | fixed |
| **PM** (≥2 executors) | `sonnet` **high** | `codex-terra` **high** | `agy` **high** | fixed |
| Executor | `sonnet` **high** | `codex-terra` **high** | `agy` **high** | **fixed** |
| Worker | `sonnet` high *default* | `codex-terra` high *default* | `agy` **high** | **planner-assigned** |
| Reviewer (code) | `opus` **medium** | `codex-sol` high *(only when codex is planner)* | never reviews | fixed |

**The plan-reviewer's brand is always the planner's brand** — it is not routed by fit. It reads one
document the planner just wrote; same-brand is an advantage there, not the conflict of interest it
would be on a diff. Executor and worker brand *is* routed by fit.

**The executor is sonnet-tier, high effort. Full stop.** No self-escalation, no exceptions without a
caller override. The evidence this comes from: on the run that produced this rule, both
green-but-useless tests the reviewer caught were written by the *bigger* model, and the run's single
largest line item was three review rounds funding fixes to a task whose brief was wrong. A bigger
executor does not fix a wrong brief; it implements it more convincingly.

**Workers are routed, not pinned — and the routing is a plan-time decision.** The default is the
executor's tier, because most sub-tasks are recon, lookups, or mechanical edits that a bigger model
finishes no better. But the planner may assign a worker a higher tier, or a different brand, when the
sub-task is genuinely of a different kind: a Decider-grade judgement call, an ambiguity that needs
arbitrating, a diagnosis nobody has confirmed. Three conditions, all of them non-negotiable:

- **Declared in the plan's task table**, in the `Model+effort` cell, before approval. An
  above-default worker that nobody approved is the exact defect this office was revised to fix — and
  note the failure then was *invisibility*, not the bigger model. A declared Opus worker is fine; an
  undeclared one is not, whatever tier it is.
- **Recorded in telemetry** (`brand`, `model`, `effort` per dispatch) and in the closeout cost
  retrospective, so the next run can see whether the upgrade actually paid.
- **Never self-escalated at run time.** The executor cannot promote its own worker mid-task; that is
  a `PLAN DEFECT` to surface, not a call to make. Reality disagreeing with the plan is reportable,
  not re-decidable.

**Reach for a bigger worker for a *different kind* of question, never for a harder-looking one.**
"This task is hard" is the reasoning that produced the last run's silent over-provisioning, and it
was wrong on the evidence. "This task needs a judgement the executor's tier cannot make" is a real
distinction, and the plan is where you argue for it.

**The PM sits at executor tier, not Opus tier, deliberately.** The plan already assigned brand and
dispatch per task, so the PM's job is distribution and collection, not judgment. Paying Opus rates
to hand out briefs the plan already wrote is exactly the over-provisioning this office was revised
to stop. If a PM finds itself making routing decisions, **the plan was incomplete — that is a
`PLAN DEFECT`, not a reason to upgrade the PM.**

**Two floors, not one.** `opus` medium is the floor for the **code**-review gate. The **plan**-review
gate's floor is `opus` low. Both are stated here explicitly because
[delegation-map.md](../../references/delegation-map.md)'s "stricter rule wins" clause would otherwise
promote plan review to medium and quietly double its cost for no extra gate strength. A floor binds
the gate it was declared for.

**High is the ceiling. `xhigh`, `ultra`, and `max` are user-invoked only.** Never escalate an effort
tier or substitute a bigger model on your own initiative — not to be safe, not because a task looks
hard, not because the benchmark table shows a higher-scoring variant. If a task genuinely seems to
need more than the table gives it, that is a recommendation to surface, not a default to change.
Same for dropping below the table to save quota: recommend it, don't do it silently.

## Dispatch form (replaces the tier ladder)

No arithmetic. The form follows from who is dispatching whom:

| Who dispatches whom | Form | What the delegation buys |
|---|---|---|
| Planner → executor | **CLI, own worktree** | Isolation and unattended running |
| Planner → PM (≥2 executors only) | **CLI** | The same, plus parallel distribution |
| Executor → worker | **in-session / inline** | Reuse of the executor's live context — the value being spent |
| Executor → worker of a **different brand** | **CLI**, necessarily | The only exception in the table |
| Planner → itself, for a review fix or a change a delegation buys nothing for | **inline** | Nothing — which is the point |

**Every brand has a built-in in-session sub-agent mechanism.** The brief *prompts* the executor that
it may fan out; **it never prescribes how.** Sub-agent mechanics belong to the sibling office, exactly
like CLI mechanics — auto-office owns neither. A brief that tries to specify the mechanism is how the
last run shipped a task assignment that was impossible to execute as written.

Core's [delegation test](../../office-core/protocol/roles-and-authority.md) still governs *whether* to
delegate at all: a delegation must buy tier, isolation, or parallelism, and if it buys none of the
three, the work is done inline — by the planner, if that is who is holding it. The counterweight is
unchanged: **never collapse the task carrying the run's main correctness or security risk** into
inline work, because inline work gets no independent per-task review.

**Planner inline work never overlaps a live executor in that tree.** Before dispatch, or after the
handoff — never alongside. One writer per tree reads in both directions.

## Near-ties are not worth reasoning about

If two brands are the same tier and both fit, spend **at most one line**. Tiebreak ladder, cheapest
first:

1. **Live headroom** — who has room, per window.
2. **The operator's standing preference for codex.**
3. **Spread across brands**, so one window is not drained by a run that did not need to.

Then commit. A suboptimal-but-fitting brand costs at most one extra review round; deliberation costs
planner tokens on **every** task, and the code reviewer is the safety net either way.

**Disqualifier, checked before the ladder runs:** agy is not a near-tie candidate if its
3-consecutive-task cap is already spent, or if the task is a long chain. A tiebreak that ignores a
cap is how a cap gets broken by accident.

## Headroom is a cost, not a gate

**There is no hardcoded threshold.** Do not treat any percentage as an automatic veto. Read the
number, then reason about it explicitly:

- **What does the run actually need?** A three-task frontend plan does not consume what a
  multi-hour migration does. 14% left is plenty for one and nowhere near enough for the other.
- **What is lost by re-routing?** If the best-fit tool is meaningfully better for *this* work,
  spending scarce headroom on it can be the correct call — a cheaper route that produces work the
  reviewer rejects twice costs more than the quota did. Losing out is a real cost too.
- **When does it reset?** Headroom that resets in 14 hours is worth spending more freely than
  headroom that has to last six days.
- **Is anything else queued?** Do not drain a window this run needs only half of, if the user has
  said other work is coming.
- **Is there a cheap split?** Often the answer is neither "use it" nor "don't" — route the
  expensive tool at the two tasks that need it and hand the rest to a cheaper one.

Then **say the numbers and the reasoning out loud** in the kickoff line, e.g.
`codex 14% weekly (resets 9h; plan is 2 backend tasks — spending it, agy fallback if it stalls)`.
Report **each window with its reset time**, never a single-number delta: a probe that returns the
tightest of two windows will appear to *gain* headroom when the short window resets mid-run.

If a run drains the tool it is depending on mid-flight, that is a reroute, not a failure — but it
is a reroute you should have predicted, so predict it: name the fallback at plan time.

**A headroom reading of UNKNOWN (exit 2) is not the same as low.** It means the probe is broken or
the tool is not logged in. Treat it as *unavailable* unless the user says otherwise, say which
probe failed and why, and route around it — never spend a run discovering that a tool was never
usable.

## Per-task brand choice

The planner composes this into the plan, one row per task:
`# · task · brand · model+effort · dispatch · diagnosis · why`. The `model+effort` cell is pre-filled
from the table above and is expected to be uniform; a non-default value is a **caller override** and
is labelled as one.

The default, most cost-efficient shape:

```
agy scouts (parallel, read-only)  →  planner picks the approach
                                  →  codex or claude implements
                                  →  fresh Opus reviewer gates
```

Rules that make this safe:

- **Read-only fan-out is the delegation worth making.** Recon, "where is X", "does this pattern exist
  elsewhere", doc lookups: agy, in parallel, every time. N scouts finish in one scout's wall-clock.
- **Conversely, do not dispatch what the holder can already see.** A one-line fix, a rename, a config
  edit, applying a review finding just read — inline. **Brief quality is the real cost of a
  dispatch**, not tokens: a dispatched agent knows only what you wrote down, and half of all dispatch
  failures are a brief that omitted something the dispatcher knew and never said. If writing the
  brief takes more thought than the change, do the change.
- **Batch adjacent cheap edits.** Three tiny edits in the same file are one task, not three.
- **Never batch across the review gate.** Cheapness is not a reason to bundle unrelated changes into
  one reviewable unit; a diff the reviewer cannot reason about costs more than the batching saved.
- **A supervised sub-delegation is still one writer.** A worker inside an executor's tree does not
  make two.
- **A scout's answer is a claim, not a fact.** It returns file paths and line numbers so the caller
  can verify in one read. An unverifiable scout answer is discarded, not trusted.
- **Agy: 3 consecutive tasks, hard cap.** At the cap, either re-brief from scratch with full context
  restated, or hand the next task to codex/claude. Track the count.
- **Quick fixes may go to agy** — but the reviewer rubric then gains the agy miss-list below.
- **Two consecutive `CHANGES REQUIRED` on one task is a plan signal, not a routing signal.** Presume
  `PLAN DEFECT` and re-plan the task ([auto-loop](../auto-loop/SKILL.md)). There is no
  "escalate to a bigger model" path left, and there never really was one once the executor tier was
  already the best fit. Record `reroute_from` if the re-plan does change brand.
- **Never sub-delegate a `PLANNER-HELD` step.** Those stop the loop for the user.

### Agy miss-list — appended to the reviewer rubric whenever agy touched a task

The reviewer must explicitly check, with evidence, that agy did not:

- silently skip a listed requirement late in a multi-part task,
- report success on work it did not do (it exits 0 having done nothing),
- edit outside the files the brief named,
- drop error handling, loading/empty states, or a11y attributes it was told to include,
- leave a validation command unrun while claiming it passed,
- restate the plan's intent correctly while implementing something else.

## Reviewer selection

**Code review: fresh Opus, medium, by default, always.** The `codex-sol` reviewer path applies only
when **Codex is the planner** (i.e. a Codex session invoked this workflow), not merely when codex
executed. A caller may add a second opinion; a caller may not drop below the floor. **agy never holds
the code-review gate** — long, adversarial, multi-round work against a diff is its documented
weakness, and the miss-list is why.

**Plan review is a different gate**, held by the planner's own brand at that brand's plan-review row
above — including `agy` high when agy is the planner, which `agy-office/skills/agy-reviewer` permits
for **plan** review specifically (spoke paths:
[delegation-map.md](../../references/delegation-map.md)). Reading one document once, breadth-first, is
agy's documented strength. The two gates are separate on purpose; do not "fix" the asymmetry in
either direction.

## Keeping this current as models upgrade

The snapshot in [model-benchmarks.md](../../references/model-benchmarks.md) carries a
`captured` date and a staleness horizon. At routing time:

1. Read the `captured` date. If within the horizon, route from it.
2. If stale, refresh **before** routing: search Artificial Analysis for the Intelligence Index, the
   Coding Agent Index (harness + model pairs), and output tokens/sec, then rewrite the table's
   numbers, bump `captured`, and note what moved.
3. **If a refresh changes which tool holds a capability role, say so out loud** and route the new
   way. The roles are stable; their occupants are not.
4. **The snapshot selects brand only — never model or effort**, both of which are fixed by the table
   above. A leaderboard cannot promote an executor.
5. Local experience outranks a leaderboard where they conflict — the agy 3-task cap is observed
   behavior in this workspace and stays until observed otherwise.

Record `routing_reason`, `brand`, `dispatch_form`, `headroom_percent` per window, and
`benchmark_snapshot_date` in the run event, so a bad route is diagnosable later.

## Red Flags — routing edition

| Thought | Reality |
|---|---|
| "The plan looks fine, straight to the user" | Self-review, then the plan-reviewer. User approval is never spent on an unreviewed plan. |
| "One executor, so I'll spawn a PM to coordinate" | No PM below two executors. A PM with one executor is pure overhead. |
| "codex or claude, let me think it through" | Same tier, both fit: pick one and move. One line of reasoning, maximum. |

## Read the local ledger before the leaderboard

[routing-outcomes.md](../../references/routing-outcomes.md) records what routing actually cost in
**this** workspace, run by run. Read it before
[model-benchmarks.md](../../references/model-benchmarks.md): local outcomes outrank the public
leaderboard, because the leaderboard has never run your repo, your briefs, or your reviewer.
