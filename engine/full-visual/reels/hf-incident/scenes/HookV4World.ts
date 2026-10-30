// HookV4's battlefield in world units: a ground plane seen from a raised camera, one projection for everything, the
// 700 agents' slots (seven legions in a wedge pointing at the fortress) and every agent's path as a pure function of
// the frame: poured out of the OpenAI mark in columns, standing in rank, launched in an arc on "hacking", clinging to
// the light wall around the Hugging Face fortress, blown back when the mark breaks.
import { Easing } from "remotion";
import { ease, prog } from "../../../src/engine/moves";
import { rand } from "./parts";

/** horizon (page y), ground scale, camera distance at which s = 1, px per world unit at s = 1 */
export const HY = 570;
const K = 810;
const D0 = 4;
const U = 100;

export type P = { x: number; y: number; s: number };
export type V3 = { X: number; d: number; h: number };

/** world (X across, d depth, h height) to column px; s is the size factor at that depth */
export const proj = (X: number, d: number, h = 0): P => {
  const s = D0 / d;
  return { x: 450 + X * U * s, y: HY + K * s - h * U * s, s };
};
export const px = (units: number, d: number) => units * U * (D0 / d);

export const FORT = { d: 12.5, R: 5, plinthR: 4, plinthH: 0.6, mark: 7, wallH: 1.8 };
export const SRC = { d: 4, h: 0.75 };
export const N = 700;
const D_NEAR = 5.1;
const D_SPAN = 2.0;
export const laneX = (l: number) => (l - 3) * 1.6;

/** the cue frames the whole hook runs on */
export type T4 = { spawnEnd: number; o: number; a: number; e: number; h: number; hg: number; fc: number };

export type Bot = {
  i: number; X: number; d: number; lx: number; spawn: number; dur: number;
  launch: number; fly: number; arrive: number; th: number; tH: number; arc: number; r1: number; r2: number;
};

const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const m = 1 - t;
  return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d;
};

let cache: { key: string; bots: Bot[] } | null = null;

/** seven legions of 5 x 20, the middle one furthest forward; filled far rows first, the pour accelerating onto "700" */
export function getBots(T: T4): Bot[] {
  const key = JSON.stringify(T);
  if (cache && cache.key === key) return cache.bots;
  const slots: { X: number; d: number; lx: number }[] = [];
  for (let l = 0; l < 7; l++)
    for (let c = 0; c < 5; c++)
      for (let r = 0; r < 20; r++) {
        const k = slots.length;
        const X = laneX(l) + (c - 2) * 0.27 + (rand(k, 3) - 0.5) * 0.08;
        const d = D_NEAR + r * 0.082 + (3 - Math.abs(l - 3)) * 0.12 + (rand(k, 5) - 0.5) * 0.03;
        slots.push({ X, d, lx: laneX(l) });
      }
  const order = slots.map((s, i) => i).sort((a, b) => slots[b].d - slots[a].d);
  const bots: Bot[] = new Array(N);
  order.forEach((si, k) => {
    const s = slots[si];
    const r1 = rand(si, 11);
    const r2 = rand(si, 17);
    const depth = (s.d - D_NEAR) / D_SPAN;
    const spawn = -4 + (T.spawnEnd + 4) * Math.sqrt((k + 1) / N);
    const launch = T.h - 3 + (1 - depth) * 14 + r1 * 5;
    const fly = 22 + r2 * 9;
    bots[si] = {
      i: si, X: s.X, d: s.d, lx: s.lx, spawn, dur: 22 + 22 * depth, launch, fly, arrive: launch + fly,
      th: rand(si, 23) * Math.PI * 2, tH: 0.15 + rand(si, 29) * 1.9, arc: 1.4 + rand(si, 31) * 2.6, r1, r2,
    };
  });
  cache = { key, bots };
  return bots;
}

/** how many have left the mark by frame f: lands on exactly 700 on "700" */
export const emitted = (bots: Bot[], f: number) => bots.reduce((n, b) => n + (b.spawn <= f ? 1 : 0), 0);
export const arrived = (bots: Bot[], f: number) => bots.reduce((n, b) => n + (b.arrive <= f ? 1 : 0), 0) / N;

