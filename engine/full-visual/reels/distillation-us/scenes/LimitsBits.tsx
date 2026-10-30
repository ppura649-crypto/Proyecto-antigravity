// The pieces `limits` is built from: the cues, the one window everything happens in (a model page with a tab bar,
// redrawn at a browser's geometry), the skill chip, the verdict disc, and small live bits (caret, spinner, eye).
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { AMBER, GOOD, QWEN } from "./parts";

/** what the Alibaba campaign targeted, in the report's words (anthropic.com/threat-intelligence-report-september-2026,
 *  GTG 16005: "The distillation attacks targeted agentic tasks, software engineering, kernel development, and
 *  long-horizon tasks.") Read again 2026-09-26. */
export const SKILLS = ["agentic tasks", "software engineering", "kernel development", "long-horizon tasks"];

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** the window: x 90-990, a title bar, a tab bar, then the body (what the tabs swap) */
export const WIN = { left: 90, top: 560, w: 900, h: 770, bar: 60, tabs: 68 };
export const BODY_TOP = WIN.top + WIN.bar + WIN.tabs; // 688
export const BODY_H = WIN.h - WIN.bar - WIN.tabs; // 642
export const TABS = [{ label: "Model card", x: 34, w: 190 }, { label: "Eval", x: 250, w: 84 }];
/** the tab bar's centre line and each tab's centre, stage coordinates (the cursor aims here) */
export const tabAt = (i: number) => ({ x: WIN.left + TABS[i].x + TABS[i].w / 2, y: WIN.top + WIN.bar + WIN.tabs / 2 });

export type LimitCues = ReturnType<typeof useLimitCues>;
export function useLimitCues() {
  const { cue, scene } = useScene();
  return {
    t0: scene.from - LEAD, smaller: cue("smaller"), student: cue("student"), also: cue("also"), cant: cue("can't"),
    skill: cue("skill"), learn: cue("learn"), examples: cue("examples"), closely: cue("closely"), then: cue("then"),
    struggle: cue("struggle"), problems: cue("problems"), never: cue("never"), seen1: cue("seen"), thats: cue("that's"),
    overfit: cue("overfitting"), so: cue("so"), collecting: cue("collecting"), transfer: cue("transfer"),
    skills: cue("skills"), the2: cue("the", 2), test: cue("test"), model: cue("model"), solve: cue("solve"),
    hasnt: cue("hasn't"), seen2: cue("seen", 2),
  };
}

/** which tab is showing, 0 = model card, 1 = eval: the cursor clicks, the body slides (18 frames, Apple-like) */
export const tabK = (f: number, c: LimitCues) =>
  prog(f, c.learn, 18, ease.inOut) - prog(f, c.so, 18, ease.inOut) + prog(f, c.the2, 18, ease.inOut);

/** a caret that blinks at rest and holds solid while typing */
export const blink = (f: number, typing: boolean) => typing || Math.floor(f / 18) % 2 === 0;

/** the browser window the whole scene lives in: traffic lights, the model's real address, two tabs */
export const Window: React.FC<{ y: number; tab: number; children: React.ReactNode }> = ({ y, tab, children }) => {
  const { theme, ground } = useScene();
  const ul = { x: lerp(TABS[0].x, TABS[1].x, tab), w: lerp(TABS[0].w, TABS[1].w, tab) };
  return (
    <div style={{ position: "absolute", left: WIN.left, top: WIN.top, width: WIN.w, height: WIN.h, borderRadius: 24, overflow: "hidden", background: "#FFFFFF", boxShadow: "0 30px 80px rgba(20,24,40,0.14), inset 0 0 0 1px #E3E3E6", transform: `translateY(${y.toFixed(1)}px)`, fontFamily: theme.font.ui }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: WIN.bar, background: "#F4F4F6", borderBottom: "1px solid #E3E3E6", display: "flex", alignItems: "center", padding: "0 26px", gap: 10 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
        <div style={{ marginLeft: 70, width: 560, height: 40, borderRadius: 10, background: "#FFFFFF", boxShadow: "inset 0 0 0 1px #E3E3E6", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: theme.font.mono, fontSize: 24, color: "#5C5C62" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2.4}><rect x={5} y={11} width={14} height={10} rx={2} /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          huggingface.co/Qwen/Qwen3-0.6B
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: WIN.bar, height: WIN.tabs, borderBottom: `1px solid ${ground.hairline}` }}>
        {TABS.map((t, i) => (
          <div key={t.label} style={{ position: "absolute", left: t.x, width: t.w, top: 0, height: WIN.tabs, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 600, color: Math.abs(tab - i) < 0.5 ? ground.ink : "#9A9AA0" }}>
            {t.label}
          </div>
        ))}
        <div style={{ position: "absolute", left: ul.x, width: ul.w, bottom: -1, height: 4, borderRadius: 2, background: ground.ink }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: WIN.bar + WIN.tabs, height: BODY_H, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w * 2, height: BODY_H, transform: `translateX(${(-WIN.w * tab).toFixed(1)}px)` }}>{children}</div>
      </div>
    </div>
  );
};

