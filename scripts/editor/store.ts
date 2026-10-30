// The editor's state: the document with its undo history, the selection, and the saving. The playhead lives in its own
// small store, because it changes sixty times a second and nothing but the playhead and the stage should redraw for it.
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import type { Doc } from './types';
import { withWordIds } from './detail.mjs';
import { withAgent } from './agent';

// ---------------------------------------------------------------------------------------------------------------
// The playhead.

type Listener = () => void;
export function createFrameStore(initial = 0) {
  let frame = initial;
  let playing = false;
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => frame,
    playing: () => playing,
    set(next: number) { if (next !== frame) { frame = next; emit(); } },
    setPlaying(next: boolean) { if (next !== playing) { playing = next; emit(); } },
    subscribe(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
export type FrameStore = ReturnType<typeof createFrameStore>;
export const useFrame = (store: FrameStore) => useSyncExternalStore(store.subscribe, store.get);
export const usePlaying = (store: FrameStore) => useSyncExternalStore(store.subscribe, store.playing);

// ---------------------------------------------------------------------------------------------------------------
// The document and its history. A drag shows a draft; letting go commits it as one step. Steps that come in a quick
// run on the same thing (arrow-key nudges, a slider's keyboard steps) merge into one, so one undo takes back the run.

export type EditorState = {
  doc: Doc;
  draft: Doc | null;
  past: Doc[];
  future: Doc[];
  selection: string[];
  dirty: number;
  merge: { key: string; at: number } | null;
};

export type Action =
  | { type: 'commit'; doc: Doc; selection?: string[]; merge?: string }
  | { type: 'draft'; doc: Doc | null }
  | { type: 'select'; ids: string[] }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'replace'; doc: Doc };

const LIMIT = 200;
const MERGE_MS = 900;

export function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'commit': {
      // What only the agent can make is written onto the item as it changes (agent.ts).
      action = { ...action, doc: withWordIds(withAgent(action.doc)) };
      const selection = (action.selection ?? state.selection).filter((id) => action.doc.items.some((i) => i.id === id));
      if (action.doc === state.doc) return { ...state, draft: null, selection };
      const now = Date.now();
      const merging = action.merge && state.merge?.key === action.merge && now - state.merge.at < MERGE_MS && state.past.length;
      return {
        doc: action.doc, draft: null,
        past: merging ? state.past : [...state.past, state.doc].slice(-LIMIT),
        future: [], selection, dirty: state.dirty + 1,
        merge: action.merge ? { key: action.merge, at: now } : null,
      };
    }
    case 'draft':
      return { ...state, draft: action.doc };
    case 'select':
      if (action.ids.length === state.selection.length && action.ids.every((id, i) => id === state.selection[i])) return state;
      return { ...state, selection: action.ids };
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { ...state, doc: previous, draft: null, past: state.past.slice(0, -1), future: [state.doc, ...state.future], selection: state.selection.filter((id) => previous.items.some((i) => i.id === id)), dirty: state.dirty + 1, merge: null };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return { ...state, doc: next, draft: null, past: [...state.past, state.doc], future: state.future.slice(1), selection: state.selection.filter((id) => next.items.some((i) => i.id === id)), dirty: state.dirty + 1, merge: null };
    }
    case 'replace':
      return { doc: withWordIds(action.doc), draft: null, past: [], future: [], selection: [], dirty: 0, merge: null };
  }
}

export const useEditorState = (doc: Doc) => useReducer(reducer, { doc: withWordIds(doc), draft: null, past: [], future: [], selection: [], dirty: 0, merge: null });

// ---------------------------------------------------------------------------------------------------------------
// Talking to the workspace.

