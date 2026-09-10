# Routing outcomes — the local ledger

**Read before [model-benchmarks.md](model-benchmarks.md).** That file is a public leaderboard; this
one is what routing actually cost *here*. Where they disagree, this file wins.

Appended at every closeout ([auto-closeout](../skills/auto-closeout/SKILL.md)), consulted at routing
time ([auto-routing](../skills/auto-routing/SKILL.md)). It is the **only** cross-run file in the
plugin — everything else belonging to a run lives in that run's target repo.

Historical rows retain the dispatch form used at the time. When `HERDR_ENV=1`, the current
dispatch form is `herdr` regardless of older rows; use the shared Herdr skill for the pane layout.

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
19. An in-session subagent returns whenever it has no live children; "monitoring started" is a *return*. Blocking waits go `--bg` or stay with you. Observed on a PM and again on a worker (63k, nothing done). → `auto-routing` **Recurrence (09-06, repo-l), third occurrence and by far the most expensive:** an executor whose brief ended in "run lint, jest and build and paste the output" returned **four times** on the same poll cycle, spending **296k tokens / 194 tool calls / ~47 min** while the gates themselves were healthy and the code was already correct. The brief said what to run and never said *how to wait*, which is not fixable in prose. **If a task ends in a long-running gate, the planner holds that gate or routes it `--bg`; do not hand a blocking wait to an in-session executor.**
20. A past permission denial is not evidence about now. The blanket-flag form was blocked; the scoped form launched fine days later. Attempt the launch.

**Reviewers are the best-spent tokens.**

21. One **resumed** reviewer across tasks beats fresh ones — by round 4 it cites its own findings and has the codebase loaded. → `auto-loop`. **Recurrence (08-26, repo-g):** planner dispatched round 2 as a brand-new `Agent` call instead of `SendMessage` to the round-1 agent id — caught immediately by re-reading this rule mid-run, mitigated by pasting round-1 findings into the fresh prompt so verification stayed real, but the reviewer's own carried uncertainty was lost. The failure mode is muscle-memory: `Agent` is the tool that was just used for plan-review (a genuinely one-shot, no-resume gate), and code-review's differing resume requirement doesn't announce itself at the call site. **Before dispatching review round ≥2, check for a live agent id from round 1 first — resume it, don't re-launch.**
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
41. **A CLI quota wall can be account-level, not per-session/per-task.** Two consecutive codex dispatches (executor fix-wave, then the very next reviewer resume) both failed with an identical "workspace is out of credits" — the second failed before any work began, which is what distinguished it from the ordinary 10-min-ceiling kill this office already resumes through silently. Surfaced to the user rather than silently rerouted, because it also meant abandoning the run's standing reviewer brand (an `AskUserQuestion`-worthy decision, not an in-loop one) → `auto-routing` (headroom is a cost, not a gate) should add: distinguish "killed" (resume same brand) from "errored with a credits/billing message" (stop and ask) before choosing a recovery path.
42. **A uniform top-tier review gate outspends the work it gates.** One `xhigh` code review cost **293k** against a 226k-269k executor leg. Price codex code-review effort per leg by blast radius; the gate still always runs. → `auto-routing` (*Review effort is priced per leg*)
43. **A low-effort reviewer at a stronger model can outperform a stronger-effort executor at a weaker one.** `sonnet` high executor + `opus` low reviewer, small backend guard change: the reviewer caught an unconditional, non-fail-soft `GET` added to a hot path that the executor introduced and missed — on a 5xx it would have zeroed materialization for a class of records the change was explicitly scoped to leave alone. `opus` low was worth its cost as the gate, independent of the executor's own effort tier. Both PRs merged same day. → `auto-routing` (reviewer floor is not the executor's tier)

**Verification must exercise the path production will take.**

