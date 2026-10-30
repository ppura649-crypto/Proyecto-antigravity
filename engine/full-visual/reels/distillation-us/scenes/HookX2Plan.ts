// Hook X2, the plan: the copier's geometry in world units (the bed's plane: x right, y toward the viewer, z up off
// the glass) and its schedule, all from the spoken words. The lamp is one physical carriage: it idles, is yanked back
// and armed on "chinese", reads the mark on "ai", charges on "companies", and from "copy" ping-pongs across the
// glass; every pass prints one copy that peels off behind it. From "anthropic" the passes shorten (overdrive).
import { ease, prog } from "../../../src/engine";

/** bed glass, centred on (BX, 0); the original mark lies on it; the output tray and its pile at (PX, PY) */
export const W = 520;
export const H = 440;
export const BX = -150;
export const MS = 275;
export const PX = 245;
export const PY = -10;
export const NEAR = H / 2 - 18;
export const FAR = -H / 2 + 18;
/** each copy is cut into strips so it can curl as it peels */
export const STRIPS = 12;
export const SHEET = 7;

export type T = { f: number; chinese: number; ai: number; companies: number; copy: number; anthropic: number; models: number; end: number };
export type Pass = { s: number; d: number; y0: number; y1: number };
/** one copy: the pass that prints it, the pass that peels it, which edge lifts first, and its flight */
export type Copy = { k: number; print: Pass; peel: Pass; dir: 1 | -1; detach: number; fly: number; land: number };
export type Plan = { passes: Pass[]; copies: Copy[]; read: Pass };

const passY = (p: Pass, f: number) => p.y0 + (p.y1 - p.y0) * prog(f, p.s, p.d, ease.inOut);

/** the frame at which the lamp's line crosses world y during pass p */
export function crossAt(p: Pass, y: number): number {
  for (let f = p.s; f <= p.s + p.d; f += 0.25) {
    const a = passY(p, f);
    if ((p.y1 - p.y0) * (a - y) >= 0) return f;
  }
  return p.s + p.d;
}

export function buildPlan(t: T): Plan {
  const read: Pass = { s: t.chinese + 13, d: t.companies + 6 - t.chinese - 13, y0: FAR, y1: NEAR };
  const passes: Pass[] = [{ s: t.copy - 4, d: 17, y0: NEAR, y1: FAR }];
  let s = t.anthropic - 5;
  let d = 16;
  while (s < t.models + 10) {
    const y0 = passes[passes.length - 1].y1;
    passes.push({ s, d, y0, y1: -y0 });
    s += d;
    d = Math.max(4, Math.round(d * 0.7));
  }
  const copies: Copy[] = passes.map((p, k) => {
    const dir: 1 | -1 = p.y1 < p.y0 ? 1 : -1;
    const detach = crossAt(p, dir > 0 ? -MS / 2 : MS / 2) + 2;
    const fly = Math.max(12, 34 - 6 * k);
    return { k, print: k === 0 ? read : p, peel: p, dir, detach, fly, land: detach + fly };
  });
  return { passes, copies, read };
}

/** the carriage: world y of the lamp line, its power (0 idle .. 1 armed), and how hard the machine is running */
export function lampAt(t: T, pl: Plan, f: number): { y: number; power: number; heat: number; cool: number } {
  const armed = f >= t.chinese;
  const flick = [1, 0.15, 0.9, 0.3, 1, 0.6, 1][Math.floor(f - t.chinese)] ?? 1;
  const charge = prog(f, t.companies, pl.passes[0].s - t.companies, ease.in) * (f < pl.passes[0].s ? 1 : 0);
  const power = armed ? flick * (1 + 0.3 * charge * Math.sin(f * 1.4)) : 0.42 + 0.06 * Math.sin(f / 5);
  const heat = prog(f, t.anthropic, t.models - t.anthropic, ease.in) + 0.6 * prog(f, t.models, 20, ease.out);
  const cool = 1 - prog(f, t.chinese, 8, ease.out);
  let y: number;
  if (f < t.chinese) y = 70 - 2.1 * f;
  else if (f < pl.read.s) {
    const from = 70 - 2.1 * t.chinese;
    y = from + (FAR - from) * prog(f, t.chinese, 13, ease.back) + Math.sin(f * 1.9) * 2;
  } else if (f < pl.passes[0].s) {
    const rev = 80 * charge * Math.abs(Math.sin(f * (0.3 + 0.35 * charge)));
    y = passY(pl.read, f) - (f > pl.read.s + pl.read.d ? rev : 0);
  } else {
    const p = [...pl.passes].reverse().find((q) => f >= q.s) ?? pl.passes[0];
    const over = Math.max(0, f - p.s - p.d);
    y = passY(p, f) - Math.sign(p.y1 - p.y0) * (p === pl.passes[pl.passes.length - 1] ? 2.2 * over : 0);
  }
  return { y, power, heat, cool };
}

/** how many copies have left the glass by frame f (each pass weakens the original a little) */
export const passesDone = (pl: Plan, f: number) => pl.copies.filter((c) => f >= c.detach).length;
