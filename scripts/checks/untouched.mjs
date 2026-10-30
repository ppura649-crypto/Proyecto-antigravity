#!/usr/bin/env node
// checks/untouched.mjs <project-dir> <args-json>
// args: { base, layer, final, samples = 8, minDb = 40, minClear = 0.5 }  paths relative to the project
// Contract: proves that the finished video is the buyer's own picture with a layer laid on top,
//   and not their picture redrawn. Reads the layer's own alpha channel to know exactly which
//   pixels the layer touched, and compares the base clip with the finished file at several
//   moments over ONLY the pixels it did not touch. Prints one JSON line:
//   { name, value: <the worst of those comparisons, in dB>, threshold, pass, reason }.
//
// Two things are measured, because they prove different halves of the same promise.
//
// How much of the layer is empty. This is the real proof that the footage never went through the
// renderer: a layer that was drawn over the face would be opaque everywhere, and this number would
// collapse. On a finished reel the layer is empty over most of the frame, because it is a layer.
//
// How far the picture drifts outside the layer, in dB. Byte for byte is not available once
// anything is burned in, since the file is written again; measured over three generations of the
// same clip the drift is about a decibel each, so this number is not a generation counter. What it
// does catch is the whole class of accidents that would actually show: a re-scale, a colour space
// change, a second pass at a lower quality, a filter left on. Around 42 dB is the cost of writing
// the file once, which is about two levels out of 255 and invisible on a phone.
//
// A missing file, a layer with no alpha channel, or ffmpeg failing all count as a failure, because
// a check that could not run is a failure.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ffbin } from "../_lib.mjs";

const dir = resolve(process.argv[2] || "");
const args = JSON.parse(process.argv[3] || "{}");
const say = (o) => { console.log(JSON.stringify({ name: "untouched", threshold: args.minDb ?? 40, ...o })); process.exit(0); };

const at = (p) => (p ? (p.startsWith("/") ? p : join(dir, p)) : null);
const base = at(args.base ?? "mezzanine.mp4");
const layer = at(args.layer ?? "layer.mov");
const final = at(args.final ?? "final.mp4");
const samples = Math.max(2, args.samples ?? 8);
const minDb = args.minDb ?? 40;
const minClear = args.minClear ?? 0.5;

for (const [what, p] of [["base", base], ["layer", layer], ["final", final]])
  if (!p || !existsSync(p)) say({ value: null, pass: false, reason: `${what} not found: ${p}` });

const ff = (a) => spawnSync(ffbin("ffmpeg"), a, { encoding: "buffer", maxBuffer: 1 << 30 });
const probe = (a) => spawnSync(ffbin("ffprobe"), a, { encoding: "utf8" }).stdout?.trim() ?? "";

const pix = probe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt", "-of", "csv=p=0", layer]);
if (!/a/.test(pix)) say({ value: null, pass: false, reason: `the layer has no alpha channel (${pix}); it was not rendered with --alpha` });

const dur = Number(probe(["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", layer])) || 0;
const w = Number(probe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width", "-of", "csv=p=0", base]));
const h = Number(probe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", base]));
if (!dur || !w || !h) say({ value: null, pass: false, reason: "could not read the size or the length of the files" });

// one gray frame as raw bytes, so the comparison is done here rather than trusted to a filter
const gray = (file, t, alpha = false) => {
  const vf = alpha ? "alphaextract,format=gray" : "format=gray";
  const r = ff(["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", `${vf},scale=${w}:${h}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"]);
  return r.status === 0 && r.stdout?.length === w * h ? r.stdout : null;
};

const worst = { db: Infinity, t: null, share: 1 };
let clearSum = 0, clearN = 0;
for (let i = 0; i < samples; i++) {
  const t = +((i + 0.5) * (dur / samples)).toFixed(3);
  const [b, f, a] = [gray(base, t), gray(final, t), gray(layer, t, true)];
  if (!b || !f || !a) say({ value: null, pass: false, reason: `could not read a frame at ${t}s from all three files` });
  let sum = 0, n = 0;
  for (let p = 0; p < a.length; p++) {
    if (a[p] > 8) continue; // the layer drew here, so it is not evidence either way
    const d = b[p] - f[p];
    sum += d * d; n++;
  }
  clearSum += n / a.length; clearN++;
  if (n < 0.02 * a.length) continue; // the layer covers almost everything at this moment
  const mse = sum / n;
  const db = mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
  if (db < worst.db) { worst.db = db; worst.t = t; worst.share = n / a.length; }
}

if (worst.t === null) say({ value: null, pass: false, reason: "every sampled frame was covered by the layer, so the layer is not a layer" });
const value = Math.round(worst.db * 10) / 10;
const clear = clearN ? clearSum / clearN : 0;
const levels = Math.round((255 / Math.pow(10, worst.db / 20)) * 100) / 100;
const enough = clear >= minClear;
const pass = value >= minDb && enough;
say({
  value, pass,
  reason: !enough
    ? `the layer is only ${Math.round(clear * 100)} % empty; a layer drawn over the footage instead of beside it (wanted ${Math.round(minClear * 100)} %)`
    : pass
      ? `the layer is ${Math.round(clear * 100)} % empty and outside it the picture drifts ${levels} of 255 levels at worst, at ${worst.t}s`
      : `at ${worst.t}s the picture outside the layer drifts ${levels} of 255 levels (${value} dB, wanted ${minDb}); something re-scaled, re-graded or wrote the footage a second time`,
});
