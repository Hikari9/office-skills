---
name: compact-monitor
description: Use when a long session hits a lull, a task boundary, or context feels heavy with stale tool output, and the agent must judge whether running /compact now would genuinely help the session rather than just being technically resumable via files. Also use when explicitly asked "should we compact" or "/compact-monitor".
---

# Compact Monitor

This is directly invoked as `/compact-monitor` by the Herdr compact-police helper or by a user.
It decides whether compaction is beneficial now; it does not execute `/compact` itself.

Being resumable via files is not the same as compacting being a good idea right now. Files preserve
facts; compacting destroys reasoning, nuance, or in-flight decisions that were never externalized.
Use this skill to judge timing, not merely resumability.

## When to use

Use at a natural lull: a task or milestone just finished, a subagent returned, or the conversation
is between independent steps. Do not run it mid-reasoning, mid-tool-call-chain, or while a decision
is actively being worked out in-context.

## Decision criteria

Recommend compaction only when the stale/boundary/economics signals are positive and the in-flight
signal is clear:

| Factor | Favors COMPACT NOW | Favors NOT YET |
|---|---|---|
| Tool-output staleness | Large reads, searches, or logs are no longer needed | Recent output will be re-used immediately |
| In-flight reasoning | No live multi-step reasoning or undocumented nuance remains | A partial decision exists only in the current context |
| Task boundary | A milestone or subtask just finished; next work is independent | The next step depends on current-context details |
| Token economics | Dropping stale context plausibly saves future re-reading | Compaction would make the agent re-derive the same context shortly |

Do not use a numeric context threshold. Context size alone is not a compaction decision.

## Continuity note

Before recommending `COMPACT NOW`, externalize anything the summary must preserve:

1. Active skill or workflow and its current step.
2. Pending next action not already in a plan, todo, or file.
3. In-flight decisions or nuance that would otherwise disappear.

Write a short continuity note to the run scratchpad or state file. If there is no scratchpad, state
the note plainly in the verdict so it lands in the transcript.

## Output

Always return exactly this shape:

```
Verdict: COMPACT NOW | NOT YET
Reason: <one line naming the deciding factors>
[if COMPACT NOW: continuity note written to <path> / stated above]
Next: run /compact yourself — this skill can't invoke it directly.
```

The external compact-police helper may deliver `/compact` to a Claude or Codex pane after an
explicit reuse decision. A pane agent does not send that slash command from inside this skill.
