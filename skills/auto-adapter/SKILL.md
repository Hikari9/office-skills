---
name: auto-adapter
description: Auto Office v3 harness-adapter engineering primitive. Use to add, validate, conformance-test, inspect, or promote a harness adapter; map model/effort identities; define safe invocation/prompt transport/quota probes/failure signatures; and enforce invalid, valid-unverified, and proven trust states without modifying the office lifecycle.
---

# Auto Adapter

Adapters are data/mechanics, never separate office lifecycles.

Start with `python3 ../../scripts/office_runtime.py scaffold-adapter <id> --out <path>`, then fill every mandatory semantic field and run `validate-adapter`.

Before `valid-unverified`, pass deterministic conformance: schema, argv generation, safe prompt transport, model mapping, effort mapping, dispatch-form declaration, quota parser, failure-signature parser, privacy-safe logging, unknown-field behavior.

Before `proven`, pass live conformance or equivalent evidence: no-hang launch, successful prompt transfer, expected output capture, liveness detection, model selection, quota probe behavior, independently checked evidence capabilities. Default evidence bar also requires >=5 successful dispatches across >=2 task shapes and no unresolved adapter-attributed critical failure.

Never promote because a public catalog says a model exists. Local harness support must be proven or remain discovered-unconfirmed.
