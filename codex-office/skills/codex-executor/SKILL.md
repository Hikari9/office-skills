---
name: codex-executor
description: The executor's role contract and authority limits. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner (to build the dispatch), and by the assigned executor, at Phase 2. The executor
may be an in-session Codex subagent or a CLI worker, according to the hub's Dispatch routing.
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

## Standing clauses on every brief

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

## Self-review before the handoff, and require it from every worker

**Per task, before marking it complete**, read that task's own diff (`BASE..HEAD` for the task) and
produce a spec-compliance verdict and a quality verdict, graded **Critical / Important / Minor**.
This binds work you implemented inline exactly as it binds a worker's output — inline work is the
case this rule exists for, because it is the only work with no other reader before the gate. A task
carrying an unresolved Critical or Important is not complete.

**Once at Finish**, after the gate is green, re-read `BASE..HEAD` for the whole run looking for what
only shows across tasks: a contract two tasks implemented differently, a helper duplicated, an
earlier task's assumption a later one broke.

Record both in the handoff's required `## Self-review` section — what was checked, every finding
with its grade, and whether each was fixed (with the commit), deferred as a minor, or parked with a
ruling. `"none"` is a valid finding list; an absent section is not, and the planner returns a
handoff without one before dispatching review.

**A worker you fan out to owes you the same section.** Reject a worker return with no
`## Self-review` and send it back — you are that worker's receiver, and the rule is enforced by the
receiver at every level. Ask the worker one question above all: *did I stay inside the file scope
the brief gave me?*

Your findings stay in your handoff and are **never** copied into the reviewer's brief. Handing a
reviewer the author's own list anchors an independent pass into a verification of that list.

## Handoff report

The handoff is a **file** at the Kernel's handoff path, per
`office-core/protocol/evidence-and-handoff.md`'s handoff schema — never a chat summary. It
includes commits, interfaces verified with real signatures, validation output, a mutation table,
files created outside the named work items, a `## Self-review` section, and an `## Upline` section.

## Upline resolution

Every `## Upline` item — `[needs-planner]`, `[needs-user]`, or `[decided]` — is resolved by the
**planner** before review is dispatched. `[decided]` entries are carried into the reviewer's
packet verbatim, as scrutiny targets, not as settled facts.
