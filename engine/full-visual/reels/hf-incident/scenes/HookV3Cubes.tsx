// Hook V3's floor of sandboxes: 700 glass cubes in true perspective, each with the real OpenAI mark stamped white on
// its roof and one agent inside. Painter's order, far to near; inside each cube the far glass, the agent's light and
// the agent, then the near glass on top, so the agent reads as sealed in. Cracks run on the roof and the front pane
// in the hook's one crack language (HookV3World.crackOf). Far cubes simplify, then fade into the fog.
import React from "react";
import { asset, AGENT, RED } from "./parts";
import { AgentChip, AgentGlyph } from "./HookV3Agent";
import { Cam, Cell, CELLS, CellState, cellAt, crackOf, CPt, fogOf, FL, grown, H, inSquare, P2, pathOf, project, Times, W } from "./HookV3World";

const STAMP = asset("hook-v3/openai-white.png");
const pts = (ps: P2[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
// corner index = xi + 2*yi + 4*zi
const FACE = { back: [0, 1, 3, 2], front: [4, 5, 7, 6], top: [2, 3, 7, 6], left: [0, 4, 6, 2], right: [1, 5, 7, 3] };

type Pane = (u: number, v: number) => P2;

/** a pane's cracks, grown to radius R from its impact point, cut at the pane's edge, in px */
function crackPath(c: Cell, pane: Pane, seed: number, cu: number, cv: number, R: number) {
  const cr = crackOf(seed + c.i * 0.37, cu, cv, 0.62, 8);
  const lines: { x: number; y: number }[][] = cr.rays.map((ray) => inSquare(grown(ray, R)).map((p: CPt) => pane(p.u, p.v)));
  for (const [a, b] of cr.rings) {
    if (a.r > R || b.r > R) continue;
    const seg = inSquare([a, b]);
    if (seg.length === 2) lines.push(seg.map((p) => pane(p.u, p.v)));
  }
  return pathOf(lines);
}

const Cracks: React.FC<{ d: string; w: number; o: number; color: string }> = ({ d, w, o, color }) =>
  d ? (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={w * 3.2} strokeOpacity={0.22 * o} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={w} strokeOpacity={0.95 * o} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ) : null;

/** the stamp: the white OpenAI mark mapped onto the roof by the roof's own projected axes */
function stampMatrix(roof: Pane) {
  const a = roof(0.2, 0.2);
  const b = roof(0.8, 0.2);
  const d = roof(0.2, 0.8);
  const k = 1 / 256;
  return `matrix(${((b.x - a.x) * k).toFixed(4)} ${((b.y - a.y) * k).toFixed(4)} ${((d.x - a.x) * k).toFixed(4)} ${((d.y - a.y) * k).toFixed(4)} ${a.x.toFixed(1)} ${a.y.toFixed(1)})`;
}

const Cube: React.FC<{ c: Cell; s: CellState; cam: Cam; f: number; d: number }> = ({ c, s, cam, f, d }) => {
  const P: P2[] = [];
  for (let k = 0; k < 8; k++) P.push(project(cam, c.x - 0.5 + (k & 1), (k >> 1) & 1, c.z - 0.5 + ((k >> 2) & 1)));
  const fog = fogOf(d);
  const w = Math.max(0.5, Math.min(3, (FL * 0.013) / d));
  const broken = f >= s.hackAt;
  const out = f >= s.leave;
  const hot = broken ? RED : AGENT;
  const roof: Pane = (u, v) => project(cam, c.x - 0.5 + u, 1, c.z - 0.5 + v);
  const front: Pane = (u, v) => project(cam, c.x - 0.5 + u, 1 - v, c.z + 0.5);
  const face = (k: keyof typeof FACE) => pts(FACE[k].map((i) => P[i]));
  const edge = `rgba(190,228,255,${(fog * (0.5 + 0.35 * s.lit + 0.5 * s.knock)).toFixed(3)})`;
  const side = cam.x < c.x - 0.5 ? "left" : cam.x > c.x + 0.5 ? "right" : null;
  const hidden = side === "left" ? "right" : "left";
  const zA = c.z + 0.36 * s.press + 0.06 * s.knock;
  const glowP = project(cam, c.x, 0.42, zA);
  const dying = out ? Math.max(0, 1 - (f - s.leave) / 30) : 1;
  const glowO = fog * s.lit * dying * (broken ? 0.95 : 0.55 + 0.35 * s.knock + 0.25 * s.stamp);
  const base = project(cam, c.x, 0.02, zA);
  const k = (FL * 0.6) / d;
  const floorC = project(cam, c.x, 0, c.z);
  const rr = (FL * 1.05) / d;
  const crackO = Math.min(1, s.R * 6) * fog * (out ? 0.75 : 1);
  return (
    <g>
      <ellipse cx={floorC.x} cy={floorC.y} rx={rr} ry={rr * Math.sin(cam.pitch) * 0.9} fill={broken ? "url(#v3poolR)" : "url(#v3pool)"} opacity={glowO * 0.8} />
      <polygon points={face("back")} fill="rgba(120,180,230,0.04)" stroke={edge} strokeWidth={w * 0.6} strokeOpacity={0.5} />
      <polygon points={face(hidden)} fill="rgba(120,180,230,0.03)" stroke={edge} strokeWidth={w * 0.6} strokeOpacity={0.5} />
      {glowO > 0.01 && <circle cx={glowP.x} cy={glowP.y} r={(FL * 0.7) / d} fill={broken ? "url(#v3glowR)" : "url(#v3glow)"} opacity={glowO} />}
      {!out && d < 34 && (
        <g transform={`translate(${base.x.toFixed(1)} ${base.y.toFixed(1)}) scale(${k.toFixed(2)})`} opacity={Math.min(1, fog * 1.3) * (0.35 + 0.65 * s.lit)}>
          {d < 12 ? <AgentGlyph color={hot} press={s.press} lit={s.lit} id={c.i} /> : <AgentChip color={hot} lit={s.lit} />}
        </g>
      )}
      {side && <polygon points={face(side)} fill={`rgba(140,200,255,${(0.06 * fog).toFixed(3)})`} stroke={edge} strokeWidth={w} />}
      <polygon points={face("front")} fill={`rgba(150,210,255,${((0.07 + 0.12 * s.knock + (broken ? 0.1 : 0)) * fog).toFixed(3)})`} stroke={edge} strokeWidth={w} />
      <polygon points={face("top")} fill={`rgba(170,215,255,${((0.1 + 0.05 * s.lit) * fog).toFixed(3)})`} stroke={edge} strokeWidth={w} />
      <line x1={P[6].x} y1={P[6].y} x2={P[7].x} y2={P[7].y} stroke="#fff" strokeWidth={w * 1.3} strokeOpacity={fog * 0.7} />
      {d < 26 && <image href={STAMP} width={256} height={256} transform={stampMatrix(roof)} opacity={fog * (0.5 + 0.2 * s.lit + 0.3 * s.stamp)} />}
      {s.press > 0.2 && !broken && d < 20 && [0.3, 0.7].map((u) => {
        const h = front(u, 0.38);
        return <circle key={u} cx={h.x} cy={h.y} r={(FL * (0.13 + 0.05 * s.knock)) / d} fill="url(#v3glow)" opacity={fog * Math.min(1, s.press) * (0.7 + 0.3 * s.knock)} />;
      })}
      {s.R > 0 && d < 40 && <Cracks d={crackPath(c, front, 1.3, 0.5, 0.45, s.R)} w={w * 0.8} o={crackO} color={hot} />}
      {s.R > 0.3 && d < 40 && <Cracks d={crackPath(c, roof, 2.1, 0.5, 0.55, s.R)} w={w * 0.8} o={crackO} color={hot} />}
    </g>
  );
};

/** the whole floor, far to near, culled to what the lens sees */
export const Cubes: React.FC<{ t: Times; cam: Cam; f: number }> = ({ t, cam, f }) => {
  const vis: { c: Cell; d: number }[] = [];
  for (const c of CELLS) {
    const p = project(cam, c.x, 0.5, c.z);
    if (p.d < 0.9 || p.x < -260 || p.x > W + 260 || p.y > H + 320 || p.d > 70) continue;
    vis.push({ c, d: p.d });
  }
  vis.sort((a, b) => b.d - a.d);
  return (
    <>
      {vis.map(({ c, d }) => (
        <Cube key={c.i} c={c} s={cellAt(t, c, f)} cam={cam} f={f} d={d} />
      ))}
    </>
  );
};

/** gradients for the cubes' light: the agent's cyan, the swarm's red, and their pools on the floor */
export const CubeDefs: React.FC = () => (
  <>
    {[
      ["v3glow", AGENT, 0.9],
      ["v3glowR", RED, 1],
      ["v3pool", AGENT, 0.5],
      ["v3poolR", RED, 0.6],
    ].map(([id, col, a]) => (
      <radialGradient key={id as string} id={id as string}>
        <stop offset="0" stopColor={col as string} stopOpacity={a as number} />
        <stop offset="0.45" stopColor={col as string} stopOpacity={(a as number) * 0.35} />
        <stop offset="1" stopColor={col as string} stopOpacity={0} />
      </radialGradient>
    ))}
  </>
);
