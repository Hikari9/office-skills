---
name: claude-executor
description: Executor packet contract — one per repo, non-conflicting prep, handoff file, Upline handling. Loaded by the auto-office hub when the claude route is selected; not invoked directly.
---

# Claude Executor

Loaded by: the executor (dispatch construction is done by the planner), at Phase 2.
Assumes: the Office Kernel is already in the packet.

The full, self-contained packet the executor receives is
[`../../references/executor-brief.md`](../../references/executor-brief.md) — the planner fills
its `<…>` slots and passes the whole thing as the executor's prompt. This spoke states the
contract around that brief; it does not duplicate the brief's content.

## One executor per repository

A multi-repo plan gets **one executor per repo**, in parallel — never one executor spanning
several repos, and never two executors sharing one repo. Each gets its own repo path, branch,
BASE, workspace, plan slice, and handoff path. The planner consolidates every executor's handoff
into one picture before Phase 3.

## The planner does not touch the executor's tree

While the executor runs, the planner does non-conflicting prep only — reading signatures,
drafting the reviewer dispatch. It never edits the tree the executor is writing to, and never
runs two writers against one working tree.

## Standing clauses on every brief

The planner fills these into the brief, and the executor is bound by them even if the wording drifts:

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` rather than implementing anyway.
2. **A task shipping a test must record that test failing against `BASE`, the pre-regression
   checkpoint, or a deliberately reverted fix.** Tester may run BASE in the read-only Planner
   worktree while Executor continues coding. A test that passes before and after the change proves
   nothing, and a green useless test is invisible to review.
3. **Self-review your own work before handing off** — per task before marking it complete, and
   once over the cumulative `BASE..HEAD` diff at Finish, including work you implemented inline.
   Record it in the handoff's required `## Self-review` section. It never substitutes for the
   review gate; a handoff without that section is returned unreviewed.

## `BRIEF DEFECT` — the return only the executor can make

Per `office-core/protocol/review-states.md`: the executor asserts the brief's **stated cause is
false** — the bug does not reproduce at `BASE`, the named function is not on the code path, the
described structure does not exist — carries **evidence gathered at `BASE`**, and **stops without
implementing.**

It routes to the **planner** (technical gap) or the **user** (scope), and **does not consume a review
round**. A reviewer structurally cannot catch a wrong brief: it gates a diff against a plan, and a
diff that faithfully implements a false premise looks correct. The executor is the only role that goes
and looks, so it is the only role that can raise this. A mistaken `BRIEF DEFECT` costs one read to
disprove; a suppressed one costs the whole task plus the rounds spent discovering the implementation
was faithful.

## Fan-out

When `HERDR_ENV=1`, load the [Herdr skill](../../office-core/skills/herdr/SKILL.md) and use a pane
below this executor for any further subagent; close that created pane after reading its final
result and confirming no follow-up is needed. The built-in in-session sub-agent mechanism is not used in that mode. When Herdr is absent, the executor
may fan out in-session using this harness for parallel read-heavy work or to keep a
large read out of its own context. The default remains one independent implementation writer per
tree. The coordinated Tester exception allows one Tester to author tests/config in the same tree
when `Touches:` paths are disjoint; it uses the core contract's Git lock, explicit pathspecs,
staged-path audit, and result-report rules. No other peer writer may share the tree.

A brief that prescribes *how* to fan out is overreaching — the mechanism belongs to this office — and
a brief that is silent about fan-out is not forbidding it.

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

## Read the handoff file — never ask for a pasted diff

The executor's output is a file at the Kernel's handoff path, not a chat summary. Per
`office-core/protocol/evidence-and-handoff.md`, it is written to a **file** so it survives
compaction and the `--cli` process boundary, and it follows the core handoff schema
(`office-core/schemas/handoff.schema.json`): work items, commits, interfaces verified, validation
output, mutation table, files created outside the work items, and the `## Upline` section. Read
that file — don't have the executor paste its diff into your context.

## Upline handling

Answer everything marked `[needs-planner]`. Surface every `[needs-user]` item to the user
**batched, with a recommendation attached** — never resolve a user-owned question by inferring
what they'd want. Carry the `[decided]` list into the reviewer's packet **as written** — no
editorializing, no marking entries settled: those are decisions made under uncertainty and they
tell the reviewer where to look hardest. Full ownership rules in
[`../../references/escalation.md`](../../references/escalation.md).

## See also

- [`../../references/executor-brief.md`](../../references/executor-brief.md) — the required
  packet contract.
- [`../../references/escalation.md`](../../references/escalation.md) — Upline ownership axes.
- `office-core/protocol/evidence-and-handoff.md` — the handoff report contract this office
  implements.
