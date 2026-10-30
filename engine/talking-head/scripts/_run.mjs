// _run.mjs: what the Node steps of the engine share. No contract; imported only.
// Goal: the same steps run on macOS, Windows and Linux with no shell of their own. Two answers live here once:
//   which ffmpeg and ffprobe (the folder's own answer, runtime scripts/_lib.mjs ffbin and ffenv, so a step finds the
//   same program the rest of the folder uses), and how a Python script runs (the folder's scripts/py.mjs, which
//   needs no python3 on the PATH; on Windows that name is often a store stub or missing).
// Outside a Keyframes folder (no scripts/py.mjs above the engine) both fall back to the names on the PATH.
import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));

// The Keyframes folder: engine/talking-head/scripts sits three levels under it, with the runtime in scripts/.
// The build folder keeps the runtime in runtime/scripts/ instead.
function findRoot() {
  let dir = HERE;
  for (let i = 0; i < 6; i++) {
    for (const lib of ["scripts", "runtime/scripts"]) {
      if (existsSync(join(dir, lib, "py.mjs")) && existsSync(join(dir, lib, "_lib.mjs"))) return { root: dir, lib: join(dir, lib) };
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
export const FOLDER = findRoot();

// _lib.mjs resolves its paths from the working directory it was loaded in, so it is loaded from the folder root.
let lib = null;
if (FOLDER) {
  const cwd = process.cwd();
  try { process.chdir(FOLDER.root); lib = await import(pathToFileURL(join(FOLDER.lib, "_lib.mjs")).href); }
  catch { lib = null; }
  finally { process.chdir(cwd); }
}

// FFMPEG and FFPROBE, when set, win: py.mjs hands them to every Python step and a person may set them on purpose.
export function ff(name) {
  const key = name.toUpperCase();
  if (process.env[key]) return process.env[key];
  return (lib && lib.ffbin(name)) || name;
}
export function ffEnv(bin) {
  return lib && /[\\/]/.test(bin) ? lib.ffenv(bin) : process.env;
}
// Runs ffmpeg or ffprobe. Same options as spawnSync; the loader path the shipped copy needs is added.
export function runFf(name, args, opts = {}) {
  const bin = ff(name);
  return spawnSync(bin, args, { maxBuffer: 512 * 1024 * 1024, ...opts, env: { ...ffEnv(bin), ...(opts.env ?? {}) } });
}

// The environment a Python step gets: the same ffmpeg by name (the engine's Python calls `ffmpeg` bare) and by path.
function pyEnv() {
  const env = { ...process.env };
  const dirs = [];
  for (const name of ["ffmpeg", "ffprobe"]) {
    const bin = ff(name);
    if (!/[\\/]/.test(bin)) continue;
    env[name.toUpperCase()] = bin;
    Object.assign(env, Object.fromEntries(Object.entries(ffEnv(bin)).filter(([k]) => /LIBRARY_PATH$/.test(k))));
    if (!dirs.includes(dirname(bin))) dirs.push(dirname(bin));
  }
  if (dirs.length) env.PATH = [...dirs, env.PATH ?? ""].filter(Boolean).join(delimiter);
  return env;
}
// Runs a Python script: through the folder's py.mjs when there is one, else the interpreter on the PATH.
// Same options as spawnSync (stdio, encoding, cwd); returns its result.
export function python(script, args = [], opts = {}) {
  const file = resolve(script);
  const env = { ...pyEnv(), ...(opts.env ?? {}) };
  if (FOLDER) return spawnSync(process.execPath, [join(FOLDER.lib, "py.mjs"), file, ...args], { maxBuffer: 256 * 1024 * 1024, ...opts, env });
  return spawnSync(process.platform === "win32" ? "python" : "python3", [file, ...args], { maxBuffer: 256 * 1024 * 1024, ...opts, env });
}

// `cd "$1" && pwd`: the folder as an absolute path, or null when it is not a folder.
export function folder(arg) {
  const p = resolve(String(arg ?? ""));
  try { return arg && statSync(p).isDirectory() ? p : null; } catch { return null; }
}

// sed -n '/{/,/}/p': every line from one holding "{" through the next holding "}".
export function sedRange(text, open = /\{/, close = /\}/) {
  const out = []; let inside = false;
  for (const line of splitLines(text)) {
    if (!inside) { if (open.test(line)) { out.push(line); inside = true; } }
    else { out.push(line); if (close.test(line)) inside = false; }
  }
  return out;
}
// grep -A<n> <re>: each matching line and the n after it, once each, in order.
export function grepAfter(text, re, n) {
  const lines = splitLines(text), keep = new Set();
  lines.forEach((l, i) => { if (re.test(l)) for (let k = i; k <= i + n && k < lines.length; k++) keep.add(k); });
  return [...keep].sort((a, b) => a - b).map((i) => lines[i]);
}
function splitLines(text) {
  const lines = String(text).split("\n");
  if (lines.length && lines.at(-1) === "") lines.pop();
  return lines;
}

// JSON as Python reads it, for the few messages that print a value the way Python would.
// Numbers keep the literal they were written with (4.0 stays a float, as json.loads keeps it).
export function parsePy(text) {
  return JSON.parse(text, function (key, value, ctx) {
    if (typeof value === "number" && ctx && typeof ctx.source === "string" && /[.eE]/.test(ctx.source)) return new PyFloat(value);
    return value;
  });
}
export class PyFloat { constructor(v) { this.v = v; } valueOf() { return this.v; } }
// str(value) in Python.
export function pyStr(v) {
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (v instanceof PyFloat) return pyFloat(v.v);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return pyRepr(v);
}
// repr(value) in Python.
export function pyRepr(v) {
  if (typeof v === "string") return v.includes("'") && !v.includes('"') ? `"${v}"` : `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  if (v && typeof v === "object" && !(v instanceof PyFloat)) return `{${Object.entries(v).map(([k, x]) => `${pyRepr(k)}: ${pyRepr(x)}`).join(", ")}}`;
  return pyStr(v);
}
function pyFloat(n) {
  if (!Number.isFinite(n)) return n > 0 ? "inf" : n < 0 ? "-inf" : "nan";
  const s = String(n);
  return Number.isInteger(n) && Math.abs(n) < 1e16 ? `${s}.0` : s;
}
// Python's truthiness, for `if r and ...`.
export function pyTrue(v) {
  if (v instanceof PyFloat) return v.v !== 0;
  if (Array.isArray(v) || typeof v === "string") return v.length > 0;
  if (v && typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}
