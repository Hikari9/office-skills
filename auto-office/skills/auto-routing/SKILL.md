---
name: auto-routing
description: The discernment engine — which brand is the executor, which brand and tier each worker gets, how work is dispatched, and how the benchmark snapshot stays honest across model upgrades. Loaded by the auto-office hub; not invoked directly.
---

# Auto Routing

**The invoking model holds the core Planner role and is never auto-routed** ("orchestrator" below
names only its control-plane behavior, not a new role). In existing v2 it also drafts the plan
   directly for compatibility. The plan drafter remains optional and user-selectable; the current
   scout, executor, plan-review, and code-review defaults are explicit policy below.

### Orchestrator advice — not a route

The orchestrator is the user's entry pick, so nothing here selects it and no rule below applies to
it. This is advice for the human choosing where to type, recorded because it is asked repeatedly
(maintainer preference, 2026-09-10):

| Entry pick | When |
|---|---|
| **Gemini 3.7 low** | the standing preference — cheap, fast, and the control plane is dispatch and bookkeeping, not deep reasoning |
| **Luna xhigh** | a run that will argue with itself: contradictory requirements, gate disputes |
| **Astra low** | codex has headroom to spare and the run is codex-shaped anyway |
| **Sonnet high** | a long single-repo session where the orchestrator will also read a lot of code |

Never turn this table into a route. If the office ever *selects* an orchestrator, that is a v3
decision and this section is not it.

**Three existing decisions, all made at plan time, stay separate:**

1. **Which brand, slice, and worktree each executor lane gets** — one or more lanes per repo when
   the Planner's graph benefits from parallelism or independent coverage. Each lane owns its
   worktree and is the only writer there. Its model and effort are **fixed** by the table below.
2. **Which brand, model, and effort each worker gets** — per task. Routed by fit, and **not pinned
   to the executor's tier.** A worker may be a different brand, a bigger model, or both.
3. **How each unit of work is dispatched** — Herdr, CLI, in-session, or inline. **Derived**, not
   chosen: when `HERDR_ENV=1`, real delegations use Herdr; otherwise it follows from who is
   dispatching whom (see *Dispatch form* below).

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
| **Fast scout / bulk hand** | codex | Web search, docs research, codebase recon, high-volume mechanical edits | Medium Luna is the standing scout default; Gemini remains the unknown-usage fallback |

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

Pick from the ordered defaults, then exercise Planner discernment. CLI headroom is always probed during
fit-test ([quota-probe.md](../../references/quota-probe.md)) and immediately before launch. Usage,
availability, and launch history now weigh more than benchmark/task-fit scores; there is deliberately
no hardcoded percentage threshold:

```
caller named a brand?  → use it, echo the override, stop here

nominal executor/scout ladder:
    executor → gemini-3.8-flash-medium → claude-sonnet-5 high → gpt-5.6-luna xhigh
    scout    → gpt-5.6-luna medium → gemini-3.7-flash-low → claude-haiku low

then weigh current headroom, launchability, task shape, and local/public scores. Gemini remains the
preferred frontend model and the safe choice when usage cannot be measured. The Planner may select a
later rung when the earlier one has little remaining usage, is unavailable, or has repeatedly failed.
```

The operator's stated preference is **Claude Sonnet in general**, with codex or agy when the fit test
calls for them. That is a preference to honor, not a rule to apply blindly against fit.

## Model + effort per role

Not derived from the benchmark table, and a leaderboard movement does not change them.

| Role | claude | codex | agy | Fixed? |
|---|---|---|---|---|
| Planner (compatibility path — invoking session, drafts inline) | `opus` (invoking session) | `codex-luna` | `agy` | fixed for the existing same-call path |
| **Plan-reviewer** (full gear only) | Existing orchestrator/control-plane Planner's own route at `opus` **low** | `codex-luna` **xhigh** | `agy` **high** | unchanged; a dedicated plan drafter's choice does not override |
| **Phase 1 scout** | `haiku` **low** *(last fallback)* | **`gpt-5.6-luna` `medium`** *(nominal first pick)* | `gemini-3.7-flash-low` **low** *(nominal fallback)* | **ordered, usage-aware** |
| Executor | `sonnet` **high** *(rung 2)* | `gpt-5.6-luna` **xhigh** *(rung 3)* | **`gemini-3.8-flash-medium`** *(rung 1)* | **ordered, usage-aware** |
| Worker | `sonnet` high *default* | `gpt-5.6-luna` high *default* | Flash latest `high` *default* | **ANY brand/model/effort the Planner declares**, never above its dispatcher's tier |
| **Reviewer (code)** | `opus` **low** *(fallback)* | **`codex-luna` `xhigh` default, `high` floor — the standing default holder** | never reviews | **codex first, priced by blast radius; claude fixed at `opus` low** — see *Reviewer selection* |

