/**
 * Shapes one parsed session's per-skill aggregate into a run event.
 *
 * The first block is `office-core/schemas/run-event.schema.json` proper.
 * Everything from `source` down is a documented extension, tagged with how it
 * was produced, so a backfilled record can never be mistaken for one an office
 * emitted about itself.
 */
import { attribute } from "./version-tree.mjs";
import { sha8, OFFICE_PLUGINS } from "./transcript.mjs";

export function toEvent({ session, skill: s, tree, source, brand }) {
  const at = s.first_at || session.started_at;
  const ver = at ? attribute(tree, at) : null;
  const pluginId = s.plugin || s.skill;
  const isOffice = OFFICE_PLUGINS.has(pluginId);
  const prsAfter = session.prs.filter((p) => !s.first_at || !p.at || p.at >= s.first_at);

  return {
    // --- run-event.schema.json ---
    event: "office.invoked",
    invocation_id: `${session.session_id || session.transcript}:${sha8(s.skill + at)}`,
    plugin: isOffice ? { id: pluginId, version: ver?.versions?.[pluginId] ?? null } : null,
    core_version: ver?.versions?.core ?? null,
    timestamp: at,

    // --- extensions ---
    source,                       // "backfill" | "session-end-hook"
    harness: brand || session.brand || "claude",
    // How the invocation was observed. "skill-tool" is a recorded dispatch;
    // "skill-md-read" is inferred from the skill file being read, which is the
    // best any harness without a Skill tool can offer. Never compare them
    // without saying which is which.
    signal: s.signal || "skill-tool",
    skill: s.skill,
    is_office: isOffice,
    version_sha: ver?.sha ?? null,
    version_is_current: ver?.is_current ?? false,
    version_boundary: ver?.boundary ?? "unknown",
    repo_slug: session.repo_slug,
    git_branch: session.git_branch,
    cc_version: session.cc_version,
    session: { session_id: session.session_id, transcript: session.transcript },
    explicit_invocations: s.explicit_invocations,
    attributed_turns: s.attributed_turns,
    sidechain_turns: s.sidechain_turns,
    callers: s.callers,
    models: s.models,
    efforts: s.efforts,
    // Omitted rather than zeroed when the harness reported nothing — a 0 here
    // would read as a measurement. (run-event.schema.json, `tokens_out`.)
    tokens_out: s.output_tokens || undefined,
    cache_read_tokens: s.cache_read_tokens || undefined,
    wall_clock_s:
      s.first_at && s.last_at
        ? Math.round((Date.parse(s.last_at) - Date.parse(s.first_at)) / 1000)
        : undefined,
    tool_calls: s.tool_calls,
    tool_errors: s.tool_errors,
    interrupts: s.interrupts,
    subagents: s.subagents,
    verdicts: s.verdicts,
    prs: prsAfter.map((p) => ({ number: p.number, repo: sha8(p.repo) })),
    session_compactions: session.compactions,
    prompts: s.prompt_hashes,
  };
}
