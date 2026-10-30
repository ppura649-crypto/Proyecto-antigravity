#!/usr/bin/env node
// doctor.mjs [--json]
// Contract: prints one line per check ("ok", "warn" or "fix" with what to do), writes context/doctor.json
//   { at, checks: [ { name, status: "ok"|"warn"|"fix", detail, fix, cmd, who: "agent"|"you" } ], blocking: bool },
//   exits 1 when a blocking check fails. Never prints a key value; key checks are by name only.
//
//   `who` is the field that matters when any of this reaches a page. Almost every fix here is a
//   command, and a command is the agent's work: an agent is already running on this machine with a
//   shell, so printing "Run: npm install" and waiting is asking the buyer to do the one part they
//   bought their way out of. Only two things here are genuinely a person's: pasting a key they own,
//   and approving an account connection in their own browser. Anything marked "you" has to be one of
//   those, and anything else marked "you" is a bug.
//
//   `fix` and `cmd` split for the same reason. `fix` is the sentence, written for the buyer to hear:
//   it says what has to happen, never "Run this". `cmd` is the command, and it exists for the agent to
//   execute, not to print. The two were one string once, so every line read as an order handed back to
//   the person who paid not to type it.
import { existsSync, readdirSync, statSync, statfsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { P, readJson, writeJson, now, which, ffbin, ffFull, run, loadEnvNames, loadEnv, installedPacks } from "./_lib.mjs";
import { spawnSync } from "node:child_process";

import { checkAgentSkills } from './agent-skills.mjs';

const checks = [];
const add = (name, status, detail, fix = null, who = "agent", cmd = null) => checks.push({ name, status, detail, fix, who, cmd });

const [major, minor] = process.versions.node.split(".").map(Number);
major > 22 || (major === 22 && minor >= 12) ? add("node", "ok", `Node ${process.versions.node}`) : add("node", "fix", `Node ${process.versions.node} is too old`, "Node 22.12 or newer is needed", "agent", process.platform === "darwin" ? "brew install node" : process.platform === "win32" ? "winget install OpenJS.NodeJS.LTS" : "sudo apt install nodejs");

// Every listed dependency, not just remotion: a folder updated to a runtime that added packages (motion blur, 3D) still
// has remotion, and would pass while a film that imports the new ones fails to bundle.
const missingPkgs = Object.keys(readJson(P("package.json"), {}).dependencies ?? {}).filter((n) => !existsSync(P("node_modules", ...n.split("/"), "package.json")));
!missingPkgs.length ? add("packages", "ok", "packages installed") : add("packages", "fix", existsSync(P("node_modules", "remotion")) ? `packages missing: ${missingPkgs.join(", ")}` : "packages not installed", "the packages go in next", "agent", "npm install");

// The video editor is bundled here, from scripts/editor/ and every format's editor/<pack>/layers.tsx, the first time a
// video is opened. Building it now (only when a file changed) means a broken layer or a missing package is found and
// fixed by the agent before anyone clicks Edit. Its packages come with the others, so without them there is nothing to try.
if (existsSync(P("node_modules", "remotion"))) {
  try {
    const { buildEditor } = await import("./edit-build.mjs");
    const built = await buildEditor(P());
    add("editor", "ok", `video editor ready${built.layers.length ? ` (${built.layers.length} format${built.layers.length === 1 ? "" : "s"})` : ""}`);
  } catch (error) {
    const message = String(error?.errors?.[0]?.text ?? error?.message ?? error).split("\n")[0];
    const packagesMissing = /Cannot find (package|module) '(esbuild|react|react-dom|@remotion\/player)'|Could not resolve "(react|react-dom|@remotion\/player|remotion)/.test(message);
    add("editor", "fix", `the video editor does not build: ${message}`, packagesMissing ? "its packages go in next" : "the editor is built again from its files", "agent", packagesMissing ? "npm install" : "node scripts/edit-build.mjs --force");
  }
}

const ff = ffbin("ffmpeg"), fp = ffbin("ffprobe");
let ffRuns = false; try { ffRuns = Boolean(ff && fp) && /ffprobe version/.test(run(fp, ["-version"])); } catch { ffRuns = false; }
const install = process.platform === "darwin" ? "brew install ffmpeg" : process.platform === "win32" ? "winget install Gyan.FFmpeg" : "sudo apt install ffmpeg";
const ffFix = `the packages carry a full ffmpeg; failing that, the machine's own (${install})`;
if (!ffRuns) add("ffmpeg", "fix", ff ? "ffmpeg found but does not run" : "ffmpeg not found", ffFix, "agent", "npm install");
else if (!ffFull(ff)) add("ffmpeg", "fix", `ffmpeg runs but lacks the filters the formats use (${ff.includes("compositor-") ? "only the renderer's trimmed copy was found" : ff})`, ffFix, "agent", "npm install");
else add("ffmpeg", "ok", `ffmpeg and ffprobe run (${ff.includes("ffmpeg-static") ? "the full build installed with the packages" : "from the PATH"})`);

const browserDir = P("node_modules", ".remotion");
existsSync(browserDir) ? add("browser", "ok", "render browser present") : add("browser", "warn", "render browser not downloaded yet", "it comes down on the first render, or now", "agent", "npx remotion browser ensure");

// Speech is two pieces, the model and the engine, and transcribe.mjs gets both itself on first use. This check only
// says whether that has happened yet, so a folder with no network can be told before a clip is dropped in it. The old
// one looked for a whisper.cpp folder in the root, which nothing has ever written.
const speechModel = existsSync(P("models", "ggml-base.en.bin"));
const speechEngine = Boolean(which("whisper-cli"));
if (speechModel && speechEngine) add("transcription", "ok", "speech model and engine present");
else add("transcription", "warn", `speech ${!speechModel && !speechEngine ? "model and engine are" : !speechModel ? "model is" : "engine is"} not here yet`,
         "only formats with speech need it, and it installs itself the first time one runs");

// Python, and only when an installed pack actually holds some. The packages are never shipped and never the buyer's
// to install: scripts/py.mjs reads what one script imports and runs it through uv, which fetches a Python too when
// the machine has none. So the only thing to check here is whether that runner has been used once.
// A pack keeps its Python under engine/ or scripts/, and Product Demo keeps its beside its own skill, so all
// three are read. Looking in two of them told a Product Demo folder it needed no Python at all.
const hasPython = ["engine", "scripts", ".agents"].some((d) => existsSync(P(d)) && readdirSync(P(d), { recursive: true }).some((f) => String(f).endsWith(".py")));
if (hasPython) {
  const uv = which("uv") || (existsSync(join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".local", "bin", process.platform === "win32" ? "uv.exe" : "uv")) ? "in your home folder" : null);
  uv ? add("python", "ok", "Python runner present")
     : add("python", "warn", "Python runner is not here yet", "only some steps need it, and it installs itself the first time one runs", "agent", "node scripts/py.mjs --ensure");
}

