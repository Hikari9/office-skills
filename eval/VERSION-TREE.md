# Version tree (reverse-chronological)

Generated 2026-08-26T03:23:43.355Z at `a10bbce` by `eval/build-version-tree.mjs`. Do not hand-edit.

The offices are symlinked live into `~/.claude/skills`, so the version in effect at any
instant is this repo's working tree at that instant. Each row below opens an interval that
closes when the next row up begins; a run's timestamp falls in exactly one.

**The top row is current.** Rows below it are history — still worth learning from, but a
score from them is a score of code that no longer exists.

| # | Effective from | core | codex | claude | agy | auto | commit | moved |
|---|---|---|---|---|---|---|---|---|
| **→** | 2026-08-25 20:46 | 3.1.1 | 2.3.0 | 2.1.1 | 2.2.1 | 3.2.1 | `7546ab1` | core, codex-office |
| 12 | 2026-08-25 19:52 | 3.1.0 | 2.2.1 | 2.1.1 | 2.2.1 | 3.2.1 | `d5cfc3d` | core, codex-office, claude-office, agy-office, auto-office |
| 11 | 2026-08-25 13:03 | 3.0.0 | 2.2.0 | 2.1.0 | 2.2.0 | 3.2.0 | `83830ec` | core, codex-office, claude-office, agy-office, auto-office |
| 10 | 2026-08-25 12:28 | 2.0.0 | 2.1.0 | 2.0.0 | 2.0.1 | 3.1.0 | `a6f7b18` | codex-office |
| 9 | 2026-08-22 20:12 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.1 | 3.1.0 | `5f10fa1` | agy-office |
| 8 | 2026-08-14 16:58 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 3.1.0 | `2cd480f` | auto-office |
| 7 | 2026-08-14 13:00 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 3.0.0 | `746cba6` | core, codex-office, claude-office, agy-office, auto-office |
| 6 | 2026-08-13 15:10 | 1.5.0 | 1.5.0 | 1.5.0 | 1.4.0 | 2.10.0 | `bc53199` | core, codex-office, claude-office, agy-office, auto-office |
| 5 | 2026-08-11 19:42 | 1.4.0 | 1.4.0 | 1.4.0 | 1.3.0 | 2.9.0 | `ca777f3` | core, codex-office, claude-office, agy-office, auto-office |
| 4 | 2026-08-08 20:25 | 1.3.0 | 1.3.2 | 1.3.3 | 1.2.2 | 2.4.5 | `283d3be` | core, codex-office, claude-office, agy-office, auto-office |
| 3 | 2026-08-05 13:15 | 1.2.0 | 1.3.1 | 1.3.2 | 1.2.1 | 2.4.4 | `37073b2` | auto-office |
| 2 | 2026-08-05 13:01 | 1.2.0 | 1.3.1 | 1.3.2 | 1.2.1 | 2.4.3 | `3f149d3` | codex-office, claude-office, agy-office, auto-office |
| 1 | 2026-08-05 12:56 | 1.2.0 | 1.3.0 | 1.3.1 | 1.2.0 | 2.4.2 | `9a1a680` | claude-office, auto-office |
| 0 | 2026-08-04 10:10 | 1.2.0 | 1.3.0 | 1.3.0 | 1.2.0 | 2.3.0 | `bd5110d` | <initial> |

## Reading a boundary

Attribution is stamped `firm` or `fuzzy`. A run inside 6 hours before a version bump is
`fuzzy`: development happens in this working tree, so the newer content may already have
been live and uncommitted when that run executed. Treat a fuzzy run as evidence about
neither version rather than as evidence about the older one.

Runs before 2026-08-04 are labelled `pre-release`.
