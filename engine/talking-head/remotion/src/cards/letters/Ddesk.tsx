import React from "react";
import type { CardProps } from "../props";
import { HALO_STROKE, INK, PAPER, clamp01, easeInOut, easeOut } from "./shared";
import { Ink, ramp, sp } from "./Dparts";

// ─────────────────────────────────────────────────────────────────────────────
// V17 deskclock: "I'll admit, it's more effort and time, and it's hard to scale."
// FRAMELESS: no board, no plate. Four real things on their wall seen from above - a tall stack of
// blank envelopes with its edge count showing, the one being written under a fountain pen, the
// short done stack, and a round wall clock over them. The blank pile never gets shorter, one
// envelope leaves every `everyMs`, the clock runs away, and the pile it would really take fades
// in behind the real one as an outline. The card ends mid-cycle.
// ─────────────────────────────────────────────────────────────────────────────

export type DeskclockData = { name: string; everyMs: number };

const EW = 244, EH = 162;   // a C5 envelope's proportion, sized to read on a 994 px card
const SLOT_X = [41, 375, 709];
const BASE = 498;           // the three piles rest their bottom edge on one line
const LAYER = 4.2;          // one sheet's edge: 26 of them is a visible count
const BLANK = 26;
const DONE0 = 3;            // the done pile is already a few high when the desk pops

/** a handwritten name: one continuous stroke, sampled so the nib can ride it */
const scrawlPts = (x0: number, y0: number, wid: number, amp: number): { x: number; y: number }[] =>
  Array.from({ length: 120 }, (_, i) => {
    const t = i / 119;
    const env = 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.08));
    const cap = t < 0.13 ? -amp * 1.5 * Math.sin((t / 0.13) * Math.PI) : 0;
    return {
      x: x0 + wid * t,
      y: y0 - amp * env * (0.62 * Math.sin(t * Math.PI * 9.6 + 0.6) + 0.3 * Math.sin(t * Math.PI * 3.7)) + cap,
    };
  });
const toPath = (pts: { x: number; y: number }[]): string =>
  pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const NAME_W = 0.56 * EW;
const strokeAt = (x: number, y: number) => scrawlPts(x + 0.20 * EW, y + 0.62 * EH, NAME_W, 11);

// the stroke's cumulative arc length per sample, so the dash the ink is drawn to is exactly
// where the nib is. A flat guess (the path is 137 px wide but ~190 px long) drew the whole
// name in the first two frames and the nib trailed behind its own ink.
const CUM: number[] = (() => {
  const pts = strokeAt(0, 0);
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return out;
})();
const NAME_LEN = CUM[CUM.length - 1];
const inkTo = (f: number): number => CUM[Math.min(CUM.length - 1, Math.max(0, Math.round(f * (CUM.length - 1))))];

/** one envelope, front up: paper with a shadow, the flap seam showing through, the name on it */
const Env: React.FC<{ x: number; y: number; scrawl?: number }> = ({ x, y, scrawl = 0 }) => (
  <g filter="url(#dPaperShadow)">
    <rect x={x} y={y} width={EW} height={EH} fill={PAPER} stroke="#C7C0B2" strokeWidth={1.8} />
    <path d={`M ${x + 1} ${y + 1} L ${x + EW / 2} ${y + EH * 0.52} L ${x + EW - 1} ${y + 1}`}
      fill="none" stroke="#DFD8CA" strokeWidth={2.4} strokeLinejoin="round" />
    {scrawl > 0 && (
      <path d={toPath(strokeAt(x, y))} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round"
        strokeLinejoin="round" strokeDasharray={`${inkTo(scrawl).toFixed(2)} ${NAME_LEN.toFixed(2)}`} />
    )}
  </g>
);

