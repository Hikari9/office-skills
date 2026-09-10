#!/usr/bin/env node
/**
 * Stop hook, `async: true`. Delivers the `/compact` that `compact-advisor.mjs`
 * decided on, to the Herdr pane this session is running in.
 *
 * Why a courier and not the advisor: no hook can run a slash command, and the
 * `SlashCommand` tool excludes built-ins like `/compact`, so the command has to
 * arrive as **pane input**. `herdr agent prompt` is that path. But the pane's
 * Herdr status still reads `working` while its own Stop hook runs, so delivery
 * has to outlive the turn — which a synchronous hook cannot do without blocking
 * the session on itself. Hence: advisor decides inside the turn, courier
 * delivers outside it.
 *
 * Why this is allowed to address its own pane: `office-core/skills/herdr/SKILL.md`
 * forbids a *model process* prompting its own agent name inline. This is a
 * detached hook process, the same external-driver position the compact-police
 * helper occupies.
 *
 * Scope, deliberately narrow:
 *   - Only a session recorded in the pane ledger. A human's own session is not in
 *     it, so nothing is ever sent to a pane the office did not spawn: they get
 *     the advisor's `systemMessage` and decide for themselves.
 *   - Only Herdr kinds `claude` and `codex`. Agy has no interactive `/compact`.
 *   - Only at `idle` or `done`. `working` or `blocked` leaves the request in
 *     place for the next boundary.
 *
 * Contract, same as the other hooks: never blocks, exits 0 on any internal
 * error, prints nothing when it delivered nothing.
 */
import { existsSync, readFileSync, unlinkSync, appendFileSync, mkdirSync, rmdirSync, statSync, accessSync, constants, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, delimiter } from "node:path";
import { randomUUID } from "node:crypto";
import { boundaryKey } from "./compact-boundary.mjs";

const SINK = process.env.OFFICE_TELEMETRY_DIR || join(homedir(), ".claude", "office-skills-telemetry");
const LEDGER = process.env.OFFICE_PANE_LEDGER || join("/tmp", "office", "panes.jsonl");
const READY = new Set(["idle", "done"]);
const SUPPORTED = new Set(["claude", "codex"]);
// The pane is still finishing its turn when this starts. Poll rather than assume.
const SETTLE_MS = Number(process.env.OFFICE_COMPACT_SETTLE_MS || 30000);
const POLL_MS = 2000;
const HANDSHAKE_MS = Number(process.env.OFFICE_COMPACT_HANDSHAKE_MS || 2000);
const HANDSHAKE_POLL_MS = 25;
const LOCK_STALE_MS = 5 * 60 * 1000;

const onPath = (bin) => {
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (!dir) continue;
    try { accessSync(join(dir, bin), constants.X_OK); return true; } catch { /* keep looking */ }
  }
  return false;
};

/** Failures exit 1 with the `{"error":{...}}` body on stderr, so read both streams. */
const herdr = (args) => {
  const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  try {
    return parse(execFileSync("herdr", args, { encoding: "utf8", timeout: 8000, stdio: ["ignore", "pipe", "pipe"] }));
  } catch (e) {
    return parse(e?.stdout || "") || parse(e?.stderr || "") || null;
  }
};

