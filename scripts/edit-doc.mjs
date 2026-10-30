// edit-doc.mjs: the one timeline every video can be opened as, and every change made to it by hand.
//
// A format keeps its own files while it builds a video. Once there is a video to look at, a reader turns those files
// into this document (projects/<id>/edit/timeline.json) and from then on the editor, the export and the agent all read
// the same thing. Time is in frames at the video's fps, always: the formats mix milliseconds, seconds and frames, and
// one unit here is what lets a trim in the editor land on the same frame the export renders.
//
// Every function below is pure: it takes a document and returns a new one, never touching the old, so the editor's
// undo is a list of documents and the export can check exactly what it was given. The same file is bundled into the
// editor page and imported by the export script.
//
// Shape (version 1):
//   { version, project, format, fps, width, height, durationInFrames, background,
//     tracks: [{ id, name, kind: 'visual'|'audio', hidden, muted, locked }],   first track is drawn on top
//     items:  [{ id, track, type, from, durationInFrames, trimStart, label, ...by type }],
//     markers: [{ frame, kind: 'beat'|'cue', label }], source: { reader, readAt, files } }
// Item types:
//   video  src, preview (a lighter copy for the editor), sourceDurationInFrames, volume, speed, fadeIn, fadeOut, fit
//          size { w, h } and radius (rounded corners, frame pixels) when the clip sits in a window, not full frame
//   audio  src, sourceDurationInFrames, volume, speed, fadeIn, fadeOut
//   image  src, fit, size, radius
//   text   text, style { font, size, weight, color, align, background, stroke, caps, look }
//   caption words [{ text, from, to }] in frames on the item's own clock (trimStart skips into it), optional
//          pages [{ from, to, lines: [[wordIndex]] }] when the format decided the paging, style { look, ... }
//   layer  renderer ('<format>/<kind>'), data: drawn by the format's own component, so its look never changes
// Any item may carry agent: { task, note, ref? } (needs the agent before the export: a pack's look or reader sets it,
// the export refuses while it is there, `edit.mjs resolve` clears it) and missing: '<reason>' (its format cannot draw it
// here: the export leaves it out and names it).
// Any item may carry link: '<id>'. Items sharing a link are one group, like CapCut's link: they move, are selected and
// are deleted together, while a trim or a cut of one member leaves the others alone.
// Every visual item also has transform { x, y, scale, rotation, opacity, originX, originY }: offsets in frame pixels
// from where the item draws itself, applied the same way in the editor and in the export.

import { checkDetail } from './editor/detail.mjs';
export const EDIT_VERSION = 1;
export const TYPES = ['video', 'audio', 'image', 'text', 'caption', 'layer'];
const VISUAL = new Set(['video', 'image', 'text', 'caption', 'layer']);
const MEDIA = new Set(['video', 'audio']);

export const isVisual = (item) => VISUAL.has(item.type);
export const isMedia = (item) => MEDIA.has(item.type);
export const trackKindFor = (item) => (item.type === 'audio' ? 'audio' : 'visual');
export const end = (item) => item.from + item.durationInFrames;
export const IDENTITY = Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });

