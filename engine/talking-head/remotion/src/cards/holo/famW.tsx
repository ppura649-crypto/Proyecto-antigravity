import type React from "react";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { Polaroids } from "./W-polaroid";
import { Sweep } from "./W-sweep";
import { NightShift } from "./W-night";
// reference edit K v3 (2026-09-24): hook-1 variant visuals, builder W, window 1974 -> 4237.
// h1v06 Polaroids develop · h1v07 a month in one sweep · h1v08 night shift
loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-w-polaroids": Polaroids,
  "holo-w-sweep": Sweep,
  "holo-w-nightshift": NightShift,
};
