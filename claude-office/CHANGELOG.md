# Changelog — claude-office

## 1.5.0 — 2026-08-13

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
- **Wired into the hub** so it is read before anything else, restating the rule at the entry point.

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

## 1.3.3 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- The hub's Four Phases section now requires the field at the close of every phase.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 1.3.2 — 2026-08-05

- **Protocol version corrected to `1.2.0`** (was `1.1.0`, while the vendored core was already
  `1.2.0`), and **"the planner never implements" is now declared as a narrowing of core** — core
  `1.2.0` explicitly permits inline planner implementation and this hub makes that file a mandatory
  read, so the pair read as a contradiction with no indication which governed. The rule is unchanged.
- The Executor role cell said "review every task itself", two lines above "the executor never
  approves its own work". Now "self-check every task before handoff" — same behavior, no longer
  phrased as a warrant to self-approve.

## 1.3.1 — 2026-08-05

- `claude-planning` — the reference to core's plan contract was a **bare backtick path**, which does
  not resolve from inside a spoke (only from the plugin root). Now a working relative link. The
  five required section names were already spelled out inline here, so the practical damage was
  limited to a dead pointer — unlike auto-office, where the same bare path was the *only* carrier of
  those sections. `scripts/check-plugins.sh` now enforces both halves.
- `claude-cli` — records the scoped `--allowedTools` allowlist as the default permission form, that
  the prompt must be piped on stdin (a positional prompt yields a registered-but-`idle` agent), and
  that the two-refusals fallback requires two refusals **in the current run**. Written while fixing
  the auto-office 2.3.1 stale-denial defect; see that entry.

## 1.3.0 — 2026-08-02

- `claude-cli` — new section: `--add-dir <your own working tree>` is **not** isolation. A dispatched
  agent told to "create your own branch off main" satisfied that by running `git checkout main` in
  the shared tree first, leaving the planner's checkout on `main`; the planner's next commits and a
  `git push … HEAD` deployed to production. Pre-create the agent's worktree and point `--add-dir` at
  that. One-writer-per-tree needs reading as one-**checkout**-per-tree — nothing edited the same
  file; the damage was a branch switch.

## 1.2.0 — 2026-08-01

Pinned to office-core `1.2.0`, which adds three shared invariants this office now carries:

- `claude-closeout` gains the **cost retrospective** — per task: brand, model, effort, dispatch form,
  review rounds, tokens where reported, wall clock — plus one honest paragraph on what was over- or
  under-provisioned. Headroom is reported **per window with reset times**; single-number deltas are
  banned, because a tightest-of-two-windows reading appears to gain headroom when the 5-hour window
  resets mid-run.
- `claude-executor` gains the **`BRIEF DEFECT`** return: stop without implementing when the brief's
  stated cause is false at `BASE`, with evidence, consuming no review round. A reviewer gates a diff
  against a plan and therefore cannot see a wrong brief at all.
- `claude-executor` gains the two standing brief clauses (reproduce at `BASE`; a shipped test must be
  pasted failing at `BASE`) and an explicit **in-session fan-out** permission, bounded by the brief's
  file scope and one-writer-per-tree.

Re-vendored the core snapshot.

## 1.0.0 — 2026-08-01

Restructured from a single 23,704-byte hub into a hub-and-spoke plugin against `office-core`
`1.0.0`:

- `SKILL.md` compacted to a hub under the 8,000-byte budget: roles, invocation gate, execution
  mode, non-bypassable safety rules, protocol version, routing table, the four phases, composing
  with other skills, run telemetry, maintenance/release, and a trimmed Red Flags table.
- New spokes: `skills/claude-planning`, `skills/claude-cli`, `skills/claude-executor`,
  `skills/claude-reviewer`, `skills/claude-closeout`. `skills/claude-cli-send-message` carried over as-is.
- New `COMPATIBILITY.md` declaring the core range supported and two office-specific exceptions
  (`--cli` as default execution mode; the `claude-cli-send-message` answer channel).
- `references/` left in place; spokes link to it with `../../references/<file>.md`.
- No behavior change intended — this is a reorganization of an existing, working office. Every
  rule that existed in the old hub is either still in the hub or moved verbatim/compressed into
  the spoke that owns it.
