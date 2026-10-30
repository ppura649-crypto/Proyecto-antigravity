// `go` (light): "One agent hesitated. Another posted "GO", with a six-minute deadline. It kept going."
// A cork message board in close-up (GoBoard). First frames: the agent's dot glides up the board to its note and writes
// its doubt on it (the real line, facts.md). "hesitated": it stops dead, turns amber, a pause sign over it, the note
// turns amber. "Another": a red dot runs in from the right; "GO": a big red GO note slams onto the board from it and
// the whole board shudders. "six-minute": a kitchen timer is pinned beside it reading 6:00 and starts ticking down.
// "going": the amber dot turns red and moves on across the board, leaving a trail.
import React from "react";
import { Column, blurIn, ease, pop, prog, useScene } from "../../../src/engine";
import { AGENT, AMBER, Agent, RED } from "./parts";
import { GoBoard, Pin, QNOTE } from "./GoBoard";

const GO_NOTE = { left: 384, top: 872, width: 448, height: 330, rot: 4 };
const HOLD = { x: QNOTE.left + QNOTE.width + 40, y: 752 };

const useGoCues = () => {
  const { cue, scene } = useScene();
  return { start: scene.from - 6, agent: cue("agent"), hesitated: cue("hesitated"), another: cue("another"), go: cue("go"), six: cue("sixminute"), kept: cue("kept"), going: cue("going") };
};
type GoCues = ReturnType<typeof useGoCues>;

/** the big red GO note: falls out of the air and slams flat on its word */
const GoNote: React.FC<{ c: GoCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const at = c.go - 9;
  if (f < at) return null;
  const k = prog(f, at, 9, ease.in);
  const s = 1.9 - 0.9 * k;
  const glow = 0.6 + 0.4 * Math.sin(f / 7);
  return (
    <div style={{ position: "absolute", ...GO_NOTE, transform: `rotate(${(GO_NOTE.rot + (1 - k) * -14).toFixed(2)}deg) scale(${s.toFixed(3)})`, opacity: prog(f, at, 3), zIndex: 4 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: "linear-gradient(160deg, #FF5A4F 0%, #E8261B 70%, #C91B12 100%)", boxShadow: `${(6 + 40 * (1 - k)).toFixed(0)}px ${(12 + 60 * (1 - k)).toFixed(0)}px ${(18 + 50 * (1 - k)).toFixed(0)}px rgba(60,10,5,${(0.45 - 0.15 * (1 - k)).toFixed(2)}), 0 0 ${(40 * glow).toFixed(0)}px rgba(255,59,48,${(0.35 * glow).toFixed(2)}), inset 0 -24px 30px -20px rgba(0,0,0,0.25)` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 230, fontWeight: 900, letterSpacing: -6, color: "#FFFFFF", textShadow: "0 6px 0 rgba(120,10,5,0.35)" }}>GO</div>
      {f >= c.go + 3 && <div style={pop(f, c.go + 3, { from: 0.2 })}><Pin x={GO_NOTE.width / 2} y={22} color="#F5F5F5" s={1.3} /></div>}
    </div>
  );
};

/** the dust puff and ring where the GO note hits */
const GoImpact: React.FC<{ c: GoCues }> = ({ c }) => {
  const { f } = useScene();
  const t = prog(f, c.go, 20, ease.out);
  if (t <= 0 || t >= 1) return null;
  const cx = GO_NOTE.left + GO_NOTE.width / 2;
  const cy = GO_NOTE.top + GO_NOTE.height / 2;
  const rx = 260 + 180 * t;
  return <div style={{ position: "absolute", left: cx - rx, top: cy - rx * 0.8, width: rx * 2, height: rx * 1.6, borderRadius: "50%", border: `${(10 * (1 - t)).toFixed(1)}px solid rgba(255,255,255,0.7)`, opacity: 1 - t, zIndex: 5 }} />;
};

/** a kitchen timer pinned next to GO: a 6-minute red wedge, a ticking hand, and a readout counting down from 6:00 */
const GoTimer: React.FC<{ c: GoCues }> = ({ c }) => {
  const { f, fps, theme } = useScene();
  if (f < c.six - 4) return null;
  const el = Math.max(0, Math.floor((f - c.six) / fps));
  const left = 360 - el;
  const txt = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const tickAt = c.six + el * fps;
  const snap = el > 0 ? 1 - prog(f, tickAt, 8) : 0;
  const hand = el * 6 - snap * 1.5;
  const wedge = 36; // 6 of 60 minutes
  const R = 96;
  const a = (d: number) => [Math.sin((d * Math.PI) / 180) * R, -Math.cos((d * Math.PI) / 180) * R];
  const [wx, wy] = a(wedge);
  const blink = Math.floor((f - c.six) / 30) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 80, top: 930, width: 270, height: 336, transform: `rotate(-3deg) translateY(${(snap * 2).toFixed(1)}px)`, zIndex: 4, ...pop(f, c.six - 4, { from: 0.5, dur: 9 }) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(180deg, #FFFFFF, #EFEDE8)", boxShadow: "6px 14px 22px rgba(60,30,5,0.4), inset 0 2px 0 #FFFFFF" }} />
      <svg width={230} height={230} viewBox="-115 -115 230 230" style={{ position: "absolute", left: 20, top: 26 }}>
        <circle r={108} fill="#1D1F24" />
        <circle r={100} fill="#FAFAFA" />
        <path d={`M 0 0 L 0 ${-R} A ${R} ${R} 0 0 1 ${wx.toFixed(2)} ${wy.toFixed(2)} Z`} fill={RED} opacity={0.9} />
        {Array.from({ length: 60 }, (_, i) => {
          const d = i * 6;
          const [x1, y1] = a(d).map((v) => v * (i % 5 === 0 ? 0.8 : 0.88));
          const [x2, y2] = a(d).map((v) => v * 0.97);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1D1F24" strokeWidth={i % 5 === 0 ? 3.5 : 1.5} />;
        })}
        <g transform={`rotate(${hand.toFixed(2)})`}>
          <line x1={0} y1={14} x2={0} y2={-84} stroke={RED} strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle r={9} fill="#1D1F24" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center", fontFamily: theme.font.ui, fontSize: 60, fontWeight: 800, color: "#15171A", fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
        {txt.split(":")[0]}<span style={{ opacity: blink ? 1 : 0.25 }}>:</span>{txt.split(":")[1]}
      </div>
      <Pin x={135} y={14} color="#1E88E5" />
    </div>
  );
};

