import { Easing, interpolate, spring } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
// reference edit K family E (2026-09-24): hooks 4 and 5 (the Claude chat -> Holo hand-over). Pure functions of the
// spine clock. Their note on video 1: calm, one move at a time, no overshoot, square grounds.

export const SERIF = `${loadSerif("normal", { weights: ["400", "600", "700"], subsets: ["latin"] }).fontFamily}, Georgia, serif`;
export const SANS = `${loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily}, -apple-system, sans-serif`;
export const HOLO = `${loadJakarta("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily}, "Figtree", Inter, sans-serif`;

// claude.ai light theme (checked against Mobbin captures of claude.ai web, 2026)
export const CREAM = "#FAF9F5", BUBBLE = "#F0EEE6", INK = "#141413", MUTED = "#73726C", LINE = "#E6E3D9";
export const CLAY = "#D97757"; // the send button + the spark
export const SHADOW = "0 26px 60px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
// eased 0..1 over [a,b] spine ms
export const ramp = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
// a calm spring from spine ms `at`: slightly over-damped (no overshoot), ~90% in 330 ms
export const calm = (t: number, at: number, fps: number) =>
  t < at ? 0 : spring({ frame: Math.min(((t - at) / 1000) * fps, 6 * fps), fps, config: { damping: 30, stiffness: 190, mass: 1 } });
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

export type BeatsE = Record<string, number>;
// geometry of the 1080 x 634 card (band y 182 -> 816)
export const CW = 1080, CH = 634;
// B1's URL pill centre as it lands now (B1 centred in the band with the logo: frame y 572), in this card's coords
export const FIELD = { x: 50, y: 269.6, w: 980, h: 241 };
