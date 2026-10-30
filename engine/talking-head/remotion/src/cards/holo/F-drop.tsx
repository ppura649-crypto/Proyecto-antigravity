import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { DirBlur, Stage, WASH, beatsOf, easeInOut, easeOut3, lerp, pick, win } from "./F-util";
// edit-k-h2v5 "the backdrop drops" (builder F, 2026-09-24), 1707 -> 4404. A studio backdrop hangs from a pole,
// printed edge to edge with the same washed AI ad on repeat, like wallpaper; it breathes in the draft. On NOT the
// left clamp springs open and that corner sags, a slice of real colour behind it; on IN the right clamp goes and the
// whole sheet drops with gravity, curling toward us, motion-blurred, out of frame: behind it the real SKIMS ad stands
// lit in the studio and sways once in the air the paper pushed. Held under a slow push; 130 ms exit.
const TW = 168, TH = 252, GAP = 22, HW = 330, HH = 560, POLE = 20;
const CLAMPS = [140, 940];
const G = 15000;                                    // px/s^2: the sheet falls out of frame in ~0.3 s

const Pattern: React.FC<{ src: string }> = ({ src }) => (
  <>{[-1, 0, 1].map((r) => [-3, -2, -1, 0, 1, 2, 3].map((c) => (
    <div key={`${r}.${c}`} style={{ position: "absolute", left: 540 + c * (TW + GAP) - TW / 2 + (r % 2 ? (TW + GAP) / 2 : 0),
      top: 330 + r * (TH + GAP) - TH / 2, width: TW, height: TH, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: WASH }} />
    </div>
  )))}</>
);

const Clamp: React.FC<{ x: number; open: number }> = ({ x, open }) => (
  <div style={{ position: "absolute", left: x - 22, top: POLE - 6, width: 44, height: 46, transformOrigin: "50% 0%",
    transform: `rotate(${-38 * open}deg)`, borderRadius: 5,
    background: "linear-gradient(90deg, #1a1a1c 0%, #45464b 45%, #1a1a1c 100%)", boxShadow: "0 6px 12px rgba(0,0,0,0.6)" }} />
);

export const Drop: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b = beatsOf(beats);
  const hero = staticFile(pick(assets, data?.hero ?? "skims-3754970.jpg"));
  const copy = staticFile(pick(assets, data?.copy ?? "famA-slop-pyjama.jpg"));
  const rel1 = b.not, rel2 = b.in - 40;
  // left corner sags around the right clamp: a damped swing that settles at -7 degrees
  const u1 = Math.max(0, t - rel1) / 1000;
  const sag = t < rel1 ? 0 : -7 * (1 - Math.exp(-u1 * 9) * Math.cos(u1 * 16));
  // then the whole sheet falls: free fall, curling toward the camera from its top edge
  const u2 = Math.max(0, t - rel2) / 1000;
  const fall = 0.5 * G * u2 * u2;
  const vel = G * u2;
  const curl = -34 * easeOut3(win(t, rel2, rel2 + 300));
  const gone = fall > 1100;
  const breathe = t < rel1 ? Math.sin((t - b.here) / 380) * 0.9 : 0;
  const shutter = 500 / fps / 1000;
  const blurY = Math.min(40, vel * shutter * 0.35);
  const sway = t < rel2 + 120 ? 0 : 3.2 * Math.sin((t - rel2 - 120) / 95) * Math.exp(-(t - rel2 - 120) / 380);
  const reveal = win(t, rel2 + 60, rel2 + 360);
  const push = 1 + 0.045 * easeInOut(win(t, b.here, b.own));
  const id = `fdrop-${Math.round(t)}`;
  return (
    <Stage w={w} h={h} t={t} b={b} bg="radial-gradient(ellipse 42% 70% at 50% 48%, #4d4239 0%, #241e1a 55%, #0c0a09 100%)">
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        {/* behind: the real ad standing in the studio, a key light from the left */}
        <div style={{ position: "absolute", left: 540 - HW / 2, top: 634 / 2 - HH / 2 + 8, width: HW, height: HH, overflow: "hidden",
          transformOrigin: "50% 0%", transform: `perspective(1200px) rotateY(${sway}deg)`,
          filter: `brightness(${lerp(0.7, 1, reveal)})`, boxShadow: "0 30px 70px rgba(0,0,0,0.75)" }}>
          <Img src={hero} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", left: 540 - 260, top: 634 / 2 + HH / 2, width: 520, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", filter: "blur(12px)" }} />
        {/* the pole */}
        <div style={{ position: "absolute", left: -20, right: -20, top: 0, height: POLE,
          background: "linear-gradient(180deg, #55565b 0%, #232326 100%)", boxShadow: "0 4px 10px rgba(0,0,0,0.6)", zIndex: 3 }} />
        {/* the backdrop */}
        {!gone && (
          <div style={{ position: "absolute", left: -10, top: POLE - 2, width: 1100, height: 660, perspective: 1400, zIndex: 2 }}>
            {blurY > 0.6 && <DirBlur id={id} sx={0.3} sy={blurY} />}
            <div style={{ position: "absolute", inset: 0, transformOrigin: `${CLAMPS[1] + 10}px 0px`,
              transform: `translateY(${fall}px) rotate(${sag}deg) rotateX(${curl + breathe}deg)`,
              background: "linear-gradient(180deg, #e7e0d2 0%, #d8d0c0 100%)", overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)", filter: blurY > 0.6 ? `url(#${id})` : undefined }}>
              <Pattern src={copy} />
              {/* paper shading: a soft fold of light across the sheet */}
              <div style={{ position: "absolute", inset: 0,
                background: `linear-gradient(${100 + sag * 2}deg, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.12 + 0.02 * Math.abs(sag)}) 100%)` }} />
            </div>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>
          <Clamp x={CLAMPS[0]} open={easeOut3(win(t, rel1, rel1 + 90))} />
          <Clamp x={CLAMPS[1]} open={easeOut3(win(t, rel2, rel2 + 90))} />
        </div>
      </div>
    </Stage>
  );
};
export const DROP_ASSETS = ["famA-slop-pyjama.jpg", "skims-3754970.jpg"];
