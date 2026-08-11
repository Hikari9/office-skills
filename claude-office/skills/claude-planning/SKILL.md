---
name: claude-planning
description: Interview to 95% clarity, write the plan, get approval. Loaded by the claude-office hub; not invoked directly.
---

# Claude Planning

Loaded by: the planner, at Phase 1.
Assumes: the Office Kernel is already in the packet.

Narrows [`office-core/protocol/plan-contract.md`](../../office-core/protocol/plan-contract.md) — the shared floor every office's plan must
clear. This file adds Claude-specific detail (the strategy/effort tag, explorer-dispatch rules,
the routing summary line format); it never drops a core requirement.

## Issue tracking (default, automatic)

Before exploring or interviewing, run `gh issue create` in the target repo with a minimal
title/body drawn from the raw request (e.g. "Track: <request summary>"). This exists so a
tracking issue is open from the very start even if the run stalls or ships incomplete. No user
approval needed — file it and move on. Once the interview settles into an approved plan,
`gh issue edit <n>` to replace the body with the plan summary (or a link to the plan file). At
closeout, reference it with `Closes #N` in the PR body (see
[`skills/claude-closeout/SKILL.md`](../claude-closeout/SKILL.md)) so it closes automatically on
merge; if the gate stays red or the run stops short, leave the issue open as the record of
what's unresolved.

## Interview until 95% clear

Clear enough that a stranger with no access to this conversation could build the right thing
from the plan alone. Ask in batches (AskUserQuestion for choices), covering: outcome, scope
edges, existing surface (read files, don't guess), constraints (env, data source of truth,
framework, protected paths), verification command, and named unknowns. Stop asking once
remaining unknowns wouldn't change the implementation.

## Dispatch explorer subagents

For anything that means sweeping files/directories/conventions — don't spend the user's turns on
questions a read would settle. Default to `haiku` (fast, cheap, adequate for retrieval); step to
`sonnet` only when reconciling conflicting patterns needs judgment, not retrieval. **Never
dispatch an `opus` explorer.** Run independent explorers in parallel, `subagent_type: "Explore"`,
ask for a specific answer with file:line citations.

## Write the plan to a file

`docs/plans/<slug>.md`, or scratchpad — the executor's contract. The five required sections are
core's (`office-core/protocol/plan-contract.md`): Context; Global Constraints; Numbered tasks;
Dependency graph; Out of scope. This office's specifics:

**Global Constraints** always includes a **blast-radius ceiling** as its own named block: which
environments, credentials, remotes, external services and irreversible operations this run may
and may not touch. Declared once, restated verbatim in every downstream brief — ceilings narrow
going down and no agent may widen its own. State exclusions explicitly; an unstated exclusion is
one a helpful agent will "finish" for you. Back it with mechanism where you can (a scoped
`--allowedTools` allowlist, a deny hook) rather than prose alone. Full rules in
[`../../references/escalation.md`](../../references/escalation.md).

**Numbered tasks** carry a **strategy + effort tag**:

| Strategy | When | Effort |
|---|---|---|
| **INLINE** | Trivial, deterministic; a brief would cost more thought than the edit — state what a delegation would have bought | n/a |
| **HAIKU** | Plan text has the complete code, or a single-file mechanical edit/codemod | low |
| **SONNET** | Default — features, standard debugging, clear-spec refactors, test writing | medium, high if multi-file/integration risk |
| **OPUS** | Subtle correctness, concurrency, security-sensitive, cross-cutting, multi-file coordination | high, xhigh only for the hardest single task |

Tag every task (`Strategy: SONNET (medium)`), justify anything above default in ≤8 words. Full
model-ID/pricing detail lives in
[`skills/claude-cli/SKILL.md`](../claude-cli/SKILL.md).

The table above picks a task's **tier**. It does not decide whether that task deserves its own
agent at all — **you** do, and that is the more consequential call. Read
[`../../references/routing.md`](../../references/routing.md) before finalizing the tags and
apply its test: *a delegation must buy tier, isolation, or parallelism; if it buys none of the
three, tag it `INLINE`.* Task count is not a reason to delegate, and a near-linear dependency
chain cannot be parallelized however many tasks it holds. Balance it against the one thing
collapsing costs: an INLINE task gets no per-task review, so **never collapse the task carrying
the plan's main correctness or security risk.** Tag anything outside the executor's approved
blast radius — irreversible production writes, work awaiting a human go-ahead — as
`PLANNER-HELD` and say so explicitly in the executor's brief.

**Dependency graph** — each task declares `Depends on:` and `Touches:`; group into waves (a `dot`
digraph + wave table). Two tasks share a wave only if neither depends on the other **and** their
`Touches:` sets are disjoint.

