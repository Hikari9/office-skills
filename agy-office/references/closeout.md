# Phase 4 — Closeout (Agy Office adapter)

**The procedure is core.** Run every step in `office-core/protocol/closeout.md`: confirm target,
commit, verify the gate, PR, document, sync main then remove the worktree, close loops. This file
adds only what is specific to this office.

## Gate

Run the gate yourself. An `agy` run does not fire this repo's `Stop` hook, so there is usually
nothing to reuse, and the executor's pasted output is not attributable to this `HEAD`.

## Upline

Core step 6 closes every open `## Upline` entry. Here they come from **the agy handoff**, and the
list is worth a harder look than usual: this executor's `[decided]` entries are decisions made by
a process that also invents interfaces. If Phase 2b found the list incomplete against the diff,
say so in the closeout report rather than letting it lapse.

## Recording durable lessons

Core step 4 says to record a durable fact where this office records such things. Here the lessons
split three ways:

- **CLI behavior** (a flag that misbehaved, a `--continue` that lost context, a new model in the
  catalog, a quota symptom, a workspace surprise) → the **`agy` skill**. It is the shared living
  record and other workflows read it, so this is the highest-value place to write.
- **A new executor failure class** → [executor-brief.md](executor-brief.md), plus a new check in
  [verification.md](verification.md). If Phase 2b missed something the reviewer caught, that is a
  missing check.
- **Routing** (a dispatch that should have been INLINE or `claude-office`, a purchase that turned
  out illusory, a quota cost that dominated) → [routing.md](routing.md).
- **A shared invariant** → propose it as a change to `office-core/`, never edit a vendored copy.

Sharpen an existing principle rather than appending a scenario. Nothing durable to add is a
legitimate outcome; say so and stop.

## Run report

Core's minimum plus this office's additions, in ≤6 lines: plan file, executor model and commit
range, **what Phase 2b caught**, review rounds used, gate command and result, what closeout did,
anything left open.
