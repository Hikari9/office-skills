---
name: agy-closeout
description: Commit, PR, sync, close loops, and the run report after reviewer APPROVED. Loaded by the agy-office hub; not invoked directly.
---

# Agy Closeout

Loaded by: planner, at Phase 4.
Assumes: the Office Kernel is already in the packet, and the reviewer has returned `APPROVED`.

The procedure is core: `office-core/protocol/closeout.md`. This office's additions are in
[`../../references/closeout.md`](../../references/closeout.md). In
order: commit outstanding changes with a why-focused message, verify the project's real gate (stop
here on red — commit and document still run, but no PR gets opened or armed), open or arm the PR
with `Closes #N`, `gh pr merge --auto`, document only what the repo already maintains, sync local
`main` after a confirmed merge, remove the worktree only if this run's tooling created it, and
close every open loop.

**Skipped only on an explicit `skip cleanup` caller tweak.**

## Close every open Upline entry

Every open `## Upline` entry from every agy handoff this run produced. A `[needs-user]` item that
never got surfaced, or a non-blocking `[needs-planner]` item deferred to keep moving, dies here
unless acted on. Each one gets answered, filed as a follow-up issue, or explicitly ruled irrelevant
with a reason — and the `[decided]` entries the reviewer judged merely *defensible* rather than
correct are exactly the ones worth filing. Do this before removing the plan's scratch/workspace
directory; that deletion is what makes it irreversible.

## The run report (≤6 lines)

Plan file · executor model + commit range · **what Phase 2b caught** · review rounds used · gate
command + result · what closeout did · anything left open. The Phase 2b line is this office's
addition over the sibling offices' report shape — it is the evidence that independent verification
did something, not just that it ran.

Add a mandatory **not verified** row: every check that did not happen, named. An unrun check must
never read as a passed one.

**No cost retrospective.** Core `2.0.0` dropped the requirement — it produced paragraphs nobody acted
on. Keep the per-task line only (brand, review rounds, **wall clock**, verdict); over-provisioning is
visible there without an essay around it.

**agy reports no token counts.** Say that explicitly and write `n/a`; **never print `0`**, which reads
as a measurement of zero rather than an absent measurement. For this office the cost signal is
**wall clock and review rounds**, plus what Phase 2b had to catch — an executor that exits 0 having
done nothing consumes wall clock and produces nothing to count.

If a headroom figure is reported at all, give the window and its reset time — never a single-number
delta, since a tightest-of-two-windows reading appears to *gain* headroom when the short window
resets mid-run.

## Links

- [`../../references/closeout.md`](../../references/closeout.md) — full step-by-step, the quick
  reference table, and common mistakes (removing a worktree before merge lands, polling
  `gh pr checks --watch`, cleaning up a worktree you didn't create).
