/**
 * Transcript parser shared by the backfill and the live SessionEnd hook.
 * One code path, so a retro score and a live score are the same measurement.
 *
 * Privacy: no prompt text, no tool arguments, no file contents leave this module.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";

export const sha8 = (s) => createHash("sha256").update(String(s)).digest("hex").slice(0, 8);

export const OFFICE_PLUGINS = new Set(["codex-office", "claude-office", "agy-office", "auto-office"]);
const VERDICTS = ["CHANGES REQUIRED", "PLAN DEFECT", "BRIEF DEFECT", "APPROVED"];
const INTERRUPT = "[Request interrupted by user";

export const slugFor = (cwd, map) => {
  if (!cwd) return "unknown";
  if (!map.has(cwd)) map.set(cwd, `repo-${sha8(cwd)}`);
  return map.get(cwd);
};

const textOf = (content) => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b && (b.type === "text" || b.type === "thinking"))
    .map((b) => b.text || b.thinking || "")
    .join("\n");
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

/** Parse one transcript into a session summary plus its skill invocations. */
export async function parseSession(file, repoMap) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });

  const session = {
    session_id: null, transcript: sha8(file), cwd: null, repo_slug: null, git_branch: null,
    cc_version: null, started_at: null, ended_at: null,
    prs: [], turns: 0, interrupts: 0, tool_errors: 0, tool_calls: 0,
    subagents: 0, compactions: 0,
  };
  /** @type {Map<string, any>} skill -> aggregate */
  const skills = new Map();
  const order = [];
  let openSkill = null; // most recent attributionSkill, used to bill turns

  const bill = (name, fn) => {
    if (!name) return;
    if (!skills.has(name)) {
      skills.set(name, {
        skill: name, plugin: name.includes(":") ? name.split(":")[0] : null,
        explicit_invocations: 0, attributed_turns: 0,
        first_at: null, last_at: null,
        output_tokens: 0, input_tokens: 0, cache_read_tokens: 0,
        tool_calls: 0, tool_errors: 0, interrupts: 0, subagents: 0,
        verdicts: {}, models: {}, efforts: {}, callers: {}, sidechain_turns: 0,
        prompt_hashes: [],
      });
      order.push(name);
    }
    fn(skills.get(name));
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }

    if (d.sessionId && !session.session_id) session.session_id = d.sessionId;
    if (d.cwd && !session.cwd) { session.cwd = d.cwd; session.repo_slug = slugFor(d.cwd, repoMap); }
    if (d.gitBranch && !session.git_branch) session.git_branch = d.gitBranch;
    if (d.version) session.cc_version = d.version;
    if (d.timestamp) {
      if (!session.started_at || d.timestamp < session.started_at) session.started_at = d.timestamp;
      if (!session.ended_at || d.timestamp > session.ended_at) session.ended_at = d.timestamp;
    }

    if (d.type === "pr-link") {
      session.prs.push({ number: d.prNumber, repo: d.prRepository, at: d.timestamp });
      continue;
    }
    if (d.isCompactSummary) session.compactions++;

    // The harness's own skill attribution for this turn. Authoritative, and it
    // survives the skill body being read rather than tool-invoked.
    if (d.attributionSkill) openSkill = d.attributionSkill;

    const msg = d.message || {};

    if (d.type === "assistant") {
      session.turns++;
      const u = msg.usage || {};
      bill(openSkill, (s) => {
        s.attributed_turns++;
        s.output_tokens += u.output_tokens || 0;
        s.input_tokens += u.input_tokens || 0;
        s.cache_read_tokens += u.cache_read_input_tokens || 0;
        if (msg.model) s.models[msg.model] = (s.models[msg.model] || 0) + 1;
        if (d.effort) s.efforts[d.effort] = (s.efforts[d.effort] || 0) + 1;
        if (d.isSidechain) s.sidechain_turns++;
        if (d.timestamp) {
          if (!s.first_at || d.timestamp < s.first_at) s.first_at = d.timestamp;
          if (!s.last_at || d.timestamp > s.last_at) s.last_at = d.timestamp;
        }
      });

      const body = textOf(msg.content);
      for (const v of VERDICTS) {
        if (body.includes(v)) bill(openSkill, (s) => { s.verdicts[v] = (s.verdicts[v] || 0) + 1; });
      }

      if (Array.isArray(msg.content)) {
        for (const b of msg.content) {
          if (!b || b.type !== "tool_use") continue;
          session.tool_calls++;
          bill(openSkill, (s) => s.tool_calls++);
          if (b.name === "Agent" || b.name === "Task") {
            session.subagents++;
            bill(openSkill, (s) => s.subagents++);
          }
          if (b.name === "Skill" && b.input?.skill) {
            const name = b.input.skill;
            openSkill = name;
            bill(name, (s) => {
              s.explicit_invocations++;
              const caller = b.caller?.type || "unknown";
              s.callers[caller] = (s.callers[caller] || 0) + 1;
              if (b.input.args) s.prompt_hashes.push({ h: sha8(b.input.args), len: b.input.args.length });
              if (d.timestamp) {
                if (!s.first_at || d.timestamp < s.first_at) s.first_at = d.timestamp;
                if (!s.last_at || d.timestamp > s.last_at) s.last_at = d.timestamp;
              }
            });
          }
        }
      }
    }

    if (d.type === "user") {
      const body = textOf(msg.content);
      if (body.includes(INTERRUPT)) {
        session.interrupts++;
        bill(openSkill, (s) => s.interrupts++);
      }
      if (Array.isArray(msg.content)) {
        for (const b of msg.content) {
          if (b?.type === "tool_result" && b.is_error) {
            session.tool_errors++;
            bill(openSkill, (s) => s.tool_errors++);
          }
        }
      }
    }
  }

  return { session, skills: order.map((k) => skills.get(k)) };
}

