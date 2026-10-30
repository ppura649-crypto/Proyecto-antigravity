#!/usr/bin/env node
// checks/still-exists.mjs <project-dir> <args-json>
// Contract: passes when <project>/renders/ holds at least one .png still older than the newest .mp4 (a still before every video).
import { existsSync, readdirSync, statSync } from "node:fs"; import { join } from "node:path";
const dir = join(process.argv[2], "renders");
const files = existsSync(dir) ? readdirSync(dir) : [];
const pngs = files.filter((f) => f.endsWith(".png")).map((f) => statSync(join(dir, f)).mtimeMs);
const mp4s = files.filter((f) => f.endsWith(".mp4")).map((f) => statSync(join(dir, f)).mtimeMs);
const pass = pngs.length > 0 && (mp4s.length === 0 || Math.min(...pngs) <= Math.max(...mp4s));
console.log(JSON.stringify({ name: "still-exists", value: pngs.length, threshold: 1, pass, reason: pass ? "" : "no still rendered before the video" }));
