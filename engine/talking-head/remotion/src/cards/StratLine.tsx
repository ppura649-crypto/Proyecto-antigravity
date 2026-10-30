import React from "react";
import { interpolate } from "remotion";
import type { CardProps } from "./props";
import { MONO_FONT } from "./theme";

// "the awesome part is there's NO PAID SUBSCRIPTION." - so the card is the
// founders' own STRATEGY.md, open on the line that says it. Line 44 is one long
// markdown paragraph and the editor is scrolled into the middle of it: four of
// its wrapped rows, dimmed, and then the sentence the reel is about, on its own
// row, big enough to read on a phone. The gutter carries 44 on the first visible
// row and nothing under it, which is what a scrolled editor shows. A terracotta
// highlighter draws across that sentence from its left edge, reaches "never a
// subscription." on the word NO, and finishes over it while the file dims away.
// Every character is the real file's (~/frame/STRATEGY.md line 44, 2026-09-13).

export type StratLineData = {
  file: string;
  lineNo: number;
  before: string[];
  line: string;
  lift: string;
};

const INK_D = "#1F1E1D";
const MUTED_D = "#73726C";
const HAIR = "#E8E5DD";
const NUM = "#B4B1A8";
const TERRA = "#D97757";
const ADV = 0.602;      // the monospace advance actually rendered, in em
const ADV_FIT = 0.606;  // a hair more, so sizing never rounds the line past the card
const CONTEXT = 4;      // wrapped rows of the paragraph kept above the target line

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));

// soft-wrap on word boundaries, exactly the columns the editor would break at
const wrap = (text: string, cols: number): string[] => {
  const out: string[] = [];
  let row = "";
  for (const word of text.split(" ")) {
    if (row.length === 0) row = word;
    else if (row.length + 1 + word.length <= cols) row += " " + word;
    else { out.push(row); row = word; }
  }
  if (row.length) out.push(row);
  return out;
};

export const StratLine: React.FC<CardProps & { data: StratLineData }> = ({
  tMs, w, h, fromMs, beats, data,
}) => {
  const PAD = Math.round(0.008 * w);        // 8
  const PAD_V = Math.round(0.052 * h);      // 24
  const GUT = Math.round(0.032 * w);        // 33
  const CHIP_H = Math.round(0.095 * h);     // 44
  const textX = PAD + GUT;
  const textW = w - PAD - textX;
  // the type is set by the one line that must read: it takes the whole measure,
  // so nothing else on the card can push it below the size a phone can hold
  const FS = Math.max(28, Math.min(46, Math.floor(textW / (data.line.length * ADV_FIT))));
  const LINE_H = Math.round(FS * 1.44);
  const NUM_FS = Math.round(FS * 0.52);
  const cols = Math.floor(textW / (FS * ADV));
  const ch = FS * ADV;

  // the file's own text, scrolled: the last four wrapped rows of the paragraph,
  // then the sentence the reel is about on its own row
  const head = data.before.join(" ").trim();
  const rows = [...wrap(head, cols).slice(-CONTEXT), data.line];
  const target = rows.length - 1;
  const liftAt = data.line.indexOf(data.lift);
  const liftX = (liftAt < 0 ? data.line.length : liftAt) * ch;
  const endX = data.line.length * ch;

  // the block sits centred in what the filename chip leaves
  const chipBottom = PAD_V + CHIP_H;
  const bodyTop = chipBottom + Math.max(0, (h - chipBottom - PAD_V - rows.length * LINE_H) * 0.42);

  // the highlighter: the row's left edge to the lift on NO, over the lift by the
  // time the word SUBSCRIPTION is said, then settled
  const b = beats as Record<string, number>;
  const tIs = b.is ?? fromMs + 540;
  const tNo = b.no ?? tIs + 540;
  const tSub = b.subscription ?? tNo + 240;
  const sweep = tMs < tNo
    ? interpolate(tMs, [tIs, tNo], [0, liftX], clamp)
    : interpolate(tMs, [tNo, Math.max(tNo + 120, tSub)], [liftX, endX], clamp);

  const lit = interpolate(tMs, [tNo, tNo + 180], [0, 1], clamp);   // the lift words come up
  const dim = 0.55 - 0.23 * lit;                                    // the file falls back

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#FFFFFF" }}>
      {/* the file this is */}
      <div
        style={{
          position: "absolute", right: PAD + Math.round(0.006 * w), top: PAD_V,
          height: Math.round(CHIP_H * 0.78),
          display: "flex", alignItems: "center", gap: Math.round(0.010 * w),
          padding: `0 ${Math.round(0.014 * w)}px`, boxSizing: "border-box",
          border: `1px solid ${HAIR}`, backgroundColor: "#FBFAF7",
        }}
      >
        <svg width={NUM_FS} height={NUM_FS} viewBox="0 0 24 24" style={{ flex: "none", display: "block" }}>
          <title>markdown file</title>
          <path d="M5 2 H14 L19 7 V22 H5 Z" fill="none" stroke={MUTED_D} strokeWidth={1.9} />
          <path d="M14 2 V7 H19" fill="none" stroke={MUTED_D} strokeWidth={1.9} />
        </svg>
        <span style={{ fontFamily: MONO_FONT, fontSize: NUM_FS, color: MUTED_D, whiteSpace: "nowrap" }}>
          {data.file}
        </span>
      </div>

      {/* the gutter rule */}
      <div
        style={{
          position: "absolute", left: textX - Math.round(0.011 * w), top: bodyTop - 6,
          width: 1, height: rows.length * LINE_H + 12, backgroundColor: HAIR,
        }}
      />

      {rows.map((row, i) => {
        const rowTop = bodyTop + i * LINE_H;
        const on = p01((tMs - fromMs - i * 12) / 110);
        const isTarget = i === target;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: rowTop, width: w, height: LINE_H, opacity: on }}>
            {/* the line number, once, on the row the line really starts on */}
            {i === 0 && (
              <div
                style={{
                  position: "absolute", left: PAD, top: 0, width: GUT - Math.round(0.006 * w),
                  height: LINE_H, display: "flex", alignItems: "center", justifyContent: "flex-end",
                  fontFamily: MONO_FONT, fontSize: NUM_FS, color: NUM,
                }}
              >
                {data.lineNo}
              </div>
            )}

            {/* the highlighter, under the words */}
            {isTarget && sweep > 0 && (
              <div
                style={{
                  position: "absolute", left: textX - 3, top: Math.round(LINE_H * 0.10),
                  width: sweep + 6, height: Math.round(LINE_H * 0.82),
                  backgroundColor: TERRA, opacity: 0.26,
                }}
              />
            )}

            <div
              style={{
                position: "absolute", left: textX, top: 0, height: LINE_H,
                display: "flex", alignItems: "center",
                fontFamily: MONO_FONT, fontSize: FS, whiteSpace: "pre", letterSpacing: 0,
              }}
            >
              {isTarget ? (
                <>
                  <span style={{ color: INK_D, opacity: 0.55 + 0.20 * lit }}>{data.line.slice(0, liftAt)}</span>
                  <span style={{ color: INK_D, opacity: 0.55 + 0.45 * lit, fontWeight: lit > 0.5 ? 700 : 400 }}>
                    {data.line.slice(liftAt)}
                  </span>
                </>
              ) : (
                <span style={{ color: INK_D, opacity: dim }}>{row}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
