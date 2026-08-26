---
name: agy-verification
description: Phase 2b's mandatory seven-check independent verification pass, before review. Loaded by the agy-office hub; not invoked directly.
---

# Agy Verification

Loaded by: planner wearing the verifier hat, at Phase 2b (mandatory).
Assumes: the Office Kernel is already in the packet.

Points at [`../../references/verification.md`](../../references/verification.md) for full detail.
This spoke restates the seven checks by name so the hub never has to.

## The seven checks

1. **Did it write anything?** `git log --oneline BASE..HEAD` + `git status --short`. An empty range
   on exit 0 means the prompt was swallowed or quota died — relaunch, don't review.
2. **Anything untracked no work item asked for?** `git status --porcelain --untracked-files=all`,
   cross-checked against the handoff's "Files created that are not in the work items" section.
3. **Does every interface it touched really have that signature?** Open each `file:line` in the
   handoff's Interfaces-verified table and read the real definition yourself. The single
   highest-yield check in the office.
4. **Do the new tests actually fail when the behavior breaks?** Flip a condition or argument per
   test and confirm it goes red. A test you haven't seen fail has told you nothing.
5. **Run the gate yourself.** Capture real, pasted output against this `HEAD` — this becomes the
   reviewer's gate evidence, not the handoff's pasted block.
6. **Are the guards as wide as the spec?** Read every conditional the diff added or changed against
   the plan text; agy scopes conservatively and a narrow guard fails silently.
7. **Do the new tests assert anything that could fail?** Read the assertions, not the pass count —
   discard vacuous tests (keep a copy for fixtures) and re-dispatch the task naming the failure.

## Results and re-verification

Report the pass to the reviewer **one line per check** — which claims you replaced with your own
evidence, which you're passing through unverified. A confirmed signature mismatch or a test that
will not go red is a **confirmed defect**: fix it (via the Phase 3b fix matrix, one tier up, or
INLINE) and **re-run this entire pass** before the reviewer is dispatched. Never hand the reviewer
a diff you know already fails one of these seven.

## Self-review the verification

Before reporting the result, re-read your own PASS/FAIL list and answer one question in writing:
**which check passed that had no way to fail?**

A control run against a case that *should* fail is the only thing that answers it. If the control
comes back identical to the real run, the check measured nothing — that is a second defect. Fix the
check, then report the original claim honestly as *unverified* and name who can obtain the proof.

Record this as a `## Self-review` section on the verification result: what was checked, every
finding graded **Critical / Important / Minor**, and each one's disposition. `"none"` is a valid
finding list; an absent section is not.

This is your own read-back, not a gate. Phase 2b still never approves the work it verifies.

## What this pass is not

- **Not a review.** No spec-compliance judgement, no quality findings, no approving anything. Phase
  3 is still the only independent review, and it still sees every line.
- **Not a reason to compress Phase 3.** A clean pass means the diff is real, not that it is right.
- **Not delegatable to the executor.** Asking agy to verify agy is the failure mode, restated.

## Phase 2b is this office's characteristic `compact: no`

At the 2b boundary the run's freshest evidence is **yours, not the executor's** — seven checks you
ran, in your context, with nothing on disk unless you put it there. So the compaction
recommendation is a `no` here more often than at any other boundary in any office, and per
[core](../../office-core/protocol/evidence-and-handoff.md) that `no` is a defect report: write the
seven-check result to the handoff or a scratch file, and it becomes a `yes`. Do that before
dispatching Phase 3 anyway — the reviewer's packet needs it.

## Links

- [`../../references/verification.md`](../../references/verification.md) — full detail per check,
  including the observed vacuous-test example and the decision table.
- [`office-core/protocol/evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md)
  — what counts as evidence at all; this phase exists because agy's self-report does not meet it.
