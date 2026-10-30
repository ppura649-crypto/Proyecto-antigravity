// keyframes-v1 family M (builder M, 2026-09-25): pure helpers of the spine clock, no state.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut3 = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn2 = (x: number) => clamp(x) * clamp(x);
export const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// a mechanical spin: a hard kick, then a long heavy slow-down onto the detent (integrated speed, normalised)
const SPIN: number[] = (() => {
  const n = 400, out = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) { const u = i / n; acc += clamp(u / 0.12) * Math.pow(1 - u, 2.3); out.push(acc); }
  return out.map((x) => x / acc);
})();
export const spin = (u: number) => { const x = clamp(u) * 400, i = Math.floor(x), f = x - i; return SPIN[i] * (1 - f) + SPIN[Math.min(400, i + 1)] * f; };
// the soft settle on the detent: a tiny forward give and back, no bounce
export const settle = (t: number, at: number, amp = 0.05) =>
  t <= at ? 0 : amp * Math.sin(((t - at) / 260) * Math.PI * 2) * Math.exp(-(t - at) / 120);

// the clean exit every card ends with (<= 150 ms at toMs)
export const EXIT_MS = 130;
export const exitP = (t: number, toMs: number) => easeIn2(win(t, toMs - EXIT_MS, toMs));
// velocity-driven vertical motion blur id + std (px)
export const blurStd = (vPxPerHalfFrame: number, max = 14) => Math.min(max, vPxPerHalfFrame * 0.5);
export const FONT = "Inter, -apple-system, 'SF Pro Display', Helvetica, Arial, sans-serif";
export const GREEN = "#4ADE80";
