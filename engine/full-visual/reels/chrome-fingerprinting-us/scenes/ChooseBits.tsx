// The pieces of `choose` the next scenes build on: the verdict slots under the browser row (their geometry is a
// contract with `browsers`, `chrome` and `cta`), the hash line, and the audio signal running through the row.
import React from "react";
import { useScene } from "../../../src/engine";
import { HANDOFF, HASH, ROW, WAVE, rowX, shortHash } from "./parts";

/** one empty verdict slot under each mark: solid, soft, never dashed. Centre x = rowX(i). */
export const SLOT = { top: ROW.y + ROW.size / 2 + 40, height: 200, width: 190, radius: 20, fill: "#EEF0F3" };
export const slotLeft = (i: number) => rowX(i) - SLOT.width / 2;

/** the slot, open by `open` (0..1): it grows down from its top edge */
export const VerdictSlot: React.FC<{ i: number; open: number; style?: React.CSSProperties }> = ({ i, open, style }) =>
  open <= 0 ? null : (
    <div
      style={{
        position: "absolute", left: slotLeft(i), top: SLOT.top, width: SLOT.width, height: SLOT.height * open,
        borderRadius: SLOT.radius, background: SLOT.fill, opacity: Math.min(1, open * 1.6), ...style,
      }}
    />
  );

/** the hash line: the laptop's device ID from `fingerprint`, one line of mono, centred at HANDOFF.hashLine.top */
export const HASH_LINE = { top: HANDOFF.hashLine.top, height: 55, fontSize: 44 }; // matches browsers-end
export const HashLine: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { theme, ground } = useScene();
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: HASH_LINE.top, height: HASH_LINE.height, lineHeight: `${HASH_LINE.height}px`, textAlign: "center", fontFamily: theme.font.mono, fontSize: HASH_LINE.fontSize, fontWeight: 600, color: ground.ink, whiteSpace: "nowrap", ...style }}>
      {shortHash(HASH)}
    </div>
  );
};

/** the sawtooth the technique plays, flowing left to right through the row. `drawn` reveals it from the left,
 *  `amp` 0..1 flattens it (the browsers stopping it). */
export const RowWave: React.FC<{ drawn: number; amp: number; phase: number; opacity?: number }> = ({ drawn, amp, phase, opacity = 1 }) => {
  const x0 = 100;
  const x1 = 980;
  const period = 64;
  const h = 34 * amp;
  const pts: string[] = [];
  const end = x0 + (x1 - x0) * drawn;
  for (let x = x0; x <= end; x += 4) {
    const t = (((x - x0 - phase) % period) + period) % period;
    pts.push(`${x},${(ROW.y + h / 2 - (t / period) * h).toFixed(1)}`);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity }}>
      {pts.length > 1 && <polyline points={pts.join(" ")} fill="none" stroke={WAVE} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
};
