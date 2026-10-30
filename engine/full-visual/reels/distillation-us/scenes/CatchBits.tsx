// The inside of Claude, drawn in the same vocabulary as the student's inside (layer panels, a row of numbers per
// token between them) but in Claude's tint, and never with a readable number: nobody outside Anthropic has them, so
// every row is mono glyphs scrambling under a light blur. Plus the frosted glass that covers it (the reel's one big
// move) and a small frosted Claude that `thinking` reuses.
import React from "react";
import { useScene } from "../../../src/engine";
import { CLAUDE, Logo, chipWidth } from "./parts";

const GLYPHS = "0123456789.−0123456789";
const hash = (a: number) => {
  const x = Math.sin(a * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** one token's cell of hidden-state numbers: glyphs that scramble every 2 frames, never a number you can read */
export const GlyphCell: React.FC<{ w: number; seed: number; lit: number; h?: number; font?: number }> = ({ w, seed, lit, h = 58, font = 30 }) => {
  const { f, theme } = useScene();
  const n = Math.max(3, Math.floor((w - 20) / (font * 0.6)));
  const tick = Math.floor(f / 2);
  const s = Array.from({ length: n }, (_, i) => GLYPHS[Math.floor(hash(seed * 97 + i * 13 + tick * 7.3) * GLYPHS.length)]).join("");
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 10, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
        background: `rgba(217,119,87,${(0.08 + 0.22 * lit).toFixed(3)})`,
        boxShadow: `inset 0 0 0 2px rgba(217,119,87,${(0.3 + 0.7 * lit).toFixed(3)})${lit > 0.05 ? `, 0 0 ${(28 * lit).toFixed(1)}px rgba(217,119,87,${(0.55 * lit).toFixed(3)})` : ""}`,
        fontFamily: theme.font.mono, fontSize: font, color: `rgba(255,214,196,${(0.45 + 0.4 * lit).toFixed(3)})`,
        filter: "blur(3.4px)", overflow: "hidden", whiteSpace: "pre",
      }}
    >
      {s}
    </div>
  );
};

/** a layer panel; `pulse` 0..1 is the forward pass going through it */
export const LayerPanel: React.FC<{ w: number; h: number; pulse: number }> = ({ w, h, pulse }) => (
  <div
    style={{
      width: w, height: h, borderRadius: 12, flex: "none",
      background: `linear-gradient(90deg, rgba(217,119,87,${(0.16 + 0.3 * pulse).toFixed(3)}), rgba(217,119,87,${(0.26 + 0.34 * pulse).toFixed(3)}), rgba(217,119,87,${(0.16 + 0.3 * pulse).toFixed(3)}))`,
      boxShadow: `inset 0 0 0 2px rgba(217,119,87,${(0.55 + 0.45 * pulse).toFixed(3)})`,
    }}
  />
);

/** the forward pass as a band of light running down through n panels, forever: the inside is never still */
export const pulseAt = (f: number, i: number, n: number, period = 14) => {
  const phase = (f / period) % (n + 1.5);
  return Math.max(0, 1 - Math.abs(phase - i) * 1.4);
};

/** x of each token column under the sentence row, centred on 540 */
export function columns(tokens: string[], font: number, gap: number) {
  const ws = tokens.map((t) => chipWidth(t, font));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (tokens.length - 1);
  let x = 540 - total / 2;
  return ws.map((w) => {
    const c = { x, w };
    x += w + gap;
    return c;
  });
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

/**
 * A sheet of frosted glass: it blurs what is behind it (backdrop blur), carries a faint milky tint, grain, a bright
 * top edge, and a light band that sweeps across it. `frost` 0..1 is how frosted it is (0 = clear glass, nearly
 * invisible); `sweep` 0..1 is where the light band is (outside 0..1: no band).
 */
export const Glass: React.FC<{ w: number; h: number; frost: number; sweep?: number; radius?: number; style?: React.CSSProperties; edge?: boolean }> = ({
  w, h, frost, sweep = -1, radius = 18, style, edge = true,
}) => {
  const blur = 30 * frost;
  const band = sweep >= 0 && sweep <= 1;
  const bx = -0.4 * w + sweep * 1.8 * w;
  return (
    <div
      style={{
        position: "absolute", width: w, height: h, borderRadius: radius, overflow: "hidden",
        backdropFilter: `blur(${blur.toFixed(1)}px) saturate(${(1 + 0.5 * frost).toFixed(2)}) brightness(${(1 + 0.18 * frost).toFixed(2)})`,
        WebkitBackdropFilter: `blur(${blur.toFixed(1)}px)`,
        background: `linear-gradient(160deg, rgba(255,255,255,${(0.16 * frost).toFixed(3)}), rgba(255,255,255,${(0.05 * frost).toFixed(3)}) 55%, rgba(255,255,255,${(0.11 * frost).toFixed(3)}))`,
        boxShadow: edge ? `inset 0 2px 0 rgba(255,255,255,${(0.45 * frost).toFixed(3)}), inset 0 0 0 1.5px rgba(255,255,255,${(0.22 * frost).toFixed(3)})` : undefined,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.16 * frost, mixBlendMode: "overlay" }} />
      {band && (
        <div
          style={{
            position: "absolute", top: -h * 0.5, left: bx, width: w * 0.28, height: h * 2, transform: "rotate(18deg)",
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0.05) 60%, rgba(255,255,255,0))",
          }}
        />
      )}
    </div>
  );
};

/** a small frosted Claude: its tint, three blurred layers, the glass over them, the mark on its tab. `thinking` */
export const FrostedClaude: React.FC<{ w: number; h: number; frost: number; sweep: number }> = ({ w, h, frost, sweep }) => {
  const { f, theme, ground } = useScene();
  const rows = 4;
  const pitch = (h - 70) / rows;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "rgba(217,119,87,0.07)", boxShadow: `inset 0 0 0 2px rgba(217,119,87,0.55)` }} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 22, top: 50 + i * pitch, display: "flex", gap: 8 }}>
          {i % 2 === 0 ? (
            <LayerPanel w={w - 44} h={pitch - 16} pulse={pulseAt(f, i, rows, 12)} />
          ) : (
            [0, 1, 2].map((c) => <GlyphCell key={c} w={(w - 44 - 16) / 3} h={pitch - 16} seed={i * 10 + c} lit={0.4} font={24} />)
          )}
        </div>
      ))}
      <Glass w={w} h={h} frost={frost} sweep={sweep} />
      <div style={{ position: "absolute", left: 16, top: -26, display: "flex", alignItems: "center", gap: 10, padding: "4px 14px 4px 8px", borderRadius: 12, background: ground.bg }}>
        <Logo name="claude" size={40} />
        <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.ink }}>Claude</span>
      </div>
    </div>
  );
};

export { CLAUDE };
