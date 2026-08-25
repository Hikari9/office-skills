---
name: codex-executor
description: The executor's role contract and authority limits. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner (to build the dispatch), and by the dispatched `codex exec` executor, at Phase 2.
Assumes: the Office Kernel is already in the packet.

## Contract

The required packet contract — exactly what every executor prompt must contain, and the handoff
report shape — is [../../references/task-prompt.md](../../references/task-prompt.md). Read it in
full before building or receiving a dispatch; it is not duplicated here.

## Authority

The executor's authority is **local edits and commits in the named worktree only**, unless the
prompt names an additional action explicitly. Pushes, PRs, deploys, remote configuration changes,
outbound messages, and credential access are forbidden by default — silence in the prompt means
not authorized, not "use judgment."

The executor never approves its own work. It writes the handoff; it does not review the diff
against the plan and declare success.

## Standing clauses on every brief (core 3.0.0)

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` — do not implement anyway.
2. **A task shipping a test must paste that test failing at `BASE`** (or against the reverted fix). A
   test green before the change proves nothing about the change, and a green useless test is
   invisible to review.
3. **Self-review your own work before handing off** — per task before marking it complete, and
   once over the cumulative `BASE..HEAD` diff at Finish, including work you implemented inline.
   Record it in the handoff's required `## Self-review` section. It never substitutes for the
   review gate; a handoff without that section is returned unreviewed.

## `BRIEF DEFECT` — the return the executor alone can make

Per `office-core/protocol/review-states.md`: when the brief's **stated cause is false** — the bug does
not reproduce at `BASE`, the named function is not on the code path, the described structure does not
exist — say so with **evidence gathered at `BASE`** and **stop without implementing.**

Routes to the **planner** (technical gap) or the **user** (scope). It **does not consume a review
round**; it is the upstream twin of `PLAN DEFECT`. A reviewer cannot catch a wrong brief — a diff that
faithfully implements a false premise looks correct — so this return is the only path that exists for
it. Implementing anyway "just in case" spends the task's budget on a change nobody can evaluate.

## In-session fan-out

The executor **may fan out in-session** using its own harness's built-in sub-agent mechanism, when
doing so buys parallelism or keeps read-heavy work out of its context. Two limits, and they are the
whole point of this section: the fan-out stays inside **the brief's file scope**, and it never becomes
a second writer in the tree — **one writer per tree, always**. A sub-agent that returns an artifact the
executor applies is not a second writer; a sub-agent editing the tree in parallel is.

The mechanism is this harness's own; a brief that prescribes *how* to fan out is overreaching, and a
brief that is silent about it is not forbidding it.

## Handoff report

The handoff is a **file** at the Kernel's handoff path, per
`office-core/protocol/evidence-and-handoff.md`'s handoff schema — never a chat summary. It
includes commits, interfaces verified with real signatures, validation output, a mutation table,
files created outside the named work items, a `## Self-review` section, and an `## Upline` section.

## Upline resolution

Every `## Upline` item — `[needs-planner]`, `[needs-user]`, or `[decided]` — is resolved by the
**planner** before review is dispatched. `[decided]` entries are carried into the reviewer's
packet verbatim, as scrutiny targets, not as settled facts.
