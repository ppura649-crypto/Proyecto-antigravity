// The two windows the editor opens: Export, which saves, records the request and gives the words to paste to the agent,
// and the sheet of keys.
import React, { useEffect, useRef, useState } from 'react';
import type { Doc } from './types';
import { api } from './store';
import { Icon } from './icons';
import { checkDoc, timecode } from '../edit-doc.mjs';

function Modal({ label, onClose, children, wide }: { label: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', key, true);
    box.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => window.removeEventListener('keydown', key, true);
  }, []);
  return (
    <div className="ed-modal" role="dialog" aria-modal="true" aria-label={label} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`ed-dialog ${wide ? 'wide' : ''}`} ref={box}>{children}</div>
    </div>
  );
}

export function ExportDialog({ project, doc, flush, onClose }: { project: string; doc: Doc; flush: () => Promise<boolean>; onClose: () => void }) {
  const [step, setStep] = useState<'saving' | 'ready' | 'error'>('saving');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    (async () => {
      const problems = checkDoc(doc);
      if (problems.length) { setError(problems[0]); setStep('error'); return; }
      const saved = await flush();
      if (!saved) { setError('Your edit is not saved yet. Try again in a moment.'); setStep('error'); return; }
      try { const r = await api.exportRequest(project); setPrompt(r.prompt); setStep('ready'); }
      catch (e: any) { setError(e.message); setStep('error'); }
    })();
  }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); } catch {
      const area = document.querySelector<HTMLElement>('.prompt-box');
      if (area) { const range = document.createRange(); range.selectNodeContents(area); const s = getSelection(); s?.removeAllRanges(); s?.addRange(range); document.execCommand('copy'); }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal label="Export" onClose={onClose}>
      <h2>Export this edit</h2>
      {step === 'saving' && <p className="with-spin"><i className="spin" />Saving your edit</p>}
      {step === 'error' && <p className="error" role="alert">{error}</p>}
      {step === 'ready' && (
        <>
          <p>Your agent renders it, checks it and puts it with your videos. Paste this in the chat:</p>
          <pre className="prompt-box" data-prompt>{prompt}</pre>
          <p className="helper mono">{doc.width} × {doc.height}, {timecode(doc.durationInFrames, doc.fps)} long</p>
        </>
      )}
      <div className="ed-dialog-row">
        {step === 'ready' && <button className="btn primary" onClick={copy} data-autofocus data-copy>{copied ? <><Icon name="check" size={16} />Copied</> : <><Icon name="copy" size={16} />Copy</>}</button>}
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

const KEYS: [string, [string, string][]][] = [
  ['Play', [['Space', 'Play or pause'], ['Left, Right', 'One frame back or on'], ['Shift Left, Right', 'One second'], ['Home, End', 'Start or end']]],
  ['Edit', [['S or Cmd B', 'Split at the playhead'], ['Delete', 'Delete'], ['Shift Delete', 'Delete and close the gap'], ['Cmd C, Cmd X, Cmd V', 'Copy, cut, paste at the playhead'], ['Cmd Alt V', 'Paste the look onto the selection'], ['Cmd D', 'Duplicate'], ['Cmd A', 'Select all'], ['Cmd Z', 'Undo'], ['Shift Cmd Z', 'Redo'], ['Cmd S', 'Save now'], ['N', 'Snapping on or off']]],
  ['On the video', [['Click', 'Select'], ['Shift click', 'Add to the selection'], ['Drag on empty space', 'Select with a box'], ['Alt click', 'Just this one, not its linked partners'], ['Double click', 'Type words, or crop a picture'], ['Arrows', 'Move 1 px (Shift 10 px)'], ['Shift drag', 'Move in one direction'], ['Alt drag', 'Move without snapping'], ['Alt corner', 'Size from the middle'], ['Shift corner', 'Size freely (pictures, clips)'], ['Shift turn', 'Turn in steps of 15'], ['Cmd +, Cmd -, Cmd 0', 'Zoom in, out, fit'], ['Cmd scroll', 'Zoom']]],
];

export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Keys" onClose={onClose} wide>
      <h2>Keys</h2>
      <div className="sheet">
        {KEYS.map(([title, list]) => (
          <section key={title}>
            <h3>{title}</h3>
            <dl>{list.map(([k, v]) => <div key={k}><dt>{k.split(', ').map((part, i) => <React.Fragment key={i}>{i ? ', ' : ''}{part.split(' ').map((w, j) => <kbd key={j}>{w}</kbd>)}</React.Fragment>)}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        ))}
      </div>
      <div className="ed-dialog-row"><button className="btn" onClick={onClose} data-autofocus>Close</button></div>
    </Modal>
  );
}
