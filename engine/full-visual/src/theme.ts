// Everything a reel may change without leaving the format. The grammar itself (engine/) is not a parameter.
// Numbers are 1080x1920 px and 60 fps frames, measured on the reference reels
// the reference study.

export type GroundName = "dark" | "light";

export type Ground = {
  bg: string;
  grid: string; // colour of the 1 px grid lines
  ink: string; // active caption word, primary text
  spoken: string; // caption words already said
  card: string;
  hairline: string;
  dim: string; // secondary text
};

export type Theme = {
  fps: number;
  font: { caption: string; ui: string; mono: string };
  caption: {
    size: number;
    lineHeight: number;
    wrap: number; // max line width
    top: number; // y of the block's first line box, top slot
    bottom: number; // same, bottom slot (one fixed value: the creator's drifted between four)
    leadMs: number; // the word starts this early so it is sharp on the syllable
    blurInFrames: number;
    blurPx: number;
    clearFrames: number;
    maxLines: number;
  };
  marker: {
    style: "select" | "pill" | "none";
    color: string;
    fill: number; // alpha of the box fill
    stroke: number;
    handle: number;
    delayFrames: number; // the box lands after its word: two beats for one token
    drawFrames: number;
  };
  grounds: Record<GroundName, Ground>;
  gridPitch: number;
  roles: { ok: string; alarm: string; positive: string; brand: string; link: string };
  stage: { width: number; top: number; bottom: number };
  handover: "rise" | "scroll";
  /** "v1" is the grammar as first built. "measured" is the same grammar with the curves and the caption
   *  behaviour taken from the frame-by-frame study (reference-study/MOTION-SPEC.md). Reels already delivered
   *  stay on "v1" so they re-render identically. */
  motion: "v1" | "measured";
  minType: number; // floor for any type that carries a claim
};

export const theme: Theme = {
  fps: 60,
  font: {
    caption: "Figtree, sans-serif",
    ui: "Inter, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  caption: {
    size: 74,
    lineHeight: 82, // the creator's is 75 (1.01) and descenders touch the next line
    wrap: 740,
    top: 318,
    bottom: 1372,
    leadMs: 40,
    blurInFrames: 4,
    blurPx: 10,
    clearFrames: 3,
    maxLines: 2,
  },
  marker: { style: "select", color: "#2E7AEA", fill: 0.18, stroke: 3, handle: 22, delayFrames: 5, drawFrames: 5 },
  grounds: {
    dark: {
      bg: "#101010",
      grid: "rgba(255,255,255,0.022)",
      ink: "#FFFFFF",
      spoken: "#6B6B6B",
      card: "#161618",
      hairline: "#2A2A2C",
      dim: "#8C8C8C",
    },
    light: {
      bg: "#FAFAFA",
      grid: "rgba(0,0,0,0.028)",
      ink: "#0B0B0B",
      spoken: "#8E8E8E",
      card: "#FFFFFF",
      hairline: "#E6E6E6",
      dim: "#6B7280",
    },
  },
  gridPitch: 60,
  roles: { ok: "#41F9D3", alarm: "#D7253A", positive: "#34C759", brand: "#D97757", link: "#2E7CF6" },
  stage: { width: 900, top: 520, bottom: 1450 },
  handover: "rise",
  motion: "v1",
  minType: 32,
};

export const W = 1080;
export const H = 1920;

export function withOverrides(base: Theme, o?: DeepPartial<Theme>): Theme {
  if (!o) return base;
  return merge(base, o) as Theme;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function merge(a: unknown, b: unknown): unknown {
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return b ?? a;
  const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
  for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = merge(out[k], v);
  return out;
}
