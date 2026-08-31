---
name: agy-reviewer
description: The adversarial Phase 3 gate — default reviewer is gemini-3.7-flash-high (or caller override), three verdicts, 5-round cap. Loaded by the agy-office hub; not invoked directly.
---

# Agy Reviewer

Loaded by: reviewer, at Phase 3.
Assumes: the Office Kernel is already in the packet.

Points at [`../../references/review-gate.md`](../../references/review-gate.md) (mechanics + fix
loop) and [`../../references/reviewer-brief.md`](../../references/reviewer-brief.md) (the prompt
template) for full detail. This spoke restates what cannot be compressed away.

## Code review defaults to gemini-3.7-flash-high

**The code-review gate defaults to `gemini-3.7-flash-high` (fresh reviewer separate from the executor).**
A caller tweak may override the reviewer model (e.g. `reviewer: opus` or `reviewer: sonnet`).
The reviewer never reviews its own work; the executor never approves its own work.

### Plan review is a different gate, and `agy` may hold it

A **plan**-review gate — an independent read of the *plan document*, before user approval, held by an
office that declares one — may be held by `agy` at `agy` **high**, when `agy` is the planner.

The distinction is not a loophole; it is the same reasoning that bars code review, applied to
different work:

| | Code review | Plan review |
|---|---|---|
| Shape | Long, adversarial, multi-round, against a diff | Short, single-shot, breadth-first, one document |
| Rounds | Up to 5, with continuity across them | Exactly **one**, then the reviewer retires |
| Maps to agy's | documented **weakness** — drift past ~3 chained turns, self-consistent wrong work | documented **strength** — fast, broad reading of one artifact |
| Verdict | Gates a `HEAD` and demands pasted gate output | Returns numbered findings on a document; no diff, no gate output |

So: `agy` **never** reviews code, and **may** review a plan once. A future reader tempted to "fix the
inconsistency" should fix neither half — re-barring plan review makes an agy planner's plan-review row
unreachable (a rule that cannot fire is worse than no rule), and opening code review re-introduces the
exact failure the miss-list documents.

## The packet includes the planner's own Phase 2b output

Hand the reviewer: the plan file, Global Constraints verbatim, agy's handoff report, a diff
package file for `BASE..HEAD`, the validation commands, **the planner's own Phase 2b gate output**
(never the executor's pasted block — it cannot be attributed to this `HEAD`), and a **one-line-per-
check summary** of what the verification pass found and what it is passing through unverified.
Also hand it the handoff's `## Upline` `[decided]` list, verbatim, as scrutiny targets.

The planner records the finalized verdict in the existing draft PR before triage or follow-up.
Make the response complete enough to copy verbatim; every `CHANGES REQUIRED` finding, including
its evidence and recommendation fields, must survive in the PR comment. After a fix wave, the
planner posts each finding's resolution and the new commit range before resuming review.

## Do not compress the rubric because agy reviewed nothing

Unlike `claude-office`, an `agy` run has no in-session subagents and reviews nothing itself: **Phase
3 is the first and only independent review of every line.** The Phase 2b pass established that the
work is real, not that it is right — it does not license a lighter rubric.

## The three verdicts

Per [`office-core/protocol/review-states.md`](../../office-core/protocol/review-states.md):

| Verdict | Meaning | Effect |
|---|---|---|
| `APPROVED` | The work is right, and the reviewer saw real gate output for this `HEAD` | Leaves the review phase — only this verdict does |
| `CHANGES REQUIRED` | Numbered findings against the diff | Consumes a round; planner triages and fixes |
| `PLAN DEFECT` | The diff faithfully implements the plan and the **plan** is wrong | Exits the loop without consuming a round |

**No approval without pasted real output for this `HEAD`.** A reviewer that approves without it is
sent back — approval is refused, not assumed, in the absence of evidence.

## Escalate out of the tool, not up within it

An invented signature, a test that would not go red, or anything the reviewer calls subtle goes to
a Claude subagent (`opus`) or INLINE — **never back to `agy`, the tool that just demonstrated the
failure.** Re-dispatching a self-consistency failure to its source is how a fix loop burns rounds
producing internally-consistent wrong answers again.

## The fix loop

- **Every fix wave gets a fresh re-run of the Phase 2b verification pass**, plus a fresh gate run,
  before the diff goes back to the reviewer.
- **Same reviewer resumed each round** (via SendMessage to the recorded agent ID) — a fresh
  reviewer per round re-litigates settled findings.
- **5-round cap.** At round 5 with findings open, stop dispatching and report the deadlock: each
  open finding, the reviewer's reasoning, your counter-reasoning, the fix history. Never
  self-approve past the cap.

## Links

- [`../../references/review-gate.md`](../../references/review-gate.md) — full mechanics, the fix
  matrix, `PLAN DEFECT` routing.
- [`../../references/reviewer-brief.md`](../../references/reviewer-brief.md) — the reviewer's
  prompt template, gating rubric, and output shape.
- [`office-core/protocol/review-states.md`](../../office-core/protocol/review-states.md) — the
  shared verdict set and fix-loop rules this spoke narrows.

## Self-review the review, every round

Before returning any verdict, re-read your own findings and answer both questions in writing:

- **Which finding can I not state a concrete failure scenario for?** A finding with no scenario is
  an impression. Sharpen it or withdraw it.
- **Which surface did I not open at all?** List them. A partial review that says so is honest; one
  that does not is silently narrow.

Return the result as a `## Self-review` section on the verdict, per
`office-core/schemas/review-verdict.schema.json`. **`"none"` is a valid finding list; an absent
section is not** — the planner returns a verdict without one, and that return does **not** re-consume
the round.

**Sharpen or add findings freely; never quietly drop one.** A withdrawn finding is written down as
withdrawn, with its reason, so a softened gate is visible instead of invisible. **Every round, not
just the first** — round 3 is where fatigue lands.

This is your own read-back, not a second gate. It never licenses approving your own work.
