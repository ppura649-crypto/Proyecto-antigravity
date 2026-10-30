// The timeline: one row per track, the first drawn on top of the video, every item a block you can move in time and
// across rows, trim at either edge, cut with the razor, fade at its corners and turn up or down on its volume line.
// Snapping pulls whatever moves onto the playhead, another edge, a beat or frame zero, and draws the line it snapped to.
//
// How it feels follows HyperFrames Studio (Apache 2.0, HeyGen): its snapping, razor, gap closing and fade handles are
// ported in spirit, in frames. Colours distinguish words, sound and pictures; the red line marks the current frame.
//
// Gestures, all on one pointer handler so nothing fights:
//   drag a body       move, across rows too; past the first or last row of its kind makes a new track
//   drop on a clip    over the middle half of another clip in its row, the two swap places
//   Cmd drag a body   insert: the clips after the drop point on that row move right to make room
//   Alt drag a body   copy
//   click             seek and select (a linked clip brings its group; Alt takes one); Shift or Cmd adds
//   drag an edge      trim, stopped by the file and the neighbours; the dashed box shows how far the file goes
//   Alt drag an edge  where two clips touch, roll the cut between them (one gets what the other loses)
//   drag a corner dot fade in or out
//   drag the line     volume (clips and sounds); fade dots and the line answer on a selected clip
//   Shift while dragging turns snapping off for that drag
//   drag empty space  select with a box; a click there moves the playhead
//   drag the ruler    scrub to the frame under the pointer
//   drag a track name reorder tracks; double click renames
//   B / V             razor or select; with the razor a click cuts there, Shift cuts every track
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Doc, Item, Track } from './types';
import type { Action, FrameStore } from './store';
import { useFrame, usePlaying } from './store';
import { Icon } from './icons';
import './timeline.css';
import { useDetails, DetailTimeline, canOpen } from './Details';
import { Clip, itemLabel, volumeY } from './timeline-clip';
import { ContextMenu, type MenuEntry, type MenuState } from './timeline-menu';
import { HEAD, RULER, layout, landing, trackDrop, ticks, tickLabel, clampPpf, MIN_PPF, MAX_PPF, type Row } from './timeline-geometry';
import {
  end, moveItems, copyItems, trimItem, rollEdit, snapTargets, snapMove, snapFrame, SNAP_PX, timecode, updateTrack,
  splitItems, deleteItems, duplicateItems, nudgeItems, closeGap, gapAt, setFade, setVolume, itemsAt, itemsOnTrack,
  addTrack, moveTrack, renameTrack, removeTrack, itemsInBox, trackKindFor, isMedia, removeEmptyTracks,
  withLinks, linkItems, unlinkItems, newId, swapItems, insertItems,
} from '../edit-doc.mjs';
import { volumeAt } from './timeline-clip';

export { HEAD, itemLabel };

const HEIGHT_KEY = 'keyframes.editor.timelineHeight';
const CMD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';
const readHeight = () => { try { const v = Number(localStorage.getItem(HEIGHT_KEY)); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; } };
const writeHeight = (v: number) => { try { localStorage.setItem(HEIGHT_KEY, String(Math.round(v))); } catch {} };

// The timeline is the last row of the editor's grid. A height set by hand replaces only that row's size, read from the
// editor's own stylesheet, so the rows above keep whatever the editor gives them.
function authoredRows(el: HTMLElement): string | null {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) if (rule instanceof CSSStyleRule && rule.style.gridTemplateRows && el.matches(rule.selectorText)) return rule.style.gridTemplateRows;
  }
  return null;
}
function topLevelTracks(list: string) {
  const out: string[] = [];
  let depth = 0, word = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) { if (word) out.push(word); word = ''; } else word += ch;
  }
  if (word) out.push(word);
  return out;
}
function panelGrid(section: HTMLElement) {
  // The nearest grid above the timeline with several rows, whose last row the timeline (or its wrapper) fills.
  let node: HTMLElement = section;
  for (let grid = section.parentElement; grid && grid !== document.body; node = grid, grid = grid.parentElement) {
    const authored = authoredRows(grid);
    const tracks = authored ? topLevelTracks(authored) : [];
    if (tracks.length < 2) continue;
    const a = node.getBoundingClientRect(), b = grid.getBoundingClientRect();
    if (Math.abs(a.bottom - b.bottom) < 2) return { grid, tracks };
    return null;
  }
  return null;
}
function applyPanelHeight(section: HTMLElement | null, height: number | null) {
  if (!section) return;
  const found = panelGrid(section);
  if (!found) return;
  if (height == null) { found.grid.style.removeProperty('grid-template-rows'); return; }
  found.grid.style.gridTemplateRows = [...found.tracks.slice(0, -1), `${Math.round(height)}px`].join(' ');
}

type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Targets = ReturnType<typeof snapTargets>;
type Gesture =
  | { kind: 'pending'; playhead: number; start: Pt; id: string; additive: boolean; alt: boolean; origin: Doc; pointer: number }
  | { kind: 'move'; start: Pt; id: string; ids: string[]; origin: Doc; rows: Row[]; targets: Targets; copy: boolean; newTrack: string; draft: Doc | null; created: string[] }
  | { kind: 'trim'; id: string; edge: 'start' | 'end'; grab: number; origin: Doc; rows: Row[]; targets: Targets; draft: Doc | null }
  | { kind: 'fade'; id: string; edge: 'in' | 'out'; start: Pt; value: number; origin: Doc; draft: Doc | null }
  | { kind: 'volume'; id: string; top: number; inner: number; origin: Doc; draft: Doc | null }
  | { kind: 'scrub'; targets: Targets }
  | { kind: 'marquee'; start: Pt; started: boolean; base: string[]; pointer: number; rows: Row[] }
  | { kind: 'track'; id: string; start: Pt; started: boolean; drop: { index: number; y: number } | null; rows: Row[]; pointer: number };
type Ghost = { track: string; from: number; length: number };
type Overlay = { swap?: Box; insert?: Box; fresh?: string; snap?: number | null; box?: Box; ghosts?: Ghost[]; line?: number; extent?: Box; readout?: { x: number; y: number; text: string }; drop?: string | null };
type Last = { clientX: number; clientY: number; altKey: boolean; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean };
const lastOf = (e: { clientX: number; clientY: number; altKey: boolean; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }): Last =>
  ({ clientX: e.clientX, clientY: e.clientY, altKey: e.altKey, shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });

