// Hook V5, the two real marks. OpenAI's spins like a launch turbine from frame 0 (ghost trails while it is fast),
// flares on its name, and falls back into the dark on "hacking". Hugging Face's surges up into the ring on "Hugging",
// takes the squeeze (rim sparks, cracks drawn from the rim inward with light pouring through, a shake that grows),
// and shatters on "Face" into shards flying at the lens in 3D.
import React, { useMemo } from "react";
import { ease, prog } from "../../../src/engine";
import { Img } from "remotion";
import { AGENT, HF, Logo, asset, rand } from "./parts";
import { CX, CY, D, F, RIM, T, project, ringPoint } from "./HookV5Fleet";

const OA = 300;
/** the Hugging Face mark's box on the mark plane */
export const HFS = 470;
const HC = { x: HFS / 2, y: HFS * 0.5 };

const spinAt = (fr: number) => 620 * (1 - Math.exp(-(fr + 12) / 26)) + 0.35 * fr;

export const OpenAIMark: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const back = prog(f, t.hack, 26, ease.in);
  const gone = prog(f, t.hack + 12, 14, ease.linear);
  if (gone >= 1) return null;
  const p = project({ x: 0, y: -240 * back, z: D + 2600 * back });
  const flare = Math.max(0, Math.sin(Math.PI * prog(f, t.openai - 1, 16, ease.linear)));
  const size = OA * p.s * (1 + 0.08 * flare);
  const speed = Math.abs(spinAt(f) - spinAt(f - 1));
  const mask = `url(${asset("logo-openai.png")}) center / contain no-repeat`;
  const sweep = prog(f, t.openai - 1, 18, ease.inOut);
  const one = (deg: number, o: number, k: string) => (
    <div key={k} style={{ position: "absolute", left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, opacity: o * (1 - gone), transform: `rotate(${deg.toFixed(1)}deg)` }}>
      <Logo name="openai" size={size} invert style={{ filter: `invert(1) drop-shadow(0 0 ${(18 + 40 * flare).toFixed(0)}px ${AGENT}${flare > 0.2 ? "EE" : "88"})` }} />
      {k === "m" && (
        <div style={{ position: "absolute", inset: 0, WebkitMask: mask, mask, background: `linear-gradient(115deg, transparent ${-30 + 150 * sweep}%, #FFFFFF ${-15 + 150 * sweep}%, transparent ${0 + 150 * sweep}%)` }} />
      )}
    </div>
  );
  return (
    <>
      {speed > 3 && one(spinAt(f - 2), 0.18, "g2")}
      {speed > 3 && one(spinAt(f - 1), 0.32, "g1")}
      {one(spinAt(f), 1, "m")}
    </>
  );
};

type Pt = [number, number];
type Shard = { pts: Pt[]; cx: number; cy: number };
type Fx = { shards: Shard[]; rays: Pt[][]; rings: Pt[][] };
const A = 9;
const RADII = [0, 100, 205, 340];
/** a jagged radial fracture from just above the mouth: 9 kinked rays, 2 irregular rings. Each cell is a shard; each
 *  ray (drawn from the rim inward, where the ring bites) and a few ring segments are the visible cracks */
function fracture(): Fx {
  const ang = Array.from({ length: A }, (_, j) => (j / A) * Math.PI * 2 + (rand(j, 21) - 0.5) * 0.5);
  const at = (k: number, j: number): Pt => {
    const r = k === 0 ? 0 : RADII[k] * (0.72 + 0.5 * rand(j * 7 + k, 22));
    return [HC.x + r * Math.cos(ang[j]), HC.y + 18 + r * Math.sin(ang[j])];
  };
  const V = RADII.map((_, k) => ang.map((__, j) => at(k, j)));
  /** a kink between two ray points, pushed sideways */
  const kink = (p: Pt, q: Pt, seed: number): Pt => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const o = (rand(seed, 24) - 0.5) * 0.45;
    return [p[0] + dx * 0.5 - dy * o, p[1] + dy * 0.5 + dx * o];
  };
  const M = RADII.slice(0, -1).map((_, k) => ang.map((__, j) => kink(V[k][j], V[k + 1][j], j * 11 + k)));
  const shards: Shard[] = [];
  for (let k = 0; k < RADII.length - 1; k++)
    for (let j = 0; j < A; j++) {
      const n = (j + 1) % A;
      const pts: Pt[] = k === 0 ? [V[0][j], M[0][j], V[1][j], V[1][n], M[0][n]] : [V[k][j], M[k][j], V[k + 1][j], V[k + 1][n], M[k][n], V[k][n]];
      shards.push({ pts, cx: pts.reduce((s, q) => s + q[0], 0) / pts.length, cy: pts.reduce((s, q) => s + q[1], 0) / pts.length });
    }
  const rays = ang.map((_, j) => [V[3][j], M[2][j], V[2][j], M[1][j], V[1][j], M[0][j], V[0][j]]);
  const rings: Pt[][] = [];
  for (const k of [1, 2]) for (let j = 0; j < A; j++) if (rand(j * 5 + k, 25) < 0.55) rings.push([V[k][j], V[k][(j + 1) % A]]);
  return { shards, rays, rings };
}

