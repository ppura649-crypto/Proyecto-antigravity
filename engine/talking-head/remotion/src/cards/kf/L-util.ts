import { spring } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
// keyframes-v1 builder L (2026-09-25): pure helpers of the spine clock for the hook splicer (V2).
export const MONO = `${loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}, Menlo, monospace`;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeIn3 = (x: number) => Math.pow(clamp(x), 3);
export const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
export const sp = (tMs: number, at: number, fps: number, config: { damping: number; stiffness: number; mass?: number }) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: { mass: 1, ...config } });

// the hook words, keyframes-v1 spine ms (captions.json page 0 + the word pages); an event's beats override them
export const LB = { ai: 0, edits: 304, all: 664, of: 844, my: 904, videos: 1024, now: 1144, got: 2357, this: 2537, account: 2717, from: 2997 };
export type LBeats = typeof LB;
export const beatsOf = (b: Record<string, number>): LBeats => ({ ...LB, ...(b as Partial<LBeats>) });

// film geometry (design px, card 1080 x 490): 35 mm print stock at 10.4 px/mm
export const PITCH = 150, SH = 360, FW = 140, FH = 250, FY = 55, SY = 90; // frame pitch, strip height, window, strip top
export const PERF = { w: 21, h: 29, edge: 13, pitch: 50, x0: 14.5 };
export const BASE = "#120d09";
export const CY = SY + SH / 2;                                               // strip centre line (270)
