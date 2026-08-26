/** Brand registry. Every adapter returns the same {session, skills} shape. */
import * as claude from "./claude.mjs";
import * as codex from "./codex.mjs";
import * as gemini from "./gemini.mjs";
import * as hermes from "./hermes.mjs";

export const ADAPTERS = { claude, codex, gemini, hermes };
export const BRANDS = Object.keys(ADAPTERS);
export const adapterFor = (brand) => ADAPTERS[brand] || null;