## Phase 1 scout policy

Phase 1 scouts are a distinct read-only breadth role. They launch through the same dispatch contract as
executors: a visible Herdr pane when `HERDR_ENV=1`; otherwise same-brand scouts may use an in-session
child and cross-brand scouts use the brand CLI. They are fresh independent agents and may not write to
the target tree. They may not run above medium effort.

Resolve availability immediately before the fan-out:

1. **Nominal default:** use Codex `gpt-5.6-luna` at `medium`.
2. **Usage-safe/default-unknown path:** if usage cannot be measured, prefer Gemini
   `gemini-3.7-flash-low` at `low`; this is the safe default for an unknown quota state.
3. **Fallback path:** when the selected rung is unavailable, quota-exhausted, or has repeatedly
   failed, continue to Gemini low and then Claude `haiku` low. A single launch failure permits the
   next rung. If the Planner caused the failure through a malformed tool call, correct and retry the
   same rung instead. No scout may promote itself to planner, executor, reviewer, `high`, `xhigh`, or
   `max`.
4. Echo the usage/availability result, selected model, and effort in the kickoff line. Never omit the
   model or effort flag and allow a scout to inherit the orchestrator's settings.

## v2 dedicated plan-drafter policy

This is the only new routing surface in this ticket. It selects the plan-drafter call —
an added role, never the Planner itself — not the invoking orchestrator, executor, worker,
plan-reviewer, or code-reviewer. The full detector, prompt, contract, dispatch mechanics, and
serialized artifact are in [`planner-handoff.md`](../../references/planner-handoff.md).

`planner_mode=auto` is the default when no drafter override is supplied. After
the fit test, if a plan is needed and the detected orchestrator triple is not a
drafter candidate, prompt the user with `AskUserQuestion` — unless
`planner_isolation=required` was also given explicitly, which skips the prompt
and goes straight to dedicated resolution using the declared default (see
resolution step 3 below; the gap this closes is detailed in
[`planner-handoff.md`](../../references/planner-handoff.md)). When the prompt
runs: recommend **Opus Medium** first, with **Astra Low** as the stated
fallback, then offer **Fable 5.1**, **GPT-6 Astra**, or **inline**.
Family choices resolve to an exact declared effort; silence does not select
inline. No prompt is shown for direct (no-plan) work, a supported exact
triple, or an explicit caller override.

| Policy value | Harness | Model | Effort |
|---|---|---|---|
| **Default — unconditional** | `claude` | `opus-5` (Claude Opus 5) | `medium` |
| **Required fallback** *(default unavailable)* | `codex` | `gpt-6-astra` | `low` |
| Candidate | `claude` | `claude-fable-5.1` (Claude Fable 5.1) | `low` |
| Candidate | `claude` | `claude-fable-5.1` | `medium` |
| Candidate | `claude` | `claude-fable-5.1` | `high` |
| Candidate | `codex` | `gpt-6-astra` | `medium` |

