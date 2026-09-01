#!/usr/bin/env node
/**
 * Installs the office-skills telemetry hooks into every agent harness present,
 * plus — only when asked for, and only where Herdr exists — the Herdr pane
 * hygiene hook.
 *
 * The four harnesses agree on almost nothing — different config files, different
 * event names, different formats — so each gets what it actually supports:
 *
 *   claude  ~/.claude/settings.json      SessionEnd, PreCompact, Stop x2
 *   codex   ~/.codex/hooks.json          SessionStart, PreCompact   (no SessionEnd or Stop exists)
 *   gemini  ~/.gemini/config/hooks.json  SessionEnd, Stop x2        (namespaced)
 *   hermes  ~/.hermes/config.yaml        on_session_end, on_session_finalize
 *
 * Nothing is installed on an event a harness does not have. A hook that goes
 * silent because it was wired to an event that never fires is indistinguishable
 * from "no runs happened", which is the failure this whole system exists to stop.
 *
 * Pane hygiene is **opt-in**: `--with-pane-hygiene`. It closes real panes in a
 * user's visible layout, so it is never installed as a side effect of installing
 * telemetry. Where Herdr is absent the option is not even mentioned, rather than
 * installing a hook that could only ever no-op.
 *
 * Usage: install.mjs [--uninstall] [--with-pane-hygiene]
 *                    [--brand claude,codex,gemini,hermes]
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, accessSync, constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve, dirname, join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const uninstall = process.argv.includes("--uninstall");
const bflag = process.argv.indexOf("--brand");
const only = bflag >= 0 ? (process.argv[bflag + 1] || "").split(",").filter(Boolean) : null;

const wantPanes = process.argv.includes("--with-pane-hygiene");

/**
 * Is Herdr here at all? Same detection the skills use: the env marker the office
 * checks for, or the CLI on PATH. Install-time presence is only about whether to
 * OFFER the hook — the hook keeps its own runtime guard, because a machine that
 * has Herdr today may run a session without it.
 */
const herdrPresent =
  process.env.HERDR_ENV === "1" ||
  (process.env.PATH || "").split(delimiter).some((d) => {
    if (!d) return false;
    try { accessSync(join(d, "herdr"), constants.X_OK); return true; } catch { return false; }
  });
const panes = wantPanes && herdrPresent;

const node = process.execPath;
const cmd = (file, args = "") => `${node} ${resolve(here, file)}${args ? " " + args : ""}`.trim();

const backup = (p) => { if (existsSync(p)) copyFileSync(p, p + ".bak"); };
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback);
const writeJson = (p, d) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(d, null, 2) + "\n"); };

/** Claude-Code-shaped hook lists: [{hooks:[{type,command,timeout?}]}] */
const setEvent = (bucket, event, command, timeout) => {
  bucket[event] ??= [];
  const marker = command.split(" ").slice(1).join(" ");
  bucket[event] = bucket[event]
    .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !String(h.command || "").includes(marker.split(" ")[0])) }))
    .filter((g) => (g.hooks || []).length > 0);
  if (!uninstall) bucket[event].push({ hooks: [{ type: "command", command, ...(timeout ? { timeout } : {}) }] });
  if (!bucket[event].length) delete bucket[event];
};

const report = [];

// ---- claude --------------------------------------------------------------
function claude() {
  const p = join(homedir(), ".claude", "settings.json");
  const s = readJson(p, {});
  s.hooks ??= {};
  backup(p);
  setEvent(s.hooks, "SessionEnd", cmd("session-end.mjs"));
  setEvent(s.hooks, "PreCompact", cmd("pre-compact.mjs"));
  setEvent(s.hooks, "Stop", cmd("compact-advisor.mjs"));
  // A second, separate Stop hook, opt-in. Pane hygiene is not telemetry, and a
  // turn boundary is exactly when a delegated agent has just reported.
  // Deliberately the eval/ shim path, not office-core/hooks/ directly: installed
  // commands are absolute, so keeping this path stable means an existing install
  // needs no re-run and never ends up wired twice.
  // Without the flag this is skipped entirely rather than removed: a plain re-run
  // (release checklist step 5) must not silently un-wire someone's working opt-in.
  // Removing it is `--uninstall`, which is explicit in the other direction.
  const hadPanes = JSON.stringify(s.hooks.Stop || []).includes("close-finished-panes.mjs");
  if (panes || uninstall) setEvent(s.hooks, "Stop", cmd("close-finished-panes.mjs"));
  writeJson(p, s);
  const paneNote = panes ? " x2 (+pane hygiene)" : hadPanes ? " x2 (pane hygiene kept)" : "";
  report.push(["claude", `SessionEnd, PreCompact, Stop${paneNote}`, p]);
}

// ---- codex ---------------------------------------------------------------
// Codex has no SessionEnd and no Stop. SessionStart catches up the *previous*
// session, which is why the emitter is watermark-based rather than per-session.
function codex() {
  const p = join(homedir(), ".codex", "hooks.json");
  if (!existsSync(dirname(p))) return;
  const s = readJson(p, { hooks: {} });
  s.hooks ??= {};
  backup(p);
  setEvent(s.hooks, "SessionStart", cmd("catch-up.mjs", "--brand codex"), 20);
  setEvent(s.hooks, "PreCompact", cmd("catch-up.mjs", "--brand codex"), 20);
  writeJson(p, s);
  report.push(["codex", "SessionStart, PreCompact", p]);
}

