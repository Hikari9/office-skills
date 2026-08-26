# Skill scorecard (backfilled)

Generated 2026-08-26T02:50:03.933Z by `eval/score.mjs` from 396 backfilled office invocations
across 107 sessions. Version tree at `7546ab1`.

Scope: the four offices and their spokes only — 737 invocations of
skills this plugin does not own were recorded by the backfill and are excluded here.

Score is `landed(35) · uninterrupted(25) · clean_tools(20) · gate(10) · efficiency(10)`,
renormalised over the components that apply to each skill. **`n` is the number that matters**:
fewer than 15 runs is marked *thin* and the score is noise, not a measurement.

## Current version (`7546ab1`, from 2026-08-25 20:46)

| Skill | n | score | interrupted | PRs | med rounds | med tok | med wall |
|---|---|---|---|---|---|---|---|
| `auto-office` *thin* | 1 | **61** | 0 | 0 | 0 | 1009 | 135s |

## All versions, by skill

Older rows are learnings, not a verdict on shipping code.

## Ranking

Components are the mean of each part where it applied, so a score reads back to a cause.

| Skill | n | score | landed | uninterr | tools | gate | effic | on current |
|---|---|---|---|---|---|---|---|---|
| `auto-office:auto-closeout` | 24 | **83** | 75% | 100% | 80% | 95% | 72% | — |
| `codex-office:codex-cli` | 26 | **77** | 65% | 94% | 84% | 57% | 71% | — |
| `auto-office:auto-loop` | 36 | **76** | 61% | 97% | 84% | 64% | 63% | — |
| `auto-office` | 124 | **71** | 45% | 98% | 87% | 61% | 60% | 1 |
| `auto-office:auto-planning` | 62 | **67** | 40% | 98% | 83% | 30% | 58% | — |
| `claude-office` | 61 | **64** | 26% | 95% | 89% | 81% | 65% | — |
| `claude-office:claude-cli-send-message` *thin* | 1 | **95** | 100% | 100% | 74% | 100% | 100% | — |
| `claude-office:claude-closeout` *thin* | 1 | **95** | 100% | 100% | 77% | 100% | 100% | — |
| `agy-office:agy-verification` *thin* | 2 | **92** | 100% | 100% | 95% | 30% | 100% | — |
| `agy-office:agy-cli` *thin* | 9 | **81** | 67% | 100% | 92% | 65% | 66% | — |
| `agy-office` *thin* | 2 | **81** | 50% | 100% | 100% | — | 100% | — |
| `codex-office` *thin* | 9 | **79** | 78% | 83% | 90% | 53% | 63% | — |
| `claude-office:claude-reviewer` *thin* | 4 | **76** | 50% | 100% | 81% | 100% | 75% | — |
| `auto-office:auto-routing` *thin* | 9 | **75** | 56% | 100% | 78% | 30% | 75% | — |
| `claude-office:claude-cli` *thin* | 13 | **74** | 77% | 77% | 81% | 53% | 59% | — |
| `claude-office:claude-executor` *thin* | 5 | **72** | 40% | 100% | 81% | 100% | 83% | — |
| `codex-office:codex-executor` *thin* | 3 | **71** | 67% | 83% | 67% | — | 67% | — |
| `claude-office:claude-planning` *thin* | 5 | **58** | 20% | 100% | 69% | — | 60% | — |

### `auto-office:auto-closeout` — 24 runs, lifetime score 83

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `83830ec` | 3.0.0 | 1 | 100 | 0 | 2 |
| `2cd480f` | 2.0.0 | 3 | 95 | 0 | 8 |
| `ca777f3` | 1.4.0 | 5 | 81 | 0 | 7 |
| `283d3be` | 1.3.0 | 9 | 86 | 0 | 33 |
| `bd5110d` | 1.2.0 | 3 | 56 | 0 | 0 |
| _pre-release_ | — | 3 | 89 | 0 | 13 |

### `codex-office:codex-cli` — 26 runs, lifetime score 77

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `d5cfc3d` | 3.1.0 | 1 | 94 | 0 | 2 |
| `83830ec` | 3.0.0 | 2 | 70 | 0 | 3 |
| `a6f7b18` | 2.0.0 | 1 | 82 | 0 | 3 |
| `5f10fa1` | 2.0.0 | 1 | 100 | 0 | 7 |
| `2cd480f` | 2.0.0 | 5 | 83 | 0 | 12 |
| `ca777f3` | 1.4.0 | 2 | 91 | 0 | 3 |
| `283d3be` | 1.3.0 | 2 | 47 | 0 | 0 |
| `37073b2` | 1.2.0 | 1 | 49 | 0 | 0 |
| `bd5110d` | 1.2.0 | 1 | 58 | 1 | 1 |
| _pre-release_ | — | 10 | 78 | 1 | 21 |

### `auto-office:auto-loop` — 36 runs, lifetime score 76

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 6 | 89 | 0 | 21 |
| `746cba6` | 2.0.0 | 2 | 81 | 0 | 1 |
| `bc53199` | 1.5.0 | 4 | 61 | 0 | 1 |
| `ca777f3` | 1.4.0 | 3 | 77 | 0 | 3 |
| `283d3be` | 1.3.0 | 2 | 91 | 0 | 12 |
| `37073b2` | 1.2.0 | 9 | 64 | 0 | 7 |
| _pre-release_ | — | 10 | 81 | 2 | 18 |

