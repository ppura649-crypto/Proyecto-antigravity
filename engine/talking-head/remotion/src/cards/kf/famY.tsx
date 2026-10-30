import type React from "react";
import type { CardProps } from "../props";
import { IRIS_KINDS } from "./Y-iris";
import { HOPPER_KINDS } from "./Y-hopper";
import { MACHINE_KINDS } from "./Y-machine";
import { TRIM_KINDS } from "./Y-trim";
// keyframes-v1 hook variants, builder Y (2026-09-25): Y1 kf-y-iris (a lens iris closes on their raw take and snaps
// open on the finished reel), Y2 kf-y-hopper (their raw clips pour into a glass hopper, one finished reel drops out).
// Round 2: Y3 kf-y-machine (the hopper as Claude's editing machine, dead prints ejected), Y4 kf-y-trim (the raw take
// as a bar, Claude's cutter drops the real dead gaps, 1:29 -> 0:43).
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...IRIS_KINDS, ...HOPPER_KINDS, ...MACHINE_KINDS, ...TRIM_KINDS };
