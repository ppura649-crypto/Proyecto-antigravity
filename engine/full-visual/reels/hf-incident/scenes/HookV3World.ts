// Hook V3's 3D world, drawn without a 3D library: a pinhole camera flying over a floor of 700 glass sandbox cubes
// (20 x 35), projected by hand so every edge, stamp, crack and agent sits in true perspective. Also the one crack
// generator the whole hook uses: the cubes' glass and the Hugging Face mark break in the same language (a star of
// jagged rays from the impact, ring fractures between them), so the viewer reads "the same thing happened to both".
import { ease, prog } from "../../../src/engine";
import { rand } from "./parts";

/** stage-local canvas (the stage band, page y 520-1450), focal length and principal point (low: sky on top) */
export const W = 1080;
export const H = 930;
export const FL = 900;
export const CX = 540;
export const CY = 700;

export type Cam = { x: number; y: number; z: number; pitch: number };
export type P2 = { x: number; y: number; d: number };

/** world (x right, y up, z toward the viewer) to stage px; d = depth along the view axis */
export function project(c: Cam, X: number, Y: number, Z: number): P2 {
  const px = X - c.x;
  const py = Y - c.y;
  const pz = Z - c.z;
  const s = Math.sin(c.pitch);
  const co = Math.cos(c.pitch);
  const d = -py * s - pz * co;
  const up = py * co - pz * s;
  const dd = Math.max(d, 0.05);
  return { x: CX + (FL * px) / dd, y: CY - (FL * up) / dd, d };
}

export const horizonY = (c: Cam) => CY - FL * Math.tan(c.pitch);

/** the word frames the hook is timed on */
export type Times = { n700: number; openai: number; agents: number; end: number; up: number; hack: number; hug: number; face: number };

/** the camera: already rushing forward on frame 0 (banked, low), easing into a glide; on "hacking" it tilts up to look
 *  at the horizon where the target rises; shakes on the knocks, the burst and the "Face" slam */
export function camAt(t: Times, fr: number): Cam & { roll: number; sx: number; sy: number } {
  const z = 4.6 - 7.4 * (1 - Math.exp(-fr / 48)) - 0.012 * fr;
  const tilt = prog(fr, t.hack - 6, 36, ease.inOut);
  const pitch = 0.54 - 0.18 * tilt;
  const y = 2.2 + 0.55 * prog(fr, 0, 110, ease.out) + 0.3 * tilt;
  const x = 0.55 * Math.sin(fr / 70);
  const roll = -2.6 * (1 - prog(fr, 0, 64, ease.out)) + 0.5 * Math.sin(fr / 47);
  const kick = (at: number, amp: number, dur: number) => (fr >= at ? (1 - prog(fr, at, dur, ease.linear)) * amp : 0);
  const sh = kick(t.agents, 4, 8) + kick(t.end, 5, 8) + kick(t.up, 6, 8) + kick(t.hack, 9, 14) + kick(t.face, 16, 18);
  return { x, y, z, pitch, roll, sx: Math.sin(fr * 2.3) * sh, sy: Math.cos(fr * 3.1) * sh };
}

export const COLS = 20;
export const ROWS = 35;
export const GAP = 1.75;
/** the nearest row sits under the lens on frame 0, so the flight starts over cubes, not bare floor */
export const Z0 = 5.5;

export type Cell = { i: number; row: number; col: number; x: number; z: number; order: number; r1: number; r2: number; r3: number };

/** 700 cells. `order` is when the counter reaches it: near rows first, centre out, a little scatter */
export const CELLS: Cell[] = (() => {
  const cells: Cell[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      cells.push({ i, row, col, x: (col - (COLS - 1) / 2) * GAP, z: Z0 - row * GAP, order: 0, r1: rand(i, 1.7), r2: rand(i, 2.9), r3: rand(i, 4.3) });
    }
  const key = (c: Cell) => c.row + Math.abs(c.col - 9.5) * 0.35 + c.r1 * 1.5;
  [...cells].sort((a, b) => key(a) - key(b)).forEach((c, k) => (c.order = k));
  return cells;
})();

// ---- the crack language -------------------------------------------------------------------------------------------

export type CPt = { r: number; u: number; v: number };
export type Crack = { rays: CPt[][]; rings: [CPt, CPt][]; angles: number[] };

const RADII = [0, 0.07, 0.17, 0.3, 0.46, 0.65, 0.9, 1.25, 1.7];

