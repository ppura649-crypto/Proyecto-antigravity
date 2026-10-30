// layers.tsx: how Talking Head looks in the editor. The format contributes looks, not an editor:
//   captionLooks  a page of universal caption words drawn exactly as the format's CaptionReel draws its pages
//                 (the hook stack, the hero with its tail, the one word line, the hero word)
//   textLooks     the title that sits on top during the first hook sentence (HookTitle)
//   layers        the cards and hook visuals, drawn by the format's own Overlay, words inside exposed as fields
// Every component draws on the item's own clock. The engine is imported, never copied, so the editor shows what the
// format renders.
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { fitText } from '@remotion/layout-utils';
// Importing CaptionReel also loads the format's fonts (Sora, Zen Dots, Michroma, Inter, Nunito, Playfair, Kode Mono).
import { CaptionReel } from 'keyframes-engine/talking-head/remotion/src/CaptionReel';
import { Overlay } from 'keyframes-engine/talking-head/remotion/src/Overlay';
import { HookTitle } from 'keyframes-engine/talking-head/remotion/src/HookTitle';
import { SoftOverlay } from 'keyframes-engine/talking-head/remotion/src/soft/SoftOverlay';
import { detailCss } from 'keyframes-editable';
import { styleOf } from 'keyframes-engine/talking-head/remotion/src/styles';

void CaptionReel;

type Word = { id?: string; edit?: any; text: string; from: number; to: number; th?: any };
type Page = { from: number; to: number; lines: number[][]; th?: any };
type AnyItem = { id: string; type: string; from: number; durationInFrames: number; trimStart?: number; label?: string; words?: Word[]; pages?: Page[]; style?: any; text?: string; data?: any; renderer?: string };
type Props = { item: AnyItem; doc: { fps: number; width: number; height: number }; asset?: (path: string) => string; mode?: 'player' | 'render'; frame?: number };
type Field = { key: string; label: string; kind: 'text' | 'longtext' | 'number' | 'color' | 'choice'; choices?: { value: string; label: string }[]; read: (item: any) => any; write: (item: any, value: any) => any };

// Measuring a word before its face has arrived gives the fallback's width; draw again once the fonts are in.
function useFontsReady() {
  const [, bump] = useState(0);
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    let alive = true;
    const again = () => alive && bump((n) => n + 1);
    document.fonts.ready.then(again);
    document.fonts.addEventListener?.('loadingdone', again);
    return () => { alive = false; document.fonts.removeEventListener?.('loadingdone', again); };
  }, []);
}

// ---------------------------------------------------------------------------------------------------------------
// Captions.