/** a pile: every sheet's edge visible under the top one, so the count reads */
const Pile: React.FC<{ x: number; layers: number; scrawl?: boolean }> = ({ x, layers, scrawl }) => {
  const top = BASE - EH - layers * LAYER;
  return (
    <g>
      {Array.from({ length: layers }, (_, i) => {
        const k = layers - i;
        return (
          <rect key={k} x={x + k * 0.55} y={top + k * LAYER} width={EW} height={EH}
            fill={PAPER} stroke="#CDC6B8" strokeWidth={1.3} />
        );
      })}
      <Env x={x} y={top} scrawl={scrawl ? 1 : 0} />
    </g>
  );
};

/** the pile it would really take: outline only, taller, standing behind the real one */
const GhostPile: React.FC<{ x: number; rise: number; op: number }> = ({ x, rise, op }) => {
  const y = BASE - EH - BLANK * LAYER;   // the real pile's top face: the ghost stands ON it
  const top = y - rise;
  const d = `M ${x} ${top} H ${x + EW} V ${y} H ${x} Z`;
  return (
    <g opacity={op}>
      <path d={d} fill="none" {...HALO_STROKE} strokeWidth={9} />
      <path d={d} fill="none" stroke={INK} strokeOpacity={0.62} strokeWidth={2.8} />
      {Array.from({ length: Math.floor(rise / 22) }, (_, i) => (
        <path key={i} d={`M ${x} ${top + 14 + i * 22} H ${x + EW}`} fill="none" stroke={INK} strokeOpacity={0.15} strokeWidth={1.5} />
      ))}
    </g>
  );
};

const Clock: React.FC<{ cx: number; cy: number; r: number; s: number; spin: number }> = ({ cx, cy, r, s, spin }) => {
  const mm = -60 + spin * 360 * 2.6;
  const hh = -30 + spin * 30 * 2.6;
  const hand = (deg: number, len: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };
  const m = hand(mm, r * 0.78);
  const hr = hand(hh, r * 0.5);
  return (
    <g opacity={Math.min(1, s * 1.8)} transform={`translate(${cx} ${cy}) scale(${0.9 + 0.1 * s}) translate(${-cx} ${-cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.84)" />
      <Ink d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`} sw={5.5} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const r0 = r - (i % 3 === 0 ? 17 : 10);
        return (
          <line key={i} x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)} x2={cx + (r - 4) * Math.cos(a)} y2={cy + (r - 4) * Math.sin(a)}
            stroke={INK} strokeWidth={i % 3 === 0 ? 5 : 2.8} strokeLinecap="round" />
        );
      })}
      {spin > 0 &&
        [0.10, 0.20, 0.32].map((b, i) => {
          const a = ((mm - b * 360 - 90) * Math.PI) / 180;
          return (
            <line key={i} x1={cx} y1={cy} x2={cx + r * 0.78 * Math.cos(a)} y2={cy + r * 0.78 * Math.sin(a)}
              stroke={INK} strokeOpacity={0.18 - i * 0.045} strokeWidth={6} strokeLinecap="round" />
          );
        })}
      <line x1={cx} y1={cy} x2={hr.x} y2={hr.y} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={m.x} y2={m.y} stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6.5} fill={INK} />
    </g>
  );
};

/** a fountain pen: a steel nib with its slit and breather, then the barrel and its band */
const Pen: React.FC<{ x: number; y: number; lift: number }> = ({ x, y, lift }) => (
  <g transform={`translate(${x + 18 * lift} ${y - 30 * lift}) rotate(${-42 - 5 * lift})`}>
    <path d="M 0 0 L 22 -13 L 22 13 Z" fill="none" {...HALO_STROKE} strokeWidth={9} strokeLinejoin="round" />
    <rect x={22} y={-13} width={172} height={26} rx={6} fill="none" {...HALO_STROKE} strokeWidth={9} />
    <path d="M 0 0 L 22 -13 L 22 13 Z" fill="#B9BFC8" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    <line x1={3} y1={0} x2={19} y2={0} stroke={INK} strokeWidth={2} />
    <circle cx={17} cy={0} r={3.4} fill="none" stroke={INK} strokeWidth={2} />
    <rect x={22} y={-13} width={172} height={26} rx={6} fill="#23262E" stroke={INK} strokeWidth={2.2} />
    <rect x={54} y={-13} width={16} height={26} fill="#9AA1AC" />
    <rect x={160} y={-10} width={5} height={20} rx={2} fill="#9AA1AC" />
  </g>
);

