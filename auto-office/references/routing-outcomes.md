# Routing outcomes — the local ledger

**Read before [model-benchmarks.md](model-benchmarks.md).** That file is a public leaderboard; this
one is what routing actually cost *here*. Where they disagree, this file wins.

Appended at every closeout ([auto-closeout](../skills/auto-closeout/SKILL.md)), consulted at routing
time ([auto-routing](../skills/auto-routing/SKILL.md)). It is the **only** cross-run file in the
plugin — everything else belonging to a run lives in that run's target repo.

**Repo identity: opaque slugs only.** This plugin ships publicly. A row never names a real repo,
host, org, or person; the slug map lives in gitignored `routing-outcomes.local.md`. Verbose
pre-compaction rows are archived in gitignored `routing-outcomes-archive.local.md`.

## Standing lessons

Compiled from 40+ rows. **Each is one line and cites the file that enforces it** — prose here binds
nothing; a rule in an owning file binds the next run. If a lesson has no owner, it is unenforced.

**Cost lives in the plan and the brief, never in the executor's model.**

1. A bigger executor implements a wrong brief more convincingly. → `auto-routing` (executor pinned)
2. Executor-vs-planner disagreement went to the **executor 5 consecutive runs**. The return path costs one read (~37k) vs a wrong implementation. → `auto-loop` (`BRIEF DEFECT` / `PLAN DEFECT`)
3. Plan review at `opus` low is the best-value item in **every run that has recorded one** — 24v6, 22v8, 14v4, 14v3, 11v?; overlap with self-review ~0–3. Blockers were real each time. → `auto-planning` 7.5
4. A brief must name the **observable outcome**; a data path is not a render path. Four briefs named a mechanism, passed review on it, left the symptom intact (~6 rounds). → `auto-loop` brief clause 3
5. Enumerate a lifecycle fully — for a cache that is write/read/**clear**. The missing seam was the *clear* twice, shadowing the server for a session. → `auto-loop` brief clause 3
6. Ask which done-criterion a field serves **before** funding a fix wave. One grep, run only after the 2nd `CHANGES REQUIRED`. → `auto-loop` brief clause 3
7. If a plan names its worst failure mode and mitigates nothing, closing that gap is a **task**, not a caveat. → `auto-planning` (named hazard)

**The recurring defect family: a test that observes a consequence reachable by more than one path.**

8. Four variants seen: context-reactive accessor; fixtures richer than production; right assertion via the default entry point; key-*count* comparison satisfied by 0→1. → `auto-loop` brief clause 2
9. The fix is one brief sentence: **state the wrong-but-passing implementation the test must exclude.** Waves that got it cleared in one round; waves that didn't took three to four.
10. A test must be shown **red at `BASE`** — necessary, not sufficient (a new file "fails" by importing nothing). → `auto-loop` brief clause 2
11. Mutation-restore of uncommitted work uses `cp`, **never `git checkout --`**, which reverts to the committed version and wipes the edits under test. → `auto-loop` brief clause 2
12. **Prove a mutation changed behaviour before trusting its verdict.** Three planner mutations printed "0 FAILs" while being invalid (wrong file, absent anchor, injected after the count). → `auto-loop` brief clause 2
13. A gate must be demonstrated **failing on known-bad input** before its pass is accepted. Two gates were initially satisfied by a *comment* naming the form they checked for.
14. A gate that cries wolf gets switched off: an unbound-alias check was reverted at 20+ false positives. A known gap beat a noisy check.

**Dispatch form outranks brand.**

15. Never route long-silent-command work (e2e, test suites) as a `--bg` CLI agent — the no-progress watchdog kills it. Same brand, same task, in-session: fine. → `auto-routing`
16. `codex exec "<positional prompt>"` from a background shell **blocks forever on stdin and exits 0**. Pass `- < brief.txt`, always `-o <file>`. 100 min of wall clock, two gates, zero output. → `codex-office/codex-cli`
17. Confirm a delegate is alive by **CPU time climbing and a session file existing** — never exit code or elapsed time. An agent blocked on input looks identical to a working one. → `auto-loop` liveness
18. agy is unambiguously right for read-only breadth. agy is **wrong where the deliverable is evidence**: it produced 79 harness checks green against deliberately broken code. → `auto-routing`
19. An in-session subagent returns whenever it has no live children; "monitoring started" is a *return*. Blocking waits go `--bg` or stay with you. Observed on a PM and again on a worker (63k, nothing done). → `auto-routing`
20. A past permission denial is not evidence about now. The blanket-flag form was blocked; the scoped form launched fine days later. Attempt the launch.

**Reviewers are the best-spent tokens.**

21. One **resumed** reviewer across tasks beats fresh ones — by round 4 it cites its own findings and has the codebase loaded. → `auto-loop`
22. Route the gate to a **different session** from the code, not merely a different brand. The fresh session finds bypasses the implementer's session had every reason to think covered.
23. A **pointed** question outperforms "review this diff". "Can this misclassification reach beyond display?" surfaced a destructive write chain that compiled, linted, type-checked and passed every test. **Ask about blast radius, not correctness.**
24. Every blocking finding came from *reproducing* a defect, not reasoning about it.
25. **A mutation-testing reviewer is not read-only.** One was killed mid-mutation and left a disabled feature in the tree, outside the next executor's scope. Apply/run/restore inside one tool call. → `auto-loop` safety rules
26. A killed reviewer can stamp a verdict on an empty stub — hence `VERDICT: PENDING`. Reject a verdict's *label* and accept its *reasoning* separately. → `office-core/reviewer-brief.md`
27. Rejecting a plan-review finding is a claim about the code and needs the same evidence as a done-criterion. One invented premise shipped into five comments and a README before the code gate disproved it.

**Closeout is the expensive phase and finds what no pre-merge gate can.**

28. Measured at **~8× implementation** on one run. Budget it; do not treat it as a formality.
29. Enumerate deploy targets **from the diff**, not from the file you edited — one source shipped as two live Rock blocks via two scripts; the stale host then broke on a removed action. **Sync every consumer before removing anything.** → `auto-loop`
30. A version is the one field where "both sides agree" is evidence of a bug — matching strings merge clean and walk the branch backwards. Check `git log --all -S` across every ref. → `auto-closeout`
31. A clean auto-merge on a file both branches touched is the hazard, not the reassurance. Two-dot diff against **both** parents; three-dot hid a silently dropped 47 lines.
32. `git merge-tree` answers "will this conflict?" non-destructively, before speculating about merge order.
33. Read the promotion chain from merged PRs before opening one — a PR opened against `main` bypassed `feature→preview→staging`.

**Environment and harness traps.**

34. For Rock/Lava the **only** gate that counts is a rendered-page fetch asserting no `Lava Error`. Five page-level defects shipped past 364 tests, syntax gates, jsdom and two Opus passes; every one was found by loading the page. → `rock-favor` domain memory
35. After a **create-path** apply, clear cache **and re-fetch** to confirm the new block renders. One clear may not surface a newly created block.
36. `cd` in a shell call persists — use `git -C` / absolute paths for cross-tree checks. Three "is main safe?" checks silently ran in the wrong tree.
37. A prohibition in a brief cannot bind an action taken *on the way to reading it*; worktree constraints belong in the dispatch prompt.
38. An MCP write refusal is never evidence the underlying API refuses — it is an allowlist. REST patched what `rock_write` declined.
39. IPv6 black-holing produced every apply failure on one run (`Errno 51/54/60`); pin `AF_INET` before importing the client.

**Unfixed, recurring.**

40. **Quota headroom went unprobed at both ends of four separate runs.** Filed once (#232) rather than absorbed into "done". Still the most-repeated omission in this ledger.

## Ledger

`date · repo-slug · task · brand · model · effort · dispatch · rounds · tokens · wall · verdict · lesson`

- `tokens` — `n/a` where the harness reports none (**always** for agy). Never `0`.
- `rounds` — code-review rounds only; `PLAN DEFECT` / `BRIEF DEFECT` consume none.
- **Two lines per row, hard cap. Most rows are one.** A lesson needing more is a **rule change** —
  make it in the owning file and cite it here in a clause. Express runs append nothing. "As expected"
  is the most common correct lesson; do not manufacture one.

| Date | Repo | Task | Brand | Model | Rounds | Tokens | Wall | Verdict | Lesson |
|---|---|---|---|---|---|---|---|---|---|
| 08-01 | repo-a | receipt-send regression | claude | `opus` | 3 | 829k | 2h10m | APPROVED | Largest line item; stated cause was wrong. Should have flipped to `PLAN DEFECT` at round 2 → §1, §2 |
| 08-01 | repo-a | contradict the stated cause | claude | `opus` | 1 | 96k | 24m | APPROVED | Highest-value output came from the executor disagreeing with its brief. `BRIEF DEFECT` exists because of this row |
| 08-01 | repo-a | queue-path regression test | claude | `opus` | 2 | 187k | 41m | CR→APPROVED | Test passed at `BASE` → §10 |
| 08-01 | repo-a | recon: locate call sites | agy | `agy` | 0 | n/a | 6m | APPROVED | Breadth-first read-only is agy's unambiguous fit → §18 |
| 08-01 | repo-a | (dispatch lost) | codex | `codex-terra` | 0 | 0 | 1h38m | — | 1h38m, zero tokens, no liveness check → §17 |
| 08-02 | repo-c | care-notes cache overlay | claude | `sonnet` | 3 | 395k | 25m | APPROVED | Both rounds were about the TEST → §8 |
| 08-02 | repo-c | measure Expand All cost | claude | `sonnet` | 0 | 126k | 7m | done | Measure-before-fix: the issue's own fix targeted an ~83ms term and would have shipped a freeze |
| 08-02 | repo-c | staged grid mounting | claude | `sonnet` | 2 | 343k | ~12m | APPROVED | Executor declined part of the brief citing a measurement; reviewer upheld it → §2 |
| 08-02 | repo-c | persist expansion + restore | claude | `sonnet` | 3 | n/a | ~40m | APPROVED | Reviewer found data-loss no criterion asked about; planner's remedy was also wrong → §4 |
| 08-02 | repo-b | RecordStatus promotion | codex | `codex-terra` | 1 | n/a | 19m | APPROVED | Gate found an unrelated live prod bug by looking outside the diff |
| 08-02 | repo-b | group RSVPs dead route | — | `opus` inline | 1 | n/a | 12m | APPROVED | A mock plus an assertion enshrined a bug from both sides — months of silent no-writes |
| 08-02 | repo-b | thread recordStatus | codex | `codex-terra` | 1 | n/a | 13m | **PLAN DEFECT** | One amendment beat a fix wave. Codex worked test-first unprompted |
| 08-02 | repo-b | toggles/counts/badges | agy | `claude-sonnet-4-6` | 2 | n/a | 14m | CR×2→APPROVED | Chose sonnet over flash on pinned signatures; no invention occurred |
| 08-02 | repo-b | opus gate, resumed | claude | `opus` | 5 | 788k | ~9m | — | Resumed reviewer beat 3 fresh ones; probed the live server twice → §21 |
| 08-02 | repo-e | timezone core | codex | `gpt-5.6-terra` | 5 | n/r | 29m | — | Correct core in one dispatch. Round-2 reported `killed` while alive; planner confirmed death → §17 |
| 08-02 | repo-e | timezone plan review | claude | `opus` low | 1 | 78k | 4m | 14 findings | Caught a two-datetime-frame assumption = silent 2h error on every event. Self-review 3, **zero overlap** → §3 |
| 08-03 | repo-d | v2 QR backend | codex | `gpt-5.6-terra` | 1 | n/r | 11m | APPROVED | Correct first pass with unprompted mutation testing; cheapest task in the run |
| 08-03 | repo-b | scanner alias id | claude | `sonnet` | — | 224k | 16m | absorbed | Stalled twice on the 600s watchdog → §15 |
| 08-03 | repo-d+b | plan review | claude | `opus` low | 1 | 94k | 10m | 24 findings | 24 v 6, overlap 3; incl. a 1-year `Cache-Control` on wrong-id QRs → §3 |
| 08-03 | repo-d+b | code review, 2 repos | claude | `opus` | 4 | 734k | 35m | APPROVED | Found a surface with no assertion at all (mutating it left 379 tests green) → §8 |
| 08-03 | repo-e | check-in CSV export | claude | `sonnet` | 5 | 530k | 1h20m | APPROVED | Plan review 22 v 8; planner produced both defects; executor was right and overruled → §2, §3 |
| 08-05 | repo-f | two codex gates | codex | `codex exec` | 1 | 0 | 100m wasted | **never ran** | Positional prompt blocked on stdin, exit 0 → §16, §17 |
| 08-08 | repo-g | form insights ×3 pages | claude+`opus` inline | `sonnet` | 2+3 | n/r | multi-session | APPROVED | Three prod defects, one shape: nothing local executes the language the bug lives in → §34 |
| 08-08→09 | repo-g | ministry view + nav prune | agy→codex | flash / `codex exec` | 4 of 5 | n/a | 2 sessions | APPROVED | agy's tests were 79-green-against-broken; rerouting fix lanes to codex ended the streak immediately → §18 |
| 08-09 | repo-g | tab=teams batch actions | codex | `gpt-5.6-terra` | 2+4 | 273k/rd | 2.5h | APPROVED | Different *session* for the gate was the split that mattered → §22 |
| 08-09→11 | repo-c | attendance cache rewrite | claude | `sonnet` | 3·2·3·2 | ~1.1M rev | ~9h | APPROVED | Dominant cost was the planner's briefs naming a mechanism, not the render path → §4, §5, §25 |
| 08-10→11 | repo-c | dashboard progressive loading | codex | `gpt-5.6-sol` | 4·3·2·1·3 | n/r | ~5h | APPROVED | Every multi-round wave: a test reachable by >1 path. Pointed reviewer question found a destructive write chain → §9, §23 |
| 08-11 | repo-c | attendance date shadowing | claude | `sonnet` | 0+1 BD | 531k | 1h30m | APPROVED | Plan review paid for itself again; closeout was ~8× impl and found a silently dropped 47 lines → §3, §28, §31 |
| 08-12 | repo-g | Merge Person batch action | claude | `sonnet` | 5 | 906k rev | ~4h | APPROVED | Dominant cost was deploy completeness: one source, two live blocks, one re-applied → §29 |
| 08-12 | repo-g | unified-chrome + PROD | agy + `opus` inline | flash / `opus` | 1 | n/a | ~90m | APPROVED | Exact-transcription brief → agy one dispatch, zero invention, ~3m. `git checkout` mutation-restore wiped uncommitted edits → §11, §35 |

## Weekly compaction — the self-healing clause

This file is **compiled, not appended forever.** Raw rows are working memory; the standing lessons
are what survives. Consolidate **weekly, or whenever the ledger passes 150 lines or 3,000 words** —
whichever comes first.

Procedure:

1. **Archive before compiling.** Copy the current file to `routing-outcomes-archive.local.md`
   (gitignored). Nothing is deleted, only moved out of the hot path.
2. **Promote, don't summarise.** Any row-lesson that recurred, or that changed a rule, becomes a
   numbered standing lesson citing its owning file. A lesson with no owning file is **unenforced** —
   either give it one or drop it, because prose here binds nothing.
3. **Merge duplicates by mechanism, not by wording.** Four differently-worded rows about tests
   passing for the wrong reason are one lesson with four variants, and the variants are the value.
4. **Compress rows to the cap.** Keep date, slug, task, brand, model, rounds, tokens, wall, verdict —
   those are the routing inputs. Replace the essay with a clause plus a `§n` cite.
5. **Keep every number.** Token counts, round counts, wall clock, and finding tallies (24 v 6,
   overlap 3) are the evidence; adjectives are not. **If compaction loses a number, it failed.**
6. **Never drop an unfixed recurrence.** A lesson that keeps recurring gets *louder*, not shorter —
   see §40.
7. Note the compaction date below and what moved.

**Applies to every long-lived `.md` in this repo, not just this one.** Any doc that a run must read
is on the same contract: when it grows past the point where the next reader would skim it, it has
stopped being a routing input and become a diary — and a diary that every future run pays to read.
Compile it. The test is not "is this true?" but **"would the next reader act on this, and can they
find it in ten seconds?"** Prefer a table to a paragraph, a rule to a story, and a `§` cite to a
retelling. An essay that adds tokens without changing a decision is a defect in the document.

**Compaction log**

| Date | What moved |
|---|---|
| 2026-08-14 | First compaction. 7,802 → ~2,400 words. 40 standing lessons compiled from 30 rows; verbose rows archived. **Fixed a live leak:** rows had been naming real hosts/repos against this file's own opaque-slug rule — all re-slugged (`repo-c` `repo-e` `repo-f` `repo-g` added to the local map). Git history still contains the real names; that is not fixable from here. |
