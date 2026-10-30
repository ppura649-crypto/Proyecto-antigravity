import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, Chip, chipFs, clamp01, easeOut } from "./shared";
import { LABEL_FONT } from "../theme";
import { Field, Ten, ramp, sp } from "./Dparts";
import type { FieldData, TenData } from "./Dparts";
import { Deskclock } from "./Ddesk";
import type { DeskclockData } from "./Ddesk";

// edit-i-oneshot, family D: the instruments. citymap (V7) is three days of driving read off a
// REAL map (a label-free render of real streets, canals and parks), results (V16) is the two
// numbers the creator says in the matplotlib idiom. field and ten live in Dparts.tsx, deskclock in
// Ddesk.tsx. No place name anywhere on the map; no number on the chart the creator did not say.

// ─────────────────────────────────────────────────────────────────────────────
// V7 citymap: "And then I drove around the city for 3 days straight to deliver them by hand."
// The real map underneath (assets[0], 2048x1024), shown as a CROP at 1.6x the fit-to-width
// scale so blocks and streets read at card size, with the camera following the car the way a
// maps app follows you. On top of it, the maps-app layer we own: one blue route drawn behind a
// car that moves at a RATE, a red pin with an envelope in it every `pinEveryMs`. The only words
// on the card are the DAY chip the creator says.
// ─────────────────────────────────────────────────────────────────────────────

export type CitymapData = { days: string[]; pinEveryMs: number; map?: string };

const MAP_W = 2048;
const MAP_H = 1024;
const ZOOM_K = 1.6;   // of the fit-to-width scale: a crop, never the whole sheet squeezed in
const SPEED = 295;    // map px per second. A run card gets a rate, never a duration.

// Waypoints picked ON the real white streets of assets[0] (each within a few px of a white
// pixel, measured against the image): down the NW arterial, east along the main road, then
// north up the road that runs beside the canal. Two real corners, real bends in between.
const ROUTE: [number, number][] = [
  [615, 197], [664, 296], [700, 395], [751, 498], [802, 618], [866, 728],
  [960, 762], [1082, 790], [1090, 760], [1095, 700], [1101, 600], [1101, 420], [1098, 250],
];

type Seg = { ax: number; ay: number; bx: number; by: number; len: number; acc: number };
const SEGS: Seg[] = (() => {
  const out: Seg[] = [];
  let acc = 0;
  for (let i = 1; i < ROUTE.length; i++) {
    const [ax, ay] = ROUTE[i - 1];
    const [bx, by] = ROUTE[i];
    const len = Math.hypot(bx - ax, by - ay);
    acc += len;
    out.push({ ax, ay, bx, by, len, acc });
  }
  return out;
})();
const TOTAL = SEGS[SEGS.length - 1].acc;

const atLen = (d: number): { x: number; y: number; a: number } => {
  const v = Math.max(0, Math.min(TOTAL, d));
  const s = SEGS.find((g) => g.acc >= v) ?? SEGS[SEGS.length - 1];
  const t = (v - (s.acc - s.len)) / s.len;
  return {
    x: s.ax + (s.bx - s.ax) * t,
    y: s.ay + (s.by - s.ay) * t,
    a: (Math.atan2(s.by - s.ay, s.bx - s.ax) * 180) / Math.PI,
  };
};

/** where the car is at a given time (before `drove` it waits at the first waypoint) */
const carAt = (tMs: number, drove: number) => atLen(((tMs - drove) / 1000) * SPEED);

/**
 * The maps-app camera: the car's position averaged over a symmetric window, so the frame leads
 * into a corner and leaves it late instead of snapping. One smooth drift, no jump, clamped so
 * the real map always fills the card.
 */
const camAt = (tMs: number, drove: number, halfW: number, halfH: number): { x: number; y: number } => {
  const N = 22;          // +-22 frames at 30 fps = +-0.73 s of look-ahead / look-back
  const STEP = 1000 / 30;
  let sx = 0, sy = 0;
  for (let k = -N; k <= N; k++) {
    const p = carAt(Math.max(drove, tMs + k * STEP), drove);
    sx += p.x; sy += p.y;
  }
  const n = 2 * N + 1;
  return {
    x: Math.max(halfW, Math.min(MAP_W - halfW, sx / n)),
    y: Math.max(halfH, Math.min(MAP_H - halfH, sy / n)),
  };
};

