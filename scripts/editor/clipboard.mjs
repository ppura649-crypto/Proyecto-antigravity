// clipboard.mjs: copy, cut and paste of items, and paste style. Pure, tested with node --test.
//
// What is copied is a small payload: the items (their linked partners with them), the tracks they sat on, and the
// frame rate, so it can be pasted into another video. Paste puts the earliest item at the playhead and keeps every
// other item's distance from it; each item goes back to a track of the same name when that track is free there,
// otherwise to the nearest free one or a new one, and items that shared a track keep sharing one. Copies get new
// ids, and a linked group gets a new link of its own.
import { addItem, newId, withLinks, updateItem, itemById } from '../edit-doc.mjs';

export const CLIPBOARD_KEY = 'keyframes.editor.clipboard';
export const CLIPBOARD_VERSION = 1;

export function copyPayload(doc, ids) {
  const all = withLinks(doc, ids);
  // What was picked comes first (paste style reads the first), then the partners that came with it.
  const rank = (item) => (ids.includes(item.id) ? ids.indexOf(item.id) : ids.length);
  const items = doc.items.filter((item) => all.includes(item.id)).sort((a, b) => rank(a) - rank(b));
  if (!items.length) return null;
  const tracks = [...new Set(items.map((item) => item.track))].map((id) => {
    const track = doc.tracks.find((t) => t.id === id);
    return { id, name: track?.name ?? id, kind: track?.kind ?? 'visual' };
  });
  return { version: CLIPBOARD_VERSION, project: doc.project, fps: doc.fps, width: doc.width, height: doc.height, tracks, items: JSON.parse(JSON.stringify(items)) };
}

const scaleTime = (item, k) => {
  if (k === 1) return item;
  const r = (v) => (v == null ? v : Math.round(v * k));
  const out = { ...item, from: r(item.from), durationInFrames: Math.max(1, r(item.durationInFrames)), trimStart: r(item.trimStart ?? 0), fadeIn: r(item.fadeIn), fadeOut: r(item.fadeOut), sourceDurationInFrames: r(item.sourceDurationInFrames) };
  if (Array.isArray(item.words)) out.words = item.words.map((w) => ({ ...w, from: r(w.from), to: Math.max(r(w.from) + 1, r(w.to)) }));
  if (Array.isArray(item.pages)) out.pages = item.pages.map((p) => ({ ...p, from: r(p.from), to: r(p.to) }));
  for (const key of Object.keys(out)) if (out[key] === undefined) delete out[key];
  return out;
};

export function pasteItems(doc, payload, at) {
  if (!payload?.items?.length) return { doc, created: [] };
  const k = payload.fps && doc.fps ? doc.fps / payload.fps : 1;
  const items = payload.items.map((item) => scaleTime(item, k));
  const earliest = Math.min(...items.map((item) => item.from));
  const links = new Map();
  for (const item of items) if (item.link && !links.has(item.link)) links.set(item.link, newId('l'));
  const landed = new Map(); // source track id -> track it landed on here
  const created = [];
  let next = doc;
  // Earlier first, so an item's later neighbours from the same track follow it.
  for (const item of [...items].sort((a, b) => a.from - b.from)) {
    const source = payload.tracks?.find((t) => t.id === item.track);
    const same = next.tracks.find((t) => t.id === item.track && t.kind === source?.kind) ?? next.tracks.find((t) => t.name === source?.name && t.kind === source?.kind);
    const wanted = landed.get(item.track) ?? same?.id ?? null;
    const { id: _old, track: _track, link, ...rest } = item;
    const result = addItem(next, { ...rest, ...(link ? { link: links.get(link) } : {}) }, { track: wanted, at: at + item.from - earliest });
    next = result.doc;
    const placed = itemById(next, result.id);
    if (placed) landed.set(item.track, placed.track);
    created.push(result.id);
  }
  return { doc: next, created };
}

// The look of the first copied item, put on every selected item of a kind that can wear it: words and captions take
// its style (a caption keeps where it sits and how it pages), clips and pictures take fill, corners and opacity, and
// anything with sound takes volume and fades.
const WORDS = new Set(['text', 'caption']);
const PICTURE = new Set(['video', 'image']);
export function pasteStyle(doc, payload, ids) {
  const from = payload?.items?.[0];
  if (!from) return { doc, changed: [] };
  let next = doc;
  const changed = [];
  for (const id of ids) {
    const item = itemById(next, id);
    if (!item) continue;
    const patch = {};
    if (WORDS.has(item.type) && WORDS.has(from.type) && from.style) {
      const { y, wordsPerPage, ...look } = from.style;
      patch.style = { ...(item.style ?? {}), ...look, ...(item.type === from.type ? { y: y ?? item.style?.y, wordsPerPage: wordsPerPage ?? item.style?.wordsPerPage } : {}) };
      for (const key of Object.keys(patch.style)) if (patch.style[key] === undefined) delete patch.style[key];
    }
    if (PICTURE.has(item.type) && PICTURE.has(from.type)) {
      if (from.fit) patch.fit = from.fit;
      patch.radius = from.radius;
      patch.transform = { ...(item.transform ?? {}), opacity: from.transform?.opacity ?? 1 };
    }
    if ((item.type === 'video' || item.type === 'audio') && (from.type === 'video' || from.type === 'audio')) {
      patch.volume = from.volume ?? 1;
      patch.fadeIn = Math.min(from.fadeIn ?? 0, item.durationInFrames);
      patch.fadeOut = Math.min(from.fadeOut ?? 0, item.durationInFrames);
    }
    if (!Object.keys(patch).length) continue;
    next = updateItem(next, id, patch);
    // updateItem merges style; a pasted look replaces it, so set it whole.
    if (patch.style) next = { ...next, items: next.items.map((i) => (i.id === id ? { ...i, style: patch.style } : i)) };
    changed.push(id);
  }
  return { doc: next, changed };
}
