import type React from "react";
import type { CardProps } from "../props";
import { BBorn } from "./BBorn";
import { BGhosts, BFlip } from "./BGhosts";
import { BInstant } from "./BInstant";
import { BVault } from "./BVault";
import { BStolen } from "./BStolen";
// reference edit J (agent-lock reel), family famB: THE FOLDER, the story's recurring character.
// One blue macOS folder, never shown the same way twice. It is born out of a GitHub repo tile
// (fborn), opens and lets its hidden files out (fghosts), one of those turns out to be a
// command (fflip), it runs that command as you the second it opens (finstant), and its files
// are finally fingerprinted into a vault outside it (fvault). fstolen is the hook-2 first
// object in edit-j-b: the same repo tile, drinking their passwords.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  fborn: BBorn as React.FC<CardProps & { data: any }>,
  fghosts: BGhosts as React.FC<CardProps & { data: any }>,
  fflip: BFlip as React.FC<CardProps & { data: any }>,
  finstant: BInstant as React.FC<CardProps & { data: any }>,
  fvault: BVault as React.FC<CardProps & { data: any }>,
  fstolen: BStolen as React.FC<CardProps & { data: any }>,
};
