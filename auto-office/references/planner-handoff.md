# Interactive planner handoff

How the orchestrator selects, briefs, and receives back an **interactive
planner**. Canonical for the planner leg; core's
[roles-and-authority.md](../office-core/protocol/roles-and-authority.md) is
canonical for the authority behind it.

## Roles

- **Orchestrator** — the invoking session, the core
  [Orchestrator](../office-core/protocol/roles-and-authority.md). It owns the
  user's live conversation, the provisional intent, the tracking issue, the
  family registry, routing, amendments, lifecycle, dispatch, review *state*,
  planner-held actions, and closeout. It gathers only the intent needed to
  decide that planning is required and to route it.
- **Planner** — owns Phase 1 requirements discovery. It reconnoiters the
  repository, **talks to the user directly**, may reshape any pre-freeze
  requirement on repository evidence, freezes the requirements, writes the
  plan, self-reviews it, spawns and disposes of its own plan adversary, and
  returns the plan packet. It holds no lifecycle state and no gate: it does not
  dispatch executors, own review state, or perform a planner-held action.
- **Executor and reviewer routing stay with the orchestrator**, which
  distributes the returned packet.

The orchestrator validates the returned packet's **shape** — never adopts it
unread — and takes the single user approval. It does **not** run a second
technical plan-review of its own: the plan was already gated by the planner's
self-review, its plan adversary, and the user.

**What the planner hands back is authoritative.** The frozen requirements
supersede the orchestrator's initial intent wherever the two differ, including
the goal and the problem statement; the orchestrator records the change rather
than arguing it back.

## Selection policy

The invoking model is always the orchestrator, and it never auto-routes
itself. Whether a **dedicated planner** is dispatched, and
which one, is the routing decision this file governs. Field names below keep the `planner_*`
prefix as the established mechanism name for this policy; they name the planner leg.

```yaml
planner_mode: auto              # auto, dedicated, or inline
planner_default: claude/opus-5@medium       # flat — no orchestrator- or headroom-conditional variant
planner_fallback: codex/gpt-6-astra@low     # used only when the default is unavailable
planner_candidates:
  - claude/opus-5@medium
  - claude/claude-fable-5.1@low
  - claude/claude-fable-5.1@medium
  - claude/claude-fable-5.1@high
  - codex/gpt-6-astra@low
  - codex/gpt-6-astra@medium
planner_isolation: allow-reuse  # or required
```

**`planner_default` is flat: `claude/opus-5@medium`, always.** The earlier conditional default
(`codex/gpt-6-astra@low` when the orchestrator's harness was `claude` and codex headroom was
generous) is **revoked, 2026-09-10, by maintainer decision** — a claude orchestrator no longer
diverts the plan draft to Astra. Astra Low is now only the **fallback**, taken when
`claude/opus-5@medium` is unavailable (not installed, unauthenticated, out of quota, or the launch
fails). Codex headroom is still probed for cost reporting; it no longer selects the planner.

The harness prefix is part of the triple. See *Canonical model identity*
below before comparing any two triples for equality. These are explicit
policy values, not benchmark-derived defaults. A benchmark refresh must not
rewrite them.

### Auto-detector and planner prompt

`planner_mode=auto` is the default when the caller supplies no planner
override. The detector runs after the fit test, once it knows whether a plan
is needed:

- If no plan is needed (`direct` gear), it does not prompt and does not start
  a planner call.
- If the detected orchestrator triple exactly matches a declared planner
  candidate, reuse it when isolation is allowed; do not prompt.
- If the triple is unsupported or unknown, use `AskUserQuestion` before
  planning — **unless `planner_isolation=required` was also given explicitly**,
  in which case skip straight to dedicated resolution below with no prompt
  (see rule 3). When the prompt does run, recommend **Opus Medium** first,
  with **Astra Low** named as the fallback, then offer **Fable 5.1**, **GPT-6
  Astra**, or **inline with this orchestrator**. A Fable/Astra choice is followed by an
  effort choice from the declared candidates for that family. `inline`
  resolves to the compatibility `planner_mode=inline` path; silence is not
  permission to choose it.
- An explicit `planner_mode`, `planner=<triple>`, or
  `planner_isolation=required` is a caller decision and suppresses this
  prompt.

