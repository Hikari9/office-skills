#!/usr/bin/env node
/**
 * Idempotently installs the office-skills hooks into ~/.claude/settings.json.
 *
 *   SessionEnd  → run telemetry, from the harness's own transcript
 *   PreCompact  → run-state scratchpad + continuity marker
 *   Stop        → the `compact: yes|no` recommendation at every lull
 *
 * Run with --uninstall to remove them again.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const settingsPath = join(homedir(), ".claude", "settings.json");
const uninstall = process.argv.includes("--uninstall");

const HOOKS = [
  ["SessionEnd", "session-end.mjs"],
  ["PreCompact", "pre-compact.mjs"],
  ["Stop", "compact-advisor.mjs"],
];

const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
settings.hooks ??= {};

if (existsSync(settingsPath)) copyFileSync(settingsPath, settingsPath + ".bak");

const changed = [];
for (const [event, file] of HOOKS) {
  const cmd = `node ${resolve(here, file)}`;
  settings.hooks[event] ??= [];

  // Drop any prior copy of this hook first, so re-running never duplicates it
  // and a moved repo path is corrected rather than layered.
  const before = JSON.stringify(settings.hooks[event]);
  settings.hooks[event] = settings.hooks[event]
    .map((group) => ({
      ...group,
      hooks: (group.hooks || []).filter((h) => !String(h.command || "").includes(file)),
    }))
    .filter((group) => (group.hooks || []).length > 0);

  if (!uninstall) settings.hooks[event].push({ hooks: [{ type: "command", command: cmd }] });
  if (settings.hooks[event].length === 0) delete settings.hooks[event];
  if (JSON.stringify(settings.hooks[event] ?? []) !== before) changed.push(`${event}:${file}`);
}

writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
console.log(`${uninstall ? "removed" : "installed"}: ${changed.join(", ") || "no change"}`);
console.log(`backup at ${settingsPath}.bak`);
