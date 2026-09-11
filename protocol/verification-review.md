# Verification and review

Every mutable run self-verifies. Independent verification is required by risk, gear, playbook, repository policy, or user-facing acceptance requirements.

Prefer targeted tests → regression tests → type/lint/static → build/package → focused runtime → broader suites when justified. A passing gate is not automatically trusted; where practical, show critical gates fail on known-bad/mutated input before accepting green.

User-facing work requires browser validation when a reachable local/preview runtime can reasonably be produced. Execute the actual acceptance flow, not merely the homepage.

Reviewer finding states: `accepted-material`, `accepted-minor`, `rejected-on-evidence`, `pending`. Only accepted-material receives full gate credit. Use the same reviewer session across rounds when possible to retain prior uncertainty/findings, but never the producer session.

A `PLAN DEFECT`/`BRIEF DEFECT` is valid only when the raising role followed the artifact enough to test its assumption, provides concrete contradictory evidence, and shows that continuing would violate outcome/safety. Accepted defect pauses affected scope, increments artifact version, invalidates stale packets, amends through the proper owner, then resumes from the new version.
