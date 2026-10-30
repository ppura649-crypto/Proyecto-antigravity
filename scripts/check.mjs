#!/usr/bin/env node
// check.mjs <project-dir>
// Contract: reads <project>/props/checks.json: [ { name, args: {} } ], runs scripts/checks/<name>.mjs for each with the project dir
//   and args as JSON on argv, collects { name, value, threshold, pass, reason } from each check's stdout (one JSON object),
//   writes <project>/check.json and sets project.json state to "checked" only when every check passed.
//   A check whose script is missing, crashes or prints nothing is recorded as a fail. Exits 1 when any check fails.
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { P, readJson, writeJson, now, fail } from "./_lib.mjs";
import { projectSteps } from './project-steps.mjs';

const dir = resolve(process.argv[2] || ""); if (!existsSync(join(dir, "project.json"))) fail("usage: check.mjs <project-dir>");
const wanted = readJson(join(dir, "props", "checks.json"), null); if (!wanted) fail("props/checks.json missing; a project with no checks cannot pass");
if (!Array.isArray(wanted) || !wanted.length) fail('A project with no checks cannot pass.');
let workflow;
try { workflow = await projectSteps(dir); workflow?.requireVideoStep(dir, 'review'); }
catch (error) { fail(error.message); }
if (readJson(join(dir,'project.json'),{}).format === 'trial-reels' && !wanted.some(c => c.name === 'sourceaudio')) wanted.push({name:'sourceaudio'});
const results = [];
for (const c of wanted) {
  const script = P("scripts", "checks", `${c.name}.mjs`);
  const packScript = readdirSync(P("scripts"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => P("scripts", d.name, "checks", `${c.name}.mjs`)).find(existsSync);
  const bin = existsSync(script) ? script : packScript;
  if (!bin) { results.push({ name: c.name, value: null, threshold: null, pass: false, reason: "check script not found; a skipped check is a fail" }); continue; }
  const r = spawnSync(process.execPath, [bin, dir, JSON.stringify(c.args ?? {})], { encoding: "utf8" });
  let parsed = null; try { parsed = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if (r.status !== 0 || !parsed) results.push({ name: c.name, value: null, threshold: null, pass: false, reason: `check crashed or printed nothing: ${(r.stderr || "").trim().slice(0, 160)}` });
  else results.push({ name: c.name, value: parsed.value ?? null, threshold: parsed.threshold ?? null, pass: Boolean(parsed.pass), reason: parsed.reason ?? "" });
}
writeJson(join(dir, "check.json"), results);
const ok = results.every((r) => r.pass);
const pj = readJson(join(dir, "project.json"), {}); pj.state = ok ? "checked" : pj.state === 'checked' || pj.state === 'exported' ? 'review' : pj.state; pj.checked_at = now(); writeJson(join(dir, "project.json"), pj);
try { if (ok) workflow?.recordVideoCheck(dir); else workflow?.refreshVideoSteps(dir); }
catch (error) { fail(error.message); }
for (const r of results) console.log(`${r.pass ? "pass" : "FAIL"} ${r.name.padEnd(22)} ${r.reason || ""}`);
process.exit(ok ? 0 : 1);
