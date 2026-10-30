// Inside a scene or caption: the same document, selection and undo history, at a smaller scale.
import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { layers } from 'keyframes-layers';
import type { Doc, Item, DetailEdit, ElementDefinition } from './types';
import type { Action, FrameStore } from './store';
import { useFrame } from './store';
import { Section, Row, NumberField, TextArea, ColorField, Toggle, TimeField } from './fields';
import { detailTransform, setDetail, setDetailValue, wordId } from './detail.mjs';
import { editWord, deleteWord, nudgeWord } from './captions.mjs';
import { HEAD } from './timeline-geometry';

type Target = { kind: 'word' | 'element'; id: string };
type Entry = Omit<ElementDefinition, 'kind'> & Target & { elementKind?: ElementDefinition['kind'] };
type Props = { doc: Doc; shown: Doc; selection: string[]; dispatch: React.Dispatch<Action>; frames: FrameStore; seek: (frame: number) => void; pause: () => void; children: React.ReactNode };
type DetailState = Omit<Props, 'children'> & { item?: Item; entries: Entry[]; target: Target | null; open: (id: string, target?: Target) => void; close: () => void; choose: (target: Target, jump?: boolean) => void; change: (patch: DetailEdit, live?: boolean) => void };
const Context = createContext<DetailState>(null!);
export const useDetails = () => useContext(Context);
export const elementsFor = (item: Item): ElementDefinition[] => layers[item.renderer ?? '']?.elements ?? [];
export const canOpen = (item: Item) => item.type === 'caption' || elementsFor(item).length > 0;
export const localFrame = (item: Item, frame: number) => Math.max(0, frame - item.from + (item.trimStart ?? 0));
const editFor = (item: Item, target: Target): DetailEdit => target.kind === 'word' ? item.words?.find((w, i) => wordId(item, i) === target.id)?.edit ?? {} : item.elements?.[target.id] ?? {};
const changedDoc = (doc: Doc, item: Item) => ({ ...doc, items: doc.items.map(i => i.id === item.id ? item : i) });

export function DetailProvider(props: Props) {
  const [scope, setScope] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const item = props.shown.items.find(i => i.id === scope && props.selection.includes(i.id));
  const entries: Entry[] = !item ? [] : item.type === 'caption' ? (item.words ?? []).map((w, i) => ({ id: wordId(item, i), kind: 'word' as const, label: w.text, text: w.text, from: w.from, to: w.to })) as any : elementsFor(item).map(e => ({ ...e, elementKind: e.kind, kind: 'element' as const })) as any;
  useEffect(() => { if (scope && !item) { setScope(null); setTarget(null); } }, [scope, item?.id]);
  useEffect(() => { if (target && !entries.some(e => e.id === target.id)) setTarget(null); }, [item]);
  const choose = (t: Target, jump = false) => {
    setTarget(t); props.pause();
    if (jump && item) { const entry = entries.find(e => e.id === t.id); if (entry?.from != null) props.seek(Math.min(item.from + item.durationInFrames - 1, Math.max(item.from, item.from + entry.from - (item.trimStart ?? 0)))); }
  };
  const open = (id: string, t?: Target) => {
    const i = props.doc.items.find(i => i.id === id);
    if (!i || !canOpen(i)) return;
    props.pause(); props.dispatch({ type: 'select', ids: [id] }); setScope(id); setTarget(t ?? null);
    if (props.frames.get() < i.from || props.frames.get() >= i.from + i.durationInFrames) props.seek(i.from);
  };
  const change = (patch: DetailEdit, live = false) => {
    const original = props.doc.items.find(i => i.id === scope);
    if (!original || !target || !Object.keys(patch).length || props.doc.tracks.find(t => t.id === original.track)?.locked) return;
    const next = setDetail(original, target, patch);
    if (JSON.stringify(next) === JSON.stringify(original)) { props.dispatch({ type: 'draft', doc: null }); return; }
    props.dispatch({ type: live ? 'draft' : 'commit', doc: changedDoc(props.doc, next) });
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!item || !target || e.defaultPrevented || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      e.preventDefault();
      if (props.doc.tracks.find(t => t.id === item.track)?.locked) return;
      const original = props.doc.items.find(i => i.id === item.id)!;
      const next = target.kind === 'word' ? deleteWord(original, original.words!.findIndex((w, i) => wordId(original, i) === target.id)) : setDetail(original, target, { hidden: true });
      props.dispatch({ type: 'commit', doc: target.kind === 'word' && !next.words.length ? { ...props.doc, items: props.doc.items.filter(i => i.id !== item.id) } : changedDoc(props.doc, next) });
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [item, target, props.doc]);
  return <Context.Provider value={{ ...props, item, entries, target, open, choose, close: () => { setScope(null); setTarget(null); }, change }}>{props.children}</Context.Provider>;
}

