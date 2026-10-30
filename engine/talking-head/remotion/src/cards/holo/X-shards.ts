import { clamp, hash, win } from "./X-util";
// reference edit K v09 (builder X): the glass geometry of "the slop dissolves". A jittered grid over the poster,
// each cell cut on a seeded diagonal into two triangles; every shard carries its own flight, computed
// from the time since it let go (drag-damped burst out from the impact, toward the lens, a little
// gravity, spin that settles), so the burst decelerates like real debris and no frame depends on another.
export type Pt = [number, number];
export type Shard = { i: number; pts: Pt[]; cx: number; cy: number; d: number };

const C = 6, R = 9;
export const IMPACT: Pt = [0.52, 0.5];

const vertex = (i: number, j: number): Pt => {
  const edgeX = i === 0 || i === C, edgeY = j === 0 || j === R;
  const jx = edgeX ? 0 : (hash(i * 31 + j * 7) - 0.5) * 0.62 / C;
  const jy = edgeY ? 0 : (hash(i * 13 + j * 29 + 5) - 0.5) * 0.62 / R;
  return [i / C + jx, j / R + jy];
};

const build = (): Shard[] => {
  const out: Shard[] = [];
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const a = vertex(i, j), b = vertex(i + 1, j), c = vertex(i + 1, j + 1), d = vertex(i, j + 1);
    const tris: Pt[][] = hash(i * 17 + j * 3 + 11) < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const pts of tris) {
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      out.push({ i: out.length, pts, cx, cy, d: Math.hypot(cx - IMPACT[0], (cy - IMPACT[1]) * 1.5) });
    }
  }
  return out;
};
export const SHARDS = build();
const DMAX = Math.max(...SHARDS.map((s) => s.d));

// ms after the break that a shard lets go: the ones at the impact first, the rim ~90 ms later
export const releaseDelay = (s: Shard) => (s.d / DMAX) * 90;

// the crack reaches a shard's edges in the 60 ms before the break (0..1)
export const crackP = (s: Shard, t: number, watch: number, brk: number) =>
  clamp((t - watch - (s.d / DMAX) * (brk - watch) * 0.9) / 40);

export type Pose = { dx: number; dy: number; dz: number; rx: number; ry: number; rz: number; op: number; blur: number };
const K = 3.2; // drag: speed falls by e every 1/K s
export const pose = (s: Shard, tau: number, pw: number, ph: number): Pose => {
  if (tau <= 0) return { dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0, op: 1, blur: 0 };
  const h = (k: number) => hash(s.i * 9.7 + k);
  let ux = (s.cx - IMPACT[0]) * pw, uy = (s.cy - IMPACT[1]) * ph;
  const n = Math.hypot(ux, uy) || 1;
  const turn = (h(1) - 0.5) * 0.7;
  [ux, uy] = [(ux / n) * Math.cos(turn) - (uy / n) * Math.sin(turn), (ux / n) * Math.sin(turn) + (uy / n) * Math.cos(turn)];
  const v = (560 + 760 * h(2)) * (1.3 - 0.55 * (s.d / DMAX));
  const decay = (1 - Math.exp(-K * tau)) / K;
  const vz = 380 + 620 * h(3);
  return {
    dx: ux * v * decay,
    dy: (uy - 0.22) * v * decay + 300 * tau * tau,
    dz: vz * decay,
    rx: (h(4) - 0.5) * 1100 * decay,
    ry: (h(5) - 0.5) * 1100 * decay,
    rz: (h(6) - 0.5) * 700 * decay,
    op: 1 - win(tau, 0.11, 0.33),
    blur: Math.min(3, (v * Math.exp(-K * tau)) / 420),
  };
};
