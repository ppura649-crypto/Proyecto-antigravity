import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import type { CardProps } from "./Objects";
import { SOFT, fade, pop, clamp01, since, type Box, px } from "./tokens";

// Her real-media frames (formats/creator-format-2-visuals.md "Real media in a rounded frame", refs
// XAP5 / XAQ7 / XASI / XATe real-media.md). The rule these serve: a real thing goes on screen
// whenever one exists; the edit adds a frame, a cut and at most a 3-frame pop. The motion is
// the media's own (a clip plays, a page scrolls with an ease-out), never a designed animation.

const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export type Scroll = { from: number; to: number; atMs?: number; ms?: number };
// the one drawn mark she puts ON real content (XAP5 f587+, XARU f119+): a box or a bar, instant
export type Highlight = { x: number; y: number; w: number; h: number; atMs?: number; fill?: boolean };

const Mark: React.FC<{ h: Highlight; b: { left: number; top: number; width: number; height: number }; tMs: number; fromMs: number }> = ({ h, b, tMs, fromMs }) =>
  tMs < (h.atMs ?? fromMs) ? null : (
    <div style={{ position: "absolute", left: b.left + h.x * b.width, top: b.top + h.y * b.height, width: h.w * b.width, height: h.h * b.height,
      border: h.fill ? "none" : `4px solid ${SOFT.mark}`, background: h.fill ? SOFT.markFill : "transparent", borderRadius: 4, pointerEvents: "none" }} />
  );

// device px offset of a capture at time t: her screen-recording scroll shape, one glide, ease-out
const scrollY = (s: Scroll | undefined, tMs: number, fromMs: number, toMs: number) => {
  if (!s) return 0;
  const at = s.atMs ?? fromMs;
  const ms = s.ms ?? Math.max(600, toMs - at);
  return s.from + (s.to - s.from) * easeOut((tMs - at) / ms);
};

