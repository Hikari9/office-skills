# v2 planner handoff

This reference defines the narrow v2 split between the invoking session and an
optional **plan drafter**. It is not the v3 routing architecture, and it does
not reassign core's Planner role.

## Roles

- **Orchestrator** — not a new role. It is the core
  [**Planner**](../office-core/protocol/roles-and-authority.md) (the user's
  entry/invoking model), named "orchestrator" here only to describe its
  control-plane behavior in this mechanic. It keeps every core Planner
  authority unchanged: run state, user-facing decisions, lifecycle, dispatch,
  monitoring, retries, approval, review state, and closeout.
- **Plan drafter** — an *added* role, per core's "offices may add roles"
  clause. It produces a draft implementation plan. In compatibility mode the
  core Planner drafts inline, same as before v2; in dedicated mode a separate
  model call drafts instead, returns a serialized handoff, and exits. A plan
  drafter holds no gate: it never asks the user, dispatches an executor, owns
  a review or approval gate, or relies on hidden state in the Planner's
  context. It only produces the draft artifact below.
- **Executor and reviewer routing are unchanged.** The core Planner continues
  to dispatch and gate them using the existing v2 lifecycle.

The core Planner validates the returned draft artifact — never adopts it
unread — and then continues the existing v2 plan-review, approval, executor,
review, and closeout lifecycle under its own authority. A dedicated plan
drafter drafting the plan does not move plan ownership, approval, or any gate
off the Planner; it only changes which process typed the draft.

## v2 selection policy

The current invoking model is always the core Planner ("orchestrator" above);
v2 never auto-routes it. Whether a **plan drafter** is dispatched, and which
one, is the only new routing decision. Field names below keep the `planner_*`
prefix as the established mechanism name for this policy; they do not assert
that the drafter holds the Planner role.

