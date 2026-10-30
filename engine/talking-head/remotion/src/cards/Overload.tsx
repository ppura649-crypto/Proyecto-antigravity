import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Head } from "./Head";
import { Mascot } from "./Mascot";

// "Because if you give Claude 10 tasks to do, it might only do a 7 out of 10 job."
// Ten named chips land on ONE Claude and its output bar drains as they arrive,
// stopping on their number on the word the creator says it. Outlined chips with text, not
// solid bars: abstract grey bars as the content of a card are banned
// (04-visuals.md, "doesn't look professional or clean like creator-format-1").
export const Overload: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  head: string; tasks?: number; score: string; scoreAtMs?: number; fill?: number;
  startMs?: number; perMs?: number; meterLabel: string; chipLabel?: string;
}> = ({ tMs, w, h, fps, fromMs, head, tasks = 10, score, scoreAtMs, fill = 0.7, startMs, perMs = 150, meterLabel, chipLabel = "task" }) => {
  const pad = 0.048 * w;
  const start = startMs ?? fromMs + 200;
  const sAt = scoreAtMs ?? fromMs + 2200;

  const listW = 0.56 * w;
  const cols = 2;
  const rows = Math.ceil(tasks / cols);
  const colGap = 0.018 * w;
  const chipW = (listW - colGap) / cols;
  const fs = 0.026 * w;
  const chipH = fs * 2.1;
  const rowGap = 0.012 * h;
  const listTop = pad + 0.085 * h;

  const rightX = pad + listW + 0.055 * w;
  const rightW = w - pad - rightX;
  const icon = Math.min(0.135 * w, rightW * 0.62);

  const sp = (ms: number, d = 13) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: 320, mass: 0.6 } });
  const landed = Array.from({ length: tasks }).map((_, i) => sp(start + i * perMs, 16));
  const n = landed.filter((s) => s > 0.5).length;
  const meter = interpolate(n, [0, tasks], [1, fill], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sc = sp(sAt, 12);

  const barW = rightW;
  const barH = 0.042 * h;
  const barTop = listTop + rows * (chipH + rowGap) - chipH * 0.2;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box" }}>
      <Head w={w} left={head} />

      {Array.from({ length: tasks }).map((_, i) => {
        const s = landed[i];
        if (s <= 0) return null;
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <div key={i} style={{
            position: "absolute", left: pad + c * (chipW + colGap), top: listTop + r * (chipH + rowGap),
            width: chipW, height: chipH, boxSizing: "border-box",
            display: "flex", alignItems: "center", gap: 0.012 * w, paddingLeft: 0.014 * w,
            border: "1px solid rgba(255,255,255,0.30)", backgroundColor: "rgba(255,255,255,0.05)",
            opacity: Math.min(1, s * 2), transform: `translateX(${(1 - s) * -0.03 * w}px)`,
          }}>
            <div style={{ width: fs * 0.3, height: fs * 0.3, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.55)" }} />
            <div style={{ fontFamily: MONO_FONT, fontSize: fs, color: INK, whiteSpace: "nowrap" }}>{chipLabel} {i + 1}</div>
          </div>
        );
      })}

      {/* the one doing all ten, sagging a little as they land */}
      <div style={{
        position: "absolute", left: rightX + (rightW - icon) / 2, top: listTop + 0.03 * h,
        transform: `translateY(${0.035 * h * (n / tasks)}px) scaleY(${1 - 0.09 * (n / tasks)})`,
        transformOrigin: "bottom center",
      }}>
        <Mascot size={icon} />
      </div>

      {/* what comes out */}
      <div style={{ position: "absolute", left: rightX, top: barTop, width: barW }}>
        <div style={label(0.022 * w, MUTED)}>{meterLabel}</div>
        <div style={{ position: "relative", width: barW, height: barH, marginTop: 0.014 * h, border: "1px solid rgba(255,255,255,0.25)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${meter * 100}%`, backgroundColor: ACCENT, opacity: 0.9 }} />
        </div>
        <div style={{
          marginTop: 0.018 * h, fontFamily: MONO_FONT, fontWeight: 600, fontSize: 0.070 * w,
          color: ACCENT, lineHeight: 1, opacity: Math.min(1, sc * 2), transform: `scale(${0.82 + 0.18 * sc})`,
          transformOrigin: "left center",
        }}>{score}</div>
      </div>
    </div>
  );
};
