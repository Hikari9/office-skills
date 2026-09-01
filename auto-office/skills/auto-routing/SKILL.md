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

Decisions 1 and 2 stay separate because they differ in kind. The executor holds the tree for the whole
run, so pinning it makes cost predictable and authority singular. A worker is a bounded, supervised,
single-question spend, so buying it a higher tier is cheap and reviewable. Core requires the split too:
its [delegation test](../../office-core/protocol/roles-and-authority.md) says a delegation must buy
**tier, isolation, or parallelism** — pin workers to the executor's tier and "buys tier" is dead.

**The planner assigns; the executor executes the assignment.** Reality disagreeing with it — the brand
cannot do this, the file does not exist, the stated cause is false — is a `PLAN DEFECT` or
`BRIEF DEFECT`, never a licence to re-decide routing. The decision lives in the plan so a bad route is
reviewable before it is paid for.

**An uncoordinated worker is never a second writer.** The one narrow exception is an Executor-owned
Tester writing only disjoint test/config paths under `office-core/protocol/tester-worker.md`, with
the shared Git lock and explicit pathspec commits. All other fan-out returns an artifact for the
Executor to apply or uses a separate worktree.

## Route by capability role, not by model name

Model names churn. These roles do not. Read
[model-benchmarks.md](../../references/model-benchmarks.md) for the numbers currently backing each
row, and refresh it when stale — never route from memory of a leaderboard.

| Capability role | Current best tool | What it is for | Known failure mode |
|---|---|---|---|
| **Decider** | claude (Opus) | Plans, arbitration, gate-holding, resolving contradictions, ambiguous cross-cutting work | Slow and expensive per token — spend it on decisions, not typing |
| **Backend builder** | codex | Backend, data, migrations, infra, refactors, long-horizon implementation | Weekly quota is finite — price it in, don't ignore it |
| **Fast scout / bulk hand** | agy | Web search, docs research, codebase recon, high-volume mechanical edits, frontend/UI | Drifts off-instruction past 3 chained tasks — a hard cap, not an estimate; can be confidently wrong and internally consistent |

Agy's weakness is **duration**, not capability. So give it breadth, never depth: many parallel
single-shot tasks, each returning a cheaply verifiable artifact. Give claude the opposite shape —
one long chain where holding context is the value.

**Breadth-fit is the wrong axis when the deliverable is EVIDENCE.** Before routing on shape, ask
what the task actually produces. A task that ships *tests, gates, verifiers, or migrations* is
judged by whether it can FAIL correctly — and a brand that writes plausible code writes equally
plausible tests, which are worthless in a way working code is not. Route those to the strongest
brand available regardless of how broad or short the task looks; "frontend" and "mechanical" do
not override it. Measured 2026-08-08: an agy frontend lane produced working blocks and 79 harness
checks that passed against deliberately broken code. The bad *evidence* — not the code — cost two
review rounds, and the fix lane sent to repair it introduced two page-blanking blockers of its own.

## Brand selection

Pick on **fit** first. CLI headroom is always probed during fit-test ([quota-probe.md](../../references/quota-probe.md)); weigh it as a cost afterwards, never as a gate:

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
| Planner | `opus` (the session) | `codex-luna` | `agy` | fixed |
| **Plan-reviewer** (full gear only) | `opus` **low** | `codex-luna` **xhigh** | `agy` **high** | fixed |
| Executor | `sonnet` **high** | **`gpt-5.6-luna` `high`** | **Flash latest `high`** | **fixed** |
| Worker | `sonnet` high *default* | `gpt-5.6-luna` high *default* | Flash latest `high` *default* | **ANY brand/model/effort the planner declares** |
| Reviewer (code) | `opus` **low** | `codex-luna` **xhigh** default, **`high`** floor *(only when codex is planner)* | never reviews | claude fixed; **codex priced by blast radius** — see *Reviewer selection* |

**The plan-reviewer's brand is always the planner's brand** — it is not routed by fit. It reads one
document the planner just wrote; same-brand is an advantage there, not the conflict of interest it
would be on a diff. Executor and worker brand *is* routed by fit.

**The executor is sonnet-tier, high effort — with one standing per-brand default set by the user.**

| Executor brand | Model + effort | Status |
|---|---|---|
| claude | `sonnet` high | office default |
| agy | **Flash latest** `high` | office default; resolve with `agy-office/scripts/agy-model.sh` |
| **codex** | **`gpt-5.6-luna` `high`** | **standing user default, set 2026-08-26** |

