// The stage: the video as it will be, playing, with what is under the pointer outlined and what is selected in a box
// with handles. Click to select, drag to move, a corner to size it, the knob to turn it, double click words to type on
// the frame. Moves snap to the frame, the safe zone and the other items, with the line drawn. It works on any format's
// drawing because it measures what is drawn on the page, never what a format says it draws.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useDetails, DetailCanvas } from './Details';
import { Edit, placementCss, wordsCss } from './Edit';
import type { Doc, Item, Transform } from './types';
import type { Action, FrameStore } from './store';
import { useFrame, usePlaying } from './store';
import { mediaUrl } from './media';
import { Icon } from './icons';
import { textLooks } from 'keyframes-layers';
import { updateItem, end, withLinks } from '../edit-doc.mjs';
import {
  SAFE, SNAP_SCREEN_PX, ENGAGE_PX, placed, contains, reorigin, center, snapLines, snapMove, scaleFromCorner,
  snapAngle, angleOf, mediaBox, cropBox, dragCrop, resizeMedia, toLocal, tidy, full,
} from './geometry.mjs';

type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
type Corner = 'nw' | 'ne' | 'se' | 'sw';
type Guide = { axis: 'x' | 'y'; at: number; kind: string };

const isMedia = (item: Item) => item.type === 'video' || item.type === 'image';
const visualAt = (doc: Doc, frame: number) => {
  const order = new Map(doc.tracks.map((t, i) => [t.id, i]));
  const hidden = new Set(doc.tracks.filter((t) => t.hidden).map((t) => t.id));
  return doc.items
    .filter((i) => i.type !== 'audio' && !hidden.has(i.track) && frame >= i.from && frame < end(i))
    .sort((a, b) => (order.get(a.track) ?? 0) - (order.get(b.track) ?? 0));
};
const lockedTrack = (doc: Doc, item: Item) => Boolean(doc.tracks.find((t) => t.id === item.track)?.locked);

// ---------------------------------------------------------------------------------------------------------------
// Measuring. A clip or picture's box is known from its size and crop. Anything else (words, captions, a format's
// graphic) is measured on the page: the placement is lifted for a moment so the drawing is read where it draws itself,
// then only what is actually painted counts (words, pictures, filled boxes), never the full-frame wrappers.

function drawnRect(root: Element, frame: DOMRect): DOMRect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  let fullPaint = false;
  const add = (r: DOMRect) => {
    if (r.width < 1 || r.height < 1) return;
    if (r.right < frame.left || r.left > frame.right || r.bottom < frame.top || r.top > frame.bottom) return;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
  };
  const isFull = (r: DOMRect) => r.width >= frame.width * 0.985 && r.height >= frame.height * 0.985;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_ACCEPT;
      const style = getComputedStyle(node as Element);
      return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) continue;
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) add(r);
      continue;
    }
    const el = node as HTMLElement;
    const style = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const picture = ['IMG', 'VIDEO', 'CANVAS', 'svg'].includes(el.tagName);
    const painted = !/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor) || style.backgroundImage !== 'none' || parseFloat(style.borderTopWidth) > 0;
    if (picture) add(r);
    else if (painted) { if (isFull(r)) fullPaint = true; else add(r); }
  }
  if (x0 === Infinity) return fullPaint ? new DOMRect(frame.left, frame.top, frame.width, frame.height) : null;
  return new DOMRect(x0, y0, x1 - x0, y1 - y0);
}

function measure(host: HTMLElement, frameEl: HTMLElement, item: Item, doc: Doc): Box | null {
  if (isMedia(item)) return cropBox(mediaBox(item, doc), item.crop);
  const el = host.querySelector<HTMLElement>(`[data-item="${CSS.escape(item.id)}"]`);
  if (!el) return null;
  const frame = frameEl.getBoundingClientRect();
  const k = frame.width / doc.width;
  const saved = el.style.transform;
  el.style.transform = 'none';
  const r = drawnRect(el, frame);
  el.style.transform = saved;
  return r ? { x: (r.left - frame.left) / k, y: (r.top - frame.top) / k, w: r.width / k, h: r.height / k } : null;
}

// ---------------------------------------------------------------------------------------------------------------

