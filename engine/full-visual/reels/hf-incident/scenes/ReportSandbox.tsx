// The sandbox beat of `report`, on the containment cell (ReportChamber). each/agent: one open cell arrives, its agent
// floating inside, looking around. locked: the glass shutter drops out of the header and slams, the bolts shoot in,
// the padlock shuts, the lamp turns red; the agent flinches and blinks. sandbox: the label. no: a Wi-Fi hologram
// glows inside, the agent looks up at it. internet: its arcs die outer to inner, a red slash, the agent looks down.
// contact/others: the camera pulls back and the cell becomes one of a grid of identical sealed cells, each with its
// own agent looking for the others, frosted walls between them, each ping dying at its own glass.
import React from "react";
import { arrive, draw, ease, pop, prog, stagger, useScene } from "../../../src/engine";
import { AGENT, AgentIcon } from "./parts";
import { CELL, Chamber, OPEN, ROOM } from "./ReportChamber";

export type SandboxCues = { zoom: number; lid: number; locked: number; sandbox: number; no: number; internet: number; contact: number; others: number };

const HERO = { x: 450, y: 950, s: 1.3 };
const GRID = { y: 985, s: 0.42, px: 262, py: 250 };
const AGENT_SIZE = 186;
const AG = { x: ROOM.x + 6, y: ROOM.y + 24 };
const SIG = { x: OPEN.x + 92, y: OPEN.y + 78 };
/** the eight neighbours, nearest first: [col, row] offsets from the centre cell */
const NEAR = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

/** the Wi-Fi hologram inside the cell; its arcs die outer to inner on "internet", then a red slash */
const Signal: React.FC<{ c: SandboxCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.no - 4) return null;
  const s = 96;
  const arc = (r: number) => `M ${-r * 0.707} ${-r * 0.707 + s * 0.28} A ${r} ${r} 0 0 1 ${r * 0.707} ${-r * 0.707 + s * 0.28}`;
  const arcs = [0.62, 0.42, 0.22];
  return (
    <div style={{ position: "absolute", left: SIG.x, top: SIG.y + Math.sin(f / 13) * 3, ...pop(f, c.no - 4, { dur: 8 }) }}>
      <svg width={s * 1.6} height={s * 1.6} viewBox={`${-s * 0.8} ${-s * 0.8} ${s * 1.6} ${s * 1.6}`} style={{ position: "absolute", left: -s * 0.8, top: -s * 0.8, overflow: "visible" }}>
        {arcs.map((k, i) => {
          const die = c.internet + i * 3;
          const dead = f >= die + 6;
          const flick = f >= die && !dead ? (Math.floor((f - die) / 2) % 2 === 0 ? 0.25 : 1) : 1;
          const beat = 0.55 + 0.45 * Math.max(0, Math.sin(f / 6 - i * 0.9));
          return (
            <path key={k} d={arc(s * k)} fill="none" stroke={dead ? "#4B5864" : AGENT} strokeWidth={s * 0.09} strokeLinecap="round"
              opacity={dead ? 0.8 : flick * beat} style={{ filter: dead ? undefined : `drop-shadow(0 0 6px ${AGENT})` }} />
          );
        })}
        <circle cx={0} cy={s * 0.28} r={s * 0.07} fill={f >= c.internet + 12 ? "#4B5864" : AGENT} />
        <line x1={-s * 0.5} y1={-s * 0.42} x2={s * 0.5} y2={s * 0.48} stroke="#FF3B30" strokeWidth={s * 0.1} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px #FF3B30)" }} {...draw(f, c.internet + 4, 8)} />
      </svg>
    </div>
  );
};

/** a sonar ring from an agent that dies before it reaches the glass */
const Ping: React.FC<{ start: number; period: number; x: number; y: number }> = ({ start, period, x, y }) => {
  const { f } = useScene();
  if (f < start) return null;
  const t = ((f - start) % period) / period;
  const r = 60 + OPEN.w * 0.36 * t;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `4px solid ${AGENT}`, opacity: (1 - t) * 0.7 }} />;
};

