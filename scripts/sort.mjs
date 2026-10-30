#!/usr/bin/env node
// sort.mjs <folder> [--format trial-reels] [--dry]
// Contract: reads every file under a folder the buyer chose, any names, any depth, and says what each one is for, so the
//   buyer never sorts. Writes workspace/input/<format>/sorted.json:
//   { folder, files: [ { path, kind: "video" | "audio" | "image" | "text" | "other", bytes, seconds,
//       match: { format, take, posts: [ids], score, offset_seconds } | { sound, score } | null, zone, filed, why } ],
//     matched, unmatched, sorted_at }
//   and files each matched file (a copy, the original untouched) under workspace/input/<format>/<format slug>/<zone>/.
//   A video is matched to a take the account reuses by its motion: the change between frames, ten a second, over the
//   whole file, slid along the six seconds recorded for each take in context/structure (the clip zone of the post that
//   carries it); the best Pearson correlation over 0.9 with at least four seconds of overlap is the take, and the offset
//   says where in the file the posted segment starts. A video that matches no take is described (one clip, a timelapse,
//   cuts, and whether it holds speech) so the agent can place it by looking at its sheet. An audio file, or the sound of
//   a video, is matched to context/sounds by the fingerprint in _audio.mjs (score over 100 is the same track). Images and
//   text files are listed with a thumbnail or their first line: the agent looks and names their use. --dry writes the
//   report and files nothing. Calibrated 2026-09-04 on the account's own posted files (a post against its own take: 1.0;
//   against another take: under 0.5). Exits 1 when the folder does not exist or no format is installed.
import { P, readJson, writeJson, now, fail, ffbin, run, slug, hashFile, installedPacks } from "./_lib.mjs";
import { fingerprint, match as audioMatch, FPS as AFPS } from "./_audio.mjs";
import { existsSync, readdirSync, statSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--format");
if (!folder || !existsSync(folder)) fail("usage: sort.mjs <folder> [--format trial-reels] [--dry]");
// Most buyers own one format, and it is rarely the first one we happened to sell. Naming a format here files a
// talking head buyer clips into a trial reels folder that nothing will ever read.
const format = args.includes("--format") && args[args.indexOf("--format") + 1] ? args[args.indexOf("--format") + 1] : installedPacks()[0]?.name;
if (!format) fail("no format is installed; say /add with the folder you downloaded");
const dry = args.includes("--dry");
const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg) fail("ffmpeg not found; run: node scripts/doctor.mjs");
const formats = readJson(P("context", "formats.json"), { formats: [] }).formats ?? [];
const sounds = readJson(P("context", "sounds.json"), { sounds: [], posts: {} });
const review = readJson(P("context", format, "review.json"), { formats: [] });

const VIDEO = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"]), AUDIO = new Set([".mp3", ".m4a", ".wav", ".aac", ".flac", ".ogg", ".aiff"]), IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif"]), TEXT = new Set([".txt", ".md", ".csv", ".rtf"]);
const kindOf = (p) => { const e = extname(p).toLowerCase(); return VIDEO.has(e) ? "video" : AUDIO.has(e) ? "audio" : IMAGE.has(e) ? "image" : TEXT.has(e) ? "text" : "other"; };
function walk(dir) { const out = []; for (const d of readdirSync(dir, { withFileTypes: true })) { if (d.name.startsWith(".")) continue; const p = join(dir, d.name); if (d.isDirectory()) out.push(...walk(p)); else out.push(p); } return out; }

// The takes the account reuses: one series per take, from the post that carries it, in the clip zone.
const takes = [];
for (const f of formats) for (const t of f.takes ?? []) {
  const s = readJson(P("context", "structure", `${t.posts[0]}.json`), null); if (!s) continue;
  const panel = s.panel ?? (s.regions?.top?.dark ? "top" : "bottom"); const region = s.layout === "split" ? s.regions[panel === "top" ? "bottom" : "top"] : null;
  const series = region?.flow?.series ?? s.flow?.series; if (!series?.length) continue;
  takes.push({ format: f.id, formatName: f.name, take: t.id, posts: t.posts, median_reach: t.median_reach, motion: t.motion, series });
}
console.log(`sort: ${takes.length} takes with a motion series, ${(sounds.sounds ?? []).length} tracks`);
const zoneOf = (formatId) => { const rf = (review.formats ?? []).find((x) => x.id === formatId); const clip = rf?.zones?.find((z) => /clip/.test(z.kind ?? "")); return clip ? slug(clip.label, 30) : "clip"; };
const slugOf = (formatId) => { const rf = (review.formats ?? []).find((x) => x.id === formatId); return slug(rf?.name?.replace(/^the\s+/i, "") ?? formatId, 30); };

