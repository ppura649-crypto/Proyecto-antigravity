// "At the end, it gives a probability to every possible next token. It picks one, adds it to the sentence, and repeats."
// The real top-5 next tokens for the sentence grow out as bars, percentages counting up (measured), with the long
// tail of every other token under them. On "picks" the top bar lights in Qwen's violet and " practice" flies up into
// the sentence (InsideRow draws the flight). On "sentence," the bars run once more, faster and without numbers (the
// second pick was not measured beyond its winner, "."), the top one lights and "." flies up, landing on "repeats.".
import React from "react";
import { blurIn, blurOut, ease, prog, stagger, useScene } from "../../../src/engine";
import { HANDOFF, ProbBars, QWEN, TOP5 } from "./parts";
import { flights, useT } from "./InsideRow";

const B = HANDOFF.bars;
const TRACK = { left: B.left + 190, w: B.width - 316 }; // where ProbBars draws its tracks

/** the long tail: thinner and thinner bars under the five, no labels: every other token gets a sliver too */
const Tail: React.FC<{ at: number }> = ({ at }) => {
  const { f, ground } = useScene();
  return (
    <>
      {[0.05, 0.035, 0.024, 0.016, 0.01].map((p, i) => (
        <div key={i} style={{ position: "absolute", left: TRACK.left, top: B.top + 5 * B.pitch - 8 + i * 13, height: 6, borderRadius: 3, width: (p / TOP5[0].p) * TRACK.w, background: ground.dim, ...blurIn(f, stagger(at, i, 3), { dur: 6 }), opacity: (1 - i * 0.17) * prog(f, stagger(at, i, 3), 6) }} />
      ))}
    </>
  );
};

/** the second run: the same bars' motion, blurred, no words and no numbers, the top one lights */
const Rerun: React.FC<{ at: number; lit: number }> = ({ at, lit }) => {
  const { f, ground } = useScene();
  const k = prog(f, at, 14, ease.out);
  return (
    <div style={{ position: "absolute", inset: 0, filter: "blur(7px)" }}>
      {[1, 0.5, 0.42, 0.22, 0.14].map((w, i) => (
        <div key={i} style={{ position: "absolute", left: TRACK.left, top: B.top + i * B.pitch, height: B.barH, borderRadius: 8, width: w * TRACK.w * k, background: i === 0 && f >= lit ? QWEN : ground.dim, opacity: 0.9 }} />
      ))}
    </div>
  );
};

export const Pick: React.FC = () => {
  const { f, theme, ground } = useScene();
  const T = useT();
  const [, g2] = flights(T);
  const done = g2.at + g2.dur;
  if (f < T.prob - 4 || f > done + 14) return null;
  const k = prog(f, T.prob - 2, 40, ease.out);
  const drop = prog(f, T.again, 8, ease.in); // the first bars shrink away for the second run
  const rerunAt = T.again + 6;
  const all = f >= done ? blurOut(f, done + 2, { dur: 9 }) : {};
  const rows = TOP5.map((r) => ({ token: r.token, p: r.p }));
  return (
    <div style={{ position: "absolute", inset: 0, ...all }}>
      <div style={{ position: "absolute", left: B.left, top: B.top - 78, fontFamily: theme.font.ui, fontSize: 40, fontWeight: 600, color: ground.ink, ...blurIn(f, T.prob, { dur: 8, rise: 12 }) }}>
        next token, by probability
      </div>
      {f < rerunAt && (
        <div style={{ opacity: 1 - drop }}>
          <ProbBars rows={rows} k={k * (1 - drop)} max={TOP5[0].p} highlight={f >= T.picks ? { token: TOP5[0].token, color: QWEN } : undefined} />
        </div>
      )}
      {f < rerunAt && f >= T.every && <div style={{ opacity: 1 - drop }}><Tail at={T.every} /></div>}
      {f >= rerunAt && <Rerun at={rerunAt} lit={g2.at - 2} />}
    </div>
  );
};
