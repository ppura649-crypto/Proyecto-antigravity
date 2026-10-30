// Hook V2's agent: a small glass bot capsule (dark visor, two glowing eye slits, an antenna with a status light), drawn
// once as an SVG symbol and stamped 700 times by the swarm; `currentColor` is the agent's light (cyan, then RED on
// "hacking"). The hero version is the same bot up close, with glass shading and a specular edge, for the few agents
// that fly past the lens so the swarm reads as agents, not dots.
import React from "react";

/** symbol box: 32 x 28 units, centre (16, 15) */
export const GLYPH = { w: 32, h: 28, cx: 16, cy: 15 };

export const GlyphDefs: React.FC = () => (
  <defs>
    <linearGradient id="v2-shell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3b5566" />
      <stop offset="0.45" stopColor="#15232d" />
      <stop offset="1" stopColor="#070d12" />
    </linearGradient>
    <linearGradient id="v2-spec" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
      <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
    {/* swarm scale: shell, visor, two eyes, antenna light */}
    <symbol id="v2-agent" viewBox="0 0 32 28" overflow="visible">
      <line x1="16" y1="6" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="2" r="2.4" fill="currentColor" />
      <rect x="2" y="6" width="28" height="20" rx="9" fill="url(#v2-shell)" stroke="currentColor" strokeWidth="2" />
      <rect x="6.5" y="11" width="19" height="9.5" rx="4.5" fill="#02070b" />
      <rect x="9" y="13.6" width="5" height="4" rx="2" fill="currentColor" />
      <rect x="18" y="13.6" width="5" height="4" rx="2" fill="currentColor" />
    </symbol>
    {/* up close: glass shading, rim light, a specular sweep and ear sensors */}
    <symbol id="v2-hero" viewBox="0 0 32 28" overflow="visible">
      <line x1="16" y1="6.5" x2="16" y2="1.8" stroke="#9fb4c0" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="1.8" r="2" fill="currentColor" />
      <circle cx="16" cy="1.8" r="0.8" fill="#fff" />
      <rect x="0" y="12" width="3" height="8" rx="1.5" fill="#2a3b46" />
      <rect x="29" y="12" width="3" height="8" rx="1.5" fill="#2a3b46" />
      <rect x="2" y="6" width="28" height="20" rx="9" fill="url(#v2-shell)" />
      <rect x="2" y="6" width="28" height="20" rx="9" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.9" />
      <rect x="6" y="10.5" width="20" height="10.5" rx="5" fill="#010407" stroke="#000" strokeWidth="0.6" />
      <rect x="8.8" y="13.4" width="5.4" height="4.4" rx="2.2" fill="currentColor" />
      <rect x="17.8" y="13.4" width="5.4" height="4.4" rx="2.2" fill="currentColor" />
      <rect x="9.6" y="14" width="1.6" height="1.3" rx="0.6" fill="#fff" opacity="0.9" />
      <rect x="18.6" y="14" width="1.6" height="1.3" rx="0.6" fill="#fff" opacity="0.9" />
      <path d="M5 11 Q8 7.2 14 7" stroke="url(#v2-spec)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="11" y="22.6" width="10" height="1.2" rx="0.6" fill="currentColor" opacity="0.55" />
    </symbol>
  </defs>
);

/** one agent up close, at page (x, y), `size` px wide; a speed trail of ghosts behind it along (vx, vy) per frame */
export const HeroAgent: React.FC<{ x: number; y: number; size: number; color: string; vx: number; vy: number; rot?: number; o?: number }> = ({ x, y, size, color, vx, vy, rot = 0, o = 1 }) => {
  const h = (size * GLYPH.h) / GLYPH.w;
  const speed = Math.hypot(vx, vy);
  const blur = Math.min(4, speed * 0.07);
  const ghosts = speed > 6 ? [3, 2, 1] : [];
  const one = (gx: number, gy: number, go: number, key: string, b: number) => (
    <svg
      key={key}
      width={size}
      height={h}
      viewBox="0 0 32 28"
      style={{
        position: "absolute", left: gx - size / 2, top: gy - h / 2, overflow: "visible", color, opacity: go,
        transform: `rotate(${rot.toFixed(2)}deg)`, filter: `blur(${b.toFixed(1)}px) drop-shadow(0 0 ${(size * 0.12).toFixed(1)}px ${color})`,
      }}
    >
      <use href="#v2-hero" />
    </svg>
  );
  return (
    <>
      {ghosts.map((g) => one(x - vx * g * 0.9, y - vy * g * 0.9, o * 0.12 * (4 - g), `g${g}`, blur + g))}
      {one(x, y, o, "a", blur)}
    </>
  );
};
