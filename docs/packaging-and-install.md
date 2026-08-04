# Packaging and Install

Hey! This is the practical guide to how the three offices get built, installed, versioned, and rolled back. Read it before you ship a plugin or change anything under `office-core/`.

## What we ship

Three independent plugins, each a root level folder in this repo:

* **codex-office**
* **claude-office**
* **agy-office**

Each one installs on its own. None of them needs a sibling folder to be present, and rolling one back never touches the other two.

## Anatomy of a plugin

```text
<plugin>/
├── .claude-plugin/plugin.json   the descriptor: id, version, description, keywords
├── SKILL.md                     the compact hub, the only always-loaded surface
├── COMPATIBILITY.md             supported core range, plus any declared exceptions
├── CHANGELOG.md                 one entry per release
├── office-core/                 vendored, pinned snapshot of the shared protocol
├── skills/<spoke>/SKILL.md      role and runtime spokes, loaded on demand
└── references/                  durable long form material reached through the spokes
```

## The one rule about office-core

`office-core/` at the repo root is the **only** editable source. The copies inside each plugin are generated snapshots.

Never hand edit a vendored snapshot. The checker hashes it and will fail the build, which is exactly what you want: a plugin that quietly disagrees with the protocol it claims to implement is worse than one that fails loudly.

**Why we vendor at all:** a plugin has to be complete when it is installed by itself. Snapshots are committed rather than generated at install time, so what is in git is what ships.

## The two commands

```bash
./scripts/vendor-core.sh     # refresh every plugin's core snapshot
./scripts/check-plugins.sh   # contract checks across all three plugins
```

`check-plugins.sh` verifies:

* **Descriptor validity**, so `plugin.json` parses, names itself correctly, and carries a semver version.
* **Hub budget**, warning past 9,000 bytes, because the hub is a dispatch surface and not a manual.
* **Snapshot freshness**, catching a stale snapshot, a missing one, or one that was edited by hand.
* **Compatibility declaration**, including a hard failure on any exception claiming `widens_core_authority: true`.
* **Required safety rules**, confirming each hub still states the gates that cannot be bypassed.
* **No catalog injection**, so no role template ships a full skills catalog.
* **Link integrity**, so every relative markdown link resolves on disk.

Warnings are advisory for now. Promote one to a hard failure only after a repeated violation shows what it actually costs.

## Release checklist

1. Did you change anything under `office-core/`? Bump `office-core/VERSION` using the table in `office-core/protocol/compatibility.md`, then run `./scripts/vendor-core.sh`.
2. Bump the version in the changed plugin's `.claude-plugin/plugin.json`.
3. Add a `CHANGELOG.md` entry. If a core change is involved, list every affected plugin version explicitly.
4. Run `./scripts/check-plugins.sh` and get a clean pass.
5. For a **major** core change, confirm all 3 adapters consume the current Kernel and handoff schema before any of them ships.
6. Pilot on the canaries in [canaries-and-rollback.md](canaries-and-rollback.md), then on production facing work under the normal authorization and review rules.

## Installing

The repo root carries `.claude-plugin/marketplace.json`, which lists all 3 plugins as local entries pointing at their folders.

**For Claude:** add this repo as a local marketplace, then install the plugins you want, one at a time. Installing `claude-office` alone is a supported and tested path.

**For Codex and Agy:** the current installations point their skill paths at these same folders. A symlinked path is fine during development. What matters is that the folder the client reads is a complete plugin root, which is precisely what vendoring guarantees.

**A note on symlinks:** they are convenient while you are iterating, since edits land instantly with no reinstall step. They also hide packaging defects, because a symlinked plugin can silently reach a sibling folder that a real install would never have. Before any release, verify against a copied folder rather than a symlink.

## Rolling back

Every plugin rolls back by itself. Reinstall the previous plugin version and you get its pinned core snapshot along with it, because the two travel together by design.

Record these 4 things for every canary and every release, so a rollback is a lookup rather than an investigation:

* Prior plugin version
* Core protocol version
* Installation path
* The exact removal and reinstall command

**Roll back when** a mandatory safety rule goes missing, 2 writers land in one worktree, an external mutation ships unverified, a standalone install fails, quality on recent canaries regresses by more than 10%, or p95 latency worsens by more than 15% after normalizing for packet size and task class.
