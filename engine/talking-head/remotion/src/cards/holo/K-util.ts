import type React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
// reference edit K hook-5 variants (builder K, 2026-09-24): "If your marketing plan from Claude just became another to-do
// list, you need to watch this." Visual window JUST 1611 -> "whole" 5155. Pure functions of the spine clock.

export const HAND = `${loadCaveat("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily}, cursive`;
export const SANS = `${loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily}, -apple-system, sans-serif`;
export const MONO = `${loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}, Menlo, monospace`;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// eased 0..1 over [a, b] spine ms
export const ramp = (t: number, a: number, b: number, e: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const outC = Easing.out(Easing.cubic);
export const inC = Easing.in(Easing.cubic);
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// hook-5 words, video-5 spine ms (an event's beats override them)
export const KB = {
  just: 1611, became: 1911, another: 2091, todo: 2391, list: 2931, you: 3261, need: 3351, to: 3471,
  watch: 3591, this: 3771, can: 4255, hand: 4555, whole: 5155,
};
export type KBeats = typeof KB;
export const beatsOf = (b: Record<string, number>): KBeats => ({ ...KB, ...(b as Partial<KBeats>) });

// the card: 1080 x 634 (hFrac 0.33), centred in the band
export const CW = 1080, CH = 634;
export const EXIT = 130;
// the whole visual: a slow push across its life and a clean <= 130 ms exit at `whole`
export const wrap = (t: number, b: KBeats, push = 0.035, origin = "50% 50%"): React.CSSProperties => {
  const life = ramp(t, b.just, b.whole, Easing.inOut(Easing.quad));
  const out = ramp(t, b.whole - EXIT, b.whole, Easing.in(Easing.quad));
  return { position: "absolute", inset: 0, transformOrigin: origin, opacity: 1 - out,
    transform: `scale(${(1 + push * life) * (1 - 0.03 * out)})` };
};
// the card box every variant draws in (clipped: nothing of ours leaks out of the band)
export const box = (w: number, h: number): React.CSSProperties => ({
  position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH, overflow: "hidden",
});

// the plan Claude gave, as the to-do list it became (plausible plan items, nothing claimed)
export const TODOS = [
  "Write 5 Instagram posts", "Shoot 3 product videos", "Design 4 ad creatives", "Draft the welcome emails",
  "Launch the first Meta ads", "Post daily on TikTok", "Reply to every comment", "Test 2 headlines per ad",
  "Write 2 blog posts", "Collect 3 reviews", "Retarget site visitors", "Plan next month",
];
