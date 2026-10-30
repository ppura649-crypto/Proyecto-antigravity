// The AgentIcon's silhouette, light enough to draw by the hundred: the same shell, ears, antenna light, dark visor and
// two eye slits (same 100-unit geometry as AgentIcon.tsx), flat colours, no gradients, no per-bot filter. The shell,
// ears and antenna take `currentColor`, so one <symbol> serves a swarm whose colours change per bot.
// <AgentGlyphDefs id> once inside an <svg>, then <AgentUse id x y size color> per bot. <AgentMini> is the HTML version
// for a few dozen small bots (a crowd on a door, a pin on a label).
import React from "react";

/** the symbol: drawn in a 100 box, centred on (50,50) */
export const AgentGlyphDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <symbol id={id} viewBox="0 0 100 100" overflow="visible">
      <rect x={48.3} y={9} width={3.4} height={17} fill="currentColor" />
      <circle cx={50} cy={8} r={5.6} fill="currentColor" />
      <circle cx={50} cy={8} r={3} fill="#FFFFFF" opacity={0.85} />
      <rect x={3.5} y={47} width={9} height={22} rx={4.5} fill="currentColor" />
      <rect x={87.5} y={47} width={9} height={22} rx={4.5} fill="currentColor" />
      <rect x={87.5} y={47} width={9} height={22} rx={4.5} fill="#000" opacity={0.3} />
      <rect x={3.5} y={47} width={9} height={22} rx={4.5} fill="#000" opacity={0.3} />
      <rect x={9} y={24} width={82} height={68} rx={31} fill="currentColor" />
      <ellipse cx={32} cy={35} rx={15} ry={5.5} transform="rotate(-18 32 35)" fill="#FFFFFF" opacity={0.5} />
      <rect x={18} y={43} width={64} height={35} rx={17.5} fill="#081018" />
      <rect x={27} y={52} width={10} height={17} rx={5} fill="currentColor" />
      <rect x={63} y={52} width={10} height={17} rx={5} fill="currentColor" />
      <rect x={27} y={52} width={10} height={17} rx={5} fill="#FFFFFF" opacity={0.55} />
      <rect x={63} y={52} width={10} height={17} rx={5} fill="#FFFFFF" opacity={0.55} />
    </symbol>
  </defs>
);

/** one bot from the symbol, centred on (x, y), `size` px wide */
export const AgentUse: React.FC<{ id: string; x: number; y: number; size: number; color: string; opacity?: number }> = ({ id, x, y, size, color, opacity = 1 }) => (
  <use href={`#${id}`} x={(x - size / 2).toFixed(1)} y={(y - size / 2).toFixed(1)} width={size.toFixed(1)} height={size.toFixed(1)} color={color} opacity={opacity} />
);

/** a small standalone bot in HTML, centred on its box; `glow` 0..1+ adds a soft halo */
export const AgentMini: React.FC<{ size: number; color: string; glow?: number; style?: React.CSSProperties }> = ({ size, color, glow = 0, style }) => {
  const id = `am${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${(size * 0.18 * glow).toFixed(1)}px ${color})` : undefined, ...style }}>
      <AgentGlyphDefs id={id} />
      <use href={`#${id}`} x={0} y={0} width={100} height={100} color={color} />
    </svg>
  );
};
