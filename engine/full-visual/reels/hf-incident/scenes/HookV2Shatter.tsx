// Hook V2's target: the real Hugging Face mark, rising warm out of the dark on "end up", trembling as the red spear
// closes in on "Hugging", and on "Face" breaking like struck glass: cracks of light race out from the impact point,
// then the mark's own shards (the real logo, clipped per shard) drift apart in 3D with inertia while hot light pours
// through the gaps and rays fan out behind. Shards from HookV2Points.ts; page coordinates, HFM box.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { CRACKS, IMPACT, SHARDS } from "./HookV2Points";
import { HFM, type Times } from "./HookV2Swarm";
import { Img } from "remotion";
import { asset, HF, HF_ORANGE, rand, RED } from "./parts";

const S = HFM.size;
/** the real Hugging Face mark with its baked white fringe un-blended (public/hf-incident/hook-v2/hf-clean.png, made
 * from logo-huggingface.png): the fringe sparkled white under a glow */
const SRC = asset("hook-v2/hf-clean.png");
const Mark: React.FC = () => <Img src={SRC} style={{ width: S, height: S, display: "block" }} />;
const maskLogo: React.CSSProperties = {
  WebkitMaskImage: `url(${SRC})`, maskImage: `url(${SRC})`,
  WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
};

/** one shard's pose k frames after the hit: pushed out from the impact, dragged, still drifting, tilting in depth */
function shardPose(i: number, c: [number, number], k: number) {
  const dx = c[0] - IMPACT.x, dy = c[1] - IMPACT.y;
  const dist = Math.hypot(dx, dy) || 0.01;
  const v = 2.2 * (1.1 - Math.min(1, dist * 1.6)) + 0.9 * rand(i, 2.2) + 0.5;
  const tau = 13;
  const m = k <= 0 ? 0 : tau * (1 - Math.exp(-k / tau)) + 0.12 * k;
  const z = (rand(i, 5.1) - 0.3) * 0.006 * m * v;
  return {
    x: (dx / dist) * v * m, y: (dy / dist) * v * m + 0.02 * m * m * 0.3,
    rz: (rand(i, 3.4) - 0.5) * 1.6 * m, rx: (rand(i, 4.6) - 0.5) * 2.6 * m, ry: (rand(i, 6.2) - 0.5) * 2.6 * m, s: 1 + z,
    lit: 1 + 0.55 * Math.max(0, Math.sin((rand(i, 7.9) * 6 + m * 0.08) * 1.3)),
  };
}

