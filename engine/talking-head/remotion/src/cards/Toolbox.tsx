import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// What "an editing background" actually means: a rack of tools you had to learn.
// A terracotta scan line walks the rack and every tool it touches falls out of
// the card, and one line of plain english is left standing in their place.
// the creator 2026-09-04: "make it better, have animations, like be waaay more creative".

const ICONS: Record<string, React.ReactNode> = {
  razor: (<><path d="M7 12h26l-4 9H11z" /><path d="M11 21l3 11h12l3-11" /><path d="M14 16h12" /></>),
  keyframes: (<><path d="M3 20h34" /><path d="M13 14l6 6-6 6-6-6z" /><path d="M29 15.5l4.5 4.5-4.5 4.5-4.5-4.5z" /></>),
  masks: (<><rect x="5" y="8" width="30" height="24" rx="3" /><circle cx="20" cy="20" r="7" /></>),
  curves: (<><rect x="5" y="5" width="30" height="30" /><path d="M6 33C15 33 19 9 34 7" /><circle cx="14" cy="27" r="2.4" /><circle cx="27" cy="12" r="2.4" /></>),
  color: (<><circle cx="15" cy="16" r="9" /><circle cx="25" cy="16" r="9" /><circle cx="20" cy="25" r="9" /></>),
  mixer: (<><path d="M10 5v30M20 5v30M30 5v30" /><rect x="6" y="11" width="8" height="5" /><rect x="16" y="22" width="8" height="5" /><rect x="26" y="15" width="8" height="5" /></>),
  tracking: (<><path d="M5 12V5h7M28 5h7v7M35 28v7h-7M12 35H5v-7" /><circle cx="20" cy="20" r="3" /><path d="M20 11v4M20 25v4M11 20h4M25 20h4" /></>),
  transitions: (<><rect x="4" y="10" width="20" height="20" /><rect x="16" y="10" width="20" height="20" /><path d="M16 10v20" /></>),
};

export type Tool = { icon: string; name: string };

export const Toolbox: React.FC<{
  tMs: number; w: number; h: number;
  tools: Tool[]; ask: string;
  beats: { rack: number; per?: number; sweep: number; sweepMs?: number; ask: number; typeMs?: number };
}> = ({ tMs, w, h, tools, ask, beats }) => {
  const P = Math.round(w * 0.030);
  const per = beats.per ?? 100;
  const sweepMs = beats.sweepMs ?? 700;
  const cols = 4;
  const rows = Math.ceil(tools.length / cols);
  const gap = Math.round(w * 0.018);
  const tw = Math.floor((w - 2 * P - gap * (cols - 1)) / cols);
  const th = Math.round(h * 0.30);
  const rowGap = Math.round(h * 0.035);
  const gridH = rows * th + (rows - 1) * rowGap;
  const gridTop = Math.round((h - gridH) / 2);
  const icon = Math.round(th * 0.46);
  const nameFs = Math.round(h * 0.044);

  // the scan line: 0 at the left edge, 1 past the right
  const sw = interpolate(tMs, [beats.sweep, beats.sweep + sweepMs], [0, 1], {
    easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const scanX = sw * w;

  const askP = interpolate(tMs, [beats.ask, beats.ask + 200], [0, 1], {
    easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const typed = Math.floor(interpolate(tMs, [beats.ask + 120, beats.ask + 120 + (beats.typeMs ?? 560)], [0, ask.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const caretOn = Math.floor((tMs - beats.ask) / 420) % 2 === 0;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {tools.map((t, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = P + c * (tw + gap);
        const y = gridTop + r * (th + rowGap);
        const at = beats.rack + i * per;
        const a = interpolate(tMs, [at, at + 220], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        // it falls once the scan line has passed its middle
        const passed = interpolate(scanX, [x + tw * 0.35, x + tw * 1.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const alive = 1 - passed;
        return (
          <div key={t.name} style={{
            position: "absolute", left: x, top: y, width: tw, height: th, boxSizing: "border-box",
            border: `1px solid rgba(255,255,255,${0.13 * alive})`,
            background: `rgba(255,255,255,${0.05 * alive})`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: Math.round(th * 0.10),
            opacity: a * alive,
            filter: `grayscale(${passed})`,
            transform: `translateY(${(1 - a) * 14 + passed * h * 0.45}px) rotate(${passed * (i % 2 ? 11 : -11)}deg) scale(${0.93 + 0.07 * a})`,
          }}>
            <svg width={icon} height={icon} viewBox="0 0 40 40" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {ICONS[t.icon]}
            </svg>
            <span style={{ ...label(nameFs, MUTED), whiteSpace: "nowrap" }}>{t.name}</span>
          </div>
        );
      })}

      {/* the scan line itself */}
      {sw > 0 && sw < 1 && (
        <div style={{ position: "absolute", left: scanX - 1, top: 0, width: 2, height: h, background: ACCENT, boxShadow: `0 0 ${Math.round(h * 0.06)}px ${ACCENT}` }} />
      )}

      {/* what is left: one line of plain english */}
      <div style={{
        position: "absolute", left: P, right: P, top: gridTop + Math.round(gridH * 0.5) - Math.round(h * 0.12),
        height: Math.round(h * 0.24), display: "flex", alignItems: "center", gap: Math.round(w * 0.018),
        opacity: askP, transform: `scale(${0.96 + 0.04 * askP})`,
      }}>
        <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.145), color: ACCENT, lineHeight: 1 }}>{">"}</span>
        <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.135), color: INK, whiteSpace: "pre" }}>
          {ask.slice(0, typed)}
          <span style={{ opacity: caretOn ? 1 : 0 }}>{"█"}</span>
        </span>
      </div>
    </div>
  );
};