type Gesture =
  | { kind: 'move'; ids: string[]; start: Point; origin: Doc; t0: Record<string, Transform>; bounds: Box; lines: ReturnType<typeof snapLines>; engaged: boolean; additive: boolean; hit: string; group: string[]; draft?: Doc }
  | { kind: 'scale'; id: string; corner: Corner; box: Box; origin: Doc; t0: Transform; draft?: Doc }
  | { kind: 'rotate'; id: string; box: Box; origin: Doc; t0: Transform; pivot: Point; startAngle: number; draft?: Doc }
  | { kind: 'crop'; id: string; handle: string; box: Box; origin: Doc; t0: Transform; start: Point; crop0: any; draft?: Doc }
  | { kind: 'pan'; start: Point; pan0: Point }
  | { kind: 'click'; id: string | null; group: string[]; start: Point; additive: boolean }
  | { kind: 'marquee'; start: Point; additive: boolean; base: string[]; engaged: boolean; backdrop: string[] | null };

export type StageProps = {
  doc: Doc; shown: Doc; selection: string[]; dispatch: React.Dispatch<Action>;
  frames: FrameStore; player: React.RefObject<PlayerRef>;
  editing: string | null; setEditing: (id: string | null) => void;
  cropping: string | null; setCropping: (id: string | null) => void;
  onFocusField: (id: string) => void;
  onEmptyAdd: () => void;
  onDropHere: (e: React.DragEvent, point: Point | null) => void;
};

const ZOOMS = [0.25, 0.5, 1, 2];

// The player reads each clip from its editing copy once the workspace has made it (a keyframe every half second, so a
// seek shows its picture at once); until then it reads the file itself. Asked once per file, then every few seconds
// until it is ready.
function useEditingCopies(doc: Doc) {
  const [ready, setReady] = useState<Record<string, string>>({});
  const paths = useMemo(() => [...new Set(doc.items.filter((i) => i.type === 'video').map((i) => i.preview ?? i.src!).filter(Boolean))].sort().join('\n'), [doc.items]);
  useEffect(() => {
    let live = true;
    let timer = 0;
    const waiting = new Set(paths ? paths.split('\n') : []);
    const ask = async () => {
      for (const path of [...waiting]) {
        const url = `/api/edit/proxy?path=${encodeURIComponent(path)}`;
        const answer = await fetch(`${url}&check=1`).then((r) => (r.ok ? r.json() : { failed: true })).catch(() => null);
        if (!live) return;
        if (answer?.ready) { waiting.delete(path); setReady((r) => (r[path] ? r : { ...r, [path]: url })); }
        else if (answer?.failed) waiting.delete(path);
      }
      if (live && waiting.size) timer = window.setTimeout(ask, 2500);
    };
    ask();
    return () => { live = false; window.clearTimeout(timer); };
  }, [paths]);
  return useCallback((path: string) => ready[path] ?? mediaUrl(path), [ready]);
}

