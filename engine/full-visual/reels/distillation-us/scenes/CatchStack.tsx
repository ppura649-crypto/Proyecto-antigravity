// The machine in depth: Qwen3 0.6B's 28 layers as a tilted stack of plates in real CSS 3D perspective, and between
// every pair of plates a standing strip of 12 cells: the last token's hidden state at that depth (HIDDEN, measured).
// Each cell is coloured by its real value (cyan positive, pink negative, brighter = bigger, log scale because the
// values run from 0.03 to 215), each strip glows by the real size of the whole state (NORMS). A band of light runs
// down the plates forever: the forward pass. Nothing here is invented; nothing here is still.
import React from "react";
import { useScene } from "../../../src/engine";
import { HIDDEN, NORMS } from "./parts";

export const PLATE = { w: 620, d: 360, tilt: 60 };
const SIN = Math.sin((PLATE.tilt * Math.PI) / 180);
const COS = Math.cos((PLATE.tilt * Math.PI) / 180);
const DARK = [30, 33, 40];
const POS = [90, 200, 250];
const NEG = [255, 104, 156];
const MAXN = Math.log10(Math.max(...NORMS.map((r) => r[r.length - 1])));

export type Cam = { cx: number; cy: number; s: number; gap: number; rz: number; op: number };

/** a hidden-state value as a colour: sign picks the hue, log size picks how far from dark it gets */
export function cellRGB(v: number, lit = 1) {
  const t = Math.min(1, Math.log10(1 + Math.abs(v)) / Math.log10(61));
  const hue = v >= 0 ? POS : NEG;
  const k = (0.1 + 0.9 * t) * lit;
  const c = DARK.map((d, i) => Math.round(d + (hue[i] - d) * k));
  return { rgb: `rgb(${c[0]},${c[1]},${c[2]})`, t, hue: `rgb(${hue[0]},${hue[1]},${hue[2]})` };
}

/** how big the whole state is at a depth, 0..1 (log of the measured norm) */
export const normAt = (j: number) => Math.max(0, Math.log10(NORMS[j][NORMS[j].length - 1]) / MAXN);

/** where depth d (0 = above layer 1, 28 = below layer 28) lands on screen: the front edge, near enough */
export const depthY = (d: number, c: Cam) => c.cy + ((d - 14) * c.gap * SIN + (PLATE.d / 2) * COS) * c.s;

const Strip: React.FC<{ j: number; lit: number; light: number; h: number }> = ({ j, lit, light, h }) => {
  const { f } = useScene();
  const vals = HIDDEN[j];
  const n = normAt(j) * lit;
  return (
    <div
      style={{
        position: "absolute", left: -PLATE.w / 2 + 34, top: PLATE.d / 2 - h, width: PLATE.w - 68, height: h,
        transformOrigin: "50% 100%", transform: "rotateX(-90deg)", display: "flex", gap: 4,
        filter: n + light > 0.05 ? `drop-shadow(0 0 ${(6 + 18 * n).toFixed(1)}px rgba(170,215,255,${(0.35 * n + 0.6 * light).toFixed(3)}))` : undefined,
      }}
    >
      {vals.map((v, c) => {
        const shimmer = 0.88 + 0.12 * Math.sin(f / 6 + c * 1.7 + j * 0.9);
        const col = cellRGB(v, Math.min(1, lit * shimmer + light * 0.7));
        return <div key={c} style={{ flex: 1, borderRadius: 3, background: col.rgb, boxShadow: `inset 0 0 0 1px rgba(255,255,255,${(0.06 + 0.2 * lit).toFixed(3)})` }} />;
      })}
    </div>
  );
};

const Plate: React.FC<{ light: number }> = ({ light }) => (
  <div
    style={{
      position: "absolute", left: -PLATE.w / 2, top: -PLATE.d / 2, width: PLATE.w, height: PLATE.d, borderRadius: 16,
      background: `linear-gradient(170deg, rgba(${Math.round(92 + 90 * light)},${Math.round(100 + 100 * light)},${Math.round(118 + 110 * light)},0.34), rgba(24,27,33,0.62))`,
      boxShadow: `inset 0 0 0 2px rgba(210,225,255,${(0.2 + 0.6 * light).toFixed(3)}), 0 0 ${(60 * light).toFixed(1)}px rgba(150,200,255,${(0.7 * light).toFixed(3)})`,
    }}
  />
);

/**
 * The stack. `lit(j)` 0..1 is how lit strip j is (the ignition on "between,"), `pulse` is the depth the band of light
 * is at (-1 = none), `tokenIn` 0..1 is the dropped token's glow on the top plate.
 */
export const Stack: React.FC<{ cam: Cam; lit: (j: number) => number; pulse: number; tokenIn?: number }> = ({ cam, lit, pulse, tokenIn = 0 }) => {
  const h = cam.gap * 0.74;
  const lightAt = (d: number) => (pulse < 0 ? 0 : Math.max(0, 1 - Math.abs(pulse - d) / 1.6));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: "2200px", perspectiveOrigin: `${cam.cx}px ${cam.cy - 300}px`, opacity: cam.op }}>
      <div style={{ position: "absolute", left: cam.cx, top: cam.cy, width: 0, height: 0, transformStyle: "preserve-3d", transform: `scale(${cam.s.toFixed(4)}) rotateX(${PLATE.tilt}deg) rotateZ(${cam.rz.toFixed(2)}deg)` }}>
        {Array.from({ length: 29 }, (_, j) => (
          <React.Fragment key={j}>
            <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `translateZ(${((14 - j) * cam.gap).toFixed(2)}px)` }}>
              <Strip j={j} lit={lit(j)} light={lightAt(j)} h={h} />
            </div>
            {j < 28 && (
              <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `translateZ(${((14 - j - 0.5) * cam.gap).toFixed(2)}px)` }}>
                <Plate light={Math.max(lightAt(j + 0.5), j === 0 ? tokenIn : 0)} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
