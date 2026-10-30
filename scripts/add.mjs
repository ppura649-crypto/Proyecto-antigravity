#!/usr/bin/env node
// add.mjs <folder> | --remove <format> | --list | --mirror
// Contract: merges a pack by its pack.json into this folder: skills to .agents/skills/<skill>/ (mirrored into .claude/skills
//   and .grok/skills when the folder has them), scripts to scripts/<format>/,
//   compositions to remotion/<format>/ (registered in runtime.json.compositions), assets to assets/<format>/, a whole engine/ folder
//   to engine/<format>/ (its internal paths keep working; engine/ entries in provides only register), setup.json, SPEC.md and styles/
//   to packs/<format>/, and provides.editor (the pack's editor/ folder: its reader and the layers the video editor draws)
//   to editor/<format>/. Appends { name, version, setup_version, command, first_run, needs, at } to runtime.json.packs,
//   first_run being what the pack says about going first when several are installed and none has started ({ rank, why }),
//   which whatNext() of _lib.mjs reads so the buyer is handed one command and never a menu. Writes
//   A pack's provides.readers and provides.written are merged into scripts/readers.json, tagged with the pack, so a
//   pack's own reading of the account is reported as behind the same way the runtime's readings are.
//   .installed/<format>.json with every path written. provides.never_ships names what the pack keeps out of a buyer's copy. --remove deletes exactly those paths and the registry entries, keeping
//   workspace/library/<format>.json. Exits 1 when the runtime version is not satisfied or the pack is malformed.
//   --mirror copies every skill into the adapter folders again, for when one of them falls behind.
//   <folder> is either a pack (a pack.json at its root) or a whole Keyframes folder someone bought, which has no
//   pack.json: there the formats are read from its runtime.json and .installed/<format>.json, exactly those paths are
//   copied, and the shared part is refreshed first when the bought folder is the newer of the two. VERSION is written
//   after every change and lists the runtime and every format installed.
//   Never writes under workspace/, context/ or .env.local. Globs are one level: "dir/*", "dir/*.ext", "dir/**".
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, rmSync, unlinkSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename, sep, relative } from "node:path";
import { P, readJson, writeJson, now, today, fail } from "./_lib.mjs";

// Two agents read their own skills folder rather than .agents/skills: Claude Code reads .claude/skills, Grok reads
// .grok/skills first and otherwise only the buyer's home folder. A pack added into a folder that has one of those
// leaves its skill in .agents/skills alone, so the format the buyer just added has no command in the agent they
// added it from. Mirror into whichever of them this install already carries, and take the copies out on --remove.
const MIRRORS = [".claude", ".grok"];
const mirrorSkill = (skill) => { for (const a of MIRRORS) if (existsSync(P(a))) { rmSync(P(a, "skills", skill), { recursive: true, force: true }); cpSync(P(".agents", "skills", skill), P(a, "skills", skill), { recursive: true }); } };
// A pack's workflows live in .agents/workflows/ and Claude Code reads them from .claude/workflows/, the only agent that
// runs them; every other agent reads the same file as a checklist.
const mirrorWorkflow = (file) => { if (existsSync(P(".claude")) && existsSync(P(".agents", "workflows", file))) { mkdirSync(P(".claude", "workflows"), { recursive: true }); cpSync(P(".agents", "workflows", file), P(".claude", "workflows", file)); } };
// What a buyer makes inside a format's own folder. A format whose work has to live beside its engine (a reel's scenes
// are code the engine bundles) names those folders in provides.keep. An update replaces the engine, so those folders are
// set aside first and every file the new version does not carry is put back: the buyer's reels survive, the shipped
// examples are the new ones.
const setAside = (keep) => { const tmp = mkdtempSync(join(tmpdir(), "keyframes-keep-")); for (const k of keep ?? []) if (existsSync(P(k))) cpSync(P(k), join(tmp, k), { recursive: true }); return tmp; };
const putBack = (tmp) => {
  let n = 0;
  (function walk(d) { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) { walk(p); continue; } const rel = relative(tmp, p); if (!existsSync(P(rel))) { mkdirSync(dirname(P(rel)), { recursive: true }); cpSync(p, P(rel)); n++; } } })(tmp);
  rmSync(tmp, { recursive: true, force: true });
  if (n) console.log(`kept ${n} files of your own work beside the engine`);
};

