import React from "react";
import { spring } from "remotion";
import { ACCENT, CARD_BG, INK, label } from "./theme";

// "So you START SEEING OPPORTUNITIES that feel possible EVERYWHERE."
// One idea per chip, always on ONE line and always whole: a chip is measured to
// its own label, packed into a row that can hold it, and never crosses the card
// bounds, so nothing is ever wrapped, sliced or half-drawn. The field BLOOMS from
// the middle outward at one steady cadence across the whole sentence, so every
// intermediate frame is a composed cluster growing, and the last chip lands well
// before the cut. (the guest 2026-09-05: the old build put a scattered first pass at
// 90 ms and then dropped the back half as one burst on EVERYWHERE - "a few chips
// appear in an awkward arrangement, then a large cluster catches up near the end".
// A first pass spread over the whole box is exactly what makes one or two chips
// read as misplaced; a centre-out bloom never does.)
// Frameless, and their wall is bright cream: a chip is a SOLID near-black plate with
// a terracotta outline on it, never an outline on bare footage.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const DROP = "0px 6px 26px rgba(0,0,0,0.7)";
const PLATE = 0.92; // these chips ARE the card: solid black, white text, no border

// deterministic hash in [0,1). The field has to be identical on every frame and
// every re-render, so nothing here is random.
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Chip = { cx: number; cy: number; bw: number; fs: number; text: string };

export const Opportunities: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  ideas: string[];
  beats: { start: number; everywhere: number; last?: number };
}> = ({ tMs, w, h, fps, ideas, beats }) => {
  const fsMax = 0.034 * w;
  const fsMin = 0.020 * w;
  const padX = 0.016 * w;
  const padY = 0.0115 * h;
  const gap = 0.026 * w;
  const stroke = 0.007 * w;
  // a 0-offset halo backs every edge, the offset drop lifts the chip off the wall
  const halo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92)`;
  const mX = 0.010 * w;
  const mY = 0.012 * h;
  const usableW = w - 2 * mX;
  const usableH = h - 2 * mY;
  const maxChipW = 0.94 * w;

  // width of one uppercase tracked label, in em, estimated generously so a chip is
  // never narrower than its own text. Only a label too wide for the whole card
  // shrinks, and it shrinks rather than wrapping.
  const advance = (t: string): number => {
    let em = 0;
    for (const ch of t) em += ch === " " ? 0.40 : 0.86;
    return Math.max(1, em);
  };
  const chipOf = (t: string): { fs: number; bw: number } => {
    const em = advance(t);
    const fs = Math.max(fsMin, Math.min(fsMax, (maxChipW - 2 * padX) / em));
    return { fs, bw: em * fs + 2 * padX };
  };

  const chipH = fsMax * 1.30 + 2 * padY;
  const nRows = Math.max(1, Math.floor((usableH + gap) / (chipH + gap)));
  const pitch = nRows > 1 ? (usableH - chipH) / (nRows - 1) : 0;

  // pack each row with whole chips only: a chip that would cross the right edge
  // starts the next row instead. The slack left over shifts the row sideways, so
  // the rows stagger against each other rather than tiling.
  const chips: Chip[] = [];
  const byRow: number[][] = [];
  let k = 0;
  for (let r = 0; r < nRows && ideas.length > 0; r++) {
    const cy = mY + chipH / 2 + r * pitch;
    const row: { text: string; fs: number; bw: number }[] = [];
    let used = 0;
    for (;;) {
      const text = ideas[k % ideas.length];
      const c = chipOf(text);
      const next = row.length === 0 ? c.bw : used + gap + c.bw;
      if (next > usableW) break;
      row.push({ text, fs: c.fs, bw: c.bw });
      used = next;
      k++;
    }
    if (row.length === 0) break;
    let cur = mX + (usableW - used) * (0.25 + 0.50 * rnd(r * 31 + 5));
    const idxs: number[] = [];
    for (const c of row) {
      idxs.push(chips.length);
      chips.push({ cx: cur + c.bw / 2, cy, bw: c.bw, fs: c.fs, text: c.text });
      cur += c.bw + gap;
    }
    byRow.push(idxs);
  }

  // land order: nearest the middle of the box first, so the field is always a
  // cluster spreading outward and never a lone chip parked off to one side. The
  // distance is measured in card fractions, not pixels, so a wide short box blooms
  // evenly in both directions; a small deterministic wobble keeps the ring from
  // reading as a machine drawing circles.
  const radius = (i: number) => {
    const dx = (chips[i].cx - w / 2) / w;
    const dy = (chips[i].cy - h / 2) / h;
    return Math.hypot(dx, dy) + 0.05 * rnd(i * 17 + 3);
  };
  const order = chips.map((_, i) => i).sort((p, q) => radius(p) - radius(q));

  // one steady cadence across the whole sentence: first chip on the card's own
  // first frame, last chip on `last`, nothing bunched at either end
  const first = beats.start;
  const last = beats.last ?? beats.everywhere;
  const step = chips.length > 1 ? (last - first) / (chips.length - 1) : 0;
  const at = new Array<number>(chips.length).fill(0);
  order.forEach((idx, i) => {
    at[idx] = first + i * step;
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {chips.map((c, i) => {
        if (tMs < at[i]) return null;
        // hard spring, slight overshoot, and it is simply not there before it lands
        const s = spring({
          frame: Math.max(0, ((tMs - at[i]) / 1000) * fps),
          fps,
          config: { damping: 11, stiffness: 420, mass: 0.55 },
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.cx - c.bw / 2,
              top: c.cy - chipH / 2,
              width: c.bw,
              height: chipH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              transform: `scale(${s})`,
              
              borderRadius: 0,
              boxShadow: `${halo}, ${DROP}`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: PLATE }} />
            <div style={{
              ...label(c.fs, INK), position: "relative",
              whiteSpace: "nowrap", lineHeight: 1, textShadow: `${halo}, ${SHADOW}`,
            }}>
              {c.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};