44. **A staging rehearsal that runs a different code branch than production proves nothing.** Staging lacked the two attributes entirely, so the provisioner's *create* branch would have run green while production needs the *update* branch (field-type flip plus qualifier creation on rows that already exist). Seeding staging into production's actual broken shape first — wrong field type, no qualifiers, same descriptions, one deliberately out-of-range value — is what made the rehearsal evidence rather than a demo. → `auto-loop` (named-action preconditions)
45. **An API's empty collection is not evidence of absence, and a rollback baseline built on one is empty.** The singular `GET /Attributes/{id}` returned `AttributeQualifiers: []` for an attribute holding three qualifier rows, because that route does not expand the nested collection. A capture trusting it would have restored nothing while reporting success. Read a nested collection from its own endpoint before treating it as a baseline. → `office-core/evidence-and-handoff.md` (read-back)

## Planner and family metadata

Dedicated-planner rows extend the established ledger row rather than creating a
second telemetry format. Keep the existing columns and append these
compact fields in the `lesson`/run-note portion:

```text
planner_mode=<auto|inline|dedicated>
plan_needed=<true|false>
detector_verdict=<supported|unsupported|unknown|not-needed>
orchestrator=<harness/model@effort or unknown>
prompt_shown=<true|false>
prompt_choice=<opus|fable|astra|inline|null>
planner=<harness/model@effort>
review_tier=<inline|adversarial>
integration_adversary=<true|false>
versions=<req/plan/routing>
families_live=<n>
reused_from_orchestrator=<true|false>
fallback_used=<true|false>
fallback_reason=<reason|null>
attempts=<triple:result:reason,...>
```

The `planner` value is the actual selected or reused triple, not the requested
one. `integration_adversary=true` is expected only where two or more executors
produced dependent or merging landings; a `true` on a single-executor run is a
protocol error worth a lesson line.

