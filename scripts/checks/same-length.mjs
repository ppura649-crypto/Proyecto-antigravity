#!/usr/bin/env node
// checks/same-length.mjs <project-dir> <args-json>
// args: { final = "renders/final.mp4", base = "master.mp4", spine = "spine.mp4", frames = 1 }  paths relative to the project
// Contract: proves the finished file runs for exactly as long as the take it was drawn over. The layer is
//   drawn on the prepared take, so the delivered file and master.mp4 hold the same seconds, and the cut
//   spine behind that master holds them too when the take was cut. A drift of more than one frame is a
//   speed change or a lost tail, and neither of those shows in a still. Prints one JSON line:
//   { name, value: <the worst drift, in frames>, threshold, pass, reason }.
//   A missing file or a length nothing can read counts as a failure, because a check that could not run is one.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffbin, run } from "../_lib.mjs";

const dir = resolve(process.argv[2] || "");
const args = JSON.parse(process.argv[3] || "{}");
const allowed = args.frames ?? 1;
const say = (o) => { console.log(JSON.stringify({ name: "same-length", threshold: `${allowed} frame`, ...o })); process.exit(0); };
const at = (p) => (p.startsWith("/") ? p : join(dir, p));
const final = at(args.final ?? "renders/final.mp4");
const base = at(args.base ?? "master.mp4");
const spine = at(args.spine ?? "spine.mp4");

const ffprobe = ffbin("ffprobe");
if (!ffprobe) say({ value: null, pass: false, reason: "ffprobe is missing; run doctor" });
for (const [what, p] of [["the finished file", final], ["the take", base]])
  if (!existsSync(p)) say({ value: null, pass: false, reason: `${what} is missing: ${p}` });

const seconds = (path) => { try { return Number(run(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).trim()) || 0; } catch { return 0; } };
const rate = (path) => {
  try {
    const [n, d] = run(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", path]).trim().split("/").map(Number);
    return d ? n / d : n;
  } catch { return 0; }
};

const fps = rate(final) || 30;
const delivered = seconds(final);
if (!delivered) say({ value: null, pass: false, reason: "the finished file has no length anything can read" });
// The spine only exists when the take was cut. A take kept whole has master.mp4 and nothing behind it.
const against = [["master.mp4", base], ...(existsSync(spine) ? [["spine.mp4", spine]] : [])];
const worst = { name: "", frames: 0 };
for (const [name, path] of against) {
  const length = seconds(path);
  if (!length) say({ value: null, pass: false, reason: `${name} has no length anything can read` });
  const drift = Math.abs(delivered - length) * fps;
  if (drift > worst.frames) { worst.name = name; worst.frames = drift; }
}
const value = Math.round(worst.frames * 100) / 100;
const pass = value <= allowed;
say({
  value, pass,
  reason: pass
    ? `${delivered.toFixed(3)}s at ${Math.round(fps)} fps, the same length as ${against.map(([name]) => name).join(" and ")}`
    : `the finished file is ${value} frames away from ${worst.name}; the take was re-timed, or part of it never reached the file`,
});
