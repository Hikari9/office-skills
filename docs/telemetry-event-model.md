# Telemetry Event Model

Hey! This document defines how an office run gets measured. The short version: **we record an event at explicit dispatch, never by searching a transcript.**

## Why this exists

Session logs repeat the full skills catalog on startup, and planning or review text often quotes commands verbatim. That means a raw text match on `/codex-office` or `/claude-office` tells you nothing useful. It counts mentions, not runs.

So the rule is simple:

> An invocation event is written at the moment of explicit command dispatch. A keyword match in a transcript is a catalog mention, and it never produces an event.

Until a run carries an event ID, treat any utilization or savings claim about it as unsupported.

## The schema

The machine-readable definition lives at `office-core/schemas/run-event.schema.json`. Every event carries the plugin ID, the plugin version, the core protocol version, an invocation ID, and a timestamp, so any measurement can be attributed to the exact code that produced it.

## Event types

| Event | Emitted when |
|---|---|
| `office.invoked` | The user explicitly invokes the office |
| `plan.approved` | Explicit approval lands on a plan file |
| `packet.built` | A role packet is assembled, before it is sent |
| `worker.dispatched` | An executor process or subagent is launched |
| `worker.completed` | The worker returns, whatever its exit code |
| `verification.completed` | Agy's Phase 2b pass finishes |
| `review.round` | A review round opens |
| `review.verdict` | The reviewer returns a verdict |
| `closeout.completed` | Phase 4 finishes |
| `run.aborted` | The run stops without a verdict |

## What each event carries

* **Identity:** plugin ID and version, core version, invocation ID, role, and dispatch mode.
* **Selection:** the spokes selected for this packet, plus offered and selected counts from the capability manifest. This is what proves a worker got its role packet rather than the whole corpus.
* **Size:** packet bytes, estimated tokens, and a budget state of `within`, `warning`, or `over`.
* **Session safety:** launch ID, session ID, worktree ID, fork source, and fork reason. **Duplicate-writer detection compares worktree and session identity, never a display label**, because labels collide and identities do not.
* **Quality:** review round, verdict, finding count, whether reviewer continuity held, evidence state, outcome, and duration.

## Privacy

Store counts and redacted labels only. **Never store user prompts, secrets, or credentials.** If a field would be useful but can only be populated with prompt text, store a hash or a count instead.

## The baseline window

Recent evidence beats old evidence, because these skills change often. Use a rolling **14 day** window, weighting the newest 7 days 4 times higher than days 8 to 14. Keep anything older as qualitative history only, labelled with the office version it came from.

## The scorecard

These start as warnings, not gates. Promote one to a hard stop only after the baseline shows the threshold is realistic and you understand what a violation actually costs.

| Metric | Measure | Target |
|---|---|---|
| Hub payload | Hub plus mandatory core only | 4K tokens or less per office |
| Role packet | Kernel, adapter, and selected spokes | 20K tokens or less, unless a documented exception applies |
| Unselected office material | Bytes present in a worker packet | 0 |
| Invocation attribution | Runs carrying an event ID and plugin version | 100% of new runs |
| Duplicate writers | Overlapping active sessions in one worktree | 0 |
| Required proof | Final gates showing actual output or artifacts | 100% |
| Review coverage | Required role completed for every run | 100% |
| Context and latency | p50 and p95 by plugin, version, role, and packet size | Improve only from a quality-neutral baseline |
| Escaped defects | Reviewer or post-merge findings | No regression |

## Where the numbers stand today

The restructure itself is measurable, and here is the honest before and after on the always-loaded hub surface:

| Hub | Before | After |
|---|---|---|
| codex-office | 3,612 bytes | 5,659 bytes |
| claude-office | 23,704 bytes | 8,060 bytes |
| agy-office | 25,335 bytes | 8,703 bytes |

Codex grew on purpose. It gained the routing table, the protocol pin, telemetry, and maintenance sections its siblings already implied, so all 3 offices now present the same surface.

**One caveat worth stating plainly:** nothing here is yet a claim about token savings in a real run. Byte counts on a hub are a proxy. The savings claim needs the events above, measured over a recent window, on runs that actually happened.
