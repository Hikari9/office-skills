# Routing discernment — how many agy runs, and why

The planner is the **discerner**. Nobody downstream can fix a bad routing decision: an `agy` run may
escalate its own rigor, but it cannot step down or widen its scope, so the shape you choose in Phase 1
is the one the run pays for.

Optimize in this order: **effectiveness first, then the cheapest shape that still delivers it.**
Cheap-and-wrong is the most expensive outcome available — a run that ships a defect costs another whole
run. Never trade away the reasoning tier on the task that carries the risk.

**The structural difference from `claude-office`:** an `agy` run has no in-session subagents and does
not review itself per task. There are only three places work can land:

| Landing spot | What it is |
|---|---|
| **INLINE** | The planner edits it directly. No brief, no dispatch. |
| **One agy dispatch** | An `agy --print` run scoped to a slice of the plan, at a chosen model. |
| **PLANNER-HELD** | Kept out of every brief; the planner runs it after the gate, or the user does. |

So "how many agents" means **how many `agy` dispatches**, and the default is *one for the whole plan*.
Splitting the plan across several agy runs is the exception you have to justify.

This file is a method, not a lookup table. Derive the answer for the plan in front of you.

## The one test

> **A second agy dispatch must buy something the first run's own context cannot provide.**

There are only three things it can buy:

| Purchase | You are buying | Signal |
|---|---|---|
| **Tier** | A different model than the rest of the plan gets for one task | One task needs `Gemini 3.1 Pro (High)` while the bulk is formulaic enough for Flash — or one task is pure transcription and the rest isn't |
| **Isolation** | Keeping a large, self-contained context out of the main run's window | The task's files are big and nothing else in the plan needs them |
| **Parallelism** | Wall-clock, when two slices genuinely cannot block each other | No data dependency **and** disjoint `Touches:` **and** separate worktrees **and** the latency actually matters |

**If a candidate split buys none of the three, keep it in the single dispatch.** Task count is not a
reason to split. Neither is "these are conceptually separate steps."

**Two agy-specific weights on this test:**

- **Quota is a shared, exhaustible resource.** Every extra dispatch re-primes from zero against the
  same quota that has died mid-orchestration before. Splitting raises the chance the run dies with half
  the plan done — and the half that's done is the half you have to verify anyway.
- **Every dispatch needs its own verification pass** ([verification.md](verification.md)). Seven checks
  per dispatch, on your time. That is a real per-split cost the other offices don't pay.

**Parallel agy runs need separate worktrees, always.** Two processes in one tree stage and commit half
of each other's changes. One tree, one agy process — no exceptions.

## The hard ceiling: ~3 tasks per dispatch

Everything below about the *cost* of a second dispatch is still true. It is now
bounded by something that overrides it: **one `agy` run reliably completes about
three tasks, and then stops being able to finish.** Operator observation, 2026-08-01, after a
four-task dispatch — and the run confirms it exactly.

That run committed Task 1, Task 3 and Task 2, each with a real commit and a clean
ledger line. On the fourth it deadlocked, and the way it deadlocked is the part
worth remembering:

- it launched a test in the background and waited;
- the test hung (on a render loop in its own freshly written code);
- the planner killed the hung test, and the run *recovered* — it advanced three
  steps;
- it relaunched the same test and waited again — this time on a background task
  that **did not exist**. `pgrep jest` returned nothing while the transcript
  reported "Task 234 is running in the background."

So the terminal failure was not the bug it had written. It was losing track of
its own child process and blocking forever on a phantom. No timeout saves you;
`--print-timeout` was set to 45m and the run simply sat there.

**What this changes in planning:**

- **Cap a dispatch at 3 tasks — a hard cap, not an estimate.** A four-task plan
  is split into sequential dispatches with a verification pass between them —
  not for parallelism, but because the executor's reliability degrades past
  three completions. At 3, re-brief from scratch or re-route; do not read this
  number as approximate.
- **Order the split so the last task in each dispatch is the least valuable.**
  The boundary is where work is lost, so spend it on something cheap to redo.
- **Never put test-writing last.** It is the usual tail of a plan, it is where
  the vacuous-assertion failure mode lives, and it is the task this executor
  reached and failed. Give it its own dispatch, or keep it with the planner.
- **Prefer fewer, larger tasks over many small ones** when the work allows it.
  The ceiling counts *tasks completed*, so three substantial tasks buy more than
  three trivial ones.

Splitting for the ceiling is not the same as splitting for tier or parallelism.
It needs no justification against the three-purchases test below — it is a
reliability constraint, and it wins.

## What a second dispatch actually costs

- **Fresh priming.** A new run re-reads the brief and every file it needs from zero.
- **A full brief, each time.** The contract in [executor-brief.md](executor-brief.md) has no optional
  fields, including the real-signature clause and the handoff contract. Writing it twice is real work.
