# Closeout (Codex Office adapter)

**The procedure is core.** Run every step in `office-core/protocol/closeout.md`: confirm target,
commit, verify the gate, PR, document, sync main then remove the worktree, close loops. This file
adds only what is specific to this office.

Adopting the core procedure is a change from this office's previous closeout note, which
described the same shape in summary. Nothing was removed: the steps are now spelled out, and the
authorization language below is unchanged.

## Authorization

Inspect the final diff and status, and commit only intended files. **Push and create a PR only if
the caller authorized those actions.** Never merge or deploy without separate authority. Silence
is not authorization.

A deployment or migration is planner-held and is verified by a read-back of the live artifact
plus the observable behavior that motivated the change, never by the writer's exit code.

## Recording durable lessons

Core step 4 says to record a durable fact where this office records such things. Here that means
runtime lessons (a flag that misbehaved, a worktree collision, a launch quirk) go to
[`skills/codex-cli/SKILL.md`](../skills/codex-cli/SKILL.md), and a shared invariant is proposed as
a change to `office-core/` rather than edited into a vendored copy.

## Run report

Core's minimum plus this office's additions: plan path, executor commit range, **reviewer model
and round count**, full gate result, PR URL if one was created, and unresolved items.
