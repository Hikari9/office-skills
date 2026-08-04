# Routing outcomes — the local ledger

**Read this before [model-benchmarks.md](model-benchmarks.md).** The benchmark file reflects a public
leaderboard, which has never run this workspace's repos, briefs, or reviewer. This file reflects what
routing actually cost *here*. Where they disagree, this file wins.

Appended at **every** closeout, one row per task ([auto-closeout](../skills/auto-closeout/SKILL.md)).
Consulted at routing time, before the benchmark snapshot
([auto-routing](../skills/auto-routing/SKILL.md)).

## Why this file lives in the plugin

It is the **only** cross-run file that does. Everything belonging to a specific run — the plan, the
GOAL block, briefs, diff packages, evidence, the run report — lives in that run's **target repo**.
This ledger has to survive any single target repo, so it lives here and is explicitly workspace-local.

## Repo identity: opaque slugs only

This plugin ships publicly, so a committed row **never** names a real repo, host, org, or person. It
carries an **opaque slug** — `repo-a`, `repo-b`, `repo-c`.

The slug → real repo and plan path mapping lives in **`routing-outcomes.local.md`**, beside this file
and **gitignored**. That keeps a row traceable for the operator and keeps this file publishable. Seed
and append with a slug from the start; a ledger scrubbed later has already leaked.

## Columns

`date · repo-slug · task · brand · model · effort · dispatch · rounds · tokens · wall clock · verdict · lesson`

- `tokens` — `n/a` where the harness reports none (**always** for agy). Never `0`, which reads as a
  measurement rather than an absence.
- `rounds` — code-review rounds. `PLAN DEFECT` and `BRIEF DEFECT` consume none; note them in the
  lesson instead.
- `lesson` — one line, and only if the row taught something. "As expected" is a legitimate lesson.

## Ledger

