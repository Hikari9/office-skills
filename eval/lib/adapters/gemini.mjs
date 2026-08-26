/**
 * Gemini CLI adapter — reads `~/.gemini/tmp/<project>/chats/**\/*.jsonl`.
 *
 * Format: first line is session meta; every later line is a `$set` patch whose
 * `messages` array holds the turns. Like Codex, Gemini has no first-class Skill
 * tool, so a skill is detected by its `SKILL.md` being read — `signal:
 * "skill-md-read"`, the same lower-fidelity signal, flagged the same way.
 */
import { createReadStream, readdirSync, statSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import { sha8, slugFor } from "../transcript.mjs";

export const id = "gemini";
export const sessionRoot = () => process.env.GEMINI_TMP_DIR || join(homedir(), ".gemini", "tmp");

export function listSessions(root = sessionRoot()) {
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (name.endsWith(".jsonl")) out.push(p);
    }
  };
  walk(root);
  return out.filter((p) => p.includes("/chats/"));
}

const SKILL_PATH = /([\w.-]+)\/skills\/([\w.-]+)(?:\/skills\/([\w.-]+))?\/SKILL\.md/g;
const VERDICTS = ["CHANGES REQUIRED", "PLAN DEFECT", "BRIEF DEFECT", "APPROVED"];

export async function parseSession(file, repoMap) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  const session = {
    session_id: null, transcript: sha8(file), cwd: null, repo_slug: null, git_branch: null,
    cc_version: null, started_at: null, ended_at: null,
    prs: [], turns: 0, interrupts: 0, tool_errors: 0, tool_calls: 0,
    subagents: 0, compactions: 0, brand: "gemini",
  };
  const skills = new Map(); const order = [];
  let openSkill = null;
  const seenMsg = new Set();

  const bill = (name, fn) => {
    if (!name) return;
    if (!skills.has(name)) {
      skills.set(name, {
        skill: name, plugin: name.includes(":") ? name.split(":")[0] : null,
        explicit_invocations: 0, attributed_turns: 0, first_at: null, last_at: null,
        output_tokens: 0, input_tokens: 0, cache_read_tokens: 0,
        tool_calls: 0, tool_errors: 0, interrupts: 0, subagents: 0,
        verdicts: {}, models: {}, efforts: {}, callers: {}, sidechain_turns: 0,
        prompt_hashes: [], signal: "skill-md-read",
      });
      order.push(name);
    }
    fn(skills.get(name));
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }

    if (d.sessionId && !session.session_id) {
      session.session_id = d.sessionId;
      session.started_at = d.startTime || null;
      session.ended_at = d.lastUpdated || d.startTime || null;
      // A subagent transcript is a sidechain, not its own run.
      if (d.kind && d.kind !== "main") session.subagents++;
      for (const dir of d.directories || []) {
        if (!session.cwd && !dir.includes("/skills/")) {
          session.cwd = dir; session.repo_slug = slugFor(dir, repoMap);
        }
      }
      continue;
    }

    const msgs = d.$set?.messages || d.messages || [];
    for (const m of msgs) {
      if (m.id && seenMsg.has(m.id)) continue;   // $set replays the whole array
      if (m.id) seenMsg.add(m.id);
      const ts = m.timestamp;
      if (ts) {
        if (!session.started_at || ts < session.started_at) session.started_at = ts;
        if (!session.ended_at || ts > session.ended_at) session.ended_at = ts;
      }
      const text = JSON.stringify(m.content ?? m.text ?? "");

      for (const mm of text.matchAll(SKILL_PATH)) {
        const name = mm[3] ? `${mm[2]}:${mm[3]}` : mm[2];
        openSkill = name;
        bill(name, (s) => {
          s.explicit_invocations++;
          s.callers.read = (s.callers.read || 0) + 1;
          if (ts) { if (!s.first_at || ts < s.first_at) s.first_at = ts; if (!s.last_at || ts > s.last_at) s.last_at = ts; }
        });
      }

      if (m.type === "gemini" || m.type === "model" || m.type === "assistant") {
        session.turns++;
        bill(openSkill, (s) => {
          s.attributed_turns++;
          if (m.model) s.models[m.model] = (s.models[m.model] || 0) + 1;
          if (ts) { if (!s.first_at || ts < s.first_at) s.first_at = ts; if (!s.last_at || ts > s.last_at) s.last_at = ts; }
        });
        for (const v of VERDICTS) if (text.includes(v)) bill(openSkill, (s) => { s.verdicts[v] = (s.verdicts[v] || 0) + 1; });
      }
      if (m.type === "tool" || m.toolCall || m.functionCall) {
        session.tool_calls++;
        bill(openSkill, (s) => s.tool_calls++);
        if (/"error"|failed|ENOENT/i.test(text)) { session.tool_errors++; bill(openSkill, (s) => s.tool_errors++); }
      }
      if (/compress|compact/i.test(String(m.type || ""))) session.compactions++;

      for (const pm of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g)) {
        if (!session.prs.some((p) => p.number === Number(pm[2]) && p.repo === pm[1])) {
          session.prs.push({ number: Number(pm[2]), repo: pm[1], at: ts });
        }
      }
    }
  }
  return { session, skills: order.map((k) => skills.get(k)) };
}
