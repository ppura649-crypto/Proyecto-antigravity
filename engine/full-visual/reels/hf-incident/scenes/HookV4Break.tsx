// The Hugging Face mark as the fortress keep, and its break on "Face": trembling under the siege with a red rim of
// light, then cracks racing out from one point across the real mark (masked to its shape, so they run on the face
// only), then eight chunks lifting away from each other with weight (a hard kick, a long slowdown, a slow drift), the
// light behind pouring out through the gaps. The chunk edges are the crack lines, so the break is one object.
import React from "react";
import { Img } from "remotion";
import { draw, ease, prog } from "../../../src/engine/moves";
import { asset, HF, rand, RED } from "./parts";
import type { T4 } from "./HookV4World";

const C = { x: 52, y: 47 };
const OFF = [8, -6, 12, -10, 5, -12, 9, -4];
const pol = (a: number, r: number) => ({ x: C.x + Math.cos((a * Math.PI) / 180) * r, y: C.y + Math.sin((a * Math.PI) / 180) * r });

/** eight irregular rays out of the impact point: a jag near the centre, then out past the edge */
const RAYS = OFF.map((o, k) => {
  const a = -80 + k * 45 + o;
  const jag = pol(a + (rand(k, 41) - 0.5) * 22, 16 + rand(k, 43) * 14);
  return { a, jag, end: pol(a, 96), branch: pol(a + 24 * (rand(k, 47) > 0.5 ? 1 : -1), 40 + rand(k, 53) * 16) };
});

const SHARDS = RAYS.map((r, k) => {
  const n = RAYS[(k + 1) % RAYS.length];
  const pts = [C, r.jag, r.end, n.end, n.jag];
  const mid = ((r.a + (k === RAYS.length - 1 ? n.a + 360 : n.a)) / 2) * (Math.PI / 180);
  const ctr = { x: (C.x + r.jag.x + r.end.x + n.end.x + n.jag.x) / 5, y: (C.y + r.jag.y + r.end.y + n.end.y + n.jag.y) / 5 };
  return { clip: `polygon(${pts.map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(", ")})`, dir: { x: Math.cos(mid), y: Math.sin(mid) }, ctr, rr: rand(k, 59), r2: rand(k, 61) };
});

const crackD = (k: number) => {
  const r = RAYS[k];
  return `M${C.x} ${C.y} L${r.jag.x.toFixed(1)} ${r.jag.y.toFixed(1)} L${r.end.x.toFixed(1)} ${r.end.y.toFixed(1)}`;
};
const branchD = (k: number) => {
  const r = RAYS[k];
  return `M${r.jag.x.toFixed(1)} ${r.jag.y.toFixed(1)} L${r.branch.x.toFixed(1)} ${r.branch.y.toFixed(1)}`;
};

