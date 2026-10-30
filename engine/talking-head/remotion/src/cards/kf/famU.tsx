import type React from "react";
import type { CardProps } from "../props";
import { SHRED_KINDS } from "./U-shred";
import { GRAINS_KINDS } from "./U-grains";
import { TALK_KINDS } from "./U-talk";
import { NOLINE_KINDS } from "./U-noline";
// keyframes-v1 hook variants, builder U (2026-09-25): U1 kf-u-shred (reverse shredder), U2 kf-u-grains (sand to reel);
// round 2: U3 kf-u-talk (Claude vortex), U4 kf-u-noline (timeline shredder).
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...SHRED_KINDS, ...GRAINS_KINDS, ...TALK_KINDS, ...NOLINE_KINDS };