/** "OpenAI": a flash rolling out from the mark through the ranks; "agents": the eyes flare, front to back */
export const waveO = (b: Bot, f: number, T: T4) => Math.exp(-((f - (T.o + (b.d - SRC.d) * 7)) ** 2) / 22);
export const waveA = (b: Bot, f: number, T: T4) => Math.exp(-((f - (T.a + (b.d - D_NEAR) * 9)) ** 2) / 26);
/** "end up": the eyes turn red in a wave that runs away from the camera toward the fortress */
export const redAt = (b: Bot, f: number, T: T4) => prog(f, T.e + (b.d - D_NEAR) * 7, 6, ease.linear);

function pourPos(b: Bot, f: number): V3 {
  const t = prog(f, b.spawn, b.dur, ease.out);
  return { X: bez(0, b.lx * 0.2, b.lx, b.X, t), d: bez(SRC.d - 0.35, 4.2, b.d - 0.8, b.d, t), h: bez(SRC.h, 2.2, 0.7, 0.04, t) };
}

function armyPos(b: Bot, f: number, T: T4): V3 {
  const bob = 0.05 * Math.sin(f * 0.17 + b.i * 1.7);
  const hop = 0.32 * (waveO(b, f, T) + waveA(b, f, T));
  const lean = 0.3 * prog(f, T.e, T.h - T.e, ease.inOut);
  return { X: b.X, d: b.d + lean, h: 0.04 + bob + hop };
}

/** where it clings on the light wall: crawling, squeezed in as the wall dies, blown out when the mark breaks */
function clingPos(b: Bot, f: number, T: T4): V3 {
  const tt = Math.max(0, f - b.arrive);
  const th = b.th + tt * 0.004 * (b.r1 > 0.5 ? 1 : -1);
  const squeeze = 0.9 * prog(f, T.fc - 16, 16, ease.inOut);
  const blast = (1.3 + b.r2 * 2.4) * prog(f, T.fc + 3, 40, ease.outHard);
  const R = FORT.R * 0.96 - squeeze + blast;
  const face = Math.sin(th) < 0 && Math.abs(Math.cos(th)) < 0.6 ? 0.35 : 1;
  return { X: Math.cos(th) * R, d: FORT.d + Math.sin(th) * R, h: b.tH * face + 0.06 * Math.sin(f * 0.3 + b.i) + blast * 0.4 * b.r1 };
}

const strike = Easing.bezier(0.42, 0, 0.9, 0.65);

function flyPos(b: Bot, f: number, T: T4): V3 {
  const a = armyPos(b, b.launch, T);
  const z = clingPos(b, b.arrive, T);
  const u = prog(f, b.launch, b.fly, strike);
  return { X: a.X + (z.X - a.X) * u, d: a.d + (z.d - a.d) * u, h: a.h + (z.h - a.h) * u + Math.sin(Math.PI * u) * b.arc };
}

export function botPos(b: Bot, f: number, T: T4): V3 {
  if (f < b.spawn + b.dur) return pourPos(b, f);
  if (f < b.launch) return armyPos(b, f, T);
  if (f < b.arrive) return flyPos(b, f, T);
  return clingPos(b, f, T);
}

/** the light wall's strength: steady shimmer, then every hit costs it, flickering, dead a beat before "Face" */
export function shield(bots: Bot[], f: number, T: T4) {
  const a = arrived(bots, f);
  const dead = prog(f, T.fc - 14, 8, ease.linear);
  const base = Math.max(0, 1 - a * 1.05) * (1 - dead);
  const k = Math.floor(f / 2);
  const fl = a > 0 ? (rand(k, 7) < 0.2 ? 0.12 : 0.55 + 0.45 * rand(k, 3)) : 0.92 + 0.08 * Math.sin(f * 0.4);
  return { a, level: base * fl, base };
}

/** points of a circle of radius R around (0, dC) at height h, from angle a0 to a1 (0 = right, PI/2 = far side) */
export function arcPts(R: number, dC: number, h: number, a0: number, a1: number, n = 48): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(proj(Math.cos(a) * R, dC + Math.sin(a) * R, h));
  }
  return out;
}
export const pathOf = (pts: P[], close = false) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + (close ? " Z" : "");
