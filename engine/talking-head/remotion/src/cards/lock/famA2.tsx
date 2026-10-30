import type React from "react";
import type { CardProps } from "../props";
import { A2Name } from "./A2Name";
import { A2Check } from "./A2Check";
import { A2Stop } from "./A2Stop";
import { A2Menu } from "./A2Menu";
// reference edit J (agent-lock reel), family famA2: THE TERMINAL in the product half, where
// agent-lock runs. One window (cards/lock/A2Window.tsx, the palette and chrome of
// cards/ClaudeCode.tsx), four moments: it names itself (V12), it answers every launch
// (V15), it stops a launch and shows the diff (V17), and the creator picks from its real menu
// while a subagent reads the change in an empty room (V18).
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  alname: A2Name as React.FC<CardProps & { data: any }>,
  alcheck: A2Check as React.FC<CardProps & { data: any }>,
  alstop: A2Stop as React.FC<CardProps & { data: any }>,
  almenu: A2Menu as React.FC<CardProps & { data: any }>,
};
