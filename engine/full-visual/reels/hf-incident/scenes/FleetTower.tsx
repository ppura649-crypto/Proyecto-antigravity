// The illustrated server tower of `fleet`: a toy-like graphite rack built from seven stacked pieces (plinth, five
// drive bays, cap), so it can fall apart into particles and grow back piece by piece. `red` 0..1 turns its lamps and
// rim from the cool agent cyan to the swarm red. Drawn at 60 x 248 and scaled for the big close-up.
import React from "react";
import { interpolateColors } from "remotion";
import { ease, prog, useScene } from "../../../src/engine";
import { AGENT, RED, rand } from "./parts";

export const TW = 60;
export const TH = 248;

/** piece rects in tower coordinates, bottom-up: 0 plinth, 1..5 bays, 6 cap */
const PIECES = [
  { y: 230, h: 18, kind: "base" },
  ...[4, 3, 2, 1, 0].map((k) => ({ y: 22 + k * 42, h: 38, kind: "bay" })),
  { y: 0, h: 18, kind: "cap" },
];

/** all pieces in place */
export const FULL = [1, 1, 1, 1, 1, 1, 1];

/** pieces stacking bottom-up from `start`, one every `step` frames, each dropping in over `dur` */
export const stackUp = (f: number, start: number, step = 4, dur = 7) => PIECES.map((_, i) => prog(f, start + i * step, dur, ease.out));

type Props = { x: number; bottom: number; scale?: number; red: number; pieces?: number[]; alpha?: number; seed: number; flash?: number; children?: React.ReactNode };

const Bay: React.FC<{ y: number; h: number; led: string; lit: boolean; red: number; p: number }> = ({ y, h, led, lit, red, p }) => (
  <div
    style={{
      position: "absolute", left: 3, right: 3, top: y, height: h, borderRadius: 5, opacity: p,
      transform: `translateY(${((1 - p) * -46).toFixed(1)}px)`,
      background: "linear-gradient(180deg, #353A43 0%, #252930 55%, #1B1E23 100%)",
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 0 rgba(0,0,0,0.5), 0 0 ${(10 * red).toFixed(1)}px rgba(255,59,48,${(0.25 * red).toFixed(2)})`,
    }}
  >
    <div style={{ position: "absolute", left: 7, top: h / 2 - 4, width: 8, height: 8, borderRadius: 4, background: lit ? led : "#3A3F47", boxShadow: lit ? `0 0 8px 2px ${led}` : undefined }} />
    <div style={{ position: "absolute", left: 20, top: h / 2 - 1.5, width: 10, height: 3, borderRadius: 2, background: lit ? led : "#3A3F47", opacity: 0.6 }} />
    {[0, 1, 2].map((v) => (
      <div key={v} style={{ position: "absolute", right: 6, top: h / 2 - 6 + v * 5, width: 18, height: 2, borderRadius: 1, background: "#0E1013" }} />
    ))}
  </div>
);

export const Tower: React.FC<Props> = ({ x, bottom, scale = 1, red, pieces = FULL, alpha = 1, seed, flash = 0, children }) => {
  const { f } = useScene();
  const led = interpolateColors(red, [0, 1], [AGENT, RED]);
  const glow = red * (0.75 + 0.25 * Math.sin(f / 9 + seed));
  return (
    <div style={{ position: "absolute", left: x - TW / 2, top: bottom - TH, width: TW, height: TH, transformOrigin: "50% 100%", transform: `scale(${scale.toFixed(4)})`, opacity: alpha }}>
      {/* floor shadow and the red light it throws on the floor */}
      <div style={{ position: "absolute", left: -26, right: -26, top: TH - 8, height: 18, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,59,48,${(0.55 * glow).toFixed(2)}), rgba(0,0,0,0.6) 60%, transparent)`, opacity: Math.min(...pieces.slice(0, 1)) }} />
      {/* the rack frame behind the bays */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 10, bottom: 8, borderRadius: 8, opacity: pieces[3], background: "linear-gradient(90deg, #22252B, #2E323A 40%, #1A1C20)", boxShadow: `0 0 ${(28 * glow).toFixed(1)}px ${(4 * glow).toFixed(1)}px rgba(255,59,48,${(0.45 * glow).toFixed(2)}), inset 2px 0 0 rgba(255,255,255,0.1)` }} />
      {PIECES.map((pc, i) => {
        const p = pieces[i];
        if (p <= 0) return null;
        if (pc.kind === "bay") {
          const lit = rand(seed * 7 + i + Math.floor((f + seed * 3) / 8), 3) > 0.28;
          return <Bay key={i} y={pc.y} h={pc.h} led={led} lit={lit} red={red} p={p} />;
        }
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: pc.kind === "cap" ? -3 : -4, right: pc.kind === "cap" ? -3 : -4, top: pc.y, height: pc.h, borderRadius: pc.kind === "cap" ? "8px 8px 4px 4px" : "3px 3px 6px 6px",
              opacity: p, transform: `translateY(${((1 - p) * -46).toFixed(1)}px)`,
              background: pc.kind === "cap" ? `linear-gradient(180deg, #4A505B, #2A2E35)` : "linear-gradient(180deg, #2A2E35, #121417)",
              boxShadow: pc.kind === "cap" ? `inset 0 2px 0 rgba(255,255,255,0.22), 0 -2px ${(12 * red).toFixed(1)}px rgba(255,59,48,${(0.5 * red).toFixed(2)})` : "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          />
        );
      })}
      {flash > 0 && <div style={{ position: "absolute", left: -6, right: -6, top: -6, bottom: -6, borderRadius: 10, background: "#FFFFFF", opacity: flash, filter: "blur(3px)" }} />}
      {children}
    </div>
  );
};

/** a tower breaking into red specks (t 0 -> 1) or, run backwards, the specks flying home before it restacks */
export const Specks: React.FC<{ x: number; bottom: number; t: number; seed: number; count?: number }> = ({ x, bottom, t, seed, count = 64 }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <>
      {Array.from({ length: count }, (_, j) => {
        const ox = (rand(j, seed) - 0.5) * TW;
        const oy = -rand(j, seed + 1) * TH;
        const vx = (rand(j, seed + 2) - 0.5) * 220;
        const vy = -30 - rand(j, seed + 3) * 150;
        const s = 6 + rand(j, seed + 4) * 10;
        const px = x + ox + vx * t;
        const py = bottom + oy + vy * t + 40 * t * t;
        const hot = rand(j, seed + 5) > 0.35;
        return (
          <div
            key={j}
            style={{
              position: "absolute", left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: hot ? s / 2 : 2,
              background: hot ? RED : "#3A3F47", opacity: Math.sqrt(1 - t),
              boxShadow: hot ? `0 0 ${s * 1.6}px ${RED}` : undefined, transform: `rotate(${(t * 360 * (rand(j, seed + 6) - 0.5)).toFixed(0)}deg)`,
            }}
          />
        );
      })}
    </>
  );
};
