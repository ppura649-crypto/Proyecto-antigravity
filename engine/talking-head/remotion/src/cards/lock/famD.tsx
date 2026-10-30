import type React from "react";
import type { CardProps } from "../props";
import { DStore } from "./DStore";
import { DSafe, DVet, DWall } from "./DAir";
// reference edit J (agent-lock reel), family famD: THE SPONSOR. The store listing (V19) and
// then one object in three states, the AIR wall (V20 -> V21 -> V22). The CTA (V23)
// uses the existing `cta` kind and needs nothing here.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  dstore: DStore as React.FC<CardProps & { data: any }>,
  dwall: DWall as React.FC<CardProps & { data: any }>,
  dvet: DVet as React.FC<CardProps & { data: any }>,
  dsafe: DSafe as React.FC<CardProps & { data: any }>,
};
