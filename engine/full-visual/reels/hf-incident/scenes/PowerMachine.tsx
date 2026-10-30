// `power`: the "login renewal" machine, a chunky brass-and-slate box with an intake slot on top, a glass gear window,
// a little screen with a renewal arrow, and an output slot. A bug (a small beetle) walks across it and crawls into the
// gears on "bug": sparks, a jolt, the screen glitches. On "tokens" its plate lights.
import React from "react";
import { arrive, ease, prog, useScene } from "../../../src/engine";
import { RED } from "./parts";

export type PowerCues = { from: number; power: number; bug: number; renewed: number; tokens: number; turned: number; ro: number; admin: number; to: number };
export const PM = { x: 130, y: 800, w: 640, h: 470 };
export const PM_SLOT = { x: PM.x + 190, y: PM.y, w: 260 };
const GEAR = { x: PM.x + 170, y: PM.y + 300, r: 100 };

const gearPath = (r: number, teeth: number) => {
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.8 : r;
    d += `${i ? "L" : "M"}${(Math.cos(a0) * rr).toFixed(1)} ${(Math.sin(a0) * rr).toFixed(1)} L${(Math.cos(a1) * rr).toFixed(1)} ${(Math.sin(a1) * rr).toFixed(1)} `;
  }
  return d + "Z";
};

/** gear angle: idle turn, a stall at the bug, fast after "renewed" */
const turn = (f: number, c: PowerCues) => {
  const idle = f * 1.2;
  const fast = f > c.renewed ? (f - c.renewed) * 5 * prog(f, c.renewed, 12) : 0;
  const stall = f >= c.bug && f < c.bug + 10 ? Math.sin((f - c.bug) * 2.4) * 6 : 0;
  return idle + fast + stall;
};

export const powerShake = (f: number, c: PowerCues) => (f >= c.bug && f < c.bug + 14 ? Math.sin((f - c.bug) * 3.1) * 5 * (1 - (f - c.bug) / 14) : 0);

const Gears: React.FC<{ a: number }> = ({ a }) => (
  <svg width={GEAR.r * 2} height={GEAR.r * 2} viewBox={`${-GEAR.r} ${-GEAR.r} ${GEAR.r * 2} ${GEAR.r * 2}`} style={{ position: "absolute", left: GEAR.x - PM.x - GEAR.r, top: GEAR.y - PM.y - GEAR.r }}>
    <defs>
      <radialGradient id="pmGlass" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFF6DA" /><stop offset="1" stopColor="#E9C46A" /></radialGradient>
      <clipPath id="pmClip"><circle r={GEAR.r - 10} /></clipPath>
    </defs>
    <circle r={GEAR.r} fill="#B8912F" />
    <circle r={GEAR.r - 10} fill="url(#pmGlass)" />
    <g clipPath="url(#pmClip)">
      <g transform={`translate(-22 -12) rotate(${a.toFixed(1)})`}><path d={gearPath(56, 12)} fill="#5B6472" /><circle r={16} fill="#C9CED6" /></g>
      <g transform={`translate(52 44) rotate(${(-a * 1.5 + 15).toFixed(1)})`}><path d={gearPath(38, 8)} fill="#8A6A2A" /><circle r={10} fill="#E8D39A" /></g>
      <g transform={`translate(40 -56) rotate(${(-a * 1.3).toFixed(1)})`}><path d={gearPath(30, 7)} fill="#3D4552" /></g>
    </g>
    <path d={`M${-GEAR.r + 26} ${-30} A${GEAR.r - 14} ${GEAR.r - 14} 0 0 1 ${-10} ${-GEAR.r + 18}`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={6} fill="none" strokeLinecap="round" />
  </svg>
);

/** the renewal screen: a circular arrow that turns; on the bug it tears into RGB slices for a few frames */
const Screen: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f } = useScene();
  const glitch = f >= c.bug && f < c.bug + 18 && (f - c.bug) % 4 < 3;
  const spin = f * 3 + (f > c.renewed ? (f - c.renewed) * 9 : 0);
  const lit = prog(f, c.tokens - 2, 8);
  const bar = f > c.renewed ? ((f - c.renewed) / 40) % 1 : 0.2;
  const arrow = (col: string, dx: number) => (
    <g transform={`translate(${115 + dx} 70) rotate(${spin.toFixed(1)})`}>
      <path d="M0 -38 A38 38 0 1 1 -36 -12" stroke={col} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M-50 -22 L-34 -2 L-22 -26 Z" fill={col} />
    </g>
  );
  return (
    <div style={{ position: "absolute", left: 360, top: 220, width: 230, height: 170, borderRadius: 18, background: "#0E141B", boxShadow: `inset 0 0 0 4px #2A323D, 0 0 ${(26 * lit).toFixed(1)}px rgba(90,200,250,${(0.7 * lit).toFixed(2)})`, overflow: "hidden" }}>
      <svg width={230} height={170} style={{ position: "absolute", inset: 0 }}>
        {glitch ? (<>{arrow("#FF3B30", -9)}{arrow("#00E5FF", 9)}</>) : arrow("#7FDBFF", 0)}
        <rect x={30} y={134} width={170} height={12} rx={6} fill="#1F2A36" />
        <rect x={30} y={134} width={170 * bar} height={12} rx={6} fill={glitch ? RED : "#34C759"} />
      </svg>
      {glitch && [18, 64, 110].map((y, i) => <div key={y} style={{ position: "absolute", left: (i % 2 ? 14 : -10) + ((f * 7) % 9), top: y, width: 240, height: 10 + i * 4, background: i === 1 ? "rgba(255,59,48,0.5)" : "rgba(127,219,255,0.45)" }} />)}
    </div>
  );
};

