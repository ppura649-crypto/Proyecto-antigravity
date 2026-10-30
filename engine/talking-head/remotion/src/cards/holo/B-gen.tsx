import React from "react";
import { Easing } from "remotion";
import type { CardProps } from "../props";
import { RemapVideo, SHADOW, lerp, sp } from "./B-kit";
import { HoloPlanCard } from "./B-plan";
// B5/B6 wrapper: the plan card rises in on THEN, lives with a slow push and a small drift, and leaves with a
// short calm exit (v2: "slightly less energetic", square corners).
export const Plan: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const enter = data?.enterMs ?? 12100, exit = data?.exitMs ?? 15700;
  const e = sp(tMs, enter, fps);
  const ex = lerp(tMs, exit - 160, exit, 0, 1, Easing.inOut(Easing.quad));
  const push = lerp(tMs, enter, exit, 1, 1.025, Easing.linear);
  const ry = lerp(tMs, enter, exit, -2, 2, Easing.inOut(Easing.sin));
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%", opacity: 1 - ex,
        transform: `translateY(${(1 - e) * 60 - 16 * ex}px) rotateX(${(1 - e) * -12}deg) rotateY(${ry}deg) scale(${(0.95 + 0.05 * e) * push * (1 - 0.03 * ex)})` }}>
        <HoloPlanCard tMs={tMs} w={w} h={h} fps={fps} beats={beats} mark={assets[0]!} data={data?.plan} />
      </div>
    </div>
  );
};

// B7 "And just with that, it automatically generates": Holo's own promo shot (url-drop 12.0-16.3 s, cut as
// famB-wall.mp4): the Generating tile, the camera pulling back over the empty grid, the grid filling into a wall
// of finished ads. v2 round 2 (law 1): the fill runs over "automatically" and the COMPLETE wall is on screen
// from ~700 ms before the hand-over (source 3.8 s, the first frame with every tile filled; held on 3.8-4.12 s, before the blurred zoom), held with a slow
// push. Full width, centred in the band, square ground, short calm exit at 17750 for family C.
export const Wall: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, assets }) => {
  const full = toMs - 720;
  const W = Math.min(w - 40, 1040), VH = (W * 900) / 1600;
  const e = sp(tMs, fromMs, fps);
  const ex = lerp(tMs, toMs - 120, toMs, 0, 1, Easing.in(Easing.cubic));
  const push = lerp(tMs, fromMs, toMs, 1, 1.02, Easing.linear);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", left: (w - W) / 2, top: (h - VH) / 2, width: W, height: VH, overflow: "hidden",
        background: "#FFFFFF", boxShadow: SHADOW, opacity: Math.min(1, e * 2) * (1 - ex),
        transform: `translateY(${(1 - e) * 20}px) scale(${(0.97 + 0.03 * e) * push * (1 - 0.03 * ex)})`,
      }}>
        <RemapVideo tMs={tMs} fps={fps} src={assets[0]!} segs={[
          { t0: fromMs, t1: full - 830, s0: 0.6, s1: 1.6 },
          { t0: full - 830, t1: full, s0: 1.6, s1: 3.8 },
          { t0: full, t1: toMs + 60, s0: 3.8, s1: 4.12 },
        ]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};
