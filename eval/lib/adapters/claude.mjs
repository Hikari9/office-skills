/**
 * Claude Code adapter. The highest-fidelity of the four: it is the only harness
 * with a first-class `Skill` tool call *and* per-turn `attributionSkill`, so
 * invocation is a recorded fact rather than an inferred one.
 *
 * Events carry `signal: "skill-tool"`; the other three carry `skill-md-read`.
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseSession as parseClaude } from "../transcript.mjs";

export const id = "claude";
export const sessionRoot = () =>
  process.env.CC_PROJECTS_DIR || join(homedir(), ".claude", "projects");

export function listSessions(root = sessionRoot()) {
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      let st;
      try { st = statSync(p); } catch { return; }
      if (st.isDirectory()) walk(p);
      else if (name.endsWith(".jsonl")) out.push(p);
    }
  };
  walk(root);
  return out;
}

export async function parseSession(file, repoMap) {
  const r = await parseClaude(file, repoMap);
  r.session.brand = "claude";
  for (const s of r.skills) s.signal = "skill-tool";
  return r;
}
