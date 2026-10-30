// Hook V2's 700 agents, one path each through four states: a murmuration they fly into (counted as they join, 700 on
// "700"), a vortex snap into their seat on the real OpenAI mark's silhouette (landing on "OpenAI"), a swirl into a
// spear (formed by "hacking"), the launch (pull back, then accelerate, the tail lagging so it stretches), and the
// splash through the Hugging Face mark on "Face". Positions are pure functions of the frame; page coordinates.
import React from "react";
import { interpolateColors } from "remotion";
import { ease, prog } from "../../../src/engine";
import { GlyphDefs, GLYPH } from "./HookV2Glyph";
import { OAI_SEATS } from "./HookV2Points";
import { AGENT, rand, RED } from "./parts";

export type Times = { n700: number; openai: number; agents: number; end: number; up: number; hack: number; hug: number; face: number };
export const N = 700;
/** the OpenAI formation (page px) and the Hugging Face mark with its impact point */
export const OAI = { x: 540, y: 950, size: 760 };
export const HFM = { x: 540, y: 760, size: 440 };
export const HIT = { x: 540, y: 760 + 0.02 * 440 };
const D = { x: Math.sin((24 * Math.PI) / 180), y: -Math.cos((24 * Math.PI) / 180) }; // launch direction
const NRM = { x: -D.y, y: D.x };
const RUN = 360; // tip to impact at rest
const TIP0 = { x: HIT.x - RUN * D.x, y: HIT.y - RUN * D.y };
type P = { x: number; y: number };

/** the spear's seats in its own frame: u back from the tip, v across. Head, shaft, then a fraying comet tail */
function spearSeats(): P[] {
  const s: P[] = [];
  for (let u = 0; u <= 210; u += 10) for (let v = -Math.min(124, u * 0.6); v <= Math.min(124, u * 0.6) + 0.1; v += 11.5) s.push({ x: u, y: v });
  for (let u = 220; u <= 560; u += 10) for (let v = -34.5; v <= 34.6; v += 11.5) s.push({ x: u, y: v });
  for (let k = 0; s.length < N; k++) {
    const u = 570 + 480 * Math.pow(rand(k, 7.3), 0.8);
    s.push({ x: u, y: (rand(k, 9.1) - 0.5) * (70 + (u - 570) * 0.3) });
  }
  return s.slice(0, N);
}

type Agent = { seat: P; spear: P; a: number; r: number; z: number; ph: number; join: number; s1: number; s2: number; side: number; spd: number };

/** built once: flock params, join order (count-synced), OpenAI seat, spear seat matched by position along the axis */
function build(t: Times): Agent[] {
  const sp = spearSeats().sort((p, q) => p.x - q.x);
  const seats = Array.from({ length: N }, (_, i) => ({ x: OAI_SEATS[2 * i] * OAI.size, y: OAI_SEATS[2 * i + 1] * OAI.size }));
  const byAxis = seats.map((p, i) => ({ i, k: p.x * D.x + p.y * D.y })).sort((p, q) => q.k - p.k);
  const spearOf: P[] = [];
  byAxis.forEach((e, rank) => (spearOf[e.i] = sp[rank]));
  return seats.map((seat, i) => {
    const p = (i + 1) / N;
    const join = (1 - Math.cbrt(1 - p)) * t.n700; // inverse of the count's ease.out: joins as it is counted
    const u = spearOf[i].x;
    return {
      seat, spear: spearOf[i], a: rand(i, 1.3) * Math.PI * 2, r: Math.sqrt(rand(i, 2.1)), z: 0.65 + 0.7 * rand(i, 3.7), ph: rand(i, 6.1) * 6.28, join,
      s1: t.openai - 27 + 9 * rand(i, 8.2), s2: t.end - 5 + 11 * Math.min(1, u / 560) + 3 * rand(i, 2.9), side: rand(i, 3.3) - 0.5,
      spd: 11 + 15 * rand(i, 7.7),
    };
  });
}

