// "During training, the teacher's answer tells the student which token should come next. If the student gives it a
// low probability, training calculates how to adjust its weights to fix that mistake. Repeat that millions of times,
// and the student starts answering like the teacher, without ever contacting it."
// Claude and Qwen enter big, park in the top corners with the stream between them; Claude's reply arrives, its
// " teach" drops onto Qwen's real guesses (2.3 %, amber), the error runs back up a wire into Qwen's real weights, which
// move in the 8th decimal; then the real 11-step run plays out on the bars until teach is 82.5 %, Qwen writes the same
// answer, and the stream is cut.
import React from "react";
import { arrive, arriveEase, blurIn, blurOut, ease, prog, useScene } from "../../../src/engine";
import { AMBER, CLAUDE, GOOD, ProbBars, QWEN, STEPS, TEACHER_WORD, TOP5, TokenChip } from "./parts";
import { AnswerCard, L, Link, Mark, Smear, lerp } from "./TrainingKit";
import { probsAt, schedule, TEACH_ROW, WeightsPanel, Wire } from "./TrainingNudge";

// where " teach" sits inside Claude's reply (measured on the still), and where its chip parks on the bars
const TEACH_IN_CARD = { x: 806, y: L.teacherCard.top + L.teacherCard.height / 2 };

const Labels: React.FC<{ start: number; k: number; kAt: number }> = ({ start, k, kAt }) => {
  const { f, theme, ground } = useScene();
  const txt = { fontFamily: theme.font.ui, fontWeight: 600, color: ground.ink, whiteSpace: "nowrap" as const };
  const big = (x: number, s: string, i: number) => (
    <div style={{ position: "absolute", left: x - 150, width: 300, top: L.big.claude.y + 116, textAlign: "center", fontSize: 44, ...txt, ...(f < kAt ? blurIn(f, start + 16 + i * 6, { dur: 9, rise: 16 }) : blurOut(f, kAt, { dur: 6 })) }}>
      {s}
    </div>
  );
  const small = { top: L.small.claude.y - 22, height: 44, lineHeight: "44px", fontSize: 34, ...txt, ...blurIn(f, kAt + 14, { dur: 8 }) };
  return (
    <>
      {k < 1 && big(L.big.claude.x, "teacher", 0)}
      {k < 1 && big(L.big.qwen.x, "student", 1)}
      {f >= kAt + 14 && <div style={{ position: "absolute", left: L.small.claude.x + 56, ...small }}>teacher</div>}
      {f >= kAt + 14 && <div style={{ position: "absolute", right: 1080 - (L.small.qwen.x - 56), ...small }}>student</div>}
    </>
  );
};

/** the teacher's word leaves the reply and parks on its own row of the student's guesses */
const FlyingChip: React.FC<{ at: number }> = ({ at }) => {
  const { f, ground } = useScene();
  if (f < at) return null;
  const DUR = 20;
  const p = prog(f, at, DUR, arriveEase(DUR));
  const q = prog(f - 1, at, DUR, arriveEase(DUR));
  const x = lerp(p, TEACH_IN_CARD.x, TEACH_ROW.chipX);
  const y = lerp(p, TEACH_IN_CARD.y, TEACH_ROW.cy) - Math.sin(p * Math.PI) * 40;
  const s = lerp(p, 0.86, 0.64);
  const dy = Math.abs(p - q) * (TEACH_ROW.cy - TEACH_IN_CARD.y);
  return (
    <Smear bx={Math.min(6, dy * 0.08)} by={Math.min(28, dy * 0.35)} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s.toFixed(4)})`, opacity: prog(f, at, 2, ease.linear) }}>
      <div style={{ borderRadius: 12, background: ground.bg, boxShadow: p < 1 ? "0 10px 30px rgba(217,119,87,0.30)" : undefined }}>
        <TokenChip text={TEACHER_WORD} hue={CLAUDE} />
      </div>
    </Smear>
  );
};

export const Training: React.FC = () => {
  const { f, cue, scene, theme, ground } = useScene();
  const start = scene.from - 6;
  const kAt = cue("teacher's") - 6;
  const k = prog(f, kAt, 20, ease.inOut);
  const barsAt = cue("student");
  const lowAt = cue("low");
  const mistake = cue("mistake.");
  const millions = cue("millions");
  const teacherAt = cue("teacher,");
  const cutAt = cue("contacting");
  const outAt = teacherAt - 16;

  const ups = React.useMemo(() => schedule(mistake, millions, outAt - 4), [mistake, millions, outAt]);
  const { at: pAt, step } = probsAt(f, ups);
  const rows = TOP5.map((r) => ({ token: r.token, p: pAt(r.token) }));
  const teachP = pAt(TEACHER_WORD);
  const leads = teachP > pAt(" practice");
  const low = prog(f, lowAt, 5, ease.linear);
  const rowColor = leads ? GOOD : AMBER;
  const drift = (i: number) => Math.sin((f - start) / 38 + i * 1.7) * 7;

  return (
    <>
      <Link k={k} at={start + 20} cutAt={cutAt} />
      <Mark name="claude" k={k} rise={arrive(f, start, 26)} drift={drift(0)} />
      <Mark name="qwen" k={k} rise={arrive(f, start + 5, 26)} drift={drift(1)} />
      <Labels start={start} k={k} kAt={kAt} />

      <AnswerCard who="claude" box={L.teacherCard} from={L.small.claude} at={cue("teacher's") + 6} hiAt={cue("teacher's") + 22} dim={prog(f, cutAt + 2, 14, ease.out)} />

      {/* the student's guesses for the word after "…is to": Qwen3 0.6B's real top 5, following the real run */}
      {f >= barsAt && (
        <>
          <div style={{ position: "absolute", left: L.header.left, top: L.header.top, fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.dim, whiteSpace: "nowrap", ...blurIn(f, barsAt, { dur: 8, rise: 14 }) }}>
            <span style={{ color: QWEN }}>Qwen</span>'s next word after “…is to”
          </div>
          {f >= lowAt && (
            <div style={{ position: "absolute", left: 136, top: TEACH_ROW.cy - 34, width: 818, height: 68, borderRadius: 14, background: `${rowColor}24`, opacity: low }} />
          )}
          <ProbBars rows={rows} k={arrive(f, barsAt + 2, 26)} max={0.83} highlight={f >= lowAt ? { token: TEACHER_WORD, color: rowColor } : undefined} />
        </>
      )}
      <FlyingChip at={cue("next.") - 8} />

      <Wire at={cue("calculates")} ups={ups} outAt={outAt} />
      <WeightsPanel at={cue("weights")} rollAt={mistake} foldAt={millions} ups={ups} outAt={outAt} />

      {f >= mistake + 8 && (
        <div style={{ position: "absolute", left: L.label.left, top: L.label.top, fontFamily: theme.font.ui, fontSize: 32, fontWeight: 500, color: ground.dim, whiteSpace: "nowrap", ...blurIn(f, mistake + 8, { dur: 8 }) }}>
          real training run · Qwen3 0.6B · step <span style={{ color: ground.ink, fontVariantNumeric: "tabular-nums" }}>{Math.max(1, step)}</span> of {STEPS.length - 1}
        </div>
      )}

      <AnswerCard who="qwen" box={L.studentCard} from={L.small.qwen} at={teacherAt - 8} hiAt={teacherAt + 6} check={prog(f, cutAt + 8, 10, ease.back)} />
    </>
  );
};