export const PowerMachineBody: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const plate = prog(f, c.tokens - 2, 8);
  const plateBump = f >= c.tokens ? 1 + 0.08 * (1 - prog(f, c.tokens, 10)) : 1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PM.w, height: PM.h }}>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: -18, height: 30, borderRadius: 10, background: "#2A2F37" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "linear-gradient(180deg,#46505F 0%,#2C333E 60%,#232932 100%)", boxShadow: "0 40px 70px rgba(15,23,42,0.35), inset 0 3px 0 #6A7586, inset 0 0 0 3px #1B2028" }} />
      <div style={{ position: "absolute", left: PM_SLOT.x - PM.x - 14, top: -10, width: PM_SLOT.w + 28, height: 30, borderRadius: 12, background: "#C9A646", boxShadow: "inset 0 -3px 0 #8A6A2A" }} />
      <div style={{ position: "absolute", left: PM_SLOT.x - PM.x, top: 0, width: PM_SLOT.w, height: 14, borderRadius: 7, background: "#07090C" }} />
      {[[24, 24], [PM.w - 36, 24], [24, PM.h - 36], [PM.w - 36, PM.h - 36]].map(([x, y]) => <div key={`${x}${y}`} style={{ position: "absolute", left: x, top: y, width: 12, height: 12, borderRadius: 6, background: "radial-gradient(circle at 35% 35%,#E8D39A,#8A6A2A)" }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "10px 30px", borderRadius: 12, transform: `scale(${plateBump.toFixed(3)})`, background: plate > 0 ? `linear-gradient(180deg,#FFE7A0,#E0B84A)` : "linear-gradient(180deg,#D8C07A,#A8893A)", boxShadow: `inset 0 0 0 3px #7A5A1C, 0 0 ${(36 * plate).toFixed(1)}px rgba(255,210,30,${(0.85 * plate).toFixed(2)})`, fontFamily: theme.font.ui, fontSize: 44, fontWeight: 800, color: "#2A1E08", whiteSpace: "nowrap" }}>login renewal</div>
      </div>
      <Gears a={turn(f, c)} />
      <Screen c={c} />
      <div style={{ position: "absolute", left: PM_SLOT.x - PM.x - 20, top: PM.h - 58, width: PM_SLOT.w + 40, height: 26, borderRadius: 13, background: "#07090C", boxShadow: "0 3px 0 #5A6372" }} />
    </div>
  );
};

/** the bug: a small beetle crossing the front, into the gear window as "bug" is said; then sparks */
export const PowerBug: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f } = useScene();
  const start = c.bug - 48;
  if (f < start || f > c.bug + 24) return null;
  const p = arrive(f, start, 48);
  const x = PM.x + PM.w - 30 + (GEAR.x + GEAR.r - 20 - (PM.x + PM.w - 30)) * p;
  const y = PM.y + 250 + (GEAR.y - 10 - (PM.y + 250)) * p;
  const inside = prog(f, c.bug, 6, ease.in);
  const leg = Math.sin(f * 1.6) * 5;
  const spark = f >= c.bug ? 1 - prog(f, c.bug + 6, 20, ease.in) : 0;
  const burst = f >= c.bug ? prog(f, c.bug, 10, ease.out) : 0;
  return (
    <>
      {inside < 1 && (
        <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x - 30, top: y - 30, transform: `rotate(-110deg) scale(${(1 - 0.7 * inside).toFixed(3)})`, opacity: prog(f, start, 4, ease.linear) * (1 - inside) }}>
          {[-8, 0, 8].map((ly, i) => (
            <g key={ly} stroke="#1A1208" strokeWidth={3} strokeLinecap="round">
              <line x1={-8} y1={ly} x2={-20} y2={ly + (i % 2 ? leg : -leg)} /><line x1={8} y1={ly} x2={20} y2={ly + (i % 2 ? -leg : leg)} />
            </g>
          ))}
          <ellipse cx={0} cy={4} rx={11} ry={15} fill="#5A2E12" stroke="#1A1208" strokeWidth={2} />
          <line x1={0} y1={-9} x2={0} y2={19} stroke="#1A1208" strokeWidth={2} />
          <circle cx={0} cy={-13} r={7} fill="#1A1208" />
          <path d="M-3 -18 L-9 -27 M3 -18 L9 -27" stroke="#1A1208" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )}
      {spark > 0 && (
        <svg width={320} height={320} viewBox="-160 -160 320 320" style={{ position: "absolute", left: GEAR.x + GEAR.r - 30 - 160, top: GEAR.y - 20 - 160, overflow: "visible", opacity: spark }}>
          <circle r={50 + 60 * burst} fill="#FFF3B0" opacity={0.8 * spark} style={{ filter: "blur(10px)" }} />
          <circle r={22} fill="#FFFFFF" opacity={spark} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + 0.3;
            const r0 = 16 + 40 * burst;
            const r1 = r0 + 40 + (i % 3) * 18;
            return <path key={i} d={`M${Math.cos(a) * r0} ${Math.sin(a) * r0} L${Math.cos(a + 0.12) * (r0 + r1) / 2} ${Math.sin(a + 0.12) * (r0 + r1) / 2} L${Math.cos(a) * r1} ${Math.sin(a) * r1}`} stroke={i % 2 ? "#FFD21E" : "#FFFFFF"} strokeWidth={7} fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #FFD21E)" }} />;
          })}
        </svg>
      )}
    </>
  );
};
