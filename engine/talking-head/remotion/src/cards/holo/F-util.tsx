import React from "react";
import { spring } from "remotion";
// reference edit K hook round 2, builder F (2026-09-24): pure helpers of the spine clock for the h2 variants.
// Seeded noise only, no state. Window: title ends 1707, visual 1707 -> 4404 (own-brand card after).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeOut5 = (x: number) => 1 - Math.pow(1 - clamp(x), 5);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const sp = (t: number, at: number, fps: number, damping = 20, stiffness = 160, mass = 1) =>
  t < at ? 0 : spring({ frame: ((t - at) / 1000) * fps, fps, config: { damping, stiffness, mass } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// h2 words (video-2 spine ms); an event's `beats` may override any of them
export const FB = {
  here: 1707, is: 1824, how: 2004, to: 2124, not: 2304, blend: 2424, in: 2784, the: 3000, fix: 3157,
  is2: 3397, starting: 3684, from: 3924, your: 4224, own: 4404,
};
export type FBeats = typeof FB;
export const beatsOf = (beats: Record<string, number>): FBeats => ({ ...FB, ...(beats as Partial<FBeats>) });

// the drained, samey look: every AI ad washed into the same flat beige
export const WASH = "grayscale(1) sepia(0.85) saturate(0.62) contrast(0.78) brightness(0.98)";
// the same wash, a touch darker: a bright real ad sinks back into the crowd
export const WASH_HERO = "grayscale(1) sepia(0.85) saturate(0.62) contrast(0.78) brightness(0.84)";
export const SLOP = ["famA-slop-serum.jpg", "famA-slop-pyjama.jpg", "famA-slop-sneaker.jpg", "famA-slop-bike.jpg", "famA-slop-dog.jpg"];

// the clean exit every variant ends with (<= 130 ms before `own`) and the stage box (1080 x 634)
export const EXIT = 130;
export const exitP = (t: number, b: FBeats) => easeIn2(win(t, b.own - EXIT, b.own));
export const BW = 1080, BH = 634;
export const Stage: React.FC<{ w: number; h: number; t: number; b: FBeats; bg?: string; children: React.ReactNode }> =
  ({ w, h, t, b, bg, children }) => {
    const out = exitP(t, b);
    return (
      <div style={{ position: "absolute", left: (w - BW) / 2, top: (h - BH) / 2, width: BW, height: BH, overflow: "hidden",
        opacity: 1 - out, transform: `scale(${1 - 0.03 * out})`,
        background: bg ?? "radial-gradient(ellipse 75% 85% at 50% 40%, #1c1c20 0%, #0c0c0f 62%, #060607 100%)" }}>
        {children}
      </div>
    );
  };

// a directional gaussian blur as an SVG filter (real motion blur along one axis)
export const DirBlur: React.FC<{ id: string; sx: number; sy: number }> = ({ id, sx, sy }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} />
    </filter>
  </svg>
);
