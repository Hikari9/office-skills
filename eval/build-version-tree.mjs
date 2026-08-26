#!/usr/bin/env node
// Writes eval/out/version-tree.json and eval/VERSION-TREE.md (reverse-chronological).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVersionTree, PLUGINS } from "./lib/version-tree.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const tree = buildVersionTree(repo);

mkdirSync(resolve(here, "out"), { recursive: true });
writeFileSync(resolve(here, "out/version-tree.json"), JSON.stringify(tree, null, 2));

const day = (iso) => iso.slice(0, 10);
const time = (iso) => iso.slice(11, 16);

const lines = [
  "# Version tree (reverse-chronological)",
  "",
  `Generated ${tree.generatedAt} at \`${tree.head}\` by \`eval/build-version-tree.mjs\`. Do not hand-edit.`,
  "",
  "The offices are symlinked live into `~/.claude/skills`, so the version in effect at any",
  "instant is this repo's working tree at that instant. Each row below opens an interval that",
  "closes when the next row up begins; a run's timestamp falls in exactly one.",
  "",
  "**The top row is current.** Rows below it are history — still worth learning from, but a",
  "score from them is a score of code that no longer exists.",
  "",
  "| # | Effective from | core | codex | claude | agy | auto | commit | moved |",
  "|---|---|---|---|---|---|---|---|---|",
];

tree.intervals.forEach((iv, i) => {
  const v = iv.versions;
  const mark = iv.is_current ? "**→**" : String(tree.intervals.length - i - 1);
  const cell = (x) => x ?? "—";
  lines.push(
    `| ${mark} | ${day(iv.effective_from)} ${time(iv.effective_from)} | ${cell(v.core)} | ${cell(v["codex-office"])} | ${cell(v["claude-office"])} | ${cell(v["agy-office"])} | ${cell(v["auto-office"])} | \`${iv.sha}\` | ${iv.changed.join(", ")} |`
  );
});

lines.push(
  "",
  "## Reading a boundary",
  "",
  "Attribution is stamped `firm` or `fuzzy`. A run inside 6 hours before a version bump is",
  "`fuzzy`: development happens in this working tree, so the newer content may already have",
  "been live and uncommitted when that run executed. Treat a fuzzy run as evidence about",
  "neither version rather than as evidence about the older one.",
  "",
  "Runs before " + day(tree.intervals.at(-1).effective_from) + " are labelled `pre-release`."
);

writeFileSync(resolve(here, "VERSION-TREE.md"), lines.join("\n") + "\n");
console.log(`${tree.intervals.length} version intervals -> eval/VERSION-TREE.md`);
console.log(`current: ${JSON.stringify(tree.intervals[0].versions)}`);