function flock(g: Agent, f: number): P {
  const cx = 540 + 90 * Math.sin(f * 0.03 + 0.5), cy = 960 + 70 * Math.sin(f * 0.045);
  const th = g.a + f * (0.03 + 0.055 * (1 - g.r));
  const rx = 380 + 60 * Math.sin(f * 0.05 + g.a * 2), ry = 240 + 45 * Math.cos(f * 0.06);
  const x = cx + g.r * rx * Math.cos(th) + 36 * Math.sin(f * 0.08 + g.r * 6);
  const y = cy + g.r * ry * Math.sin(th) + 70 * g.r * Math.sin(3 * th - f * 0.07) + 28 * Math.sin(x * 0.012 + f * 0.1);
  return { x, y };
}

/** into the flock from beyond the frame, arriving as it is counted */
function flockIn(g: Agent, f: number): P {
  const fl = flock(g, f);
  const p = prog(f, g.join - 30, 30, ease.out);
  if (p >= 1) return fl;
  const a = g.a + 0.9;
  const sx = 540 + Math.cos(a) * (1150 + 250 * g.z), sy = 960 + Math.sin(a) * (1150 + 250 * g.z);
  const bend = Math.sin(Math.PI * p) * 160 * (g.side > 0 ? 1 : -1);
  return { x: sx + (fl.x - sx) * p - Math.sin(a) * bend, y: sy + (fl.y - sy) * p + Math.cos(a) * bend };
}

function seated(g: Agent, f: number): P {
  const rot = (1.4 * Math.PI) / 180 * Math.sin(f * 0.035);
  const s = 1 + 0.012 * Math.sin(f * 0.09);
  const x = g.seat.x * s, y = g.seat.y * s;
  return { x: OAI.x + x * Math.cos(rot) - y * Math.sin(rot) + 1.3 * Math.sin(f * 0.15 + g.ph), y: OAI.y + x * Math.sin(rot) + y * Math.cos(rot) + 1.3 * Math.cos(f * 0.13 + g.ph) };
}

/** the vortex snap: polar blend around the mark's centre with a spin, the radius overshooting its seat */
function snap(a: P, b: P, e: number, eb: number): P {
  const ra = Math.hypot(a.x - OAI.x, a.y - OAI.y), rb = Math.hypot(b.x - OAI.x, b.y - OAI.y);
  const ta = Math.atan2(a.y - OAI.y, a.x - OAI.x), tb = Math.atan2(b.y - OAI.y, b.x - OAI.x);
  let dt = tb - ta;
  while (dt > Math.PI) dt -= 2 * Math.PI;
  while (dt < -Math.PI) dt += 2 * Math.PI;
  const th = ta + dt * e + 0.7 * Math.sin(Math.PI * e);
  const r = ra + (rb - ra) * eb;
  return { x: OAI.x + r * Math.cos(th), y: OAI.y + r * Math.sin(th) };
}

/** where the spear's tip is at frame fr: hovering, pulled back on "hacking", then accelerating into the mark */
export function tipAt(t: Times, fr: number): P {
  const go = prog(fr, t.hack + 10, t.face - t.hack - 10, ease.in);
  const back = 55 * prog(fr, t.hack, 10, ease.out);
  const hov = fr < t.hack ? 6 * Math.sin(fr * 0.2) : 0;
  const s = -back + (RUN + back) * go + hov;
  return { x: TIP0.x + D.x * s, y: TIP0.y + D.y * s };
}

function speared(t: Times, g: Agent, f: number): P {
  const comp = 1 - 0.12 * prog(f, t.hack, 10, ease.out) + 0.1 * prog(f, t.hack + 10, t.face - t.hack - 10, ease.in);
  const tip = tipAt(t, f - g.spear.x * 0.012);
  const u = g.spear.x * comp, v = g.spear.y * (1 - 0.1 * prog(f, t.hack, 10, ease.out));
  return { x: tip.x - u * D.x + v * NRM.x + 2 * Math.sin(f * 0.3 + g.ph), y: tip.y - u * D.y + v * NRM.y + 2 * Math.cos(f * 0.27 + g.ph) };
}