export function DetailInspector() {
  const d = useDetails();
  const frame = useFrame(d.frames);
  const [motion, setMotion] = useState('x');
  const item = d.item!;
  const target = d.target;
  const entry = d.entries.find(e => e.id === target?.id);
  const edit = target ? editFor(item, target) : {};
  const local = localFrame(item, frame);
  const values = detailTransform(edit, local);
  const locked = Boolean(d.doc.tracks.find(t => t.id === item.track)?.locked);
  const wordIndex = item.words?.findIndex((w, i) => wordId(item, i) === target?.id) ?? -1;
  const word = item.words?.[wordIndex];
  const setWord = (fn: (i: Item) => Item, live = false) => { const original = d.doc.items.find(i => i.id === item.id)!; const next = fn(original); if (live && !next.words?.length) return; if (JSON.stringify(original) === JSON.stringify(next)) { d.dispatch({ type: 'draft', doc: null }); return; } d.dispatch({ type: live ? 'draft' : 'commit', doc: next.words?.length ? changedDoc(d.doc, next) : { ...d.doc, items: d.doc.items.filter(i => i.id !== item.id) } }); };
  const points = edit.keyframes?.[motion] ?? [];
  const text = target?.kind === 'word' ? word?.text : edit.text ?? entry?.text;
  return <>
    <div className="detail-breadcrumb"><button onClick={d.close}>Video</button><span>›</span><strong>{item.label ?? (item.type === 'caption' ? 'Caption' : 'Scene')}</strong></div>
    <Section title={item.type === 'caption' ? 'Words' : 'Components'}>
      <div className={`detail-list ${item.type === 'caption' ? 'words' : ''}`} role="listbox" aria-label={item.type === 'caption' ? 'Caption words' : 'Scene components'}>
        {d.entries.map(e => <button key={e.id} role="option" aria-selected={target?.id === e.id} className={target?.id === e.id ? 'is-on' : ''} style={{ paddingLeft: e.parent ? 24 : undefined }} onClick={() => d.choose(e, true)}>{e.label}</button>)}
      </div>
      {!target && <p className="ins-note">Select {item.type === 'caption' ? 'a word' : 'a component'} here or on the video.</p>}
    </Section>
    {target && entry && <fieldset disabled={locked} className="detail-fields" key={target.id}>
      <Section title={entry.label}>
        {text != null && <TextArea name="Selected text" rows={2} value={text} onChange={(v, live) => target.kind === 'word' ? (live && !v.trim() ? undefined : setWord(i => editWord(i, wordIndex, v), live)) : d.change({ text: v }, live)} />}
        {(text != null || entry.color) && <Row label="Colour"><ColorField name="Selected colour" optional value={edit.color} onChange={(color, live) => d.change({ color }, live)} /></Row>}
        {text != null && <Row label="Size"><NumberField name="Selected size" value={edit.size ?? entry.size ?? item.style?.size ?? 74} min={1} max={1000} onChange={(size, live) => d.change({ size }, live)} /></Row>}
        <Toggle label="Visible" on={!edit.hidden} onChange={on => d.change({ hidden: !on })} />
      </Section>
      <Section title="Position & motion">
        <p className="ins-note">Drag it on the video. Add points below to animate it.</p>
        {(['x', 'y', 'scale', 'rotation', 'opacity'] as const).map(key => <Row key={key} label={{ x: 'Across', y: 'Down', scale: 'Scale', rotation: 'Turn', opacity: 'Opacity' }[key]}>
          <NumberField name={`Selected ${key}`} value={values[key]} min={key === 'scale' ? .01 : key === 'opacity' ? 0 : undefined} max={key === 'opacity' ? 1 : undefined} digits={key === 'scale' || key === 'opacity' ? 2 : 0} step={key === 'scale' || key === 'opacity' ? .01 : 1} onChange={(v, live) => d.change(setDetailValue(edit, key, v, local), live)} />
        </Row>)}
        <Row label="Animate"><select aria-label="Animation property" value={motion} onChange={e => setMotion(e.target.value)}>{Object.entries({ x: 'Across', y: 'Down', scale: 'Scale', rotation: 'Turn', opacity: 'Opacity' }).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Row>
        <button className="btn small" onClick={() => d.change(setDetailValue(edit, motion, values[motion], local, true))}>Add point here</button>
        <div className="detail-points">{points.map((point, index) => <div key={point.frame}>
          <button title="Go to this point" onClick={() => d.seek(item.from + point.frame - (edit.clockOffset ?? 0) - (item.trimStart ?? 0))}>{((point.frame - (edit.clockOffset ?? 0)) / d.doc.fps).toFixed(2)}s</button>
          <NumberField name={`Point ${index + 1} value`} value={point.value} digits={2} min={motion === 'scale' ? .01 : motion === 'opacity' ? 0 : undefined} max={motion === 'opacity' ? 1 : undefined} onChange={(v, live) => d.change({ keyframes: { ...edit.keyframes, [motion]: points.map(p => p === point ? { ...p, value: v } : p) } }, live)} />
          <select aria-label={`Point ${index + 1} easing`} value={point.easing ?? 'linear'} onChange={e => d.change({ keyframes: { ...edit.keyframes, [motion]: points.map(p => p === point ? { ...p, easing: e.target.value } : p) } })}><option value="smooth">Smooth</option><option value="linear">Linear</option></select>
          <button title="Remove point" aria-label={`Remove point ${index + 1}`} onClick={() => d.change({ keyframes: { ...edit.keyframes, [motion]: points.filter(p => p !== point) } })}>×</button>
        </div>)}</div>
      </Section>
      {word && <Section title="Word timing"><Row label="Start"><TimeField name="Word start" value={word.from} fps={d.doc.fps} onChange={v => setWord(i => nudgeWord(i, wordIndex, 'from', v - word.from))} /></Row><Row label="End"><TimeField name="Word end" value={word.to} fps={d.doc.fps} onChange={v => setWord(i => nudgeWord(i, wordIndex, 'to', v - word.to))} /></Row></Section>}
      <Section title="Reset"><button className="btn small" onClick={() => {
        const original = d.doc.items.find(i => i.id === item.id)!;
        const next = target.kind === 'word' ? { ...original, words: original.words!.map((w, i) => wordId(original, i) === target.id ? { ...w, edit: undefined } : w) } : { ...original, elements: Object.fromEntries(Object.entries(original.elements ?? {}).filter(([id]) => id !== target.id)) };
        d.dispatch({ type: 'commit', doc: changedDoc(d.doc, next) });
      }}>Reset appearance</button></Section>
    </fieldset>}
  </>;
}

// The canvas measures the actual child nodes, including the scene's original animation.
export function DetailCanvas({ host }: { host: React.RefObject<HTMLDivElement> }) {
  const d = useDetails();
  const frame = useFrame(d.frames);
  const [boxes, setBoxes] = useState<any[]>([]);
  const gesture = useRef<any>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const read = () => {
      const root = host.current?.querySelector(`[data-item="${CSS.escape(d.item!.id)}"]`);
      const h = host.current?.getBoundingClientRect();
      if (!root || !h) { setBoxes([]); return; }
      const boxes = Array.from(root.querySelectorAll<HTMLElement>('[data-word-id], [data-element-id]')).map(el => {
        const id = el.dataset.wordId ?? el.dataset.elementId;
        if (!d.entries.some(e => e.id === id)) return null;
        const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || r.width < 1 || r.height < 1) return null;
        return { id, kind: el.dataset.wordId ? 'word' : 'element', x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height, el };
      }).filter(Boolean);
      setBoxes(boxes);
    };
    // Player seeks and font readiness can settle after this component's layout effect.
    raf = requestAnimationFrame(() => { read(); raf = requestAnimationFrame(read); });
    const resize = new ResizeObserver(read); if (host.current) resize.observe(host.current);
    const timer = window.setInterval(read, 250);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); clearInterval(timer); };
  }, [d.item, frame]);
  const start = (e: React.PointerEvent, hit: any) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).focus({ preventScroll: true }); d.choose(hit);
    if (d.doc.tracks.find(t => t.id === d.item!.track)?.locked) return;
    const matrix = new DOMMatrix();
    let combined = matrix;
    for (let parent = hit.el.parentElement; parent && parent !== host.current; parent = parent.parentElement) {
      const s = getComputedStyle(parent);
      let own = new DOMMatrix();
      if (s.rotate && s.rotate !== 'none') own = own.rotate(parseFloat(s.rotate));
      if (s.scale && s.scale !== 'none') { const [x, y] = s.scale.split(' ').map(Number); own = own.scale(x, y ?? x); }
      if (s.transform !== 'none') own = own.multiply(new DOMMatrix(s.transform));
      combined = own.multiply(combined);
    }
    const inverse = combined.inverse();
    gesture.current = { x: e.clientX, y: e.clientY, inverse, target: { id: hit.id, kind: hit.kind }, doc: d.doc, item: d.doc.items.find(i => i.id === d.item!.id), frame: localFrame(d.item!, frame), next: null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current; if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.next && Math.hypot(dx, dy) < 3) return;
    const delta = new DOMPoint(dx, dy, 0, 0).matrixTransform(g.inverse);
    const edit = editFor(g.item, g.target), values = detailTransform(edit, g.frame);
    let next = setDetail(g.item, g.target, setDetailValue(edit, 'x', Math.round(values.x + delta.x), g.frame));
    next = setDetail(next, g.target, setDetailValue(editFor(next, g.target), 'y', Math.round(values.y + delta.y), g.frame));
    g.next = changedDoc(g.doc, next); d.dispatch({ type: 'draft', doc: g.next });
  };
  const finish = (cancel = false) => { const g = gesture.current; gesture.current = null; if (g?.next && !cancel) d.dispatch({ type: 'commit', doc: g.next }); else d.dispatch({ type: 'draft', doc: null }); };
  return <div className="detail-canvas" aria-label="Edit inside" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); finish(true); d.close(); } }}>
    {[...boxes].sort((a, b) => b.w * b.h - a.w * a.h).map(b => <div key={b.id} tabIndex={0} role="button" aria-label={`Select ${d.entries.find(e => e.id === b.id)?.label}`} className={`detail-hit ${d.target?.id === b.id ? 'is-on' : ''}`} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} data-detail-hit={b.id} onPointerDown={e => start(e, b)} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); d.choose(b); } }}>{d.target?.id === b.id && <span>{d.entries.find(e => e.id === b.id)?.label}</span>}</div>)}
    <button className="btn small detail-done" onClick={d.close}>Done editing inside</button>
  </div>;
}

