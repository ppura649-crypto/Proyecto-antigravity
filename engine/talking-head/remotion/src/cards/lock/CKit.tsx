// reference edit J famC (THE FILES AND THE THEFT): the small helpers my five cards share.
// Eases only, no springs on layout, so three consecutive frames never jump.

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
// a single soft swell: 0 at both ends, so a pulse never snaps back
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
// a hard little pop with one overshoot, written as an ease so it is frame-exact
export const pop = (t: number): number => {
  const x = clamp01(t);
  return 1 + 0.18 * Math.sin(Math.PI * x) * (1 - x) - (1 - easeOut(x)) * 0.001;
};
export const at = (tMs: number, start: number, ms: number): number => clamp01((tMs - start) / ms);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const comma = (n: number): string => Math.round(n).toLocaleString("en-US");

// how many characters of a block of lines are revealed at tMs (one continuous type)
export const typedLines = (lines: string[], tMs: number, start: number, ms: number): string[] => {
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  const shown = Math.ceil(total * clamp01((tMs - start) / ms));
  let left = shown;
  return lines.map((l) => {
    const take = Math.max(0, Math.min(l.length, left));
    left -= l.length + 1;
    return l.slice(0, take);
  });
};

// a blink that happens exactly once and then rests on
export const blinkOnce = (tMs: number, start: number): number =>
  tMs < start ? 0 : tMs < start + 260 ? 1 : tMs < start + 470 ? 0 : 1;