**Effort goes to the gates, not to the implementation** (standing user decision, 2026-08-26). The
codex executor sits at `high` while the codex **plan**-review gate sits at `xhigh` — the inverse of
where this office started. The reasoning is the one already on record below: a bigger executor does
not fix a wrong brief, it implements it more convincingly, so effort buys more at the gate that
catches the wrong brief than at the process producing it. Codex **code** review keeps `xhigh` as its
default for the same reason, but since 2026-08-29 its floor is `high` and the leg's blast radius
picks between them (*Reviewer selection*).

Read the index before treating either number as a ranking. Luna is **52 / 50 / 47** across
max / xhigh / high, so the executor gives up 3 points and the plan reviewer gains 3. A code review
priced at `high` sits level with the executor, which is the point of pricing it. Both remain far under
Terra max's **55**, at **$0.17/M vs $0.73/M** — the whole codex row is a deliberate cost-and-speed
trade the user owns. Do not "correct" any of it mid-run, and do not cite it as licence to raise
anything else.

Both are **caller overrides made durable**, not self-escalations. That is the one legitimate way a
non-`high` effort becomes a default, since the ceiling rule below binds the *office*, never the user.

No self-escalation beyond these, no exception without a caller override. Evidence: on the run that produced this rule both green-but-useless tests the
reviewer caught were written by the *bigger* model, and the largest line item was three rounds fixing
a task whose brief was wrong. A bigger executor does not fix a wrong brief; it implements it more
convincingly.

**Workers are routed, not pinned, and the planner may assign ANY mix — brand, model, and effort,
independently, per task.** This is the one place in the office where the full catalog is open. A
worker may be *below* the executor's tier (`haiku` for a mechanical sweep), *above* it (`opus` for an
arbitration), or a different brand entirely (`gpt-5.6-luna` high for a long backend chain while a
`sonnet` executor drives). A plan whose every worker is the executor's tier has usually not thought
about it.

**Match the model to the kind of question, using the AA Intelligence Index as the axis** — the live
figures are in [model-benchmarks.md](../../references/model-benchmarks.md), and this is what the
`Model+effort` cell is arguing about:

| Kind of sub-task | Reach for | Because |
|---|---|---|
| Bulk mechanical edit, rename sweep, file-by-file application | `haiku`, Flash latest `low` | Index barely moves the outcome; speed and price do |
| Read-only recon, breadth-first search across many files | Flash latest `high` | Highest index available at flash speed — N in parallel beat one deep read |
| Ordinary implementation inside a clear brief | executor's own tier | The default; a bigger model implements a wrong brief more convincingly |
| Long backend/data chain, terminal-heavy | `gpt-5.6-luna` high (47) or `gpt-5.6-terra` (55) | Agentic-coding strength and per-token price, not raw index |
| Arbitration, conflicting invariants, unconfirmed diagnosis | `opus` high (59) | A different *kind* of question — the only case that reliably repays the tier |

**Effort is a real axis, not a synonym for "try harder", and the index is where you read it.** Within
one model the index moves with effort — Gemini 3.7 Flash is **56 / 53 / 51** across high / medium /
low, Luna is **52 / 50 / 47** across max / xhigh / high. Those figures pin a snapshot; the slug
never is — agy has no `latest` alias, so resolve Flash latest at dispatch. Two consequences the office keeps getting
wrong: a cheaper model at high effort often outscores a pricier one at low, so brand-then-effort is
the wrong order to decide in; and **effort does not always rise monotonically with the flag name** —
Luna *max* (52) outscores Luna *xhigh* (50). Read the table; do not infer from the label.

Three conditions on any worker that is not the executor's default, all binding:

- **Declared in the plan's task table** (`Model+effort` cell) before approval. A declared Opus worker
  is fine; an undeclared one is not, whatever tier it is — the defect was invisibility, not size.
- **Recorded in telemetry** (`brand`, `model`, `effort` per dispatch) and in the closeout
  retrospective, so the next run can see whether the upgrade paid.
- **Never self-escalated at run time.** An executor promoting its own worker mid-task is a
  `PLAN DEFECT` to surface, not a call to make.

**Reach for a bigger worker for a *different kind* of question, never a harder-looking one.** "This
task is hard" produced the last run's silent over-provisioning. "This needs a judgement the executor's
tier cannot make" is the real distinction, and the plan is where you argue it.

