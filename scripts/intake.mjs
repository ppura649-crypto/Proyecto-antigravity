#!/usr/bin/env node
// intake.mjs <file-or-folder>... [--transcribe] [--format <name>] [--source-of <post id>]
// Contract: for every video, probe it, encode a mezzanine (H.264 all-intra, constant frame rate, AAC, keyed by content hash)
//   into workspace/library/mezzanine/<hash>.mp4, write 8 thumbnails, and record the clip in context/inputs/media.json:
//   { "<hash>": { path, mezzanine, duration, fps, width, height, has_audio, has_speech, talking_head, thumbnails, transcript, source_of, added_at } }.
//   The original file is never modified. Rule a lives here. Exits 1 on a failed encode.
//   With --transcribe, also writes workspace/library/transcripts/<hash>.words.json through
//   scripts/transcribe.mjs (whisper.cpp, the same on macOS and Windows) and records it as
//   `transcript` on the clip, so a format never transcribes the same file twice.
//   TODO(week 2): the talking-head face sample.
import { readdirSync, statSync, mkdirSync, existsSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, extname, resolve } from "node:path";
import { P, readJson, writeJson, hashFile, ffbin, run, now, fail } from "./_lib.mjs";
import { projectSteps } from './project-steps.mjs';

const args = process.argv.slice(2);
const inputs = args.filter((a, i) => !a.startsWith("--") && !["--format", "--source-of"].includes(args[i - 1]));
const transcribe = args.includes("--transcribe");
const sourceOf = args.includes("--source-of") ? args[args.indexOf("--source-of") + 1] : null; // the post this file is the original or a similar take of
if (!inputs.length) fail("usage: intake.mjs <file-or-folder>... [--transcribe]");
const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg || !ffprobe) fail("ffmpeg not found; run doctor");

const VIDEO = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]);
const files = [];
function collect(dir,depth=0){
  if(depth>24)fail('This input folder has too many nested folders.');
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.')||entry.isSymbolicLink())continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory())collect(path,depth+1);
    else if(entry.isFile()&&VIDEO.has(extname(entry.name).toLowerCase()))files.push(path);
  }
}
for (const inp of inputs) {
  const p = resolve(inp);
  if (statSync(p).isDirectory()) collect(p);
  else files.push(p);
}
const mediaPath = P("context", "inputs", "media.json");
const media = readJson(mediaPath, {});
const mezDir = P("workspace", "library", "mezzanine");
const thumbDir = P("workspace", "library", "thumbnails");
const txDir = P("workspace", "library", "transcripts");
mkdirSync(mezDir, { recursive: true }); mkdirSync(thumbDir, { recursive: true }); mkdirSync(txDir, { recursive: true });

// The words for a clip, keyed by the clip's own hash, so re-running intake or starting a second project on the same
// take never pays for the transcription twice. Returns the file, or null when there is nothing to listen to.
function getWords(hash, mez, hasAudio) {
  if (!hasAudio) { console.log(`skip  transcription for ${hash}: the file has no audio`); return null; }
  const words = join(txDir, `${hash}.words.json`);
  if (existsSync(words)) { console.log(`have  transcript for ${hash}`); return words; }
  try { run(process.execPath, [join(import.meta.dirname, "transcribe.mjs"), mez, "--out", words]); }
  catch (e) { console.log(`warn  transcription failed for ${hash}: ${String(e.message).slice(0, 160)}`); }
  return existsSync(words) ? words : null;
}

