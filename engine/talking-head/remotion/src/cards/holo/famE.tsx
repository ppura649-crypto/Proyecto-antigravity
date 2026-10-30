import type React from "react";
import type { CardProps } from "../props";
import { Hook4 } from "./E-h4";
import { Hook5 } from "./E-h5";
import { HoloHandover } from "./E-holo";
// reference edit K (Holo) family E (2026-09-24): hooks 4 and 5, 0 -> "Paste". Each hook is one continuous object
// across five chained events (Overlay's `callback` keeps the entrance clock, so rows never re-pop); every kind
// is the same component reading the spine clock and the event's beats. data[kind].hook picks 4 or 5.
// data[kind].solo (round-2 hooks): the hand-over alone, Holo's mark arriving on its own after another builder's visual
const HookE: React.FC<CardProps & { data: any }> = ({ tMs, fps, beats, assets, data }) =>
  data?.solo ? <HoloHandover solo t={tMs} fps={fps} b={beats} assets={assets} />
  : data?.hook === 5 ? <Hook5 t={tMs} fps={fps} b={beats} assets={assets} /> : <Hook4 t={tMs} fps={fps} b={beats} assets={assets} />;

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  // hook 4: claude chat -> every ad by hand -> stall -> into Holo -> the URL field
  "holo-e-claude": HookE, "holo-e-canvas": HookE, "holo-e-stall": HookE,
  // hook 5: the 30-day plan -> the to-do list -> sits undone
  "holo-e-plan": HookE, "holo-e-todo": HookE, "holo-e-undone": HookE,
  // both: the hand-over into Holo's mark, then its URL field (B1 continues it)
  "holo-e-holo": HookE, "holo-e-field": HookE,
};
