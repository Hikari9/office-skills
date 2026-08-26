/**
 * Codex adapter — reads `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.
 *
 * **Fidelity is lower than the Claude adapter, and the difference is structural.**
 * Codex has no first-class `Skill` tool and no per-turn skill attribution. A skill
 * enters a Codex run when its `SKILL.md` is read, so that read is the signal:
 * a path match inside an `exec` tool call, which is an action rather than a
 * mention. That satisfies the invocation rule in docs/telemetry-event-model.md,
 * but it cannot see a skill that was already in context, and it cannot bill turns
 * to a skill the way `attributionSkill` does.
 *
 * Events emitted from this adapter carry `signal: "skill-md-read"` so a mixed
 * scorecard never silently compares the two.
 */
import { createReadStream, readdirSync, statSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import { sha8, slugFor } from "../transcript.mjs";

export const id = "codex";
export const sessionRoot = () =>
  process.env.CODEX_SESSIONS_DIR || join(homedir(), ".codex", "sessions");

export function listSessions(root = sessionRoot()) {
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (name.startsWith("rollout-") && name.endsWith(".jsonl")) out.push(p);
    }
  };
  walk(root);
  return out;
}

// `/Users/x/.codex/skills/end-to-end/SKILL.md` -> `end-to-end`
// `/Users/x/.claude/skills/auto-office/skills/auto-loop/SKILL.md` -> `auto-office:auto-loop`
const SKILL_PATH = /(?:^|[/\s'"])([\w./-]*?\/skills\/([\w.-]+)(?:\/skills\/([\w.-]+))?)\/SKILL\.md/g;

function skillsIn(text) {
  const found = new Set();
  for (const m of String(text).matchAll(SKILL_PATH)) {
    found.add(m[3] ? `${m[2]}:${m[3]}` : m[2]);
  }
  return found;
}

export async function parseSession(file, repoMap) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });

  const session = {
    session_id: null, transcript: sha8(file), cwd: null, repo_slug: null, git_branch: null,
    cc_version: null, started_at: null, ended_at: null,
    prs: [], turns: 0, interrupts: 0, tool_errors: 0, tool_calls: 0,
    subagents: 0, compactions: 0, brand: "codex",
  };
  const skills = new Map();
  const order = [];
  let openSkill = null;
  let model = null, effort = null;
  let lastTokens = { output: 0, input: 0, cached: 0 };

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
        prompt_hashes: [], signal: "skill-md-read",
      });
      order.push(name);
    }
    fn(skills.get(name));
  };

  const VERDICTS = ["CHANGES REQUIRED", "PLAN DEFECT", "BRIEF DEFECT", "APPROVED"];

  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    const ts = d.timestamp;
    const pl = d.payload || {};

    if (ts) {
      if (!session.started_at || ts < session.started_at) session.started_at = ts;
      if (!session.ended_at || ts > session.ended_at) session.ended_at = ts;
    }

    if (d.type === "session_meta") {
      session.session_id = pl.session_id || pl.id || null;
      session.cwd = pl.cwd || null;
      if (session.cwd) session.repo_slug = slugFor(session.cwd, repoMap);
      session.cc_version = pl.cli_version || null;
      continue;
    }
    if (d.type === "compacted") { session.compactions++; continue; }
    if (d.type === "turn_context") {
      model = pl.model || model;
      effort = pl.effort || pl.model_reasoning_effort || effort;
      if (pl.cwd && !session.cwd) { session.cwd = pl.cwd; session.repo_slug = slugFor(pl.cwd, repoMap); }
      continue;
    }

    // Token usage is cumulative in codex; take the delta so a skill is billed
    // for what happened while it held the chair, not for the whole session.
    if (pl.type === "token_count") {
      const u = pl.info?.total_token_usage || {};
      const d_out = Math.max(0, (u.output_tokens || 0) - lastTokens.output);
      const d_in = Math.max(0, (u.input_tokens || 0) - lastTokens.input);
      const d_cache = Math.max(0, (u.cached_input_tokens || 0) - lastTokens.cached);
      lastTokens = { output: u.output_tokens || 0, input: u.input_tokens || 0, cached: u.cached_input_tokens || 0 };
      bill(openSkill, (s) => {
        s.output_tokens += d_out; s.input_tokens += d_in; s.cache_read_tokens += d_cache;
      });
      continue;
    }

    if (pl.type === "custom_tool_call" || pl.type === "function_call") {
      session.tool_calls++;
      const blob = `${pl.name || ""} ${pl.input || ""} ${pl.arguments || ""}`;
      for (const name of skillsIn(blob)) {
        openSkill = name;
        bill(name, (s) => {
          s.explicit_invocations++;
          s.callers.exec = (s.callers.exec || 0) + 1;
          if (ts) {
            if (!s.first_at || ts < s.first_at) s.first_at = ts;
            if (!s.last_at || ts > s.last_at) s.last_at = ts;
          }
        });
      }
      bill(openSkill, (s) => {
        s.tool_calls++;
        if (model) s.models[model] = (s.models[model] || 0) + 1;
        if (effort) s.efforts[effort] = (s.efforts[effort] || 0) + 1;
        if (ts) { if (!s.last_at || ts > s.last_at) s.last_at = ts; }
      });
      continue;
    }

    if (pl.type === "custom_tool_call_output" || pl.type === "function_call_output") {
      const out = JSON.stringify(pl.output ?? pl.result ?? "");
      // Codex reports failures in the output body; there is no is_error flag.
      if (/"exit_code"\s*:\s*[1-9]|command failed|No such file or directory/i.test(out)) {
        session.tool_errors++;
        bill(openSkill, (s) => s.tool_errors++);
      }
      continue;
    }

    if (pl.type === "message" || d.type === "response_item") {
      const text = JSON.stringify(pl.content ?? pl.text ?? "");
      if (pl.role === "assistant" || pl.type === "message") {
        session.turns++;
        bill(openSkill, (s) => {
          s.attributed_turns++;
          if (ts) { if (!s.first_at || ts < s.first_at) s.first_at = ts; if (!s.last_at || ts > s.last_at) s.last_at = ts; }
        });
        for (const v of VERDICTS) {
          if (text.includes(v)) bill(openSkill, (s) => { s.verdicts[v] = (s.verdicts[v] || 0) + 1; });
        }
      }
      // Codex has no pr-link record; recover PRs from the URLs it printed.
      for (const m of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g)) {
        if (!session.prs.some((p) => p.number === Number(m[2]) && p.repo === m[1])) {
          session.prs.push({ number: Number(m[2]), repo: m[1], at: ts });
        }
      }
    }
  }

  return { session, skills: order.map((k) => skills.get(k)) };
}
