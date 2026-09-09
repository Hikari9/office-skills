---
name: compact-monitor
description: Use when a long session hits a lull, a task boundary, or context feels heavy with stale tool output, and the agent must judge whether running /compact now would genuinely help the session rather than just being technically resumable via files. Also use when explicitly asked "should we compact" or "/compact-monitor".
---

# Compact Monitor

Invoked as `/compact-monitor` by a user, or read as the reference for what the compact hooks do.
It decides whether compaction is beneficial now; it does not execute `/compact` itself.

**Do not re-derive the arithmetic.** `office-core/hooks/compact-advisor.mjs` already computed it at
the last turn boundary, at no token cost and with data a pane model cannot see — its own held
context. Read that verdict first:

```bash
tail -3 "${OFFICE_TELEMETRY_DIR:-$HOME/.claude/office-skills-telemetry}/compact-advisor.log"
```

No line, or no such file? The hook is not installed here (`node eval/hooks/install.mjs`), and this
skill is the fallback: judge the factors below yourself, and say that the arithmetic was unavailable.

## What the hook already decided

| Factor | Covered by the advisor |
|---|---|
| Held context against the model's real window | yes — max observed `cache_read + cache_creation + input` |
| Re-read cost at this model's tier vs turns saved | yes — Opus re-reads cost ~5x a Haiku one, so a heavy pane compacts earlier |
| Run state exists on disk | yes — a path in recent output must **exist**, not merely be mentioned |
| Run state is current | yes — a state file citing commits but not `HEAD` is a `no` |
| Live in-flight reasoning | **no. This is yours.** |

A `no` for "nothing points at a file that exists" or "it cites commits and not HEAD" is a defect
report, not a wait instruction: something real exists only in this window. Fix the file, and the
verdict flips on its own at the next boundary.

## The one judgment left to you

Being resumable via files is not the same as compacting being a good idea right now. Files preserve
facts; compacting destroys reasoning, nuance, or in-flight decisions that were never externalized.
So override a `yes` to `NOT YET` only when a partial decision, a live multi-step chain, or nuance
you have not written down would be lost. Never override at all mid-tool-call-chain.

Do not add a numeric context threshold of your own. The advisor's arithmetic is the threshold.

## Continuity note

Before agreeing with `COMPACT NOW`, externalize anything the summary must preserve:

1. Active skill or workflow and its current step.
2. Pending next action not already in a plan, todo, or file.
3. In-flight decisions or nuance that would otherwise disappear.

The `PreCompact` hook (`eval/hooks/pre-compact.mjs`) already writes a scratchpad — session id,
skill in the chair, PRs, and the files this run touched — to the telemetry sink. It cannot write
what only exists in your reasoning. That part is yours: put it in the run scratchpad or state file,
or state it plainly in the verdict so it lands in the transcript.

## Output

Always return exactly this shape:

```
Verdict: COMPACT NOW | NOT YET
Advisor: <the hook's line, verbatim, or "unavailable — hook not installed">
Reason: <one line; if you disagree with the advisor, name the in-flight thing that would be lost>
[if COMPACT NOW: continuity note written to <path> / stated above]
Next: <who delivers it>
```

For `Next`: in a Herdr pane with `--with-auto-compact` installed, `compact-courier.mjs` delivers the
`/compact` at this boundary and there is nothing to do. Otherwise the user runs `/compact` — this
skill cannot invoke it, and neither can any tool: `SlashCommand` excludes built-ins.