/** a star fracture around (cu, cv) in a unit box, rays reaching `sc` x RADII. Deterministic per seed */
export function crackOf(seed: number, cu: number, cv: number, sc: number, nRays = 9): Crack {
  const rays: CPt[][] = [];
  const angles: number[] = [];
  for (let k = 0; k < nRays; k++) {
    let a = ((k + 0.5 * rand(k, seed + 0.1)) / nRays) * Math.PI * 2 + seed;
    angles.push(a);
    const reach = 0.75 + 0.5 * rand(k, seed + 0.7);
    rays.push(
      RADII.map((rr, j) => {
        if (j > 0) a += (rand(k * 13 + j, seed + 0.3) - 0.5) * 0.42;
        const r = rr * sc * (j > 0 ? reach : 1);
        return { r, u: cu + r * Math.cos(a), v: cv + r * Math.sin(a) };
      }),
    );
  }
  const rings: [CPt, CPt][] = [];
  for (const j of [2, 3, 4, 5])
    for (let k = 0; k < nRays; k++) if (rand(k * 7 + j, seed + 1.9) < 0.6) rings.push([rays[k][j], rays[(k + 1) % nRays][j]]);
  return { rays, rings, angles };
}

/** the part of a ray already run by a crack front at radius R (the crack grows out from the impact) */
export function grown(ray: CPt[], R: number): CPt[] {
  const out: CPt[] = [ray[0]];
  for (let j = 1; j < ray.length; j++) {
    const a = ray[j - 1];
    const b = ray[j];
    if (b.r <= R) {
      out.push(b);
      continue;
    }
    if (a.r < R) {
      const k = (R - a.r) / (b.r - a.r);
      out.push({ r: R, u: a.u + (b.u - a.u) * k, v: a.v + (b.v - a.v) * k });
    }
    break;
  }
  return out;
}

/** cut a polyline where it leaves the unit square (a crack stops at the pane's edge) */
export function inSquare(pts: CPt[]): CPt[] {
  const out: CPt[] = [];
  for (let j = 0; j < pts.length; j++) {
    const p = pts[j];
    const inside = p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1;
    if (inside) {
      out.push(p);
      continue;
    }
    if (j > 0) {
      const a = pts[j - 1];
      let k = 1;
      if (p.u < 0) k = Math.min(k, a.u / (a.u - p.u));
      if (p.u > 1) k = Math.min(k, (1 - a.u) / (p.u - a.u));
      if (p.v < 0) k = Math.min(k, a.v / (a.v - p.v));
      if (p.v > 1) k = Math.min(k, (1 - a.v) / (p.v - a.v));
      out.push({ r: a.r + (p.r - a.r) * k, u: a.u + (p.u - a.u) * k, v: a.v + (p.v - a.v) * k });
    }
    break;
  }
  return out;
}

/** svg path of polylines already mapped to px */
export const pathOf = (lines: { x: number; y: number }[][]) =>
  lines
    .filter((l) => l.length > 1)
    .map((l) => "M" + l.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L"))
    .join("");

/** 1 near the camera, 0 in the far fog */
export const fogOf = (d: number) => Math.pow(Math.max(0, Math.min(1, 1 - (d - 7) / 46)), 1.25);

// ---- what happens to each sandbox, and when ------------------------------------------------------------------------

const bump = (f: number, at: number, dur: number) => (f >= at && f < at + dur ? Math.sin((Math.PI * (f - at)) / dur) : 0);

/** the counter's value: rolls hard from frame 2 and lands exactly on "700" */
export const countAt = (t: Times, f: number) => (f >= t.n700 ? 700 : 700 * prog(f, 2, t.n700 - 2, ease.out));

export type CellState = { lit: number; stamp: number; press: number; knock: number; R: number; hackAt: number; leave: number; arrive: number };

/** one sandbox's story: lit as the counter passes it, stamp flashes on "OpenAI", its agent's palms on the glass on
 *  "agents", three knocks (agents, end, up) each leaving a bigger star, the full break on "hacking" in a wave running
 *  away from the camera toward the target, the agent out through the roof a few frames later, arrived before "Face" */
export function cellAt(t: Times, c: Cell, f: number): CellState {
  const lit = Math.max(0, Math.min(1, (countAt(t, f) - c.order) / 30));
  const wave = c.row * 0.55 + Math.abs(c.col - 9.5) * 0.12;
  const stamp = bump(f, t.openai + wave * 0.9 - 2, 16);
  const pd = Math.floor(c.r1 * 5);
  const press = prog(f, t.agents - 3 + pd, 9, ease.back);
  const knock = bump(f, t.agents - 3 + pd, 9) + bump(f, t.end - 2 + pd, 9) + bump(f, t.up - 2 + pd, 9);
  const hackAt = t.hack - 3 + wave + c.r2 * 3;
  let R = 0;
  if (f >= t.end - 2 + pd) R = 0.14 * prog(f, t.end - 2 + pd, 5, ease.outHard);
  if (f >= t.up - 2 + pd) R = 0.14 + 0.16 * prog(f, t.up - 2 + pd, 5, ease.outHard);
  if (f >= hackAt) R = 0.3 + 1.4 * prog(f, hackAt, 10, ease.outHard);
  const leave = hackAt + 5 + c.r3 * 6;
  const arrive = t.hug + 2 + (t.face - t.hug - 5) * (0.35 * c.r1 + 0.65 * Math.min(1, c.row / ROWS));
  return { lit, stamp, press, knock, R, hackAt, leave, arrive };
}
