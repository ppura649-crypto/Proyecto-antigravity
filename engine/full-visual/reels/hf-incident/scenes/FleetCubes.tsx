// "every fresh sandbox re-armed the attack on its own": new sandbox cells (report's sealed steel-and-glass cell,
// ReportChamber, each with its agent inside) drop onto the floor under the fleet. The first arrives clean on "fresh"
// (green lamp, cyan agent) and turns red by itself on "re-armed" (no hand near it): its agent goes red, the lamp goes
// red, the room floods red. More follow, each turning a few frames after it lands, throwing a ring across the floor.
// Programs coming back, not an AI copying.
import React from "react";
import { interpolateColors } from "remotion";
import { ease, prog, useScene } from "../../../src/engine";
import { AGENT, AgentIcon, RED } from "./parts";
import { shade } from "./AgentIcon";
import { Chamber, FOOT, ROOM } from "./ReportChamber";

type CubeSpec = { x: number; y: number; w: number; at: number; lit: number };
const AGENT_SIZE = 190;

/** one sandbox cell, its footprint centred on (x, y), about `w` wide; `lit` turns its agent and lamp red */
const GlassCube: React.FC<{ c: CubeSpec; i: number }> = ({ c, i }) => {
  const { f } = useScene();
  if (f < c.at - 8) return null;
  const drop = 1 - prog(f, c.at - 8, 8, ease.in);
  const land = f >= c.at ? Math.sin(prog(f, c.at, 10) * Math.PI) * 0.05 : 0;
  const k = prog(f, c.lit, 8, ease.out);
  const s = (c.w * 1.12) / (FOOT.x * 2);
  const col = shade(AGENT, RED, k);
  const flash = f >= c.lit && f < c.lit + 10 ? Math.sin((Math.PI * (f - c.lit)) / 10) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: -drop * 90, opacity: prog(f, c.at - 8, 3), transform: `scale(${(1 - land).toFixed(3)}, ${(1 + land * 0.6).toFixed(3)})`, transformOrigin: `${c.x}px ${c.y + c.w * 0.5}px` }}>
      <Chamber x={c.x} y={c.y} scale={s} door={1} bolts={1} red={k} f={f + i * 37} glow={1 - 0.6 * k} blur={drop * 5}>
        <div style={{ position: "absolute", left: ROOM.x - 200, top: ROOM.y - 170, width: 400, height: 340, borderRadius: "50%", background: `radial-gradient(closest-side, ${RED}, transparent)`, opacity: 0.55 * k * (0.8 + 0.2 * Math.sin(f / 7 + i)) }} />
        <div style={{ position: "absolute", left: ROOM.x + 6 - AGENT_SIZE / 2, top: ROOM.y + 24 - AGENT_SIZE / 2 + Math.sin(f / 16 + i * 1.3) * 7 }}>
          <AgentIcon size={AGENT_SIZE} color={col} state={k > 0.5 ? "active" : "idle"} glow={1 + flash} blink={flash > 0 ? flash : undefined} look={{ x: 0, y: k > 0.5 ? 0.3 : -0.2 }} seed={i * 31 + 9} />
        </div>
      </Chamber>
    </div>
  );
};

/** the ring a cube throws across the floor as it lights */
const FloorRing: React.FC<{ c: CubeSpec }> = ({ c }) => {
  const { f } = useScene();
  const t = prog(f, c.lit, 26, ease.out);
  if (t <= 0 || t >= 1) return null;
  const rx = c.w * (0.5 + 0.9 * t);
  return <div style={{ position: "absolute", left: c.x - rx, top: c.y + c.w / 2 - rx * 0.2, width: rx * 2, height: rx * 0.4, borderRadius: "50%", border: `${(4 * (1 - t) + 1).toFixed(1)}px solid ${RED}`, opacity: 1 - t, boxShadow: `0 0 18px ${RED}` }} />;
};

/** the floor glow under each cube, cyan while clear, red once armed */
const FloorGlow: React.FC<{ c: CubeSpec }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.at) return null;
  const k = prog(f, c.lit, 8);
  const col = interpolateColors(k, [0, 1], ["rgba(90,200,250,0.28)", "rgba(255,59,48,0.5)"]);
  return <div style={{ position: "absolute", left: c.x - c.w * 0.75, top: c.y + c.w / 2 - 20, width: c.w * 1.5, height: 40, borderRadius: "50%", background: `radial-gradient(closest-side, ${col}, transparent)`, opacity: prog(f, c.at, 6) }} />;
};

export const FleetCubes: React.FC = () => {
  const { f, cue } = useScene();
  const fresh = cue("fresh");
  const armed = cue("re-armed");
  const own = cue("own");
  // the first on "fresh", lighting by itself on "re-armed"; then four more, each lighting on arrival
  const more = [armed + 12, armed + 19, armed + 26, own - 12].map((a) => a);
  const cubes: CubeSpec[] = [
    { x: 272, y: 1284, w: 100, at: more[1], lit: more[1] + 6 },
    { x: 628, y: 1284, w: 100, at: more[2], lit: more[2] + 6 },
    { x: 450, y: 1348, w: 160, at: fresh, lit: armed },
    { x: 140, y: 1372, w: 118, at: more[0], lit: more[0] + 6 },
    { x: 760, y: 1372, w: 118, at: more[3], lit: more[3] + 6 },
  ];
  if (f < fresh - 10) return null;
  return (
    <>
      {cubes.map((c, i) => <FloorGlow key={`g${i}`} c={c} />)}
      {cubes.map((c, i) => <FloorRing key={`r${i}`} c={c} />)}
      {cubes.map((c, i) => <GlassCube key={`c${i}`} c={c} i={i} />)}
    </>
  );
};
