#!/usr/bin/env node
import assert from "node:assert/strict";
import { once } from "node:events";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const advisor = join(root, "office-core/hooks/compact-advisor.mjs");
const courier = join(root, "office-core/hooks/compact-courier.mjs");
const install = join(root, "eval/hooks/install.mjs");

const sandbox = mkdtempSync(join(tmpdir(), "compact-hook-tests-"));
const sink = join(sandbox, "telemetry");
const bin = join(sandbox, "bin");
const ledger = join(sandbox, "panes.jsonl");
mkdirSync(bin, { recursive: true });

const herdrStub = join(bin, "herdr");
writeFileSync(herdrStub, `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
const [, , group, action, name, ...rest] = process.argv;
const log = process.env.HERDR_LOG;
if (group !== "agent") process.stdout.write(JSON.stringify({ result: {} }));
else if (action === "get") process.stdout.write(JSON.stringify({ result: { agent: { agent_status: process.env.HERDR_GET_STATUS || "idle", pane_id: "pane-test" } } }));
else if (action === "prompt") {
  if (log) appendFileSync(log, JSON.stringify({ action, name, args: rest }) + "\\n");
  const ms = Number(process.env.HERDR_PROMPT_SLEEP_MS || 0);
  if (ms) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  process.stdout.write(JSON.stringify({ result: { agent: { agent_status: process.env.HERDR_PROMPT_STATUS || "working" } } }));
}
`);
chmodSync(herdrStub, 0o755);

const env = (extra = {}) => ({
  ...process.env,
  PATH: `${bin}:${process.env.PATH || ""}`,
  OFFICE_TELEMETRY_DIR: sink,
  OFFICE_PANE_LEDGER: ledger,
  OFFICE_COMPACT_HANDSHAKE_MS: "500",
  OFFICE_COMPACT_SETTLE_MS: "0",
  HERDR_LOG: join(sandbox, "herdr.log"),
  ...extra,
});

const run = (script, input, extra = {}) => {
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: env(extra),
    timeout: 10000,
  });
  assert.equal(result.error, undefined, `${script} did not run: ${result.error?.message || "unknown error"}`);
  assert.equal(result.status, 0, `${script} exited ${result.status}: ${result.stderr}`);
  return result;
};

const spawnCourier = (input, extra = {}) => {
  const child = spawn(process.execPath, [courier], { env: env(extra) });
  child.stdin.end(JSON.stringify(input));
  return child;
};

const pane = (session) => {
  writeFileSync(ledger, JSON.stringify({
    session_id: session,
    agent: `agent-${session}`,
    kind: "claude",
    pane_id: "pane-test",
  }) + "\n", { flag: "a" });
};

const inputFor = (session, {
  held = 80_000,
  text = "State is written to state.md\nCOMPACT-SAFE: yes",
  contextWindow,
  model = "claude-sonnet",
  summary = false,
  afterSummaryHeld,
} = {}) => {
  const cwd = join(sandbox, session);
  mkdirSync(cwd, { recursive: true });
  const statePath = join(cwd, "state.md");
  writeFileSync(statePath, "current state\n");
  const transcript = join(cwd, "transcript.jsonl");
  const lines = [];
  if (summary) {
    lines.push(JSON.stringify({ isCompactSummary: true }));
    lines.push(JSON.stringify({
      type: "assistant",
      message: {
        model,
        usage: { input_tokens: afterSummaryHeld },
        content: [{ type: "text", text }],
      },
    }));
  } else {
    lines.push(JSON.stringify({
      type: "assistant",
      message: {
        model,
        usage: { input_tokens: held },
        content: [{ type: "text", text }],
      },
    }));
  }
  writeFileSync(transcript, lines.join("\n") + "\n");
  return {
    session_id: session,
    cwd,
    transcript_path: transcript,
    last_assistant_message: text,
    ...(contextWindow ? { context_window_tokens: contextWindow } : {}),
  };
};

const stateFor = (session) => JSON.parse(readFileSync(join(sink, "compact-state", `${session}.json`), "utf8"));
const requestFor = (session) => join(sink, "compact-request", `${session}.json`);
const promptCalls = () => existsSync(env().HERDR_LOG) ? readFileSync(env().HERDR_LOG, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];

