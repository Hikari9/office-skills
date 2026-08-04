# Changelog — agy-office

## 1.2.0 - 2026-08-01

### Changed

- Pinned to office-core `1.2.0`:
  - `agy-closeout` gains the **cost retrospective** — per task: brand, model, effort, dispatch form,
    review rounds, tokens, wall clock — and states that **agy reports no token counts**, so wall
    clock, review rounds, and what Phase 2b caught are this office's cost signal. `n/a`, never `0`.
    Headroom is reported per window with reset times, never as a single-number delta.
  - `agy-executor` gains the **`BRIEF DEFECT`** return and the two standing brief clauses
    (reproduce the stated cause at `BASE`; show a shipped test failing at `BASE`). This matters most
    here: an agy executor implementing a false premise produces work that is self-consistent, passes
    its own checks, and survives Phase 2b — which verifies the work is real, not that the premise was
    true.
  - `agy-executor` gains an **in-session fan-out** permission bounded by the brief's file scope and
    one-writer-per-tree, with the mechanism left to this harness.
  - `agy-reviewer` **splits the two gates.** Code review remains barred to `agy` — long, adversarial,
    multi-round work against a diff is its documented weakness. **Plan review is permitted** at `agy`
    high when `agy` is the planner: one short, single-shot, breadth-first read of one document, which
    is its documented strength. Previously the blanket bar made an agy planner's plan-review row
    unreachable.
- Re-vendored the core snapshot.

## 1.1.0 - 2026-08-01

### Changed

- Pinned to office-core `1.1.0`, which promotes the closeout procedure to
  `office-core/protocol/closeout.md`. It was previously duplicated, effectively verbatim,
  across two plugins and kept in sync by hand.
- `references/closeout.md` is now a thin adapter over the core procedure, carrying only this
  office's additions. Here that is running the gate yourself (an agy run does not fire the Stop hook), the harder look at the agy handoff's Upline list, and the three-way split of durable lessons.
- Re-vendored the core snapshot.

No safety rule was removed and no step was dropped. Every closeout step in 1.0.0 is still run.

## 1.0.0 - 2026-08-01

Restructured from a single 25,335-byte hub into a hub-and-spoke plugin against `office-core`
`1.0.0`:

- `SKILL.md` compacted to a hub under the 8,500-byte budget: roles, required background, why five
  phases, invocation gate + caller overrides, non-bypassable safety rules, protocol version,
  routing table, the five phases, composing with other skills, run telemetry, maintenance/release,
  and a trimmed Red Flags table.
- New `.claude-plugin/plugin.json` plugin descriptor.
- New spokes: `skills/agy-planning` (plan-authoring prose — the interview floor, pinned
  signatures, routing tags, dispatch test, issue tracking), `skills/agy-cli` (the `agy` CLI
  adapter — launch form, flag order, quota, recovery), `skills/agy-executor` (the Phase 2 packet
  contract and commit boundary), `skills/agy-verification` (Phase 2b's seven-check pass),
  `skills/agy-reviewer` (Phase 3's adversarial gate), `skills/agy-closeout` (Phase 4).
- New `COMPATIBILITY.md` declaring the supported core range `>=1.0.0 <2.0.0` and two
  office-specific exceptions (`agy-phase-2b`, `agy-non-agy-reviewer`).
- `references/` left in place; the hub and every spoke link to it with
  `../../references/<file>.md` (or `references/<file>.md` from the hub itself).
- **No safety rule was removed.** Phase 2b independent verification is unchanged and still
  mandatory and structural, the pinned-signature requirement is unchanged, and the reviewer is
  still always a non-agy (Claude) agent. This is a reorganization of an existing, working office —
  every rule that existed in the old hub is either still in the hub or moved verbatim/compressed
  into the spoke that owns it.