**`families_live` and the orchestrator's own cost are an open question, not a
settled saving.** The claim that a cheaper control plane supervising several
families is net cheaper has not been measured here — the registry, projections,
and amendment classification are real orchestrator work. Record the number and
what it cost; do not assume the saving. `fallback_reason` explains why the preferred triple was
unusable; `attempts` keeps the dedicated fallback path auditable. Existing rows
without these fields remain valid historical compatibility rows. The normal
event fields `brand`, `model`, `effort`, and `dispatch_form` still describe the
actual call; executor and reviewer routing are not rewritten by planner
selection.

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
| 08-26 | repo-g | sunday-inputs settings-channel prod fix | codex | `gpt-5.6-luna` high | 2 | n/r | ~30m | APPROVED | Reviewer caught a create payload missing 2 non-null fields never exercised by preview's assert-only path; live throwaway create/read/delete probe against real preview closed it before prod. Round-2 review dispatched as a fresh agent instead of resumed — mitigated by pasting round-1 findings, but the resume-not-fresh rule was broken → new lesson below |
| 08-28 | repo-e | wayfinder #147 M3 schedule selector + deeplinks | codex | `gpt-5.6-luna` high | 3 | n/r | n/r | APPROVED | Round 1 (T8/T9/T12-partial, 2 rounds): tautological live-verify script + test-guard blind spot, both fixed with real architectural improvements (shared pure predicate module) rather than patched. Round 2 (T10/T11/T12-remainder, fresh session): 1 round, live Rock page-id discovery, no findings |
| 08-28 | repo-e | wayfinder #147 M3b admin search/filter | codex | `gpt-5.6-luna` high | 2 | n/r | n/r | APPROVED | Same defect shape as §8/§9 twice over: touch-target sizing (concrete, caught by measuring) + an E2E fixture that only covered one Source kind, silently leaving the filter's main dimension untested at the browser level |
| 08-28 | repo-e | wayfinder #147 M4 form-source union | codex→opus | `gpt-5.6-luna` high → `opus` | 4 | 257k/366k codex; 147k/47k/58k opus | multi-session | APPROVED | Round 1 (codex): live-write leak (id captured from a later read-back, not the POST response) + a reconciliation crash on malformed JSONB — both mutation-proven, one via a deliberate live counterfactual on rock-preview. Codex then hit account-level credit exhaustion (→ §41); rounds 2-3 rerouted to fresh in-session Opus per explicit user decision. Round 2 found the round-1 fix itself left 2-of-3 shifted endpoint citations stale — the exact "GREEN is one-directional" trap the plan's own doc warned about, caught anyway. A 4th narrow pass verified a hand-resolved merge conflict before landing — a clean 3-way auto-merge on one file was fine, the one real conflict needed per-file authorship reasoning (§31 held again) |
| 08-28 | repo-e | sunday-inputs closeout: land #467/#471, apply both envs, A1 audit, UAT | claude planner-only, no executor | `opus` | 0 review rounds; 1 browser subagent | ~230k planner | ~1 session | APPROVED | Ran as planner+author, not an office run. The plan's own `named_actions` said apply-then-merge from the feature branch — that branch predated a same-day merge, so following the manifest would have shipped a superseded STATS matrix; a trial merge caught it. Second: a 4-row registry edit turned 105 tests red because the file doubles as a cross-domain STAFF_TIER pin — reverted and filed rather than renumbering the guard (§ hold on 'supersede, never weaken') |

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
| 08-30 | repo-i | Leader flag: DataView recovery + live prod apply | claude | `sonnet` | 5 | n/a | ~8h | CR×4→APPROVED | Gate authorized a prod apply while covering 3 of 8 views, Leader (the subject) never evaluated. Absence of coverage read as GREEN → §6 |
| 08-30 | repo-i | same run, review economics | mixed | `codex-luna` xhigh / `opus` low | 5 | n/a | — | APPROVED | Every real defect came from an adversarial round; `/code-review` low re-filed a finding it was told was out of scope. Reviewer continuity is what catches regressions |
| 08-30 | repo-j | campus-scoped settings + T5–T15 admin actions | claude | `sonnet` high, 4 rounds | 4 | ~1.3M | ~5h | CR×4 → shipped on operator call | Per-finding fixes reproduced the same defect class in the adjacent arm twice; converged only when round 3 audited the parameter space instead of the clause → §1 |
| 08-31 | repo-h | signups links + type scale + ?date= parity | claude | `sonnet` | 4 | 1.2M | ~3h | APPROVED | Two URL-guard predicates the planner proposed both leaked; only a differential fuzz settled it → §24 |
| 08-31 | repo-h | plan-review of a 2-line security amendment | claude | `opus` low | 1 | 49k | 3m | 3 blockers | Rejected the planner's predicate AND its layer; cheapest item in the run → §3 |
| 09-01 | repo-h | dashboard access + fence + dimensions + names, 3 executors, 2 repos | mixed | `codex-luna` high, `opus` low then `codex-luna` high reviewers | 9 | n/r | ~6h | APPROVED ×3 | Five rounds hardened the *structure* of a generated script and never once executed it; the first real run refused it. A hermetic gate on generated code proves nothing about its contract |
| 09-01 | repo-h | same run, planner-inline prod work | — | `opus` inline | 2 | n/r | — | 4 claims retracted | cwd silently reset to the default branch; deploys ran from the wrong tree and overwrote correct prod assets. Every conclusion from a tool's own success line was wrong; every one from an independent hash was right. Pin the worktree, verify out-of-band |
| 09-04 | repo-i (new slug) | issue-driven frontend redesign, 5 lanes, 3 milestones, 1 PR | mixed | `sonnet` high executors ×5, `opus` low reviewers ×3, Fable planner | 3+1+3 | n/r | ~30h | APPROVED, merged, prod deployed | Every touch-target sweep (executor, planner, reviewer) enumerated the default screen; the 44px defect lived in overlays and cost two extra rounds. A UI sweep must enumerate states, not selectors. Delegated `/compact` via herdr worked 5/5 at handoff boundaries |

**Compaction log**

| Date | What moved |
|---|---|
| 2026-08-14 | First compaction. 7,802 → ~2,400 words. 40 standing lessons compiled from 30 rows; verbose rows archived. **Fixed a live leak:** rows had been naming real hosts/repos against this file's own opaque-slug rule — all re-slugged (`repo-c` `repo-e` `repo-f` `repo-g` added to the local map). Git history still contains the real names; that is not fixable from here. |

