import { spring } from "remotion";
// reference edit K hook-3 variants, builder G (2026-09-24): pure helpers of the spine clock (seeded, no state).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeIn3 = (x: number) => clamp(x) * clamp(x) * clamp(x);
export const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// progress 0..1 of a window [a, b] in spine ms
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
export const sp = (tMs: number, at: number, fps: number, config: SpringCfg) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: { mass: 1, ...config } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
// smooth 1D value noise in [0, 1], seeded
export const noise1 = (x: number, seed: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i * 7.13 + seed), hash((i + 1) * 7.13 + seed), u);
};

// the hook-3 words (h3 spine ms); events may override through `beats`
export const GB = {
  but: 2233, you: 2355, end: 2475, up: 2655, with: 2835, ai: 2955, slop: 3375, you2: 3705, need: 3762,
  to: 3942, watch: 4062, this: 4182, the: 4533, fix: 4690, is: 4930, starting: 5217, from: 5457,
  your: 5757, own: 5937,
};
export type GBeats = typeof GB;
export const beatsOf = (beats: Record<string, number>): GBeats => ({ ...GB, ...(beats as Partial<GBeats>) });
// the clean exit every variant ends with: done by `own` (<= 150 ms)
export const EXIT_MS = 130;
export const exitP = (t: number, b: GBeats) => easeIn2(win(t, b.own - EXIT_MS, b.own));
// the slow push on every living hold
export const holdPush = (t: number, a: number, b: GBeats, amt = 0.03) => 1 + amt * easeInOut(win(t, a, b.own));
export const SHADOW = "0 30px 70px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)";
