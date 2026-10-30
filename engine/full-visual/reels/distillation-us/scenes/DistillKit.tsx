// What the distill scene's pieces share: its word cues, the geometry of the "Distillation" app window (one macOS
// window, a three-step stepper Collect / Filter / Train, one body that changes state), and the small UI parts
// (role badge, verdict dot) drawn the same everywhere in it.
import React from "react";
import { arrive, pop, prog, useScene } from "../../../src/engine";

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function useTimes() {
  const { cue, scene } = useScene();
  const teacher = cue("teacher,");
  return {
    born: scene.from - 6, // mounted 6 frames early: the pair is taken over on the first frame
    from: scene.from,
    word: cue("distillation."),
    stronger: cue("stronger"),
    open: cue("model,") + 2, // the picker is clicked open as "model" is said
    select: teacher - 6, // Opus 4.7 is clicked, so the badge stamps on "teacher,"
    teacher,
    collect: cue("collect"),
    answers: cue("answers,"),
    quality: cue("quality,"),
    train: cue("train"),
    own: cue("own"),
    student: cue("student."),
    lift: cue("student.") + 3, // the student leaves the window for the centre
  };
}
export type DT = ReturnType<typeof useTimes>;

/** macOS system colours, light appearance */
export const ACCENT = "#007AFF";
export const RED = "#FF3B30";

/** the window and everything in it, in stage pixels. Centred on 540, clear of x 950 (Instagram's buttons). */
export const WIN = { x: 130, y: 650, w: 820, h: 790, r: 26, bar: 60 };
export const PAD = 28;
export const IN = { l: WIN.x + PAD, r: WIN.x + WIN.w - PAD }; // 158 .. 922
export const STEPPER = { cy: 758, d: 52, xs: [250, 540, 830], labelTop: 794, rule: 846 };
export const PICK = { top: 866, h: 84, fieldL: 310, markCx: 346, textL: 382, mark: 44 };
export const TAB = { head: 968, headH: 50, top: 1024, pitch: 56, rows: 6 };
export const JOB = { top: 1034, h: 390, rowCy: 1086, markCx: 400, mark: 48, textL: 436 };
export const WORD = { cy: 580, font: 100, titleCy: WIN.y + WIN.bar / 2, titleFont: 30 };

/** the window leaves as the student lifts out of it: it sinks and fades, accelerating (L2) */
export const windowOut = (f: number, t: DT) => {
  const k = prog(f, t.lift, 16, (x) => x * x);
  return { opacity: 1 - k, transform: `translateY(${(70 * k).toFixed(1)}px) scale(${(1 - 0.06 * k).toFixed(4)})` };
};

/** a role pill stamped onto a model ("teacher", "student"): lands big and presses down, a ring spreads behind it */
export const RoleBadge: React.FC<{ text: string; color: string; at: number; style?: React.CSSProperties }> = ({ text, color, at, style }) => {
  const { f, theme } = useScene();
  if (f < at) return null;
  const ring = arrive(f, at + 2, 20);
  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }}>
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: 26, boxShadow: `0 0 0 ${(ring * 22).toFixed(1)}px ${color}`,
          opacity: (1 - ring) * 0.35,
        }}
      />
      <div
        style={{
          ...pop(f, at, { dur: 9, from: 1.45 }), height: 50, padding: "0 20px", borderRadius: 25, background: color, color: "#FFFFFF",
          display: "flex", alignItems: "center", fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, letterSpacing: 0.2,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** the verdict a quality check gives a row: a green check or a red cross, popped in */
export const Verdict: React.FC<{ ok: boolean; at: number; size?: number }> = ({ ok, at, size = 40 }) => {
  const { f } = useScene();
  if (f < at) return null;
  return (
    <div
      style={{
        ...pop(f, at, { dur: 8, from: 0.4 }), width: size, height: size, borderRadius: size / 2, background: ok ? "#34C759" : RED,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
        {ok ? (
          <path d="M4.5 12.5l5 5 10-11" fill="none" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

/** the chevron of a macOS pop-up button */
export const Chevron: React.FC<{ color: string }> = ({ color }) => (
  <svg width={26} height={26} viewBox="0 0 24 24">
    <path d="M7 9.5l5 5 5-5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