| 2026-09-02 | rock-pages per-campus signups board | claude opus planner, codex `gpt-5.6-luna` high executors x2, codex verifier (user override) | 15 tasks, 6 review rounds, 2 repos, both merged | Offline gates proved nothing about Lava: 1194 green tests hid two live-only defects, one of them pinned by a test asserting the buggy line. Every real defect this run came from a rendered fetch as a genuinely-authenticated viewer, never from the suite. |

| 2026-09-03 | rock-pages #535 campus resolution + rock-security #163 Auth reorder | claude opus planner, claude `sonnet` high executors ×2, `opus` low reviewer | 2 repos, 3+3 review rounds, both merged, both applied to prod | **Same lesson as 09-02, second occurrence on this repo — promote it to a rule.** 1999 green tests plus a byte-identity read-back (deployed == committed source) hid two blocking defects; both were found by a rendered browser A/B and neither was findable from the suite. Both were *two individually-correct changes combining*, not a wrong line. The reviewer found the second only when told to hunt the shape rather than the line. |

| 2026-09-04 | repo-j FormBuilder source union (Rock form submissions into RSVP count) | claude opus planner, claude `sonnet` high executors ×4, codex `gpt-5.6-luna` high executor (T5), codex-luna reviewers fresh per round | 7 tasks, 4 review rounds on one task, merged + prod deployed; 1 criterion held for user confirmation | Four rounds found **one** defect class — a source under-counts and the under-count renders as a legitimate empty result. Patched at three pipeline points before the fix became structural; the signal to stop patching branches was the repetition, not any single finding. Separately: the 4th review finding had **no mechanism** (claimed duplicate PK rows from an unpaged single fetch) and the reviewer withdrew it when asked to name one — three real rounds had made accepting the fourth feel obvious. Verify the mechanism, not the reviewer's track record. |

| 2026-09-04 | repo-k Scripture layer + debug mode + 9 screenshot-driven amendments | claude opus planner-executor, agy `gemini-3.1-pro-high` then `gemini-3.8-flash-high` executors, codex `gpt-5.6-luna` high executors, codex-luna xhigh reviewer (r1 fresh, r2/r3 resumed) | 14 tasks + 9 amendments, 3 review rounds, merged + prod deployed, 8 follow-up issues | Two rounds each found the **same defect shape** — a client component importing a server action directly instead of through its `guardWrite` wrapper, so a test-marked URL performed a real production write. Nothing in the suite could catch it; a static import rule can. Separately, **reasoning from CSS values is not measurement**: a 44px finding was "fixed" by raising `min-height`, which satisfied one axis while the control stayed 36.1px wide. codex disclosed it had not measured; that disclosure is what triggered the measurement that found it. agy reported *correct* rects showing a wrapped element and called the change good — right numbers, wrong reading. Prefer the agent that reports what it did not verify. |

| 2026-09-06 | repo-l Connect Group attribute dropdowns + age-group descriptions (Rock schema change, prod-facing) | claude opus planner, claude `sonnet` high executors ×2 (2 repos), `opus` low plan-reviewer, `opus` low code-reviewer | 12 tasks, 1 code-review round at time of writing, 2 repos, 2 PRs open, prod rollout pending | Plan review caught **the planner's own false premise** — the plan asserted no test coverage existed for the changed code, when seven assertions across six suites encoded the old behaviour. Separately, **three plan-stated facts about the live system were wrong** and only a direct production read found them: one attribute was two rows, staging lacked the attributes entirely, and a qualifier believed mandatory was optional. Read production before planning a write to it. |