- **No shared interface memory.** Every interface two halves share must be pinned verbatim in both
  briefs — and this is the executor that invents signatures when a brief is thin.
- **A second verification pass and a second handoff to consolidate.**

## What INLINE costs — price this too

- **You are the planner.** Anything you implement, you also planned, so the Phase 3 reviewer is the only
  independent eye on it. Acceptable for a typo, an import, a constant. **Not acceptable for the task
  carrying the plan's main correctness or security risk.**
- **A longer planner context**, which every later turn re-reads.

Against that: INLINE is *cheaper here than in the sibling offices*, because it also skips a
verification pass and a class of executor failure. When a task is small and you would spend as long
verifying it as writing it, INLINE is the honest call.

## Model tiers

Exact display names come from `agy models` — pass them to `--model` verbatim, **before** `--print` (see
the `agy` skill). The catalog as of 2026-07-10:

| Task shape | `--model` | Notes |
|---|---|---|
| Codemods, renames, boilerplate, doc/config churn — formulaic and trivially verifiable | `Gemini 3.5 Flash (Medium)` or `(High)` | Fastest/cheapest. Default model if you pass nothing, which is why you always pass something. |
| **Default workhorse** — well-briefed features, mid-size changes with a detailed spec, test writing | `Gemini 3.1 Pro (High)` | Flash (High) is where the invented-signature and narrow-guard failures were observed; do not make it the default for real implementation work. |
| Hard debugging, architectural work, anything where a wrong answer is expensive | **Do not route this through agy** — recommend `claude-office` to the user, out loud and unprompted | See below. |

**On the Claude models in agy's catalog.** `agy models` offers `Claude Sonnet 4.6 (Thinking)` and
`Claude Opus 4.6 (Thinking)`. If a task genuinely deserves one of those, running it *through* agy buys
you nothing and costs you the CLI's sharp edges — the workspace semantics, the swallowed-prompt bug,
the untrustworthy exit code, the quota. **Use `claude-office` for that task instead**, or hold the task
and run the whole plan there. Say so to the user rather than routing a hard task through the wrong
office to stay inside the skill they invoked.

That is not a rule against them — a caller who explicitly wants a Claude model inside agy gets it. It
is the recommendation you should make unprompted when the plan's hardest task lands in that row.

## Shape heuristics

- **One dispatch is the default.** It keeps every cross-task interface in one context and costs one
  verification pass.
- **Count waves, not tasks.** A near-linear dependency chain cannot be parallelized however many tasks
  it holds.
- **Tasks sharing a file belong to one dispatch.**
- **One dispatch per repository**, parallel across repos; you consolidate.
- **Irreversible and environment-touching work is `PLANNER-HELD`.** `--dangerously-skip-permissions`
  means no approval stop and no sandbox. A deploy, a migration, a production write does not belong in
  an agy brief at all.
- **The brief-vs-edit test:** if writing the prompt would take longer than making the edit, INLINE it.
  With the verification pass added on top, this threshold sits higher here than elsewhere.

## Declare the routing

```
Routing: 1 agy dispatch (Gemini 3.1 Pro (High), whole plan) · 3 INLINE · 1 planner-held
Dispatches: 1 — plus 1 fix dispatch budgeted
Waves: 5 (sequential inside the run) — critical path T1→T2→T4→T5→T7
```

Add a short **"Why N dispatches"** note naming which of the three purchases each extra dispatch makes.
A split you cannot justify in one clause is a split to collapse. Give the dispatch count out loud when
presenting the plan, and flag the quota risk if the plan is long.

## Planner-held tasks

Irreversible production writes, anything needing a human go-ahead that hasn't been given, anything
outside the approved blast radius. Tag them `PLANNER-HELD`, keep them in the plan's task list for
completeness, and state in the agy prompt that they are explicitly not its work.

## Recalibrate from what the run tells you

- Run **returned a greeting or banner** → flag-ordering bug, not a routing signal. Relaunch.
- Run **stalled after a few narration lines** → quota. Consider fewer, larger dispatches, or a Claude
  fallback for the remainder.
- **Verification pass caught an invented signature** → that slice needed a stronger model, a thicker
  brief, or `claude-office`. Say which in closeout.
- **Untracked front-run stubs appeared** → the no-front-running clause needs sharpening, not the
  routing.
- A collapsed INLINE task **drew a reviewer finding** → that one needed to be in a dispatch after all.

## Keep this file honest

When a run teaches something durable about routing — a purchase that turned out illusory, a cost that
dominated, a heuristic that misfired — amend this file as part of closeout. Sharpen an existing
principle rather than appending a scenario. Lessons about flags, model names, or CLI behaviour belong in
the **`agy` skill** instead; that file is the shared living record and other workflows read it too.
