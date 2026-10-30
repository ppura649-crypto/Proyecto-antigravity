// `weekend`: the paper wall calendar for July 2026 (1 July 2026 is a Wednesday, so Saturday 11 and Sunday 12 sit side
// by side in a Monday-first grid). On "one" both days are ringed in red marker, hand-drawn.
import React from "react";
import { draw, ease, prog, useScene } from "../../../src/engine";
import { RED } from "./parts";

export const CAL = { w: 600, head: 104, dow: 52, row: 74, pad: 22 };
const H = CAL.head + CAL.dow + CAL.row * 5 + CAL.pad * 2;
export const CAL_H = H;
const COLW = (CAL.w - CAL.pad * 2) / 7;
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FIRST = 2; // Wednesday

/** centre of a day's cell, calendar-local */
export const dayCell = (d: number) => {
  const k = d - 1 + FIRST;
  return { x: CAL.pad + (k % 7) * COLW + COLW / 2, y: CAL.head + CAL.dow + Math.floor(k / 7) * CAL.row + CAL.row / 2 };
};

/** a marker loop: slightly egg-shaped, starts and overshoots its own start like a real hand */
const loop = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 26; i++) {
    const a = -2.2 + (i / 24) * Math.PI * 2;
    const w = 1 + 0.06 * Math.sin(a * 2 + seed) + (i > 23 ? 0.08 : 0);
    pts.push(`${(cx + rx * w * Math.cos(a)).toFixed(1)} ${(cy + ry * w * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
};

export const Calendar: React.FC<{ ring: number; wash: number }> = ({ ring, wash }) => {
  const { f } = useScene();
  const w = prog(f, wash, 10, ease.out);
  return (
    <div style={{ position: "relative", width: CAL.w, height: H }}>
      {/* the nail and the string it hangs from */}
      <svg width={CAL.w} height={80} style={{ position: "absolute", left: 0, top: -58, overflow: "visible" }}>
        <path d={`M${CAL.w * 0.3} 58 L${CAL.w / 2} 8 L${CAL.w * 0.7} 58`} fill="none" stroke="#9A9AA0" strokeWidth={2.5} />
        <circle cx={CAL.w / 2} cy={8} r={7} fill="#6B6B70" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", borderRadius: 10, boxShadow: "0 30px 60px rgba(0,0,0,0.16), 0 6px 14px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ height: CAL.head, background: "linear-gradient(180deg,#26262B,#16161A)", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, color: "#fff", fontFamily: "Figtree, sans-serif" }}>
          <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: 3 }}>JULY</span>
          <span style={{ fontSize: 58, fontWeight: 300, opacity: 0.8 }}>2026</span>
        </div>
        <div style={{ position: "absolute", left: CAL.pad, right: CAL.pad, top: CAL.head, height: CAL.dow, display: "flex", alignItems: "center", fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 600, color: "#8E8E93" }}>
          {DOW.map((d, i) => <div key={d} style={{ width: COLW, textAlign: "center", color: i >= 5 ? "#3A3A3F" : undefined }}>{d}</div>)}
        </div>
        {/* weekend columns, faintly shaded like a printed calendar */}
        <div style={{ position: "absolute", left: CAL.pad + COLW * 5, width: COLW * 2, top: CAL.head + CAL.dow, height: CAL.row * 5, background: "#F3F3F5" }} />
        {Array.from({ length: 31 }, (_, i) => {
          const c = dayCell(i + 1);
          const hot = i + 1 === 11 || i + 1 === 12;
          return (
            <div key={i} style={{ position: "absolute", left: c.x - COLW / 2, top: c.y - CAL.row / 2, width: COLW, height: CAL.row, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Figtree, sans-serif", fontSize: 38, fontWeight: hot ? 800 : 500, color: hot && w > 0.5 ? RED : "#1C1C1F" }}>
              {hot && <div style={{ position: "absolute", inset: 8, borderRadius: 14, background: RED, opacity: 0.12 * w }} />}
              <span style={{ position: "relative" }}>{i + 1}</span>
            </div>
          );
        })}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: CAL.pad, right: CAL.pad, top: CAL.head + CAL.dow + i * CAL.row, height: 1.5, background: "#ECECEF" }} />
        ))}
      </div>
      <svg width={CAL.w} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {[11, 12].map((d, i) => {
          const c = dayCell(d);
          return <path key={d} d={loop(c.x, c.y, COLW * 0.56, CAL.row * 0.5, i * 2 + 1)} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" {...draw(f, ring + i * 6, 12)} />;
        })}
      </svg>
    </div>
  );
};
