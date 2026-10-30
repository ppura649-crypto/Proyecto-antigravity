// The editor page: the video in the middle, the timeline under it, what is selected on the right, things to add on the
// left. Every change is one step you can undo, and saves itself a moment later. It works the same on a video a format
// made and on a video started from nothing.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { Doc, Item } from './types';
import { createFrameStore, useAutosave, useEditorState, api } from './store';
import { DetailProvider } from './Details';
import { Stage } from './Stage';
import { Timeline } from './Timeline';
import { Inspector } from './Inspector';
import { AddRail, AddPanel, MEDIA_MIME, type AddTab, type MediaEntry, type Upload } from './AddPanel';
import { ExportDialog, ShortcutsSheet } from './Dialogs';
import { Icon } from './icons';
import { presetTransform, type Look } from './looks';
import { wordsFor } from './captions.mjs';
import { fitNew } from './geometry.mjs';
import { copyPayload, pasteItems, pasteStyle, CLIPBOARD_KEY } from './clipboard.mjs';
import { layout, landing, HEAD } from './timeline-geometry';
import { splitItems, deleteItems, duplicateItems, addItem, addTrack, end, itemsAt } from '../edit-doc.mjs';

type Initial = { doc: Doc; media: MediaEntry[]; request?: any; exports?: any[] };
type Where = { point?: { x: number; y: number } | null; frame?: number; track?: string | null; newTrackAt?: number; append?: boolean };

// The track clips are laid end to end on: the lowest picture track, the one just above the sounds.
const mainTrack = (doc: Doc) => [...doc.tracks].reverse().find((t) => t.kind === 'visual') ?? null;