/** the hesitant agent: glides to its note, stops amber with a pause sign on "hesitated", turns red and leaves on "going" */
const GoAgent: React.FC<{ c: GoCues }> = ({ c }) => {
  const { f } = useScene();
  const inT = prog(f, c.start, c.hesitated - c.start, ease.out);
  const outT = prog(f, c.going, 34, ease.in);
  const pos = (ti: number, to: number) => {
    const x0 = 840, y0 = 1180;
    const x = x0 + (HOLD.x - x0) * ti + (870 - HOLD.x) * to;
    const y = y0 + (HOLD.y - y0) * ti + (1420 - HOLD.y) * to - Math.sin(ti * Math.PI) * 120 + Math.sin(to * Math.PI) * 40;
    return [x, y];
  };
  const amber = prog(f, c.hesitated, 6, ease.linear);
  const red = prog(f, c.going - 3, 6, ease.linear);
  const color = red > 0 ? (red >= 1 ? RED : red > 0.5 ? RED : AMBER) : amber > 0.5 ? AMBER : AGENT;
  const [x, y] = pos(inT, outT);
  const paused = f >= c.hesitated && f < c.going;
  const breath = paused ? 1 + 0.25 * Math.sin((f - c.hesitated) / 8) : 1;
  const pauseO = prog(f, c.hesitated + 2, 6) * (1 - prog(f, c.going - 4, 6));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, zIndex: 6 }}>
      {outT > 0 && Array.from({ length: 7 }, (_, i) => {
        const [tx, ty] = pos(1, Math.max(0, prog(f - (i + 1) * 2, c.going, 34, ease.in)));
        return <Agent key={i} x={tx} y={ty} r={14 - i * 1.5} color={RED} glow={0.6} opacity={0.5 - i * 0.06} />;
      })}
      {paused && <div style={{ position: "absolute", left: x - 34 * breath, top: y - 34 * breath, width: 68 * breath, height: 68 * breath, borderRadius: "50%", border: `3px solid ${AMBER}`, opacity: 0.7 }} />}
      <Agent x={x} y={y} r={18} color={color} glow={1.4} />
      <div style={{ position: "absolute", left: x - 20, top: y - 76, display: "flex", gap: 8, opacity: pauseO }}>
        <div style={{ width: 12, height: 36, borderRadius: 3, background: AMBER }} />
        <div style={{ width: 12, height: 36, borderRadius: 3, background: AMBER }} />
      </div>
    </div>
  );
};

/** "Another": the red agent that posts GO runs in from the right and parks on the note's corner */
const GoPoster: React.FC<{ c: GoCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.another - 6) return null;
  const t = prog(f, c.another - 6, c.go - 9 - (c.another - 6), ease.inOut);
  const x = 900 + (GO_NOTE.left + 30 - 900) * t;
  const y = 1150 + (GO_NOTE.top + 10 - 1150) * t - Math.sin(t * Math.PI) * 90;
  return <div style={{ position: "absolute", left: 0, top: 0, zIndex: 6 }}><Agent x={x} y={y} r={14} color={RED} glow={1.2} opacity={prog(f, c.another - 6, 4)} /></div>;
};

export const Go: React.FC = () => {
  const { f } = useScene();
  const c = useGoCues();
  const s = f >= c.go ? (1 - prog(f, c.go, 16)) : 0;
  const shake = s * Math.sin((f - c.go) * 2.1);
  return (
    <Column>
      <div style={{ position: "absolute", inset: 0, ...blurIn(f, c.start, { dur: 10, rise: 60 }) }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(shake * 7).toFixed(2)}px, ${(s * Math.cos((f - c.go) * 2.6) * 5).toFixed(2)}px)` }}>
        <GoBoard shake={s} />
        <GoTimer c={c} />
        <GoNote c={c} />
        <GoImpact c={c} />
        <GoPoster c={c} />
        <GoAgent c={c} />
      </div>
      </div>
    </Column>
  );
};
