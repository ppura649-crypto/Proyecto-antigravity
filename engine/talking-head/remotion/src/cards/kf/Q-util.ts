import { spring } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
// keyframes-v1 family Q (2026-09-25): pure functions of the spine clock (V6 agents cover-flow, V7 buy block).

export const SERIF = `${loadSerif("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily}, Georgia, serif`;
export const SANS = `${loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily}, -apple-system, sans-serif`;
export const MONO = `"SF Mono", Menlo, "JetBrains Mono", monospace`;
export const GREEN = "#4ADE80";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
// a calm spring from spine ms `at`: over-damped, no overshoot, ~90% in ~330 ms
export const calm = (t: number, at: number, fps: number, stiffness = 190) =>
  t < at ? 0 : spring({ frame: Math.min(((t - at) / 1000) * fps, 6 * fps), fps, config: { damping: 30, stiffness, mass: 1 } });

// the card's clean exit: <=150 ms before toMs, fade + a 3% settle back
export const exitOf = (t: number, toMs: number) => {
  const k = clamp((t - (toMs - 150)) / 150);
  return { opacity: 1 - k * k, scale: 1 - 0.03 * k };
};
// content box of every family-Q card: 1080 x 614 (the LOW band)
export const BW = 1080, BH = 614;
