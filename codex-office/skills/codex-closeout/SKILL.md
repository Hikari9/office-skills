---
name: codex-closeout
description: Planner-only closeout — gate verification, commit, PR, deploy authority. Loaded by the codex-office hub; not invoked directly.
---

Loaded by: planner only, at Phase 4.
Assumes: the Office Kernel is already in the packet.

## Contract

The procedure itself is core: `office-core/protocol/closeout.md`. This office's additions are in
[../../references/closeout.md](../../references/closeout.md). This spoke duplicates neither.

## Planner-held actions

After reviewer `APPROVED`: verify the full gate, inspect the final diff and status, commit only
the intended files. **Create or push a PR only when the caller explicitly authorized it** — never
by default. Merges and deploys are always planner-held.

## Deployments and migrations

Never verified by the writer's exit status. A deployment or migration is closed out only after a
**read-back of the live artifact** confirming it matches committed source, plus the observable
behavior that motivated the change — per `office-core/protocol/evidence-and-handoff.md`.

## Final report

List: the plan path, the executor's commit range, the number of review rounds and their verdicts,
the full gate result with real output, PR URL if one was created, and anything left unresolved.

## Cost retrospective (core 1.2.0)

Then price the run, because a run nobody priced gets over-provisioned the same way next time. Per
`office-core/protocol/closeout.md`, report **per task**: brand, model, effort, dispatch form, review
rounds, tokens where the harness reports them, and **wall clock**. Then one honest paragraph on what
was over- or under-provisioned — the model that outran the task, the brief that was too thin and
bought a second review round, the `codex exec` dispatch that produced nothing for an hour.

Wall clock is a line item, not a footnote: a silent dispatch costs the run its wall clock whether or
not it burned a token. Where a count is unavailable, say so — never print `0`.

**Headroom is reported per window, with reset times, at start and at end.** Never as a
single-number delta: the tightest-of-two-windows reading appears to *gain* headroom when the short
window resets mid-run, so a start-to-end subtraction across a window boundary measures nothing.
