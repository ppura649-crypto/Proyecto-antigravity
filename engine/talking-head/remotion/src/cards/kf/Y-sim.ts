import { hash } from "./L-util";
// keyframes-v1 hook Y2 (builder Y, 2026-09-25): the pour into the hopper as a deterministic 2D rigid-disc simulation,
// run ONCE at module load from seeded hashes (no per-frame randomness), fixed 480 Hz step, sampled by spine ms.
// Each print collides as a disc a little smaller than its half-width, so the pile overlaps like real thin prints.

export const HOP = { cx: 540, rimY: 150, rimW: 300, rimRy: 30, neckY: 432, neckW: 40, collarY: 422, collarB: 476, spoutB: 506 };
const IMGS = [
  ...["00", "02", "04", "06", "07", "09", "10", "11", "14", "15", "16", "20", "21", "24"].map((n) => `R-roll-${n}.jpg`),
  ...["16", "00", "03", "05", "08", "11", "13", "15"].map((n) => `L-f${n}.jpg`),
];
export type Body = { img: string; w: number; h: number; r: number; spawn: number; x0: number; y0: number; vx0: number; vy0: number; a0: number; w0: number };
export const makeBodies = (imgs: string[]): Body[] => imgs.map((img, i) => {
  const sq = img.startsWith("R-");
  const hsh = (k: number) => hash(i * 17 + k * 3.1 + 5);
  return {
    img, w: sq ? 106 : 74, h: sq ? 106 : 132, r: sq ? 38 : 37,
    spawn: i * 9 + hsh(1) * 14,                       // ms after the pour starts
    x0: HOP.cx + (hsh(2) - 0.5) * 420, y0: -50 - hsh(3) * 90,
    vx0: (hsh(4) - 0.5) * 160, vy0: 1000 + hsh(5) * 300, a0: (hsh(6) - 0.5) * 70, w0: (hsh(7) - 0.5) * 9,
  };
});
export const BODY_IMGS = [...new Set(IMGS)];

const G = 4200, HZ = 480, DT = 1 / HZ, E_WALL = 0.18, E_PAIR = 0.08;
type Seg = [number, number, number, number];
const { cx, rimY, rimW, neckY, neckW } = HOP;
const WALLS: Seg[] = [
  [cx - rimW + 6, rimY, cx - neckW, neckY], [cx + rimW - 6, rimY, cx + neckW, neckY],
  [cx - neckW - 4, neckY + 4, cx + neckW + 4, neckY + 4],            // the closed valve at the neck
];
export const SIM_MS = 520;                                             // sampled span after the pour starts
const STEPS = Math.ceil((SIM_MS / 1000) * HZ);
// frames[s * n * 3 + i * 3 + {0,1,2}] = x, y, angle(deg)
const simulate = (BODIES: Body[]) => {
  const n = BODIES.length, FRAMES = new Float32Array((STEPS + 1) * n * 3);
  const x = new Float64Array(n), y = new Float64Array(n), vx = new Float64Array(n), vy = new Float64Array(n), a = new Float64Array(n), w = new Float64Array(n);
  const live = new Uint8Array(n);
  BODIES.forEach((b, i) => { x[i] = b.x0; y[i] = b.y0; vx[i] = b.vx0; vy[i] = b.vy0; a[i] = b.a0; w[i] = b.w0; });
  const put = (s: number) => { for (let i = 0; i < n; i++) { const o = (s * n + i) * 3; FRAMES[o] = x[i]!; FRAMES[o + 1] = y[i]!; FRAMES[o + 2] = a[i]!; } };
  put(0);
  for (let s = 1; s <= STEPS; s++) {
    const tms = (s / HZ) * 1000;
    for (let i = 0; i < n; i++) {
      if (!live[i] && tms >= BODIES[i]!.spawn) live[i] = 1;
      if (!live[i]) continue;
      vy[i]! += G * DT; x[i]! += vx[i]! * DT; y[i]! += vy[i]! * DT; a[i]! += ((w[i]! * 180) / Math.PI) * DT;
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < n; i++) {
        if (!live[i]) continue;
        const r = BODIES[i]!.r;
        if (y[i]! > rimY - r) for (const [ax, ay, bx, by] of WALLS) {
          const ex = bx - ax, ey = by - ay, u = Math.max(0, Math.min(1, ((x[i]! - ax) * ex + (y[i]! - ay) * ey) / (ex * ex + ey * ey)));
          const qx = ax + u * ex, qy = ay + u * ey, dx = x[i]! - qx, dy = y[i]! - qy, d = Math.hypot(dx, dy);
          if (d >= r || d < 1e-6) continue;
          let nx = dx / d, ny = dy / d;
          if (ny > 0 && Math.abs(ey) > 1) { nx = -nx; ny = -ny; }       // cone walls push inward and up
          x[i]! += nx * (r - d); y[i]! += ny * (r - d);
          const vn = vx[i]! * nx + vy[i]! * ny;
          if (vn < 0) { vx[i]! -= (1 + E_WALL) * vn * nx; vy[i]! -= (1 + E_WALL) * vn * ny; }
          const tx = -ny, ty = nx, vt = vx[i]! * tx + vy[i]! * ty;
          vx[i]! -= 0.12 * vt * tx; vy[i]! -= 0.12 * vt * ty; w[i]! = w[i]! * 0.9 + (vt / r) * 0.04;
        }
        for (let j = i + 1; j < n; j++) {
          if (!live[j]) continue;
          const dx = x[j]! - x[i]!, dy = y[j]! - y[i]!, d = Math.hypot(dx, dy), rr = r + BODIES[j]!.r;
          if (d >= rr || d < 1e-6) continue;
          const nx = dx / d, ny = dy / d, p = (rr - d) / 2;
          x[i]! -= nx * p; y[i]! -= ny * p; x[j]! += nx * p; y[j]! += ny * p;
          const rv = (vx[j]! - vx[i]!) * nx + (vy[j]! - vy[i]!) * ny;
          if (rv < 0) {
            const jn = ((1 + E_PAIR) * rv) / 2;
            vx[i]! += jn * nx; vy[i]! += jn * ny; vx[j]! -= jn * nx; vy[j]! -= jn * ny;
            w[i]! *= 0.93; w[j]! *= 0.93;
          }
        }
      }
    }
    for (let i = 0; i < n; i++) if (live[i] && y[i]! > rimY) { vx[i]! *= 0.994; vy[i]! *= 0.994; w[i]! *= 0.985; }
    put(s);
  }
  // a print's pour state `ms` after the pour starts (linear between steps)
  return (i: number, ms: number) => {
    const f = Math.max(0, Math.min(STEPS, (ms / 1000) * HZ)), s0 = Math.floor(f), s1 = Math.min(STEPS, s0 + 1), u = f - s0;
    const o0 = (s0 * n + i) * 3, o1 = (s1 * n + i) * 3;
    const at = (k: number) => FRAMES[o0 + k]! + (FRAMES[o1 + k]! - FRAMES[o0 + k]!) * u;
    return { x: at(0), y: at(1), a: at(2) };
  };
};
export const makeSim = (imgs: string[]) => { const bodies = makeBodies(imgs); return { bodies, pour: simulate(bodies) }; };

// Y2 (approved): its own set, unchanged numbers
const Y2 = makeSim(IMGS);
export const BODIES = Y2.bodies;
export const pour = Y2.pour;