let counter = 0;
export function newId(prefix = 'i') {
  counter = (counter + 1) % 1e6;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

const int = (value, fallback = 0) => (Number.isFinite(value) ? Math.round(value) : fallback);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

// ---------------------------------------------------------------------------------------------------------------
// Checking. The server refuses a document that fails this, and the export refuses it again: a skipped check is a fail.

export function checkDoc(doc) {
  const problems = [];
  const fail = (text) => problems.push(text);
  if (!doc || typeof doc !== 'object') return ['The edit is empty.'];
  if (doc.version !== EDIT_VERSION) fail(`Unknown edit version ${doc.version}.`);
  if (!(Number.isFinite(doc.fps) && doc.fps > 0)) fail('The edit needs a positive fps.');
  for (const key of ['width', 'height']) if (!(Number.isInteger(doc[key]) && doc[key] > 0 && doc[key] % 2 === 0)) fail(`The edit needs an even, positive ${key}.`);
  if (doc.durationInFrames != null && (!Number.isInteger(doc.durationInFrames) || doc.durationInFrames < 1)) fail('The edit needs a positive length.');
  if (!Array.isArray(doc.tracks) || !Array.isArray(doc.items)) return [...problems, 'The edit needs tracks and items.'];
  const tracks = new Map();
  for (const track of doc.tracks) {
    if (!track?.id || tracks.has(track.id)) fail(`Track ${track?.id ?? '?'} is missing an id or repeats one.`);
    if (!['visual', 'audio'].includes(track?.kind)) fail(`Track ${track?.id} has an unknown kind.`);
    tracks.set(track?.id, track);
  }
  const ids = new Set();
  for (const item of doc.items) {
    const name = item?.label || item?.id || '?';
    if (!item?.id || ids.has(item.id)) fail(`Item ${name} is missing an id or repeats one.`);
    ids.add(item?.id);
    if (!TYPES.includes(item?.type)) { fail(`Item ${name} has an unknown type.`); continue; }
    const track = tracks.get(item.track);
    if (!track) fail(`Item ${name} sits on a track that does not exist.`);
    else if (track.kind !== trackKindFor(item)) fail(`Item ${name} is on a ${track.kind} track.`);
    if (!Number.isInteger(item.from) || item.from < 0) fail(`Item ${name} starts before the video.`);
    if (!Number.isInteger(item.durationInFrames) || item.durationInFrames < 1) fail(`Item ${name} has no length.`);
    if (!Number.isInteger(item.trimStart ?? 0) || (item.trimStart ?? 0) < 0) fail(`Item ${name} has a negative trim.`);
    if (item.speed != null && !(Number.isFinite(item.speed) && item.speed > 0)) fail(`Item ${name} needs a positive speed.`);
    if (item.volume != null && !(Number.isFinite(item.volume) && item.volume >= 0 && item.volume <= MAX_VOLUME)) fail(`Item ${name} has an invalid volume.`);
    for (const key of ['fadeIn', 'fadeOut']) if (item[key] != null && (!Number.isInteger(item[key]) || item[key] < 0)) fail(`Item ${name} has an invalid fade.`);
    if (item.sourceDurationInFrames != null && (!Number.isInteger(item.sourceDurationInFrames) || item.sourceDurationInFrames < 1)) fail(`Item ${name} has an invalid source length.`);
    if (item.transform != null) {
      if (typeof item.transform !== 'object' || Array.isArray(item.transform)) fail(`Item ${name} has an invalid placement.`);
      else {
        for (const key of ['x', 'y', 'scale', 'rotation', 'opacity', 'originX', 'originY']) if (item.transform[key] != null && !Number.isFinite(item.transform[key])) fail(`Item ${name} has an invalid placement.`);
        if ((item.transform.scale ?? 1) <= 0 || (item.transform.opacity ?? 1) < 0 || (item.transform.opacity ?? 1) > 1) fail(`Item ${name} has an invalid placement.`);
      }
    }
    if (item.size != null && (!Number.isFinite(item.size.w) || item.size.w <= 0 || !Number.isFinite(item.size.h) || item.size.h <= 0)) fail(`Item ${name} has an invalid size.`);
    if (item.crop != null) {
      const c = item.crop;
      if (typeof c !== 'object' || Array.isArray(c) || ['l', 't', 'r', 'b'].some((key) => !Number.isFinite(c[key]) || c[key] < 0 || c[key] >= 1) || c.l + c.r >= 1 || c.t + c.b >= 1) fail(`Item ${name} has an invalid crop.`);
    }
    if (item.radius != null && (!Number.isFinite(item.radius) || item.radius < 0)) fail(`Item ${name} has invalid corners.`);
    if (item.motion != null && (item.type === 'audio' || !['rise', 'slide', 'zoom'].includes(item.motion.preset) || !Number.isInteger(item.motion.durationInFrames) || item.motion.durationInFrames < 1 || !Number.isInteger(item.motion.offsetInFrames ?? 0))) fail(`Item ${name} has an invalid motion.`);
    if (isMedia(item) || item.type === 'image') if (typeof item.src !== 'string' || !item.src) fail(`Item ${name} has no file.`);
    if (isMedia(item) && item.sourceDurationInFrames) {
      const used = (item.trimStart ?? 0) + Math.ceil(item.durationInFrames * (item.speed ?? 1));
      if (used > item.sourceDurationInFrames + 1) fail(`Item ${name} runs past the end of its file.`);
    }
    if (item.type === 'layer' && (typeof item.renderer !== 'string' || !item.renderer.includes('/'))) fail(`Item ${name} names no renderer.`);
    if (item.type === 'caption') checkCaption(item, name, fail);
    if (item.elements != null && (typeof item.elements !== 'object' || Array.isArray(item.elements) || Object.values(item.elements).some(edit => !checkDetail(edit)))) fail(`Item ${name} has invalid component edits.`);
    if (item.link != null && (typeof item.link !== 'string' || !item.link)) fail(`Item ${name} has a broken link.`);
  }
  for (const [id, track] of tracks) {
    const row = doc.items.filter((item) => item?.track === id && Number.isInteger(item.from) && Number.isInteger(item.durationInFrames)).sort((a, b) => a.from - b.from);
    for (let i = 1; i < row.length; i++) if (row[i].from < end(row[i - 1])) fail(`Two items overlap on ${track.name || id}: ${row[i - 1].label || row[i - 1].id} and ${row[i].label || row[i].id}.`);
  }
  return problems;
}

// Captions carry spoken words on their own clock. Every word has text, starts no earlier than the one before, and sits
// inside what the item can show (its trimStart plus its length); pages, when given, point at words that exist.
function checkCaption(item, name, fail) {
  const words = item.words;
  if (!Array.isArray(words) || !words.length) { fail(`Captions ${name} have no words.`); return; }
  const limit = (item.trimStart ?? 0) + item.durationInFrames;
  let previous = -Infinity;
  const wordIds = new Set();
  for (const [i, word] of words.entries()) {
    if (word?.id != null) { if (typeof word.id !== 'string' || !word.id || wordIds.has(word.id)) fail(`Captions ${name} repeat a word id.`); wordIds.add(word.id); }
    if (word?.edit != null && !checkDetail(word.edit)) fail(`Captions ${name} have an invalid word edit.`);
    if (typeof word?.text !== 'string' || !word.text.trim()) { fail(`Captions ${name} have an empty word at ${i + 1}.`); continue; }
    if (!Number.isInteger(word.from) || !Number.isInteger(word.to) || word.from < 0 || word.to <= word.from) fail(`Captions ${name}: "${word.text}" has no time.`);
    else if (word.to > limit) fail(`Captions ${name}: "${word.text}" runs past the end.`);
    if (word.from < previous) fail(`Captions ${name}: "${word.text}" is out of order.`);
    previous = word.from;
  }
  if (item.pages != null) {
    if (!Array.isArray(item.pages)) { fail(`Captions ${name} have broken pages.`); return; }
    for (const page of item.pages) {
      const lines = page?.lines;
      if (!Number.isInteger(page?.from) || !Number.isInteger(page?.to) || page.to <= page.from || !Array.isArray(lines)
        || !lines.every((line) => Array.isArray(line) && line.every((index) => Number.isInteger(index) && index >= 0 && index < words.length))) {
        fail(`Captions ${name} have a page that points at no words.`);
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Small helpers every operation shares.

export function withDuration(doc) {
  const last = doc.items.reduce((max, item) => Math.max(max, end(item)), 0);
  return { ...doc, durationInFrames: Math.max(1, last) };
}
export const itemById = (doc, id) => doc.items.find((item) => item.id === id) ?? null;
export const trackById = (doc, id) => doc.tracks.find((track) => track.id === id) ?? null;
const replaceItems = (doc, changed) => {
  const byId = new Map(changed.map((item) => [item.id, item]));
  return { ...doc, items: doc.items.map((item) => byId.get(item.id) ?? item) };
};
const rowOf = (doc, trackId, except = new Set()) => doc.items.filter((item) => item.track === trackId && !except.has(item.id)).sort((a, b) => a.from - b.from);
const fits = (row, from, to) => row.every((other) => to <= other.from || from >= end(other));

// A track of the right kind that is free for [from, to), starting from the one asked for and moving outward. Without
// one, a new track is made next to the one asked for: dropping onto a busy spot never destroys what was there.
function placeOnTrack(doc, wanted, kind, from, to, except, type = null) {
  const order = doc.tracks.map((track, index) => ({ track, index })).filter(({ track }) => track.kind === kind);
  const start = Math.max(0, doc.tracks.findIndex((track) => track.id === wanted));
  order.sort((a, b) => Math.abs(a.index - start) - Math.abs(b.index - start) || a.index - b.index);
  for (const { track } of order) if (!track.locked && fits(rowOf(doc, track.id, except), from, to)) return { doc, track: track.id };
  const track = { id: newId('t'), name: defaultTrackName(doc, kind, type), kind, hidden: false, muted: false, locked: false };
  const tracks = [...doc.tracks];
  const at = kind === 'audio' ? tracks.length : Math.max(0, doc.tracks.findIndex((t) => t.id === wanted));
  tracks.splice(at, 0, track);
  return { doc: { ...doc, tracks }, track: track.id };
}

export function removeEmptyTracks(doc, keep = []) {
  const used = new Set(doc.items.map((item) => item.track));
  const tracks = doc.tracks.filter((track) => used.has(track.id) || keep.includes(track.id) || track.keep);
  return tracks.length === doc.tracks.length ? doc : { ...doc, tracks };
}

// ---------------------------------------------------------------------------------------------------------------
// Operations. Each returns { doc, ... } or a doc; none mutates its input.

// Move items in time by delta frames and, optionally, onto another track. Items keep their spacing. When the target
// row is busy, the moved item lands on the nearest free track of its kind, or a new one.
// `anchor` names the item the pointer holds: the target track is where that item goes, the others keep their distance
// in rows from it.
export function moveItems(doc, ids, delta, targetTrack = null, { anchor = null } = {}) {
  return placeItems(doc, ids, delta, targetTrack, { anchor, copy: false }).doc;
}

// The same as a move, except the originals stay where they are and copies land where the move would have put them
// (an Option or Alt drag). Returns the new ids so they can be selected.
export function copyItems(doc, ids, delta, targetTrack = null, { anchor = null } = {}) {
  return placeItems(doc, ids, delta, targetTrack, { anchor, copy: true });
}

function placeItems(doc, ids, delta, targetTrack, { anchor: anchorId, copy }) {
  // Linked partners come along in time and stay on their own rows; only what was picked changes rows.
  const picked = new Set(ids);
  ids = withLinks(doc, ids);
  const moving = doc.items.filter((item) => ids.includes(item.id) && !trackById(doc, item.track)?.locked);
  if (!moving.length) return { doc, created: [] };
  const earliest = Math.min(...moving.map((item) => item.from));
  delta = Math.max(int(delta), -earliest);
  const except = new Set(copy ? [] : moving.map((item) => item.id));
  let next = doc;
  const created = [];
  const trackOrder = doc.tracks.map((track) => track.id);
  const anchor = moving.find((item) => item.id === anchorId) ?? moving.find((item) => picked.has(item.id)) ?? moving[0];
  const links = copy ? freshLinks(moving) : null;
  const shift = targetTrack && trackById(doc, targetTrack) ? trackOrder.indexOf(targetTrack) - trackOrder.indexOf(anchor.track) : 0;
  // The held item goes first, so it gets the row the pointer is over when the others compete for space.
  for (const item of [anchor, ...moving.filter((i) => i !== anchor)]) {
    const from = item.from + delta;
    const wantedIndex = clamp(trackOrder.indexOf(item.track) + (picked.has(item.id) ? shift : 0), 0, trackOrder.length - 1);
    let wanted = trackOrder[wantedIndex];
    if (trackById(doc, wanted)?.kind !== trackKindFor(item)) wanted = item.track;
    const placed = placeOnTrack(next, wanted, trackKindFor(item), from, from + item.durationInFrames, except, item.type);
    next = placed.doc;
    if (copy) {
      const fresh = relink({ ...item, id: newId(), from, track: placed.track }, links);
      next = { ...next, items: [...next.items, fresh] };
      created.push(fresh.id);
    } else {
      // Later items in this same move must see where this one landed.
      next = replaceItems(next, [{ ...item, from, track: placed.track }]);
      except.delete(item.id);
    }
  }
  return { doc: withDuration(removeEmptyTracks(next, [anchor.track, targetTrack].filter(Boolean))), created };
}

// Move items by a few frames without ever jumping to another track: the step stops at the neighbours and at frame 0.
// Used by the arrow keys, where a clip leaping to a new row would surprise.
export function nudgeItems(doc, ids, delta) {
  ids = withLinks(doc, ids);
  const moving = doc.items.filter((item) => ids.includes(item.id) && !trackById(doc, item.track)?.locked);
  if (!moving.length) return doc;
  const still = new Set(moving.map((item) => item.id));
  let lo = -Infinity, hi = Infinity;
  for (const item of moving) {
    const row = rowOf(doc, item.track, still);
    const before = row.filter((other) => end(other) <= item.from).at(-1);
    const after = row.find((other) => other.from >= end(item));
    lo = Math.max(lo, (before ? end(before) : 0) - item.from);
    hi = Math.min(hi, after ? after.from - end(item) : Infinity);
  }
  delta = clamp(int(delta), Math.min(0, lo), Math.max(0, hi));
  if (!delta) return doc;
  return withDuration(replaceItems(doc, moving.map((item) => ({ ...item, from: item.from + delta }))));
}

// How far an edge may go: never past the neighbours on the same track, never before frame 0, never past the ends of
// the file, and never shorter than one frame.
export function trimLimits(doc, id, edge) {
  const item = itemById(doc, id);
  if (!item) return null;
  const row = rowOf(doc, item.track, new Set([id]));
  const before = row.filter((other) => end(other) <= item.from).at(-1);
  const after = row.find((other) => other.from >= end(item));
  const speed = item.speed ?? 1;
  const trimStart = item.trimStart ?? 0;
  if (edge === 'start') {
    let min = before ? end(before) : 0;
    if (isMedia(item)) min = Math.max(min, item.from - Math.floor(trimStart / speed));
    return { min, max: end(item) - 1 };
  }
  let max = after ? after.from : Infinity;
  if (isMedia(item) && item.sourceDurationInFrames) max = Math.min(max, item.from + Math.floor((item.sourceDurationInFrames - trimStart) / speed));
  return { min: item.from + 1, max };
}

// Move one edge of an item to a frame. The start edge also moves where the file is read from, so the picture under
// the playhead stays where it was: this is a trim, not a slide.
export function trimItem(doc, id, edge, frame) {
  const item = itemById(doc, id);
  if (!item || trackById(doc, item.track)?.locked) return doc;
  const limits = trimLimits(doc, id, edge);
  frame = clamp(int(frame), limits.min, limits.max);
  if (edge === 'start') return replaceTimedItems(doc, [retime(item, frame, end(item) - frame)]);
  return replaceTimedItems(doc, [retime(item, item.from, frame - item.from)]);
}

// Like a cut, trimming away every caption word removes the empty block. Keep linked media: trimming one member
// never deletes its partners, and undo still restores the complete previous document.
function replaceTimedItems(doc, changed) {
  const empty = new Set(changed.filter((item) => item.type === 'caption' && !item.words?.length).map((item) => item.id));
  const next = replaceItems(doc, changed);
  return withDuration(empty.size ? removeEmptyTracks(tidyLinks({ ...next, items: next.items.filter((item) => !empty.has(item.id)) })) : next);
}

// An item given a new start and length with its content held still in time: the start moves trimStart, and captions
// keep every word on the frame it was spoken. A caption stretched before its first frame moves its words later
// instead of reading before zero; one shortened drops the words it no longer reaches.
function retime(item, from, durationInFrames) {
  const delta = from - item.from;
  let trimStart = (item.trimStart ?? 0) + Math.round(delta * (item.speed ?? 1));
  let next = { ...item, from, durationInFrames };
  if (item.motion) next.motion = { ...item.motion, offsetInFrames: (item.motion.offsetInFrames ?? 0) + delta };
  if (item.type === 'caption' && Array.isArray(item.words)) {
    if (trimStart < 0) { next = shiftCaption(next, -trimStart); trimStart = 0; }
    next = clipCaption({ ...next, trimStart }, trimStart + durationInFrames);
  }
  return { ...next, trimStart: Math.max(0, trimStart) };
}

// Caption helpers: words and pages are in the item's local frames, pages point at words by index.
function shiftCaption(item, offset) {
  return {
    ...item,
    words: item.words.map((word) => ({ ...word, from: word.from + offset, to: word.to + offset, ...(word.edit ? { edit: { ...word.edit, clockOffset: (word.edit.clockOffset ?? 0) - offset } } : {}) })),
    ...(Array.isArray(item.pages) ? { pages: item.pages.map((page) => ({ ...page, from: page.from + offset, to: page.to + offset })) } : {}),
  };
}
function clipCaption(item, limit) {
  const words = item.words.filter((word) => word.from < limit).map((word) => (word.to > limit ? { ...word, to: limit } : word));
  if (words.length === item.words.length && words.every((w, i) => w === item.words[i])) return item;
  return { ...item, words, ...(Array.isArray(item.pages) ? { pages: remapPages(item.pages, 0, words.length, 0, limit) } : {}) };
}
// Keep the pages that fall inside [lo, hi) of the old clock, pointing at words [first, first + count) of the old list,
// rebased so lo is frame 0 and word first is index 0.
function remapPages(pages, first, count, lo, hi) {
  return pages
    .filter((page) => page.to > lo && page.from < hi)
    .map((page) => ({
      ...page,
      from: Math.max(lo, page.from) - lo,
      to: Math.min(hi, page.to) - lo,
      lines: (page.lines ?? []).map((line) => line.filter((i) => i >= first && i < first + count).map((i) => i - first)).filter((line) => line.length),
    }))
    .filter((page) => page.lines.length && page.to > page.from);
}
// Cut a caption item's words at a local frame: a word already spoken when the cut comes stays on the left, clipped to
// the cut; the right half starts its own clock at the cut.
function splitCaption(item, left, right, cut) {
  const leftWords = item.words.filter((word) => word.from < cut).map((word) => (word.to > cut ? { ...word, to: cut } : word));
  const first = item.words.findIndex((word) => word.from >= cut);
  const rightWords = first === -1 ? [] : item.words.slice(first).map((word) => ({ ...word, from: word.from - cut, to: word.to - cut, ...(word.edit ? { edit: { ...word.edit, clockOffset: (word.edit.clockOffset ?? 0) + cut } } : {}) }));
  const pages = Array.isArray(item.pages);
  return [
    { ...left, words: leftWords, ...(pages ? { pages: remapPages(item.pages, 0, leftWords.length, 0, cut) } : {}) },
    { ...right, trimStart: 0, words: rightWords, ...(pages ? { pages: remapPages(item.pages, first, rightWords.length, cut, Infinity) } : {}) },
  ];
}

// Cut items in two at a frame. The second half reads the file from where the first stopped, fades stay on the outer
// ends, and both halves keep the item's look. Items the frame does not fall inside are left alone.
export function splitItems(doc, ids, frame) {
  frame = int(frame);
  const cut = [];
  const added = [];
  const dropped = new Set();
  for (const item of doc.items) {
    if (!ids.includes(item.id) || frame <= item.from || frame >= end(item) || trackById(doc, item.track)?.locked) continue;
    const left = frame - item.from;
    const speed = item.speed ?? 1;
    let a = { ...item, durationInFrames: left, ...(item.fadeOut ? { fadeOut: 0 } : {}) };
    let b = { ...item, id: newId(), from: frame, durationInFrames: end(item) - frame, trimStart: (item.trimStart ?? 0) + Math.round(left * speed), ...(item.fadeIn ? { fadeIn: 0 } : {}) };
    if (item.motion) b.motion = { ...item.motion, offsetInFrames: (item.motion.offsetInFrames ?? 0) + left };
    // A caption half with no word left in it would be an empty block: it is dropped rather than kept blank.
    if (item.type === 'caption' && Array.isArray(item.words)) [a, b] = splitCaption(item, a, b, (item.trimStart ?? 0) + left);
    if (a.words && !a.words.length) dropped.add(item.id); else cut.push(a);
    if (!(b.words && !b.words.length)) added.push(b);
  }
  if (!cut.length && !dropped.size) return { doc, created: [] };
  const links = freshLinks(added);
  for (let i = 0; i < added.length; i++) added[i] = relink(added[i], links);
  const next = replaceItems(doc, cut);
  const items = next.items.filter((item) => !dropped.has(item.id));
  return { doc: { ...next, items: [...items, ...added] }, created: added.map((item) => item.id) };
}

// Delete items. A ripple delete also pulls everything after them on the same track back by the gap they leave, the way
// cutting a sentence out of a talking head closes the hole.
export function deleteItems(doc, ids, { ripple = false } = {}) {
  ids = withLinks(doc, ids);
  const gone = doc.items.filter((item) => ids.includes(item.id) && !trackById(doc, item.track)?.locked);
  if (!gone.length) return doc;
  const goneIds = new Set(gone.map((item) => item.id));
  let items = doc.items.filter((item) => !goneIds.has(item.id));
  if (ripple) {
    for (const removed of [...gone].sort((a, b) => b.from - a.from)) {
      items = items.map((item) => (item.track === removed.track && item.from >= end(removed) ? { ...item, from: item.from - removed.durationInFrames } : item));
    }
  }
  return withDuration(removeEmptyTracks(tidyLinks({ ...doc, items })));
}

// Add a new item at a frame on a track of its kind: the one asked for if it is free there, otherwise the nearest free
// one, otherwise a new track on top.
export function addItem(doc, item, { track = null, at = 0 } = {}) {
  const kind = trackKindFor(item);
  const fresh = {
    trimStart: 0,
    ...(isVisual(item) ? { transform: { ...IDENTITY } } : {}),
    ...item,
    id: item.id ?? newId(),
    from: Math.max(0, int(at)),
    durationInFrames: Math.max(1, int(item.durationInFrames, doc.fps * 3)),
  };
  let wanted = track && trackById(doc, track)?.kind === kind ? track : null;
  if (!wanted) {
    if (kind === 'visual') {
      const topTrack = { id: newId('t'), name: defaultTrackName(doc, kind, item.type), kind, hidden: false, muted: false, locked: false };
      const topFree = doc.tracks.find((t) => t.kind === kind && !t.locked && fits(rowOf(doc, t.id), fresh.from, end(fresh)));
      if (topFree && doc.tracks.indexOf(topFree) === 0) wanted = topFree.id;
      else { doc = { ...doc, tracks: [topTrack, ...doc.tracks] }; wanted = topTrack.id; }
    } else wanted = doc.tracks.find((t) => t.kind === 'audio')?.id ?? null;
  }
  if (!wanted) {
    const audio = { id: newId('t'), name: defaultTrackName(doc, 'audio'), kind: 'audio', hidden: false, muted: false, locked: false };
    doc = { ...doc, tracks: [...doc.tracks, audio] };
    wanted = audio.id;
  }
  const placed = placeOnTrack(doc, wanted, kind, fresh.from, end(fresh), new Set(), fresh.type);
  return { doc: withDuration({ ...placed.doc, items: [...placed.doc.items, { ...fresh, track: placed.track }] }), id: fresh.id };
}

export function duplicateItems(doc, ids) {
  // A linked group is copied whole, as one block right after itself, with a link of its own.
  const grouped = withLinks(doc, ids);
  if (grouped.length > ids.length || doc.items.some((i) => ids.includes(i.id) && i.link)) {
    const members = doc.items.filter((i) => grouped.includes(i.id));
    const length = Math.max(...members.map(end)) - Math.min(...members.map((i) => i.from));
    return copyItems(doc, grouped, length, null);
  }
  let next = doc;
  const created = [];
  for (const item of doc.items.filter((i) => ids.includes(i.id))) {
    const { id: _drop, ...copy } = item;
    const result = addItem(next, copy, { track: item.track, at: end(item) });
    next = result.doc;
    created.push(result.id);
  }
  return { doc: next, created };
}

export function updateItem(doc, id, patch) {
  const item = itemById(doc, id);
  if (!item) return doc;
  const merged = { ...item, ...patch };
  if (patch.transform) merged.transform = { ...IDENTITY, ...item.transform, ...patch.transform };
  if (patch.style) merged.style = { ...item.style, ...patch.style };
  return withDuration(replaceItems(doc, [merged]));
}

export function updateTrack(doc, id, patch) {
  return { ...doc, tracks: doc.tracks.map((track) => (track.id === id ? { ...track, ...patch } : track)) };
}

// ---------------------------------------------------------------------------------------------------------------
// Edits a person makes on the timeline beyond move, trim and cut. Credit: the gap and rolling-edit behaviour follows
// HyperFrames Studio (timelineGaps.ts, Apache 2.0, HeyGen), in frames instead of seconds.

// Where two clips touch, move the cut between them: one gets longer by what the other loses, so nothing after them
// moves. Each side stops at its own file and neither goes under one frame.
export function rollLimits(doc, leftId, rightId) {
  const left = itemById(doc, leftId);
  const right = itemById(doc, rightId);
  if (!left || !right || left.track !== right.track || end(left) !== right.from) return null;
  let min = left.from + 1;
  let max = end(right) - 1;
  if (isMedia(left) && left.sourceDurationInFrames) max = Math.min(max, left.from + Math.floor((left.sourceDurationInFrames - (left.trimStart ?? 0)) / (left.speed ?? 1)));
  if (isMedia(right)) min = Math.max(min, right.from - Math.floor((right.trimStart ?? 0) / (right.speed ?? 1)));
  return { min, max };
}

export function rollEdit(doc, leftId, rightId, frame) {
  const limits = rollLimits(doc, leftId, rightId);
  if (!limits || trackById(doc, itemById(doc, leftId).track)?.locked) return doc;
  frame = clamp(int(frame), limits.min, Math.max(limits.min, limits.max));
  const left = itemById(doc, leftId);
  const right = itemById(doc, rightId);
  if (frame === right.from) return doc;
  return replaceTimedItems(doc, [retime(left, left.from, frame - left.from), retime(right, frame, end(right) - frame)]);
}

// The empty stretch on a track that a frame falls in, bounded by the clip before (or frame 0) and the clip after.
// Null when the frame is inside a clip or nothing follows it.
export function gapAt(doc, trackId, frame) {
  const row = rowOf(doc, trackId);
  if (row.some((item) => frame >= item.from && frame < end(item))) return null;
  const after = row.find((item) => item.from > frame);
  if (!after) return null;
  const before = row.filter((item) => end(item) <= frame).at(-1);
  const start = before ? end(before) : 0;
  return after.from > start ? { start, end: after.from } : null;
}

// Pull everything after a gap back by its length, on that track only.
export function closeGap(doc, trackId, frame) {
  const gap = gapAt(doc, trackId, frame);
  if (!gap || trackById(doc, trackId)?.locked) return doc;
  const length = gap.end - gap.start;
  return withDuration({ ...doc, items: doc.items.map((item) => (item.track === trackId && item.from >= gap.end ? { ...item, from: item.from - length } : item)) });
}

// Fades never overlap: a fade in and a fade out together are at most the item's length.
export function setFade(doc, id, edge, frames) {
  const item = itemById(doc, id);
  if (!item || trackById(doc, item.track)?.locked) return doc;
  const other = edge === 'in' ? item.fadeOut ?? 0 : item.fadeIn ?? 0;
  const value = clamp(int(frames), 0, Math.max(0, item.durationInFrames - other));
  return updateItem(doc, id, edge === 'in' ? { fadeIn: value } : { fadeOut: value });
}

export const MAX_VOLUME = 2;
export function setVolume(doc, ids, volume) {
  const value = Math.round(clamp(Number(volume) || 0, 0, MAX_VOLUME) * 100) / 100;
  const changed = doc.items.filter((item) => ids.includes(item.id) && isMedia(item) && !trackById(doc, item.track)?.locked).map((item) => ({ ...item, volume: value }));
  return changed.length ? replaceItems(doc, changed) : doc;
}

// Everything the playhead is inside, on tracks that are not locked: what a cut with nothing selected cuts.
export const itemsAt = (doc, frame) => doc.items.filter((item) => frame > item.from && frame < end(item) && !trackById(doc, item.track)?.locked);
export const itemsOnTrack = (doc, trackId) => doc.items.filter((item) => item.track === trackId).map((item) => item.id);

// Tracks. Visual tracks always sit above sound tracks, so every place a track can go is inside its own kind's band.
// Tracks are named by what is on them, never by format: Video, Overlays, Text, Captions, Graphics, Music, Voice, Sounds.
// A second video track is an overlay; a sound track made by hand holds sounds until someone renames it.
const TRACK_WORD = { video: 'Video', image: 'Overlays', text: 'Text', caption: 'Captions', layer: 'Graphics', audio: 'Sounds' };
export function defaultTrackName(doc, kind, type = null) {
  let base = TRACK_WORD[type] ?? (kind === 'audio' ? 'Sounds' : 'Overlays');
  if (type === 'video' && doc.items.some((item) => item.type === 'video')) base = 'Overlays';
  const names = new Set(doc.tracks.map((track) => track.name));
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

function kindBand(tracks, kind) {
  const firstAudio = tracks.findIndex((track) => track.kind === 'audio');
  const split = firstAudio === -1 ? tracks.length : firstAudio;
  return kind === 'audio' ? { lo: split, hi: tracks.length } : { lo: 0, hi: split };
}

// Add an empty track of a kind at an index (clamped into its band). It is kept even while empty, because a person
// made it on purpose.
export function addTrack(doc, kind, { at = null, name = null, id = null, keep = true, type = null } = {}) {
  const band = kindBand(doc.tracks, kind);
  const index = clamp(at ?? band.hi, band.lo, band.hi);
  const track = { id: id ?? newId('t'), name: name || defaultTrackName(doc, kind, type), kind, hidden: false, muted: false, locked: false, ...(keep ? { keep: true } : {}) };
  const tracks = [...doc.tracks];
  tracks.splice(index, 0, track);
  return { doc: { ...doc, tracks }, id: track.id };
}

// Move a track to an index in the list as it is now (the index it would have before being lifted out).
export function moveTrack(doc, id, toIndex) {
  const from = doc.tracks.findIndex((track) => track.id === id);
  if (from === -1) return doc;
  const track = doc.tracks[from];
  const tracks = doc.tracks.filter((t) => t.id !== id);
  let index = int(toIndex) > from ? int(toIndex) - 1 : int(toIndex);
  const band = kindBand(tracks, track.kind);
  index = clamp(index, band.lo, band.hi);
  if (index === from) return doc;
  tracks.splice(index, 0, track);
  return { ...doc, tracks };
}

export function renameTrack(doc, id, name) {
  const clean = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!clean) return doc;
  return updateTrack(doc, id, { name: clean });
}

// Delete a track and everything on it. A locked track stays.
export function removeTrack(doc, id) {
  const track = trackById(doc, id);
  if (!track || track.locked) return doc;
  return withDuration({ ...doc, tracks: doc.tracks.filter((t) => t.id !== id), items: doc.items.filter((item) => item.track !== id) });
}

// Swap two clips on one track, the way shots are reordered in a montage. Same length: each takes the other's slot.
// Different lengths: the later one moves to where the earlier started, the earlier ends where the later ended, and
// anything between them shifts by the difference, so the stretch they span keeps its length and nothing overlaps.
export function swapItems(doc, aId, bId) {
  const a = itemById(doc, aId);
  const b = itemById(doc, bId);
  if (!a || !b || a === b || a.track !== b.track || trackById(doc, a.track)?.locked) return doc;
  const [first, last] = a.from <= b.from ? [a, b] : [b, a];
  const shift = last.durationInFrames - first.durationInFrames;
  const changed = doc.items.map((item) => {
    if (item.id === last.id) return { ...item, from: first.from };
    if (item.id === first.id) return { ...item, from: last.from + shift };
    if (item.track === first.track && item.from >= end(first) && end(item) <= last.from) return { ...item, from: item.from + shift };
    return item;
  });
  return withDuration({ ...doc, items: changed });
}

// Insert items at a frame on a track, pushing everything from there on to the right by their length (an insert with
// ripple). A frame inside a clip moves to that clip's nearer end, so no clip is cut. When the items come from the same
// track, the hole they leave closes: on one track this is a clean reorder and the video keeps its length.
export function insertItems(doc, ids, trackId, at) {
  const track = trackById(doc, trackId);
  const moving = doc.items.filter((item) => ids.includes(item.id) && !trackById(doc, item.track)?.locked);
  if (!track || track.locked || !moving.length || moving.some((item) => trackKindFor(item) !== track.kind)) return doc;
  const start = Math.min(...moving.map((item) => item.from));
  const length = Math.max(...moving.map(end)) - start;
  const gone = new Set(moving.map((item) => item.id));
  let items = doc.items.filter((item) => !gone.has(item.id));
  at = Math.max(0, int(at));
  const sameTrack = moving.every((item) => item.track === trackId);
  const blocked = items.some((item) => item.track === trackId && item.from < start + length && end(item) > start);
  if (sameTrack && !blocked) {
    items = items.map((item) => (item.track === trackId && item.from >= start + length ? { ...item, from: item.from - length } : item));
    if (at >= start + length) at -= length;
    else if (at > start) at = start;
  }
  const inside = items.find((item) => item.track === trackId && at > item.from && at < end(item));
  if (inside) at = at - inside.from < inside.durationInFrames / 2 ? inside.from : end(inside);
  items = items.map((item) => (item.track === trackId && item.from >= at ? { ...item, from: item.from + length } : item));
  const placed = moving.map((item) => ({ ...item, track: trackId, from: at + item.from - start }));
  return withDuration(removeEmptyTracks({ ...doc, items: [...items, ...placed] }, [trackId]));
}

// ---------------------------------------------------------------------------------------------------------------
// Links. A group is every item sharing a link id; a link left with one member means nothing and is dropped.

export function withLinks(doc, ids) {
  const links = new Set(doc.items.filter((item) => ids.includes(item.id) && item.link).map((item) => item.link));
  if (!links.size) return [...ids];
  const out = new Set(ids);
  for (const item of doc.items) if (item.link && links.has(item.link)) out.add(item.id);
  return [...out];
}

export function linkItems(doc, ids) {
  const members = doc.items.filter((item) => ids.includes(item.id));
  if (members.length < 2) return doc;
  const link = newId('l');
  return tidyLinks(replaceItems(doc, members.map((item) => ({ ...item, link }))));
}

export function unlinkItems(doc, ids) {
  const links = new Set(doc.items.filter((item) => ids.includes(item.id) && item.link).map((item) => item.link));
  if (!links.size) return doc;
  return { ...doc, items: doc.items.map((item) => { if (!item.link || !links.has(item.link)) return item; const { link: _gone, ...rest } = item; return rest; }) };
}

export function tidyLinks(doc) {
  const count = new Map();
  for (const item of doc.items) if (item.link) count.set(item.link, (count.get(item.link) ?? 0) + 1);
  if (![...count.values()].some((n) => n < 2)) return doc;
  return { ...doc, items: doc.items.map((item) => { if (!item.link || count.get(item.link) > 1) return item; const { link: _gone, ...rest } = item; return rest; }) };
}

// New link ids for copies: copies made from one group share a new link of their own, never the original's.
function freshLinks(items) {
  const map = new Map();
  const count = new Map();
  for (const item of items) if (item.link) count.set(item.link, (count.get(item.link) ?? 0) + 1);
  for (const [link, n] of count) if (n > 1) map.set(link, newId('l'));
  return map;
}
function relink(item, links) {
  if (!item.link) return item;
  const link = links.get(item.link);
  if (link) return { ...item, link };
  const { link: _gone, ...rest } = item;
  return rest;
}

// The ids of items a box drawn over the timeline touches: rows by index range, time by frame range.
export function itemsInBox(doc, trackIds, from, to) {
  const rows = new Set(trackIds);
  return doc.items.filter((item) => rows.has(item.track) && item.from < to && end(item) > from).map((item) => item.id);
}

// ---------------------------------------------------------------------------------------------------------------
// Snapping. Ported in spirit from HyperFrames Studio's timelineSnapping.ts (Apache 2.0, HeyGen): a pixel radius turned
// into frames at the current zoom, the playhead winning a tie over a clip edge, a clip edge over a beat.

export const SNAP_PX = 8;
const SNAP_PRIORITY = { playhead: 0, edge: 1, beat: 2, cue: 3 };

export function snapTargets(doc, { playhead = null, exclude = [], includePlayhead = true } = {}) {
  const byFrame = new Map();
  const add = (frame, kind) => {
    if (!Number.isFinite(frame) || frame < 0) return;
    const existing = byFrame.get(frame);
    if (!existing || SNAP_PRIORITY[kind] < SNAP_PRIORITY[existing.kind]) byFrame.set(frame, { frame, kind });
  };
  for (const marker of doc.markers ?? []) add(marker.frame, marker.kind === 'beat' ? 'beat' : 'cue');
  for (const item of doc.items) if (!exclude.includes(item.id)) { add(item.from, 'edge'); add(end(item), 'edge'); }
  add(0, 'edge');
  if (includePlayhead && playhead != null) add(playhead, 'playhead');
  return [...byFrame.values()].sort((a, b) => a.frame - b.frame);
}

// The playhead pulls twice as hard as anything else: it is where the person is looking, so a beat or an edge a frame
// closer does not steal the snap from it.
const PULL = { playhead: 0.5, edge: 1, beat: 1, cue: 1 };
export function snapFrame(frame, targets, radiusFrames) {
  let best = null;
  let distance = radiusFrames;
  for (const target of targets) {
    const d = Math.abs(target.frame - frame) * (PULL[target.kind] ?? 1);
    if (d < distance || (d === distance && best && SNAP_PRIORITY[target.kind] < SNAP_PRIORITY[best.kind])) { distance = d; best = target; }
  }
  return best ? { frame: best.frame, target: best, distance } : { frame, target: null, distance: Infinity };
}

// A moved block snaps by whichever edge is pulled harder; its length never changes.
export function snapMove(from, length, targets, radiusFrames) {
  const a = snapFrame(from, targets, radiusFrames);
  const b = snapFrame(from + length, targets, radiusFrames);
  if (a.target && (!b.target || a.distance <= b.distance)) return { from: a.frame, target: a.target };
  if (b.target) return { from: Math.max(0, b.frame - length), target: b.target };
  return { from: Math.max(0, from), target: null };
}

// ---------------------------------------------------------------------------------------------------------------
// Time as a person reads it: 0:04.12 is four seconds and twelve frames.

export function timecode(frame, fps) {
  frame = Math.max(0, Math.round(frame));
  const seconds = Math.floor(frame / fps);
  const rest = frame - seconds * fps;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${String(rest).padStart(2, '0')}`;
}
