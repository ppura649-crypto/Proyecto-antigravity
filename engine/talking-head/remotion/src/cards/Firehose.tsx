import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, CARD_BG, INK, MONO_FONT, label } from "./theme";

// "Because now with AI, you can pretty much get ANY DATA at..."
// One question goes in at the top and the answer never stops coming out of the
// bottom of it. Each answer is a solid card, readable on its own, but they
// arrive faster than anyone can take them in, fan across the whole frame and
// run off the bottom edge. Nothing settles and nothing totals up, because the
// point is the volume, not any one of them.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const BOX_SHADOW = "0px 6px 26px rgba(0,0,0,0.7)";

// deterministic scatter: no Math.random, so every render is identical
const rnd = (i: number): number => {
  const s = Math.sin(i * 91.7 + 47.13) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const PERIOD = 120;  // ms between answers
const LIFE = 1440;   // ms from the spout to past the bottom edge: ~12 on screen

export const Firehose: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  question: string;
  chips: string[];
  beats: { ask: number; burst: number };
}> = ({ tMs, w, h, fps, question, chips, beats }) => {
  const qFs = 0.04 * w;
  const qPadX = 0.03 * w;
  const qPadY = 0.02 * w;
  const bw = 0.007 * w;
  const boxH = qFs + 2 * qPadY + 2 * bw;
  const boxTop = 0.03 * h;
  const spoutH = 0.03 * h;
  const originY = boxTop + boxH + spoutH;

  const cFs = 0.03 * w;
  const cPadX = 0.018 * w;
  const cPadY = 0.013 * w;
  const cbw = 0.004 * w;

  const ask = spring({
    frame: Math.max(0, ((tMs - beats.ask) / 1000) * fps),
    fps,
    config: { damping: 14, stiffness: 300, mass: 0.7 },
  });
  const spout = interpolate(tMs, [beats.burst - 120, beats.burst + 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // the stream never settles: it is driven by the clock, so it keeps arriving
  const stream: React.ReactElement[] = [];
  if (chips.length > 0) {
    const emitted = Math.floor((tMs - beats.burst) / PERIOD);
    const first = Math.max(0, emitted - Math.ceil(LIFE / PERIOD));
    for (let k = first; k <= emitted; k++) {
      const p = (tMs - (beats.burst + k * PERIOD)) / LIFE;
      if (p <= 0 || p >= 1) continue;
      const sway = rnd(k * 3 + 1) * 2 - 1;
      const fall = 0.8 + 0.35 * rnd(k * 5 + 2);
      const x = w / 2 + sway * 0.46 * w * Math.pow(p, 0.7);
      const y = originY + (1.08 * h - originY) * Math.pow(p, 0.92) * fall;
      const op = Math.min(1, p * 10) * (1 - clamp01((y - 0.86 * h) / (0.22 * h))) * (1 - clamp01((p - 0.9) / 0.1));
      if (op <= 0.01) continue;
      stream.push(
        <div
          key={k}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${0.82 + 0.18 * Math.min(1, p * 8)})`,
            padding: `${cPadY}px ${cPadX}px`,
            
            borderRadius: 0,
            boxShadow: BOX_SHADOW,
            fontFamily: MONO_FONT,
            fontSize: cFs,
            lineHeight: 1,
            color: INK,
            whiteSpace: "nowrap",
            textShadow: SHADOW,
            opacity: op,
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0.88 }} />
          <span style={{ position: "relative" }}>{chips[k % chips.length]}</span>
        </div>
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {stream}

      {/* the spout: everything comes out of the bottom of the one question */}
      {spout > 0 && (
        <div
          style={{
            position: "absolute",
            left: w / 2 - 0.004 * w,
            top: boxTop + boxH,
            width: 0.008 * w,
            height: spoutH,
            backgroundColor: ACCENT,
            opacity: 0.95 * spout,
            boxShadow: BOX_SHADOW,
          }}
        />
      )}

      {/* the one question */}
      {ask > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: boxTop,
            width: w,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${(1 - ask) * -0.05 * h}px)`,
            opacity: Math.min(1, ask * 2),
          }}
        >
          <div
            style={{
              position: "relative",
              height: boxH,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              padding: `0 ${qPadX}px`,
              
              borderRadius: 0,
              boxShadow: BOX_SHADOW,
              maxWidth: 0.94 * w,
            }}
          >
            <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0.88 }} />
            <span style={{ ...label(qFs, ACCENT), position: "relative", lineHeight: 1, whiteSpace: "nowrap", textShadow: SHADOW }}>
              {question}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
