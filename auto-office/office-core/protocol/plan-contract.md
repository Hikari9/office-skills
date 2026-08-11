# Plan contract (core protocol)

What every office's plan must contain before it can be approved or dispatched. Offices add
fields (Agy adds pinned interface signatures; Claude adds an effort tag); none may drop one.

## Interview floor

Interview until **95% clear** — clear enough that a stranger with no access to the conversation
could build the right thing from the plan alone. That standard is literal: for a CLI executor
in a separate process, the plan *is* the entire briefing and gaps get filled by invention
rather than by a question.

Cover: outcome, scope edges, existing surface (read files, do not guess), constraints
(environment, data source of truth, framework, protected paths), the validation command, and
named unknowns. Stop asking once a remaining unknown would not change the implementation.

Sweep work — files, directories, conventions — goes to cheap read-only explorers rather than to
the user's turns. Never spend a top-tier model on retrieval.

## Required sections

1. **Context** — why this work exists.
2. **Global Constraints** — verbatim binding requirements: exact values and formats, protected
   paths, environment target, validation commands, and the **blast-radius ceiling as its own
   named block**. Copied verbatim into every downstream brief.
3. **Numbered tasks** — for each: files touched, exact behavior, verification, and a strategy
   tag from the office's own routing table. Anything outside the executor's ceiling is tagged
   `PLANNER-HELD` and named as excluded in the brief.
4. **Dependency graph** — every task declares `Depends on:` and `Touches:`; tasks are grouped
   into waves. Two tasks share a wave only if neither depends on the other **and** their
   `Touches:` sets are disjoint.
5. **Out of scope** — explicit.

## Claims discipline

**Every factual claim the plan makes about the codebase is a claim the planner must have
checked.** A task naming a field, flag, or helper commits the executor to build it — faithfully,
including tests asserting behavior that cannot occur. These failures are invisible to lint,
tests, and the diff, because the code correctly implements a false premise.

- **Existence is not provenance.** "Where is this written?" and "where does this come from?" are
  different questions, and correctness usually rests on the second. Before specifying work on a
  field, confirm it is actually *populated* — not merely declared — and that the source you
  prefer and the fallback you demote are genuinely distinct sources.
- **An example in an explorer's report is not an observation.** Illustrations get invented. When
  the plan depends on the shape of real data, read real data: one page of real output beats five
  explorers.
- **Derivation inherits correctness; it never creates it.** A value derived from a stale
  authority is wrong one hop from where it hurts. Trace to the live authority.
- **An invariant that justifies a restructuring must hold by construction**, not because today's
  data happens to satisfy it. State *how* it is guaranteed. "Transitively, via a first-non-empty
  fallback" is not coverage.

## Deploy/apply task scoping

A task that deploys, applies, publishes, or migrates **derives its scope from the diff, not from
the feature that motivated it.** Write it as *"apply every artifact whose committed source this
branch changed"* and give it a self-check that fails loudly — a dry run reporting pending
changes on any target means the task is not done. Enumerate targets mechanically. Scoping such a
task to the artifact you had in mind while planning is how a change gets committed, reviewed,
merged, and still runs nowhere.

## Presenting the plan

State routing, worker/dispatch count, and waves in one line each, with a ≤8-word reason for any
off-default tag and a one-clause reason per delegation naming what it buys.

**An inline row carries the clause too**: what a delegation would have bought, and why the brief
costs more than the edit. An inline row that cannot be justified in a clause is one to delegate.

Then get **explicit approval**. Do not dispatch off an unapproved plan.
