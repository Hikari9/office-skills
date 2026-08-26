#!/usr/bin/env node
/**
 * SessionEnd hook. Emits run events for every skill the session used, to a sink
 * outside this repo.
 *
 * Why SessionEnd and not per-dispatch: run-event.schema.json has existed since
 * core 3.0.0 and never produced a single record, because emitting it depended on
 * the model choosing to. This reads the harness's own transcript instead, so the
 * measurement does not depend on the thing being measured cooperating.
 *
 * It shares eval/lib/transcript.mjs with the backfill, so a live score and a
 * retro score are the same number computed the same way.
 *
 * Contract: never blocks, never writes to stdout, always exits 0. A telemetry
 * hook that can fail a session is worse than no telemetry.
 */
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SINK = process.env.OFFICE_TELEMETRY_DIR || join(homedir(), ".claude", "office-skills-telemetry");

const read = (stream) =>
  new Promise((res) => {
    let b = "";
    stream.setEncoding("utf8");
    stream.on("data", (c) => (b += c));
    stream.on("end", () => res(b));
    setTimeout(() => res(b), 2000).unref();
  });

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../..");
  const { parseSession } = await import("../lib/transcript.mjs");
  const { toEvent } = await import("../lib/event.mjs");
  const { buildVersionTree } = await import("../lib/version-tree.mjs");

  const input = JSON.parse((await read(process.stdin)) || "{}");
  const transcript = input.transcript_path;
  if (!transcript || !existsSync(transcript)) process.exit(0);

  const tree = buildVersionTree(repoRoot);
  const repoMap = new Map();
  if (existsSync(join(SINK, "repo-map.local.json"))) {
    const prior = JSON.parse(readFileSync(join(SINK, "repo-map.local.json"), "utf8"));
    for (const [slug, cwd] of Object.entries(prior)) repoMap.set(cwd, slug);
  }

  const { session, skills } = await parseSession(transcript, repoMap);
  if (!skills.length) process.exit(0);

  mkdirSync(SINK, { recursive: true });
  const events = skills.map((skill) =>
    toEvent({ session, skill, tree, source: "session-end-hook" })
  );
  appendFileSync(join(SINK, "run-events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
  appendFileSync(join(SINK, "sessions.jsonl"), JSON.stringify(session) + "\n");
} catch {
  // Swallow. See contract above.
}
process.exit(0);
