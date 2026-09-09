#!/usr/bin/env node
/**
 * Stop hook. Decides compactability at every turn boundary, and — when the
 * verdict flips to `yes` — leaves a request on disk for `compact-courier.mjs`
 * to deliver.
 *
 * `evidence-and-handoff.md` requires the planner to surface this at each phase
 * or task boundary, and the transcripts say it rarely happens: it is a rule the
 * model has to remember, at exactly the moment its context is fullest. So the
 * harness computes it instead. A hook cannot forget.
 *
 * The arithmetic is the protocol's, not a vibe:
 *   saving ≈ context held × turns before the next natural boundary
 *   cost   ≈ summary tokens + (tokens re-read afterward × current model rate)
 * A small context at a clean boundary is a `no` — dropping 30k you re-read in
 * two turns is a net loss however tidy the boundary.
 *
 * **Decide here, deliver elsewhere.** This hook runs synchronously inside the
 * turn, so it does no Herdr lookup and sends nothing: it writes a request file
 * and returns. The courier is a separate `async` Stop hook, because delivering
 * `/compact` means waiting on the pane whose turn is still finishing.
 *
 * Surfacing: `systemMessage` on the no→yes edge only. A level-triggered message
 * would repeat every turn for a session nobody is compacting (a human's own
 * session has no courier), so the transition is the event. Every verdict, `yes`
 * or `no`, is appended to `compact-advisor.log` in the telemetry sink, so the
 * arithmetic stays auditable without a line per turn in the terminal.
 *
 * Never blocks. Always exits 0.
 */
