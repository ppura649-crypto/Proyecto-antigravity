// `why`: the test sheet. 898 boxes, one per task (facts.md: 198 of the 898 tasks never solved). The answered ones tick
// green in a diagonal sweep that ends on "198"; the empty ones are counted as the sweep passes them, so the counter
// lands on 198 exactly on its word, and they turn red. On "never" they pulse.
import React from "react";
import { ease, mix, pop, prog, useScene } from "../../../src/engine";
import { GOOD, RED, rand } from "./parts";

export const WHY_COLS = 34;
export const WHY_TOTAL = 898;
export const WHY_EMPTY = 198;
export const WHY_PITCH = 21;
const BOX = 16;
/** the sheet's own box, column coordinates, before it shrinks aside */
export const WHY_SHEET = { left: 60, top: 560, width: 780, height: 800 };
export const WHY_GRID = { x: 33, y: 104 }; // grid origin inside the sheet

/** the 198 tasks no model ever solved: a fixed, scattered choice */
export const WHY_EMPTY_SET: Set<number> = (() => {
  const idx = Array.from({ length: WHY_TOTAL }, (_, i) => i).sort((a, b) => rand(a, 7) - rand(b, 7));
  return new Set(idx.slice(0, WHY_EMPTY));
})();

export type WhyCues = {
  from: number; n198: number; never: number; test: number; so: number; looking: number; graded: number; answers: number;
  tests: number; files: number; stored: number; hf: number; face: number; to: number;
};

/** the frame the sweep reaches box i: a diagonal that finishes 2 frames before "198" */
export const whyFillAt = (c: WhyCues, i: number) => {
  const col = i % WHY_COLS;
  const row = Math.floor(i / WHY_COLS);
  const start = c.from + 2;
  const dur = Math.max(18, c.n198 - 2 - start);
  const key = (col + row * 1.25) / (WHY_COLS - 1 + 26 * 1.25);
  return Math.round(start + Math.min(1, key * 0.94 + rand(i, 3) * 0.06) * dur);
};

/** box centre inside the sheet */
export const whyBoxAt = (i: number) => ({
  x: WHY_GRID.x + (i % WHY_COLS) * WHY_PITCH + BOX / 2,
  y: WHY_GRID.y + Math.floor(i / WHY_COLS) * WHY_PITCH + BOX / 2,
});

const Box: React.FC<{ i: number; c: WhyCues }> = ({ i, c }) => {
  const { f } = useScene();
  const at = whyFillAt(c, i);
  const empty = WHY_EMPTY_SET.has(i);
  const p = whyBoxAt(i);
  const base: React.CSSProperties = { position: "absolute", left: p.x - BOX / 2, top: p.y - BOX / 2, width: BOX, height: BOX, borderRadius: 3 };
  if (!empty) {
    if (f < at) return <div style={{ ...base, boxShadow: "inset 0 0 0 1.5px #D5D8DE" }} />;
    const s = pop(f, at, { dur: 5, from: 0.4 });
    return (
      <div style={{ ...base, background: GOOD, ...s, color: "#FFFFFF", fontSize: 13, fontWeight: 900, lineHeight: `${BOX}px`, textAlign: "center" }}>✓</div>
    );
  }
  const red = prog(f, c.n198 + (i % 5), 5, ease.linear);
  const edge = f < at ? "#D5D8DE" : mix(f, c.n198 + (i % 5), 5, "#9AA0A8", RED);
  const fill = mix(f, c.n198 + (i % 5), 5, "#FFFFFF", "#FFC4BD");
  const wave = f >= c.never ? Math.max(0, Math.sin(((f - c.never) / 26) * Math.PI * 2 - (p.x + p.y) / 160)) : 0;
  const kick = f >= c.never ? 1 - prog(f, c.never, 12, ease.out) : 0;
  const sc = 1 + 0.35 * kick + 0.18 * wave;
  return (
    <div
      style={{
        ...base, background: fill, boxShadow: `inset 0 0 0 2px ${edge}${red > 0 ? `, 0 0 ${(6 + 10 * wave + 12 * kick).toFixed(1)}px ${RED}${red > 0.5 ? "AA" : "44"}` : ""}`,
        transform: `scale(${sc.toFixed(3)})`,
      }}
    />
  );
};

/** counts the empty boxes the sweep has passed: lands on 198 as "198" is said */
const Counter: React.FC<{ c: WhyCues }> = ({ c }) => {
  const { f, theme } = useScene();
  let n = 0;
  WHY_EMPTY_SET.forEach((i) => { if (f >= whyFillAt(c, i)) n++; });
  const hit = f >= c.n198;
  const col = hit ? mix(f, c.n198, 4, "#6B7280", RED) : "#6B7280";
  const bump = hit ? 1 + 0.12 * (1 - prog(f, c.n198, 10, ease.out)) : 1;
  const nev = f >= c.never ? prog(f, c.never, 8) : 0;
  return (
    <div style={{ position: "absolute", left: 33, right: 33, top: 690, height: 90, display: "flex", alignItems: "center", gap: 22, borderTop: "2px solid #ECEEF1", paddingTop: 12 }}>
      <div style={{ fontFamily: theme.font.ui, fontSize: 84, fontWeight: 800, color: col, transform: `scale(${bump.toFixed(3)})`, transformOrigin: "left center", fontVariantNumeric: "tabular-nums", minWidth: 170 }}>{n}</div>
      <div style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 700, lineHeight: 1.15, color: "#111" }}>
        <div>tasks</div>
        <div style={{ color: nev > 0 ? mix(f, c.never, 6, "#111111", RED) : "#111", opacity: 0.35 + 0.65 * nev }}>never solved</div>
      </div>
    </div>
  );
};

/** the sheet itself: a sheet of paper with a header, the grid, the counter */
export const WhySheetPaper: React.FC<{ c: WhyCues }> = ({ c }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WHY_SHEET.width, height: WHY_SHEET.height, borderRadius: 18, background: "linear-gradient(180deg,#FFFFFF,#F7F8FA)", boxShadow: "0 30px 60px rgba(15,23,42,0.16), 0 6px 14px rgba(15,23,42,0.08), inset 0 0 0 1px #E4E7EC" }}>
      <div style={{ position: "absolute", left: 33, right: 33, top: 26, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: theme.font.ui }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#0B0B0B", letterSpacing: 1 }}>THE TEST</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#6B7280" }}>898 tasks</div>
      </div>
      {Array.from({ length: WHY_TOTAL }, (_, i) => <Box key={i} i={i} c={c} />)}
      <Counter c={c} />
    </div>
  );
};
