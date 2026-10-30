import React from "react";
import { Img, staticFile } from "remotion";
import { BUBBLE, CLAY, CREAM, INK, LINE, MUTED, SANS, SERIF, SHADOW, clamp } from "./E-util";
// reference edit K family E: claude.ai drawn at its own look (light theme): cream page, the "Claude" serif wordmark,
// the user's message in a beige bubble on the right, Claude's reply in serif, the white composer with
// "+", the model name and the clay send button, the spark while it streams. Square outer ground (their note).

export type Line = { k: "h1" | "h2" | "p" | "num" | "li"; t: string; b?: string; n?: number };
const LH: Record<Line["k"], number> = { h1: 60, h2: 56, p: 46, num: 46, li: 46 };
export const lineH = (l: Line) => LH[l.k];
const len = (l: Line) => (l.b?.length ?? 0) + l.t.length;

// where each line sits in the reply column and which char it starts at
export const layout = (lines: Line[]) => {
  let y = 0, c = 0;
  return lines.map((l) => { const o = { top: y, h: lineH(l), c0: c, len: len(l) }; y += o.h; c += o.len; return o; });
};
// the reply's content bottom after n chars (grows smoothly over a line's first chars, so the scroll glides)
export const contentBottom = (lines: Line[], n: number) => {
  const L = layout(lines);
  let bottom = 0;
  for (const o of L) if (n > o.c0) bottom = o.top + o.h * clamp((n - o.c0) / Math.min(o.len, 10));
  return bottom;
};

export const Spark: React.FC<{ src: string; size: number; rot?: number; style?: React.CSSProperties }> = ({ src, size, rot = 0, style }) => (
  <Img src={staticFile(src)} style={{ width: size, height: size, transform: `rotate(${rot}deg)`, ...style }} />
);

export const ClaudeFrame: React.FC<{ spark: string; w: number; h: number; children: React.ReactNode }> = ({ spark, w, h, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: CREAM, boxShadow: SHADOW, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 30, top: 18, display: "flex", alignItems: "center", gap: 10 }}>
      <Spark src={spark} size={30} />
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: INK, letterSpacing: -0.5 }}>Claude</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 68, height: 1, background: LINE }} />
    {children}
  </div>
);

export const Composer: React.FC<{ w: number; text?: string; caret?: boolean; press?: number }> = ({ w, text, caret, press = 0 }) => (
  <div style={{ width: w, height: 142, background: "#fff", borderRadius: 22, border: `1.5px solid ${LINE}`,
    boxShadow: "0 4px 18px rgba(20,20,19,0.07)", position: "relative", fontFamily: SANS, boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 26, top: 20, fontSize: 30, color: text ? INK : MUTED, display: "flex", alignItems: "center" }}>
      {text ?? "Reply to Claude…"}
      {caret && <div style={{ width: 2.5, height: 34, background: INK, marginLeft: 3 }} />}
    </div>
    <div style={{ position: "absolute", left: 20, bottom: 16, width: 46, height: 46, borderRadius: 12, border: `1.5px solid ${LINE}`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: MUTED, lineHeight: 1 }}>+</div>
    <div style={{ position: "absolute", right: 84, bottom: 26, fontSize: 26, color: MUTED }}>Sonnet 4.6</div>
    <div style={{ position: "absolute", right: 20, bottom: 16, width: 48, height: 48, borderRadius: 11, background: CLAY,
      transform: `scale(${1 - 0.12 * press})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  </div>
);

export const Bubble: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ background: BUBBLE, borderRadius: 18, padding: "12px 24px", fontFamily: SANS, fontSize: 30, color: INK, whiteSpace: "nowrap" }}>{text}</div>
);

const lineStyle = (l: Line): React.CSSProperties =>
  l.k === "h1" ? { fontSize: 40, fontWeight: 700 } : l.k === "h2" ? { fontSize: 32, fontWeight: 700, paddingTop: 12 } : { fontSize: 30, fontWeight: 400 };

// one reply line with its first `c` chars shown
export const ReplyLine: React.FC<{ l: Line; c: number }> = ({ l, c }) => {
  const b = l.b ?? "";
  const bs = b.slice(0, c), ts = l.t.slice(0, Math.max(0, c - b.length));
  const lead = l.k === "num" ? `${l.n}.` : l.k === "li" ? "•" : null;
  return (
    <div style={{ height: lineH(l), display: "flex", alignItems: "center", fontFamily: SERIF, color: INK, whiteSpace: "pre", ...lineStyle(l) }}>
      {lead && <span style={{ width: l.k === "num" ? 44 : 30, flexShrink: 0, color: l.k === "li" ? MUTED : INK }}>{lead}</span>}
      {bs && <span style={{ fontWeight: 600 }}>{bs}</span>}
      <span>{ts}</span>
    </div>
  );
};

// the streaming reply: n chars revealed, scrolled so the stream head stays in the viewport, spark under it
export const Reply: React.FC<{ lines: Line[]; n: number; vh: number; spark: string; rot: number; streaming: boolean; scroll?: number; skip?: Map<number, number> }> = ({ lines, n, vh, spark, rot, streaming, scroll, skip }) => {
  const L = layout(lines);
  const bottom = contentBottom(lines, n);
  const s = scroll ?? Math.max(0, bottom + 56 - vh);
  // the spark sits under the line being streamed (its full height), never over its letters
  let head = 0;
  for (const o of L) if (n > o.c0) head = o.top + o.h;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: vh, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: -s }}>
        {lines.map((l, i) => {
          const c = n - L[i]!.c0;
          if (c <= 0 || skip?.has(i)) return null;
          return <div key={i} style={{ position: "absolute", top: L[i]!.top, left: 0 }}><ReplyLine l={l} c={c} /></div>;
        })}
        {streaming && <Spark src={spark} size={36} rot={rot} style={{ position: "absolute", left: 0, top: head + 8 }} />}
      </div>
    </div>
  );
};
