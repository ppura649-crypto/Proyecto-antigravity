// Locate the reel owned by this workspace project. Never guess from the newest reel in the engine.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve, relative } from 'node:path';

export const readJson = (file) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };
const safeSlug = (s) => typeof s === 'string' && /^[a-z0-9][a-z0-9._-]{0,120}$/i.test(s);

export function reelSource(root, project, data = {}) {
  if (data.format && data.format !== 'full-visual') return null;
  const slug = [data.reelSlug, data.slug, project.replace(/^\d{4}-\d{2}-\d{2}-full-visual-/, '')].find((s) => safeSlug(s) && existsSync(join(root, 'engine/full-visual/reels', s, 'words.json')));
  if (!slug) return null;
  const dir = join(root, 'engine/full-visual/reels', slug);
  const words = readJson(join(dir, 'words.json'));
  const config = readJson(join(dir, 'reel.json')) ?? {};
  if (!(words?.duration > 0) || !words.words?.length || !words.scenes?.length || !Array.isArray(words.blocks)) return null;
  return { slug, dir, data: words, config, wordsPath: relative(root, join(dir, 'words.json')).split('\\').join('/') };
}

// The reader uses the engine's actual timing and theme, including future fixes. esbuild strips TypeScript in
// memory, so reading does not write into a project and works on every supported Node version.
const models = new Map();
export async function engineModel(root) {
  const engine = resolve(root, 'engine/full-visual/src');
  const sources = ['theme.ts', 'engine/timeline.ts'].map((p) => join(engine, p));
  const key = sources.map((p) => `${p}:${statSync(p).mtimeMs}`).join('|');
  if (!models.has(key)) {
    const require = createRequire(join(root, 'package.json'));
    const { build } = require('esbuild');
    const result = await build({ stdin: { contents: `export { theme, withOverrides } from ${JSON.stringify(sources[0])}; export { buildTimeline } from ${JSON.stringify(sources[1])};`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' });
    models.set(key, import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`));
  }
  return models.get(key);
}

// Match Stage.tsx's visible interval, including both sides of each handover. Separate lanes keep the overlap
// editable without dropping the outgoing scene's last frames.
export function sceneRange(scene, index, count, theme, total) {
  const scroll = theme.handover === 'scroll';
  const out = theme.motion === 'measured' && !scroll ? 11 : 9;
  const from = index === 0 ? 0 : Math.max(0, scene.from - 6);
  const to = index === count - 1 ? total : Math.min(total, scene.to - (scroll ? 6 : out - 4) + (scroll ? 13 : out));
  return { from, to };
}