/** a maps-app drop pin with a tiny envelope in its head; `u` is px per screen px */
const Pin: React.FC<{ x: number; y: number; s: number; u: number }> = ({ x, y, s, u }) => {
  const e = easeOut(s);
  const bounce = Math.sin(Math.PI * e) * 6;
  const k = u * (0.62 + 0.38 * e);
  return (
    <g transform={`translate(${x} ${y - (1 - e) * 34 * u - bounce * u}) scale(${k})`} opacity={Math.min(1, s * 3)}>
      <ellipse cx={0} cy={2} rx={9} ry={3.2} fill="rgba(0,0,0,0.22)" />
      <path
        d="M 0 0 C -9 -14 -15 -21 -15 -29 A 15 15 0 1 1 15 -29 C 15 -21 9 -14 0 0 Z"
        fill="#EA4335" stroke="#FFFFFF" strokeWidth={2.8} strokeLinejoin="round"
      />
      <rect x={-8} y={-35} width={16} height={11} fill="#FFFFFF" />
      <path d="M -8 -35 L 0 -28.6 L 8 -35" fill="none" stroke="#EA4335" strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
};

export const Citymap: React.FC<CardProps & { data: CitymapData }> = ({ tMs, w, h, toMs, beats, assets, data }) => {
  const s = (w / MAP_W) * ZOOM_K;         // the crop's scale: 1.6x fit-to-width
  const u = 1 / s;                        // one screen px, in map units
  const cam = camAt(tMs, beats.drove, w / (2 * s), h / (2 * s));
  const tx = w / 2 - cam.x * s;
  const ty = h / 2 - cam.y * s;

  const d = Math.max(0, ((tMs - beats.drove) / 1000) * SPEED);
  const car = carAt(tMs, beats.drove);

  const pins: number[] = [];
  for (let t = beats.deliver; t <= toMs; t += Math.max(120, data.pinEveryMs)) pins.push(t);

  const dayIdx = tMs < beats.days ? -1 : Math.min(data.days.length - 1, Math.floor((tMs - beats.days) / 350));
  const chipS = dayIdx < 0 ? 0 : clamp01((tMs - (beats.days + dayIdx * 350)) / 160);

  const pts = ROUTE.map((p) => p.join(",")).join(" ");

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#EDEEEA" }}>
      {/* the real render is a pale positron sheet: land 237, blocks 234, streets 255. A straight
          contrast() pivots at mid grey and blows all of it to white, so the tone is stretched
          with a linear transfer instead: everything below white is pulled down, white stays white,
          and the real streets, blocks, park and canal read at card size. */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="citymapTone" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope="2.6" intercept="-1.6" />
              <feFuncG type="linear" slope="2.6" intercept="-1.6" />
              <feFuncB type="linear" slope="2.6" intercept="-1.6" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: tx, top: ty, width: MAP_W * s, height: MAP_H * s,
          display: "block", filter: "url(#citymapTone)",
        }}
      />
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>a maps app: three days of driving, the route growing and a pin at every drop</title>
        <g transform={`translate(${tx} ${ty}) scale(${s})`}>
          {/* the route: one blue line with its casing, drawing behind the car */}
          <polyline points={pts} fill="none" stroke="#0B47A4" strokeWidth={13 * u} strokeOpacity={0.55}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${d.toFixed(1)} ${TOTAL}`} />
          <polyline points={pts} fill="none" stroke="#1A73E8" strokeWidth={8 * u}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${d.toFixed(1)} ${TOTAL}`} />

          {pins.map((t) => {
            const ps = clamp01((tMs - t) / 260);
            if (ps <= 0) return null;
            const p = carAt(t, beats.drove);
            return <Pin key={t} x={p.x} y={p.y} s={ps} u={u} />;
          })}

          {/* the car: a small marker seen from above, always the same size on screen */}
          <g transform={`translate(${car.x} ${car.y}) rotate(${car.a}) scale(${u})`}>
            <ellipse cx={0} cy={5} rx={30} ry={14} fill="rgba(0,0,0,0.22)" />
            <rect x={-29} y={-16} width={58} height={32} rx={10} fill="#FFFFFF" stroke="#16325C" strokeWidth={2.6} />
            <rect x={-16} y={-11.5} width={26} height={23} rx={5} fill="#1F3A5F" />
            <rect x={11} y={-9} width={9} height={18} rx={3} fill="#BFD2E8" />
            <rect x={-24} y={-8} width={7} height={16} rx={3} fill="#BFD2E8" />
            <rect x={-17} y={-16.5} width={5} height={4} fill="#16325C" />
            <rect x={-17} y={12.5} width={5} height={4} fill="#16325C" />
          </g>
        </g>
      </svg>

      {dayIdx >= 0 && (
        <div
          style={{
            position: "absolute", left: 0.024 * w, top: 0.042 * h,
            opacity: Math.min(1, chipS * 2.4),
            transform: `scale(${0.9 + 0.1 * easeOut(chipS)})`, transformOrigin: "left top",
          }}
        >
          <Chip text={data.days[dayIdx]} fs={chipFs(w)} />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V16 results: "Now for the results. After 3 days of work it landed us over a dozen calls."
// Their two numbers and nothing else, in the matplotlib idiom: a box of thin black spines,
// outward ticks with no labels (a number the creator did not say would be an invention), no legend,
// no axis name. The grey bar is the letters, the accent bar is the calls, and each carries
// its own figure.
// ─────────────────────────────────────────────────────────────────────────────

export type ResultsBar = { name: string; value: number; figure: string; lit?: boolean };
export type ResultsData = { bars: ResultsBar[] };

const FIG = "'DejaVu Sans', Verdana, Arial, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";
const GREY = "#7f7f7f";
const GRID = "#e6e6e6";

export const Results: React.FC<CardProps & { data: ResultsData }> = ({ tMs, w, h, fps, beats, data }) => {
  const bars = data.bars ?? [];
  const fsLabel = Math.round(0.031 * w);   // 30 device px, the reel's caption font
  const fsFig = Math.round(0.056 * w);     // 54 device px, the notebook figure face
  const L = Math.round(0.128 * w), R = w - Math.round(0.062 * w);
  const T = Math.round(0.105 * h), B = h - Math.round(0.205 * h);
  const ph = B - T;

  // headroom over the tallest bar so its figure lands inside the axes, not on the top spine
  const top = Math.max(1, ...bars.map((b) => b.value)) * 1.34;
  const y = (v: number) => B - (v / top) * ph;
  const slot = (R - L) / Math.max(1, bars.length);
  const cx = (i: number) => L + (i + 0.5) * slot;
  const bw = slot * 0.40;

  const axS = sp(tMs, beats.now, fps, { damping: 15, stiffness: 340, mass: 0.6 });
  const axO = Math.min(1, ramp(tMs, beats.now, beats.now + 160));

  // bar 0 rises over "after 3 days of work", bar 1 on "landed" and settles on "dozen"
  const span = (i: number): [number, number] =>
    i === 0 ? [beats.after, beats.work] : [beats.landed, beats.dozen];

  const ticks = [0, 1, 2, 3, 4, 5].map((k) => (top * k) / 5);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>the letters delivered and the calls they landed</title>
        <g opacity={axO} transform={`translate(0 ${(1 - axS) * 10})`}>
          {ticks.slice(1, -1).map((v) => (
            <line key={`g${v}`} x1={L + 1} y1={y(v)} x2={R - 1} y2={y(v)} stroke={GRID} strokeWidth={1.2} />
          ))}
          <rect x={L} y={T} width={R - L} height={ph} fill="none" stroke={SPINE} strokeWidth={1.8} />
          {ticks.map((v) => (
            <line key={`t${v}`} x1={L - 9} y1={y(v)} x2={L} y2={y(v)} stroke={SPINE} strokeWidth={1.6} />
          ))}
          {bars.map((b, i) => (
            <line key={`bt${b.name}`} x1={cx(i)} y1={B} x2={cx(i)} y2={B + 9} stroke={SPINE} strokeWidth={1.6} />
          ))}
          {bars.map((b, i) => (
            <text
              key={`bl${b.name}`} x={cx(i)} y={B + 9 + fsLabel * 1.28} textAnchor="middle"
              fontSize={fsLabel} fontWeight={700} fill={TXT}
              style={{ fontFamily: LABEL_FONT, letterSpacing: "0.02em" }}
            >
              {b.name}
            </text>
          ))}
        </g>

        {bars.map((b, i) => {
          const [a, z] = span(i);
          const rise = easeOut(clamp01((tMs - a) / Math.max(80, z - a)));
          if (rise <= 0) return null;
          const t0 = y(b.value * rise);
          return (
            <rect
              key={`bar${b.name}`} x={cx(i) - bw / 2} y={t0} width={bw} height={B - t0}
              style={b.lit ? { fill: ACCENT } : undefined} fill={b.lit ? undefined : GREY}
            />
          );
        })}

        {bars.map((b, i) => {
          const [, z] = span(i);
          const fs = sp(tMs, z, fps, { damping: 14, stiffness: 330, mass: 0.7 });
          if (fs <= 0.01) return null;
          return (
            <text
              key={`fig${b.name}`} x={cx(i)} y={y(b.value) - 0.034 * h - (1 - fs) * 14}
              textAnchor="middle" fontSize={fsFig} fontWeight={700} fontFamily={FIG}
              opacity={Math.min(1, fs * 2.2)} fill={b.lit ? undefined : TXT}
              style={b.lit ? { fill: ACCENT } : undefined}
            >
              {b.figure}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  citymap: Citymap as React.FC<CardProps & { data: any }>,
  results: Results as React.FC<CardProps & { data: any }>,
  deskclock: Deskclock as React.FC<CardProps & { data: DeskclockData }>,
  field: Field as React.FC<CardProps & { data: FieldData }>,
  ten: Ten as React.FC<CardProps & { data: TenData }>,
};
