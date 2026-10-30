// The sandbox as an object: one glass cube in real 3D (CSS preserve-3d), an agent dot floating at its centre. Its lid
// and front pane can be lifted off and slammed shut (`lid` 0 open .. 1 shut). Used by `report` (light ground: one cube,
// then its greyed neighbours) and by `locker` (dark ground: the row of cubes under the package server).
import React from "react";
import { AGENT, AgentIcon } from "./parts";

export type Tone = "light" | "dark" | "grey";

const GLASS: Record<Tone, { edge: string; fill: string; hi: string; shadow: string }> = {
  light: { edge: "#1F95CF", fill: "rgba(150,210,240,0.20)", hi: "rgba(255,255,255,0.55)", shadow: "rgba(20,60,90,0.28)" },
  dark: { edge: "#5AC8FA", fill: "rgba(90,200,250,0.07)", hi: "rgba(160,230,255,0.18)", shadow: "rgba(0,0,0,0.6)" },
  grey: { edge: "#9AA3AD", fill: "rgba(170,178,188,0.28)", hi: "rgba(255,255,255,0.5)", shadow: "rgba(40,40,40,0.16)" },
};

type CubeProps = {
  x: number; y: number; size: number;
  lid?: number; tone?: Tone; rx?: number; ry?: number;
  opacity?: number; blur?: number; scale?: number;
  children?: React.ReactNode;
};

/** one pane of glass, placed by its 3D transform */
const Pane: React.FC<{ size: number; t: string; tone: Tone; o?: number; bright?: boolean }> = ({ size, t, tone, o = 1, bright }) => {
  const g = GLASS[tone];
  return (
    <div
      style={{
        position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size, transform: t, opacity: o,
        background: `linear-gradient(135deg, ${g.hi} 0%, ${g.fill} 38%, ${g.fill} 70%, ${g.hi} 100%)`,
        border: `${Math.max(2, size * 0.011)}px solid ${g.edge}`,
        boxShadow: `inset 0 0 ${size * 0.14}px ${g.edge}${bright ? "66" : "33"}`,
        borderRadius: 4,
      }}
    />
  );
};

const Space: React.FC<{ size: number; rx: number; ry: number; children: React.ReactNode }> = ({ size, rx, ry, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, perspective: size * 5 }}>
    <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>{children}</div>
  </div>
);

export const Cube: React.FC<CubeProps> = ({ x, y, size, lid = 1, tone = "light", rx = -20, ry = -32, opacity = 1, blur = 0, scale = 1, children }) => {
  const h = size / 2;
  const lift = (1 - lid) * size * 1.25;
  const lidO = lid <= 0 ? 0 : Math.min(1, lid * 4);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity, filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined, transform: `scale(${scale.toFixed(4)})` }}>
      {/* the cube's shadow on the floor */}
      <div style={{ position: "absolute", left: -size * 0.85, top: size * 0.62, width: size * 1.7, height: size * 0.34, borderRadius: "50%", background: `radial-gradient(closest-side, ${GLASS[tone].shadow}, transparent)` }} />
      {/* back panes, then what lives inside (flat, facing the viewer, at the cube's projected centre), then the front
          panes: two 3D contexts with the same transform, so the inside sits between the glass layers */}
      <Space size={size} rx={rx} ry={ry}>
        <Pane size={size} tone={tone} t={`rotateY(180deg) translateZ(${h}px)`} />
        <Pane size={size} tone={tone} t={`rotateY(-90deg) translateZ(${h}px)`} />
        <Pane size={size} tone={tone} t={`rotateX(-90deg) translateZ(${h}px)`} />
      </Space>
      <div style={{ position: "absolute", left: 0, top: 0 }}>{children}</div>
      <Space size={size} rx={rx} ry={ry}>
        <Pane size={size} tone={tone} t={`rotateY(90deg) translateZ(${h}px)`} />
        <Pane size={size} tone={tone} o={lidO} t={`translateY(${-lift}px) rotateX(90deg) translateZ(${h}px)`} bright />
        <Pane size={size} tone={tone} o={lidO} t={`translateY(${-lift}px) translateZ(${h}px)`} bright />
      </Space>
    </div>
  );
};

/** the agent inside a cube (the AgentIcon), centred on the cube's centre; `pulse` 0..1 swells its glow */
export const Dot: React.FC<{ r: number; pulse?: number; color?: string; glow?: number }> = ({ r, pulse = 0, color = AGENT, glow = 1 }) => {
  const size = r * 2.4 * (1 + pulse * 0.08);
  return (
    <div style={{ position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size }}>
      <AgentIcon size={size} color={color} glow={glow * (1 + pulse * 0.6)} seed={Math.round(r * 31)} />
    </div>
  );
};

/** a sonar ring from the dot that dies before it reaches the glass: it cannot get out */
export const Ping: React.FC<{ f: number; start: number; period: number; max: number; color?: string }> = ({ f, start, period, max, color = AGENT }) => {
  if (f < start) return null;
  const t = ((f - start) % period) / period;
  const r = max * t;
  return <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${color}`, opacity: (1 - t) * 0.8 }} />;
};

/** the Wi-Fi mark, centred at (0,0); `cut` 0..1 draws the slash through it, `fade` greys the arcs */
export const Wifi: React.FC<{ size: number; cut: number; ink: string; fade: number }> = ({ size, cut, ink, fade }) => {
  const s = size;
  const arc = (r: number) => `M ${-r * 0.707} ${-r * 0.707 + s * 0.3} A ${r} ${r} 0 0 1 ${r * 0.707} ${-r * 0.707 + s * 0.3}`;
  const col = fade > 0.5 ? "#8A949E" : "#1F95CF";
  return (
    <svg width={s * 1.4} height={s * 1.4} viewBox={`${-s * 0.7} ${-s * 0.7} ${s * 1.4} ${s * 1.4}`} style={{ position: "absolute", left: -s * 0.7, top: -s * 0.7, overflow: "visible" }}>
      {[0.62, 0.42, 0.22].map((k) => (
        <path key={k} d={arc(s * k)} fill="none" stroke={col} strokeWidth={s * 0.075} strokeLinecap="round" />
      ))}
      <circle cx={0} cy={s * 0.3} r={s * 0.06} fill={col} />
      <line x1={-s * 0.42} y1={-s * 0.42} x2={s * 0.42} y2={s * 0.42} stroke={ink} strokeWidth={s * 0.09} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cut} />
    </svg>
  );
};
