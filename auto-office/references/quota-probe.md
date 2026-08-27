# Usage headroom — how to measure it

auto-office ALWAYS probes CLI headroom during the fit-test, before interviewing or planning.
Routing must never guess whether a tool has quota left. Measure all three, then reason about the
numbers ([auto-routing](../skills/auto-routing/SKILL.md) — headroom is a cost, not a gate).

```bash
python3 auto-office/scripts/codex-usage.py  --percent
python3 auto-office/scripts/claude-usage.py --percent
python3 auto-office/scripts/agy-usage.py    --percent
```

All three share the same contract: `--percent` for a bare remaining number, `--json` for the full
record, no flag for human-readable, exit `0` on a successful read and exit `2` for UNKNOWN.

## The three probes

| Probe | State | Source | Verified |
|---|---|---|---|
| `codex-usage.py` | **Live** | `~/.codex/auth.json` → `chatgpt.com/backend-api/wham/usage`, `rate_limit.primary_window` | 2026-08-01: 99% left, TEAM |
| `claude-usage.py` | **Live** | macOS Keychain item `Claude Code-credentials` → `claudeAiOauth.accessToken` → `api.anthropic.com/api/oauth/usage`, `five_hour` + `seven_day` `.utilization` | 2026-08-01: 84% left (tightest) |
| `agy-usage.py` | **Live** | `~/.gemini/antigravity-cli/antigravity-oauth-token` → Google OAuth2 refresh → `cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota` | 2026-08-01: 88% left (tightest) |

`claude-usage.py --percent` returns `100 - max(session_used, weekly_used)` — the **tightest** of the
5-hour and 7-day windows, so one number is safe to route on. `~/.claude/.credentials.json` is only a
fallback; on this machine the token lives in the Keychain. `/api/claude_code/usage` is a 404, and the
local transcripts carry no usage windows — don't go looking there.

**agy-usage probe is live and programmatic.** The script reads the stored refresh token from
`~/.gemini/antigravity-cli/antigravity-oauth-token`, refreshes an OAuth access token using Google OAuth2,
and posts to `https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota`. It returns model-by-model
`remainingFraction` values and reset timestamps for Gemini models by default, and never produces Claude numbers.

## `--percent` is a routing convenience. It is not valid for deltas

**Use `--json` whenever you are reporting, comparing, or subtracting.** `--json` carries **every
window separately, each with its own reset time**; `--percent` collapses them to the single tightest
number so a route can be decided in one glance.

| Probe | `--json` windows | Reset fields | `--percent` returns |
|---|---|---|---|
| `claude-usage.py` | `session_*` (5-hour) **and** `weekly_*` (7-day) | `session_resets_at`, `weekly_resets_at` | `tightest_remaining_percent` — the **tighter of the two** |
| `codex-usage.py` | `session_*` (5-hour) **and** `weekly_*` (7-day) | `session_resets_in`, `weekly_resets_in` | `tightest_remaining_percent` — the **tighter of the two** |
| `agy-usage.py` | one entry **per model** (Gemini by default; never Claude) | `models.<id>.reset_time` (may be `null`) | `tightest_remaining_percent` across Gemini models |

Claude and Codex both have two windows on different clocks (5-hour and 7-day). agy's per-model
breakdown produces Gemini numbers by default and never Claude numbers; a single tightest number hides
which model's quota is actually thin.

That collapse makes `--percent` useless for measuring change:

- A run that starts at `82%` and reads `52%` an hour later, then `85%` an hour after that, has not
  recovered headroom. The **5-hour window reset mid-run**, so the tightest-of-two switched from one
  window to the other. `82 → 52 → 85` describes nothing that happened. This is observed, not
  hypothetical.
- **Report per window, at start and at end, with reset times.** Both in the kickoff line and in the
  run report. A start-to-end subtraction across a window boundary is not a measurement, and a single
  number cannot tell you which window it came from.
- The mid-run reset is the failure mode to expect on any run longer than the shortest window. Re-probe
  with `--json` and say which window moved, rather than reporting a delta that averages two windows
  with different clocks.

## The codex probe

```bash
python3 auto-office/scripts/codex-usage.py --percent   # e.g. 99
python3 auto-office/scripts/codex-usage.py --json      # full record
python3 auto-office/scripts/codex-usage.py             # human-readable
```

The script reads the stored session token from `~/.codex/auth.json`
(`tokens.access_token`) and GETs `https://chatgpt.com/backend-api/wham/usage` with it. Purely
programmatic — no browser, no Chrome automation, no model tokens consumed, standard library only.

`rate_limit.primary_window` is the **5-hour** window and `secondary_window` is the **weekly** window.
`used_percent` and `reset_after_seconds` come straight from those objects; remaining is
`100 - used_percent`.

## Exit codes and what routing does with them

| Exit | Meaning | Routing action |
|---|---|---|
| `0` | Headroom read | Weigh the number against what the run needs, when it resets, and what a worse route would cost. **No threshold is hardcoded** — a low number can still be the right spend. State the number and the reasoning. |
| `2` | UNKNOWN — no credential, no token, or the API refused | **Unavailable, not low.** Say which probe failed and why, and route around it unless the user says otherwise. |

Never spend a run discovering that a tool was never usable. An optimistic route on an UNKNOWN
reading burns the run's wall-clock and lands you mid-plan with no executor — which is a different
and worse problem than knowingly spending a thin quota window.

## Failure modes

- **`auth file not found`** — codex was never logged in here, or `CODEX_HOME` points elsewhere.
  Fix: the user runs `codex login`. Do not attempt an interactive login yourself.
- **`401`/`403`** — the stored token expired. Same fix; the token refreshes on the next real
  `codex` run or login.
- **Unreachable** — network or endpoint change. If the endpoint itself has moved, the fallback is
  the local telemetry in the newest `~/.codex/sessions/**/*.jsonl`: grep for a `rate_limits`
  event and read the window whose `window_minutes` is ≈ `10080`. That reading is **stale** — it
  reflects the last codex run, not now — so prefer the API and treat the local read as a floor.
- **Endpoint drift** is the real long-term risk. If the API shape changes, update
  `summarize()` in the script and this table together, and re-verify with a real call before
  trusting a route to it.

## What this is not

Not a per-run budget meter. Each probe is one window number, sampled before routing. If a long run
crosses a plan boundary or the loop reroutes after several tasks on one tool, re-probe — do not
carry a stale percentage through an entire multi-hour run, and especially do not carry one you
already reasoned was thin.

## Adding or fixing a probe

Every probe follows `codex-usage.py`: standard library only, no browser automation, no meaningful
model tokens consumed, `--percent` / `--json` / bare, and exit 2 with an *actionable* message naming
what it looked for. Verify a probe with a real call before routing on it, and record in this file
the exact paths, fields, or endpoints it reads — a probe whose data source is undocumented is a
probe nobody can fix when the vendor moves it.