// ---- gemini --------------------------------------------------------------
// Gemini namespaces hook sets by owner at the top level, so this writes under
// "office-skills" and never touches another owner's block.
function gemini() {
  const p = join(homedir(), ".gemini", "config", "hooks.json");
  if (!existsSync(join(homedir(), ".gemini"))) return;
  const s = readJson(p, {});
  s["office-skills"] ??= {};
  backup(p);
  setEvent(s["office-skills"], "SessionEnd", cmd("catch-up.mjs", "--brand gemini"), 20);
  setEvent(s["office-skills"], "Stop", cmd("catch-up.mjs", "--brand gemini"), 20);
  const hadPanes = JSON.stringify(s["office-skills"].Stop || []).includes("close-finished-panes.mjs");
  if (panes || uninstall) setEvent(s["office-skills"], "Stop", cmd("close-finished-panes.mjs"), 20);
  if (!Object.keys(s["office-skills"]).length) delete s["office-skills"];
  writeJson(p, s);
  report.push(["gemini", `SessionEnd, Stop${panes ? " x2 (+pane hygiene)" : hadPanes ? " x2 (pane hygiene kept)" : ""}`, p]);
}

// ---- hermes --------------------------------------------------------------
// YAML, so this goes through python3 rather than a hand-rolled emitter.
function hermes() {
  // Hermes reads the ACTIVE PROFILE's config, not ~/.hermes/config.yaml. Writing
  // to the root file installs nothing and reports success — verified: `hermes
  // hooks list` ignored a hook that had been sitting in the root config.
  const root = join(homedir(), ".hermes");
  let p = join(root, "config.yaml");
  try {
    const active = readFileSync(join(root, "active_profile"), "utf8").trim();
    const profileCfg = join(root, "profiles", active, "config.yaml");
    if (active && existsSync(profileCfg)) p = profileCfg;
  } catch { /* no active profile: the root config is the live one */ }
  if (!existsSync(p)) return;
  const script = `
import sys, shutil, yaml
p = ${JSON.stringify(p)}
cmd = ${JSON.stringify(cmd("catch-up.mjs", "--brand hermes"))}
remove = ${uninstall ? "True" : "False"}
shutil.copyfile(p, p + ".bak")
d = yaml.safe_load(open(p)) or {}
hooks = d.get("hooks") or {}
for event in ("on_session_end", "on_session_finalize"):
    entries = [e for e in (hooks.get(event) or []) if "catch-up.mjs" not in str(e.get("command", ""))]
    if not remove:
        entries.append({"matcher": "*", "command": cmd, "timeout": 20})
    if entries:
        hooks[event] = entries
    else:
        hooks.pop(event, None)
if hooks:
    d["hooks"] = hooks
else:
    d.pop("hooks", None)
yaml.safe_dump(d, open(p, "w"), sort_keys=True, default_flow_style=False)
print("ok")
`;
  // node's PATH is not the shell's: /usr/bin/python3 ships without PyYAML on
  // macOS while the Homebrew one has it. Probe rather than assume, and refuse
  // to touch the file if none can parse YAML — a half-written config.yaml is
  // worse than an uninstalled hook.
  const py = ["/opt/homebrew/bin/python3", "/usr/local/bin/python3", "python3", "/usr/bin/python3"]
    .find((c) => {
      try { execFileSync(c, ["-c", "import yaml"], { stdio: "ignore" }); return true; }
      catch { return false; }
    });
  if (!py) {
    report.push(["hermes", "SKIPPED: no python3 with PyYAML (pip install pyyaml)", p]);
    return;
  }
  try {
    execFileSync(py, ["-c", script], { encoding: "utf8" });
    report.push(["hermes", "on_session_end, on_session_finalize", p]);
  } catch (e) {
    report.push(["hermes", `FAILED: ${String(e.message).split("\n")[0]}`, p]);
  }
}

const all = { claude, codex, gemini, hermes };
for (const [brand, fn] of Object.entries(all)) {
  if (only && !only.includes(brand)) continue;
  try { fn(); } catch (e) { report.push([brand, `FAILED: ${e.message}`, ""]); }
}

console.log(uninstall ? "removed:" : "installed:");
for (const [brand, events, path] of report) console.log(`  ${brand.padEnd(7)} ${events.padEnd(38)} ${path}`);
if (!report.length) console.log("  (no matching harness found)");

// Offer, once, and only where Herdr exists. Silence everywhere else: a machine
// with no Herdr has no pane to close and does not need to know this option is here.
if (herdrPresent && !wantPanes && !uninstall) {
  console.log("");
  console.log("Herdr detected. Pane hygiene is opt-in and was not installed or removed by this run:");
  console.log("  node eval/hooks/install.mjs --with-pane-hygiene");
  console.log("It closes the panes of finished delegates from /tmp/office/panes.jsonl on Stop.");
  console.log("See office-core/skills/herdr/SKILL.md for what it will and will not close.");
}
if (wantPanes && !herdrPresent) {
  console.log("");
  console.log("--with-pane-hygiene ignored: no herdr on PATH and HERDR_ENV is not 1.");
}
