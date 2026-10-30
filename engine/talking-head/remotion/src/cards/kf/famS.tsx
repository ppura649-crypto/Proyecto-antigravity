import type React from "react";
import type { CardProps } from "../props";
import { Blinds } from "./S-blinds";
import { Deliver } from "./S-deliver";
import { Invoice } from "./S-invoice";
import { Record } from "./S-record";
import { Spot } from "./S-spot";
import { Yours } from "./S-yours";
// keyframes-v1 family S (builder S, 2026-09-25): V12 blinds, V13 invoice, V14 deliver (record = the retired
// dominoes), V17 yours (spot = the retired spotlight).
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-s-blinds": Blinds,
  "kf-s-invoice": Invoice,
  "kf-s-record": Record,
  "kf-s-deliver": Deliver,
  "kf-s-spot": Spot,
  "kf-s-yours": Yours,
};
