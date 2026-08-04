# Canaries and Rollback

Hey! Before any office plugin touches production-facing work, it earns that trust on a canary. This is the list, plus the rollback record you fill in every time.

## How to run a canary

1. Note the rollback record below **before** you install anything.
2. Invoke the office explicitly, exactly as a real user would.
3. Let every gate run. Do not shortcut review because it is "just a canary." A canary that skips the gate tests nothing.
4. Capture the run events and compare the role packets against the budgets in [telemetry-event-model.md](telemetry-event-model.md).
5. Record the result, then either promote the plugin or roll it back.

Canaries are read-only or scratch-repo work by default. If a canary needs a write, it goes to a throwaway branch in a scratch worktree, never to a production repository.

## Shared canaries, all 3 offices

* **Small local edit.** One file, deterministic, obvious verification command. Proves the office does not over-orchestrate trivial work, and that an `INLINE` tag actually gets used.
* **Multi-file feature.** Several files, a real dependency graph, at least 2 waves. Proves the plan contract, the wave grouping, and the handoff.
* **Review-only task.** An existing diff handed straight to Phase 3. Proves the reviewer packet stands on its own without the executor's context.

For each one, confirm the same 4 things:

* The worker packet contains the Office Kernel plus its selected spokes, **and nothing else**.
* No packet carries a full skills catalog. The capability manifest is there instead.
* The reviewer refused to approve without real, pasted gate output.
* The run produced an event with a plugin version and a core version attached.

## codex-office

* **Independent review round.** Force a `CHANGES REQUIRED`, then confirm the fix goes to a fresh scoped executor dispatch, and the **same** reviewer is resumed rather than replaced.
* **Protected dirty paths.** Start with uncommitted changes in the tree, name them as protected, and confirm they survive the run untouched.
* **Worktree collision.** Attempt a second dispatch into a tree that already has a live writer. The correct outcome is a refusal.

## claude-office

* **Live question and recovery.** Get the `--cli` executor to raise a question, both a numbered menu and an open-ended free-text one. Confirm both are answered in place through `claude-cli-send-message`, with the session ID unchanged, so no fork happened.
* **Fork guard.** Attempt `--resume` against a live session. The correct outcome is a refusal that cites session and worktree identity, not a display label.
* **Duplicate writer.** Launch a second executor into the same worktree. The newer writer is stopped before it can edit.
* **`--in-session` fallback.** Same plan through the Agent-tool path. The gates behave identically.

## agy-office

* **Swallowed prompt.** Put a flag after `--print` on purpose. Expect a greeting and an exit 0, and confirm Phase 2b check 1 catches the empty diff instead of the run proceeding to review.
* **Quota stall.** Confirm the stall is read as quota rather than slowness, and that the fallback to Claude subagents actually happens.
* **Interface evidence.** Give the executor a documented signature and check the citation table against real source. This is the highest-yield check in the office, and it costs 1 read per row.
* **Test that will not go red.** Break the behavior a new test covers. A test that stays green is a confirmed defect, fixed and re-verified before the reviewer is dispatched.
* **Non-agy reviewer.** Confirm no path, tweak, or shortcut routes review back through `agy`.

## The rollback record

Fill this in for every canary and every release. A rollback should be a lookup, not an investigation.

```yaml
canary: <name>
date: <YYYY-MM-DD>
plugin: <id>
plugin_version_installed: <x.y.z>
plugin_version_prior: <x.y.z>
core_protocol_version: <x.y.z>
install_path: <absolute path>
remove_command: <exact command>
reinstall_command: <exact command>
result: pass | fail
notes: <one line>
```

## When to roll back

Any 1 of these is enough. You do not need a pattern:

* A mandatory safety rule is missing from a hub or a spoke.
* Two writers ended up in one worktree.
* An external mutation shipped without a read-back.
* A standalone install failed. That is a packaging defect, never a reason to weaken independent versioning.
* Quality on recent canaries regressed by more than 10%.
* p95 latency worsened by more than 15% after normalizing for packet size and task class.

Roll back **only the affected plugin** and its core compatibility pair. The other 2 offices keep running, which is the entire point of versioning them separately.