import { createReadStream, existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

const SINK = process.env.OFFICE_TELEMETRY_DIR || join(homedir(), ".claude", "office-skills-telemetry");

// Tier multiplier on the re-read side. The same re-read costs several times more
// on an Opus planner than a Sonnet one, so a heavy planner compacts earlier.
const TIER = [
  [/opus/i, 5],
  [/sonnet/i, 1.5],
  [/haiku/i, 1],
];
// The transcript records `claude-opus-5`, never the `[1m]` suffix, so the model
// string cannot tell you the window. Infer it from what the session actually
// held: a context above the standard ceiling can only have come from a 1M model.
const WINDOW = (held) => (held > 190_000 ? 1_000_000 : 200_000);

const read = (stream) =>
  new Promise((res) => {
    let b = "";
    stream.setEncoding("utf8");
    stream.on("data", (c) => (b += c));
    stream.on("end", () => res(b));
    setTimeout(() => res(b), 2000).unref();
  });

/** Only ever one JSON object on stdout: a hook that mixes prose into it emits nothing at all. */
const emit = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");

try {
  const input = JSON.parse((await read(process.stdin)) || "{}");
  const path = input.transcript_path;
  if (!path || !existsSync(path)) process.exit(0);

  let held = 0, model = "", turnsSinceCompact = 0, lastText = "", toolsSinceCompact = 0;
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    if (d.isCompactSummary) { turnsSinceCompact = 0; toolsSinceCompact = 0; continue; }
    if (d.type !== "assistant") continue;
    const u = d.message?.usage || {};
    // cache_read + fresh input is what the next turn actually pays for.
    const ctx = (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.input_tokens || 0);
    if (ctx > held) held = ctx;
    if (d.message?.model) model = d.message.model;
    turnsSinceCompact++;
    for (const b of d.message?.content || []) {
      if (b?.type === "tool_use") toolsSinceCompact++;
      if (b?.type === "text" && b.text) lastText = b.text;
    }
  }

  if (!held) process.exit(0);

  const window = WINDOW(held);
  const pct = Math.min(100, Math.round((held / window) * 100));
  const rate = (TIER.find(([re]) => re.test(model)) || [null, 1])[1];

  // "Safe" needs state on disk. A handoff or plan path in the recent output is
  // the observable proxy for it: what comes next is a file, not a memory.
  //
  // Two ways that proxy lied, both observed in the issue-35 run:
  //   1. The path was only *mentioned* ("I'll write continuity.md next") and did
  //      not exist. A regex cannot tell an intention from a file.
  //   2. The file existed but was stale: it named the previous commit as HEAD at
  //      the moment it was about to become the session's only memory.
  // So require the path to exist, and — when we can read git cheaply — that it
  // is not visibly behind HEAD.
  const root = input.cwd || process.cwd();
  // Tokenize rather than regex the path out of prose: `\b` cannot match before a
  // leading dot, so a bare pattern silently truncates `.office/x/continuity.md`
  // to `office/x/continuity.md` — a path that does not exist. Harmless when the
  // result was only a boolean; fatal once we stat it.
  const mentioned = lastText
    .split(/[\s,;:!?()[\]{}<>"'`]+/)
    .map((t) => t.replace(/[.,;:)\]}>"'`]+$/, ""))
    .filter((t) => /\.(?:md|json|patch|diff)$/.test(t));
  const present = mentioned.filter((p) => {
    try {
      return statSync(isAbsolute(p) ? p : join(root, p)).isFile();
    } catch {
      return false;
    }
  });
  const stateOnDisk = present.length > 0;

  // Staleness: a state file that cites commit shas but not HEAD's was written
  // for an earlier commit. Only decidable when the file actually cites shas, so
  // silence here means "no opinion", never "fine".
  let staleFile = null;
  try {
    const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (head) {
      for (const p of present.filter((f) => f.endsWith(".md"))) {
        const body = readFileSync(isAbsolute(p) ? p : join(root, p), "utf8");
        const citesSha = /\b[0-9a-f]{7,40}\b/.test(body);
        if (citesSha && !body.includes(head)) {
          staleFile = p;
          break;
        }
      }
    }
  } catch {
    // No git, no HEAD, or an unreadable file: no opinion on staleness.
  }

  // Cost of compacting now, in tokens: the summary plus what gets re-read at
  // this tier. Saving assumes a conservative 6 further turns at this context.
  const cost = 4000 + held * 0.15 * rate;
  const saving = held * 0.6 * 6;

  let verdict, driver;
  if (pct < 25) {
    verdict = "no";
    driver = `${Math.round(held / 1000)}k held (${pct}% of window) — too small to repay the re-read`;
  } else if (!stateOnDisk) {
    verdict = "no";
    driver = `${Math.round(held / 1000)}k held but nothing recent points at a file that exists — write the run state down first, then this becomes yes`;
  } else if (staleFile) {
    verdict = "no";
    driver = `${Math.round(held / 1000)}k held and ${staleFile} is the state file, but it cites commits and not HEAD — refresh it first, then this becomes yes`;
  } else if (saving > cost) {
    verdict = "yes";
    driver = `${Math.round(held / 1000)}k held (${pct}% of window), ${turnsSinceCompact} turns / ${toolsSinceCompact} tool calls since the last boundary, next step is a file path`;
  } else {
    verdict = "no";
    driver = `${Math.round(held / 1000)}k held, but the re-read at this tier costs more than the drop saves`;
  }

  const line = `compact: ${verdict} — ${driver}`;
  const session = input.session_id || "unknown";
  const stateFile = join(SINK, "compact-state", `${session}.json`);
  const requestFile = join(SINK, "compact-request", `${session}.json`);

  // Full history in the sink regardless of verdict: the terminal stays quiet,
  // the arithmetic stays reviewable.
  try {
    mkdirSync(SINK, { recursive: true });
    appendFileSync(join(SINK, "compact-advisor.log"), `${new Date().toISOString()} ${session} ${line}\n`);
  } catch { /* a log that fails must not change the verdict */ }

  let previous = null;
  try { previous = JSON.parse(readFileSync(stateFile, "utf8")).verdict; } catch { /* first turn */ }
  try {
    mkdirSync(join(SINK, "compact-state"), { recursive: true });
    writeFileSync(stateFile, JSON.stringify({ verdict, driver, held, pct, at: new Date().toISOString() }) + "\n");
  } catch { /* same */ }

  if (verdict !== "yes") process.exit(0);

  // The request the courier acts on. `keep` names the files this session was
  // actually observed to write, not a generic instruction: a directed `/compact`
  // that names the handoff is the difference between a summary that survives the
  // boundary and one that reads like a diary.
  try {
    mkdirSync(join(SINK, "compact-request"), { recursive: true });
    if (!existsSync(requestFile)) {
      writeFileSync(
        requestFile,
        JSON.stringify({
          session_id: session,
          cwd: root,
          verdict,
          driver,
          held,
          pct,
          keep: `the plan, the current brief, ${present.slice(0, 4).join(", ")}, and the next task`,
          requested_at: new Date().toISOString(),
        }) + "\n"
      );
    }
  } catch { /* no request, no delivery; the next boundary re-decides */ }

  // Edge-triggered. A `yes` that is still a `yes` needs no second announcement:
  // either the courier is handling it, or there is no courier and the human
  // already saw the first one.
  if (previous !== "yes") emit({ systemMessage: line });
} catch {
  // Swallow. A telemetry hook that can fail a session is worse than none.
}
process.exit(0);
