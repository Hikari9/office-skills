# Office Skills: Hub-and-Spoke Plugin Optimization Plan

**Status:** Planning only — no skill, configuration, installation, or runtime change is authorized by this document.  
**Scope:** `codex-office`, `claude-office`, `agy-office`, and their shared local source contracts.  
**Out of scope:** Generic skill discovery, MCP configuration, model routing outside an office run, and changes to production repositories.  
**Date:** 2026-08-01  
**Owner:** operator

> **Implementation notes (2026-08-01, applied after approval).** This document has been updated
> in place so it matches what shipped. Three changes were made to the approved text:
>
> 1. **Spoke renames, at the operator's request.** The `*-runtime` spokes became `codex-cli`,
>    `claude-cli`, and `agy-cli`, and the `cli-response` spoke became
>    `claude-cli-send-message`. The names below reflect the new ones.
> 2. **A `*-planning` spoke was added** to `claude-office` and `agy-office`. The plan-authoring
>    prose is planner-only and was the largest single block in each hub, so the hubs could not
>    meet the §3 budget while carrying it.
> 3. **Core snapshots are committed, not built at package time** (§2.4). What is in git is what
>    ships, so a standalone install needs no build step, and `scripts/check-plugins.sh` hashes
>    each snapshot to catch a stale or hand-edited copy.
>
> `office-core` also gained `protocol/closeout.md` in core `1.1.0`, after the migration audit
> found the closeout procedure duplicated verbatim across two plugins. Everything else was
> delivered as written.

## Executive summary

Turn the three standalone office skills into three **independently versioned hub-and-spoke plugins**, developed in one repository. Each `*-office` directory remains at the repository root and becomes an installable plugin root with a compact hub. The hub selects only the role, runtime, and task-specific spokes needed for the present office run.

The plugins will share an `office-core` source contract for the rules that genuinely must agree: role separation, plan approval, blast-radius ceilings, brief/handoff schemas, evidence requirements, review states, and rollback language. They will **not** share runtime mechanics or collapse agent-specific safety controls:

| Plugin | Keeps ownership of |
|---|---|
| `codex-office` | `codex exec` dispatch, model/effort flags, executor/reviewer packets, and Codex closeout |
| `claude-office` | `--cli` versus `--in-session`, live-question handling, session/fork protection, and Claude review flow |
| `agy-office` | workspace/flag ordering, quota and stall handling, pinned-signature evidence, and mandatory independent verification |

Independent plugins and a shared core do not conflict. During development, the three plugins reference one root-level, versioned `office-core` contract. During packaging, every plugin vendors the exact compatible core snapshot into its artifact. A standalone `codex-office` install therefore never depends on `claude-office`, `agy-office`, or an uninstalled sibling directory.

The outcome is a smaller context and prompt surface for planners, executors, and reviewers; clearer ownership of runtime-specific rules; and a release process that lets one office improve without accidentally changing the other two.

---

## 1. Verified starting point

### Repository layout

- The repository currently contains three standalone skill roots: `codex-office/`, `claude-office/`, and `agy-office/`.
- There is no plugin or marketplace descriptor in this repository today.
- The office corpus is **224,965 bytes** across the three entrypoints and their existing references. `codex-office` is roughly 7 KB; the Claude and Agy workflows contain the majority of the corpus and have overlapping office-process prose.
- `codex-office` currently has a small entrypoint plus task prompt, reviewer brief, review gate, and closeout references. Claude and Agy each contain much larger routing, executor, reviewer, escalation, and closeout material. Claude additionally has `claude-cli-send-message`.

### Recent session evidence — directional, not a usage total

Recent evidence is more authoritative than older transcripts because the office skills have changed over time. Treat prior versions as historical context only.

- The current Codex installation points `~/.codex/skills/codex-office` to this repository. The Claude installation points its `claude-office` and `agy-office` skill paths here as well.
- Recent Codex and Claude session startup catalogs each advertise all three office skills. One recent Claude background session advertised 75 skills; one recent Codex request recorded 64,185 input tokens after receiving a broad skills catalog.
- Agy history contains one confirmed recent `/agy-office` invocation.
- Raw text matches such as `/codex-office` or `/claude-office` are **not valid invocation counts**: session logs repeat the full skill catalog and may quote commands in planning/review text. Phase 0 must add direct event attribution before the team makes utilization or savings claims.

