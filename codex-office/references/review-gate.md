# Adversarial review gate

**Before you dispatch: the handoff must carry a `## Self-review` section.** Core requires the
executor to review its own work per task and once over the cumulative diff. If that section is
missing or empty, return the handoff to the executor and do not dispatch review — the gate is not
the place to catch what the author could have found for free. Read the section, then leave it in the
handoff: **do not** copy its findings into the reviewer's brief. Handing a reviewer the author's own
list anchors it and converts an independent pass into a verification of someone else's work.

The reviewer is a fresh, independent Codex worker identity, hosted in a visible Herdr pane when
`HERDR_ENV=1`; otherwise it is an in-session subagent when the planner is Codex or a CLI session.
It reviews every changed
line and surrounding code, the plan, all constraints, handoff deviations,
deferred items, Upline decisions, scope containment, and validation output.

The planner keeps every complete verdict, finding, disposition, and fix wave in the review files and
run state. It posts no intermediate review or fix-resolution comments. Only a final `APPROVED`
review gets a PR comment: a short summary naming the reviewer, final `HEAD`, round count, total
changes required across the rounds, and why each change was required — or why none were.

For `CHANGES REQUIRED`, send a fresh executor a full task prompt limited to the
findings. Then resume the *reviewer* session with the fix diff, per-finding
notes, and fresh whole-gate output. On every follow-up it must mark all prior
findings addressed or not addressed and only add new findings caused by the
fix. Stop after five fix rounds; a plan defect returns to the planner rather
than consuming a fix round.

Live writes require read-back of the artifact and behavior verification;
writer exit status is never enough.
