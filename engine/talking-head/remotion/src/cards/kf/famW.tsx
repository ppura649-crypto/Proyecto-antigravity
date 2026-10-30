import type React from "react";
import type { CardProps } from "../props";
import { Accordion } from "./W-accordion";
import { Flipbook } from "./W-flipbook";
import { DeadCut } from "./W-deadcut";
import { Captions } from "./W-captions";
// keyframes-v1 hook variants, builder W (2026-09-25): W1 accordion, W2 flipbook; round 2: W3 dead cut, W4 captions.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-w-accordion": Accordion,
  "kf-w-flipbook": Flipbook,
  "kf-w-deadcut": DeadCut,
  "kf-w-captions": Captions,
};
