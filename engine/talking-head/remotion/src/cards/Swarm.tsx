import React from "react";
import { Img, spring, staticFile } from "remotion";
import { Mascot } from "./Mascot";

// The concrete instance of the split: one agent, one real company, ten pairs.
// They land one per beat as the creator counts them out, and on the beat where the creator says
// "at the same time" every pair moves together, which is the only thing the
// card has to say. Real marks only, floating, nothing behind them.
export const Swarm: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  items: { src: string; w: number; h: number }[];
  cols?: number; startMs: number; perMs?: number; workAtMs?: number;
}> = ({ tMs, w, h, fps, items, cols = 5, startMs, perMs = 150, workAtMs }) => {
  const rows = Math.ceil(items.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const icon = cellW * 0.40;
  const iconH = icon * (20 / 24);
  const logoBox = Math.min(cellW * 0.56, cellH * 0.36);
  const gap = 0.075 * cellH;
  const stackH = iconH + gap + logoBox;
  const top0 = (cellH - stackH) / 2;

  // one shared beat: they all start working together
  const pulse = workAtMs === undefined ? 0
    : Math.max(0, Math.sin(Math.min(1, Math.max(0, (tMs - workAtMs) / 700)) * Math.PI));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {items.map((it, i) => {
        const at = startMs + i * perMs;
        const s = spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 13, stiffness: 320, mass: 0.6 } });
        if (s <= 0) return null;
        const k = Math.min(logoBox / it.w, logoBox / it.h);
        const cx = (i % cols) * cellW;
        const cy = Math.floor(i / cols) * cellH;
        return (
          <div key={it.src} style={{
            position: "absolute", left: cx, top: cy, width: cellW, height: cellH,
            opacity: Math.min(1, s * 2), transform: `scale(${0.72 + 0.28 * s + 0.10 * pulse})`,
          }}>
            <div style={{ position: "absolute", left: 0, top: top0, width: cellW, display: "flex", justifyContent: "center" }}>
              <Mascot size={icon} />
            </div>
            <div style={{
              position: "absolute", left: cellW / 2 - 1, top: top0 + iconH + gap * 0.12,
              width: 2, height: gap * 0.76, backgroundColor: "#e07850", opacity: 0.85,
              boxShadow: "0px 1px 4px rgba(0,0,0,0.7)",
            }} />
            <Img src={staticFile(it.src)} style={{
              position: "absolute", left: (cellW - it.w * k) / 2, top: top0 + iconH + gap,
              width: it.w * k, height: it.h * k,
              filter: "drop-shadow(0px 4px 14px rgba(0,0,0,0.55))",
            }} />
          </div>
        );
      })}
    </div>
  );
};
