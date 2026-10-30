// The hook's world: one photoreal still of a black hall of glass sandbox cubes (gpt-image-1, public/hf-incident/hook/),
// relit in layers. Dark hall, the cyan lights igniting row by row from the camera to the far end, a flash band riding
// the ignition front, the red version of the same photo swept in on "hacking", red light pulses streaming along the
// floor into the vanishing point, the real Hugging Face mark rising over the horizon with its floor reflection, and the
// crack of light across it. All in image coordinates, inside the camera transform that Hook.tsx drives.
import React from "react";
import { Img } from "remotion";
import { asset, rand, RED } from "./parts";

/** the still is 1024 px square; drawn at IMG px; its vanishing point in source px */
export const IMG = 1140;
const K = IMG / 1024;
export const VP = { x: 512 * K, y: 432 * K };
const src = (n: string) => asset(`hook/${n}.webp`);
const fill: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: IMG, height: IMG };

/** a mask that shows the photo from the bottom edge up to `edge` (source px from the top), soft by `soft` px */
const upTo = (edge: number, soft = 26): React.CSSProperties => {
  const a = Math.max(0, Math.min(100, ((1024 - edge) / 1024) * 100));
  const b = a + (soft / 1024) * 100;
  const m = `linear-gradient(to top, #000 0%, #000 ${a.toFixed(2)}%, transparent ${b.toFixed(2)}%)`;
  return { WebkitMaskImage: m, maskImage: m };
};
const band = (edge: number, w = 40): React.CSSProperties => {
  const c = ((1024 - edge) / 1024) * 100;
  const d = (w / 1024) * 100;
  const m = `linear-gradient(to top, transparent ${(c - d).toFixed(2)}%, #000 ${c.toFixed(2)}%, transparent ${(c + d * 0.4).toFixed(2)}%)`;
  return { WebkitMaskImage: m, maskImage: m };
};

export type HallState = {
  lit: number; // ignition front, source px from the top (1024 = nothing lit, ~300 = all lit)
  pulse: number; // extra brightness of every light (0..1)
  red: number; // red front, same units
  redOn: boolean;
  flick: number; // 0.85..1 live flicker
};

export const Hall: React.FC<{ s: HallState }> = ({ s }) => {
  const litOn = s.lit < 1024;
  return (
    <>
      <Img src={src("hall-a")} style={{ ...fill, filter: "brightness(0.14) saturate(0.4)" }} />
      {litOn && (
        <Img
          src={src("hall-a")}
          style={{ ...fill, ...upTo(s.lit), opacity: s.flick, filter: `brightness(${(1.05 + 0.6 * s.pulse).toFixed(3)}) saturate(${(1.1 + 0.3 * s.pulse).toFixed(2)})` }}
        />
      )}
      {litOn && s.lit > 330 && <Img src={src("hall-a")} style={{ ...fill, ...band(s.lit), mixBlendMode: "screen", filter: "brightness(2.6) saturate(1.4)" }} />}
      {s.redOn && <Img src={src("hall-red")} style={{ ...fill, ...upTo(s.red, 60), filter: `brightness(${(1.25 * s.flick).toFixed(3)}) saturate(1.2)` }} />}
      {s.redOn && s.red > 330 && <Img src={src("hall-red")} style={{ ...fill, ...band(s.red, 70), mixBlendMode: "screen", filter: "brightness(3)" }} />}
    </>
  );
};

/** red light leaving every cube along the floor toward the vanishing point: the swarm turning on one target */
export const Streams: React.FC<{ f: number; start: number; n?: number }> = ({ f, start, n = 110 }) => {
  if (f < start) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const px = rand(i, 3) * 1024 * K;
        const py = (470 + Math.pow(rand(i, 7), 0.7) * 560) * K;
        const period = 20 + Math.floor(rand(i, 11) * 16);
        const born = start + Math.floor(rand(i, 5) * 7);
        if (f < born) return null;
        const t = ((f - born) % period) / period;
        const x = px + (VP.x - px) * t;
        const y = py + (VP.y - py) * t;
        const near = (py - VP.y) / (1024 * K - VP.y); // 0 far .. 1 near
        const len = (40 + 190 * near) * (1 - t);
        const ang = Math.atan2(VP.y - py, VP.x - px);
        const o = Math.min(1, t * 8) * (1 - t) * (0.55 + 0.45 * near);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x - len, top: y - 1.5, width: len, height: 3 + 4 * near * (1 - t),
              transformOrigin: "100% 50%", transform: `rotate(${ang}rad)`, opacity: o, borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${RED} 60%, #ffd0c8)`,
              boxShadow: `0 0 ${(6 + 10 * near).toFixed(1)}px ${RED}`,
            }}
          />
        );
      })}
    </>
  );
};

