import React from "react";
import type { CardProps } from "../props";
import { Easing } from "remotion";
import { Clip, Phone, SHADOW, asset, exitK, lerp, push, ramp, wave } from "./C-kit";
const IO = Easing.inOut(Easing.cubic);
// reference edit K B9 + B10 (family C): the SKIMS product videos in two phones, then Holo's own SKIMS animations.

// B9 (19867 → 21667) "even product videos like these": phone 1 rises playing ugc-1, on LIKE THESE it
// steps left and phone 2 swings in from the right playing ugc-2. Both from a full-body stretch, player bar out.
export const UgcPhones: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const tLike = beats.like ?? 20972;
  // v5: full band height, centred; phone 2 joins fast on LIKE THESE so both are held together before B10
  const PW = 300, PH = 580, cy = h / 2;
  const rise = ramp(tMs, fromMs, fromMs + 300);
  const split = ramp(tMs, tLike, tLike + 280, IO);
  const in2 = ramp(tMs, tLike + 40, tLike + 300);
  const out = exitK(tMs, toMs, 170);
  const cam = push(tMs, fromMs, toMs, 0.02);
  const screen = (file: string, start: number, from: number) => (
    <Clip src={asset(assets, file)} startMs={start} fromSec={from} fps={fps}
      style={{ left: "-6%", top: "-3%", width: "112%", height: "106%", objectFit: "cover" }} />
  );
  const p1 = { cx: lerp(540, 370, split), cy: cy + 3 * wave(tMs, 3200), rot: lerp(0, -2, split) };
  const p2 = { cx: lerp(790, 710, in2), cy: cy + 3 * wave(tMs, 3200, 1.7), rot: lerp(4, 2, in2) };
  const box = (p: { cx: number; cy: number; rot: number }, extra = ""): React.CSSProperties => ({
    position: "absolute", left: p.cx - PW / 2, top: p.cy - PH / 2, width: PW, height: PH,
    transform: `rotate(${p.rot}deg) ${extra}`,
  });
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600, opacity: 1 - out,
      transform: `scale(${cam * (1 - 0.04 * out)})` }}>
      <div style={{ ...box(p1, `scale(${lerp(0.94, 1, rise)})`), opacity: rise }}>
        <Phone w={PW} h={PH}>{screen("ugc-1.mp4", fromMs, 3.0)}</Phone>
      </div>
      {tMs >= tLike - 20 && (
        <div style={{ ...box(p2, `rotateY(${lerp(-18, 0, in2)}deg)`), opacity: in2 }}>
          <Phone w={PW} h={PH}>{screen("ugc-2.mp4", tLike, 3.7)}</Phone>
        </div>
      )}
    </div>
  );
};

// the SKIMS clip cards of B10, shared with B11 (the pile keeps playing under the fan)
export const PILE = { w: 330, h: 582 };
export const pileCard = (assets: string[], fps: number, startMs: number, file: string, from: number): React.ReactNode => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#fff", boxShadow: SHADOW }}>
    <Clip src={asset(assets, file)} startMs={startMs} fromSec={from} fps={fps}
      style={{ left: 0, top: 0, width: PILE.w, height: PILE.h, objectFit: "cover" }} />
  </div>
);

// where the two clip cards sit at spine ms t (B10 and the first beat of B11 read the same function)
export const pileLayout = (tMs: number, fps: number, t0: number, tAnim: number) => {
  const drop = ramp(tMs, t0, t0 + 360);
  const apart = ramp(tMs, tAnim, tAnim + 360, IO);
  const spin = ramp(tMs, tAnim, tAnim + 380);
  return {
    pile: { cx: lerp(540, 368, apart), dy: lerp(-26, 0, drop), op: drop },
    puffer: { cx: lerp(540, 712, apart), rotY: lerp(40, -4, spin), scale: 0.96, op: spin, on: tMs >= tAnim },
  };
};

// B10 (21667 → 22985) "look at the animations here": the SKIMS pile drops in playing (garments land) and the
// puffer turntable spins in beside it right after (source 1.2 s on: the pseudo TNF chest mark stays out).
// v5 (law 1): both are in place by ~22200 and held playing; the join no longer waits for ANIMATIONS.
export const PAIR_JOIN = 150; // ms after the card's start that the puffer joins (B11 reads the same)
export const SkimsAnim: React.FC<CardProps & { data: any }> = ({ tMs, h, fps, fromMs, toMs, beats, assets }) => {
  const tAnim = fromMs + PAIR_JOIN;
  const L = pileLayout(tMs, fps, fromMs, tAnim);
  const cy = h / 2, cam = push(tMs, fromMs, toMs, 0.02);
  const place = (cx: number, extra: string, z: number, op: number): React.CSSProperties => ({
    position: "absolute", left: cx - PILE.w / 2, top: cy - PILE.h / 2, width: PILE.w, height: PILE.h, zIndex: z, transform: extra, opacity: op,
  });
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1500, transform: `scale(${cam})` }}>
      {L.puffer.on && (
        <div style={place(L.puffer.cx, `rotateY(${L.puffer.rotY}deg) scale(${L.puffer.scale}) rotate(${2 + 0.6 * wave(tMs, 3400)}deg)`, 1, L.puffer.op)}>
          {pileCard(assets, fps, tAnim, "skims-puffer.mp4", 1.2)}
        </div>
      )}
      <div style={place(L.pile.cx, `translateY(${L.pile.dy + 3 * wave(tMs, 3000)}px) rotate(${-1.5 + 0.5 * wave(tMs, 3600)}deg)`, 2, L.pile.op)}>
        {pileCard(assets, fps, fromMs, "skims-pile.mp4", 0.4)}
      </div>
    </div>
  );
};
