# Routing discernment — how many agents, and why

The planner is the **discerner**. Nobody downstream can fix a bad routing decision: the executor may
escalate a tier or collapse a wave, but it may never step down or widen, so the agent count you
choose in Phase 1 is the one the run pays for.

Optimize in this order: **effectiveness first, then the cheapest shape that still delivers it.**
Cheap-and-wrong is the most expensive outcome available — a run that ships a defect costs another
whole run. Never trade away the reasoning tier on the task that carries the risk.

This file is a method, not a lookup table. Derive the answer for the plan in front of you.

## The one test

> **A delegation must buy something the executor's own context cannot provide.**

There are only three things it can buy:

| Purchase | You are buying | Signal |
|---|---|---|
| **Tier** | A stronger (or deliberately cheaper) model than the executor for one task | The task is security-sensitive, subtly incorrect-able, or cross-cutting — and the executor is a lower tier. Or it's pure transcription and the executor is an expensive tier. |
| **Isolation** | Keeping a large, self-contained context out of the executor's window | The task's files are big and nothing else in the plan needs them. Measure it: a file the executor never has to read is the win. |
| **Parallelism** | Wall-clock, when two tasks genuinely cannot block each other | No data dependency **and** disjoint `Touches:` **and** the latency actually matters to the user |

**If a candidate delegation buys none of the three, tag it `INLINE`.** Task count is not a reason to
delegate. Neither is "these are conceptually separate steps."

## What a delegation actually costs

Price it honestly before you spend it:

- **Fresh priming.** A new agent re-reads the brief and every file it needs from zero. On a
  context-heavy task that is the dominant cost of the delegation.
- **A forfeited cache prefix.** Within one agent, earlier turns are a cached prefix and later turns
  re-read them cheaply. Every new agent starts as a cache miss. Fan-out defeats the cheapest
  mechanism in the run — this is the cost most often forgotten.
- **A brief, and a review.** You write the brief; the executor reviews the result. Both are real
  tokens on top of the implementation.
- **Blindness to cross-task context.** The delegate sees its brief, not the run. Anything it needs
  that the brief omits becomes a `NEEDS_CONTEXT` round trip.
- **Parallel units cannot share a new abstraction.** Anything one unit *introduces* — a type, a
  helper, an error convention — is unimportable by its siblings, because it does not exist on their
  branches yet. So the shared thing gets written twice and needs a consolidation follow-up. Price
  that when you choose parallelism: name the expected duplication in each brief, tell each unit to
  define its own copy with an identical shape, and file the consolidation issue up front rather than
  discovering two divergent versions at merge time. Sequencing the dependent unit into a later wave
  buys the sharing instead — that is the trade, and it is the user's call when they ask for
  everything at once.

## What INLINE costs — price this too

Collapsing is not free, and pretending otherwise is how a run ships something unreviewed:

- **The executor implementing means nobody reviews that task per-task.** The Phase 3 reviewer still
  sees every line, so INLINE trades *per-task* review for *final* review only. Acceptable for small
  and downstream work. **Not acceptable for the task carrying the plan's main correctness or security
  risk** — that one gets a subagent so the executor can review it, even when the token math prefers
  collapsing.
- **A longer executor context.** Every later turn re-reads it. Cached, so far cheaper than a fresh
  prime, but not zero.

## Shape heuristics

- **Count waves, not tasks.** A near-linear dependency chain cannot be parallelized no matter how
  many tasks it has. Fan-out across a chain buys nothing and pays priming per link.
- **Tasks sharing a file belong to one agent.** Two writers on one file is a corrupted tree; two
  *sequential* agents on one file is the same context primed twice.
- **File size is the isolation signal.** If delegating keeps a genuinely large file out of the
  executor's window for the whole run, that is a real purchase. If the file is small, it isn't.
- **Irreversible and environment-touching work stays with whoever holds the context.** A deploy, a
  migration, a production write should be executed by the agent that knows exactly what changed —
  not by a fresh subagent re-deriving intent from a diff. Cheaper *and* safer.
- **The brief-vs-edit test** (from [discernment.md](discernment.md)): if writing the brief would take
  longer than making the edit, INLINE it.
- **A task nobody can review from a diff alone** — because it spans unchanged code or needs the
  cross-task picture — belongs to the executor.

## Declare the routing

The plan states the shape and the reason, so the user can push back on it:

```
Routing: 1 OPUS(high) delegated · 1 SONNET(medium) delegated · 4 INLINE · 1 planner-held
Agents: 3 total — executor + 2 subagents
Waves: 5 (max 2 parallel) — critical path T1→T2→T4→T5→T7
```

Add a short **"Why only N delegations"** note naming which of the three purchases each delegation
makes. A delegation you cannot justify in one clause is a delegation to collapse.

When presenting the plan, give the agent count out loud. If the user asks whether the fan-out is
worth it, that is a legitimate question with a real answer — walk the three purchases against the
actual graph rather than defending the first draft.

## Planner-held tasks

Some tasks should not be in the executor's brief at all: irreversible production writes, anything
needing a human go-ahead that hasn't been given yet, anything outside the approved blast radius. Tag
them `PLANNER-HELD`, keep them in the plan's task list for completeness, and state in the executor's
brief that they are explicitly not its work — an unstated exclusion is one the executor may helpfully
"finish" for you.

## Recalibrate from what the run tells you

Routing feedback arrives during execution — use it:

- The executor **escalated** a tier → that task was under-tagged. Say so in the closeout report.
- The executor **serialized** a wave you marked parallel → your `Touches:` analysis was wrong.
- A delegate came back `NEEDS_CONTEXT` → the brief was thin, or the task should have been INLINE.
- A collapsed task produced a reviewer finding → that one needed per-task review after all.

## Keep this file honest

When a run teaches something durable about routing — a purchase that turned out illusory, a cost
that dominated, a heuristic that misfired — amend this file as part of closeout. Prefer sharpening an
existing principle over appending a scenario: a list of past situations does not generalize, a
principle does. If a lesson is really about the CLI or model tiers rather than routing shape, it
belongs in [discernment.md](discernment.md) instead.
