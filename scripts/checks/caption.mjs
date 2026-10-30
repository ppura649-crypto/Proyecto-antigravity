#!/usr/bin/env node
// checks/caption.mjs <project-dir> <args-json>
// Contract: runs the caption check on <project>/caption.txt; passes when it prints ok.
import { spawnSync } from "node:child_process"; import { join } from "node:path"; import { existsSync, readFileSync } from "node:fs";
const require_read = (p) => readFileSync(p, "utf8");
const dir = process.argv[2]; const args = JSON.parse(process.argv[3] || "{}");
const file = join(dir, "caption.txt");
const pj = existsSync(join(dir, "project.json")) ? JSON.parse(require_read(join(dir, "project.json"))) : {};
if (!existsSync(file)) { console.log(JSON.stringify({ name: "caption", value: null, threshold: null, pass: false, reason: "caption.txt missing" })); process.exit(0); }
const r = spawnSync(process.execPath, [join(process.cwd(), ".agents", "skills", "captions", "scripts", "check-caption.mjs"), file, ...(args.screenKeyword ? ["--screen-keyword", args.screenKeyword] : []), ...(pj.output ? ["--self", pj.output] : [])], { encoding: "utf8" });
const reasons = (r.stdout || "").split("\n").filter((l) => l.startsWith("fail:")).map((l) => l.slice(6));
console.log(JSON.stringify({ name: "caption", value: reasons.length, threshold: 0, pass: r.status === 0, reason: reasons.join("; ") }));
