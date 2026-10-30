// `logs`: the red felt pen that edits the logbook, and the eased piecewise path it follows.
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { LOGS_PEN } from "./LogsBook";

type P = { f: number; x: number; y: number; wig?: boolean };

/** piecewise path, eased per segment; `wig` segments scribble (the pen zigzags up and down as it goes) */
export function logsPathAt(path: P[], f: number): { x: number; y: number } {
  if (f <= path[0].f) return path[0];
  let i = 0;
  while (i < path.length - 2 && f > path[i + 1].f) i++;
  const a = path[i];
  const b = path[i + 1];
  if (f >= b.f) return b;
  const k = prog(f, a.f, b.f - a.f, b.wig ? ease.linear : ease.inOut);
  const y = a.y + (b.y - a.y) * k + (b.wig ? Math.sin(k * Math.PI * 14) * 12 : 0);
  return { x: a.x + (b.x - a.x) * k, y };
}

/** the red felt pen: its tip is the point (x, y) */
export const LogsPen: React.FC<{ path: P[]; from: number; to: number }> = ({ path, from, to }) => {
  const { f } = useScene();
  if (f < from || f > to) return null;
  const { x, y } = logsPathAt(path, f);
  const o = prog(f, from, 5) * (1 - prog(f, to - 6, 6));
  return (
    <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: x, top: y - 300, opacity: o, overflow: "visible", filter: "drop-shadow(-14px 18px 10px rgba(0,0,0,0.45))" }}>
      <g transform="rotate(38 0 300)">
        <path d="M0 300 L-9 272 L9 272 Z" fill="#2A2A2A" />
        <rect x={-13} y={196} width={26} height={78} rx={4} fill="#E8E8EA" />
        <rect x={-15} y={20} width={30} height={180} rx={12} fill={LOGS_PEN} />
        <rect x={-15} y={20} width={9} height={180} rx={4} fill="rgba(255,255,255,0.28)" />
        <rect x={10} y={40} width={6} height={90} rx={3} fill="#9E1A13" />
      </g>
    </svg>
  );
};
