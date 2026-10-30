// "turns each one into a list of numbers. Then, layer after layer, it multiplies those numbers by its weights."
// Each chip drops its real embedding (first 6 of 1024 values) as a column; the columns fall through a stack of the
// model's 28 layers, each layer flashing as they cross it; then one layer opens: a column times a slice of real
// layer-0 weights equals a new column, worked out on screen (the arithmetic is exact for the numbers shown).
import React from "react";
import { blurIn, blurOut, countTo, ease, on, pop, prog, stagger, useScene } from "../../../src/engine";
import { EMBED, LAYERS, QWEN, TOKEN_HUES, W_BEFORE, fmt } from "./parts";
import { lerp, rowX, useT } from "./InsideRow";

const COL_TOP = 712;
const CELL_H = 40;
const STACK = { top: 1086, pitch: 11, w: 780, h: 120 };
const plateY = (i: number) => STACK.top + i * STACK.pitch; // plate 0 is the first layer, at the top
const FALL = 640; // how far the columns fall through the stack

/** the plain-words label under whatever is on stage: one slot, it changes words, never stacks */
const Label: React.FC<{ at: number; out: number; children: React.ReactNode }> = ({ at, out, children }) => {
  const { f, theme, ground } = useScene();
  if (f < at || f > out + 8) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 968, textAlign: "center", fontFamily: theme.font.ui, fontSize: 44, fontWeight: 600, color: ground.ink, ...(f < out ? blurIn(f, at, { dur: 8, rise: 12 }) : blurOut(f, out, { dur: 7 })) }}>
      {children}
    </div>
  );
};

