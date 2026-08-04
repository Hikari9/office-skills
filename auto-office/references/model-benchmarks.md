# Model benchmark snapshot

```yaml
captured: 2026-08-01
source: artificialanalysis.ai (Intelligence Index, Coding Index, Coding Agent Index v1.1)
staleness_horizon_days: 30
```

**This file is data, not doctrine.** Route from the capability roles in
[auto-routing](../skills/auto-routing/SKILL.md); this table only says who currently occupies each
role. Refresh it when `captured` is older than the horizon, or immediately when a new frontier
model ships.

**The snapshot selects brand only — never model or effort.** Model and effort come from
[auto-routing](../skills/auto-routing/SKILL.md)'s table and are **not benchmark-derived**: a
leaderboard movement can change *which brand* holds a capability role, and it can never promote an
executor from sonnet-tier or raise an effort level. Reading a higher-scoring variant in the table
below is not a reason to call it. A **worker** may be assigned above the default tier, but that is a
plan-time argument about the *kind* of question the sub-task poses — never a leaderboard reading. Read
[routing-outcomes.md](routing-outcomes.md) before this file — local outcomes outrank the leaderboard.

## Intelligence Index and output speed

| Model | Intelligence | Output tok/s | ~$/M tokens |
|---|---|---|---|
| Claude Opus 5 (max) | 61 | 54 | 2.34 |
| Claude Opus 5 (xhigh) | 60 | 52 | 1.80 |
| Claude Fable 5 | 60 | 66 | 3.15 |
| GPT-5.6 Sol (max) | 59 | 63 | 1.86 |
| Claude Opus 5 (high) | 59 | 53 | 1.23 |
| Claude Opus 5 (medium) | 56 | 53 | 0.72 |
| GPT-5.6 Terra (max) | 55 | 126 | 0.73 |
| Claude Sonnet 5 (max) | 53 | 74 | 1.72 |
| Claude Opus 5 (low) | 51 | 51 | 0.43 |
| GPT-5.6 Luna (max) | 51 | 172 | 0.07 |
| Gemini 3.6 Flash (high) | 50 | 217–304 | 0.56 |
| Gemini 3.5 Flash | 50 | 171 | 0.69 |

## Agentic coding — harness + model, not model alone

Coding Agent Index v1.1 = mean pass@1 over DeepSWE, Terminal-Bench v2, SWE-Atlas-QnA. It scores
the **pairing**, which is the right unit here since each office is a harness.

| Pairing | Coding Agent Index |
|---|---|
| GPT-5.6 Sol (max) in Codex | 80 — leads all three component evals |
| field average (4 evaluated) | 77 |
| Opus 4.7 in Cursor CLI | 61 |
| GPT-5.5 in Codex / Opus 4.7 in Claude Code | 60 |

Coding Index (Terminal-Bench v2.1 + SciCode): GPT-5.6 Sol (xhigh) 78, Claude Opus 5 (adaptive,
max effort) 78, GPT-5.6 Sol (max) 77.

Terminal-Bench is the most predictive component for agents that edit files and run terminal
commands — weight it above LiveCodeBench-style scores when judging executor fitness.

## What the numbers mean for routing

- **Opus 5 is the intelligence ceiling** (61) and therefore the Decider and the reviewer. Its
  ~54 tok/s is the price of that; do not spend it on bulk typing.
- **Codex leads agentic coding** (80 vs a 77 field average) at roughly a third of Opus's per-token
  cost — the preferred implementation route while quota holds. Its constraint is the weekly window,
  not capability.
- **Gemini Flash is 4–6× Opus's output speed** (217–304 vs 54 tok/s) at ~a quarter the cost, with
  an intelligence index of 50 — genuinely smart, not a toy. Time per task ~1.3 min, down >50% from
  the prior generation. That speed/price pair is why agy owns recon, web research, and bulk
  mechanical work; the 50-vs-61 intelligence gap is why it does not own decisions.
- **Speed is a real axis, not a tiebreak.** On read-heavy fan-out, N parallel Flash scouts finish
  before one Opus pass starts producing. On a single long ambiguous chain, that advantage inverts
  completely.

## Refresh procedure

1. Search Artificial Analysis for: Intelligence Index leaderboard, Coding Index, Coding Agent
   Index (harness pairings), and output tokens/sec for the current Claude / GPT / Gemini flagships.
2. Rewrite the numbers above. Bump `captured`. Note in one line what moved.
3. If a capability role changed hands, **say so in the run's kickoff line** and route the new way.
4. Leave locally-observed behavior alone — the agy 3-task drift cap is workspace experience, not a
   benchmark, and a leaderboard cannot overturn it.

Sources: [Artificial Analysis models leaderboard](https://artificialanalysis.ai/leaderboards/models),
[coding capabilities](https://artificialanalysis.ai/models/capabilities/coding),
[coding agents](https://artificialanalysis.ai/agents/coding-agents),
[Coding Agent Index methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking),
[Coding Agent Index v1.1 leaderboard](https://llm-stats.com/benchmarks/artificial-analysis-coding-agent-index-v1.1),
[Gemini 3.6 Flash analysis](https://artificialanalysis.ai/models/gemini-3-6-flash).
