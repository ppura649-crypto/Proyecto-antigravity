import type React from "react";
import type { CardProps } from "../props";
import { Clapper } from "./T-clap";
import { Cube } from "./T-cube";
import { Layers } from "./T-layers";
import { EditorSlate } from "./T-slate";
// keyframes-v1 hook variants, builder T (2026-09-25): T1 Rubik cube, T2 clapperboard; round 2: T3 layers, T4 slate.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-t-cube": Cube, "kf-t-clapper": Clapper, "kf-t-layers": Layers, "kf-t-slate": EditorSlate,
};
