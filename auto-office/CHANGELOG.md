# Changelog — auto-office

## 2.4.5 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- `auto-loop`'s section is now a **narrowing that links core** rather than a duplicate: the boundary
  is a task reaching `APPROVED` (this office loops, so it has more boundaries), and the field rides
  the existing status line. The brief-sizing evidence stays here, where it was measured.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 2.4.4 — 2026-08-05

- **The four remaining underspecified clauses are now decidable**, per operator ruling:
  - **Liveness window is 25 minutes** (`auto-loop`). It previously said "within a **stated** window"
    while nothing stated one, so the agent had to invent the number the rule implied it would supply.
  - **`report-exists OR state=done` is the turn-ending condition** (`auto-loop`). "Do not end the turn
    on a live CLI dispatch" plus "blocking blind costs the same" forbade both available actions. It
    means: always end the turn *on the wait condition* mid-execution. Ending on a bare dispatch with no
    condition attached is waiting for nothing, and that is the only forbidden form.
  - **Stop condition 4 pauses via `AskUserQuestion`**, recommendation as the first option (`auto-loop`,
    hub). "Recommend, do not infer. Then continue." read as non-blocking under a header saying the loop
    returns to the user; the pause is the question, and the run resumes on the answer.
  - **Headroom stays case-by-case planner discernment, explicitly and permanently** (`auto-routing`,
    hub), with the question to answer out loud: *is it worth running this in a low-threshold agent if
    quality will be massively lost otherwise?* Naming it as discernment stops agents hunting for the
    threshold the old wording implied existed.
- **Prose pruned to instructions across all four auto-office files** — 208 lines out, 171 in, every
  rule kept. War stories that ran 8-20 lines are now the rule plus a one-line evidence tag: the
  branch-moved-under-you incident, the 829k-token task, the 1h38m unwatched dispatch, the partial
  329k-token brief, the property-vs-instance criterion defect, and the self-review overlap measurement.
  This follows the repo's own maintenance rule - sharpen a principle, don't append a scenario.
- The hub is **under its 9000-byte budget for the first time** (9068 at the start of this work).
  `check-plugins.sh` now reports zero warnings across all four plugins.

## 2.4.3 — 2026-08-05

- **"Stricter rule wins" no longer imports a sibling office's role rules.** Every dispatch loads a
  sibling spoke, and `agy-office` / `claude-office` / `codex-office` all state "the planner never
  implements" as a local narrowing. Read literally, the unscoped clause therefore deleted
  auto-office's own central lifted rule — while the hub, `auto-loop`, and `auto-planning`'s task
  table all assume the planner *may* implement inline. The clause is now scoped to two rules binding
  the **same** gate, mechanism, or action, with both known misfires named (the plan-review floor and
  planner-implements). `delegation-map.md` and the hub say it the same way.
- `auto-routing` — the delegation test now carries its operative discriminator instead of leaving it
  in prose two sections away: a CLI dispatch always technically buys isolation, so "if writing the
  brief takes more thought than making the change, the delegation buys nothing." The near-tie ladder
  gains a terminal rung (**still tied → codex**); a ladder that can run out invites the deliberation
  the section exists to refuse. The agy ceiling is stated as a hard `3`, not `~3`.
- `auto-planning` — the 95% interview floor now carries core's definition of 95% (the stranger
  standard) rather than the bare number, matching how the sibling planning spokes state it.

## 2.4.2 — 2026-08-05

- **Fixes the reason auto-office plans came out thin.** Everything that makes a plan comprehensive —
  Context, Global Constraints, Numbered tasks with files/behavior/verification, the dependency graph,
  Out of scope, and the whole *Claims discipline* section — lives in
  `office-core/protocol/plan-contract.md`, and `auto-planning` cited it as a **bare backtick path** at
  step 6. That path resolves from the plugin root, **not** from inside a spoke, so from the planner's
  position it pointed at nothing; the hub made only `roles-and-authority.md` a mandatory read and
  listed the contract solely in its "Doubt about core" fallback table. A planner therefore wrote the
  two things `auto-planning` states inline — the GOAL block and the task assignment table — and
  skipped the required sections entirely. Nothing was broken; the requirements were simply
  unreachable, and had been since the initial release.