export const CHIP = { w: 560, h: 56 };

/** one skill: the teacher's colour while it travels, the student's once loaded; `fill` sweeps the transfer across it,
 *  `glow` marks it transferred (green, a check) */
export const SkillChip: React.FC<{ text: string; tint: string; fill?: number; glow?: number; style?: React.CSSProperties }> = ({ text, tint, fill = 0, glow = 0, style }) => {
  const { theme, ground } = useScene();
  const ring = glow > 0 ? `inset 0 0 0 3px ${GOOD}, 0 0 ${(28 * glow).toFixed(1)}px ${GOOD}77` : `inset 0 0 0 3px ${tint}`;
  return (
    <div style={{ position: "absolute", width: CHIP.w, height: CHIP.h, borderRadius: 12, overflow: "hidden", background: `color-mix(in srgb, ${tint} 10%, #FFFFFF)`, boxShadow: ring, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.ink, whiteSpace: "nowrap", ...style }}>
      {fill > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(fill * 100).toFixed(1)}%`, background: `color-mix(in srgb, ${glow > 0 ? GOOD : QWEN} 22%, #FFFFFF)` }} />}
      <span style={{ position: "relative", flex: 1 }}>{text}</span>
      {glow > 0 && <Verdict kind="good" size={38} k={glow} />}
    </div>
  );
};

/** the verdict disc: a green check, an amber cross, or a grey "?" while the answer is still open */
export const Verdict: React.FC<{ kind: "good" | "bad" | "open"; size?: number; k?: number }> = ({ kind, size = 48, k = 1 }) => {
  const bg = kind === "good" ? GOOD : kind === "bad" ? AMBER : "#ECECEE";
  const s = 0.5 + 0.5 * k + (k < 1 ? 0.06 * Math.sin(k * Math.PI) : 0);
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: 999, background: bg, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, k * 3), transform: `scale(${s.toFixed(3)})` }}>
      {kind === "open" ? <span style={{ fontFamily: "Inter, sans-serif", fontSize: size * 0.62, fontWeight: 800, color: "#5C5C62", lineHeight: 1 }}>?</span> : (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          {kind === "good" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
          {kind === "bad" && <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />}
        </svg>
      )}
    </div>
  );
};

/** a small spinning ring: something is being worked out right now */
export const Spinner: React.FC<{ f: number; size?: number; color?: string }> = ({ f, size = 30, color = "#8E8E93" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${(f * 9) % 360}deg)`, flex: "none" }}>
    <circle cx={12} cy={12} r={9} fill="none" stroke="#E3E3E6" strokeWidth={3} />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const EyeOff: React.FC<{ size?: number; color?: string }> = ({ size = 30, color = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3.2 4.3M6.6 6.6C4.4 8 2.8 10.1 2 12c1 2.5 5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
  </svg>
);

/** the dark pill that says a problem is one the student has never seen */
export const NeverSeen: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { theme } = useScene();
  return (
    <div style={{ height: 48, padding: "0 20px", borderRadius: 24, background: "#1C1C1E", display: "inline-flex", alignItems: "center", gap: 10, fontFamily: theme.font.ui, fontSize: 30, fontWeight: 600, color: "#FFFFFF", ...style }}>
      <EyeOff size={28} /> never seen
    </div>
  );
};
