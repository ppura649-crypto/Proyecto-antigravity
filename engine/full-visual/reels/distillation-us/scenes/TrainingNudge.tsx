// The nudge in `training`: the error wire from the student's low bar back into its weights, the real weights before
// and after one step (only the 7th and 8th decimals move), and the schedule of the real 11-step run the bars follow.
import React from "react";
import { blurIn, blurOut, draw, ease, prog, useScene } from "../../../src/engine";
import { AMBER, fmt, Logo, QWEN, STEPS, W_AFTER, W_BEFORE } from "./parts";
import { L } from "./TrainingKit";

/** the teach row of the bars (row 3 of TOP5) and where its chip parks, over the row's own label */
export const TEACH_ROW = { cy: 1030 + 3 * 74 + 22, chipX: 268 };

// the wire: out of the chip's left side, down the left gutter, up and into the weights panel's label row
const WIRE = [
  { x: 206, y: TEACH_ROW.cy },
  { x: 112, y: TEACH_ROW.cy },
  { x: 112, y: L.panel.rowY },
  { x: L.panel.left, y: L.panel.rowY },
];
const WIRE_D = `M206,${TEACH_ROW.cy} H132 Q112,${TEACH_ROW.cy} 112,${TEACH_ROW.cy - 20} V${L.panel.rowY + 20} Q112,${L.panel.rowY} 132,${L.panel.rowY} H${L.panel.left}`;

const wireAt = (t: number) => {
  const segs = WIRE.slice(1).map((b, i) => Math.hypot(b.x - WIRE[i].x, b.y - WIRE[i].y));
  let d = t * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = Math.min(1, d / segs[i]);
      return { x: WIRE[i].x + (WIRE[i + 1].x - WIRE[i].x) * k, y: WIRE[i].y + (WIRE[i + 1].y - WIRE[i].y) * k };
    }
    d -= segs[i];
  }
  return WIRE[WIRE.length - 1];
};

/** pulse: the error leaves the bar; land: it reaches the weights; bars: the bars start moving to the step's values */
export type Update = { step: number; pulse: number; land: number; bars: number; dur: number };

/** step 1 on "mistake.", then steps 2..11 from "millions", each gap shorter than the last, done before "teacher," */
export function schedule(mistake: number, millions: number, done: number): Update[] {
  const out: Update[] = [{ step: 1, pulse: mistake - 22, land: mistake, bars: mistake + 16, dur: 18 }];
  const r = 0.8;
  const n = STEPS.length - 2; // steps 2..11
  const first = (done - millions) * (1 - r) / (1 - Math.pow(r, n));
  let t = millions;
  for (let i = 0; i < n; i++) {
    const gap = first * Math.pow(r, i);
    const travel = Math.max(4, Math.round(gap * 0.55));
    out.push({ step: i + 2, pulse: Math.round(t), land: Math.round(t + travel), bars: Math.round(t + travel), dur: Math.max(4, Math.round(gap * 0.6)) });
    t += gap;
  }
  return out;
}

/** the five probabilities at this frame: each update eases from the previous step's real values to its own */
export function probsAt(f: number, ups: Update[]) {
  let prev = STEPS[0].five as Record<string, number>;
  let cur = prev;
  let k = 1;
  let step = 0;
  for (const u of ups) {
    if (f < u.bars) break;
    prev = cur;
    cur = STEPS[u.step].five as Record<string, number>;
    k = prog(f, u.bars, u.dur, ease.out);
    step = u.step;
  }
  const at = (tok: string) => prev[tok] + (cur[tok] - prev[tok]) * k;
  return { at, step };
}

