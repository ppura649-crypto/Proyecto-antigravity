// One block on the timeline and what is drawn inside it: a filmstrip for a clip, a waveform for a sound (and under a
// clip), the words of text and captions, a thumbnail for a picture, the name of a graphic. Only the part of a block
// inside the visible window is drawn, so a 55 second clip at frame zoom costs the same as a short one.
//
// Fade handles and the volume line follow HyperFrames Studio's TimelineClipFades (Apache 2.0, HeyGen): corner dots
// that drag the fade, a wedge that shows it.
import React, { memo, useLayoutEffect, useRef } from 'react';
import type { Item } from './types';
import { Icon } from './icons';
import { useStrip, useWave, useMediaSize, mediaUrl, STRIP_FRAMES } from './media';
import { layers } from 'keyframes-layers';
import { HEAD } from './timeline-geometry';
import { end, timecode, MAX_VOLUME } from '../edit-doc.mjs';

const TYPE_WORD: Record<string, string> = { video: 'Clip', audio: 'Sound', image: 'Picture', text: 'Text', caption: 'Captions', layer: 'Graphic' };
export const typeWord = (item: Item) => TYPE_WORD[item.type] ?? 'Item';

export function itemLabel(item: Item) {
  if (item.type === 'layer') {
    try { return layers[item.renderer!]?.label?.(item) || item.label || 'Graphic'; } catch { return item.label || 'Graphic'; }
  }
  if (item.type === 'text') return item.text || item.label || 'Text';
  if (item.type === 'caption') return item.label || (item.words ?? []).map((w) => w.text).join(' ') || 'Captions';
  return item.label || (item.src ?? '').split('/').pop() || typeWord(item);
}
const kindIcon = (item: Item) => ({ layer: 'layer', text: 'text', caption: 'text', audio: 'sound', image: 'image', video: 'video' } as Record<string, string>)[item.type] ?? 'layer';

type Window = { winL: number; winR: number };

// Two chain links: this clip moves with others.
const LinkMark = () => (
  <svg className="clip-link" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Linked">
    <path d="M10 14a4.5 4.5 0 006.4 0l3.2-3.2a4.5 4.5 0 00-6.4-6.4L12 5.6" /><path d="M14 10a4.5 4.5 0 00-6.4 0l-3.2 3.2a4.5 4.5 0 006.4 6.4l1.2-1.2" />
  </svg>
);

// ---------------------------------------------------------------------------------------------------------------

const StripTile: React.FC<{ path: string; at: number; step: number; left: number; width: number; height: number }> = ({ path, at, step, left, width, height }) => {
  const bucket = Math.floor(at / (step * STRIP_FRAMES));
  const start = bucket * step * STRIP_FRAMES;
  const strip = useStrip(path, start, step);
  const index = Math.min(STRIP_FRAMES - 1, Math.max(0, Math.floor((at - start) / step)));
  if (!strip) return null;
  return <i data-source-time={start + index * step} style={{ left, width, backgroundImage: `url(${strip.url})`, backgroundSize: `${width * STRIP_FRAMES}px ${height}px`, backgroundPosition: `${-index * width}px 0` }} />;
};
const Strip: React.FC<{ item: Item; height: number; ppf: number; fps: number } & Window> = ({ item, height, ppf, fps, winL, winR }) => {
  const path = item.preview ?? item.src;
  const size = useMediaSize(path);
  if (!path) return null;
  const tile = Math.max(12, Math.round(height * (size?.width && size?.height ? size.width / size.height : item.size ? item.size.w / item.size.h : .75)));
  const secondsPerTile = tile / (ppf * fps) * (item.speed ?? 1);
  const step = Math.min(600, Math.max(1 / fps, 2 ** Math.floor(Math.log2(secondsPerTile / 2))));
  const first = Math.max(0, Math.floor(winL / tile));
  const last = Math.ceil(winR / tile);
  const tiles = [];
  for (let i = first; i < last && tiles.length < 300; i++) {
    const frame = (item.trimStart ?? 0) + ((i + 0.5) * tile / ppf) * (item.speed ?? 1);
    const at = Math.max(0, Math.min(frame, (item.sourceDurationInFrames ?? Infinity) - 1) / fps);
    tiles.push(<StripTile key={i} path={path} at={at} step={step} left={i * tile} width={tile} height={height} />);
  }
  return <div className="clip-strip" aria-hidden="true">{tiles}</div>;
};

