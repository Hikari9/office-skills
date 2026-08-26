#!/usr/bin/env node
/** Idempotently adds the SessionEnd telemetry hook to ~/.claude/settings.json. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hook = resolve(here, "session-end.mjs");
const cmd = `node ${hook}`;
const settingsPath = join(homedir(), ".claude", "settings.json");

const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, "utf8"))
  : {};

settings.hooks ??= {};
settings.hooks.SessionEnd ??= [];

const already = JSON.stringify(settings.hooks.SessionEnd).includes("session-end.mjs");
if (already) {
  console.log("already installed");
  process.exit(0);
}

if (existsSync(settingsPath)) copyFileSync(settingsPath, settingsPath + ".bak");
settings.hooks.SessionEnd.push({ hooks: [{ type: "command", command: cmd }] });
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
console.log(`installed SessionEnd hook (backup at ${settingsPath}.bak)`);
