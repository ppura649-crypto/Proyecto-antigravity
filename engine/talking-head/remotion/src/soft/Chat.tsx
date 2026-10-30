import React from "react";
import { Glass, Header } from "./Glass";
import type { CardProps } from "./Objects";
import { SOFT, fade, typed, typing, since, clamp01, type Box } from "./tokens";

// Her dark glass chat (XAFZ f1084-1208): dark translucent panel with a local backdrop blur
// (her face softens under it, the rest of the frame stays sharp), a tracked label, bubbles
// right (user, 0.594-0.844W) and left (agent, 0.150-0.466W) at radius 20. A bubble's
// background slides in over 4 frames first, then its text types at exactly 1 glyph per frame.

export type Bubble = { side: "l" | "r"; atMs: number; text: string };

export const Chat: React.FC<CardProps & { label: string; bubbles: Bubble[]; box?: Box }> = (p) => {
  const box = p.box ?? { x: 0.11, y: 0.235, w: 0.78, h: 0.405 };
  const panelW = box.w * p.W;
  const pitch = 96;
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} dark radius={34}>
      <Header left={p.label} dark />
      {p.bubbles.map((b, i) => {
        if (p.tMs < b.atMs) return null;
        const slide = clamp01(since(p.tMs, b.atMs, p.fps) / 4);
        const textAt = b.atMs + (4 / p.fps) * 1000;
        const shown = typed(b.text, p.tMs, textAt, p.fps);
        const cursor = typing(b.text, p.tMs, textAt, p.fps);
        const right = b.side === "r";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 128 + i * pitch,
              [right ? "right" : "left"]: 0.05 * panelW,
              maxWidth: 0.62 * panelW,
              padding: "16px 26px",
              borderRadius: 20,
              backgroundColor: right ? SOFT.bubbleRight : SOFT.bubbleLeft,
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              opacity: slide,
              transform: `translateX(${(1 - slide) * (right ? 24 : -24)}px)`,
              fontFamily: SOFT.grotesque, fontWeight: 500, fontSize: 30, color: SOFT.white,
              whiteSpace: "nowrap", lineHeight: 1.2,
            }}
          >
            {/* the bubble is full-size from its first frame (her f1084-1095); the text types inside it */}
            <span style={{ visibility: "hidden" }}>{b.text}</span>
            <span style={{ position: "absolute", left: 26, top: 16 }}>
              {shown}
              {cursor ? <span style={{ opacity: 0.85 }}>|</span> : null}
            </span>
          </div>
        );
      })}
    </Glass>
  );
};

// Her install window (XAFZ f1048-1090): glass panel, header with a right value, objects
// arriving 2 frames each, a progress line that grows. Here: hook rows with an accent check.
export const Hooks: React.FC<CardProps & { left: string; right: string; rows: string[] }> = (p) => {
  const box: Box = { x: 0.11, y: 0.135, w: 0.78, h: 0.25 };
  const ats = p.rows.map((_, i) => p.beats[`r${i + 1}`] ?? p.toMs);
  const done = ats.filter((a) => p.tMs >= a).length;
  const lastAt = done > 0 ? ats[done - 1] : p.fromMs;
  const seg = clamp01(since(p.tMs, lastAt, p.fps) / 6);
  const progress = done === 0 ? 0 : (done - 1 + seg) / p.rows.length;
  const trackW = box.w * p.W - 88;
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}>
      <Header left={p.left} right={p.right} />
      <div style={{ position: "absolute", top: 118, left: 44, right: 44, display: "flex", flexDirection: "column", gap: 14 }}>
        {p.rows.map((r, i) => (
          <div
            key={i}
            style={{
              opacity: fade(p.tMs, ats[i], 3, p.fps), display: "flex", alignItems: "center", gap: 18,
              padding: "12px 20px", borderRadius: 14, backgroundColor: SOFT.glassChip,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: SOFT.accent, display: "flex", alignItems: "center", justifyContent: "center", color: SOFT.white, fontFamily: SOFT.grotesque, fontWeight: 800, fontSize: 22 }}>
              ✓
            </div>
            <div style={{ fontFamily: SOFT.grotesque, fontWeight: 600, fontSize: 30, color: SOFT.glassInk }}>{r}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 44, bottom: 34, width: trackW, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" }}>
        <div style={{ width: trackW * progress, height: 4, borderRadius: 2, backgroundColor: SOFT.white }} />
      </div>
    </Glass>
  );
};
