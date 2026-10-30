// HookV4's 700 agents, drawn in one SVG: one glyph (the reel's agent bot: glass shell, visor, two eye slits, ears,
// antenna light) reused 700 times, tinted per agent through `color` (shell, eyes) and `fill` (status light), sorted
// far to near every frame so the army has depth. Ground shadows under the ranks, one blurred glow pass for the eyes,
// and while they fly: red trails and a spark where each one strikes the wall.
import React from "react";
import { interpolateColors } from "remotion";
import { prog } from "../../../src/engine/moves";
import { shade } from "./AgentIcon";
import { AGENT, RED } from "./parts";
import { botPos, FORT, proj, redAt, waveA, waveO, type Bot, type P, type T4 } from "./HookV4World";

const BOT_W = 46;

/** the glyph on a 100 box, feet at y 94. currentColor = the agent's colour, inherited fill = its status light */
export const BotDefs: React.FC = () => (
  <defs>
    <linearGradient id="v4shade" x1="0.15" y1="0" x2="0.75" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
      <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.55} />
    </linearGradient>
    <linearGradient id="v4visor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#16222E" />
      <stop offset="1" stopColor="#04080C" />
    </linearGradient>
    <filter id="v4glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="v4glow2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2" />
    </filter>
    <g id="v4bot">
      <rect x={48.3} y={9} width={3.4} height={17} rx={1.7} fill="#1B232C" />
      <circle cx={50} cy={8} r={6} stroke="#0A0F14" strokeWidth={1.2} />
      <rect x={3.5} y={47} width={9} height={22} rx={4.5} fill="currentColor" />
      <rect x={3.5} y={47} width={9} height={22} rx={4.5} fill="#000" opacity={0.5} />
      <rect x={87.5} y={47} width={9} height={22} rx={4.5} fill="currentColor" />
      <rect x={87.5} y={47} width={9} height={22} rx={4.5} fill="#000" opacity={0.5} />
      <rect x={9} y={24} width={82} height={68} rx={31} fill="currentColor" />
      <rect x={9} y={24} width={82} height={68} rx={31} fill="url(#v4shade)" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} />
      <ellipse cx={32} cy={35} rx={15} ry={5.5} transform="rotate(-18 32 35)" fill="#FFFFFF" opacity={0.55} />
      <rect x={18} y={43} width={64} height={35} rx={17.5} fill="url(#v4visor)" />
      <rect x={27} y={52} width={10} height={17} rx={5} />
      <rect x={63} y={52} width={10} height={17} rx={5} />
    </g>
  </defs>
);

type Drawn = { b: Bot; p: P; w: number; color: string; eye: string; lift: number };

/** colour, eye colour and size of one agent this frame */
function look(b: Bot, f: number, T: T4, pos: { h: number }, p: P): Drawn {
  const born = prog(f, b.spawn, 14);
  const grow = 0.55 + 0.45 * prog(f, b.spawn, 6) + 0.18 * Math.sin(Math.PI * prog(f, b.spawn, 14));
  const base = interpolateColors(redAt(b, f, T), [0, 1], [AGENT, RED]);
  const flare = Math.min(1, waveO(b, f, T) * 0.6 + waveA(b, f, T) * 0.8);
  const color = shade(base, "#FFFFFF", (1 - born) * 0.8);
  const eye = shade(base, "#FFFFFF", 0.55 + 0.4 * Math.max(flare, 1 - born));
  return { b, p, w: BOT_W * p.s * grow, color, eye, lift: pos.h };
}

const Glyph: React.FC<{ a: Drawn }> = ({ a }) => (
  <use
    href="#v4bot"
    transform={`translate(${(a.p.x - a.w / 2).toFixed(1)} ${(a.p.y - a.w * 0.94).toFixed(1)}) scale(${(a.w / 100).toFixed(4)})`}
    color={a.color}
    fill={a.eye}
  />
);

/** a trail behind a flying agent: where it was over the last 12 frames */
function trail(b: Bot, f: number, T: T4) {
  const pts: P[] = [];
  for (const k of [0, 2, 4, 6, 8, 10]) {
    const fr = Math.max(b.launch, f - k);
    const v = botPos(b, fr, T);
    pts.push(proj(v.X, v.d, v.h + 0.35));
  }
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export const Swarm: React.FC<{ bots: Bot[]; f: number; T: T4; layer: "back" | "front" }> = ({ bots, f, T, layer }) => {
  const list: Drawn[] = [];
  const trails: { d: string; w: number; o: number }[] = [];
  const sparks: { x: number; y: number; r: number; o: number }[] = [];
  for (const b of bots) {
    if (f < b.spawn) continue;
    const pos = botPos(b, f, T);
    const back = pos.d > FORT.d;
    if ((layer === "back") !== back) continue;
    const p = proj(pos.X, pos.d, pos.h);
    list.push(look(b, f, T, pos, p));
    const tail = prog(f, b.arrive, 10);
    if (f >= b.launch && tail < 1) trails.push({ d: trail(b, f, T), w: 3 + 7 * p.s, o: 1 - tail });
    if (f >= b.arrive && f < b.arrive + 12) {
      const q = prog(f, b.arrive, 12);
      sparks.push({ x: p.x, y: p.y - 20 * p.s, r: (4 + 34 * q) * p.s * 2, o: 1 - q });
    }
  }
  list.sort((a, b) => a.p.s - b.p.s);
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <BotDefs />
      <g opacity={0.55}>
        {list.map((a) => a.lift < 0.6 ? (
          <ellipse key={`s${a.b.i}`} cx={a.p.x} cy={a.p.y + a.lift * 100 * a.p.s} rx={a.w * 0.42} ry={a.w * 0.12} fill="#000" opacity={1 - a.lift / 0.6} />
        ) : null)}
      </g>
      <g filter="url(#v4glow)" opacity={0.85}>
        {trails.map((t, i) => <path key={i} d={t.d} fill="none" stroke={RED} strokeWidth={t.w * 1.2} strokeLinecap="round" opacity={t.o} />)}
      </g>
      <g>
        {trails.map((t, i) => <path key={i} d={t.d} fill="none" stroke="#FFB4A8" strokeWidth={t.w * 0.45} strokeLinecap="round" opacity={t.o} />)}
      </g>
      <g filter="url(#v4glow)" opacity={0.7}>
        {list.map((a) => <circle key={`g${a.b.i}`} cx={a.p.x} cy={a.p.y - a.w * 0.4} r={a.w * 0.42} fill={a.color} />)}
      </g>
      {list.map((a) => <Glyph key={a.b.i} a={a} />)}
      <g filter="url(#v4glow2)">
        {sparks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="none" stroke="#FFF1C9" strokeWidth={3} opacity={s.o} />)}
      </g>
      {sparks.map((s, i) => <circle key={`c${i}`} cx={s.x} cy={s.y} r={s.r * 0.35} fill="#FFFFFF" opacity={s.o * s.o} />)}
    </svg>
  );
};