const Thumbs: React.FC<{ item: Item; height: number } & Window> = ({ item, height, winL, winR }) => {
  if (!item.src && !item.thumb) return null;
  const url = mediaUrl(item.thumb ?? item.src!);
  const tile = Math.round(height * 0.8);
  const left = Math.max(0, Math.floor(winL / tile) * tile);
  return <div className="clip-thumbs" aria-hidden="true" style={{ left, width: Math.max(0, winR - left), backgroundImage: `url("${url}")`, backgroundSize: `${tile}px ${height}px` }} />;
};

const Wave: React.FC<{ item: Item; height: number; ppf: number; fps: number; small?: boolean } & Window> = ({ item, height, ppf, fps, small, winL, winR }) => {
  const wave = useWave(item.src);
  const canvas = useRef<HTMLCanvasElement>(null);
  const w = Math.max(1, Math.min(Math.round(winR - winL), 8000));
  useLayoutEffect(() => {
    const c = canvas.current;
    if (!c || !wave) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = w * ratio;
    c.height = height * ratio;
    const g = c.getContext('2d')!;
    g.scale(ratio, ratio);
    g.clearRect(0, 0, w, height);
    g.fillStyle = getComputedStyle(c).color;
    const volume = Math.min(MAX_VOLUME, item.volume ?? 1);
    const framesPerPx = (item.speed ?? 1) / ppf;
    const span = Math.max(1, Math.ceil((framesPerPx / fps) * wave.rate));
    for (let x = 0; x < w; x++) {
      const frame = (item.trimStart ?? 0) + (winL + x) * framesPerPx;
      const index = Math.floor((frame / fps) * wave.rate);
      let peak = 0;
      for (let k = 0; k < span; k++) peak = Math.max(peak, wave.peaks[index + k] ?? 0);
      const h = Math.max(1, (peak / 255) * height * 0.9 * Math.min(1.3, 0.35 + volume * 0.65));
      if (small) g.fillRect(x, height - h, 1, h);
      else g.fillRect(x, (height - h) / 2, 1, h);
    }
  }, [wave, w, winL, height, ppf, item.trimStart, item.speed, item.volume, fps]);
  return <canvas ref={canvas} aria-hidden="true" className={small ? 'clip-wave small' : 'clip-wave'} style={{ left: winL, width: w, height }} />;
};

// Captions: the words where they are spoken. A tick marks each word once there is room to see it.
const Words: React.FC<{ item: Item; ppf: number } & Window> = ({ item, ppf, winL, winR }) => {
  const words = item.words ?? [];
  const offset = item.trimStart ?? 0;
  const out = [];
  const roomy = ppf >= 1.2;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const x = (w.from - offset) * ppf;
    const width = (w.to - w.from) * ppf;
    if (x + width < winL || x > winR) continue;
    if (x >= item.durationInFrames * ppf) break;
    out.push(
      <span key={i} className={roomy ? 'word roomy' : 'word'} style={{ left: Math.max(0, x), width: Math.max(2, width) }}>
        {width > 14 ? w.text : null}
      </span>,
    );
  }
  return <div className="clip-words" aria-hidden="true">{out}</div>;
};

