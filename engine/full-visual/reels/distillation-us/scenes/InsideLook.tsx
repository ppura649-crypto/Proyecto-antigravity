// "Along the way, it looks back at the earlier words, so it understands each word in context."
// From the last chip, one curved line reaches back to each earlier chip, as thick as the share of attention the last
// token really gives it (measured, mean over 28 layers and all heads). The first token's share is the known attention
// sink and is left out; the other six are renormalised, so the last token's share of itself shows as its own glow.
import React from "react";
import { blurIn, blurOut, draw, ease, prog, useScene } from "../../../src/engine";
import { ATTN, TOKEN_HUES } from "./parts";
import { ROW_Y, rowX, useT } from "./InsideRow";

const RAW = ATTN.slice(1); // tokens 1..6
const SUM = RAW.reduce((a, b) => a + b, 0);
/** share of each token 0..6 among the six compared (token 0 = the sink, not drawn) */
export const SHARE = [0, ...RAW.map((a) => a / SUM)];
const MAX = Math.max(...SHARE.slice(1, 6));
const Y0 = ROW_Y + 34; // under the chips
const LAST = 6;

const geom = (i: number) => {
  const x0 = rowX(LAST), x1 = rowX(i);
  const depth = 50 + 0.46 * (x0 - x1);
  return { x0, x1, mx: (x0 + x1) / 2, cy: Y0 + 2 * depth };
};
const at = (i: number, t: number) => {
  const g = geom(i);
  const u = 1 - t;
  return { x: u * u * g.x0 + 2 * u * t * g.mx + t * t * g.x1, y: u * u * Y0 + 2 * u * t * g.cy + t * t * Y0 };
};

/** how lit each chip is while the look-back is on stage (the Sentence draws the glow) */
export function useLookGlow(): number[] {
  const { f } = useScene();
  const T = useT();
  if (f < T.back || f > T.end + 10) return [];
  const on = prog(f, T.back + 8, 14) * (1 - prog(f, T.end, 10));
  const ctx = f >= T.context ? 0.5 * Math.exp(-(f - T.context) / 30) : 0;
  return SHARE.map((s, i) => (i === 0 ? 0 : on * (0.25 + (i === LAST ? 0.9 : s / MAX) * (0.6 + ctx))));
}

export const LookBack: React.FC = () => {
  const { f, theme, ground } = useScene();
  const T = useT();
  if (f < T.back - 2 || f > T.end + 10) return null;
  const out = f >= T.end ? blurOut(f, T.end, { dur: 9 }) : {};
  const ctx = f >= T.context ? Math.exp(-(f - T.context) / 30) : 0; // "context.": the lines swell once and settle
  const order = [5, 4, 3, 2, 1]; // nearest first: the reach grows outward
  return (
    <div style={{ position: "absolute", inset: 0, ...out }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {order.map((i, n) => {
          const g = geom(i);
          const start = T.back - 2 + n * 5;
          const w = 3 + 54 * SHARE[i] * (1 + 0.35 * ctx);
          return (
            <g key={i}>
              <path d={`M${g.x0},${Y0} Q${g.mx},${g.cy} ${g.x1},${Y0}`} fill="none" stroke={TOKEN_HUES[i]} strokeWidth={w} strokeLinecap="round" opacity={0.92} {...draw(f, start, 14)} />
              {/* what travels along it: the earlier word's information, flowing into the last word */}
              {f > start + 14 &&
                [0, 0.5].map((ph) => {
                  const t = 1 - ((((f - start) / 46) + ph) % 1);
                  const p = at(i, t);
                  return <circle key={ph} cx={p.x} cy={p.y} r={w * 0.55 + 2} fill="#FFFFFF" opacity={0.85 * Math.sin(Math.PI * t)} />;
                })}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1066, textAlign: "center", fontFamily: theme.font.ui, fontSize: 48, fontWeight: 600, color: ground.ink, ...blurIn(f, T.back + 12, { dur: 8, rise: 12 }) }}>
        looks back
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1132, textAlign: "center", fontFamily: theme.font.ui, fontSize: 36, fontWeight: 500, color: ground.dim, ...blurIn(f, T.earlier + 6, { dur: 8, rise: 10 }) }}>
        thicker line = matters more
      </div>
    </div>
  );
};
