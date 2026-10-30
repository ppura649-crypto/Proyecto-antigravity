import React from "react";
import { Img, spring, staticFile } from "remotion";
// reference edit K hook-1 variants, builder V (2026-09-24): shared helpers. Everything is a pure function of the
// spine clock (no state, no random). Card = 1080 x 634 (hFrac 0.33, the whole band).

export const CW = 1080, CH = 634, CXV = 540, CYV = 317;
export const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeIn = (x: number) => { const t = clamp(x); return t * t * t; };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
export const sp = (t: number, at: number, fps: number, config: SpringCfg) =>
  t < at ? 0 : spring({ frame: ((t - at) / 1000) * fps, fps, config: { mass: 1, ...config } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
// ~450 ms, no overshoot / ~650 ms, no overshoot
export const CALM = { damping: 30, stiffness: 240 };
export const GLIDE = { damping: 28, stiffness: 150 };

// the hook-1 clock (video-1 spine ms); events may override through `beats`
export const VB = { you: 1974, need: 2094, to: 2214, watch: 2334, this: 2394, the: 2833, fix: 2990, is: 3230,
  starting: 3517, from: 3757, your: 4057, own: 4237 };
export type VBeats = typeof VB;

// the clean hand-over at the card's end: 150 ms, a small step back and gone
export const exitOf = (t: number, toMs: number) => {
  const e = easeIn(clamp((t - (toMs - 150)) / 150));
  return { opacity: 1 - e, scale: 1 - 0.05 * e, blur: 6 * e };
};

// a photo seen through a window: container rect (card px), zoom k (card px per source px) and the source
// point (cx, cy) that sits at the window's centre. Lerping two views keeps the photo covering the window
// as long as both ends do (the view is clamped inside the image anyway).
export type View = { x: number; y: number; w: number; h: number; k: number; cx: number; cy: number };
export const lerpView = (a: View, b: View, f: number): View => ({
  x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), w: lerp(a.w, b.w, f), h: lerp(a.h, b.h, f),
  k: lerp(a.k, b.k, f), cx: lerp(a.cx, b.cx, f), cy: lerp(a.cy, b.cy, f),
});
const fitView = (v: View, iw: number, ih: number): View => {
  const hw = v.w / 2 / v.k, hh = v.h / 2 / v.k;
  return { ...v, cx: clamp(v.cx, Math.min(hw, iw / 2), Math.max(iw - hw, iw / 2)),
    cy: clamp(v.cy, Math.min(hh, ih / 2), Math.max(ih - hh, ih / 2)) };
};
// where a source pixel of the photo is on the card right now
export const onView = (v: View, px: number, py: number) => ({ x: v.x + v.w / 2 + (px - v.cx) * v.k, y: v.y + v.h / 2 + (py - v.cy) * v.k });
// a view that shows the whole image at width w, with its top-left at (x, y)
export const fullView = (x: number, y: number, w: number, iw: number, ih: number): View =>
  ({ x, y, w, h: (w * ih) / iw, k: w / iw, cx: iw / 2, cy: ih / 2 });

export const Photo: React.FC<{ src: string; v: View; iw: number; ih: number; style?: React.CSSProperties;
  children?: React.ReactNode }> = ({ src, v: v0, iw, ih, style, children }) => {
  const v = fitView(v0, iw, ih);
  return (
    <div style={{ position: "absolute", left: v.x, top: v.y, width: v.w, height: v.h, overflow: "hidden", ...style }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: v.w / 2 - v.cx * v.k, top: v.h / 2 - v.cy * v.k,
        width: iw * v.k, height: ih * v.k, maxWidth: "none" }} />
      {children}
    </div>
  );
};

export const ink = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150 ? "#111" : "#fff";
};
export const SHADOW = "0 26px 60px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.32)";
