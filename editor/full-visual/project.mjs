// Each reel owns its scene code. Register only this reel, without importing the engine's webpack-only registry.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, reelSource } from './source.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export async function projectLayers({ root, project, dir, out }) {
  const projectData = readJson(join(dir, 'project.json')) ?? {};
  if (projectData.format !== 'full-visual' && !project.includes('-full-visual-')) return null;
  const reel = reelSource(root, project, projectData);
  const scenes = reel && join(reel.dir, 'scenes/index.tsx');
  if (!scenes || !existsSync(scenes)) return null;
  const module = join(out, 'project-layers.tsx');
  const spec = (p) => JSON.stringify(p.split('\\').join('/'));
  const text = `// This reel's scenes, with their original motion and timing.\nimport * as sceneModule from ${spec(scenes)};\nimport { makeSceneLayers } from ${spec(join(here, 'layers.tsx'))};\nexport const layers = makeSceneLayers(sceneModule.scenes, sceneModule.editableScenes ?? {});\n`;
  mkdirSync(out, { recursive: true });
  if (!existsSync(module) || readFileSync(module, 'utf8') !== text) writeFileSync(module, text);
  return { module, sources: [join(root, 'engine/full-visual/src'), reel.dir, here], scenes: reel.data.scenes.map((s) => s.id) };
}
