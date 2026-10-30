import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, beatsOf, clamp, mix, pick, ramp, stage, type JBeats } from "./J-util";
// h4v5 (builder J, 2026-09-24): "the roller". A plaster wall with four blank poster sheets pasted up. By hand, a
// brush paints the first real ad onto its sheet, one stroke per word (DOING, EVERY, AD, YOURSELF): four bands and it
// is still not done. On WATCH a paint roller as tall as the wall runs across it in one pass and leaves all four sheets
// finished ads, wet for a moment, then dry. Held under a slow push until the Holo hand-over.

const N = 4, PW = 236, PHt = 420, GAP = 16;
const PX = (i: number) => (CW - (N * PW + (N - 1) * GAP)) / 2 + i * (PW + GAP), PY = (CH - PHt) / 2;
const ADS = ["skims-3754962.jpg", "W-cf-08.jpg", "crocs-5139685.jpg", "skims-3754927.jpg"];
const POS = ["50% 40%", "50% 30%", "0% 50%", "50% 40%"];
export const ROLLER_ASSETS = ADS;
// the four brush strokes on ad 0: centre y (in the poster), tilt, and the word it starts on
const STROKES = [{ y: 66, r: -5 }, { y: 170, r: 4 }, { y: 266, r: -3 }, { y: 360, r: 5 }];
const SH = 92;

const strokeP = (k: number, t: number, b: JBeats) => {
  const at = [b.doing, b.every, b.ad, b.yourself][k];
  return ramp(t, at, at + 340, Easing.inOut(Easing.quad));
};
const rollerX = (t: number, b: JBeats) => mix(-120, CW + 140, ramp(t, b.watch - 60, b.watch + 520, Easing.inOut(Easing.cubic)));

// a flat paint brush seen from the side: bristles (paint on the tips), ferrule, a tapered wooden handle
const Brush: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: o, transform: "rotate(-40deg)" }}>
    <div style={{ position: "absolute", left: 40, top: 26, width: 240, height: 30, background: "rgba(0,0,0,0.25)", filter: "blur(8px)" }} />
    <div style={{ position: "absolute", left: 0, top: -30, width: 58, height: 60, clipPath: "polygon(0 12%, 100% 0, 100% 100%, 0 88%)",
      background: "linear-gradient(90deg, #b98c7a 0%, #d8b39f 22%, #2a211a 40%, #4a3a2b 100%)" }} />
    <div style={{ position: "absolute", left: 0, top: -30, width: 58, height: 60, clipPath: "polygon(0 12%, 100% 0, 100% 100%, 0 88%)",
      background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, rgba(0,0,0,0) 1px 4px)" }} />
    <div style={{ position: "absolute", left: 56, top: -32, width: 40, height: 64, background: "linear-gradient(180deg, #eef0f2, #a3a9b0 50%, #6a6f76)" }} />
    <div style={{ position: "absolute", left: 94, top: -15, width: 190, height: 30, clipPath: "polygon(0 0, 100% 22%, 100% 78%, 0 100%)",
      background: "linear-gradient(180deg, #e2c08e, #b0834b 55%, #7a5630)" }} />
  </div>
);

