import React from "react";
import type { CardProps } from "../props";
import { ACCENT, INK, LABEL_FONT, MONO_FONT } from "../theme";
import { at, comma, easeOut, lerp } from "./CKit";

// reference edit J V11 (kind `ctiny`), their word `tiny` proven by the real size of the thing.
// Three figures, each rolling up on the word that says it, what it counts under it, and
// nothing else on the card. The last one, the line count, is the one in the accent.
//   "tiny" 40685   1 file + lib/
//   "built" 41705  0 dependencies
//   "this." 42305  3,309 lines

export type CTinyFigure = { value: number; name: string; atMs: number; accent?: boolean };
export type CTinyData = { figures: CTinyFigure[] };

export const CTiny: React.FC<CardProps & { data: CTinyData }> = ({ tMs, w, h, data }) => {
  const s = w / 994;
  const figs = data.figures ?? [];
  const FS = 86 * s;
  const NS = 30 * s;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "stretch", width: w - 60 * s }}>
        {figs.map((f, i) => {
          const k = easeOut(at(tMs, f.atMs, 260));
          const roll = easeOut(at(tMs, f.atMs, 420));
          const v = comma(lerp(0, f.value, roll));
          return (
            <React.Fragment key={f.name}>
              {i > 0 && (
                <div style={{ width: 1, backgroundColor: INK, opacity: 0.16 * k, margin: `${10 * s}px ${8 * s}px` }} />
              )}
              <div style={{ flex: 1, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * 14 * s}px)` }}>
                <div
                  style={{
                    fontFamily: MONO_FONT, fontWeight: 700, fontSize: FS, lineHeight: 1,
                    color: f.accent ? ACCENT : INK, fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    marginTop: 22 * s, fontFamily: LABEL_FONT, fontSize: NS,
                    letterSpacing: "0.09em", textTransform: "uppercase", color: INK, whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