**A task that deploys, applies, publishes or migrates derives its scope from the diff, not from
the feature that motivated it.** Write it as *"apply every artifact whose committed source this
branch changed"* and give it a self-check that fails loudly — a dry-run reporting pending changes
on any target means the task is not done. Scoping such a task to the artifact you had in mind
while planning is how a change gets committed, reviewed, merged and still runs nowhere: the
deploy task named one target, a second changed artifact shipped through a different script, and
nothing in the plan ever noticed. Enumerate targets mechanically.

## Claims discipline

**Every factual claim the plan makes about the codebase is a claim you must have checked.** A
task that names a field, flag, or helper commits the executor to work on it, and the executor
will faithfully build what you named — including tests asserting behaviour that cannot happen.
Before specifying work on a field, confirm it is actually *populated*, not merely declared: a
field the mapper never sets, or one whose values already flow in through another field,
generates dead code and misleading tests that then have to be walked back mid-run.

**Read a field's provenance, not just its existence.** "Where is this written?" and "where does
this come from?" are different questions, and the plan's correctness usually rests on the
second. Observed 2026-07-30: a plan instructed "the editor's own state wins — treat a present
assignment as the user's edit", which is sound only if that collection *is* session state. It
wasn't — the normalizer built it from the backend's own membership rows, so the plan routed
exactly the legacy data it had elsewhere declared out of scope into a destructive full-replace
write. Both Critical findings of that run traced to provenance the plan asserted rather than
read. Whenever a task says "prefer X over the fallback", open the mapper and confirm X and the
fallback are genuinely distinct sources.

**Two specific things masquerade as checked facts. Both produced a plan defect on 2026-08-01, in
the same run.**

- **An example in an explorer's report is not an observation.** An explorer wrote *"section names
  are literal text (e.g. `Cluster // MNL Adults`)"*. The parenthetical was an illustration it
  invented; real names were `Cluster // Alex Mitra & Angelika Mitra`. The plan built a
  name-parsing task on it that would have returned `undefined` for nearly every real record —
  passing every test while doing nothing. The tell was available and ignored: the UI *already
  displayed* the value the task was meant to derive, so "where does that come from?" would have
  exposed the aggregation that was the real source. **When a plan depends on the shape of real
  data, read real data** — one page of production/preview output beats five explorers.
- **Deriving from a wrong source does not rescue you.** The same plan asserted a map "is derived
  from the env-switched constant and is therefore correct", and specified a fix built on it. The
  constant was stale, so every derived map was wrong — and one of them sat on a write path,
  silently persisting the wrong foreign key. Derivation **inherits** correctness; it never
  creates it, and it hides the error one hop from where it hurts. Trace to the authority (the
  live system), not to the nearest thing that looks computed.

Both failures are cheap to prevent and expensive to ship: they are invisible to lint, tests, and
the diff, because the code faithfully implements a false premise. Prefer one read of the live
system during Phase 1 over a confident inference — and note that this is exactly why the plan
must keep a live-verification task that no build can substitute for.

The sharper version of the same rule applies to any **invariant you assert in order to justify a
restructuring**. "Safe because every filterable field is covered" must hold *by construction*,
not because today's data happens to make it true. An invariant that rests on data shape will be
enumerated as verified, pass every test, and then fail on the one record shaped differently — and
if the restructuring made that invariant load-bearing, the failure is now user-visible. State how
the invariant is guaranteed, not just that it holds; if the honest answer is "transitively, via a
first-non-empty fallback", that is not coverage, and the fix is to carry the field explicitly.

## Presenting the plan

Summarize routing (`Routing: 1 INLINE · 3 SONNET(medium) · ...`), the **total agent count**
(`Agents: 3 — executor + 2 subagents`), and waves (`Waves: 3 (max 2 parallel) — critical path
1→3→5`) when presenting the plan. Add a one-clause reason per delegation naming what it buys — a
delegation you cannot justify in a clause is one to collapse. If the user questions the fan-out,
walk the three purchases against the actual dependency graph and give a straight recommendation;
don't defend the first draft.

**Get explicit approval** — "looks good"/"go"/"approved". Silence is not approval. Do not
dispatch off an unapproved plan.

## See also

- [`../../references/routing.md`](../../references/routing.md) — how many agents, and why.
- [`../../references/discernment.md`](../../references/discernment.md) — model selection, effort
  tuning, and CLI mechanics for whoever executes.
- [`../../references/escalation.md`](../../references/escalation.md) — Upline ownership and the
  blast-radius ceiling in full.
- `office-core/protocol/plan-contract.md` — the shared floor this spoke narrows.
