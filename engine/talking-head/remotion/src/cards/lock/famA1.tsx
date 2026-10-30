import type React from "react";
import type { CardProps } from "../props";
import { CcEmpty, CcHarmless, CcHook } from "./A1Hook";
import { CcPull, CcTrust } from "./A1Trust";
// reference edit J (agent-lock reel), family famA1: the REAL CLAUDE CODE WINDOW in the story half.
// One window (A1Window.tsx), five states of it. Register every card of this family here;
// nothing else in the tree needs an edit.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  cchook: CcHook,       // V3  the hook runs before Claude opens
  ccharmless: CcHarmless, // V4  the same slot, the benign command
  cctrust: CcTrust,     // V9  the real trust dialog, folding into a tag on the folder
  ccpull: CcPull,       // V10 the pull that rewrites the file, and the tag that does not move
  ccempty: CcEmpty,     // V1c hook 3: the session opened, the prompt was never touched
};