const args = process.argv.slice(2);
const runtime = readJson(P("runtime.json"), { version: "0.0.0", packs: [], compositions: [] });
runtime.packs ??= []; runtime.compositions ??= [];
const cmp = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

if (args.includes("--list")) { for (const p of runtime.packs) console.log(`${p.name} ${p.version}  ${p.command}`); process.exit(0); }

if (args.includes("--mirror")) {
  const skills = existsSync(P(".agents", "skills")) ? readdirSync(P(".agents", "skills")).filter((s) => !s.startsWith(".")) : [];
  const here = MIRRORS.filter((a) => existsSync(P(a)));
  for (const a of here) if (existsSync(P(a, "skills"))) for (const s of readdirSync(P(a, "skills"))) if (!skills.includes(s)) rmSync(P(a, "skills", s), { recursive: true, force: true });
  for (const s of skills) mirrorSkill(s);
  for (const w of existsSync(P(".agents", "workflows")) ? readdirSync(P(".agents", "workflows")) : []) mirrorWorkflow(w);
  console.log(here.length ? `mirrored ${skills.length} skills into ${here.join(", ")}` : "nothing to mirror: this folder has no agent folder");
  process.exit(0);
}

if (args.includes("--remove")) {
  const name = args[args.indexOf("--remove") + 1];
  const rec = readJson(P(".installed", `${name}.json`)); if (!rec) fail(`${name} is not installed`);
  for (const f of rec.files) { const p = P(f); if (existsSync(p)) (statSync(p).isDirectory() ? rmSync(p, { recursive: true }) : unlinkSync(p)); }
  // The generated skill mirrors follow the canonical copy, and empty parent folders go too.
  for (const f of rec.files) if (f.startsWith(".agents/skills/")) for (const a of MIRRORS) { const m = P(a, "skills", f.split("/")[2]); if (existsSync(m)) rmSync(m, { recursive: true }); }
  for (const f of rec.files) if (f.startsWith(".agents/workflows/")) rmSync(P(".claude", "workflows", basename(f)), { force: true });
  for (const dir of ["scripts", "remotion", "assets", "engine", "packs", "editor"]) { const p = P(dir, name); if (existsSync(p)) { try { if (readdirSync(p).length === 0) rmSync(p, { recursive: true }); } catch {} } }
  runtime.packs = runtime.packs.filter((p) => p.name !== name);
  runtime.compositions = runtime.compositions.filter((c) => !c.startsWith(`remotion/${name}/`) && !c.startsWith(`engine/${name}/`));
  const graph = readJson(P("scripts", "readers.json"), null);
  if (graph) { graph.readers = (graph.readers ?? []).filter((r) => r.pack !== name); graph.written = (graph.written ?? []).filter((w) => w.pack !== name); writeJson(P("scripts", "readers.json"), graph); }
  writeJson(P("runtime.json"), runtime); unlinkSync(P(".installed", `${name}.json`)); stamp();
  console.log(`removed ${name}: ${rec.files.length} entries; setup answers kept in workspace/library/${name}.json`); process.exit(0);
}

const keysOf = (needs) => (Array.isArray(needs?.keys) ? needs.keys.join(", ") : Object.keys(needs?.keys ?? {}).join(", ")) || "none";
const src = resolve(args[0] || ""); const manifest = readJson(join(src, "pack.json"));
if (!manifest) addFolder(src);
if (!manifest.name || !manifest.version || !manifest.command) fail("pack.json needs name, version and command");
const need = (manifest.runtime || ">=0.0.0").replace(">=", "");
if (cmp(runtime.version, need) < 0) fail(`this pack needs runtime ${manifest.runtime}; this folder has ${runtime.version}. Update the folder first`);
const existing = runtime.packs.find((p) => p.name === manifest.name);
if (existing && cmp(existing.version, manifest.version) >= 0) fail(`${manifest.name} ${existing.version} is already installed`);
const aside = existing ? setAside(manifest.provides?.keep) : null;
if (existing) { const rec = readJson(P(".installed", `${manifest.name}.json`), { files: [] }); for (const f of rec.files) if (existsSync(P(f))) rmSync(P(f), { recursive: true, force: true }); }

