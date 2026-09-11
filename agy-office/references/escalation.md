# Upline escalation — who decides, and how it travels

Work flows **down** (planner → agy). Decisions that outgrow the agent holding them have to travel
**up**, and a decision that gets silently made at the wrong level is the most expensive failure mode
this pattern has: nobody sees it, and it ships.

This is not a discussion channel. Two axes, one line in a file the agent is already writing.

**Default is decide-and-proceed.** Most questions are agy's own — the brief explicitly tells it not to
stop and ask. Escalation is a small, deliberate minority; a ladder everyone climbs constantly is
ceremony, and ceremony gets ignored.

**Why this matters more with agy than with a Claude subagent:** `agy --print` runs headless and
unsandboxed. It cannot interrupt you mid-run for a quick answer, its process exits when it's done, and
its completion summary is not reliable. The written upline list is the *only* channel between "it made a
judgement call" and "you find out" — and with this executor, judgement calls include inventing an
interface it could have read.

## Axis 1 — Who decides: escalate to whoever owns the settling fact

Ask: **where does the fact that would settle this live?**

| The settling fact lives in… | Owner | Example shape |
|---|---|---|
| The code, the brief, or the surrounding conventions | **agy decides itself** | Which helper to reuse; how to name it; which existing pattern to match |
| The plan's intent — the plan is silent, ambiguous, or contradicted by reality | **Planner** | The plan assumes a structure that does not exist; two Global Constraints conflict |
| Outside the repo entirely | **User** | Business priority, cost, risk appetite, a user-visible behaviour tradeoff, scope, anything touching real people or money |

The test is the *fact*, not the difficulty. A hard problem whose answer is discoverable in the code is
still agy's. An easy question whose answer is a business preference is not.

**A signature is never an escalation and never a judgement call.** It lives in the code, so it is
readable — the brief's real-signature clause exists because this executor has guessed one anyway. "The
interface was unclear" is not a legitimate `[decided]` entry; reading the definition is the work.

**Never resolve a user-owned question by inference.** "The user probably wants X" is the sound of a
decision being made at the wrong level. State it, don't guess it. This binds the planner too.

## Axis 2 — Block or annotate

> **Would proceeding on a stated assumption waste work or cause harm if the assumption is wrong?**

- **No → annotate and keep going.** Record the assumption, implement, move on. This is the common case
  and it costs one line. For a headless run it is almost always right: stopping ends the run.
- **Yes → block.** Stop and report before building on it. Blocking is right when a wrong guess means
  redoing the work, or when the result would be unsafe or misleading.
- **Irreversible always blocks**, regardless of everything above: production writes, data migrations,
  deletions, anything outward-facing, anything outside the run's blast-radius ceiling.

## How it travels

Use the artifacts that already exist. **File-based, not conversational** — a note that lives only in
agy's final message dies with the process, and its narration is streamed to a transcript you would have
to go dig for.

The handoff report carries an `## Upline` section. Entries are one line each:

```
- [decided] <what was ambiguous> → <what I chose> — <why, ≤10 words>
- [needs-planner] <question> — <the plan text it collides with> — blocking | non-blocking
- [needs-user] <question> — <the tradeoff, and your recommendation> — blocking | non-blocking
```

`[decided]` entries are the point of the mechanism. They are how agy stays fast — decide, log, continue
— without the decision disappearing.

**Each level triages and passes up what it does not own:**

- **agy** → writes `## Upline` in `handoff.md`. Blocking entries mean it reports the block rather than
  inventing an answer. It must not absorb a user-owned question because it has an opinion.
- **Planner** → answers every `[needs-planner]` entry. Surfaces every `[needs-user]` entry to the user
  with a recommendation attached, **batched**, not one interruption per item. Carries the whole
  `[decided]` list into the reviewer's packet.
- **Reviewer** → receives the `[decided]` list as *scrutiny targets*. Decisions made under uncertainty
  are where defects concentrate; that list tells it where to look hardest.

**Nothing is dropped silently at any level.** Passing an entry up, answering it, or ruling it irrelevant
are all fine. Deleting it is not.

**Read the upline list against the verification pass, not on its own.** An empty `## Upline` from a run
whose diff shows three judgement calls does not mean nothing was decided — it means the section is
unreliable, and that is itself worth telling the reviewer.

## The reviewer's upline path: indicting the plan

The reviewer gates the diff, but sometimes the diff is faithful and the **plan** is what's wrong. That
is not `CHANGES REQUIRED` — telling agy to fix a correct implementation of a bad plan burns rounds and
cannot converge. It gets its own verdict:

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

Symmetrically: a finding the planner believes contradicts the plan is a `[needs-user]` item — the
planner does not fix against the plan and does not dismiss the finding either.

## Blast-radius ceiling

Every run declares its ceiling **once**, in the plan's Global Constraints, and it is restated verbatim
in the agy prompt and the reviewer brief. It names what the run may touch and what it may not:
environments, credentials, remotes, external services, protected paths, irreversible operations.

- **State exclusions explicitly.** An unstated exclusion is one a helpful agent will "finish" for you —
  and this one has front-run *unasked* work, so assume it will.
- **Prose is nearly the only enforcement you have.** `--dangerously-skip-permissions` removes approval
  stops; there is no allowlist and no deny hook catching a scope violation after the fact. Write the
  ceiling as if nothing else will stop the run, because almost nothing will. Where a real mechanism
  exists, use it too: a dedicated worktree instead of the main checkout, credentials simply absent from
  the environment, `--sandbox` when the task needs no terminal access, `--mode plan` for a dry pass.
- **Ceilings only ever narrow going down.** agy's ceiling is a subset of what the user authorized. No
  agent may widen its own.
- **Reaching the ceiling is a blocking upline event**, never a judgement call. Stop and report; do not
  decide that crossing is fine this once.

## Anti-patterns

| Thought | Reality |
|---|---|
| "I'll ask about everything to be safe" | Ceremony. Decide what's yours; escalate what isn't. |
| "The interface wasn't clear, so I chose one" | Signatures are readable. That's not a decision, it's skipped work. |
| "The user probably wants X" | User-owned questions are stated, not inferred. |
| "agy mentioned it in its final message" | Final messages are unreliable and the process exits. Write it in `handoff.md`. |
| "It's small, no need to log the assumption" | `[decided]` is one line and it's the reviewer's map of where to look. |
| "Upline says none, so nothing was decided" | Check it against the diff. An empty section can mean the section is unreliable. |
| "The plan says so, so it must be right" | Plans are hypotheses. Reality contradicting one is a finding. |
| "Skipping permissions means the ceiling is advisory" | It means the opposite: the prompt is the only guardrail there is. |
| "Just this once past the ceiling" | Ceilings are not judgement calls. Stop and report. |
