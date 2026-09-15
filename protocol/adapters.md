# Harness adapter contract

A valid adapter declares id, verification state, version fingerprint, model source, effort mapping, benchmark slug mapping, invocation, safe prompt passing, dispatch forms, trusted evidence capabilities, quota probe, shallow review, agentic/builder evidence, failure signatures, and conformance state.

Trust states:

- `invalid`: deterministic contract failure; never routable.
- `valid-unverified`: schema/conformance shape passes but lacks runtime evidence. Default use is discovery, read-only investigation, prototypes, reversible sandbox workers, and conformance. No normal mutable executor, final code review, destructive action, or production-facing browser verification unless user explicitly overrides.
- `proven`: deterministic conformance plus configured runtime evidence; eligible subject to role floors/quota.

Default proven evidence bar: at least five successful dispatches, at least two task shapes, no unresolved adapter-attributed critical failure, and independently validated required evidence capabilities.

Installed harnesses are detected locally through PATH and adapter fingerprints. Do not scrape arbitrary package registries for harness discovery. A catalog model that local harness support cannot prove is `discovered-unconfirmed` and cannot receive normal mutable routing until adapter update, safe probe, explicit user selection, or qualifying sandbox/reversible evidence.
