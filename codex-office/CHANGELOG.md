# Changelog

All notable changes to the `codex-office` plugin are documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 1.4.0 — 2026-08-11

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

## 1.3.3 — 2026-08-11

Both entries come from failures observed in the `connect.favor.church` department progressive-loading
run, where two individually-correct instructions combined into a defect.

- **Every Upline instruction must declare whether it halts the run.** `evidence-and-handoff.md` gains
  **§ Every Upline instruction must say whether it halts the run**. The authority boilerplate's
  blanket "raise it Upline and stop" is right for a remote/production/credential action and
  catastrophic when it attaches to a per-finding "raise this Upline" — a conservative executor
  resolves the conflict by halting *everything*. Observed: a five-finding fix brief whose headline
  item was a verified data-loss defect returned zero implementation and zero commits, because the
  *fifth* finding's narrow sub-case touched a protected path. Briefs must now mark each escalation
  `note and continue` or `stop the run`, carry the mixed-severity procedural override, and rank
  findings so an executor forced to choose protects the worst defect rather than the last paragraph.
- **`VERDICT: PENDING` while a review file is incomplete.** `references/reviewer-brief.md` gains that
  state. "Write the verdict file early so a kill doesn't lose it" and "end with exactly one verdict
  line" jointly produce a stub whose stamped verdict is indistinguishable from a real one — and the
  two-consecutive-`CHANGES REQUIRED` plan-defect presumption *acts* on that. A stub, or a stamped
  verdict with an empty findings section, is now explicitly **not a round**: do not advance either
  counter for it, re-dispatch instead.

Neither entry relaxes a safety rule, raises a cap, widens a blast radius, or downgrades a reviewer.

## 1.3.2 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- The hub's four-phase section now requires the field at the close of every phase.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 1.3.1 — 2026-08-05

- **Protocol version corrected to `1.2.0`** (was `1.1.0`, while the vendored core was already
  `1.2.0`), and **"the planner does not implement the plan" is now declared as a narrowing of core** —
  core `1.2.0` permits inline planner implementation and this hub makes that file a mandatory read.
  The rule is unchanged; it is labelled so the two documents no longer contradict each other silently.

## 1.3.0 — 2026-08-02

- `codex-cli` — new **"Watching it run — never pipe the dispatch"** section. Launch as a background
  task with **no pipes on stdout** and hand the user the harness's `.output` path. Never pipe
  through `tail`/`head`: they buffer the whole stream until exit, so the task-output file sits at 0
  bytes, the required liveness check has nothing to read, and the user has nothing to watch —
  observed on a ~19m dispatch where the user had to ask for a log path mid-run. And never write logs
  into the target repo: a first pass at this rule created `.run-logs/` plus a `.gitignore` entry in
  the user's repo, which they called intrusive. The handoff file is the artifact that belongs in the
  repo; the log is not. `agy-office/skills/agy-cli` already carried both halves — the mistake is per
  dispatch mechanism, not per brand, so it is now stated in both.

## 1.2.0 - 2026-08-01

### Changed

- Pinned to office-core `1.2.0`. Three shared invariants land in this office's spokes:
  - `codex-closeout` gains the **cost retrospective** — per task: brand, model, effort, dispatch
    form, review rounds, tokens where reported, wall clock — plus one honest paragraph on what was
    over- or under-provisioned, and **headroom reported per window with reset times**, never as a
    single-number delta.
  - `codex-executor` gains the **`BRIEF DEFECT`** return: the executor stops without implementing
    when the brief's stated cause is false at `BASE`, and that return consumes no review round. A
    reviewer cannot catch a wrong brief, so this is the only path that exists for one.
  - `codex-executor` gains the two standing brief clauses (reproduce the stated cause at `BASE`;
    a test must be shown failing at `BASE`) and an **in-session fan-out** permission bounded by the
    brief's file scope and one-writer-per-tree. The permission is stated; the mechanism is not
    prescribed.
- Re-vendored the core snapshot.

## 1.1.0 - 2026-08-01

### Changed

- Pinned to office-core `1.1.0`, which promotes the closeout procedure to
  `office-core/protocol/closeout.md`. It was previously duplicated, effectively verbatim,
  across two plugins and kept in sync by hand.
- `references/closeout.md` is now a thin adapter over the core procedure, carrying only this
  office's additions. This office adopts the full step-by-step procedure it previously described only in summary; its authorization language and report fields are unchanged.
- Re-vendored the core snapshot.

No safety rule was removed and no step was dropped. Every closeout step in 1.0.0 is still run.

## 1.0.0 - 2026-08-01

### Changed

- Restructured from a single flat `SKILL.md` into a hub-and-spoke plugin: a compact
  `SKILL.md` hub (orientation and dispatch only) plus four spokes —
  `skills/codex-cli`, `skills/codex-executor`, `skills/codex-reviewer`,
  `skills/codex-closeout` — each loaded only by the role and phase that needs it.
- Added the `.claude-plugin/plugin.json` descriptor, versioning this plugin independently of
  its sibling offices.
- Pinned to office-core protocol `1.0.0`, vendored at `office-core/` in this plugin (see
  `COMPATIBILITY.md`).

### Notes

- Behavior is unchanged: same four phases, same roles, same models, same routing to the existing
  `references/` files.
- No safety rule was removed; every prior rule is restated in the new hub or in a spoke.
