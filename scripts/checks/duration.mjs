#!/usr/bin/env node
// checks/duration.mjs <project-dir> <args-json: { min, max }>
// Contract: every .mp4 in <project>/renders/ has a duration inside [min, max] seconds.
import { readdirSync, existsSync } from "node:fs"; import { join } from "node:path";
import { ffbin, run } from "../_lib.mjs";
const dir = join(process.argv[2], "renders"); const { min = 3, max = 180 } = JSON.parse(process.argv[3] || "{}"); // Instagram reels allow up to 180 s; a format passes its own limits
const ffprobe = ffbin("ffprobe"); const bad = [];
for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith(".mp4")) : []) {
  const d = Number(run(ffprobe, ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", join(dir, f)]).trim());
  if (!(d >= min && d <= max)) bad.push(`${f} ${d.toFixed(1)}s`);
}
console.log(JSON.stringify({ name: "duration", value: bad.length, threshold: `${min}-${max}s`, pass: bad.length === 0, reason: bad.join(", ") }));
