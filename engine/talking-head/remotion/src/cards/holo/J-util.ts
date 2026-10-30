import type React from "react";
import { Easing, interpolate, spring } from "remotion";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
// reference edit K hook 4 round 2 (2026-09-24), builder J: shared helpers. Everything is a pure function of the
// spine clock. Visual window AND 1805 -> WHOLE 5655; the Holo hand-over (famE solo) takes over at 5655.

export const JAKARTA = `${loadJakarta("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily}, "Figtree", Inter, sans-serif`;

// h4's words (spine ms); events carry the same table in `beats`
export const JB = {
  and: 1805, then: 2045, doing: 2225, every: 2465, ad: 2765, yourself: 3005, you: 3725, need: 3844, to: 4025,
  watch: 4145, this: 4205, you2: 4633, can: 4755, now: 4875, hand: 5055, over: 5235, that: 5415, whole: 5655,
};
export type JBeats = typeof JB;
export const beatsOf = (b: Record<string, number>): JBeats => ({ ...JB, ...(b as Partial<JBeats>) });

export const CW = 1080, CH = 634; // the content box (hFrac 0.33)

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
export const ramp = (t: number, a: number, b: number, e: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
// a calm spring from spine ms `at`: no overshoot, ~90% in 330 ms
export const calm = (t: number, at: number, fps: number) =>
  t < at ? 0 : spring({ frame: Math.min(((t - at) / 1000) * fps, 6 * fps), fps, config: { damping: 30, stiffness: 190, mass: 1 } });
// a weighted spring with a small settle (for objects that land)
export const land = (t: number, at: number, fps: number) =>
  t < at ? 0 : spring({ frame: Math.min(((t - at) / 1000) * fps, 6 * fps), fps, config: { damping: 18, stiffness: 210, mass: 0.9 } });
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// the stage: enters on its first frame (a short settle from 1.04), a slow push on the whole window,
// a clean 140 ms exit into the Holo hand-over at toMs
export const stage = (t: number, fromMs: number, toMs: number, push = 0.04): React.CSSProperties => {
  const inn = ramp(t, fromMs, fromMs + 260, Easing.out(Easing.cubic));
  const ex = ramp(t, toMs - 140, toMs, Easing.in(Easing.cubic));
  const p = 1 + push * ramp(t, fromMs, toMs, Easing.linear);
  return {
    position: "absolute", left: 0, top: 0, width: CW, height: CH,
    transform: `scale(${p * mix(1.04, 1, inn) * mix(1, 0.965, ex)}) translateY(${-14 * ex}px)`,
    opacity: 1 - ex, transformOrigin: "50% 50%",
  };
};
