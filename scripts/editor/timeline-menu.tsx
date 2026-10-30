// The right click menu of the timeline: what can be done to the clip, the gap or the track under the pointer. It
// opens where you clicked, stays on screen, answers the arrow keys, and closes on Escape or a click elsewhere.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type MenuEntry = { label: string; keys?: string; disabled?: boolean; danger?: boolean; run: () => void } | 'line';
export type MenuState = { x: number; y: number; entries: MenuEntry[] } | null;

export function ContextMenu({ menu, close }: { menu: NonNullable<MenuState>; close: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ x: menu.x, y: menu.y });
  useLayoutEffect(() => {
    const r = box.current!.getBoundingClientRect();
    setAt({ x: Math.max(4, Math.min(menu.x, window.innerWidth - r.width - 4)), y: Math.max(4, Math.min(menu.y, window.innerHeight - r.height - 4)) });
    (box.current!.querySelector('button:not(:disabled)') as HTMLElement | null)?.focus();
  }, [menu]);
  useEffect(() => {
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      e.stopPropagation();
      const buttons = [...box.current!.querySelectorAll('button:not(:disabled)')] as HTMLElement[];
      const i = buttons.indexOf(document.activeElement as HTMLElement);
      buttons[(i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    };
    window.addEventListener('pointerdown', away, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('pointerdown', away, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
    };
  }, [close]);
  return (
    <div className="tl-menu" ref={box} role="menu" style={{ left: at.x, top: at.y }} onContextMenu={(e) => e.preventDefault()}>
      {menu.entries.map((entry, i) => entry === 'line'
        ? <hr key={i} />
        : (
          <button key={i} role="menuitem" disabled={entry.disabled} className={entry.danger ? 'danger' : ''} onClick={() => { close(); entry.run(); }}>
            <span>{entry.label}</span>
            {entry.keys && <kbd>{entry.keys}</kbd>}
          </button>
        ))}
    </div>
  );
}
