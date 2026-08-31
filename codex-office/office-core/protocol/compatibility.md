# Compatibility and release contract (core protocol)

## Two independent version lines

| Line | Versioned in | Meaning |
|---|---|---|
| **Core protocol** | `office-core/VERSION` | the shared invariants in `protocol/` and `schemas/` |
| **Plugin** | each `<plugin>/.claude-plugin/plugin.json` | that office's hub, spokes, runtime rules, and references |

A plugin release never requires a core release, and a core release never forces all three
plugins to ship on the same day. Each plugin declares the core range it supports in its own
`COMPATIBILITY.md` and carries a vendored snapshot of exactly one core version.

## Semantics of a core version bump

| Change | Bump | Obligation |
|---|---|---|
| Typo, clarification, added example that changes no behavior | patch | re-vendor at each plugin's own pace |
| New optional field, new non-binding guidance, additive schema property | minor | adapters keep working unchanged; adopt when convenient |
| Removed or renamed field, tightened requirement, changed verdict set, changed authority rule | **major** | **every** adapter is updated and validated before any plugin ships against it |

A rule may not be **weakened** in a patch or minor release. Loosening an authority, evidence, or
review requirement is always a major change, and it needs a written reason naming the run that
justified it.

## Adapter obligations

Each plugin is an adapter over the core. An adapter:

- **must** restate or link every core gate that applies to it, and may narrow any of them;
- **must not** widen authority, drop a gate, reassign a role, or redefine a verdict;
- **must not** move runtime mechanics into core, or copy another office's runtime rules;
- **must** name an owner and a reason for every declared exception.

### Exceptions

An office-specific addition that does not fit core is recorded as an exception in the plugin's
`COMPATIBILITY.md`:

```yaml
exceptions:
  - id: agy-phase-2b
    owner: agy-office
    reason: Executor self-report is not a signal; independent verification replaces it.
    widens_core_authority: false
```

`widens_core_authority: true` is not a valid value. An exception that would need it is a core
change, not an exception.

## Vendoring

- `office-core/` at the repository root is the **only** editable source.
- `scripts/vendor-core.sh` copies it to `<plugin>/office-core/` and writes `SNAPSHOT.json`
  with the core version and a content hash.
- Snapshots are **committed**, so an installed plugin is complete without its siblings.
- `scripts/check-plugins.sh` fails when a snapshot is missing, stale, hand-edited, or outside
  the plugin's declared range.

## Release checklist

1. Core changed? Bump `office-core/VERSION` by the table above and re-vendor.
2. Update the changed plugin's version and `CHANGELOG.md`. A core change lists every affected
   plugin version explicitly.
3. Run `scripts/check-plugins.sh`. Descriptor validity, snapshot freshness, hub budget, required
   safety rules, link integrity, and absence of catalog injection all pass.
4. For a major core change, confirm all three adapters consume the current Kernel and handoff
   schema before any of them ships.
5. Pilot on the office's canaries, then on production-facing work under the normal
   authorization and review rules.

## Rollback

Each plugin rolls back on its own: reinstall the previous plugin version, which carries its own
pinned core snapshot. Rolling one office back never changes the other two and never touches a
production repository.

**Rollback triggers:** a missing mandatory safety rule; two uncoordinated writers in one worktree or
an unsafe Tester exception; an
unverified external mutation; a standalone install failure; a >10% quality regression on recent
canaries; or p95 latency worsening by >15% after normalizing for packet size and task class.