// Free space, the same way on every platform. `df` is not on Windows, and the check used to pass itself as
// "not measured on this platform" there, so the one machine that could fill up quietly was the one that was
// never asked. statfsSync reads the filesystem holding this folder and works on all three.
try {
  const fs = statfsSync(P());
  const freeGb = Math.round((fs.bsize * fs.bavail) / 1024 / 1024 / 1024);
  if (freeGb < 5) add("disk", "fix", `${freeGb} GB free`, "renders and working copies need at least 10 GB, and only you know what can go", "you");
  else add("disk", freeGb < 15 ? "warn" : "ok", `${freeGb} GB free`);
} catch { add("disk", "warn", "disk not measured"); }

const packs = installedPacks();
packs.length ? add("packs", "ok", packs.map((p) => `${p.name} ${p.version}`).join(", ")) : add("packs", "warn", "no format installed", "a downloaded pack is merged in from its path", "agent", "node scripts/add.mjs <path>");

// The tools a format calls by name on this machine. A pack lists them in needs.tools; each one either answers or
// comes back with its install command, which is the agent's to run like every other fix here.
// A field is one value, or one per operating system: { darwin, win32, linux, default }.
const here = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[process.platform] ?? v.default ?? null : v);
for (const p of packs) for (const t of p.needs?.tools ?? []) {
  if (t.only && !t.only.includes(process.platform)) continue;
  // the program itself first; through the shell only when Windows knows it as a script, with every argument quoted
  let ran = spawnSync(here(t.bin), here(t.args) ?? [], { stdio: "ignore" });
  if (ran.error && process.platform === "win32") ran = spawnSync([here(t.bin), ...(here(t.args) ?? []).map((a) => `"${a}"`)].join(" "), { stdio: "ignore", shell: true });
  const answers = ran.status === 0;
  answers ? add(`${p.name}, ${t.name}`, "ok", `${t.name} ready`)
          : add(`${p.name}, ${t.name}`, "fix", `${t.name} missing on this machine`, `${p.name} uses it for ${t.why}${process.platform === "win32" ? ". On Windows a program is only found by a terminal opened after it was installed: once installed, open a new one and check again" : ""}`, "agent", here(t.install));
}

// The commands the agent can see. Skills live in .agents/skills, but Claude Code reads .claude/skills and Grok reads
// .grok/skills, so a copy left behind is a format this folder has and the agent has no command for.
const commands = checkAgentSkills(P());
// What each format knows about this person: the two preference pages, read directly. Empty is right on day one.
{
  const known = (path) => { try { return readFileSync(path, "utf8").split(/\n\s*\n/).filter((p) => p.trim() && !p.trim().startsWith("#") && !p.trim().startsWith("<!--")).length; } catch { return 0; } };
  const say = (name, count) => add(name, "ok", count ? `${count} things known` : "nothing yet, which is right on day one");
  say("you", known(P("context", "preferences.md")));
  for (const p of installedPacks()) say(`you, ${p.name}`, known(P("workspace", "library", `${p.name}.preferences.md`)));
}

