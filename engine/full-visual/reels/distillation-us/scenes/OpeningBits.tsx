// What hook, report and distill share: the two marks as positioned objects (with velocity blur), the plain-word label
// under each, a Claude reply card (the real chat-reply shape: the spark, then a few short lines of answer text), a
// user prompt bubble, and the stream of reply cards arcing from the teacher to the student. The stream's geometry is
// a function of where the marks are on this frame, so when the marks shrink to a strip the stream shrinks with them.
import React, { useId } from "react";
import { loadFont } from "@remotion/google-fonts/SourceSerif4";
import { blurIn, useScene } from "../../../src/engine";
import { CLAUDE, Logo, QWEN, type LogoName } from "./parts";

const serif = loadFont("normal", { weights: ["400", "600"], subsets: ["latin"] });
loadFont("italic", { weights: ["400"], subsets: ["latin"] });
export const SERIF = serif.fontFamily;

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export type Pt = { x: number; y: number };
export type MarkState = { cx: number; cy: number; size: number; rot?: number; scale?: number; opacity?: number };

/** the stream's rhythm: one card every 10 frames on a grid anchored at frame 0, so two scenes that both draw the
 *  stream across a handover draw the very same cards at the very same places */
export const grid = (from: number, to: number) => {
  const out: number[] = [];
  for (let e = Math.ceil(from / STEP) * STEP; e < to; e += STEP) out.push(e);
  return out;
};
export const every = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let e = from; e < to; e += step) out.push(e);
  return out;
};
export const TRAVEL = 44;
export const STEP = 10;

/** a mark at a position; blurred along its own velocity (from the previous frame's state) while it travels */
export const MarkAt: React.FC<{ name: LogoName; s: MarkState; prev?: MarkState; invert?: boolean; z?: number }> = ({ name, s, prev, invert, z }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bx = prev ? Math.min(28, Math.abs(s.cx - prev.cx) * 0.4) : 0;
  const by = prev ? Math.min(28, Math.abs(s.cy - prev.cy) * 0.4) : 0;
  const moving = bx > 0.4 || by > 0.4;
  return (
    <>
      {moving && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      <div
        style={{
          position: "absolute", left: s.cx - s.size / 2, top: s.cy - s.size / 2, width: s.size, height: s.size, zIndex: z ?? 5,
          opacity: s.opacity ?? 1, filter: moving ? `url(#${id})` : undefined,
          transform: `rotate(${(s.rot ?? 0).toFixed(2)}deg) scale(${(s.scale ?? 1).toFixed(4)})`,
        }}
      >
        <Logo name={name} size={s.size} invert={invert} />
      </div>
    </>
  );
};

/** the plain word under a mark: its name, then its role. 44 px, 700, the ground's ink, centred, top 40 px under it */
export const LABEL = { font: 44, weight: 700, gap: 40 };
export const MarkLabel: React.FC<{ text: string; s: MarkState; style?: React.CSSProperties }> = ({ text, s, style }) => {
  const { theme, ground } = useScene();
  return (
    <div
      style={{
        position: "absolute", left: s.cx - 200, width: 400, top: s.cy + s.size / 2 + LABEL.gap, textAlign: "center", zIndex: 6,
        fontFamily: theme.font.ui, fontSize: LABEL.font, lineHeight: `${LABEL.font + 8}px`, fontWeight: LABEL.weight, color: ground.ink, ...style,
      }}
    >
      {text}
    </div>
  );
};

/** a label that changes word on the same spot: the old word defocuses out, the new one arrives in place */
export const SwapLabel: React.FC<{ from: string; to: string; at: number; s: MarkState; born?: number }> = ({ from, to, at, s, born }) => {
  const { f } = useScene();
  const inStyle = born !== undefined ? blurIn(f, born, { dur: 9, rise: 14 }) : {};
  if (f < at) return <MarkLabel text={from} s={s} style={inStyle} />;
  const out = Math.min(1, (f - at) / 5);
  return (
    <>
      {out < 1 && <MarkLabel text={from} s={s} style={{ opacity: 1 - out, filter: `blur(${(out * 10).toFixed(1)}px)` }} />}
      <MarkLabel text={to} s={s} style={blurIn(f, at + 2, { dur: 8, rise: 12, scaleFrom: 0.92 })} />
    </>
  );
};

const REPLIES = [
  ["Sure. The bug is in", "the loop: it starts", "one index too late."],
  ["Here's a cleaner way:", "read the file once,", "then parse each line."],
  ["Short answer: yes.", "Cache the result so", "the call runs once."],
  ["Step by step: first,", "split the problem,", "then solve each part."],
];
export const CARD = { w: 236, h: 138 };

/** a Claude reply as the chat shows it: the spark, then the answer's first lines (generic text, texture) */
export const ReplyCard: React.FC<{ v: number; dark: boolean; style?: React.CSSProperties; children?: React.ReactNode }> = ({ v, dark, style, children }) => (
  <div
    style={{
      position: "absolute", width: CARD.w, height: CARD.h, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
      background: dark ? "#30302E" : "#FFFFFF", boxShadow: dark ? "0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px #3E3E3B" : "0 10px 28px rgba(20,20,19,0.14), inset 0 0 0 1px #E8E6DC",
      fontFamily: SERIF, fontSize: 19, lineHeight: "25px", color: dark ? "#E8E6DC" : "#1F1E1D", ...style,
    }}
  >
    <Logo name="claude" size={22} style={{ marginBottom: 7 }} />
    {REPLIES[v % REPLIES.length].map((l) => (
      <div key={l} style={{ whiteSpace: "nowrap" }}>{l}</div>
    ))}
    {children}
  </div>
);

const PROMPTS = ["Solve this step by step", "Fix this function", "Explain your reasoning"];
/** a user message as the chat shows it: a rounded grey bubble */
export const PromptBubble: React.FC<{ v: number; dark: boolean; style?: React.CSSProperties }> = ({ v, dark, style }) => (
  <div
    style={{
      position: "absolute", height: 50, padding: "0 20px", borderRadius: 14, display: "flex", alignItems: "center", whiteSpace: "nowrap",
      background: dark ? "#141413" : "#F0EEE6", boxShadow: dark ? "inset 0 0 0 1px #3A3A38" : "inset 0 0 0 1px #E0DDD2",
      fontFamily: "Inter, sans-serif", fontSize: 20, color: dark ? "#E8E6DC" : "#1F1E1D", ...style,
    }}
  >
    {PROMPTS[v % PROMPTS.length]}
  </div>
);

/** a point on the arc between a and b; the arc rises `lift` px above them at the middle (negative lift: below) */
export const arcAt = (a: Pt, b: Pt, lift: number, p: number): Pt => {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift * 2 };
  if (lift < 0) c.y = Math.max(a.y, b.y) - lift * 2;
  const q = 1 - p;
  return { x: q * q * a.x + 2 * q * p * c.x + p * p * b.x, y: q * q * a.y + 2 * q * p * c.y + p * p * b.y };
};

