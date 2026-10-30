import React from "react";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
// keyframes-v1 builder Y (2026-09-25): shared bits of the two Y hooks. The plain white title alone to NOW (1144),
// exactly as L-hook2 draws it, and the hook words in spine ms.

export const YB = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, i: 2177, got: 2357, this: 2537, account: 2717, from: 2997 };
export type YBeats = typeof YB;
export const yBeats = (b: Record<string, number>): YBeats => ({ ...YB, ...(b as Partial<YBeats>) });

export const Title: React.FC<CardProps & { data: any; now: number }> = ({ now, ...props }) => {
  const T = HOLO_H["holo-h-title"]!;
  const d = props.data ?? {};
  return <T {...props} fromMs={props.fromMs} toMs={now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;
};

// the phone's final place (same device and scale as L-hook2): 292 x 600 at (394, 7), scaled 0.92 from its top centre
export const PH = { x: 540 - 146, y: 7, s: 0.92 };
// screen rect of the phone's display once landed (design px)
export const SCREEN = { x: 540 - 137 * PH.s, y: PH.y + 9 * PH.s, w: 274 * PH.s, h: 582 * PH.s };