const Frame: React.FC<{ b: ReturnType<typeof px>; radius: number; scale: number; children: React.ReactNode; bg?: string }> = ({ b, radius, scale, children, bg }) => (
  <div style={{ position: "absolute", ...b, borderRadius: radius, overflow: "hidden", background: bg ?? "#000",
    boxShadow: SOFT.shadow, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>
    {children}
  </div>
);

// A real clip in her vertical window: 0.20-0.80W x 0.12-0.62H, radius 30, no border, hard cut
// in and out, the clip's own motion (XAFZ f141-227). `startMs` is the offset into the clip.
export const Clip: React.FC<CardProps & { asset: string; box?: Box; startMs?: number; radius?: number }> = (p) => {
  const b = px(p.box ?? { x: 0.2, y: 0.12, w: 0.6, h: 0.5 }, p.W, p.H);
  const startFrom = Math.round(((p.startMs ?? 0) / 1000) * p.fps);
  return (
    <Frame b={b} radius={p.radius ?? 30} scale={1}>
      <OffthreadVideo src={staticFile(p.asset)} startFrom={startFrom} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </Frame>
  );
};

// A real page or screenshot in the same bare rounded window, scrolled once with an ease-out
// the way a screen recording scrolls; `zoom` > 1 enlarges anchored top-left so the headline reads.
export const Screen: React.FC<CardProps & { asset: string; assetW: number; box?: Box; scroll?: Scroll; zoom?: number; popIn?: boolean; radius?: number; highlight?: Highlight }> = (p) => {
  const b = px(p.box ?? { x: 0.2, y: 0.12, w: 0.6, h: 0.5 }, p.W, p.H);
  const k = (b.width / p.assetW) * (p.zoom ?? 1);
  const y = scrollY(p.scroll, p.tMs, p.fromMs, p.toMs);
  const s = p.popIn ? pop(p.tMs, p.fromMs, p.fps) : 1;
  return (
    <>
      <Frame b={b} radius={p.radius ?? 30} scale={s} bg="#fff">
        <Img src={staticFile(p.asset)} style={{ position: "absolute", top: -y * k, left: 0, width: p.assetW * k, display: "block" }} />
      </Frame>
      {p.highlight && <Mark h={p.highlight} b={b} tMs={p.tMs} fromMs={p.fromMs} />}
    </>
  );
};

// Her split (XAP5 16.2M: 65 % of the runtime; XAGA, XAKr): the real thing fills 0-1W x 0-seam H
// edge to edge, no radius, no border, no shadow; she sits below the seam framed chest-up. Their
// master is redrawn under the seam cropped so their head lands in the lower half (`faceTop` = the
// source fraction that meets the seam). Hard cut in and out, only the media's own motion above.
export const Split: React.FC<CardProps & { asset: string; assetW: number; video: string; seam?: number; faceTop?: number; startMs?: number; scroll?: Scroll; highlight?: Highlight }> = (p) => {
  const seam = p.seam ?? 0.487;
  const top = { left: 0, top: 0, width: p.W, height: seam * p.H };
  const isVideo = /\.mp4$/.test(p.asset);
  const k = p.W / p.assetW;
  const y = scrollY(p.scroll, p.tMs, p.fromMs, p.toMs);
  const startFrom = Math.round(((p.startMs ?? 0) / 1000) * p.fps);
  const faceTop = p.faceTop ?? 0.16;
  return (
    <>
      <div style={{ position: "absolute", ...top, overflow: "hidden", background: "#fff" }}>
        {isVideo ? (
          <OffthreadVideo src={staticFile(p.asset)} startFrom={startFrom} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        ) : (
          <Img src={staticFile(p.asset)} style={{ position: "absolute", top: -y * k, left: 0, width: p.W, display: "block" }} />
        )}
      </div>
      <div style={{ position: "absolute", left: 0, top: seam * p.H, width: p.W, height: (1 - seam) * p.H, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo src={staticFile(p.video)} muted style={{ position: "absolute", left: 0, top: -faceTop * p.H, width: p.W, height: p.H }} />
      </div>
      {p.highlight && <Mark h={p.highlight} b={top} tMs={p.tMs} fromMs={p.fromMs} />}
    </>
  );
};

// A real chart (scripts/chart.py, a matplotlib PNG from real numbers) in her white proof frame:
// heading + accent underline above, 3-frame pop from 0.85, the source line is in the image.
export const Chart: React.FC<CardProps & { asset: string; assetW: number; assetH: number; heading?: string; box?: Box }> = (p) => {
  const box = p.box ?? { x: 0.098, y: 0.258, w: 0.804, h: 0.326 };
  const b = px(box, p.W, p.H);
  const s = pop(p.tMs, p.fromMs, p.fps);
  const headO = fade(p.tMs, p.fromMs, 4, p.fps);
  const inset = 10;
  const innerW = b.width - 2 * inset;
  const innerH = Math.min(b.height - 2 * inset, (innerW * p.assetH) / p.assetW);
  return (
    <>
      {p.heading && (
        <div style={{ position: "absolute", left: b.left, top: p.H * 0.19, opacity: headO, fontFamily: SOFT.grotesque, fontWeight: 600,
          fontSize: 40, color: SOFT.white, textShadow: SOFT.textShadow }}>
          {p.heading}
          <div style={{ width: 70, height: 4, background: SOFT.accent, marginTop: 8, borderRadius: 2 }} />
        </div>
      )}
      <div style={{ position: "absolute", left: b.left, top: b.top, width: b.width, height: innerH + 2 * inset, borderRadius: 30, background: SOFT.frame,
        boxShadow: SOFT.shadow, transform: `scale(${s})`, transformOrigin: "50% 50%", padding: inset, boxSizing: "border-box" }}>
        <div style={{ width: innerW, height: innerH, borderRadius: 22, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile(p.asset)} style={{ width: innerW, height: innerH, display: "block" }} />
        </div>
      </div>
    </>
  );
};

// Real thumbnails (product photos, covers, results) as a row or a grid: each pops 3 frames from
// 0.85, one every `stagger` frames from `beats.first`. Her measured default is the app's own
// canvas look (XAP5 f52-372: 3x3, no radius, no shadow); `radius` / `shadow` for a YouTube card row.
export const Thumbs: React.FC<CardProps & { assets: string[]; box?: Box; stagger?: number; ratio?: number; cols?: number; radius?: number; shadow?: boolean }> = (p) => {
  const box = p.box ?? { x: 0.08, y: 0.14, w: 0.84, h: 0.3 };
  const b = px(box, p.W, p.H);
  const n = p.assets.length;
  const cols = p.cols ?? n;
  const rows = Math.ceil(n / cols);
  const gap = 18;
  const w = (b.width - gap * (cols - 1)) / cols;
  const h = Math.min((b.height - gap * (rows - 1)) / rows, w / (p.ratio ?? 16 / 9));
  const first = p.beats.first ?? p.fromMs;
  const stagger = p.stagger ?? 3;
  return (
    <>
      {p.assets.map((a, i) => {
        const at = first + (i * stagger * 1000) / p.fps;
        const s = pop(p.tMs, at, p.fps);
        const o = since(p.tMs, at, p.fps) < 0 ? 0 : 1;
        const col = i % cols, row = Math.floor(i / cols);
        return (
          <div key={a} style={{ position: "absolute", left: b.left + col * (w + gap), top: b.top + row * (h + gap), width: w, height: h, borderRadius: p.radius ?? 0, overflow: "hidden",
            background: "#fff", boxShadow: p.shadow ? SOFT.shadow : "none", opacity: o, transform: `scale(${s})` }}>
            <Img src={staticFile(a)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        );
      })}
    </>
  );
};