| 2026-09-06 | repo-m Schedule form sources scoped to the viewed occurrence set (prod deploy + prod config write) | claude opus planner, codex `gpt-5.6-luna` high executor (retired mid-T1 on user request), claude `sonnet` high executors ×2, `opus` low code-reviewers ×3 | 3 review rounds: 3 Important + 2 Minor → 1 Minor → APPROVED; 6/6 findings funded, 0 waived | **Every herdr agent exited after its turn and took its pane, so no reviewer could be resumed — plan fresh+digest, not resume.** Round 1 caught a test that passed under the exact bug it claimed to exclude (35 passed, exit 0) after the planner's own full gate was green: gate output proves tests ran, not that they discriminate. |

| 2026-09-07 | rock-pages #563 + #569 form-insights Msg 8711/208 and tracked-form config (2 prod deploys, 2 prod registry writes) | claude opus planner, codex executors ×2 (retired on quota), claude `sonnet` high executors ×2, `opus` low plan-reviewer, `opus` low code-reviewer | 7 tasks + 5 config fixes, 2 PRs merged, 7 prod blocks applied twice, 3 issues filed, 2 closed | **Three of the run's four corrections were the planner's own, and all were caught by demanding provenance rather than by re-reading the work.** Two separate "proofs" were tautologies that could not have failed: dc4 compared two identical row sets with no record of the query that produced them, and dc5(b) compared pre/post text on both sides of a splice boundary that every changed hunk sat below — byte-identical before execution. Matching outputs are not a comparison; ask what result would have falsified it. Separately, **a squash merge deadlocks the two prod-apply guards against each other** (carrier commit is no longer an ancestor of main; branch tip is behind main) — merge main back into the branch so both ancestries hold, and never reach for the dirty-prod override. |

| 2026-09-07 | rock-pages #572 YA Night fenced occurrence union + registry repoint (prod blocks + prod registry write) | claude opus planner, claude `sonnet` high executor, `opus` low plan-reviewer, `opus` low code-reviewer (r1 fresh, r2 resumed) | 4 milestones, 2 review rounds (1 BLOCKER + 3 IMPORTANT → APPROVED), merged, 9 blocks + 5 registry writes applied to prod | **The plan-review round paid for the whole run twice.** It killed the planner's own mid-flight amendment (track an `IsActive=0` row — a no-op, because both consumers filter `dv.IsActive` not `IsTracked`) and it caught that a done-criterion was satisfied by three different wrong implementations. Then code review found a BLOCKER the executor had labelled "pre-existing, same failure mode": it had swapped a batch-scoped table VARIABLE for an IF-scoped TEMP TABLE, which fail differently (`Msg 208`), proved on prod with a 4-line repro. **Two lessons compound here — a "pre-existing" label is a claim, and so is a reachability claim.** The planner then overstated that blocker's blast radius ("every parameterless load") and an authenticated fetch disproved it. Measure the route, not just the code path. |

| 2026-09-08 | rock-security #176 provisioning UI (`ui/`) wrapping ~70 reconcilers, 6 milestones (preview writes only, prod read-only) | claude opus planner, claude `sonnet` high executors ×9 (6 milestones + 3 fix waves), codex `gpt-5.6-luna` xhigh reviewers (one identity resumed per milestone) | 10 review rounds across 4 gated milestones, 9 produced a real finding; merged to main, 6 issues closed, 3 filed | **Five findings shared one shape: a guarantee holding on one path while a second stood open** — an invariant stated in a comment above a helper that violated it, a writer accepting `null` while its route demanded an Id, an order gate called only on the create branch, a type check that silently stopped working when its parameter was widened for a legitimate reason, and an engine reading `env` from the caller instead of the persisted job (that last one a path to an unconfirmed prod apply, reproduced at 16 subprocess calls). **Unit tests passed in all five, because they exercised the guarded path.** The second resume-branch defect surfaced only because the fix brief for the first asked *what else does this branch take from the caller* — fixing the reported instance without asking where the pattern lives is how F2 becomes F4. Separately, **three executors died identically**: each backgrounded a long reconciler and ended its turn, and a herdr pane's agent exits when the turn ends. The brief said "generous timeout" and never said "do not background"; that omission cost two restarts before I named it. |

