// Captions: spoken words shown a page at a time, the word being said lit. One renderer for every format. A pack's
// caption look (registered in its layers.tsx) draws the page its own way from the same words; without one, this draws
// it: a block at a height, words in a font, the active word in its colour, and one of four ways of appearing.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { captionLooks } from 'keyframes-layers';
import type { Doc, Item, TextStyle, Word } from './types';
import { fontStack, nearestWeight } from './fonts';
import { pagesOf, pageAt, activeWord } from './captions.mjs';
import { detailCss } from './detail.mjs';

export const CAPTION_DEFAULTS: TextStyle = { font: 'inter', size: 64, weight: 800, color: '#FFFFFF', activeColor: '#FFE14D', shadow: true, animation: 'none', y: 0.7, maxWidth: 0.84 };

type Props = { item: Item; doc: Doc; asset: (path: string) => string; mode: 'player' | 'render'; fps: number };

export const CaptionItem: React.FC<Props> = ({ item, doc, asset, mode, fps }) => {
  const frame = useCurrentFrame();
  const words = item.words ?? [];
  const pages = useMemo(() => pagesOf(item, fps), [item.words, item.pages, item.style?.wordsPerPage, fps]);
  const pageIndex = pages.findIndex((p) => frame >= p.from && frame < p.to);
  const page = pageIndex > -1 ? pages[pageIndex] : pageAt(pages, frame);
  if (!page) return null;
  const active = activeWord(words, frame, page);
  const style = { ...CAPTION_DEFAULTS, ...(item.style ?? {}) };
  const Look = style.look ? captionLooks[style.look]?.draw : null;
  if (Look) return <Look item={item} doc={doc} asset={asset} mode={mode} frame={frame} words={words} page={page} pageIndex={pageIndex} active={active} style={style} />;
  return <UniversalPage doc={doc} words={words} lines={page.lines} from={page.from} frame={frame} active={active} style={style} fps={fps} />;
};

// The editor's own caption look.
export const UniversalPage: React.FC<{ doc: Doc; words: Word[]; lines: number[][]; from: number; frame: number; active: number; style: TextStyle; fps: number }> = ({ doc, words, lines, from, frame, active, style, fps }) => {
  const size = style.size ?? 64;
  const animation = style.animation ?? 'none';
  const since = frame - from;
  const pop = animation === 'pop' || animation === 'word';
  // A page pops in over a sixth of a second: from 80 percent, a touch past full size, then full size.
  const scale = pop ? interpolate(since, [0, fps * 0.09, fps * 0.16], [0.8, 1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const shown = animation === 'word' ? lines.map((line) => line.filter((i) => i === (active > -1 ? active : line[0]))).filter((l) => l.length) : lines;
  const lineCss: React.CSSProperties = {
    display: 'inline-block',
    padding: style.background ? `${size * 0.12}px ${size * 0.3}px` : 0,
    background: style.background || undefined,
    margin: style.background ? `0 0 ${size * 0.08}px` : 0,
  };
  const colourOf = (i: number) => {
    if (animation === 'karaoke') return words[i].from <= frame ? style.activeColor ?? '#FFFFFF' : style.color;
    return i === active && style.activeColor ? style.activeColor : style.color;
  };
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: '50%', top: (style.y ?? 0.7) * doc.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          width: doc.width * (style.maxWidth ?? 0.84),
          textAlign: style.align ?? 'center',
          fontFamily: fontStack(style.font), fontSize: size, fontWeight: nearestWeight(style.font, style.weight), lineHeight: 1.14,
          textTransform: style.caps ? 'uppercase' : undefined,
          WebkitTextStroke: style.stroke ? `${Math.max(2, size / 14)}px ${style.stroke}` : undefined,
          paintOrder: 'stroke fill',
          textShadow: style.shadow === false || style.background ? undefined : '0 3px 12px rgba(0,0,0,.6)',
        }}
      >
        {shown.map((line, l) => (
          <div key={l}>
            <span style={lineCss}>
              {line.map((i, k) => (
                <React.Fragment key={i}>
                  {k > 0 ? ' ' : null}
                  <span data-word-id={words[i]?.id} style={{ color: colourOf(i), display: 'inline-block', transform: pop && i === active && animation !== 'word' ? 'scale(1.08)' : undefined, ...detailCss(words[i]?.edit, frame) }}>{words[i]?.text}</span>
                </React.Fragment>
              ))}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
