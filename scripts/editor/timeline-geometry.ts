// Where things sit on the timeline: the rows, the ruler's ticks, the window of time worth drawing. Pure, so a drag can
// ask where the rows were before it started (the draft adds rows under the pointer, and hit testing against the draft
// would chase itself).
import type { Doc, Track } from './types';

export const HEAD = 168;
export const RULER = 28;
export const MIN_PPF = 0.02;
export const MAX_PPF = 24;
export const clampPpf = (ppf: number) => Math.max(MIN_PPF, Math.min(MAX_PPF, ppf));

export function rowHeight(track: Track, doc: Doc) {
  if (track.kind === 'audio') return 46;
  let h = 34;
  for (const item of doc.items) {
    if (item.track !== track.id) continue;
    if (item.type === 'video') return 60;
    if (item.type === 'image' || item.type === 'layer') h = 40;
  }
  return h;
}

export type Row = { track: Track; top: number; h: number; index: number };
export function layout(doc: Doc) {
  let top = RULER;
  const rows: Row[] = doc.tracks.map((track, index) => {
    const h = rowHeight(track, doc);
    const row = { track, top, h, index };
    top += h;
    return row;
  });
  return { rows, bottom: top };
}

// Where a dragged item of a kind lands for a pointer height: an existing row of its kind, or a new track at an index
// when the pointer is past the first or last row of that kind. Visual tracks sit above sound tracks, so for a picture
// "past the last" is anywhere over the sound rows, and for a sound "before the first" is anywhere over the pictures.
export function landing(rows: Row[], y: number, kind: 'visual' | 'audio'): { track: string } | { newAt: number; y: number } {
  const own = rows.filter((r) => r.track.kind === kind);
  const over = rows.find((r) => y >= r.top && y < r.top + r.h);
  if (over && over.track.kind === kind) return { track: over.track.id };
  const firstAudio = rows.findIndex((r) => r.track.kind === 'audio');
  const bandEnd = firstAudio === -1 ? rows.length : firstAudio;
  if (kind === 'visual') {
    const first = own[0];
    if (!first || y < first.top) return { newAt: 0, y: first ? first.top : RULER };
    const last = own.at(-1)!;
    return { newAt: bandEnd, y: last.top + last.h };
  }
  const first = own[0];
  const last = own.at(-1);
  if (!first || !last) return { newAt: rows.length, y: rows.at(-1) ? rows.at(-1)!.top + rows.at(-1)!.h : RULER };
  if (y < first.top) return { newAt: bandEnd, y: first.top };
  return { newAt: rows.length, y: last.top + last.h };
}

// Where a dragged track header would drop: the boundary between two rows of its kind nearest the pointer.
export function trackDrop(rows: Row[], y: number, id: string) {
  const self = rows.find((r) => r.track.id === id);
  if (!self) return null;
  const band = rows.filter((r) => r.track.kind === self.track.kind);
  let best = { index: band[0].index, y: band[0].top };
  let distance = Infinity;
  for (const r of band) {
    for (const [index, edge] of [[r.index, r.top], [r.index + 1, r.top + r.h]] as const) {
      const d = Math.abs(edge - y);
      if (d < distance) { distance = d; best = { index, y: edge }; }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------------------
// The ruler. Ported from HyperFrames Studio's timelineRulerGeometry.ts (Apache 2.0, HeyGen): "nice" steps so labels
// never crowd, every major step a whole number of frames, minor ticks that divide it evenly. Here in frames, and at a
// high zoom every frame gets its own tick.

export function majorStep(fps: number, ppf: number) {
  const candidates = [1, 2, 5, 10, Math.round(fps / 2), fps, 2 * fps, 5 * fps, 10 * fps, 15 * fps, 30 * fps, 60 * fps, 120 * fps, 300 * fps, 600 * fps];
  return candidates.find((frames) => frames * ppf >= 84) ?? 600 * fps;
}

export function minorStep(major: number, ppf: number) {
  for (const parts of [5, 4, 3, 2]) if (major % parts === 0 && (major / parts) * ppf >= 7) return major / parts;
  return major >= 2 && ppf >= 7 ? 1 : 0;
}

export function tickLabel(frame: number, fps: number, major: number) {
  const seconds = Math.floor(frame / fps);
  const rest = frame - seconds * fps;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  if (major < fps) return rest ? `${clock}.${String(rest).padStart(2, '0')}` : clock;
  return clock;
}

export function ticks(fps: number, ppf: number, from: number, to: number) {
  const major = majorStep(fps, ppf);
  const minor = minorStep(major, ppf);
  const step = minor || major;
  const out: { frame: number; major: boolean }[] = [];
  const first = Math.max(0, Math.floor(from / step) * step);
  for (let frame = first; frame <= to && out.length < 4000; frame += step) out.push({ frame, major: frame % major === 0 });
  return { major, minor, ticks: out };
}
