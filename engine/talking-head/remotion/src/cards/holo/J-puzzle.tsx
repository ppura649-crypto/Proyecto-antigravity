import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, beatsOf, clamp, hash, land, mix, pick, ramp, stage, type JBeats } from "./J-util";
// h4v2 (builder J, 2026-09-24): "the jigsaw". Three real ads (SKIMS, Crocs, SKIMS) cut into a 32-piece jigsaw,
// the pieces scattered face up over the table around an empty tray. By hand, one piece is fitted per word
// (DOING, EVERY, AD, YOURSELF), each lifted, turned and pressed into the corner. On WATCH every other piece lifts
// at once and flies home in a fast wave; the seams close and three finished ads lie in the tray, held.

const COLS = 8, ROWS = 4, PW = 120, PH = 130, M = 34, IW = COLS * PW, IH = ROWS * PH;
const BX = (CW - IW) / 2, BY = (CH - IH) / 2; // the tray in stage coords
const MANUAL = [0, 1, 8, 9]; // top-left corner, the way people start
const N = COLS * ROWS;

// tab directions on the shared edges (+1: protrudes right / down)
const vTab = (r: number, c: number) => (hash(r * 31 + c * 7 + 3) > 0.5 ? 1 : -1);
const hTab = (r: number, c: number) => (hash(r * 17 + c * 13 + 91) > 0.5 ? 1 : -1);
const KNOB: [number, number][][] = [
  [[0.42, 0], [0.43, 0.05], [0.4, 0.1]], [[0.36, 0.18], [0.4, 0.26], [0.5, 0.26]],
  [[0.6, 0.26], [0.64, 0.18], [0.6, 0.1]], [[0.57, 0.05], [0.58, 0], [0.63, 0]],
];
// one edge from p to q; n = outward normal; s = +1 tab out, -1 tab in, 0 flat
const edge = (p: [number, number], q: [number, number], n: [number, number], s: number) => {
  if (s === 0) return `L ${q[0]} ${q[1]} `;
  const u: [number, number] = [q[0] - p[0], q[1] - p[1]];
  const pt = ([x, y]: [number, number]) => `${(p[0] + u[0] * x + n[0] * y * 120 * s).toFixed(1)} ${(p[1] + u[1] * x + n[1] * y * 120 * s).toFixed(1)}`;
  let d = `L ${pt([0.37, 0])} `;
  for (const c of KNOB) d += `C ${pt(c[0])} ${pt(c[1])} ${pt(c[2])} `;
  return d + `L ${q[0]} ${q[1]} `;
};
const PATHS: string[] = Array.from({ length: N }, (_, i) => {
  const r = Math.floor(i / COLS), c = i % COLS;
  const a: [number, number] = [M, M], b: [number, number] = [M + PW, M], cc: [number, number] = [M + PW, M + PH], d: [number, number] = [M, M + PH];
  const top = r === 0 ? 0 : -hTab(r - 1, c), bottom = r === ROWS - 1 ? 0 : hTab(r, c);
  const left = c === 0 ? 0 : -vTab(r, c - 1), right = c === COLS - 1 ? 0 : vTab(r, c);
  return `M ${a[0]} ${a[1]} ` + edge(a, b, [0, -1], top) + edge(b, cc, [1, 0], right) + edge(cc, d, [0, 1], bottom) + edge(d, a, [-1, 0], left) + "Z";
});

// where each piece lies before it is fitted (stage coords of the cell's top-left) and its turn
const scatter = (i: number) => {
  const k = MANUAL.indexOf(i);
  if (k >= 0) return { x: 330 + k * 150 + 30 * hash(i), y: 80 + 250 * hash(i + 5), rot: -28 + 56 * hash(i + 9) };
  let x = 10 + hash(i * 3 + 1) * (CW - PW - 20), y = 10 + hash(i * 5 + 2) * (CH - PH - 20);
  if (x < BX + 2.4 * PW && y < BY + 2.4 * PH) x += 2.6 * PW; // keep the corner the creator works in clear
  return { x, y, rot: -60 + 120 * hash(i * 7 + 4) };
};
// the wave's order: shuffled, not left to right
const ORDER = Array.from({ length: N }, (_, j) => j).filter((j) => !MANUAL.includes(j)).sort((p, q) => hash(p * 11 + 6) - hash(q * 11 + 6));
const startOf = (i: number, b: JBeats) => {
  const k = MANUAL.indexOf(i);
  if (k >= 0) return { at: [b.doing, b.every, b.ad, b.yourself][k] - 60, dur: 420 };
  return { at: b.watch + ORDER.indexOf(i) * 13, dur: 330 };
};

