import type React from "react";
import type { CardProps } from "../props";
import { SLOT_KINDS } from "./G-slots";
import { TEAR_KINDS } from "./G-tear";
import { PUZZLE_KINDS } from "./G-puzzle";
import { MELT_KINDS } from "./G-melt";
import { LIGHTS_KINDS } from "./G-lights";
// reference edit K hook variants round 2 (2026-09-24), builder G: hook 3 ("... you end up with AI slop. You need to
// watch this. The fix is starting from your own brand"), 2233 -> 5937 on the h3 clock.
// h3v1 holo-g-slots: a slot machine lands a losing line of slop, re-spins and locks a matched SKIMS line (G-slots)
// h3v2 holo-g-tear: the slop poster rips off in two pulls, the real Crocs poster under it is left clean (G-tear)
// h3v3 holo-g-puzzle: a slop jigsaw whose pieces do not fit falls away, a real Crocs poster snaps together (G-puzzle)
// h3v4 holo-g-melt: the slop ad melts and drains away, a real SKIMS print drops in with weight (G-melt)
// h3v5 holo-g-lights: a night billboard, the slop under a dying cheap bulb, three lamps clank on a real SKIMS ad (G-lights)
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  ...SLOT_KINDS,
  ...TEAR_KINDS,
  ...PUZZLE_KINDS,
  ...MELT_KINDS,
  ...LIGHTS_KINDS,
};
