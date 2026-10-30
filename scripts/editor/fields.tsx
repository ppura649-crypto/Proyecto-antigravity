// The controls the inspector is built from. Each one shows a change live while the hand is still on it and keeps it as
// one undo step when the hand lets go, so a slider dragged across its whole range is still one undo.
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { parseTime } from './geometry.mjs';
import { timecode } from '../edit-doc.mjs';

export type Change = (value: any, live?: boolean) => void;

export const Section: React.FC<{ title: string; children: React.ReactNode; aside?: React.ReactNode }> = ({ title, children, aside }) => (
  <section className="ins-section">
    <header><h3>{title}</h3>{aside}</header>
    {children}
  </section>
);

export const Row: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
  <div className={`ins-row ${wide ? 'wide' : ''}`}><span className="ins-label">{label}</span><div className="ins-control">{children}</div></div>
);

// A number you can type, step with the arrow keys (Shift for ten), or scrub by dragging its label sideways.
export function NumberField({ label, value, onChange, min = -Infinity, max = Infinity, step = 1, unit = '', digits = 0, scale = 1, name }: {
  label?: string; value: number; onChange: Change; min?: number; max?: number; step?: number; unit?: string; digits?: number; scale?: number; name?: string;
}) {
  const shown = (v: number) => (v * scale).toFixed(digits).replace(/\.0+$/, '');
  const [text, setText] = useState(shown(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(shown(value)); }, [value, focused]);
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const commit = () => { const v = Number(text.replace(/[^0-9.+-]/g, '')) / scale; if (Number.isFinite(v)) onChange(clamp(v)); else setText(shown(value)); };
  const scrub = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX, v0 = value;
    let last = v0;
    const move = (m: PointerEvent) => { last = clamp(Math.round((v0 + ((m.clientX - x0) * step) / 2 / (m.shiftKey ? 0.1 : 1)) / step) * step); onChange(last, true); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); onChange(last); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <label className="num">
      {label && <span className="num-label" onPointerDown={scrub} title="Drag to change">{label}</span>}
      <input
        name={name}
        value={focused ? text : `${shown(value)}${unit}`}
        inputMode="decimal"
        onFocus={(e) => { setFocused(true); setText(shown(value)); requestAnimationFrame(() => e.target.select()); }}
        onBlur={() => { setFocused(false); commit(); }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'Escape') { setText(shown(value)); setFocused(false); (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const v = clamp(value + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
            setText(shown(v));
            onChange(v);
          }
        }}
      />
    </label>
  );
}

// A slider with its value beside it. Live while dragging, one step when let go.
export function Slider({ value, onChange, min, max, step = 0.01, format, name }: { value: number; onChange: Change; min: number; max: number; step?: number; format: (v: number) => string; name?: string }) {
  const live = useRef<number | null>(null);
  const end = () => { if (live.current != null) { const v = live.current; live.current = null; onChange(v); } };
  return (
    <div className="slider">
      <input
        type="range" name={name} min={min} max={max} step={step} value={value}
        style={{ ['--fill' as any]: `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => { live.current = Number(e.target.value); onChange(live.current, true); }}
        onPointerUp={end} onKeyUp={end} onBlur={end}
      />
      <output>{format(value)}</output>
    </div>
  );
}

export function Segmented<T extends string | number | boolean>({ value, options, onChange, name }: { value: T; options: { value: T; label: React.ReactNode; title?: string }[]; onChange: (v: T) => void; name?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value} className={o.value === value ? 'is-on' : ''} title={o.title} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export const SWATCHES = ['#FFFFFF', '#111111', '#FFE14D', '#EE4A26', '#36B38A', '#4D8DFF', '#F6FA87', '#FF6FB5'];

// A few colours at a touch, any colour with the picker, and none when the colour is optional.
export function ColorField({ value, onChange, optional = false, name }: { value?: string; onChange: Change; optional?: boolean; name?: string }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : '#ffffff';
  return (
    <div className="colors" role="group" aria-label={name}>
      {optional && <button className={`swatch none ${!value ? 'is-on' : ''}`} title="None" aria-label="None" onClick={() => onChange(undefined)} />}
      {SWATCHES.map((c) => <button key={c} className={`swatch ${value?.toUpperCase() === c ? 'is-on' : ''}`} style={{ background: c }} title={c} aria-label={c} onClick={() => onChange(c)} />)}
      <label className={`swatch custom ${value && !SWATCHES.includes(value.toUpperCase()) ? 'is-on' : ''}`} title="Any colour" style={value && !SWATCHES.includes(value.toUpperCase()) ? { background: value } : undefined}>
        <input type="color" value={hex} name={name} onInput={(e) => onChange((e.target as HTMLInputElement).value, true)} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export const Toggle: React.FC<{ on: boolean; onChange: (on: boolean) => void; label: string; name?: string }> = ({ on, onChange, label, name }) => (
  <button className={`toggle ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} name={name} onClick={() => onChange(!on)}><i />{label}</button>
);

// Time as the editor shows it (0:04.12), typed as that, as seconds, or as frames.
export function TimeField({ value, fps, onChange, name, min = 0 }: { value: number; fps: number; onChange: (frame: number) => void; name?: string; min?: number }) {
  const [text, setText] = useState(timecode(value, fps));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(timecode(value, fps)); }, [value, focused, fps]);
  const commit = () => { const f = parseTime(text, fps); if (f != null && f >= min) onChange(f); else setText(timecode(value, fps)); };
  return (
    <input
      className="time" name={name} value={text} title="Type 0:04.12, 4.5s or 120f"
      onFocus={(e) => { setFocused(true); requestAnimationFrame(() => e.target.select()); }}
      onBlur={() => { setFocused(false); commit(); }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const f = Math.max(min, value + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? fps : 1)); onChange(f); }
      }}
    />
  );
}

// Words typed in a box: shown live on the frame, kept as one step when the box is left.
export function TextArea({ value, onChange, name, rows = 3, placeholder }: { value: string; onChange: Change; name?: string; rows?: number; placeholder?: string }) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(value); }, [value, focused]);
  return (
    <textarea
      name={name} rows={rows} value={text} placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={(e) => { setText(e.target.value); onChange(e.target.value, true); }}
      onBlur={() => { setFocused(false); onChange(text); }}
      onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur(); }}
    />
  );
}

export const IconButton: React.FC<{ icon: string; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }> = ({ icon, label, onClick, disabled, danger }) => (
  <button className={`btn small ${danger ? 'danger' : ''}`} onClick={onClick} disabled={disabled}><Icon name={icon} size={15} />{label}</button>
);
