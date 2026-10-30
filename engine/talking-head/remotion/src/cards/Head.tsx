import React from "react";
import { MONO_FONT, MUTED, label } from "./theme";

// The header row every black explainer card wears, measured off the two
// approved finals (`creator-skills-rules-final`, `guest-jina-search-final`):
// a small-caps letter-spaced label at the top left in grey, and an optional
// mono figure right-aligned on the same line. It is what makes a drawn card
// read as a designed slide instead of a poster.
export const Head: React.FC<{ w: number; left: string; right?: string; rightColor?: string }> = ({
  w, left, right, rightColor,
}) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
    <div style={label(0.023 * w, MUTED)}>{left}</div>
    {right && (
      <div style={{ fontFamily: MONO_FONT, fontSize: 0.023 * w, color: rightColor ?? "rgba(255,255,255,0.42)" }}>
        {right}
      </div>
    )}
  </div>
);