/** the far end: the real Hugging Face mark risen over the horizon, its reflection on the black floor, and the crack */
export const FarMark: React.FC<{ size: number; o: number; glow: number; crack: number; crackO: number; flick: number }> = ({ size, o, glow, crack, crackO, flick }) => {
  if (o <= 0) return null;
  const cy = VP.y - size * 0.53;
  const mark: React.CSSProperties = { position: "absolute", left: VP.x - size / 2, top: cy - size / 2, width: size, height: size };
  const logo = asset("hook/hf-mark.png"); // the real mark, its white cut-out fringe removed
  const cs = size * (0.7 + 1.1 * crack);
  // the impact point: the upper right of the face, so the eyes and the smile stay readable through the cracks
  const ix = size * 0.68;
  const iy = size * 0.3;
  const rm = "radial-gradient(circle, transparent 10%, #000 18%, #000 30%, transparent 62%)";
  const hole = "radial-gradient(circle, transparent 4%, #000 9%)";
  const lm: React.CSSProperties = { WebkitMaskImage: `url(${logo})`, WebkitMaskSize: "100% 100%", maskImage: `url(${logo})`, maskSize: "100% 100%" };
  const at = (w: number): React.CSSProperties => ({ position: "absolute", left: ix - w / 2, top: iy - w / 2, width: w, height: w });
  const core = size * (0.1 + 0.35 * crackO);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <div style={{ position: "absolute", left: VP.x - size * 1.4, top: cy - size * 1.4, width: size * 2.8, height: size * 2.8, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,190,40,${(0.5 * glow).toFixed(3)}) 0%, rgba(255,120,20,${(0.18 * glow).toFixed(3)}) 35%, transparent 68%)` }} />
      <Img src={logo} style={{ ...mark, top: VP.y + size * 0.06, transform: "scaleY(-0.55)", transformOrigin: "50% 0%", opacity: 0.28 * flick, filter: "blur(5px)" }} />
      <Img src={logo} style={{ ...mark, filter: `brightness(${(0.75 + 0.45 * glow).toFixed(3)}) drop-shadow(0 0 ${(30 * glow).toFixed(1)}px rgba(255,200,40,0.8))` }} />
      {crack > 0 && (
        <div style={{ ...mark, ...lm }}>
          <Img src={logo} style={{ position: "absolute", inset: 0, width: size, height: size }} />
          <Img src={src("crack")} style={{ ...at(cs), filter: "invert(1) grayscale(1) contrast(2.2) brightness(1.1)", mixBlendMode: "multiply", WebkitMaskImage: hole, maskImage: hole }} />
          <Img src={src("crack")} style={{ ...at(cs), filter: "brightness(1.5)", mixBlendMode: "screen", opacity: 0.45 }} />
        </div>
      )}
      {crack > 0 && (
        <div style={{ position: "absolute", left: mark.left as number, top: mark.top as number, width: size, height: size }}>
          <Img src={src("crack")} style={{ ...at(cs * 3.2), opacity: 0.75 * crackO * flick, mixBlendMode: "screen", filter: "brightness(1.3)", WebkitMaskImage: rm, maskImage: rm }} />
          <div style={{ ...at(core * 2), borderRadius: "50%", mixBlendMode: "screen", opacity: flick, background: "radial-gradient(circle closest-side, #fff 0%, rgba(255,236,170,0.9) 18%, rgba(255,190,60,0.35) 45%, transparent 70%)" }} />
        </div>
      )}
    </div>
  );
};

/** single glass cubes flying past the lens (screen-blended: their black ground vanishes) */
export const FlyBy: React.FC<{ f: number; starts: number[] }> = ({ f, starts }) => (
  <>
    {starts.map((s0, i) => {
      const t = (f - s0) / 26;
      if (t < 0 || t > 1) return null;
      const side = i % 2 === 0 ? -1 : 1;
      const k = Math.pow(t, 2.2);
      const size = 60 + 1300 * k;
      const x = 540 + side * (60 + 900 * k) * (0.7 + 0.5 * rand(i, 2));
      const y = 400 + (rand(i, 9) - 0.35) * 900 * k;
      const blur = 1 + 18 * k;
      return (
        <Img
          key={i}
          src={src("cube")}
          style={{
            position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, mixBlendMode: "screen",
            opacity: Math.min(1, t * 5) * (1 - Math.pow(t, 4)), filter: `blur(${blur.toFixed(1)}px)`, transform: `rotate(${(side * 40 * t + i * 23).toFixed(1)}deg)`,
          }}
        />
      );
    })}
  </>
);
