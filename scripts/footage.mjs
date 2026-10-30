#!/usr/bin/env node
// footage.mjs read [--only <id|hash>] [--redo] [--fps 6]
// footage.mjs note --from <notes.json>            notes.json: { "c07": { what, shows, colour, use }, ... }
// footage.mjs index [--json]
// footage.mjs --check
//
// Goal
//   The buyer's own folder is understood once, and never again. Every clip gets a short id, a set of
//   numbers measured off the picture and four or five sentences saying what it is, and from then on a
//   montage is built by choosing ids, not by opening files.
//
// Reasoning
//   Reading footage is the expensive part of this kind of reel and it is the part that is paid for
//   over and over. An agent that opens the folder for every montage spends most of a run looking at
//   clips it already looked at last week, and it does not even agree with itself twice, so the second
//   montage is built on a different understanding of the same footage. Both problems have the same
//   fix: write the reading down, keyed by the clip's content hash, and treat the file as the memory.
//   Thirty clips read once make many montages; thirty clips read every time make one, slowly.
//
//   The reading is in two halves because the two halves fail differently. Light, colour, movement and
//   length are measured, because an eye cannot say that a clip sits at 0.11 of full white and a
//   script can, and because those are the numbers the picker sorts on. What a clip IS, on the other
//   hand, cannot be measured at all: no threshold knows that the blue rectangle is a terminal, that
//   the hands are yours, or that the room is the one from last month. That half is written by the
//   agent after looking at a contact sheet, and the script's job is to make sure it was written.
//
// The pattern
//   Measure every clip and lay nine of its frames out as one picture. Look at those pictures. Write
//   one note per clip. Fold both halves into one index. Everything downstream reads the index.
//
// Counter-examples
//   Reading the folder again because a new montage was asked for. A note that says "b-roll of a desk"
//   and could be any clip in the folder. Keying the reading to a filename, so a rename loses it.
//   Measuring saturation and calling it a look. Writing the index from the markdown, or the markdown
//   from the index: the numbers are measured, the sentences are seen, and neither is derived.
//
// Contract: reads context/inputs/media.json (intake.mjs writes it). Writes one record per clip at
//   context/inputs/footage/<hash>.json and a contact sheet beside it, and the index at
//   context/inputs/footage.json: { version, updated, clips: { <hash>: { id, file, seconds, light,
//   colour, motion, still, sheet, read } } }. --check exits 1 with the next move when a clip has no
//   note. The understanding of the folder as a whole goes in context/inputs/footage.md, written by
//   the agent, and nothing reads it.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, join } from "node:path";
import { P, readJson, writeJson, ffbin, ffenv, ffFull, now, fail } from "./_lib.mjs";

const argv = process.argv.slice(2);
// --check on its own is the state question, not a verb. Without this it fell through to the default
// verb and re-read the folder before answering, which is slow and, worse, exits before the answer.
const verb = argv.includes("--check") ? "index" : (argv.find((a) => !a.startsWith("--")) ?? "read");
const opt = (k, d = null) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : (i >= 0 ? true : d); };
const ffmpeg = ffbin("ffmpeg");
const DIR = P("context", "inputs", "footage");
const INDEX = P("context", "inputs", "footage.json");

// The light of a picture as a share of full white. signalstats reports the raw Y plane, which in a
// broadcast-range file runs 16 to 235 and not 0 to 255; dividing by 255 quietly reports every clip as
// darker than it is, and the whole grade ladder shifts with it.
const share = (y) => Math.max(0, Math.min(1, (y - 16) / 219));
const grade = (m) => (m < 0.18 ? "dark" : m < 0.34 ? "mid" : "bright");

function probe(file) {
  // One -show_entries, not two. ffprobe keeps only the last of repeated flags, so asking for the
  // stream and then for the format returned the format alone: width, height and duration all came
  // back as zero, and a zero duration silently made every contact sheet nine frames of the first
  // half second. Stream and format are asked for in one argument, and the format duration is the
  // fallback because a stream copied without a duration header is normal.
  const out = spawnSync(ffbin("ffprobe"), ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,duration:format=duration", "-of", "json", file],
    { encoding: "utf8", env: ffenv(ffbin("ffprobe")) }).stdout;
  const j = JSON.parse(out || "{}");
  const s = j.streams?.[0] ?? {};
  const seconds = Number(s.duration) || Number(j.format?.duration) || 0;
  return { width: Number(s.width) || 0, height: Number(s.height) || 0, seconds };
}

