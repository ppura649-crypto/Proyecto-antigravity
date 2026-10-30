import React from "react";
import { Freeze, OffthreadVideo, spring, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
// reference edit K family D (B15-B22) shared bits: time helpers, a retimed clip, Holo's type and grounds.
loadFont("normal", { weights: ["500", "600", "700", "800"] });

export const HFONT = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
export const INK = "#111111";
export const GREEN = "#34C759";
export const UI_SHADOW = "0 16px 40px rgba(0,0,0,0.5), 0 5px 14px rgba(0,0,0,0.3)";
export const PHOTO_SHADOW = "0 18px 44px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.4)";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeOut = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
export const easeIn = (p: number) => Math.pow(clamp(p), 3);
export const easeInOut = (p: number) => {
  const x = clamp(p);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** progress of a linear window [a, b] in ms */
export const win = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1, b - a));

/** spring that starts at atMs (spine ms); 0 before it. */
export const sp = (tMs: number, atMs: number, fps: number, cfg?: { damping?: number; stiffness?: number; mass?: number }) =>
  tMs < atMs ? 0 : spring({ frame: ((tMs - atMs) / 1000) * fps, fps, config: { damping: 13, stiffness: 190, mass: 0.8, ...cfg } });

/** Monotone cubic (Fritsch-Carlson) through [x, y] points: smooth, never overshoots, clamps at the ends. */
export const mono = (pts: [number, number][]) => {
  const n = pts.length;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
  };
};

/** A clip frozen on an exact source second (retiming = any function of tMs -> seconds). */
export const ClipAt: React.FC<{ src: string; sec: number; fps: number; style: React.CSSProperties }> = ({ src, sec, fps, style }) => (
  <Freeze frame={Math.max(0, Math.round(sec * fps))}>
    <OffthreadVideo src={staticFile(src)} muted style={style} />
  </Freeze>
);

/** seeded 0..1 */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Round 3: every card keeps its pixels inside 0..h; the lowest solid edge sits at h - BOTTOM. */
export const BOTTOM = 34;

/** Round 2 (calmer): a no-overshoot ease-out that starts at atMs and settles in `ms` (0 before, 1 after). */
export const calm = (tMs: number, atMs: number, ms = 380) => 1 - Math.pow(1 - clamp((tMs - atMs) / ms), 4);
