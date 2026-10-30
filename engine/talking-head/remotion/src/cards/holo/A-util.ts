import { spring } from "remotion";
// reference edit K family A helpers: pure functions of the spine clock (no state, seeded noise only).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
// a spring that starts at spine ms `at` (0 before it)
export const sp = (tMs: number, at: number, fps: number, config: SpringCfg) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: { mass: 1, ...config } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// The hook-1 beats (video-1 spine ms, from captions.json); events may override through `beats`.
export const B0 = {
  marketing: 294, screams: 774, ai: 1074, slop: 1554, you: 1974, to: 2214, watch: 2334, this: 2394, the: 2833, fix: 2990,
  own: 4237, brand: 4357, and: 4833, not: 4963, blank: 5323, prompt: 5563, out: 6000,
};
export type Beats = typeof B0;
// what the shared bridge (kit + blank prompt) needs, in every hook
export type Bridge = { own: number; and: number; blank: number; out: number };
export type Rect = { x: number; y: number; w: number; h: number };

// wall geometry inside the 1080 x 695 card
export const COLS = 5, ROWS = 3, TW = 178, TH = 222, GX = 190, GY = 234;
export const CX = 540, CY = 347.5;
// the kit: the SKIMS photo (900x1612) at 322x577 on the left, the kit column on the right (v2, A-own)
export const PHOTO = { x: 200, y: CY, w: 322, h: 577 };
export const SW = { x: 741, w: 360, h: 148.5, gap: 18 };
