---
name: cli-response
description: Use when a claude --bg/background agent is blocked on a raised AskUserQuestion-style menu, a free-text/custom answer, or a permission prompt and needs an answer without forking it. Not a general steering channel and does not make --resume ... --bg safe.
---

# Answering a blocked `--bg` agent without forking it

Verified on 2.1.220 (2026-08-01): a plain-pipe `printf '<digit>\r' | claude attach <id>` answers a
blocked menu correctly, in place, with the session id unchanged. No PTY required. Free-text/custom
answers are also verified (see Step 2b) — separate recipe, separate gotchas. This is a narrow tool for
a narrow situation — read the scope gate before using it.

## Scope gate

**Applies:** the agent is already `state=blocked` on a numbered menu (`AskUserQuestion`-style choice,
a canned `Other`/`Custom`/`Type something` option that opens free text, or a `Yes`/`Yes, allow all
edits`/`No` permission prompt) with options you can read and match to a digit.

**Does not apply:**
- Steering a `busy`/`working` agent — there is no verified way to inject a mid-run instruction; that's
  still `--resume ... --bg`, which **forks unconditionally** (discernment.md's fork gotcha stays true).
- Making `--resume <id> --bg` safe. It still forks. This skill answers the *existing* blocked session
  via `attach`, never via `--resume --bg`.

## Step 1 — confirm it's actually waiting, and read the menu correctly

```bash
claude agents --json | jq --arg id "<id>" '.[] | select(.id==$id) | {id,state,status,waitingFor}'
# expect: state=blocked, status=waiting
```

Read the question and option order before sending anything — answering the wrong option is worse than
not answering. `claude logs <id>` is raw ANSI/TTY capture, not a transcript; strip it and grep the
tail:

```bash
claude logs <id> | sed -E 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\][^\x07]*\x07//g' | tail -c 4000
```

Confirm: the option text, the option **number**, and that the numbering in the rendered menu matches
what you expect (a plan/brief's assumed order is not proof — read the live render).

## Step 2 — send the digit, verbatim

```bash
printf '<digit>\r' | claude attach <id>
```

- `<digit>` is the option's number as rendered (`1`, `2`, `3`, …), immediately followed by `\r`
  (carriage return — **not** `\n`; a bare linefeed over a non-PTY pipe delivers nothing).
- No PTY, `expect`, or `script` wrapper needed — a plain pipe is sufficient and was the tested path.
- Runs as a single blocking command; it exits on its own once stdin hits EOF; no separate detach
  keystroke is needed for this send-and-exit shape. (`Ctrl+Z` is the documented interactive detach —
  `claude attach --help` — for a live TTY session; irrelevant to this scripted one-shot form.)
- **Prefer digits over arrow-key counting.** `\x1b[B`/`\x1b[A` (down/up) reliably **fail** — verified
  twice, once over a plain pipe and once over a real PTY (`expect`, with a deliberate delay between
  bytes) — landing on the default option regardless of how many downs were sent. Digit selection does
  not depend on knowing where the cursor currently sits; arrows do, and the cursor-tracking assumption
  is exactly what breaks.
- Expect a **chained** prompt: answering the menu often surfaces a follow-on permission prompt (e.g.
  "Do you want to create X? 1. Yes / 2. Yes, allow all edits / 3. No"). Repeat Step 1–2 for it — read
  it, then send its digit the same way. Don't assume one send resolves the whole block. Confirmed the
  digit method also answers permission prompts specifically (not just `AskUserQuestion` menus) —
  identical `1\r`/`3\r` sends resolved "Do you want to create `answer.txt`?" cleanly across every run
  in the free-text verification below.
- **Never send free text directly at a raw numbered menu, digit-prefixed or not.** `printf
  'PURPLE\r' | claude attach <id>` against the still-showing menu does **not** reach any field and does
  **not** error — it silently submits the **default (currently-highlighted) option**, discarding the
  text. Verified twice (once with a bogus digit like `5` on a 3-option menu, once with plain text): both
  landed on option 1 with no trace of the sent text. This is a silent-wrong-selection failure, not a
  no-op — always select a free-text-capable option first (Step 2b) before typing an answer.

## Step 2b — answering with free text / a custom value

Verified on 2.1.220 (2026-08-01), 4 clean runs (fresh scratch agents, `--model haiku`, `claude --bg
--remote-control`, on-disk side effect distinguishing exact content received). **Two-step only — never
combine the digit and the text in one `printf`/one `attach` call.** A single `printf
'4PURPLE\r' | claude attach <id>` sent as one shot reliably lands on the **default** option (the digit
and text both get swallowed) — same failure as sending raw text at the menu. Always split into two
separate `attach` invocations with a state check between them.

**1. Pick the target option, in this preference order:**

- **A canned `Other`/`Custom` option, if the menu offers one** (e.g. `4. Other`, `4. Enter a different
  colour`). **Preferred target** — selecting it is immediate: `printf '<digit>' | claude attach <id>`
  with **no trailing `\r`** submits the selection on its own (no Enter needed) and opens a dedicated
  inline text field with its own prompt line (`You selected "Other" — what custom X would you like?`).
  This field is isolated from the CLI's normal REPL parsing (see the prefix-safety note below).
- **`Type something` (present on every `AskUserQuestion` menu as a fallback) works too, but is a real
  two-step, not immediate:** `printf '<digit>' | claude attach <id>` (no `\r`) only **highlights** the
  option — check the log for the cursor marker (`❯N. Type something.`) before proceeding. It needs a
  **separate** `printf '\r' | claude attach <id>` to actually select it. Selecting it (or `Chat about
  this`) drops into a "User declined to answer questions" / open chat state, which funnels your next
  message through the CLI's normal prompt input — same input surface as the live REPL, so it inherits
  REPL parsing (see prefix safety below). `Other`/`Custom` is the safer target when both are present.

**2. Confirm the free-text field is actually open** (re-run the Step 1 state check / log grep for the
custom-value prompt line) before sending your answer — don't fire blind off an assumed timing.

**3. Send the text as its own `attach` call, `\r`-terminated:**

```bash
printf '%s\r' "<your answer, verbatim>" | claude attach <id>
```

Delivered content matched what was sent **exactly**, byte-for-byte, including a long multi-clause
sentence with commas, an em dash, and an exclamation point, across every clean run. The model itself
may still paraphrase or trim what it *writes downstream* (e.g. dropping a trailing "Thanks!" before
saving to a file) — that is model behavior on the delivered text, not a delivery failure; the terminal
transcript showed the full sent string landed in the input box intact before the model acted on it.

**Multi-byte/unicode content and the trailing `\r` can arrive out of sync.** One run's text (containing
an em dash, `—`) landed in the box but did **not** submit on the same `printf`'s trailing `\r` — the
agent sat `blocked`/idle with the typed text visibly still in the box. A **second, separate** `printf
'\r' | claude attach <id>` was required to actually submit it. Treat "text visible, state still
blocked, no new prompt" as "not yet submitted" and resend a bare `\r`, rather than assuming the first
send's `\r` landed.

**Prefix safety — what you can safely type first:**

| Leading character(s) | Verdict | Evidence |
|---|---|---|
| A digit (e.g. `2 clicks not 1`) | **Safe** — delivered as literal text once the free-text field is open; digits only act as menu selectors on the *menu* screen, not inside an open text field | Sent verbatim, model treated it as literal (if oddly-phrased) input, not a selection |
| `!` | **Safe** in a `Other`/`Custom` field — delivered as literal text (`!PURPLE` written verbatim) | One clean run |
| `/` | **Unsafe — always.** Intercepted as a real CLI slash command in every free-text surface tested, `Other`/`Custom` included, not just `Type something`/`Chat about this` | Two separate runs both produced `Unknown command: /PURPLE` / `Args from unknown skill: not a command` in the transcript — the text never reached the model as an answer, and the run stalled needing recovery |

Never lead a free-text answer with `/`. If the real answer must start with a slash-shaped token (a
path, a version tag), prefix it yourself with something neutral (e.g. a leading space or word) and let
the recipient strip it, or confirm on a throwaway agent first — don't assume it's safe by analogy to
the digit/`!` findings above.

## Step 3 — verify delivery and correct selection, not just "it ran"

A `printf | claude attach` that exits 0 is not proof of anything. Check both:

1. **The agent progressed** — re-run the Step 1 check: `state` moved off `blocked` (to `working`, then
   eventually `done`), or `waitingFor` changed to a new prompt. No state change means nothing was
   delivered — see Failure modes.
2. **It selected the option you intended** — via the concrete effect the option should have (a file
   written, a specific branch taken, a value in a report). `claude logs <id>` can also show the
   resolved answer line (`... → <OPTION>` in the stripped output), but a live side effect is stronger
   evidence than a log line.

**Also confirm no fork:** diff `claude agents --json` id sets before and after. The *same* id
persisting (not a new one appearing) is required, not optional — a method that leaves the id set
unchanged but delivers nothing is a false pass just as much as one that forks.

## Failure modes and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `claude attach` opens the alt-screen TUI in your own capture, but the agent's `state`/`waitingFor` never changes | Sending before the menu finished rendering, or sending to the wrong id | Re-check Step 1, re-read the current menu with the log strip-and-grep, resend |
| Agent progresses but the side effect shows the **wrong** option (usually the default) | Arrow keys were used instead of a digit, or the digit sent didn't match the rendered numbering | Don't resend blindly — re-read the *current* state (it may now be one level deeper, e.g. a file-overwrite prompt), and if the wrong branch already executed, treat it as a real mistaken action, not a no-op to silently retry |
| A brand-new id appears in `claude agents --json` after your command | You used `--resume ... --bg` (or `attach` somehow forked) — out of scope for this skill's method | Keep the fork (see below); don't try to force the original back into service |
| Nothing happens and `state` stays `blocked` indefinitely | Wrong id, agent already died, or the pipe never reached the process | Re-verify the id from `claude agents --json`, retry once; if still stuck, escalate to the fork-and-recover path |
| Free-text answer landed but the file/effect shows the **default** option instead | Digit and text (or raw text and `\r`) were sent as one combined `printf`, or text was sent straight at the still-showing menu without selecting a free-text option first | Never combine digit+text in one send (Step 2b); always select the free-text option first, confirm the field opened, then send text as its own call |
| Transcript shows `Unknown command: /...` and the run stalls | Free-text answer started with `/` — the CLI's own slash-command parser intercepted it instead of treating it as an answer | Don't retry blind; re-read state, the run likely needs a fresh answer (without the leading `/`) or manual recovery |
| Free text visible in the input box, but `state` stays `blocked`/idle with no new prompt | The trailing `\r` in the same `printf` as the (often multi-byte) text didn't submit | Send a bare `printf '\r' \| claude attach <id>` to submit the already-typed text — don't resend the text itself, which would duplicate it |

## Fork fallback

If keystroke delivery fails outright, or the situation is genuinely mid-run steering (not a blocked
menu), don't force this skill's method — fall back to the existing recovery: `--resume <id> --bg` will
fork (it always does), so **keep the fork** — it carries the original transcript plus your message.
`claude stop` the original, re-point any monitor/handoff reference at the new session id, and confirm
via `claude agents --json` that exactly one writer remains against the shared working tree before
letting anything continue.
