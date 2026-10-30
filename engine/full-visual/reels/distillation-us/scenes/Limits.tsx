// "A smaller student also can't hold every skill. And it can learn the examples too closely, then struggle with
// problems it has never seen. That's called overfitting. So collecting answers can transfer useful skills. The test
// is whether your model can solve problems it hasn't seen."
// One browser window, the student's own model page (huggingface.co/Qwen/Qwen3-0.6B), rises on the first frame.
// "smaller": its measured parameter count runs down from Qwen3's largest open model to 596,049,920 and its bar
// collapses. "skill.": the report's four skills fly up from a small Claude into its Skills box, the capacity gauge
// fills, the fourth hits a full box and falls. "learn": a cursor clicks Eval; the student sits a quiz, types its
// answers, 3/3; a new problem, it types the memorised word, amber: "overfitting." named big. "So": back to the model
// card, Claude's answers land, the transfer sweeps the three skills, green on "skills.". "The test": Eval again, a
// held-out problem it has never seen, Run test pressed on "solve", the student still typing as the scene ends.
import React from "react";
import { Cursor, arrive, ease, leave, prog, typeOn, useScene } from "../../../src/engine";
import { AMBER, Logo } from "./parts";
import { BODY_TOP, WIN, Window, tabAt, tabK, useLimitCues, type LimitCues } from "./LimitsBits";
import { InFlight, ModelBody, SOURCE } from "./LimitsCards";
import { EvalBody } from "./LimitsEval";

const TIP = { x: 12, y: 7 }; // the arrow's tip inside the cursor graphic

/** the small Claude under the window: the source of the skills and of the answers, and nothing more */
const Source: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, ground, theme } = useScene();
  const yA = (1 - arrive(f, c.also - 8, 18)) * 300 + leave(f, c.learn, 12) * 400;
  const yC = (1 - arrive(f, c.so + 4, 18)) * 300 + leave(f, c.the2, 12) * 400;
  const y = f < c.so ? yA : yC;
  if (f < c.also - 8 || (f > c.learn + 12 && f < c.so + 4) || f > c.the2 + 12) return null;
  return (
    <div style={{ position: "absolute", left: SOURCE.x - 32, top: SOURCE.y - 32, transform: `translateY(${y.toFixed(1)}px)`, display: "flex", alignItems: "center", gap: 16 }}>
      <Logo name="claude" size={64} />
      <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.dim }}>teacher</span>
    </div>
  );
};

/** "overfitting." typed big under the window, an amber underline drawn under it; it drops away on "So" */
const Named: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, fps, theme, ground } = useScene();
  if (f < c.overfit || f > c.so + 12) return null;
  const word = typeOn("overfitting", f, c.overfit, fps, 30);
  const under = prog(f, c.overfit + 4, 18, ease.out);
  const y = leave(f, c.so - 2, 12) * 500;
  return (
    <div style={{ position: "absolute", left: 90, width: 900, top: 1346, textAlign: "center", fontFamily: theme.font.ui, fontSize: 88, fontWeight: 800, letterSpacing: -1.5, color: ground.ink, transform: `translateY(${y.toFixed(1)}px)` }}>
      <span style={{ position: "relative", display: "inline-block" }}>
        <span>{word.text}</span>
        <span style={{ opacity: 0 }}>{"overfitting".slice(word.text.length)}</span>
        <span style={{ position: "absolute", left: 0, bottom: -4, height: 8, borderRadius: 4, width: `${(under * 100).toFixed(1)}%`, background: AMBER }} />
      </span>
    </div>
  );
};

/** three short visits of the cursor: it clicks a tab exactly as the body starts to slide, and presses Run on "solve" */
const Clicks: React.FC<{ c: LimitCues }> = ({ c }) => {
  const at = (p: { x: number; y: number }) => ({ x: p.x - TIP.x, y: p.y - TIP.y });
  const visit = (click: number, tab: number) => [
    { f: click - 30, x: 880, y: 1480 },
    { f: click - 3, ...at(tabAt(tab)) },
    { f: click + 5, ...at(tabAt(tab)) },
  ];
  const run = at({ x: WIN.left + 34 + 110, y: BODY_TOP + 440 + 36 });
  return (
    <>
      <Cursor path={[...visit(c.learn, 1), { f: c.learn + 30, x: 900, y: 1600 }]} until={c.learn + 34} />
      <Cursor path={[...visit(c.so, 0), { f: c.so + 30, x: 900, y: 1600 }]} until={c.so + 34} />
      <Cursor path={[...visit(c.the2, 1), { f: c.solve - 3, ...run }, { f: c.solve + 6, ...run }, { f: c.solve + 40, x: 880, y: 1560 }]} until={c.solve + 46} />
    </>
  );
};

export const Limits: React.FC = () => {
  const { f } = useScene();
  const c = useLimitCues();
  // the window rises from below on the scene's first frame (L1), the one object the whole scene happens in
  const winAt = (fr: number) => (1 - arrive(fr, c.t0, 26)) * 900;
  const wy = winAt(f);
  const vb = Math.min(12, Math.abs(wy - winAt(f - 1)) * 0.2);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: prog(f, c.t0, 2, ease.linear), filter: vb > 0.3 ? `blur(${vb.toFixed(2)}px)` : undefined }}>
        <Window y={wy} tab={tabK(f, c)}>
          <ModelBody c={c} />
          <EvalBody c={c} />
        </Window>
      </div>
      <Source c={c} />
      <InFlight c={c} winY={wy} />
      <Named c={c} />
      <Clicks c={c} />
    </>
  );
};
