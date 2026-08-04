# Phase 4 — Closeout (Claude Office adapter)

**The procedure is core.** Run every step in `office-core/protocol/closeout.md`: confirm target,
commit, verify the gate, PR, document, sync main then remove the worktree, close loops. This file
adds only what is specific to this office.

## Gate

Run the project's real gate. **For Next.js work that means `pnpm build`, not just lint** — route
config, caching-API incompatibilities, and env-reading routes getting force-prerendered surface
only in a real build.

If this repo runs the gate as a `Stop` hook, the reuse rule in
[review-gate.md](review-gate.md) applies here too: reuse that output only when you can point at
the real output *and* confirm it ran against `HEAD`.

## Recording durable lessons

Core step 4 says to record a durable fact where this office records such things. Here that means:

- **Routing lessons** → [routing.md](routing.md).
- **Mechanism gotchas** (a flag that misbehaved, a launch that ignored an argument) →
  [`skills/claude-cli/SKILL.md`](../skills/claude-cli/SKILL.md).
- **A durable project fact, decision, or correction to how you work** → memory.
- **A shared invariant** → propose it as a change to `office-core/`, never edit a vendored copy.

Sharpen an existing principle rather than appending a scenario. Nothing durable to add is a
legitimate outcome; say so and stop.

## Run report

Core's minimum, in ≤6 lines: plan file, executor commit range, review rounds used, gate command
and result, what closeout did, anything left open.