// Two passes, because the two things they measure fail in different ways. signalstats reads the real
// planes and is the honest source for light and colour. The raster is a 16x28 thumbnail of every
// sampled frame, and it is the only cheap way to ask how much the picture moves and how much it
// changes across its own length.
function measure(file, fps) {
  const stats = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-vf", `fps=${fps},signalstats,metadata=print:file=-`, "-f", "null", "-"], { encoding: "utf8", env: ffenv(ffmpeg) }).stdout ?? "";
  const bag = {};
  for (const line of stats.split("\n")) {
    if (!line.includes("lavfi") || !line.includes("=")) continue;
    const [k, v] = line.trim().split("=");
    (bag[k.split(".").pop()] ??= []).push(Number(v));
  }
  const mean = (a) => (a?.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const W = 16, H = 28;
  const raw = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-vf", `fps=${fps},scale=${W}:${H}:flags=area,format=rgb24`, "-f", "rawvideo", "-"],
    { encoding: "buffer", maxBuffer: 1 << 26, env: ffenv(ffmpeg) }).stdout ?? Buffer.alloc(0);
  const step = W * H * 3;
  const frames = [];
  for (let o = 0; o + step <= raw.length; o += step) frames.push(raw.subarray(o, o + step));
  const casts = frames.map((f) => { let r = 0, g = 0, b = 0; for (let i = 0; i < f.length; i += 3) { r += f[i]; g += f[i + 1]; b += f[i + 2]; } const n = f.length / 3; return [r / n, g / n, b / n]; });
  let motion = 0;
  for (let i = 1; i < frames.length; i++) { let d = 0; for (let j = 0; j < step; j++) d += Math.abs(frames[i][j] - frames[i - 1][j]); motion += d / step; }
  motion = frames.length > 1 ? motion / (frames.length - 1) / 255 : 0;
  let spread = 0;
  for (let i = 0; i < casts.length; i++) for (let j = i + 1; j < casts.length; j++) spread = Math.max(spread, Math.hypot(...casts[i].map((v, k) => v - casts[j][k])));
  const cast = casts.length ? casts.reduce((a, c) => a.map((v, i) => v + c[i] / casts.length), [0, 0, 0]) : [0, 0, 0];
  // The average picture of the whole clip, 16 by 28 in grey, kept so two clips can be compared
  // without opening either again. Two files of the same footage exported twice have different
  // content hashes and are two clips to everything upstream, but they are one picture, and a montage
  // that puts them side by side reads as a repeat that no rule about hashes can catch.
  const sig = new Array(W * H).fill(0);
  for (const f of frames) for (let i = 0; i < W * H; i++) sig[i] += (0.299 * f[i * 3] + 0.587 * f[i * 3 + 1] + 0.114 * f[i * 3 + 2]) / frames.length;
  const m = share(mean(bag.YAVG));
  return {
    light: { mean: r3(m), low: r3(share(mean(bag.YLOW))), high: r3(share(mean(bag.YHIGH))), grade: grade(m) },
    colour: { sat: r1(mean(bag.SATAVG)), cast: "#" + cast.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") },
    motion: r3(motion),
    changes: r1(spread),
    signature: sig.map((v) => Math.round(v)),
    frames: frames.length,
  };
}
const r1 = (n) => Number(n.toFixed(1));
const r3 = (n) => Number(n.toFixed(3));

// Nine frames as one picture. The agent looks at this and nothing else: nine stills say what a clip
// is, where a single thumbnail says what one moment of it was, and opening the video costs a minute
// per clip that thirty clips do not have.
function sheet(file, seconds, out) {
  const n = 9, cols = 3;
  const every = Math.max(0.05, seconds / (n + 1));
  const args = ["-v", "error", "-y", "-i", file, "-vf", `fps=1/${every.toFixed(3)},scale=320:-1,tile=${cols}x${Math.ceil(n / cols)}`, "-frames:v", "1", "-q:v", "4", out];
  return spawnSync(ffmpeg, args, { env: ffenv(ffmpeg) }).status === 0;
}

// Two clips are one picture when their average frames agree everywhere. The threshold is loose on
// purpose: a re-export, a different bitrate and a one second trim all land under 3, and two genuinely
// different shots of the same room land far above it. Measured on a real folder: three pairs of the
// seventeen sat at 0.05, and the next nearest unrelated pair sat above 20.
function twins(idx) {
  const list = Object.entries(idx.clips).filter(([, c]) => Array.isArray(c.signature));
  for (const [, c] of list) c.twin = null;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i][1], b = list[j][1];
    if (a.signature.length !== b.signature.length) continue;
    let d = 0;
    for (let k = 0; k < a.signature.length; k++) d += Math.abs(a.signature[k] - b.signature[k]);
    d /= a.signature.length;
    if (d < 3) { b.twin = a.id; b.twin_distance = r1(d); }
  }
}

