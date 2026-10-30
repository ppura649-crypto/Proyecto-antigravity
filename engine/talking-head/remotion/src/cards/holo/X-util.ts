import { spring } from "remotion";
// reference edit K hook-1 variants, builder X (2026-09-24): pure helpers of the spine clock (seeded, no state).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// progress 0..1 of a window [a, b] in spine ms
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
export const sp = (tMs: number, at: number, fps: number, config: SpringCfg) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: { mass: 1, ...config } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// the hook-1 words (video-1 spine ms); events may override through `beats`
export const XB = {
  you: 1974, need: 2094, to: 2214, watch: 2334, this: 2394, the: 2833, fix: 2990, is: 3230,
  starting: 3517, from: 3757, your: 4057, own: 4237,
};
export type XBeats = typeof XB;
// the clean exit every variant ends with: done by `own` (<= 150 ms)
export const EXIT_MS = 130;
export const exitP = (t: number, b: XBeats) => easeIn2(win(t, b.own - EXIT_MS, b.own));