// ---------------------------------------------------------------------------------------------------------------
// The ruler, the playhead and the few toolbar pieces that follow the playhead: each subscribes to the frame on its own,
// so playing redraws them and never the clips.

const Ruler = memo(function Ruler({ fps, ppf, winL, winR, markers }: { fps: number; ppf: number; winL: number; winR: number; markers: Doc['markers'] }) {
  const from = Math.max(0, Math.floor((winL - HEAD) / ppf));
  const to = Math.ceil((winR - HEAD) / ppf);
  const { major, ticks: list } = ticks(fps, ppf, from, to);
  return (
    <div className="tl-ruler" data-ruler="true" style={{ height: RULER }}>
      {list.map(({ frame, major: big }) => (
        <i key={frame} className={big ? 'major' : ''} style={{ left: HEAD + frame * ppf }}>{big ? <span>{tickLabel(frame, fps, major)}</span> : null}</i>
      ))}
      {(markers ?? []).filter((m) => m.frame >= from - 1 && m.frame <= to + 1).map((m, i) => (
        <u key={`${m.frame}-${i}`} className={`marker ${m.kind}`} style={{ left: HEAD + m.frame * ppf }} title={m.label || (m.kind === 'beat' ? 'Beat' : 'Cue')} />
      ))}
    </div>
  );
});

const Beats = memo(function Beats({ ppf, winL, winR, markers, height }: { ppf: number; winL: number; winR: number; markers: Doc['markers']; height: number }) {
  if (ppf * 30 < 4) return null;
  // Only beats run down through the rows, and only while they are far enough apart to read; word cues stay in the
  // ruler, where 200 of them are a texture rather than a wall of lines.
  let last = -Infinity;
  return <>{(markers ?? []).filter((m) => m.kind === 'beat').map((m, i) => {
    const x = HEAD + m.frame * ppf;
    if (x < winL || x > winR || x - last < 10) return null;
    last = x;
    return <i key={i} className="tl-beat beat" style={{ left: x, top: RULER, height: height - RULER }} />;
  })}</>;
});

const Playhead: React.FC<{ frames: FrameStore; ppf: number; scroller: React.RefObject<HTMLDivElement> }> = ({ frames, ppf, scroller }) => {
  const frame = useFrame(frames);
  const playing = usePlaying(frames);
  const x = HEAD + frame * ppf;
  // While playing the view follows a page at a time, the way CapCut and Premiere do, so the eye can still read it.
  useEffect(() => {
    const s = scroller.current;
    if (!s || !playing) return;
    if (x > s.scrollLeft + s.clientWidth - 40 || x < s.scrollLeft + HEAD) s.scrollLeft = x - HEAD - 24;
  }, [x, playing]);
  return <div className="tl-playhead" style={{ transform: `translateX(${x}px)` }}><span data-ruler="true" /></div>;
};

const Clock: React.FC<{ frames: FrameStore; fps: number; duration: number }> = ({ frames, fps, duration }) => {
  const frame = useFrame(frames);
  return <span className="timecode" aria-live="off"><b>{timecode(frame, fps)}</b><i>/</i>{timecode(duration, fps)}</span>;
};

const PlayButton: React.FC<{ frames: FrameStore; toggle: () => void }> = ({ frames, toggle }) => {
  const playing = usePlaying(frames);
  return <button className="play" onClick={toggle} title="Play (Space)" aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={16} /></button>;
};

const SplitButton: React.FC<{ frames: FrameStore; doc: Doc; selection: string[]; split: () => void }> = ({ frames, doc, selection, split }) => {
  const frame = useFrame(frames);
  const pool = selection.length ? doc.items.filter((i) => selection.includes(i.id)) : itemsAt(doc, frame);
  const can = pool.some((i) => frame > i.from && frame < end(i));
  return <button className="tool" onClick={split} disabled={!can} title="Split at the playhead (S)"><Icon name="split" /><span>Split</span></button>;
};

// The two tool glyphs the shared icon set does not have, drawn on the same 24 grid.
const ToolGlyph: React.FC<{ kind: 'pointer' | 'razor' }> = ({ kind }) => (
  <svg className="icon" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
    {kind === 'pointer' ? <path d="M6 3.5l12 8.2-5.6 1.1 3.2 6.2-2.4 1.2-3.2-6.2L6 18.2z" /> : <><path d="M12 3v18" strokeDasharray="2.5 2.5" /><path d="M5 8l7 4-7 4zM19 8l-7 4 7 4z" /></>}
  </svg>
);

// ---------------------------------------------------------------------------------------------------------------
// A track's header: its name (double click to rename, drag to reorder) and its switches.

