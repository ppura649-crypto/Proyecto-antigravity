import React from "react";
import type { CardProps } from "../props";
import {
  BPaper, BMic, BKeys, BArrow, INK, BLUE, PAPER_RULE, PAPER_INK,
  at, springy, typed, sentence, heading,
} from "./BShared";

// V12 + V13, ONE object across two events: the two-row rule.
// V12 writes row 1 (`You know exactly what you want` -> TALK) and leaves row 2 empty under a
// hairline, so the slot is a promise. V13 is the hand-over: row 1 is already settled and only
// row 2 animates (`You're unsure` -> TYPE). The condition types letter by letter on its beat,
// the arrow draws itself, the verdict lands in blue with an overshoot.

export type RuleRow = {
  cond: string; verdict: string; glyph?: "mic" | "keys";
  typeBeat?: string; typeMs?: number;
  landBeat?: string; arrowMs?: number; landMs?: number;
};
export type RuleData = { rows?: RuleRow[]; live?: number };

const W = 994, H = 432;          // wFrac .92 x hFrac .225
const PAD_X = 48, PAD_Y = 30;
const ROW_H = 184;
const RULE_Y = 214;
const COND_X = 48, COND_W = 505;
const ARROW_X = 572, ARROW_W = 100;
const VERDICT_X = 700, GLYPH_BOX = 82;

const Row: React.FC<{
  row: RuleRow; P: (v: number) => number; state: "done" | "live" | "empty";
  tMs: number; beats: Record<string, number>;
}> = ({ row, P, state, tMs, beats }) => {
  if (state === "empty") return null;
  const done = state === "done";

  const tAt = beats[row.typeBeat ?? ""] ?? 0;
  const lAt = beats[row.landBeat ?? ""] ?? 0;
  const n = row.cond.length;
  const shown = done ? n : typed(tMs, tAt, row.typeMs ?? 690, n);
  const typing = !done && shown < n && tMs >= tAt;

  const arrowP = done ? 1 : at(tMs, lAt, row.arrowMs ?? 170);
  // the word lands a touch after the arrow reaches it, with a real overshoot
  const land = done ? 1 : springy(at(tMs, lAt + (row.arrowMs ?? 170) * 0.82, row.landMs ?? 280), 5.6, 7.6);

  return (
    <>
      <div
        style={{
          position: "absolute", left: P(COND_X), top: 0, height: "100%", width: P(COND_W),
          display: "flex", alignItems: "center",
        }}
      >
        <span style={{ ...sentence(32, 600, INK) }}>{row.cond.slice(0, shown)}</span>
        {typing && (
          <span
            style={{
              display: "inline-block", width: P(4), height: P(34),
              backgroundColor: PAPER_INK, marginLeft: P(4),
            }}
          />
        )}
      </div>

      <div
        style={{
          position: "absolute", left: P(ARROW_X), top: 0, height: "100%", width: P(ARROW_W),
          display: "flex", alignItems: "center", opacity: arrowP > 0 ? 1 : 0,
        }}
      >
        <BArrow w={P(ARROW_W)} p={arrowP} />
      </div>

      <div
        style={{
          position: "absolute", left: P(VERDICT_X), top: 0, height: "100%",
          display: "flex", alignItems: "center", gap: P(18),
          opacity: Math.min(1, land * 1.6),
          transform: `translateX(${P(16 * (1 - Math.min(1, land)))}px) scale(${0.82 + 0.18 * land})`,
          transformOrigin: "0% 50%",
        }}
      >
        <div style={{ width: P(GLYPH_BOX), display: "flex", justifyContent: "center" }}>
          {row.glyph === "keys" ? <BKeys w={P(76)} /> : <BMic h={P(74)} />}
        </div>
        <span style={{ ...heading(52, BLUE, 800) }}>{row.verdict}</span>
      </div>
    </>
  );
};

export const BRule: React.FC<CardProps & { data: RuleData }> = ({ tMs, w, beats, data }) => {
  const k = w / W;
  const P = (v: number) => v * k;
  const rows = data.rows ?? [];
  const live = data.live ?? 0;

  return (
    <BPaper>
      {rows.map((row, i) => (
        <div
          key={row.verdict}
          style={{
            position: "absolute", left: 0, right: 0,
            top: P(i === 0 ? PAD_Y : RULE_Y + 3),
            height: P(ROW_H),
          }}
        >
          <Row
            row={row} P={P} tMs={tMs} beats={beats}
            state={i < live ? "done" : i === live ? "live" : "empty"}
          />
        </div>
      ))}

      {/* the hairline that makes row 2 a slot rather than empty paper */}
      <div
        style={{
          position: "absolute", left: P(PAD_X), top: P(RULE_Y), width: P(W - 2 * PAD_X),
          height: P(3), backgroundColor: PAPER_RULE,
        }}
      />
    </BPaper>
  );
};

export const RULE_GRID = { W, H };