- `auto-planning` now opens with a `Narrows [plan-contract.md](…)` link, as `agy-planning` already
  did, and step 6 spells out all five required sections with a note that the GOAL block and task
  table are **additions to** them, never substitutes.
- `claude-planning` carried the same bare path (harmless there — it already listed the five sections
  inline). Fixed; see claude-office `1.3.1`.
- `scripts/check-plugins.sh` gains **planning spoke carries the plan contract**: a planning spoke must
  have a *resolvable relative link* to `plan-contract.md` and must name all five required sections.
  Neither existing check could see this — the link check only inspects `[](…)` links, so a bare
  backtick path passed it clean. `codex-office` has no planning spoke and plans from its hub, where a
  plugin-root path does resolve; that case is accepted explicitly rather than special-cased silently.
- **Known warning, unchanged:** the hub is still 9068 bytes against a 9000 budget. This change adds
  nothing to it — the fix belongs in the spoke, which is where the planner actually reads.

## 2.4.1 — 2026-08-04

- **The maintenance step was unrunnable as written, and a planner reported it as missing.** `SKILL.md`
  said "run `scripts/check-plugins.sh`" without naming a root. The script lives at the **office-skills
  workspace root**; the plugin's own `scripts/` holds only the three quota probes. A planner looked in
  the plugin, searched `~/.claude`, found nothing, and reported the script as non-existent — twice
  wrong, since it exists and the installed plugins are symlinks into the workspace. Maintenance now
  names the root explicitly and ties the `version` bump to the CHANGELOG heading.
- `scripts/check-plugins.sh` gains two checks, both targeting failures observed today:
  - **version drift** — the newest `## X.Y.Z` CHANGELOG heading must equal `.claude-plugin/plugin.json`'s
    `version`. The maintenance step said "bump version, add a CHANGELOG entry" and nothing verified
    the two agreed.
  - **referenced scripts resolve** — any `scripts/<name>.sh|.py` mentioned in a plugin's markdown must
    exist at the workspace root or in the plugin. This is the check that would have prevented the
    false "missing script" report outright.
- Fixes a contradiction in the hub: the safety rules called `PLANNER-HELD` "the one thing the loop
  stops for" while *The autonomous run* lists **four** stop conditions. The four-condition list is
  authoritative; the stale clause is removed.
- **Known warning, left deliberately:** the auto-office hub is 9068 bytes against a 9000 budget. It was
  already at 8984 before this change — 16 bytes of headroom — so any new rule overruns it. Shaving the
  new Red Flag row to fit would gut it; cutting further office content to fit is a judgement call for
  the owner. Either raise the budget or cut content deliberately.

## 2.4.0 — 2026-08-04

- `auto-loop` — **the per-task compaction recommendation.** The status line gains a final
  `compact: yes | no — <reason>` field. The planner cannot compact itself; only the user can invoke
  it, so this is a recommendation on a line the user already reads, never an action and never a
  blocking question. `yes` requires a clean `APPROVED` boundary, evidence already **on disk**, and a
  next brief that is a file rather than a memory; `no` covers mid-review, mid-conflict-resolution,
  and any empirical result not yet written down.
- The field's real value is that **a `no` is a defect report** — it means something exists only in a
  context window, which a compaction, a crash, or a window boundary deletes. The correct response to
  a `no` is to write the state to a file, not to wait. It is a durability audit at every task
  boundary for the cost of one clause.
- Records that **a live executor is not a reason to withhold a `yes`** (a background executor has its
  own window and is unaffected), and that run-state files go **outside the repo while an executor is
  live in that tree** — committing beside a running executor orphaned two commits in one run.
- Adds **brief sizing** as the same problem one level down: a subagent cannot ask to be compacted, so
  an oversized brief returns *partial* rather than failing loudly, which misreads as an executor
  shortfall. Observed: a ten-call-site brief spanning three unrelated surfaces returned four at 329k
  tokens / 142 tool calls, with a correct handoff. Size briefs to one surface; split on surface
  boundaries, not file count. A scoped resume of a partial handoff is not a review round.

