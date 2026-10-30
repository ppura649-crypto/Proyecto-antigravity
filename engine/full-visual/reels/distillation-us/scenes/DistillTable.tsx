// The dataset the pipeline collects from the teacher. "collect": the table's header and its counter arrive.
// "answers,": prompt / answer rows pour in and scroll past fast, the counter racing to the report's "over 151 million
// exchanges", then the table settles on six rows. "quality,": a Quality column opens, each row gets a check or a
// cross, the crossed rows strike through and collapse out, the table tightens. "train": the rows fold into one
// "Dataset" line so the training job can open under it. Prompts and answers are plainly generic and carry no number.
import React from "react";
import { blurIn, countTo, draw, ease, mix, prog, useScene } from "../../../src/engine";
import { GOOD } from "./parts";
import { IN, RED, TAB, Verdict, type DT } from "./DistillKit";

const FILL: [string, string][] = [
  ["Refactor this loop", "Use map instead of a manual push."],
  ["Center a div", "Make the parent a flex container."],
  ["What is an API?", "A contract for how programs talk."],
  ["Write a haiku about rain", "Soft rain on the roof, gutters humming."],
  ["Is this query safe?", "No. Use parameters, not string joins."],
  ["Explain Big O", "How the cost grows as the input grows."],
  ["Rename this function", "Call it parseConfig, it says what it does."],
  ["Translate hello to Spanish", "Hola."],
  ["Why use Git?", "It keeps every version of your code."],
];
/** the six rows the table settles on; `ok` is the quality check's verdict */
const LAST: { p: string; a: string; ok: boolean }[] = [
  { p: "Explain recursion simply", a: "A function that calls itself on a smaller part.", ok: true },
  { p: "Write a regex for emails", a: "Sorry, I can't help with that.", ok: false },
  { p: "Summarize this email", a: "They want to move the meeting to Friday.", ok: true },
  { p: "Why is the sky blue?", a: "Air scatters blue light more than red.", ok: true },
  { p: "Explain DNS", a: "DNS is the", ok: false },
  { p: "Fix this failing test", a: "Await the call before the assertion.", ok: true },
];
const ROWS = [...FILL, ...FILL.slice(0, 9), ...LAST.map((r) => [r.p, r.a] as [string, string])];
const N = ROWS.length; // 24: the last six are LAST
const FIRST = N - TAB.rows;
const COL = { p: IN.l, pw: 300, a: IN.l + 318, qw: 64 };

const tableTimes = (t: DT) => {
  const verdict = (j: number) => t.quality + 4 + j * 5;
  return { verdict, strike: (j: number) => verdict(j) + 5, collapse: (j: number) => t.quality + 36 + j * 3, fold: t.train };
};

/** how far the table has streamed: rows poured in, 0..N, fast then settling */
const streamed = (f: number, t: DT) => N * prog(f, t.answers, 46, ease.out);

/** the table's height right now (rows in view minus the collapsed ones, then folded away on "train") */
export function tableHeight(f: number, t: DT) {
  const m = tableTimes(t);
  const s = streamed(f, t);
  const inView = Math.min(TAB.rows, s);
  const gone = LAST.reduce((acc, r, j) => acc + (r.ok ? 0 : prog(f, m.collapse(j), 12, ease.inOut)), 0);
  return (inView - gone) * TAB.pitch * (1 - prog(f, m.fold, 14, ease.inOut));
}

const Row: React.FC<{ i: number; y: number; alpha: number; t: DT; aw: number }> = ({ i, y, alpha, t, aw }) => {
  const { f, theme, ground } = useScene();
  const m = tableTimes(t);
  const j = i - FIRST;
  const last = j >= 0 ? LAST[j] : undefined;
  const bad = last && !last.ok;
  const k = bad ? prog(f, m.collapse(j), 12, ease.inOut) : 0;
  const ink = bad ? mix(f, m.strike(j), 8, ground.ink, ground.dim) : ground.ink;
  const text: React.CSSProperties = { fontFamily: theme.font.ui, fontSize: 30, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }; // texture
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: TAB.pitch, opacity: alpha * (1 - k), transform: `scaleY(${(1 - 0.5 * k).toFixed(3)})` }}>
      <div style={{ position: "absolute", left: COL.p, top: TAB.pitch - 1, width: IN.r - IN.l, height: 1.5, background: ground.hairline }} />
      <div style={{ ...text, position: "absolute", left: COL.p, top: 0, width: COL.pw, lineHeight: `${TAB.pitch}px`, fontWeight: 600 }}>{ROWS[i][0]}</div>
      <div style={{ ...text, position: "absolute", left: COL.a, top: 0, width: aw, lineHeight: `${TAB.pitch}px`, color: bad ? ink : ground.dim }}>{ROWS[i][1]}</div>
      {last && (
        <div style={{ position: "absolute", left: IN.r - 48, top: (TAB.pitch - 40) / 2 }}>
          <Verdict ok={last.ok} at={m.verdict(j)} />
        </div>
      )}
      {bad && f >= m.strike(j) && (
        <svg style={{ position: "absolute", left: COL.p - 6, top: TAB.pitch / 2 - 2, overflow: "visible" }} width={IN.r - IN.l - 52} height={4}>
          <path d={`M0 2 H${IN.r - IN.l - 52}`} stroke={RED} strokeWidth={3.5} strokeLinecap="round" {...draw(f, m.strike(j), 9)} />
        </svg>
      )}
    </div>
  );
};

