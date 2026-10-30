// `scary`: the swarm as one field of 1,200 agents (the AgentIcon silhouette from AgentGlyph, light enough for 1,200) in "world" coordinates around the test sheet. The first 180 are the
// swarm we have followed (red, drifting, then gathered cyan/white around the sheet); the other 1,020 wait outside the
// frame and come into view as the stage pulls back. 1,200 agents: METR (facts.md section 2).
import React from "react";
import { ease, mix, prog, useScene } from "../../../src/engine";
import { AGENT, RED, rand } from "./parts";
import { AgentGlyphDefs, AgentUse } from "./AgentGlyph";

export const SCARY_C = { x: 450, y: 985 };
export const SCARY_N = 1200;
const INNER = 180;

type Dot = { sx: number; sy: number; gx: number; gy: number; r: number; white: boolean; inView: boolean };

function makeDots(): Dot[] {
  const out: Dot[] = [];
  for (let i = 0; i < INNER; i++) {
    const a = rand(i, 2) * Math.PI * 2;
    const rr = Math.sqrt(rand(i, 4));
    const ga = rand(i, 6) * Math.PI * 2;
    const gr = 150 + rand(i, 8) * 170;
    out.push({ sx: Math.cos(a) * rr * 390, sy: Math.sin(a) * rr * 430, gx: Math.cos(ga) * gr, gy: Math.sin(ga) * gr * 1.1, r: 6 + rand(i, 9) * 4, white: i % 3 === 0, inView: true });
  }
  let j = 0;
  while (out.length < SCARY_N) {
    j++;
    const x = (rand(j, 21) * 2 - 1) * 1400;
    const y = (rand(j, 23) * 2 - 1) * 1560;
    if ((x / 330) ** 2 + (y / 370) ** 2 < 1) continue;
    const inView = Math.abs(x) < 440 && Math.abs(y) < 480;
    out.push({ sx: x, sy: y, gx: x, gy: y, r: 6 + rand(j, 25) * 5, white: j % 3 === 0, inView });
  }
  return out;
}
const DOTS = makeDots();

/** zoom 1 until the pull-back, which ends on `scary`; a slow breath after */
export const scaryZoom = (f: number, pull: number, dur: number) => {
  const z = 1 - 0.71 * prog(f, pull, dur, ease.inOut);
  return z * (1 + 0.018 * Math.sin((f - pull) / 26) * prog(f, pull + dur, 20));
};

export const ScaryField: React.FC<{ t0: number; gather: number; gDur: number; pull: number; pDur: number }> = ({ t0, gather, gDur, pull, pDur }) => {
  const { f } = useScene();
  const z = scaryZoom(f, pull, pDur);
  const g = prog(f, gather, gDur, ease.inOut);
  const reveal = prog(f, pull + 6, pDur - 6, ease.linear);
  const after = prog(f, pull + pDur - 10, 30, ease.linear);
  return (
    <svg width={860} height={930} viewBox="20 520 860 930" style={{ position: "absolute", left: 20, top: 520, overflow: "hidden", WebkitMaskImage: "radial-gradient(closest-side ellipse at 50% 50%, #000 78%, transparent 100%)", maskImage: "radial-gradient(closest-side ellipse at 50% 50%, #000 78%, transparent 100%)" }}>
      <AgentGlyphDefs id="scary-agent" />
      <defs>
        <filter id="scary-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#scary-glow)">
        {DOTS.map((d, i) => {
          const inner = i < INNER;
          const drift = 1 - g;
          const wx = d.sx + (d.gx - d.sx) * g + Math.sin(f / 28 + i * 1.7) * (inner ? 9 * drift + 3 : 3);
          const wy = d.sy + (d.gy - d.sy) * g + Math.cos(f / 31 + i * 2.3) * (inner ? 9 * drift + 3 : 3);
          const x = SCARY_C.x + wx * z;
          const y = SCARY_C.y + wy * z;
          if (x < 0 || x > 900 || y < 500 || y > 1470) return null;
          const calm = d.white ? "#F2F7FF" : AGENT;
          const col = inner ? mix(f, gather, gDur, RED, calm) : calm;
          const dist = Math.hypot(wx, wy);
          const breath = 0.6 + 0.4 * Math.sin(f / 14 - dist / 90);
          const base = inner ? prog(f, t0 + Math.floor(rand(i, 31) * 10), 8) : d.inView ? reveal : 1;
          const o = base * (1 - after + after * breath);
          return <AgentUse key={i} id="scary-agent" x={x} y={y} size={Math.max(11, d.r * z * 2.4)} color={col} opacity={o} />;
        })}
      </g>
    </svg>
  );
};
