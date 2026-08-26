#!/usr/bin/env node
/**
 * Stop hook. Prints one `compact: yes|no — <driver>` line at every lull.
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
 * Never blocks. Always exits 0.
 */
import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";

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

const say = (line) => process.stdout.write(line + "\n");

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
  const stateOnDisk = /\b[\w./-]+\.(md|json|patch|diff)\b/.test(lastText);

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
    driver = `${Math.round(held / 1000)}k held but nothing recent points at a file — write the run state down first, then this becomes yes`;
  } else if (saving > cost) {
    verdict = "yes";
    driver = `${Math.round(held / 1000)}k held (${pct}% of window), ${turnsSinceCompact} turns / ${toolsSinceCompact} tool calls since the last boundary, next step is a file path`;
  } else {
    verdict = "no";
    driver = `${Math.round(held / 1000)}k held, but the re-read at this tier costs more than the drop saves`;
  }

  say(`compact: ${verdict} — ${driver}`);
  if (verdict === "no" && driver.includes("write the run state")) {
    say("  (a `no` is a defect report, not a wait instruction: something real exists only in this window)");
  }
} catch {
  // Swallow. A telemetry hook that can fail a session is worse than none.
}
process.exit(0);