const Fades: React.FC<{ item: Item; ppf: number; width: number; editable: boolean }> = ({ item, ppf, width, editable }) => {
  const fin = Math.min(width, (item.fadeIn ?? 0) * ppf);
  const fout = Math.min(width, (item.fadeOut ?? 0) * ppf);
  return (
    <>
      {fin > 0 && <svg className="clip-fade" style={{ left: 0, width: fin }} viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H10L0 10z" /><path className="ramp" d="M0 10L10 0" vectorEffect="non-scaling-stroke" /></svg>}
      {fout > 0 && <svg className="clip-fade" style={{ right: 0, width: fout }} viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H10V10z" /><path className="ramp" d="M0 0L10 10" vectorEffect="non-scaling-stroke" /></svg>}
      {editable && width > 30 && (
        <>
          <b className="fade-handle in" data-fade="in" data-clip={item.id} style={{ left: Math.max(0, Math.min(width - 16, fin - 5)) }} title="Fade in" />
          <b className="fade-handle out" data-fade="out" data-clip={item.id} style={{ right: Math.max(0, Math.min(width - 16, fout - 5)) }} title="Fade out" />
        </>
      )}
    </>
  );
};

// The volume line: 100% sits a quarter of the way down, so the usual level is out of the way of the clip's body, silence
// at the bottom and the most (200%) at the top. volumeAt reads a height back into a volume.
const PAD = 4;
export function volumeY(volume: number, inner: number) {
  const v = Math.min(MAX_VOLUME, Math.max(0, volume));
  const share = v <= 1 ? 0.25 + 0.75 * (1 - v) : 0.25 * (MAX_VOLUME - v);
  return Math.round(PAD + (inner - 2 * PAD) * share);
}
export function volumeAt(y: number, inner: number) {
  const share = Math.min(1, Math.max(0, (y - PAD) / Math.max(1, inner - 2 * PAD)));
  return share >= 0.25 ? 1 - (share - 0.25) / 0.75 : MAX_VOLUME - share / 0.25;
}

export type ClipProps = {
  item: Item; fps: number; ppf: number; height: number; selected: boolean; locked: boolean; muted: boolean;
  focusable: boolean; winL: number; winR: number;
};

export const Clip = memo(function Clip({ item, fps, ppf, height, selected, locked, muted, focusable, winL: vl, winR: vr }: ClipProps) {
  const left = HEAD + item.from * ppf;
  const width = Math.max(3, item.durationInFrames * ppf);
  const inner = height - 6;
  // The visible window in this block's own pixels.
  const winL = Math.max(0, vl - left);
  const winR = Math.min(width, vr - left);
  const media = item.type === 'video' || item.type === 'audio';
  const label = itemLabel(item);
  const cls = ['clip', `clip-${item.type}`, selected && 'is-selected', locked && 'is-locked', muted && 'is-muted'].filter(Boolean).join(' ');
  const when = `${timecode(item.from, fps)} to ${timecode(end(item), fps)}`;
  return (
    <div
      className={cls} data-clip={item.id} data-type={item.type} role="button" aria-pressed={selected} tabIndex={focusable ? 0 : -1}
      aria-label={`${typeWord(item)} ${label}, ${when}${item.link ? ', linked' : ''}${locked ? ', locked' : ''}`}
      style={{ left, width, height: inner, top: 3 }} title={`${label}\n${when}`}
    >
      {item.type === 'video' && <Strip item={item} height={inner} ppf={ppf} fps={fps} winL={winL} winR={winR} />}
      {item.type === 'image' && <Thumbs item={item} height={inner} winL={winL} winR={winR} />}
      {item.type === 'audio' && <Wave item={item} height={inner} ppf={ppf} fps={fps} winL={winL} winR={winR} />}
      {item.type === 'video' && item.volume !== 0 && <Wave item={item} height={Math.round(inner * 0.32)} ppf={ppf} fps={fps} winL={winL} winR={winR} small />}
      {item.type === 'caption' && <Words item={item} ppf={ppf} winL={winL} winR={winR} />}
      {item.type === 'caption' && item.link && <span className="clip-label caption-link"><LinkMark /></span>}
      <Fades item={item} ppf={ppf} width={width} editable={!locked} />
      {media && !locked && width > 24 && (
        <i className="clip-volume" data-volume={item.id} style={{ top: volumeY(item.volume ?? 1, inner) - 4 }} title={`Volume ${Math.round((item.volume ?? 1) * 100)}%`}><s /></i>
      )}
      {width > 22 && item.type !== 'caption' && (
        <span className="clip-label">
          {width > 56 && <Icon name={kindIcon(item)} size={12} />}
          {item.link && <LinkMark />}
          <span>{label}</span>
          {media && (item.speed ?? 1) !== 1 && <em className="clip-speed">{Number((item.speed ?? 1).toFixed(2))}x</em>}
        </span>
      )}
      {!locked && <b className="clip-edge start" data-edge="start" data-clip={item.id} />}
      {!locked && <b className="clip-edge end" data-edge="end" data-clip={item.id} />}
    </div>
  );
});