for (const file of files) {
  const hash = hashFile(file);
  // A clip already taken in is never re-encoded. Its words are another matter: a transcription that failed, or a
  // first pass run without --transcribe, left a known clip with no words and no way to ever get any, because the
  // skip came before the listening. Every layer after this one is placed on a word, so it is worth the second look.
  if (media[hash]?.mezzanine && existsSync(media[hash].mezzanine)) {
    media[hash].aliases=[...new Set([...(media[hash].aliases||[]),media[hash].path,file])];
    if (sourceOf) media[hash].source_of = sourceOf;
    const missing = transcribe && !(media[hash].transcript && existsSync(media[hash].transcript));
    if (!missing) { console.log(`skip  ${file} (known as ${hash})`); continue; }
    media[hash].transcript = getWords(hash, media[hash].mezzanine, media[hash].has_audio !== false);
    console.log(`ok    ${file} -> ${hash} (already taken in, ${media[hash].transcript ? "words on file now" : "still no words"})`);
    continue;
  }
  const probe = JSON.parse(run(ffprobe, ["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", file]));
  const v = probe.streams.find((s) => s.codec_type === "video"); const a = probe.streams.find((s) => s.codec_type === "audio");
  if (!v) { console.log(`skip  ${file} (no video stream)`); continue; }
  const [n, d] = (v.r_frame_rate || "30/1").split("/").map(Number); const fps = d ? n / d : 30;
  const targetFps = fps > 45 ? 60 : 30;
  const mez = join(mezDir, `${hash}.mp4`);
  const encode = ["-y", "-loglevel", "error", "-i", file, "-map", "0:v:0", ...(a ? ["-map", "0:a:0"] : []), "-vf", `fps=${targetFps}`, "-fps_mode", "cfr",   // -vsync was removed in ffmpeg 8
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    ...(a ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : []), mez];
  try { run(ffmpeg, encode); } catch (e) { fail(`encode failed for ${file}: ${String(e.message).slice(0, 200)}`); }
  const duration = Number(probe.format.duration || v.duration || 0);
  const thumbs = [];
  for (let i = 0; i < 8; i++) {
    const t = Math.max(0.1, (duration * (i + 0.5)) / 8); const out = join(thumbDir, `${hash}-${i}.jpg`);
    run(ffmpeg, ["-y", "-loglevel", "error", "-ss", t.toFixed(2), "-i", mez, "-frames:v", "1", "-vf", "scale=270:-2", out]); thumbs.push(out);
  }
  // How much of the frame is a black band. A folder of the buyer's own clips will contain files
  // exported for a different format: a stack reel keeps its top 45 per cent black for a panel, and
  // dropped into a full frame montage that band is a hole in the picture. Nothing downstream can
  // see it, because the file's dimensions are correct and only its content is padded, so it is
  // measured once here and carried on the clip.
  let bars = null;
  try {
    // cropdetect reports on stderr, so it is spawned rather than run through the stdout helper.
    const probe = spawnSync(ffmpeg, ["-hide_banner", "-ss", String(Math.min(2, duration / 2)), "-i", mez, "-vf", "cropdetect=24:2:0", "-frames:v", "3", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).stderr ?? "";
    const last = [...String(probe).matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].pop();
    if (last) {
      const [, cw, ch, cx, cy] = last.map(Number);
      const covered = (cw * ch) / (v.width * v.height);
      if (covered < 0.92) bars = { w: cw, h: ch, x: cx, y: cy, covered: Number(covered.toFixed(3)) };
    }
  } catch { /* cropdetect is a nicety; a clip without it is still a usable clip */ }
  if (bars) console.log(`note  ${file} is padded: its picture covers ${Math.round(bars.covered * 100)}% of the frame (${bars.w}x${bars.h} at ${bars.x},${bars.y}). Full frame formats will show the padding.`);

  media[hash] = { path: file, mezzanine: mez, bars, duration, fps: targetFps, source_fps: Number(fps.toFixed(3)), width: v.width, height: v.height, has_audio: Boolean(a), has_speech: null, talking_head: null, thumbnails: thumbs, transcript: null, source_of: sourceOf ?? media[hash]?.source_of ?? null, added_at: now() };
  if (transcribe) media[hash].transcript = getWords(hash, mez, Boolean(a));
  console.log(`ok    ${file} -> ${hash} (${duration.toFixed(1)}s, ${v.width}x${v.height}, ${targetFps} fps)`);
}
writeJson(mediaPath, media);
// Each video keeps its own intake and transcript state, including projects waiting on this clip.
for (const entry of existsSync(P('workspace', 'projects')) ? readdirSync(P('workspace', 'projects'), { withFileTypes: true }) : []) {
  if (!entry.isDirectory()) continue;
  const dir = P('workspace', 'projects', entry.name);
  const workflow = await projectSteps(dir);
  workflow?.refreshVideoSteps(dir);
}

// The renderer reads its clips through staticFile(), which only looks inside a pack's public folder.
// The mezzanine lives in workspace/library, so without this link every composition that plays the
// buyer's own footage resolves nothing: the props are right, the render is black, and the error
// names a path that plainly exists. Linking rather than copying keeps one copy of every clip.
for (const pack of existsSync(P("remotion")) ? readdirSync(P("remotion")) : []) {
  const pub = P("remotion", pack, "public");
  if (!existsSync(pub)) continue;
  const link = join(pub, "mezzanine");
  try {
    if (!existsSync(link)) { symlinkSync(mezDir, link, "junction"); console.log(`link  ${link} -> ${mezDir}`); }
  } catch (e) { console.log(`warn  could not link the mezzanine into ${pack}: ${String(e.message).slice(0, 120)}`); }
}
