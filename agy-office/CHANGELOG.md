# Changelog — agy-office

## 2.1.0 — 2026-08-22

- **Worktree execution & PR workflow:** agy-office now strictly pre-creates and operates inside an isolated git worktree (`.worktrees/<slug>`), opens a PR referencing the tracking issue, and merges to main before cleaning up the worktree.
- **Core 2.0.0 re-vendored:** planner scratch and the planner's own working tree are pinned to the run's worktree, never the target repo's primary checkout.

## 2.0.0 — 2026-08-14

Core `2.0.0`. Adopts the release's three protocol changes and fixes the delegation bug behind
"delegates can't reach MCP".

### The fit test picks a gear

`direct` / `express` / `full`. Express is core's declared phase set — short plan → execute → **Phase 2b** →
**one** adversarial review → land it — with **no plan-review pass** and a **2-round cap**; a second
`CHANGES REQUIRED` promotes the run to full rather than funding a third round. Any yes to the
irreversible/production/externally-visible question still forces **full**, and express drops
**phases, never floors**.

**Phase 2b survives express.** It is not a review phase — it is the reason an agy executor's report
is believable at all, since agy exits 0 having done nothing. It is a floor, not a phase.

### Closeout runs per milestone

The plan declares `milestones:`; each group of done-criteria that goes green is gated, committed,
PR'd and merged along the promotion chain **during** the run. Sync, worktree removal and Upline
closure stay terminal. The merged branch is the run's re-entry point, so an interruption costs one
milestone instead of the whole run.

### Planner-held names the actor, not a pause

An irreversible action stays the planner's to perform and never transfers to an executor. It runs
**without a fresh go-ahead** when the plan's `named_actions:` names it verbatim with its dry run,
revert target and read-back. A vague entry authorizes nothing and stops the run; so does a failed
precondition. The only unconditional stops left are an external send and a user-owned decision the
plan did not anticipate.

### Live-system work is delegated with its access

`agy-cli` gains the same boundary rule: `--dangerously-skip-permissions` removes local approval
stops but an agy process reaches only the MCP servers configured for agy. Route elsewhere when the
server is absent rather than concluding delegates cannot do MCP work. Production **reads** are
ordinary delegated work — and pinning the shape matters more here than anywhere, because agy invents
plausible shapes confidently and a pinned shape is the only thing a fabrication can collide with.

### Trimmed

Run report shortened and given a mandatory **not verified** row; the **cost retrospective is
removed** (core `2.0.0` no longer requires it — it produced paragraphs nobody acted on). Self-heal
bar raised to *write a rule or write nothing*, with "nothing durable to add" stated as the expected
outcome.

## 1.4.0 — 2026-08-13

Core `1.5.0`. Adds the **fit test**: before an invoked office interviews, plans, or dispatches, it
prices the whole run and says out loud whether the office is worth paying for.

- **The office now discerns whether to be an office.** `roles-and-authority.md` gains *Fit test —
  before the office runs at all*, above the per-task delegation test. Four questions — risk, size and
  shape, ambiguity, and whether a fresh adversarial reader would catch something. Any yes on risk, or
  two or more yeses across the rest, and the office runs as specified; none, and the run is overhead,
  so the work is done directly under the same safety rules.
- **It explains, it does not ask.** The verdict is stated in two or three sentences — the call, the
  reason, what the alternative would have cost — then the run proceeds. A user who typed the office's
  name gets an explanation of a downgrade, never a request for permission to think.
- **Bounded so it cannot become a bypass.** It chooses only between the full office and direct work;
  no partial office. It may never downgrade an irreversible, production-facing, or externally visible
  run, and never downgrade because quota is short or an executor brand is unavailable — those are
  routing problems, answered by the routing table rather than by less review. A caller override
  outranks it in both directions.
- **Phase 2b stays structural.** A run that proceeds under this office keeps its verification pass;
  the fit test never trades a phase away.
- **Wired into the hub** so it is read before anything else, restating the rule at the entry point.

## 1.3.0 — 2026-08-11

Core `1.4.0`. Five changes from live-run failures: planners holding work inline that the executor
should have bought, agents losing the protocol past Phase 2, code review running long because
findings named defects but not fixes, unreadable spawned sessions, and a hub budget the router had
already outgrown.

- **The delegation test buys a fourth thing: price.** `roles-and-authority.md` — the planner is the
  office's most expensive writer and the executor is sonnet-tier by fixture, so implementation
  *volume* is itself a purchase: two to six times cheaper per output token, in parallel, at the same
  gated quality. Task count is still never the reason to delegate; the tokens those tasks would cost
  at planner rates are. Without this line a nine-task run held inline read as compliant.
- **The justification clause is inverted, so the bias has to be written down.** `plan-contract.md`
  already demanded a one-clause reason per *delegation*. Now an **inline** row must also state what a
  delegation would have bought and why the brief costs more than the edit — and an inline row that
  cannot be justified in a clause is one to delegate. The plan-reviewer checks it like any other
  claim. Every file-count threshold (`1–3 files` / `>3 files`) is deleted rather than retuned: three
  files inside one function and three files across three surfaces are not the same work.
- **Re-read the protocol at every phase boundary and after every compaction.** Nothing previously
  told the survivor of a compaction to reload; the loop recommends compacting at every task boundary,
  so a run reliably kept its GOAL and lost its gates. The rule binds whoever holds the phase — the
  same agent across a boundary as much as a fresh one.
- **Code review moves to `opus` high and its findings carry a fix guide.** Each numbered finding adds
  `Fix:` (the approach, not a patch), `Where:` (the address), and `Rejected:` (the plausible-but-wrong
  fix and why it fails) — the last of these because a finding whose obvious remedy targets the wrong
  term ships a freeze as a fix for a lag. Two guardrails travel with it: the reviewer still never
  writes the fix, and on follow-up rounds it judges the result on correctness, never on whether its
  own suggestion was followed. **Plan review stays at `opus` low** — the ledger records it returning
  the best value per token in the run five times running, and the two-floor design is unchanged.
- **The plan-defect presumption tightens from 2 consecutive to 2 total.** An `APPROVED`-then-rejected
  sequence no longer resets the count: a task that needed two rounds of findings is a task whose
  instruction was wrong, whatever landed between them.
- **Every dispatch announces its role in its first brief line** — `[ROLE] <repo> — <task>`, with the
  same string passed to any label flag the brand exposes. The first line is the carrier because codex
  and agy expose no naming flag at all. The prefix stays a display convenience: matching is still on
  session or worktree identity, never on a label.
- **Hub byte budget 9000 → 12000** (`scripts/check-plugins.sh`), still a warning, not a failure.

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