const name = manifest.name; const written = [];
// What a pack never carries into the folder: the dependencies, the virtual environment and the scratch a run leaves
// beside the engine it ran. They are the source folder's working state, not the pack. Left in, the starter bundle
// shipped 423 MB of them, including a macOS-only Python environment that cannot run on Windows and capture folders
// naming the machine that built the zip. The build's own refusals never saw them, because the checker skips the same
// directories the copy did not.
const SKIP = new Set(["node_modules", "evals", ".git", "dist", ".DS_Store", "workspace", "context", ".keyframes", ".work", ".venv", "__pycache__", ".pytest_cache", ".ruff_cache", ".pyc"]);
// A run leaves its renders in the engine own output folder. The folder itself ships, because the scripts write
// into it; the four test renders made on the machine that built the zip do not.
const dropped = (f) => { const parts = f.split(/[\\/]/); const i = parts.lastIndexOf("output"); return i > -1 && i < parts.length - 1; };
// What a pack carries while it is being built and never sells: the seller's own footage, marks that are not ours to
// hand on, the notes written along the way. Only the pack knows which of its files those are, so the pack names them
// in provides.never_ships and the engine copy, which takes a whole folder, honours the list.
const NEVER = (manifest.provides?.never_ships ?? []).map((p) => join(src, p));
const kept = (f) => !NEVER.some((n) => f === n || f.startsWith(n + sep));
const copy = (from, to) => { if (/\.test\.[cm]?[jt]sx?$/.test(from)) return; mkdirSync(dirname(P(to)), { recursive: true }); cpSync(join(src, from), P(to), { recursive: true, filter: (f) => !SKIP.has(basename(f)) && !/\.test\.[cm]?[jt]sx?$/.test(f) && !dropped(f) && kept(f) }); written.push(to); };
const glob = (pattern) => {
  const parts = pattern.split("/"); const last = parts.pop(); const dir = parts.join("/");
  if (last === "**") return existsSync(join(src, dir)) ? [dir] : [];
  if (last.includes("*")) {
    const suffix = last.replace(/^\*/, ""); if (!existsSync(join(src, dir))) return [];
    return readdirSync(join(src, dir)).filter((f) => !f.startsWith(".") && f.endsWith(suffix) && statSync(join(src, dir, f)).isFile()).map((f) => `${dir}/${f}`);
  }
  return existsSync(join(src, pattern)) ? [pattern] : [];
};
// A path with no directory part has nothing to strip. Stripping it anyway leaves an empty string,
// the destination becomes the pack's own scripts directory, and cpSync refuses to overwrite a
// directory with a file: /add dies partway through, having copied some of the pack and none of the
// rest, and the folder is left in a state no command can recover from. Quick Cuts shipped a
// top-level hooks.json and became uninstallable this way, with nothing to show for it but a stack
// trace about a directory.
const strip1 = (f) => (f.includes("/") ? f.split("/").slice(1).join("/") : f);
const inEngine = (f) => f === "engine" || f.startsWith("engine/");

if (existsSync(join(src, "engine"))) copy("engine", `engine/${name}`);
// Fonts and images a composition loads with staticFile() live in the pack's public folder next to its compositions.
if (existsSync(join(src, "assets", "fonts")) && existsSync(join(src, "remotion"))) copy("assets/fonts", `remotion/${name}/public/fonts`);
for (const s of manifest.provides?.skills ?? []) { const skill = s.split("/").pop(); copy(s, `.agents/skills/${skill}`); mirrorSkill(skill); }
for (const w of manifest.provides?.workflows ?? []) for (const f of glob(w)) { copy(f, `.agents/workflows/${basename(f)}`); mirrorWorkflow(basename(f)); }
for (const s of manifest.provides?.scripts ?? []) for (const f of glob(s)) { if (inEngine(f)) continue; copy(f, `scripts/${name}/${strip1(f)}`); }
for (const c of manifest.provides?.compositions ?? []) for (const f of glob(c)) {
  const to = inEngine(f) ? `engine/${name}/${strip1(f)}` : `remotion/${name}/${strip1(f)}`;
  if (!inEngine(f)) copy(f, to);
  if (!runtime.compositions.includes(to)) runtime.compositions.push(to);
}
for (const a of manifest.provides?.assets ?? []) for (const f of glob(a)) {
  if (inEngine(f)) continue;
  copy(f, f === "assets" ? `assets/${name}` : f.startsWith("assets/") ? `assets/${name}/${strip1(f)}` : `assets/${name}/${f}`);
}
// The video editor: a pack's reader turns its project files into one edit, and its layers draw them in the editor.
// Both live at editor/<pack>/, which is where edit-build.mjs and workspace-edit.mjs look.
for (const e of manifest.provides?.editor ?? []) for (const f of glob(e)) copy(f, f === "editor" ? `editor/${name}` : `editor/${name}/${f.startsWith("editor/") ? strip1(f) : f}`);
for (const h of manifest.provides?.hooks ?? []) { const reg = readJson(P("hooks", "registry.json"), []); reg.push({ pack: name, hook: h }); writeJson(P("hooks", "registry.json"), reg); }
// The reading graph. A pack's readers and the readings its agent writes by hand go into scripts/readers.json, tagged
// with the pack so --remove takes them out again. Without this a pack's own reading of the account (the trial reels
// review, say) goes out of date the moment the account is read again and nothing anywhere says so: it is derived from
// files that change, exactly like the runtime's own markdown, and only the graph can notice.
const graph = readJson(P("scripts", "readers.json"), null);
if (graph && (manifest.provides?.readers?.length || manifest.provides?.written?.length)) {
  graph.readers = (graph.readers ?? []).filter((r) => r.pack !== name);
  graph.written = (graph.written ?? []).filter((w) => w.pack !== name);
  for (const r of manifest.provides?.readers ?? []) graph.readers.push({ ...r, pack: name, run: r.run.includes("/") ? r.run : `${name}/${r.run}` });
  for (const w of manifest.provides?.written ?? []) graph.written.push({ ...w, pack: name, by: w.by ?? "agent" });
  writeJson(P("scripts", "readers.json"), graph);
}
for (const extra of ["setup.json", "SPEC.md", "styles"]) if (existsSync(join(src, extra))) copy(extra, `packs/${name}/${extra}`);

