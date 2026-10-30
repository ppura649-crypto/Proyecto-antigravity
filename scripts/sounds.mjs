#!/usr/bin/env node
import { referencePosts } from './reading-policy.mjs';
// sounds.mjs [--min 100] [--calibrate] | sounds.mjs --names [--limit 40]
// Contract: reads the audio of every post file in context/posts.json, fingerprints it locally (pairs of spectral peaks,
//   the landmark method, no service called), groups the posts that carry the same track, and writes context/sounds.json:
//   { sounds: [ { id: "s1", count, posts: [ { id, reach, offset_seconds } ], median_reach, total_reach, file, seconds } ],
//     posts: { <post id>: { sound: "s1" | "library" | "silent" | "none", offset_seconds } }, min_score, read_at }
//   and context/sounds/<sound id>.m4a: the track as it sits under the longest post that carries it, copied without
//   re-encoding, so a format can reuse the buyer's own sound. offset_seconds says where in that copy the post starts.
//   "library": the post is a reel with no downloadable file, which is what Instagram does when the video carries a
//   licensed sound; the API does not say which one (every audio field was tried on 2026-09-04, none exists). "silent":
//   a file whose audio stays under -50 dB. "none": not a video. The name of a track is never known here; the buyer names
//   a sound once and the name is kept in library/sounds.json by the format that asks.
//   The fingerprint lives in _audio.mjs, shared with sort.mjs, which matches a file the buyer hands over to these tracks.
//   Two posts share a sound when at least --min landmark pairs agree on one time offset. Measured 2026-09-04 on 75 posted
//   reels of eight to ten seconds: the same track scores 1,100 to 6,000, different tracks score under 40. --calibrate
//   prints the best score of every file against every other and writes nothing.
//   --names: for every post on a library sound (most reached first, --limit of them), opens the post's own page in the
//   folder's browser profile (browser.mjs text) and reads the sound's name off it, which only a logged-in session shows;
//   writes it as posts[id].sound_name and lists every name under library_names. When the session is not logged in, it
//   stops and says so: the buyer logs in once with `node scripts/browser.mjs open https://www.instagram.com`, on the
//   page, never in chat. Nothing else is read from the page. Exits 1 with the reason when ffmpeg is missing or
//   posts.json is absent.
import { P, readJson, writeJson, now, fail, ffbin, run, hashFile } from "./_lib.mjs";
import { mkdirSync, existsSync, statSync } from "node:fs";

const args = process.argv.slice(2);
const MIN = args.includes("--min") ? Number(args[args.indexOf("--min") + 1]) || 100 : 100;
if (args.includes("--names")) {
  const { execFileSync } = await import("node:child_process");
  const posts0 = referencePosts(); if (!posts0) fail("context/posts.json missing; run: node scripts/profile.mjs");
  const file = readJson(P("context", "sounds.json"), null); if (!file) fail("context/sounds.json missing; run: node scripts/sounds.mjs first");
  const limit = Number(args[args.indexOf("--limit") + 1]) || 40;
  const todo = posts0.filter((p) => file.posts?.[p.id]?.sound === "library" && !file.posts[p.id].sound_name && p.permalink).sort((a, b) => (b.metrics?.reach ?? 0) - (a.metrics?.reach ?? 0)).slice(0, limit);
  let read = 0;
  for (const p of todo) {
    let out; try { out = JSON.parse(execFileSync(process.execPath, [P("scripts", "browser.mjs"), "text", p.permalink, "--wait", "6000"], { encoding: "utf8" }).trim().split("\n").pop()); } catch (e) { console.log(`  ${p.id}: the page could not be read`); continue; }
    const link = (out.links ?? []).map((l) => l.text).find((t) => t && t.length > 1);
    if (!link) { if (/Log in to like or comment/i.test(out.text ?? "")) fail("the browser is not logged in to Instagram; log in once with: node scripts/browser.mjs open https://www.instagram.com  (then run this again)"); console.log(`  ${p.id}: no sound name on the page`); continue; }
    file.posts[p.id].sound_name = link; read++; console.log(`  ${p.id}: ${link}`);
  }
  const names = {}; for (const [id, x] of Object.entries(file.posts)) if (x.sound_name) { const n = names[x.sound_name] ?? (names[x.sound_name] = { name: x.sound_name, posts: [], reach: [] }); n.posts.push(id); n.reach.push(posts0.find((p) => p.id === id)?.metrics?.reach ?? 0); }
  file.library_names = Object.values(names).map((n) => ({ name: n.name, count: n.posts.length, median_reach: [...n.reach].sort((a, b) => a - b)[Math.floor(n.reach.length / 2)] ?? 0, posts: n.posts })).sort((a, b) => b.count - a.count);
  writeJson(P("context", "sounds.json"), file);
  console.log(`sounds: ${read} names read, ${file.library_names.length} distinct library sounds named`);
  process.exit(0);
}
const ffmpeg = ffbin("ffmpeg");
if (!ffmpeg) fail("ffmpeg not found; run: node scripts/doctor.mjs");
const posts = referencePosts();
if (!posts) fail("context/posts.json missing; run: node scripts/profile.mjs");

