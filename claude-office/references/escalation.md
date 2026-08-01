# Upline escalation — who decides, and how it travels

Work flows **down** (planner → executor → implementer). Decisions that outgrow the agent holding them
have to travel **up**, and a decision that gets silently made at the wrong level is the most expensive
failure mode this pattern has: nobody sees it, and it ships.

This is not a discussion channel. Two axes, one line in a file the agent is already writing.

**Default is decide-and-proceed.** Most questions are the agent's own. Escalation is a small,
deliberate minority; a ladder everyone climbs constantly is ceremony, and ceremony gets ignored.

## Axis 1 — Who decides: escalate to whoever owns the settling fact

Ask: **where does the fact that would settle this live?**

| The settling fact lives in… | Owner | Example shape |
|---|---|---|
| The code, the brief, or the surrounding conventions | **Decide yourself** | Which helper to reuse; how to name it; which existing pattern to match |
| Another task, or the cross-task picture | **Executor** | "Does task 2 already expose this?"; an interface that two tasks must share |
| The plan's intent — the plan is silent, ambiguous, or contradicted by reality | **Planner** | The plan assumes a structure that does not exist; two Global Constraints conflict |
| Outside the repo entirely | **User** | Business priority, cost, risk appetite, a user-visible behaviour tradeoff, scope, anything touching real people or money |

The test is the *fact*, not the difficulty. A hard problem whose answer is discoverable in the code is
still yours. An easy question whose answer is a business preference is not.

**Never resolve a user-owned question by inference.** "The user probably wants X" is the sound of a
decision being made at the wrong level. State it, don't guess it.

## Axis 2 — Block or annotate

> **Would proceeding on a stated assumption waste work or cause harm if the assumption is wrong?**

- **No → annotate and keep going.** Record the assumption, implement, move on. This is the common case
  and it costs one line.
- **Yes → block.** Stop and escalate before building on it. Blocking is right when a wrong guess means
  redoing the task, or when the work would be unsafe/misleading.
- **Irreversible always blocks**, regardless of everything above: production writes, data migrations,
  deletions, anything outward-facing, anything outside the run's blast-radius ceiling.

Two agents facing the same question can legitimately answer axis 2 differently — an implementer three
files in should block where the planner, still drafting, would annotate.

**For a `--cli` (background) executor, a blocking `[needs-planner]`/`[needs-user]` entry raised as
either a numbered menu or an open-ended free-text question is a cheap reply, not a fork-and-recover
cycle** — `claude-office/skills/cli-response/SKILL.md` answers both in place with verified keystrokes
(digit + Enter for a menu; select-then-type, as two separate sends, for free text), id set unchanged.
`--resume`/`--bg` against the live session still forks (discernment.md's fork gotcha) and stays banned
as a steering path. One prefix stays genuinely dangerous regardless of which kind of question it is:
a free-text answer that starts with `/` gets intercepted as a real CLI slash command instead of reaching
the model, on every tested free-text surface — never let a batched `[needs-user]` answer be typed back
verbatim if it could start with `/`. Block only when the general rule above still says so — getting it
wrong is genuinely costly or unsafe to redo — not by default just because the executor is running as a
background process.

## How it travels

Use the artifacts that already exist. **File-based, not conversational** — a note that lives only in a
prompt dies at the next compaction and never crosses the `--cli` process boundary.

Every report, ledger, and handoff carries an `## Upline` section. Entries are one line each:

```
- [decided] <what was ambiguous> → <what I chose> — <why, ≤10 words>
- [needs-executor] <question> — blocking | non-blocking
- [needs-planner] <question> — <the plan text it collides with> — blocking | non-blocking
- [needs-user] <question> — <the tradeoff, and your recommendation> — blocking | non-blocking
```

`[decided]` entries are the point of the mechanism. They are how an agent stays fast — decide, log,
continue — without the decision disappearing.

**Each level triages and passes up what it does not own:**

- **Implementer** → writes `## Upline` in its task report. Blocking entries mean it returns `BLOCKED`
  or `DONE_WITH_CONCERNS` rather than inventing an answer.
- **Executor** → answers everything `[needs-executor]`, in-line, in the ledger. Promotes
  `[needs-planner]` / `[needs-user]` into its own `## Upline` in `handoff.md`. It must **not** absorb a
  user-owned question because it happens to have an opinion.
- **Planner** → answers `[needs-planner]`. Surfaces every `[needs-user]` entry to the user with a
  recommendation attached, batched, not one interruption per item. Carries the whole
  `[decided]` list into the reviewer's packet.
- **Reviewer** → receives the `[decided]` list as *scrutiny targets*. Decisions made under uncertainty
  are where defects concentrate; that list tells it where to look hardest.

**Nothing is dropped silently at any level.** Passing an entry up, answering it, or ruling it
irrelevant are all fine. Deleting it is not.

## The reviewer's upline path: indicting the plan

The reviewer gates the diff, but sometimes the diff is faithful and the **plan** is what's wrong. That
is not `CHANGES REQUIRED` — telling the executor to fix a correct implementation of a bad plan burns
rounds and cannot converge. It gets its own verdict:

```
VERDICT: PLAN DEFECT

The implementation matches the plan. The plan is wrong.
Plan text: <quote the governing lines>
Defect: <why following it produces a bad outcome>
Owner: planner | user
Recommendation: <the plan change you would make>
```

The planner routes it by owner — a technical plan gap is the planner's to amend and re-dispatch; a
tradeoff, scope, or business call goes to the user. Either way this **exits the fix loop instead of
consuming a round**, and it may not be answered by pressuring the reviewer to downgrade it.

Symmetrically: a finding the planner believes contradicts the plan is a `[needs-user]` item, per the
existing rule that the planner does not fix against the plan and does not dismiss the finding either.

## Blast-radius ceiling

Every run declares its ceiling **once**, in the plan's Global Constraints, and it is restated verbatim
in every downstream brief. It names what the run may touch and what it may not: environments,
credentials, remotes, external services, protected paths, irreversible operations.

- **State exclusions explicitly.** An unstated exclusion is one a helpful agent will "finish" for you.
  If a task exists in the plan but is not the executor's to run, tag it `PLANNER-HELD` (see
  [routing.md](routing.md)) and say in the brief that it is explicitly not their work.
