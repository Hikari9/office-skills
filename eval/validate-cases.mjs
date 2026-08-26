#!/usr/bin/env node
/**
 * Structural check on the eval cases. Not a substitute for running them — it
 * catches the failures that would otherwise burn a CI run and an API bill to
 * discover: a malformed file, a missing prompt, criteria that are not a list.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The action requires cases at <skill-path>/evals/, so that is where they live.
const files = [];
for (const office of readdirSync(root)) {
  const dir = join(root, office, "evals");
  let st; try { st = statSync(dir); } catch { continue; }
  if (!st.isDirectory()) continue;
  for (const f of readdirSync(dir)) if (f.endsWith(".yaml")) files.push(join(dir, f));
}

let bad = 0;
let negatives = 0;
const perOffice = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const rel = f.slice(root.length + 1);
  const problems = [];
  if (!/^name:\s*\S/m.test(src)) problems.push("missing `name`");
  if (!/^prompt:\s*\S/m.test(src)) problems.push("missing `prompt`");
  if (!/^criteria:\s*$/m.test(src)) problems.push("missing `criteria` list");
  else if (!/^\s+-\s+\S/m.test(src.slice(src.indexOf("criteria:")))) problems.push("empty `criteria`");
  const office = rel.split("/")[0];
  if (!perOffice.has(office)) perOffice.set(office, 0);
  if (/^expect_skill:\s*false/m.test(src)) { negatives++; perOffice.set(office, perOffice.get(office) + 1); }
  if (problems.length) { bad++; console.error(`FAIL ${rel}: ${problems.join(", ")}`); }
}

console.log(`${files.length} cases, ${negatives} negative controls, ${bad} malformed`);
for (const [office, n] of perOffice) {
  if (n === 0) { console.error(`FAIL ${office}: no \`expect_skill: false\` control — nothing tests over-triggering`); bad++; }
}
process.exit(bad ? 1 : 0);
