import type React from "react";
import type { CardProps } from "../props";
import { CLAW_KINDS } from "./X-claw";
import { CONTACT_KINDS } from "./X-contact";
import { PICKS_KINDS } from "./X-picks";
import { VISUALS_KINDS } from "./X-visuals";
// keyframes-v1 hook variants, builder X (2026-09-25): X1 kf-x-claw (claw machine), X2 kf-x-contact (contact sheet),
// round 2: X3 kf-x-picks (Claude picks the take), X4 kf-x-visuals (Claude throws the visuals onto the phone).
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...CLAW_KINDS, ...CONTACT_KINDS, ...PICKS_KINDS, ...VISUALS_KINDS };
