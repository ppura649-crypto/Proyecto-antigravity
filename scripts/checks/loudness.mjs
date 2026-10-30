#!/usr/bin/env node
// checks/loudness.mjs <project-dir> <args-json>
// args: { final = "renders/final.mp4", target = -14, tolerance = 1, peak = -1 }  the path is relative to the project
// Contract: proves the finished file is as loud as the platforms play it back at, and never louder than a
//   phone speaker can hold. Measured once over the whole delivered file with the loudness meter, so the
//   number is the one the platform will read: the integrated loudness within a loudness unit of the target,
//   and the true peak under the ceiling. A mix laid on the voice moves both, which is why this is read
//   after the sound rather than before it. Prints one JSON line:
//   { name, value: <the integrated loudness in LUFS>, threshold, pass, reason }.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ffbin, ffenv } from "../_lib.mjs";

const dir = resolve(process.argv[2] || "");
const args = JSON.parse(process.argv[3] || "{}");
const target = args.target ?? -14, tolerance = args.tolerance ?? 1, peak = args.peak ?? -1;
const say = (o) => { console.log(JSON.stringify({ name: "loudness", threshold: `${target} LUFS within ${tolerance} LU, true peak under ${peak} dBTP`, ...o })); process.exit(0); };
const at = (p) => (p.startsWith("/") ? p : join(dir, p));
const final = at(args.final ?? "renders/final.mp4");
if (!existsSync(final)) say({ value: null, pass: false, reason: `the finished file is missing: ${final}` });

const ffmpeg = ffbin("ffmpeg");
if (!ffmpeg) say({ value: null, pass: false, reason: "ffmpeg is missing; run doctor" });
// The meter prints its reading as JSON on the error stream, after everything else it has to say.
const r = spawnSync(ffmpeg, ["-nostats", "-hide_banner", "-i", final, "-af", `loudnorm=I=${target}:TP=${peak}:LRA=11:print_format=json`, "-f", "null", "-"],
  { encoding: "utf8", maxBuffer: 1 << 26, env: ffenv(ffmpeg) });
const text = `${r.stderr || ""}`;
const start = text.lastIndexOf("{"), end = text.lastIndexOf("}");
let measured = null;
if (start > -1 && end > start) { try { measured = JSON.parse(text.slice(start, end + 1)); } catch { measured = null; } }
if (!measured?.input_i) say({ value: null, pass: false, reason: `the loudness of the finished file could not be measured: ${text.trim().split("\n").pop()?.slice(0, 160) ?? ""}` });

const loudness = Number(measured.input_i), truePeak = Number(measured.input_tp);
if (!Number.isFinite(loudness) || !Number.isFinite(truePeak)) say({ value: null, pass: false, reason: "the meter returned no reading for this file" });
const value = Math.round(loudness * 100) / 100;
const off = Math.abs(loudness - target);
const pass = off <= tolerance && truePeak < peak;
say({
  value, pass,
  reason: pass
    ? `${value} LUFS with a true peak of ${truePeak} dBTP`
    : off > tolerance
      ? `${value} LUFS is ${Math.round(off * 100) / 100} LU from ${target}; the voice will play back ${loudness < target ? "quieter" : "louder"} than everything around it`
      : `the true peak is ${truePeak} dBTP, over the ${peak} ceiling; it will clip on a phone speaker`,
});
