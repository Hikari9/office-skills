# Skill scorecard (backfilled)

Generated 2026-08-26T04:18:38.417Z by `eval/score.mjs` from 722 backfilled office invocations
across 188 sessions. Version tree at `01a1e5d`.

Scope: the four offices and their spokes only — 4657 invocations of
skills this plugin does not own were recorded by the backfill and are excluded here.

Score is `landed(35) · uninterrupted(25) · clean_tools(20) · gate(10) · efficiency(10)`,
renormalised over the components that apply to each skill. **`n` is the number that matters**:
fewer than 15 runs is marked *thin* and the score is noise, not a measurement.

## Current version (`01a1e5d`, from 2026-08-26 12:03)

**No runs yet on the current version.** Every score below is historical. This is the
expected state right after a release, and it is exactly why the live hook and the eval
suite exist: without them, the current version has no evidence at all until it happens
to be used.

## All versions, by skill

Older rows are learnings, not a verdict on shipping code.

## Coverage by harness

| Harness | office runs | invocation signal |
|---|---|---|
| `claude` | 397 | `skill-tool` |
| `codex` | 325 | `skill-md-read` |

`skill-tool` is a recorded dispatch — Claude Code is the only harness with a first-class
Skill tool and per-turn attribution. `skill-md-read` infers the invocation from the skill's
`SKILL.md` being read, which is what Codex, Gemini, and Hermes can offer. Both are actions
rather than keyword matches, so both count as invocations; they are **not** the same
measurement, and a cross-harness comparison has to say which it is using.

## The goal

**Landed rate target: 80%** — the share of office runs that open a PR. Checked by
`eval/gate.mjs`, enforced once a scope has 15+ runs and reported below that.

| Scope | landed | runs | vs goal |
|---|---|---|---|
| Current version | — | 0 | — |
| Last 14 days | 39% | 432 | **-41 FAIL** |
| Lifetime | 40% | 721 | **-40 FAIL** |


**The best segment measured.** Runs whose session compacted land at **74%**
(172/233) against **24%** (116/488) for runs that never
compacted; among 40+ turn runs it is 77% vs 28%, so it is not just run length.
Correlational — both are most likely downstream of a run being driven to completion rather
than abandoned.

**No segment currently clears 80%.** The target is set above everything this corpus
has reached, so treat it as a direction rather than a demonstrated ceiling. It was set when
Claude-only data showed 90%; adding Codex, where most office runs actually happen, moved it.

The composite score below is deliberately **not** the gated number. `gate` is matched on
literal strings and `uninterrupted` sits at 94-100% across every office, so the composite is
inflated and cannot carry a threshold honestly. Landed counts an artifact outside the
transcript, so it can.

## Ranking

Components are the mean of each part where it applied, so a score reads back to a cause.

