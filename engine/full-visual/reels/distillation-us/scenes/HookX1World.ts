// Hook X1, the world: one camera, the Claude mark at the centre of a 3D swarm of fraudulent accounts, every avatar's
// flight in out of the dark, its slot on the swarm's shell, its pecks at the mark, and every spark of Claude's light a
// peck tears away (before "copy" it rides the avatar off and dies; from "copy" on it joins the river to Qwen).
// All pure functions of the frame, so any frame renders on its own.
import { ease, prog } from "../../../src/engine";
import { QPTS } from "./HookX1Points";

export type T = { f: number; ch: number; ai: number; co: number; copy: number; anth: number; models: number };
export type P = { x: number; y: number; z: number };
export type G = { cx: number; cy: number; w: number };

export const F = 1000;
export const D = 1000;
/** the stage box (page y 520, 900 x 930) */
export const BOX = { w: 900, h: 930 };
/** Claude's mark at the mark plane (world units = px at scale 1) and where its light is torn from */
export const MS = 470;
const RC = 115;
/** each avatar bites at its own depth into the rays, so a mass peck is a ragged bite, not a ring */
const rcOf = (i: number) => RC * (0.65 + 0.8 * rand(i, 22));
/** Qwen's mark on screen, right of Claude, where the river assembles it */
export const Q = { x: 675, y: 395, size: 290 };
export const N = 1100;