| 2026-09-08 | rock-security #189 five open provisioning follow-ups (#187/#171/#170 prod Auth writes, #186/#188 UI, rsvp#288 supersession) — split mid-run into 3 independent plans | claude opus planner, codex `gpt-5.6-luna` xhigh plan-reviewer (one identity, 5 rounds), codex `gpt-5.6-luna` high executor ×1 (Plan B only) | 5 plan-review rounds, 38 findings, 38 accepted; 1 of 3 plans landed (2 PRs merged), 2 stopped at `PLAN DEFECT`, 2 repo defects filed, 0 prod writes | **Every plan defect in rounds 2–5 was one shape: the criterion was fixed and the instruction was not.** `done_criteria` is where attention goes because it is where correctness feels like it lives, but `named_actions:` is what runs and a routed executor never reconciles the two — the purest case was a required second `p14` dry-run written into a `dry_run:` *description field*, which documents an action rather than being one. Two corollaries. **Round 3's finding distribution is a split signal:** all 8 landed in the prod-apply/closeout half and none in the UI or registry half, so splitting one plan into three let the clean half merge while the irreversible half kept iterating — do this at the first round whose findings cluster. And **execution finds what reading cannot**: the one plan approved with *zero* findings after five rounds was the one whose executor hit an unsatisfiable criterion in ten minutes (`k8._reconcile_output` reconciles only `("status","rationale")` and the header has no `rationale` column, so a demanded `source` rewrite was impossible), stopped, and declined both green-making shortcuts available to it. Neither reviewer nor planner had opened that function. |

| 2026-09-08 | rock-pages Page 12 prod provisioning resumed from a written handoff (6 provisioners, prod block writes) — **not a routed run**: inline planner execution, one claude subagent for browser verification only | claude opus planner inline, 1 general-purpose subagent (browser verify) | 6 changes applied to prod, cache cleared, all provisioners re-run to `Changes: 0`, PR merged; 1 committed record had to be corrected post-hoc | **A verification subagent inherits the dispatcher's wrong assumptions and returns them as measured findings.** My brief asserted "profile card renders with NO border" and "at most 3 KPI cards" in the demographics widget; both came from my reading of a handoff, neither from source. The subagent measured faithfully and returned one FAIL and one PARTIAL. I checked both against source, concluded both were briefing errors, and wrote that into `history.jsonl` — but the border was a **real defect**, fixed in a sibling PR that merged six minutes after the verification ran. **State the brief's assertions as questions, not as expected values**, or the agent's precision just launders the dispatcher's guess. Separately: the handoff's "nothing written to prod yet" was already false on arrival, and only `HtmlContent.ModifiedDateTime` (not `Block.ModifiedDateTime`, 14h stale) exposed the concurrent writer. |

| 2026-09-08 | rock-pages #586 clear the six "pre-existing" pinned test failures, then land (merge to `main`; **no Rock environment touched at all**, prod or preview) | claude opus planner inline (no executor — the diff existed at dispatch), `opus` low plan-reviewer, `opus` low code-reviewer (one identity resumed r1–r3, **fresh+digest r4**) | 4 code-review rounds, 12 findings (8 BLOCKER), all 12 accepted, 1 `Fix:` rejected on evidence; plan-review 9 findings; merged, 1 issue closed, 2 filed | **All four guards this PR wrote to replace byte-freeze pins were weaker than the pins, and each round's fix was defeated by the next round's spelling** — token tests, then shape-without-position, then string-literal truncation and a provenance tie satisfied by a `--` comment *the flattener strips* (so the shipped SQL had the selector and not the thing permitting it), then table references that failed to resolve when schema-qualified, making the rule **vacuous rather than weak**. Every one left the full suite green with the defect in the deployed artifact. **So write the exit condition before the round that might trigger it**: my round-3 disposition pre-committed "if round 4 finds another parser-level evasion, the mechanism is wrong and I stop patching", which turned a fifth plausible patch into a scope decision for the user instead of a sixth regex. Two mechanical lessons: **a mutation sweep must re-run the generator** — without re-flattening, the stale-artifact test fires and masks whether the guard under test caught anything, which gave me a false all-red hiding three real misses; and **the shared `/tmp/office/panes.jsonl` is pruned by other runs' `Stop` hooks**, so "my pane is missing from the ledger" is not evidence it leaked. |