**Two floors, declared separately.** `opus` low is the floor for the **code**-review gate, and
`opus` low is the floor for the **plan**-review gate. They coincide today but remain two
declarations: [delegation-map.md](../../references/delegation-map.md)'s "stricter rule wins" clause
resolves conflicting rules *within* one gate and never promotes one gate to the other's tier. A floor
binds the gate it was declared for. Reviewer strength comes from independence, freshness, and a
pointed brief — not from effort tier.

**High is the ceiling *for the office*. `xhigh`, `ultra`, and `max` are user-invoked only** — which
is exactly what the codex reviewers' standing `xhigh` default is: user-invoked once, durably, and
recorded above with its date. A standing default set by the user is not a counter-example to this
rule; a planner reaching for `xhigh` on its own initiative still is. Never escalate an effort
tier or substitute a bigger model on your own initiative — not to be safe, not because a task looks
hard, not because the benchmark table shows a higher-scoring variant. If a task genuinely seems to
need more than the table gives it, that is a recommendation to surface, not a default to change.
Same for dropping below the table to save quota: recommend it, don't do it silently. Blast-radius
pricing of the **codex code-review gate** (*Reviewer selection* below) is not a counter-example: the
user re-declared that gate's floor at `high` on 2026-08-29, so `high` is *on* the table for a
low-blast-radius leg rather than below it, and the choice is made by what a miss would cost, never by
remaining quota.

## Dispatch form (replaces the tier ladder)

No arithmetic. The form follows from who is dispatching whom:

| Who dispatches whom | Form | What the delegation buys |
|---|---|---|
| Planner → executor, **one per repo, whole plan** | **CLI, own worktree** | Isolation, unattended running, and a ~6× cheaper writer that already holds the reviewed plan |
| Planner → code reviewer | **CLI / fresh agent** | Independence — the executor may never launch its own gate |
| Planner → read-only scout, **Phase 1 only** | **CLI, `agy` by default**; if agy is unavailable, the planner's own brand at its **lower** tier (`haiku` in-session for claude, `gpt-5.6-luna` for codex) — **never planner tier** | Breadth before a plan or an executor exists |
| Executor → worker | **in-session / inline** | Reuse of the executor's live context — the value being spent |
| Executor → worker of a **different brand** | **CLI**, necessarily | The only exception in the table |
| Planner → itself, for a review fix **whose brief would exceed the edit** | **inline** | Nothing — which is the point |
| ~~Planner → worker for a numbered task~~ | **does not exist** | Nothing. This row is absent deliberately: it is the drift this table is written to prevent |

**There is no row for the planner dispatching task-by-task, and there never was.** If you are about
to launch a process for task *n* of an approved plan, you are executing the executor's job at opus
rates. The planner *designs* every task's dispatch form in the assignment table, with a reason; the
executor *performs* every one of them.

**At ≥2 executors the planner distributes and monitors.** There is no coordinator role. The run that
spawned one recorded it dispatching three lanes for about an hour, after which every lane was a
single process the planner drove directly — so the role was deleted rather than repaired.

### State the effort flag explicitly on every CLI launch

**`--model` alone is not the assignment.** This table fixes *model and effort* per role; a launch
passing only `--model sonnet` silently runs at the CLI's default (medium), so the plan says high and
the process runs medium, and nothing in the output says so.

```bash
# claude
--model sonnet --effort high      # executor
--model opus   --effort low       # code reviewer
--model opus   --effort low       # plan reviewer

# codex — there is NO --effort flag; effort is a config override
-m gpt-5.6-luna -c model_reasoning_effort="high"   # executor
-m gpt-5.6-luna -c model_reasoning_effort="xhigh"    # code reviewer (codex-as-planner); "high" for a low-blast-radius leg
-m gpt-5.6-luna -c model_reasoning_effort="xhigh"    # plan reviewer
```

**The codex form is the one this rule was written for.** Verified 2026-08-25: no office was passing
`-c model_reasoning_effort=` at all, so every `codex exec` dispatch inherited
`model_reasoning_effort` from `~/.codex/config.toml` — `medium` on the machine checked — while the
role tables said `xhigh`. `-m` alone is not the assignment either. Mechanics stay with the brand:
[`codex-office/skills/codex-cli`](../../../codex-office/skills/codex-cli/SKILL.md).

Treat a missing effort flag as a defect in the dispatch, not a detail. Read the launched agent's
actual model **and** effort back before reporting a dispatch, exactly as you would read back a
live-system write — for codex that is the launch banner's `model:` / `reasoning effort:` lines,
which echo an unrecognised value rather than rejecting it.

