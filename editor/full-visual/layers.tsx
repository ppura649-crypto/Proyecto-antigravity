// Full Visual contributes its existing drawing code. Words remain universal caption items; scene code keeps
// its original word cues while the editor moves, cuts or transforms the containing graphic.
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { theme as base, withOverrides } from 'keyframes-engine/full-visual/src/theme';
import { fontsReady } from 'keyframes-engine/full-visual/src/fonts';
import { buildTimeline } from 'keyframes-engine/full-visual/src/engine/timeline';
import { ReelContext } from 'keyframes-engine/full-visual/src/engine/context';
import { Ground } from 'keyframes-engine/full-visual/src/engine/Ground';
import { Stage } from 'keyframes-engine/full-visual/src/engine/Stage';
import { Caption } from 'keyframes-engine/full-visual/src/engine/Caption';
import { Chrome } from 'keyframes-engine/full-visual/src/engine/Chrome';
import { detailCss, EditableContext } from 'keyframes-editable';
import { SceneEdits } from 'keyframes-engine/full-visual/src/engine/Editable';
import { captionFamily, captionStyleControls } from './style.mjs';

type Props = { item: any; doc: any; page?: any; words?: any[]; mode?: 'player' | 'render' };
const empty = { duration: 1, silences: [], scenes: [{ id: 'caption', ground: 'dark', firstWord: 0 }], blocks: [], words: [{ w: '', t: 0, e: 1 }] };

const Ready: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('Full Visual fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; fontsReady.then(() => { if (active) setReady(true); continueRender(handle); }); return () => { active = false; continueRender(handle); }; }, [handle]);
  return ready ? children : null;
};

const Context: React.FC<Props & { children: React.ReactNode }> = ({ item, doc, children }) => {
  const edits = useContext(EditableContext);
  const source = doc.source?.fullVisual;
  const theme = useMemo(() => withOverrides(base, source?.config?.theme), [source]);
  const tl = useMemo(() => buildTimeline(source?.data ?? empty, theme), [source, theme]);
  return <Ready><SceneEdits.Provider value={edits ? (id) => { const edit = edits.item.elements?.[id] ?? {}; return { text: edit.text, src: edit.src ? edits.asset(edit.src) : undefined, css: detailCss(edit, edits.frame) }; } : null}><ReelContext.Provider value={{ theme, tl }}><Sequence from={-(item.data?.clockFrame ?? 0)} layout="none">{children}</Sequence></ReelContext.Provider></SceneEdits.Provider></Ready>;
};

const GroundLayer: React.FC<Props> = (props) => <Context {...props}><Ground /></Context>;
const ChromeLayer: React.FC<Props> = (props) => <Context {...props}><Chrome config={props.item.data?.config} /></Context>;

export function makeSceneLayers(scenes: Record<string, React.FC>, editableScenes: Record<string, any[]> = {}) {
  return Object.fromEntries(Object.entries(scenes).map(([id, Scene]) => [`full-visual/scene-${id}`, {
    label: (item: any) => item.label ?? id,
    elements: editableScenes[id] ?? [],
    draw: (props: Props) => <Context {...props}><Stage scenes={{ [id]: Scene }} /></Context>,
  }]));
}

// Draw the native caption from the universal words and page. Keeping only the active block means edits never
// depend on a word that was deleted from another caption. Original ground transitions remain on their own clock.
export const FullVisualCaption: React.FC<Props> = ({ item, doc, page, words }) => {
  const frame = useCurrentFrame();
  const source = doc.source?.fullVisual;
  const style = item.style ?? {};
  const meta = style.fv ?? {};
  const shown = words ?? item.words ?? [];
  const active = page ?? item.pages?.[0];
  const state = useMemo(() => {
    const theme = withOverrides(base, source?.config?.theme);
    const original = buildTimeline(source?.data ?? empty, theme);
    const caption = { ...theme.caption };
    const font = { ...theme.font };
    if (style.font) font.caption = `${captionFamily(style.font)}, sans-serif`;
    if (Number.isFinite(style.size)) { caption.lineHeight *= style.size / caption.size; caption.size = style.size; }
    if (Number.isFinite(style.maxWidth)) caption.wrap = style.maxWidth * 1080;
    const slot = meta.slot ?? 'top';
    if (Number.isFinite(style.y)) caption[slot] = style.y * doc.height;
    const grounds = Object.fromEntries(Object.entries(theme.grounds).map(([k, g]: [string, any]) => [k, { ...g, ...(style.color ? { spoken: style.color } : {}), ...(style.activeColor ? { ink: style.activeColor } : {}) }]));
    const nextTheme = { ...theme, font, caption, grounds };
    const indices = active?.lines?.flat() ?? shown.map((_: any, i: number) => i);
    const block = { words: indices, slot, scene: 0, index: 0, from: active?.from ?? 0, to: active?.to ?? item.durationInFrames, ...(active?.lines?.length > 1 ? { br: active.lines[1][0] } : {}) };
    const tl = { ...original, words: shown.map((w: any) => ({ w: style.caps ? w.text.toUpperCase() : w.text, t: w.from / doc.fps, e: w.to / doc.fps, f: w.from, fe: w.to, ...w.fv, edit: { id: w.id, css: detailCss(w.edit, frame) } })),
      blocks: meta.last === false ? [block, { ...block, index: 1, from: 1e9, to: 1e9 + 1 }] : [block],
      scenes: original.scenes.map((s: any) => { const offset = item.from - (item.trimStart ?? 0); return { ...s, from: s.from - offset, to: s.to - offset, mid: s.mid - offset }; }),
    };
    return { theme: nextTheme, tl };
  }, [frame, source, style, shown, active, item.from, item.trimStart, item.durationInFrames, doc.fps, doc.height]);
  if (!active || !shown.length) return null;
  return <Ready><ReelContext.Provider value={state as any}><Caption /></ReelContext.Provider></Ready>;
};

const Missing: React.FC<Props> = ({ item, mode }) => {
  if (mode === 'render') throw new Error(`${item.label ?? 'Scene'} needs its Full Visual project code before export.`);
  return <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', font: '600 34px sans-serif' }}>{item.label ?? 'Scene'} needs its project code</AbsoluteFill>;
};
export const layers = {
  'full-visual/ground': { draw: GroundLayer, label: () => 'Background' },
  'full-visual/chrome': { draw: ChromeLayer, label: () => 'Pinned graphic' },
  'full-visual/*': { draw: Missing, label: (item: any) => item.label ?? 'Scene' },
};
export const captionLooks = {
  'full-visual/captions': { label: 'Full Visual', draw: FullVisualCaption, styleControls: captionStyleControls, style: { look: 'full-visual/captions', font: 'Figtree', size: 74, y: 318 / 1920, maxWidth: 740 / 1080, shadow: false, animation: 'word' } },
};
