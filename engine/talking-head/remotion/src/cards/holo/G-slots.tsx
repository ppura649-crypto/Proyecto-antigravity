import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beatsOf, clamp, easeInOut, easeOut3, exitP, holdPush, pick, win, type GBeats } from "./G-util";
// edit-k-h3v1 "the slot machine" (builder G, 2026-09-24), 2233 -> 5937. Three real drums of a black cabinet
// are already spinning on "but" (true vertical motion blur from the drum speed). They clunk to a stop one by
// one on "AI ... slop": three unrelated fictional slop ads, a losing line, the cabinet stays dark. On WATCH the
// drums kick again, and on "The / fix" they lock one by one on three SKIMS shots of the same campaign: a
// matched line, each window lighting warm as it locks. Held under a slow push; clean 130 ms exit into "own".

const N = 10, THETA = 360 / N, FH = 480, WIN_W = 320, WIN_H = 570, GAP = 18, PAD = 26;
const R = FH / 2 / Math.tan((Math.PI / 180) * (THETA / 2));
const SLOP = ["famA-slop-bike.jpg", "famA-slop-dog.jpg", "famA-slop-pyjama.jpg", "famA-slop-serum.jpg", "famA-slop-sneaker.jpg"];
const SKIMS = ["skims-3754927.jpg", "skims-3754932.jpg", "skims-3754960.jpg", "skims-3754962.jpg", "skims-3754998.jpg"];
const LAND_A = [3, 1, 4]; // serum | dog | sneaker: the losing line
const LAND_B = ["skims-3754964.jpg", "skims-3754970.jpg", "skims-3755019.jpg"]; // one campaign, one line
const IA = [12, 14, 16], DA = [12, 14, 16], DB = [9, 11, 13];
export const SLOT_ASSETS = [...SLOP, ...SKIMS, ...LAND_B];

// phase B travel: a quick kick then a long mechanical slow-down, integrated once and normalised
const CURVE_B: number[] = (() => {
  const n = 400, out = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) { const u = i / n; acc += clamp(u / 0.16) * Math.pow(1 - u, 2.2); out.push(acc); }
  return out.map((x) => x / acc);
})();
const curveB = (u: number) => { const x = clamp(u) * 400, i = Math.floor(x), f = x - i; return CURVE_B[i] * (1 - f) + CURVE_B[Math.min(400, i + 1)] * f; };
// the clunk: a small forward overshoot and back, the drum settling on its detent
const detent = (t: number, at: number) => (t <= at ? 0 : 0.07 * Math.sin(((t - at) / 230) * Math.PI * 2) * Math.exp(-(t - at) / 110));

const times = (b: GBeats) => ({
  stopA: [b.ai, b.ai + 190, b.slop], startB: [b.watch, b.watch + 70, b.watch + 140],
  stopB: [b.the, b.fix, b.fix + 170],
});
// drum d position (face index at the window centre) at spine ms t
const pos = (d: number, t: number, b: GBeats) => {
  const T = times(b), ts = b.but - 320;
  if (t < T.startB[d]) {
    const u = win(t, ts, T.stopA[d]);
    return IA[d] - DA[d] * Math.pow(1 - u, 3) + detent(t, T.stopA[d]);
  }
  return IA[d] + DB[d] * curveB(win(t, T.startB[d], T.stopB[d])) + detent(t, T.stopB[d]);
};
const faceSrc = (d: number, i: number) => {
  if (i === IA[d] + DB[d]) return LAND_B[d];
  if (i > IA[d] + 2) return SKIMS[(i * 3 + d) % SKIMS.length];
  if (i === IA[d]) return SLOP[LAND_A[d]];
  const k = (i * 2 + d * 3) % SLOP.length;
  return SLOP[k === LAND_A[d] ? (k + 1) % SLOP.length : k];
};

const Drum: React.FC<{ d: number; t: number; b: GBeats; assets: string[]; lit: number }> = ({ d, t, b, assets, lit }) => {
  const p = pos(d, t, b);
  const v = Math.abs(p - pos(d, t - 1000 / 60, b)) * FH; // px travelled in half a frame
  const std = Math.min(46, v * 0.55);
  const id = `gslot-${d}-${Math.round(t)}`;
  const faces: React.ReactNode[] = [];
  for (let i = Math.floor(p) - 2; i <= Math.ceil(p) + 2; i++) {
    const a = (i - p) * THETA;
    if (Math.abs(a) > 84) continue;
    const shade = Math.pow(Math.cos((a * Math.PI) / 180), 1.6);
    faces.push(
      <div key={i} style={{ position: "absolute", left: 0, top: (WIN_H - FH) / 2, width: WIN_W, height: FH,
        transform: `translateZ(${-R}px) rotateX(${a}deg) translateZ(${R}px)`, backfaceVisibility: "hidden",
        filter: `brightness(${0.25 + 0.75 * shade})` }}>
        <Img src={staticFile(pick(assets, faceSrc(d, i)))} style={{ width: "100%", height: "100%", objectFit: "cover",
          objectPosition: "50% 50%", display: "block" }} />
      </div>,
    );
  }
  return (
    <div style={{ position: "relative", width: WIN_W, height: WIN_H, overflow: "hidden", background: "#050506",
      boxShadow: `inset 0 0 0 3px rgba(255,214,140,${0.85 * lit}), 0 0 ${36 * lit}px rgba(255,190,110,${0.55 * lit})` }}>
      {std > 0.6 && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="0" y="-20%" width="100%" height="140%"><feGaussianBlur stdDeviation={`0 ${std.toFixed(2)}`} /></filter>
        </svg>
      )}
      <div style={{ position: "absolute", inset: 0, filter: std > 0.6 ? `url(#${id})` : undefined }}>
        <div style={{ position: "absolute", inset: 0, perspective: 1300, perspectiveOrigin: "50% 50%" }}>{faces}</div>
      </div>
      {/* the drum's curvature in the glass: dark top and bottom, a soft glare across */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 17%, rgba(0,0,0,0) 83%, rgba(0,0,0,0.85) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.09) 42%, rgba(255,255,255,0) 55%)" }} />
    </div>
  );
};

const Slots: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets }) => {
  const b = beatsOf(beats);
  const T = times(b);
  const out = exitP(t, b);
  const cabW = 3 * WIN_W + 2 * GAP + 2 * PAD, cabH = WIN_H + 2 * 20;
  // the cabinet: a slow push through the whole window, a tiny kick on each B lock
  const kick = T.stopB.reduce((s, at) => s + 0.006 * Math.sin(clamp((t - at) / 160) * Math.PI), 0);
  const s = holdPush(t, b.but, b, 0.035) * (1 + kick) * (1 - 0.04 * out);
  const lits = T.stopB.map((at) => easeOut3(win(t, at, at + 180)));
  const all = easeInOut(win(t, T.stopB[2], T.stopB[2] + 400));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: (w - cabW) / 2, top: (h - cabH) / 2, width: cabW, height: cabH,
        transform: `scale(${s})`, background: "linear-gradient(180deg, #1a1a1d 0%, #0b0b0d 12%, #08080a 88%, #16161a 100%)",
        boxShadow: `0 34px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 ${80 * all}px rgba(255,190,110,${0.18 * all})`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: GAP }}>
        {[0, 1, 2].map((d) => <Drum key={d} d={d} t={t} b={b} assets={assets} lit={lits[d]} />)}
      </div>
    </div>
  );
};

export const SLOT_KINDS = { "holo-g-slots": Slots };
