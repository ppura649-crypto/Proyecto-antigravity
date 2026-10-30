// A format owns its gates. Shared finishing commands call them before changing a project.
import { existsSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson } from './_lib.mjs';

export async function projectSteps(dir, root = process.cwd()) {
  dir = resolve(dir);
  const project = readJson(join(dir, 'project.json'), {});
  const talking = project.format === 'talking-head' || basename(dir).includes('-talking-head-');
  const list = ['scroll-reel', 'research-reel'].includes(project.format) || /-(?:scroll-reel|research-reel)-/.test(basename(dir));
  const phone = project.format === 'phone';
  if (!talking && !list && !phone) return null;
  // Talking Head's progress is read from its engine's own files by the workspace, so the format ships no steps script.
  if (talking) return import('./talking-head-progress.mjs');
  const script = join(root, phone ? 'scripts/quick-cuts/phone/steps.mjs' : 'scripts/quick-cuts/scroll/steps.mjs');
  if (!existsSync(script)) throw new Error(`${phone ? 'One-shot Reel' : 'List Reel'} video steps are missing. Update this format before finishing the video.`);
  return import(pathToFileURL(script).href);
}
