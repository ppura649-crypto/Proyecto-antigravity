import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, CARD_BG, INK, MUTED, label } from "./theme";
import { GLOW, SHADOW } from "./Mascot";

// "it's a TRAP that I still fall into FROM TIME TO TIME."
// A closed square circuit of four steps filling the top 62% of the box. The
// connectors draw themselves round the loop, then a terracotta packet starts
// running laps and later speeds up, filling every node it enters. One dashed
// branch drops out of the last node into the bottom 38% and lands on the way
// out, drawn dead. The packet never takes it: that is the trap.

// The creator films against a bright cream wall, so nothing here is a stroke plus a drop
// shadow: every node is an opaque near black plate you could cut out with
// scissors, the connectors are heavy and carry a zero offset halo as well as an
// offset shadow, and the accent is a solid fill of the node, never an outline
// around it. The way out stays dimmer than the live ring, but by muting its
// plate and its ink one step, not by fading the whole element: the viewer has to
// be able to READ the branch to see that it is never taken.
const PLATE_A = 0.42;
const DEAD_PLATE_A = 0.38;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const circDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
};

export const Loop: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  nodes: string[];   // exactly 4
  exit: string;      // the branch that is never taken
  beats: { draw?: number; run?: number; fast?: number };
}> = ({ tMs, w, h, fps, fromMs, nodes, exit, beats }) => {
  const labelFs = 0.046 * w;
  const nodeSw = 0.008 * w;
  const connSw = 0.008 * w;
  const exitSw = 0.007 * w;
  const packet = 0.030 * w;
  const ah = 0.024 * w;

  // every stroke and every glyph carries a halo at zero offset: an offset only
  // shadow leaves the top edge of each one unbacked against the wall
  const halo = `drop-shadow(0px 0px ${0.010 * w}px rgba(0,0,0,0.92)) ${GLOW}`;
  const textHalo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), ${SHADOW}`;
  const plateShadow = `0px 0px ${0.010 * w}px rgba(0,0,0,0.92), 0px 12px 34px rgba(0,0,0,0.55)`;

  // the ring owns the top 62% of the box, the way out owns the bottom 38%
  const mx = 0.030 * w;
  const nodeW = 0.420 * w;
  const nodeH = Math.min(0.220 * h, 0.190 * w);
  const ringBot = 0.620 * h;
  const cxL = mx + nodeW / 2;
  const cxR = w - mx - nodeW / 2;
  const cyT = 0.012 * h + nodeH / 2;
  const cyB = ringBot - nodeH / 2;

  const exitW = 0.460 * w;
  const exitH = Math.min(0.200 * h, 0.150 * w);
  const exTop = 0.970 * h - exitH;
  const exCx = w / 2;
  const branchY = ringBot;
  const midY = branchY + (exTop - branchY) * 0.45;

  const NC = [
    { x: cxL, y: cyT }, { x: cxR, y: cyT }, { x: cxR, y: cyB }, { x: cxL, y: cyB },
  ];
  // segment i runs from node i to node i+1, edge midpoint to edge midpoint
  const SEG = [
    { x1: cxL + nodeW / 2, y1: cyT, x2: cxR - nodeW / 2, y2: cyT },
    { x1: cxR, y1: cyT + nodeH / 2, x2: cxR, y2: cyB - nodeH / 2 },
    { x1: cxR - nodeW / 2, y1: cyB, x2: cxL + nodeW / 2, y2: cyB },
    { x1: cxL, y1: cyB - nodeH / 2, x2: cxL, y2: cyT + nodeH / 2 },
  ];

  const drawAt = beats.draw ?? fromMs + 260;
  const runAt = beats.run ?? drawAt + 1100;
  const fastAt = beats.fast ?? runAt + 2600;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const drawn = (i: number) =>
    interpolate(tMs, [drawAt + i * 200, drawAt + i * 200 + 280], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // laps are integrated, not modulo'd, so the speed up never jumps the packet
  const running = tMs >= runAt;
  const slowMs = Math.max(0, Math.min(tMs, fastAt) - runAt);
  const fastMs = Math.max(0, tMs - Math.max(fastAt, runAt));
  const laps = slowMs / 900 + fastMs / 450;
  const u = laps - Math.floor(laps);

  // each quarter is 80% travel then a short dwell inside the node it entered
  const q = Math.min(3, Math.max(0, Math.floor(u * 4)));
  const t = easeOut(clamp01((u * 4 - q) / 0.80));
  const seg = SEG[q];
  const pxp = seg.x1 + (seg.x2 - seg.x1) * t;
  const pyp = seg.y1 + (seg.y2 - seg.y1) * t;
  // the flash sits at FULL accent for most of its window and only its edges ramp:
  // a half opacity terracotta over the black plate would read as brown, not as a fill
  const flash = (i: number) => (running ? clamp01((1 - circDist(u, (i % 4) * 0.25) / 0.085) * 2.4) : 0);

  const branchO = interpolate(tMs, [drawAt + 900, drawAt + 1300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {nodes.slice(0, 4).map((n, i) => {
        const s = sp(fromMs + i * 70);
        if (s <= 0) return null;
        const f = flash(i);
        return (
          <div key={i} style={{
            position: "absolute", left: NC[i].x - nodeW / 2, top: NC[i].y - nodeH / 2,
            width: nodeW, height: nodeH, boxSizing: "border-box", borderRadius: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: Math.min(1, s * 2), transform: `scale(${0.90 + 0.10 * s})`,
          }}>
            {/* the packet arriving fills the node solid, it never outlines it */}
            {f > 0 && <div style={{ position: "absolute", inset: 0, backgroundColor: ACCENT, opacity: f }} />}
            <div style={{
              ...label(labelFs, INK), position: "relative", textAlign: "center", lineHeight: 1.15,
              textShadow: textHalo, padding: `0 ${0.022 * w}px`,
            }}>{n}</div>
          </div>
        );
      })}

      {/* the way out: its own opaque plate, muted one step, never faded out */}
      <div style={{
        position: "absolute", left: exCx - exitW / 2, top: exTop, width: exitW, height: exitH,
        boxSizing: "border-box", borderRadius: 0,
        display: "flex", alignItems: "center", justifyContent: "center", opacity: branchO,
      }}>
        <div style={{
          ...label(labelFs, INK), position: "relative", textAlign: "center", lineHeight: 1.15, opacity: 0.55,
          textShadow: textHalo, padding: `0 ${0.020 * w}px`,
        }}>{exit}</div>
      </div>

      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>a four step loop that never takes its exit</title>
        {SEG.map((s, i) => {
          const g = drawn(i);
          if (g <= 0) return null;
          return (
            <path key={i} d={`M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`}
              fill="none" stroke={INK} strokeWidth={connSw} strokeOpacity={1}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g}
              style={{ filter: halo }} />
          );
        })}
        <g opacity={branchO}>
          <path d={`M ${cxL} ${branchY} L ${cxL} ${midY} L ${exCx} ${midY} L ${exCx} ${exTop - ah}`}
            fill="none" stroke={MUTED} strokeWidth={connSw}
            strokeDasharray={`${0.026 * w} ${0.020 * w}`} style={{ filter: halo }} />
          <polygon points={`${exCx - ah * 0.62},${exTop - ah} ${exCx + ah * 0.62},${exTop - ah} ${exCx},${exTop}`}
            fill={MUTED} style={{ filter: halo }} />
        </g>
        {running && (
          <rect x={pxp - packet / 2} y={pyp - packet / 2} width={packet} height={packet}
            fill={ACCENT} style={{ filter: halo }} />
        )}
      </svg>
    </div>
  );
};
