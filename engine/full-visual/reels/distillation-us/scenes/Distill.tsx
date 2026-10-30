// distill, light, 15.3-24.1 s. A new interface, a "Distillation" pipeline app (one macOS window, a stepper Collect /
// Filter / Train). First frame: the pair as `report` left it (HANDOFF.pair); the window unfolds between them and the
// two marks fly into their places in it: Claude into the teacher picker, Qwen into the stepper's Train step.
// "distillation.": the word builds big above the window, then docks as its title. "stronger": step 1 is active and the
// cursor comes; "teacher,": Claude Opus 4.7 is picked and stamped `teacher` (DistillPicker). "collect ... answers,":
// the dataset pours in, the counter races to 151 million; "quality,": step 2, the check (DistillTable). "train":
// step 3, the job card on Qwen, the real loss curve (DistillTrain). "student.": the badge stamps, then Qwen lifts out
// of the card to the centre and the badge becomes its label as the window sinks away. Ends at HANDOFF.student.
import React from "react";
import { arrive, blurOut, ease, mix, pop, prog, useScene } from "../../../src/engine";
import { GOOD, HANDOFF } from "./parts";
import { MarkAt, MarkLabel, type MarkState } from "./OpeningBits";
import { ACCENT, JOB, PICK, STEPPER, WIN, WORD, lerp, useTimes, windowOut, type DT } from "./DistillKit";
import { Picker } from "./DistillPicker";
import { Table } from "./DistillTable";
import { BADGE_AT, Train } from "./DistillTrain";

const P = HANDOFF.pair;
const S = HANDOFF.student;

/** a travel between two mark states with an arc, so nothing moves on a ruler line */
const fly = (a: MarkState, b: MarkState, k: number, lift = 60): MarkState => ({
  cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k) - Math.sin(Math.PI * k) * lift, size: lerp(a.size, b.size, k),
});

function claudeAt(f: number, t: DT): MarkState {
  const s = fly({ cx: P.claude.cx, cy: P.claude.cy, size: P.size }, { cx: PICK.markCx, cy: PICK.top + PICK.h / 2, size: PICK.mark }, arrive(f, t.born + 2, 30), 40);
  const out = windowOut(f, t).opacity;
  return { ...s, cy: s.cy + 70 * (1 - out), opacity: out };
}

function qwenAt(f: number, t: DT): MarkState {
  const node = { cx: STEPPER.xs[2], cy: STEPPER.cy, size: 34 };
  let s = fly({ cx: P.qwen.cx, cy: P.qwen.cy, size: P.size }, node, arrive(f, t.born + 4, 30), 50);
  if (f >= t.train + 2) s = fly(node, { cx: JOB.markCx, cy: JOB.rowCy, size: JOB.mark }, arrive(f, t.train + 2, 22), 40);
  if (f >= t.lift) s = fly({ cx: JOB.markCx, cy: JOB.rowCy, size: JOB.mark }, { cx: S.cx, cy: S.cy, size: S.size }, arrive(f, t.lift, 20), 30);
  return s;
}

/** one step of the stepper: idle (grey ring), active (blue, its number), done (green check) */
const Node: React.FC<{ i: number; label: string; t: DT; active: number; done: number }> = ({ i, label, t, active, done }) => {
  const { f, theme, ground } = useScene();
  const cx = STEPPER.xs[i];
  const d = STEPPER.d;
  const isDone = f >= done;
  const fill = isDone ? mix(f, done, 6, ACCENT, GOOD) : f >= active ? mix(f, active, 6, "#FFFFFF", ACCENT) : "#FFFFFF";
  const hot = f >= active && !isDone;
  const pulse = hot ? arrive(f, active, 22) : 1;
  const showNum = !(i === 2 && f < t.train + 8); // the Qwen mark sits in step 3 until the job opens
  return (
    <div style={pop(f, t.born + 14 + i * 6, { from: 0.5 })}>
      <div style={{ position: "absolute", left: cx - d / 2, top: STEPPER.cy - d / 2, width: d, height: d, borderRadius: d / 2, boxShadow: `0 0 0 ${(pulse * 16).toFixed(1)}px ${ACCENT}`, opacity: hot ? (1 - pulse) * 0.3 : 0 }} />
      <div
        style={{
          position: "absolute", left: cx - d / 2, top: STEPPER.cy - d / 2, width: d, height: d, borderRadius: d / 2, background: fill,
          boxShadow: f >= active ? "none" : "inset 0 0 0 3px #D1D1D6", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: theme.font.ui, fontSize: 30, fontWeight: 700, color: f >= active ? "#FFFFFF" : ground.dim, // texture: the step number
        }}
      >
        {isDone ? "✓" : showNum ? i + 1 : ""}
      </div>
      <div style={{ position: "absolute", left: cx - 120, width: 240, top: STEPPER.labelTop, textAlign: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: hot ? 700 : 500, color: hot ? ground.ink : ground.dim }}>
        {label}
      </div>
    </div>
  );
};