**The default is flat: Opus 5 medium, always.** The previous conditional default — Astra Low when
the orchestrator's harness was `claude` and codex headroom was generous — is **revoked, 2026-09-10,
by maintainer decision.** Do not divert the plan draft to Astra because the orchestrator happens to
be a Claude model. Astra Low is the **fallback only**, reached when `claude/opus-5@medium` is
unavailable. Codex headroom is still probed as a cost input; it no longer selects the drafter. Full
rule: [`planner-handoff.md`](../../references/planner-handoff.md#v2-selection-policy).

**Draft the plan in a separate call whenever the orchestrator is a different model.** Reuse the
orchestrator's own planning step only when its canonicalized triple already *is* a declared
candidate and isolation allows it. v3 makes the separate drafter call the standing shape; v2 keeps
the reuse shortcut for compatibility.

This table mirrors the `planner_candidates` YAML in
[`planner-handoff.md`](../../references/planner-handoff.md#v2-selection-policy),
which is **canonical** — if the two ever disagree, that file wins and this
table is stale and must be updated to match.

Use the exact, **canonicalized** `harness/model@effort` triple — normalize launch
aliases and runtime/read-back strings (`opus`, `claude-opus-5` → `opus-5`) before
any equality check; see *Canonical model identity* in
[`planner-handoff.md`](../../references/planner-handoff.md). The default and
fallback are maintainer-owned v2 policy, not a score-based choice. An explicit
drafter triple is a caller override and must be echoed.

**The full 7-rule resolution order — including the `planner_isolation=required`
isolation-gap fix and where the no-duplicate-call reuse check folds in — is
defined once, canonically, in [`planner-handoff.md`](../../references/planner-handoff.md#v2-selection-policy).
Do not re-derive or re-state it here; a second copy is exactly the kind of
drift this note exists to prevent.** In short: `inline` never dispatches a
drafter; a supported/reused triple or an explicit override skips the prompt;
an unsupported/unknown triple prompts unless isolation was already required;
and dedicated resolution always terminates at a selected drafter — default,
then required fallback, then remaining candidates, then orchestrator-as-drafter
as the last resort. Record every failed attempt and its reason
(`not-installed`, `unauthenticated`, `unsupported-model`, `unsupported-effort`,
`quota-unavailable`, `launch-error`, or `planner-failure`). A preferred
drafter's failure never changes executor or reviewer routing.

The orchestrator kickoff, serialized handoff, run report, and routing outcome
record the detector verdict, plan-needed flag, orchestrator triple, prompt
visibility/choice, `planner_mode`, plan-drafter triple, `reused_from_orchestrator`,
`fallback_used`, and `fallback_reason`. Use the existing telemetry fields
`brand`, `model`, `effort`, and `dispatch_form` for the actual drafter call; do
not add executor/reviewer route fields here.

**The plan-reviewer's brand remains the existing orchestrator/control-plane Planner's own route** —
it is not selected by the v2 dedicated-plan-drafter policy. It reads one document the drafting step
just wrote; same-brand is an advantage there, not the conflict of interest it would be on a diff.
Executor and worker brand *is*
routed by fit, exactly as before.

**The executor is an ordered default ladder, with Planner discernment over usage and fit.** Standing
office default, updated 2026-09-11. The list is ordered, but there is no hardcoded usage threshold:
the Planner chooses Gemini whenever it has usable headroom or when usage is UNKNOWN, and may move to a
later rung when Gemini is nearly exhausted, unavailable, or repeatedly fails.

| # | Executor brand | Model + effort | Task cap | Status |
|---|---|---|---|---|
| **1** | **agy** | **`gemini-3.8-flash-medium`** | any number | default when usage is usable or UNKNOWN; fastest quality-preserving choice |
| **2** | **claude** | **`sonnet` high** | any number | fallback when Gemini usage is dire, unavailable, or repeatedly fails; stronger quality at higher latency |
| **3** | codex | **`gpt-5.6-luna` `xhigh`** | any number | final fallback when Gemini and Sonnet are unavailable or have repeatedly failed |

**Task shape no longer mechanically disqualifies Gemini.** Frontend, fullstack, and backend scores are
still considered, but usage/availability and the ordered defaults weigh more. Gemini remains the
preferred frontend executor; Sonnet is not a frontend override, only a usage/availability fallback.

**Launch failures and quota failures permit immediate fallback.** A malformed tool call caused by the
Planner is not an agent failure: repair the call and retry the same rung. Repeated agent failures,
quality failures, or a clearly dire remaining quota permit the Planner to move down the ladder, with
the reason recorded in the dispatch receipt and local outcomes.

Codex Luna is again an executor fallback at **xhigh**, and remains the plan/code review default.

Read the v4.3 index as supporting evidence, not as a mechanical selector. Gemini Flash is the
speed/quality default; Sonnet's local quality evidence and Luna's review strength remain relevant
when usage or repeated failures make a fallback necessary.

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
| Bulk mechanical edit, rename sweep, file-by-file application | `gemini-3.7-flash-low`, `haiku` | Index barely moves the outcome; speed and price do |
| Read-only recon, breadth-first search across many files | `gpt-5.6-luna` medium; Gemini low when usage is unknown or Luna is thin; Haiku last | N medium/low scouts beat one deep read |
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

**Two floors, declared separately, and per brand.** The default holder for both plan and code review
is Codex Luna xhigh. Claude Opus low is the only fallback. They remain separate declarations:
[delegation-map.md](../../references/delegation-map.md)'s "stricter rule wins" clause resolves
conflicting rules within one gate and never promotes one gate to the other's tier. Reviewer strength
comes from independence, freshness, and a pointed brief — not from effort tier.

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

When `HERDR_ENV=1`, load [`herdr`](../../office-core/skills/herdr/SKILL.md) and use `herdr` for every
real delegation before applying the table below. Direct children occupy right-side panes; further
children occupy panes below their parent. Record `herdr`, never `in-session`, for those dispatches.
Inline work remains inline. When Herdr is absent, the table below is unchanged.

| Who dispatches whom | Form | What the delegation buys |
|---|---|---|
| Any real delegation while `HERDR_ENV=1` | **Herdr pane** | Visible topology, prompt/read/wait control, and no hidden in-session child |
| Planner → dedicated **plan drafter**, **Phase 1 only, `planner_mode=dedicated`** | **CLI, own worktree scoped to `docs/plans/<slug>.md`** — see *Dispatch mechanics* in [`planner-handoff.md`](../../references/planner-handoff.md) | A different model call producing the draft, with no gate and no write access outside the plan artifact |
| Planner → executor lane, **one or more per repo** | **CLI, own worktree** | Isolation, unattended running, parallel wall-clock progress, and a ~6× cheaper writer holding its reviewed plan slice |
| Planner → code reviewer | **CLI / fresh agent** | Independence — the executor may never launch its own gate |
| Planner → read-only scout, **Phase 1 only** | **Herdr pane when available**; otherwise same-brand in-session or cross-brand CLI. Nominally Codex `gpt-5.6-luna` medium → Gemini `gemini-3.7-flash-low` → Claude `haiku` low; UNKNOWN usage prefers Gemini | Breadth before a plan or an executor exists |
| Executor → worker | **in-session / inline** | Reuse of the executor's live context — the value being spent |
| Executor → worker of a **different brand** | **CLI**, necessarily | The only exception in the table |
| Planner → itself, for a review fix **whose brief would exceed the edit** | **inline** | Nothing — which is the point |
| ~~Planner → worker for a numbered task~~ | **does not exist** | Nothing. This row is absent deliberately: it is the drift this table is written to prevent |

**There is no row for the planner dispatching task-by-task, and there never was.** If you are about
to launch a process for task *n* of an approved plan, you are executing the executor's job at opus
rates. The planner *designs* every task's dispatch form in the assignment table, with a reason; the
executor *performs* every one of them.

**At ≥2 executor lanes the Planner distributes, monitors, and collates.** There is no coordinator
role. The run that spawned one recorded it dispatching three lanes for about an hour, after which
every lane was a single process the planner drove directly — so the role was deleted rather than
repaired. That does not limit the number of declared executor lanes; it only keeps the Planner as
the owner of the graph and arrival-order collation.

### Planner-owned executor graph

The Planner is the scheduler for executor lanes, not a passive router. Before approval, engineer the
task graph for wall-clock time and effectiveness coverage: identify independent slices, the evidence
each slice must produce, the dependencies that block it, and the integration order. A repo may have
one lane or several; the count is a graph decision, never a per-repo quota.

Every lane in the approved plan names its repository, lane id, exact task slice, `Depends on:`,
`Touches:`, branch, dedicated worktree, handoff path, validation commands, and integration target.
Two lanes targeting the same repo are valid only when they use separate worktrees and branches;
one writer per worktree remains binding. If the graph cannot keep their writes independent, merge the
slices before dispatch or serialize them.

Dispatch every ready lane after approval. As handoffs arrive, the Planner collates the first eligible
result instead of waiting for the slowest sibling, then verifies and reviews that slice before
integrating it or unlocking its dependents. Arrival order never overrides a dependency, a `Touches:`
conflict, or the independent review gate. Executors may not edit sibling worktrees, merge lanes, or
choose which result wins; the Planner owns collation and integration.

### State the effort flag explicitly on every CLI launch

**`--model` alone is not the assignment.** This table fixes *model and effort* per role; a launch
passing only `--model sonnet` silently runs at the CLI's default (medium), so the plan says high and
the process runs medium, and nothing in the output says so.

```bash
# claude
--model sonnet --effort high      # executor (ladder rung 2)
--model opus   --effort low       # code reviewer (fallback holder)
--model opus   --effort low       # plan reviewer
--model haiku  --effort low       # Phase 1 scout fallback
--model sonnet --effort low       # Phase 1 scout fallback, if chosen

# codex — there is NO --effort flag; effort is a config override
-m gpt-5.6-luna -c model_reasoning_effort="xhigh"   # executor (ladder rung 3, fallback)
-m gpt-5.6-luna -c model_reasoning_effort="xhigh"   # code reviewer, standing default; "high" for a low-blast-radius leg
-m gpt-5.6-luna -c model_reasoning_effort="xhigh"   # plan reviewer
-m gpt-5.6-luna -c model_reasoning_effort="medium"  # Phase 1 scout default

# agy — the effort is encoded in the resolved slug
--model "gemini-3.8-flash-medium"                    # executor (ladder rung 1)
--model "gemini-3.7-flash-low"                      # Phase 1 scout fallback
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

### Probe headroom immediately before every scout, executor, or reviewer launch

**A fit-test reading is not current by the time task 3 dispatches.** Immediately before each
executor or reviewer launch, run that one brand's probe again — bare invocation, one HTTP call
([quota-probe.md](../../references/quota-probe.md)):

```bash
python3 auto-office/scripts/<brand>-usage.py
```

If the number moved enough to change the earlier reasoning (a window reset, a sibling run spent it,
it crossed into UNKNOWN), say so and re-decide before launching — don't launch on the fit-test
number by default.

### Anything with a blocking wait goes to a background process, or you keep it

An in-session Agent-tool subagent **returns to its caller every time it stops having live children**.
So a delegate that must sit through a long command — a deploy, a watch, a slow verifier — returns
mid-task with the work unfinished, and its "I'll report back when it lands" is a *return*, not an
update. Observed on an ordinary worker: a subagent told to apply, clear cache and read back a
deployment spent 63k tokens, armed a monitor, said it would report back, and stopped. Nothing was
watching; the planner re-ran every step itself.

**The test is whether the work contains a blocking wait**, not whether the role sounds like a
watcher. Route those to a `--bg` process that owns its own event loop, or hold them yourself. When
`HERDR_ENV=1`, the Herdr agent pane owns the wait and remains visible until the final result is read;
do not replace it with an in-session child.

**A sub-agent never outranks its dispatcher: same tier or lower, never higher.** A worker the
planner declared at `opus` may fan out to `opus` or below; a `sonnet` executor's children top out
at `sonnet`. Tier is bought at plan time, in the task table, by the planner — a running agent
buying itself a bigger child is the same self-escalation the ceiling rule forbids, just one level
down where nobody is looking. If a child genuinely needs more than its parent has, that is a
`PLAN DEFECT` to surface, not a launch to make.

**Every brand has a built-in in-session sub-agent mechanism**, but it is not used when `HERDR_ENV=1`.
In that environment the [Herdr skill](../../office-core/skills/herdr/SKILL.md) owns the pane split,
agent start, prompt, wait, read, and cleanup mechanics. When Herdr is absent, the brief *prompts* the
executor that it may fan out; **it never prescribes how.** Sub-agent mechanics otherwise belong to the
sibling office, exactly like CLI mechanics — auto-office owns neither.

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
2. **The operator's standing preference for claude.**
3. **Spread across brands**, so one window is not drained by a run that did not need to.
4. **Still tied? Take claude.** A ladder with no terminal rung is an invitation to deliberate, which
   is the exact cost this section exists to refuse.

Then commit. A suboptimal-but-fitting brand costs at most one extra review round; deliberation costs
planner tokens on **every** task, and the code reviewer is the safety net either way.

**Disqualifier, checked before the ladder runs:** agy is not a near-tie candidate if its
3-consecutive-task cap is already spent, or if the task is a long chain. A tiebreak that ignores a
cap is how a cap gets broken by accident.

## Headroom is a cost, not a gate — probed at fit-test and before every dispatch

**CLI headroom is ALWAYS probed at fit-test, and again immediately before every scout, executor, or
reviewer dispatch** ([quota-probe.md](../../references/quota-probe.md)). Fit-test probes all three
brands, before planning or routing begins; a pre-dispatch probe checks only the brand about to
launch. Each is one cheap HTTP call — there is no cost excuse to skip the second checkpoint, and a
fit-test reading is not valid evidence for a dispatch that happens after other tasks already spent
that window.

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
- **What tier is the account on?** `claude-usage.py`/`codex-usage.py` report a `tier` field
  (`Max`/`Pro`/`Team`/…) next to the percent. The percent is already tier-normalized — the vendor
  computes `utilization` against that account's own limit, so 56% left means the same thing to
  reason about on any tier — but state the tier in the kickoff line anyway: it's the fact that
  explains why two runs on two accounts behave differently at the same reading.

Then **say the numbers and the reasoning out loud** in the kickoff line, e.g.
`codex TEAM 14% weekly (resets 9h; task plan is 2 backend tasks — spending it, agy fallback if it
stalls)`. Report **each window with its reset time**, never a single-number delta: a probe that
returns the tightest of two windows will appear to *gain* headroom when the short window resets
mid-run.

If a run drains the tool it is depending on mid-flight, that is a reroute, not a failure — but it
is a reroute you should have predicted, so predict it: name the fallback at plan time.

**A headroom reading of UNKNOWN (exit 2) is not the same as low.** It means the probe is broken or
the tool is not logged in. Record which probe failed and why, but prefer Gemini as the safe default
while it remains launchable. A real launch/quota/repeated-failure signal permits fallback; a malformed
Planner tool call is corrected and retried at the same rung.

## Per-task brand choice

The planner composes this into the plan, one row per task:
`# · task · brand · model+effort · dispatch · diagnosis · why`. The `model+effort` cell is pre-filled
from the table above and is expected to be uniform; a non-default value is a **caller override** and
is labelled as one.

The default, most cost-efficient shape:

```
  Luna medium scouts (parallel, read-only)  →  planner picks the approach
                                  →  Gemini medium / Sonnet high / Luna xhigh implements
                                  →  fresh Luna xhigh reviewer gates (Opus low fallback)
```

Rules that make this safe:

- **Read-only fan-out is the delegation worth making.** Recon, "where is X", "does this pattern exist
  elsewhere", doc lookups: Codex `gpt-5.6-luna` medium by default, Gemini `gemini-3.7-flash-low`
  when usage is unknown or Luna is thin, then Claude `haiku` low. N fresh scouts finish in parallel.
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

**Code review: fresh `codex-luna` at `xhigh` by default; fresh `opus` at `low` as the fallback.**
Standing office default, set 2026-09-10 — Luna at the gate is where this office has consistently
gotten its money's worth, and it is the same model the executor ladder just dropped precisely
because reviewing and implementing are different jobs. Take the Opus low fallback when codex is
unavailable (not installed, unauthenticated, out of quota, launch failure), when the caller names
claude, or when the reviewer must be a different brand from an executor that was itself codex.
Whichever brand holds the chair, the reviewer is **fresh** and **independent of whoever wrote the
diff**. A caller may add a second opinion; a caller may not drop below the holding brand's floor.
**agy never holds the code-review gate** — long, adversarial, multi-round work against a diff is
its documented weakness, and the miss-list is why.

### Review effort is priced per leg, by blast radius

**Standing user decision, 2026-08-29.** Applies to the **code**-review gate on the **codex** route
— which is, since 2026-09-10, the default route for that gate rather than the Codex-as-planner
exception. Measured on the campus-fence run: an executor leg cost ~226k-269k tokens and one `xhigh` code
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
5. Local experience outranks a leaderboard where they conflict. The old Agy-first executor rule is
   superseded here by the explicit Gemini-first maintainer decision; sibling Agy Office constraints
   remain owned by that office.

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
