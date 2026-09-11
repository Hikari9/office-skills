---
name: auto-routing
description: Internal Auto Office v3 router. Use when selecting or explaining a role route across harness, model, and effort; evaluating adapter trust/capabilities/absolute floors/task shape/quota/advisory quality/cost/local evidence; deciding exploration eligibility; or recording a routing decision. Route-time must remain offline and reproducible from pinned snapshots.
---

# Auto Routing

Route `harness@version × model_id × effort`, not model brand alone.

Read `../../protocol/routing.md`, `../../config/config.default.yaml`, the pinned catalog snapshot, pinned adapter snapshot, effective config, and comparable local evidence.

Apply the exact filter order: hard exclusions → adapter trust → capabilities → absolute floor → task shape → quota safety → advisory anchor → cost → local tie-break.

Never lower an absolute floor to save money/quota. Unknown quota is not unlimited. If every qualifying candidate crosses protected reserve, return control to the orchestrator instead of quietly spending it.

Public benchmark data is cold-start evidence. Enough comparable local evidence for the exact routable triple outranks generic priors. Keep runtime reliability evidence harness-specific even when two harnesses expose the same underlying model.

Use `python3 ../../scripts/office_runtime.py route <request.yaml>` for deterministic selection. Record the request/decision hashes with the run.