/** the header: Prompt / Answer, then Quality; on "train" it becomes the dataset's one line */
const Head: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  if (f < t.collect) return null;
  const h: React.CSSProperties = { position: "absolute", top: TAB.head, height: TAB.headH, display: "flex", alignItems: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim };
  const out = prog(f, t.train, 8, ease.in);
  return (
    <div style={blurIn(f, t.collect, { dur: 9, rise: 12 })}>
      <div style={{ opacity: 1 - out }}>
        <div style={{ ...h, left: COL.p }}>Prompt</div>
        <div style={{ ...h, left: COL.a }}>Answer</div>
        {f >= t.quality && <div style={{ ...h, left: IN.r - 112, ...blurIn(f, t.quality, { dur: 8, rise: 8 }) }}>Quality</div>}
      </div>
      {f >= t.train + 4 && (
        <div style={{ ...h, left: COL.p, gap: 16, color: ground.ink, fontSize: 34, ...blurIn(f, t.train + 4, { dur: 8, rise: 10 }) }}>
          Dataset
          <span style={{ color: GOOD, fontSize: 32 }}>✓ checked</span>
        </div>
      )}
      <div style={{ position: "absolute", left: COL.p, top: TAB.head + TAB.headH, width: IN.r - IN.l, height: 2, background: ground.hairline }} />
    </div>
  );
};

/** under the rows: the live count of exchanges collected, the report's number */
const Footer: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  if (f < t.collect + 4 || f > t.train + 12) return null;
  const n = Math.round(countTo(f, t.answers, 50, 0, 151_000_000));
  const done = f >= t.answers + 50;
  const pulse = done ? 1 : 0.35 + 0.65 * Math.abs(Math.sin((f - t.collect) * 0.12));
  const top = TAB.top + tableHeight(f, t) + 14;
  return (
    <div style={{ position: "absolute", left: IN.l, top, width: IN.r - IN.l, height: 50, display: "flex", alignItems: "center", ...blurIn(f, t.collect + 4, { dur: 9, rise: 10 }), opacity: 1 - prog(f, t.train, 10) }}>
      <span style={{ width: 16, height: 16, borderRadius: 8, background: done ? GOOD : "#FF9F0A", opacity: pulse, marginRight: 14 }} />
      <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim }}>{done ? "Collected" : "Collecting"}</span>
      <span style={{ marginLeft: "auto", fontFamily: theme.font.mono, fontSize: 34, fontWeight: 700, color: ground.ink, fontVariantNumeric: "tabular-nums" }}>
        {n.toLocaleString("en-US")}
        {done ? "+" : ""}
      </span>
      <span style={{ marginLeft: 14, fontFamily: theme.font.ui, fontSize: 32, color: ground.dim }}>exchanges</span>
    </div>
  );
};

export const Table: React.FC<{ t: DT }> = ({ t }) => {
  const { f } = useScene();
  if (f < t.collect) return null;
  const m = tableTimes(t);
  const s = streamed(f, t);
  const off = Math.max(0, s - TAB.rows);
  const fold = 1 - prog(f, m.fold, 14, ease.inOut);
  const aw = IN.r - COL.a - 90 * prog(f, t.quality, 12, ease.inOut) - 4; // the answer column makes room for Quality
  const rows: React.ReactNode[] = [];
  let gone = 0;
  for (let i = 0; i < N; i++) {
    const alpha = Math.max(0, Math.min(1, s - i));
    const j = i - FIRST;
    const y = (i - off - gone) * TAB.pitch * fold;
    if (j >= 0 && !LAST[j].ok) gone += prog(f, m.collapse(j), 12, ease.inOut);
    if (alpha <= 0 || y < -TAB.pitch || y > TAB.rows * TAB.pitch) continue;
    rows.push(<Row key={i} i={i} y={y} alpha={alpha * fold} t={t} aw={aw} />);
  }
  return (
    <>
      <Head t={t} />
      <div style={{ position: "absolute", left: 0, top: TAB.top, width: 1080, height: TAB.rows * TAB.pitch + 4, overflow: "hidden" }}>{rows}</div>
      <Footer t={t} />
    </>
  );
};
