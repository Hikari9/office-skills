/**
 * Hermes adapter — reads `~/.hermes/state.db` (SQLite) via the `sqlite3` CLI.
 *
 * Hermes already records what the other adapters have to reconstruct: the
 * `sessions` table carries `message_count`, `tool_call_count`, `input_tokens`,
 * `output_tokens`, `cache_read_tokens`, `cwd`, `git_branch`, `ended_at` and
 * `end_reason` as columns. So this adapter reads rather than parses.
 *
 * Skill detection is still `skill-md-read`: Hermes has no first-class Skill
 * tool either, so a skill is seen when its `SKILL.md` appears in message
 * content or a tool call.
 *
 * At time of writing the table is empty — Hermes had recorded no sessions — so
 * this adapter has nothing to backfill and exists for what the hooks collect
 * from here on.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { sha8, slugFor } from "../transcript.mjs";

export const id = "hermes";
export const dbPath = () => process.env.HERMES_DB || join(homedir(), ".hermes", "state.db");
export const sessionRoot = dbPath;

const q = (sql) => {
  try {
    // -json keeps us out of delimiter-guessing; content can hold anything.
    const out = execFileSync("sqlite3", ["-json", "-readonly", dbPath(), sql], {
      encoding: "utf8", maxBuffer: 1 << 28,
    });
    return out.trim() ? JSON.parse(out) : [];
  } catch {
    return [];
  }
};

/** One "session file" per session id. Returned as ids, not paths. */
export function listSessions() {
  if (!existsSync(dbPath())) return [];
  return q("select id from sessions order by started_at").map((r) => r.id);
}

const SKILL_PATH = /([\w.-]+)\/skills\/([\w.-]+)(?:\/skills\/([\w.-]+))?\/SKILL\.md/g;
const VERDICTS = ["CHANGES REQUIRED", "PLAN DEFECT", "BRIEF DEFECT", "APPROVED"];
const iso = (epoch) => (epoch ? new Date(epoch * 1000).toISOString() : null);
const esc = (s) => String(s).replace(/'/g, "''");

export async function parseSession(sessionId, repoMap) {
  const [row] = q(`select * from sessions where id = '${esc(sessionId)}'`);
  if (!row) return { session: null, skills: [] };

  const session = {
    session_id: row.id,
    transcript: sha8(row.id),
    cwd: row.cwd || null,
    repo_slug: row.cwd ? slugFor(row.cwd, repoMap) : null,
    git_branch: row.git_branch || null,
    cc_version: null,
    started_at: iso(row.started_at),
    ended_at: iso(row.ended_at),
    prs: [],
    turns: row.message_count || 0,
    interrupts: row.end_reason === "interrupted" ? 1 : 0,
    tool_errors: 0,
    tool_calls: row.tool_call_count || 0,
    subagents: 0,
    compactions: row.rewind_count || 0,
    brand: "hermes",
  };

  const msgs = q(
    `select role, content, tool_name, tool_calls, timestamp, token_count
     from messages where session_id = '${esc(sessionId)}' order by timestamp`
  );

  const skills = new Map(); const order = [];
  let openSkill = null;
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

  for (const m of msgs) {
    const ts = iso(m.timestamp);
    const text = `${m.content || ""} ${m.tool_calls || ""}`;
    for (const mm of text.matchAll(SKILL_PATH)) {
      const name = mm[3] ? `${mm[2]}:${mm[3]}` : mm[2];
      openSkill = name;
      bill(name, (s) => {
        s.explicit_invocations++;
        s.callers.read = (s.callers.read || 0) + 1;
        if (ts) { if (!s.first_at || ts < s.first_at) s.first_at = ts; if (!s.last_at || ts > s.last_at) s.last_at = ts; }
      });
    }
    if (m.role === "assistant") {
      bill(openSkill, (s) => {
        s.attributed_turns++;
        s.output_tokens += m.token_count || 0;
        if (row.model) s.models[row.model] = (s.models[row.model] || 0) + 1;
        if (ts) { if (!s.first_at || ts < s.first_at) s.first_at = ts; if (!s.last_at || ts > s.last_at) s.last_at = ts; }
      });
      for (const v of VERDICTS) if (text.includes(v)) bill(openSkill, (s) => { s.verdicts[v] = (s.verdicts[v] || 0) + 1; });
    }
    if (m.tool_name) bill(openSkill, (s) => s.tool_calls++);
    for (const pm of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g)) {
      if (!session.prs.some((p) => p.number === Number(pm[2]) && p.repo === pm[1])) {
        session.prs.push({ number: Number(pm[2]), repo: pm[1], at: ts });
      }
    }
  }

  // Whole-session token totals when no message carried them.
  if (order.length === 1 && !skills.get(order[0]).output_tokens) {
    const s = skills.get(order[0]);
    s.output_tokens = row.output_tokens || 0;
    s.input_tokens = row.input_tokens || 0;
    s.cache_read_tokens = row.cache_read_tokens || 0;
  }

  return { session, skills: order.map((k) => skills.get(k)) };
}
