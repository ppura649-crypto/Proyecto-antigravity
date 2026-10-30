// Hook X5, the room: a black glass floor that meets the dark at a faint horizon, spotlights with a real source above
// the stage (volumetric cone, a pool on the floor, dust lit only inside the beam), ripples that run across the glass
// like liquid, the droplets flung off when the reflection tears free, and the anamorphic flare of the payoff.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { QWEN } from "./parts";

export const W = 900;
export const H = 930;
export const FLOOR = 700;
export const HORIZON = 520;

/** deterministic noise, 0..1 */
export const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** the void and the glass: horizon haze, the floor's gloss darkening toward the lens, receding seams for depth */
export const Floor: React.FC<{ camX: number; violet: number }> = ({ camX, violet }) => {
  const vx = W / 2 - camX * 0.35;
  const lines = Array.from({ length: 15 }, (_, i) => i - 7);
  const rows = Array.from({ length: 7 }, (_, i) => i);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HORIZON, background: "linear-gradient(to bottom, #060607 0%, #0B0B0E 70%, #14141A 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: HORIZON, width: W, height: H - HORIZON, background: "linear-gradient(to bottom, #111116 0%, #060608 30%, #030304 100%)" }} />
      <div style={{ position: "absolute", left: -100, top: HORIZON - 30, width: W + 200, height: 60, background: `radial-gradient(ellipse 50% 50% at ${50 - camX * 0.02}% 50%, ${violet > 0.3 ? "rgba(140,130,255,0.16)" : "rgba(255,225,200,0.12)"}, transparent 70%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="hx5seam" x1="0" y1={HORIZON} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.05} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {lines.map((k) => (
          <line key={k} x1={vx + k * 60} y1={HORIZON} x2={vx + k * 420 - camX * 0.6} y2={H} stroke="url(#hx5seam)" strokeWidth={1.2} />
        ))}
        {rows.map((r) => {
          const y = HORIZON + (H - HORIZON) * Math.pow((r + 1) / 8, 1.9);
          return <line key={r} x1={0} y1={y} x2={W} y2={y} stroke="#FFFFFF" strokeOpacity={0.015 + 0.02 * ((r + 1) / 8)} strokeWidth={1} />;
        })}
        <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={1.5} />
      </svg>
    </>
  );
};

export type Spot = { x: number; k: number; color: string };

/** the cone of light from above and the pool it makes on the glass, with the mark's contact shadow in it */
export const Beam: React.FC<{ s: Spot; id: string }> = ({ s, id }) => {
  if (s.k <= 0.01) return null;
  const top = -120;
  const w0 = 50;
  const w1 = 250;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1={top} x2="0" y2={FLOOR + 40} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={s.color} stopOpacity={0.3 * s.k} />
          <stop offset="0.6" stopColor={s.color} stopOpacity={0.1 * s.k} />
          <stop offset="1" stopColor={s.color} stopOpacity={0.16 * s.k} />
        </linearGradient>
        <radialGradient id={`${id}p`}>
          <stop offset="0" stopColor={s.color} stopOpacity={0.42 * Math.min(1.4, s.k)} />
          <stop offset="0.45" stopColor={s.color} stopOpacity={0.12 * s.k} />
          <stop offset="1" stopColor={s.color} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}b`} x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <polygon points={`${s.x - w0},${top} ${s.x + w0},${top} ${s.x + w1},${FLOOR} ${s.x - w1},${FLOOR}`} fill={`url(#${id}g)`} filter={`url(#${id}b)`} />
      <ellipse cx={s.x} cy={FLOOR + 6} rx={330} ry={62} fill={`url(#${id}p)`} />
      <ellipse cx={s.x} cy={FLOOR + 30} rx={220} ry={150} fill={`url(#${id}p)`} opacity={0.35} />
    </svg>
  );
};

/** the dark bite under a mark standing in its pool */
export const Contact: React.FC<{ x: number; w: number; k: number }> = ({ x, w, k }) => (
  <div style={{ position: "absolute", left: x - w * 0.55, top: FLOOR - 14, width: w * 1.1, height: 28, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.85), transparent 70%)", opacity: k }} />
);

export type Ripple = { at: number; x: number; amp: number; color: string; reach: number };

/** rings racing out across the glass from a point, three per event, flattened by the floor's perspective */
export const Ripples: React.FC<{ f: number; list: Ripple[] }> = ({ f, list }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {list.flatMap((r, i) =>
      [0, 5, 11].map((d, j) => {
        const u = prog(f, r.at + d, 46, ease.outHard);
        if (u <= 0 || u >= 1) return null;
        const rx = 30 + r.reach * u * (1 - 0.18 * j);
        return (
          <ellipse key={`${i}-${j}`} cx={r.x} cy={FLOOR + 4} rx={rx} ry={rx * 0.13} fill="none" stroke={r.color} strokeWidth={(4 - j) * (1 - u) + 0.5} opacity={r.amp * (1 - u) * (1 - 0.25 * j)} />
        );
      }),
    )}
  </svg>
);

/** liquid glass flung up when the reflection tears out of the floor: arcs under gravity, trails, back into the glass */
export const Droplets: React.FC<{ f: number; at: number; x: number; n: number; power: number }> = ({ f, at, x, n, power }) => {
  const k = f - at;
  if (k < 0 || k > 60) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 0 6px ${QWEN})` }}>
      {Array.from({ length: n }, (_, i) => {
        const vx = (rnd(i, 1) - 0.5) * 14 * power;
        const vy = -(5 + 11 * rnd(i, 2)) * power;
        const x0 = x + (rnd(i, 3) - 0.5) * 220;
        const pos = (s: number) => ({ x: x0 + vx * s, y: FLOOR + vy * s + 0.42 * s * s });
        const p = pos(k);
        if (p.y > FLOOR + 2) return null;
        const q = pos(Math.max(0, k - 3));
        const r = 1.6 + 3.2 * rnd(i, 4);
        return (
          <g key={i}>
            <line x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke="#C9C6FF" strokeOpacity={0.55} strokeWidth={r * 1.1} strokeLinecap="round" />
            <circle cx={p.x} cy={p.y} r={r} fill="#F2F1FF" />
          </g>
        );
      })}
    </svg>
  );
};

/** dust hanging in the air: near motes big and soft, far ones small; each lights up only inside a beam */
export const Dust: React.FC<{ f: number; camX: number; spots: Spot[] }> = ({ f, camX, spots }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: 80 }, (_, i) => {
      const z = 0.5 + 1.8 * rnd(i, 11);
      const x = ((rnd(i, 12) * 1300 - 200 - camX * (z - 0.8) + Math.sin(f / 50 + i) * 12) % 1300 + 1300) % 1300 - 200;
      const y = (((rnd(i, 13) * 760 - f * 0.35 * z) % 760) + 760) % 760 - 60;
      let lit = 0.05;
      for (const s of spots) {
        const half = 50 + (200 * (y + 120)) / (FLOOR + 120);
        lit += Math.max(0, 1 - Math.abs(x - s.x) / half) * 0.8 * Math.min(1.3, s.k);
      }
      const tw = 0.7 + 0.3 * Math.sin(f / 6 + i * 1.7);
      return <circle key={i} cx={x} cy={y} r={0.9 * z * z} fill="#FFF3E8" opacity={Math.min(0.9, lit * tw * (0.35 + 0.3 * z))} />;
    })}
  </svg>
);

/** the payoff light: bloom behind Qwen and a thin anamorphic streak through it, breathing once it has hit */
export const Flare: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const u = prog(f, at, 10, ease.outHard);
  if (u <= 0) return null;
  const hit = 1 - prog(f, at + 3, 30, ease.out);
  const breathe = 0.85 + 0.15 * Math.sin(f / 7);
  const k = (0.55 + 0.45 * hit) * breathe;
  return (
    <>
      <div style={{ position: "absolute", left: x - 360, top: y - 360, width: 720, height: 720, borderRadius: "50%", background: `radial-gradient(circle, rgba(170,165,255,${(0.5 * k).toFixed(3)}) 0%, rgba(97,92,237,${(0.28 * k).toFixed(3)}) 30%, transparent 66%)`, transform: `scale(${(0.6 + 0.4 * u).toFixed(3)})` }} />
      <div style={{ position: "absolute", left: x - 700 * u, top: y - 3, width: 1400 * u, height: 6, borderRadius: 3, background: "linear-gradient(to right, transparent, rgba(140,135,255,0.55) 30%, #FFFFFF 50%, rgba(140,135,255,0.55) 70%, transparent)", opacity: k, filter: "blur(1.5px)" }} />
      <div style={{ position: "absolute", left: x - 260, top: y - 1, width: 520, height: 2, background: "linear-gradient(to right, transparent, #FFFFFF, transparent)", opacity: 0.9 * k }} />
    </>
  );
};