if (aside) putBack(aside);
runtime.packs = runtime.packs.filter((p) => p.name !== name);
runtime.packs.push({ name, version: manifest.version, setup_version: manifest.setup_version ?? 1, command: manifest.command, runtime: manifest.runtime ?? ">=0.0.0", first_run: manifest.first_run ?? null, needs: manifest.needs ?? {}, ...(manifest.provides?.keep ? { keep: manifest.provides.keep } : {}), at: now() });
writeJson(P("runtime.json"), runtime);
writeJson(P(".installed", `${name}.json`), { name, version: manifest.version, at: now(), files: [...new Set(written)] });
stamp();
console.log(`added ${name} ${manifest.version}: ${written.length} entries. Command: ${manifest.command}. Keys needed: ${keysOf(manifest.needs)}`);

// What a buyer downloads for their second format is not a pack, it is a whole folder with that format already in it.
// There is no pack.json at its root; the format is written down in .installed/<name>.json, which lists every path that
// belongs to it. Take exactly those paths. Take nothing of the shared part unless the folder they just bought is newer
// than this one, in which case refresh it first: a format sold in December can need a folder that did not exist in
// October, and the buyer must never have to know which of the two they are holding.
function addFolder(src) {
  if (src === P()) fail("that is this folder");
  const theirs = readJson(join(src, "runtime.json"));
  if (!theirs?.packs?.length) fail("nothing to add at that path: point add at an unzipped Keyframes folder, or at a pack");
  const S = (...p) => join(src, ...p);
  const record = (n) => readJson(S(".installed", `${n}.json`), { files: [] });
  const owned = new Set(theirs.packs.flatMap((p) => record(p.name).files));
  const previousGraph = readJson(P("scripts", "readers.json"), null);

  if (cmp(theirs.version ?? "0.0.0", runtime.version ?? "0.0.0") > 0) {
    // Everything that is not a format and not the buyer's own. The skill copies each agent reads are generated, so they
    // are left out of the copy and written again at the end.
    const KEEP = new Set(["workspace", "context", ".keyframes", ".env.local", ".installed", "runtime.json", "VERSION", "node_modules", ".DS_Store", ".git"]);
    (function walk(rel) {
      for (const e of readdirSync(rel ? S(rel) : src, { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (KEEP.has(e.name) || owned.has(r) || r === ".claude/skills" || r === ".grok/skills") continue;
        if (e.isDirectory()) { mkdirSync(P(r), { recursive: true }); walk(r); continue; }
        mkdirSync(dirname(P(r)), { recursive: true }); rmSync(P(r), { force: true }); cpSync(S(r), P(r));
      }
    })("");
    runtime.version = theirs.version;
    runtime.setup_version = theirs.setup_version ?? runtime.setup_version;
    console.log(`folder brought up to ${runtime.version}`);
  }

  const graph = readJson(P("scripts", "readers.json"), null);
  const theirGraph = readJson(S("scripts", "readers.json"), null);
  // A shared update replaces shared readers, not the installed formats it leaves in place.
  if (graph && previousGraph) for (const key of ["readers", "written"]) graph[key] = (graph[key] ?? []).filter(row => !row.pack).concat((previousGraph[key] ?? []).filter(row => row.pack));
  const done = [];
  for (const p of theirs.packs) {
    const have = runtime.packs.find((x) => x.name === p.name);
    if (have && cmp(have.version, p.version) >= 0) continue;
    const files = record(p.name).files;
    if (!files.length) continue;
    const need = (p.runtime || ">=0.0.0").replace(">=", "");
    if (cmp(runtime.version, need) < 0) fail(`${p.name} needs runtime ${p.runtime}; this folder has ${runtime.version}`);
    const aside = have ? setAside(p.keep ?? have.keep) : null;
    if (have) { const old = readJson(P(".installed", `${p.name}.json`), { files: [] }); for (const f of old.files) if (existsSync(P(f))) rmSync(P(f), { recursive: true, force: true }); }
    for (const f of files) {
      if (!existsSync(S(f))) continue;
      mkdirSync(dirname(P(f)), { recursive: true }); rmSync(P(f), { recursive: true, force: true }); cpSync(S(f), P(f), { recursive: true });
    }
    if (aside) putBack(aside);
    for (const f of files) if (f.startsWith(".agents/skills/")) mirrorSkill(f.split("/")[2]);
    for (const f of files) if (f.startsWith(".agents/workflows/")) mirrorWorkflow(basename(f));
    for (const c of theirs.compositions ?? []) if ((c.startsWith(`remotion/${p.name}/`) || c.startsWith(`engine/${p.name}/`)) && !runtime.compositions.includes(c)) runtime.compositions.push(c);
    if (graph && theirGraph) {
      graph.readers = (graph.readers ?? []).filter((r) => r.pack !== p.name).concat((theirGraph.readers ?? []).filter((r) => r.pack === p.name));
      graph.written = (graph.written ?? []).filter((w) => w.pack !== p.name).concat((theirGraph.written ?? []).filter((w) => w.pack === p.name));
    }
    runtime.packs = runtime.packs.filter((x) => x.name !== p.name);
    runtime.packs.push({ ...p, at: now() });
    writeJson(P(".installed", `${p.name}.json`), { name: p.name, version: p.version, at: now(), files });
    done.push({ ...p, count: files.length });
  }
  if (graph) writeJson(P("scripts", "readers.json"), graph);
  // Shared skills also change during a runtime upgrade, even with no new format.
  for (const skill of existsSync(P(".agents", "skills")) ? readdirSync(P(".agents", "skills")).filter(s => !s.startsWith(".")) : []) mirrorSkill(skill);
  writeJson(P("runtime.json"), runtime);
  stamp();
  if (!done.length) { console.log("nothing to add: this folder already has everything that one carries"); process.exit(0); }
  for (const p of done) console.log(`added ${p.name} ${p.version}: ${p.count} entries. Command: ${p.command}. Keys needed: ${keysOf(p.needs)}`);
  process.exit(0);
}

// VERSION says what this folder is now, so a folder that gained a format on Tuesday stops saying it is only the one
// bought in October. The build writes it the same way.
function stamp() {
  const commands = runtime.packs.map(pack => `\`${pack.command}\``);
  const label = commands.length > 1 ? `${commands.slice(0, -1).join(", ")} or ${commands.at(-1)}` : commands[0] ?? "the format you add";
  // A runtime upgrade can arrive inside a single-format download. Its command list must
  // reflect the merged folder while preserving every other word the buyer has edited.
  for (const file of ["AGENTS.md", "README.md"]) {
    if (!existsSync(P(file))) continue;
    const content = readFileSync(P(file), "utf8");
    const next = content.replace(/(<!-- keyframes:commands -->)[\s\S]*?(<!-- \/keyframes:commands -->)/g, (_, start, end) => start + label + end);
    if (next !== content) writeFileSync(P(file), next);
  }
  const lines = [`keyframes ${runtime.version}`, ...runtime.packs.map((p) => `${p.name} ${p.version}`), `updated ${today()}`];
  writeFileSync(P("VERSION"), lines.join("\n") + "\n");
}
