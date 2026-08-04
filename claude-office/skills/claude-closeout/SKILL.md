---
name: claude-closeout
description: Commit, gate, PR + automerge, sync main, close every open Upline entry. Loaded by the claude-office hub; not invoked directly.
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

## Sequence

Commit anything outstanding (why-focused message) → verify the project's real gate (not an
invented one; don't skip one the project defines — for Next.js work that means a real build, not
just lint) → if red, stop, commit and document only, no PR → `gh pr list --head <branch>` before
creating one, then `gh pr create` + `gh pr merge --auto` with `Closes #N` in the body → document
only what the repo already maintains (no invented doc files) → sync local main and verify
`main`==`origin/main` before removing a worktree your tooling created → close every open loop.

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

## The ≤6-line run report

Report the run in ≤6 lines: plan file, executor commits range, review rounds used, gate command +
result, what closeout did, anything left open.

## Then the cost retrospective (core 1.2.0)

The ≤6-line report says what happened; this says what it cost. Per
`office-core/protocol/closeout.md`, one line **per task** — brand, model, effort, dispatch form
(`cli` / `in-session` / `inline`), review rounds, tokens where the harness reports them, **wall
clock** — followed by one honest paragraph on what was over- or under-provisioned.

The paragraph is the point. "Sonnet at high did this in one round" and "Opus wrote a test that could
not fail" are both findings that change the next run's plan. Where a token count is unavailable, say
so rather than printing `0`.

**Headroom goes in per window, with reset times, at start and at end** — never a single-number delta.
`--percent`-style readings return the tightest of the 5-hour and 7-day windows, so a run that crosses
a window reset appears to gain headroom it never had.

## Then make the skill better than you found it

Every run produces evidence no file could have anticipated, and the routing call is where the
planner is most often wrong. Spend one pass, routing each lesson to the spoke that owns it:

- **Routing feedback** — an escalated tier, a serialized wave, a `NEEDS_CONTEXT` return, or a
  collapsed task that drew a reviewer finding → [`../../references/routing.md`](../../references/routing.md).
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