| Date | Repo | Task | Brand | Model | Effort | Dispatch | Rounds | Tokens | Wall | Verdict | Lesson |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-08-01 | repo-a | Fix the receipt-send regression (#165) | claude | `opus` | high | cli | 3 | 829k | 2h10m | APPROVED | The run's largest line item, and the brief's stated cause was wrong. Two rounds in, the presumption should have flipped to `PLAN DEFECT`. Opus did not save it — a bigger executor implements a wrong brief more convincingly. |
| 2026-08-01 | repo-a | Contradict the stated cause (#167) | claude | `opus` | high | cli | 1 | 96k | 24m | APPROVED | Highest-value output of the run, and it came from the executor *disagreeing with its brief*. There was no return path for it at the time; `BRIEF DEFECT` exists because of this row. |
| 2026-08-01 | repo-a | Add a regression test for the queue path (#164) | claude | `opus` | high | cli | 2 | 187k | 41m | CHANGES REQUIRED → APPROVED | The test passed at `BASE` and could not detect its target bug. Now a standing brief clause: show the test red at `BASE` or it is not a test. |
| 2026-08-01 | repo-a | Recon: locate every call site | agy | `agy` | high | cli | 0 | n/a | 6m | APPROVED | Breadth-first read-only fan-out is where agy is unambiguously the right route. agy reports no tokens — wall clock is the signal. |
| 2026-08-01 | repo-a | (dispatch lost to a launch mistake) | codex | `codex-terra` | high | cli | 0 | 0 | 1h38m | — | **1h38m of wall clock, zero tokens.** No liveness check existed after dispatch. Wall clock is now a first-class cost, and the liveness check is in `auto-loop`. |

| 2026-08-02 | connect-portal | #180 care-notes cache overlay | claude | `sonnet` | high | in-session | 3 | 135k + 260k rev | ~25m | APPROVED | Both `CHANGES REQUIRED` rounds were about the TEST, never the fix. Reviewer mutation-testing found a guard whose whole suite moved state 0→1 key, so a key-*count* comparison passed everything while reintroducing the original bug. |
| 2026-08-02 | connect-portal | #183 measure Expand All cost | claude | `sonnet` | high | in-session bg | 0 | 126k | 7m14s | done | Measure-before-fix earned its keep outright: the issue's own recommended fix (remove `startTransition`) targeted the cheap ~83ms term and would have shipped a freeze as a fix for a lag. |
| 2026-08-02 | connect-portal | #183 staged grid mounting | claude | `sonnet` | high | cli | 2 | ~125k + 218k rev | ~12m + fixes | APPROVED | Executor **declined part of the brief** (refused to batch the Set updates) citing the measurement, and the reviewer upheld it. A brief that contradicts a measurement should lose. |
| 2026-08-02 | connect-portal | #181 persist expansion + staged restore | claude | `sonnet` | high | cli | 3 | n/a (CLI, no report channel) | ~40m incl. outage stall | APPROVED | Reviewer found a **user-facing data-loss bug** (search keystroke wiped the persisted layout) that no criterion asked about, then the planner's own remedy was ALSO wrong — filters exclude rows before bucketing. The executor caught that. |

| 2026-08-03 | repo-d | v2 QR alias-id: backend surfaces + cache + docs | codex | `gpt-5.6-terra` | high | cli | 1 | n/r | ~11m | APPROVED | Correct on the first pass with real mutation testing, unprompted. The right route, and the cheapest task in the run. |
| 2026-08-03 | repo-b | scanner reads alias id (QR contract other half) | claude | `sonnet` | high | cli `--bg` | — | 224k | ~16m, **zero output** | **absorbed inline** | Stalled TWICE on the harness 600s no-progress watchdog, having produced two untracked files and no commits. Cause was the dispatch form, not the brand: e2e work is long silent commands, and the watchdog kills an agent sitting on one. **Never route long-test-suite work as a `--bg` CLI agent.** |
| 2026-08-03 | repo-b | two pre-existing e2e defects (owner-added mid-run) | claude | `sonnet` | high | in-session bg | 1 | 174k | ~28m | APPROVED | Same brand, same task shape, different dispatch form — worked fine and found three stacked root causes the planner had missed. Confirms the row above is a dispatch-form lesson. |
| 2026-08-03 | repo-d+b | plan review | claude | `opus` | low | in-session bg (retired) | 1 | 94k | ~10m | 24 findings | **24 vs self-review's 6, overlap 3.** Blockers included a `verify` command red by construction (coverage threshold on subset runs), a year-long `Cache-Control` that would have served stale wrong-id QRs for 12 months, an omitted production deploy in the blast radius, and "automerge when green" in two repos that have **no test CI**. Best value per token in the run, again. |
| 2026-08-03 | repo-d+b | code review, resumed across 4 rounds and 2 repos | claude | `opus` | medium | in-session bg | 4 | 734k | ~35m | APPROVED | Found a surface with **no assertion on its output at all** (mutating it left 379 tests green), a constant cache key that passed the module's own suite because every fixture was the same human, and a **planner-authored production regression** heading into a deploy. Also re-derived the planner's "pre-existing failure" claim independently instead of accepting it, and corrected the planner's count of production-visible changes. |

**Reading the 2026-08-03 rows:** the planner authored **three** of the defects the gates caught —
a fabricated justification for rejecting a plan-review finding, a `verify` command that could not
pass, and a production regression in its own fix. The executors needed one fix round between them.
Two further lessons worth carrying: **a rejection of a plan-review finding is a claim about the
code and needs the same evidence as a done-criterion** (this run rejected finding #13 on an
invented premise, shipped that premise into five comments and a README, and had it disproved by the
code gate); and **mutation-testing your own inline fix before resubmitting** converted a likely
second `CHANGES REQUIRED` into an approval, twice.

**Reading these nine rows together:** cost concentrates in the plan and the brief, not in the
executor's model. Eight of the nine rows are about the *instruction*; none is about capability.

The 2026-08-02 rows sharpen that from "briefs can be wrong" to something more specific: **the
planner's artifacts fail in a repeatable shape, and reviewers catch them more reliably than they
catch executor bugs.** Three criteria and one fix instruction were defective in one run, all four
caught downstream. Twice the executor or reviewer was right against the planner and the planner
was wrong. Route accordingly: an executor that pushes back on a brief citing evidence is doing the
job, and a reviewer's spare capacity is better spent attacking the *criteria* than re-reading the
diff.
| 2026-08-02 | repo-b | T1 RecordStatus promotion + 4 entry points (#49) | codex | `codex-terra` | high | cli | 1 | n/a | 19m | APPROVED | Clean first pass. Its gate found an unrelated **live prod bug** (a REST route dead in prod but mocked in the harness) — the highest-value output of the run came from the reviewer looking outside the diff. |
| 2026-08-02 | repo-b | Fix group RSVPs throwing on a dead route (planner inline) | — | `opus` (planner) | — | inline | 1 | n/a | 12m | APPROVED | Group RSVPs had written **nothing** for months — no GroupMember, no Attendance. Invisible because the mock answered the dead route *and* the test asserted it. A mock plus an assertion can enshrine a bug from both sides. |
| 2026-08-02 | repo-b | T2 thread recordStatus through payloads (#49) | codex | `codex-terra` | high | cli | 1 | n/a | 13m | **PLAN DEFECT** | Code correct against the pin; the *plan* lacked a rule. Correctly setting a field collided with an untouched sort. `PLAN DEFECT` did its job — one amendment beat a fix wave. Codex worked test-first unprompted, visible in the tee log. |
| 2026-08-02 | repo-b | T3 toggles, counts, badges, sort fix (#49) | agy | `claude-sonnet-4-6` | high | cli | 2 | n/a | 14m | CHANGES REQUIRED ×2 → APPROVED | Chose sonnet over `gemini-3.6-flash-high` because the task was almost entirely pinned signatures and the skill records Flash inventing them. No invented signatures occurred. Phase 2b check 6 caught a real defect before review. |
| 2026-08-02 | repo-b | Opus review gate, resumed across all tasks | claude | `opus` | medium | cli | 5 rounds | 788k | ~9m total | — | One resumed reviewer across 3 tasks beat 3 fresh ones: by round 4 it was citing its own earlier findings and had the codebase loaded. It also *independently probed the live server* twice rather than reasoning from the diff. |

| 2026-08-02 | rsvp-favor-church | timezone: UTC core, viewer-local (impl, tasks 1-9) | codex | `gpt-5.6-terra` | high | cli | 5 | n/r | ~29m | — | Correct core in one dispatch: two-frame split, DST inverse, Rock write conversion all survived reviewer mutation. Round-2 dispatch reported `killed` while still alive; planner did NOT re-dispatch, confirmed death, recovered the orphaned green work. Cost: no executor mutation report for r2. |
| 2026-08-02 | rsvp-favor-church | timezone: adversarial code gate | claude | `opus` | medium | cli (resumed) | 5 | 675k | ~23m | — | Resumed reviewer again outperformed: re-ran round-1 mutations each round to check for decay, and corrected the *planner's* own mutation report. Rounds 3-5 gated test names/comments only — real defects, but Opus-grade review for a code comment is over-provisioned. |
| 2026-08-02 | rsvp-favor-church | timezone: plan review | claude | `opus` | low | cli (retired) | 1 | 78k | ~4m | — | Best value in the run. 14 findings, 2 BLOCKER; caught that the plan assumed ONE Rock datetime frame when there are two — would have shipped a silent 2h error on every Brisbane event. Also caught the planner silently resolving a user-owned decision. Self-review found 3, this found 14, **zero overlap**. |

| 2026-08-03 | rsvp-favor-church | check-in CSV export (T1/T1b/T2 + planner inline) | claude | `sonnet` | high | in-session, shared worktree | 5 | ~530k | ~1h20m | APPROVED → PR #64 | Executor brand was a caller override (codex→claude) on quota: codex weekly 37% resetting in 5d19h vs claude 66%/7d. Correct call — feature needed no codex-grade backend work. **Plan review found 22 vs self-review's 8, overlap ~1**, and all 4 blockers were real (a field the codebase cannot fetch; a criterion testing a mechanism that does not exist; a criterion untestable for lack of jsdom; a formatter that cannot emit the pinned format). **Planner produced BOTH defects this run** — a PLAN DEFECT (two true premises that don't compose: rows built `checkedIn:false` are mutated to true client-side at 5 sites) and a half-applied fix whose docblock claimed completeness. Executor flagged the first and was overruled; it was right. Third consecutive run where executor-vs-planner went to the executor. Planner mutation-testing its own inline fix before resubmitting converted a likely 2nd CHANGES REQUIRED into APPROVED — make that default. CLI dispatch blocked by the permission classifier (`--dangerously-skip-permissions`); fell back to in-session, no loss. A manual criterion was blocked by DATA, not code (only PIN-reachable definition had zero attendees) — seed a populated preview occurrence before runs with manual guestlist steps. |
