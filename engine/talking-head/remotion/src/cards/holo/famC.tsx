import React from "react";
import type { CardProps } from "../props";
import { Deal } from "./C-deal";
import { UgcPhones, SkimsAnim } from "./C-skims";
import { Campaign } from "./C-campaign";
import { Poster } from "./C-poster";
import { Exploded } from "./C-3d";
// reference edit K (Holo) family C, rows B8-B14 (17750 → 29700): the outputs from Holo's promo, the SKIMS videos and
// animations, the campaign fan into the Library, the Crocs poster edited live, the 3D ad changing direction.

type K = React.FC<CardProps & { data: any }>;
// v3 ("it shouldn't touch my face"): every card is clipped to its own box (0..w, 0..h), so no landing,
// overhang, shadow or exit can ever reach below the band. The cards are also laid out to end ~40 px above it.
const boxed = (C: K): K => {
  const Boxed: K = (p) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: p.w, height: p.h, overflow: "hidden" }}>
      <C {...p} />
    </div>
  );
  return Boxed;
};

export const KINDS: Record<string, K> = {
  "holo-deal": boxed(Deal),
  "holo-ugc-phones": boxed(UgcPhones),
  "holo-skims-anim": boxed(SkimsAnim),
  "holo-campaign": boxed(Campaign),
  "holo-poster": boxed(Poster),
  "holo-exploded": boxed(Exploded),
};
