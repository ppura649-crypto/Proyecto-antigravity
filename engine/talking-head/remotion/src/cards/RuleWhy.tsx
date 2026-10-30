import React from "react";
import { Img, spring, staticFile } from "remotion";
import { INK, MUTED, ACCENT, label, MONO_FONT } from "./theme";

// Thesis card: the agent reads a rule, but "the why" and "the reasoning"
// slots stay empty, a "?" pops in each on its spoken word.
// beats: { why, reasoning }; icon = agent icon public path

const Slot: React.FC<{
  x: number; y: number; w: number; h: number; cw: number;
  title: string; at: number; tMs: number; fps: number;
}> = ({ x, y, w, h, cw, title, at, tMs, fps }) => {
  const f = Math.max(0, ((tMs - at) / 1000) * fps);
  const on = tMs >= at;
  const pop = spring({ frame: f, fps, config: { damping: 13, stiffness: 300, mass: 0.6 } });
  // glitch flicker for the first ~9 frames
  const flicker = on && f < 9 ? 0.55 + 0.45 * Math.abs(Math.sin(f * 2.7)) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ ...label(0.019 * cw, on ? INK : MUTED), marginBottom: 0.008 * cw, opacity: on ? 1 : 0.55 }}>
        {title}
      </div>
      <div
        style={{
          width: "100%",
          height: h - 0.045 * cw,
          border: on ? `2px dashed ${ACCENT}` : "2px dashed rgba(255,255,255,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: flicker,
        }}
      >
        {on && (
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 0.052 * cw,
              fontWeight: 700,
              color: ACCENT,
              transform: `scale(${0.7 + 0.3 * pop})`,
            }}
          >
            ?
          </span>
        )}
      </div>
    </div>
  );
};

export const RuleWhy: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: { why: number; reasoning: number };
  icon: string;
}> = ({ tMs, w, h, fps, beats, icon }) => {
  const pad = 0.07 * w;
  const bob = Math.sin((tMs / 1000) * 2.2) * 0.006 * h;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the rule, doc style */}
      <div style={{ position: "absolute", left: pad, top: 0.06 * h, fontFamily: MONO_FONT, fontSize: 0.016 * w, color: MUTED }}>
        frontend-ui/SKILL.md
      </div>
      <div style={{ position: "absolute", left: pad, top: 0.15 * h, fontFamily: MONO_FONT, fontSize: 0.023 * w, color: INK, whiteSpace: "nowrap" }}>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>- </span>
        <span style={{ color: ACCENT, fontWeight: 700 }}>NEVER</span> use raw SQL in the controllers
      </div>
      <div style={{ position: "absolute", left: pad, right: pad, top: 0.27 * h, height: 1.5, backgroundColor: "rgba(255,255,255,0.14)" }} />

      {/* the agent, reading */}
      <Img
        src={staticFile(icon)}
        style={{
          position: "absolute",
          left: pad + 0.01 * w,
          top: 0.42 * h + bob,
          height: 0.4 * h,
        }}
      />

      {/* what it can't see */}
      <Slot x={0.4 * w} y={0.34 * h} w={0.52 * w} h={0.27 * h} cw={w} title="the why" at={beats.why} tMs={tMs} fps={fps} />
      <Slot x={0.4 * w} y={0.65 * h} w={0.52 * w} h={0.27 * h} cw={w} title="the reasoning" at={beats.reasoning} tMs={tMs} fps={fps} />
    </div>
  );
};
