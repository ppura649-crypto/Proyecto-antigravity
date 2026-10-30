// Hook X3, the payoff: on "models" the cooled cast is torn out of the mold, rises, stands up to face the lens and
// turns over. Its top face is the Claude shape it was poured into; its other face is the real Qwen mark, edges still
// orange-hot, cooling to Qwen's own violet while it hangs there, breathing.
import React from "react";
import { Easing } from "remotion";
import { ease, prog } from "../../../src/engine";
import { Logo, QWEN } from "./parts";
import { CX, CY, DS, Masked, P, T, TILT, heat } from "./HookX3Space";
import { MetalFace } from "./HookX3Forge";

const HALF = 12;
/** the height the payoff hangs at (stage-local y) */
const HANG = 430;

export const Cast: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const s = t.mo - 6;
  if (f < s) return null;
  const up = prog(f, s, 26, ease.out);
  const stand = prog(f, s + 2, 26, Easing.out(Easing.back(1.3)));
  const flip = prog(f, t.mo + 1, 24, Easing.out(Easing.back(1.0)));
  const idle = prog(f, t.mo + 20, 20, ease.inOut);
  const dy = -(CY - HANG) * up + 5 * Math.sin(f / 13) * idle;
  const dz = 150 * up;
  const rx = TILT * (1 - stand) + 2.5 * Math.sin(f / 17) * idle;
  const ry = 180 * flip + 4 * Math.sin(f / 21) * idle;
  const sc = 1 + 0.08 * up;
  const face: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 0, height: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  return (
    <div style={{ position: "absolute", inset: 0, perspective: P, perspectiveOrigin: `${CX}px ${CY}px` }}>
      <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transform: `translate3d(0, ${dy.toFixed(1)}px, ${dz.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})` }}>
        <Edges t={t} flip={flip} />
        <div style={{ ...face, transform: `translateZ(${HALF}px)` }}>
          <MetalFace t={t} f={f} />
        </div>
        <div style={{ ...face, transform: `translateZ(${-HALF}px) rotateY(180deg)` }}>
          <QwenFace t={t} />
        </div>
      </div>
    </div>
  );
};

/** the cast's thickness: its Claude half and its Qwen half, seen only as it turns edge-on */
const Edges: React.FC<{ t: T; flip: number }> = ({ t, flip }) => (
  <>
    {[-9, -5, -1, 3, 7, 11].map((z, i) => (
      <Masked key={i} name={z > 0 ? "claude" : "qwen"} size={DS} bg={z > 0 ? heat(0.42 - 0.2 * prog(t.f, t.mo, 40, ease.out)) : "#2A2480"} style={{ transform: `translateZ(${z}px)${z > 0 ? "" : " rotateY(180deg)"}`, opacity: z > 0 ? 1 - Math.max(0, Math.min(1, (flip - 0.45) * 6)) : Math.max(0, Math.min(1, flip * 6)) }} />
    ))}
  </>
);

/** the real Qwen mark, lit from below by the mold, its edges glowing orange and cooling to violet */
const QwenFace: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const cool = prog(f, t.mo + 2, 36, Easing.out(Easing.quad));
  const hq = 0.72 - 0.62 * cool;
  const glow = heat(hq);
  const rim = `radial-gradient(circle, transparent ${34 + 22 * cool}%, ${heat(hq)} ${70 + 10 * cool}%, ${heat(hq + 0.12)} 100%)`;
  const halo = cool > 0.6 ? QWEN : glow;
  return (
    <>
      <div style={{ position: "absolute", left: -DS / 2, top: -DS / 2, filter: `drop-shadow(0 0 ${(26 - 10 * cool).toFixed(1)}px ${halo}) drop-shadow(0 18px 30px ${heat(0.6 * (1 - cool))}88)` }}>
        <Logo name="qwen" size={DS} />
      </div>
      <Masked name="qwen" size={DS} bg={glow} style={{ opacity: 0.55 * (1 - cool) }} />
      <Masked name="qwen" size={DS} bg={rim} style={{ opacity: 1 - 0.8 * cool }} />
      <Masked name="qwen" size={DS} bg={`linear-gradient(${110 + 30 * cool}deg, transparent ${20 + 70 * cool}%, #FFFFFF66 ${30 + 70 * cool}%, transparent ${40 + 70 * cool}%)`} style={{ opacity: cool > 0.2 && cool < 0.99 ? 1 : 0 }} />
    </>
  );
};