// Motion over the whole file at ten a second, on a 90 by 80 grey frame, the same measure as structure.mjs.
function motionSeries(file) {
  let text = "";
  try { text = run(ffmpeg, ["-nostdin", "-v", "error", "-i", file, "-t", "120", "-vf", "fps=10,scale=90:80,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"]); } catch { return []; }
  return [...text.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1])).slice(1);
}
function pearson(a, b) { const n = a.length; let sa = 0, sb = 0; for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; } const ma = sa / n, mb = sb / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : 0; }
function bestTake(series) {
  let best = null;
  for (const t of takes) {
    const need = Math.min(t.series.length, 60); if (series.length < 40) continue;
    for (let off = 0; off + Math.min(need, 40) <= series.length; off++) {
      const len = Math.min(need, series.length - off); if (len < 40) break;
      const r = pearson(series.slice(off, off + len), t.series.slice(0, len));
      if (!best || r > best.score) best = { ...t, score: Math.round(r * 1000) / 1000, offset_seconds: off / 10 };
    }
  }
  return best && best.score >= 0.9 ? best : null;
}
function probe(file) { if (!ffprobe) return {}; try { const j = JSON.parse(run(ffprobe, ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", file])); return { seconds: Number(Number(j.format?.duration ?? 0).toFixed(2)), width: j.streams?.find((s) => s.codec_type === "video")?.width ?? null, height: j.streams?.find((s) => s.codec_type === "video")?.height ?? null, audio: j.streams?.some((s) => s.codec_type === "audio") ?? false }; } catch { return {}; } }
function describe(file) {
  const dir = P("context", "inputs", "structure"); mkdirSync(dir, { recursive: true });
  try { const out = run(process.execPath, [P("scripts", "structure.mjs"), file, "--out", dir, "--id", hashFile(file).slice(0, 12)]); const s = JSON.parse(out.trim().split("\n").pop()); return { kind: s.kind, motion: s.motion, layout: s.layout, sheet: s.sheet }; } catch { return null; }
}

// Sound tracks, fingerprinted from their copies in context/sounds.
const tracks = (sounds.sounds ?? []).filter((s) => s.file && existsSync(P(s.file))).map((s) => { try { return { id: s.id, count: s.count, median_reach: s.median_reach, ...fingerprint(ffmpeg, P(s.file)) }; } catch { return null; } }).filter(Boolean);
function bestSound(file) { let fp; try { fp = fingerprint(ffmpeg, file); } catch { return null; } if (fp.silent) return { silent: true }; let best = null; for (const t of tracks) { const m = audioMatch(fp.marks, t.marks); if (!best || m.score > best.score) best = { sound: t.id, count: t.count, score: m.score, offset_seconds: Math.round((m.offset / AFPS) * 100) / 100 }; } return best && best.score >= 100 ? best : null; }

const files = walk(folder);
const report = [];
const outRoot = P("workspace", "input", format);
for (const file of files) {
  const kind = kindOf(file), bytes = statSync(file).size; const rel = relative(folder, file);
  const row = { path: rel, kind, bytes, match: null, zone: null, filed: null, why: "" };
  if (kind === "video") {
    const pr = probe(file); row.seconds = pr.seconds ?? null; row.size = pr.width ? `${pr.width}x${pr.height}` : null;
    const hit = bestTake(motionSeries(file));
    if (hit) { row.match = { format: hit.format, take: hit.take, posts: hit.posts, score: hit.score, offset_seconds: hit.offset_seconds }; row.zone = zoneOf(hit.format); row.why = `the same motion as take ${hit.take} of ${hit.formatName} (${hit.posts.length} posts), the posted segment starts at ${hit.offset_seconds} s`; }
    else { const d = describe(file); row.seen = d; row.why = d ? `${d.kind === "cut" ? "cuts" : d.motion === "timelapse" ? "a timelapse" : "one clip"}, ${pr.audio ? "with sound" : "silent"}; matches no take the account reused; look at the sheet` : "could not be read"; }
    if (pr.audio) { const snd = bestSound(file); if (snd && !snd.silent) { row.sound = snd; row.why += `; carries sound ${snd.sound}`; } }
  } else if (kind === "audio") {
    const snd = bestSound(file);
    if (snd?.silent) row.why = "silent";
    else if (snd) { row.match = { sound: snd.sound, score: snd.score, offset_seconds: snd.offset_seconds }; row.zone = "song"; row.why = `the track under ${snd.count} posts (sound ${snd.sound})`; }
    else row.why = "a track the account has not used in 90 days; the agent asks which format it is for";
  } else if (kind === "image") row.why = "an image: the agent looks at it and names its post or its use";
  else if (kind === "text") { try { row.first_line = readFileSync(file, "utf8").split("\n").find((l) => l.trim())?.trim().slice(0, 120) ?? ""; } catch {} row.why = "a text file: lines or sound names; the agent reads it"; }
  else row.why = "not a video, an audio file, an image or a text file";
  if (row.zone && row.match && !dry) {
    const fslug = row.match.format ? slugOf(row.match.format) : "shared";
    const dest = join(outRoot, fslug, row.zone, basename(file)); mkdirSync(join(dest, ".."), { recursive: true });
    if (!existsSync(dest)) copyFileSync(file, dest);
    row.filed = relative(P(), dest).split("\\").join("/");
  }
  report.push(row);
  console.log(`${row.match ? "match " : "      "} ${rel}: ${row.why}`);
}
mkdirSync(outRoot, { recursive: true });
const matched = report.filter((r) => r.match).length;
writeJson(join(outRoot, "sorted.json"), { folder, files: report, matched, unmatched: report.length - matched, sorted_at: now() });
console.log(`sort: ${report.length} files, ${matched} matched${dry ? " (dry, nothing filed)" : ""} -> ${relative(P(), join(outRoot, "sorted.json"))}`);
