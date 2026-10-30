import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { WB, type WBeats, clamp, easeIn2, easeOut3, pick, smooth, wrapStyle } from "./W-util";
// edit-k-h1v06 (2026-09-24), builder W: "Polaroids develop". Three instant prints are tossed onto a dark
// table one after another (YOU, WATCH, THE); each lands milky pale blue-grey and develops chemically (the
// haze thins, low-contrast cool ghost, contrast, then full warm colour) into a real SKIMS / Crocs creative.
// All three are finished by 3500 and held under a slow push; clean exit at 4237.

// an instant print: image window 0.8 aspect, thin sides and top, the thick chin
const IW = 318, IH = 398, SIDE = 18, TOP = 22, CHIN = 88;
const PW = IW + 2 * SIDE, PH = IH + TOP + CHIN;

type Print = { img: string; pos: string; cx: number; cy: number; rot: number; dx: number; dy: number; drot: number;
  at: keyof WBeats; lead: number; devEnd: number };
const PRINTS: Print[] = [
  { img: "skims-3754964.jpg", pos: "50% 30%", cx: 262, cy: 322, rot: -8, dx: -250, dy: -330, drot: -14, at: "you", lead: 70, devEnd: 3260 },
  { img: "skims-3754927.jpg", pos: "50% 78%", cx: 818, cy: 312, rot: 6.5, dx: 260, dy: -340, drot: 13, at: "watch", lead: 0, devEnd: 3390 },
  { img: "crocs-5139685.jpg", pos: "50% 50%", cx: 540, cy: 330, rot: -1.5, dx: 30, dy: -420, drot: 9, at: "the", lead: 0, devEnd: 3500 },
];
const DROP = 440; // ms from toss to rest

// the chemistry: haze clears first, contrast builds, colour arrives last and warms
const Emulsion: React.FC<{ src: string; pos: string; p: number }> = ({ src, pos, p }) => {
  const k1 = smooth(0, 0.62, p), k2 = smooth(0.1, 0.85, p), k3 = smooth(0.34, 1, p);
  const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <div style={{ position: "absolute", left: SIDE, top: TOP, width: IW, height: IH, overflow: "hidden", background: "#c9d1d4",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}>
      <Img src={src} style={{ ...fill, objectFit: "cover", objectPosition: pos,
        filter: `contrast(${0.42 + 0.58 * k2}) brightness(${1.28 - 0.28 * k2}) saturate(${0.12 + 0.88 * k3})` }} />
      <div style={{ ...fill, background: "#5d8ea8", mixBlendMode: "color", opacity: 0.6 * (1 - k3) }} />
      <div style={{ ...fill, background: "radial-gradient(ellipse at 45% 40%, #d7dde0 0%, #c6cfd4 70%, #b9c4ca 100%)",
        opacity: Math.pow(1 - k1, 1.3) }} />
      {/* the recess of the window in the paper */}
      <div style={{ ...fill, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
    </div>
  );
};

const PrintView: React.FC<{ pr: Print; t: number; b: WBeats; assets: string[] }> = ({ pr, t, b, assets }) => {
  const t0 = b[pr.at] - pr.lead;
  if (t < t0) return null;
  const u = clamp((t - t0) / DROP);
  const z = 1 - easeIn2(clamp(u / 0.62)); // height above the table, gravity: falls faster as it goes
  const sl = easeOut3(u);                   // the toss slides out and stops by hand
  const x = pr.cx + pr.dx * (1 - sl), y = pr.cy + pr.dy * (1 - sl), r = pr.rot + pr.drot * (1 - sl);
  const s = 1 + 0.2 * z;
  const off = 7 + 46 * z, blur = 12 + 58 * z, a = 0.62 - 0.36 * z;
  const devStart = b[pr.at] - pr.lead;
  const p = clamp((t - devStart) / (pr.devEnd - devStart));
  return (
    <div style={{ position: "absolute", left: x - PW / 2, top: y - PH / 2, width: PW, height: PH,
      transform: `rotate(${r}deg) scale(${s})`,
      background: "linear-gradient(170deg, #f7f5ef 0%, #efece4 60%, #e7e3d9 100%)",
      boxShadow: `${0.5 * off}px ${off}px ${blur}px rgba(0,0,0,${a}), 0 1px 2px rgba(0,0,0,${0.45 * (1 - z)})` }}>
      <Emulsion src={staticFile(pick(assets, pr.img))} pos={pr.pos} p={p} />
    </div>
  );
};

// fine paper grain for the table (deterministic SVG noise)
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

export const Polaroids: React.FC<CardProps & { data: any }> = ({ tMs, w, h, beats, assets }) => {
  const b: WBeats = { ...WB, ...(beats as Partial<WBeats>) };
  return (
    <div style={{ position: "absolute", left: (w - 1080) / 2, top: (h - 634) / 2, width: 1080, height: 634, overflow: "hidden" }}>
      <div style={{ ...wrapStyle(tMs, b, 0.045, "50% 52%"),
        background: "radial-gradient(ellipse 80% 90% at 32% 18%, #3b342c 0%, #26211c 52%, #171411 100%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: "overlay" }} />
        {PRINTS.map((pr) => <PrintView key={pr.img} pr={pr} t={tMs} b={b} assets={assets} />)}
        <div style={{ position: "absolute", inset: -40, boxShadow: "inset 0 0 160px rgba(0,0,0,0.55)" }} />
      </div>
    </div>
  );
};