```yaml
planner_mode: auto              # auto, dedicated, or inline
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

The harness prefix is part of the triple. See *Canonical model identity*
below before comparing any two triples for equality. These are explicit v2
policy values, not benchmark-derived defaults. A benchmark refresh must not
rewrite them.

### Auto-detector and plan-drafter prompt

`planner_mode=auto` is the default when the caller supplies no drafter
override. The detector runs after the fit test, once it knows whether a plan
is needed:

- If no plan is needed (`direct` gear), it does not prompt and does not start
  a plan-drafter call.
- If the detected orchestrator triple exactly matches a declared drafter
  candidate, reuse it when isolation is allowed; do not prompt.
- If the triple is unsupported or unknown, use `AskUserQuestion` before
  planning — **unless `planner_isolation=required` was also given explicitly**,
  in which case skip straight to dedicated resolution below with no prompt
  (see rule 3). When the prompt does run, recommend **Opus Medium** first
  (with Astra Low fallback), then offer **Fable 5.1**, **GPT-6 Astra**, or
  **inline with this orchestrator**. A Fable/Astra choice is followed by an
  effort choice from the declared candidates for that family. `inline`
  resolves to the compatibility `planner_mode=inline` path; silence is not
  permission to choose it.
- An explicit `planner_mode`, `planner=<triple>`, or
  `planner_isolation=required` is a caller decision and suppresses this
  prompt.

Unknown detection is never treated as a supported triple. The detector records
`plan_needed`, the actual orchestrator triple (or `unknown`), its verdict,
`prompt_shown`, and the user's `prompt_choice` in the handoff. This is a small
v2 preflight decision, not dynamic v3 capability scoring or orchestrator
routing.

Resolution is deterministic and total — every branch below terminates at a
selected drafter, never at "no drafter selected":

1. Explicit `planner_mode=inline`, or `planner_mode=auto` with the user
   choosing **inline**, uses the existing same-call behavior and makes no
   dedicated plan-drafter call. Record `reused_from_orchestrator: true`, with
   no fallback.
2. `planner_mode=auto` with a supported orchestrator triple reuses that triple
   when isolation is allowed and makes no duplicate call.
3. `planner_mode=auto` with an unsupported/unknown triple, **and a prompt
   choice was collected**, uses the exact family and effort the user selected,
   then follows dedicated resolution (4-6). **If `planner_isolation=required`
   suppressed the prompt so no choice exists**, skip straight to dedicated
   resolution (4-6) using the declared default — this is the same branch a
   caller reaches by setting `planner_mode=dedicated` outright, so it is
   never undefined.
4. Dedicated mode (reached directly, or via rule 3) tries the explicit
   planner choice, or `claude/opus-5@medium` when no choice was supplied.
5. If that choice is unavailable, try the required dedicated fallback
   `codex/gpt-6-astra@low` before trying any other candidate.
6. If the fallback is also unavailable, try the remaining declared candidates
   in list order. Record every attempted triple and its reason.
7. Use orchestrator-as-drafter only when it was explicitly selected, the auto
   prompt chose inline, or after every dedicated candidate is unusable and the
   v2 run needs a graceful compatibility fallback. Never silently substitute
   the orchestrator merely because the preferred drafter failed.

Rule 3 is what closes the `planner_mode=auto` + `planner_isolation=required`
gap: isolation being required only ever forces "don't reuse the orchestrator
triple," never "don't resolve a drafter at all." Every combination of
`planner_mode` × `planner_isolation` × orchestrator-triple-support reaches
exactly one of rules 1, 2, or 4-7.

### Canonical model identity

Triple equality (rules 2 and 4-7, and `reused_from_orchestrator`) compares
**canonical** model ids, never launch aliases or runtime/read-back strings.
Before any comparison, normalize the launched/detected identity to the
canonical form used in `planner_candidates` above: `opus` and `claude-opus-5`
both normalize to `opus-5`; a harness's own runtime label (e.g. a transcript
that prints `claude-opus-5`) is mapped the same way before comparison, never
compared verbatim against the CLI launch alias. Record both the requested/
canonical identity and the actual launch/read-back identity in `attempts:`
when they differ, so a mismatch is visible rather than silently miscompared.

Unavailable means the harness/model/effort cannot actually be launched for
this run: not installed, unauthenticated, model or effort unsupported, quota
unavailable, launch error, or planner failure. The reason is part of the
handoff metadata.

If the resolved dedicated triple exactly matches the orchestrator's
harness/model/effort and `planner_isolation` is not `required`, reuse the
orchestrator's planning step. This is a deterministic no-duplicate-call
optimization, and the handoff records `reused_from_orchestrator: true`.

## Dispatch mechanics — Planner → plan drafter

This is the concrete dispatch leg missing from the routing table before v2:
the core Planner (orchestrator) launches a dedicated plan drafter the same way
it launches any other real delegation, per
[auto-routing](../skills/auto-routing/SKILL.md#dispatch-form-replaces-the-tier-ladder):
Herdr pane when `HERDR_ENV=1`, otherwise CLI in its own worktree — a plan
drafter is a different process from the Planner by construction, so it is
never in-session or inline.

- **Launch mechanism**: the sibling CLI skill for the drafter's brand
  (`claude-cli`, `codex-cli`, or the `agy` CLI route), exactly as the executor
  and reviewer legs already use — no new launch mechanism is introduced.
- **Working directory**: a dedicated worktree of the target repo at `BASE`,
  read/write scoped to `docs/plans/<slug>.md` only; the drafter does not touch
  application code.
- **Request/brief shape**: the orchestrator's clarified request, protected
  paths, target repository/worktree, `BASE`, validation commands, tracking
  issue, the relevant v2 policy, and the exact output path for the artifact
  below. The brief states plainly that the drafter may not ask the user,
  dispatch an executor, or hold any gate.
- **Allowed tools**: read/search tools over the target repo (equivalent to a
  Phase-1 scout's access) plus write access to the single output artifact
  path. No executor, reviewer, or user-facing tool is granted.
- **Launch/read-back validation**: read the launched harness/model/effort back
  from its own banner or launch record (never assumed from the request) and
  compare it, canonicalized, against the requested triple before recording
  `attempts:`.
- **Failure and retry**: a drafter call that fails, times out, or returns a
  status other than `ready` is one `attempts:` entry with its failure reason;
  the orchestrator does not retry the same triple and instead advances to the
  next resolution step (fallback, remaining candidates, or orchestrator-as-
  drafter) per *v2 selection policy* above. A drafter is never retried more
  than once at the same triple.

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
plan_drafter:
  mode: <inline|dedicated>
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
named actions, and the task assignment table. The core Planner rejects a
draft artifact missing a required section, with a mismatched `base_sha`, or
with drafter metadata that does not match the actual call — the draft is
never adopted unread.

The core Planner copies or commits the accepted draft to the tracked
`docs/plans/<slug>.md` path before the existing plan-review and approval gates.
That tracked plan, its full-SHA reference, and this metadata are the durable
handoff; conversation state is not.

## Observability

The run report and any `routing-outcomes.md` row carry these fields:
`planner_mode`, detection verdict, whether a plan was needed, the orchestrator
triple, prompt visibility/choice, plan-drafter triple, `reused_from_orchestrator`,
`fallback_used`, and `fallback_reason`. A dedicated plan drafter's attempts are
included when a fallback or failure occurs. Use the existing `brand`, `model`,
`effort`, and `dispatch_form` telemetry fields for the actual call; do not
invent a second executor/reviewer route record.

## v3 boundary

v3 may make serialized role handoffs and drafter/Planner separation more
fundamental. v2 only adds this one optional plan-drafter call and keeps the existing
lifecycle, executor routing, reviewer routing, benchmark snapshot, and invoking
orchestrator unchanged.