Unknown detection is never treated as a supported triple. The detector records
`plan_needed`, the actual orchestrator triple (or `unknown`), its verdict,
`prompt_shown`, and the user's `prompt_choice` in the handoff. This is a preflight
decision, not dynamic capability scoring.

Resolution is deterministic and total — every branch below terminates at a
selected planner, never at "no planner selected":

1. Explicit `planner_mode=inline`, or `planner_mode=auto` with the user
   choosing **inline**, uses the existing same-call behavior and makes no
   dedicated planner call. Record `reused_from_orchestrator: true`, with
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
4. Dedicated mode (reached directly, or via rule 3) resolves to the explicit
   planner choice when one was supplied. When none was supplied, the default
   attempt is `claude/opus-5@medium` — unconditionally, whatever the
   orchestrator's harness is and however much codex headroom the probe
   reports. **Check this resolved triple against the orchestrator's
   canonicalized triple before launching anything**: if they match and
   `planner_isolation` is not `required`, reuse the orchestrator's own
   planning step (record `reused_from_orchestrator: true`) and make no call;
   otherwise try it as a live dedicated call.
5. **This rule applies after ANY rule-4 attempt fails — an explicit caller
   choice exactly as much as the default.** Try `claude/opus-5@medium` if it
   was not the attempt that just failed; otherwise try the declared fallback
   `codex/gpt-6-astra@low`. Exactly one of the pair gets tried here, and it is
   the required dedicated fallback regardless of what rule 4 was.
6. If the pair from rule 5 is exhausted (both unavailable, or both already
   attempted as the rule-4 choice), try the remaining declared candidates —
   whichever of `planner_candidates` has not yet been attempted — in list
   order. Record every attempted triple and its reason.
7. Use orchestrator-as-planner only when it was explicitly selected, the auto
   prompt chose inline, or after every dedicated candidate is unusable and the
   run needs a graceful fallback. Never silently substitute the orchestrator
   merely because the preferred planner failed. When the orchestrator plans, it
   wears both hats and still may not gate its own plan: the plan adversary is
   funded exactly as it would have been for a dedicated planner.

Rule 3 is what closes the `planner_mode=auto` + `planner_isolation=required`
gap: isolation being required only ever forces "don't reuse the orchestrator
triple," never "don't resolve a planner at all." Every combination of
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
unavailable, launch error, or planner-call failure. The reason is part of the
handoff metadata.

The no-duplicate-call reuse check is folded into rule 4 above, not a separate
step — it is the same deterministic optimization for both the "reuse a
supported orchestrator triple" path (rule 2) and the "dedicated resolution
happens to land back on the orchestrator's own triple" path (rule 4).

## Dispatch mechanics — orchestrator → planner

