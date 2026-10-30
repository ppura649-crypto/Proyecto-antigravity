import React from "react";
import type { CardProps } from "../props";
import {
  BPaper, INK, BLUE, BAR_GREY, PAPER_INK, at, easeOut, springy, swell, heading,
} from "./BShared";

// V2 "Are you ACTUALLY more productive, or do you just FEEL MORE PRODUCTIVE?"
// Two bars on one baseline, one grammar, their words under them. The fact we do not have
// stops short at a third and wears a question mark; the feeling springs to the top in blue.
// No figures on the axis: the creator says no number here, so the card shows none.

export type FeelData = { left?: string[]; right?: string[] };

const W = 994, H = 490;          // the card's design grid in device px (wFrac .92 x hFrac .255)
const BASE_Y = 336;              // the one baseline both bars stand on
const BAR_MAX = 288;
const BAR_W = 296;
const L_CX = 282, R_CX = 712;    // the two bar centres
const PAD = 48;

export const BFeelBars: React.FC<CardProps & { data: FeelData }> = ({ tMs, w, beats, data }) => {
  const k = w / W;
  const P = (v: number) => v * k;
  const left = data.left ?? ["actually more", "productive"];
  const right = data.right ?? ["feel more", "productive"];

  const bProd = beats.productive ?? 3410;
  const bFeel = beats.feel ?? 4610;
  const bQ = beats.question ?? 4790;

  // the fact: it draws up and stops short at a third, then the ? settles on it
  const shortH = BAR_MAX / 3;
  const hL = shortH * easeOut(at(tMs, bProd, 380));
  const qIn = springy(at(tMs, bProd + 380, 300), 6.0, 7.2);
  const qPulse = swell(at(tMs, bQ, 420));

  // the feeling: it springs past the fact to the top of the card
  const hR = BAR_MAX * springy(at(tMs, bFeel, 520));

  const barCss = (cx: number, h: number, fill: string): React.CSSProperties => ({
    position: "absolute",
    left: P(cx - BAR_W / 2),
    top: P(BASE_Y - h),
    width: P(BAR_W),
    height: P(Math.max(0, h)),
    backgroundColor: fill,
  });

  const labelCss = (cx: number): React.CSSProperties => ({
    position: "absolute",
    left: P(cx - 230),
    top: P(BASE_Y + 26),
    width: P(460),
    textAlign: "center",
    ...heading(34, INK, 700),
    lineHeight: 1.22,
    whiteSpace: "normal",
  });

  return (
    <BPaper>
      <div style={barCss(L_CX, hL, BAR_GREY)} />
      <div style={barCss(R_CX, hR, BLUE)} />

      {/* the question mark sits on the short bar: the fact is not in evidence */}
      <div
        style={{
          position: "absolute",
          left: P(L_CX - 60),
          top: P(BASE_Y - shortH - 106),
          width: P(120),
          textAlign: "center",
          ...heading(104, INK, 800),
          letterSpacing: 0,
          lineHeight: 1,
          opacity: qIn,
          transform: `scale(${(0.7 + 0.3 * qIn) * (1 + 0.2 * qPulse)})`,
          transformOrigin: "50% 100%",
        }}
      >
        ?
      </div>

      {/* the one baseline */}
      <div
        style={{
          position: "absolute",
          left: P(PAD),
          top: P(BASE_Y),
          width: P(W - 2 * PAD),
          height: P(4),
          backgroundColor: PAPER_INK,
        }}
      />

      <div style={labelCss(L_CX)}>{left[0]}<br />{left[1]}</div>
      <div style={labelCss(R_CX)}>{right[0]}<br />{right[1]}</div>
    </BPaper>
  );
};