| Skill | n | harness | score | landed | uninterr | tools | gate | effic | on current |
|---|---|---|---|---|---|---|---|---|---|
| `auto-office:auto-closeout` | 29 | claude+codex | **85** | 79% | 100% | 78% | 95% | 69% | — |
| `auto-office:auto-loop` | 46 | claude+codex | **76** | 61% | 98% | 83% | 64% | 54% | — |
| `codex-office:codex-cli` | 51 | claude+codex | **71** | 55% | 97% | 85% | 57% | 53% | — |
| `auto-office` | 133 | claude+codex | **71** | 47% | 98% | 87% | 61% | 60% | — |
| `auto-office:auto-planning` | 64 | claude+codex | **68** | 42% | 98% | 83% | 30% | 58% | — |
| `claude-office:claude-cli` | 24 | claude+codex | **68** | 50% | 88% | 85% | 66% | 62% | — |
| `codex-office:codex-closeout` | 21 | codex | **68** | 38% | 100% | 89% | 76% | 67% | — |
| `claude-office` | 64 | claude+codex | **63** | 25% | 95% | 89% | 77% | 66% | — |
| `agy-office:agy-executor` | 21 | codex | **61** | 19% | 100% | 91% | 65% | 86% | — |
| `codex-office:codex-executor` | 61 | claude+codex | **60** | 26% | 99% | 81% | 47% | 61% | — |
| `codex-office` | 74 | claude+codex | **57** | 27% | 98% | 70% | 61% | 56% | — |
| `codex-office:codex-reviewer` | 52 | codex | **56** | 19% | 100% | 74% | 74% | 68% | — |
| `auto-office:claude-executor` *thin* | 1 | claude | **100** | — | 100% | 100% | — | 100% | — |
| `auto-office:auto-executor` *thin* | 2 | codex | **100** | 100% | 100% | — | — | — | — |
| `agy-office:agy-planning` *thin* | 1 | codex | **100** | 100% | 100% | — | — | — | — |
| `agy-office:agy-closeout` *thin* | 1 | codex | **100** | 100% | 100% | — | — | — | — |
| `claude-office:claude-closeout` *thin* | 1 | claude | **95** | 100% | 100% | 77% | 100% | 100% | — |
| `agy-office:agy-verification` *thin* | 3 | claude+codex | **95** | 100% | 100% | 95% | 30% | 100% | — |
| `agy-office` *thin* | 3 | claude+codex | **87** | 67% | 100% | 100% | — | 100% | — |
| `agy-office:agy-cli` *thin* | 10 | claude+codex | **83** | 70% | 100% | 92% | 65% | 66% | — |
| `auto-office:auto-routing` *thin* | 11 | claude+codex | **79** | 64% | 100% | 81% | 30% | 77% | — |
| `claude-office:claude-cli-send-message` *thin* | 2 | claude+codex | **76** | 50% | 100% | 77% | 100% | 100% | — |
| `claude-office:claude-reviewer` *thin* | 7 | claude+codex | **69** | 29% | 100% | 88% | 93% | 70% | — |
| `claude-office:claude-executor` *thin* | 6 | claude+codex | **67** | 33% | 100% | 81% | 100% | 83% | — |
| `claude-office:claude-planning` *thin* | 6 | claude+codex | **58** | 17% | 100% | 74% | 30% | 72% | — |
| `agy-office:agy-reviewer` *thin* | 14 | codex | **58** | 7% | 100% | 85% | 60% | 74% | — |
| `codex-office:codex-planning` *thin* | 14 | codex | **53** | 21% | 100% | 19% | 30% | 57% | — |

### `auto-office:auto-closeout` — 29 runs, lifetime score 85

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 1 | 78 | 0 | 3 |
| `83830ec` | 3.0.0 | 1 | 100 | 0 | 2 |
| `2cd480f` | 2.0.0 | 7 | 98 | 0 | 12 |
| `ca777f3` | 1.4.0 | 5 | 80 | 0 | 7 |
| `283d3be` | 1.3.0 | 9 | 85 | 0 | 33 |
| `bd5110d` | 1.2.0 | 3 | 55 | 0 | 0 |
| _pre-release_ | — | 3 | 89 | 0 | 13 |

### `auto-office:auto-loop` — 46 runs, lifetime score 76

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 1 | 100 | 0 | 3 |
| `2cd480f` | 2.0.0 | 15 | 83 | 0 | 25 |
| `746cba6` | 2.0.0 | 2 | 81 | 0 | 1 |
| `bc53199` | 1.5.0 | 4 | 61 | 0 | 1 |
| `ca777f3` | 1.4.0 | 3 | 72 | 0 | 3 |
| `283d3be` | 1.3.0 | 2 | 91 | 0 | 12 |
| `37073b2` | 1.2.0 | 9 | 62 | 0 | 7 |
| _pre-release_ | — | 10 | 79 | 2 | 18 |

### `codex-office:codex-cli` — 51 runs, lifetime score 71

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 2 | 59 | 0 | 0 |
| `d5cfc3d` | 3.1.0 | 3 | 84 | 0 | 3 |
| `83830ec` | 3.0.0 | 2 | 67 | 0 | 3 |
| `a6f7b18` | 2.0.0 | 1 | 82 | 0 | 3 |
| `5f10fa1` | 2.0.0 | 3 | 81 | 0 | 8 |
| `2cd480f` | 2.0.0 | 23 | 74 | 0 | 28 |
| `ca777f3` | 1.4.0 | 3 | 71 | 0 | 3 |
| `283d3be` | 1.3.0 | 2 | 47 | 0 | 0 |
| `37073b2` | 1.2.0 | 1 | 48 | 0 | 0 |
| `bd5110d` | 1.2.0 | 1 | 58 | 1 | 1 |
| _pre-release_ | — | 10 | 72 | 1 | 21 |

