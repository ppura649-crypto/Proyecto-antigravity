import React from "react";
import { Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
// keyframes-v1 family N (2026-09-25): shared kit for V4 camera, V5 upload, V11 finished, V16 any-LLM.
// The claude.ai look is copied from cards/holo/E-claude.tsx + E-util.ts (never edited there). Every Claude
// surface in this video comes from here so V5, V11 and V16 match.

export const SERIF = `${loadSerif("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily}, Georgia, serif`;
export const SANS = `${loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily}, -apple-system, sans-serif`;
export const CREAM = "#FAF9F5", BUBBLE = "#F0EEE6", INK = "#141413", MUTED = "#73726C", LINE = "#E6E3D9";
export const CLAY = "#D97757", CLAY_OFF = "#EDC3B2", GREEN = "#4ADE80";
export const SHADOW = "0 26px 60px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, f: number) => a + (b - a) * f;
export const ramp = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
// a calm spring from spine ms `at`: over-damped, no overshoot, ~90% in 330 ms
export const calm = (t: number, at: number, fps: number) =>
  t < at ? 0 : spring({ frame: Math.min(((t - at) / 1000) * fps, 6 * fps), fps, config: { damping: 30, stiffness: 190, mass: 1 } });
// a fall under gravity that lands softly: accelerates, then a short decel in the last ~12%
export const fall = (t: number, a: number, b: number) => ramp(t, a, b, Easing.bezier(0.5, 0, 0.78, 1));
// a short squash after a landing (0 → 1 → 0 over `d` ms)
export const bump = (t: number, at: number, d = 160) => (t < at || t > at + d ? 0 : Math.sin(((t - at) / d) * Math.PI));
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
// the clean exit every card shares: last 140 ms fade + sink
export const exitK = (t: number, toMs: number) => ramp(t, toMs - 140, toMs, Easing.in(Easing.cubic));

// a clip retimed piecewise (copy of holo B-kit RemapVideo): spine ms [t0,t1) → source s [s0,s1]
export type Seg = { t0: number; t1: number; s0: number; s1: number };
export const RemapVideo: React.FC<{ tMs: number; fps: number; src: string; segs: Seg[]; style: React.CSSProperties }> = ({ tMs, fps, src, segs, style }) => {
  let i = segs.findIndex((g) => tMs >= g.t0 && tMs < g.t1);
  if (i < 0) i = tMs < segs[0]!.t0 ? 0 : segs.length - 1;
  const g = segs[i]!;
  const rate = (g.s1 - g.s0) / ((g.t1 - g.t0) / 1000);
  return (
    <Sequence key={i} from={Math.ceil((g.t0 / 1000) * fps)} layout="none">
      <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={Math.round(g.s0 * fps)} style={style} />
    </Sequence>
  );
};

// ---------- the clip card (V4 → V5): the recorded take as a physical thumbnail, "1:29" on it ----------
export const CARD = { w: 150, h: 267 };
export const LAND = { x: 872, y: 452, rot: -4 }; // centre where it comes to rest in the lower right corner
export const ClipCard: React.FC<{ thumb: string; w: number; h: number; dur?: number }> = ({ thumb, w, h, dur = 1 }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#111" }}>
    <Img src={staticFile(thumb)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.3, opacity: dur,
      background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))" }} />
    <div style={{ position: "absolute", left: 10, right: 12, bottom: 9, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: dur }}>
      <svg width="26" height="17" viewBox="0 0 26 17"><rect x="0.5" y="1.5" width="17" height="14" rx="3" fill="#fff" /><path d="M19 6.2L25 2.8v11.4L19 10.8z" fill="#fff" /></svg>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 25, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>1:29</div>
    </div>
  </div>
);
// a physical object at pose p: centre x,y, size w,h, rotation, lift (0 = resting, 1 = high: shadow wide and soft)
export type Pose = { x: number; y: number; w: number; h: number; rot: number; lift: number; blur?: number };
export const Body: React.FC<{ p: Pose; children: React.ReactNode; z?: number }> = ({ p, children, z }) => (
  <div style={{ position: "absolute", left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h, zIndex: z,
    transform: `rotate(${p.rot}deg)`, filter: p.blur ? `blur(${p.blur}px)` : undefined,
    boxShadow: `0 ${8 + 30 * p.lift}px ${18 + 50 * p.lift}px rgba(0,0,0,${0.5 - 0.15 * p.lift}), 0 3px 8px rgba(0,0,0,0.35)` }}>
    {children}
  </div>
);

// ---------- claude.ai (light theme), after E-claude ----------
export const Spark: React.FC<{ src: string; size: number; rot?: number; style?: React.CSSProperties }> = ({ src, size, rot = 0, style }) => (
  <Img src={staticFile(src)} style={{ width: size, height: size, transform: `rotate(${rot}deg)`, ...style }} />
);
// the Claude mark png is an app tile; the spark alone is drawn from it by a round crop
export const SparkMark: React.FC<{ src: string; size: number; rot?: number }> = ({ src, size, rot = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", transform: `rotate(${rot}deg)`, flexShrink: 0 }}>
    <Img src={staticFile(src)} style={{ width: size * 1.28, height: size * 1.28, margin: -size * 0.14 }} />
  </div>
);

export const ClaudeFrame: React.FC<{ mark: string; w: number; h: number; children: React.ReactNode }> = ({ mark, w, h, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: CREAM, boxShadow: SHADOW, overflow: "hidden" }}>
    {children}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 68, zIndex: 10, background: CREAM, borderBottom: `1px solid ${LINE}` }}>
      <div style={{ position: "absolute", left: 28, top: 17, display: "flex", alignItems: "center", gap: 10 }}>
        <SparkMark src={mark} size={32} />
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: INK, letterSpacing: -0.5 }}>Claude</div>
      </div>
    </div>
  </div>
);

