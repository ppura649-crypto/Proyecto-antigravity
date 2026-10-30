import type React from "react";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { Camo } from "./F-camo";
import { Press } from "./F-press";
import { Domino } from "./F-domino";
import { Spot } from "./F-spot";
import { Drop } from "./F-drop";
// reference edit K hook variants round 2 (2026-09-24), builder F: video h2 ("AI marketing looks all the same. Here is how
// to not blend in."), window 1707 -> 4404. v1 camouflage wall · v2 the press · v3 last one standing ·
// v4 one light · v5 the backdrop drops.
loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-f-camo": Camo,
  "holo-f-press": Press,
  "holo-f-domino": Domino,
  "holo-f-spot": Spot,
  "holo-f-drop": Drop,
};