### Non-negotiable protections to preserve

- Explicit invocation only; an office is never self-triggered.
- The planner does not implement the approved work, and an executor never approves its own work.
- One writer per working tree; parallel writers require isolated worktrees and disjoint scope.
- A successful process exit or narrated completion is not evidence; required validation output is.
- External mutations, deployments, migrations, pushes, PRs, credentials, and messages remain planner-held unless explicitly authorized.
- Claude retains a fresh adversarial reviewer and must avoid live-session resume patterns that create duplicate writers.
- Agy retains its explicit workspace/model/flag safeguards, pinned real signatures, structural completion checks, independent verification, and non-Agy reviewer.

---

## 2. Target architecture

### 2.1 Monorepo development layout

```text
office-skills/
├── office-core/                       # shared source contract; not a fourth office plugin
│   ├── VERSION
│   ├── protocol/
│   │   ├── roles-and-authority.md
│   │   ├── plan-contract.md
│   │   ├── evidence-and-handoff.md
│   │   ├── review-states.md
│   │   ├── closeout.md
│   │   └── compatibility.md
│   └── schemas/                       # machine-readable brief, handoff, and metric schemas
├── codex-office/                      # independent plugin root and Codex hub
│   ├── .claude-plugin/plugin.json     # or the runtime-equivalent plugin descriptor
│   ├── SKILL.md                        # compact hub
│   ├── skills/
│   │   ├── codex-cli/
│   │   ├── codex-executor/
│   │   ├── codex-reviewer/
│   │   └── codex-closeout/
│   └── references/
├── claude-office/                     # independent plugin root and Claude hub
│   ├── .claude-plugin/plugin.json
│   ├── SKILL.md
│   ├── skills/
│   │   ├── claude-planning/
│   │   ├── claude-cli/
│   │   ├── claude-executor/
│   │   ├── claude-reviewer/
│   │   ├── claude-closeout/
│   │   └── claude-cli-send-message/
│   └── references/
├── agy-office/                        # independent plugin root and Agy hub
│   ├── .claude-plugin/plugin.json
│   ├── SKILL.md
│   ├── skills/
│   │   ├── agy-planning/
│   │   ├── agy-cli/
│   │   ├── agy-executor/
│   │   ├── agy-verification/
│   │   ├── agy-reviewer/
│   │   └── agy-closeout/
│   └── references/
└── .claude-plugin/marketplace.json    # local marketplace entries for all three plugins
```

The descriptor names above show the Claude-compatible shape proven by `rock-favor`. Phase 0 will also record any Codex/Agy-specific descriptor or installer requirements; the source layout must not assume one client’s plugin metadata is sufficient for all three clients.

### 2.2 Hub contract

Each root `SKILL.md` becomes an orientation and dispatch surface, not a long procedural manual. It must contain only:

1. explicit-invocation gate and caller overrides;
2. the office’s roles and unchangeable authority boundaries;
3. the minimum non-bypassable safety rules;
4. a role/task-pack routing table with exact spoke names and load triggers;
5. the compatible `office-core` protocol version; and
6. plugin maintenance and release instructions.

The hub never asks a worker to read the complete office corpus. It gives the worker an **Office Kernel** plus the exact selected spokes.

### 2.3 Spoke contract

Spokes are loaded on demand, by role and runtime need:

| Spoke class | Loaded by | Contents |
|---|---|---|
| Core protocol | planner and relevant gates | shared role authority, plan/evidence/review schemas |
| Runtime | planner before a dispatch | client command behavior, lifecycle, known sharp edges, recovery rules |
| Executor | executor only | task packet, scope/side-effect limits, handoff requirements |
| Verification | independent verifier only | proof checks and failure modes; Agy’s remains mandatory |
| Reviewer | fresh reviewer only | review rubric, evidence packet, fix-round protocol |
| Closeout | planner only | final gate, authorization boundary, outcome report |

