import type React from "react";
import type { CardProps } from "../props";
import { SHATTER_KINDS } from "./X-shatter";
import { TUNNEL_KINDS } from "./X-tunnel";
// reference edit K v3 (2026-09-24): hook-1 variant visuals, builder X.
// v09 holo-x-shatter: the slop ad marked up, then shattered to reveal the real creative (X-shatter)
// v10 holo-x-tunnel: a flight down a tunnel of real creatives onto one hero ad (X-tunnel)
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  ...SHATTER_KINDS,
  ...TUNNEL_KINDS,
};