export const Roller: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, assets }) => {
  const b = beatsOf(beats);
  const R = rollerX(t, b);
  const speed = Math.abs(rollerX(t, b) - rollerX(t - 16, b)); // px per ~frame half
  const passed = (i: number) => clamp((R - PX(i)) / PW);
  // the brush rides the head of the stroke being painted, leaves on YOU
  const active = [3, 2, 1, 0].find((k) => t >= [b.doing, b.every, b.ad, b.yourself][k]) ?? 0;
  const sp = strokeP(active, t, b);
  const at = [b.doing, b.every, b.ad, b.yourself][active];
  const prevY = STROKES[Math.max(0, active - 1)].y;
  const approach = 1 - ramp(t, fromMs, b.doing, Easing.out(Easing.cubic)); // it comes in to the first sheet
  const brushX = PX(0) - 14 + (PW + 28) * (active % 2 ? 1 - sp : sp) + 260 * approach;
  const brushY = PY + mix(prevY, STROKES[active].y, ramp(t, at - 40, at + 140)) - 200 * approach;
  const brushOut = ramp(t, b.you, b.you + 320);
  return (
    <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>
      <div style={{ ...stage(t, fromMs, toMs, 0.04), overflow: "hidden",
        background: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.08), rgba(0,0,0,0) 45%), repeating-linear-gradient(115deg, rgba(0,0,0,0.025) 0 2px, rgba(0,0,0,0) 2px 7px), linear-gradient(180deg, #c9c4ba, #b3ada2)" }}>
        {/* the four blank sheets, pasted up and waiting */}
        {ADS.map((a, i) => (
          <div key={`s${a}`} style={{ position: "absolute", left: PX(i), top: PY, width: PW, height: PHt,
            background: "linear-gradient(170deg, #fbf9f4 0%, #efebe2 55%, #f6f3ec 100%)", boxShadow: "0 2px 6px rgba(0,0,0,0.22)" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, rgba(0,0,0,0) 1px 46px)" }} />
          </div>
        ))}
        {/* the brush strokes on ad 0 (each band shows the ad under it, bristle marks along it) */}
        {STROKES.map((s, k) => {
          const p = strokeP(k, t, b);
          if (p <= 0) return null;
          const len = (PW + 28) * p, left = k % 2 ? PX(0) - 14 + (PW + 28) - len : PX(0) - 14;
          return (
            <div key={k} style={{ position: "absolute", left: PX(0) - 14, top: PY + s.y - SH / 2, width: PW + 28, height: SH,
              transform: `rotate(${s.r}deg)`, clipPath: `inset(0 ${PX(0) - 14 + PW + 28 - (left + len)}px 0 ${left - (PX(0) - 14)}px round 30px)` }}>
              <div style={{ position: "absolute", left: 14, top: -(s.y - SH / 2), width: PW, height: PHt, transformOrigin: `${-14 + (PW + 28) / 2}px ${s.y}px`,
                transform: `rotate(${-s.r}deg)` }}>
                <Img src={staticFile(pick(assets, ADS[0]))} style={{ width: PW, height: PHt, objectFit: "cover", objectPosition: POS[0] }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.09) 0 2px, rgba(0,0,0,0.07) 2px 5px, rgba(0,0,0,0) 5px 9px)" }} />
            </div>
          );
        })}
        {/* the pasted ads, revealed behind the roller, wet then dry */}
        {ADS.map((a, i) => {
          const f = passed(i);
          if (f <= 0) return null;
          const wet = 1 - ramp(t, b.watch + 520, b.watch + 1000);
          return (
            <div key={a} style={{ position: "absolute", left: PX(i), top: PY, width: PW, height: PHt, overflow: "hidden",
              clipPath: `inset(0 ${(1 - f) * PW}px 0 0)`, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
              <Img src={staticFile(pick(assets, a))} style={{ width: PW, height: PHt, objectFit: "cover", objectPosition: POS[i] }} />
              <div style={{ position: "absolute", inset: 0, opacity: 0.55 * wet,
                background: "linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 70%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, rgba(0,0,0,0) 1px 38px)" }} />
            </div>
          );
        })}
        {brushOut < 1 && <Brush x={brushX + 60 * brushOut} y={brushY - 110 * brushOut} o={1 - brushOut} />}
        {/* the roller: a nap cylinder as tall as the wall on its frame, blurred with its speed */}
        {R > -110 && R < CW + 130 && (
          <div style={{ position: "absolute", left: R - 40, top: 10, width: 80, height: CH - 20, filter: speed > 6 ? `blur(${Math.min(6, speed / 10)}px)` : undefined }}>
            <div style={{ position: "absolute", left: 36, top: -60, width: 8, height: 64, background: "linear-gradient(90deg, #8d9299, #e2e4e7, #7a7f86)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 14,
              background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 2px, rgba(255,255,255,0.08) 2px 4px, rgba(0,0,0,0) 4px 7px) 0 ${R * 0.9}px / 100% 7px,
                linear-gradient(90deg, #6f6a62 0%, #efe9df 38%, #fbf6ee 50%, #d8d1c5 70%, #5e5a53 100%)`,
              boxShadow: "18px 0 40px rgba(0,0,0,0.35), -6px 0 18px rgba(0,0,0,0.2)" }} />
          </div>
        )}
      </div>
    </div>
  );
};
