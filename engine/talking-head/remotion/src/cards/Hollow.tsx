import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, CARD_BG, INK, label } from "./theme";

// "I think AI research is the most productive FEELING way OF doing nothing."
// One block, square and heavy, filled to the brim with terracotta: the picture
// of a full day's work. Then the level falls out of it, the surface wobbling on
// the way down, and nothing catches it: no spout, no pool, no particles. What is
// left is the same outline holding nothing. The word rides the fill line as it
// passes, dark where the block is still full and white over the empty part, so
// mid drain it is half of each. A solid block that turns out to be a shell.

// ease in out: the level lets go, runs, and settles on the floor
const ease = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

const DRAIN_MS = 420;
const SAMPLES = 28;   // points along the falling surface
const BIAS = 0.6;     // px of overlap so the two halves of the word leave no seam

export const Hollow: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  feels: string;
  beats: { drain: number };
}> = ({ tMs, w, h, fps, fromMs, feels, beats }) => {
  const bw = 0.80 * w;
  const bh = 0.74 * h;
  const bx = (w - bw) / 2;
  const by = (h - bh) / 2;
  const sw = 0.010 * w;
  const fs = 0.055 * w;
  const halo = 0.012 * w;

  // pops in hard, a hair past full size and back
  const pop = spring({
    frame: Math.max(0, ((tMs - fromMs) / 1000) * fps),
    fps,
    config: { damping: 9, stiffness: 340, mass: 0.6 },
  });

  // the level, and only the level, moves: from the brim to the floor
  const p = interpolate(tMs, [beats.drain, beats.drain + DRAIN_MS], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const surface = ease(p) * bh;
  // the falling surface wobbles, and is dead flat both before it starts and once
  // it is on the floor, so the empty shell holds still until the cut
  const amp = 0.022 * bh * Math.sin(Math.PI * p);
  const phase = tMs / 90;
  const yAt = (x: number): number =>
    Math.max(0, Math.min(bh, surface + amp * Math.sin((x / bw) * Math.PI * 4 + phase)));

  const wave = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = (i / SAMPLES) * bw;
    return { x, y: yAt(x) };
  });
  const pt = (x: number, y: number): string => `${x.toFixed(2)}px ${y.toFixed(2)}px`;
  // the word above the fill line, and the word under it, cut on the same wave
  const clipEmpty = `polygon(0px 0px, ${wave.map((q) => pt(q.x, q.y + BIAS)).join(", ")}, ${pt(bw, 0)})`;
  const clipFull = `polygon(${wave.map((q) => pt(q.x, q.y - BIAS)).join(", ")}, ${pt(bw, bh)}, ${pt(0, bh)})`;
  const fillPath = `M ${wave.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(" L ")} L ${bw} ${bh} L 0 ${bh} Z`;

  const word: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `0 ${sw + 0.030 * w}px`,
    textAlign: "center",
    lineHeight: 1.1,
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", left: bx, top: by, width: bw, height: bh,
        transformOrigin: "center center",
        transform: `scale(${0.86 + 0.14 * pop})`,
        opacity: Math.min(1, pop * 3),
        boxShadow: `0px 0px ${halo}px rgba(0,0,0,0.92), 0px 18px 46px rgba(0,0,0,0.5)`,
      }}>
        {/* the inside of the block: what is left once the level has gone */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0.94 }} />

        <svg width={bw} height={bh} style={{ position: "absolute", inset: 0 }}>
          <title>a block filled to the brim, emptying</title>
          <path d={fillPath} fill={ACCENT} />
        </svg>

        <div style={{ ...word, ...label(fs, INK), textShadow: `0px 0px ${halo}px rgba(0,0,0,0.92)`, clipPath: clipEmpty }}>
          {feels}
        </div>
        <div style={{ ...word, ...label(fs, CARD_BG), clipPath: clipFull }}>
          {feels}
        </div>

        <div style={{
          position: "absolute", inset: 0, boxSizing: "border-box", borderRadius: 0,
          border: `${sw}px solid ${INK}`,
        }} />
      </div>
    </div>
  );
};
