#!/usr/bin/env node
// context.mjs [--check] [--json] [--only <id>] [--force]
// Contract: the one door to the reading of the account. scripts/readers.json says what every reader writes and what it
//   was read from; this works out what is missing and what is older than what it came from, runs exactly those, in
//   dependency order, with the independent ones at the same time, and prints one line each.
//   out: nothing of its own. Every reader writes its own file, as before. --check runs nothing and only says what is
//        behind, which is what the session hook and the board ask it. --json prints the whole answer.
//        --only <id> runs one reader and what it needs; --force treats everything as behind.
//   Exit 1 when a reader fails, with its own reason; the readers that did not depend on it have already run.
//   Why this exists: the order used to live as prose in the start skill. Nothing could invalidate a reading, nothing
//   could schedule one, and the session hook could pull thirty days of new posts and leave all five readings behind
//   with nobody able to notice. A reading that is quietly a month old writes lines to a budget the account no longer
//   uses, and no check can catch that, because every check compares against the stale reading itself.
import { P, readJson, fail } from "./_lib.mjs";
import { existsSync, statSync, readdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { beginTask } from "./task-status.mjs";
import { ACCOUNT_DAYS, recentPosts, trialSources, representativeIds, trialInstalled } from './reading-policy.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const JSONOUT = args.includes("--json");
const FORCE = args.includes("--force");
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const scope = args.includes('--scope') ? args[args.indexOf('--scope') + 1] : 'account';
if (!['account', 'trial-reels'].includes(scope)) fail('Unknown reading scope.');
if (scope === 'trial-reels' && !trialInstalled()) fail('Trial Reels is not installed.');
const formatId = args.includes('--format') ? args[args.indexOf('--format') + 1] : null;
const postId = args.includes('--post') ? args[args.indexOf('--post') + 1] : null;
const manifest = readJson(P("scripts", "readers.json"));
if (!manifest?.readers) fail("scripts/readers.json is missing or unreadable");
if (scope === 'account') {
  manifest.readers = manifest.readers.filter(r => ['profile', 'captions'].includes(r.id) || r.scopes?.includes('account'));
  const captions = manifest.readers.find(r => r.id === 'captions');
  if (captions) { captions.needs = ['profile']; captions.from = ['context/posts.json']; }
  manifest.written = (manifest.written ?? []).filter(w => ['profile.md', 'voice.md', 'preferences'].includes(w.id));
  manifest.written.forEach(w => { w.from = (w.from ?? []).filter(p => !p.includes('formats') && !p.includes('structure')); });
}
if (scope === 'trial-reels') {
  manifest.written = (manifest.written ?? []).filter(w => w.id !== 'review.json');
  const formats = manifest.readers.find(r => r.id === 'formats');
  if (formats) formats.from = [...(formats.from ?? []), 'context/trial-reels/review.json'];
}
if (ONLY && !manifest.readers.some(r => r.id === ONLY)) fail('This reader needs an explicit format scope. Use --scope trial-reels.');

const mtime = (p) => (existsSync(p) ? statSync(p).mtimeMs : 0);
// A directory of readings is as new as its newest file: formats.json is derived from every structure reading, so one
// post read after it was written is enough to put it behind.
const newest = (p) => {
  if (!existsSync(p)) return 0;
  const s = statSync(p);
  if (!s.isDirectory()) return s.mtimeMs;
  let t = 0;
  for (const f of readdirSync(p)) t = Math.max(t, mtime(join(p, f)));
  return t;
};

// The graph sees only the inputs needed by this scope. Account setup never scans a video.
const allPosts = readJson(P('context', 'posts.json'), []) ?? [];
const review = readJson(P('context', 'trial-reels', 'review.json'), {});
const selected = trialSources(allPosts);
const detailIds = postId ? [] : representativeIds(selected, review, formatId);
if (postId) {
  if (!selected.some(p => p.id === postId)) fail('Choose a selected reel or a link added through + Trial reels.');
  detailIds.push(postId);
}
const posts = scope === 'account' ? recentPosts(allPosts, ACCOUNT_DAYS) : selected.filter(p => detailIds.includes(p.id));
const byReach = posts;
process.env.KEYFRAMES_READING_IDS = JSON.stringify(posts.map(p => p.id));
process.env.KEYFRAMES_READING_SCOPE = scope;
if (scope === 'trial-reels' && !posts.length) {
  const answer = { scope, readers: [], written: [], behind: ['trial-triage'], written_behind: [], fresh: false };
  if (JSONOUT) console.log(JSON.stringify(answer));
  else console.log('Classify the top 50 previews in context/trial-reels/review.json first. Reuse known formats and inspect uncertain clips.');
  process.exit(CHECK || JSONOUT ? 0 : 1);
}
const fileOf = (id) => [P("context", "posts", `${id}.mp4`), P("context", "posts", `${id}.jpg`)].find((f) => existsSync(f)) ?? null;

// The instrument is an input too. When a reader is changed, every reading it wrote before the change was measured with
// a different instrument, and comparing it only against the frame it read calls it fresh forever. Measured on this
// folder 2026-09-06: text.mjs gained confidence and completeness, 148 of 150 readings were written before it, and every
// line in the account read as not quotable while --check said the reading was current.
const runMtime = (r) => mtime(P("scripts", r.run.split(" ")[0]));

// What a reader is behind on. For a reader that runs once, its output against everything it was read from and against
// the script that wrote it. For a reader that runs per post, the ids with no reading and the ids whose reading is older
// than the frame it read or than the reader itself.
function stateOf(r) {
  if (r.source) return { id: r.id, what: r.what, state: existsSync(P("context", "posts.json")) ? "fresh" : "missing", ids: [] };
  if (r.per === "post") {
    const missing = [], stale = [];
    for (const p of byReach) {
      const src = r.id === "text" ? P("context", "structure", `${p.id}.json`) : fileOf(p.id);
      if (!src) continue;
      const out = P("context", r.id === "text" ? "text" : "structure", `${p.id}.json`);
      if (!existsSync(out)) missing.push(p.id);
      else if (FORCE || mtime(out) < Math.max(mtime(src), runMtime(r))) stale.push(p.id);
    }
    const ids = FORCE ? [...missing, ...stale] : [...missing, ...stale];
    return { id: r.id, what: r.what, state: ids.length ? (missing.length ? "missing" : "stale") : "fresh", ids, missing: missing.length, stale: stale.length };
  }
  const out = P(...r.writes[0].split("/"));
  if (!existsSync(out)) return { id: r.id, what: r.what, state: "missing", ids: [] };
  const t = mtime(out);
  const behind = (r.from ?? []).filter((f) => newest(P(...f.split("/"))) > t);
  if (runMtime(r) > t) behind.push(`${r.run} was changed after this was written`);
  return { id: r.id, what: r.what, state: FORCE || behind.length ? "stale" : "fresh", ids: [], behind };
}

const states = new Map(manifest.readers.map((r) => [r.id, stateOf(r)]));
// A reader whose input is about to be rewritten is behind too, even when its own file is newer than the file on disk
// right now: formats.json read before structure re-reads forty posts is a reading of the account as it was.
let changed = true;
while (changed) {
  changed = false;
  for (const r of manifest.readers) {
    const s = states.get(r.id);
    if (s.state !== "fresh") continue;
    if ((r.needs ?? []).some((n) => states.get(n)?.state !== "fresh")) { s.state = "stale"; s.behind = [`${r.needs.filter((n) => states.get(n)?.state !== "fresh").join(", ")} is being read again`]; changed = true; }
  }
}

// The pairs. A reading a person has to understand before anything is written gets a markdown file beside it, and that
// file goes out of date exactly the way the JSON does. Nothing can rewrite it but the agent, so it is only reported.
const written = (manifest.written ?? []).map((w) => {
  const out = P(...w.writes[0].split("/"));
  if (!existsSync(out)) return { id: w.id, what: w.what, state: "missing" };
  const t = mtime(out);
  const behind = (w.from ?? []).filter((f) => newest(P(...f.split("/"))) > t);
  return { id: w.id, what: w.what, state: behind.length ? "stale" : "fresh", behind };
});

const todo = manifest.readers.filter((r) => !r.source && states.get(r.id).state !== "fresh" && (!ONLY || r.id === ONLY || (ONLY && needed(ONLY).has(r.id))));
function needed(id) {
  const set = new Set(), walk = (x) => { const r = manifest.readers.find((y) => y.id === x); for (const n of r?.needs ?? []) { if (!set.has(n)) { set.add(n); walk(n); } } };
  walk(id); set.add(id); return set;
}

const answer = {
  scope, posts: posts.length, selected: scope === 'trial-reels' ? selected.length : posts.length,
  readers: [...states.values()],
  written,
  behind: [...states.values()].filter((s) => s.state !== "fresh").map((s) => s.id),
  written_behind: written.filter((w) => w.state !== "fresh").map((w) => w.id),
  fresh: [...states.values()].every((s) => s.state === "fresh") && written.every((w) => w.state === "fresh"),
};

if (JSONOUT) { console.log(JSON.stringify(answer, null, 2)); process.exit(0); }

if (CHECK) {
  if (answer.fresh) { console.log("context: every reading is up to date"); process.exit(0); }
  for (const s of answer.readers) if (s.state !== "fresh") console.log(`behind  ${s.id.padEnd(12)} ${s.what}${s.ids?.length ? ` (${s.ids.length} post${s.ids.length === 1 ? "" : "s"})` : ""}`);
  for (const w of written) if (w.state !== "fresh") console.log(`behind  ${w.id.padEnd(12)} ${w.what} (you write this one)`);
  console.log(`\nrun: node scripts/context.mjs`);
  process.exit(0);
}

// The waves. Everything whose inputs are settled runs at once, and the next wave waits only for what it actually
// needs. structure and sounds are one wave because sounds reads the files and not the frames; formats waits for both.
const task = beginTask({ id: scope === "account" ? "context" : "trial-study", label: scope === "account" ? "Understanding your account" : formatId ? `Studying ${review.formats?.find(f=>f.id===formatId)?.name ?? "your format"}` : "Reading the selected source", stage: "Preparing readings" });
task.update({ completed: 0, total: todo.length });
const run = (cmd, cmdArgs) => new Promise((res, rej) => {
  const c = spawn(process.execPath, [P("scripts", cmd), ...cmdArgs], { stdio: ["ignore", "pipe", "pipe"] });
  let tail = "";
  c.stdout.on("data", (d) => { tail = String(d).split("\n").filter(Boolean).pop() ?? tail; });
  c.stderr.on("data", (d) => { tail = String(d).slice(0, 200); });
  c.on("error", rej);
  c.on("close", (code) => (code === 0 ? res(tail) : rej(new Error(`${cmd} ${cmdArgs.join(" ")}: ${tail}`))));
});

async function runReader(r) {
  // A per post reader works out its list at the moment it runs, never when the plan was drawn. structure re-reading a
  // hundred posts puts every text reading under them behind, and a list made before that pass would be empty, so text
  // would report nothing to read while sitting on a hundred readings of frames that have since been read again.
  const s = r.per === "post" ? stateOf(r) : states.get(r.id);
  if (r.id === "structure") {
    // One spawn a post, best first, four at a time: ffmpeg already uses the machine and more of them only queues.
    const ids = s.ids;
    task.update({ stage: `Measuring ${ids.length} reference videos`, completed: 0, total: ids.length });
    for (let i = 0; i < ids.length; i += 4) {
      const results = await Promise.allSettled(ids.slice(i, i + 4).map((id) => run("structure.mjs", [fileOf(id), "--id", id])));
      const failed = results.find((result) => result.status === "rejected");
      if (failed) throw failed.reason;
      task.update({ completed: Math.min(i + 4, ids.length) });
    }
    console.log(`ok    structure  ${ids.length} post${ids.length === 1 ? "" : "s"}`);
    return;
  }
  if (r.id === "text") {
    // text.mjs all skips a post it has already read, so a reading that is behind is removed first and read again in
    // the same pass. Cheaper than a spawn a post: tesseract loads its language once for the whole run.
    for (const id of s.ids) rmSync(P("context", "text", `${id}.json`), { force: true });
    task.update({ stage: `Reading text in ${s.ids.length} references`, completed: 0, total: s.ids.length });
    console.log(`ok    text       ${await run("text.mjs", ["all"])}`);
    task.update({ completed: s.ids.length });
    return;
  }
  const [cmd, ...rest] = r.run.split(" ");
  console.log(`ok    ${r.id.padEnd(10)} ${await run(cmd, rest)}`);
}

const done = new Set(manifest.readers.filter((r) => !todo.includes(r)).map((r) => r.id));
const failed = new Set();
let wave = 0;
while (todo.some((r) => !done.has(r.id))) {
  // Independent readings still finish; a failed input must never be called fresh by a dependent reader.
  let skipped;
  do {
    skipped = false;
    for (const r of todo) if (!done.has(r.id) && (r.needs ?? []).some((n) => failed.has(n))) {
      done.add(r.id); failed.add(r.id); skipped = true;
      console.error(`skip  ${r.id}: an input could not be read`);
    }
  } while (skipped);
  const now = todo.filter((r) => !done.has(r.id) && (r.needs ?? []).every((n) => done.has(n)));
  if (!now.length) {
    if (todo.every((r) => done.has(r.id))) break;
    fail(`readers.json has a loop: ${todo.filter((r) => !done.has(r.id)).map((r) => r.id).join(", ")}`);
  }
  console.log(`\nreading ${now.map((r) => r.what).join(" and ")}`);
  task.update({ stage: `Reading ${now.map((r) => r.what).join(" and ")}` });
  await Promise.all(now.map((r) => runReader(r).catch((e) => { failed.add(r.id); console.error(String(e.message)); process.exitCode = 1; })));
  for (const r of now) done.add(r.id);
  task.update({ stage: "Finishing readings", completed: todo.filter((r) => done.has(r.id) && !failed.has(r.id)).length, total: todo.length });
  wave++;
}
if (!wave) console.log("context: every reading was already up to date");
const behindMd = written.filter((w) => w.state !== "fresh");
if (behindMd.length) console.log(`\nyours to write: ${behindMd.map((w) => `${w.id} (${w.what})`).join(", ")}`);
if (failed.size) task.error("Some posts could not be read. Ask your agent to retry.");
else task.done(behindMd.length ? "Readings saved. Your account notes are next." : "Readings saved");
