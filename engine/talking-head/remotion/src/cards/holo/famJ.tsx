import type React from "react";
import type { CardProps } from "../props";
import { Flap } from "./J-flap";
import { Puzzle } from "./J-puzzle";
import { Press } from "./J-press";
import { Lights } from "./J-lights";
import { Roller } from "./J-roller";
// reference edit K hook variants round 2 (2026-09-24), builder J: hook 4 ("...doing every ad yourself..."), the visual
// between the title (AND 1805) and the Holo hand-over (WHOLE 5655). One kind per variant.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-j-flap": Flap,       // h4v1: split-flap board, flipped by hand one tile per word, then the whole board
  "holo-j-press": Press,     // h4v3: a print sheet of four ads, one cut out by hand with a knife, then a die press
  "holo-j-lights": Lights,   // h4v4: a dark gallery wall of ads, one lamp per word by hand, then every bank on
  "holo-j-roller": Roller,   // h4v5: one ad brushed onto a wall stroke by stroke, then one roller pass pastes five
  "holo-j-puzzle": Puzzle,   // h4v2: a jigsaw of three real ads, fitted by hand piece by piece, then all at once
};