if (!commands.ok) add("commands", "fix", commands.issues.join('; '), "restore missing skills from the pack and repair its agent entry points", "agent", "node scripts/agent-skills.mjs --json");
else add("commands", "ok", `${commands.skills.length} skills and agent entry points checked`);

const accountEnabled = !packs.length || packs.some(pack => pack.needs?.account !== false);
const need = new Set(accountEnabled ? ["COMPOSIO_API_KEY"] : []);
for (const p of packs) for (const k of (Array.isArray(p.needs?.keys) ? p.needs.keys : Object.keys(p.needs?.keys ?? {}))) need.add(k);
const have = new Set(loadEnvNames());
const missing = [...need].filter((k) => !have.has(k));
if (missing.length) {
  // A key the buyer already has somewhere else on this machine: say where, never read the value into the folder.
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const hints = [];
  if (missing.includes("COMPOSIO_API_KEY") && process.env.COMPOSIO_API_KEY) hints.push("your shell already exports COMPOSIO_API_KEY");
  for (const f of [".claude.json", ".mcp.json", ".codex/config.toml", ".grok/config.toml", ".cursor/mcp.json", ".gemini/settings.json", ".composio/user_data.json"]) {
    const p = join(home, f);
    try { if (existsSync(p) && /composio/i.test(readFileSync(p, "utf8"))) hints.push(`a Composio setup exists in ~/${f}`); } catch {}
  }
  add("keys", "fix", `missing: ${missing.join(", ")}${hints.length ? ` (${hints.join("; ")}: reuse that key on the keys page)` : ""}`, "paste it on the keys page; nothing else can supply it. New to Composio: .agents/skills/start/references/access.md", "you", "node scripts/keys/server.mjs");
} else add("keys", "ok", "all keys present");

// The account connection, by name only: which Instagram account is connected to this folder's identity, or the step that connects one.
loadEnv();
if (accountEnabled && process.env.COMPOSIO_API_KEY) {
  const userId = process.env.COMPOSIO_USER_ID || "keyframes-owner";
  try {
    const r = await fetch(`https://backend.composio.dev/api/v3/connected_accounts?user_ids=${encodeURIComponent(userId)}&toolkit_slugs=instagram`, { headers: { "x-api-key": process.env.COMPOSIO_API_KEY } });
    if (r.status === 401 || r.status === 403) add("connection", "fix", "the Composio key was refused", "Paste a key from composio.dev, Settings, API keys, on the keys page", "you");
    else { const j = await r.json(); const active = (j.items ?? []).some((a) => a.status === "ACTIVE");
      active ? add("connection", "ok", "Instagram connected") : add("connection", "warn", "Instagram not connected yet", "A link opens in your browser and you approve it with the account you post from", "you"); }
  } catch { add("connection", "warn", "could not reach Composio", "the network was not there; the check runs again once it is", "agent", "node scripts/doctor.mjs"); }
} else if (accountEnabled) add("connection", "warn", "no account access yet", "One key on the keys page, then a link to approve in your browser", "you");

if (accountEnabled) {
const start = readJson(P("context", "start.json"));
start?.done ? add("start", "ok", `set up on ${start.at?.slice(0, 10)}`) : add("start", "warn", "start has not finished", "Say: set me up");
const posts = P("context", "posts.json");
if (existsSync(posts)) { const age = (Date.now() - statSync(posts).mtimeMs) / 864e5; add("posts", age > 2 ? "warn" : "ok", `posts refreshed ${age.toFixed(1)} days ago`, age > 2 ? "your posts are read again" : null, "agent", age > 2 ? "npm run refresh" : null); }
else add("posts", "warn", "no posts pulled yet", "Runs during start");
}

const blocking = checks.some((c) => c.status === "fix" && ["node", "packages", "ffmpeg", "disk", "commands"].includes(c.name));
writeJson(P("context", "doctor.json"), { at: now(), checks, blocking, version: readJson(P("runtime.json"), {}).version ?? null });
if (process.argv.includes("--json")) console.log(JSON.stringify({ checks, blocking }, null, 2));
else for (const c of checks) console.log(`${c.status.padEnd(4)} ${c.name.padEnd(14)} ${c.detail}${c.fix ? `  ->  ${c.who === "you" ? "yours: " : ""}${c.fix}${c.cmd ? ` (${c.cmd})` : ""}` : ""}`);
process.exit(blocking ? 1 : 0);
