// The "Eval" tab of `limits`: a quiz the student sits. First its training examples, sayings finished the teacher's
// way (the first is the reel's own sentence -> "teach"); the student types each answer, each one gets a check, the
// score runs to 3/3. Then a new problem of the same shape with another verb: the student types the word it memorised,
// "teach", and both that answer and the one it copied light amber: overfitting, shown. Last, the held-out test: one
// problem it has never seen, "Run test" pressed on "solve", the student still typing when the scene ends.
// Illustrative text only: no number here is a measurement (the scores count the cards on screen).
import React from "react";
import { ease, pop, prog, typeOn, useScene } from "../../../src/engine";
import { AMBER, GOOD, Logo, QWEN } from "./parts";
import { NeverSeen, Spinner, Verdict, WIN, blink, type LimitCues } from "./LimitsBits";

const PILE = [
  { text: "The best way to learn is to", answer: "teach" },
  { text: "Practice makes", answer: "perfect" },
  { text: "Two heads are better than", answer: "one" },
];
const NEW = { text: "The best way to rest is to", em: "rest", answer: "teach" };
const TEST = { text: "Actions speak louder than", answer: "words" };
const X0 = 34;
const W = 806;
const MS = 45;

/** when row i starts typing and when its check lands */
const typing = (c: LimitCues, i: number) => {
  const start = c.examples + 8 + i * 12;
  return { start, check: start + Math.ceil((PILE[i].answer.length * MS * 60) / 1000) + 2 };
};

export const EvalBody: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f } = useScene();
  return (
    <div style={{ position: "absolute", left: WIN.w, top: 0, width: WIN.w, height: 642 }}>
      <Pills c={c} />
      {f < c.the2 ? <Training c={c} /> : <HeldOut c={c} />}
    </div>
  );
};

const Pills: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, theme, ground } = useScene();
  const score = PILE.filter((_, i) => f >= typing(c, i).check).length;
  const held = f >= c.the2;
  const blip = (at: number) => 1 + 0.07 * Math.sin(Math.PI * prog(f, at, 12, ease.linear));
  const pill = (label: string, value: React.ReactNode, color: string, s: number) => (
    <div style={{ height: 60, padding: "0 22px", borderRadius: 30, background: "#F4F4F6", display: "flex", alignItems: "center", gap: 14, transform: `scale(${s.toFixed(3)})` }}>
      <span style={{ fontSize: 30, fontWeight: 600, color: ground.dim }}>{label}</span>
      <span style={{ fontFamily: theme.font.mono, fontSize: 34, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 8 }}>{value}</span>
    </div>
  );
  const unseen = held
    ? f >= c.solve ? <><Spinner f={f} size={28} color={QWEN} />?</> : "-"
    : f >= c.problems ? "0/1" : "-";
  return (
    <div style={{ position: "absolute", left: X0, top: 22, display: "flex", gap: 16 }}>
      {pill("Training", `${score}/3`, score === 3 ? GOOD : ground.ink, blip(c.closely) * blip(c.thats))}
      {pill(held ? "Held-out" : "New", unseen, !held && f >= c.problems ? AMBER : ground.ink, blip(c.problems) * blip(c.thats) * blip(c.solve))}
    </div>
  );
};

