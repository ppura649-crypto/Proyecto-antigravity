import type React from "react";
import type { CardProps } from "../props";
import { Stats } from "./M-stats";
import { Calendar } from "./M-cal";
// keyframes-v1 family M (builder M, 2026-09-25): V3 the profile stats drums, V15 the tear-off day page. Both above their head.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-m-stats": Stats,
  "kf-m-calendar": Calendar,
};
