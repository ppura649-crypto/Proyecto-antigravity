// The motion kit: verbs any drawn thing can perform. Pure functions of the frame; durations are 60 fps frames
// and default to what was measured on the reference reels. No springs to tune: a start frame and a duration.
import type { CSSProperties } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";

// The two curves measured on all six reference reels at 60 fps
// the reference study. They depend on the
// duration because the law is per-frame, not per-move: an entrance keeps 0.81 of its remaining distance every
// frame whether it runs for 12 frames or 29.
const R_IN = -Math.log(0.81); // 0.2107: remaining distance x 0.81 per frame, tau 78 ms, 90 % in 11-12 frames
const R_OUT = Math.log(1.45); // 0.3716: displacement x 1.45 per frame, accelerating out of frame

/** L1. The entrance easing. Never overshoots; this is not a spring. */
export const arriveEase = (dur: number) => {
  const k = R_IN * Math.max(1, dur);
  const d = 1 - Math.exp(-k);
  return (t: number) => (1 - Math.exp(-k * t)) / d;
};

/** L2. The exit easing: the mirror of L1, accelerating, at full opacity. */
export const leaveEase = (dur: number) => {
  const k = R_OUT * Math.max(1, dur);
  const d = Math.exp(k) - 1;
  return (t: number) => (Math.exp(k * t) - 1) / d;
};

export const ease = {
  out: Easing.out(Easing.cubic),
  outHard: Easing.out(Easing.exp),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(1.6)),
  linear: Easing.linear,
};

/** L1 progress: what an arriving thing has covered by this frame */
export const arrive = (f: number, start: number, dur = 24) => prog(f, start, dur, arriveEase(dur));

/** L2 progress: what a leaving thing has covered by this frame */
export const leave = (f: number, start: number, dur = 11) => prog(f, start, dur, leaveEase(dur));

/** 0 to 1 between start and start+dur, clamped */
export const prog = (f: number, start: number, dur: number, easing: (n: number) => number = ease.out) =>
  interpolate(f, [start, start + Math.max(1, dur)], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** arrives in place, out of focus. The default arrival for anything that does not travel */
export function blurIn(f: number, start: number, o: { dur?: number; blur?: number; rise?: number; scaleFrom?: number } = {}): CSSProperties {
  const p = prog(f, start, o.dur ?? 7);
  const s = (o.scaleFrom ?? 1) + (1 - (o.scaleFrom ?? 1)) * p;
  return {
    opacity: p,
    filter: p < 1 ? `blur(${((1 - p) * (o.blur ?? 12)).toFixed(2)}px)` : undefined,
    transform: `translateY(${((1 - p) * (o.rise ?? 0)).toFixed(2)}px) scale(${s.toFixed(4)})`,
  };
}

/** badges, chips, pills, avatars: scale up with a small overshoot */
export function pop(f: number, start: number, o: { dur?: number; from?: number } = {}): CSSProperties {
  const p = prog(f, start, o.dur ?? 8, ease.back);
  const from = o.from ?? 0.6;
  return { opacity: prog(f, start, 4, ease.linear), transform: `scale(${(from + (1 - from) * p).toFixed(4)})` };
}

/** blur as its own timeline, not as velocity: flat at maximum, then released so it clears AFTER the move has
 *  settled. This is what makes an entrance feel heavy; the reference holds it 9-11 frames and releases over 12-13. */
export const blurHold = (f: number, start: number, hold = 11, release = 20) =>
  f < start ? 0 : f < start + hold ? 1 : 1 - prog(f, start + hold, release, ease.linear);

/** leaves in place: blur and fade */
export function blurOut(f: number, start: number, o: { dur?: number; blur?: number } = {}): CSSProperties {
  const p = prog(f, start, o.dur ?? 7, ease.in);
  return { opacity: 1 - p, filter: p > 0 ? `blur(${(p * (o.blur ?? 12)).toFixed(2)}px)` : undefined };
}

/** characters shown so far. About 36 ms a character on the references */
export function typeOn(text: string, f: number, start: number, fps: number, msPerChar = 36) {
  const n = Math.floor(((f - start) / fps) * (1000 / msPerChar));
  const shown = Math.max(0, Math.min(text.length, n));
  return { text: text.slice(0, shown), done: shown >= text.length, typing: f >= start && shown < text.length };
}

/** a number that runs and lands. Land it on the word: start = endsOn(word, dur) */
export function countTo(f: number, start: number, dur: number, from: number, to: number, easing = ease.outHard) {
  return f >= start + dur ? to : from + (to - from) * prog(f, start, dur, easing);
}

/** a live number keeps twitching after it lands: measured, not animated */
export function jitter(f: number, landed: number, amp: number, everyFrames = 5) {
  if (f < landed) return 0;
  const k = Math.floor((f - landed) / everyFrames);
  return Math.round(Math.sin(k * 12.9898) * amp);
}

export const money = (n: number, symbol = "$") => symbol + Math.round(n).toLocaleString("en-US");

/** siblings never arrive together: one rhythm per group (4, 6, 8 or 12 frames) */
export const stagger = (start: number, i: number, step = 6) => start + i * step;

/** state change on the same object: recolour, never replace */
export const mix = (f: number, start: number, dur: number, a: string, b: string) =>
  interpolateColors(prog(f, start, dur, ease.linear), [0, 1], [a, b]);

/** stroke reveal for an svg path with pathLength={1}: spread onto the path element */
export function draw(f: number, start: number, dur = 14) {
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - prog(f, start, dur, ease.inOut) };
}

/** visible from a frame on, optionally until another */
export const on = (f: number, from: number, to = Infinity) => f >= from && f < to;