### `auto-office` — 133 runs, lifetime score 71

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 2 | 81 | 0 | 3 |
| `83830ec` | 3.0.0 | 8 | 63 | 1 | 5 |
| `5f10fa1` | 2.0.0 | 5 | 77 | 0 | 12 |
| `2cd480f` | 2.0.0 | 43 | 74 | 1 | 149 |
| `746cba6` | 2.0.0 | 2 | 81 | 0 | 1 |
| `bc53199` | 1.5.0 | 2 | 81 | 0 | 1 |
| `ca777f3` | 1.4.0 | 5 | 81 | 0 | 5 |
| `283d3be` | 1.3.0 | 25 | 64 | 1 | 30 |
| `37073b2` | 1.2.0 | 6 | 79 | 0 | 7 |
| `bd5110d` | 1.2.0 | 7 | 53 | 1 | 1 |
| _pre-release_ | — | 28 | 74 | 1 | 34 |

### `auto-office:auto-planning` — 64 runs, lifetime score 68

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `5f10fa1` | 2.0.0 | 2 | 51 | 0 | 0 |
| `2cd480f` | 2.0.0 | 22 | 69 | 0 | 27 |
| `746cba6` | 2.0.0 | 3 | 63 | 0 | 1 |
| `bc53199` | 1.5.0 | 4 | 64 | 0 | 1 |
| `ca777f3` | 1.4.0 | 6 | 71 | 1 | 5 |
| `283d3be` | 1.3.0 | 6 | 74 | 0 | 11 |
| `37073b2` | 1.2.0 | 4 | 83 | 0 | 7 |
| _pre-release_ | — | 17 | 66 | 2 | 19 |

### `claude-office:claude-cli` — 24 runs, lifetime score 68

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 1 | 100 | 0 | 1 |
| `5f10fa1` | 2.0.0 | 1 | 78 | 0 | 7 |
| `2cd480f` | 2.0.0 | 12 | 57 | 2 | 3 |
| `ca777f3` | 1.4.0 | 1 | 87 | 0 | 1 |
| `283d3be` | 1.3.0 | 4 | 79 | 1 | 17 |
| `37073b2` | 1.2.0 | 2 | 37 | 1 | 0 |
| _pre-release_ | — | 3 | 99 | 0 | 3 |

### `codex-office:codex-closeout` — 21 runs, lifetime score 68

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 3 | 59 | 0 | 0 |
| `d5cfc3d` | 3.1.0 | 1 | 48 | 0 | 0 |
| `5f10fa1` | 2.0.0 | 2 | 75 | 0 | 1 |
| `2cd480f` | 2.0.0 | 14 | 70 | 0 | 10 |
| `ca777f3` | 1.4.0 | 1 | 61 | 0 | 0 |

### `claude-office` — 64 runs, lifetime score 63

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 1 | 42 | 0 | 0 |
| `2cd480f` | 2.0.0 | 2 | 47 | 0 | 0 |
| `283d3be` | 1.3.0 | 1 | 100 | 0 | 6 |
| _pre-release_ | — | 60 | 63 | 4 | 42 |

### `agy-office:agy-executor` — 21 runs, lifetime score 61

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 16 | 63 | 0 | 4 |
| `ca777f3` | 1.4.0 | 2 | 52 | 0 | 0 |
| `283d3be` | 1.3.0 | 3 | 59 | 0 | 0 |

### `codex-office:codex-executor` — 61 runs, lifetime score 60

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 8 | 48 | 0 | 0 |
| `d5cfc3d` | 3.1.0 | 1 | 42 | 0 | 0 |
| `83830ec` | 3.0.0 | 1 | 42 | 0 | 0 |
| `5f10fa1` | 2.0.0 | 2 | 71 | 0 | 1 |
| `2cd480f` | 2.0.0 | 43 | 65 | 0 | 20 |
| `ca777f3` | 1.4.0 | 2 | 42 | 0 | 0 |
| `283d3be` | 1.3.0 | 2 | 47 | 0 | 0 |
| `bd5110d` | 1.2.0 | 2 | 57 | 1 | 1 |

### `codex-office` — 74 runs, lifetime score 57

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 24 | 42 | 0 | 0 |
| `d5cfc3d` | 3.1.0 | 3 | 61 | 0 | 1 |
| `83830ec` | 3.0.0 | 1 | 40 | 0 | 0 |
| `5f10fa1` | 2.0.0 | 4 | 70 | 0 | 8 |
| `2cd480f` | 2.0.0 | 22 | 71 | 0 | 73 |
| `ca777f3` | 1.4.0 | 1 | 51 | 0 | 0 |
| `283d3be` | 1.3.0 | 1 | 85 | 0 | 6 |
| _pre-release_ | — | 18 | 57 | 3 | 11 |