The orchestrator launches a dedicated planner the same way it launches any
other real delegation, per
[auto-routing](../skills/auto-routing/SKILL.md#dispatch-form-replaces-the-tier-ladder):
Herdr pane when `HERDR_ENV=1`, otherwise CLI in its own worktree — a dedicated
planner is a different process by construction, so it is never in-session. A
Herdr pane is **preferred** when available, because the planner has to talk to
the user and a visible pane is the natural surface for it.

- **Launch mechanism**: the sibling CLI skill for the planner's brand
  (`claude-cli`, `codex-cli`, or the `agy` CLI route), exactly as the executor
  and reviewer legs already use — no new launch mechanism is introduced.
- **First-line role tag**: `PLANNER`, from core's fixed enum
  ([roles-and-authority.md](../office-core/protocol/roles-and-authority.md)):
  `[PLANNER] <repo> — <task>`. The planner's own adversary announces
  `[PLAN-REVIEW] <repo> — <task>`.
- **Working directory**: a dedicated worktree of the target repo at `BASE`,
  read/write scoped to `docs/plans/<slug>.md` only; the planner does not touch
  application code.
- **Request/brief shape** — the **initial-intent packet**: the orchestrator's
  provisional request *labelled as provisional*, protected paths, target
  repository/worktree, `BASE`, validation commands, tracking issue, family id,
  the current three versions, the blast-radius ceiling verbatim, the funded
  review tier, and the exact output path for the packet below. The brief states
  plainly that the planner **may and should** interview the user, may revise any
  pre-freeze requirement on repository evidence, and may **not** dispatch an
  executor, hold a code gate, or perform a planner-held action.
- **Allowed tools**: read/search tools over the target repo (a Phase-1 scout's
  access), the user-facing question surface (the Herdr pane, or the harness's
  ask tool), the ability to spawn **one** plan adversary, and write access to
  the single output artifact path. No executor, code-review, or outward-action
  tool is granted.
- **Launch/read-back validation**: read the launched harness/model/effort back
  from its own banner or launch record (never assumed from the request) and
  compare it, canonicalized, against the requested triple before recording
  `attempts:`.
- **Failure and retry**: a planner call that fails, times out, or returns a
  status other than `ready` is one `attempts:` entry with its failure reason;
  the orchestrator does not retry the same triple and instead advances to the
  next resolution step (fallback, remaining candidates, or
  orchestrator-as-planner) per *Selection policy* above. A planner is never
  retried more than once at the same triple.
- **A planner blocked on the user is not a stalled planner.** Interactive
  planning waits on human turns by design. The orchestrator distinguishes
  *waiting on the user* from *dead* before re-dispatching anything; a pane with
  an unanswered question is the former.

## The plan packet

The planner returns one artifact at an orchestrator-provided path: a metadata
envelope followed by the full plan-contract sections. This packet — not the
planner's transcript — is the handoff.

```yaml
schema: auto-office.v3.plan-packet
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
requirements_version: <n>          # frozen by the planner at the end of discovery
plan_version: <n>
routing_version: <n>
family_id: <family/project id>
requirements_freeze:
  frozen_at: <iso8601>
  user_turns: <count of user exchanges during discovery>
  revisions_from_initial_intent:   # empty is valid; silence is not
    - field: <goal|scope|done_criteria|blast_radius|named_actions|non_goals|interfaces|milestones|problem_statement>
      from: <the orchestrator's provisional value>
      to: <the frozen value>
      evidence: <file:line or command output that forced the change>
plan_review:
  self_review: <summary of what the planner's own pass changed>
  adversary: <triple or none>
  findings:
    - id: <n>
      disposition: <accepted_fixed|rejected_with_evidence|unresolved>
      evidence: <what settled it>
open_questions:                    # `[needs-user]` items the planner could not close
  - <question + the planner's recommendation>
planner:
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
named actions, and the task assignment table.

**The orchestrator's validation is a shape check, not a re-review.** It rejects
a packet missing a required section, with a mismatched `base_sha`, with an
absent or unfrozen `requirements_freeze`, with a `plan_review` block that shows
an undisposed finding, or with planner metadata that does not match the actual
call. It does not re-argue task decomposition, architecture, or sequencing —
that plan was gated by the planner's adversary and is about to be gated by the
user. `open_questions` are surfaced to the user with the plan, batched, each
with the planner's recommendation.

The orchestrator copies or commits the accepted plan to the tracked
`docs/plans/<slug>.md` path before the approval gate. That tracked plan, its
full-SHA reference, and this metadata are the durable handoff; conversation
state is not.

## Waking the planner again

A planner exits after returning its packet. The orchestrator wakes a planner —
resumed where the harness supports it, fresh with the packet plus the delta
otherwise — **only** for a plan-contract amendment: architecture, interfaces,
dependency ordering, milestone structure, done criteria, or an invalidated plan
assumption. A woken planner runs the same shape: interactive delta-planning
with the user, self-review, its plan adversary, a new `plan_version`, and a
packet carrying only what changed.

Routing-only amendments and requirement deltas that still fit the plan never
wake it. See
[`family-registry.md`](family-registry.md#live-amendments).

## Observability

The run report and any `routing-outcomes.md` row carry these fields:
`planner_mode`, detection verdict, whether a plan was needed, the orchestrator
triple, prompt visibility/choice, planner triple, `reused_from_orchestrator`,
`fallback_used`, `fallback_reason`, the three versions, the count of pre-freeze
requirement revisions, and the funded review tier. A dedicated planner's
attempts are included when a fallback or failure occurs. Use the existing `brand`, `model`,
`effort`, and `dispatch_form` telemetry fields for the actual call; do not
invent a second executor/reviewer route record.

## Compatibility

`planner_mode=inline` keeps planning in the invoking session for callers who
want the pre-split shape. It is the same lifecycle either way: the interview,
the freeze, the self-review, the plan adversary, and the packet all still
happen — one process performs them instead of two, and that process still may
not gate its own plan.