export function Stage(props: StageProps) {
  const details = useDetails();
  const { doc, shown, selection, dispatch, frames, player, editing, setEditing, cropping, setCropping } = props;
  const host = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState<'fit' | number>('fit');
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [safe, setSafe] = useState(false);
  const [zoomMenu, setZoomMenu] = useState(false);
  const [dropping, setDropping] = useState(false);

  useLayoutEffect(() => {
    const el = host.current!;
    const read = () => { const r = el.getBoundingClientRect(); setRoom({ w: Math.round(r.width), h: Math.round(r.height) }); };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit = room.w > 0 ? Math.max(0.05, Math.min((room.w - 56) / doc.width, (room.h - 56) / doc.height)) : 0;
  const k = zoom === 'fit' ? fit : zoom;
  const size = { w: Math.round(doc.width * k), h: Math.round(doc.height * k) };
  const left = Math.round((room.w - size.w) / 2 + (zoom === 'fit' ? 0 : pan.x));
  const top = Math.round((room.h - size.h) / 2 + (zoom === 'fit' ? 0 : pan.y));

  const zoomTo = useCallback((next: number | 'fit', about?: Point) => {
    if (next === 'fit') { setZoom('fit'); setPan({ x: 0, y: 0 }); return; }
    const value = Math.max(0.1, Math.min(4, next));
    // Keep the point under the pointer (or the middle) where it is.
    const r = host.current!.getBoundingClientRect();
    const a = about ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const fx = (a.x - r.left - left) / k, fy = (a.y - r.top - top) / k;
    const nextLeft = a.x - r.left - fx * value, nextTop = a.y - r.top - fy * value;
    setPan({ x: nextLeft - (room.w - doc.width * value) / 2, y: nextTop - (room.h - doc.height * value) / 2 });
    setZoom(value);
  }, [k, left, top, room.w, room.h, doc.width, doc.height]);

  // Ctrl or Cmd with the wheel (and a trackpad pinch) zooms about the pointer; the wheel alone pans a zoomed frame.
  useEffect(() => {
    const el = host.current!;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomTo(k * Math.exp(-e.deltaY * 0.01), { x: e.clientX, y: e.clientY }); }
      else if (zoom !== 'fit') { e.preventDefault(); setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })); }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomTo, k, zoom]);

  // The Player reports its frame; the playhead store tells everything else.
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const update = (e: any) => frames.set(e.detail.frame);
    const play = () => frames.setPlaying(true);
    const pause = () => frames.setPlaying(false);
    p.addEventListener('frameupdate', update);
    p.addEventListener('seeked', update);
    p.addEventListener('play', play);
    p.addEventListener('pause', pause);
    p.addEventListener('ended', pause);
    return () => { p.removeEventListener('frameupdate', update); p.removeEventListener('seeked', update); p.removeEventListener('play', play); p.removeEventListener('pause', pause); p.removeEventListener('ended', pause); };
  }, [player.current, size.w > 0]);

  const skip = useMemo(() => (editing ? [editing] : []), [editing]);
  const asset = useEditingCopies(shown);
  const inputProps = useMemo(() => ({ doc: shown, mode: 'player' as const, asset, skip }), [shown, skip, asset]);
  const empty = !doc.items.some((i) => i.type !== 'audio');

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('[contenteditable="true"], [contenteditable="plaintext-only"], input, textarea')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomTo(k * 1.25); }
    else if (mod && e.key === '-') { e.preventDefault(); zoomTo(k / 1.25); }
    else if (mod && e.key === '0') { e.preventDefault(); zoomTo('fit'); }
    else if (e.key === 'Escape' && (cropping || editing)) { e.preventDefault(); setCropping(null); setEditing(null); }
    else if (e.key === 'Enter' && selection.length === 1) {
      const item = doc.items.find((i) => i.id === selection[0]);
      if (item?.type === 'text' && !(item.style?.look && textLooks[item.style.look]?.draw)) { e.preventDefault(); player.current?.pause(); setEditing(item.id); }
    } else if (e.key.startsWith('Arrow') && !mod) {
      const moving = doc.items.filter((i) => selection.includes(i.id) && i.type !== 'audio' && !lockedTrack(doc, i));
      if (!moving.length) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      let next = doc;
      for (const item of moving) { const t = full(item.transform); next = updateItem(next, item.id, { transform: { ...t, x: t.x + dx, y: t.y + dy } }); }
      dispatch({ type: 'commit', doc: next, merge: `nudge:${moving.map((i) => i.id).join(',')}` });
    }
  };

  const zoomLabel = zoom === 'fit' ? `Fit` : `${Math.round(k * 100)}%`;

  return (
    <div
      className={`stage ${zoom !== 'fit' ? 'is-zoomed' : ''} ${dropping ? 'is-dropping' : ''}`}
      ref={host}
      tabIndex={0}
      aria-label="Video"
      onKeyDown={onKeyDown}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-keyframes-media') || e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={(e) => { if (!host.current!.contains(e.relatedTarget as Node)) setDropping(false); }}
      onDrop={(e) => {
        setDropping(false);
        const r = frameRef.current?.getBoundingClientRect();
        const inside = r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        props.onDropHere(e, inside ? { x: (e.clientX - r!.left) / k, y: (e.clientY - r!.top) / k } : null);
      }}
    >
      {size.w > 0 && (
        <div className="stage-frame" ref={frameRef} style={{ left, top, width: size.w, height: size.h }}>
          <Player
            ref={player}
            component={Edit as any}
            inputProps={inputProps}
            durationInFrames={Math.max(1, shown.durationInFrames)}
            compositionWidth={doc.width}
            compositionHeight={doc.height}
            fps={doc.fps}
            style={{ width: size.w, height: size.h }}
            controls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            acknowledgeRemotionLicense
            numberOfSharedAudioTags={8}
            bufferStateDelayInMilliseconds={300}
          />
        </div>
      )}
      {size.w > 0 && (
        details.item ? <DetailCanvas host={host} /> : <Overlay
          {...props}
          host={host}
          frameRef={frameRef}
          k={k}
          left={left}
          top={top}
          safe={safe}
          pan={pan}
          setPan={setPan}
          zoomed={zoom !== 'fit'}
        />
      )}
      {size.w > 0 && empty && (
        <div className="stage-empty" style={{ left, top, width: size.w, height: size.h }}>
          <Icon name="media" size={28} />
          <strong>Drop clips here</strong>
          <span>Or pick them from your files.</span>
          <button className="btn" onClick={props.onEmptyAdd}><Icon name="plus" size={16} />Add clips</button>
        </div>
      )}
      <div className="stage-tools top">
        <button className={`tool ${safe ? 'is-on' : ''}`} onClick={() => setSafe(!safe)} title="Show where Instagram's buttons sit" aria-pressed={safe}><Icon name="safe" /><span>Safe zone</span></button>
      </div>
      <div className="stage-tools bottom">
        <button className="tool" onClick={() => zoomTo(k / 1.25)} title="Zoom out (Cmd -)" aria-label="Zoom out"><Icon name="zoomOut" /></button>
        <div className="zoom-pick">
          <button className="tool zoom-value" onClick={() => setZoomMenu(!zoomMenu)} aria-haspopup="menu" aria-expanded={zoomMenu}>{zoomLabel}</button>
          {zoomMenu && (
            <div className="menu" role="menu" onMouseLeave={() => setZoomMenu(false)}>
              <button role="menuitem" onClick={() => { zoomTo('fit'); setZoomMenu(false); }}>Fit <kbd>Cmd 0</kbd></button>
              {ZOOMS.map((z) => <button key={z} role="menuitem" onClick={() => { zoomTo(z); setZoomMenu(false); }}>{z * 100}%</button>)}
            </div>
          )}
        </div>
        <button className="tool" onClick={() => zoomTo(k * 1.25)} title="Zoom in (Cmd +)" aria-label="Zoom in"><Icon name="zoomIn" /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// What is drawn over the frame, and everything the pointer does on it. It redraws with the playhead; the stage above
// does not.

type OverlayProps = StageProps & {
  host: React.RefObject<HTMLDivElement>; frameRef: React.RefObject<HTMLDivElement>;
  k: number; left: number; top: number; safe: boolean; pan: Point; setPan: (p: Point) => void; zoomed: boolean;
};

function Overlay(p: OverlayProps) {
  const { doc, shown, selection, dispatch, frames, player, k, left, top, editing, setEditing, cropping, setCropping } = p;
  const frame = useFrame(frames);
  const playing = usePlaying(frames);
  const gesture = useRef<Gesture | null>(null);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [readout, setReadout] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<Box | null>(null);
  const cache = useRef<{ frame: number; doc: Doc; boxes: Map<string, Box | null> }>({ frame: -1, doc: shown, boxes: new Map() });
  const hoverRaf = useRef(0);

  const box = useCallback((item: Item): Box | null => {
    const c = cache.current;
    if (c.frame !== frames.get() || c.doc !== shown) { cache.current = { frame: frames.get(), doc: shown, boxes: new Map() }; }
    const store = cache.current.boxes;
    if (!store.has(item.id)) store.set(item.id, p.host.current && p.frameRef.current ? measure(p.host.current, p.frameRef.current, item, shown) : null);
    return store.get(item.id) ?? null;
  }, [shown]);

  // Measure what is outlined after the player has drawn this frame.
  const outlined = useMemo(() => [...new Set([...selection, ...(hover ? [hover] : [])])], [selection, hover]);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      cache.current = { frame: frames.get(), doc: shown, boxes: new Map() };
      const next: Record<string, Box> = {};
      for (const itemId of outlined) {
        const item = shown.items.find((i) => i.id === itemId);
        if (!item || item.type === 'audio' || frame < item.from || frame >= end(item) || item.id === editing) continue;
        const g = gesture.current;
        const b = g && 'box' in g && g.id === itemId ? g.box : box(item);
        if (b) next[itemId] = b;
      }
      setBoxes(next);
    });
    return () => cancelAnimationFrame(id);
  }, [frame, shown, outlined, k, editing]);

  const toFrame = (clientX: number, clientY: number): Point => {
    const r = p.frameRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / k, y: (clientY - r.top) / k };
  };

  // The topmost item drawn under a point at this frame. The selected item wins inside its own box, so a selection
  // under something else can still be dragged.
  const hit = (point: Point, preferSelected = true): string | null => {
    if (preferSelected && selection.length === 1) {
      const selected = shown.items.find((i) => i.id === selection[0]);
      // Not the footage behind everything: then nothing on top could ever be clicked.
      if (selected && selected.type !== 'audio' && frame >= selected.from && frame < end(selected) && !isBackdrop(selected.id)) {
        const b = box(selected);
        if (b && contains(b, selected.transform, shown, point)) return selected.id;
      }
    }
    for (const item of visualAt(shown, frames.get())) {
      const b = box(item);
      if (b && contains(b, item.transform, shown, point)) return item.id;
    }
    return null;
  };

  // The overlay holds the pointer for the whole gesture, so a drag that leaves the frame keeps going.
  const overlay = useRef<HTMLDivElement>(null);
  const release = (e: React.PointerEvent) => { try { overlay.current?.releasePointerCapture(e.pointerId); } catch {} };
  const capture = (e: React.PointerEvent) => { try { overlay.current?.setPointerCapture(e.pointerId); } catch {} };

  // Every hand-held change starts about the middle of what is drawn: the origin moves there without moving anything.
  const prepared = (item: Item, b: Box): Transform => {
    const t = full(item.transform);
    const c = center(b);
    if (t.originX != null && Math.abs(t.originX - c.x) < 0.5 && Math.abs(t.originY! - c.y) < 0.5) return t;
    return reorigin(t, shown, c);
  };

  const startHandle = (e: React.PointerEvent, kind: 'scale' | 'rotate', corner?: Corner) => {
    const item = doc.items.find((i) => i.id === selection[0]);
    const b = item && boxes[item.id];
    if (!item || !b || lockedTrack(doc, item)) return;
    e.stopPropagation();
    e.preventDefault();
    p.host.current?.focus({ preventScroll: true });
    capture(e);
    player.current?.pause();
    const t0 = prepared(item, b);
    if (kind === 'scale') gesture.current = { kind, id: item.id, corner: corner!, box: b, origin: doc, t0 };
    else {
      const pivot = placed(b, t0, doc).center;
      gesture.current = { kind, id: item.id, box: b, origin: doc, t0, pivot, startAngle: angleOf(pivot, toFrame(e.clientX, e.clientY)) };
      setReadout(`${Math.round(t0.rotation)}°`);
    }
  };

  const startCrop = (e: React.PointerEvent, handle: string) => {
    const item = doc.items.find((i) => i.id === cropping);
    if (!item || lockedTrack(doc, item)) return;
    e.stopPropagation();
    e.preventDefault();
    capture(e);
    gesture.current = { kind: 'crop', id: item.id, handle, box: mediaBox(item, doc), origin: doc, t0: full(item.transform), start: toFrame(e.clientX, e.clientY), crop0: item.crop };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.stage-tools, .stage-empty, .inline-edit [contenteditable]')) return;
    p.host.current?.focus({ preventScroll: true });
    const onFrame = Boolean(target.closest('.stage-layer'));
    // The middle button, or a drag beside a zoomed frame, pans.
    if (e.button === 1 || (e.button === 0 && !onFrame && p.zoomed)) { capture(e); gesture.current = { kind: 'pan', start: { x: e.clientX, y: e.clientY }, pan0: p.pan }; return; }
    if (e.button !== 0) return;
    const point = toFrame(e.clientX, e.clientY);
    const startBox = (backdrop: string[] | null) => { capture(e); gesture.current = { kind: 'marquee', start: point, additive: e.shiftKey, base: selection, engaged: false, backdrop }; };
    // Beside the frame, a drag draws a box to select with.
    if (!onFrame) { setCropping(null); startBox(null); return; }
    // With Shift the click means the thing on top, even over the selection, so it can be added.
    const id = hit(point, !e.shiftKey);
    if (cropping && id !== cropping) setCropping(null);
    if (!id) { startBox(null); return; }
    // Linked partners come with a click, the way they do on the timeline; Alt takes just the one.
    const group = e.altKey ? [id] : withLinks(shown, [id]);
    // A drag that starts on the full-frame picture behind everything draws a box; a click still selects it.
    if (!selection.includes(id) && isBackdrop(id)) { startBox(group); return; }
    // Shift on something not selected adds it. Shift on the selection drags it in one direction, or takes it out
    // when it was only a click.
    if (e.shiftKey && !selection.includes(id)) { gesture.current = { kind: 'click', id, group, start: point, additive: true }; return; }
    const ids = selection.includes(id) ? selection : group;
    if (!selection.includes(id)) dispatch({ type: 'select', ids });
    const moving = shown.items.filter((i) => ids.includes(i.id) && i.type !== 'audio' && !lockedTrack(doc, i) && frame >= i.from && frame < end(i));
    if (!moving.length) { gesture.current = { kind: 'click', id, group, start: point, additive: false }; return; }
    capture(e);
    // What moves is held by its upright box; everything else visible is something to snap to.
    const all = moving.map((i) => { const b = box(i); return b ? placed(b, i.transform, shown).bounds : null; }).filter(Boolean) as Box[];
    const x0 = Math.min(...all.map((b) => b.x)), y0 = Math.min(...all.map((b) => b.y));
    const bounds = all.length ? { x: x0, y: y0, w: Math.max(...all.map((b) => b.x + b.w)) - x0, h: Math.max(...all.map((b) => b.y + b.h)) - y0 } : { x: 0, y: 0, w: 0, h: 0 };
    const others = visualAt(shown, frame).filter((i) => !ids.includes(i.id) && !isFullFrame(i)).map((i) => { const b = box(i); return b ? placed(b, i.transform, shown).bounds : null; }).filter(Boolean) as Box[];
    const t0: Record<string, Transform> = {};
    for (const i of moving) t0[i.id] = full(i.transform);
    gesture.current = { kind: 'move', ids: moving.map((i) => i.id), start: point, origin: doc, t0, bounds, lines: snapLines(doc, others, { safe: p.safe }), engaged: false, additive: e.shiftKey, hit: id, group };
  };

  const isFullFrame = (item: Item) => item.type === 'video' && !item.size;
  // Drawn over nearly the whole frame: the footage behind everything.
  const isBackdrop = (id: string) => {
    const item = shown.items.find((i) => i.id === id);
    if (!item || (item.type !== 'video' && item.type !== 'image')) return false;
    const b = box(item);
    if (!b) return false;
    const r = placed(b, item.transform, shown).bounds;
    return r.w * r.h >= shown.width * shown.height * 0.9;
  };
  // What a box drawn on the frame selects: everything it touches, except the backdrop unless it holds it whole.
  const inMarquee = (m: Box) => {
    const picked: string[] = [];
    for (const item of visualAt(shown, frames.get())) {
      const b = box(item);
      if (!b) continue;
      const r = placed(b, item.transform, shown).bounds;
      const touches = r.x < m.x + m.w && r.x + r.w > m.x && r.y < m.y + m.h && r.y + r.h > m.y;
      const holds = r.x >= m.x && r.y >= m.y && r.x + r.w <= m.x + m.w && r.y + r.h <= m.y + m.h;
      if (touches && (!isBackdrop(item.id) || holds)) picked.push(item.id);
    }
    return withLinks(shown, picked);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) {
      // Hover: outline what a click would select. Not while playing, where it would flicker.
      if (playing || editing) return;
      cancelAnimationFrame(hoverRaf.current);
      const cx = e.clientX, cy = e.clientY, over = Boolean((e.target as HTMLElement).closest('.stage-layer'));
      hoverRaf.current = requestAnimationFrame(() => setHover(over && p.frameRef.current ? hit(toFrame(cx, cy)) : null));
      return;
    }
    if (g.kind === 'pan') { p.setPan({ x: g.pan0.x + e.clientX - g.start.x, y: g.pan0.y + e.clientY - g.start.y }); return; }
    if (g.kind === 'click') return;
    const point = toFrame(e.clientX, e.clientY);
    if (g.kind === 'marquee') {
      if (!g.engaged && Math.hypot(point.x - g.start.x, point.y - g.start.y) * k < ENGAGE_PX) return;
      g.engaged = true;
      const m = { x: Math.min(g.start.x, point.x), y: Math.min(g.start.y, point.y), w: Math.abs(point.x - g.start.x), h: Math.abs(point.y - g.start.y) };
      setMarquee(m);
      const ids = inMarquee(m);
      dispatch({ type: 'select', ids: g.additive ? [...new Set([...g.base, ...ids])] : ids });
      return;
    }
    if (g.kind === 'move') {
      let dx = point.x - g.start.x, dy = point.y - g.start.y;
      if (!g.engaged) { if (Math.hypot(dx, dy) * k < ENGAGE_PX) return; g.engaged = true; player.current?.pause(); setHover(null); }
      // Shift holds the move to one direction.
      let lock: 'x' | 'y' | null = null;
      if (e.shiftKey) { lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; if (lock === 'x') dy = 0; else dx = 0; }
      let seen: Guide[] = [];
      if (!(e.altKey || e.metaKey || e.ctrlKey)) {
        const snapped = snapMove(g.bounds, dx, dy, g.lines, SNAP_SCREEN_PX / k);
        if (lock !== 'y') dx = snapped.dx;
        if (lock !== 'x') dy = snapped.dy;
        seen = snapped.guides.filter((guide: Guide) => (guide.axis === 'x' ? lock !== 'y' : lock !== 'x'));
      }
      let next = g.origin;
      for (const id of g.ids) next = updateItem(next, id, { transform: tidy({ ...g.t0[id], x: g.t0[id].x + dx, y: g.t0[id].y + dy }) });
      g.draft = next;
      setGuides(seen);
      dispatch({ type: 'draft', doc: next });
    } else if (g.kind === 'scale') {
      const item = g.origin.items.find((i) => i.id === g.id)!;
      let patch: Partial<Item>;
      if (e.shiftKey && isMedia(item)) {
        const r = resizeMedia(item, doc, g.t0, g.corner, point);
        patch = { size: r.size, transform: tidy(r.transform) };
        setReadout(`${r.size.w} × ${r.size.h}`);
      } else {
        const t = scaleFromCorner(g.box, g.t0, doc, g.corner, point, { fromCenter: e.altKey });
        patch = { transform: tidy(t) };
        setReadout(`${Math.round(t.scale * 100)}%`);
      }
      g.draft = updateItem(g.origin, g.id, patch);
      dispatch({ type: 'draft', doc: g.draft });
    } else if (g.kind === 'rotate') {
      const angle = snapAngle(g.t0.rotation + angleOf(g.pivot, point) - g.startAngle, { step: e.shiftKey ? 15 : 0 });
      setReadout(`${Math.round(angle)}°`);
      g.draft = updateItem(g.origin, g.id, { transform: tidy({ ...g.t0, rotation: angle }) });
      dispatch({ type: 'draft', doc: g.draft });
    } else if (g.kind === 'crop') {
      const local = toLocal(g.t0, { x: point.x - g.start.x, y: point.y - g.start.y });
      const crop = dragCrop(g.crop0, g.handle, local, g.box);
      g.draft = updateItem(g.origin, g.id, { crop });
      dispatch({ type: 'draft', doc: g.draft });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    release(e);
    setGuides([]);
    setReadout(null);
    if (!g) return;
    setMarquee(null);
    if (g.kind === 'click') {
      if (g.additive && g.id) dispatch({ type: 'select', ids: g.group.every((i) => selection.includes(i)) ? selection.filter((s) => !g.group.includes(s)) : [...new Set([...selection, ...g.group])] });
      else if (g.id) dispatch({ type: 'select', ids: g.group });
      return;
    }
    if (g.kind === 'marquee') {
      // Not a drag after all: a click on the backdrop selects it, a click on nothing clears the selection.
      if (!g.engaged) dispatch({ type: 'select', ids: g.backdrop ?? (g.additive ? selection : []) });
      return;
    }
    if (g.kind === 'pan') return;
    if (g.kind === 'move' && !g.engaged) {
      // A click on one of several selected items selects just its group; with Shift it takes the group out.
      if (g.additive) dispatch({ type: 'select', ids: selection.filter((s) => !g.group.includes(s)) });
      else if (selection.length > g.group.length) dispatch({ type: 'select', ids: g.group });
      return;
    }
    if ('draft' in g && g.draft) dispatch({ type: 'commit', doc: g.draft });
    else dispatch({ type: 'draft', doc: null });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    // After a captured click the target is the overlay itself, so where the pointer is decides, not the target.
    const point = toFrame(e.clientX, e.clientY);
    if (point.x < 0 || point.y < 0 || point.x > shown.width || point.y > shown.height) return;
    const id = hit(point);
    const item = id ? shown.items.find((i) => i.id === id) : null;
    if (!item) return;
    dispatch({ type: 'select', ids: [item.id] });
    player.current?.pause();
    if (item.type === 'text' && !(item.style?.look && textLooks[item.style.look]?.draw)) setEditing(item.id);
    else if (isMedia(item) && !lockedTrack(doc, item)) setCropping(item.id);
    else p.onFocusField(item.id);
  };

  // Draw a box that turns with its item.
  const frameBox = (b: Box, t: Transform | undefined) => {
    const pl = placed(b, t, shown);
    return { left: left + (pl.center.x - pl.w / 2) * k, top: top + (pl.center.y - pl.h / 2) * k, width: Math.max(1, pl.w * k), height: Math.max(1, pl.h * k), transform: pl.rotation ? `rotate(${pl.rotation}deg)` : undefined };
  };

  const single = selection.length === 1 ? shown.items.find((i) => i.id === selection[0]) : null;
  const singleLocked = single ? lockedTrack(shown, single) : false;
  const cropItem = cropping ? shown.items.find((i) => i.id === cropping) : null;
  const editItem = editing ? shown.items.find((i) => i.id === editing) : null;
  const safeTop = SAFE.top * shown.height * k, safeBottom = SAFE.bottom * shown.height * k, safeRight = SAFE.right * shown.width * k;
  const g = gesture.current;

  return (
    <div className="stage-overlay" ref={overlay} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={() => !gesture.current && setHover(null)} onDoubleClick={onDoubleClick}>
      <div className="stage-layer" style={{ left, top, width: shown.width * k, height: shown.height * k }}>
        {p.safe && (
          <div className="safe" aria-hidden="true">
            <i style={{ top: 0, left: 0, right: 0, height: safeTop }} />
            <i style={{ bottom: 0, left: 0, right: 0, height: safeBottom }} />
            <i style={{ top: safeTop, bottom: safeBottom, right: 0, width: safeRight }} />
          </div>
        )}
        {marquee && <div className="marquee" style={{ left: marquee.x * k, top: marquee.y * k, width: marquee.w * k, height: marquee.h * k }} />}
        {guides.map((guide, i) => (
          <div key={i} className={`guide ${guide.axis === 'x' ? 'v' : 'h'} ${guide.kind}`} style={guide.axis === 'x' ? { left: guide.at * k } : { top: guide.at * k }} />
        ))}
      </div>
      {hover && !selection.includes(hover) && boxes[hover] && (
        <div className="hover-box" style={frameBox(boxes[hover], shown.items.find((i) => i.id === hover)?.transform)} />
      )}
      {selection.filter((id) => boxes[id] && id !== cropping).map((id) => {
        const item = shown.items.find((i) => i.id === id)!;
        const handles = single?.id === id && !singleLocked && !playing;
        const style = frameBox(boxes[id], item.transform);
        // On a small box the handles sit outside it, so pressing its middle always moves it.
        const small = style.width < 44 || style.height < 44;
        return (
          <div key={id} className={`sel ${handles ? '' : 'plain'} ${singleLocked ? 'locked' : ''} ${small ? 'small' : ''}`} style={style} data-sel={id}>
            {handles && (['nw', 'ne', 'se', 'sw'] as Corner[]).map((c) => (
              <b key={c} className={`sel-handle ${c}`} data-handle={c} onPointerDown={(e) => startHandle(e, 'scale', c)} title="Drag to size. Shift sizes freely on pictures and clips. Alt sizes from the middle." />
            ))}
            {handles && <b className="sel-rotate" data-handle="rotate" onPointerDown={(e) => startHandle(e, 'rotate')} title="Drag to turn. Shift turns in steps of 15." />}
            {readout && single?.id === id && <span className={`sel-readout ${g?.kind === 'rotate' ? 'turn' : ''}`}>{readout}</span>}
          </div>
        );
      })}
      {cropItem && frame >= cropItem.from && frame < end(cropItem) && (() => {
        const whole = mediaBox(cropItem, shown);
        const shownBox = cropBox(whole, cropItem.crop);
        return (
          <>
            <div className="crop-whole" style={frameBox(whole, cropItem.transform)} />
            <div className="crop-box" style={frameBox(shownBox, cropItem.transform)} data-crop={cropItem.id}>
              {['n', 's', 'e', 'w', 'nw', 'ne', 'se', 'sw'].map((h) => <b key={h} className={`crop-handle ${h}`} data-handle={h} onPointerDown={(e) => startCrop(e, h)} />)}
              <span className="crop-note">Drag the edges to crop. Press Esc when done.</span>
            </div>
          </>
        );
      })()}
      {editItem && frame >= editItem.from && frame < end(editItem) && (
        <InlineText item={editItem} doc={shown} k={k} left={left} top={top} onDone={(text) => {
          setEditing(null);
          if (text != null && text !== editItem.text) dispatch({ type: 'commit', doc: updateItem(doc, editItem.id, { text }) });
          p.host.current?.focus({ preventScroll: true });
        }} />
      )}
    </div>
  );
}

