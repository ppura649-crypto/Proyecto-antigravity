// Hook V5, the fleet: 700 agents in one tilted orbital ring around the mark, projected in 3D (near = bigger, brighter,
// in front of the mark; far = smaller, dimmer, behind it). One SVG per side with a shared bot drawn once in <defs>
// (the AgentIcon's own geometry and shading, simplified for 700 copies) and a <use> per agent, so it renders fast.
// The motion is physical: burst out of the mark, orbit, then the ring contracts and spins up like a skater pulling
// in (angular momentum: speed x (R0/R)^2), clamps on the Hugging Face mark, and is blown outward by the shatter.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { AGENT, RED, rand } from "./parts";
import { shade } from "./AgentIcon";

export const N = 700;
/** camera: focal length and the depth of the mark; the mark's plane projects at scale 1 */
export const F = 1000;
export const D = 1000;
/** projection centre inside the stage box (900 x 930, page y 520) */
export const CX = 450;
export const CY = 385;
export const R0 = 340;
export const RIM = 236;
const TILT = (22 * Math.PI) / 180;

export type T = { f: number; n700: number; openai: number; agents: number; end: number; hack: number; hug: number; face: number };
export type P = { x: number; y: number; z: number };

export const project = (p: P) => {
  const s = F / Math.max(80, p.z);
  return { x: CX + p.x * s, y: CY + p.y * s, s };
};

/** each agent leaves the mark on its own frame: 700 out by the word "700" */
export const emitAt = (t: T, i: number) => -8 + (i * (t.n700 + 8)) / N;
export const countAt = (t: T, fr: number) => Math.max(0, Math.min(N, Math.round((N * (fr + 8)) / (t.n700 + 8))));

/** the ring's radius: slow squeeze from "hacking", the clamp on "Hugging", the blast on "Face" */
export const radiusAt = (t: T, fr: number) =>
  R0 - 50 * prog(fr, t.hack, t.hug - t.hack, ease.in) - (R0 - 50 - RIM) * prog(fr, t.hug, 12, ease.in) + 150 * prog(fr, t.face, 40, ease.outHard);

/** the bank on "end up": the whole fleet rolls like a turning formation, with inertia */
const rollAt = (t: T, fr: number) => (-17 + 27 * prog(fr, t.end, 30, ease.back) + 3 * Math.sin(fr / 40)) * (Math.PI / 180);

export type Tables = { phase: number[]; start: number };
/** orbit phase per frame, integrated once (the spin-up depends on the whole radius history) */
export function buildTables(t: T): Tables {
  const start = -60;
  const phase: number[] = [];
  let a = 0;
  for (let fr = start; fr <= 400; fr++) {
    const r = Math.max(RIM, radiusAt(t, fr));
    const w = 0.014 * Math.min(2.9, (R0 / r) ** 2) * (fr >= t.face ? 1 - 0.6 * prog(fr, t.face, 30, ease.out) : 1);
    a += w;
    phase.push(a);
  }
  return { phase, start };
}

/** where agent i sits in the ring at frame fr (before any burst) */
function slot(t: T, tb: Tables, i: number, fr: number): P {
  const R = radiusAt(t, fr);
  const pack = Math.max(0.22, Math.min(1, (R - RIM) / (R0 - RIM)));
  const lane = 1 + (rand(i, 2) - 0.5) * 0.32 * (0.5 + 0.5 * pack);
  const rr = R * lane;
  const ph = tb.phase[Math.max(0, Math.min(tb.phase.length - 1, Math.round(fr) - tb.start))];
  const a = rand(i, 1) * Math.PI * 2 + ph * (0.85 + 0.3 * rand(i, 5));
  const ly = (rand(i, 3) - 0.5) * 90 * (0.45 + 0.55 * pack);
  return ringPoint(t, fr, a, rr, ly);
}

/** a point in the ring's plane (angle a, radius r, height ly), tilted and banked like the fleet at frame fr */
export function ringPoint(t: T, fr: number, a: number, r: number, ly = 0): P {
  const lx = r * Math.cos(a);
  const lz = r * Math.sin(a);
  const y = ly * Math.cos(TILT) - lz * Math.sin(TILT);
  const z = D + ly * Math.sin(TILT) + lz * Math.cos(TILT);
  const g = rollAt(t, fr);
  return { x: lx * Math.cos(g) - y * Math.sin(g), y: lx * Math.sin(g) + y * Math.cos(g), z };
}

/** agent i's world position: spat out of the mark's face, flying with overshoot into its slot */
export function agentAt(t: T, tb: Tables, i: number, fr: number): P | null {
  const e = emitAt(t, i);
  if (fr < e) return null;
  const u = prog(fr, e, 30, ease.back);
  const s = slot(t, tb, i, fr);
  const o = { x: (rand(i, 7) - 0.5) * 60, y: (rand(i, 8) - 0.5) * 60, z: D - 60 };
  return { x: o.x + (s.x - o.x) * u, y: o.y + (s.y - o.y) * u, z: o.z + (s.z - o.z) * u };
}

