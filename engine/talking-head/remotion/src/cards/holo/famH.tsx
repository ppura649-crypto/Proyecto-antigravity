import type React from "react";
import { interpolate } from "remotion";
import { fitText } from "@remotion/layout-utils";
import type { CardProps } from "../props";
// reference edit K v3 (2026-09-24): the hook title, their words "the first 2 seconds should be a 2 sentence text,
// no div nothing, ultra hooking". Plain white words in the reel font with the caption shadow, no plate.
// Complete at frame 0; a slow push while it holds; a short rise-and-fade out at toMs.
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

const HookText: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fromMs, toMs, data }) => {
  const lines: string[] = data?.lines ?? [];
  const maxPx: number = data?.fontPx ?? 96;
  const font = "Sora";
  const out = interpolate(tMs, [toMs - 140, toMs], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push = interpolate(tMs, [fromMs, toMs], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = (1 - out) * -18;
  const sizes = lines.map((l) => Math.min(maxPx, fitText({ text: l, withinWidth: w - 80, fontFamily: font, fontWeight: 700 }).fontSize));
  const size = Math.min(...sizes);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", opacity: out, transform: `translateY(${lift}px) scale(${push})` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: "var(--reel-font)", fontWeight: 700, fontSize: size, lineHeight: 1.08,
          color: "#FFFFFF", textShadow: SHADOW, whiteSpace: "pre", textAlign: "center", letterSpacing: "-0.005em" }}>{l}</div>
      ))}
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = { "holo-h-title": HookText };
