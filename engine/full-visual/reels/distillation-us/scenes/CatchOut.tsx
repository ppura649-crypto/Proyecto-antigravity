// What happens outside the machine: the hidden-state strip pulled out to full width ("hidden states"), the readout
// under the stack, the one token leaving the API port onto a response card, and the student who receives only that.
import React from "react";
import { Travel, arrive, arriveEase, countTo, draw, ease, pop, prog, useScene } from "../../../src/engine";
import { HIDDEN, Logo, QWEN, TokenChip, chipWidth } from "./parts";
import { cellRGB } from "./CatchStack";
import { PORT } from "./CatchCasing";
import { PRACTICE } from "./CatchInside";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const OUT_WORD = " practice"; // the open model's real pick for "The best way to learn is to" (31.3 %)
export const CARD = { x: 230, y: 1222, w: 620, h: 92 };
const PREFIX = "…is to";
export const SLOT = { x: CARD.x + 30 + PREFIX.length * 44 * 0.52 + 16, cy: CARD.y + CARD.h / 2 };

/** one strip of the stack, pulled out to full width: its 12 real numbers (the last token, after layer 28) */
export const HiddenPanel: React.FC<{ at: number; backAt: number; fromY: number }> = ({ at, backAt, fromY }) => {
  const { f, theme, ground } = useScene();
  if (f < at || f > backAt + 12) return null;
  const k = arrive(f, at, 18) * (1 - prog(f, backAt, 12, ease.in));
  const vals = HIDDEN[28];
  const cy = 1080;
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${cy}px`, transform: `translateY(${((1 - k) * (fromY - cy)).toFixed(1)}px) scale(${(0.2 + 0.8 * k).toFixed(4)})`, opacity: Math.min(1, k * 3) }}>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 868, textAlign: "center", fontFamily: theme.font.ui, fontSize: 80, fontWeight: 700, color: ground.ink }}>hidden states</div>
      {vals.map((v, i) => {
        const col = cellRGB(v);
        const x = 540 - 2 * 200 + (i % 4) * 200 + 5, y = 992 + Math.floor(i / 4) * 92;
        const shown = countTo(f, at + 6 + i * 2, 20, 0, v);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 190, height: 80, borderRadius: 12, background: col.rgb, boxShadow: `inset 0 0 0 2px ${col.hue}, 0 0 ${(26 * col.t).toFixed(1)}px ${col.hue}66`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.mono, fontSize: 38, fontWeight: 700, color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
            {(shown < 0 ? "−" : "") + Math.abs(shown).toFixed(2)}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1276, textAlign: "center", fontFamily: theme.font.mono, fontSize: 40, fontWeight: 600, color: ground.dim }}>… 1,024 numbers</div>
    </div>
  );
};

/** a chip that shoots from a point into the card's slot (or into the port) */
export const Shot: React.FC<{ at: number; from: { x: number; y: number }; to: { x: number; y: number }; dur?: number; s0?: number }> = ({ at, from, to, dur = 12, s0 = 0.6 }) => {
  const { f } = useScene();
  if (f < at || f > at + dur) return null;
  const p = prog(f, at, dur, ease.in);
  return (
    <div style={{ position: "absolute", left: lerp(from.x, to.x, p), top: lerp(from.y, to.y, p), transform: `translate(-50%, -50%) scale(${lerp(s0, 1, p).toFixed(3)})`, filter: `drop-shadow(0 0 16px ${PRACTICE})` }}>
      <TokenChip text={OUT_WORD} hue={PRACTICE} />
    </div>
  );
};

/** the response card under the port: "…is to" and the one token that came out */
export const Card: React.FC<{ at: number; landAt: number; flashAt: number }> = ({ at, landAt, flashAt }) => {
  const { f, theme, ground } = useScene();
  const flash = f >= flashAt ? 1 - prog(f, flashAt, 24) : 0;
  const land = f >= landAt ? 1 - prog(f, landAt, 18) : 0;
  return (
    <Travel curve="measured" at={at} from="top" dist={50} dur={14} style={{ position: "absolute", left: CARD.x, top: CARD.y }}>
      <div style={{ width: CARD.w, height: CARD.h, borderRadius: 16, background: ground.card, boxShadow: `inset 0 0 0 2px ${ground.hairline}`, display: "flex", alignItems: "center", padding: "0 30px", gap: 16 }}>
        <span style={{ fontFamily: theme.font.ui, fontSize: 44, fontWeight: 600, color: ground.dim, whiteSpace: "pre" }}>{PREFIX}</span>
        {f >= landAt && (
          <div style={{ transform: `scale(${(1 + 0.06 * land + 0.08 * flash).toFixed(3)})`, filter: `drop-shadow(0 0 ${(4 + 20 * Math.max(land, flash)).toFixed(1)}px ${PRACTICE})` }}>
            <TokenChip text={OUT_WORD} hue={PRACTICE} />
          </div>
        )}
      </div>
    </Travel>
  );
};

export const slotCentre = () => ({ x: SLOT.x + chipWidth(OUT_WORD) / 2, y: SLOT.cy });
export const portPoint = { x: PORT.x, y: PORT.y };

/** the student: a small Qwen, left of the card; it gets the text line and nothing else */
export const Student: React.FC<{ at: number }> = ({ at }) => {
  const { f, theme, ground } = useScene();
  if (f < at) return null;
  const k = prog(f, at, 16, arriveEase(16));
  return (
    <>
      <div style={{ position: "absolute", left: 104, top: CARD.y + 4, ...pop(f, at, { dur: 10, from: 0.6 }) }}>
        <Logo name="qwen" size={84} />
      </div>
      <div style={{ position: "absolute", left: 76, width: 140, top: CARD.y + CARD.h + 10, textAlign: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: QWEN, opacity: k }}>student</div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M ${CARD.x - 6} ${CARD.y + CARD.h / 2} L 198 ${CARD.y + CARD.h / 2}`} stroke={ground.ink} strokeWidth={3} strokeLinecap="round" {...draw(f, at + 4, 8)} />
      </svg>
      <div style={{ position: "absolute", left: CARD.x + 8, top: CARD.y + CARD.h + 12, fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.dim, opacity: prog(f, at + 8, 8), transform: `translateY(${((1 - k) * 10).toFixed(1)}px)` }}>
        only the final text reaches it
      </div>
    </>
  );
};