/** the red sweep on "hacking" runs round the ring from the nearest agents, one lap in 10 frames */
const redAt = (t: T, i: number) => t.hack - 1 + Math.round(10 * rand(i, 1));

const BotDef: React.FC<{ id: string; base: string; eye: number }> = ({ id, base, eye }) => {
  const lit = shade(base, "#FFFFFF", 0.6);
  const deep = shade(base, "#000000", 0.5);
  return (
    <>
      <linearGradient id={`${id}s`} x1="0.15" y1="0" x2="0.75" y2="1">
        <stop offset="0" stopColor={lit} />
        <stop offset="0.45" stopColor={base} />
        <stop offset="1" stopColor={deep} />
      </linearGradient>
      <g id={id}>
        <rect x={-1.7} y={-41} width={3.4} height={17} rx={1.7} fill={deep} />
        <circle cx={0} cy={-42} r={5.4} fill={lit} />
        <rect x={-46.5} y={-3} width={9} height={22} rx={4.5} fill={deep} />
        <rect x={37.5} y={-3} width={9} height={22} rx={4.5} fill={deep} />
        <rect x={-41} y={-26} width={82} height={68} rx={31} fill={`url(#${id}s)`} stroke={lit} strokeOpacity={0.7} strokeWidth={2} />
        <ellipse cx={-18} cy={-15} rx={15} ry={5.5} transform="rotate(-18 -18 -15)" fill="#FFFFFF" opacity={0.55} />
        <rect x={-32} y={-7} width={64} height={35} rx={17.5} fill="#070D13" />
        <rect x={-23} y={2} width={10} height={17} rx={5} fill={shade(base, "#FFFFFF", eye)} />
        <rect x={13} y={2} width={10} height={17} rx={5} fill={shade(base, "#FFFFFF", eye)} />
      </g>
    </>
  );
};

type Drawn = { i: number; x: number; y: number; s: number; z: number; px: number; py: number; id: string; o: number };

/** one side of the ring: "back" (behind the mark's plane) or "front" (between it and us) */
export const FleetLayer: React.FC<{ t: T; tb: Tables; side: "back" | "front" }> = ({ t, tb, side }) => {
  const { f } = t;
  const flare = Math.max(0, Math.sin(Math.PI * prog(f, t.agents - 2, 26, ease.linear)));
  const list: Drawn[] = [];
  for (let i = 0; i < N; i++) {
    const p = agentAt(t, tb, i, f);
    if (!p || (side === "front") !== p.z < D - 1) continue;
    const q = agentAt(t, tb, i, f - 3) ?? p;
    const a = project(p);
    const b = project(q);
    const red = f >= redAt(t, i);
    const lit = !red && flare > 0.15;
    const near = Math.max(0, Math.min(1, (1.9 - (p.z / D) * 1.1) / 1.3));
    const hop = Math.max(0, Math.sin(Math.PI * prog(f, t.agents - 2 + 8 * rand(i, 1), 14, ease.linear)));
    list.push({ i, x: a.x, y: a.y - 22 * a.s * hop, s: a.s, z: p.z, px: b.x, py: b.y, id: red ? "v5r" : lit ? "v5a" : "v5c", o: 0.42 + 0.58 * near });
  }
  list.sort((m, n) => n.z - m.z);
  const pop = (d: Drawn) => 0.4 + 0.6 * prog(f, emitAt(t, d.i), 10, ease.back);
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <BotDef id="v5c" base={AGENT} eye={0.55} />
        <BotDef id="v5a" base={shade(AGENT, "#FFFFFF", 0.25)} eye={0.95} />
        <BotDef id="v5r" base={RED} eye={0.6} />
        <filter id={`v5g${side}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={(side === "front" ? 5 : 3) * (1 + 1.2 * flare)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#v5g${side})`}>
        {list.map((d) => {
          const len = Math.hypot(d.x - d.px, d.y - d.py);
          if (len < 5) return null;
          return <line key={`t${d.i}`} x1={d.px} y1={d.py} x2={d.x} y2={d.y} stroke={d.id === "v5r" ? RED : AGENT} strokeOpacity={0.4 * d.o} strokeWidth={Math.max(1.5, 7 * d.s)} strokeLinecap="round" />;
        })}
        {list.map((d) => (
          <use key={d.i} href={`#${d.id}`} opacity={d.o} transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${(0.27 * d.s * pop(d)).toFixed(3)})`} />
        ))}
      </g>
    </svg>
  );
};
