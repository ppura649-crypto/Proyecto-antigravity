import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import { INK, MUTED, BAR_GREY, ACCENT, label, MONO_FONT } from "./theme";

const sprung = (frame: number, fps: number) =>
  spring({ frame, fps, config: { damping: 15, stiffness: 260, mass: 0.7 } });

// ---- BarsPick: real instruction lines, the agent icon drops to the easiest --
// beats: { barsIn, move, pick }; icon = public path of the agent icon
const RULES = [
  "NEVER commit directly to main, open a PR",
  "keep every function under 80 lines",
  "ALWAYS run the full test suite before pushing",
  "answer in English",
  "update the changelog on user-facing changes",
  "NEVER touch the migrations without approval",
];
const PICK_IDX = 3;

export const BarsPick: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: { barsIn: number; move: number; pick: number };
  icon: string;
}> = ({ tMs, w, h, fps, beats, icon }) => {
  const pad = 0.08 * w;
  const topPad = 0.16 * h;
  const rowH = (h - topPad - 0.07 * h) / RULES.length;
  const framesSince = (ms: number) => Math.max(0, ((tMs - ms) / 1000) * fps);

  const moveP = interpolate(tMs, [beats.move, beats.pick], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const iconRow = moveP * PICK_IDX;
  const picked = tMs >= beats.pick;
  const fs = 0.0215 * w;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", top: 0.055 * h, left: pad, ...label(0.023 * w) }}>
        instructions
      </div>
      {RULES.map((text, i) => {
        const inP = sprung(framesSince(beats.barsIn) - i * 2, fps);
        const isPick = i === PICK_IDX && picked;
        const pickP = isPick ? sprung(framesSince(beats.pick), fps) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: topPad + i * rowH,
              left: pad,
              width: w - 2 * pad - 0.12 * w,
              height: rowH,
              display: "flex",
              alignItems: "center",
              opacity: Math.min(1, inP * 1.4),
              transform: `translateX(${(1 - inP) * -18}px)`,
            }}
          >
            <div
              style={{
                padding: `${rowH * 0.16}px ${0.016 * w}px`,
                backgroundColor: isPick ? ACCENT : "transparent",
                transform: isPick ? `scale(${0.96 + 0.04 * pickP})` : undefined,
                transformOrigin: "left center",
                fontFamily: MONO_FONT,
                fontSize: fs,
                color: isPick ? "#141414" : INK,
                fontWeight: isPick ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ opacity: isPick ? 0.7 : 0.45 }}>- </span>
              {text}
            </div>
          </div>
        );
      })}
      <Img
        src={staticFile(icon)}
        style={{
          position: "absolute",
          right: pad * 0.45,
          top: topPad + iconRow * rowH + rowH / 2 - rowH * 0.95,
          height: rowH * 1.9,
          opacity: Math.min(1, framesSince(beats.move) / 3 + 0.35),
        }}
      />
    </div>
  );
};