### Anything with a blocking wait goes to a background process, or you keep it

An in-session Agent-tool subagent **returns to its caller every time it stops having live children**.
So a delegate that must sit through a long command — a deploy, a watch, a slow verifier — returns
mid-task with the work unfinished, and its "I'll report back when it lands" is a *return*, not an
update. Observed on an ordinary worker: a subagent told to apply, clear cache and read back a
deployment spent 63k tokens, armed a monitor, said it would report back, and stopped. Nothing was
watching; the planner re-ran every step itself.

**The test is whether the work contains a blocking wait**, not whether the role sounds like a
watcher. Route those to a `--bg` process that owns its own event loop, or hold them yourself.

**Every brand has a built-in in-session sub-agent mechanism.** The brief *prompts* the executor that
it may fan out; **it never prescribes how.** Sub-agent mechanics belong to the sibling office, exactly
like CLI mechanics — auto-office owns neither. A brief that tries to specify the mechanism is how the
last run shipped a task assignment that was impossible to execute as written.

Core's [delegation test](../../office-core/protocol/roles-and-authority.md) still governs *whether* to
delegate at all: a delegation must buy tier, isolation, or parallelism, and if it buys none of the
three, the work is done inline. **The operative test, since a CLI dispatch technically always buys
isolation: if writing the brief takes more thought than making the change, the delegation buys
nothing — do the change.** That is the discriminator; "it could be isolated" is not one — by the planner, if that is who is holding it. The counterweight is
unchanged: **never collapse the task carrying the run's main correctness or security risk** into
inline work, because inline work gets no independent per-task review.

**Planner inline work never overlaps a live executor in that tree.** Before dispatch, or after the
handoff — never alongside. One independent implementation writer per tree reads in both directions;
the coordinated Executor-owned Tester is the only core-defined exception.

## Near-ties are not worth reasoning about

If two brands are the same tier and both fit, spend **at most one line**. Tiebreak ladder, cheapest
first:

1. **Live headroom** — who has room, per window.
2. **The operator's standing preference for codex.**
3. **Spread across brands**, so one window is not drained by a run that did not need to.
4. **Still tied? Take codex.** A ladder with no terminal rung is an invitation to deliberate, which
   is the exact cost this section exists to refuse.

Then commit. A suboptimal-but-fitting brand costs at most one extra review round; deliberation costs
planner tokens on **every** task, and the code reviewer is the safety net either way.

**Disqualifier, checked before the ladder runs:** agy is not a near-tie candidate if its
3-consecutive-task cap is already spent, or if the task is a long chain. A tiebreak that ignores a
cap is how a cap gets broken by accident.

## Headroom is a cost, not a gate — probed always during fit-test

**CLI headroom is ALWAYS probed during fit-test** ([quota-probe.md](../../references/quota-probe.md))
before planning or routing begins. It gives the planner live measurements across codex, claude, and
agy before committing to a route.

**There is no hardcoded threshold, and there will not be one.** Even though headroom is always probed,
this is a case-by-case trade-off the planner discerns and states; it is not delegated to a number. The
question to answer out loud:

> **Is it worth running this in a low-threshold agent if quality will be massively lost otherwise?**