// The format's defaults, for a caption that comes from another format and is switched to this look.
const CREATOR_1 = {
  fontFamily: 'Sora, sans-serif', accentFontFamily: 'Sora, sans-serif', fontWeight: 700, fontSizePx: 62, letterSpacingEm: 0.005,
  fillColor: '#FFFFFF', emphasisColor: '#E07850', textShadow: '0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)',
  baselineYFrac: 0.615, baselineEm: 0.8695, maxWidthFrac: 0.77, heroWidthFrac: 0.66, heroMaxFontPx: 200, refWidth: 1080, stackTopFrac: 0.64,
};
const first = (css: string) => String(css ?? '').split(',')[0].trim().replace(/^["']|["']$/g, '');
const SHADOW_OFF = 'none';
// The editor's own faces go by an id (its font picker writes 'sora', 'inter'); anything else is a family name.
const EDITOR_FONTS: Record<string, string> = { inter: 'Inter', poppins: 'Poppins', sora: 'Sora', montserrat: 'Montserrat', anton: 'Anton', bebas: 'Bebas Neue', oswald: 'Oswald', playfair: 'Playfair Display', dmserif: 'DM Serif Display', marker: 'Permanent Marker' };
const familyOf = (font: string) => EDITOR_FONTS[font] ?? font;
const sameFace = (a: string, b: string) => familyOf(a).toLowerCase() === familyOf(b).toLowerCase();

// The format's own style, with whatever the buyer changed through the universal fields laid over it.
export function resolveStyle(style: any = {}) {
  const th = { ...CREATOR_1, ...(style.th ?? {}) };
  const st: any = { ...th };
  if (style.font && !sameFace(style.font, first(th.fontFamily))) {
    const stack = `"${familyOf(style.font)}", sans-serif`;
    st.fontFamily = stack;
    st.accentFontFamily = first(th.accentFontFamily) === first(th.fontFamily) ? stack : th.accentFontFamily;
  }
  if (Number.isFinite(style.size) && style.size !== th.fontSizePx) st.fontSizePx = style.size;
  if (Number.isFinite(style.weight)) st.fontWeight = style.weight;
  if (style.color) st.fillColor = style.color;
  if (style.activeColor && style.activeColor !== th.emphasisColor) { st.emphasisColor = style.activeColor; st.emphasisGradient = undefined; }
  if (typeof style.caps === 'boolean' && style.caps !== Boolean(th.uppercase)) st.uppercase = style.caps;
  if (style.shadow === false) st.textShadow = SHADOW_OFF;
  if (Number.isFinite(style.y) && style.y !== th.baselineYFrac) {
    const shift = style.y - th.baselineYFrac;
    st.baselineYFrac = style.y;
    st.stackTopFrac = (th.stackTopFrac ?? 0.555) + shift;
  }
  return st;
}

// The lines of a page, read back from the universal words. A page whose lines no longer name a word keeps its
// breaks; a page from another format (no th) is one line of its words.
export function linesOf(words: Word[], page: Page): Word[][] {
  const lines = (page?.lines ?? []).map((line) => line.filter((i) => i >= 0 && i < words.length).map((i) => words[i]));
  return lines.filter((l) => l.length);
}
type CaptionProps = Props & { words?: Word[]; page?: Page; style?: any };

export const TalkingHeadCaption: React.FC<CaptionProps> = (props) => {
  const { item } = props;
  const own = useCurrentFrame();
  const frame = props.frame ?? own;
  const { fps, width, height } = useVideoConfig();
  useFontsReady();
  const words = props.words ?? item.words ?? [];
  const page = props.page ?? (item.pages ?? []).find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;
  const lines = linesOf(words, page);
  if (!lines.length) return null;
  const th = page.th ?? { type: 'line', grade: 0 };
  const st = resolveStyle(props.style ?? item.style);
  const t = ((item.from + frame) / fps) * 1000; // only the flowing gradient reads the clock
  const scale = width / st.refWidth;
  const base = st.fontSizePx * scale;
  const shown = (w: Word) => frame >= w.from;
  const fam = (accent?: boolean) => (accent ? st.accentFontFamily : st.fontFamily);
  const fit = (text: string, accent?: boolean) =>
    Math.min(
      fitText({ text, withinWidth: width * st.heroWidthFrac, fontFamily: fam(accent), fontWeight: String(st.fontWeight), letterSpacing: `${st.letterSpacingEm}em` }).fontSize,
      st.heroMaxFontPx * scale,
    );
  const dropShadow = (ts: string) =>
    ts.split(/\)\s*,\s*/).map((part) => part.trim()).filter(Boolean).map((part) => `drop-shadow(${part}${part.endsWith(')') ? '' : ')'})`).join(' ');
  const wordCss = (size: number, accent: boolean, fancy?: boolean): React.CSSProperties => {
    const grad = accent && !fancy ? st.emphasisGradient : undefined;
    return {
      fontFamily: fam(accent), fontWeight: st.fontWeight, fontSize: size, lineHeight: 1, letterSpacing: `${st.letterSpacingEm}em`,
      color: accent ? st.emphasisColor : st.fillColor,
      textShadow: grad ? 'none' : st.textShadow,
      textTransform: st.uppercase ? 'uppercase' : undefined,
      whiteSpace: 'pre',
      ...(grad ? {
        backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        filter: st.textShadow === SHADOW_OFF ? undefined : dropShadow(st.textShadow),
        ...(st.emphasisGradientFlowMs ? { backgroundSize: '200% 100%', backgroundPosition: `${((t / st.emphasisGradientFlowMs) * 100) % 100}% 0` } : {}),
      } : {}),
    } as React.CSSProperties;
  };
  const baselineTop = (size: number) => st.baselineYFrac * height - st.baselineEm * size;
  const text = (ws: Word[]) => ws.map((w) => w.text).join(' ');
  const drawWords = (ws: Word[]) => ws.map((w, i) => <React.Fragment key={w.id ?? i}>{i > 0 ? ' ' : null}<span data-word-id={w.id} style={{ display: 'inline-block', ...detailCss(w.edit, frame) }}>{w.text}</span></React.Fragment>);

  let el: React.ReactNode = null;
  if (th.type === 'block' && th.variant === 'heroTail') {
    // The hero is the line its words say they are; a page cut in two keeps a hero only where the hero went.
    const heroAt = lines.findIndex((ln) => ln.some((w: any) => w.th?.role === 'hero'));
    const heroLine = heroAt > -1 ? heroAt : (lines[0]?.some((w: any) => w.th) ? -1 : 0);
    const hero = heroLine > -1 ? text(lines[heroLine]) : '';
    const tail = lines.filter((_, i) => i !== heroLine);
    const hs = hero ? fit(hero, true) : base;
    el = (
      <>
        {hero ? <div style={{ position: 'absolute', top: baselineTop(hs), left: 0, width: '100%', textAlign: 'center', ...wordCss(hs, true, th.fancy) }}>{drawWords(lines[heroLine])}</div> : null}
        <div style={{ position: 'absolute', top: st.baselineYFrac * height + 34 * scale, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 * scale }}>
          {tail.map((ln, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.3em', ...wordCss(base, false) }}>
              {ln.map((w, j) => <span key={j} data-word-id={w.id} style={{ display: 'inline-block', visibility: shown(w) ? 'visible' : 'hidden', ...detailCss(w.edit, frame) }}>{w.text}</span>)}
            </div>
          ))}
        </div>
      </>
    );
  } else if (th.type === 'block') {
    const meta: any[] = th.lines ?? [];
    el = (
      <div style={{ position: 'absolute', top: (st.stackTopFrac ?? 0.555) * height, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 * scale }}>
        {lines.map((ln, i) => {
          const m = ln.find((w: any) => w.th)?.th ?? meta[i] ?? {};
          const size = m.size === 'h' ? fit(text(ln), Boolean(m.accent)) : m.size === 'm' ? base * 1.25 : base;
          const spread = m.spread !== false && ln.length > 1 && (m.size ?? 's') === 's' && st.heroMaxFontPx > st.fontSizePx;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: spread ? 'space-between' : 'center', gap: spread ? undefined : '0.35em', width: spread ? (st.stackSpreadFrac ?? 0.74) * width : undefined, ...wordCss(size, Boolean(m.accent)) }}>
              {ln.map((w, j) => <span key={j} data-word-id={w.id} style={{ display: 'inline-block', visibility: shown(w) ? 'visible' : 'hidden', ...detailCss(w.edit, frame) }}>{w.text}</span>)}
            </div>
          );
        })}
      </div>
    );
  } else if (th.type === 'line') {
    el = (
      <div style={{ position: 'absolute', top: baselineTop(base), left: (1 - (st.maxWidthFrac ?? 0.77)) * width / 2, width: (st.maxWidthFrac ?? 0.77) * width, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${0.3 * base}px 0.3em`, ...wordCss(base, false) }}>
        {lines.flat().map((w, j) => <span key={j} data-word-id={w.id} style={{ display: 'inline-block', visibility: shown(w) ? 'visible' : 'hidden', ...detailCss(w.edit, frame) }}>{w.text}</span>)}
      </div>
    );
  } else {
    const words = lines.flat();
    const hero = th.grade === 2;
    const value = text(words);
    const size = th.fontPx ? th.fontPx * scale : hero ? fit(value, true) : base;
    el = (
      <div style={{ position: 'absolute', top: th.topFrac !== undefined ? th.topFrac * height : baselineTop(size), left: 0, width: '100%', textAlign: 'center', ...wordCss(size, (th.grade ?? 0) > 0, hero && th.fancy) }}>
        {th.quote ? '“' : null}{drawWords(words)}{th.quote ? '”' : null}
      </div>
    );
  }
  return <AbsoluteFill style={lookVars(st)}>{el}</AbsoluteFill>;
};

// The tokens CaptionReel sets on its frame, which the cards and captions read.
function lookVars(st: any): React.CSSProperties {
  const look = styleOf(st?.style);
  return { ['--reel-font' as string]: st?.fontFamily, ...look.vars, ...(st?.accentColor ? { ['--accent' as string]: st.accentColor } : {}) } as React.CSSProperties;
}

// ---------------------------------------------------------------------------------------------------------------
// The title: the format's HookTitle on the format's clock. Editing the words keeps each line, loses only which span
// was set in the fancy face when a line's words change.

export const TalkingHeadTitle: React.FC<Props & { text?: string; style?: any }> = (props) => {
  const { item } = props;
  const own = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  useFontsReady();
  const d = item.data ?? {};
  const frame = (d.clockFrame ?? 0) + (props.frame ?? own);
  const page = d.page ?? {};
  const st = { ...CREATOR_1, ...(d.captionStyle ?? {}) };
  const s = props.style ?? item.style ?? {};
  const text = props.text ?? item.text ?? '';
  const tMs = (frame / fps) * 1000;
  const original: any[][] = (page.lines ?? []).map((l: any) => (Array.isArray(l) ? l : [l]));
  const sameText = original.map((l) => l.map((sp: any) => sp.text).join('')).join('\n') === text;
  const lines = sameText ? original : String(text).split('\n').map((line, i) => [{ text: line, fancy: original[i]?.length === 1 ? original[i][0].fancy : undefined }]);
  const font = s.font && !sameFace(s.font, first(st.titleFontFamily ?? st.fontFamily)) ? `"${familyOf(s.font)}", sans-serif` : st.titleFontFamily ?? st.fontFamily;
  return (
    <AbsoluteFill style={lookVars(d.captionStyle)}>
    <HookTitle
      tMs={tMs} fps={fps} width={width} height={height}
      fromMs={page.fromMs ?? 0} toMs={heldTo(page.toMs ?? 0, d.clockFrame ?? 0, item, fps)}
      lines={lines as any}
      reveal={page.reveal} revealMs={page.revealMs} logos={page.logos} look={page.look}
      exit={page.exit} lineHeight={st.titleLineHeight}
      topFrac={page.topFrac ?? st.titleTopFrac ?? 0.14}
      fontPx={Number.isFinite(s.size) ? s.size : page.fontPx ?? st.titleFontPx ?? 54}
      fancyScale={st.titleFancyScale ?? 1.15} lineGapPx={st.titleLineGapPx ?? 8}
      fontFamily={font} fancyFontFamily={st.accentFontFamily}
      weight={s.weight ?? st.titleWeight ?? st.fontWeight} color={s.color ?? st.titleColor ?? st.fillColor}
      shadow={st.titleShadow ?? st.textShadow}
    />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Cards. The event keeps the format's clock; clockFrame is the frame of that clock at the item's frame 0, so the
// card's own inner sequences and clips play exactly as they did in the render. A card made longer holds on.

// The format's end, unless the item was made to run past the frame the format stopped drawing it.
export function heldTo(toMs: number, clockFrame: number, item: AnyItem, fps: number) {
  const endFrame = (clockFrame ?? 0) + (item.trimStart ?? 0) + item.durationInFrames;
  const formatEnd = Math.ceil((toMs * fps) / 1000 - 1e-6);
  return endFrame > formatEnd ? (endFrame * 1000) / fps : toMs;
}

function eventFor(item: AnyItem, fps: number) {
  const d = item.data ?? {};
  const ev = d.event ?? {};
  const toMs = heldTo(ev.toMs, d.clockFrame, item, fps);
  return toMs !== ev.toMs ? { ...ev, toMs } : ev;
}

const CardOnClock: React.FC<{ item: AnyItem; soft?: boolean }> = ({ item, soft }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tMs = (frame / fps) * 1000;
  const ev = eventFor(item, fps);
  if (soft) return <SoftOverlay events={[ev]} tMs={tMs} video="master.mp4" />;
  return <Overlay events={[ev, ...(item.data?.chain ?? [])]} tMs={tMs} captionStyle={item.data?.captionStyle} />;
};

// A card that cannot be drawn never takes the player or the export down with it. The reader marks a card the
// installed engine does not know (engineMissing); a card that fails anyway is caught here. In the player the card
// says so where it would sit; in a render it draws nothing and says so in the log, and the export check names the
// marked ones from the document (cardsTheEngineLacks in reader.mjs). Throwing instead would lose every other frame
// of the export over one card, which is worse than one named, missing card.
const Missing: React.FC<{ item: AnyItem; text: string }> = ({ item, text }) => {
  const { width, height } = useVideoConfig();
  const st = item.data?.captionStyle ?? {};
  const card = item.data?.event?.card ?? {};
  const top = (card.bandTopFrac ?? st.cardTopFrac ?? 0.175) * height;
  const bottom = (card.bandBottomFrac ?? st.cardBottomFrac ?? 0.365) * height;
  const w = (card.wFrac ?? 0.8) * width;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: (width - w) / 2, top, width: w, height: Math.max(120, bottom - top), display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, boxSizing: 'border-box', background: 'rgba(8,8,10,.72)', border: '3px dashed rgba(255,255,255,.55)', color: '#fff', font: '600 40px/1.3 sans-serif' }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const failures = new Set<string>();
class CardBoundary extends React.Component<{ item: AnyItem; mode?: string; children: React.ReactNode }, { failed: string | null }> {
  state = { failed: null as string | null };
  static getDerivedStateFromError(error: unknown) { return { failed: String((error as any)?.message ?? error) }; }
  componentDidCatch(error: unknown) {
    const key = `${this.props.item.id}:${String((error as any)?.message ?? error)}`;
    if (!failures.has(key)) { failures.add(key); console.error(`keyframes: card ${this.props.item.id} (${this.props.item.data?.event?.kind}) could not be drawn: ${(error as any)?.message ?? error}`); }
  }
  componentDidUpdate(prev: { item: AnyItem }) { if (prev.item !== this.props.item && this.state.failed) this.setState({ failed: null }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.mode === 'render' ? null : <Missing item={this.props.item} text="This card could not be drawn" />;
  }
}

const drawCard = (soft: boolean): React.FC<Props> => ({ item, mode }) => {
  if (item.data?.engineMissing) {
    if (mode === 'render') {
      const key = `${item.id}:missing`;
      if (!failures.has(key)) { failures.add(key); console.error(`keyframes: card ${item.id} (${item.data?.event?.kind}) is drawn by a newer Talking Head engine and was left out`); }
      return null;
    }
    return <Missing item={item} text="Drawn by a newer Talking Head engine" />;
  }
  return (
    <CardBoundary item={item} mode={mode}>
      <AbsoluteFill style={lookVars(item.data?.captionStyle)}>
        <Sequence from={-(item.data?.clockFrame ?? 0)} layout="none"><CardOnClock item={item} soft={soft} /></Sequence>
      </AbsoluteFill>
    </CardBoundary>
  );
};
const Card = drawCard(false);
const Soft = drawCard(true);

const getIn = (obj: any, path: (string | number)[]) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
function setIn(obj: any, path: (string | number)[], value: any): any {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  copy[head as any] = setIn(copy[head as any], rest, value);
  return copy;
}

// The words the reader found inside this card's data, one field each.
export const cardFields = (item: AnyItem): Field[] =>
  (item.data?.fields ?? []).map((f: any) => ({
    key: f.key,
    label: f.label,
    kind: f.long ? 'longtext' : 'text',
    read: (it: AnyItem) => getIn(it.data?.event, f.path) ?? '',
    write: (it: AnyItem, value: any) => ({ ...it, data: { ...it.data, event: setIn(it.data?.event, f.path, String(value ?? '')) } }),
  }));

const cardLabel = (item: AnyItem) => item.label ?? 'Graphic';

export const layers = {
  'talking-head/card': { draw: Card, fields: cardFields, label: cardLabel },
  'talking-head/soft': { draw: Soft, fields: cardFields, label: cardLabel },
};

// What picking the look writes onto a caption from another format: the format's own face, size and colours.
export const CAPTION_LOOK = 'talking-head/captions';
export const captionLooks = {
  [CAPTION_LOOK]: {
    label: 'Talking Head',
    draw: TalkingHeadCaption,
    styleControls: ['font', 'size', 'weight', 'color', 'activeColor', 'caps', 'shadow', 'y'],
    style: { look: CAPTION_LOOK, font: 'sora', size: 62, weight: 700, color: '#FFFFFF', activeColor: '#E07850', shadow: true, caps: false, y: 0.615, maxWidth: 0.77, animation: 'word' },
  },
};

export const textLooks = {
  'talking-head/title': { label: 'Talking Head title', draw: TalkingHeadTitle, styleControls: ['font', 'size', 'weight', 'color'], style: { look: 'talking-head/title', font: 'sora', size: 52, weight: 700, color: '#FFFFFF', align: 'center' } },
};
