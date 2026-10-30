#!/usr/bin/env node
// Full render on a nearly full disk: three video-only ranged renders (Remotion keeps every frame of a range as a
// JPEG in the temp folder until it stitches, ~1 MB per frame), concat, then the master's audio muxed back.
// The Node form of render_parts.sh, step for step, for every system: same parts, same logs, same messages.
// Usage: node scripts/render_parts.mjs <project_dir> [parts=3]
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statfsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { HERE, folder, runFf } from "./_run.mjs";

const arg = process.argv[2];
const P = folder(arg);
if (!P) { console.error(`cd: ${arg}: No such file or directory`); process.exit(1); }
const PARTS = parseInt(process.argv[3] ?? "3", 10);
const REMOTION = resolve(HERE, "../remotion");
if (!existsSync(REMOTION)) process.exit(1);
const parts = join(P, "parts");
mkdirSync(parts, { recursive: true });
for (const f of readdirSync(parts)) if (/^p.*\.mp4$/.test(f) || f === "list.txt") rmSync(join(parts, f), { force: true });
let FRAMES;
try { const c = JSON.parse(readFileSync(join(P, "captions.json"), "utf8")); FRAMES = Math.ceil(c.durationMs / 1000 * c.fps); }
catch (e) { console.error(`captions.json: ${e.message}`); process.exit(1); }
const SIZE = Math.floor((FRAMES + PARTS - 1) / PARTS);
const clean = () => {
  const dir = tmpdir();
  try { for (const e of readdirSync(dir)) if (e.startsWith("react-motion-render") || e.startsWith("remotion-webpack-bundle-")) rmSync(join(dir, e), { recursive: true, force: true }); } catch {}
};
// what `df -h /` prints as Avail, in its own units
const free = () => {
  try {
    const s = statfsSync(process.platform === "win32" ? resolve("/") : "/");
    let n = Number(s.bavail) * Number(s.bsize), u = 0;
    const units = ["B", "Ki", "Mi", "Gi", "Ti", "Pi"];
    while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
    return (n < 10 && u > 0 ? n.toFixed(1) : String(Math.round(n))) + units[u];
  } catch { return "?"; }
};
let start = 0;
while (start < FRAMES) {
  let end = start + SIZE - 1; if (end >= FRAMES) end = FRAMES - 1;
  const log = openSync(join(parts, `p${start}.log`), "w");
  const r = spawnSync(process.execPath, ["render.mjs", P, `--range=${start}:${end}`, "--muted", "--out", join(parts, `p${start}.mp4`)], { cwd: REMOTION, stdio: ["inherit", log, log] });
  closeSync(log);
  const rc = r.status ?? 1;
  clean();
  console.log(`part ${start}:${end} exit ${rc}, free ${free()}`);
  if (rc !== 0) { const t = readFileSync(join(parts, `p${start}.log`)); process.stdout.write(t.subarray(Math.max(0, t.length - 600))); process.exit(1); }
  appendFileSync(join(parts, "list.txt"), `file 'p${start}.mp4'\n`);
  start = end + 1;
}
const c = runFf("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", join(parts, "list.txt"), "-i", join(P, "master.mp4"),
  "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", join(P, "captioned.mp4")], { cwd: REMOTION, stdio: "inherit" });
if (c.status !== 0) process.exit(1);
for (const f of readdirSync(parts)) if (/^p.*\.mp4$/.test(f)) rmSync(join(parts, f), { force: true });
console.log(`Done: ${join(P, "captioned.mp4")} (${FRAMES} frames in ${PARTS} parts)`);