try {
  // The installer keeps the advisor/courier as separate hooks but the runtime
  // handshake, rather than registration order, supplies their causal edge.
  const home = join(sandbox, "home");
  mkdirSync(join(home, ".claude"), { recursive: true });
  const installed = spawnSync(process.execPath, [install, "--brand", "claude", "--with-auto-compact"], {
    encoding: "utf8",
    env: { ...env(), HOME: home, HERDR_ENV: "1" },
  });
  assert.equal(installed.status, 0, installed.stderr);
  const settings = JSON.parse(readFileSync(join(home, ".claude/settings.json"), "utf8"));
  const stopHooks = (settings.hooks.Stop || []).flatMap((g) => g.hooks || []);
  assert.equal(stopHooks.some((h) => h.command.includes("compact-advisor.mjs")), true);
  assert.equal(stopHooks.some((h) => h.command.includes("compact-courier.mjs") && h.async === true), true);

  // 1. Courier-first invocation waits for the advisor's same-boundary state.
  const ordered = inputFor("ordered", { contextWindow: 200_000 });
  pane("ordered");
  const first = spawnCourier(ordered);
  await new Promise((resolve) => setTimeout(resolve, 75));
  run(advisor, ordered);
  const [firstCode] = await once(first, "close");
  assert.equal(firstCode, 0);
  assert.equal(existsSync(requestFor("ordered")), false);
  assert.equal(promptCalls().filter((x) => x.name === "agent-ordered").length, 1);

  // 2. A later no is authoritative and invalidates an undelivered yes.
  const stale = inputFor("stale", { contextWindow: 200_000 });
  pane("stale");
  run(advisor, stale);
  assert.equal(existsSync(requestFor("stale")), true);
  run(courier, stale, { HERDR_GET_STATUS: "blocked" });
  assert.equal(existsSync(requestFor("stale")), true);
  const staleNo = inputFor("stale", { held: 10_000, contextWindow: 200_000, text: "state.md is current" });
  run(advisor, staleNo);
  assert.equal(stateFor("stale").verdict, "no");
  assert.equal(existsSync(requestFor("stale")), false);

  // 3. All accumulators reset after a compaction summary.
  const reset = inputFor("reset", {
    held: 150_000,
    afterSummaryHeld: 20_000,
    contextWindow: 200_000,
    summary: true,
  });
  run(advisor, reset);
  const resetState = stateFor("reset");
  assert.equal(resetState.held, 20_000);
  assert.equal(resetState.verdict, "no");
  assert.equal(existsSync(requestFor("reset")), false);

  // 4. A yes without the explicit in-flight-reasoning authorization never queues.
  const unsafe = inputFor("unsafe", { contextWindow: 200_000, text: "state.md is current" });
  run(advisor, unsafe);
  assert.equal(stateFor("unsafe").verdict, "yes");
  assert.equal(stateFor("unsafe").auto_authorized, false);
  assert.equal(existsSync(requestFor("unsafe")), false);
  const safe = inputFor("unsafe", { contextWindow: 200_000, text: "state.md is current\nCOMPACT-SAFE: yes" });
  run(advisor, safe);
  assert.equal(stateFor("unsafe").auto_authorized, true);
  assert.equal(existsSync(requestFor("unsafe")), true);

  // 5. Stale-lock takeover is exclusive even when two couriers race.
  pane("lock");
  const locked = inputFor("lock", { contextWindow: 200_000 });
  run(advisor, locked);
  const lockPath = join(sink, "compact-request", "lock.lock");
  mkdirSync(lockPath, { recursive: true });
  const old = new Date(Date.now() - 6 * 60 * 1000);
  utimesSync(lockPath, old, old);
  const racers = [spawnCourier(locked, { HERDR_PROMPT_SLEEP_MS: "150" }), spawnCourier(locked, { HERDR_PROMPT_SLEEP_MS: "150" })];
  await Promise.all(racers.map((child) => once(child, "close")));
  assert.equal(promptCalls().filter((x) => x.name === "agent-lock").length, 1);

  // 6. Acceptance without the supported bounded receipt keeps the request.
  const receipt = inputFor("receipt", { contextWindow: 200_000 });
  pane("receipt");
  run(advisor, receipt);
  run(courier, receipt, { HERDR_PROMPT_STATUS: "idle" });
  assert.equal(existsSync(requestFor("receipt")), true);
  run(courier, receipt, { HERDR_PROMPT_STATUS: "working" });
  assert.equal(existsSync(requestFor("receipt")), false);
  const receiptCall = promptCalls().find((x) => x.name === "agent-receipt");
  assert.deepEqual(receiptCall.args.slice(-5), ["--wait", "--until", "working", "--timeout", "20000"]);

  // 7. Unknown 1M sessions below 190k use the conservative window; explicit
  // metadata still permits a standard 200k session to be evaluated normally.
  const unknownWindow = inputFor("unknown-window", { held: 150_000, model: "claude-opus-5" });
  run(advisor, unknownWindow, { OFFICE_CONTEXT_WINDOW: "", CLAUDE_CONTEXT_WINDOW: "" });
  const unknownState = stateFor("unknown-window");
  assert.equal(unknownState.window, 1_000_000);
  assert.equal(unknownState.window_source, "conservative-default");
  assert.equal(unknownState.verdict, "no");
  const metadataWindow = inputFor("metadata-window", { held: 80_000, contextWindow: 200_000 });
  run(advisor, metadataWindow);
  const metadataState = stateFor("metadata-window");
  assert.equal(metadataState.window, 200_000);
  assert.equal(metadataState.window_source, "metadata");

  // 8. The human-facing skill is session-scoped and cannot select a verdict
  // from another pane's interleaved global log.
  for (const plugin of ["auto-office", "agy-office", "codex-office"]) {
    const skill = readFileSync(join(root, plugin, "skills/compact-monitor/SKILL.md"), "utf8");
    assert.equal(skill.includes("compact-state"), true, `${plugin} lost session state lookup`);
    assert.equal(skill.includes("tail -3"), false, `${plugin} still reads the global log`);
    assert.equal(skill.includes("COMPACT-SAFE: yes"), true, `${plugin} lost safety authorization`);
  }

  console.log("compact hook tests: 9 scenarios passed");
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
