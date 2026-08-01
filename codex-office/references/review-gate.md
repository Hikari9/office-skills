# Adversarial review gate

The reviewer is a fresh, independent Codex session. It reviews every changed
line and surrounding code, the plan, all constraints, handoff deviations,
deferred items, Upline decisions, scope containment, and validation output.

For `CHANGES REQUIRED`, send a fresh executor a full task prompt limited to the
findings. Then resume the *reviewer* session with the fix diff, per-finding
notes, and fresh whole-gate output. On every follow-up it must mark all prior
findings addressed or not addressed and only add new findings caused by the
fix. Stop after five fix rounds; a plan defect returns to the planner rather
than consuming a fix round.

Live writes require read-back of the artifact and behavior verification;
writer exit status is never enough.