| 2026-09-08 | rock-security #197 provisioning UI Auth0 identity + real landing page + pinned local port 4180 (Vercel dropped by the user mid-interview; Auth0 client write, **zero Rock writes**) | claude opus planner, codex `gpt-5.6-luna` high executors ×3, codex `gpt-5.6-luna` xhigh reviewer (r1) then high (r2, r3) | 3 review rounds, 4 findings, **2 rejected on measurement**; 3 milestones landed, PR #198 merged, issue #197 closed, #199 filed | **My two errors were the same error, and the reviewer's Critical was the mechanism that would have shipped it.** I audited `authorizeRockOperator`, saw an `if (userLogins.length !== 1)` guard and declared it fail-closed without checking the query's `$top=1` made it unreachable; separately I resolved the operator's Auth0 subject from the session's *identified* email rather than the human's login, and explained away the missing login event as SSO reuse when the correct subject was sitting in the tenant log I had already read. Executing that action would have created a second UserLogin for a username already pointing at a different person — the exact row the dead guard could not reject. **A missing event for an identity that logs in daily falsifies the identity; it is not a thing to explain.** Two mechanical lessons: **establish a green baseline before trusting any mutation** — my first sweep reported three reds off a red baseline (I had symlinked `node_modules` into the throwaway worktree, which `AGENTS.md` forbids, and `pnpm exec` aborted trying to purge it); and a **negative control must be mutated too** — swapping the bogus subject for the real one is what proves the control is a control and not a path that 403s regardless. Rejecting 2 of 4 findings on measurement (a trailing-slash bypass Next normalises away, and an assertion-ordering claim the reviewer withdrew when asked to name a response that passes one order and fails the other) is the same judgment that accepted the Critical. |
| 2026-09-10 | rock-dashboards #398 Sunday Inputs Settings spec + #408/#431 bridge fixes (2 lanes, 1 prod block deploy) | claude opus planner (session compacted/restarted twice, model became sonnet post-restart), claude `sonnet` high executors ×2 (lane A spec, lane B fix), codex `gpt-5.6-luna` high reviewer (5 rounds, all fresh — codex returns no session id, so resume is impossible for this brand) | 5 review rounds on task B6 alone (1 CHANGES→APPROVED for lanes A/B in r3, then B6 r3-r5 CHANGES REQUIRED), both lanes merged, B6 deployed to prod and verified, 2 follow-ups filed, 4 tickets closed with resolution comments | **The review loop stopped converging two rounds before I noticed.** Rounds 4-5 kept finding real defects in B6's *plan prose* (an unexecutable eight-resource restore table, an unfalsifiable runtime check, a stale shell-syntax action) while the actual prod objects — read the moment I finally executed steps 0-2 instead of drafting another round — were clean on the first try: dry-run `Changes: 1`, every identity assertion true, `IsApproved` already true. The user's "are you just doing a plan-review?" was the correct call: at the 5-round cap I should have stopped rewriting the document and started running the read-only steps, which would have shown the same evidence with far less churn. Two mechanical findings: **the repo's own `assert_branch_freshness` guard refused a dirty-tree prod apply that five review rounds never flagged** — a codebase invariant caught what the review process didn't; and **`cmd | tail -N` masks a nonzero exit code**, so a piped `&&` sequence ran its second half after the first had failed — use `set -o pipefail` and no pipe on anything gating a prod write. Separately, a genuinely unresolvable gap (an authenticated runtime read-back with no named tool that could produce it) was correctly escalated as an `AskUserQuestion` rather than argued away, and the user's answer (`/ego-browser`, reusing an existing session) closed it in two tool calls once obtained. |