/** one quiz row: the prompt, the student's answer in its slot (typed, caret in the student's colour), the verdict */
const Row: React.FC<{ text: string; em?: string; answer: string; caret?: boolean; amber?: number; verdict?: "good" | "bad"; vk?: number; style?: React.CSSProperties }> = ({ text, em, answer, caret, amber = 0, verdict, vk = 0, style }) => {
  const { theme, ground } = useScene();
  return (
    <div style={{ position: "absolute", left: X0, width: W, height: 84, borderRadius: 16, background: "#FFFFFF", boxSizing: "border-box", boxShadow: `0 8px 24px rgba(20,24,40,0.07), inset 0 0 0 ${amber > 0 ? 3 : 1.5}px ${amber > 0 ? AMBER : ground.hairline}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 14, fontSize: 34, color: ground.ink, ...style }}>
      <span style={{ whiteSpace: "pre" }}>{em ? text.split(em).flatMap((p, i) => (i ? [<b key={i}>{em}</b>, p] : [p])) : text}</span>
      <span style={{ fontFamily: theme.font.mono, fontWeight: 700, padding: "4px 14px", borderRadius: 10, minWidth: 90, height: 52, boxSizing: "border-box", display: "flex", alignItems: "center", background: amber > 0 ? `rgba(245,165,36,${(0.28 * amber).toFixed(3)})` : "#F1F1F3" }}>
        {answer}
        {caret && <span style={{ width: 4, height: 38, marginLeft: 3, background: QWEN }} />}
      </span>
      <span style={{ flex: 1 }} />
      {verdict && <Verdict kind={verdict} k={vk} />}
    </div>
  );
};

const Training: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, fps, ground } = useScene();
  // from "problems" the memorised answer and its copy glow amber together; from "That's" they pulse in step
  const amber = prog(f, c.problems, 6, ease.linear) * (f > c.thats ? 0.75 + 0.25 * Math.cos((f - c.thats) / 7) : 1);
  const nx = (1 - prog(f, c.then, 20, (t) => 1 - Math.pow(1 - t, 4))) * WIN.w;
  const nt = typeOn(NEW.answer, f, c.struggle, fps, 60);
  const shake = f >= c.seen1 && f < c.seen1 + 18 ? Math.sin((f - c.seen1) * 1.3) * 10 * (1 - prog(f, c.seen1, 18, ease.linear)) : 0;
  const label = { position: "absolute", left: X0, fontSize: 32, fontWeight: 700, color: ground.dim, display: "flex", alignItems: "center", gap: 16 } as const;
  return (
    <>
      <div style={{ ...label, top: 108, opacity: prog(f, c.examples - 4, 6, ease.linear) }}>Training examples</div>
      {PILE.map((p, i) => {
        const { start, check } = typing(c, i);
        const t = typeOn(p.answer, f, start, fps, MS);
        const a = prog(f, c.examples + i * 5, 12);
        return (
          <Row key={p.text} text={p.text} answer={t.text} caret={f >= start - 6 && f < check + 4 && blink(f, t.typing)} amber={i === 0 ? amber : 0}
            verdict={f >= check ? "good" : undefined} vk={prog(f, check, 10, ease.linear)}
            style={{ top: 152 + i * 96, opacity: a, transform: `translateY(${((1 - a) * 60).toFixed(1)}px)` }} />
        );
      })}
      {f >= c.then && (
        <>
          <div style={{ ...label, top: 450, transform: `translateX(${nx.toFixed(1)}px)` }}>
            New problem
            {f >= c.never && <div style={pop(f, c.never, { dur: 10 })}><NeverSeen /></div>}
          </div>
          <Row text={NEW.text} em={NEW.em} answer={nt.text} caret={f < c.problems && blink(f, nt.typing)} amber={amber}
            verdict={f >= c.problems ? "bad" : undefined} vk={prog(f, c.problems + 2, 10, ease.linear)}
            style={{ top: 510, transform: `translateX(${(nx + shake).toFixed(1)}px)` }} />
        </>
      )}
    </>
  );
};

/** "The test is whether your model can solve problems it hasn't seen." It never finishes on screen */
const HeldOut: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, fps, theme, ground } = useScene();
  const typed = typeOn(TEST.answer, f, c.hasnt, fps, 267);
  const press = f >= c.solve - 3 && f < c.solve + 5 ? 0.94 : 1;
  const running = f >= c.solve;
  const dots = [0, 1, 2].map((i) => 0.35 + 0.65 * Math.max(0, Math.sin((f - i * 6) / 6)));
  return (
    <>
      <div style={{ position: "absolute", left: X0, top: 108, display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700, color: ground.dim }}>
        Held-out test
        {f >= c.test && <div style={pop(f, c.test, { dur: 10 })}><NeverSeen /></div>}
      </div>
      <div style={{ position: "absolute", left: X0, top: 176, width: W, height: 230, borderRadius: 20, background: "#FFFFFF", boxSizing: "border-box", padding: "30px 30px", boxShadow: `0 20px 50px rgba(20,24,40,0.12), inset 0 0 0 2px ${QWEN}55`, ...pop(f, c.the2 + 4, { dur: 10, from: 0.9 }) }}>
        <div style={{ fontSize: 46, color: ground.ink }}>{TEST.text}</div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: theme.font.mono, fontSize: 46, fontWeight: 700, minWidth: 200, height: 72, padding: "0 18px", boxSizing: "border-box", borderRadius: 12, background: "#F1F1F3", display: "flex", alignItems: "center", color: ground.ink }}>
            {typed.text}
            {blink(f, typed.typing) && <span style={{ width: 5, height: 50, marginLeft: 3, background: QWEN }} />}
          </span>
          <span style={{ flex: 1 }} />
          <Verdict kind="open" size={60} k={prog(f, c.test + 6, 10, ease.linear)} />
        </div>
      </div>
      <div style={{ position: "absolute", left: X0, top: 440, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ height: 72, padding: "0 30px", borderRadius: 16, background: running ? "#E9E9EE" : "#1C1C1E", color: running ? ground.ink : "#FFFFFF", fontSize: 32, fontWeight: 600, display: "flex", alignItems: "center", gap: 12, transform: `scale(${press})` }}>
          {running && <Spinner f={f} size={30} color={QWEN} />}
          {running ? "Running" : "Run test"}
        </div>
        {running && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32, color: ground.dim, ...pop(f, c.solve + 4, { dur: 10 }) }}>
            <Logo name="qwen" size={40} />
            {f >= c.hasnt ? "typing" : "thinking"}
            {dots.map((o, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: QWEN, opacity: o }} />)}
          </div>
        )}
      </div>
    </>
  );
};
