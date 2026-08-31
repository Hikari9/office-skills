# office-core

The shared source contract for `codex-office`, `agy-office`, and the Claude route in `auto-office`.

**`office-core` is not a fourth office and is never invoked directly.** It holds only the
rules that must genuinely agree across all three executor routes: role separation, plan approval,
blast-radius ceilings, the Office Kernel, handoff/evidence requirements, reviewer states,
executor draft-PR bootstrap, and rollback language. Runtime mechanics — `codex exec` flags, `--cli` vs `--in-session`,
`agy` flag ordering — belong to the owning plugin and must not migrate here.

## Layout

```text
office-core/
├── VERSION                          # protocol version (semver), independent of plugin versions
├── protocol/
│   ├── roles-and-authority.md       # who may do what; the gates that cannot be bypassed
│   ├── plan-contract.md             # what an approvable plan must contain
│   ├── executor-bootstrap.md        # plan-only first commit and draft PR startup
│   ├── evidence-and-handoff.md      # what counts as proof; the handoff report contract
│   ├── review-states.md             # APPROVED / CHANGES REQUIRED / PLAN DEFECT and the fix loop
│   ├── closeout.md                  # final gate, plan removal, PR readiness, merge, cleanup
│   └── compatibility.md             # versioning, adapters, exceptions, release rules
└── schemas/
    ├── office-kernel.schema.json    # the immutable per-run packet header
    ├── handoff.schema.json          # executor → planner report
    ├── capability-manifest.schema.json  # selected skills, instead of a catalog dump
    └── run-event.schema.json        # telemetry shape; the SessionEnd hook fills it from the transcript
```

## Source of truth and vendoring

This directory is the **development source**. Each plugin carries a **vendored snapshot** at
`<plugin>/office-core/` plus a `SNAPSHOT.json` recording the core version and a content hash.

The snapshot is committed, not generated at install time, so a plugin installed on its own —
without its sibling directories or this root folder — is complete. `scripts/vendor-core.sh`
refreshes every snapshot; `scripts/check-plugins.sh` fails when a snapshot is stale or a
plugin declares a core range it does not carry.

**Never edit a vendored snapshot.** Edit here, bump `VERSION` per
[protocol/compatibility.md](protocol/compatibility.md), re-vendor, and validate all three
adapters before any release.