function load() { return existsSync(INDEX) ? readJson(INDEX, {}) : { version: 1, updated: null, clips: {} }; }
function nextId(clips) {
  const used = new Set(Object.values(clips).map((c) => c.id));
  for (let i = 1; i < 1000; i++) { const id = `c${String(i).padStart(2, "0")}`; if (!used.has(id)) return id; }
  fail("more than 999 clips in one folder");
}

if (verb === "read") {
  if (!ffmpeg) fail("ffmpeg not found; run doctor");
  // The renderer ships its own ffmpeg, which decodes and encodes and has almost no filters. This
  // reading is all filters: signalstats for the light, scale for the raster, tile for the sheet. A
  // partial build does not refuse them, it returns an empty stream, and every clip then measures as
  // black and still. So the build is asked what it can do before anything is measured.
  if (!ffFull(ffmpeg)) fail(`the ffmpeg at ${ffmpeg} has no filters; run scripts/doctor.mjs`);
  const media = readJson(P("context", "inputs", "media.json"), {});
  const hashes = Object.keys(media).filter((h) => media[h]?.mezzanine && existsSync(media[h].mezzanine));
  if (!hashes.length) fail("no clips taken in yet; run scripts/intake.mjs <folder> first");
  mkdirSync(DIR, { recursive: true });
  const idx = load();
  const only = typeof opt("only") === "string" ? String(opt("only")) : null;
  const fps = Number(opt("fps", 6)) || 6;
  let done = 0;
  for (const hash of hashes.sort((a, b) => String(media[a].added_at).localeCompare(String(media[b].added_at)))) {
    const was = idx.clips[hash];
    if (only && only !== hash && only !== was?.id) continue;
    if (was?.light && !argv.includes("--redo")) { console.log(`have  ${was.id} ${basename(media[hash].path)}`); continue; }
    const file = media[hash].mezzanine;
    const p = probe(file);
    const m = measure(file, fps);
    const shotPath = join(DIR, `${hash}.jpg`);
    sheet(file, p.seconds, shotPath);
    idx.clips[hash] = {
      id: was?.id ?? nextId(idx.clips),
      file: basename(media[hash].path),
      path: media[hash].path,
      seconds: r1(p.seconds),
      width: p.width, height: p.height,
      ...m,
      sheet: `context/inputs/footage/${hash}.jpg`,
      read: was?.read ?? null,
      measured_at: now(),
    };
    delete idx.clips[hash].frames;
    writeJson(join(DIR, `${hash}.json`), idx.clips[hash]);
    const c = idx.clips[hash];
    console.log(`ok    ${c.id} ${c.file.padEnd(28).slice(0, 28)} ${c.seconds.toFixed(1)}s  light ${c.light.mean.toFixed(2)} ${c.light.grade.padEnd(6)} colour ${String(c.colour.sat).padStart(4)} ${c.colour.cast}  moves ${c.motion.toFixed(2)}`);
    done++;
  }
  twins(idx);
  idx.updated = now();
  writeJson(INDEX, idx);
  for (const c of Object.values(idx.clips)) writeJson(join(DIR, `${Object.keys(idx.clips).find((h) => idx.clips[h] === c)}.json`), c);
  const doubled = Object.values(idx.clips).filter((c) => c.twin);
  if (doubled.length) console.log(`\nnote  ${doubled.length} clips are the same picture as another one under a different name: ` +
    doubled.map((c) => `${c.id} (${c.file}) is ${c.twin}`).join(", ") + `.\n      They count as one clip when a montage is built, or the cut between them reads as no cut at all.`);
  const unread = Object.values(idx.clips).filter((c) => !noteOk(c.read));
  console.log(`\n${Object.keys(idx.clips).length} clips measured, ${unread.length} with nothing written about them yet.`);
  if (unread.length) console.log(`Look at ${DIR}/*.jpg, then write one note each and run: node scripts/footage.mjs note --from <notes.json>`);
  process.exit(0);
}