## 2.3.1 — 2026-08-04

- **"A past denial is not evidence about now."** A planner assigned `cli` dispatch in its own
  approved plan, then substituted an in-session subagent at dispatch time, citing a 2026-08-03
  ledger row where the classifier had denied `--dangerously-skip-permissions`. Rico's correction:
  don't pre-decide against CLI, especially when the caller asked for it. A probe minutes later
  launched a background agent with the scoped `--allowedTools` form, piped the prompt on stdin, and
  got the expected output file on the first attempt — CLI was never blocked.
- Two failures compounded: a **stale environment observation treated as a standing fact**, and the
  **dispatcher overriding its own plan's assignment** instead of surfacing a `PLAN DEFECT`.
- Changes: `SKILL.md` gains two Red Flag rows (stale-denial reasoning, and substituting a plan's
  dispatch form). `references/routing-outcomes.md`'s misleading ledger lesson is corrected in place —
  it read as licence to skip CLI. `claude-office/skills/claude-cli` now states the **scoped
  allowlist as the default** permission form with a verified launch command, documents that the
  prompt **must** be piped on stdin (a positional prompt yields a registered-but-`idle` agent), and
  adds a hard rule that the two-refusals fallback requires two refusals **in the current run**.
- Does not change: the executor tier, the review gates, or `PLANNER-HELD`.

## 2.3.0 — 2026-08-02

- `auto-closeout` — **"Closeout lands the work; it does not park it."** A run fixed the connect-week
  prev/next bug, passed both gates, opened a green mergeable PR against `preview` — and stopped
  there, reporting "ready for your review." Rico's correction: that is an incomplete run. Unique to
  auto-office, whose whole point is autonomous shipping, closeout must merge to the target branch
  and continue along the repo's promotion chain to its final branch regardless of outcome, unless
  the caller said otherwise. Adds: read the chain from the repo's own history rather than assuming
  one; verify each hop landed before opening the next; treat a timed-out `gh merge` as ambiguous and
  re-read state rather than retrying blind; itemize swept-up commits in the promotion PR but treat
  them as the normal release train, not scope creep, while stopping on genuine divergence; and name
  every verification that did not happen so an unrun check never reads as a passed one. Explicitly
  does not lift the review gate, the evidence floor, or `PLANNER-HELD`.

## 2.2.1 — 2026-08-02

- `auto-loop` — **"The branch you are on is not a fact you may assume."** A planner committed and
  pushed to `main` after a dispatched CLI agent switched the shared checkout on its way to building
  its own worktree; the target branch was a production deploy and Vercel shipped it in under a
  minute. Adds a drift-check item (`git rev-parse --abbrev-ref HEAD` before every commit and push),
  forbids dispatching a CLI agent into the tree the planner is working in, and requires pushing a
  **named branch** rather than `HEAD`, since `HEAD` inherits whatever branch you happen to be on.
  The content that shipped was reviewed and wanted — the control was luck, not process.

## 2.2.0 — 2026-08-02