Task/domain skills remain external dependencies. The office hub passes a capability manifest — name, purpose, path, and load trigger — and selects only the needed task skills/references. It does not copy their catalogs or bodies into every packet.

### 2.4 Versioning and independent release

- `codex-office`, `claude-office`, and `agy-office` each receive their own plugin ID, semantic version, changelog, release test, and marketplace entry.
- `office-core` has a protocol version independent of plugin versions. Each plugin declares its supported core range in a checked compatibility file.
- A non-breaking core clarification can be released by each compatible plugin at its own pace. A breaking core change creates a new protocol version and requires each plugin’s adapter and tests before its next release.
- Packaging vendors the pinned core snapshot and records its hash/version in the plugin artifact. Development may use the shared root source; release artifacts may not rely on it being present.
- No plugin may silently widen another plugin’s runtime authority. Shared protocol changes need compatibility checks across all three before release.

---

## 3. Goals, boundaries, and scorecard

### Goals

- Reduce repeated office-process prose and full skill-catalog injection into worker/reviewer contexts.
- Make exact role-specific context selection visible and testable.
- Preserve all independent review and evidence gates while reducing setup and recovery work.
- Deliver plugins that can be installed, versioned, tested, and rolled back independently.
- Measure direct office invocations, role packets, latency, forks/stalls, and quality using recent, attributable events.

### Non-goals

- No Hermes Agent optimization or changes to global tool/MCP discovery.
- No automatic pruning of unrelated skills or domain task packs.
- No production mutation, deployment, migration, credential, or communication automation.
- No attempt to make the three client runtimes behave identically.
- No reduction of Agy Phase 2b verification, Claude adversarial review, or Codex independent review.

### Provisional scorecard

Phase 0 establishes the baselines and final thresholds. Begin with these warning-level budgets:

| Metric | Measure | Initial target / guardrail |
|---|---|---:|
| Hub payload | hub plus mandatory core only | ≤ 4K tokens per office |
| Role packet | kernel + adapter + selected spokes | ≤ 20K tokens unless a documented exception applies |
| Unselected office material | bytes/tokens present in a worker packet | 0 |
| Direct office invocation attribution | runs with an event ID and plugin/version | 100% of new runs |
| Duplicate writers | same worktree, overlapping active sessions | 0 |
| Required proof | final gates with actual output/artifacts | 100% |
| Review/verification coverage | required role completed for every run | 100% |
| Context/latency | p50/p95 by plugin, version, role, and packet size | improve only after a quality-neutral baseline |
| Escaped defects | reviewer or post-merge findings | no regression |

These are not claims about current token savings. They become enforceable only after recent-version baselines show that a threshold is realistic.

---

## 4. Implementation phases

## Phase 0 — Recent-version baseline and packaging discovery (P0)

**Objective:** Measure the current versions before restructuring prose or changing installation.

1. Inventory all three office folders: files, bytes, estimated tokens, duplicate passages, cross-links, and each rule’s owner (core, runtime, role, or task/domain dependency).
2. Record a rolling **14-day** event window, weighting the newest seven days four times higher than days 8–14. Keep older logs only as qualitative history, labelled with the office/plugin version when known.
3. Add a proposed event model to the plan/implementation design: plugin ID/version, compatible core version, invocation ID, role, dispatch mode, selected spokes, task-pack manifest, packet byte/token size, launch/session IDs, worktree ID, outcome, evidence state, and duration. Store prompt counts and redacted labels — not user prompts, secrets, or credentials.
4. Separate a real invocation from a catalog mention by recording the event at explicit command dispatch, not by transcript keyword search.
5. Establish current packaging/install paths for Codex, Claude, and Agy. Identify which descriptor each client consumes, whether paths may be symlinked in development, and how a plugin artifact is installed alone.
6. Create read-only canaries for each office: small local edit, multi-file feature, review-only task, live-question/recovery case for Claude, and quota/stall plus interface-evidence case for Agy.
7. Define a rollback record for every canary: prior plugin version, core protocol version, installation path, and removal/reinstall command.