// the file chip in the composer: thumbnail, name, meta, upload bar
export const FileChip: React.FC<{ thumb: string; name: string; meta: string; w: number; open?: number; progress?: number; box?: boolean; dark?: boolean; scale?: number }> = ({
  thumb, name, meta, w, open = 1, progress, box, dark, scale = 1,
}) => {
  const H = 84 * scale, T = 64 * scale;
  const cw = mix(T + 20 * scale, w, open);
  return (
    <div style={{ position: "relative", width: cw, height: H, borderRadius: 14 * scale, border: `1.5px solid ${dark ? "#3A3A3A" : LINE}`,
      background: dark ? "#262626" : "#fff", boxSizing: "border-box", overflow: "hidden", fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 9 * scale, top: 9 * scale, width: T, height: T, borderRadius: 9 * scale, overflow: "hidden", background: "#0B0B0B" }}>
        <Img src={staticFile(thumb)} style={{ width: "100%", height: "100%", objectFit: box ? "contain" : "cover", transform: box ? "scale(0.92)" : undefined }} />
        {!box && <svg style={{ position: "absolute", left: T / 2 - 9 * scale, top: T / 2 - 10 * scale }} width={20 * scale} height={20 * scale} viewBox="0 0 20 20"><path d="M5 3l12 7-12 7z" fill="#fff" opacity="0.92" /></svg>}
      </div>
      <div style={{ position: "absolute", left: T + 24 * scale, top: 13 * scale, opacity: clamp((open - 0.45) / 0.55), whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 25 * scale, fontWeight: 600, color: dark ? "#F2F2F2" : INK, letterSpacing: -0.2 }}>{name}</div>
        <div style={{ fontSize: 20 * scale, color: dark ? "#9A9A9A" : MUTED, marginTop: 3 * scale }}>{meta}</div>
      </div>
      {progress !== undefined && progress > 0 && (
        <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${progress * 100}%`, background: CLAY, opacity: progress >= 1 ? 0 : 1 }} />
      )}
    </div>
  );
};

// the "Keyframes" skill tag: a pill with a keyframe diamond
export const SkillTag: React.FC<{ k: number }> = ({ k }) => (
  <div style={{ height: 50, padding: "0 20px 0 16px", borderRadius: 999, background: "#F5F3EC", border: `1.5px solid ${LINE}`,
    display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 24, fontWeight: 600, color: INK,
    opacity: clamp(k * 1.6), transform: `translateY(${(1 - k) * 10}px) scale(${0.9 + 0.1 * k})`, transformOrigin: "0 50%" }}>
    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 1.5L18.5 10 10 18.5 1.5 10z" fill={INK} /></svg>
    Keyframes
  </div>
);

// claude.ai composer, anchored at its bottom; `att` 0..1 opens the attachment row above the text line
export const COMP_H = 142, COMP_ATT = 92;
export const Composer: React.FC<{ w: number; att: number; text?: string; placeholder?: string; send: number; press?: number; children?: React.ReactNode }> = ({
  w, att, text, placeholder = "How can I help you today?", send, press = 0, children,
}) => {
  const h = COMP_H + COMP_ATT * att;
  const on = send;
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: w, height: h, background: "#fff", borderRadius: 22, border: `1.5px solid ${LINE}`,
      boxShadow: "0 4px 18px rgba(20,20,19,0.07)", fontFamily: SANS, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 18, top: 16, display: "flex", alignItems: "center", gap: 14 }}>{children}</div>
      <div style={{ position: "absolute", left: 26, top: 20 + COMP_ATT * att, fontSize: 30, color: text ? INK : MUTED }}>{text ?? placeholder}</div>
      <div style={{ position: "absolute", left: 20, bottom: 16, width: 46, height: 46, borderRadius: 12, border: `1.5px solid ${LINE}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: MUTED, lineHeight: 1 }}>+</div>
      <div style={{ position: "absolute", right: 84, bottom: 26, fontSize: 26, color: MUTED }}>Sonnet 4.6</div>
      <div style={{ position: "absolute", right: 20, bottom: 16, width: 48, height: 48, borderRadius: 11,
        background: on >= 1 ? CLAY : interpolateColor(CLAY_OFF, CLAY, on),
        boxShadow: on > 0 ? `0 0 ${22 * on}px rgba(217,119,87,${0.45 * on})` : undefined,
        transform: `scale(${(1 - 0.12 * press) * (1 + 0.06 * Math.sin(clamp(on) * Math.PI))})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const interpolateColor = (a: string, b: string, f: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(mix(v, B[i]!, clamp(f)))).join(",")})`;
};

// the white KEY FRAMES wordmark (1400x300 png, glyphs span y 0.29..0.73) dropping in above a surface
export const Wordmark: React.FC<{ src: string; w: number; k: number }> = ({ src, w, k }) => (
  <Img src={staticFile(src)} style={{ width: w, height: (w * 300) / 1400, opacity: clamp(k * 2.2),
    transform: `translateY(${(1 - k) * -34}px) scale(${1.04 - 0.04 * k})`,
    filter: `drop-shadow(0 ${4 + 10 * (1 - k)}px ${10 + 16 * (1 - k)}px rgba(0,0,0,${0.55 - 0.15 * (1 - k)}))` }} />
);
