---
name: auto-closeout
description: Internal Auto Office v3 closeout spoke. Use after implementation/review to reconcile findings, validate completion evidence, report branch/PR state and real blockers, record pinned runtime hashes and telemetry, enforce the human merge-to-main boundary, and finish family state without claiming success from model confidence alone.
---

# Auto Closeout

A family may report implementation complete only with evidence for: Outcome; Key implementation; Validation; browser/runtime evidence when applicable; Review result; PR/branch state; Remaining real blockers; Pinned runtime hashes.

Reconcile all pending findings and dispositions, stale holders/leases, plan/packet versions, uncommitted state, and validation evidence.

Record telemetry/outcomes before declaring completion when the recorder is available; telemetry write failure may fail soft, but surface it.

Never merge policy/self-improvement changes to main autonomously. Human merge-to-main remains mandatory.

After closeout, run eligible lazy maintenance and, when justified, hand sanitized proposal candidates to `auto-self-improve` in a separate worktree/branch.
