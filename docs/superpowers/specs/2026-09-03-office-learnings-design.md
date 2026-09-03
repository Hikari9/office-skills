# office-learnings: shared closeout self-heal skill

## Purpose

Every office's closeout already has a "record a durable lesson" step, but each office
duplicates that logic slightly differently, and recording today means writing a suggestion
somewhere (memory, a reference file) for a human to later turn into an actual edit. This
skill closes that loop: at closeout, durable lessons the run surfaced get applied directly
to the file that owns the rule, in the same commit, instead of parked as a suggestion.

This only self-heals effectively in a dev setup where the installed plugin path is this
repo checkout itself (local marketplace / symlinked install), which is how this repo's
owner runs it. It is not a mechanism for propagating lessons from a separate, unrelated
install back into this source repo.

## What ships

A new shared skill, `office-learnings`, following the exact precedent of the existing
`herdr` skill:

- Lives at `office-core/skills/office-learnings/SKILL.md` (root source, the only editable
  copy).
- Vendored into `agy-office/office-core/skills/`, `auto-office/office-core/skills/`, and
  `codex-office/office-core/skills/` by the existing `scripts/vendor-core.sh` (no script
  changes needed — it already copies everything under `office-core/`).
- Loaded by every closeout (`agy-closeout`, `codex-closeout`, `auto-closeout`,
  `claude-closeout`) at core closeout step 4 (Document).

## Procedure the skill follows

1. **Collect.** At step 4, enumerate any durable facts the run surfaced: a project
   decision, a non-obvious gotcha, a correction to how a role should work, a mechanism
   quirk. Same trigger condition core step 4 already states. Nothing to add is a valid
   outcome — say so and stop.

2. **Classify each lesson:**
   - **Plugin-local** — specific to one office's own mechanics (a CLI flag, a routing
     judgment call, an executor failure class). Owning file is one of that office's own
     `references/*.md` or `skills/*/SKILL.md`, per the routing table already declared in
     that office's `references/closeout.md`.
   - **Shared invariant** — applies across offices (a core protocol rule, a role-authority
     boundary, a closeout/evidence rule). Owning file is always under root `office-core/`,
     never a vendored copy inside a plugin.

3. **Locate the owning file.** Use the office's own routing table for plugin-local
   lessons; use `docs/rule-ownership-matrix.md` for shared ones. If no existing file/section
   plausibly owns the lesson, **do not create one** — surface it as an open item in the run
   report's "Still open" row instead of guessing at a new home for it.

4. **Edit in place.** Sharpen the existing rule's wording to cover the new case. Never
   append a new scenario row, log line, or bullet restating the same principle a second
   way — this repeats the exact anti-pattern the corpus already resolved once (`runs/`,
   per `docs/rule-ownership-matrix.md`'s "Resolved" table). If the lesson contradicts an
   existing rule, fix the rule; if it's a genuinely new rule, add the smallest single
   addition that generalizes past this one run.

5. **Re-vendor if core changed.** Any edit under root `office-core/` requires running
   `./scripts/vendor-core.sh` before the closeout commit, so the commit never leaves a
   stale/edited-by-hand vendored snapshot behind (`check-plugins.sh` already fails hard on
   that).

6. **Record the audit trail.** Add a one-line entry to the `CHANGELOG.md` of every plugin
   whose file changed (already-established mechanism — core closeout step 4 already allows
   "update only what the repo already maintains"). No new log file, no accumulating
   scenario table.

7. **Fold into the existing closeout commit.** This is not a separate PR or a separate
   commit step — the amendment and its CHANGELOG line land in the same step-1/step-4
   commit closeout is already making for this milestone.

## Integration points (all edits, no new files besides the skill itself)

- `office-core/skills/office-learnings/SKILL.md` — new file, the skill itself.
- `office-core/protocol/closeout.md` step 4 — reference loading `office-learnings` for the
  durable-lesson case, replacing the current inline paragraph.
- `auto-office/references/closeout.md`, `agy-office/references/closeout.md`,
  `codex-office/references/closeout.md` — replace each `## Recording durable lessons`
  section with a pointer to `office-learnings` plus that office's own routing table (the
  routing content itself is preserved, just no longer duplicating the shared procedure).
- `docs/rule-ownership-matrix.md` — update the "Where a durable lesson gets recorded" row
  to point at the new shared skill instead of "per-office adapter."
- `scripts/check-plugins.sh` — add a presence/contract check for `office-learnings`
  mirroring the existing Herdr check (file exists, has expected frontmatter markers).
- `agy-office/skills/agy-closeout/SKILL.md`, `codex-office/skills/codex-closeout/SKILL.md`,
  `auto-office/skills/auto-closeout/SKILL.md`, `auto-office/skills/claude-closeout/SKILL.md`
  — each gets an explicit line requiring `office-learnings` at the documented step.
- `office-core/VERSION` and `office-core/protocol/compatibility.md` — bump per the existing
  compatibility policy, since this is a core addition all three plugins must vendor.
- Each plugin's `.claude-plugin/plugin.json` version and `CHANGELOG.md` — bump per the
  existing release checklist in `docs/packaging-and-install.md`.

## Out of scope

- No cross-repo sync/intake queue for lessons surfaced by installs that are physical
  copies elsewhere (not this checkout). That was explicitly ruled out in favor of the
  narrower "self-heal wherever the session is actually running" scope.
- No new log/journal file. The existing CHANGELOG mechanism is reused as-is.
- No change to how core step 4 decides *whether* a lesson is durable enough to record —
  only *what happens once one is identified*.

## Testing / validation

- `./scripts/vendor-core.sh` then `./scripts/check-plugins.sh` must pass clean, including
  the new `office-learnings` presence check.
- `node eval/validate-cases.mjs` must pass (no schema/case changes expected, but it's part
  of the standard release gate).
- Manual read-through: each office's `references/closeout.md` still names its own
  plugin-local routing destinations; none of that routing detail is lost in the dedup.