/** the error travelling back: drawn on "calculates", then one bright pulse per training step */
export const Wire: React.FC<{ at: number; ups: Update[]; outAt: number }> = ({ at, ups, outAt }) => {
  const { f } = useScene();
  if (f < at) return null;
  const pulses = [{ pulse: at + 4, land: at + 26 }, ...ups].filter((u) => f >= u.pulse && f < u.land + 3);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, ...(f >= outAt ? blurOut(f, outAt, { dur: 8 }) : {}) }}>
      <path d={WIRE_D} fill="none" stroke={AMBER} strokeWidth={4} strokeLinecap="round" {...draw(f, at, 24)} />
      {pulses.map((u, i) => {
        const pt = wireAt(prog(f, u.pulse, u.land - u.pulse, ease.inOut));
        return <circle key={i} cx={pt.x} cy={pt.y} r={11} fill={AMBER} stroke="#FFFFFF" strokeWidth={3} />;
      })}
    </svg>
  );
};

// three real weights of Qwen3 0.6B (layer 0, query projection, row 0), before and after the first step
const PICK = [0, 1, 3];
const H = 46;

/** one number whose tail rolls from its old digits to its new ones, the moving part highlighted */
const Rolling: React.FC<{ a: string; b: string; at: number }> = ({ a, b, at }) => {
  const { f, theme, ground } = useScene();
  let d = 0;
  while (d < a.length && a[d] === b[d]) d++;
  const hi = prog(f, at, 6, ease.out);
  return (
    <div style={{ display: "flex", fontFamily: theme.font.mono, fontSize: 32, fontWeight: 600, color: ground.ink, height: H, lineHeight: `${H}px`, whiteSpace: "pre" }}>
      <span>{a.slice(0, d)}</span>
      <span style={{ display: "flex", borderRadius: 6, background: `rgba(97,92,237,${(0.2 * hi).toFixed(3)})`, color: hi > 0.5 ? QWEN : ground.ink }}>
        {a.slice(d).split("").map((c, j) => {
          const k = prog(f, at + 2 + j * 3, 12, ease.inOut);
          return (
            <span key={j} style={{ display: "block", height: H, overflow: "hidden" }}>
              <span style={{ display: "block", transform: `translateY(${(-k * H).toFixed(1)}px)` }}>
                <span style={{ display: "block", height: H }}>{c}</span>
                <span style={{ display: "block", height: H }}>{b[d + j]}</span>
              </span>
            </span>
          );
        })}
      </span>
    </div>
  );
};

/** Qwen's own weights: arrive on "weights", roll on "mistake.", fold to their label on "millions" and flash per step */
export const WeightsPanel: React.FC<{ at: number; rollAt: number; foldAt: number; ups: Update[]; outAt: number }> = ({ at, rollAt, foldAt, ups, outAt }) => {
  const { f, fps, theme, ground } = useScene();
  if (f < at) return null;
  const fold = prog(f, foldAt, 12, ease.inOut);
  const nudged = ", nudged".slice(0, Math.max(0, Math.min(8, Math.floor(((f - rollAt) / fps) * 28))));
  const flash = Math.max(0, ...ups.filter((u) => u.step > 1).map((u) => (f >= u.land - 2 ? 1 - prog(f, u.land - 2, 10, ease.out) : 0)));
  return (
    <div
      style={{
        position: "absolute", left: L.panel.left, top: L.panel.top, width: L.panel.width, height: 70 + 76 * (1 - fold),
        borderRadius: 16, background: ground.card, border: `1.5px solid ${ground.hairline}`, overflow: "hidden",
        boxShadow: `0 12px 36px rgba(20,20,30,0.08), inset 0 0 0 ${(3 * flash).toFixed(2)}px ${QWEN}`,
        ...(f >= outAt ? blurOut(f, outAt, { dur: 8 }) : blurIn(f, at, { dur: 9, rise: 24 })),
      }}
    >
      <div style={{ position: "absolute", left: 24, top: 35 - 22, height: 44, display: "flex", alignItems: "center", gap: 14 }}>
        <Logo name="qwen" size={38} />
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.ink, whiteSpace: "pre" }}>
          weights{f >= rollAt ? nudged : ""}
        </span>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, top: 78, display: "flex", justifyContent: "space-between", opacity: 1 - fold }}>
        {PICK.map((c, i) => (
          <Rolling key={c} a={fmt(W_BEFORE[0][c], 8)} b={fmt(W_AFTER[0][c], 8)} at={rollAt + i * 4} />
        ))}
      </div>
    </div>
  );
};
