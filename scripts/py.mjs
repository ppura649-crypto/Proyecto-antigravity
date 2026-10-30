#!/usr/bin/env node
// py.mjs <script.py> [args...]   |   py.mjs --ensure
// Contract: runs a pack's Python script with the packages that script imports, and nothing else. Reads the script's
//   own imports, maps the few that are not the standard library to their package, and runs it through uv, which
//   resolves them, caches them per machine and fetches a Python when the machine has none. Installs uv itself the
//   first time, with no password and no admin. Forwards the script's output and its exit code unchanged.
//   `--ensure` installs uv and stops, which is what doctor's fix runs.
//
//   Why not a virtual environment in the folder: one shipped with the zip for a while. It was 158 MB, it was built
//   for one machine's processor and operating system, so it could not run anywhere else, and nothing pointed at it,
//   so the documented command failed even on the machine that made it. The packages belong to the machine, not to
//   the pack, and only the script that needs them should pay for them: nine of the sixteen Python scripts here
//   import nothing outside the standard library and now install nothing at all.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, delimiter } from "node:path";
import { homedir } from "node:os";
import { P, fail, which, ffbin } from "./_lib.mjs";

// The only imports in any pack that are not the standard library. A module missing from this map is a stdlib module
// or a file sitting next to the script, and either way there is nothing to install.
const PACKAGE = { cv2: "opencv-python-headless", numpy: "numpy", PIL: "pillow", librosa: "librosa", scipy: "scipy", matplotlib: "matplotlib" };

const args = process.argv.slice(2);
const ensureOnly = args[0] === "--ensure";
const script = ensureOnly ? null : args[0];
if (!ensureOnly && !script) fail("usage: py.mjs <script.py> [args...]   |   py.mjs --ensure");

// uv is one static binary in the user's own directory. Installing it is the agent's work, not the buyer's: no
// password, no admin, no Homebrew, no Microsoft Store, on every platform the packs run on.
function uvPath() {
  const found = which("uv");
  if (found) return found;
  const local = join(homedir(), ".local", "bin", process.platform === "win32" ? "uv.exe" : "uv");
  return existsSync(local) ? local : null;
}

function installUv() {
  const [cmd, cmdArgs] = process.platform === "win32"
    ? ["powershell", ["-ExecutionPolicy", "ByPass", "-c", "irm https://astral.sh/uv/install.ps1 | iex"]]
    : ["sh", ["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"]];
  console.log("installing the Python runner, once");
  spawnSync(cmd, cmdArgs, { stdio: "inherit" });
  const uv = uvPath();
  if (!uv) fail("could not install uv from https://astral.sh/uv. Check the network, then run this again");
  return uv;
}

const uv = uvPath() ?? installUv();
if (ensureOnly) { console.log(JSON.stringify({ ok: true, uv })); process.exit(0); }

const file = existsSync(script) ? script : P(script);
if (!existsSync(file)) fail(`${script} does not exist`);

// What this one script imports, in the order the file states them, deduplicated.
const source = readFileSync(file, "utf8");
const modules = new Set([...source.matchAll(/^\s*(?:import|from)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]));
const need = [...modules].filter((m) => PACKAGE[m]).map((m) => PACKAGE[m]);

// The ffmpeg this folder actually has, handed to the script. A Python step that calls `ffmpeg` by name finds it
// only when it is on the PATH, and the ffmpeg these packs rely on is usually the full build that came with the
// packages, which is not. So its folder goes on the front of the child's PATH and its path is named outright,
// which is what the scripts reading FFMPEG and FFPROBE expect. Nothing is installed and nothing global changes.
function ffEnv() {
  const env = { ...process.env };
  const dirs = new Set();
  for (const [name, key] of [["ffmpeg", "FFMPEG"], ["ffprobe", "FFPROBE"]]) {
    const bin = ffbin(name);
    if (!bin) continue;
    if (!env[key]) env[key] = bin;
    dirs.add(dirname(bin));
  }
  if (dirs.size) env.PATH = [...dirs, env.PATH ?? ""].filter(Boolean).join(delimiter);
  // Every script was written on a Mac, where a text file is UTF-8. Windows reads it in its own code page and stops at
  // the first emoji of a caption, so the child reads and writes UTF-8 here too. A Mac is already UTF-8: nothing changes.
  if (!env.PYTHONUTF8) env.PYTHONUTF8 = "1";
  return env;
}

// --no-project so a stray pyproject.toml anywhere above the folder cannot change what runs.
const run = spawnSync(uv, ["run", "--quiet", "--no-project", ...need.flatMap((p) => ["--with", p]), "python", file, ...args.slice(1)], { stdio: "inherit", env: ffEnv() });
process.exit(run.status ?? 1);
