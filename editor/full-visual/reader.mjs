// A Full Visual reel becomes its original moving scenes, editable spoken words, background and voice.
// A render alone stays a render: never add editable copies on top of words already burned into the picture.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { engineModel, reelSource, sceneRange } from './source.mjs';

export const formats = ['full-visual'];
export const CAPTION_LOOK = 'full-visual/captions';
async function projectBuild(context) {
  try {
    if (context.buildProject) return await context.buildProject();
    const { buildEditor } = await import(pathToFileURL(join(context.root, 'scripts/edit-build.mjs')).href);
    const result = await buildEditor(context.root, { project: context.project.id });
    return { ok: result.project === context.project.id, scenes: result.scenes ?? [] };
  } catch (error) { return { ok: false, error: error?.errors?.[0]?.text ?? error.message }; }
}

export async function read(context) {
  const { root, project } = context;
  if (!root) return null;
  const reel = reelSource(root, project.id, project.data);
  if (!reel) return null;
  const bundle = await projectBuild(context);
  if (!bundle.ok || reel.data.scenes.some((s) => !bundle.scenes?.includes(s.id))) {
    const output = context.output?.();
    if (!output || !context.finishedVideoDoc) return null;
    const flat = await context.finishedVideoDoc(output);
    return flat && { ...flat, source: { ...(flat.source ?? {}), scenes: 'render', notes: ['The scene code could not be opened. Captions and motion are part of the finished picture.'], ...(bundle.error ? { bundleError: bundle.error } : {}) } };
  }
  const { theme: base, withOverrides, buildTimeline } = await engineModel(root);
  const theme = withOverrides(base, reel.config.theme);
  const tl = buildTimeline(reel.data, theme);
  const { fps, frames: total } = tl;
  const tracks = [];
  const items = [];
  const track = (id, name, kind = 'visual') => { if (!tracks.some((t) => t.id === id)) tracks.push({ id, name, kind }); return id; };
  const baseItem = (id, lane, type, from, to, label) => ({ id, track: lane, type, from, durationInFrames: to - from, trimStart: 0, label });

  if (reel.config.chrome && reel.config.chrome.type !== 'none') items.push({ ...baseItem('chrome', track('overlays', 'Overlays'), 'layer', 0, total, 'Pinned graphic'), renderer: 'full-visual/chrome', data: { config: reel.config.chrome } });
  for (const [i, block] of tl.blocks.entries()) {
    const from = Math.max(0, block.from), to = Math.min(total, block.to);
    if (to <= from) continue;
    const words = block.words.map((n) => ({ text: tl.words[n].w, from: Math.max(0, tl.words[n].f - from), to: Math.max(1, Math.min(to - from, tl.words[n].fe - from)), fv: { key: tl.words[n].key, emoji: tl.words[n].emoji } }));
    for (const w of words) w.to = Math.max(w.from + 1, w.to);
    const indices = words.map((_, n) => n);
    const br = block.br === undefined ? -1 : block.words.indexOf(block.br);
    const y = (block.slot === 'bottom' ? theme.caption.bottom : theme.caption.top) / 1920;
    items.push({ ...baseItem(`caption-${i + 1}`, track('captions', 'Captions'), 'caption', from, to, words.map((w) => w.text).join(' ')), words,
      pages: [{ from: 0, to: to - from, lines: br > 0 ? [indices.slice(0, br), indices.slice(br)] : [indices] }],
      style: { look: CAPTION_LOOK, font: theme.font.caption.split(',')[0].replace(/["']/g, '').trim(), size: theme.caption.size, y, maxWidth: theme.caption.wrap / 1080, shadow: false, animation: 'word', fv: { slot: block.slot, sourceFrom: from, last: i === tl.blocks.length - 1, y } },
    });
  }
  // Later scenes draw above earlier ones, exactly as Stage renders the overlapping handover.
  for (const [i, scene] of [...tl.scenes.entries()].reverse()) {
    const { from, to } = sceneRange(scene, i, tl.scenes.length, theme, total);
    items.push({ ...baseItem(`scene-${scene.id}`, track(`graphics-${i + 1}`, `Graphics ${i + 1}`), 'layer', from, to, scene.id.replace(/[-_]/g, ' ')), renderer: `full-visual/scene-${scene.id}`, data: { scene: scene.id, clockFrame: from } });
  }
  items.push({ ...baseItem('ground', track('background', 'Background'), 'layer', 0, total, 'Background'), renderer: 'full-visual/ground' });
  const voice = ['mp3', 'wav', 'm4a'].map((ext) => `engine/full-visual/public/${reel.slug}/voice.${ext}`).find((p) => existsSync(join(root, p)));
  if (voice) {
    const info = await context.probe(voice).catch(() => null);
    const length = info ? Math.round(info.duration * fps) : total;
    if (length > 0) items.push({ ...baseItem('voice', track('voice', 'Voice', 'audio'), 'audio', 0, Math.min(total, length), 'Voice'), src: voice, sourceDurationInFrames: length, volume: 1 });
  }
  return { fps, width: 1080, height: 1920, tracks, items, markers: tl.scenes.map((s) => ({ frame: s.from, kind: 'cue', label: s.id })), background: theme.grounds[tl.scenes[0].ground].bg,
    source: { files: { words: reel.wordsPath }, scenes: 'project', fullVisual: { data: reel.data, config: reel.config }, notes: voice ? [] : ['The voice file is missing.'] },
  };
}
