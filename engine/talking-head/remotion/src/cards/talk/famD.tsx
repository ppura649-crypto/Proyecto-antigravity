import type React from "react";
import type { CardProps } from "../props";
import { DTimeline } from "./DTimeline";
import { DSkillFolder } from "./DSkillFolder";
// reference edit H (the guest, talk vs type), family D: the two objects that are NAMED things.
// d-timeline (V3) is frameless on the cream wall: the rail from 2024 to 2026 with the two real
// marks landing on it. d-skill-folder (V15) is a paper card: their own skill as a blue macOS
// folder with its SKILL.md rising out of it and writing itself.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "d-timeline": DTimeline as React.FC<CardProps & { data: any }>,
  "d-skill-folder": DSkillFolder as React.FC<CardProps & { data: any }>,
};
