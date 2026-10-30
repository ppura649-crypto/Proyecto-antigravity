// Step 3, the training job. "train": the job card opens under the dataset line; its base model is Qwen (the mark
// flies down from the stepper, drawn by Distill.tsx). The loss curve draws down through the REAL loss of the measured
// training run (LOSS, 3.78 -> 0.19 over 11 steps on Qwen3 0.6B), a live readout riding its tip. "student.": the
// base model gets its `student` badge; the badge then becomes the label under the mark as it lifts out (Distill.tsx).
import React from "react";
import { arrive, blurIn, draw, ease, prog, useScene } from "../../../src/engine";
import { LOSS, QWEN } from "./parts";
import { IN, JOB, RoleBadge, type DT } from "./DistillKit";

const CH = { l: IN.l + 40, r: IN.r - 60, top: 1196, bottom: 1352, max: 4 }; // loss axis 0..4
const px = (i: number) => CH.l + (i * (CH.r - CH.l)) / (LOSS.length - 1);
const py = (v: number) => CH.bottom - (v / CH.max) * (CH.bottom - CH.top);
const PATH = LOSS.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");

export const trainTimes = (t: DT) => ({ card: t.train + 2, curve: t.train + 12, curveDur: t.student - t.train - 22 });

/** where the badge sits in the base-model row: Distill.tsx starts the label's flight from here */
export const BADGE_AT = { x: JOB.textL + 118, cy: JOB.rowCy };

/** the loss chart: gridlines, the curve drawing, the readout at its tip */
const Loss: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  const m = trainTimes(t);
  const k = prog(f, m.curve, m.curveDur, ease.inOut);
  const pos = k * (LOSS.length - 1);
  const i0 = Math.min(LOSS.length - 2, Math.floor(pos));
  const v = LOSS[i0] + (LOSS[i0 + 1] - LOSS[i0]) * (pos - i0);
  const tipX = px(i0) + (px(i0 + 1) - px(i0)) * (pos - i0);
  const tipY = py(v);
  return (
    <div style={blurIn(f, m.card + 8, { dur: 9, rise: 10 })}>
      <div style={{ position: "absolute", left: IN.l + 24, width: IN.r - IN.l - 48, textAlign: "right", top: 1134, fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim }}>loss</div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[1, 2, 3].map((g) => (
          <line key={g} x1={CH.l} x2={CH.r} y1={py(g)} y2={py(g)} stroke={ground.hairline} strokeWidth={1.5} />
        ))}
        <line x1={CH.l} x2={CH.r} y1={CH.bottom} y2={CH.bottom} stroke="#C8C8CC" strokeWidth={2} />
        <path d={PATH} fill="none" stroke={QWEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" {...draw(f, m.curve, m.curveDur)} />
        {f >= m.curve && <circle cx={tipX} cy={tipY} r={10} fill={QWEN} stroke="#FFFFFF" strokeWidth={3} />}
        {f >= m.curve && <circle cx={px(0)} cy={py(LOSS[0])} r={7} fill={QWEN} />}
      </svg>
      {f >= m.curve && (
        <div
          style={{
            position: "absolute", left: Math.min(tipX + 18, CH.r - 60), top: Math.max(tipY - 56, CH.top - 60), fontFamily: theme.font.mono, fontSize: 36,
            fontWeight: 700, color: QWEN, fontVariantNumeric: "tabular-nums", whiteSpace: "pre",
          }}
        >
          {v.toFixed(2)}
        </div>
      )}
      <div style={{ position: "absolute", left: IN.l + 24, width: IN.r - IN.l - 48, top: 1370, textAlign: "right", fontFamily: theme.font.ui, fontSize: 32, color: ground.dim }}>
        real training run · Qwen3 0.6B
      </div>
    </div>
  );
};

export const Train: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  const m = trainTimes(t);
  if (f < m.card) return null;
  const open = arrive(f, m.card, 20);
  const badgeGone = f >= t.lift; // from here the badge is the flying label
  return (
    <>
      <div
        style={{
          position: "absolute", left: IN.l, top: JOB.top, width: IN.r - IN.l, height: JOB.h * open, borderRadius: 20, background: "#F5F5F7",
          boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.06)", opacity: Math.min(1, open * 3),
        }}
      />
      <div style={{ position: "absolute", left: IN.l + 24, top: JOB.rowCy - 25, height: 50, display: "flex", alignItems: "center", ...blurIn(f, m.card + 4, { dur: 8, rise: 10 }) }}>
        <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim }}>Base model</span>
      </div>
      {f >= t.train + 20 && (
        <div style={{ position: "absolute", left: JOB.textL, top: JOB.rowCy - 25, height: 50, display: "flex", alignItems: "center", ...blurIn(f, t.train + 20, { dur: 8 }) }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 700, color: ground.ink }}>Qwen</span>
        </div>
      )}
      {!badgeGone && (
        <div style={{ position: "absolute", left: BADGE_AT.x, top: JOB.rowCy - 25 }}>
          <RoleBadge text="student" color={QWEN} at={t.student} />
        </div>
      )}
      <Loss t={t} />
    </>
  );
};
