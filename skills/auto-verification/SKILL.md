---
name: auto-verification
description: Internal Auto Office v3 verification spoke. Use to build or execute the verification floor for mutable work, choose targeted/regression/static/build/runtime checks, prove known-bad inputs fail critical gates, run browser acceptance flows for user-facing work, and package validation evidence for independent review and closeout.
---

# Auto Verification

Every mutable run self-verifies. Add independent verification when risk, gear, playbook, repository policy, or acceptance path requires it.

Prefer existing targeted tests, regression tests, static/type/lint, build/package, focused runtime, then broader suites when justified.

Do not treat exit code zero or a green gate alone as proof. Where practical, demonstrate critical gates fail on known-bad/mutated input before trusting green.

For user-facing work, when a reachable local/preview runtime can reasonably be produced, execute the real acceptance flow in a browser. Opening the homepage is not browser verification.

Record exact commands/flows and evidence hashes in durable state.
