import type React from "react";
import type { CardProps } from "../props";
import { HoloConnect } from "./D-connect";
import { RetimedClip } from "./D-clip";
import { HoloApprove } from "./D-approve";
import { HoloAutopilot } from "./D-autopilot";
import { HoloPlanAdapt } from "./D-adapt";
import { HoloRecap } from "./D-recap";
// reference edit K (Holo) family D: B15-B22, connect -> schedule -> approve -> autopilot -> analytics -> adapt -> runs -> recap.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-d-connect": HoloConnect,
  "holo-d-clip": RetimedClip,
  // three different Holo clips (calendar, analytics, runs-the-ads) share one retiming component; one kind each
  "holo-d-calendar": RetimedClip, "holo-d-analytics": RetimedClip, "holo-d-runs": RetimedClip,
  "holo-d-approve": HoloApprove,
  "holo-d-autopilot": HoloAutopilot,
  "holo-d-adapt": HoloPlanAdapt,
  "holo-d-recap": HoloRecap,
};
