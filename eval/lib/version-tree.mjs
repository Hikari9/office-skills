// Builds the reverse version tree: for every commit that changed any office's
// version or the core protocol version, record the full version vector and the
// instant it took effect. Runs are attributed by timestamp against these intervals.
//
// Attribution is valid here because the offices are symlinked live into
// ~/.claude/skills (agy-office -> /Users/rico/Git/office-skills/agy-office), so the
// version in effect at any instant is the repo working tree at that instant.
import { execFileSync } from "node:child_process";

export const PLUGINS = ["codex-office", "claude-office", "agy-office", "auto-office"];
const CORE = "office-core/VERSION";

const git = (repo, args) =>
  execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });

const versionAt = (repo, sha, path) => {
  try {
    const blob = git(repo, ["show", `${sha}:${path}`]);
    if (path.endsWith("VERSION")) return blob.trim() || null;
    return JSON.parse(blob).version ?? null;
  } catch {
    return null;
  }
};

/**
 * @returns {{intervals: Array, generatedAt: string, head: string}}
 *   intervals are reverse-chronological; intervals[0] is the current version.
 */
export function buildVersionTree(repo) {
  const tracked = [CORE, ...PLUGINS.map((p) => `${p}/.claude-plugin/plugin.json`)];
  const shas = git(repo, ["log", "--format=%H %cI %s", "--", ...tracked])
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, ts, ...rest] = line.split(" ");
      return { sha, ts, subject: rest.join(" ") };
    }); // git log is already newest-first

  const rows = shas.map(({ sha, ts, subject }) => {
    const versions = { core: versionAt(repo, sha, CORE) };
    for (const p of PLUGINS) versions[p] = versionAt(repo, sha, `${p}/.claude-plugin/plugin.json`);
    return { sha: sha.slice(0, 7), full_sha: sha, effective_from: ts, subject, versions };
  });

  // Drop commits that touched a tracked file without moving any version.
  const changed = rows.filter((row, i) => {
    const prev = rows[i + 1];
    if (!prev) return true;
    return JSON.stringify(row.versions) !== JSON.stringify(prev.versions);
  });

  // Close each interval with the start of the one that superseded it.
  const intervals = changed.map((row, i) => ({
    ...row,
    effective_to: i === 0 ? null : changed[i - 1].effective_from,
    is_current: i === 0,
    changed: i === changed.length - 1
      ? ["<initial>"]
      : Object.keys(row.versions).filter(
          (k) => row.versions[k] !== changed[i + 1].versions[k]
        ),
  }));

  return {
    generatedAt: new Date().toISOString(),
    head: git(repo, ["rev-parse", "--short", "HEAD"]).trim(),
    repo,
    intervals,
  };
}

/**
 * Attribute an ISO instant to a version vector.
 * `fuzzyMs` marks runs that landed shortly before a bump: the working tree may
 * already have held the newer content uncommitted, so the boundary is soft.
 */
export function attribute(tree, iso, fuzzyMs = 6 * 3600 * 1000) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const hit = tree.intervals.find((iv) => Date.parse(iv.effective_from) <= t);
  if (!hit) {
    return { sha: null, versions: {}, label: "pre-release", boundary: "before-first-commit" };
  }
  const next = tree.intervals[tree.intervals.indexOf(hit) - 1];
  const boundary =
    next && Date.parse(next.effective_from) - t < fuzzyMs ? "fuzzy" : "firm";
  return { sha: hit.sha, versions: hit.versions, is_current: hit.is_current, boundary };
}
