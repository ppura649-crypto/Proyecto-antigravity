import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT } from "./theme";

// TEACHING card (formats/creator-format-1-visuals.md job 3): one Claude on top, the agents
// it spawns underneath, ALL AT THE SAME SIZE (the creator 2026-09-04: "have one big.
// then like 3 big as well. Same size. And very slightly nice animation line.
// That's it. Big"). Two rows, nothing else: no third level, no side labels, no
// plate. It is a standalone graphic, so the marks and the names sit straight on
// the footage with the caption shadow, the way a `float` does.
//
// `merge: true` runs it backwards for the callback at the end of the video: the
// children are already there, the packets travel UP, and the one in charge
// lands last as the answers come home.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const GLOW = "drop-shadow(0px 3px 12px rgba(0,0,0,0.75))";

const Mascot: React.FC<{ size: number }> = ({ size }) => (
  <svg height={size * (20 / 24)} viewBox="0 0 24 24" style={{ display: "block", filter: GLOW }}>
    <title>Claude</title>
    <path
      clipRule="evenodd"
      d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
      fill={ACCENT}
      fillRule="evenodd"
    />
  </svg>
);

export type FanAgent = { name: string };

export const Fanout: React.FC<{
  tMs: number;
  w: number;
  h: number;
  fps: number;
  fromMs: number;
  parent?: string;
  agents: FanAgent[];
  startMs?: number;
  perMs?: number;
  merge?: boolean;
}> = ({ tMs, w, h, fps, fromMs, parent = "claude", agents, startMs, perMs = 110, merge = false }) => {
  const n = Math.max(1, agents.length);
  const icon = 0.21 * w;
  const fs = 0.036 * w;

  // the branch length is set by the marks, not by the card: a gap stretched to
  // fill the height made the connectors tall and thin and the agents small
  // (the creator 2026-09-05: "the branches of the tree are too tall, make them
  // closer, and bigger"). Big marks, short branches, block centred.
  const rowH = icon * (20 / 24) + 0.24 * fs + fs * 1.3;
  const gap = 0.40 * icon;
  const y0 = Math.max(0, (h - (2 * rowH + gap)) / 2);
  const rowTop = [y0, y0 + rowH + gap];

  const cx = (i: number) => (w * (i + 0.5)) / n;
  const px = w / 2;

  // forwards: the one in charge, then the branches. merge: the branches, then the one in charge.
  const tFirst = startMs ?? fromMs + 120;
  const tKid = (i: number) => (merge ? fromMs + 100 + i * perMs : tFirst + 180 + i * perMs);
  const tParent = merge ? tFirst + 180 + n * perMs : fromMs + 100;

  const springAt = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 12, stiffness: 320, mass: 0.65 } });
  const draw = (i: number) =>
    interpolate(tMs, [tKid(i) - 170, tKid(i) + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const node = (key: string, x: number, top: number, name: string, s: number, i: number) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x - w / 2,
        top,
        width: w,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${0.78 + 0.22 * s})`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <Mascot size={icon} />
      <div
        style={{
          marginTop: 0.24 * fs,
          fontFamily: MONO_FONT,
          fontSize: fs,
          fontWeight: 500,
          color: INK,
          textShadow: SHADOW,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    </div>
  );

  const y1 = rowTop[0] + rowH;
  const y2 = rowTop[1];
  const k = 0.45 * (y2 - y1);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>{merge ? "the answers coming back to the one in charge" : "one claude spawning its agents"}</title>
        {agents.map((_, i) => {
          const g = draw(i);
          if (g <= 0) return null;
          const x2 = cx(i);
          return (
            <g key={i}>
              <path
                d={`M ${px} ${y1} C ${px} ${y1 + k}, ${x2} ${y2 - k}, ${x2} ${y2}`}
                fill="none" stroke={ACCENT} strokeWidth={2.2} strokeOpacity={0.9}
                pathLength={1} strokeDasharray={1}
                strokeDashoffset={merge ? g - 1 : 1 - g}
                style={{ filter: "drop-shadow(0px 1px 4px rgba(0,0,0,0.75))" }}
              />
            </g>
          );
        })}
      </svg>

      {(() => { const s = springAt(tParent); return s <= 0 ? null : node("p", px, rowTop[0], parent, s, 0); })()}
      {agents.map((a, i) => {
        const s = springAt(tKid(i));
        return s <= 0 ? null : node(`a${i}`, cx(i), rowTop[1], a.name, s, i + 1);
      })}
    </div>
  );
};
