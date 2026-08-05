# Changelog — claude-office

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
