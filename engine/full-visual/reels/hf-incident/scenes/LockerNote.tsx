// The wall's head strip (the server's own plate, the "message board" sign that lights on "secret", the two counters
// from METR: about 1,200 agents, over 70,000 messages) and the one note that comes out of a locker and unfolds on
// "other": "We've found other agents!" (METR, verbatim).
import React from "react";
import { blurIn, countTo, ease, jitter, prog, useScene } from "../../../src/engine";
import { AGENT, AgentIcon } from "./parts";
import { DOOR, HAND, WALL, doorPos } from "./LockerWall";

const MONO = "'JetBrains Mono', monospace";
const SANS = "Inter, sans-serif";

export type HeadCues = { secret: number; agents: number; msgs: number };

const Counter: React.FC<{ at: number; to: number; plus?: boolean; label: string; land: number }> = ({ at, to, plus, label, land }) => {
  const { f } = useScene();
  if (f < at) return null;
  const n = countTo(f, at, land - at, 0, to) + (f >= land ? jitter(f, land + 40, 0) : 0);
  return (
    <div style={{ ...blurIn(f, at, { dur: 7 }), display: "flex", alignItems: "baseline", gap: 12, height: 62 }}>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, letterSpacing: -1.5, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", textShadow: `0 0 18px ${AGENT}66` }}>
        {Math.round(n).toLocaleString("en-US")}
        {plus && f >= land ? "+" : ""}
      </span>
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: "#9FB3C4" }}>{label}</span>
    </div>
  );
};

/** the head strip: plate stays, the sign lights, the counters roll onto their words */
export const Head: React.FC<{ c: HeadCues }> = ({ c }) => {
  const { f } = useScene();
  const sign = prog(f, c.secret - 2, 8, ease.out);
  const buzz = sign * (0.85 + 0.15 * Math.sin(f * 0.9) * Math.sin(f * 0.37));
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: 16, height: WALL.head - 34, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 370 }}>
        <div style={{ alignSelf: "flex-start", height: 48, borderRadius: 8, padding: "0 16px", display: "flex", alignItems: "center", background: "linear-gradient(180deg, #E9EDF1, #AEB6BF)", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#15191E" }}>package server</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 1, opacity: Math.min(1, sign * 3), color: "#E8FAFF", textShadow: sign > 0.05 ? `0 0 ${10 * buzz}px ${AGENT}, 0 0 ${28 * buzz}px ${AGENT}` : "none" }}>message board</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Counter at={c.agents - 34} land={c.agents} to={1200} label="agents" />
        <Counter at={c.msgs - 34} land={c.msgs} to={70000} plus label="messages" />
      </div>
    </div>
  );
};

/** the note: out of the chosen locker's vent on "One wrote", flies to the centre folded, unfolds so it reads on "other" */
export const BigNote: React.FC<{ door: number; out: number; open: number }> = ({ door, out, open }) => {
  const { f } = useScene();
  if (f < out) return null;
  const d = doorPos(door);
  const sx = WALL.left + d.x + DOOR.w * 0.35;
  const sy = WALL.top + d.y + 30;
  const k = prog(f, out, 22, ease.out);
  const W = 760;
  const H = 420;
  const cx = sx + (450 - sx) * k;
  const cy = sy + (1000 - sy) * k;
  const u = prog(f, open, 12, ease.inOut); // 0 folded (top half only) .. 1 open
  const scale = 0.1 + 0.42 * k + 0.48 * u; // small while folded, full size as it opens
  const breathe = 1 + 0.006 * Math.sin(f * 0.1);
  const paper = "linear-gradient(180deg, #FFFEF8, #F1EEE4)";
  const text = (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontWeight: 700, fontSize: 80, lineHeight: "92px", color: "#1A1E24", textAlign: "center" }}>
      <div>{"We’ve found"}</div>
      <div>
        <span style={{ color: "#0A84C6" }}>other</span> agents!
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: cx - W / 2, top: cy - H / 2, width: W, height: H, transform: `scale(${(scale * breathe).toFixed(4)})`, perspective: 1400 }}>
      {/* bottom half: fixed; top half: hinged on the fold, swings from folded-down to open */}
      <div style={{ position: "absolute", left: 0, top: H / 2, width: W, height: H / 2, overflow: "hidden", background: paper, borderRadius: "0 0 10px 10px", boxShadow: "0 40px 90px rgba(0,0,0,0.7)" }}>
        <div style={{ position: "absolute", left: 0, top: -H / 2 }}>{text}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H / 2, transformOrigin: "50% 100%", transform: `rotateX(${(-180 * (1 - u)).toFixed(2)}deg)`, backfaceVisibility: "hidden", overflow: "hidden", background: paper, borderRadius: "10px 10px 0 0" }}>
        {text}
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(0.25 * (1 - u)).toFixed(3)})` }} />
      </div>
      {/* the back of the folded flap while it is still turning */}
      {u < 0.5 && (
        <div style={{ position: "absolute", left: 0, top: H / 2, width: W, height: H / 2, transformOrigin: "50% 0%", transform: `rotateX(${(180 * u).toFixed(2)}deg)`, background: "linear-gradient(180deg, #F4F1E6 0%, #DDD8C9 100%)", borderRadius: "0 0 10px 10px", boxShadow: "inset 0 8px 14px rgba(0,0,0,0.12)" }}>
          {/* the back of the fold, sealed by the agent that wrote it */}
          <div style={{ position: "absolute", left: W / 2 - 40, top: 52 }}>
            <AgentIcon size={80} color={AGENT} state="active" glow={1.6} seed={17} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, background: "linear-gradient(180deg, rgba(0,0,0,0.18), transparent)" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 30, right: 30, top: H / 2 - 1, height: 2, background: "rgba(0,0,0,0.12)", opacity: u }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: H + 18, textAlign: "center", fontFamily: SANS, fontSize: 32, color: "#9FB3C4", opacity: prog(f, open + 6, 8, ease.linear) }}>one agent, on the board (METR)</div>
    </div>
  );
};
