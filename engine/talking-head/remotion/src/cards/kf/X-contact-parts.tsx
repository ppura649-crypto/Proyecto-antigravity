import React from "react";
import { MONO } from "./L-util";
// keyframes-v1 builder X (2026-09-25): the physical parts of the contact-sheet hook. A glossy contact print of six
// vertical 35 mm strips of their raw frames (black rebates, perforations, edge numbers), the red grease-pencil ring,
// the china marker that draws it, the light table under the sheet.

// sheet geometry (sheet px); the strips run vertically so their vertical frames stand upright
export const SHEET = { w: 960, h: 580 };
export const FR = { w: 100, h: 150, reb: 23, gap: 10, sgap: 8, x0: 22, y0: 30, lead: 20 };
export const STRIP_W = FR.w + 2 * FR.reb;
export const frameRect = (col: number, row: number) => ({
  x: FR.x0 + col * (STRIP_W + FR.sgap) + FR.reb, y: FR.y0 + FR.lead + row * (FR.h + FR.gap), w: FR.w, h: FR.h,
});
export const COLS: string[][] = [
  ["R-roll-08.jpg", "R-roll-02.jpg", "R-roll-15.jpg"],
  ["R-roll-10.jpg", "R-roll-04.jpg", "R-roll-16.jpg"],
  ["L-f01.jpg", "L-f03.jpg", "L-f04.jpg"],
  ["L-f05.jpg", "L-f08.jpg", "L-f09.jpg"],
  ["L-f11.jpg", "L-f13.jpg", "L-f15.jpg"],
  ["R-roll-18.jpg", "R-roll-06.jpg", "R-roll-21.jpg"],
];
export const TARGET = { col: 3, row: 1 };