### `codex-office:codex-reviewer` — 52 runs, lifetime score 56

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 25 | 42 | 0 | 0 |
| `5f10fa1` | 2.0.0 | 2 | 66 | 0 | 1 |
| `2cd480f` | 2.0.0 | 23 | 71 | 0 | 16 |
| `ca777f3` | 1.4.0 | 1 | 42 | 0 | 0 |
| `283d3be` | 1.3.0 | 1 | 47 | 0 | 0 |

### `auto-office:claude-executor` — 1 runs, lifetime score 100

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `c2c5c4e` | 4.0.0 | 1 | 100 | 0 | 0 |

### `auto-office:auto-executor` — 2 runs, lifetime score 100

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 2 | 100 | 0 | 2 |

### `agy-office:agy-planning` — 1 runs, lifetime score 100

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 100 | 0 | 1 |

### `agy-office:agy-closeout` — 1 runs, lifetime score 100

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 100 | 0 | 1 |

### `claude-office:claude-closeout` — 1 runs, lifetime score 95

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `283d3be` | 1.3.0 | 1 | 95 | 0 | 6 |

### `agy-office:agy-verification` — 3 runs, lifetime score 95

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 100 | 0 | 1 |
| _pre-release_ | — | 2 | 92 | 0 | 2 |

### `agy-office` — 3 runs, lifetime score 87

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 100 | 0 | 1 |
| _pre-release_ | — | 2 | 81 | 0 | 2 |

### `agy-office:agy-cli` — 10 runs, lifetime score 83

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 3 | 100 | 0 | 10 |
| `746cba6` | 2.0.0 | 2 | 66 | 0 | 1 |
| `37073b2` | 1.2.0 | 1 | 52 | 0 | 0 |
| _pre-release_ | — | 4 | 87 | 0 | 8 |

### `auto-office:auto-routing` — 11 runs, lifetime score 79

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 8 | 83 | 0 | 14 |
| `37073b2` | 1.2.0 | 1 | 91 | 0 | 3 |
| _pre-release_ | — | 2 | 61 | 0 | 1 |

### `claude-office:claude-cli-send-message` — 2 runs, lifetime score 76

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 57 | 0 | 0 |
| _pre-release_ | — | 1 | 95 | 0 | 2 |

### `claude-office:claude-reviewer` — 7 runs, lifetime score 69

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 2 | 62 | 0 | 0 |
| `283d3be` | 1.3.0 | 5 | 72 | 0 | 9 |

### `claude-office:claude-executor` — 6 runs, lifetime score 67

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 1 | 42 | 0 | 0 |
| `283d3be` | 1.3.0 | 4 | 65 | 0 | 6 |
| _pre-release_ | — | 1 | 100 | 0 | 9 |

### `claude-office:claude-planning` — 6 runs, lifetime score 58

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 1 | 51 | 0 | 0 |
| `283d3be` | 1.3.0 | 5 | 60 | 0 | 6 |

### `agy-office:agy-reviewer` — 14 runs, lifetime score 58

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `2cd480f` | 2.0.0 | 14 | 58 | 0 | 1 |

### `codex-office:codex-planning` — 14 runs, lifetime score 53

| version sha | core | n | score | interrupted | PRs |
|---|---|---|---|---|---|
| `7546ab1` | 3.1.1 | 8 | 39 | 0 | 0 |
| `d5cfc3d` | 3.1.0 | 1 | 42 | 0 | 0 |
| `2cd480f` | 2.0.0 | 5 | 76 | 0 | 7 |

## Thin coverage — candidates for a live eval suite

Skills with fewer than 15 lifetime runs cannot be scored from history. These need
purpose-built eval cases in `<office>/evals/`.

`auto-office:claude-executor` (1) · `auto-office:auto-executor` (2) · `agy-office:agy-planning` (1) · `agy-office:agy-closeout` (1) · `claude-office:claude-closeout` (1) · `agy-office:agy-verification` (3) · `agy-office` (3) · `agy-office:agy-cli` (10) · `auto-office:auto-routing` (11) · `claude-office:claude-cli-send-message` (2) · `claude-office:claude-reviewer` (7) · `claude-office:claude-executor` (6) · `claude-office:claude-planning` (6) · `agy-office:agy-reviewer` (14) · `codex-office:codex-planning` (14)

