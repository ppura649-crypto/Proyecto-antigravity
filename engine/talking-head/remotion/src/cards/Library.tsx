import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Mascot } from "./Mascot";

// The payoff card: the real library the creator points at. The count ticks up to the
// number the repo itself states, six of its real agent names fill in, and the
// one line you actually run types out at the bottom. Nothing invented: the
// names, the count and the command all come from github.com/wshobson/agents.
export const Library: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  count: number; unit: string; names: string[]; install: string; source?: string;
  beats?: { chips?: number; install?: number };
  perMs?: number;
}> = ({ tMs, w, h, fps, fromMs, count, unit, names, install, source, beats = {}, perMs = 130 }) => {
  const pad = 0.048 * w;
  const fs = 0.024 * w;
  const bigFs = 0.062 * w;
  const cmdFs = 0.027 * w;
  const icon = 0.042 * w;
  const cols = 2;
  const colW = (w - 2 * pad) / cols;
  const chipW = colW - 0.016 * w;
  const chipH = fs * 2.6;
  const at = { chips: beats.chips ?? fromMs + 420, install: beats.install ?? fromMs + 2600 };

  const sp = (ms: number) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 320, mass: 0.62 } });
  const n = Math.round(interpolate(tMs, [fromMs + 120, fromMs + 1200], [0, count], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typed = install.slice(0, Math.ceil(install.length * interpolate(tMs, [at.install, at.install + 900], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 0.02 * w }}>
        <div style={{ fontFamily: MONO_FONT, fontWeight: 600, fontSize: bigFs, lineHeight: 1, color: ACCENT }}>{n}</div>
        <div style={label(fs * 1.05, INK)}>{unit}</div>
        {source && <div style={{ marginLeft: "auto", fontFamily: MONO_FONT, fontSize: fs * 0.85, color: "rgba(255,255,255,0.42)" }}>{source}</div>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", width: w - 2 * pad, gap: 0.016 * w }}>
        {names.map((nm, i) => {
          const s = sp(at.chips + i * perMs);
          return (
            <div key={nm} style={{
              width: chipW, height: chipH, display: "flex", alignItems: "center", gap: 0.014 * w,
              paddingLeft: 0.014 * w, boxSizing: "border-box", borderRadius: 0.008 * w,
              border: "1px solid rgba(255,255,255,0.20)", backgroundColor: "rgba(255,255,255,0.055)",
              opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 0.016 * h}px)`,
            }}>
              <Mascot size={icon} glow={false} />
              <div style={{ fontFamily: MONO_FONT, fontSize: fs, color: INK, whiteSpace: "nowrap" }}>{nm}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 0.014 * w, height: cmdFs * 2.5,
        paddingLeft: 0.018 * w, borderRadius: 0.008 * w, border: `1px solid ${ACCENT}55`,
        backgroundColor: "rgba(224,120,80,0.10)",
      }}>
        <span style={{ fontFamily: MONO_FONT, fontSize: cmdFs, color: MUTED }}>{"$"}</span>
        <span style={{ fontFamily: MONO_FONT, fontSize: cmdFs, color: ACCENT, whiteSpace: "pre" }}>{typed}</span>
        {typed.length < install.length && tMs >= at.install && (
          <span style={{ display: "inline-block", width: cmdFs * 0.55, height: cmdFs, backgroundColor: ACCENT }} />
        )}
      </div>
    </div>
  );
};