export function Editor({ project, initial }: { project: string; initial: Initial }) {
  const [state, dispatch] = useEditorState(initial.doc);
  const frames = useMemo(() => createFrameStore(0), []);
  const player = useRef<PlayerRef>(null);
  const saver = useAutosave(project, state.doc, state.dirty, initial.doc.revision ?? 1);
  const [ppf, setPpf] = useState(2);
  const ppfRef = useRef(ppf);
  ppfRef.current = ppf;
  const [snapping, setSnapping] = useState(true);
  const [tab, setTab] = useState<AddTab | null>(initial.doc.items.length ? null : 'media');
  const [inspector, setInspector] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [media, setMedia] = useState<MediaEntry[]>(initial.media ?? []);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropHandled = useRef(false);
  const docRef = useRef(state.doc);
  docRef.current = state.doc;
  const shown = state.draft ?? state.doc;
  const blank = state.doc.format === 'edit' || state.doc.source?.reader === 'blank';

  // Read-only view for the browser tests: what the document and selection are right now.
  useEffect(() => { (window as any).__keyframesEditor = { doc: () => docRef.current, shown: () => shown, selection: () => state.selection, frame: () => frames.get(), seek, player: () => player.current }; });

  const say = useCallback((text: string) => { setNotice(text); window.setTimeout(() => setNotice((n) => (n === text ? null : n)), 4000); }, []);

  const seek = useCallback((frame: number) => { const f = Math.max(0, Math.min(frame, docRef.current.durationInFrames - 1)); player.current?.seekTo(f); frames.set(f); }, []);
  const togglePlay = useCallback(() => { setEditing(null); player.current?.toggle(); }, []);
  const split = useCallback(() => {
    const at = frames.get();
    const doc = docRef.current;
    // With nothing selected, a cut goes through everything under the playhead, the way CapCut's split does.
    const ids = state.selection.length ? state.selection : itemsAt(doc, at).map((i: Item) => i.id);
    const result = splitItems(doc, ids, at);
    if (result.created.length) dispatch({ type: 'commit', doc: result.doc, selection: result.created });
  }, [state.selection]);
  const remove = useCallback((ripple: boolean) => { if (state.selection.length) { setCropping(null); setEditing(null); dispatch({ type: 'commit', doc: deleteItems(docRef.current, state.selection, { ripple }), selection: [] }); } }, [state.selection]);
  const duplicate = useCallback(() => { if (!state.selection.length) return; const r = duplicateItems(docRef.current, state.selection); dispatch({ type: 'commit', doc: r.doc, selection: r.created }); }, [state.selection]);

  // Leaving crop or typing when the selection moves on.
  useEffect(() => { if (cropping && !state.selection.includes(cropping)) setCropping(null); if (editing && !state.selection.includes(editing)) setEditing(null); }, [state.selection]);

  // ---------------------------------------------------------------------------------------------------------
  // Adding things.

  const itemFor = async (entry: MediaEntry, doc: Doc): Promise<Partial<Item> | null> => {
    const base = { src: entry.path, label: entry.name.replace(/\.[a-z0-9]+$/i, '') };
    if (entry.kind === 'image') {
      const size = await new Promise<{ w: number; h: number } | null>((ok) => { const i = new Image(); i.onload = () => ok({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => ok(null); i.src = entry.url; });
      return { ...base, type: 'image', durationInFrames: doc.fps * 3, size: fitNew('image', size, doc), fit: 'contain' };
    }
    const info = await api.probe(entry.path).catch(() => null);
    if (!info?.duration) { say(`${entry.name} could not be read.`); return null; }
    const frames = Math.max(1, Math.round(info.duration * doc.fps));
    if (entry.kind === 'audio') return { ...base, type: 'audio', durationInFrames: frames, sourceDurationInFrames: frames, volume: 1 };
    const size = fitNew('video', info.width ? { w: info.width, h: info.height } : null, doc);
    const fills = size.w === doc.width && size.h === doc.height;
    return { ...base, type: 'video', durationInFrames: frames, sourceDurationInFrames: frames, volume: info.audio ? 1 : 0, ...(fills ? {} : { size }) };
  };

  const addMedia = useCallback(async (entries: MediaEntry[], where: Where = {}) => {
    let doc = docRef.current;
    const created: string[] = [];
    const main = mainTrack(doc);
    const mainEmpty = !main || !doc.items.some((i) => i.track === main.id);
    for (const entry of entries) {
      const made = await itemFor(entry, doc);
      if (!made) continue;
      let track: string | null = where.track ?? null;
      let at = where.frame ?? frames.get();
      // Clips go end to end on the main track when it is empty or when they are dropped there.
      const appending = made.type === 'video' && (where.append || (mainEmpty && where.track == null)) && main;
      if (appending) { track = main!.id; at = doc.items.filter((i) => i.track === main!.id).reduce((m, i) => Math.max(m, end(i)), 0); }
      else if (where.newTrackAt != null) { const t = addTrack(doc, made.type === 'audio' ? 'audio' : 'visual', { at: where.newTrackAt, type: made.type }); doc = t.doc; track = t.id; }
      if (where.point && made.type !== 'audio' && !appending) made.transform = { x: Math.round(where.point.x - doc.width / 2), y: Math.round(where.point.y - doc.height / 2), scale: 1, rotation: 0, opacity: 1 };
      const result = addItem(doc, made, { track, at });
      doc = result.doc;
      created.push(result.id);
    }
    if (created.length) dispatch({ type: 'commit', doc, selection: created });
  }, []);

  const addText = useCallback((look: Look) => {
    const doc = docRef.current;
    const r = addItem(doc, { type: 'text', text: look.text ?? 'Your words', style: { ...look.style }, durationInFrames: doc.fps * 3, transform: presetTransform(look, doc.height), label: look.label }, { at: frames.get() });
    dispatch({ type: 'commit', doc: r.doc, selection: [r.id] });
  }, []);

  const addCaption = useCallback((look: Look) => {
    const doc = docRef.current;
    const length = doc.fps * 3;
    const r = addItem(doc, { type: 'caption', words: wordsFor('Type your words here', length), style: { ...look.style }, durationInFrames: length, label: 'Captions' }, { at: frames.get() });
    dispatch({ type: 'commit', doc: r.doc, selection: [r.id] });
    setFocus({ id: r.id, n: Date.now() });
  }, []);

  // Files from the computer: sent one by one with progress, then added in the order they were dropped.
  const sendFiles = useCallback(async (files: File[], where: Where = {}) => {
    if (!files.length) return;
    setTab('upload');
    const jobs = files.map((file, n) => ({ file, id: `${Date.now()}-${n}` }));
    setUploads((u) => [...jobs.map((j) => ({ id: j.id, name: j.file.name, share: 0, state: 'sending' as const })), ...u].slice(0, 30));
    const done: MediaEntry[] = [];
    for (const job of jobs) {
      try {
        const entry = await api.upload(job.file, (share) => setUploads((u) => u.map((x) => (x.id === job.id ? { ...x, share } : x))));
        setUploads((u) => u.map((x) => (x.id === job.id ? { ...x, share: 1, state: 'done' } : x)));
        done.push(entry);
        setMedia((m) => [entry, ...m.filter((x) => x.path !== entry.path)]);
      } catch (error: any) {
        setUploads((u) => u.map((x) => (x.id === job.id ? { ...x, state: 'error', message: error.message } : x)));
      }
    }
    if (done.length) await addMedia(done, where);
  }, [addMedia]);

  // Where a drop on the timeline lands: the time under the pointer, and the track under it or a new one.
  const timelineWhere = (e: React.DragEvent | DragEvent, kind: 'visual' | 'audio'): Where => {
    const scroller = document.querySelector<HTMLElement>('.tl-scroll');
    if (!scroller) return {};
    const r = scroller.getBoundingClientRect();
    const frame = Math.max(0, Math.round((e.clientX - r.left + scroller.scrollLeft - HEAD) / ppfRef.current));
    const laid: any = layout(docRef.current);
    const land = landing(laid.rows ?? laid, e.clientY - r.top + scroller.scrollTop, kind) as any;
    const main = mainTrack(docRef.current);
    if (land.track) return { frame, track: land.track, append: kind === 'visual' && land.track === main?.id && !docRef.current.items.some((i) => i.track === main?.id && end(i) > frame) };
    return { frame, newTrackAt: land.newAt };
  };

  const dropped = (e: React.DragEvent | DragEvent) => {
    const raw = e.dataTransfer?.getData(MEDIA_MIME);
    const entries: MediaEntry[] = raw ? JSON.parse(raw) : [];
    const files = Array.from(e.dataTransfer?.files ?? []);
    return { entries, files };
  };

  const onStageDrop = (e: React.DragEvent, point: { x: number; y: number } | null) => {
    e.preventDefault();
    dropHandled.current = true;
    setDragging(false);
    const { entries, files } = dropped(e);
    const where: Where = { point, append: !docRef.current.items.some((i) => i.type !== 'audio') };
    if (entries.length) addMedia(entries, where);
    else if (files.length) sendFiles(files, where);
  };

  // A drop over the timeline lands at the time and on the track under the pointer.
  const overTimeline = (e: DragEvent) => { const r = document.querySelector('.tl')?.getBoundingClientRect(); return Boolean(r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom); };
  const onTimelineDrop = (e: DragEvent) => {
    const { entries, files } = dropped(e);
    const kind = entries[0]?.kind === 'audio' || (!entries.length && files[0]?.type.startsWith('audio')) ? 'audio' : 'visual';
    const where = timelineWhere(e, kind);
    if (entries.length) addMedia(entries, where);
    else if (files.length) sendFiles(files, where);
  };

  // Files dropped anywhere else on the page still come in.
  useEffect(() => {
    const over = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files') || e.dataTransfer?.types.includes(MEDIA_MIME)) { e.preventDefault(); setDragging(true); } };
    const leave = (e: DragEvent) => { if (!e.relatedTarget) setDragging(false); };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (dropHandled.current) { dropHandled.current = false; return; }
      if (overTimeline(e)) { onTimelineDrop(e); return; }
      const { entries, files } = dropped(e);
      if (entries.length) addMedia(entries);
      else if (files.length) sendFiles(files);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('dragleave', leave); window.removeEventListener('drop', drop); };
  }, [addMedia, sendFiles]);

  // ---------------------------------------------------------------------------------------------------------
  // Copy, cut and paste. The copy lives in this browser's storage, so it pastes into another video too; when storage
  // is off it lives for this page only.
  const memory = useRef<any>(null);
  const writeClip = (payload: any) => { memory.current = payload; try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload)); } catch {} };
  const readClip = () => { try { const raw = localStorage.getItem(CLIPBOARD_KEY); if (raw) return JSON.parse(raw); } catch {} return memory.current; };
  const copy = useCallback((cut = false) => {
    const doc = docRef.current;
    const payload = copyPayload(doc, state.selection);
    if (!payload) return;
    writeClip(payload);
    if (cut) dispatch({ type: 'commit', doc: deleteItems(doc, state.selection), selection: [] });
    say(`${cut ? 'Cut' : 'Copied'} ${payload.items.length} ${payload.items.length === 1 ? 'item' : 'items'}.`);
  }, [state.selection]);
  const paste = useCallback(() => {
    const payload = readClip();
    if (!payload?.items?.length) { say('Nothing copied yet.'); return; }
    const r = pasteItems(docRef.current, payload, frames.get());
    if (r.created.length) dispatch({ type: 'commit', doc: r.doc, selection: r.created });
  }, []);
  const pasteLook = useCallback(() => {
    const payload = readClip();
    if (!payload?.items?.length || !state.selection.length) return;
    const r = pasteStyle(docRef.current, payload, state.selection);
    if (r.changed.length) dispatch({ type: 'commit', doc: r.doc });
    else say('That style does not fit what is selected.');
  }, [state.selection]);

  // Keys. The stage and the fields handle their own first; what is left is the editor's.

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]')) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (mod && k === 'z') { e.preventDefault(); dispatch({ type: e.shiftKey ? 'redo' : 'undo' }); }
      else if (mod && k === 'y') { e.preventDefault(); dispatch({ type: 'redo' }); }
      else if (mod && k === 's') { e.preventDefault(); saver.flush(); }
      else if (mod && k === 'c') { e.preventDefault(); copy(false); }
      else if (mod && k === 'x') { e.preventDefault(); copy(true); }
      else if (mod && e.altKey && (k === 'v' || e.code === 'KeyV')) { e.preventDefault(); pasteLook(); }
      else if (mod && k === 'v') { e.preventDefault(); paste(); }
      else if (mod && k === 'd') { e.preventDefault(); duplicate(); }
      else if (mod && k === 'a') { e.preventDefault(); dispatch({ type: 'select', ids: docRef.current.items.map((i) => i.id) }); }
      else if ((mod && k === 'b') || (!mod && k === 's')) { e.preventDefault(); split(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(e.shiftKey); }
      else if (e.key === 'Escape') { setCropping(null); setEditing(null); setSheet(false); dispatch({ type: 'select', ids: [] }); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); seek(frames.get() + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? docRef.current.fps : 1)); }
      else if (e.key === 'Home') seek(0);
      else if (e.key === 'End') seek(docRef.current.durationInFrames - 1);
      else if (!mod && k === 'n') setSnapping((s) => !s);
      else if (e.key === '?') { e.preventDefault(); setSheet((s) => !s); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [togglePlay, split, remove, duplicate, seek, saver.flush, copy, paste, pasteLook]);

  const startOver = useCallback(async () => {
    try {
      const fresh = await api.load(project, true);
      saver.setRevision(fresh.doc.revision ?? 1);
      dispatch({ type: 'commit', doc: fresh.doc, selection: [] });
      say('Back to your agent\'s version. Undo brings your edit back.');
    } catch (error: any) { say(error.message); }
  }, [project]);

  const reload = async () => {
    try { const fresh = await api.load(project); saver.setRevision(fresh.doc.revision ?? 1); dispatch({ type: 'replace', doc: fresh.doc }); location.reload(); } catch { location.reload(); }
  };

  const saveText = { saved: 'Saved', saving: 'Saving', waiting: 'Saving', error: 'Not saved yet', conflict: 'Changed elsewhere' }[saver.state];
  // A project with several versions (Trial Reels): each version is its own edit, opened at /edit/<project>@<version>.
  const base = project.split('@')[0];
  const backHref = blank ? '/' : `/projects/${encodeURIComponent(base)}`;
  const variants = (state.doc as any).variants as { id: string; label: string }[] | undefined;

  return (
    <div className={`editor ${dragging ? 'is-dragging' : ''}`}>
      <header className="ed-top">
        <a className="ed-back" href={backHref} title={blank ? 'Back to your workspace' : 'Back to the video'} aria-label="Back"><Icon name="back" /></a>
        <h1 title={state.doc.name ?? project}>{state.doc.name ?? project}</h1>
        {variants && variants.length > 1 && (
          <select className="ed-version" aria-label="Version" value={(state.doc as any).variant} onChange={(e) => { window.location.href = `/edit/${base}@${e.target.value}`; }}>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        )}
        <span className={`ed-save ${saver.state}`} title={saver.message} role="status" data-save={saver.state}>{saveText}</span>
        <div className="ed-actions">
          <button className="tool" onClick={() => dispatch({ type: 'undo' })} disabled={!state.past.length} title="Undo (Cmd Z)" aria-label="Undo"><Icon name="undo" /></button>
          <button className="tool" onClick={() => dispatch({ type: 'redo' })} disabled={!state.future.length} title="Redo (Shift Cmd Z)" aria-label="Redo"><Icon name="redo" /></button>
          <span className="ed-sep" />
          <button className="tool" onClick={() => setSheet(true)} title="Keys (?)" aria-label="Keys"><Icon name="keyboard" /></button>
          <button className="btn primary" onClick={() => setExporting(true)} data-export><Icon name="export" size={16} />Export</button>
        </div>
      </header>
      {saver.state === 'conflict' && (
        <div className="banner warn" role="alert">
          <Icon name="warn" size={16} />
          <span>This edit changed somewhere else.</span>
          <button className="btn small" onClick={reload}>Reload</button>
          <button className="btn small" onClick={saver.keepMine}>Keep mine</button>
        </div>
      )}
      {saver.state === 'error' && (
        <div className="banner" role="status"><Icon name="warn" size={16} /><span>Not saved yet. Trying again. {saver.message}</span></div>
      )}
      <DetailProvider doc={state.doc} shown={shown} selection={state.selection} dispatch={dispatch} frames={frames} seek={seek} pause={() => player.current?.pause()}>
      <div className={`ed-middle ${tab ? 'has-add' : ''} ${inspector ? 'has-inspector' : ''}`}>
        <AddRail tab={tab} setTab={setTab} />
        <AddPanel tab={tab} setTab={setTab} media={media} uploads={uploads} onAddMedia={(entries) => addMedia(entries)} onAddText={addText} onAddCaption={addCaption} onFiles={(files) => sendFiles(files)} />
        <Stage
          doc={state.doc} shown={shown} selection={state.selection} dispatch={dispatch} frames={frames} player={player}
          editing={editing} setEditing={setEditing} cropping={cropping} setCropping={setCropping}
          onFocusField={(id) => { setInspector(true); setFocus({ id, n: Date.now() }); }}
          onEmptyAdd={() => setTab('media')}
          onDropHere={onStageDrop}
        />
        {inspector ? (
          <Inspector
            doc={state.doc} shown={shown} selection={state.selection} dispatch={dispatch} frames={frames} seek={seek}
            split={split} duplicate={duplicate} remove={remove} media={media}
            cropping={cropping} setCropping={setCropping} setEditing={setEditing} focus={focus}
            onStartOver={blank ? null : startOver} onShortcuts={() => setSheet(true)} collapse={() => setInspector(false)}
          />
        ) : (
          <button className="ins-open tool" onClick={() => setInspector(true)} title="Show the panel" aria-label="Show the panel"><Icon name="panelRight" /></button>
        )}
      </div>
      <Timeline doc={state.doc} shown={shown} selection={state.selection} dispatch={dispatch} frames={frames} seek={seek} togglePlay={togglePlay} split={split} remove={remove} duplicate={duplicate} ppf={ppf} setPpf={setPpf} snapping={snapping} setSnapping={setSnapping} />
      </DetailProvider>
      {!state.doc.items.length && <div className="tl-empty"><Icon name="media" size={18} />Drop clips here. They line up in the order you drop them.</div>}
      {dragging && <div className="drop-veil" aria-hidden="true"><span>Drop to add</span></div>}
      {notice && <div className="toast" role="status">{notice}</div>}
      {exporting && <ExportDialog project={project} doc={state.doc} flush={saver.flush} onClose={() => setExporting(false)} />}
      {sheet && <ShortcutsSheet onClose={() => setSheet(false)} />}
      <div className="phone-note">
        <Icon name="video" size={28} />
        <h1>Open this on a computer</h1>
        <p>The editor needs a bigger screen and a mouse.</p>
        <a className="btn" href={backHref}>Back</a>
      </div>
    </div>
  );
}
