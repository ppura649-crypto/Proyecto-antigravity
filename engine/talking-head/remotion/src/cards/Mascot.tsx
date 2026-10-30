import React from "react";
import { ACCENT } from "./theme";

// The Claude agent mark, one file so every explainer card draws the same agent.
// Only the height is set: the 24x24 viewBox keeps it square, exactly as the
// approved tree (Fanout) draws it.
export const GLOW = "drop-shadow(0px 3px 12px rgba(0,0,0,0.75))";
export const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

export const Mascot: React.FC<{ size: number; color?: string; glow?: boolean }> = ({
  size, color = ACCENT, glow = true,
}) => (
  <svg height={size * (20 / 24)} viewBox="0 0 24 24" style={{ display: "block", filter: glow ? GLOW : undefined }}>
    <title>Claude</title>
    <path
      clipRule="evenodd"
      d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
      fill={color}
      fillRule="evenodd"
    />
  </svg>
);
