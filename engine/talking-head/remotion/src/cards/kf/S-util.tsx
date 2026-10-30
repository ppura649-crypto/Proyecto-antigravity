import type React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
// keyframes-v1 family S (builder S, 2026-09-25): shared helpers for V12 blinds, V13 invoice, V14 record, V17 spot.
// Every card is a pure function of the spine clock (tMs). LOW band: 1080 x 614.

export const SANS = `${loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily}, -apple-system, sans-serif`;
export const MONO = `${loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}, Menlo, monospace`;
export const GREEN = "#4ADE80";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const ramp = (t: number, a: number, b: number, e: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const outC = Easing.out(Easing.cubic);
export const inQ = Easing.in(Easing.quad);
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
export const beat = (b: Record<string, number>, k: string, d: number) => (typeof b[k] === "number" ? b[k]! : d);

// a damped spring settle: 0 -> 1 with little or no overshoot (zeta ~0.8)
export const settle = (t: number, at: number, ms: number) => {
  if (t <= at) return 0;
  const x = (t - at) / ms;
  if (x >= 1.6) return 1;
  const w = 7.2, z = 0.82, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
};

// the whole visual: slow push across its life, a clean <= 130 ms exit at toMs
export const EXIT = 130;
export const life = (t: number, fromMs: number, toMs: number, push = 0.03, origin = "50% 50%"): React.CSSProperties => {
  const p = ramp(t, fromMs, toMs, Easing.inOut(Easing.quad));
  const out = ramp(t, toMs - EXIT, toMs, Easing.in(Easing.quad));
  return { position: "absolute", inset: 0, transformOrigin: origin, opacity: 1 - out,
    transform: `scale(${(1 + push * p) * (1 - 0.03 * out)})` };
};

export const CW = 1080, CH = 614;
export const box = (w: number, h: number): React.CSSProperties => ({
  position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH, overflow: "hidden",
});
