---
name: office-learnings
description: Use at closeout step 4 (Document) to turn a durable lesson the run surfaced into a direct edit of the file that owns the rule, instead of leaving it as a suggestion for someone else to apply later.
---

# Office Learnings

Loaded by every closeout (`agy-closeout`, `codex-closeout`, `auto-closeout`, `claude-closeout`) at
core closeout step 4. It is the one shared procedure behind each office's own "recording durable
lessons" routing table — the routing destinations stay office-specific, this file is what happens
once a destination is known.

**Nothing to add is the expected outcome, not a failure.** Say so and stop. This is not a step
that must produce a diff.

## What counts as a durable lesson

Same trigger as core closeout step 4: a project decision, a non-obvious gotcha, or a correction to
how a role should work — something that would change what a *future* run does, not a fact already
derivable from the diff, the commit log, or existing docs.

## 1. Classify

- **Plugin-local** — specific to this office's own mechanics: a CLI flag, a routing judgment call,
  an executor failure class, a mechanism gotcha. The owning file is one of this office's own
  `references/*.md` or `skills/*/SKILL.md`, per the routing table in this office's own
  `references/closeout.md`.
- **A fact about the target project** (the repo the run was actually working in) — not a lesson
  about this office at all. Goes to memory or that project's own docs, per this office's routing
  table. Out of scope for the rest of this file.
- **Shared invariant** — applies to every office, not just this one (a core protocol rule, a role
  boundary, an evidence requirement). This is never self-edited. See "Shared invariants" below.

## 2. Plugin-local: edit in place

Find the file the routing table names. **Edit it directly, in the same commit closeout is already
making** — this is what makes it a self-heal rather than a suggestion. Requires no particular
planner brand or tier: any closeout that reaches step 4 may do this.

Rules for the edit itself:

- **Sharpen an existing sentence rather than appending a new one.** A list of past scenarios
  doesn't generalize; a rule does. If the lesson contradicts existing wording, fix the wording. If
  it's genuinely new, add the smallest single addition that would have prevented this run's
  specific miss, generalized past this one case.
- **Never invent a new file or section to hold it.** If no existing file plausibly owns the
  lesson, that is itself the finding: surface it as an open item in the run report's "Still open"
  row rather than guessing at a home for it.
- **Don't rewrite a rule you merely found inconvenient.** The bar is "this would have changed what
  I did," not "I disagree with this."
- **One line, in the plugin's own `CHANGELOG.md`**, under an `Unreleased` heading if the plugin
  isn't otherwise being version-bumped this run: what changed and why, matching the format already
  used in that file's other entries. This is the audit trail — there is no separate learnings log.

## 3. Shared invariants: propose, never self-edit

A lesson that belongs to every office — not just this one — is **never** applied directly, in any
setup, by any planner. State it as a proposed change (the exact rule and the file that would carry
it, e.g. `office-core/protocol/evidence-and-handoff.md`) in the run report, and stop there.

This holds even when `office-core/` happens to be reachable on disk (a local dev install where the
plugin path and the office-skills source repo are the same checkout): editing `office-core/` still
means editing a different, unrelated commit history than the one this run's diff belongs to, and a
vendored copy inside the plugin must never be hand-edited regardless
(`office-core/protocol/compatibility.md`). A shared invariant always waits for a human, or a
dedicated run against the office-skills repo itself, to apply it and re-vendor.

## Reporting

Whatever this step did — an edit, a proposal, or nothing — gets one line in the run report, not a
subsection. "No durable lesson this run" is as valid a line as naming the file that changed.
