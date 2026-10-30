// HookV1's Hugging Face mark: a far yellow light on "end", rushing up as the red fleet surges on "hacking", and on
// "Face" it takes the hit: jagged cracks run out from the impact, the face splits into pieces that drift apart on
// their own inertia, light bursts through every gap, small yellow shards fly. Held until the scene leaves.
import React from "react";
import { draw, ease, prog } from "../../../src/engine";
import { HF, Logo, rand } from "./parts";

/** impact point in mark units (0..1), a little above the smile */
const P = { x: 0.53, y: 0.5 };
const N = 9;
/** crack i: its angle and a jagged polyline from the impact out past the mark's edge */
const CRACKS = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2 + (rand(i, 21) - 0.5) * 0.45 - 1.2;
  const pts: [number, number][] = [];
  const radii = [0, 0.09, 0.2, 0.33, 0.44, 0.75];
  radii.forEach((r, k) => {
    const j = k === 0 ? 0 : (rand(i * 7 + k, 23) - 0.5) * 0.28;
    pts.push([P.x + r * Math.cos(a + j), P.y + r * Math.sin(a + j)]);
  });
  return { a, pts };
});
const RING = 3; // inner pieces end at crack point 3

type Piece = { poly: [number, number][]; c: [number, number]; outer: boolean; k: number };
const PIECES: Piece[] = (() => {
  const out: Piece[] = [];
  for (let i = 0; i < N; i++) {
    const A = CRACKS[i].pts;
    const B = CRACKS[(i + 1) % N].pts;
    const inner = [...A.slice(0, RING + 1), ...B.slice(0, RING + 1).reverse()];
    const outer = [...A.slice(RING), ...B.slice(RING).reverse()];
    for (const [poly, isOuter] of [[inner, false], [outer, true]] as const) {
      const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]) as [number, number];
      out.push({ poly: poly as [number, number][], c, outer: isOuter, k: out.length });
    }
  }
  return out;
})();

const clip = (poly: [number, number][]) => `polygon(${poly.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(", ")})`;

/** the burst behind the face: a hot core and long rays, seen through the gaps */
const Burst: React.FC<{ size: number; f: number; face: number }> = ({ size, f, face }) => {
  const on = prog(f, face, 6, ease.outHard);
  const breathe = 0.85 + 0.15 * Math.sin((f - face) / 5);
  const R = size * 2.2;
  return (
    <>
      <div
        style={{
          position: "absolute", left: P.x * size - R / 2, top: P.y * size - R / 2, width: R, height: R, opacity: on * breathe, borderRadius: "50%",
          transform: `rotate(${((f - face) * 0.25).toFixed(2)}deg) scale(${(0.6 + 0.4 * on).toFixed(3)})`,
          background: `repeating-conic-gradient(from 7deg, rgba(255,236,160,.55) 0deg 2.2deg, transparent 2.2deg 11deg, rgba(255,210,30,.35) 11deg 13deg, transparent 13deg 29deg)`,
          WebkitMaskImage: "radial-gradient(closest-side, #000 10%, transparent 100%)", maskImage: "radial-gradient(closest-side, #000 10%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0.1 * size, top: 0.1 * size, width: 0.8 * size, height: 0.8 * size, borderRadius: "50%", opacity: on,
          background: `radial-gradient(circle at ${P.x * 100 - 10}% ${P.y * 100 - 10}%, #fff 0%, #fff 45%, #FFF2A0 80%, rgba(255,210,30,0) 100%)`, boxShadow: `0 0 ${size * 0.12}px ${size * 0.03}px rgba(255,240,170,.8)`,
        }}
      />
    </>
  );
};

