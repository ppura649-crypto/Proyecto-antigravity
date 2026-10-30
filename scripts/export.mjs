#!/usr/bin/env node
// export.mjs <project-dir> [--slug name]
// Contract: refuses unless <project>/project.json state is "checked". Copies renders/*.mp4, caption.txt, cover.jpg and sound-card.md
//   (Beat requires its complete posting package; other formats include them when present) plus format extras listed in props/export.json to workspace/output/<date>-<format>-<slug>/, sets state "exported",
//   mirrors to Drive when context/answers.json footage.drive is set (TODO(week 1): Composio Drive toolkit upload), regenerates the board.
import { existsSync, readdirSync, mkdirSync, copyFileSync, statSync, readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { P, readJson, writeJson, today, now, slug, fail } from "./_lib.mjs";
import { pathToFileURL } from 'node:url';
import { projectSteps } from './project-steps.mjs';
import { trialCaptionFiles } from './lib/trial-caption.mjs';

const dir = resolve(process.argv[2] || ""); const pj = readJson(join(dir, "project.json")); if (!pj) fail("usage: export.mjs <project-dir>");
if (pj.state !== "checked") fail(`project state is "${pj.state}"; run the checks first, a project exports only after every check passed`);
let workflow;
try { workflow = await projectSteps(dir); workflow?.requireVideoStep(dir, 'export'); }
catch (error) { fail(error.message); }
let trialCaptions=[];
try { if(pj.format==='trial-reels')trialCaptions=trialCaptionFiles(dir,process.cwd()); }
catch(error){fail(error.message);}
if (pj.format === 'trial-reels') {
  try {
    const {checkProjectAudio} = await import(pathToFileURL(P('scripts/trial-reels/source-audio.mjs')));
    checkProjectAudio(dir);
  } catch(error) { fail(error.message); }
}
if (pj.format === 'product-demo') {
  // Editable delivery belongs to the export contract, so a finished film always carries it.
  try { execFileSync(process.execPath, [P('scripts', 'product-demo', 'source.mjs'), dir], { stdio: 'pipe' }); }
  catch (error) { fail(`The editable project could not be packed: ${String(error.stderr || error.message).slice(0, 300)}`); }
}
if (pj.format === 'beat-montage') {
  const present = path => { try { return statSync(path).isFile() && statSync(path).size > 0; } catch { return false; } };
  const required = ['caption.txt', 'cover.jpg', ...(pj.silent === false ? [] : ['sound-card.md'])];
  const missing = required.filter(name => !present(join(dir, name)) || /\.(txt|md)$/.test(name) && !readFileSync(join(dir, name), 'utf8').trim());
  if (missing.length) fail(`Finish the Beat Montage package first: ${missing.join(', ')}.`);
  if (!existsSync(join(dir, 'renders')) || !readdirSync(join(dir, 'renders')).some(name => name.endsWith('.mp4') && present(join(dir, 'renders', name)))) fail('Render the Beat Montage video before exporting.');
}
const argSlug = process.argv.includes("--slug") ? process.argv[process.argv.indexOf("--slug") + 1] : null;
const name = `${today()}-${pj.format}-${slug(argSlug || pj.slug || basename(dir).replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(new RegExp(`^${pj.format}-`), "") || "post")}`;   // the format can be two words: trial-reels
const out = P("workspace", "output", name); mkdirSync(out, { recursive: true });
const copied = [];
const take = (from, to = basename(from)) => { if (existsSync(from)) { copyFileSync(from, join(out, to)); if(!copied.includes(to))copied.push(to); } };
for (const f of existsSync(join(dir, "renders")) ? readdirSync(join(dir, "renders")).filter((x) => x.endsWith(".mp4")) : []) take(join(dir, "renders", f));
for (const f of ["caption.txt", "cover.jpg", "sound-card.md", "brief.md"]) take(join(dir, f));
if (pj.format === 'product-demo') take(join(dir, 'editable-project.zip'));
for (const f of readJson(join(dir, "props", "export.json"), [])) take(join(dir, f));
for(const caption of trialCaptions)take(caption.from,caption.to);
if (!copied.some((f) => f.endsWith(".mp4"))) fail("no rendered mp4 in renders/");
pj.state = "exported"; pj.exported_at = now(); pj.output = `workspace/output/${name}`; writeJson(join(dir, "project.json"), pj);
try { workflow?.recordVideoExport(dir); }
catch (error) { fail(error.message); }
const drive = readJson(P("context", "answers.json"), {})?.footage?.drive;
if (drive) console.log(`todo  Drive mirror to Keyframes/${pj.format}/output/${today()}/ (Composio Drive toolkit, week 1)`);
try { execFileSync(process.execPath, [P("scripts", "board.mjs")], { stdio: "inherit" }); } catch {}
console.log(`exported ${copied.length} files -> workspace/output/${name}`);