import { FPS, fingerprint, match } from "./_audio.mjs";

const items = [];
for (const p of posts) {
  if (!p.local?.video) continue;
  const file = P(p.local.video);
  if (!existsSync(file)) continue;
  let fp;
  const cachePath = P('context', 'sound-cache', `${p.id}.json`);
  const key = `${hashFile(file)}:${statSync(P('scripts', '_audio.mjs')).mtimeMs}`;
  const cached = readJson(cachePath, null);
  try {
    if (cached?.key === key) fp = { ...cached.value, marks: new Map(cached.value.marks) };
    else { fp = fingerprint(ffmpeg, file); writeJson(cachePath, {key, value:{...fp, marks:[...fp.marks]}}); }
  } catch { continue; }
  items.push({ id: p.id, reach: p.metrics?.reach ?? 0, file, ...fp });
}

if (args.includes("--calibrate")) {
  for (const a of items) {
    const scores = items.filter((b) => b !== a && !b.silent).map((b) => ({ id: b.id, ...match(a.marks, b.marks) })).sort((x, y) => y.score - x.score);
    console.log(a.id, `level ${a.level} dB`, a.silent ? "silent" : `best ${scores.slice(0, 3).map((s) => `${s.id}:${s.score}`).join(" ")} ... low ${scores[scores.length - 1]?.score}`);
  }
  process.exit(0);
}

// Group: every pair over the floor joins one sound.
const parent = items.map((_, i) => i); const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const pair = new Map();
for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
  if (items[i].silent || items[j].silent) continue;
  const m = match(items[i].marks, items[j].marks); pair.set(`${i}:${j}`, m);
  if (m.score >= MIN) parent[find(i)] = find(j);
}
const groups = new Map();
items.forEach((it, i) => { if (it.silent) return; const r = find(i); (groups.get(r) ?? groups.set(r, []).get(r)).push(i); });
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
mkdirSync(P("context", "sounds"), { recursive: true });
const previousSounds = readJson(P('context', 'sounds.json'), {sounds: []});
const usedSounds = new Set();
let nextSound = Math.max(0, ...(previousSounds.sounds ?? []).map(s => Number(s.id.slice(1)) || 0)) + 1;
const sounds = [];
const postsOut = {};
[...groups.values()].sort((a, b) => b.length - a.length || items[b[0]].reach - items[a[0]].reach).forEach((members, n) => {
  const existing = (previousSounds.sounds ?? []).find(s => !usedSounds.has(s.id) && s.posts?.some(p => members.some(i => items[i].id === p.id)));
  const id = existing?.id ?? `s${nextSound++}`;
  usedSounds.add(id);
  const rep = members.reduce((a, b) => (items[b].seconds > items[a].seconds ? b : a));
  const out = P("context", "sounds", `${id}.m4a`);
  if (!existsSync(out) || existing?.from !== items[rep].id) try { run(ffmpeg, ["-nostdin", "-y", "-v", "error", "-i", items[rep].file, "-vn", "-c:a", "copy", out]); } catch { try { run(ffmpeg, ["-nostdin", "-y", "-v", "error", "-i", items[rep].file, "-vn", "-c:a", "aac", "-b:a", "192k", out]); } catch {} }
  const list = members.map((i) => {
    let offset = 0;
    if (i !== rep) { const key = i < rep ? `${i}:${rep}` : `${rep}:${i}`; const m = pair.get(key); offset = m ? (i < rep ? m.offset : -m.offset) / FPS : 0; }
    // offset: where in the representative copy this post's audio starts (seconds into the copy).
    return { id: items[i].id, reach: items[i].reach, offset_seconds: Math.round(offset * 100) / 100 };
  }).sort((a, b) => b.reach - a.reach);
  for (const l of list) postsOut[l.id] = { sound: id, offset_seconds: l.offset_seconds };
  sounds.push({ id, count: list.length, posts: list, median_reach: median(list.map((l) => l.reach)), total_reach: list.reduce((a, l) => a + l.reach, 0), file: existsSync(out) ? `context/sounds/${id}.m4a` : null, seconds: items[rep].seconds, from: items[rep].id });
});
for (const it of items) if (it.silent) postsOut[it.id] = { sound: "silent" };
for (const p of posts) if (!postsOut[p.id]) postsOut[p.id] = { sound: p.local?.video ? "silent" : /REEL|VIDEO/i.test(p.media_type ?? "") ? "library" : "none" };

writeJson(P("context", "sounds.json"), { sounds, posts: postsOut, min_score: MIN, read_at: now() });
const lib = Object.values(postsOut).filter((x) => x.sound === "library").length;
console.log(`sounds: ${items.length} files read, ${sounds.length} distinct tracks, ${lib} posts on a library sound the API cannot name`);
for (const s of sounds) console.log(`  ${s.id}: ${s.count} post${s.count > 1 ? "s" : ""}, median reach ${s.median_reach}, ${s.seconds} s copy from ${s.from}`);