/** the 7 columns of real numbers, one under each chip; on the second "layer" they fall through the stack */
export const Columns: React.FC = () => {
  const { f, theme } = useScene();
  const T = useT();
  if (f < T.list - 12 || f > T.pass + 44) return null;
  const fall = prog(f, T.pass, 36, ease.in);
  return (
    <>
      {EMBED.map((col, i) => (
        <div key={i} style={{ position: "absolute", left: rowX(i) - 58, top: COL_TOP + fall * FALL, width: 116, borderRadius: 8, background: `${TOKEN_HUES[i]}1F`, opacity: prog(f, T.list - 10 + i * 3, 6) * (1 - prog(f, T.pass + 26, 10, ease.linear)) }}>
          {col.map((v, k) => (
            <div
              key={k}
              style={{
                height: CELL_H, lineHeight: `${CELL_H}px`, textAlign: "center", fontFamily: theme.font.mono, fontSize: 26, fontWeight: 700, // texture
                color: TOKEN_HUES[i], whiteSpace: "pre", fontVariantNumeric: "tabular-nums",
                ...blurIn(f, stagger(T.list - 10 + i * 3, k, 3), { dur: 7, rise: -22 }),
                filter: fall > 0.02 ? `blur(${Math.min(9, fall * 22).toFixed(1)}px)` : blurIn(f, stagger(T.list - 10 + i * 3, k, 3), { dur: 7, rise: -22 }).filter,
              }}
            >
              {fmt(v, 4)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

/** the 28 layers as a pile of thin plates; each one flashes as the falling columns cross it */
export const Stack: React.FC = () => {
  const { f } = useScene();
  const T = useT();
  if (f < T.layer - 4 || f > T.mult + 12) return null;
  const front = COL_TOP + 6 * CELL_H + prog(f, T.pass, 36, ease.in) * FALL; // bottom edge of the falling columns
  const gone = prog(f, T.mult - 2, 9, ease.in);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1400, perspectiveOrigin: "540px 700px", opacity: 1 - gone, filter: gone > 0 ? `blur(${(gone * 12).toFixed(1)}px)` : undefined }}>
      {Array.from({ length: LAYERS }, (_, i) => {
        const y = plateY(i);
        const cross = f >= T.pass && front >= y + STACK.h / 2 - 20;
        // the frame this plate was crossed: flash, then decay over ~6 frames
        let hit = 0;
        if (cross) {
          let fc = T.pass;
          while (fc < f && COL_TOP + 6 * CELL_H + prog(fc, T.pass, 36, ease.in) * FALL < y + STACK.h / 2 - 20) fc++;
          hit = Math.exp(-(f - fc) / 6);
        }
        const inn = prog(f, T.layer - 4 + (LAYERS - 1 - i) * 0.5, 8, ease.out);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - STACK.w / 2, top: y - STACK.h / 2 + (1 - inn) * 40, width: STACK.w, height: STACK.h, borderRadius: 10,
              transform: "rotateX(66deg)", opacity: inn, zIndex: i,
              background: `rgba(97,92,237,${(0.16 + 0.6 * hit).toFixed(3)})`,
              boxShadow: `inset 0 0 0 2px rgba(${hit > 0.3 ? "236,235,255" : "150,146,255"},${(0.55 + 0.45 * hit).toFixed(3)})`,
            }}
          />
        );
      })}
    </div>
  );
};

/** the label slot: "a list of numbers", then "28 layers" (counting the layer being crossed) */
export const LayerLabels: React.FC = () => {
  const { f } = useScene();
  const T = useT();
  const crossing = f >= T.pass && f < T.pass + 36;
  const n = Math.max(1, Math.min(LAYERS, Math.round(prog(f, T.pass + 4, 30, ease.in) * LAYERS)));
  return (
    <>
      <Label at={T.list + 12} out={T.layer - 4}>a list of numbers</Label>
      <Label at={T.layer + 2} out={T.mult - 2}>
        {crossing ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            layer {n} <span style={{ opacity: 0.5 }}>of {LAYERS}</span>
          </span>
        ) : (
          `${LAYERS} layers`
        )}
      </Label>
    </>
  );
};

// the worked multiplication: the last chip's column x (" to"), three rows of real layer-0 weights, and x·w for each
const X = EMBED[6];
const WROWS = W_BEFORE.slice(0, 3);
const OUT = WROWS.map((w) => w.reduce((s, v, k) => s + v * X[k], 0));
const PANEL = { left: 90, top: 736, w: 900, h: 560 };
const MC = { cell: 132, rowH: 50, y: 150 }; // inside the panel

/** one layer opens into a panel: numbers × weights = new numbers, each result computed on screen */
export const MulPanel: React.FC = () => {
  const { f, theme, ground } = useScene();
  const T = useT();
  if (f < T.mult - 4 || f > T.along + 12) return null;
  const open = prog(f, T.mult - 4, 16, ease.out);
  const sweep = (j: number) => T.mult + 26 + j * 20;
  const body = f < T.along ? blurIn(f, T.mult + 6, { dur: 8 }) : blurOut(f, T.along, { dur: 9 });
  const mono: React.CSSProperties = { fontFamily: theme.font.mono, fontSize: 30, fontWeight: 700, whiteSpace: "pre", fontVariantNumeric: "tabular-nums", height: MC.rowH, lineHeight: `${MC.rowH}px`, textAlign: "center", width: MC.cell };
  const sign = (s: string, x: number) => <div style={{ position: "absolute", left: x, top: MC.y + 3 * MC.rowH - 40, fontFamily: theme.font.ui, fontSize: 64, fontWeight: 600, color: ground.dim }}>{s}</div>;
  const under = (s: string, x: number, w: number, c: string, at: number) => (
    <div style={{ position: "absolute", left: x, width: w, top: MC.y + 6 * MC.rowH + 26, textAlign: "center", fontFamily: theme.font.ui, fontSize: 36, fontWeight: 600, whiteSpace: "nowrap", color: c, ...blurIn(f, at, { dur: 8, rise: 10 }) }}>{s}</div>
  );
  const gx = 226;
  const glowW = on(f, T.weights) ? Math.exp(-(f - T.weights) / 14) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1400, perspectiveOrigin: "540px 700px" }}>
      <div
        style={{
          position: "absolute", left: lerp(540 - 390, PANEL.left, open), top: lerp(1040 - 60, PANEL.top, open), width: lerp(780, PANEL.w, open), height: lerp(120, PANEL.h, open),
          borderRadius: lerp(10, 18, open), transform: `rotateX(${lerp(66, 0, open).toFixed(2)}deg)`, background: "#17161F",
          boxShadow: `inset 0 0 0 2px rgba(150,146,255,0.7)`, ...(f >= T.along ? blurOut(f, T.along, { dur: 9 }) : {}),
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...body }}>
          <div style={{ position: "absolute", left: 36, top: 28, fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.dim }}>one layer, up close</div>
          {/* x: the column of the last chip, lit while it is being used */}
          <div style={{ position: "absolute", left: 22, top: MC.y, borderRadius: 10, background: `${TOKEN_HUES[6]}22` }}>
            {X.map((v, k) => <div key={k} style={{ ...mono, color: TOKEN_HUES[6] }}>{fmt(v, 4)}</div>)}
          </div>
          {sign("×", 166)}
          {WROWS.map((w, j) => {
            const lit = on(f, sweep(j), sweep(j) + 20) ? 1 : 0;
            return (
              <div key={j} style={{ position: "absolute", left: gx + j * (MC.cell + 8), top: MC.y, borderRadius: 10, background: `rgba(97,92,237,${(0.1 + 0.34 * lit + 0.3 * glowW).toFixed(3)})` }}>
                {w.map((v, k) => <div key={k} style={{ ...mono, color: lit ? ground.ink : "#C9C7FF" }}>{fmt(v, 4)}</div>)}
              </div>
            );
          })}
          {sign("=", 654)}
          <div style={{ position: "absolute", left: 706, top: MC.y + 1.5 * MC.rowH, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
            {OUT.map((v, j) => (
              <div key={j} style={{ ...mono, color: ground.ink, ...(f >= sweep(j) ? pop(f, sweep(j), { dur: 8, from: 0.8 }) : { opacity: 0 }) }}>
                {fmt(countTo(f, sweep(j), 14, 0, v), 4)}
              </div>
            ))}
          </div>
          {under("numbers", 22, MC.cell, TOKEN_HUES[6], T.mult + 12)}
          {under("weights", gx, 3 * MC.cell + 16, "#C9C7FF", T.mult + 16)}
          {under("new numbers", 652, 240, ground.ink, sweep(0))}
        </div>
      </div>
    </div>
  );
};
