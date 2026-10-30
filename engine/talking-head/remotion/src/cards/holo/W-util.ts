import type React from "react";
import { spring } from "remotion";
// reference edit K family W helpers (2026-09-24): pure functions of the spine clock, seeded noise only.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const sp = (tMs: number, at: number, fps: number, damping = 26, stiffness = 170, mass = 1) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: { damping, stiffness, mass } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
export const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;

// hook-1 words (video-1 spine ms); an event's `beats` may override any of them
export const WB = {
  you: 1974, need: 2094, watch: 2334, this: 2394, the: 2833, fix: 2990, is: 3230, starting: 3517, own: 4237,
};
export type WBeats = typeof WB;

// the whole card: a slow push across the window and a clean <=130 ms exit at `own`
export const wrapStyle = (t: number, b: WBeats, push = 0.04, origin = "50% 50%"): React.CSSProperties => {
  const life = clamp((t - b.you) / (b.own - b.you));
  const out = clamp((t - (b.own - 130)) / 130);
  return {
    position: "absolute", inset: 0, transformOrigin: origin,
    transform: `scale(${(1 + push * easeInOut(life)) * (1 - 0.03 * out)})`, opacity: 1 - easeIn2(out),
  };
};