const pathOf = (pts: Pt[]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
/** the mark, from a copy with the PNG's white edge fringe keyed out (it read as grit on the broken edges) */
const HFImg: React.FC = () => <Img src={asset("hook-v5/hf-clean.png")} style={{ width: HFS, height: HFS, display: "block" }} />;

/** the squeeze: cracks bite in from the rim as the ring clamps, then branch; light pours through them */
const Cracks: React.FC<{ t: T; fx: Fx }> = ({ t, fx }) => {
  const c = prog(t.f, t.hug + 8, t.face - t.hug - 8, ease.linear);
  if (c <= 0) return null;
  const mask = `url(${asset("hook-v5/hf-clean.png")}) center / contain no-repeat`;
  const lines = [
    ...fx.rays.map((r, j) => ({ d: pathOf(r), p: Math.max(0, Math.min(1, (c - 0.45 * rand(j, 23)) * 1.9)) })),
    ...fx.rings.map((r, k) => ({ d: pathOf(r), p: Math.max(0, Math.min(1, (c - 0.55 - 0.3 * rand(k, 26)) * 4)) })),
  ];
  return (
    <div style={{ position: "absolute", inset: 0, WebkitMask: mask, mask }}>
      <svg width={HFS} height={HFS} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="v5crack" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        {lines.map((l, i) => (
          <g key={i} strokeLinejoin="round" strokeLinecap="round" fill="none">
            <path d={l.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - l.p} stroke="#FFF6CC" strokeWidth={8 + 14 * c} filter="url(#v5crack)" opacity={0.95} />
            <path d={l.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - l.p} stroke="#3A2200" strokeWidth={7} />
            <path d={l.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - l.p} stroke="#FFFDF2" strokeWidth={2 + 2.5 * c} />
          </g>
        ))}
      </svg>
    </div>
  );
};

/** where the Hugging Face mark sits: it surges up from below into the ring on "Hugging" */
const hfPlace = (t: T) => {
  const u = prog(t.f, t.hug - 4, 16, ease.back);
  const c = prog(t.f, t.hug + 9, t.face - t.hug - 9, ease.in);
  const sh = 7 * c * c;
  return { u, x: Math.sin(t.f * 2.7) * sh, y: 720 * (1 - u) + Math.cos(t.f * 3.3) * sh, c };
};

export const HFMark: React.FC<{ t: T }> = ({ t }) => {
  const fx = useMemo(fracture, []);
  const { f } = t;
  if (f < t.hug - 4) return null;
  const pl = hfPlace(t);
  const left = CX - HFS / 2 + pl.x;
  const top = CY - HC.y + pl.y;
  const bloom = 0.35 + 0.65 * pl.c;
  const broke = f >= t.face;
  return (
    <>
      <div style={{ position: "absolute", left: CX - 380, top: CY - 380 + pl.y, width: 760, height: 760, borderRadius: "50%", background: broke ? `radial-gradient(circle, #FFFFFF 0%, #FFF3C0 14%, ${HF}AA 30%, ${HF}22 50%, transparent 68%)` : `radial-gradient(circle, ${HF}55 0%, ${HF}22 35%, transparent 68%)`, opacity: broke ? 1 - 0.35 * prog(f, t.face, 40, ease.out) : bloom }} />
      {!broke && (
        <div style={{ position: "absolute", left, top, width: HFS, height: HFS, transform: `scale(${(0.8 + 0.2 * pl.u).toFixed(3)})`, filter: `drop-shadow(0 30px 40px #000C) brightness(${(1 - 0.08 * pl.c).toFixed(3)})` }}>
          <HFImg />
          <Cracks t={t} fx={fx} />
        </div>
      )}
      {broke && <Shards t={t} fx={fx} left={left} top={top} />}
    </>
  );
};

/** "Face": the mark breaks into its cells, each flying out and at the lens, spinning, lit on its broken edges */
const Shards: React.FC<{ t: T; fx: Fx; left: number; top: number }> = ({ t, fx, left, top }) => {
  const k = t.f - t.face;
  const u = prog(t.f, t.face, 50, ease.outHard);
  return (
    <div style={{ position: "absolute", left, top, width: HFS, height: HFS, perspective: 900 }}>
      {fx.shards.map((s, i) => {
        const dx = s.cx - HC.x;
        const dy = s.cy - HC.y;
        const L = Math.max(30, Math.hypot(dx, dy));
        const v = 25 + 70 * rand(i, 31) + 0.2 * L;
        const tx = (dx / L) * (v * u + 0.5 * k);
        const ty = 0.75 * (dy / L) * (v * u + 0.5 * k) + 0.02 * k * k;
        const tz = (60 + 320 * rand(i, 32)) * u;
        const rx = (rand(i, 33) - 0.5) * 70 * u;
        const ry = (rand(i, 34) - 0.5) * 70 * u;
        const rz = (rand(i, 35) - 0.5) * 50 * u;
        const clip = `polygon(${s.pts.map((q) => `${((q[0] / HFS) * 100).toFixed(2)}% ${((q[1] / HFS) * 100).toFixed(2)}%`).join(",")})`;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transformOrigin: `${s.cx}px ${s.cy}px`, transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg)`, filter: `drop-shadow(0 0 ${(14 - 8 * u).toFixed(1)}px #FFE58A)` }}>
            <div style={{ position: "absolute", inset: 0, clipPath: clip }}>
              <HFImg />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** contact sparks on the rim while the ring clamps: short white-hot bursts, two new ones a frame */
export const RimSparks: React.FC<{ t: T; shakeY: number }> = ({ t, shakeY }) => {
  const { f } = t;
  if (f < t.hug + 8 || f > t.face + 2) return null;
  const out: React.ReactNode[] = [];
  for (let s = t.hug + 8; s <= f; s++)
    for (let j = 0; j < 2; j++) {
      const age = f - s;
      if (age > 6) continue;
      const a = rand(s * 3 + j, 41) * Math.PI * 2;
      const p = project(ringPoint(t, f, a, RIM * 0.92));
      const k = 1 - age / 6;
      out.push(
        <g key={`${s}-${j}`} transform={`translate(${p.x.toFixed(1)} ${(p.y + shakeY).toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(0)})`} opacity={k}>
          <circle r={10 * k + 3} fill="#FFF6D0" />
          <path d={`M0 0 L${34 + 30 * (1 - k)} -4 L${34 + 30 * (1 - k)} 4 Z`} fill="#FFE9A0" />
          <path d={`M0 0 L${-22 - 20 * (1 - k)} -3 L${-22 - 20 * (1 - k)} 3 Z`} fill="#FF6B5E" />
        </g>,
      );
    }
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 0 10px #FFD21E)" }}>
      {out}
    </svg>
  );
};

/** the blast on "Face": a white-gold flash and a shock ring racing out in the ring's plane */
export const Blast: React.FC<{ t: T }> = ({ t }) => {
  const k = t.f - t.face;
  if (k < 0 || k > 40) return null;
  const fl = 1 - prog(t.f, t.face, 14, ease.out);
  const r = 60 + 520 * prog(t.f, t.face, 30, ease.outHard);
  return (
    <>
      <div style={{ position: "absolute", left: CX - 520, top: CY - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, #FFFFFF 0%, #FFF3C0 12%, ${HF}88 28%, transparent 60%)`, opacity: 0.85 * fl }} />
      <div style={{ position: "absolute", left: CX - r, top: CY - r * 0.42, width: r * 2, height: r * 0.84, borderRadius: "50%", border: `${(10 * (1 - k / 40)).toFixed(1)}px solid #FFE58A`, opacity: 1 - k / 40, boxShadow: `0 0 40px ${HF}` }} />
    </>
  );
};

/** frame 0 already has the launch: a shock ring leaving the OpenAI mark */
export const LaunchWave: React.FC<{ t: T }> = ({ t }) => {
  const u = prog(t.f, -4, 40, ease.outHard);
  if (u >= 1) return null;
  const r = 110 + 560 * u;
  return <div style={{ position: "absolute", left: CX - r, top: CY - r * 0.45, width: r * 2, height: r * 0.9, borderRadius: "50%", border: `${(8 * (1 - u)).toFixed(1)}px solid #DDF6FF`, opacity: 1 - u, boxShadow: `0 0 50px ${AGENT}, inset 0 0 40px ${AGENT}88` }} />;
};

/** depth: faint dust drifting at the lens, so the dark has a volume */
export const Dust: React.FC<{ t: T }> = ({ t }) => (
  <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: 90 }, (_, i) => {
      const z = 300 + ((rand(i, 51) * 2400 - t.f * 5) % 2400 + 2400) % 2400;
      const p = { x: (rand(i, 52) - 0.5) * 2600, y: (rand(i, 53) - 0.5) * 2600, z };
      const s = F / z;
      return <circle key={i} cx={CX + p.x * s} cy={CY + p.y * s} r={Math.min(3.2, 1.3 * s)} fill="#BFE9FF" opacity={Math.min(0.5, 0.35 * s)} />;
    })}
  </svg>
);