/** after "Face": each agent bursts out from the impact (away from it, scattered), dragged, still drifting */
function splash(t: Times, g: Agent, f: number): P {
  const p0 = speared(t, g, t.face);
  const k = f - t.face, tau = 12;
  const m = tau * (1 - Math.exp(-k / tau)) + 0.3 * k;
  const ox = p0.x - HIT.x, oy = p0.y - HIT.y, od = Math.hypot(ox, oy) || 1;
  const a = g.a;
  const dx = (ox / od) * 0.55 + Math.cos(a), dy = (oy / od) * 0.55 + Math.sin(a), dd = Math.hypot(dx, dy) || 1;
  const v = g.spd * 1.25;
  return { x: p0.x + (dx / dd) * v * m, y: p0.y + (dy / dd) * v * m };
}

export function posAt(t: Times, g: Agent, f: number): P {
  if (f >= t.face) return splash(t, g, f);
  const e2 = prog(f, g.s2, 21, ease.inOut);
  if (e2 > 0) {
    const a = seated(g, f), b = speared(t, g, f);
    if (e2 >= 1) return b;
    const cx = (a.x + b.x) / 2 - NRM.x * g.side * 380, cy = (a.y + b.y) / 2 - NRM.y * g.side * 380;
    const q = 1 - e2;
    return { x: q * q * a.x + 2 * q * e2 * cx + e2 * e2 * b.x, y: q * q * a.y + 2 * q * e2 * cy + e2 * e2 * b.y };
  }
  const e1 = prog(f, g.s1, 19, ease.inOut);
  if (e1 <= 0) return flockIn(g, f);
  const eb = prog(f, g.s1, 19, ease.back);
  return e1 >= 1 ? seated(g, f) : snap(flockIn(g, f), seated(g, f), e1, eb);
}

let cache: { key: string; list: Agent[] } | null = null;
const agentsFor = (t: Times) => {
  const key = JSON.stringify(t);
  if (!cache || cache.key !== key) cache = { key, list: build(t) };
  return cache.list;
};

function look(t: Times, g: Agent, f: number) {
  const size = f < g.s1 + 19 ? 17 * g.z + 4 : f < g.s2 ? 18.5 : 16;
  const wave = Math.max(0, Math.sin(Math.PI * prog(f, t.agents + (g.seat.x + 380) * 0.03, 16, ease.linear)));
  const red = prog(f, t.hack + g.spear.x * 0.035, 6, ease.linear);
  let c = interpolateColors(red, [0, 1], [AGENT, RED]);
  if (wave > 0) c = interpolateColors(wave, [0, 1], [c, "#E8FBFF"]);
  const o = f < g.join - 30 ? 0 : f < g.s1 ? 0.55 + 0.45 * g.z * prog(f, g.join - 30, 14, ease.linear) : 1;
  return { size, c, o: Math.min(1, o) };
}

export const Swarm: React.FC<{ t: Times; f: number }> = ({ t, f }) => {
  const list = agentsFor(t);
  const trails: React.ReactNode[] = [];
  const bots: React.ReactNode[] = [];
  list.forEach((g, i) => {
    const p = posAt(t, g, f), q = posAt(t, g, f - 2);
    const { size, c, o } = look(t, g, f);
    if (o <= 0.01) return;
    const vx = p.x - q.x, vy = p.y - q.y, sp = Math.hypot(vx, vy);
    if (sp > 5) {
      const len = Math.min(40, sp * 1.6) / sp;
      trails.push(<line key={i} x1={p.x - vx * len} y1={p.y - vy * len} x2={p.x} y2={p.y} stroke={c} strokeOpacity={0.32 * o} strokeWidth={size * 0.28} strokeLinecap="round" />);
    }
    const bank = Math.max(-28, Math.min(28, vx * 1.3));
    const w = size, h = (size * GLYPH.h) / GLYPH.w;
    bots.push(<use key={i} href="#v2-agent" x={-w / 2} y={-h / 2} width={w} height={h} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${bank.toFixed(1)})`} style={{ color: c }} opacity={o} />);
  });
  return (
    <svg width={1080} height={930} viewBox="0 520 1080 930" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <GlyphDefs />
      <filter id="v2-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <g filter="url(#v2-glow)">{trails}</g>
      <g filter="url(#v2-glow)">{bots}</g>
    </svg>
  );
};
