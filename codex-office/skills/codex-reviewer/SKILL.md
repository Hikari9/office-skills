---
name: codex-reviewer
description: Adversarial review gate mechanics and the fix loop. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner (to build the dispatch), and by the assigned reviewer, at Phase 3. The reviewer
may be a fresh in-session Codex subagent or a CLI worker, according to the hub's Dispatch routing.
Assumes: the Office Kernel is already in the packet.

## Who reviews

A fresh, separate `gpt-5.6-luna` reviewer identity at high effort — in-session when both planner
and reviewer are Codex, otherwise launched through CLI — never the executor, never a session that
did any of the work being gated. Mechanics live in
[../../references/review-gate.md](../../references/review-gate.md); the exact prompt contract is
[../../references/reviewer-brief.md](../../references/reviewer-brief.md). Both are read in full,
not summarized from here.

## Verdicts

Exactly three, defined in `office-core/protocol/review-states.md`:

- `APPROVED` — leaves the review phase. Only this verdict does.
- `CHANGES REQUIRED` — numbered findings; consumes a round.
- `PLAN DEFECT` — the diff faithfully implements the plan and the plan is wrong; exits the loop
  without consuming a round, and routes to the planner (technical gap) or the user (tradeoff).

**Approval without pasted real gate output for the reviewed `HEAD` is refused, not assumed.** A
successful process exit or narration is not evidence.

## Continuity and the round cap

Resume the **same** reviewer session for every round of a given review — it keeps what it already
flagged and accepted, and a fresh reviewer per round cannot tell you whether round 2 regressed
round 1. Cap at 5 rounds; past the cap, stop dispatching and report the deadlock rather than
self-approving.

## Fixes are not the reviewer's job

The reviewer gates; it never writes the fix it is gating. Findings go back to the planner, who
triages and dispatches a **fresh, scoped executor** for the fix wave, then returns to the same
reviewer with the fix diff and fresh gate output.