// ---- TwoBar: prompt growth collapses, instruction following rises ----
// beats: { shrink, rise }   (real numbers from arXiv 2608.11095)
export const TwoBar: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: { shrink: number; rise: number };
}> = ({ tMs, w, h, fps, beats }) => {
  const pad = 0.1 * w;
  const floorY = h - pad * 1.5;
  const zone = floorY - pad * 1.7;
  const colW = 0.17 * w;
  const shrinkP = spring({ frame: Math.max(0, ((tMs - beats.shrink) / 1000) * fps), fps, config: { damping: 18, stiffness: 130 } });
  const riseP = spring({ frame: Math.max(0, ((tMs - beats.rise) / 1000) * fps), fps, config: { damping: 16, stiffness: 150 } });
  const leftH = interpolate(shrinkP, [0, 1], [0.86, 0.05]) * zone;
  const rightH = interpolate(riseP, [0, 1], [0.16, 0.66]) * zone;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const leftNum = interpolate(clamp01(shrinkP), [0, 1], [211.3, 1.4]);
  const rightNum = interpolate(clamp01(riseP), [0, 1], [0, 23.1]);
  const cx = (f: number) => f * w - colW / 2;

  const col = (x: number, bh: number, color: string, num: string, cap: string) => (
    <>
      <div style={{ position: "absolute", left: x, top: floorY - bh, width: colW, height: bh, backgroundColor: color }} />
      <div style={{ position: "absolute", left: x - colW, top: floorY - bh - 0.052 * w, width: colW * 3, textAlign: "center", ...label(0.03 * w, INK), fontVariantNumeric: "tabular-nums" }}>
        {num}
      </div>
      <div style={{ position: "absolute", left: x - colW, top: floorY + 14, width: colW * 3, textAlign: "center", ...label(0.02 * w, INK) }}>
        {cap}
      </div>
    </>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, height: 2, backgroundColor: "rgba(255,255,255,0.35)" }} />
      {col(cx(0.31), leftH, BAR_GREY, `+${leftNum.toFixed(1)}%`, "prompt growth")}
      {col(cx(0.71), rightH, ACCENT, `+${rightNum.toFixed(1)}%`, "instruction following")}
      <div style={{ position: "absolute", right: pad * 0.5, top: pad * 0.35, ...label(0.019 * w, MUTED) }}>
        arXiv 2608.11095
      </div>
    </div>
  );
};

// ---- Growth: a real-looking mini doc gains one line per observed failure ----
// beats: { fail1, add1, fail2, add2 }
export const Growth: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: { fail1: number; add1: number; fail2: number; add2: number };
}> = ({ tMs, w, h, fps, beats }) => {
  const docW = 0.32 * w;
  const docH = 0.76 * h;
  const docX = 0.16 * w;
  const docY = (h - docH) / 2;
  const framesSince = (ms: number) => Math.max(0, ((tMs - ms) / 1000) * fps);
  const lineH = docH * 0.052;
  const lineGap = docH * 0.118;
  const bars: { at: number }[] = [{ at: -1 }, { at: -1 }, { at: beats.add1 }, { at: beats.add2 }];
  const cross = (ms: number, cy: number) => {
    const s = sprung(framesSince(ms), fps);
    if (tMs < ms) return null;
    const sz = 0.08 * w;
    return (
      <div style={{ position: "absolute", left: 0.63 * w, top: cy, width: sz, height: sz, transform: `scale(${s})` }}>
        <div style={{ position: "absolute", left: 0, top: sz / 2 - 3, width: sz, height: 7, backgroundColor: ACCENT, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", left: 0, top: sz / 2 - 3, width: sz, height: 7, backgroundColor: ACCENT, transform: "rotate(-45deg)" }} />
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the prompt = a real-looking white document page */}
      <div style={{ position: "absolute", left: docX, top: docY, width: docW, height: docH, backgroundColor: "#f7f7f4", boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", left: docW * 0.1, top: docH * 0.06, fontFamily: MONO_FONT, fontSize: 0.017 * w, color: "#8a8a86" }}>
          SKILL.md
        </div>
        {bars.map((b, i) => {
          if (b.at > 0 && tMs < b.at) return null;
          const s = b.at > 0 ? sprung(framesSince(b.at), fps) : 1;
          const flashing = b.at > 0 && framesSince(b.at) < 10;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: docW * 0.1,
                top: docH * 0.18 + i * lineGap,
                width: docW * 0.78 * (i % 2 === 0 ? 1 : 0.62),
                height: lineH,
                backgroundColor: flashing ? ACCENT : b.at > 0 ? "#9a9a96" : "#d4d4d0",
                transform: `scaleX(${s})`,
                transformOrigin: "left center",
              }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: docX, top: docY - 0.052 * w, ...label(0.022 * w) }}>
        your prompt
      </div>
      {cross(beats.fail1, docY + docH * 0.16)}
      {cross(beats.fail2, docY + docH * 0.5)}
      <div style={{ position: "absolute", left: 0.63 * w, top: docY - 0.052 * w, ...label(0.022 * w) }}>
        observed failures
      </div>
    </div>
  );
};
