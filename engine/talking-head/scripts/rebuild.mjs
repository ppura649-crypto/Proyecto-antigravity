#!/usr/bin/env node
// Re-run the chain after a cuts.json save: spine -> master -> captions. The Node form of rebuild.sh, step for
// step, for every system: same steps, same files, same ffmpeg arguments, same exit codes.
// Usage: node scripts/rebuild.mjs <project_dir>   (then: node remotion/render.mjs <project_dir>)
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { HERE, folder, python, runFf, sedRange } from "./_run.mjs";

const arg = process.argv[2];
const P = folder(arg);
if (!P) { console.error(`cd: ${arg}: No such file or directory`); process.exit(1); }
const ENGINE = resolve(HERE, "..");
const both = (r) => Buffer.concat([r.stdout ?? Buffer.alloc(0), r.stderr ?? Buffer.alloc(0)]).toString("latin1");
const must = (r) => { if (r.status !== 0) process.exit(r.status ?? 1); };

must(python(join(ENGINE, "scripts/render_spine.py"), [P, "--preset", "fast"], { cwd: ENGINE, stdio: "inherit" }));
const m = runFf("ffmpeg", ["-y", "-v", "info", "-i", "spine.mp4", "-af", "highpass=f=70,afftdn=nr=8:nf=-58,loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], { cwd: P, stdio: ["ignore", "pipe", "pipe"] });
writeFileSync(`${P}/ln.json`, Buffer.from(sedRange(both(m)).map((l) => l + "\n").join(""), "latin1"));
let j;
try { j = JSON.parse(readFileSync(`${P}/ln.json`, "utf8")); }
catch (e) { console.error(`ln.json: ${e.message}`); process.exit(1); }
const af = "highpass=f=70,afftdn=nr=8:nf=-58," +
  `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:` +
  `measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:` +
  `offset=${j.target_offset}:linear=true`;
// master.cmd is the exact second pass as text, left behind only when that pass fails (as the shell version does)
writeFileSync(`${P}/master.cmd`, `ffmpeg -y -v error -i spine.mp4 -af '${af}' -c:v copy -c:a aac -b:a 192k master.mp4`);
const r = runFf("ffmpeg", ["-y", "-v", "error", "-i", "spine.mp4", "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "master.mp4"], { cwd: P, stdio: "inherit" });
if (r.status === 0) rmSync(`${P}/master.cmd`);   // a failure here does not stop the captions, exactly like `sh master.cmd && rm`
must(python(join(ENGINE, "scripts/build_captions.py"), [P], { cwd: ENGINE, stdio: "inherit" }));
