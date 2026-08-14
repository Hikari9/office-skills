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

Add a mandatory **not verified** row: every check that did not happen, named. An unrun check must
never read as a passed one.

## Per-task cost line — no retrospective

**No cost retrospective.** Core `2.0.0` dropped the requirement; it produced paragraphs nobody acted
on. Keep one line **per task** — brand, review rounds, **wall clock**, verdict. Over-provisioning is
visible in those four columns without an essay around them.

Wall clock stays on the line because it is the cost invisible in a token count: a silent `codex exec`
dispatch costs the run its wall clock whether or not it burned a token, and this office has lost 43
and 57 minutes that way. Where a count is unavailable, say so — never print `0`.

If a headroom figure is reported at all, give the window and its reset time — never a single-number
delta, since a tightest-of-two-windows reading appears to *gain* headroom when the short window
resets mid-run.