From the rsvp.favor.church run (issue #49, PR #50, 3 tasks, 2 brands, 5 review rounds). The run
found **two live production bugs unrelated to the feature**, both surfaced by the review gate rather
than by any done-criterion — which is the through-line: the gates earned their cost, the plan did not
anticipate what they found.

- `codex-cli` — **never pipe a dispatch through `tail`/`head`; `tee` to a stable, gitignored,
  user-tailable path and state that path in the status line.** `agy-cli` already carried this rule;
  `codex-cli` said nothing, so the first dispatch of the run was invisible for ~19m and the user had
  to ask for a log path mid-run. The rule is per dispatch mechanism, not per brand, so it is now
  stated in both spokes.
- `auto-planning` — a done-criterion that pins an *instruction* ("filter before the slice") instead
  of the *guarantee* ("never render worse than BASE") can be satisfied by code that breaks the
  guarantee. Observed twice in one run: §3.5's literal rule was implemented faithfully and still
  produced a false "already checked in" error. **Pin the property; let the implementation choose the
  mechanism.**
- `auto-planning` — before pinning a REST route in an interface, **probe it**. A route that is
  mocked in the repo's test harness *and* dead in production passes every test while doing nothing
  forever. One read-only `curl` at plan time would have caught it; instead it took the reviewer.
- `auto-loop` — when a task's diff is correct but collides with untouched code, the verdict is
  `PLAN DEFECT`, not `CHANGES REQUIRED`. Confirmed working as intended: T2's code needed no change,
  the plan needed a new rule, and the amendment was cheaper than a fix wave.
- `auto-loop` — the mandatory agy verification pass **found a real defect this run** (counts derived
  from a filtered list) at check 6, "guards as wide as the spec". Check 6 is not a formality; it is
  the check most likely to catch a narrow implementation of a correct interface.
- Planner inline fixes went to the same reviewer as executor work, every time, including on the last
  task. No self-approval occurred.

## 2.1.0 — 2026-08-02

Additive rule sharpening from the second real run (connect-portal, issues #180/#181/#183, 9 tasks,
3 PRs merged). No breaking semantics; v2 plans and run reports still read correctly.

Through-line of the run: **every `CHANGES REQUIRED` verdict across three tasks was a test defect,
never an implementation defect** — and three of the planner's own done-criteria plus one fix
instruction were themselves wrong, all caught downstream by reviewers or an executor.

- `auto-planning` — four new done-criteria rules. State the **property, not the vivid instance**
  (a criterion naming one case is satisfiable by code broken in every other case; this shipped a
  data-loss bug while reading green). Criteria whose cases all move state **0 → N** never test the
  update path. Never make the **agent's own identity** a discriminator in a verify command — `gh`
  and `git` act under the user's credentials, so an author filter is unsatisfiable by construction.
- `auto-loop` — failing at `BASE` is declared **necessary but not sufficient**; briefs must demand
  **mutation testing**, with a two-sided assertion wherever the change is a guard. A new test file
  "fails at BASE" merely by importing a module that does not exist yet.
- `auto-loop` — CLI executors have **no return channel unless the brief builds one**. Every CLI
  brief names a handoff file; the wait condition is `report-exists OR state=done`, never state
  alone. Proven by an outage that killed an executor mid-round whose report survived on disk.
- `claude-office/references/discernment.md` — corrected the auto-mode-classifier remedy: the fix is
  an **`autoMode.allow`** entry, **not** a `permissions.allow` rule (the two are independent gates;
  `Bash(claude*)` was already allowed and the launch was still refused). Also recorded that the
  agent cannot apply it itself, and that `claude logs` is unusable for polling (47 KB of ANSI for a
  few lines).
- `claude-office/skills/claude-cli-send-message` — the delayed-`\r` gotcha is **not unicode-only**;
  a ~700-character pure-ASCII send behaved identically. Length alone is the trigger.
- `references/routing-outcomes.md` — 4 rows appended; the reading note now covers nine rows and
  names the repeatable shape: the planner's artifacts fail more often than the executor's, and
  reviewer capacity is better spent attacking the criteria than re-reading the diff.

## 2.0.0 — 2026-08-01

**Breaking:** the `T0`/`T1`/`T2` dispatch-tier ladder is **removed**, roles are added, and the prose
name **Orchestrator** becomes **Executor** (the schema role id was always `executor` and is
unchanged). A v1 plan or run report will not read correctly against v2 semantics, which is why this
is a major bump rather than a quiet one.

Source: a retrospective on the first real auto-office run, whose through-line was that **cost and
correctness both concentrate in the plan and the brief, not in the executor's model.**

### Roles

- **Executors and workers are mandated sonnet-tier, high effort** — `sonnet` high / `codex-terra`
  high / `agy` high. No self-escalation, no exceptions without a caller override. On the run that
  produced this rule, both green-but-useless tests the reviewer caught were written by the *bigger*
  model.
- **New role: plan-reviewer.** One adversarial pass over the plan document, before user approval,
  held by a fresh agent of the planner's own brand at Opus-tier **low** — then it **retires
  permanently**. It never distributes work and never returns, so it cannot gate work it approved.
- **New role: PM**, spawned by CLI **only at ≥2 executors**, at executor tier. It hands out the
  briefs the plan already wrote and collects results. It holds no planner-held action and no gate.
  A PM facing a routing decision means the plan was incomplete — a `PLAN DEFECT`, not a reason to
  upgrade the PM.
- **"The planner never implements" is lifted.** The planner may fix and implement inline when a
  delegation buys nothing — and **still never approves its own work**. New precondition: a planner
  inline write never overlaps a live executor in that tree.
- **Planning is exactly two passes:** planner self-review, then one adversarial plan-review. Never a
  loop. Measured on the plan behind this release, self-review found 10 findings and the fresh gate
  found 12, overlapping on only 4 — which is why both exist and neither substitutes for the other.

### Routing

- **Two decisions, not three:** which brand owns each unit of work, and how it is dispatched — and
  the second is **derived**, not chosen. Planner fans out → CLI; executor fans out → in-session;
  work a delegation buys nothing for → inline; a cross-brand worker → CLI, the only exception.
  **No tax arithmetic.**
- `references/dispatch-cost.md` **deleted.** Its surviving lessons live in `auto-routing`: brief
  quality is the real cost of a dispatch, batch adjacent cheap edits, **never batch across the
  review gate**, and a supervised sub-delegation is still one writer.
- **Model and effort are fixed per role**, in one table, including **two review floors**: `opus`
  medium for the **code**-review gate and `opus` low for the **plan**-review gate. Stated explicitly
  because "stricter rule wins" would otherwise promote plan review and double its cost.
- **Near-ties are not deliberated.** Same tier, both fit: tiebreak on live headroom, then the
  operator's codex preference, then spread — then commit, in at most one line. agy is disqualified
  from the tiebreak if its 3-consecutive-task cap is spent or the task is a long chain.
- The benchmark snapshot now selects **brand only** — never model or effort.

### Loop and cost

- **2 consecutive `CHANGES REQUIRED` on one task ⇒ presume `PLAN DEFECT`** and take core's existing
  route. This replaces a dead cap ("reroute to the Decider tier"), which was a no-op once the
  executor was already at the tier it was going to be at. Direct fix for the task that burned 829k
  tokens over three rounds: funding stops at round 2, not round 5. Bound: a **second** amendment to
  the same task stops the loop for the user.
- **`BRIEF DEFECT`** (core 1.2.0) enters the loop beside `PLAN DEFECT`, and every brief now carries
  the reproduce-at-`BASE` clause and the test-must-be-red-at-`BASE` clause.
- **Liveness check after every CLI dispatch**, and **no re-dispatch until the silent process is
  confirmed dead** — a silent-but-live process plus a replacement is two writers. One run lost 1h38m
  of wall clock and zero tokens to this.
- **Cost retrospective at closeout**, with per-window headroom and reset times. Single-number
  headroom deltas are banned: last run's `82% → 52% → 85%` described nothing that happened.
- **New `references/routing-outcomes.md`** — the workspace-local outcomes ledger, appended every
  closeout and read at routing **before** the benchmark file. Committed rows carry **opaque repo
  slugs**; the slug → real-repo mapping lives in a gitignored `routing-outcomes.local.md`.
- **Artifact location stated explicitly:** everything belonging to a run lives in that run's target
  repo; the outcomes ledger is the sole cross-run exception.
- **Self-heal gate:** editing these skills is permitted **only when the planner is claude/Opus**.
  codex and agy planners propose in the run report and stop.

### Compatibility

- Pinned to office-core **1.2.0** (planner-implements resolved, plan-review gate and coordinator role
  permitted, floors bind their own gate, `BRIEF DEFECT`, standing brief clauses, the 2-round
  presumption, cost retrospective, per-window headroom, schema cost fields).
- Four new exceptions: `auto-plan-review-gate`, `auto-pm-fanout`, `auto-mandated-executor-tier`,
  `auto-opus-only-self-heal`. Nothing dropped; all four pre-existing flags re-audited against core
  1.2.0 and all remain `widens_core_authority: false`.

## 1.0.0 — 2026-08-01

First release. A fourth, router office over `office-core` `1.1.0` and the three tool offices.

Vocabulary: **Planner → Orchestrator → Worker | inline**. "Orchestrator" is this office's prose name
for core's `executor` role — same authority and gates, and schema fields still emit `executor`, so
core compatibility and the sibling spoke names (`codex-executor`, …) are untouched. "Worker" is the
per-task sub-delegate, which holds no authority of its own.

Model + effort defaults are the operator's standing preferences, not benchmark-derived: `codex-terra` high /
`sonnet` high / `agy` high as orchestrators and workers, `opus` **medium** as reviewer,
`codex-sol` high as reviewer only when Codex is the planner. **`xhigh`/`ultra`/`max` and
bigger-model substitutions are user-invoked only, never self-escalated** — the benchmark table
decides which *tool* holds a capability role, never which *effort tier* it is called at.

- `SKILL.md` hub: invocation gate, the routing summary, non-bypassable safety rules, the
  autonomous-run shape, routing table, delegation policy, telemetry, Red Flags.
- `skills/auto-planning`: Phase 1 — quota probe first, interview floor, agy scout recon, route,
  plan, and the GOAL block whose done-criteria the loop is measured against. One approval
  authorizes the whole run.
- `skills/auto-routing`: the discernment engine. Separates orchestrator choice (one per repo) from
  per-task tool choice; routes by capability role (Decider / Backend builder / Fast scout) so the
  rubric survives model upgrades; **headroom weighed as a cost, with no hardcoded threshold** —
  best-fit first, then a stated case-by-case call on whether the tool is worth its remaining quota
  (run size, reset time, queued work, what a worse route would lose), with UNKNOWN treated as
  unavailable rather than low; agy capped at 3 consecutive tasks; the agy miss-list appended to the
  reviewer rubric whenever agy touched a task; Opus reviewer floor with the
  Codex-Sol-when-Codex-plans exception.
- `skills/auto-loop`: goal-locked bounded loop, the per-iteration drift check, hard caps, and the
  four stop conditions (PLANNER-HELD, destructive/production write, external send, user-owned
  decision). Nothing else stops the run.
- `skills/auto-closeout`: re-runs every GOAL verify command before committing, then the sibling
  office's closeout, then an auditable run report including routing decisions and cost shape.
- `references/model-benchmarks.md`: Artificial Analysis snapshot captured 2026-08-01 (Intelligence
  Index, Coding Index, Coding Agent Index v1.1, output tok/s) with a 30-day staleness horizon and a
  refresh procedure that re-seats capability roles when a tool overtakes another.
- `references/quota-probe.md` + three probes sharing one contract (`--percent` / `--json` / bare,
  exit 0 read / exit 2 UNKNOWN), all stdlib-only and consuming no model tokens:
  - `scripts/codex-usage.py` — `~/.codex/auth.json` → ChatGPT `wham/usage`,
    `rate_limit.primary_window`. Verified 2026-08-01: 99% left.
  - `scripts/claude-usage.py` — macOS Keychain `Claude Code-credentials` (`~/.claude/.credentials.json`
    as fallback) → `api.anthropic.com/api/oauth/usage`; `--percent` returns the **tightest** of the
    5-hour and 7-day windows. Verified 2026-08-01: 84% left.
  - `scripts/agy-usage.py` — **honest negative, always exit 2.** agy refreshes quota in memory from
    `loadCodeAssist` and never persists it, and `agy --help` has no usage subcommand, so there is no
    programmatic source. Reports login state and scans recent CLI logs for exhaustion markers. Route
    agy on fit plus the documented behavioral signal (a stall after a few narration lines is quota
    death) and keep a Claude fallback Worker.
  UNKNOWN is treated as *unavailable*, which is deliberately distinct from *low*.
- `references/delegation-map.md`: which sibling spoke each phase loads per routed tool; stricter
  rule wins; agy's Phase 2b verification is structural.
- `COMPATIBILITY.md` declaring four exceptions, none widening core authority.