**Exit criteria:** A recent-version report can distinguish invocation from listing, attribute each run to a plugin/version, and show exactly what each role received before its first action.

## Phase 1 — Define the shared protocol without sharing runtime behavior (P0)

**Objective:** Extract only stable office invariants into `office-core`.

1. Create a rule-ownership matrix for every existing instruction. Mark it `core`, `codex adapter`, `claude adapter`, `agy adapter`, `role spoke`, `domain skill`, or `retire as historical anecdote`.
2. Write versioned core contracts for role authority, approval/boundary language, Office Kernel fields, handoff/evidence schema, reviewer states (`APPROVED`, `CHANGES REQUIRED`, `PLAN DEFECT` where applicable), and compatibility policy.
3. Preserve source citations back to the existing office rules during migration; no safety rule may disappear merely because two agents phrase it similarly.
4. Define an exception field in the core schema for necessary office-specific additions. The exception must name its owner and reason; it may not overwrite core authority rules.
5. Add a compatibility matrix and release contract that requires all three adapters to validate whenever `office-core` changes.

**Exit criteria:** Every shared rule has one canonical source, and every client-specific rule has one explicit adapter owner.

## Phase 2 — Establish three plugin roots and compact hubs (P0)

**Objective:** Make all three offices independently packageable while retaining root-level `*-office` folders.

1. Add one marketplace entry and one plugin descriptor per office, each with its own ID, version, keywords, description, author, and release notes.
2. Keep `codex-office/`, `claude-office/`, and `agy-office/` as root-level plugin roots. Do not move them beneath a generic `plugins/` directory.
3. Convert each root `SKILL.md` to the compact hub contract in §2.2. Preserve explicit invocation and non-bypassable safety guidance in the hub itself.
4. Move role/runtime material into named spokes. Keep durable reference material behind the spokes and replace generic “read everything” instructions with a routing table.
5. Build plugin artifacts from a pinned core snapshot. Add a packaging check that fails if the snapshot or compatibility declaration is missing/stale.
6. Test a standalone install of each artifact. A plugin must work without sibling source folders; a failure is a packaging defect, not a reason to weaken independent versioning.

**Exit criteria:** Each office can be discovered, installed, and rolled back independently; its hub can identify the exact spokes needed for a representative run.

## Phase 3 — Role-specific packets and context budgets (P0)

**Objective:** Cut repeated setup while retaining enough evidence for correct execution and adversarial review.

1. Introduce the immutable **Office Kernel**: approved plan path/version, repository/worktree/branch, base commit, numbered work items, protected paths, blast-radius ceiling, permitted side effects, validation commands, required evidence, and handoff path.
2. Planner packets contain discovery/plan context and selected runtime guidance. Summarize completed exploration rather than carrying unbounded transcript history forward.
3. Executor packets contain the Kernel, the agent-specific executor/runtime spokes, selected task packs, exact interface citations where required, and no unrelated office references.
4. Reviewer packets contain the Kernel constraints, diff/commit range, handoff, actual gate output, selected review rubric, and necessary selected references — never the executor’s unrelated context.
5. Add a generated capability manifest to packets rather than copying the available-skills catalog. Its fields are skill name, purpose, source path, load trigger, and selected/not-selected status.
6. Add warnings for packet budgets, accidental complete-corpus inclusion, missing required spokes, and missing core compatibility declaration. Tune thresholds from Phase 0 before making any budget a hard stop.

**Exit criteria:** The canaries prove that every worker and reviewer receives only its role packet, while all required approval, scope, and evidence details remain present.

## Phase 4 — Preserve and sharpen client-specific reliability controls (P0)

### Codex Office

1. Keep the one-fresh-executor and separate-fresh-reviewer model, explicit model/effort, protected dirty paths, one writer per tree, and evidence-backed full gate.
2. Turn the current task prompt and reviewer brief into role spokes. The hub should only route to them after an approved plan exists.
3. Record `codex exec` launch ID, worktree, base commit, selected spokes, and reviewer round so duplicate work or missing review is observable.

