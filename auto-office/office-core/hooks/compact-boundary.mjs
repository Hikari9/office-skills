import { createHash } from "node:crypto";
import { statSync } from "node:fs";

const stable = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
};

const transcriptStamp = (path) => {
  if (!path) return null;
  try {
    const s = statSync(path);
    return {
      size: s.size,
      mtime_ms: s.mtimeMs,
      mtime_ns: s.mtimeNs?.toString() || null,
    };
  } catch {
    return null;
  }
};

/**
 * A Stop hook does not promise registration order. Both hooks derive this key
 * from the same event payload and transcript stamp, so the courier can wait
 * for the advisor's state for this exact boundary instead of consuming a
 * request left by an earlier boundary.
 */
export const boundaryKey = (input = {}) => {
  const material = {
    session_id: input.session_id || null,
    transcript_path: input.transcript_path || null,
    cwd: input.cwd || null,
    last_assistant_message: input.last_assistant_message || null,
    transcript: transcriptStamp(input.transcript_path),
  };
  return createHash("sha256").update(stable(material)).digest("hex").slice(0, 32);
};
