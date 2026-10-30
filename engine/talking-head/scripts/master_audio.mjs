#!/usr/bin/env node
// spine.mp4 -> master.mp4 : highpass + denoise + two-pass loudnorm to -14 LUFS + true-peak limiter.
// Video is copied, never re-encoded. The Node form of master_audio.sh, step for step, for every system:
// same files (ln.json, master.cmd while it runs, master.tmp.mp4, master.mp4), same ffmpeg arguments, same output.
// Usage: node scripts/master_audio.mjs <project_dir>
import { renameSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { folder, grepAfter, runFf, sedRange } from "./_run.mjs";

const arg = process.argv[2];
const P = folder(arg);
if (!P) { console.error(`cd: ${arg}: No such file or directory`); process.exit(1); }
const CHAIN = "highpass=f=70,afftdn=nr=8:nf=-58";
const both = (r) => Buffer.concat([r.stdout ?? Buffer.alloc(0), r.stderr ?? Buffer.alloc(0)]).toString("latin1");

// pass 1: measure. Like `2>&1 | sed -n '/{/,/}/p' > ln.json`, only the JSON block is kept, whatever ffmpeg returns.
const m = runFf("ffmpeg", ["-y", "-v", "info", "-i", "spine.mp4", "-af", `${CHAIN},loudnorm=I=-14:TP=-1:LRA=11:print_format=json`, "-f", "null", "-"], { cwd: P, stdio: ["ignore", "pipe", "pipe"] });
const block = sedRange(both(m));
writeFileSync(`${P}/ln.json`, Buffer.from(block.map((l) => l + "\n").join(""), "latin1"));
let j;
try { j = JSON.parse(readFileSync(`${P}/ln.json`, "utf8")); }
catch (e) { console.error(`ln.json: ${e.message}`); process.exit(1); }
const af = `${CHAIN},loudnorm=I=-14:TP=-1:LRA=11:` +
  `measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:` +
  `measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,` +
  "aresample=192000,alimiter=level_in=1:level_out=1:limit=0.80:attack=5:release=50:level=disabled,aresample=48000";
const args = ["-y", "-v", "error", "-i", "spine.mp4", "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "master.tmp.mp4"];
// master.cmd is the exact second pass as text, left behind only when that pass fails (as the shell version does)
writeFileSync(`${P}/master.cmd`, `ffmpeg -y -v error -i spine.mp4 -af '${af}' -c:v copy -c:a aac -b:a 192k master.tmp.mp4`);
console.log("measured:", j.input_i, "LUFS  TP", j.input_tp, " LRA", j.input_lra);

// pass 2: apply. A failure here does not stop the measurement below, exactly like `sh master.cmd && rm && mv`.
const r = runFf("ffmpeg", args, { cwd: P, stdio: "inherit" });
if (r.status === 0) {
  rmSync(`${P}/master.cmd`);
  renameSync(`${P}/master.tmp.mp4`, `${P}/master.mp4`);
}
console.log("--- master.mp4 measured ---");
const e = runFf("ffmpeg", ["-hide_banner", "-i", "master.mp4", "-af", "ebur128=peak=true", "-f", "null", "-"], { cwd: P, stdio: ["ignore", "pipe", "pipe"] });
const lines = grepAfter(both(e), /Summary/, 14).filter((l) => /I:|LRA:|Peak:/.test(l));
if (lines.length) process.stdout.write(Buffer.from(lines.map((l) => l + "\n").join(""), "latin1"));
process.exit(lines.length ? 0 : 1);   // the shell version ends on grep, which fails when nothing matched