// A note is four or five sentences, and the length is the point: "b-roll of a desk" fits any clip in
// the folder and so tells the picker nothing. The check is crude on purpose. It counts sentences and
// refuses a note that could have been written without looking.
function noteOk(read) {
  if (!read) return false;
  const text = [read.what, read.shows, read.colour, read.use].filter(Boolean).join(" ");
  const sentences = text.split(/[.!?]+\s|[.!?]+$/).filter((s) => s.trim().length > 8).length;
  return Boolean(read.what && read.shows) && sentences >= 4;
}

if (verb === "note") {
  const from = opt("from");
  if (typeof from !== "string") fail("usage: footage.mjs note --from <notes.json>   with { \"c07\": { what, shows, colour, use } }");
  const notes = JSON.parse(readFileSync(from, "utf8"));
  const idx = load();
  const byId = Object.fromEntries(Object.entries(idx.clips).map(([h, c]) => [c.id, h]));
  const bad = [];
  let n = 0;
  for (const [key, note] of Object.entries(notes)) {
    const hash = idx.clips[key] ? key : byId[key];
    if (!hash) { bad.push(`${key}: no clip with that id`); continue; }
    const read = { what: note.what ?? "", shows: note.shows ?? "", colour: note.colour ?? "", use: note.use ?? "", at: now() };
    if(note.human!==undefined){
      const h=note.human;
      if(typeof h?.visible!=="boolean" || h.visible && (!Number.isFinite(h.from)||!Number.isFinite(h.to)||h.from<0||h.to<=h.from||h.to>idx.clips[hash].seconds+.1)){bad.push(`${key}: record a valid visible-person window in seconds`);continue;}
      read.human=h.visible?{visible:true,from:h.from,to:h.to}:{visible:false};
    }else if(idx.clips[hash].read?.human)read.human=idx.clips[hash].read.human;
    if (!noteOk(read)) { bad.push(`${key}: needs what and shows, and four sentences across the four fields`); continue; }
    idx.clips[hash].read = read;
    writeJson(join(DIR, `${hash}.json`), idx.clips[hash]);
    n++;
  }
  idx.updated = now();
  writeJson(INDEX, idx);
  for (const b of bad) console.error(`skip  ${b}`);
  console.log(`${n} note${n === 1 ? "" : "s"} written into ${INDEX}`);
  process.exit(bad.length ? 1 : 0);
}

if (verb === "index" || argv.includes("--check")) {
  const idx = load();
  const clips = Object.values(idx.clips);
  const read = clips.filter((c) => noteOk(c.read));
  const dark = clips.filter((c) => c.light?.grade === "dark");
  const out = {
    ok: clips.length > 0 && read.length === clips.length,
    clips: clips.length,
    read: read.length,
    unread: clips.filter((c) => !noteOk(c.read)).map((c) => c.id),
    dark: dark.length,
    twins: clips.filter((c) => c.twin).map((c) => `${c.id} is ${c.twin}`),
    distinct: clips.filter((c) => !c.twin).length,
    seconds: r1(clips.reduce((s, c) => s + (c.seconds ?? 0), 0)),
    index: "context/inputs/footage.json",
    next: null,
  };
  out.next = !clips.length ? "take the clips in with scripts/intake.mjs, then run scripts/footage.mjs read"
    : out.unread.length ? `look at context/inputs/footage/*.jpg for ${out.unread.slice(0, 6).join(", ")}${out.unread.length > 6 ? " and the rest" : ""}, then write the notes`
    : "the folder is read; build montages from the index and never open it again";
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 1);
}

fail(`unknown command ${verb}; one of read, note, index, --check`);