export const rand = (i: number, salt = 1) => {
  const s = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** the camera: Claude centred and huge, shoved left on "copy" (with overshoot) so the river has somewhere to go */
export const camAt = (t: T, fr: number): G => {
  const k = prog(fr, t.copy - 2, 30, ease.back);
  const push = 1 + 0.05 * prog(fr, 0, 220, ease.linear);
  return { cx: 450 - 175 * k, cy: 392, w: (1 - 0.32 * k) * push };
};

export const project = (g: G, p: P) => {
  const s = F / Math.max(80, p.z);
  return { x: g.cx + p.x * s * g.w, y: g.cy + p.y * s * g.w, s: s * g.w };
};

/** the whole swarm breathes in on "companies", draws back before "copy" (anticipation) and plunges on it */
const tightAt = (t: T, fr: number) =>
  1 - 0.1 * prog(fr, t.co - 2, 20, ease.back) + 0.08 * prog(fr, t.copy - 12, 10, ease.inOut) - 0.08 * prog(fr, t.copy - 2, 12, ease.back) + 0.012 * Math.sin(fr / 11);

type Av = { dir: P; R: number; arrive: number; pecker: boolean; period: number; phase: number };
const AV: Av[] = Array.from({ length: N }, (_, i) => {
  const u = 2 * rand(i, 1) - 1;
  const ph = 2 * Math.PI * rand(i, 2);
  const h = Math.sqrt(1 - u * u);
  const dz = h * Math.sin(ph);
  const r3 = rand(i, 3);
  // the front half keeps a hollow eye over the mark, so the mark reads through the swarm (the pecks still cross it)
  let x = h * Math.cos(ph);
  let y = u * 0.8;
  const rxy = Math.hypot(x, y) || 1;
  if (dz < 0 && rxy < 0.85) {
    const k = (0.85 + 0.15 * rxy) / rxy;
    x *= k;
    y *= k;
  }
  return {
    dir: { x, y, z: dz < 0 ? dz * 0.6 : dz },
    R: 245 + 380 * r3 ** 2.5,
    arrive: -4 + 62 * rand(i, 4) ** 1.35,
    pecker: r3 < 0.62 && rand(i, 6) < 0.85,
    period: 36 + 26 * rand(i, 7),
    phase: rand(i, 8),
  };
});

/** the swirl: the swarm turns like a vortex round the mark (about the view axis, so the eye over the mark stays
 *  open), each avatar at its own pace, faster while it closes in */
function slot(t: T, i: number, fr: number): P {
  const a = AV[i];
  const sw = (fr / 60) * 0.5 * (0.7 + 0.6 * rand(i, 5)) * (rand(i, 21) < 0.5 ? 1 : 0.8);
  const c = Math.cos(sw);
  const s = Math.sin(sw);
  const R = a.R * tightAt(t, fr);
  const wob = 10 * Math.sin(fr / 17 + i);
  return { x: (a.dir.x * c - a.dir.y * s) * R + wob, y: (a.dir.x * s + a.dir.y * c) * R * 0.85 + 8 * Math.cos(fr / 13 + i * 2), z: D + a.dir.z * R };
}

/** the contacts (peck frames) of avatar i: its own rhythm, plus everyone at once on "copy" */
export function contacts(t: T, i: number, from: number, to: number): number[] {
  const a = AV[i];
  if (!a.pecker) return [];
  const base = t.ch + a.arrive + 30 + a.phase * a.period;
  const out: number[] = [];
  const k0 = Math.max(0, Math.floor((from - base) / a.period));
  for (let k = k0; base + k * a.period <= to; k++) {
    const c = base + k * a.period;
    if (c >= from && Math.abs(c - t.copy) > 18) out.push(c);
  }
  const sync = t.copy + Math.round(9 * rand(i, 9) ** 1.5);
  if (sync >= from && sync <= to) out.push(sync);
  return out;
}

/** how far into a peck avatar i is at fr: a dart in over 7 frames, a heavy pull back over 16 */
function peckAt(t: T, i: number, fr: number) {
  let d = 0;
  for (const c of contacts(t, i, fr - 16, fr + 7)) d = Math.max(d, fr <= c ? prog(fr, c - 7, 7, ease.in) : 1 - prog(fr, c, 16, ease.out));
  return d;
}

/** avatar i's world position: flying in out of the dark (most from deep behind, some past the lens), then on its slot */
export function avatarAt(t: T, i: number, fr: number): { p: P; peck: number; u: number } | null {
  const a = AV[i];
  const st = t.ch + a.arrive;
  if (fr < st) return null;
  const u = prog(fr, st, 34, ease.out);
  const s = slot(t, i, fr);
  const pk = peckAt(t, i, fr);
  const R = Math.hypot(s.x, s.y, s.z - D);
  const k = (pk * (R - rcOf(i))) / Math.max(1, R);
  const at = { x: s.x - s.x * k, y: s.y - s.y * k, z: s.z - (s.z - D) * k };
  if (u >= 1) return { p: at, peck: pk, u: 1 };
  const lens = rand(i, 10) < 0.22;
  const side = a.dir.x >= 0 ? 1 : -1;
  const o: P = lens
    ? { x: side * (900 + 500 * rand(i, 11)), y: (rand(i, 12) - 0.5) * 900, z: D - 820 }
    : { x: a.dir.x * 2600, y: a.dir.y * 2000 - 400, z: D + 2600 + 1400 * rand(i, 13) };
  const v = 1 - u;
  const arc = Math.sin(Math.PI * u) * 260 * (rand(i, 14) - 0.5);
  return { p: { x: at.x + (o.x - at.x) * v + arc, y: at.y + (o.y - at.y) * v - Math.abs(arc) * 0.4, z: at.z + (o.z - at.z) * v }, peck: pk, u };
}

/** how near avatar i is to the lens, 0 (far, dim) .. 1 (close, bright) */
export const nearOf = (z: number) => Math.max(0, Math.min(1, (1.75 - z / D) / 1.2));

export type Spark = { key: string; x: number; y: number; px: number; py: number; r: number; o: number; river: boolean };

/** not every peck tears a visible spark: the river must read as one stream of embers, not a blob */
const sparkOn = (t: T, i: number, c: number) => {
  const rate = c < t.copy - 6 ? 0.45 : Math.abs(c - t.copy) < 6 ? 0.3 : 0.2;
  return rand(i * 31 + Math.round(c), 11) < rate;
};
const bez = (a: number, b: number, c: number, d: number, u: number) => {
  const v = 1 - u;
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
};

/** the Qwen point a river spark lands on: filled left to right between "copy" and "models", then fed at random */
export const fillStart = (t: T) => t.copy + 26;
export const revealAt = (t: T, j: number) => fillStart(t) + ((t.models - 2 - fillStart(t)) * j) / QPTS.length;
export const qPoint = (j: number) => ({ x: Q.x + (QPTS[j][0] - 0.5) * Q.size, y: Q.y + (QPTS[j][1] - 0.5) * Q.size });

function riverTarget(t: T, i: number, land: number) {
  const q = (land - fillStart(t)) / (t.models - 2 - fillStart(t));
  if (q >= 0 && q < 1) return Math.min(QPTS.length - 1, Math.floor(q * QPTS.length));
  return Math.floor(rand(i * 7 + Math.round(land), 15) * QPTS.length);
}

/** a spark of light at frame fr, torn off on contact c by avatar i */
function sparkAt(t: T, i: number, c: number, fr: number): Omit<Spark, "key" | "px" | "py"> | null {
  const a = AV[i];
  const rc = rcOf(i) * 0.9;
  const pc: P = { x: a.dir.x * rc, y: a.dir.y * rc, z: D + a.dir.z * rc };
  const g = camAt(t, fr);
  if (c < t.copy - 6) {
    const age = fr - c;
    if (age < 0 || age > 34) return null;
    const av = avatarAt(t, i, fr);
    if (!av) return null;
    const k = prog(fr, c, 14, ease.out);
    const drift = prog(fr, c + 8, 26, ease.out);
    const p: P = { x: pc.x + (av.p.x - pc.x) * k * 0.92 + a.dir.x * 60 * drift, y: pc.y + (av.p.y - pc.y) * k * 0.92 + a.dir.y * 60 * drift + 30 * drift, z: pc.z + (av.p.z - pc.z) * k * 0.92 };
    const q = project(g, p);
    return { x: q.x, y: q.y, r: 3.2 * Math.min(1.8, q.s) * (1 + 0.8 * (1 - k)), o: 1 - prog(fr, c + 10, 24, ease.in), river: false };
  }
  const L = 44 + 20 * rand(i, 16);
  const u = (fr - c) / L;
  if (u < 0 || u > 1) return null;
  const g0 = camAt(t, c);
  const s0 = project(g0, { x: pc.x * 1.8, y: pc.y * 1.8, z: D + (pc.z - D) * 1.8 });
  const tg = qPoint(riverTarget(t, i, c + L));
  const out = 70 + 40 * rand(i, 17);
  const len = Math.hypot(a.dir.x, a.dir.y) || 1;
  const thX = g.cx + 250 * g.w + (rand(i, 18) - 0.5) * 30;
  const thY = g.cy - 150 + (rand(i, 19) - 0.5) * 56;
  const e = ease.inOut(u);
  const x = bez(s0.x, s0.x + (a.dir.x / len) * out, thX, tg.x, e);
  const y = bez(s0.y, s0.y + (a.dir.y / len) * out, thY, tg.y, e);
  return { x, y, r: 2.2 + 1.4 * Math.sin(Math.PI * u), o: Math.min(1, u * 10) * (c + L > t.models ? 1 - prog(u, 0.55, 0.33, ease.out) : 1), river: true };
}

/** every live spark at frame fr, with where it was 2 frames ago (for its streak) */
export function sparksAt(t: T, fr: number): Spark[] {
  const out: Spark[] = [];
  for (let i = 0; i < N; i++) {
    if (!AV[i].pecker) continue;
    for (const c of contacts(t, i, fr - 66, fr)) {
      if (!sparkOn(t, i, c)) continue;
      const s = sparkAt(t, i, c, fr);
      if (!s) continue;
      const b = sparkAt(t, i, c, fr - 2) ?? s;
      out.push({ key: `${i}-${Math.round(c)}`, ...s, px: b.x, py: b.y });
    }
  }
  return out;
}

/** contact flashes on the mark: where a peck lands, the frame it lands */
export function flashesAt(t: T, fr: number) {
  const out: { key: string; x: number; y: number; k: number }[] = [];
  const g = camAt(t, fr);
  for (let i = 0; i < N; i++) {
    const a = AV[i];
    if (!a.pecker || a.dir.z > 0.35 || rand(i, 20) > 0.3) continue;
    for (const c of contacts(t, i, fr - 7, fr)) {
      const rc = rcOf(i);
      const q = project(g, { x: a.dir.x * rc, y: a.dir.y * rc, z: D + a.dir.z * rc });
      out.push({ key: `${i}-${Math.round(c)}`, x: q.x, y: q.y, k: 1 - (fr - c) / 7 });
    }
  }
  return out;
}