const Shards: React.FC<{ k: number }> = ({ k }) => (
  <>
    {SHARDS.map((sh, i) => {
      const p = shardPose(i, sh.c, k);
      const poly = [] as string[];
      for (let j = 0; j < sh.p.length; j += 2) poly.push(`${(sh.p[j] * 100).toFixed(2)}% ${(sh.p[j + 1] * 100).toFixed(2)}%`);
      return (
        <div
          key={i}
          style={{
            position: "absolute", left: 0, top: 0, width: S, height: S, transformOrigin: `${(sh.c[0] * 100).toFixed(1)}% ${(sh.c[1] * 100).toFixed(1)}%`,
            transform: `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg) scale(${p.s.toFixed(4)})`,
            filter: `brightness(${p.lit.toFixed(3)}) drop-shadow(0 0 5px rgba(255,236,160,0.95)) drop-shadow(0 18px 18px rgba(0,0,0,0.55))`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${poly.join(",")})` }}>
            <Mark />
          </div>
        </div>
      );
    })}
  </>
);

/** the fracture: lines of light racing out from the impact point, on the mark only */
const Cracks: React.FC<{ k: number }> = ({ k }) => {
  const run = prog(k, -1, 6, ease.outHard);
  const o = 1 - 0.85 * prog(k, 4, 16, ease.out);
  const segs: React.ReactNode[] = [];
  for (let j = 0; j < CRACKS.length; j += 4) {
    const [x1, y1, x2, y2] = [CRACKS[j], CRACKS[j + 1], CRACKS[j + 2], CRACKS[j + 3]];
    const r = Math.hypot((x1 + x2) / 2 - IMPACT.x, (y1 + y2) / 2 - IMPACT.y);
    const show = Math.max(0, Math.min(1, (run * 0.8 - r) / 0.08 + 1));
    if (show <= 0) continue;
    segs.push(<line key={j} x1={x1 * S} y1={y1 * S} x2={x1 * S + (x2 - x1) * S * show} y2={y1 * S + (y2 - y1) * S * show} />);
  }
  return (
    <svg width={S} height={S} style={{ position: "absolute", left: 0, top: 0, opacity: o, ...maskLogo }}>
      <g stroke="#FFF6D8" strokeWidth={7} strokeLinecap="round" opacity={0.45} style={{ filter: "blur(4px)" }}>{segs}</g>
      <g stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round">{segs}</g>
    </svg>
  );
};

export const Target: React.FC<{ t: Times; f: number; spearDist: number }> = ({ t, f, spearDist }) => {
  const rise = prog(f, t.end - 3, 18, ease.out);
  if (rise <= 0) return null;
  const k = f - t.face;
  const hit = k >= 0;
  const heat = hit ? 0 : prog(420 - spearDist, 0, 380, ease.in);
  const tremble = f >= t.hug && !hit ? 2.2 * heat : 0;
  const light = hit ? prog(k, 0, 8, ease.outHard) * (1 - 0.3 * prog(k, 10, 30, ease.out)) : 0;
  const scale = 0.84 + 0.16 * rise + 0.015 * Math.sin(f * 0.08) + (hit ? 0.04 * (1 - prog(k, 0, 10, ease.out)) : 0);
  const box: React.CSSProperties = { position: "absolute", left: HFM.x - S / 2, top: HFM.y - 520 - S / 2, width: S, height: S };
  const at = `at ${IMPACT.x * 100}% ${IMPACT.y * 100}%`;
  const rays = `repeating-conic-gradient(from ${(f * 0.25).toFixed(2)}deg ${at}, rgba(255,226,120,0.4) 0deg 1.4deg, transparent 3deg 17deg), repeating-conic-gradient(from ${(7 - f * 0.15).toFixed(2)}deg ${at}, rgba(255,200,90,0.28) 0deg 3deg, transparent 5deg 29deg)`;
  const rayMask = "radial-gradient(circle at 50% 52%, #000 10%, rgba(0,0,0,0.35) 28%, transparent 55%)";
  return (
    <>
      <div style={{ ...box, left: box.left as number - 330, top: box.top as number - 330, width: S + 660, height: S + 660, borderRadius: "50%", opacity: rise * (0.5 + 0.5 * light) + 0.5 * heat,
        background: `radial-gradient(circle, ${hit ? "rgba(255,230,140,0.55)" : "rgba(255,190,40,0.28)"} 0%, ${hit ? "rgba(255,157,0,0.22)" : `rgba(255,${Math.round(120 - 80 * heat)},20,0.14)`} 32%, transparent 62%)` }} />
      {light > 0 && <div style={{ ...box, left: box.left as number - 380, top: box.top as number - 380, width: S + 760, height: S + 760, background: rays, opacity: 0.8 * light, WebkitMaskImage: rayMask, maskImage: rayMask }} />}
      <div style={{ ...box, perspective: 900, transform: `translate(${(tremble * Math.sin(f * 2.7)).toFixed(2)}px, ${(tremble * Math.cos(f * 3.3)).toFixed(2)}px) scale(${scale.toFixed(4)})`, opacity: rise, filter: rise < 1 ? `blur(${(10 * (1 - rise)).toFixed(1)}px)` : undefined }}>
        {light > 0 && <div style={{ position: "absolute", inset: -6, ...maskLogo, background: `radial-gradient(circle at ${IMPACT.x * 100}% ${IMPACT.y * 100}%, #FFFFFF 0%, #FFF3C4 22%, ${HF} 48%, ${HF_ORANGE} 80%)`, opacity: light, filter: "blur(2px)" }} />}
        {hit ? (
          <Shards k={k} />
        ) : (
          <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${(18 + 30 * heat).toFixed(1)}px ${heat > 0.3 ? RED : "rgba(255,190,40,0.7)"}) drop-shadow(0 26px 30px rgba(0,0,0,0.6))` }}>
            <Mark />
          </div>
        )}
        {hit && k < 26 && <Cracks k={k} />}
      </div>
    </>
  );
};