const Head = memo(function Head({ track, h, hasSound, renaming, onToggle, onRename, onRenameStart }: {
  track: Track; h: number; hasSound: boolean; renaming: boolean;
  onToggle: (track: Track, key: 'hidden' | 'muted' | 'locked') => void; onRename: (id: string, name: string | null) => void; onRenameStart: (id: string) => void;
}) {
  const icon = track.kind === 'audio' ? 'sound' : 'layer';
  return (
    <div className="tl-head" data-head={track.id} style={{ height: h }} title="Drag to reorder. Double click to rename.">
      <i className="tl-grip" aria-hidden="true" />
      <Icon name={icon} size={13} />
      {renaming ? (
        <input
          className="tl-rename" defaultValue={track.name} autoFocus aria-label="Track name" maxLength={40}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') onRename(track.id, e.currentTarget.value); if (e.key === 'Escape') onRename(track.id, null); }}
          onBlur={(e) => onRename(track.id, e.currentTarget.value)}
        />
      ) : (
        <span className="tl-name" onDoubleClick={() => onRenameStart(track.id)}>{track.name}</span>
      )}
      <span className="tl-toggles">
        {track.kind === 'visual' && <button onClick={() => onToggle(track, 'hidden')} className={track.hidden ? 'is-on' : ''} title={track.hidden ? 'Show' : 'Hide'} aria-pressed={Boolean(track.hidden)} aria-label={`${track.hidden ? 'Show' : 'Hide'} ${track.name}`}><Icon name={track.hidden ? 'eyeOff' : 'eye'} size={14} /></button>}
        {hasSound && <button onClick={() => onToggle(track, 'muted')} className={track.muted ? 'is-on' : ''} title={track.muted ? 'Unmute' : 'Mute'} aria-pressed={Boolean(track.muted)} aria-label={`${track.muted ? 'Unmute' : 'Mute'} ${track.name}`}><Icon name={track.muted ? 'mute' : 'speaker'} size={14} /></button>}
        <button onClick={() => onToggle(track, 'locked')} className={track.locked ? 'is-on' : ''} title={track.locked ? 'Unlock' : 'Lock'} aria-pressed={Boolean(track.locked)} aria-label={`${track.locked ? 'Unlock' : 'Lock'} ${track.name}`}><Icon name={track.locked ? 'lock' : 'unlock'} size={14} /></button>
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------------------------------------------

export type TimelineProps = {
  doc: Doc; shown: Doc; selection: string[]; dispatch: React.Dispatch<Action>; frames: FrameStore;
  seek: (frame: number) => void; togglePlay: () => void;
  split: () => void; remove: (ripple: boolean) => void; duplicate: () => void;
  ppf: number; setPpf: (ppf: number) => void; snapping: boolean; setSnapping: (on: boolean) => void;
};

export function Timeline(props: TimelineProps) {
  const { doc, shown, selection, dispatch, frames, seek, ppf, setPpf, snapping } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const razorLine = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const last = useRef<Last | null>(null);
  const raf = useRef(0);
  const scrollLoop = useRef(0);
  const zoomAnchor = useRef<{ frame: number; sx: number } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({});
  const details = useDetails();
  const [tool, setTool] = useState<'select' | 'razor'>('select');
  const [menu, setMenu] = useState<MenuState>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [panel, setPanel] = useState<number | null>(readHeight);
  const [win, setWin] = useState({ l: 0, r: 2400 });

  // The latest of everything, for listeners registered once.
  const latest = useRef({ doc, shown, selection, ppf, snapping, tool });
  latest.current = { doc, shown, selection, ppf, snapping, tool };

  const { rows, bottom } = useMemo(() => layout(shown), [shown]);
  const byTrack = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of shown.items) { const list = map.get(item.track); if (list) list.push(item); else map.set(item.track, [item]); }
    return map;
  }, [shown.items]);
  const contentFrames = Math.max(shown.durationInFrames, 1) + shown.fps * 8;
  const width = HEAD + contentFrames * ppf;
  const detailHeight = details.item ? 32 + (details.item.type === 'caption' ? 1 : details.entries.length) * 34 : 0;
  const height = bottom + detailHeight + 40;
  const beforeDetail = useRef<{ ppf: number; x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const s = scroller.current; if (!s) return;
    if (details.item) {
      if (!beforeDetail.current) beforeDetail.current = { ppf, x: s.scrollLeft, y: s.scrollTop };
      const next = clampPpf((s.clientWidth - HEAD - 80) / details.item.durationInFrames);
      setPpf(next);
      const id = requestAnimationFrame(() => { s.scrollLeft = Math.max(0, details.item!.from * next - 40); s.scrollTop = bottom; });
      return () => cancelAnimationFrame(id);
    }
    const prior = beforeDetail.current;
    if (prior) { beforeDetail.current = null; setPpf(prior.ppf); const id = requestAnimationFrame(() => { s.scrollLeft = prior.x; s.scrollTop = prior.y; }); return () => cancelAnimationFrame(id); }
  }, [details.item?.id]);

  // Only what is near the view is drawn; the window moves in steps so scrolling does not redraw every pixel.
  const updateWin = useCallback(() => {
    const s = scroller.current;
    if (!s) return;
    const step = 256;
    const l = Math.floor(s.scrollLeft / step) * step - 512;
    const r = Math.ceil((s.scrollLeft + s.clientWidth) / step) * step + 512;
    setWin((w) => (w.l === l && w.r === r ? w : { l, r }));
  }, []);

  // Zoom keeps the frame under the pointer (or the playhead) where it was.
  useLayoutEffect(() => {
    const s = scroller.current;
    const a = zoomAnchor.current;
    if (s && a) s.scrollLeft = Math.max(0, HEAD + a.frame * ppf - a.sx);
    zoomAnchor.current = null;
    updateWin();
  }, [ppf]);

  const zoomTo = useCallback((next: number, frame?: number, sx?: number) => {
    const s = scroller.current;
    const current = latest.current.ppf;
    next = clampPpf(next);
    if (!s || next === current) return;
    if (frame == null || sx == null) {
      frame = frames.get();
      const px = HEAD + frame * current - s.scrollLeft;
      sx = px > HEAD && px < s.clientWidth ? px : (s.clientWidth + HEAD) / 2;
      if (!(px > HEAD && px < s.clientWidth)) frame = (s.scrollLeft + sx - HEAD) / current;
    }
    zoomAnchor.current = { frame, sx };
    setPpf(next);
  }, [setPpf]);
  const zoom = (factor: number) => zoomTo(latest.current.ppf * factor);

  const fit = useCallback(() => {
    const s = scroller.current;
    const available = (s?.clientWidth ?? 900) - HEAD - 48;
    zoomAnchor.current = { frame: 0, sx: HEAD };
    setPpf(clampPpf(available / Math.max(1, latest.current.doc.durationInFrames)));
  }, [setPpf]);
  const fitted = useRef(false);
  useLayoutEffect(() => { if (!fitted.current) { fitted.current = true; fit(); } }, []);

  const point = (e: { clientX: number; clientY: number }): Pt => {
    const r = sheet.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const frameAt = (x: number) => Math.max(0, Math.round((x - HEAD) / latest.current.ppf));
  const radius = () => SNAP_PX / latest.current.ppf;
  const commit = (next: Doc, sel?: string[]) => dispatch({ type: 'commit', doc: next, selection: sel });

  // ---------------------------------------------------------------------------------------------------------------
  // One step of the gesture in progress, for the latest pointer position. Called at most once a frame.

  const step = (ev: Last) => {
    const g = gesture.current;
    if (!g) return;
    const p = point(ev);
    const { ppf: z, snapping: snapOn } = latest.current;
    const snaps = snapOn && !ev.shiftKey;
    if (g.kind === 'scrub') {
      seek(frameAt(p.x));
      setOverlay({});
      return;
    }
    if (g.kind === 'pending') {
      if (Math.hypot(p.x - g.start.x, p.y - g.start.y) < 4) return;
      const { selection: sel } = latest.current;
      const ids = sel.includes(g.id) ? sel : withLinks(g.origin, [g.id]);
      const copy = g.alt || ev.altKey;
      const grouped = withLinks(g.origin, ids);
      const moving = g.origin.items.filter((i) => grouped.includes(i.id));
      const rowsO = layout(g.origin).rows;
      // Where the clips were, drawn on their rows as the rows are now (a new track above moves them down).
      const ghosts = copy ? [] : moving.map((i) => ({ track: i.track, from: i.from, length: i.durationInFrames }));
      try { sheet.current!.setPointerCapture(g.pointer); } catch {}
      gesture.current = { kind: 'move', start: g.start, id: g.id, ids, origin: g.origin, rows: rowsO, targets: snapTargets(g.origin, { playhead: g.playhead, exclude: copy ? [] : grouped }), copy, newTrack: newId('t'), draft: null, created: [] };
      setOverlay({ ghosts });
    }
    const m = gesture.current!;
    if (m.kind === 'move') {
      const grouped = withLinks(m.origin, m.ids);
      const moving = m.origin.items.filter((i) => grouped.includes(i.id));
      const start = Math.min(...moving.map((i) => i.from));
      const length = Math.max(...moving.map(end)) - start;
      let delta = Math.round((p.x - m.start.x) / z);
      let snap: number | null = null;
      if (snaps) {
        const s = snapMove(start + delta, length, m.targets, radius());
        delta = s.from - start;
        snap = s.target?.frame ?? null;
      }
      delta = Math.max(delta, -start);
      const anchor = m.origin.items.find((i) => i.id === m.id)!;
      const insert = ev.metaKey || ev.ctrlKey;
      // Dropped squarely on another clip of its own row (the middle half of it), one clip swaps places with it.
      if (!m.copy && !insert && grouped.length === 1) {
        const row = m.rows.find((r) => r.track.id === anchor.track);
        const f = (p.x - HEAD) / z;
        const other = row && p.y >= row.top && p.y < row.top + row.h
          ? m.origin.items.find((i) => i.track === anchor.track && i.id !== anchor.id && f >= i.from + i.durationInFrames / 4 && f <= end(i) - i.durationInFrames / 4)
          : null;
        if (row && other) {
          m.draft = swapItems(m.origin, anchor.id, other.id);
          dispatch({ type: 'draft', doc: m.draft });
          setOverlay((o) => ({ ghosts: o.ghosts, swap: { x: HEAD + other.from * z, y: row.top + 1, w: other.durationInFrames * z, h: row.h - 2 }, readout: { x: p.x + 14, y: p.y - 30, text: 'Swap' } }));
          return;
        }
      }
      // With Cmd or Ctrl held, the drop inserts: everything after it on that row moves right to make room.
      if (insert) {
        const land = landing(m.rows, p.y, trackKindFor(anchor));
        if ('track' in land) {
          m.draft = insertItems(m.origin, grouped, land.track, start + delta);
          dispatch({ type: 'draft', doc: m.draft });
          const landed = m.draft.items.find((i) => i.id === anchor.id);
          const row = m.rows.find((r) => r.track.id === land.track)!;
          const at = landed ? Math.min(...m.draft.items.filter((i) => grouped.includes(i.id)).map((i) => i.from)) : start + delta;
          setOverlay((o) => ({ ghosts: o.ghosts, insert: { x: HEAD + at * z - 1, y: row.top, w: 2, h: row.h }, readout: { x: p.x + 14, y: p.y - 30, text: `Insert ${timecode(at, m.origin.fps)}` } }));
          return;
        }
      }
      const land = landing(m.rows, p.y, trackKindFor(anchor));
      let base = m.origin;
      let target: string | null;
      if ('track' in land) target = land.track === anchor.track ? null : land.track;
      else { const added = addTrack(m.origin, trackKindFor(anchor), { at: land.newAt, id: m.newTrack, keep: false, type: anchor.type }); base = added.doc; target = added.id; }
      if (m.copy) { const r = copyItems(base, m.ids, delta, target, { anchor: m.id }); m.draft = r.doc; m.created = r.created; }
      else m.draft = moveItems(base, m.ids, delta, target, { anchor: m.id });
      dispatch({ type: 'draft', doc: m.draft });
      const landed = m.draft.items.find((i) => i.id === (m.copy ? m.created[0] : m.id));
      setOverlay((o) => ({ ghosts: o.ghosts, snap, drop: landed?.track ?? null, fresh: m.newTrack, readout: { x: p.x + 14, y: p.y - 30, text: `${m.copy ? 'Copy ' : ''}${timecode(start + delta, m.origin.fps)}` } }));
      return;
    }
    if (m.kind === 'trim') {
      const item = m.origin.items.find((i) => i.id === m.id)!;
      let at = Math.max(0, Math.round((p.x - HEAD) / z - m.grab));
      let snap: number | null = null;
      if (snaps) { const s = snapFrame(at, m.targets, radius()); at = s.frame; snap = s.target?.frame ?? null; }
      const row = m.rows.find((r) => r.track.id === item.track)!;
      const neighbour = ev.altKey
        ? m.origin.items.find((o) => o.track === item.track && o.id !== item.id && (m.edge === 'end' ? o.from === end(item) : end(o) === item.from))
        : null;
      if (neighbour) m.draft = m.edge === 'end' ? rollEdit(m.origin, item.id, neighbour.id, at) : rollEdit(m.origin, neighbour.id, item.id, at);
      else m.draft = trimItem(m.origin, m.id, m.edge, at);
      dispatch({ type: 'draft', doc: m.draft });
      const now = m.draft.items.find((i) => i.id === m.id)!;
      let extent: Box | undefined;
      if (isMedia(item) && item.sourceDurationInFrames) {
        const speed = item.speed ?? 1;
        const x0 = HEAD + (item.from - (item.trimStart ?? 0) / speed) * z;
        extent = { x: x0, y: row.top + 1, w: (item.sourceDurationInFrames / speed) * z, h: row.h - 2 };
      }
      setOverlay({ snap, extent, readout: { x: p.x + 14, y: row.top - 24, text: `${neighbour ? 'Roll ' : ''}${timecode(now.durationInFrames, m.origin.fps)}` } });
      return;
    }
    if (m.kind === 'fade') {
      const dx = (p.x - m.start.x) / z;
      const value = Math.round(m.edge === 'in' ? m.value + dx : m.value - dx);
      m.draft = setFade(m.origin, m.id, m.edge, value);
      dispatch({ type: 'draft', doc: m.draft });
      const now = m.draft.items.find((i) => i.id === m.id)!;
      setOverlay({ readout: { x: p.x + 14, y: p.y - 30, text: `Fade ${timecode((m.edge === 'in' ? now.fadeIn : now.fadeOut) ?? 0, m.origin.fps)}` } });
      return;
    }
    if (m.kind === 'volume') {
      // The line follows the pointer: its height in the clip is the volume, 100% a quarter of the way down.
      const value = volumeAt(ev.clientY - m.top, m.inner);
      const near = Math.abs(value - 1) < 0.04 ? 1 : value;
      m.draft = setVolume(m.origin, [m.id], near);
      dispatch({ type: 'draft', doc: m.draft });
      const now = m.draft.items.find((i) => i.id === m.id)!;
      setOverlay({ readout: { x: p.x + 14, y: p.y - 30, text: `${Math.round((now.volume ?? 1) * 100)}%` } });
      return;
    }
    if (m.kind === 'marquee') {
      if (!m.started && Math.hypot(p.x - m.start.x, p.y - m.start.y) < 5) return;
      if (!m.started) { m.started = true; try { sheet.current!.setPointerCapture(m.pointer); } catch {} }
      const box = { x: Math.min(m.start.x, p.x), y: Math.min(m.start.y, p.y), w: Math.abs(p.x - m.start.x), h: Math.abs(p.y - m.start.y) };
      const tracks = m.rows.filter((r) => r.top < box.y + box.h && r.top + r.h > box.y).map((r) => r.track.id);
      const hit = itemsInBox(latest.current.doc, tracks, frameAt(box.x), frameAt(box.x + box.w) + 1);
      dispatch({ type: 'select', ids: [...new Set([...m.base, ...hit])] });
      setOverlay({ box });
      return;
    }
    if (m.kind === 'track') {
      if (!m.started && Math.abs(p.y - m.start.y) < 4) return;
      if (!m.started) { m.started = true; try { sheet.current!.setPointerCapture(m.pointer); } catch {} }
      m.drop = trackDrop(m.rows, p.y, m.id);
      setOverlay({ line: m.drop?.y, drop: m.id });
    }
  };

  const schedule = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => { raf.current = 0; if (last.current) step(last.current); });
  };

  // While a drag holds near an edge of the view, the view scrolls and the drag keeps following the pointer.
  const autoscroll = () => {
    const s = scroller.current;
    const g = gesture.current;
    const e = last.current;
    if (!s || !g || !e) { scrollLoop.current = 0; return; }
    // A press becomes a drag only after a few pixels; until then the loop waits instead of stopping.
    if (!['move', 'trim', 'marquee', 'scrub'].includes(g.kind) || (g.kind === 'marquee' && !g.started)) { scrollLoop.current = requestAnimationFrame(autoscroll); return; }
    const r = s.getBoundingClientRect();
    let dx = 0, dy = 0;
    const left = r.left + HEAD + 24, right = r.right - 28;
    if (e.clientX > right) dx = Math.min(28, (e.clientX - right) / 2 + 4);
    else if (e.clientX < left && s.scrollLeft > 0) dx = -Math.min(28, (left - e.clientX) / 2 + 4);
    if (g.kind !== 'scrub') {
      if (e.clientY > r.bottom - 20) dy = 10;
      else if (e.clientY < r.top + RULER + 10 && s.scrollTop > 0) dy = -10;
    }
    if (dx || dy) { s.scrollLeft += dx; s.scrollTop += dy; step(e); }
    scrollLoop.current = requestAnimationFrame(autoscroll);
  };

  // ---------------------------------------------------------------------------------------------------------------

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, .tl-menu')) return;
    const p = point(e);
    const { doc: d, selection: sel, tool: mode } = latest.current;
    const previousPlayhead = frames.get();
    last.current = lastOf(e);
    const capture = () => { try { sheet.current!.setPointerCapture(e.pointerId); } catch {} };
    const start = () => { if (!scrollLoop.current) scrollLoop.current = requestAnimationFrame(autoscroll); };
    const head = target.closest('[data-head]') as HTMLElement | null;
    if (head) {
      gesture.current = { kind: 'track', id: head.dataset.head!, start: p, started: false, drop: null, rows: layout(d).rows, pointer: e.pointerId };
      return;
    }
    // Every press in the time area seeks, including a clip, trim edge, fade or volume line.
    // Seek to the pointer's frame rather than a nearby snap target; snapping still belongs to edits.
    seek(frameAt(p.x));
    const onRuler = Boolean(target.closest('[data-ruler]')) || p.y - scroller.current!.scrollTop < RULER;
    if (onRuler) {
      capture();
      const targets = snapTargets(d, { includePlayhead: false });
      gesture.current = { kind: 'scrub', targets };
      step(last.current);
      start();
      return;
    }
    const clipEl = target.closest('[data-clip]') as HTMLElement | null;
    if (mode === 'razor') {
      let f = frameAt(p.x);
      if (latest.current.snapping && !e.shiftKey) f = snapFrame(f, snapTargets(d, { playhead: frames.get() }), radius()).frame;
      seek(f);
      const ids = e.shiftKey ? itemsAt(d, f).map((i) => i.id) : clipEl ? [clipEl.dataset.clip!] : [];
      if (!ids.length) { seek(f); return; }
      const result = splitItems(d, ids, f);
      if (result.created.length) commit(result.doc);
      return;
    }
    const fade = target.closest('[data-fade]') as HTMLElement | null;
    if (fade) {
      const id = fade.dataset.clip!;
      const item = d.items.find((i) => i.id === id)!;
      capture();
      dispatch({ type: 'select', ids: [id] });
      const edge = fade.dataset.fade as 'in' | 'out';
      gesture.current = { kind: 'fade', id, edge, start: p, value: (edge === 'in' ? item.fadeIn : item.fadeOut) ?? 0, origin: d, draft: null };
      return;
    }
    const volume = target.closest('[data-volume]') as HTMLElement | null;
    if (volume) {
      const id = volume.dataset.volume!;
      const item = d.items.find((i) => i.id === id)!;
      const clipBox = volume.parentElement!.getBoundingClientRect();
      capture();
      if (!sel.includes(id)) dispatch({ type: 'select', ids: [id] });
      gesture.current = { kind: 'volume', id, top: clipBox.top, inner: clipBox.height, origin: d, draft: null };
      void item;
      return;
    }
    // With Shift or Cmd held, a press on an edge is a press on the clip: it adds to the selection instead of trimming.
    const edge = e.shiftKey || e.metaKey || e.ctrlKey ? null : target.closest('[data-edge]') as HTMLElement | null;
    if (edge) {
      const id = edge.dataset.clip!;
      const item = d.items.find((i) => i.id === id)!;
      const which = edge.dataset.edge as 'start' | 'end';
      const at = which === 'start' ? item.from : end(item);
      capture();
      dispatch({ type: 'select', ids: [id] });
      gesture.current = { kind: 'trim', id, edge: which, grab: (p.x - HEAD) / latest.current.ppf - at, origin: d, rows: layout(d).rows, targets: snapTargets(d, { playhead: previousPlayhead, exclude: [id] }), draft: null };
      start();
      return;
    }
    if (clipEl) {
      const id = clipEl.dataset.clip!;
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      // A click takes a linked clip's whole group; Alt takes just the one.
      const group = e.altKey ? [id] : withLinks(d, [id]);
      if (!sel.includes(id) || additive) dispatch({ type: 'select', ids: additive ? (sel.includes(id) ? sel.filter((s) => !group.includes(s)) : [...new Set([...sel, ...group])]) : group });
      gesture.current = { kind: 'pending', playhead: previousPlayhead, start: p, id, additive, alt: e.altKey, origin: d, pointer: e.pointerId };
      start();
      return;
    }
    gesture.current = { kind: 'marquee', start: p, started: false, base: e.shiftKey || e.metaKey ? sel : [], pointer: e.pointerId, rows: layout(d).rows };
    start();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    last.current = lastOf(e);
    if (gesture.current) { schedule(); return; }
    const line = razorLine.current;
    if (line) {
      const p = point(e);
      const show = latest.current.tool === 'razor' && p.y - scroller.current!.scrollTop >= RULER && e.clientX - scroller.current!.getBoundingClientRect().left > HEAD;
      if (show) {
        let f = frameAt(p.x);
        if (latest.current.snapping && !e.shiftKey) f = snapFrame(f, snapTargets(latest.current.doc, { playhead: frames.get() }), radius()).frame;
        line.style.transform = `translateX(${HEAD + f * latest.current.ppf}px)`;
        line.dataset.all = e.shiftKey ? 'true' : 'false';
        line.firstElementChild!.textContent = timecode(f, latest.current.doc.fps);
      }
      line.style.display = show ? 'block' : 'none';
    }
  };

  const finish = (e: React.PointerEvent, cancelled = false) => {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; if (!cancelled && last.current) step(last.current); }
    cancelAnimationFrame(scrollLoop.current);
    scrollLoop.current = 0;
    const g = gesture.current;
    gesture.current = null;
    setOverlay({});
    try { sheet.current?.releasePointerCapture(e.pointerId); } catch {}
    if (!g) return;
    const { doc: d } = latest.current;
    if (cancelled) { dispatch({ type: 'draft', doc: null }); return; }
    switch (g.kind) {
      case 'pending':
        if (!g.additive) dispatch({ type: 'select', ids: g.alt ? [g.id] : withLinks(d, [g.id]) });
        return;
      case 'move':
        if (g.draft) commit(removeEmptyTracks(g.draft), g.copy ? g.created : withLinks(g.draft, g.ids));
        else dispatch({ type: 'draft', doc: null });
        return;
      case 'trim': case 'fade': case 'volume':
        if (g.draft) commit(g.draft); else dispatch({ type: 'draft', doc: null });
        return;
      case 'marquee':
        if (!g.started) { dispatch({ type: 'select', ids: [] }); seek(frameAt(g.start.x)); }
        return;
      case 'track':
        if (g.started && g.drop) commit(moveTrack(d, g.id, g.drop.index));
        return;
    }
  };

  const onPointerLeave = () => { if (razorLine.current) razorLine.current.style.display = 'none'; };

  // Double click on empty space in a row selects everything on that track.
  const onDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clip = target.closest<HTMLElement>('[data-clip]');
    const item = doc.items.find(i => i.id === clip?.dataset.clip);
    if (item && canOpen(item)) { details.open(item.id); return; }
    if (target.closest('[data-head], [data-clip], [data-ruler], button, input')) return;
    const p = point(e);
    const row = rows.find((r) => p.y >= r.top && p.y < r.top + r.h);
    if (row) dispatch({ type: 'select', ids: itemsOnTrack(doc, row.track.id) });
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Right click: the clip, the gap or the track under the pointer.

  const trackEntries = (track: Track): MenuEntry[] => {
    const hasSound = track.kind === 'audio' || doc.items.some((i) => i.track === track.id && i.type === 'video');
    const index = doc.tracks.findIndex((t) => t.id === track.id);
    return [
      { label: 'Select all on track', run: () => dispatch({ type: 'select', ids: itemsOnTrack(doc, track.id) }) },
      { label: 'Rename track', run: () => setRenaming(track.id) },
      ...(track.kind === 'visual' ? [{ label: track.hidden ? 'Show track' : 'Hide track', run: () => commit(updateTrack(doc, track.id, { hidden: !track.hidden })) }] : []),
      ...(hasSound ? [{ label: track.muted ? 'Unmute track' : 'Mute track', run: () => commit(updateTrack(doc, track.id, { muted: !track.muted })) }] : []),
      { label: track.locked ? 'Unlock track' : 'Lock track', run: () => commit(updateTrack(doc, track.id, { locked: !track.locked })) },
      'line',
      { label: track.kind === 'audio' ? 'Add sound track' : 'Add track', run: () => commit(addTrack(doc, track.kind, { at: index + 1 }).doc) },
      { label: 'Delete track', danger: true, disabled: Boolean(track.locked), run: () => commit(removeTrack(doc, track.id), []) },
    ];
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gesture.current) return;
    const target = e.target as HTMLElement;
    const p = point(e);
    const at = { x: e.clientX, y: e.clientY };
    if (target.closest('[data-ruler]')) return;
    const head = target.closest('[data-head]') as HTMLElement | null;
    if (head) { const track = doc.tracks.find((t) => t.id === head.dataset.head)!; setMenu({ ...at, entries: trackEntries(track) }); return; }
    const clipEl = target.closest('[data-clip]') as HTMLElement | null;
    const row = rows.find((r) => p.y >= r.top && p.y < r.top + r.h);
    const f = frameAt(p.x);
    seek(f);
    if (clipEl) {
      const id = clipEl.dataset.clip!;
      const item = doc.items.find((i) => i.id === id)!;
      const ids = selection.includes(id) ? selection : withLinks(doc, [id]);
      if (!selection.includes(id)) dispatch({ type: 'select', ids });
      const chosen = doc.items.filter((i) => ids.includes(i.id));
      const oneGroup = chosen.every((i) => i.link && i.link === chosen[0].link);
      const playhead = frames.get();
      const cutAt = playhead > item.from && playhead < end(item) ? playhead : f;
      const track = doc.tracks.find((t) => t.id === item.track)!;
      setMenu({ ...at, entries: [
        { label: cutAt === playhead ? 'Split at playhead' : 'Split here', keys: 'S', disabled: Boolean(track.locked), run: () => { const r = splitItems(doc, ids, cutAt); if (r.created.length) commit(r.doc, r.created); } },
        { label: 'Duplicate', keys: `${CMD} D`, run: () => { const r = duplicateItems(doc, ids); commit(r.doc, r.created); } },
        ...(ids.length > 1 && !oneGroup ? [{ label: 'Link', run: () => commit(linkItems(doc, ids), ids) }] : []),
        ...(chosen.some((i) => i.link) ? [{ label: 'Unlink', run: () => commit(unlinkItems(doc, ids), [id]) }] : []),
        'line',
        { label: 'Delete', keys: 'Del', run: () => commit(deleteItems(doc, ids), []) },
        { label: 'Ripple delete', keys: 'Shift Del', run: () => commit(deleteItems(doc, ids, { ripple: true }), []) },
        'line',
        ...trackEntries(track),
      ] });
      return;
    }
    if (!row) return;
    const gap = gapAt(doc, row.track.id, f);
    setMenu({ ...at, entries: [
      { label: 'Close gap', disabled: !gap || Boolean(row.track.locked), run: () => commit(closeGap(doc, row.track.id, f)) },
      'line',
      ...trackEntries(row.track),
    ] });
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Keys the timeline owns. The editor owns play, undo, split, delete, the arrows and snapping; these run first and
  // only take what is theirs.

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"], .tl-menu')) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      const { doc: d, selection: sel } = latest.current;
      const take = () => { e.preventDefault(); e.stopPropagation(); };
      if (!mod && !e.altKey && k === 'b') { take(); setTool((m) => (m === 'razor' ? 'select' : 'razor')); return; }
      if (!mod && !e.altKey && (k === 'v' || k === 'a')) { take(); setTool('select'); return; }
      if (k === 'escape' && latest.current.tool === 'razor') { setTool('select'); return; }
      if (e.altKey && !mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && sel.length) {
        take();
        const delta = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? d.fps : 1);
        const next = nudgeItems(d, sel, delta);
        if (next !== d) commit(next);
        return;
      }
      if (!mod && (e.key === '+' || e.key === '=')) { take(); zoom(1.5); return; }
      if (!mod && (e.key === '-' || e.key === '_')) { take(); zoom(1 / 1.5); return; }
      if (!mod && e.shiftKey && k === 'z') { take(); fit(); return; }
      if (mod && k === 'a') { take(); dispatch({ type: 'select', ids: d.items.filter((i) => !d.tracks.find((tr) => tr.id === i.track)?.locked).map((i) => i.id) }); return; }
    };
    const alt = (e: KeyboardEvent) => sheet.current?.classList.toggle('alt-held', e.altKey);
    window.addEventListener('keydown', key, true);
    window.addEventListener('keydown', alt);
    window.addEventListener('keyup', alt);
    return () => { window.removeEventListener('keydown', key, true); window.removeEventListener('keydown', alt); window.removeEventListener('keyup', alt); };
  }, [fit]);

  // Cmd or Ctrl with the wheel, or a pinch, zooms about the pointer. The wheel over the ruler scrolls through time.
  useEffect(() => {
    const s = scroller.current;
    if (!s) return;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const r = s.getBoundingClientRect();
        const sx = e.clientX - r.left;
        const z = latest.current.ppf;
        zoomTo(z * Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.012), (s.scrollLeft + sx - HEAD) / z, sx);
        return;
      }
      const overRuler = e.clientY - s.getBoundingClientRect().top < RULER;
      if (overRuler && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); s.scrollLeft += e.deltaY; }
    };
    s.addEventListener('wheel', wheel, { passive: false });
    return () => s.removeEventListener('wheel', wheel);
  }, [zoomTo]);

  // Dragging the top edge makes the timeline taller or shorter; the height is remembered on this computer.
  const section = useRef<HTMLElement>(null);
  useLayoutEffect(() => { applyPanelHeight(section.current, panel); }, [panel]);
  useEffect(() => () => applyPanelHeight(section.current, null), []);
  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = (el.parentElement as HTMLElement).getBoundingClientRect().height;
    let h = startH;
    const move = (ev: PointerEvent) => { h = Math.max(160, Math.min(window.innerHeight - 180, startH - (ev.clientY - startY))); setPanel(h); };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); writeHeight(h); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const onToggle = useCallback((track: Track, key: 'hidden' | 'muted' | 'locked') => {
    const d = latest.current.doc;
    const now = d.tracks.find((t) => t.id === track.id);
    if (now) dispatch({ type: 'commit', doc: updateTrack(d, track.id, { [key]: !now[key] }) });
  }, []);
  const onRename = useCallback((id: string, name: string | null) => {
    setRenaming(null);
    const d = latest.current.doc;
    if (name == null) return;
    const next = renameTrack(d, id, name);
    if (next.tracks.find((t) => t.id === id)?.name !== d.tracks.find((t) => t.id === id)?.name) dispatch({ type: 'commit', doc: next });
  }, []);

  // A clip reached with Tab is selected, the way a click would.
  const onFocus = (e: React.FocusEvent) => {
    const el = e.target as HTMLElement;
    const id = el.dataset?.clip;
    if (id && el.matches(':focus-visible') && !latest.current.selection.includes(id)) dispatch({ type: 'select', ids: [id] });
  };

  const hasSelection = selection.length > 0;
  const focusId = selection[0] ?? shown.items.find((i) => HEAD + end(i) * ppf >= win.l)?.id;
  const selected = useMemo(() => new Set(selection), [selection]);

  return (
    <section ref={section} className={`tl${tool === 'razor' ? ' is-razor' : ''}`} aria-label="Timeline">
      <div className="tl-resize" onPointerDown={onResizeDown} onDoubleClick={() => { setPanel(null); try { localStorage.removeItem(HEIGHT_KEY); } catch {} }} title="Drag to resize. Double click to reset" role="separator" aria-orientation="horizontal" aria-label="Resize timeline" />
      <div className="tl-bar">
        <div className="tl-tools">
          <span className="tl-seg" role="group" aria-label="Tool">
            <button className={`tool ${tool === 'select' ? 'is-on' : ''}`} onClick={() => setTool('select')} title="Select (V)" aria-pressed={tool === 'select'}><ToolGlyph kind="pointer" /></button>
            <button className={`tool ${tool === 'razor' ? 'is-on' : ''}`} onClick={() => setTool(tool === 'razor' ? 'select' : 'razor')} title="Razor (B). Click to cut, Shift cuts every track" aria-pressed={tool === 'razor'}><ToolGlyph kind="razor" /></button>
          </span>
          <i className="tl-sep" />
          <SplitButton frames={frames} doc={doc} selection={selection} split={props.split} />
          <button className="tool" onClick={props.duplicate} disabled={!hasSelection} title="Duplicate (Cmd D)" aria-label="Duplicate"><Icon name="copy" /></button>
          <button className="tool" onClick={() => props.remove(false)} disabled={!hasSelection} title="Delete (Delete). Shift Delete closes the gap" aria-label="Delete"><Icon name="trash" /></button>
        </div>
        <div className="tl-transport">
          <PlayButton frames={frames} toggle={props.togglePlay} />
          <Clock frames={frames} fps={doc.fps} duration={doc.durationInFrames} />
        </div>
        <div className="tl-tools right">
          <button className={`tool ${snapping ? 'is-on' : ''}`} onClick={() => props.setSnapping(!snapping)} title="Snapping (N)" aria-pressed={snapping} aria-label="Snapping"><Icon name="magnet" /></button>
          <i className="tl-sep" />
          <button className="tool" onClick={() => zoom(1 / 1.5)} title="Zoom out (-)" aria-label="Zoom out"><Icon name="zoomOut" /></button>
          <input className="zoom" type="range" min={Math.log(MIN_PPF)} max={Math.log(MAX_PPF)} step={0.01} value={Math.log(ppf)} onChange={(e) => zoomTo(Math.exp(Number(e.target.value)))} aria-label="Zoom" />
          <button className="tool" onClick={() => zoom(1.5)} title="Zoom in (+)" aria-label="Zoom in"><Icon name="zoomIn" /></button>
          <button className="tool" onClick={fit} title="Fit the whole video (Shift Z)" aria-label="Fit"><Icon name="fit" /></button>
        </div>
      </div>
      <div className="tl-scroll" ref={scroller} onScroll={updateWin}>
        <div
          className="tl-sheet" ref={sheet} style={{ width, height }} data-ppf={ppf} data-tool={tool} data-selection={selection.join(' ')}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(e) => finish(e)} onPointerCancel={(e) => finish(e, true)}
          onPointerLeave={onPointerLeave} onContextMenu={onContextMenu} onDoubleClick={onDoubleClick} onFocus={onFocus}
        >
          <Ruler fps={shown.fps} ppf={ppf} winL={win.l} winR={win.r} markers={shown.markers} />
          <div className="tl-corner" style={{ height: RULER }}><span>{tool === 'razor' ? 'Razor' : `${shown.tracks.length} tracks`}</span></div>
          <Beats ppf={ppf} winL={win.l} winR={win.r} markers={shown.markers} height={bottom} />
          {rows.map(({ track, top, h }) => {
            const items = byTrack.get(track.id) ?? [];
            const hasSound = track.kind === 'audio' || items.some((i) => i.type === 'video');
            const cls = ['tl-row', track.kind, track.hidden && 'is-hidden', track.locked && 'is-locked', track.muted && 'is-muted', overlay.drop === track.id && 'is-drop', overlay.fresh === track.id && 'is-new'].filter(Boolean).join(' ');
            return (
              <div key={track.id} className={cls} data-row={track.id} style={{ top, height: h }}>
                <Head track={track} h={h} hasSound={hasSound} renaming={renaming === track.id} onToggle={onToggle} onRename={onRename} onRenameStart={setRenaming} />
                {items.map((item) => {
                  const l = HEAD + item.from * ppf;
                  if (l > win.r || l + item.durationInFrames * ppf < win.l) return null;
                  return (
                    <Clip
                      key={item.id} item={item} fps={shown.fps} ppf={ppf} height={h} selected={selected.has(item.id)}
                      locked={Boolean(track.locked)} muted={Boolean(track.muted)} focusable={item.id === focusId} winL={win.l} winR={win.r}
                    />
                  );
                })}
              </div>
            );
          })}
          {details.item && <DetailTimeline top={bottom} ppf={ppf} />}
          {overlay.ghosts?.map((g, i) => { const r = rows.find((row) => row.track.id === g.track); return r ? <div key={i} className="tl-ghost" style={{ left: HEAD + g.from * ppf, top: r.top + 3, width: g.length * ppf, height: r.h - 6 }} /> : null; })}
          {overlay.extent && <div className="tl-extent" style={{ left: overlay.extent.x, top: overlay.extent.y, width: overlay.extent.w, height: overlay.extent.h }} />}
          {overlay.swap && <div className="tl-swap" style={{ left: overlay.swap.x, top: overlay.swap.y, width: overlay.swap.w, height: overlay.swap.h }} />}
          {overlay.insert && <div className="tl-insert-at" style={{ left: overlay.insert.x, top: overlay.insert.y, width: overlay.insert.w, height: overlay.insert.h }} />}
          {overlay.snap != null && <div className="tl-snap" style={{ left: HEAD + overlay.snap * ppf }} />}
          {overlay.line != null && <div className="tl-insert" style={{ top: overlay.line - 1 }} />}
          {overlay.box && <div className="tl-marquee" style={{ left: overlay.box.x, top: overlay.box.y, width: overlay.box.w, height: overlay.box.h }} />}
          {overlay.readout && <div className="tl-readout" style={{ left: overlay.readout.x, top: overlay.readout.y < RULER + 2 ? overlay.readout.y + 50 : overlay.readout.y }}>{overlay.readout.text}</div>}
          <div className="tl-razor" ref={razorLine} style={{ display: 'none' }}><span /></div>
          <Playhead frames={frames} ppf={ppf} scroller={scroller} />
        </div>
      </div>
      {menu && <ContextMenu menu={menu} close={() => setMenu(null)} />}
    </section>
  );
}
