# Compatibility — agy-office

| Line | Value |
|---|---|
| Plugin version | `1.2.0` (see `.claude-plugin/plugin.json`) |
| Core protocol supported | `>=1.0.0 <2.0.0` |
| Vendored snapshot | `office-core/` in this plugin, with `office-core/SNAPSHOT.json`, written by `scripts/vendor-core.sh` |

This plugin is an adapter over `office-core`. It restates or links every core gate that applies to
it, narrows some of them, and never widens authority, drops a gate, reassigns a role, or redefines
a verdict. See `office-core/protocol/compatibility.md` for the full adapter contract and the
release/rollback checklist.

## Exceptions

```yaml
exceptions:
  - id: agy-phase-2b
    owner: agy-office
    reason: >
      The executor's self-report is not a signal — agy exits 0 having done nothing, and has
      produced self-consistently wrong work (an invented interface signature with green tests
      written against its own invention). Phase 2b's mandatory independent verification pass
      replaces the executor's own claim with the planner's own evidence before review. This is a
      runtime-mechanics addition (who produces the evidence, and when), not an authority change —
      it does not relax any gate in roles-and-authority.md or evidence-and-handoff.md; it exists
      because this executor cannot be trusted to supply the evidence those files already require.
    widens_core_authority: false
  - id: agy-non-agy-reviewer
    owner: agy-office
    reason: >
      The reviewer role is narrowed to a non-agy agent (a fresh Claude subagent) for every review
      round, with no caller override. A same-family reviewer cannot see this executor's
      characteristic failure — self-consistent wrong work that passes its own tests — so allowing
      agy as reviewer would let the tool grade its own blind spot. This narrows who may hold the
      reviewer role; it does not widen any authority.
    widens_core_authority: false
```

## Re-vendoring

When `office-core/VERSION` changes in a way that affects this plugin, re-vendor with
`scripts/vendor-core.sh` from the repo root, bump this plugin's version, add a `CHANGELOG.md`
entry, and run `scripts/check-plugins.sh` before shipping.