/** the glowing cracks, under the pieces: they only show where the pieces have parted */
const Cracks: React.FC<{ size: number; f: number; face: number }> = ({ size, f, face }) => (
  <svg width={size} height={size} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 0 ${size * 0.03}px #fff) drop-shadow(0 0 ${size * 0.06}px ${HF})` }}>
    {CRACKS.map((c, i) => (
      <polyline
        key={i}
        points={c.pts.slice(0, 5).map((p) => p.join(",")).join(" ")}
        fill="none" stroke="#FFFBE8" strokeWidth={0.012} strokeLinejoin="round" strokeLinecap="round"
        {...draw(f, face + (i % 3), 8)}
      />
    ))}
  </svg>
);

/** small yellow shards thrown off the rim on the hit */
const Shards: React.FC<{ size: number; f: number; face: number }> = ({ size, f, face }) => {
  if (f < face) return null;
  const t = f - face;
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => {
        const a = rand(i, 31) * Math.PI * 2;
        const v = size * (0.012 + 0.03 * rand(i, 33));
        const d = v * 40 * (1 - Math.exp(-t / 16));
        const sz = size * (0.02 + 0.045 * rand(i, 35));
        const o = 1 - prog(f, face + 16 + 20 * rand(i, 37), 16, ease.linear);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: P.x * size + Math.cos(a) * (0.2 * size + d) - sz / 2, top: P.y * size + Math.sin(a) * (0.2 * size + d) + 0.004 * t * t - sz / 2,
              width: sz, height: sz * 0.8, opacity: o, transform: `rotate(${(rand(i, 39) * 360 + t * (rand(i, 41) - 0.5) * 30).toFixed(1)}deg)`,
              clipPath: "polygon(0 20%, 70% 0, 100% 80%, 30% 100%)", background: `linear-gradient(135deg, #FFF6C8, ${HF} 45%, #FF9D00)`,
            }}
          />
        );
      })}
    </>
  );
};

/** the mark, whole before the hit, in pieces after it */
export const HFMark: React.FC<{ x: number; y: number; size: number; f: number; face: number; o: number; glow: number }> = ({ x, y, size, f, face, o, glow }) => {
  const hit = f >= face;
  const t = Math.max(0, f - face);
  const halo = `drop-shadow(0 0 ${(size * 0.06 * glow).toFixed(1)}px ${HF}) drop-shadow(0 0 ${(size * 0.16 * glow).toFixed(1)}px rgba(255,157,0,.6))`;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o }}>
      {hit && <Burst size={size} f={f} face={face} />}
      {!hit && (
        <div style={{ position: "absolute", inset: 0, filter: halo }}>
          <Logo name="huggingface" size={size} />
        </div>
      )}
      {hit &&
        PIECES.map((pc) => {
          const dx = pc.c[0] - P.x;
          const dy = pc.c[1] - P.y;
          const len = Math.hypot(dx, dy) || 1;
          const kick = (pc.outer ? 0.05 + 0.05 * rand(pc.k, 43) : 0.014 + 0.01 * rand(pc.k, 43)) * size;
          const drift = (1 - Math.exp(-t / 7)) * kick + t * (pc.outer ? 0.35 : 0.06) * (size / 480);
          const rot = (rand(pc.k, 47) - 0.5) * (pc.outer ? 26 : 8) * (1 - Math.exp(-t / 10));
          const tilt = (rand(pc.k, 49) - 0.5) * (pc.outer ? 34 : 10) * (1 - Math.exp(-t / 9));
          return (
            <div
              key={pc.k}
              style={{
                position: "absolute", inset: 0, clipPath: clip(pc.poly), transformOrigin: `${pc.c[0] * 100}% ${pc.c[1] * 100}%`,
                transform: `perspective(${size * 2}px) translate(${((dx / len) * drift).toFixed(2)}px, ${((dy / len) * drift).toFixed(2)}px) rotateY(${tilt.toFixed(2)}deg) rotate(${rot.toFixed(2)}deg)`,
                filter: `brightness(${(1 + 0.5 * Math.exp(-t / 8)).toFixed(3)})`,
              }}
            >
              <Logo name="huggingface" size={size} />
            </div>
          );
        })}
      {hit && <Cracks size={size} f={f} face={face} />}
      <Shards size={size} f={f} face={face} />
    </div>
  );
};
