import React from "react";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { clamp, win } from "./L-util";
// keyframes-v1 hook builder U (2026-09-25): shared bits for the two U hooks. The title alone to NOW (same as
// kf-l-hook2), the hook words, and the phone geometry (L-reel Phone 292 x 600, screen inset 9, scale 0.92,
// top-centre anchored) so both payoffs land their finished reel on the same device in the same place.

export const UB = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, i: 2177, got: 2357, this: 2537 };
export type UBeats = typeof UB;
export const beatsU = (b: Record<string, number>): UBeats => ({ ...UB, ...(b as Partial<UBeats>) });

export const PH = { x: 540 - 146, y: 7, s: 0.92 };
// the phone screen on the card once landed (design px)
export const SCR = { x: 540 - 137 * PH.s, y: PH.y + 9 * PH.s, w: 274 * PH.s, h: 582 * PH.s, r: 40 * PH.s };
// cover-fit of a 9:16 picture into a rect of w x h: its drawn size and left offset
export const cover916 = (w: number, h: number) => {
  const ih = Math.max(h, (w * 16) / 9), iw = (ih * 9) / 16;
  return { iw, ih, ox: (w - iw) / 2, oy: (h - ih) / 2 };
};

export const Title: React.FC<CardProps & { data: any; toMs: number }> = (props) => {
  const T = HOLO_H["holo-h-title"]!;
  const d = props.data ?? {};
  return <T {...props} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;
};

// the exit every hook shares: gone by toMs, 137 ms
export const exitU = (t: number, toMs: number) => clamp(win(t, toMs - 137, toMs));
