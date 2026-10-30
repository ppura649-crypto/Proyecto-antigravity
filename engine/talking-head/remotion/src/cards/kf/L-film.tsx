import React from "react";
import { Img } from "remotion";
import { BASE, FH, FW, FY, MONO, PERF, PITCH, SH } from "./L-util";
// keyframes-v1 builder L: the film objects of the hook. A 35 mm print-stock cell (their real frame in the window,
// KS perforations cut through so the video shows behind them, amber edge numbers), a leader tail, the steel splicer
// (bed, blade carriage, guillotine blade) and the take-up reel (a vertical-axis drum of wound film between two
// steel flanges). Design px, card 1080 x 490. Square corners everywhere except the real round parts.

// a rounded-rect subpath, for evenodd holes
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const perfs = (len: number) => {
  let d = "";
  for (let x = PERF.x0; x + PERF.w <= len; x += PERF.pitch)
    d += rr(x, PERF.edge, PERF.w, PERF.h, 3) + rr(x, SH - PERF.edge - PERF.h, PERF.w, PERF.h, 3);
  return d;
};
const CELL_PATH = `M0 0H${PITCH}V${SH}H0Z` + `M5 ${FY}H${5 + FW}V${FY + FH}H5Z` + perfs(PITCH);
const GLOSS = "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 14%, rgba(255,255,255,0) 82%, rgba(255,255,255,0.05) 100%)";

export const Cell: React.FC<{ src: string; n: number; x: number }> = ({ src, n, x }) => (
  <div style={{ position: "absolute", left: x, top: 0, width: PITCH, height: SH }}>
    <Img src={src} style={{ position: "absolute", left: 5, top: FY, width: FW, height: FH, objectFit: "cover",
      filter: "contrast(1.06) saturate(0.92) sepia(0.07)" }} />
    <svg width={PITCH} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={CELL_PATH} fill={BASE} fillRule="evenodd" fillOpacity={0.97} />
    </svg>
    <div style={{ position: "absolute", left: 8, top: FY + FH + 1, fontFamily: MONO, fontWeight: 500, fontSize: 9.5,
      lineHeight: 1, color: "#c98a2e", opacity: 0.85, letterSpacing: 0.5 }}>{`KF 27 ${1100 + n * 2}`}</div>
    <div style={{ position: "absolute", left: 96, top: FY - 11, fontFamily: MONO, fontWeight: 500, fontSize: 9.5,
      lineHeight: 1, color: "#c98a2e", opacity: 0.85 }}>{`${n + 12}A`}</div>
    <div style={{ position: "absolute", inset: 0, background: GLOSS }} />
  </div>
);

// the tail: black leader with perforations and a diagonal cut end
export const LEADER = 200;
export const Leader: React.FC<{ x: number }> = ({ x }) => (
  <div style={{ position: "absolute", left: x, top: 0, width: LEADER, height: SH,
    clipPath: `polygon(0 0, 100% 0, 62% 100%, 0 100%)` }}>
    <svg width={LEADER} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={`M0 0H${LEADER}V${SH}H0Z` + perfs(LEADER)} fill="#0b0907" fillRule="evenodd" />
    </svg>
    <div style={{ position: "absolute", inset: 0, background: GLOSS }} />
  </div>
);

// brushed steel
export const STEEL = "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.035) 1px 3px), " +
  "linear-gradient(180deg, #d5d8dc 0%, #a4a9b0 38%, #c3c7cc 62%, #80858c 100%)";
const Screw: React.FC<{ x: number; y: number; r?: number; a?: number }> = ({ x, y, r = 8, a = 30 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #f2f3f5, #8b9097 60%, #5b6066)",
    boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.4)" }}>
    <div style={{ position: "absolute", left: 1, top: r - 1.2, width: 2 * r - 2, height: 2.4, background: "#3a3e43",
      transform: `rotate(${a}deg)` }} />
  </div>
);

// the bed plate behind the film: a film channel, the blade slot at x 540, four screws
export const Bed: React.FC = () => (
  <div style={{ position: "absolute", left: 392, top: 40, width: 296, height: 444, background: STEEL,
    boxShadow: "0 24px 46px rgba(0,0,0,0.55), 0 6px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(0,0,0,0.35)" }}>
    {[44, 406].map((y) => (
      <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 6,
        background: "linear-gradient(180deg, #6c7178, #b9bdc3 60%, #7d8289)" }} />
    ))}
    <div style={{ position: "absolute", left: 540 - 392 - 4, top: 12, width: 8, height: 420,
      background: "linear-gradient(90deg, #2c2f33, #0f1012 50%, #5a5f65)" }} />
    <Screw x={20} y={20} /><Screw x={276} y={20} a={-20} /><Screw x={20} y={424} a={70} /><Screw x={276} y={424} a={10} />
  </div>
);

// the blade carriage above the film (the blade hangs inside it)
export const Housing: React.FC = () => (
  <div style={{ position: "absolute", left: 448, top: 0, width: 184, height: 82,
    background: "linear-gradient(180deg, #e3e6e9 0%, #b3b8be 30%, #8e949b 78%, #5d6268 100%)",
    boxShadow: "0 14px 22px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -3px 0 rgba(0,0,0,0.35)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 58, height: 3, background: "rgba(0,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: 84, top: 70, width: 16, height: 16, background: "#1a1c1f" }} />
    <Screw x={22} y={30} r={9} /><Screw x={162} y={30} r={9} a={-40} />
  </div>
);

// the guillotine blade: its slanted edge at y = tip
export const Blade: React.FC<{ tip: number }> = ({ tip }) => (
  <div style={{ position: "absolute", left: 528, top: 40, width: 24, height: Math.max(0, tip - 40),
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 16px))",
    background: "linear-gradient(90deg, #8b9198 0%, #eef1f4 40%, #ffffff 52%, #a7adb4 64%, #6d737a 100%)",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.2)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, height: 14,
      background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.9))", transform: "skewY(-33deg)" }} />
  </div>
);

// a steel flange with five round windows and a keyed hub, drawn face-on (the caller lays it flat in 3D)
export const Flange: React.FC<{ R: number; spinDeg: number }> = ({ R, spinDeg }) => {
  let d = `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0Z`;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2, cx = Math.cos(a) * R * 0.58, cy = Math.sin(a) * R * 0.58, rr2 = R * 0.24;
    d += `M${cx - rr2} ${cy}A${rr2} ${rr2} 0 1 0 ${cx + rr2} ${cy}A${rr2} ${rr2} 0 1 0 ${cx - rr2} ${cy}Z`;
  }
  d += `M-9 -9H9V9H-9Z`;
  return (
    <svg width={2 * R} height={2 * R} viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} style={{ position: "absolute", left: -R, top: -R, overflow: "visible" }}>
      <defs>
        <linearGradient id="lflg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eceff2" /><stop offset="0.45" stopColor="#9aa0a7" />
          <stop offset="0.6" stopColor="#d9dde1" /><stop offset="1" stopColor="#6b7178" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${spinDeg})`}>
        <path d={d} fill="url(#lflg)" fillRule="evenodd" stroke="#50555b" strokeWidth={2} />
        <circle r={R * 0.2} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
        <circle r={R - 5} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      </g>
    </svg>
  );
};
