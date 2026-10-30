import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beatsOf, clamp, easeOut3, exitP, hash, holdPush, noise1, pick, win, type GBeats } from "./G-util";
// edit-k-h3v5 "lights on" (builder G, 2026-09-24), 2233 -> 5937. A billboard at night with three lamp heads
// on arms above it. A fictional slop ad hangs there under one cheap cold bulb that flickers and buzzes; on
// "slop" it stutters worse, and on WATCH it dies: the board goes black. In the dark the print is changed, and
// the three big warm lamps clank on one after another on THIS, "The" and "fix", each throwing its pool of
// light and a beam through the haze, until the real SKIMS ad is fully lit. Held under a slow push; clean exit.

const PW = 420, PH = 560, TOP = 66, FR = 8;
const LX = [0.18, 0.5, 0.82];
type Lamp = { x: number; I: number; warm: boolean; kick: number };

// the cheap bulb: a seeded stutter, worse after "slop", dead on WATCH
const flicker = (t: number, b: GBeats) => {
  if (t >= b.watch) return 0.12 * (1 - easeOut3(win(t, b.watch, b.watch + 60)));
  const f = Math.floor(t / 33.33), bad = t > b.slop ? 0.45 : 0.16;
  const drop = hash(f * 1.7 + 3) < bad ? 0.08 + 0.2 * hash(f * 2.9) : 1;
  return (0.5 + 0.12 * noise1(t / 90, 4)) * drop;
};
// a big lamp: off, a tungsten flash on the clank, settles to full
const clank = (t: number, at: number) => (t < at ? 0 : Math.min(1.3, (t - at) / 40) * (1 - 0.25 * win(t, at + 40, at + 260)) / 1.05 + 0.02);

const pool = (l: Lamp) => {
  const c = l.warm ? "255,244,226" : "205,236,226";
  const cx = l.x * PW, cy = PH * 0.42, a = clamp(l.I);
  return `radial-gradient(ellipse ${PW * 0.52}px ${PH * 0.78}px at ${cx}px ${cy}px, rgba(${c},${a}) 0%, rgba(${c},${a * 0.75}) 40%, rgba(${c},0) 100%)`;
};

const LampHead: React.FC<{ l: Lamp; left: number }> = ({ l, left }) => {
  const glow = clamp(l.I);
  const col = l.warm ? "255,226,170" : "200,240,225";
  return (
    <div style={{ position: "absolute", left: left - 30, top: TOP - 58, width: 60, height: 60, transformOrigin: "50% 100%",
      transform: `rotate(${l.kick}deg)` }}>
      <div style={{ position: "absolute", left: 28, top: 30, width: 4, height: 30, background: "#2a2a2e" }} />
      <div style={{ position: "absolute", left: 8, top: 4, width: 44, height: 28, background: "linear-gradient(180deg, #3a3a40, #151518)",
        clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 6, top: 28, width: 48, height: 8, borderRadius: "50%",
        background: `rgba(${col},${0.15 + 0.85 * glow})`, boxShadow: `0 0 ${30 * glow}px ${10 * glow}px rgba(${col},${0.7 * glow})` }} />
    </div>
  );
};

const Lights: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets, data }) => {
  const b: GBeats = beatsOf(beats);
  const slop = staticFile(pick(assets, data?.slop ?? "famA-slop-sneaker.jpg"));
  const real = staticFile(pick(assets, data?.real ?? "skims-3754962.jpg"));
  const out = exitP(t, b);
  const ons = [b.this, b.the, b.fix];
  const lamps: Lamp[] = LX.map((x, i) => {
    const big = clank(t, ons[i]);
    const kick = t < ons[i] ? 0 : 3 * Math.exp(-(t - ons[i]) / 90) * Math.sin((t - ons[i]) / 28);
    if (i === 1 && t < b.fix) return { x, I: flicker(t, b), warm: false, kick };
    return { x, I: big, warm: true, kick };
  });
  const isReal = t >= b.watch + 40;
  const amb = 0.1;
  const lit = lamps.reduce((s, l) => s + clamp(l.I), 0) / 3;
  const s = holdPush(t, b.but, b, 0.035) * (1 - 0.03 * out);
  const bx = (w - PW) / 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      {/* the night: a black ground the lamps spill onto */}
      <div style={{ position: "absolute", inset: 0, background: "#08080a", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 560px 420px at 50% 42%, rgba(${lamps[0].warm ? "255,214,160" : "190,230,215"},${0.2 * lit}), rgba(0,0,0,0) 100%)` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: "50% 55%" }}>
        {/* the board: frame, print, the lamps' light multiplied onto it */}
        <div style={{ position: "absolute", left: bx - FR, top: TOP - FR, width: PW + 2 * FR, height: PH + 2 * FR,
          background: "#141416", boxShadow: `0 30px 70px rgba(0,0,0,0.6), 0 0 ${90 * lit}px rgba(255,220,160,${0.12 * lit})` }} />
        <div style={{ position: "absolute", left: bx, top: TOP, width: PW, height: PH, overflow: "hidden", isolation: "isolate" }}>
          <Img src={isReal ? real : slop} style={{ width: PW, height: PH, objectFit: "cover", objectPosition: isReal ? "50% 40%" : "50% 62%", display: "block",
            filter: isReal ? `brightness(${1 + 0.12 * lit}) contrast(1.05)` : undefined }} />
          <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply",
            background: `${lamps.map((l) => pool(l)).join(", ")}, rgb(${amb * 255},${amb * 255},${amb * 255})` }} />
          {/* a little bloom where the lamps are hottest */}
          <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen",
            background: lamps.map((l) => `radial-gradient(ellipse ${PW * 0.25}px ${PH * 0.16}px at ${l.x * PW}px 0px, rgba(255,236,200,${0.28 * clamp(l.I - 0.2)}), rgba(255,236,200,0))`).join(", ") }} />
        </div>
        {/* beams through the haze, from each lamp head down across the board */}
        {lamps.map((l, i) => (
          <div key={`b${i}`} style={{ position: "absolute", left: bx + l.x * PW - 170, top: TOP - 30, width: 340, height: PH * 0.8,
            clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)", mixBlendMode: "screen", pointerEvents: "none",
            background: `linear-gradient(180deg, rgba(${l.warm ? "255,230,190" : "200,240,225"},${0.4 * clamp(l.I)}) 0%, rgba(255,230,190,0) 90%)` }} />
        ))}
        {lamps.map((l, i) => <LampHead key={i} l={l} left={bx + l.x * PW} />)}
      </div>
    </div>
  );
};

export const LIGHTS_KINDS = { "holo-g-lights": Lights };
