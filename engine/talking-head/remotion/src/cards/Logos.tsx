import React from "react";
import { Img, spring, staticFile } from "remotion";

// NAMING card (formats/creator-format-1-visuals.md job 1): real marks, one per beat, for a
// count the narration gives ("10 competitors ... 10 copies, one for each"). Real
// logos only, fetched from logo.dev and unmixed from whatever tile the file
// shipped with, because the hard rule is that NOTHING sits behind a logo: no
// div, no tile, no rectangle. They float on the footage like a `float` mark.
// `pulseAtMs` is the beat where they all move together ("at the same time").
export const Logos: React.FC<{
  tMs: number;
  w: number;
  h: number;
  fps: number;
  items: { src: string; w: number; h: number }[];
  cols?: number;
  startMs: number;
  perMs?: number;
  pulseAtMs?: number;
}> = ({ tMs, w, h, fps, items, cols = 5, startMs, perMs = 220, pulseAtMs }) => {
  const rows = Math.ceil(items.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const box = Math.min(cellW, cellH) * 0.58;

  const pulse = pulseAtMs !== undefined
    ? Math.max(0, Math.sin((Math.min(1, Math.max(0, (tMs - pulseAtMs) / 620)) * Math.PI)))
    : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {items.map((it, i) => {
        const at = startMs + i * perMs;
        const s = spring({
          frame: Math.max(0, ((tMs - at) / 1000) * fps),
          fps,
          config: { damping: 13, stiffness: 320, mass: 0.6 },
        });
        if (s <= 0) return null;
        const k = Math.min(box / it.w, box / it.h);
        const iw = it.w * k;
        const ih = it.h * k;
        return (
          <Img
            key={it.src}
            src={staticFile(it.src)}
            style={{
              position: "absolute",
              left: (i % cols) * cellW + (cellW - iw) / 2,
              top: Math.floor(i / cols) * cellH + (cellH - ih) / 2,
              width: iw,
              height: ih,
              transform: `scale(${0.7 + 0.3 * s + 0.09 * pulse})`,
              opacity: Math.min(1, s * 2),
              filter: "drop-shadow(0px 4px 14px rgba(0,0,0,0.35))",
            }}
          />
        );
      })}
    </div>
  );
};
