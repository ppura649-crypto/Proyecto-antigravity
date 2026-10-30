// The agent, as a character: a small glass-capsule bot head. A shell lit from the top left with a specular glint, a
// dark visor holding two glowing eye slits, side ears, and an antenna with a status light. One SVG on a 100-unit box,
// so it is crisp from 18 px (a swarm) to 200+ px (a hero). `color` tints everything (AGENT cyan testing, RED
// attacking); `state` "off" (or any grey colour) switches it off: dead eyes, dark light, no glow. It blinks on its
// own unless `blink` is given; `look` moves the eyes (-1..1 each axis).
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";

export type AgentState = "idle" | "active" | "off";

type Props = {
  size: number;
  color: string;
  state?: AgentState;
  /** 0 open .. 1 shut; leave undefined to blink by itself */
  blink?: number;
  look?: { x: number; y: number };
  /** halo strength, 1 default */
  glow?: number;
  /** varies the blink rhythm across a swarm */
  seed?: number;
  style?: React.CSSProperties;
};

const hex = (c: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{6})/i.exec(c.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** mix colour a toward b by t (hex in, hex out); a non-hex colour is returned as is */
export const shade = (a: string, b: string, t: number) => {
  const x = hex(a);
  const y = hex(b);
  if (!x || !y) return a;
  const m = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const isGrey = (c: string) => {
  const x = hex(c);
  return !!x && Math.max(...x) - Math.min(...x) < 28;
};

/** the automatic blink: a quick 8-frame shut every 2.5-4 s, phase set by the seed */
const autoBlink = (f: number, seed: number) => {
  const period = 150 + (Math.abs(seed) % 90);
  const t = (f + Math.abs(seed * 37)) % period;
  return t < 8 ? Math.sin((Math.PI * t) / 8) : 0;
};

export const AgentIcon: React.FC<Props> = ({ size, color, state = "idle", blink, look = { x: 0, y: 0 }, glow = 1, seed = 0, style }) => {
  const f = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const off = state === "off" || isGrey(color);
  const base = off ? "#8E959E" : color;
  const active = state === "active";
  const lit = shade(base, "#FFFFFF", 0.6);
  const deep = shade(base, "#000000", off ? 0.35 : 0.5);
  const eye = off ? "#4A5058" : shade(base, "#FFFFFF", active ? 0.75 : 0.55);
  const shut = off ? 0.82 : Math.min(1, blink ?? autoBlink(f, seed));
  const eh = Math.max(1.6, 17 * (1 - shut));
  const ex = look.x * 5.5;
  const ey = look.y * 3.5;
  const bulb = off ? "#3B4047" : active ? "#FFFFFF" : lit;
  const pulse = 0.75 + 0.25 * Math.sin(f / 7 + seed);
  const g = off ? 0 : glow * (active ? 1.5 : 1);
  const halo = g > 0 ? `drop-shadow(0 0 ${(size * 0.1 * g).toFixed(1)}px ${base}${active ? "CC" : "99"})` : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible", filter: halo, ...style }}>
      <defs>
        <linearGradient id={`s${id}`} x1="0.15" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16222E" />
          <stop offset="1" stopColor="#04080C" />
        </linearGradient>
        <radialGradient id={`e${id}`}>
          <stop offset="0" stopColor={base} stopOpacity={off ? 0 : 0.85} />
          <stop offset="1" stopColor={base} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* antenna: stem, then the status light with its own small halo */}
      <rect x={48.3} y={9} width={3.4} height={17} rx={1.7} fill={deep} />
      {!off && <circle cx={50} cy={8} r={9 * pulse} fill={`url(#e${id})`} />}
      <circle cx={50} cy={8} r={5.2} fill={bulb} stroke={deep} strokeWidth={1.2} />
      {/* ears */}
      <rect x={3.5} y={47} width={9} height={22} rx={4.5} fill={deep} />
      <rect x={87.5} y={47} width={9} height={22} rx={4.5} fill={deep} />
      {/* the glass shell */}
      <rect x={9} y={24} width={82} height={68} rx={31} fill={`url(#s${id})`} stroke={lit} strokeOpacity={0.7} strokeWidth={1.6} />
      <ellipse cx={32} cy={35} rx={15} ry={5.5} transform="rotate(-18 32 35)" fill="#FFFFFF" opacity={0.55} />
      <ellipse cx={72} cy={84} rx={12} ry={3} fill="#FFFFFF" opacity={0.12} />
      {/* the visor and its eyes */}
      <rect x={18} y={43} width={64} height={35} rx={17.5} fill={`url(#v${id})`} stroke="#000" strokeOpacity={0.35} strokeWidth={1.2} />
      {!off && <ellipse cx={50 + ex} cy={60.5 + ey} rx={27} ry={14} fill={`url(#e${id})`} opacity={active ? 0.75 : 0.5} />}
      <rect x={32 - 5 + ex} y={60.5 + ey - eh / 2} width={10} height={eh} rx={Math.min(5, eh / 2)} fill={eye} />
      <rect x={68 - 5 + ex} y={60.5 + ey - eh / 2} width={10} height={eh} rx={Math.min(5, eh / 2)} fill={eye} />
      <path d="M 26 47.5 Q 50 43.5 74 47.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};
