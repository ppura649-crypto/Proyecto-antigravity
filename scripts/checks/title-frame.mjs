#!/usr/bin/env node
// checks/title-frame.mjs <project-dir> <args-json>
// args: { final = "renders/final.mp4", base = "master.mp4", hook = "hook.json", minShare = 0.001, minLevels = 24 }
// Contract: proves the very first frame the buyer sees carries the opening they approved. There is no
//   separate layer file to read any more, so the proof is a comparison: frame 0 of the finished file
//   against frame 0 of the take it was drawn over. An opening that starts a few milliseconds late leaves
//   those two frames the same picture, and the reel opens on a face with nothing on it, which is the one
//   frame the whole video is judged on. Prints one JSON line:
//   { name, value: <the share of the frame the opening changed, in percent>, threshold, pass, reason }.
//   hook.json must carry its words first, so an empty opening fails before a pixel is read.
//   Writing the file a second time moves most pixels by a level or two, so only a change bigger than
//   minLevels counts as ink.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ffbin, ffenv } from "../_lib.mjs";

const dir = resolve(process.argv[2] || "");
const args = JSON.parse(process.argv[3] || "{}");
const minShare = args.minShare ?? 0.001, minLevels = args.minLevels ?? 24;
const say = (o) => { console.log(JSON.stringify({ name: "title-frame", threshold: `${(minShare * 100).toFixed(2)} % of the frame`, ...o })); process.exit(0); };
const at = (p) => (p.startsWith("/") ? p : join(dir, p));
const final = at(args.final ?? "renders/final.mp4");
const base = at(args.base ?? "master.mp4");
const hookPath = at(args.hook ?? "hook.json");

for (const [what, p] of [["the finished file", final], ["the take", base], ["the approved opening", hookPath]])
  if (!existsSync(p)) say({ value: null, pass: false, reason: `${what} is missing: ${p}` });

let hook = null;
try { hook = JSON.parse(readFileSync(hookPath, "utf8")); } catch { say({ value: null, pass: false, reason: "hook.json cannot be read" }); }
const words = [
  ...(hook.lines ?? []).flatMap((line) => line.words ?? []),
  ...(hook.words ?? []),
].map((word) => String(word.text ?? word.word ?? "").trim()).filter(Boolean);
if (!words.length && !String(hook.text ?? "").trim()) say({ value: null, pass: false, reason: "hook.json carries no words, so there is no opening to look for" });

const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg || !ffprobe) say({ value: null, pass: false, reason: "ffmpeg is missing; run doctor" });
const size = (path, what) => {
  const r = spawnSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", `stream=${what}`, "-of", "csv=p=0", path], { encoding: "utf8", env: ffenv(ffprobe) });
  return Number((r.stdout || "").trim());
};
const w = size(base, "width"), h = size(base, "height");
if (!w || !h) say({ value: null, pass: false, reason: "the size of the take cannot be read" });

// One gray frame as raw bytes, so the comparison happens here instead of being trusted to a filter.
const frameZero = (path) => {
  const r = spawnSync(ffmpeg, ["-v", "error", "-i", path, "-frames:v", "1", "-vf", `format=gray,scale=${w}:${h}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    { encoding: "buffer", maxBuffer: 1 << 30, env: ffenv(ffmpeg) });
  return r.status === 0 && r.stdout?.length === w * h ? r.stdout : null;
};
const [drawn, plain] = [frameZero(final), frameZero(base)];
if (!drawn || !plain) say({ value: null, pass: false, reason: "the first frame could not be read from both files" });

let ink = 0;
for (let i = 0; i < drawn.length; i++) if (Math.abs(drawn[i] - plain[i]) > minLevels) ink++;
const share = ink / drawn.length;
const value = Math.round(share * 10000) / 100;
const pass = share >= minShare;
say({
  value, pass,
  reason: pass
    ? `the opening covers ${value} % of the first frame, over the buyer's own picture`
    : `the first frame is the buyer's own picture with nothing on it (${value} % changed); the opening starts after frame 0, so the reel opens empty`,
});
