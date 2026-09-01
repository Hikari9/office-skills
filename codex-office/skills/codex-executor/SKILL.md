---
name: codex-executor
description: The executor's role contract and authority limits. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner (to build the dispatch), and by the assigned executor, at Phase 2. The executor
may be a Herdr-managed agent, an in-session Codex subagent, or a CLI worker, according to the hub's
Dispatch routing. When `HERDR_ENV=1`, load [`herdr`](../../office-core/skills/herdr/SKILL.md) and
use its pane/prompt/wait/cleanup contract.
Assumes: the Office Kernel is already in the packet.

## Contract

The required packet contract — exactly what every executor prompt must contain, and the handoff
report shape — is [../../references/task-prompt.md](../../references/task-prompt.md). Read it in
full before building or receiving a dispatch; it is not duplicated here.

## Authority and bootstrap

The executor follows the core [draft-PR bootstrap](../../office-core/protocol/executor-bootstrap.md)
before implementing any numbered task. The packet must name the tracked `docs/plans/<slug>.md`,
tracking issue, `BASE`, remote, branch, and PR body fields, including the immutable plan blob
deeplink anchored to the plan-only commit. The executor then verifies the worktree and branch,
commits the plan file alone as the branch's first commit, pushes the named branch, creates one draft
PR whose body contains the plan blob deeplink and references the plan and issue, and posts the
initial resume comment.
Any failed precondition stops implementation and returns a blocked handoff.

After bootstrap, the executor may make local edits and commits in the named worktree, plus the
explicit bootstrap push/PR and first-executor-completion comment. It may not mark the PR ready, remove the plan,
merge, deploy, alter remote configuration, send messages, or touch credentials. Silence means not
authorized.

At the first completed executor handoff, post the executor-completion details required by the core
bootstrap contract. Milestones after that are recorded in local run state, not on the PR.

The executor never approves its own work. It writes the handoff; it does not review the diff
against the plan and declare success.

## Standing clauses on every brief

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` — do not implement anyway.
2. **A task shipping a test must record that test failing against `BASE`, the pre-regression
   checkpoint, or a deliberately reverted fix.** Tester may run BASE in the read-only Planner
   worktree while Executor continues coding. A test green before the change proves nothing about the
   change, and a green useless test is invisible to review.
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

## Fan-out

When `HERDR_ENV=1`, use the [Herdr skill](../../office-core/skills/herdr/SKILL.md): a child of this
executor goes in a pane below it, and the created pane is closed after its final result is read and
no follow-up is needed.
The built-in in-session sub-agent mechanism is not used in that mode. When Herdr is absent, the executor
may fan out in-session using its own harness when doing so buys parallelism or keeps
read-heavy work out of its context. The default remains one independent implementation writer per
tree. The coordinated Tester exception allows one Tester to author tests/config in the same tree
when `Touches:` paths are disjoint; it uses the core contract's Git lock, explicit pathspecs,
staged-path audit, and result-report rules. No other peer writer may share the tree.

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
