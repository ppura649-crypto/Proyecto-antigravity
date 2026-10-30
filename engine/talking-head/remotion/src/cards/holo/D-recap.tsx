import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { HoloPlanCard } from "./B-plan";
import { settledPlan } from "./D-adapt";
import { ClipAt, PHOTO_SHADOW, UI_SHADOW, calm, clamp, easeIn, easeInOut, lerp, mono, win } from "./D-kit";
// B22 the recap (round 2: larger, calmer, square frames). Three callbacks, each dealt in on its word:
// the URL pill types yourbrand.com big at centre (WEBSITE), then glides up to the top; the plan card (flag on
// day 30) lands bottom-left on PLAN; the SKIMS fan lands bottom-right on NEW CREATIVES. On KEEP IT ALL
// MOVING the three turn slowly together like a carousel (a turntable in depth), and keep turning to the end.

type Data = { pillMap: [number, number][] };

const Pill: React.FC<{ src: string; sec: number; fps: number; W: number }> = ({ src, sec, fps, W }) => {
  const s = W / 960, H = 200 * s;
  return (
    <div style={{ width: W, height: H, overflow: "hidden", position: "relative", boxShadow: UI_SHADOW, background: "#CFE7EF" }}>
      <ClipAt src={src} sec={sec} fps={fps} style={{ position: "absolute", width: 1200 * s, height: 600 * s, left: -120 * s, top: -200 * s }} />
    </div>
  );
};

const Fan: React.FC<{ t: number; at: number; srcs: string[] }> = ({ t, at, srcs }) => {
  const cw = 232, ch = cw * (1612 / 900);
  const o = calm(t, at + 120, 420);   // the fan opens once the stack has landed
  return (
    <div style={{ position: "relative", width: 430, height: ch + 20 }}>
      {srcs.map((s, i) => (
        <Img key={s} src={staticFile(s)} style={{ position: "absolute", left: 215 - cw / 2 + (i - 1) * 86 * o, top: 10 + Math.abs(i - 1) * 10 * o,
          width: cw, height: ch, objectFit: "cover", boxShadow: PHOTO_SHADOW, transform: `rotate(${(i - 1) * 8 * o}deg)`,
          transformOrigin: "50% 100%", zIndex: i === 1 ? 3 : 1 }} />
      ))}
    </div>
  );
};

export const HoloRecap: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets, data }) => {
  const x = easeIn(win(tMs, toMs - 180, toMs));
  // the pill: big at centre while it types, glides to the top in the beat before PLAN
  const g = easeInOut(win(tMs, beats.plan - 420, beats.plan));
  const pW = lerp(700, 600, g), pY = lerp(290, 100, g);
  // turntable from KEEP: eases in, then a slow 26 deg/s
  const kk = Math.max(0, tMs - beats.keep) / 1000;
  const turn = kk < 0.4 ? (kk * kk) / 0.8 * 26 : (kk - 0.2) * 26;
  const items = [
    { at: fromMs, cx: w / 2, cy: pY, z: 30,
      el: <Pill src={assets[0]} sec={mono(data.pillMap)(tMs)} fps={fps} W={pW} /> },
    { at: beats.plan, cx: 318, cy: 424, z: 0, el: (
      <div style={{ width: 1080 * 0.6, height: 695 * 0.6, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 695, transform: "scale(0.6)", transformOrigin: "0 0" }}>
          <HoloPlanCard tMs={tMs} w={1080} h={695} fps={fps} beats={settledPlan(fromMs)} mark={assets[1]} />
        </div>
      </div>) },
    { at: beats.creatives, cx: 812, cy: 410, z: -60, el: <Fan t={tMs} at={beats.creatives} srcs={assets.slice(2, 5)} /> },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1800, transform: `translateY(${x * -40}px)`, opacity: 1 - x }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: "50% 60%",
        transform: `rotateY(${-turn}deg) rotateX(${2 * clamp(kk / 0.6)}deg)` }}>
        {items.map((it, i) => {
          if (tMs < it.at) return null;
          const e = calm(tMs, it.at, 380);
          return (
            <div key={i} style={{ position: "absolute", left: it.cx, top: it.cy, opacity: clamp(e * 1.5),
              transform: `translate(-50%, -50%) translateZ(${it.z}px) translateY(${(1 - e) * -50}px) scale(${0.94 + 0.06 * e})` }}>
              {it.el}
            </div>
          );
        })}
      </div>
    </div>
  );
};
