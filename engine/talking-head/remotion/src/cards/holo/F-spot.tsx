import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SLOP, Stage, WASH, WASH_HERO, beatsOf, easeInOut, easeOut3, hash, lerp, pick, sp, win } from "./F-util";
// edit-k-h2v4 "one light" (builder F, 2026-09-24), 1707 -> 4404. A long row of AI ads stands on a stage under flat
// fluorescent tubes, every print the same washed beige, the row running out of frame on both sides. On NOT, BLEND
// and IN the three tube banks go out one after another (a clack each) until the row is a line of silhouettes;
// on "The" one hard spotlight slams on the middle print: the real Crocs ad, its colour arriving with the light,
// and it steps forward out of the row into the beam, dust hanging in the cone. Held, 130 ms exit.
const CW = 186, CH = 248, GAP = 16, FLOORY = 505, N = 9;
const HW = 390, HH = 520;                    // the hero at full size (rendered crisp, scaled down in the row)

const Tube: React.FC<{ x: number; on: number }> = ({ x, on }) => (
  <div style={{ position: "absolute", left: x - 130, top: 22, width: 260, height: 12, borderRadius: 6,
    background: on > 0.5 ? "#f4f6f2" : "#2a2b2e",
    boxShadow: on > 0.5 ? "0 0 26px 8px rgba(225,235,230,0.55), 0 0 80px 30px rgba(200,215,210,0.22)" : "none" }} />
);

const Print: React.FC<{ x: number; src: string; lum: number }> = ({ x, src, lum }) => (
  <div style={{ position: "absolute", left: x - CW / 2, top: FLOORY - CH, width: CW, height: CH }}>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#cfc6b6", filter: `brightness(${lum})`,
      boxShadow: "0 12px 22px rgba(0,0,0,0.5)" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: WASH }} />
    </div>
    <div style={{ position: "absolute", left: 10, right: 10, top: CH + 2, height: 14, borderRadius: "50%",
      background: "rgba(0,0,0,0.55)", filter: "blur(6px)" }} />
  </div>
);

export const Spot: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b = beatsOf(beats);
  const hero = staticFile(pick(assets, data?.hero ?? "crocs-5139685.jpg"));
  const slop = SLOP.map((n) => staticFile(pick(assets, n)));
  const offs = [b.not, b.blend, b.in - 60];                  // left bank, right bank, middle bank
  const banks = offs.map((o) => (t < o ? 1 : 0));
  const house = lerp(0.2, 1, (banks[0] + banks[1] + banks[2]) / 3);
  const lumAt = (x: number) => {                             // each bank lights its third of the row
    const k = x < 360 ? 0 : x > 720 ? 1 : 2;
    return 0.16 + 0.84 * (0.55 * banks[k] + 0.45 * house);
  };
  const on = t >= b.the ? 1 : 0;
  const hit = win(t, b.the, b.the + 90);                    // the beam's snap on
  const flood = easeOut3(win(t, b.the, b.the + 260));
  const step = sp(t, b.the + 60, fps, 20, 90, 1);
  const hs = lerp(CH / HH, 1, step);
  const hy = lerp(FLOORY - HH, 634 / 2 - HH / 2 + 30, step);
  const push = 1 + 0.035 * easeInOut(win(t, b.here, b.own));
  const r = lerp(-20, 140, flood);
  const xs = Array.from({ length: N }, (_, i) => 540 + (i - (N - 1) / 2) * (CW + GAP));
  return (
    <Stage w={w} h={h} t={t} b={b} bg="#0a0a0c">
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 55%" }}>
        {/* back wall and floor, lit by the house tubes */}
        <div style={{ position: "absolute", inset: 0, filter: `brightness(${0.25 + 0.75 * house})`,
          background: "linear-gradient(180deg, #3b3a38 0%, #2c2b2a 70%, #1c1b1a 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: FLOORY - 4, bottom: 0, filter: `brightness(${0.25 + 0.75 * house})`,
          background: "linear-gradient(180deg, #4a4744 0%, #252321 100%)" }} />
        {[270, 810, 540].map((x, i) => <Tube key={x} x={x} on={banks[i]} />)}
        {xs.map((x, i) => i === (N - 1) / 2 ? null : (
          <Print key={i} x={x} src={slop[(i * 3 + 1) % 5]} lum={lumAt(x) * lerp(1, 0.75, flood)} />
        ))}
        {/* the beam: a cone from above, a pool on the floor, dust in the light */}
        {on > 0 && (
          <>
            <svg width={1080} height={634} style={{ position: "absolute", left: 0, top: 0, opacity: 0.85 * hit }}>
              <defs>
                <linearGradient id="fspot-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgb(255,246,225)" stopOpacity={0.55} />
                  <stop offset="0.7" stopColor="rgb(255,240,210)" stopOpacity={0.18} />
                  <stop offset="1" stopColor="rgb(255,240,210)" stopOpacity={0.08} />
                </linearGradient>
                <filter id="fspot-b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
              </defs>
              <polygon points="508,-30 572,-30 842,660 238,660" fill="url(#fspot-g)" filter="url(#fspot-b)" />
            </svg>
            <div style={{ position: "absolute", left: 540 - 300, top: FLOORY - 40, width: 600, height: 110, borderRadius: "50%", opacity: hit,
              background: "radial-gradient(ellipse at 50% 50%, rgba(255,244,220,0.55) 0%, rgba(255,244,220,0) 70%)" }} />
            {Array.from({ length: 26 }, (_, k) => {
              const y0 = hash(k * 7) * 600, sp2 = 10 + hash(k * 3) * 16;
              const y = (y0 - ((t - b.the) / 1000) * sp2 + 600) % 600;
              const half = 20 + (y / 600) * 150;
              const x = 540 + (hash(k * 13) - 0.5) * 2 * half + Math.sin((t / 700) + k) * 6;
              return <div key={k} style={{ position: "absolute", left: x, top: y, width: 3, height: 3, borderRadius: 2,
                background: "rgba(255,245,225,0.8)", opacity: hit * (0.25 + 0.5 * hash(k * 5)) }} />;
            })}
          </>
        )}
        {/* the real ad: in the row at first, then out into the beam */}
        <div style={{ position: "absolute", left: 540 - HW / 2, top: hy, width: HW, height: HH, transformOrigin: "50% 100%",
          transform: `scale(${hs})`, boxShadow: `0 ${20 + 30 * step}px ${40 + 40 * step}px rgba(0,0,0,0.7)`, overflow: "hidden", background: "#cfc6b6" }}>
          <Img src={hero} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            filter: `${WASH_HERO} brightness(${lumAt(540) / 0.9})` }} />
          <Img src={hero} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            WebkitMaskImage: `radial-gradient(circle at 50% 0%, #000 ${r}%, transparent ${r + 25}%)` } as React.CSSProperties} />
        </div>
      </div>
    </Stage>
  );
};
export const SPOT_ASSETS = [...SLOP, "crocs-5139685.jpg"];
