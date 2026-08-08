# Changelog — agy-office

## 1.2.2 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- The hub requires the field at the close of every phase, 2b included (one line — the hub is a
  dispatch surface and was already at 8934 of its 9000-byte budget). The Phase 2b reasoning moved
  to the `agy-verification` spoke, which names 2b as this office's characteristic `no`: that
  evidence is the planner's own and is not on disk unless the planner writes it there.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 1.2.1 — 2026-08-05

- **Protocol version corrected to `1.2.0`.** The hub claimed `1.1.0` while `office-core/VERSION` and
  every vendored protocol file were already `1.2.0`. A reader could not tell whether the vendored
  copy was ahead of spec, and therefore whether core `1.2.0`'s clauses bound this office.
- **The "planner never implements" rule is now declared as a narrowing of core.** Core `1.2.0` states
  the opposite and calls an absolute prohibition a mistake — while this hub makes that same core file
  a mandatory read. The rule is unchanged and still correct here; it is now labelled as a deliberate
  local narrowing so the two documents no longer read as a flat contradiction.
- `references/routing.md` — the 3-task dispatch ceiling was written as `~3` / "roughly three" in the
  same corpus where the hub calls it a hard cap; a tilde is what an agent at task 3 uses to justify
  task 4. Now the bare integer, marked as a cap. The "hard debugging → *consider* not using agy" cell
  is now an instruction: do not route it through agy, recommend `claude-office` out loud.

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
