import type React from "react";
import type { CardProps } from "../props";
import { Paste } from "./B-paste";
import { Profile } from "./B-profile";
import { Branding } from "./B-branding";
import { Plan, Wall } from "./B-gen";
export { HoloPlanCard } from "./B-plan";
// reference edit K (Holo) family B, body rows B1-B7 (video-1 ms 6000 -> 17750):
// B1 holo-b-paste · B2 holo-b-reads (round 3: the SKIMS brand profile, B-profile.tsx) · B3+B4 holo-b-branding (chained) · B5+B6 holo-b-plan (chained) · B7 holo-b-wall (v2: Holo's ad wall)
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-b-paste": Paste,
  "holo-b-reads": Profile,
  "holo-b-branding": Branding,
  "holo-b-plan": Plan,
  "holo-b-wall": Wall,
};