/** the stream of answers from the teacher's mark to the student's, drawn on this frame's geometry */
export const Stream: React.FC<{ c: MarkState; q: MarkState; emits: number[]; dark: boolean; travel?: number; skip?: (e: number) => boolean }> = ({ c, q, emits, dark, travel = TRAVEL, skip }) => {
  const { f } = useScene();
  const k = c.size / 220;
  const a = { x: c.cx + c.size * 0.3, y: c.cy };
  const b = { x: q.cx - q.size * 0.3, y: q.cy };
  const lift = 175 * Math.min(k, q.size / 220);
  return (
    <>
      {emits.map((e) => {
        if (f < e || f > e + travel || (skip && skip(e))) return null;
        const p = (f - e) / travel;
        const pt = arcAt(a, b, lift, p);
        const sc = k * (0.26 + 0.62 * Math.sin(Math.PI * p));
        const o = Math.min(1, p * 7, (1 - p) * 6);
        return <ReplyCard key={e} v={Math.floor(e / STEP)} dark={dark} style={{ left: pt.x - CARD.w / 2, top: pt.y - CARD.h / 2, transform: `scale(${sc.toFixed(4)})`, opacity: o, zIndex: 3 }} />;
      })}
    </>
  );
};

/** how hard the student's mark is being hit right now: a short scale kick per arrival */
export const hitKick = (f: number, arrivals: number[]) => {
  let k = 0;
  for (const a of arrivals) if (f >= a && f < a + 24) k = Math.max(k, Math.exp(-(f - a) / 5));
  return k;
};

/** the violet rings the student gives off as each answer lands in it */
export const HitRings: React.FC<{ q: MarkState; arrivals: number[]; color?: string }> = ({ q, arrivals, color = QWEN }) => {
  const { f } = useScene();
  return (
    <>
      {arrivals.map((a) => {
        if (f < a || f > a + 22) return null;
        const t = (f - a) / 22;
        const r = (q.size / 2) * (0.9 + 0.55 * t);
        return (
          <div key={a} style={{ position: "absolute", left: q.cx - r, top: q.cy - r, width: r * 2, height: r * 2, borderRadius: "50%", boxShadow: `0 0 0 ${(4 * (1 - t) + 1).toFixed(1)}px ${color}`, opacity: 0.55 * (1 - t), zIndex: 4 }} />
        );
      })}
    </>
  );
};

/** one soft orange ring off the teacher: "stronger" */
export const Halo: React.FC<{ s: MarkState; at: number; color?: string; dur?: number }> = ({ s, at, color = CLAUDE, dur = 30 }) => {
  const { f } = useScene();
  if (f < at || f > at + dur) return null;
  const t = (f - at) / dur;
  const r = (s.size / 2) * (0.8 + 0.7 * t);
  return <div style={{ position: "absolute", left: s.cx - r, top: s.cy - r, width: r * 2, height: r * 2, borderRadius: "50%", boxShadow: `0 0 0 ${(6 * (1 - t) + 1).toFixed(1)}px ${color}`, opacity: 0.6 * (1 - t), zIndex: 4 }} />;
};
