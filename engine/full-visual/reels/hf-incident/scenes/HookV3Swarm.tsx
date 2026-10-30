// Hook V3's swarm: once a cube breaks, its agent climbs out through the cracked roof, turns red and pours toward the
// Hugging Face mark on the horizon with the other 699, as one river. In world space while they are near (true
// perspective, so the front ones are big robots and the rest shrink to streaks), bent into the mark's face in screen
// space for the last stretch so every one of them lands on it. Each impact leaves a spark.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { RED } from "./parts";
import { AgentChip, AgentGlyph } from "./HookV3Agent";
import { Cam, Cell, CELLS, cellAt, FL, project, Times } from "./HookV3World";

type Pt = { x: number; y: number; d: number };
/** a point in the air that the lens sees on the mark's face once the camera has tilted up */
const TARGET = { x: 0, y: 8, z: -45 };

/** where one agent is at progress tt (0 = in its roof, 1 = on the mark) */
function flight(cam: Cam, c: Cell, tt: number, mark: { x: number; y: number; size: number }): Pt & { m: number } {
  const rise = ease.out(Math.min(1, Math.max(0, tt) / 0.18));
  const e = ease.inOut(Math.max(0, (tt - 0.08) / 0.92));
  const x0 = c.x + (c.r2 - 0.5) * 0.3;
  const y0 = 1.1 + 0.9 * rise;
  const X = x0 + (TARGET.x + (c.r1 - 0.5) * 5 - x0) * e;
  const Y = y0 + (TARGET.y + (c.r3 - 0.5) * 3.6 - y0) * e + 1.2 * Math.sin(Math.PI * Math.min(1, e * 1.2));
  const Z = c.z + (TARGET.z - c.z) * e;
  const p = project(cam, X, Y, Z);
  const m = prog(tt, 0.8, 0.2, ease.inOut);
  const tx = mark.x + (c.r1 - 0.5) * mark.size * 0.55;
  const ty = mark.y + (c.r3 - 0.5) * mark.size * 0.45;
  return { x: p.x + (tx - p.x) * m, y: p.y + (ty - p.y) * m, d: p.d, m };
}

export const Swarm: React.FC<{ t: Times; cam: Cam; f: number; mark: { x: number; y: number; size: number } }> = ({ t, cam, f, mark }) => {
  if (f < t.hack) return null;
  const heads: React.ReactNode[] = [];
  const trails: React.ReactNode[] = [];
  const sparks: React.ReactNode[] = [];
  const flying: { c: Cell; tt: number; p: ReturnType<typeof flight> }[] = [];
  for (const c of CELLS) {
    const s = cellAt(t, c, f);
    if (f < s.leave) continue;
    if (f >= s.arrive) {
      const a = f - s.arrive;
      if (a < 5 && c.i % 6 === 0) {
        const x = mark.x + (c.r1 - 0.5) * mark.size * 0.55;
        const y = mark.y + (c.r3 - 0.5) * mark.size * 0.45;
        sparks.push(<circle key={c.i} cx={x} cy={y} r={1.5 + a * 1.6} fill="#FFF1E8" opacity={0.85 * (1 - a / 5)} />);
      }
      continue;
    }
    const tt = (f - s.leave) / (s.arrive - s.leave);
    flying.push({ c, tt, p: flight(cam, c, tt, mark) });
  }
  flying.sort((a, b) => b.p.d - a.p.d);
  for (const { c, tt, p } of flying) {
    if (p.d < 2.2) continue;
    const q = flight(cam, c, tt - 0.035, mark);
    const w = Math.max(1.4, Math.min(16, (FL * 0.1) / p.d)) * (1 - 0.6 * p.m);
    const o = Math.min(1, tt * 10);
    trails.push(<line key={c.i} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={RED} strokeWidth={w} strokeLinecap="round" opacity={0.8 * o} />);
    if (p.d < 26 && p.m < 0.6) {
      const k = Math.min(150, (FL * 0.5) / p.d) * (1 - 0.6 * p.m);
      heads.push(
        <g key={c.i} transform={`translate(${p.x.toFixed(1)} ${(p.y + k * 0.5).toFixed(1)}) scale(${k.toFixed(2)}) rotate(${((q.x - p.x) * 0.08).toFixed(1)})`} opacity={o}>
          {p.d < 10 ? <AgentGlyph color={RED} press={0.15} lit={1} id={c.i} /> : <AgentChip color={RED} lit={1} />}
        </g>,
      );
    } else heads.push(<circle key={c.i} cx={p.x} cy={p.y} r={w * 0.9} fill="#FFB4A8" opacity={o} />);
  }
  return (
    <>
      <g filter="url(#v3bloom)">{trails}</g>
      {heads}
      <g filter="url(#v3bloom)">{sparks}</g>
    </>
  );
};

/** share of the 700 that have reached the mark */
export const arrivedShare = (t: Times, f: number) => {
  let n = 0;
  for (const c of CELLS) if (f >= cellAt(t, c, f).arrive) n++;
  return n / CELLS.length;
};

export const BloomDef: React.FC = () => (
  <filter id="v3bloom" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="5" result="b" />
    <feMerge>
      <feMergeNode in="b" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
