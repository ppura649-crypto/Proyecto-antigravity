// claude.ai in its dark theme, redrawn at its own geometry (checked against Mobbin captures of claude.ai, 2026):
// warm charcoal page, the user's message in a darker bubble on the right, Claude's reply on the left in a serif, the
// thinking as a grey collapsible row above the answer (open: the steps in a bordered box; closed: one summary line
// with a chevron), and the Claude spark under the latest reply.
import React from "react";
import { loadFont } from "@remotion/google-fonts/SourceSerif4";
import { blurIn, blurOut, prog, ease, useScene } from "../../../src/engine";
import { Logo } from "./parts";

const serif = loadFont("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;

export const CHAT = { bg: "#262624", line: "#3B3A37", bubble: "#141413", text: "#F5F4EF", grey: "#A6A39A", dim: "#8A877F" };

/** the chevron claude.ai puts after the thinking row: right when closed, down when open */
const Chevron: React.FC<{ open: number }> = ({ open }) => (
  <svg width={30} height={30} viewBox="0 0 24 24" style={{ transform: `rotate(${(90 * open).toFixed(1)}deg)`, flex: "none" }}>
    <path d="M9 6l6 6-6 6" stroke={CHAT.grey} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserBubble: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", right: 130, maxWidth: 600, padding: "18px 26px", borderRadius: 18, background: CHAT.bubble, color: CHAT.text, fontFamily: theme.font.ui, fontSize: 36, lineHeight: "48px", ...style }}>
      {text}
    </div>
  );
};

/**
 * The thinking block. `open` 0..1 unfolds the steps; `steps[i]` is the frame step i appears (Infinity: not yet);
 * `fold` is the frame the steps fold away and the header becomes the one-line summary; `live` shimmers the header
 * while Claude is still thinking.
 */
export const ThinkingBlock: React.FC<{
  width: number; open: number; steps: { text: string; at: number }[]; fold: number; summary: string; live: boolean; ring: number;
}> = ({ width, open, steps, fold, summary, live, ring }) => {
  const { f, theme } = useScene();
  const PITCH = 48;
  const bodyH = (steps.length * PITCH + 34) * open;
  const shimmerX = ((f * 9) % 700) - 200;
  const headerStyle: React.CSSProperties = live
    ? { background: `linear-gradient(90deg, ${CHAT.grey} ${shimmerX - 120}px, #FFFFFF ${shimmerX}px, ${CHAT.grey} ${shimmerX + 120}px)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
    : { color: CHAT.grey };
  return (
    <div style={{ width, borderRadius: 14, boxShadow: `inset 0 0 0 ${open > 0.02 || ring > 0.02 ? 2 : 0}px ${ring > 0.02 ? `rgba(255,255,255,${(0.35 + 0.6 * ring).toFixed(2)})` : CHAT.line}`, overflow: "hidden" }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 500, position: "relative" }}>
        <div style={{ position: "relative", height: 40, flex: 1 }}>
          {f < fold + 8 && <span style={{ position: "absolute", left: 0, whiteSpace: "nowrap", ...headerStyle, ...(f >= fold ? blurOut(f, fold, { dur: 8 }) : {}) }}>Thinking</span>}
          {f >= fold && <span style={{ position: "absolute", left: 0, whiteSpace: "nowrap", color: CHAT.text, ...blurIn(f, fold + 4, { dur: 9, rise: 10 }) }}>{summary}</span>}
        </div>
        <Chevron open={open} />
      </div>
      <div style={{ height: bodyH, overflow: "hidden", padding: "0 22px" }}>
        <div style={{ borderLeft: `3px solid ${CHAT.line}`, paddingLeft: 20, marginBottom: 20 }}>
          {steps.map((s, i) =>
            f >= s.at ? (
              <div key={i} style={{ height: PITCH, display: "flex", alignItems: "center", fontFamily: theme.font.ui, fontSize: 32, color: "#C9C6BC", whiteSpace: "nowrap", ...(f < fold ? blurIn(f, s.at, { dur: 8, rise: 12 }) : blurOut(f, fold + i * 2, { dur: 8 })) }}>
                {s.text}
              </div>
            ) : (
              <div key={i} style={{ height: PITCH }} />
            ),
          )}
        </div>
      </div>
    </div>
  );
};

/** Claude's answer, in claude.ai's serif, typed with a caret */
export const Answer: React.FC<{ text: string; typing: boolean; style?: React.CSSProperties }> = ({ text, typing, style }) => (
  <div style={{ position: "absolute", left: 130, fontFamily: serif, fontSize: 46, lineHeight: "58px", color: CHAT.text, whiteSpace: "nowrap", ...style }}>
    {text}
    {typing && <span style={{ display: "inline-block", width: 3, height: 44, marginLeft: 3, verticalAlign: "-6px", background: CHAT.text }} />}
  </div>
);

/** the spark claude.ai keeps under the latest reply; it turns while Claude is writing */
export const Spark: React.FC<{ spin: number; style?: React.CSSProperties }> = ({ spin, style }) => (
  <div style={{ position: "absolute", left: 130, transform: `rotate(${spin.toFixed(1)}deg)`, ...style }}>
    <Logo name="claude" size={56} />
  </div>
);

export const easeOpen = (f: number, at: number, dur = 16) => prog(f, at, dur, ease.inOut);
