// Claude's casing: a solid box in Claude's colour that closes around the machine (the walls slide up, the lid drops
// on), with one output port on its front labelled API. We, the viewer, keep a cutaway window into it; the student
// outside only ever gets what leaves the port. Plus the lock that snaps over what stays inside.
import React from "react";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";
import { CLAUDE, Logo } from "./parts";

/** the casing's front face and the cutaway window in it (screen px) */
export const BOX = { x: 150, y: 604, w: 700, h: 572, depth: 70 };
export const WIN = { x: 184, y: 664, w: 632, h: 452 };
export const PORT = { x: 500, y: 1148 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** clip for the machine: the whole frame before the casing closes, the window once it has */
export function windowClip(k: number) {
  const t = lerp(0, WIN.y, k), l = lerp(0, WIN.x, k);
  const b = lerp(0, 1920 - WIN.y - WIN.h, k), r = lerp(0, 1080 - WIN.x - WIN.w, k);
  return `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${(14 * k).toFixed(1)}px)`;
}

/** walls 0..1, lid 0..1: the two moves of the close */
export function closeAt(f: number, at: number) {
  return { walls: arrive(f, at - 22, 22), lid: prog(f, at - 8, 10, ease.in), shake: f >= at + 2 && f < at + 10 ? Math.sin((f - at - 2) * 2.2) * 3 * (1 - (f - at - 2) / 8) : 0 };
}

/** the back of the casing: side, front face and the dark recess of the window (drawn under the machine) */
export const CasingBack: React.FC<{ walls: number; lid: number; shake: number; portLit: number }> = ({ walls, lid, shake, portLit }) => {
  const { theme } = useScene();
  const { x, y, w, h, depth } = BOX;
  const up = (1 - walls) * 820;
  const drop = (1 - lid) * -60;
  const side = `${x + w},${y} ${x + w + depth},${y - depth * 0.8} ${x + w + depth},${y + h - depth * 0.8} ${x + w},${y + h}`;
  const top = `${x},${y} ${x + w},${y} ${x + w + depth},${y - depth * 0.8} ${x + depth},${y - depth * 0.8}`;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${shake.toFixed(2)}px)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E08A6C" />
            <stop offset="0.5" stopColor={CLAUDE} />
            <stop offset="1" stopColor="#B65C40" />
          </linearGradient>
          <linearGradient id="cs" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#A4523A" />
            <stop offset="1" stopColor="#7E3E2B" />
          </linearGradient>
        </defs>
        {walls > 0 && (
          <g transform={`translate(0 ${up.toFixed(1)})`} opacity={Math.min(1, walls * 4)}>
            <polygon points={side} fill="url(#cs)" />
            <rect x={x} y={y} width={w} height={h} rx={10} fill="url(#cf)" />
            <rect x={x + 2} y={y + 2} width={w - 4} height={3} fill="rgba(255,235,225,0.55)" />
            <rect x={WIN.x - 4} y={WIN.y - 4} width={WIN.w + 8} height={WIN.h + 8} rx={16} fill="#6E3424" />
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={14} fill="#0B0B0D" />
            <rect x={PORT.x - 70} y={PORT.y - 12} width={140} height={24} rx={12} fill="#2A140D" />
            <rect x={PORT.x - 58} y={PORT.y - 5} width={116} height={10} rx={5} fill={`rgba(255,${Math.round(200 + 55 * portLit)},${Math.round(170 + 85 * portLit)},${(0.25 + 0.75 * portLit).toFixed(3)})`} />
          </g>
        )}
        {lid > 0 && <polygon points={top} fill="#EDA088" transform={`translate(0 ${drop.toFixed(1)})`} opacity={Math.min(1, lid * 3)} />}
      </svg>
      {walls > 0 && (
        <div style={{ position: "absolute", left: x + 22, top: y + 8 + up, display: "flex", alignItems: "center", gap: 12, padding: "4px 18px 4px 10px", borderRadius: 10, background: "#1B0E09", opacity: Math.min(1, walls * 3) }}>
          <Logo name="claude" size={36} />
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, color: "#FFFFFF" }}>Claude</span>
        </div>
      )}
      {walls > 0 && (
        <div style={{ position: "absolute", left: PORT.x + 84, top: PORT.y - 22 + up, fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, color: "#2A140D", opacity: Math.min(1, walls * 3) }}>
          API
        </div>
      )}
    </div>
  );
};

/** a padlock that snaps shut over what stays inside; `at` = the frame it lands */
export const Lock: React.FC<{ at: number; cx: number; cy: number; size?: number }> = ({ at, cx, cy, size = 132 }) => {
  const { f } = useScene();
  if (f < at - 8) return null;
  const drop = 1 - arrive(f, at - 8, 8);
  const shut = prog(f, at + 2, 5, ease.in);
  const w = size, h = size * 1.12;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2 - drop * 90, width: w, height: h, ...pop(f, at - 8, { dur: 10, from: 0.85 }) }}>
      <svg width={w} height={h} viewBox="0 0 100 112">
        <path d={`M 28 ${52 - 12 * (1 - shut)} V 34 a 22 22 0 0 1 44 0 V ${52 - 12 * (1 - shut)}`} fill="none" stroke="#F4F4F5" strokeWidth={10} strokeLinecap="round" transform={`translate(0 ${(-12 * (1 - shut)).toFixed(2)})`} />
        <rect x={12} y={50} width={76} height={58} rx={12} fill={CLAUDE} />
        <rect x={12} y={50} width={76} height={8} rx={4} fill="rgba(255,240,232,0.45)" />
        <circle cx={50} cy={76} r={8} fill="#2A140D" />
        <rect x={46} y={78} width={8} height={16} rx={3} fill="#2A140D" />
      </svg>
    </div>
  );
};
