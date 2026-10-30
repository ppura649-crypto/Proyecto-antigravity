import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SHADOW, asset, clamp, exitK, lerp, push, ramp, wave } from "./C-kit";
const IO = Easing.inOut(Easing.cubic);
import { PAIR_JOIN, PILE, pileCard, pileLayout } from "./C-skims";
// reference edit K B11 (22985 → 26033) "the branding stays the same across the whole campaign": six real SKIMS ads fan
// out from behind the pile into an arc (done by ~23800); on SAME one band of light sweeps the arc and the six
// SKIMS marks light together and STAY lit to the end (~1.1 s held). v5 (law 1): the pull-back into the Library
// on WHOLE CAMPAIGN is dropped, it could not finish and hold in 770 ms; the six-ad arc is the whole campaign.

const ADS = ["skims-3754927.jpg", "skims-3755019.jpg", "skims-3754970.jpg", "skims-3754962.jpg", "skims-3754964.jpg", "skims-3754932.jpg"];
// the SKIMS mark in each ad, as fractions of the ad (centre x, centre y, width, height), measured on the stills
const MARK = [[0.5, 0.911, 0.34, 0.06], [0.5, 0.227, 0.38, 0.075], [0.5, 0.916, 0.34, 0.06],
  [0.767, 0.052, 0.28, 0.05], [0.5, 0.122, 0.32, 0.055], [0.5, 0.92, 0.36, 0.065]];
const CW = 235, CH = 420, STEP = 153;

type Pose = { cx: number; cy: number; rot: number; s: number; op: number };
const poseOf = (i: number, tMs: number, t0: number, cy0: number): Pose => {
  const fan = ramp(tMs, t0 + 100 + i * 50, t0 + 500 + i * 50, IO);
  const d = i - 2.5;
  return {
    cx: lerp(540, 540 + d * STEP, fan), cy: lerp(cy0, cy0 - 14 + d * d * 6, fan) + 2.5 * wave(tMs, 3000, i * 0.8) * fan,
    rot: lerp(0, d * 2.2, fan), s: lerp(0.6, 1, fan), op: clamp(fan * 3),
  };
};

export const Campaign: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const tSame = beats.same ?? 24725, tPile = beats.pile ?? 21667, tAnim = tPile + PAIR_JOIN;
  const cy0 = h / 2;
  const out = exitK(tMs, toMs, 150);
  const cam = lerp(1.02, 1, ramp(tMs, fromMs, fromMs + 500, IO)) * push(tMs, fromMs, toMs, 0.015);
  // the B10 pair steps back as the fan opens (same layout function, so the hand-over is seamless)
  const L = pileLayout(tMs, fps, tPile, tAnim);
  const back = ramp(tMs, fromMs, fromMs + 600, IO);
  const poses = ADS.map((_, i) => poseOf(i, tMs, fromMs, cy0));
  const order = [0, 5, 1, 4, 2, 3]; // outer ads under, middle ads on top
  // SAME: one band of light sweeps across the arc, left to right; each SKIMS mark lights as it passes
  const SW0 = tSame - 60, SWD = 420;
  const sweepX = lerp(-150, 1230, clamp((tMs - SW0) / SWD));
  const draw = clamp((tMs - SW0) / SWD * 4);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1500, opacity: 1 - out,
      transform: `scale(${cam * (1 - 0.04 * out)})` }}>
      {back < 1 && (
        <div style={{ position: "absolute", left: L.puffer.cx + 250 * back - PILE.w / 2, top: h / 2 - PILE.h / 2, width: PILE.w, height: PILE.h,
          opacity: 1 - ramp(tMs, fromMs, fromMs + 300), transform: `rotateY(${L.puffer.rotY}deg) scale(${L.puffer.scale * (1 - 0.3 * back)}) rotate(${2 + 0.6 * wave(tMs, 3400)}deg)` }}>
          {pileCard(assets, fps, tAnim, "skims-puffer.mp4", 1.2)}
        </div>
      )}
      {order.map((i) => {
        const p = poses[i];
        if (p.op <= 0) return null;
        const tPass = SW0 + SWD * ((p.cx + 150) / 1380);
        const lit = ramp(tMs, tPass - 40, tPass + 90) * (1 - 0.4 * ramp(tMs, tSame + 500, tSame + 900));
        const bandX = (sweepX - (p.cx - (CW * p.s) / 2)) / p.s;
        const m = MARK[i];
        return (
          <div key={i} style={{ position: "absolute", left: p.cx - CW / 2, top: p.cy - CH / 2, width: CW, height: CH, opacity: p.op,
            transform: `rotate(${p.rot}deg) scale(${p.s})`, boxShadow: SHADOW, overflow: "hidden", zIndex: 10 + Math.round(10 - Math.abs(i - 2.5) * 2) }}>
            <Img src={staticFile(asset(assets, ADS[i]))} style={{ width: CW, height: CH, objectFit: "cover", filter: `brightness(${1 - 0.32 * (draw > 0 ? 1 - lit : 0) * clamp(draw * 3)})` }} />
            <div style={{ position: "absolute", left: (m[0] - m[2] / 2) * CW - 6, top: (m[1] - m[3] / 2) * CH - 5, width: m[2] * CW + 12, height: m[3] * CH + 10,
              border: `4px solid rgba(255,255,255,${lit})`, background: `rgba(255,255,255,${0.12 * lit})`,
              boxShadow: `0 0 30px 8px rgba(255,236,200,${0.9 * lit}), inset 0 0 16px rgba(255,255,255,${0.7 * lit})` }} />
            {tMs >= SW0 && tMs <= SW0 + SWD && (
              <div style={{ position: "absolute", top: -40, height: CH + 80, left: bandX - 90, width: 180, transform: "skewX(-14deg)",
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,250,235,0.8), rgba(255,255,255,0))" }} />
            )}
          </div>
        );
      })}
      {back < 1 && (
        <div style={{ position: "absolute", left: lerp(L.pile.cx, 540, back) - PILE.w / 2, top: h / 2 - PILE.h / 2, width: PILE.w, height: PILE.h, zIndex: 30,
          opacity: 1 - ramp(tMs, fromMs + 300, fromMs + 600), transform: `translateY(${3 * wave(tMs, 3000)}px) scale(${lerp(1, 0.7, back)}) rotate(${-1.5 + 0.5 * wave(tMs, 3600)}deg)` }}>
          {pileCard(assets, fps, tPile, "skims-pile.mp4", 0.4)}
        </div>
      )}
    </div>
  );
};