export const Deskclock: React.FC<CardProps & { data: DeskclockData }> = ({ tMs, w, h, fps, beats, data }) => {
  const pop = sp(tMs, beats.admit, fps);
  const P = Math.max(200, data.everyMs);
  const running = tMs >= beats.effort;
  const phase = Math.max(0, (tMs - beats.effort) / P);
  const cyc = Math.floor(phase);
  const u = running ? phase - cyc : 0;

  const [blankX, midX, doneX] = SLOT_X;
  const midY = BASE - EH;
  const writing = !running ? 0 : u < 0.5 ? u / 0.5 : 1;
  const slide = u >= 0.5 ? easeInOut(clamp01((u - 0.5) / 0.28)) : 0;
  const feed = u >= 0.52 ? easeInOut(clamp01((u - 0.52) / 0.46)) : 0;
  // the written one lands exactly where the done pile's next top sheet will be, so the
  // pile taking it over on the same frame is not a pop
  const doneLayers = DONE0 + (running ? cyc + (u >= 0.78 ? 1 : 0) : 0);
  const landY = BASE - EH - (DONE0 + cyc + 1) * LAYER;
  const blankTop = BASE - EH - BLANK * LAYER;

  // the nib rides the stroke while it writes, then travels back to the stroke's start while the
  // pen is up, so the cycle's last frame and the next cycle's first frame are the same picture
  const nibT = !running ? 0 : u < 0.5 ? u / 0.5 : 1 - easeInOut(clamp01((u - 0.52) / 0.30));
  const nib = strokeAt(midX, midY)[Math.min(119, Math.max(0, Math.round(nibT * 119)))];
  const lift = !running ? 1
    : u < 0.5 ? 0
    : u < 0.58 ? (u - 0.5) / 0.08
    : u < 0.92 ? 1
    : 1 - (u - 0.92) / 0.08;
  const spin = tMs >= beats.time ? (tMs - beats.time) / 1000 : 0;
  const ghost = ramp(tMs, beats.scale, beats.scale + 170);

  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <title>a desk from above: one envelope written at a time, the pile never shorter</title>
      <defs>
        <filter id="dPaperShadow" x="-30%" y="-30%" width="170%" height="190%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#000" floodOpacity="0.20" />
        </filter>
      </defs>
      <g opacity={Math.min(1, pop * 1.8)} transform={`translate(${w / 2} ${BASE - 120}) scale(${0.94 + 0.06 * pop}) translate(${-w / 2} ${-(BASE - 120)})`}>
        {ghost > 0 && <GhostPile x={blankX} rise={190} op={ghost} />}
        <Pile x={blankX} layers={BLANK} />

        {writing < 1 && <Env x={midX} y={midY} scrawl={writing} />}
        {slide > 0 && (
          <Env x={midX + (doneX - midX) * slide} y={midY + (landY - midY) * slide - 20 * Math.sin(Math.PI * slide)} scrawl={1} />
        )}
        {feed > 0 && (
          <Env x={blankX + (midX - blankX) * feed} y={blankTop + (midY - blankTop) * feed - 26 * Math.sin(Math.PI * feed)} />
        )}

        <Pile x={doneX} layers={Math.min(12, doneLayers)} scrawl />
        {nib && <Pen x={nib.x} y={nib.y} lift={lift} />}
      </g>
      <Clock cx={w / 2} cy={0.170 * h} r={0.145 * h} s={pop} spin={spin} />
    </svg>
  );
};
