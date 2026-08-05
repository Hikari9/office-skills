# Changelog

All notable changes to the `codex-office` plugin are documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
