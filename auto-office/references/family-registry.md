# Families, focus, and live amendments

One orchestrator may supervise several independent planner/executor/reviewer **families** across
different projects. This file is canonical for the registry, conversational focus, amendment
classification, and routing precedence. Core's
[roles-and-authority.md](../office-core/protocol/roles-and-authority.md) is canonical for the
authority behind them.

```text
ORCHESTRATOR
├── FAMILY A  (repo A, issue #12)
│   ├── Planner ⟷ Plan adversary
│   ├── Executor A1 ⟷ Code adversary
│   ├── Executor A2 ⟷ Code adversary
│   └── Integration adversary — only if A1/A2 must compose or merge
├── FAMILY B  (repo B, issue #4)
│   ├── Planner ⟷ Plan adversary
│   └── Executor B1 → inline review → landing
└── FAMILY C …
```

Families are **independent by default**. A ready family launches on its own routing; it does not
queue behind another family's work. Nothing here requires that one orchestrator serialize all
auto-office work, and running several orchestrators in separate panes stays legal.

## The registry

A durable file in the orchestrator's run state, rewritten on every state change. One row per family:

```yaml
- family_id: <short slug>
  repo: <repo>
  worktree: <path>
  tracking_issue: <ref>
  phase: <intent|planning|awaiting-approval|executing|review|integration|closeout|blocked|done>
  requirements_version: <n>
  plan_version: <n>
  routing_version: <n>
  plan_path: docs/plans/<slug>.md
  active: [<role: agent/pane id>, ...]
  depends_on: [<family_id>, ...]
  latest_landing: <path to the landing packet, or null>
  pending_user: [<question or TRUE_CONFLICT awaiting the user>]
  updated: <iso8601>
```

**Child transcripts are never orchestrator state.** The registry plus each family's landing packets
must be enough to resume every family after a compaction or a restart. If resuming would require
re-reading a child agent, a field is missing from the registry — add it there rather than keeping
the child's context alive.

## Conversational focus — most-recent sticky

**The current focus is the most recently addressed family, and it stays there until the user
overrides it.** Unqualified commands apply to the focus — all of them, including planner-held and
irreversible ones. Sticky focus exists precisely so routine turns don't carry family ids.

- Naming another project, repo, or family switches focus automatically, and the orchestrator says so
  in one clause before acting.
- Background families keep running while focus moves.
- An explicit global command (`all families`, a session-wide routing policy) applies session-wide.
- `family=<id>` on any command targets that family for that command without moving focus.
- Genuinely ambiguous inference is **surfaced, never guessed**. Do not silently mutate two families
  because a command could have meant either.

**Echo the family before an irreversible act, do not ask.** Merge, deploy, ready-for-review,
production write, outbound message, closeout: name the family and target in the line that announces
the action, so the user can override before it lands. That is a statement, not a new approval gate —
the plan already authorized the action, and focus already named the family.

## Live amendments

The user talks to the orchestrator during execution. The orchestrator **classifies** the amendment;
it does not solve it technically.

| Class | Examples | What happens |
|---|---|---|
| **Routing-only** | reviewer model, remaining-executor model, review depth/tier, parallelism, a worker added or dropped | bump `routing_version`; inform affected workers. **No planner wake-up.** A not-yet-started dispatch takes the new route immediately; a running worker finishes its current atomic unit or review round first, unless the user explicitly asks for immediate replacement. |
| **Requirement that fits the plan** | a value changes, a case is added inside an existing task's scope | bump `requirements_version`; send a delta packet to the affected executors only. No planner wake-up while the dependency graph, architecture, interfaces, milestones, and done criteria stay valid. |
| **Plan-contract change** | architecture, interfaces, dependency ordering, milestone structure, done criteria, or any invalidated plan assumption | pause **only** affected work; wake the planner for interactive delta-planning; planner self-review + plan adversary; new `plan_version`; redistribute only what changed. |

When the class is unclear, treat it as the next class up and say why. Under-classifying is how a
plan-invalidating change reaches an executor as a one-line delta.

## Routing precedence

1. explicit user command for this dispatch
2. family/project override
3. repo config
4. orchestrator-session policy
5. user-global config
6. plugin default

A routing change increments `routing_version` and nothing else.

## Soft scheduling

The orchestrator is the routing master for the families it owns and keeps global awareness of model
and harness availability, quota headroom, active and projected dispatches, upcoming planner /
executor / reviewer demand, and user routing overrides.

It **projects** collisions and tells the user when re-timing or re-routing would help. It does
**not** block an independent family merely to optimize quota. Explicit user commands outrank
projected scheduling advice, always. Headroom is a cost input, never a reason to drop a gate or a
review tier.
