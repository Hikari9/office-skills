# Red Flags — stop and correct

Each row is a thought this office has actually produced mid-run, beside what was true instead.
Read the rows for the phase you are in; the whole table is not a startup cost.

| Thought | Reality |
|---|---|
| "This is routable, I'll auto-invoke" | Only an explicit `/auto-office` invokes this. |
| "HERDR_ENV=1, I'll use Agent/Task for the child" | Load the Herdr skill: direct children go right, further children go below, and the created pane closes after its settled result is read. |
| "It's only a few files, I'll do it" | You are the priciest writer in the office. Volume is a purchase. Justify the inline row in a clause, or delegate it. |
| "Task 1 is recon, I'll dispatch it myself, then start the executor" | Recon inside an approved plan is **task 1 of the executor's run**. Planner scouts are Phase 1 and read-only; if it writes anything — even a reverted probe — it is the executor's. |
| "The brief isn't writable until task 1 answers X" | The plan names both branches; that is what a branch point *is*. The executor picks by evidence. If the plan doesn't name them, fix the plan. |
| "The memory cap means I must split the tasks myself" | The executor re-briefs *itself* from `EXECUTOR-STATE.md`. Reclaiming tasks is the cap disciplining the wrong role. |
| "The preview apply is a live write, so it's mine" | **Preview/staging writes are delegated**, with the read-back. Only production and irreversible actions are planner-held. |
| "Codex is at 14%, so it's out" | No threshold exists — weigh it and spend it if it's worth it. Headroom is always probed during fit-test, but it is a cost, not a gate. |
| "This task is hard, I'll use Opus" | The executor is pinned; a bigger *worker* is legal only if the plan declared it. |
| "I fixed it inline, so it's mine to approve" | Planner-implements did not lift planner-never-approves. Fresh reviewer, every time. |
| "Agy is on task 5 and doing fine" | It forgets past 3. Re-brief or re-route. |
| "The plan's done, I'll ask before executing" | You have approval. The run is end-to-end. |
| "It's a prod apply, so the loop stops" | Only if the plan didn't name it. A named action with preconditions met runs — and *you* perform it. |
| "'Deploy when done' — that's named" | It names nothing. Exact command, target, dry run, revert, read-back. Vague = unauthorized = stop. |
| "I'll merge everything at the end" | Bootstrap one draft PR, then commit and record each milestone in local run state so the run remains resumable. |
| "This needs MCP, so I'll keep it" | Delegate it *with* the tools enumerated, production reads included. Withholding access is a dispatch bug. |
| "CLI was blocked last time" | A past denial is not evidence about now; the dispatch form is an assignment. Attempt it. |
| "My worker said it'll report back" | That is a *return*. An in-session subagent unwinds once it has no live children. Blocking waits go `--bg`, or you hold them. |
| "Executor says done" / "agy can review agy" | Nobody gates their own work; the **code** gate is a fresh Opus reviewer. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "Express needs a third round" | A second `CHANGES REQUIRED` forces a planner disposition. Promote to full only when the planner records why another round is worth funding. |
| "The loop can add one more repo" | That widens the blast radius. Not the loop's call. |

## Pre-dispatch checklist

Derived from one Opus-5 planner's full mistake catalogue over a live run (2026-08-03→04). Walk it
before every dispatch; each line cost something real once.

- [ ] `timeout: 600000` on the dispatch. Always — the Bash tool's 120s default applies to background
      tasks too, and a dispatch killed at 180s produces no verdict and no error record.
- [ ] `< /dev/null` on `codex exec`. No `| tail`.
- [ ] Grep the brief for stale paths, SHAs, line numbers, and allowed-failure lists — especially
      inside blast-radius ceilings.
- [ ] Does each reproduction step *preserve* the condition it reproduces? State the **invariant that
      must hold at test time**, not the command.
- [ ] Does the brief say who owns `HEAD`, and is the answer "the planner"?
- [ ] Can the assigned tool actually execute this within its command envelope?
- [ ] Every criterion marked green: has its own `verify:` block been run and pasted, or did you read
      an approval and record it as evidence?
- [ ] Every claim an amendment makes about a file: verified against the file?
- [ ] Changed a mechanism? Grep the repo for prose describing the old one.
- [ ] `HERDR_ENV=1`? Use `herdr` for the dispatch, verify the right/below pane topology, and close
      only panes this run created after their results settle.
- [ ] Self-reviewed, **then** sent to the fresh gate — the second is not optional because the first
      found things.

## The four recurring planner defects

1. **A plausible cause beats a measured one.** Three "environment blockers" in one run were the
   planner's own or worktree artifacts. The measurement that settled the biggest cost two minutes.
   Measure before you redesign a protocol around a constraint.

2. **A proof that passes for the wrong reason.** Not a wrong answer — a right answer to the wrong
   question. It appeared five times in one run, once inside the planner's own verification of a fix
   for a previous instance of it. **Finding a vacuous proof does not inoculate you against writing
   one.** Only re-running the experiment ever caught it; reading the claim never did.

3. **Reproduction steps are load-bearing and get under-weighted.** Paragraphs on blast radius, then
   a one-line reproduction that destroyed the condition under test.

4. **Plans drift from briefs.** The plan is where you think; the brief is what runs. Reconcile
   immediately before dispatch — eight of one plan-review's findings were this alone.

**Self-review finds what you know you hand-waved. It does not find what you cannot see.** Measured on
that run: self-review found 4, the fresh plan-reviewer found 14, overlap 1. That ratio is why
self-review is mandatory for every role *and* why it never substitutes for the gate.
