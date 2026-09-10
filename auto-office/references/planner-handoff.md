# v2 planner handoff

This reference defines the narrow v2 split between the **orchestrator** and the
**planner**. It is not the v3 routing architecture.

## Roles

- **Orchestrator** — the user's entry/invoking model. It owns the run state,
  user-facing decisions, lifecycle, dispatch, monitoring, retries, review state,
  and closeout.
- **Planner** — produces the implementation plan. In compatibility mode it is
  the orchestrator's planning step; in dedicated mode it is a separate model
  call that returns a serialized handoff and then exits.
- **Executor and reviewer routing are unchanged.** The orchestrator continues
  to dispatch and gate them using the existing v2 lifecycle.

A dedicated planner never asks the user, dispatches an executor, owns a review
or approval gate, or relies on hidden state in the orchestrator's context. The
orchestrator validates the returned artifact and then continues the existing
v2 plan-review, approval, executor, review, and closeout lifecycle.

## v2 selection policy

The current invoking model is always the orchestrator; v2 never auto-routes it.
The planner policy is the only new routing decision:

```yaml
planner_mode: auto              # auto, dedicated, or orchestrator
planner_default: claude/opus-5@medium
planner_fallback: codex/gpt-6-astra@low
planner_candidates:
  - claude/opus-5@medium
  - claude/claude-fable-5.1@low
  - claude/claude-fable-5.1@medium
  - claude/claude-fable-5.1@high
  - codex/gpt-6-astra@low
  - codex/gpt-6-astra@medium
planner_isolation: allow-reuse  # or required
```

The harness prefix is part of the triple. These are explicit v2 policy values,
not benchmark-derived defaults. A benchmark refresh must not rewrite them.

### Auto-detector and planner prompt

`planner_mode=auto` is the default when the caller supplies no planner override.
The detector runs after the fit test, once it knows whether a plan is needed:

- If no plan is needed (`direct` gear), it does not prompt and does not start a
  planner call.
- If the detected orchestrator triple exactly matches a declared planner
  candidate, reuse it when isolation is allowed; do not prompt.
- If the triple is unsupported or unknown, use `AskUserQuestion` before
  planning. Recommend **Opus Medium** first (with Astra Low fallback), then
  offer **Fable 5.1**, **GPT-6 Astra**, or **inline with this orchestrator**.
  A Fable/Astra choice is followed by an effort choice from the declared
  candidates for that family. `inline` resolves to the compatibility
  `planner_mode=orchestrator` path; silence is not permission to choose it.
- An explicit `planner_mode`, `planner=<triple>`, or
  `planner_isolation=required` is a caller decision and suppresses this prompt.

Unknown detection is never treated as a supported triple. The detector records
`plan_needed`, the actual orchestrator triple (or `unknown`), its verdict,
`prompt_shown`, and the user's `prompt_choice` in the handoff. This is a small
v2 preflight decision, not dynamic v3 capability scoring or orchestrator routing.

Resolution is deterministic:

1. Explicit `planner_mode=orchestrator`, or `planner_mode=auto` with the user
   choosing **inline**, uses the existing same-call behavior and makes no
   dedicated planner call. Record `reused_from_orchestrator: true`, with no
   fallback.
2. `planner_mode=auto` with a supported orchestrator triple reuses that triple
   when isolation is allowed and makes no duplicate call.
3. `planner_mode=auto` with an unsupported/unknown triple uses the exact family
   and effort selected by the user, then follows dedicated resolution.
4. Dedicated mode tries the explicit planner choice, or
   `claude/opus-5@medium` when no choice was supplied.
5. If that choice is unavailable, try the required dedicated fallback
   `codex/gpt-6-astra@low` before trying any other candidate.
6. If the fallback is also unavailable, try the remaining declared candidates
   in list order. Record every attempted triple and its reason.
7. Use orchestrator-as-planner only when it was explicitly selected, the auto
   prompt chose inline, or after every dedicated candidate is unusable and the
   v2 run needs a graceful compatibility fallback. Never silently substitute
   the orchestrator merely because the preferred planner failed.

Unavailable means the harness/model/effort cannot actually be launched for
this run: not installed, unauthenticated, model or effort unsupported, quota
unavailable, launch error, or planner failure. The reason is part of the
handoff metadata.

If the resolved dedicated triple exactly matches the orchestrator's
harness/model/effort and `planner_isolation` is not `required`, reuse the
orchestrator's planning step. This is a deterministic no-duplicate-call
optimization, and the handoff records `reused_from_orchestrator: true`.

## Serialized handoff contract

The dedicated call receives the orchestrator's clarified request, protected
paths, target repository/worktree, `BASE`, validation commands, tracking issue,
and the relevant v2 policy. It returns one artifact at an orchestrator-provided
path. The artifact contains a small metadata envelope followed by the normal
v2 plan-contract sections:

```yaml
schema: auto-office.v2.planner-handoff
status: ready                     # or rejected / failed
run_id: <opaque run id>
base_sha: <full sha>
target_repo: <opaque repo slug>
plan_path: docs/plans/<slug>.md
tracking_issue: <issue reference>
orchestrator:
  harness: <claude|codex|agy>
  model: <model>
  effort: <effort>
detection:
  plan_needed: <true|false>
  orchestrator_triple: <harness/model@effort or unknown>
  verdict: <supported|unsupported|unknown|not-needed>
  prompt_shown: <true|false>
  prompt_choice: <opus|fable|astra|inline|null>
planner:
  mode: <orchestrator|dedicated>
  harness: <harness>
  model: <model>
  effort: <effort>
selection:
  requested: <triple or null>
  default: claude/opus-5@medium
  fallback: codex/gpt-6-astra@low
  fallback_used: <true|false>
  fallback_reason: <reason or null>
  reused_from_orchestrator: <true|false>
  isolation_requested: <true|false>
attempts:
  - triple: <harness/model@effort>
    result: <selected|unavailable|failed|reused>
    reason: <short reason>
```

The body after the envelope is the complete plan: **Context**, **Global
Constraints** (including the blast-radius ceiling), numbered tasks,
**Dependency graph**, **Out of scope**, GOAL/done-criteria/milestones,
named actions, and the task assignment table. The orchestrator rejects an
artifact missing a required section, with a mismatched `base_sha`, or with
planner metadata that does not match the actual call.

The orchestrator copies or commits the accepted plan to the tracked
`docs/plans/<slug>.md` path before the existing plan-review and approval gates.
That tracked plan, its full-SHA reference, and this metadata are the durable
handoff; conversation state is not.

## Observability

The run report and any `routing-outcomes.md` row carry these planner fields:
`planner_mode`, detection verdict, whether a plan was needed, the orchestrator
triple, prompt visibility/choice, planner triple, `reused_from_orchestrator`,
`fallback_used`, and `fallback_reason`. A dedicated planner's attempts are
included when a fallback or failure occurs. Use the existing `brand`, `model`,
`effort`, and `dispatch_form` telemetry fields for the actual call; do not
invent a second executor/reviewer route record.

## v3 boundary

v3 may make serialized role handoffs and planner/orchestrator separation more
fundamental. v2 only adds this one optional planner call and keeps the existing
lifecycle, executor routing, reviewer routing, benchmark snapshot, and invoking
orchestrator unchanged.