const WRITE = { 'content-type': 'application/json', 'x-keyframes-write': 'edit' };
async function answer(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || 'Something went wrong. Try again.'), { status: response.status, body });
  return body;
}
export const api = {
  load: (project: string, fresh = false) => fetch(`/api/edit?project=${encodeURIComponent(project)}${fresh ? '&fresh=1' : ''}`).then(answer),
  save: (project: string, doc: Doc, revision: number) => fetch('/api/edit', { method: 'PUT', headers: WRITE, body: JSON.stringify({ project, doc, revision }) }).then(answer),
  exportRequest: (project: string) => fetch('/api/edit/export', { method: 'POST', headers: WRITE, body: JSON.stringify({ project }) }).then(answer),
  newProject: (body: { name?: string; width?: number; height?: number; fps?: number; from?: string[] }) => fetch('/api/edit/new', { method: 'POST', headers: WRITE, body: JSON.stringify(body) }).then(answer),
  probe: (path: string) => fetch(`/api/edit/probe?path=${encodeURIComponent(path)}`).then(answer),
  upload: (file: File, onProgress?: (share: number) => void) => new Promise<any>((accept, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', `/api/edit/upload?name=${encodeURIComponent(file.name)}`);
    request.setRequestHeader('x-keyframes-write', 'edit');
    request.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    request.onload = () => { let body: any = {}; try { body = JSON.parse(request.responseText); } catch {} request.status < 300 ? accept(body) : reject(new Error(body.error || 'This file could not be added.')); };
    request.onerror = () => reject(new Error('This file could not be added.'));
    request.send(file);
  }),
};

export type SaveState = 'saved' | 'saving' | 'waiting' | 'error' | 'conflict';
export type Saver = { state: SaveState; message?: string; flush: () => Promise<boolean>; keepMine: () => void; setRevision: (r: number) => void };

// Saves a moment after the last change, one save at a time, and keeps the revision the server answered with. A save
// that fails is tried again every few seconds; a save refused because the edit changed elsewhere stops and asks.
export function useAutosave(project: string, doc: Doc, dirty: number, initialRevision: number): Saver {
  const [status, setStatus] = useState<{ state: SaveState; message?: string }>({ state: 'saved' });
  const revision = useRef(initialRevision);
  const timer = useRef<number>();
  const busy = useRef<Promise<void> | null>(null);
  const latest = useRef(doc);
  const savedDoc = useRef<Doc>(doc);
  const conflict = useRef<any>(null);
  latest.current = doc;

  const attempt = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current);
    if (conflict.current) return;
    if (busy.current) { await busy.current; if (latest.current !== savedDoc.current) return attempt(); return; }
    if (latest.current === savedDoc.current) { setStatus({ state: 'saved' }); return; }
    const sent = latest.current;
    setStatus({ state: 'saving' });
    busy.current = (async () => {
      try {
        const result = await api.save(project, sent, revision.current);
        revision.current = result.revision;
        savedDoc.current = sent;
        setStatus({ state: latest.current === sent ? 'saved' : 'waiting' });
      } catch (error: any) {
        if (error.status === 409) { conflict.current = error.body?.current ?? {}; setStatus({ state: 'conflict', message: error.message }); }
        else { setStatus({ state: 'error', message: error.message }); timer.current = window.setTimeout(attempt, 3000); }
      }
    })();
    try { await busy.current; } finally { busy.current = null; }
    if (!conflict.current && latest.current !== savedDoc.current && latest.current !== sent) timer.current = window.setTimeout(attempt, 250);
  }, [project]);

  useEffect(() => {
    if (!dirty || conflict.current) return;
    setStatus((s) => (s.state === 'error' ? s : { state: 'waiting' }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(attempt, 600);
  }, [dirty]);

  // Leaving with changes not yet saved asks first.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (latest.current !== savedDoc.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  return {
    ...status,
    flush: async () => { await attempt(); return latest.current === savedDoc.current && !conflict.current; },
    // Keep this page's edit over the one saved elsewhere: save on top of the newer revision.
    keepMine: () => { const current = conflict.current; conflict.current = null; if (current?.revision) revision.current = current.revision; savedDoc.current = null as any; attempt(); },
    setRevision: (r: number) => { revision.current = r; },
  };
}
