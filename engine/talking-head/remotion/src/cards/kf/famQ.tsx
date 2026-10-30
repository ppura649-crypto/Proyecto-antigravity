import type React from "react";
import type { CardProps } from "../props";
import { AgentFlow } from "./Q-flow";
import { BuyBlock } from "./Q-buy";
// keyframes-v1 family Q (builder Q, 2026-09-25): V6 the agents cover-flow that unfolds into this video's
// timeline, V7 the buy block freed of its subscription ring.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-q-agents": AgentFlow,
  "kf-q-buy": BuyBlock,
};