/** the cracks, drawn only where the mark is (its own alpha is the mask) */
const Cracks: React.FC<{ f: number; fc: number }> = ({ f, fc }) => {
  const fade = 1 - prog(f, fc + 10, 12, ease.linear);
  if (f < fc - 3 || fade <= 0) return null;
  const m = `url(${asset("logo-huggingface.png")})`;
  return (
    <div style={{ position: "absolute", inset: 0, WebkitMaskImage: m, maskImage: m, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", opacity: fade }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="v4crk" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
        </defs>
        {RAYS.map((_, k) => (
          <g key={k}>
            <path d={crackD(k)} fill="none" stroke={HF} strokeWidth={4.5} filter="url(#v4crk)" {...draw(f, fc - 3 + (k % 3), 8)} />
            <path d={crackD(k)} fill="none" stroke="#FFFBEA" strokeWidth={1.4} strokeLinejoin="round" {...draw(f, fc - 3 + (k % 3), 8)} />
            <path d={branchD(k)} fill="none" stroke="#FFFBEA" strokeWidth={0.8} {...draw(f, fc + 2 + (k % 3), 7)} />
          </g>
        ))}
      </svg>
    </div>
  );
};

/** the whole keep: one mark until "Face", eight lit chunks after */
export const Keep: React.FC<{ f: number; T: T4; x: number; y: number; size: number; siege: number; level: number }> = ({ f, T, x, y, size, siege, level }) => {
  const fc = T.fc;
  const trem = 2.2 * prog(f, T.h + 18, 12) * (1 - prog(f, fc - 3, 3)) + 7 * (f >= fc - 3 && f < fc + 6 ? 1 : 0);
  const sx = Math.sin(f * 2.3) * trem;
  const sy = Math.cos(f * 3.1) * trem * 0.6;
  const split = f >= fc + 6;
  const kick = prog(f, fc + 6, 44, ease.outHard);
  const drift = Math.max(0, f - (fc + 30));
  const rim = `drop-shadow(0 0 ${(10 + 26 * siege).toFixed(1)}px ${siege > 0.05 ? RED : HF}${siege > 0.05 ? "CC" : "88"})`;
  const warm = `drop-shadow(0 0 ${(14 + 20 * level).toFixed(1)}px rgba(255,210,30,${(0.25 + 0.4 * level).toFixed(2)}))`;
  const img = <Img src={asset("logo-huggingface.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
  return (
    <div style={{ position: "absolute", left: x - size / 2 + sx, top: y - size + sy, width: size, height: size, perspective: 900 }}>
      {!split && (
        <div style={{ position: "absolute", inset: 0, filter: `${warm} ${rim}` }}>
          {img}
          <Cracks f={f} fc={fc} />
        </div>
      )}
      {split &&
        SHARDS.map((s, k) => {
          const dist = (0.07 + 0.12 * s.rr) * size * kick + drift * 0.12;
          const lift = (0.05 + 0.1 * s.r2) * size * kick + drift * 0.2;
          const rz = (s.rr - 0.5) * 34 * kick + (s.rr - 0.5) * drift * 0.08;
          const rx = (s.r2 - 0.5) * 50 * kick;
          const t = `translate(${(s.dir.x * dist).toFixed(1)}px, ${(s.dir.y * dist * 0.8 - lift).toFixed(1)}px) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
          const edge = 1 - prog(f, fc + 20, 40, ease.linear) * 0.5;
          return (
            <div key={k} style={{ position: "absolute", inset: 0, transform: t, transformOrigin: `${s.ctr.x}% ${s.ctr.y}%`, filter: `drop-shadow(0 0 ${(12 * edge).toFixed(1)}px rgba(255,236,160,0.95)) drop-shadow(0 0 3px #FFFBEA)` }}>
              <div style={{ position: "absolute", inset: 0, clipPath: s.clip, WebkitClipPath: s.clip }}>
                {img}
                <Cracks f={f} fc={fc} />
              </div>
            </div>
          );
        })}
    </div>
  );
};

/** the light inside the keep: a core behind the mark that floods out on "Face", and god rays turning slowly */
export const KeepLight: React.FC<{ f: number; fc: number; x: number; y: number; front?: boolean }> = ({ f, fc, x, y, front }) => {
  const p = prog(f, fc - 1, 10, ease.outHard);
  if (p <= 0) return null;
  const breath = 1 + 0.05 * Math.sin((f - fc) * 0.25);
  const R = (front ? 400 : 300 + 180 * p) * breath;
  const rays = `repeating-conic-gradient(from ${((f - fc) * 0.35).toFixed(2)}deg, rgba(255,236,170,0.55) 0deg 3deg, transparent 3deg 11deg, rgba(255,210,30,0.35) 11deg 13deg, transparent 13deg 22deg)`;
  const mask = "radial-gradient(closest-side, #000 12%, rgba(0,0,0,0.45) 45%, transparent 92%)";
  return (
    <div style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, pointerEvents: "none", mixBlendMode: front ? "screen" : undefined, opacity: front ? 0.35 * p : p }}>
      <div style={{ position: "absolute", inset: 0, background: rays, WebkitMaskImage: mask, maskImage: mask, transform: `scale(${(0.4 + 0.6 * p).toFixed(3)})` }} />
      {!front && <div style={{ position: "absolute", inset: "30%", borderRadius: "50%", background: "radial-gradient(closest-side, #FFFFFF, rgba(255,240,180,0.9) 35%, rgba(255,210,30,0.45) 65%, transparent)" }} />}
    </div>
  );
};
