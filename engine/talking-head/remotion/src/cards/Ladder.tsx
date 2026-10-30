import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, CARD_BG, INK, MONO_FONT, label } from "./theme";

// V6b "SemiAnalysis, the most trusted independent semiconductor research shop": their
// ask (2026-09-05) for "a hierarchy or like a ladder with top 1 top 2 and 3 between
// the three independent research", then "just logo and name". A podium on the black
// card: three blocks rise on MOST / TRUSTED, rank 1 in the centre and tallest, each
// with its rank digit on the block and the outlet's real mark and name above it.
// Only rank 1 wears the accent. The order is by Substack subscribers read the day of
// the build (visual-plan.md); the numbers stay in the plan, not on the card.
// assets: the marks, rank 1 first. beats: { rung3, rung2, rung1 }

export type LadderData = {
  title: string;
  rungs: { name: string }[]; // rank 1 first
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const Ladder: React.FC<CardProps & { data: LadderData }> = ({ tMs, w, h, fps, fromMs, beats, assets, data }) => {
  const padX = 0.040 * w;
  const titleFs = 0.026 * w;
  const nameFs = 0.028 * w;
  const rankFs = 0.080 * w;

  const colW = 0.26 * w, gap = 0.04 * w;
  const x0 = (w - (3 * colW + 2 * gap)) / 2;
  const base = 0.90 * h;
  const heights = [0.42 * h, 0.30 * h, 0.22 * h]; // rank 1, 2, 3
  const slots = [1, 0, 2]; // column order left to right: rank 2, rank 1, rank 3
  const beatOf = [beats.rung1 ?? fromMs + 120, beats.rung2 ?? fromMs + 60, beats.rung3 ?? fromMs];
  const logoBox = 0.105 * w;

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 16, stiffness: 260, mass: 0.7 } });
  const headIn = ramp(fromMs, fromMs + 200);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: padX, top: 0.060 * h, opacity: headIn, ...label(titleFs, INK), whiteSpace: "nowrap" }}>
        {data.title}
      </div>

      {slots.map((rank, col) => {
        const rung = data.rungs[rank];
        if (!rung) return null;
        const p = sp(beatOf[rank]);
        const rise = Math.min(1, p);
        const bh = heights[rank] * rise;
        const x = x0 + col * (colW + gap);
        const top = base - bh;
        const textOp = clamp01((p - 0.35) * 2.2);
        const words = rung.name.split(" ");
        const lines = words.length > 1 && rung.name.length > 11
          ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")]
          : [rung.name];
        const isTop = rank === 0;
        const mark = assets[rank];
        return (
          <div key={rank} style={{ position: "absolute", left: x, width: colW, top: 0, height: h }}>
            {/* the real mark, frameless, then the name, stacked on the block's top edge */}
            <div
              style={{
                position: "absolute", left: 0, width: colW, bottom: h - (base - heights[rank]) + 0.022 * h,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 0.020 * h, opacity: textOp,
                transform: `translateY(${(1 - Math.min(1, p)) * 0.04 * h}px)`,
              }}
            >
              {mark ? (
                <Img
                  src={staticFile(mark)}
                  style={{ width: logoBox, height: logoBox, objectFit: "contain", filter: "drop-shadow(0px 3px 10px rgba(0,0,0,0.6))" }}
                />
              ) : null}
              <div style={{ ...label(nameFs, isTop ? ACCENT : INK), textAlign: "center", lineHeight: 1.15 }}>
                {lines.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
            {/* the block, with its rank on it */}
            <div style={{
              position: "absolute", left: 0, top, width: colW, height: bh,
              backgroundColor: isTop ? ACCENT : BAR_GREY, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", left: 0, width: colW, top: 0.030 * h, textAlign: "center",
                fontFamily: MONO_FONT, fontSize: rankFs, fontWeight: 700, lineHeight: 1,
                color: isTop ? CARD_BG : INK, opacity: rise,
              }}>
                {rank + 1}
              </div>
            </div>
          </div>
        );
      })}

      {/* the base line the podium stands on */}
      <div style={{ position: "absolute", left: padX, right: padX, top: base, height: 0.006 * h, backgroundColor: INK, opacity: headIn }} />
    </div>
  );
};
