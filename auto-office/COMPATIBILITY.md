# Compatibility — auto-office

| Line | Value |
|---|---|
| Plugin version | `2.0.0` (see `.claude-plugin/plugin.json`) |
| Core protocol supported | `>=1.2.0 <2.0.0` |
| Core protocol vendored | `1.2.0` (see `office-core/SNAPSHOT.json`) |
| Vendored snapshot | `office-core/SNAPSHOT.json`, written by `scripts/vendor-core.sh` |
| Sibling plugins required | `codex-office`, `claude-office`, `agy-office` — for the CLI, executor, reviewer, and closeout mechanics of whichever brand is routed to |

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
      The orchestrator role is selected at plan time by a documented rubric (capability role, measured
      codex weekly headroom, speed-vs-correctness) instead of being fixed by the plugin. This is a
      runtime-mechanics choice about which process fills the orchestrator role, not an authority change:
      every gate in roles-and-authority.md applies unchanged to whichever tool is selected, and the
      review gate is held by a fresh reviewer that did not do the work in every case.
    widens_core_authority: false
  - id: auto-task-subdelegation
    owner: auto-office
    reason: >
      The selected orchestrator may sub-delegate individual tasks to another tool (typically agy for
      read-only recon and bulk mechanical work). Sub-delegation never creates a second writer — a
      worker works inside the orchestrator's tree under its supervision or returns an artifact
      the orchestrator applies — and inherits the orchestrator brief's file scope and constraints
      rather than a wider one.
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
      The code-review floor is a fresh Opus subagent at medium regardless of which brand executed.
      The Codex Sol reviewer path applies only when Codex is the planner. This is strictly narrower
      than core, which permits any independent reviewer. Core 1.2.0 states that a declared floor
      binds the gate it was declared for, so this floor is the code-review gate's alone.
    widens_core_authority: false
  - id: auto-plan-review-gate
    owner: auto-office
    reason: >
      A plan-review gate runs between the planner's self-review and user approval: one adversarial
      pass over the plan document by a fresh agent of the planner's own brand, at that brand's
      Opus-tier low effort, which then retires permanently. Core 1.2.0 explicitly permits an office
      to add a plan-review gate ahead of user approval, and this one adds a gate rather than
      absorbing any existing one — the code-review gate, its opus-medium floor, and every verdict
      are untouched. Its floor is declared separately (opus low) and binds only itself. It runs
      exactly once and is never recalled, so it can never gate work it previously approved.
    widens_core_authority: false
  - id: auto-pm-fanout
    owner: auto-office
    reason: >
      When a run needs two or more executors, the planner spawns a PM by CLI to distribute the
      briefs the plan already wrote and collect the results. The PM is core's permitted coordinator
      role: it holds no planner-held action and no gate of any kind — commit, PR, merge, deploy,
      escalation, and closeout stay with the planner — and it never re-decides routing, because a
      PM facing a routing decision means the plan was incomplete, which is a PLAN DEFECT. It is a
      separate role from the plan-reviewer, which has already retired, so no agent both distributes
      work and gates it. A single-executor run has no PM at all.
    widens_core_authority: false
  - id: auto-mandated-executor-tier
    owner: auto-office
    reason: >
      Every executor runs at sonnet-tier, high effort, regardless of task difficulty: sonnet high
      for claude, codex-terra high for codex, agy high for agy. No self-escalation and no model
      substitution without an explicit caller override. A worker's brand and tier are assigned by
      the planner in the plan and may exceed the executor's tier — which core's delegation test
      anticipates, since a delegation is allowed to buy tier — but a worker is never promoted at run
      time. This narrows core rather than widening it: core sets no model policy, and every path
      here removes agent discretion rather than adding it, moving the decision to plan time where it
      is reviewable before it is paid for.
    widens_core_authority: false
  - id: auto-opus-only-self-heal
    owner: auto-office
    reason: >
      Closeout may sharpen this plugin's own skill files only when the planner is claude at Opus
      tier; a codex or agy planner writes a proposal block into the run report and stops. Even
      permitted, a self-heal may never relax a safety rule, raise a cap, widen a blast radius,
      downgrade a reviewer, or touch a vendored office-core copy — a shared invariant is a proposed
      core change. This is a restriction on the maintenance authority every office already has, so
      it narrows rather than widens.
    widens_core_authority: false
```

## Re-audit against core 1.2.0

All four original exceptions were re-checked against core `1.2.0` and all four remain
`widens_core_authority: false`:

- `auto-orchestrator-selection` — still a runtime-mechanics choice about which brand fills the
  executor role, with every gate applying unchanged. The exception id is kept as-is for traceability
  even though this office's prose now says **Executor** rather than Orchestrator.
- `auto-task-subdelegation` — unchanged, and core 1.2.0's dispatch-form rule narrows it further:
  same-brand fan-out is in-session, cross-brand is CLI, and neither creates a second writer.
- `auto-goal-locked-autonomy` — unchanged. The loop still cannot raise a cap, remove a phase,
  downgrade a reviewer, or widen its blast radius, and it gained a stop (`BRIEF DEFECT`) rather than
  losing one.
- `auto-opus-reviewer-floor` — reworded above to name the **code**-review gate explicitly, which is
  what core 1.2.0 now requires of a declared floor. Still strictly narrower than core.

**Confirmed: no existing exception covered "the planner does not implement."** The four declared were
`auto-orchestrator-selection`, `auto-task-subdelegation`, `auto-goal-locked-autonomy`, and
`auto-opus-reviewer-floor`, none of which mentions it — because planner-never-implements was a
*narrowing* of core, and narrowings need no exception. Nothing was removed here; lifting the rule
required only deleting the over-tightening from this plugin's own prose.

## Re-vendoring

When `office-core/VERSION` changes in a way that affects this plugin, re-vendor with
`scripts/vendor-core.sh` from the repo root, bump this plugin's version, add a `CHANGELOG.md`
entry, and run `scripts/check-plugins.sh` before shipping.
