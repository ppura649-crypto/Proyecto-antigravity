import type React from "react";
import type { CardProps } from "../props";
import { CFile } from "./CFile";
import { CTheft } from "./CTheft";
import { CTiny } from "./CTiny";
import { CList } from "./CList";
import { CThree } from "./CThree";
// reference edit J (agent-lock reel), family famC: THE FILES AND THE THEFT.
// cfile  V1  the villain file, light card, the hook's first object
// ctheft V5  what it copied and where it sent it
// ctiny  V11 their word `tiny`, in the real numbers
// clist  V13 step 1: every folder, and the three agents that trust it
// cthree V16 the three kinds of file it watches: one changed, two did not
type Card = React.FC<CardProps & { data: any }>;
export const KINDS: Record<string, Card> = {
  cfile: CFile as Card,
  ctheft: CTheft as Card,
  ctiny: CTiny as Card,
  clist: CList as Card,
  cthree: CThree as Card,
};
