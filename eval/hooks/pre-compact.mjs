#!/usr/bin/env node
/**
 * PreCompact hook. Two jobs, both about surviving the boundary.
 *
 * 1. **Run-state durability.** `evidence-and-handoff.md` says a `no` is a defect
 *    report meaning something real exists only in a context window. Compaction
 *    is about to drop that window. So write a snapshot to a session scratchpad
 *    *outside the repo* — committing run state next to a live executor orphaned
 *    two commits in one run.
 *
 * 2. **Evaluation continuity.** Emits a `run.compacted` marker so the scorer can
 *    prove a PR opened after the compact belongs to the same run. Session id
 *    already survives compaction in practice (48 of 49 compacted transcripts
 *    keep one id), but "in practice" is not a record, and the one outlier is why
 *    this marker exists.
 *
 * Never blocks. Always exits 0.
 */
import { createReadStream, existsSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";

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
  const input = JSON.parse((await read(process.stdin)) || "{}");
  const path = input.transcript_path;
  if (!path || !existsSync(path)) process.exit(0);

  const state = {
    event: "run.compacted",
    source: "pre-compact-hook",
    timestamp: new Date().toISOString(),
    session_id: input.session_id || null,
    trigger: input.trigger || null,      // "manual" | "auto"
    cwd: input.cwd || null,
    skills_active: [],
    open_files: [],
    prs: [],
    last_skill: null,
    turns: 0,
  };

  const seen = new Set();
  const files = new Set();
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    if (d.attributionSkill) { seen.add(d.attributionSkill); state.last_skill = d.attributionSkill; }
    if (d.type === "pr-link") state.prs.push({ number: d.prNumber, repo: d.prRepository });
    if (d.type === "assistant") {
      state.turns++;
      for (const b of d.message?.content || []) {
        if (b?.type !== "tool_use") continue;
        if (b.input?.skill) { seen.add(b.input.skill); state.last_skill = b.input.skill; }
        // Plans, handoffs, and diffs are the state that has to come back.
        const p = b.input?.file_path || b.input?.path;
        if (p && /\.(md|json|patch|diff)$/.test(p)) files.add(p);
      }
    }
  }
  state.skills_active = [...seen];
  state.open_files = [...files].slice(-40);

  mkdirSync(SINK, { recursive: true });
  appendFileSync(join(SINK, "run-events.jsonl"), JSON.stringify(state) + "\n");

  // The scratchpad the post-compaction agent can actually read back. Outside the
  // repo on purpose: a live executor may be working in that tree.
  const pad = join(SINK, "scratchpad", `${state.session_id || "unknown"}.md`);
  mkdirSync(join(SINK, "scratchpad"), { recursive: true });
  writeFileSync(
    pad,
    [
      `# Run state at compaction — ${state.timestamp}`,
      "",
      `Session: \`${state.session_id}\`  ·  trigger: ${state.trigger}  ·  turns: ${state.turns}`,
      `Working directory: \`${state.cwd}\``,
      "",
      "## Skill in the chair",
      state.last_skill ? `\`${state.last_skill}\`` : "_none recorded_",
      "",
      "## Skills active this run",
      state.skills_active.length ? state.skills_active.map((s) => `- \`${s}\``).join("\n") : "_none_",
      "",
      "## PRs opened before this boundary",
      state.prs.length ? state.prs.map((p) => `- ${p.repo}#${p.number}`).join("\n") : "_none_",
      "",
      "## Files this run wrote or read that carry its state",
      state.open_files.length ? state.open_files.map((f) => `- \`${f}\``).join("\n") : "_none_",
      "",
      "Written by `eval/hooks/pre-compact.mjs`. This is the state a compaction drops;",
      "re-read what you still need rather than reconstructing it from the summary.",
    ].join("\n") + "\n"
  );
} catch {
  // Swallow. See contract above.
}
process.exit(0);
