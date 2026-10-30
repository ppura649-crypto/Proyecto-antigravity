// What the sixteen scenes share, so they read as one film: the asset path, the real marks, the palette, the swarm (the
// reel's thread: one little agent bot per sandbox, AgentIcon.tsx) and the step stamp. Every technique is a metaphor object (locker,
// window, pass, key ring, parcel, form), never code, commands or real system screens. Numbers: facts.md only.
import React from "react";
import { Img, staticFile } from "remotion";
import { AgentIcon, type AgentState } from "./AgentIcon";
export { AgentIcon, type AgentState } from "./AgentIcon";

export const SLUG = "hf-incident";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);
/** stage band on the page; inside <Column> (900 wide, page x 90) column x 450 = page centre 540, y is page y */
export const STAGE = { top: 520, bottom: 1450, cx: 450 };

/** Hugging Face's own yellow; OpenAI is black and white. RED is the swarm once it turns on a target, and nothing else */
export const HF = "#FFD21E";
export const HF_ORANGE = "#FF9D00";
export const RED = "#FF3B30";
export const AMBER = "#F5A524";
export const GOOD = "#34C759";
/** the agents' own glow while they are only test-takers (cool cyan), before they turn RED */
export const AGENT = "#5AC8FA";

export type LogoName = "openai" | "huggingface" | "instagram";

/** a real mark, drawn bare: no tile, no circle, no border (the creator's rule). OpenAI's mark is black: `invert` on dark. */
export const Logo: React.FC<{ name: LogoName; size?: number; invert?: boolean; style?: React.CSSProperties }> = ({ name, size = 96, invert, style }) => (
  <Img src={asset(`logo-${name}.png`)} style={{ width: size, height: size, objectFit: "contain", display: "block", flex: "none", filter: invert ? "invert(1)" : undefined, ...style }} />
);

/** one agent, drawn as the AgentIcon, centred on (x,y) at size r*2.4. `color` AGENT by default, RED when attacking,
 * `opacity` fades it; a colour that is grey (or `state` "off") draws it switched off. Blinks on its own. */
export const Agent: React.FC<{ x: number; y: number; r?: number; color?: string; glow?: number; opacity?: number; state?: AgentState }> = ({ x, y, r = 9, color = AGENT, glow = 1, opacity = 1, state }) => {
  const size = r * 2.4;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity }}>
      <AgentIcon size={size} color={color} glow={glow} state={state} seed={Math.round(x * 7 + y * 13)} />
    </div>
  );
};

/** deterministic pseudo-random in 0..1, so a swarm lays out the same every frame */
export const rand = (i: number, salt = 1) => {
  const s = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** the "STEP 1/2/3" stamp that opens out, power and in: same look in all three */
export const StepStamp: React.FC<{ n: number; label: string; ink: string; style?: React.CSSProperties }> = ({ n, label, ink, style }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontWeight: 800, letterSpacing: 2, color: ink, ...style }}>
    <span style={{ fontSize: 30, padding: "6px 16px", border: `4px solid ${RED}`, color: RED, borderRadius: 6, transform: "rotate(-4deg)" }}>STEP {n}</span>
    <span style={{ fontSize: 56 }}>{label}</span>
  </div>
);

// Continuity contracts between scenes (plan.md). A scene that hands an object over ends with it exactly here, and the
// next scene starts with it exactly here. Column coordinates.
export const HANDOFF = {
  /** the package server, centred: end of `locker` stays the same box at the start of `out` */
  server: { left: 300, top: 760, width: 300, height: 420 },
  /** the grader figure: `why` introduces it, `logs` brings it back at the same size */
  grader: { size: 220 },
};
