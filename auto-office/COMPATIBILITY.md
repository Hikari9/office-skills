# Compatibility — auto-office

| Line | Value |
|---|---|
| Plugin version | `18.0.0` (see `.claude-plugin/plugin.json`) |
| Core protocol supported | `>=18.0.0 <19.0.0` |
| Core protocol vendored | `18.0.0` (see `office-core/SNAPSHOT.json`) |
| Vendored snapshot | `office-core/SNAPSHOT.json`, written by `scripts/vendor-core.sh` |
| Sibling plugins required | `codex-office`, `agy-office` — for the CLI, executor, and closeout mechanics of those two routes. The claude route ships in this plugin as of `4.0.0`. |

This plugin is a **router** over `office-core` and the three tool offices. It restates or links
every core gate that applies to it, narrows several, and never widens authority, drops a gate,
reassigns a role, or redefines a verdict. Where this plugin and a sibling spoke disagree, the
stricter rule wins. See `office-core/protocol/compatibility.md` for the adapter contract.

## Exceptions

```yaml
exceptions:
  - id: auto-orchestrator-selection
    owner: auto-office
    reason: >
      The invoking model is core's Orchestrator and is never selected by auto-office routing. It may
      invoke a dedicated interactive Planner, consume its plan packet, and retains all lifecycle,
      state, dispatch, approval, amendment, and closeout authority. The Planner owns requirements
      discovery with the user and the plan; it holds no gate and keeps no run state. Executor
      selection and adversary floors remain as routed.
    widens_core_authority: false
  - id: auto-task-subdelegation
    owner: auto-office
    reason: >
      The orchestrator dispatches the dedicated planner when selected, then one executor per repo,
      Phase 1 scouts, and an integration adversary only when two or more executors produce dependent
      or merging landings. The planner dispatches its own plan adversary; the executor launches its
      own code adversary at the orchestrator's declared triple. The approved Executor may sub-delegate
      individual tasks to another tool (typically agy for read-only recon and bulk mechanical work).
      When `HERDR_ENV=1`, every real delegation uses the Herdr pane contract; otherwise same-brand
      fan-out may use the existing in-session route and cross-brand fan-out uses CLI. Ordinary
      sub-delegation never creates a second writer. The core Tester exception permits one
      Executor-owned Tester to write disjoint test/config paths in the Executor's tree under the
      shared lock and pathspec contract.
    widens_core_authority: false
  - id: auto-goal-locked-autonomy
    owner: auto-office
    reason: >
      After a single explicit plan approval the run proceeds to closeout without further
      go-aheads, driven by a GOAL block with binary, command-verifiable done-criteria. This narrows
      the number of approval prompts, not the set of gates: independent review still runs every
      round, PLANNER-HELD steps still stop the run, and the loop stops for destructive or
      production-facing writes, external sends, and user-owned decisions. The loop may not raise a
      cap, remove a phase, downgrade the reviewer, or widen its declared blast radius.
    widens_core_authority: false
  - id: auto-opus-reviewer-floor
    owner: auto-office
    reason: >
      The code-review gate is a fresh reviewer independent of whoever executed: `codex-luna` xhigh by default, a fresh Opus subagent at low as the fallback.
      The Codex Luna path is no longer conditional on who orchestrated (2026-09-10); it is the
      standing default holder, and the reviewer is never the agent that wrote the diff. This is strictly narrower
      than core, which permits any independent reviewer. Core 18.0.0 states that a declared floor
      binds the gate it was declared for, so this floor is the code-review gate's alone.
    widens_core_authority: false
  - id: auto-plan-review-gate
    owner: auto-office
    reason: >
      A plan-review gate runs between the planner's self-review and user approval: one adversarial
      pass over the plan document by a fresh agent of the planner's own brand, at that brand's
      Opus-tier low effort, which then retires permanently. Core 18.0.0 explicitly permits an office
      to add a plan-review gate ahead of user approval, and this one adds a gate rather than
      absorbing any existing one — the code-review gate, its opus-low floor, and every verdict
      are untouched. Its floor is declared separately (opus low) and binds only itself. It runs
      exactly once and is never recalled, so it can never gate work it previously approved.
    widens_core_authority: false
  - id: auto-no-coordinator
    owner: auto-office
    reason: >
      Core permits a coordinator role; this office declines to use one. At two or more executors the
      planner distributes the briefs the plan already wrote and monitors the lanes itself. This
      replaces the withdrawn auto-pm-fanout exception, which was removed in plugin 3.0.0 after the
      only run that spawned a PM recorded it dispatching three lanes for roughly an hour and then
      being driven directly by the planner regardless. Declining a permitted role removes an actor
      and adds no authority anywhere.
    widens_core_authority: false
  - id: auto-mandated-executor-tier
    owner: auto-office
    reason: >
      Claude Sonnet high is the standing executor default. Every executor still runs at its
      brand's fixed default tier when another brand is selected: `gpt-5.6-luna` high for codex,
      Flash latest high for agy. No self-escalation and no model substitution without an explicit
      caller override. A worker's brand and tier are assigned by
      the planner in the plan and may exceed the executor's tier — which core's delegation test
      anticipates, since a delegation is allowed to buy tier — but a worker is never promoted at run
      time. This narrows core rather than widening it: core sets no model policy, and every path
      here removes agent discretion rather than adding it, moving the decision to plan time where it
      is reviewable before it is paid for.
    widens_core_authority: false
  - id: auto-opus-only-self-heal
    owner: auto-office
    reason: >
      Narrowed in core `17.3.0`: general durable-lesson self-heal (a mechanism gotcha, a routing
      lesson, a shared-invariant proposal) moved to the shared `office-learnings` skill
      (`office-core/skills/office-learnings/SKILL.md`), loaded by every office's closeout with no
      tier restriction — see `auto-closeout` item 13. This exception now covers only this office's
      own routing ledger, `routing-outcomes.md` (`auto-closeout` item 12): appending a cost/quality
      row there stays restricted to a claude planner at Opus tier, and a codex or agy planner still
      writes a proposal into the run report and stops instead. Even permitted, neither mechanism may
      relax a safety rule, raise a cap, widen a blast radius, downgrade a reviewer, or touch a
      vendored `office-core` copy — a shared invariant is always a proposed core change, never
      self-edited. This is a restriction on the maintenance authority every office already has, so
      it narrows rather than widens.
    widens_core_authority: false
```