const Piece: React.FC<{ i: number; t: number; fps: number; b: JBeats; src: string; seam: number }> = ({ i, t, fps, b, src, seam }) => {
  const r = Math.floor(i / COLS), c = i % COLS;
  const s0 = scatter(i), { at, dur } = startOf(i, b);
  const f = ramp(t, at, at + dur, Easing.inOut(Easing.cubic));
  const settle = land(t, at + dur, fps);
  const lift = Math.sin(Math.PI * f) * (MANUAL.includes(i) ? 0.1 : 0.07);
  const x = mix(s0.x, BX + c * PW, f), y = mix(s0.y, BY + r * PH, f) - 18 * Math.sin(Math.PI * f);
  const rot = mix(s0.rot, 0, f);
  const placed = t >= at + dur;
  const press = placed ? 1 - 0.025 * Math.sin(Math.PI * clamp(settle)) * (1 - settle) : 1;
  const sh = placed ? "drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))"
    : `drop-shadow(0 ${8 + 22 * lift * 10}px ${10 + 18 * lift * 10}px rgba(0,0,0,0.55))`;
  return (
    <div style={{ position: "absolute", left: x - M, top: y - M, width: PW + 2 * M, height: PH + 2 * M, zIndex: placed ? 1 : f > 0 ? 40 : 10,
      transform: `rotate(${rot}deg) scale(${(1 + lift) * press})`, filter: sh }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `path('${PATHS[i]}')` }}>
        <Img src={src} style={{ position: "absolute", left: M - c * PW, top: M - r * PH, width: IW, height: IH }} />
      </div>
      <svg width={PW + 2 * M} height={PH + 2 * M} style={{ position: "absolute", left: 0, top: 0, opacity: placed ? seam : 1 }}>
        <path d={PATHS[i]} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={1.6} />
        <path d={PATHS[i]} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} transform="translate(0.8 0.8)" />
      </svg>
    </div>
  );
};

export const Puzzle: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const b = beatsOf(beats);
  const src = staticFile(pick(assets, "J-puzzle.jpg"));
  const lastEnd = b.watch + (N - MANUAL.length - 1) * 13 + 330;
  const seam = 1 - ramp(tMs, lastEnd + 40, lastEnd + 300);
  const glow = ramp(tMs, lastEnd, lastEnd + 400);
  return (
    <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>
      <div style={{ ...stage(tMs, fromMs, toMs, 0.045), background: "radial-gradient(ellipse 75% 85% at 50% 40%, #1b1b1f 0%, #0e0e10 65%, #08080a 100%)" }}>
        {/* the tray: recessed, the cell grid faintly scored */}
        <div style={{ position: "absolute", left: BX - 10, top: BY - 10, width: IW + 20, height: IH + 20, background: "#070708",
          boxShadow: `inset 0 3px 10px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05), 0 0 ${60 * glow}px rgba(255,255,255,${0.08 * glow})` }}>
          <svg width={IW} height={IH} style={{ position: "absolute", left: 10, top: 10, opacity: 0.5 * seam }}>
            {PATHS.map((d, i) => <path key={i} d={d} transform={`translate(${(i % COLS) * PW - M} ${Math.floor(i / COLS) * PH - M})`}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />)}
          </svg>
        </div>
        {Array.from({ length: N }, (_, i) => <Piece key={i} i={i} t={tMs} fps={fps} b={b} src={src} seam={seam} />)}
      </div>
    </div>
  );
};
