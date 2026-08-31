---
name: agy-executor
description: The executor packet contract, commit boundary, and Upline handling for Phase 2. Loaded by the agy-office hub; not invoked directly.
---

# Agy Executor

Loaded by: executor (agy), at Phase 2.
Assumes: the Office Kernel is already in the packet.

Narrows [`office-core/protocol/roles-and-authority.md`](../../office-core/protocol/roles-and-authority.md)
and [`office-core/protocol/evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md)
for a headless, unsandboxed CLI executor.

## The packet contract

Build the prompt from **[`../../references/executor-brief.md`](../../references/executor-brief.md)**
— **every field in that contract is required, not optional.** In particular:

- The **absolute workspace root**, stated in the prompt text itself (not only via `--add-dir`).
- The **real-signature citation table** — every hook, callback, event, SDK method, or endpoint the
  task touches must be cited `file:line` with its real signature, read from source, before it is
  used or tested against.
- The **no-front-running clause**, verbatim: implement only the numbered work items, no stubs or
  scaffolding for later tasks, no untracked placeholder files left behind.
- The **blast-radius ceiling**, restated verbatim from the plan's Global Constraints.
- The **handoff-report contract** — commits, tasks, interfaces verified table, deviations, Upline,
  files created that aren't in the work items, gate evidence, known risks.

## Bootstrap and commit boundary (absolute)

Before implementing any numbered task, follow the core [draft-PR bootstrap](../../office-core/protocol/executor-bootstrap.md).
The prompt must name the tracked `docs/plans/<slug>.md`, tracking issue, `BASE`, remote, branch, base
branch, and PR body fields, including an immutable blob deeplink to the plan anchored to the
plan-only commit. Verify the worktree and branch, commit the plan file alone as the branch's first
commit, push the named branch, create one draft PR whose body contains that plan deeplink and
references the issue, and post the initial resume comment. A failed bootstrap precondition stops implementation and
returns a blocked handoff.

After bootstrap, agy commits **only** to the designated branch or worktree named in the prompt. Its
explicit outward authority is limited to the named-branch push, one draft-PR creation, and initial
or milestone comments. It must not:

- mark the PR ready or remove the plan
- merge or deploy
- change remote configuration
- send messages outside PR bookkeeping
- touch credentials

...unless the prompt explicitly authorized that exact action. **Silence means not authorized** —
do not infer permission from the task's broader goal. Closeout owns plan removal, ready-for-review,
merge, and cleanup.

At every green milestone, post its name, commit range, validation output, and next resume point to
the same draft PR before continuing.

## One executor per repository

A multi-repo plan gets one `agy` run per repo, parallel across repos, never within one. Each gets
its own repo path, branch, `BASE`, scratch dir, plan slice, and handoff path. The planner
consolidates every handoff into one picture before Phase 2b.

## The planner never edits the tree it is writing to

While the executor runs, the planner does non-conflicting prep only. Two writers in one tree stage
and commit half of each other's changes — this applies to the planner as much as to a second agy
process.

## Standing clauses on every brief

All three are required fields of the packet contract, not optional additions:

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` instead of implementing.
2. **A task shipping a test must paste that test failing at `BASE`** (or against the reverted fix). A
   test that was green before the change proves nothing about it, and a green useless test is invisible
   to review.
3. **Self-review your own work before handing off** — per task before marking it complete, and
   once over the cumulative `BASE..HEAD` diff at Finish, including work you implemented inline.
   Record it in the handoff's required `## Self-review` section. It never substitutes for the
   review gate; a handoff without that section is returned unreviewed.

## `BRIEF DEFECT`

Per [`office-core/protocol/review-states.md`](../../office-core/protocol/review-states.md): when the
brief's **stated cause is false** — the bug does not reproduce at `BASE`, the named symbol is not on
the code path, the described structure does not exist — return `BRIEF DEFECT` with **evidence gathered
at `BASE`** and **stop without implementing.** It routes to the planner (technical) or the user
(scope), and **consumes no review round.**

This return matters more here than anywhere: agy's characteristic failure is work that is
self-consistent and wrong. An agy executor that implements a false premise produces a diff that reads
as correct, passes its own checks, and survives Phase 2b — because Phase 2b verifies the work is
*real*, not that the premise was *true*.

## In-session fan-out

The executor **may fan out in-session** using its own harness's built-in sub-agent mechanism. The
limits are the point: within **the brief's file scope**, and never a second writer — **one writer per
tree, always**, which for this office means one `agy` run per repo with no parallel writer inside it.
A sub-agent that returns an artifact the executor applies is not a second writer.

The mechanism belongs to this office, not to the brief. A brief that prescribes *how* is overreaching;
a brief that is silent is not forbidding.

## Exit code 0 does not mean done

agy exits 0 having done nothing at all, and its completion summary is not a signal. Read the final
message and the handoff file, then go straight to Phase 2b — never treat a clean exit as evidence
on its own. See [`../agy-verification/SKILL.md`](../agy-verification/SKILL.md).

## Upline handling

The executor's handoff carries an `## Upline` section per
[`office-core/protocol/evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md).
The planner:

- Answers everything `[needs-planner]`.
- Surfaces every `[needs-user]` item **batched, with a recommendation attached** — never resolves a
  user-owned question by inferring what they'd want.
- Carries the `[decided]` list into the reviewer's packet verbatim, and says whether the list
  looked complete against the diff.

Full escalation rules, including the reviewer's `PLAN DEFECT` upline path, live in
[`../../references/escalation.md`](../../references/escalation.md).

## Links

- [`../../references/executor-brief.md`](../../references/executor-brief.md) — the full prompt
  template and handoff-report contract.
- [`../../references/escalation.md`](../../references/escalation.md) — Upline ownership and the
  blast-radius ceiling.
- [`../agy-cli/SKILL.md`](../agy-cli/SKILL.md) — how the prompt is actually launched.