const Stepper: React.FC<{ t: DT }> = ({ t }) => {
  const { f, ground } = useScene();
  const seg = (i: number, at: number) => {
    const x0 = STEPPER.xs[i] + STEPPER.d / 2 + 14;
    const x1 = STEPPER.xs[i + 1] - STEPPER.d / 2 - 14;
    const drawn = prog(f, t.born + 18 + i * 6, 14, ease.inOut);
    return (
      <div key={i} style={{ position: "absolute", left: x0, top: STEPPER.cy - 2, width: (x1 - x0) * drawn, height: 4, borderRadius: 2, background: "#E5E5EA", overflow: "hidden" }}>
        <div style={{ width: `${prog(f, at, 16, ease.inOut) * 100}%`, height: "100%", background: GOOD }} />
      </div>
    );
  };
  return (
    <>
      {seg(0, t.quality)}
      {seg(1, t.train)}
      <Node i={0} label="Collect" t={t} active={t.stronger} done={t.quality} />
      <Node i={1} label="Filter" t={t} active={t.quality} done={t.train} />
      <Node i={2} label="Train" t={t} active={t.train} done={Infinity} />
      <div style={{ position: "absolute", left: WIN.x, top: STEPPER.rule, width: WIN.w, height: 1.5, background: ground.hairline, opacity: prog(f, t.born + 20, 10) }} />
    </>
  );
};

/** the window: unfolds between the two marks on the first frames, then carries every step */
const Window: React.FC<{ t: DT; children: React.ReactNode }> = ({ t, children }) => {
  const { f, ground } = useScene();
  const k = arrive(f, t.born + 1, 26);
  const out = windowOut(f, t);
  const cy = WIN.y + WIN.h / 2;
  const lights = ["#FF5F57", "#FEBC2E", "#28C840"];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out.opacity, transform: out.transform, transformOrigin: `540px ${cy}px` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${(0.45 + 0.55 * k).toFixed(4)})`, transformOrigin: `540px ${cy}px`, opacity: prog(f, t.born, 5, ease.linear) }}>
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: WIN.r, background: ground.card, boxShadow: "0 40px 90px rgba(0,0,0,0.13), 0 0 0 1.5px rgba(0,0,0,0.08)" }} />
        {lights.map((c, i) => (
          <div key={c} style={{ position: "absolute", left: WIN.x + 26 + i * 32, top: WIN.y + WIN.bar / 2 - 10, width: 20, height: 20, borderRadius: 10, background: c }} />
        ))}
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y + WIN.bar, width: WIN.w, height: 1.5, background: ground.hairline }} />
        {children}
      </div>
    </div>
  );
};

/** "distillation.": the word builds big, letter by letter, above the window, then docks as the window's title */
const Title: React.FC<{ t: DT }> = ({ t }) => {
  const { f, ground } = useScene();
  if (f < t.word) return null;
  const word = "Distillation";
  const dock = arrive(f, t.word + 44, 22);
  const grow = 1 + 0.04 * prog(f, t.word, 44, ease.out) * (1 - dock);
  const scale = lerp(1, WORD.titleFont / WORD.font, dock) * grow;
  const cy = lerp(WORD.cy, WORD.titleCy, dock);
  const out = windowOut(f, t);
  return (
    <div
      style={{
        position: "absolute", left: 0, width: 1080, top: cy - 60, height: 120, display: "flex", justifyContent: "center", alignItems: "center",
        transform: `translateY(${(70 * (1 - out.opacity)).toFixed(1)}px) scale(${scale.toFixed(4)})`, opacity: out.opacity, zIndex: 30,
        fontFamily: "Figtree, sans-serif", fontSize: WORD.font, fontWeight: 700, letterSpacing: lerp(-2, 0, dock), color: ground.ink,
      }}
    >
      {word.split("").map((ch, i) => {
        const k = arrive(f, t.word + i * 2, 16);
        return (
          <span key={i} style={{ display: "inline-block", opacity: Math.min(1, k * 2.5), transform: `translateY(${((1 - k) * 46).toFixed(1)}px)`, filter: k < 0.98 ? `blur(${((1 - k) * 10).toFixed(1)}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** the `student` badge leaves the card with the mark and becomes the plain label under it (HANDOFF.student) */
const StudentLabel: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  if (f < t.lift) return null;
  const k = arrive(f, t.lift, 20);
  const cx = lerp(BADGE_AT.x + 94, S.cx, k);
  const cy = lerp(BADGE_AT.cy, S.labelTop + 26, k);
  return (
    <div style={{ position: "absolute", left: cx - 200, width: 400, top: cy - 26, height: 52, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 40 }}>
      <div
        style={{
          padding: `0 ${lerp(20, 0, k).toFixed(1)}px`, height: lerp(50, 52, k), borderRadius: 25, display: "flex", alignItems: "center",
          background: `rgba(97,92,237,${(1 - Math.min(1, k * 1.6)).toFixed(3)})`, fontFamily: theme.font.ui, fontSize: lerp(34, 44, k), lineHeight: "52px",
          fontWeight: 700, color: mix(f, t.lift, 10, "#FFFFFF", ground.ink),
        }}
      >
        student
      </div>
    </div>
  );
};

export const Distill: React.FC = () => {
  const { f } = useScene();
  const t = useTimes();
  const pair = { c: { cx: P.claude.cx, cy: P.claude.cy, size: P.size }, q: { cx: P.qwen.cx, cy: P.qwen.cy, size: P.size } };
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Window t={t}>
        <Stepper t={t} />
        <Picker t={t} />
        <Table t={t} />
        <Train t={t} />
      </Window>
      <Title t={t} />
      {f < t.born + 12 && <MarkLabel text="Claude" s={pair.c} style={blurOut(f, t.born + 1, { dur: 8 })} />}
      {f < t.born + 12 && <MarkLabel text="Qwen" s={pair.q} style={blurOut(f, t.born + 1, { dur: 8 })} />}
      <MarkAt name="claude" s={claudeAt(f, t)} prev={claudeAt(f - 1, t)} z={25} />
      <MarkAt name="qwen" s={qwenAt(f, t)} prev={qwenAt(f - 1, t)} z={35} />
      <StudentLabel t={t} />
    </div>
  );
};
