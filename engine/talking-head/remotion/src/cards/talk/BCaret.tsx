import React from "react";
import type { CardProps } from "../props";
import {
  BPaper, INK, BLUE, PAPER_INK, PAPER_FIELD, blink, typed, heading,
} from "./BShared";

// V14 "Because typing forces you to think about the FIRST NEXT STEP."
// An empty field and a caret, nothing else: the blank IS the claim. The caret blinks at 1 Hz
// while the creator says `typing`, STOPS on `think` (you are the one thinking now), and on
// `FIRST NEXT STEP` the first step types itself in blue and the caret waits behind it.

export type CaretData = { typed?: string };

const W = 994, H = 317;          // wFrac .92 x hFrac .165
const F_X = 48, F_Y = 50, F_W = 898, F_H = 216;
const TYPE_MS = 230;             // the whole payload, ~115 ms a glyph

export const BCaret: React.FC<CardProps & { data: CaretData }> = ({ tMs, w, fromMs, beats, data }) => {
  const k = w / W;
  const P = (v: number) => v * k;
  const text = data.typed ?? "1.";

  const bTyping = beats.typing ?? fromMs;
  const bThink = beats.think ?? fromMs + 1470;
  const bFirst = beats.first ?? fromMs + 2100;

  const shown = typed(tMs, bFirst, TYPE_MS, text.length);
  const doneAt = bFirst + TYPE_MS;

  // it blinks, it holds still while the creator says think, it blinks again once the step is down
  const on =
    tMs >= doneAt + 260 ? blink(tMs, doneAt + 260)
    : tMs >= bThink ? 1
    : blink(tMs, bTyping);

  return (
    <BPaper>
      <div
        style={{
          position: "absolute", left: P(F_X), top: P(F_Y), width: P(F_W), height: P(F_H),
          backgroundColor: PAPER_FIELD,
          border: `${P(3)}px solid ${PAPER_INK}`,
          boxSizing: "border-box",
          display: "flex", alignItems: "center",
          paddingLeft: P(42),
        }}
      >
        <span style={{ ...heading(70, BLUE, 800), letterSpacing: "0.01em" }}>
          {text.slice(0, shown)}
        </span>
        <div
          style={{
            width: P(7), height: P(88),
            backgroundColor: INK,
            marginLeft: P(shown > 0 ? 16 : 0),
            opacity: on,
          }}
        />
      </div>
    </BPaper>
  );
};

export const CARET_GRID = { W, H };