// Typing on the frame: the words drawn in their own look, in place, editable. Enter adds a line; Cmd Enter or a click
// outside keeps them; Esc leaves them as they were.
function InlineText({ item, doc, k, left, top, onDone }: { item: Item; doc: Doc; k: number; left: number; top: number; onDone: (text: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current!;
    el.textContent = item.text ?? '';
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);
  // innerText keeps the lines a person typed but also applies capitals from the style, so they are lifted to read it.
  const read = () => { const el = ref.current!; const caps = el.style.textTransform; el.style.textTransform = 'none'; const text = el.innerText ?? ''; el.style.textTransform = caps; return text.replace(/\n$/, ''); };
  const finish = (keep: boolean) => { if (done.current) return; done.current = true; onDone(keep ? read() : null); };
  return (
    <div className="inline-edit" style={{ left, top, width: doc.width, height: doc.height, transform: `scale(${k})` }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...placementCss(item, doc), opacity: item.transform?.opacity ?? 1 }}>
        <div
          ref={ref}
          contentEditable="true"
          suppressContentEditableWarning
          spellCheck={false}
          aria-label="Words"
          data-inline-edit={item.id}
          style={{ ...wordsCss(item.style ?? {}, doc), minWidth: 40, outline: 'none', caretColor: '#EE4A26', cursor: 'text', pointerEvents: 'auto' }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') { e.preventDefault(); finish(false); }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); finish(true); }
          }}
          onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
          onBlur={() => finish(true)}
        />
      </div>
    </div>
  );
}
