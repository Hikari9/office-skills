---
name: claude-closeout
description: Commit, gate, PR + automerge, sync main, close every open Upline entry. Loaded by the auto-office hub when the claude route is selected; not invoked directly.
---

# Claude Closeout

Loaded by: the planner, at Phase 4.
Assumes: the Office Kernel is already in the packet.

The step-by-step procedure is core: `office-core/protocol/closeout.md`. This office's additions
(the Next.js gate, where lessons get recorded) live in
[`../../references/closeout.md`](../../references/closeout.md); Upline mechanics live in
[`../../references/handoff.md`](../../references/handoff.md) and
[`../../references/escalation.md`](../../references/escalation.md). This spoke states what must
happen regardless of wording.

## Runs once per milestone

A plan declares milestones (`office-core/protocol/plan-contract.md`). **Every milestone whose
done-criteria go green runs this file** — and then the run continues into the next one. Sync,
worktree removal, and Upline closure are terminal: they run after the **last** milestone only.
Removing a worktree at milestone 1 of 3 destroys the run.

Never batch milestones. An unlanded green milestone is a re-entry point thrown away.

## Sequence

Commit anything outstanding (why-focused message) → verify the project's real gate (not an
invented one; don't skip one the project defines — for Next.js work that means a real build, not
just lint) → if red, stop, commit and document only, no PR, and do not walk into the next milestone
→ `gh pr list --head <branch>` before creating one, then `gh pr create` + `gh pr merge --auto` with
`Closes #N` in the body → document only what the repo already maintains (no invented doc files) →
**at the last milestone only:** sync local main, verify `main`==`origin/main` before removing a
worktree your tooling created, close every open loop.

**Read the promotion chain from the repo once** (`gh pr list --state merged --json
number,headRefName,baseRefName`) and reuse it across milestones. A base picked from the default
branch is a guess, and correcting it later means merging the target back in — which invalidates the
gate output the milestone just produced.

**Merging a branch that deploys does not stop the run** when the plan's `named_actions:` names that
merge, with its dry run, revert target, and read-back. What the plan did not name is unauthorized,
and that is the stop.

## Skipped only on `skip cleanup`

The caller tweak `--claude-office skip cleanup` (or equivalent) stops the run after Reviewer
approval instead of running this phase. No other condition skips it.

## Close every open Upline entry

Every `[needs-user]` item that never got surfaced, and every non-blocking `[needs-planner]` item
deferred to keep moving, dies here unless acted on. Each one gets answered, filed as a follow-up
issue, or explicitly ruled irrelevant with a reason — the `[decided]` entries the reviewer judged
merely *defensible* rather than *correct* are exactly the ones worth filing. Delete the plan's
workspace (ledger, briefs, reports, diff packages — git history is the record) only after this
step, since deleting it is what makes an unresolved item irreversible.

## The ≤8-line run report

At the **final** milestone only. Plan file, what landed (per milestone: PR, base, commit range),
review rounds used, gate command + result, **what was not verified**, anything left open. Express
runs emit no report — the PR bodies are the record.

**No cost retrospective.** It was removed in core `2.0.0`: it produced paragraphs nobody acted on,
and over-provisioning is visible in the rounds-and-wall-clock line without a prose essay around it.
Where a token count is unavailable, say so rather than printing `0`. If a headroom figure is
reported at all, give the window and its reset time — never a single-number delta, since a
`--percent`-style reading returns the tightest of the 5-hour and 7-day windows and a run crossing a
reset appears to gain headroom it never had.

## Then make the skill better than you found it — or don't

One pass, and the bar is high: **write a rule or write nothing.** A lesson that cannot be stated as a
rule changing what a future run *does* is not a lesson, and **nothing durable to add is the expected
outcome**, not a failure. Prefer sharpening an existing sentence to appending a new one. Route each
lesson to the spoke that owns it:

- **Routing feedback** — an escalated tier, a serialized wave, a `NEEDS_CONTEXT` return, or a
  collapsed task that drew a reviewer finding → [`../../references/fan-out.md`](../../references/fan-out.md).
- **Mechanism gotchas** — a flag that didn't behave as documented, a launch that silently ignored
  an argument → [`../claude-cli/SKILL.md`](../claude-cli/SKILL.md) (which points at
  [`../../references/discernment.md`](../../references/discernment.md)).
- **A shared invariant** — anything that belongs to every office, not just this one — is proposed
  as a core change (`office-core/protocol/`), never edited locally in this plugin.

Sharpen an existing principle rather than appending a scenario; a list of past situations doesn't
generalize, a principle does. Nothing durable to add is a legitimate outcome — say so and stop.
Do not rewrite a rule you merely found inconvenient, and tell the user in one line what you
changed.

## See also

- [`../../references/closeout.md`](../../references/closeout.md) — full procedure, quick
  reference table, common mistakes.
- [`../../references/handoff.md`](../../references/handoff.md) — handing the conversation itself
  to a fresh session (the `rc-handoff` skill).
