// Hook X4 ("the thinking, stolen"), the shared stage: the word times, where the glass core and the Qwen vessel stand
// on every frame, the exit wound on the glass, the ribbon's curve (a whipping spring), how drained and how dim Claude is.
// Coordinates are local to the stage box: 900 x 930, top of the box at page y 520.
import { ease, prog, useScene } from "../../../src/engine";

export type T = { f: number; chinese: number; ai: number; companies: number; copy: number; anthropic: number; models: number };
export type P = { x: number; y: number };

export function useT(): T {
  const { f, cue } = useScene();
  return { f, chinese: cue("chinese"), ai: cue("ai"), companies: cue("companies"), copy: cue("copy"), anthropic: cue("anthropic"), models: cue("models") };
}

export const W = 900;
export const H = 930;
/** the Qwen mark's box */
export const QS = 320;

/** deterministic 0..1 */
export const rnd = (i: number, salt = 1) => {
  const s = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const mix = (a: P, b: P, k: number): P => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

/** the core: big and near the centre on f0, the camera settling it up-left while Qwen rises (never still) */
export function coreAt(t: T) {
  const k = prog(t.f, -8, 40, ease.out);
  const breathe = Math.sin(t.f / 11) * 3;
  return { x: lerp(400, 272, k), y: lerp(420, 300, k) + breathe, r: lerp(262, 222, k) };
}

/** the Qwen vessel: surges up from below the stage during "How do", overshoots, settles; bobs a little after */
export function qwenAt(t: T) {
  const u = prog(t.f, 4, 22, ease.back);
  const bob = Math.sin(t.f / 13) * 4;
  return { x: 624, y: 668 + 700 * (1 - u) + bob, s: QS, u };
}

const unit = (a: P, b: P): P => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
};

/** where the probe pierces the glass: on the rim, facing Qwen. Just before "copy" the glass bulges there (tension) */
export function exitAt(t: T): P & { nx: number; ny: number } {
  const c = coreAt(t);
  const n = unit(c, qwenAt(t));
  const bulge = 26 * Math.sin(Math.PI * prog(t.f, t.copy - 9, 13, ease.linear));
  return { x: c.x + n.x * (c.r + bulge), y: c.y + n.y * (c.r + bulge), nx: n.x, ny: n.y };
}

/** the vessel's mouth: where the stolen light pours in, just inside the top of the mark */
export function mouthAt(t: T): P {
  const q = qwenAt(t);
  return { x: q.x - 6, y: q.y - QS * 0.36 };
}

/** the ribbon's cubic: it leaves the wound up and out, arches, and drops into the mouth. The first control point is
 *  a damped spring, whipped by the pull on "copy" and plucked again on "anthropic" */
export function ribbonCurve(t: T) {
  const a = exitAt(t);
  const b = mouthAt(t);
  const k1 = t.f - t.copy;
  const k2 = t.f - t.anthropic;
  const whip = k1 < 0 ? 0 : Math.sin(k1 * 0.33) * Math.exp(-k1 / 16) * 150;
  const pluck = k2 < 0 ? 0 : Math.sin(k2 * 0.42) * Math.exp(-k2 / 12) * 60;
  const sway = Math.sin(t.f / 17) * 14;
  const c1 = { x: a.x + a.nx * 120 + 190 + whip * 0.4, y: a.y - 300 - whip + pluck + sway };
  const c2 = { x: b.x + 30 - whip * 0.3, y: b.y - 360 + pluck * 0.6 };
  return { a, c1, c2, b };
}

export function bez(c: ReturnType<typeof ribbonCurve>, s: number): P {
  const u = 1 - s;
  return {
    x: u * u * u * c.a.x + 3 * u * u * s * c.c1.x + 3 * u * s * s * c.c2.x + s * s * s * c.b.x,
    y: u * u * u * c.a.y + 3 * u * u * s * c.c1.y + 3 * u * s * s * c.c2.y + s * s * s * c.b.y,
  };
}

/** how far the ribbon's head and tail have run along the curve (0 = the wound, 1 = the mouth) */
export function ribbonSpan(t: T) {
  const head = prog(t.f, t.copy - 1, 15, ease.out);
  const tail = prog(t.f, t.models - 14, 15, ease.in);
  return { head, tail };
}

/** how much of Claude's thinking has been pulled out (0..1) */
export const drainAt = (t: T) => prog(t.f, t.copy - 3, t.models - t.copy - 4, ease.inOut);
/** how lit Claude's core still is: it sags when the thinking leaves and goes near dark on "anthropic" */
export const lightAt = (t: T) => 1 - 0.3 * prog(t.f, t.copy, 22, ease.out) - 0.58 * prog(t.f, t.anthropic - 2, 34, ease.inOut);
/** the vessel's fill level (0 empty, 1 full on "models") */
export const levelAt = (t: T) => prog(t.f, t.copy + 12, t.models - t.copy - 12, ease.linear) ** 1.25;

/** the hits: a jolt when the probe pierces, a tug on "copy", the bloom on "models" */
export function shakeAt(t: T): P {
  const hit = (at: number, amp: number, dur: number) => (t.f < at ? 0 : Math.max(0, 1 - (t.f - at) / dur) ** 2 * amp);
  const a = hit(t.chinese, 11, 16) + hit(t.copy, 7, 12) + hit(t.models, 12, 22);
  return { x: Math.sin(t.f * 2.3) * a, y: Math.cos(t.f * 3.1) * a };
}
