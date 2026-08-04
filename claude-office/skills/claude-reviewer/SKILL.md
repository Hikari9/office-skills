---
name: claude-reviewer
description: Adversarial review gate — fresh Opus reviewer, three verdicts, evidence rules, 5-round cap. Loaded by the claude-office hub; not invoked directly.
---

# Claude Reviewer

Loaded by: the planner (to dispatch) and the reviewer (as its own contract), at Phase 3.
Assumes: the Office Kernel is already in the packet.

Full mechanics and the fix loop live in
[`../../references/review-gate.md`](../../references/review-gate.md); the reviewer's
self-contained prompt template is [`../../references/reviewer-brief.md`](../../references/reviewer-brief.md).
This spoke restates what must survive regardless of either file's wording.

## Fresh reviewer, never the executor, never self-review

Dispatch a **fresh** agent — never reuse the executor as its own reviewer, and the planner never
reviews its own plan's output. **Record the reviewer's agent id** and resume that same reviewer
via SendMessage every round, so it keeps what it already flagged and accepted. A fresh reviewer
per round re-litigates settled findings and cannot tell you whether round 2 regressed round 1.

## The three verdicts

Per `office-core/protocol/review-states.md`:

| Verdict | Meaning | Effect |
|---|---|---|
| `APPROVED` | The work is right, and the reviewer saw real gate output for this `HEAD` | Leaves the review phase. Only this verdict does. |
| `CHANGES REQUIRED` | Numbered findings against the diff | Consumes a round; planner triages and fixes |
| `PLAN DEFECT` | The diff faithfully implements the plan and the **plan** is wrong | **Exits the loop without consuming a round** — routed to the planner (technical gap) or the user (tradeoff/scope/cost/business call) |

## Evidence — never approve without pasted real gate output

A reviewer that approves without pasted validation-command output for `HEAD` is sent back;
approval is refused, not assumed, in the absence of evidence. **Do not pre-judge the reviewer's
prompt** — never write "don't flag X" or "at most minor" into it.

**Hand the diff over as a file**, never as prompt text.

**Reuse existing gate-hook output only when you can point at the real output and confirm it ran
against `HEAD`.** A hook that discards passing output, or is conditional on uncommitted changes,
goes silent exactly when the work is done — its silence means "skipped" and "passed"
indistinguishably. Otherwise run the gate yourself and capture real output.

**Live writes need a read-back.** For anything this run wrote to a live system, a writer's exit
code is not evidence — demand a re-read of the deployed artifact matching committed source, plus
the observable behaviour that motivated the change. Missing read-back for a live surface is a
Critical finding.

The fix-triage matrix (INLINE / delegate sonnet / opus / haiku, by finding shape) lives in
[`review-gate.md`](../../references/review-gate.md)'s Phase 3b.

## 5-round cap

At round 5 with findings still open, stop dispatching and report the deadlock: each open finding,
the reviewer's reasoning, the planner's counter-reasoning, and the fix history. Never self-approve
past the cap and never park a load-bearing finding to escape the loop.

## See also

- [`../../references/review-gate.md`](../../references/review-gate.md) — full phase mechanics,
  build-evidence reuse rules, live-system evidence, and the fix loop.
- [`../../references/reviewer-brief.md`](../../references/reviewer-brief.md) — the reviewer's
  self-contained prompt template.
- `office-core/protocol/review-states.md` — the shared floor this spoke narrows.