If the answer is no, spend the scarce headroom. Read the number, then reason about it explicitly:

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
- **Live-system work is delegated WITH its access, never kept because a delegate "can't reach it".**
  Enumerate the MCP/API tools the task needs in the launch — the scoped allowlist form omits every
  MCP tool unless you name it, which is a dispatch bug that has been misread as a capability limit.
  **Production reads are included**: the true shape of a record frequently exists only in production,
  and a delegate reasoning from a preview fixture that does not match it is the failure being fixed.
  Then pin the shape in the brief and require a read-back — access is the cheap half, shape is the
  half that actually goes wrong. Core:
  [`evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md).
- **Conversely, do not dispatch what the holder can already see.** A one-line fix, a rename, a config
  edit, applying a review finding just read — inline. **Brief quality is the real cost of a
  dispatch**, not tokens: a dispatched agent knows only what you wrote down, and half of all dispatch
  failures are a brief that omitted something the dispatcher knew and never said. If writing the
  brief takes more thought than the change, do the change.
- **Batch adjacent cheap edits.** Three tiny edits in the same file are one task, not three.
- **Never batch across the review gate.** Cheapness is not a reason to bundle unrelated changes into
  one reviewable unit; a diff the reviewer cannot reason about costs more than the batching saved.
- **A supervised sub-delegation is still one writer unless it is the coordinated Tester exception.**
  A Tester inside an Executor's tree is allowed only under the core contract's path ownership and
  Git-lock rules.
- **A scout's answer is a claim, not a fact.** It returns file paths and line numbers so the caller
  can verify in one read. An unverifiable scout answer is discarded, not trusted.
- **Agy: 3 consecutive tasks, hard cap.** At the cap, either re-brief from scratch with full context
  restated, or hand the next task to codex/claude. Track the count.
- **Quick fixes may go to agy** — but the reviewer rubric then gains the agy miss-list below.
- **Two `CHANGES REQUIRED` on one task — consecutive or not — is a planner disposition signal, not a
  routing signal.** Reflect on whether another fix/review round is expected to converge before
  choosing `FIX_AND_REVIEW`, `PLAN DEFECT`, `WAIVE_AND_STOP`, or `STOP` ([auto-loop](../auto-loop/SKILL.md)).
  Record `reroute_from` only if the planner's disposition and amended plan actually change brand.
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

**Code review: fresh Opus, low, by default, always.** The `codex-luna` reviewer path applies only
when **Codex is the planner** (i.e. a Codex session invoked this workflow), not merely when codex
executed. A caller may add a second opinion; a caller may not drop below the floor. **agy never holds
the code-review gate** — long, adversarial, multi-round work against a diff is its documented
weakness, and the miss-list is why.

### Review effort is priced per leg, by blast radius

**Standing user decision, 2026-08-29.** Applies to the **code**-review gate on the **codex** route
only. Measured on the campus-fence run: an executor leg cost ~226k-269k tokens and one `xhigh` code
review of it cost **293k** — the gate outspent the work it gated.

| Blast radius of the leg | Code-review effort |
|---|---|
| A shared library imported estate-wide; a reconciler writing Order-0 denies or Auth rows; anything production-facing, irreversible, or externally visible | `codex-luna` **`xhigh`** — the standing default |
| Docs, evidence-checking, applied-state claims the planner can mechanically verify with a `git grep` plus a `--dry-run` | `codex-luna` **`high`** — the re-declared floor |

**Row 1 wins on any match**, and a leg you cannot confidently price is row 1. Both clauses fail
upward on purpose: this plugin ships publicly, so a docs change here satisfies row 2 *and* row 1's
"externally visible", and the saving is only ever meant to reach a leg that is unambiguously cheap
to get wrong.

Scope, precisely: the codex **code**-review floor was re-declared from `xhigh` to `high` for this
([delegation-map.md](../../references/delegation-map.md)). The codex **plan**-review floor is
untouched at `xhigh` — standing lesson 3 records plan review as the best-value item in every run that
has one. `claude` is untouched at `opus` low, already its floor, so no claude gate is repriced and
`xhigh` on one remains user-invoked only.

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

6. **Model slugs are resolved, never written down.** agy publishes no `latest` alias, so
   `agy-office/scripts/agy-model.sh` resolves Flash latest at dispatch. A slug in prose is pinned to
   the day it was written — this office once named four Gemini versions across four files.

The run event records `routing_reason`, `brand`, and `dispatch_form` automatically; the
`SessionEnd` hook writes it from the transcript, so a bad route stays diagnosable without anyone
remembering to log it.

## Red Flags — routing edition

| Thought | Reality |
|---|---|
| "The plan looks fine, straight to the user" | Self-review always; in **full**, the plan-reviewer too. User approval is never spent on an unreviewed plan. |
| "Three executors — I'll spawn something to coordinate" | There is no coordinator. You distribute and you monitor. |
| "codex or claude, let me think it through" | Same tier, both fit: pick one and move. One line of reasoning, maximum. |
| "This task calls Rock, so I'll keep it myself" | Delegate it with the Rock tools named in the launch. Withholding access is a dispatch bug. |
| "Preview data is close enough for the shape" | It routinely is not. Read production, pin the shape, require the read-back. |

## Read the local ledger before the leaderboard

[routing-outcomes.md](../../references/routing-outcomes.md) records what routing actually cost in
**this** workspace, run by run. Read it before
[model-benchmarks.md](../../references/model-benchmarks.md): local outcomes outrank the public
leaderboard, because the leaderboard has never run your repo, your briefs, or your reviewer.
