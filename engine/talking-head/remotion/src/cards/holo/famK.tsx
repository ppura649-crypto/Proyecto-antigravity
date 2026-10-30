import type React from "react";
import type { CardProps } from "../props";
import { Gust } from "./K-gust";
import { Press } from "./K-press";
import { Blinds } from "./K-blinds";
import { Flipbook } from "./K-flip";
import { Gravity } from "./K-gravity";
// reference edit K hook variants round 2 (2026-09-24), builder K: hook 5, "If your marketing plan from Claude just became
// another to-do list, you need to watch this." Window JUST 1611 -> "whole" 5155, one event per variant.
// h5v1 holo-k-gust: a wall of sticky-note to-dos blown off by a gust, three real ads underneath (K-gust)
// h5v2 holo-k-press: a steel platen slams on the to-do sheet; it lifts off a press sheet of three real ads (K-press)
// h5v3 holo-k-blinds: one to-do per slat of a venetian blind; it tilts open and rises off real ads (K-blinds)
// h5v4 holo-k-flipbook: the to-do notepad riffles like a flipbook; its pages are a SKIMS try-on clip (K-flip)
// h5v5 holo-k-gravity: the typed to-do list's letters fall and pile up; a real Crocs ad drops onto them (K-gravity)
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-k-gust": Gust,
  "holo-k-press": Press,
  "holo-k-blinds": Blinds,
  "holo-k-flipbook": Flipbook,
  "holo-k-gravity": Gravity,
};