### `auto-office` — 124 runs, lifetime score 71

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` **←current** | 3.1.1 | 1 | 61 | 0 | 0 |
| `83830ec` | 3.0.0 | 8 | 63 | 1 | 5 |
| `5f10fa1` | 2.0.0 | 5 | 77 | 0 | 12 |
| `2cd480f` | 2.0.0 | 35 | 73 | 1 | 145 |
| `746cba6` | 2.0.0 | 2 | 81 | 0 | 1 |
| `bc53199` | 1.5.0 | 2 | 81 | 0 | 1 |
| `ca777f3` | 1.4.0 | 5 | 81 | 0 | 5 |
| `283d3be` | 1.3.0 | 25 | 64 | 1 | 30 |
| `37073b2` | 1.2.0 | 6 | 79 | 0 | 7 |
| `bd5110d` | 1.2.0 | 7 | 53 | 1 | 1 |
| _pre-release_ | — | 28 | 74 | 1 | 34 |

### `auto-office:auto-planning` — 62 runs, lifetime score 67

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `5f10fa1` | 2.0.0 | 2 | 51 | 0 | 0 |
| `2cd480f` | 2.0.0 | 20 | 66 | 0 | 25 |
| `746cba6` | 2.0.0 | 3 | 63 | 0 | 1 |
| `bc53199` | 1.5.0 | 4 | 64 | 0 | 1 |
| `ca777f3` | 1.4.0 | 6 | 71 | 1 | 5 |
| `283d3be` | 1.3.0 | 6 | 74 | 0 | 11 |
| `37073b2` | 1.2.0 | 4 | 83 | 0 | 7 |
| _pre-release_ | — | 17 | 66 | 2 | 19 |

### `claude-office` — 61 runs, lifetime score 64

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 1 | 100 | 0 | 6 |
| _pre-release_ | — | 60 | 63 | 4 | 42 |

### `claude-office:claude-cli-send-message` — 1 runs, lifetime score 95

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| _pre-release_ | — | 1 | 95 | 0 | 2 |

### `claude-office:claude-closeout` — 1 runs, lifetime score 95

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 1 | 95 | 0 | 6 |

### `agy-office:agy-verification` — 2 runs, lifetime score 92

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| _pre-release_ | — | 2 | 92 | 0 | 2 |

### `agy-office:agy-cli` — 9 runs, lifetime score 81

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 2 | 100 | 0 | 9 |
| `746cba6` | 2.0.0 | 2 | 66 | 0 | 1 |
| `37073b2` | 1.2.0 | 1 | 52 | 0 | 0 |
| _pre-release_ | — | 4 | 87 | 0 | 8 |

### `agy-office` — 2 runs, lifetime score 81

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| _pre-release_ | — | 2 | 81 | 0 | 2 |

### `codex-office` — 9 runs, lifetime score 79

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `5f10fa1` | 2.0.0 | 1 | 100 | 0 | 7 |
| `2cd480f` | 2.0.0 | 1 | 81 | 0 | 56 |
| `283d3be` | 1.3.0 | 1 | 97 | 0 | 6 |
| _pre-release_ | — | 6 | 73 | 3 | 10 |

### `claude-office:claude-reviewer` — 4 runs, lifetime score 76

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 4 | 76 | 0 | 9 |

### `auto-office:auto-routing` — 9 runs, lifetime score 75

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 6 | 77 | 0 | 12 |
| `37073b2` | 1.2.0 | 1 | 91 | 0 | 3 |
| _pre-release_ | — | 2 | 61 | 0 | 1 |

### `claude-office:claude-cli` — 13 runs, lifetime score 74

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `5f10fa1` | 2.0.0 | 1 | 78 | 0 | 7 |
| `2cd480f` | 2.0.0 | 2 | 47 | 2 | 2 |
| `ca777f3` | 1.4.0 | 1 | 91 | 0 | 1 |
| `283d3be` | 1.3.0 | 4 | 83 | 1 | 17 |
| `37073b2` | 1.2.0 | 2 | 38 | 1 | 0 |
| _pre-release_ | — | 3 | 100 | 0 | 3 |

### `claude-office:claude-executor` — 5 runs, lifetime score 72

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 4 | 65 | 0 | 6 |
| _pre-release_ | — | 1 | 100 | 0 | 9 |

### `codex-office:codex-executor` — 3 runs, lifetime score 71

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 100 | 0 | 2 |
| `bd5110d` | 1.2.0 | 2 | 57 | 1 | 1 |

### `claude-office:claude-planning` — 5 runs, lifetime score 58

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 5 | 58 | 0 | 6 |

## Thin coverage — candidates for a live eval suite

Skills with fewer than 15 lifetime runs cannot be scored from history. These need
purpose-built eval cases in `<office>/evals/`.

`claude-office:claude-cli-send-message` (1) · `claude-office:claude-closeout` (1) · `agy-office:agy-verification` (2) · `agy-office:agy-cli` (9) · `agy-office` (2) · `codex-office` (9) · `claude-office:claude-reviewer` (4) · `auto-office:auto-routing` (9) · `claude-office:claude-cli` (13) · `claude-office:claude-executor` (5) · `codex-office:codex-executor` (3) · `claude-office:claude-planning` (5)

