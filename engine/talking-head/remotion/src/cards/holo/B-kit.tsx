import React from "react";
import { Easing, OffthreadVideo, Sequence, interpolate, spring, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Figtree";
// reference edit K family B (2026-09-23): shared bits. Holo's UI type reads as Figtree (Branding overview, chips).
export const HOLO_FONT = `${loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily}, "Plus Jakarta Sans", Inter, -apple-system, sans-serif`;
export const INK = "#111111";
export const INK2 = "#2E2E2E";
export const MUTED = "#8A8A8A";
export const CHIP = "#EFEFEF";
export const GREEN = "#34C759";
export const SHADOW = "0 28px 60px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.35)";

// a spring that starts at spine ms t0 (0 before it). v2 (their note "slightly too energetic"): calm, near
// critically damped (overshoot ~1% at most), settles in ~350 ms. The per-call cfg is ignored on purpose.
export const sp = (tMs: number, t0: number, fps: number, _cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  tMs < t0 ? 0 : spring({ frame: Math.min(((tMs - t0) / 1000) * fps, 8 * fps), fps, config: { damping: 20, stiffness: 170, mass: 0.75 } });

export const lerp = (t: number, a: number, b: number, from: number, to: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// multi-stop interpolation, clamped, eased between stops
export const path = (t: number, ts: number[], vs: number[]) =>
  interpolate(t, ts, vs, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

// deterministic 0..1 hash (no Math.random: frames render out of order)
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// A clip retimed piecewise: each segment maps spine ms [t0,t1) to source seconds [s0,s1].
// Only the active segment's video is mounted.
export type Seg = { t0: number; t1: number; s0: number; s1: number };
export const RemapVideo: React.FC<{ tMs: number; fps: number; src: string; segs: Seg[]; style: React.CSSProperties }> = ({ tMs, fps, src, segs, style }) => {
  let i = segs.findIndex((g) => tMs >= g.t0 && tMs < g.t1);
  if (i < 0) i = tMs < segs[0]!.t0 ? 0 : segs.length - 1;
  const g = segs[i]!;
  const rate = (g.s1 - g.s0) / ((g.t1 - g.t0) / 1000);
  return (
    <Sequence key={i} from={Math.ceil((g.t0 / 1000) * fps)} layout="none">
      <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={Math.round(g.s0 * fps)} style={style} />
    </Sequence>
  );
};

// the white rounded ground Holo's UI sits on (the curtain behind them is dark gold)
export const whiteGround = (r = 0): React.CSSProperties => ({
  background: "#FFFFFF", borderRadius: r, boxShadow: SHADOW, overflow: "hidden",
});