## Re-audit against core 18.0.0

**2026-09-10, core `18.0.0`.** Every exception below was re-checked against the current core, not
the historical one, and all remain `widens_core_authority: false`. Two obsolete claims were removed
in the process:

- **"The planner does not implement" is no longer an auto-office narrowing.** Core `18.0.0` permits
  a producer to implement inline when the delegation test buys nothing, and this office follows core:
  an orchestrator inline write is allowed for a fix whose brief would exceed the edit, never for
  volume, never overlapping a live executor, and never for the run's main correctness or security
  risk. (agy-office still narrows this; auto-office does not.)
- **Reviewer and plan-review floors** are unchanged in substance and now read against core `18.0.0`,
  which adds a separately declared floor for the planner-local plan adversary and the integration
  adversary.

Core `18.0.0` also absorbs the producer-owned dispositions, the inline-review tier, the
integration-scoped final adversary, the landing packet, and the three independent versions, so none
of those is an auto-office exception either.

### Historical: re-audit against core 2.0.0

Core `2.0.0` absorbed three things this office would otherwise have had to declare, so they are
**not** exceptions here:

- **The express gear** is a core-declared phase set, chosen by core's own fit test. This office
  selects among core's gears; it does not invent a shape.
- **Milestone landing** is core's repeatable closeout plus the plan contract's `milestones:` block.
- **Named actions** are core's — a planner-held action stays the planner's to perform, and the plan
  naming it verbatim with preconditions is what removes the *pause*, not the *actor*. This office
  narrows nothing here and widens nothing; it inherits the rule intact.

The remaining exceptions were also re-checked against core `2.0.0` at the time and all remain
`widens_core_authority: false`:

- `auto-orchestrator-selection` — the invoking model is the Orchestrator and is not auto-selected.
  The dedicated interactive Planner call is a routing decision, not an authority widening: the
  planner gains the user interview and the pre-freeze requirements, both of which core now assigns
  to that role.
- `auto-task-subdelegation` — the orchestrator dispatches the planner and executor stages; the
  approved Executor owns task-worker fan-out and launches its declared code adversary. Core's
  Herdr override takes
  precedence when `HERDR_ENV=1`; without Herdr, same-brand fan-out is in-session, cross-brand is CLI,
  and neither creates a second writer.
- `auto-goal-locked-autonomy` — unchanged. The loop still cannot raise a cap, remove a phase,
  downgrade a reviewer, or widen its blast radius, and it gained a stop (`BRIEF DEFECT`) rather than
  losing one.
- `auto-opus-reviewer-floor` — reworded above to name the **code**-review gate explicitly, which is
  what core 18.0.0 now requires of a declared floor. Still strictly narrower than core.

**Confirmed at the time: no existing exception covered "the planner does not implement." **Superseded by the core `18.0.0` re-audit above** — auto-office no longer declares that narrowing.** The four declared were
`auto-orchestrator-selection`, `auto-task-subdelegation`, `auto-goal-locked-autonomy`, and
`auto-opus-reviewer-floor`, none of which mentions it — because planner-never-implements was a
*narrowing* of core, and narrowings need no exception. Nothing was removed here; lifting the rule
required only deleting the over-tightening from this plugin's own prose.

## Re-vendoring

When `office-core/VERSION` changes in a way that affects this plugin, re-vendor with
`scripts/vendor-core.sh` from the repo root, bump this plugin's version, add a `CHANGELOG.md`
entry, and run `scripts/check-plugins.sh` before shipping.