- **Prefer mechanism over prose.** A scoped `--allowedTools` allowlist or a deny hook enforces the
  ceiling even when an agent forgets it; prose only works while attention holds. Use both.
- **Ceilings only ever narrow going down.** An implementer's ceiling is a subset of the executor's,
  which is a subset of what the user authorized. No agent may widen its own.
- **Reaching the ceiling is a blocking upline event**, never a judgement call. The agent stops and
  reports; it does not decide that crossing is fine this once.

### What the ceiling bounds

A ceiling bounds **harm**, not work. "Irreversible always blocks" does **not** mean "all writes block" —
that reading just makes the planner the bottleneck for the whole run.

Score a capability on three things, then use the table:

- **Reversible?** Can it be undone at all.
- **Exposure window.** Who is affected between the write and the revert. A prod auth row is reversible
  and still grants live access for as long as it stands.
- **Ordering coupling.** Does correctness depend on a *following* step (cache clear, container refresh,
  dependent reconciler). If yes, the step alone is half an operation.

| Capability | Verdict |
|---|---|
| Read-only anything, any environment | **Always delegate.** Withholding it forces the agent to guess IDs and shapes. Hand over the credential path and client helper. |
| Preview/staging writes, scratch branches, idempotent re-runnable jobs | **Delegate, writes included.** Say so affirmatively — unnoticed permission goes unused. Require a read-back as evidence, not an exit code. |
| Prod writes with a live exposure window | **Hold** (`PLANNER-HELD`). |
| Ordering-coupled sequences | **Hold, or delegate the whole sequence.** Never split one across agents. |

Say *which* axis you held on, so the agent can tell a real boundary from ceremony.

### Fixing a live defect beats protecting the exposure window

Net the window against the **status quo, not zero**. The counterfactual to shipping a fix is the bug
continuing, not a safe null state. Fixes also move toward a state that already worked, so the rollback
target is known-good. New capabilities have neither property. So: **defect repair is time-sensitive by
default; additions are not.** A fix path too slow to use gets done by hand, off the record — that
relocates risk, it does not remove it.

**"Bugfix" is a claim, not a license.** Fast-lane only when both hold:

1. **Named rollback target** — you can state the exact prior state and restore it.
2. **Verifiable right after applying** — you can observe the intended effect, not just a success code.

Most defect fixes pass both. One that passes neither does not qualify, however urgent it feels. Gating
does not catch bad fixes; verification shape does (read-back, control run, behavioural probe) — two
"verified" fixes on record were green, reviewed, and did nothing.

**Never fast-lane, whatever it is called:**

- **Anything that widens access.** A wrong fix leaves you where you were; a wrong widening grants reach
  with no symptom. Split a mixed change: the scoping half may be urgent, the new grant is an addition.
- **Ordering-coupled sequences.** Speed is exactly when leg two gets skipped and success gets reported
  over a system where nothing changed.

## Anti-patterns

| Thought | Reality |
|---|---|
| "I'll ask about everything to be safe" | Ceremony. Decide what's yours; escalate what isn't. |
| "The user probably wants X" | User-owned questions are stated, not inferred. |
| "I'll note it in my final summary" | Summaries get compacted. Write it in the file. |
| "It's small, no need to log the assumption" | `[decided]` is one line and it's the reviewer's map of where to look. |
| "The plan says so, so it must be right" | Plans are hypotheses. Reality contradicting one is a finding. |
| "I have an opinion, so I'll just decide" | Having an opinion is not owning the decision. Check whose fact settles it. |
| "Just this once past the ceiling" | Ceilings are not judgement calls. Stop and report. |
