// Hook X4, dark, 0.1-3.7 s: "How do Chinese AI companies copy Anthropic models?"
// THE THINKING, STOLEN. The report says the target was Claude's thinking. The real Claude mark is the heart of a
// glass core, its thinking already running at f1 as living streams of terracotta light. "How do": the empty Qwen vessel
// surges up from below and charges. "Chinese": its violet probe spears the glass, a crack of light. "AI companies": the
// fracture runs. "copy": the thinking is ripped out through the wound as one luminous ribbon that arches across the
// stage, whips on its spring and pours into Qwen, which fills from the bottom. "Anthropic": Claude's core goes dark,
// empty. "models": Qwen is full and blooms with the stolen light, Claude's starburst shining out behind it.
import React from "react";
import { Column } from "../../../src/engine";
import { CLAUDE, QWEN } from "./parts";
import { H, T, W, coreAt, levelAt, qwenAt, rnd, shakeAt, useT } from "./HookX4Geo";
import { Core, coreGlowAt } from "./HookX4Core";
import { Cracks, Impact, Pour, Probe, Ribbon, Shed } from "./HookX4Ribbon";
import { Bloom, Halo, Vessel } from "./HookX4Qwen";

const TOP = 520;

/** the room's light: warm around the core while it thinks, the warmth travelling to the vessel as it fills */
const Room: React.FC<{ t: T }> = ({ t }) => {
  const c = coreAt(t);
  const q = qwenAt(t);
  const g = coreGlowAt(t);
  const L = levelAt(t);
  const breathe = 0.88 + 0.12 * Math.sin(t.f / 10);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: breathe, background: [
      `radial-gradient(circle 520px at ${c.x}px ${c.y}px, ${CLAUDE}${Math.round(10 + 34 * g).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
      `radial-gradient(circle 480px at ${q.x}px ${q.y}px, ${QWEN}${Math.round(14 + 20 * L).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
    ].join(", ") }} />
  );
};

/** depth: warm dust drifting toward the lens, near motes big and bright, far ones small and dim */
const Dust: React.FC<{ t: T }> = ({ t }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: 80 }, (_, i) => {
      const z = 300 + ((((rnd(i, 51) * 2400 - t.f * 4) % 2400) + 2400) % 2400);
      const s = 700 / z;
      const x = 450 + (rnd(i, 52) - 0.5) * 2600 * s;
      const y = 465 + (rnd(i, 53) - 0.5) * 2600 * s;
      return <circle key={i} cx={x} cy={y} r={Math.min(3, 1.2 * s)} fill="#FFD9C7" opacity={Math.min(0.45, 0.3 * s)} />;
    })}
  </svg>
);

export const HookX4: React.FC = () => {
  const t = useT();
  const sh = shakeAt(t);
  const fade = "linear-gradient(to bottom, transparent 0, #000 70px, #000 860px, transparent 930px)";
  const fadeX = "linear-gradient(to right, transparent 0, #000 60px, #000 840px, transparent 900px)";
  return (
    <Column>
      <div style={{ position: "absolute", left: 0, top: TOP, width: W, height: H, overflow: "hidden", WebkitMaskImage: `${fade}, ${fadeX}`, WebkitMaskComposite: "source-in", maskImage: `${fade}, ${fadeX}`, maskComposite: "intersect" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x.toFixed(1)}px, ${sh.y.toFixed(1)}px)` }}>
          <Room t={t} />
          <Dust t={t} />
          <Halo t={t} />
          <Core t={t} />
          <Cracks t={t} />
          <Vessel t={t} />
          <Probe t={t} />
          <Ribbon t={t} />
          <Pour t={t} />
          <Shed t={t} />
          <Impact t={t} />
          <Bloom t={t} />
        </div>
      </div>
    </Column>
  );
};