const drainStdin = () =>
  new Promise((res) => {
    let b = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (b += c));
    process.stdin.on("end", () => res(b));
    process.stdin.on("error", () => res(b));
    setTimeout(() => res(b), 2000).unref();
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const json = (path) => {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
};

const ownsBoundary = (state, req, key) => Boolean(
  state && req
  && state.boundary_key === key
  && req.boundary_key === key
  && state.boundary_seq === req.boundary_seq
  && state.verdict === "yes"
  && state.auto_authorized === true
  && req.auto_authorized === true
);

const acquireLock = (candidate) => {
  try {
    mkdirSync(candidate, { recursive: false });
    return true;
  } catch (e) {
    if (e?.code !== "EEXIST") return false;
  }

  let age;
  try { age = Date.now() - statSync(candidate).mtimeMs; } catch { return false; }
  if (age < LOCK_STALE_MS) return false;

  // A stale lock cannot be adopted by assignment: two couriers can both do
  // that. Rename is atomic on the same filesystem, so only one courier can
  // quarantine the stale directory and then reacquire the canonical name.
  const tombstone = `${candidate}.stale-${process.pid}-${randomUUID()}`;
  try { renameSync(candidate, tombstone); } catch { return false; }
  try { rmdirSync(tombstone); } catch { return false; }
  try {
    mkdirSync(candidate, { recursive: false });
    return true;
  } catch {
    return false;
  }
};

let lock = null;
let delivered = null;

/**
 * `process.exit()` does not run `finally`, so every early exit after the lock is
 * taken would leak it and block the next boundary's retry for LOCK_STALE_MS.
 * The whole flow therefore lives in a function and returns.
 */
const run = async () => {
  const input = JSON.parse((await drainStdin()) || "{}");
  const session = input.session_id;
  if (!session) return;

  const request = join(SINK, "compact-request", `${session}.json`);
  if (!onPath("herdr")) return;
  if (!existsSync(LEDGER)) return;

  const key = boundaryKey(input);
  const stateFile = join(SINK, "compact-state", `${session}.json`);
  // Registration order is not a contract. Wait for the advisor's state for
  // this exact boundary, including the no case, before looking at a request.
  let state = null;
  for (let waited = 0; waited <= HANDSHAKE_MS; waited += HANDSHAKE_POLL_MS) {
    state = json(stateFile);
    if (state?.boundary_key === key) break;
    if (waited + HANDSHAKE_POLL_MS <= HANDSHAKE_MS) await sleep(HANDSHAKE_POLL_MS);
  }
  const reqBeforeLock = json(request);
  if (!ownsBoundary(state, reqBeforeLock, key)) return;

  // One courier per session. mkdir is the atomic primitive available everywhere;
  // a lock older than LOCK_STALE_MS belonged to a process that died mid-delivery.
  const candidate = join(SINK, "compact-request", `${session}.lock`);
  if (!acquireLock(candidate)) return;
  lock = candidate;

  const req = json(request);
  state = json(stateFile);
  if (!ownsBoundary(state, req, key)) return;

  // Which pane is this session? The ledger is the only mapping, and the last
  // entry wins: a session restored into a fresh pane appends a newer line.
  let entry = null;
  for (const line of readFileSync(LEDGER, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e?.session_id === session && (e?.agent || e?.name)) entry = e;
  }
  if (!entry) return;                     // not an office-spawned pane: not ours to compact
  const name = entry.agent || entry.name;
  if (!SUPPORTED.has(entry.kind)) return;

  // Wait for the pane's own turn to land. Its status reads `working` until then,
  // and this hook is detached from that turn, so waiting costs the session nothing.
  let status = null;
  for (let waited = 0; waited <= SETTLE_MS; waited += POLL_MS) {
    const res = herdr(["agent", "get", name]);
    if (res?.error?.code === "agent_not_found") { status = "gone"; break; }
    status = res?.result?.agent?.agent_status || null;
    if (status && READY.has(status)) break;
    // `blocked` is a question for a human. It will not settle inside this
    // window, so stop polling for it rather than burning the full 30s.
    if (status === "blocked") break;
    if (waited + POLL_MS <= SETTLE_MS) await sleep(POLL_MS);
  }
  // Not ready, gone, or unreadable: leave the request for the next boundary. The
  // advisor only rewrites it after the verdict has been a `no` in between, so a
  // still-true `yes` is not lost.
  if (!status || !READY.has(status)) return;

  // A later boundary can invalidate the request while the courier is settling.
  // Recheck the version immediately before prompting, not just before waiting.
  state = json(stateFile);
  const latestReq = json(request);
  if (!ownsBoundary(state, latestReq, key)) return;

  const keep = req.keep || "the plan, current brief, handoff/state files, and the next task";
  const prompt =
    `/compact Keep ${keep}. Drop stale tool output. First action after compaction: ` +
    `re-read the current brief, handoff/state files, and plan before acting.`;

  // `--wait --until working --timeout 20000` is the supported machine-checkable
  // receipt primitive. CLI acceptance alone is not proof that the prompt landed.
  const res = herdr(["agent", "prompt", name, prompt, "--wait", "--until", "working", "--timeout", "20000"]);
  const received = res?.result?.agent?.agent_status === "working";
  if (!received) return;                  // request stays, retry next boundary

  state = json(stateFile);
  const afterReceipt = json(request);
  if (!ownsBoundary(state, afterReceipt, key)) return;

  unlinkSync(request);
  delivered = { name, kind: entry.kind, pane: entry.pane_id || null, driver: req.driver || null };

  try {
    mkdirSync(SINK, { recursive: true });
    appendFileSync(
      join(SINK, "run-events.jsonl"),
      JSON.stringify({
        event: "compact.delivered",
        source: "compact-courier-hook",
        timestamp: new Date().toISOString(),
        session_id: session,
        agent: name,
        kind: entry.kind,
        pane_id: entry.pane_id || null,
        held: req.held ?? null,
        pct: req.pct ?? null,
        driver: req.driver || null,
      }) + "\n"
    );
  } catch { /* the compaction happened whether or not it was logged */ }
};

try {
  await run();
} catch {
  // Swallow. See contract above.
} finally {
  if (lock) { try { rmdirSync(lock); } catch { /* nothing to release */ } }
}

// Delivered `/compact` is not proof of compaction: confirm from the pane's own
// compaction sequence and its context reading dropping, never from a status.
if (delivered) {
  process.stdout.write(
    JSON.stringify({
      systemMessage: `compact delivered to ${delivered.kind} pane ${delivered.name}${delivered.pane ? ` (${delivered.pane})` : ""} — confirm from the pane's compaction sequence, not its status`,
    }) + "\n"
  );
}
process.exit(0);
