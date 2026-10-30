import React from "react";
import { spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED } from "./theme";
import { Head } from "./Head";
import { Mascot } from "./Mascot";

// "It's called using subagents, and it basically works like delegation."
// The vocabulary card: who is who, and the one thing each of them does. The
// loop on the right is the half of delegation people forget, the reporting
// back, and it draws itself after both rows have landed.
export type Role = { name: string; duty: string };

export const Roles: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  head: string; rows: Role[]; down: string; up: string;
  beats?: { second?: number; loop?: number };
}> = ({ tMs, w, h, fps, fromMs, head, rows, down, up, beats = {} }) => {
  const pad = 0.05 * w;
  const nameFs = 0.036 * w;
  const dutyFs = 0.026 * w;
  const tagFs = 0.022 * w;
  const icon = 0.10 * w;
  const at = { second: beats.second ?? fromMs + 900, loop: beats.loop ?? fromMs + 1700 };
  const sp = (ms: number) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.68 } });
  const s1 = sp(fromMs + 60);
  const s2 = sp(at.second);
  const lp = sp(at.loop);

  const railX = w - pad - 0.075 * w;
  const rowH = icon * (20 / 24) + 0.035 * h;
  const top1 = 0.30 * h;
  const top2 = 0.30 * h + rowH + 0.13 * h;

  const row = (r: Role, s: number, top: number, accent: boolean) => (
    <div style={{
      position: "absolute", left: pad, top, display: "flex", alignItems: "center", gap: 0.032 * w,
      opacity: Math.min(1, s * 2), transform: `translateX(${(1 - s) * -0.03 * w}px)`,
    }}>
      <Mascot size={icon} />
      <div>
        <div style={{ fontFamily: MONO_FONT, fontSize: nameFs, fontWeight: 500, color: accent ? ACCENT : INK, lineHeight: 1.1 }}>{r.name}</div>
        <div style={{ fontFamily: MONO_FONT, fontSize: dutyFs, color: MUTED, marginTop: 0.006 * h }}>{r.duty}</div>
      </div>
    </div>
  );

  const yA = top1 + rowH * 0.55;
  const yB = top2 + rowH * 0.15;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box" }}>
      <Head w={w} left={head} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <title>one job down, the answer back up</title>
        {/* down: the job */}
        <path d={`M ${pad + 0.048 * w} ${yA + rowH * 0.5} L ${pad + 0.048 * w} ${yB}`}
          stroke={ACCENT} strokeWidth={1.6} strokeOpacity={0.8} fill="none"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, s2 * 1.4)} />
        <path d={`M ${pad + 0.048 * w - 0.009 * w} ${yB - 0.016 * w} L ${pad + 0.048 * w} ${yB} L ${pad + 0.048 * w + 0.009 * w} ${yB - 0.016 * w}`}
          stroke={ACCENT} strokeWidth={1.6} fill="none" opacity={Math.min(1, s2 * 2 - 0.6)} />
        {/* up: the answer, around the right rail */}
        <path d={`M ${railX - 0.16 * w} ${yB + rowH * 0.4} L ${railX} ${yB + rowH * 0.4} L ${railX} ${yA} L ${railX - 0.16 * w} ${yA}`}
          stroke={ACCENT} strokeWidth={1.6} strokeOpacity={0.55} fill="none"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, lp * 1.3)} />
        <path d={`M ${railX - 0.16 * w + 0.016 * w} ${yA - 0.009 * w} L ${railX - 0.16 * w} ${yA} L ${railX - 0.16 * w + 0.016 * w} ${yA + 0.009 * w}`}
          stroke={ACCENT} strokeWidth={1.6} fill="none" opacity={Math.min(1, lp * 2 - 0.8)} />
      </svg>
      {row(rows[0], s1, top1, false)}
      {row(rows[1], s2, top2, true)}
      <div style={{ position: "absolute", left: pad + 0.062 * w, top: (yA + yB) / 2 - tagFs, fontFamily: MONO_FONT, fontSize: tagFs, color: ACCENT, opacity: Math.min(1, s2 * 2 - 0.8) }}>{down}</div>
      <div style={{ position: "absolute", right: pad + 0.02 * w, top: (yA + yB) / 2 - tagFs, fontFamily: MONO_FONT, fontSize: tagFs, color: "rgba(224,120,80,0.75)", opacity: Math.min(1, lp * 2 - 0.8) }}>{up}</div>
    </div>
  );
};