const Strip: React.FC<{ col: number; src: (n: string) => string; hideTarget: boolean; glow: number; cols: string[][] }> = ({ col, src, hideTarget, glow, cols }) => {
  const x = FR.x0 + col * (STRIP_W + FR.sgap), len = 2 * FR.lead + 3 * FR.h + 2 * FR.gap;
  const holes: React.ReactNode[] = [];
  for (let i = 0; i * 20.6 + 8 < len - 6; i++) {
    for (const hx of [5, STRIP_W - 13.6]) holes.push(
      <div key={`${i}-${hx}`} style={{ position: "absolute", left: hx, top: 6 + i * 20.6, width: 8.6, height: 12, borderRadius: 1.8,
        background: "#030303", boxShadow: "inset 0 0 0 0.8px rgba(120,110,95,0.35)" }} />,
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: FR.y0, width: STRIP_W, height: len, background: "#15130f",
      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.6)" }}>
      {holes}
      {cols[col]!.map((img, row) => {
        const r = frameRect(col, row), isT = col === TARGET.col && row === TARGET.row;
        const n = 11 + col * 3 + row;
        return (
          <React.Fragment key={row}>
            <div style={{ position: "absolute", left: FR.reb, top: r.y - FR.y0, width: FR.w, height: FR.h, overflow: "hidden",
              background: isT && hideTarget ? "#ffffff" : "#000",
              boxShadow: isT && hideTarget ? `0 0 ${12 + 18 * glow}px ${4 + 7 * glow}px rgba(255,255,255,${0.6 + 0.35 * glow}), 0 0 ${40 * glow}px ${10 * glow}px rgba(235,244,255,${0.5 * glow})` : undefined }}>
              {!(isT && hideTarget) && <FrameImg src={src(img)} />}
            </div>
            <div style={{ position: "absolute", left: STRIP_W - 21, top: r.y - FR.y0 + 58, fontFamily: MONO, fontSize: 9, fontWeight: 700,
              color: "#e0a23c", opacity: 0.85, transform: "rotate(90deg)", transformOrigin: "0 0", whiteSpace: "nowrap", letterSpacing: 1 }}>
              {`${n}  ▸${n}A`}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
export const FrameImg: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "50% 30%",
    filter: "contrast(1.1) saturate(0.95)", boxShadow: "inset 0 0 10px rgba(0,0,0,0.35)" }} />
);

// the grease-pencil ring round the target: a hand-drawn loop, a touch over one turn, waxy and broken
const T = frameRect(TARGET.col, TARGET.row);
const RC = { x: T.x + T.w / 2 + 2, y: T.y + T.h / 2 + 1, rx: 68, ry: 97 };
export const RING: [number, number][] = Array.from({ length: 72 }, (_, i) => {
  const u = i / 71, a = (-35 - 405 * u) * (Math.PI / 180);
  const wob = 1 + 0.035 * Math.sin(3 * a + 0.7) + 0.05 * u;
  return [RC.x + RC.rx * wob * Math.cos(a) + 6 * u, RC.y + RC.ry * wob * Math.sin(a) - 4 * u];
});
export const ringAt = (p: number): [number, number] => {
  const f = Math.max(0, Math.min(1, p)) * (RING.length - 1), i = Math.min(RING.length - 2, Math.floor(f)), k = f - i;
  const [a, b] = [RING[i]!, RING[i + 1]!];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
};
const RING_D = RING.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const Ring: React.FC<{ p: number; id: string; color: string }> = ({ p, id, color }) => (
  <svg width={SHEET.w} height={SHEET.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="11" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.3" result="ga" />
        <feComposite in="d" in2="ga" operator="in" />
      </filter>
    </defs>
    {p > 0 && (
      <path d={RING_D} pathLength={1} fill="none" stroke={color} strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={`${p} 2`} filter={`url(#${id})`} opacity={0.93} />
    )}
  </svg>
);

// the whole print: paper, strips, the ring
export const SheetContent: React.FC<{ src: (n: string) => string; ring: number; hideTarget: boolean; glow: number; id: string;
  cols?: string[][]; ringColor?: string; children?: React.ReactNode }> =
  ({ src, ring, hideTarget, glow, id, cols = COLS, ringColor = "#cf1f1b", children }) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: SHEET.w, height: SHEET.h,
      background: "linear-gradient(172deg, #f1eee6 0%, #e9e5dc 55%, #e2ddd2 100%)" }}>
      {cols.map((_, c) => <Strip key={c} col={c} src={src} hideTarget={hideTarget} glow={glow} cols={cols} />)}
      {children}
      <Ring p={ring} id={id} color={ringColor} />
    </div>
  );

// the china marker: red wax point, paper wrap with its pull string; `x,y` is the wax tip in screen px
export const Marker: React.FC<{ x: number; y: number; deg: number; lift: number; opacity: number }> = ({ x, y, deg, lift, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity }}>
    {/* its soft shadow on the paper, drifting off as it lifts */}
    <div style={{ position: "absolute", left: 10 + 26 * lift, top: 8 + 30 * lift, width: 330, height: 20, borderRadius: 10,
      transformOrigin: "0 50%", transform: `rotate(${deg}deg)`, background: "rgba(0,0,0,0.28)", filter: `blur(${6 + 8 * lift}px)` }} />
    <div style={{ position: "absolute", left: 0, top: -11, width: 360, height: 22, transformOrigin: "0 50%",
      transform: `translate(${lift * 60}px, ${-lift * 80}px) rotate(${deg}deg)` }}>
      <div style={{ position: "absolute", left: 0, top: 3, width: 40, height: 16,
        clipPath: "polygon(0 42%, 100% 0, 100% 100%, 0 58%)",
        background: "linear-gradient(180deg, #e2413a 0%, #b3161a 45%, #6e0b0e 100%)" }} />
      <div style={{ position: "absolute", left: 38, top: 0, width: 322, height: 22, borderRadius: "2px 6px 6px 2px",
        background: "linear-gradient(180deg, #ffffff 0%, #f1efe9 35%, #cfcbc2 80%, #a9a59c 100%)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(62deg, rgba(0,0,0,0) 0 26px, rgba(120,110,100,0.45) 26px 27px)" }} />
        <div style={{ position: "absolute", left: 70, top: 0, width: 150, height: 22,
          background: "linear-gradient(180deg, #d8322c 0%, #b11a1a 50%, #7a1012 100%)", opacity: 0.92 }} />
        <div style={{ position: "absolute", left: 18, top: 0, width: 1.2, height: 22, background: "rgba(90,20,20,0.7)" }} />
      </div>
    </div>
  </div>
);