/** the hero's agent: hovers, looks around, flinches on the slam, looks up at the signal, then down */
const HeroAgent: React.FC<{ c: SandboxCues }> = ({ c }) => {
  const { f } = useScene();
  const bob = Math.sin(f / 16) * 7;
  const slam = f >= c.locked && f < c.locked + 10;
  let look = { x: Math.sin((f - c.zoom) / 14) * 0.9, y: 0.25 * Math.sin(f / 23) };
  if (f >= c.locked) look = { x: 0, y: 0.35 };
  if (f >= c.no - 4) look = { x: -1, y: -0.9 };
  if (f >= c.internet + 10) look = { x: 0.2, y: 0.8 };
  if (f >= c.contact) look = { x: Math.sin((f - c.contact) / 9) * 1, y: 0 };
  const flinch = slam ? 1 - 0.07 * Math.sin((Math.PI * (f - c.locked)) / 10) : 1;
  const dim = f >= c.internet + 10 && f < c.contact ? 0.6 : 1;
  const shadowK = 1 - bob / 30;
  return (
    <>
      <div style={{ position: "absolute", left: AG.x - 60 * shadowK, top: OPEN.y + OPEN.h + CELL.dy * 0.45 - 12, width: 120 * shadowK, height: 24, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(90,200,250,0.45), transparent)" }} />
      <div style={{ position: "absolute", left: AG.x - AGENT_SIZE / 2, top: AG.y - AGENT_SIZE / 2 + bob, transform: `scale(${flinch.toFixed(4)})` }}>
        <AgentIcon size={AGENT_SIZE} color={AGENT} state="active" glow={dim} look={look} blink={slam ? Math.sin((Math.PI * (f - c.locked)) / 10) : undefined} seed={5} />
      </div>
      {f >= c.contact && <Ping start={c.contact + 2} period={40} x={AG.x} y={AG.y} />}
    </>
  );
};

/** one sealed neighbour: its own agent, looking toward the centre, pinging its own glass */
const Neighbour: React.FC<{ i: number; c: SandboxCues }> = ({ i, c }) => {
  const { f } = useScene();
  const [col, row] = NEAR[i];
  const at = stagger(c.others - 20, i, 2);
  if (f < at) return null;
  const k = arrive(f, at, 14);
  const x = 450 + col * GRID.px + col * 70 * (1 - k);
  const y = GRID.y + row * GRID.py + row * 70 * (1 - k);
  const look = { x: -col * 0.9 + Math.sin(f / 11 + i) * 0.2, y: -row * 0.6 };
  return (
    <Chamber x={x} y={y} scale={GRID.s * (0.85 + 0.15 * k)} door={1} bolts={1} red={1} f={f + i * 37} opacity={k} blur={(1 - k) * 6}>
      <div style={{ position: "absolute", left: AG.x - AGENT_SIZE / 2, top: AG.y - AGENT_SIZE / 2 + Math.sin(f / 16 + i * 1.3) * 7 }}>
        <AgentIcon size={AGENT_SIZE} color={AGENT} state="active" look={look} seed={i * 53 + 11} />
      </div>
      <Ping start={at + 6 + i * 4} period={34 + i * 3} x={AG.x} y={AG.y} />
    </Chamber>
  );
};

/** frosted walls between the cells: dividers only */
const Dividers: React.FC<{ c: SandboxCues }> = ({ c }) => {
  const { f } = useScene();
  const k = prog(f, c.others - 16, 14, ease.out);
  if (k <= 0) return null;
  const wall = { background: "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(220,236,245,0.85), rgba(255,255,255,0.55))", boxShadow: "0 0 0 1px rgba(150,170,185,0.35), 0 10px 30px rgba(20,40,60,0.12)", borderRadius: 6 };
  const top = GRID.y - 1.5 * GRID.py;
  const span = 3 * GRID.py * k;
  return (
    <>
      {[-0.5, 0.5].map((d) => <div key={`v${d}`} style={{ position: "absolute", left: 450 + d * GRID.px - 7, top: top + (3 * GRID.py - span) / 2, width: 14, height: span, ...wall }} />)}
      {[-0.5, 0.5].map((d) => <div key={`h${d}`} style={{ position: "absolute", top: GRID.y + d * GRID.py - 7, left: 450 - 1.5 * GRID.px + (3 * GRID.px - 3 * GRID.px * k) / 2, width: 3 * GRID.px * k, height: 14, ...wall, background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(220,236,245,0.85), rgba(255,255,255,0.55))" }} />)}
    </>
  );
};

export const Sandbox: React.FC<{ c: SandboxCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.zoom) return null;
  const z = arrive(f, c.zoom, 20);
  const back = arrive(f, c.others - 24, 22);
  const heroS = HERO.s * (0.35 + 0.65 * z);
  const s = heroS + (GRID.s - heroS) * back;
  const t = f - c.locked;
  const shake = t >= 0 && t < 18 ? Math.sin(t * 1.9) * 10 * (1 - t / 18) : 0;
  const y = HERO.y + (GRID.y - HERO.y) * back + (1 - z) * 120;
  const door = prog(f, c.lid, 8, ease.in);
  const bolts = prog(f, c.locked + 2, 7, ease.out);
  const red = prog(f, c.locked + 1, 4, ease.linear);
  return (
    <>
      <Dividers c={c} />
      {NEAR.map((_, i) => <Neighbour key={i} i={i} c={c} />)}
      <Chamber x={HERO.x + shake} y={y + Math.abs(shake) * 0.3} scale={s} door={door} bolts={bolts} red={red} f={f} blur={(1 - z) * 10} opacity={Math.min(1, z * 2)}>
        <HeroAgent c={c} />
        <Signal c={c} />
      </Chamber>
      <Label c={c} back={back} />
    </>
  );
};

const Label: React.FC<{ c: SandboxCues; back: number }> = ({ c, back }) => {
  const { f } = useScene();
  if (f < c.sandbox || back > 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 450, top: 1318, transform: "translateX(-50%)", opacity: 1 - back / 0.6 }}>
      <div style={{ ...pop(f, c.sandbox, { dur: 9 }), display: "flex", alignItems: "center", gap: 14, background: "#0B0B0B", color: "#FFF", borderRadius: 999, padding: "12px 30px", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 40 }}>
        <svg width={30} height={36} viewBox="0 0 30 36">
          <path d="M 7 16 V 11 a 8 8 0 0 1 16 0 V 16" fill="none" stroke="#FFF" strokeWidth={4} />
          <rect x={2} y={15} width={26} height={20} rx={4} fill="#FFF" />
        </svg>
        sandbox
      </div>
    </div>
  );
};
