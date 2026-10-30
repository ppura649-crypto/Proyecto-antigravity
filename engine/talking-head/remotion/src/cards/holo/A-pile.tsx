import React from "react";
import { Img, staticFile } from "remotion";
import { CX, CY, clamp, lerp, pick, sp, type Beats } from "./A-util";
// edit-k-h1 v6 (2026-09-24), variant 1 "the slop pile" (after the integrator's white title, -200 -> 1974):
// three sloppy ads slam onto a pile, 1-2-3, on YOU / TO / WATCH and stay, each a little rotated and
// overlapping so the pile gets messier. On THE the whole pile is swept off left in one move (the clean real
// wall deals in behind it, A-wall `deal`). Slop = fictional brands, generated for this (assets/slop-gen).

const W = 360, H = 540;
// file, the beat it lands on, where it lands (card px) and its tilt
const PILE: { f: string; at: keyof Beats; x: number; y: number; rot: number }[] = [
  { f: "famA-slop-bike.jpg", at: "you", x: 360, y: CY + 4, rot: -5 },
  { f: "famA-slop-serum.jpg", at: "to", x: 720, y: CY - 10, rot: 6 },
  { f: "famA-slop-pyjama.jpg", at: "watch", x: 548, y: CY + 12, rot: -2 },
];
const SLAM = { damping: 44, stiffness: 520 }; // fast (~180 ms), no overshoot

export const pileGone = (b: Beats) => b.the + 230;

export const SlopPile: React.FC<{ t: number; fps: number; b: Beats; assets: string[] }> = ({ t, fps, b, assets }) => {
  if (t >= pileGone(b)) return null;
  const push = 1 + 0.03 * clamp((t - b.you) / (b.the - b.you));
  const sw = clamp((t - b.the) / 220);
  const swE = sw * sw; // ease-in: the sweep accelerates off the card
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${push})` }}>
      {PILE.map((p, i) => {
        const at = b[p.at];
        if (t < at) return null;
        const k = clamp(sp(t, at, fps, SLAM));
        const s = lerp(1.3, 1, k);
        const x = p.x - 1500 * swE - i * 40 * swE, rot = p.rot - 14 * swE;
        return (
          <div key={i} style={{ position: "absolute", left: x - W / 2, top: p.y - H / 2 + lerp(-50, 0, k), width: W,
            height: H, zIndex: i, opacity: clamp(k * 2.5), transform: `rotate(${rot}deg) scale(${s})`,
            boxShadow: `0 ${lerp(40, 16, k)}px ${lerp(70, 34, k)}px rgba(0,0,0,${lerp(0.35, 0.55, k)})` }}>
            <Img src={staticFile(pick(assets, p.f))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </div>
  );
};