### Claude Office

1. Keep `--cli`/`--in-session` routing as a Claude runtime concern, not a core rule.
2. Preserve in-place question resolution through `claude-cli-send-message`. Add a planned guard against `--resume ... --bg` targeting a live session, using returned session identity and worktree identity rather than a display label.
3. Record launch ID, active writer/worktree, question/recovery reason, fork event, and reviewer round. Stop a newer overlapping writer before it can edit.
4. Retain one executor per repository by default, a fresh adversarial reviewer, evidence reuse where valid, and the capped fix/re-review process.

### Agy Office

1. Keep explicit `--model`, absolute workspace, `--add-dir`, print-timeout, and `--print` ordering instructions in the Agy runtime spoke.
2. Keep its reliability ceiling, quota/stall detection, and planner routing. A task that needs Claude-level reasoning remains routable to Claude Office rather than being forced through Agy.
3. Keep the executor’s signature citation table and no-front-running clause. Do not treat exit code 0, narration, or a handoff alone as completion.
4. Preserve mandatory independent verification as a dedicated spoke, with structural evidence: diff/log, ledger, changed-file list, real-signature citations, test-control checks, gate output, and scope/mutation read-back.
5. Continue to use a non-Agy reviewer for final adversarial approval.

**Exit criteria:** No client-specific protection was accidentally generalized away, and every known failure mode is tested through a versioned runtime or verification spoke.

## Phase 5 — Release discipline, regression controls, and rollout (P1)

1. Add per-plugin lint/contract tests: descriptor validity, hub routing, required safety rules, link integrity, core compatibility, core snapshot freshness, and absence of complete catalog injection in role templates.
2. Add cross-plugin protocol tests: every adapter can consume the shared Kernel and handoff schema at its declared core version.
3. Publish three separate changelogs and release notes. A shared-core change lists affected plugin versions explicitly.
4. Start with warning-only packet budgets and weekly recent-version reports. Promote a repeatable violation to a hard gate only when its quality impact is understood.
5. Pilot each plugin on non-production canaries, then production-facing work with the existing authorization/review rules. Roll back only the affected plugin artifact/core compatibility pair if quality, safety, or latency regresses.
6. Review older historical anecdotes quarterly. Keep them only when they still describe a verified current runtime behavior; otherwise archive them with a version/date label instead of letting obsolete cautions dominate routing.

**Rollback triggers:** missing mandatory safety rule; duplicate writer in one worktree; unverified external mutation; standalone installation failure; >10% quality regression on recent canaries; or p95 latency worsening by >15% after normalizing for packet size and task class.

---

## 5. Sequencing and dependencies

```text
Phase 0: recent-version evidence + install discovery
    │
    ├── Phase 1: shared protocol and compatibility contract
    │       │
    │       └── Phase 2: three package roots + compact hubs
    │               │
    │               ├── Phase 3: role packets and context budgets
    │               │       │
    │               │       └── Phase 5: release controls and rollout
    │               │
    │               └── Phase 4: client-specific reliability spokes
    │                       │
    │                       └── Phase 5: release controls and rollout
```

Do not begin prose extraction before Phase 1 rule ownership is complete. Do not release any plugin before its standalone artifact, core compatibility, and office-specific canaries pass.

---

## 6. Definition of done

This program is complete when:

- `codex-office`, `claude-office`, and `agy-office` are three independently versioned, independently installable, independently rollbackable plugins while remaining root-level folders in this repository.
- Every plugin has a compact hub, named spokes, a pinned compatible `office-core` snapshot, and a validated standalone install path.
- Shared office invariants have one source of truth; client runtime behavior remains in its own adapter/spokes.
- Workers and reviewers receive a measured, role-specific packet rather than the whole office corpus or an unrelated skill catalog.
- New telemetry attributes direct invocations to the exact plugin/core version and weights recent versions above legacy transcript data.
- Codex review, Claude fork safety and adversarial review, and Agy independent verification/signature evidence remain intact and demonstrably exercised by canaries.
- Every outcome is reversible without changing the other two plugins or any production repository.