export function DetailTimeline({ top, ppf }: { top: number; ppf: number }) {
  const d = useDetails();
  const item = d.item!;
  const isWords = item.type === 'caption';
  const gesture = useRef<any>(null);
  const seekPointer = (e: React.PointerEvent) => { const s = e.currentTarget.closest('.tl-scroll')!; const x = e.clientX - s.getBoundingClientRect().left + s.scrollLeft - HEAD; d.seek(Math.round(x / ppf)); };
  const start = (e: React.PointerEvent, entry: Entry) => {
    e.stopPropagation(); if (e.button !== 0) return; e.preventDefault(); seekPointer(e); d.choose(entry);
    if (!isWords || d.doc.tracks.find(t => t.id === item.track)?.locked) return;
    gesture.current = { x: e.clientX, item: d.doc.items.find(i => i.id === item.id)!, doc: d.doc, index: item.words!.findIndex((w, i) => wordId(item, i) === entry.id), edge: (e.target as HTMLElement).dataset.wordEdge ?? 'both', next: null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current; if (!g) return;
    if (!g.next && Math.abs(e.clientX - g.x) < 3) return;
    g.next = changedDoc(g.doc, nudgeWord(g.item, g.index, g.edge, Math.round((e.clientX - g.x) / ppf)));
    d.dispatch({ type: 'draft', doc: g.next });
  };
  const finish = (cancel = false) => { const g = gesture.current; gesture.current = null; if (g?.next && !cancel) d.dispatch({ type: 'commit', doc: g.next }); else d.dispatch({ type: 'draft', doc: null }); };
  return <div className="detail-timeline" style={{ top, height: 32 + (isWords ? 1 : d.entries.length) * 34 }} onPointerDown={e => { e.stopPropagation(); if (!(e.target as HTMLElement).closest('.detail-track-head')) seekPointer(e); }} onDoubleClick={e => e.stopPropagation()}>
    <div className="detail-timeline-title"><button onClick={d.close}>‹ Video</button><span>{item.label ?? (isWords ? 'Caption' : 'Scene')} · {isWords ? 'words' : 'components'}</span></div>
    {d.entries.map((entry, index) => {
      const edit = editFor(item, entry);
      const from = isWords ? entry.from! : edit.from ?? entry.from ?? item.trimStart ?? 0;
      const to = isWords ? entry.to! : edit.to ?? entry.to ?? (item.trimStart ?? 0) + item.durationInFrames;
      const left = Math.max(item.from, item.from + from - (item.trimStart ?? 0));
      const right = Math.min(item.from + item.durationInFrames, item.from + to - (item.trimStart ?? 0));
      if (right <= left) return null;
      return <div key={entry.id} className="detail-track" style={{ top: 32 + (isWords ? 0 : index * 34) }}>
        {(!isWords || index === 0) && <div className="detail-track-head">{isWords ? 'Words' : entry.label}</div>}
        <div className={`detail-block ${isWords ? 'word' : 'element'} ${d.target?.id === entry.id ? 'is-on' : ''}`} role="button" tabIndex={0} aria-label={`Edit ${entry.label}`} data-detail-block={entry.id} style={{ left: HEAD + left * ppf, width: Math.max(2, (right - left) * ppf) }} onPointerDown={e => start(e, entry)} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); d.choose(entry, true); } }}>
          <span>{entry.label}</span>
          {isWords && <><b data-word-edge="from" className="detail-word-edge start" /><b data-word-edge="to" className="detail-word-edge end" /></>}
          {[...new Set(Object.values(edit.keyframes ?? {}).flatMap(points => points?.map(p => p.frame) ?? []))].map(f => <i className="detail-diamond" key={f} style={{ left: (item.from + f - (edit.clockOffset ?? 0) - (item.trimStart ?? 0) - left) * ppf }} />)}
        </div>
      </div>;
    })}
  </div>;
}
