import React from "react";
import { fitText } from "@remotion/layout-utils";
import { clamp, easeOut3 } from "./L-util";
// keyframes-v1 builder U (round 2): this video's own first caption stack, "AI EDITS / ALL OF MY / VIDEOS NOW,",
// drawn on a phone screen in the Creator Format 1 pack (Sora 700 white, the hero line in the grey accent gradient, the
// caption shadow). Geometry measured on the rendered reel, in 1080 x 1920 frame units, mapped into the screen
// with the same cover fit the video uses.

export const CAP_WORDS = [
  { text: "AI", at: 0, line: 0 }, { text: "EDITS", at: 304, line: 0 },
  { text: "ALL", at: 664, line: 1 }, { text: "OF", at: 844, line: 1 }, { text: "MY", at: 904, line: 1 },
  { text: "VIDEOS", at: 1024, line: 2 }, { text: "NOW,", at: 1144, line: 2 },
];
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const ACCENT = "linear-gradient(100deg, #D4D7DC 0%, #9FA4AC 14%, #C6C9CF 26%, #D4D7DC 34%, #8E939B 42%, #D4D7DC 50%, #9FA4AC 64%, #C6C9CF 76%, #D4D7DC 84%)";
const X0 = 124, SW = 832, TOPS = [1016, 1104, 1178], SMALL = 62, HERO_W = 713;

// p(i) = 0..1 how far word i has settled (0 hidden)
export const CapStack: React.FC<{ w: number; h: number; p: (i: number) => number }> = ({ w, h, p }) => {
  const sc = h / 1920, ox = (w - 1080 * sc) / 2;
  const hero = Math.min(150, fitText({ text: "VIDEOS NOW,", withinWidth: HERO_W, fontFamily: "Sora", fontWeight: 700 }).fontSize);
  const word = (i: number, size: number, accent: boolean) => {
    const q = clamp(p(i));
    if (q <= 0) return <span key={i} style={{ opacity: 0 }}>{CAP_WORDS[i]!.text}</span>;
    const e = easeOut3(q);
    return (
      <span key={i} style={{ display: "inline-block", opacity: Math.min(1, q * 2.2), transform: `translateY(${(-26 * (1 - e)).toFixed(2)}px) scale(${(1 + 0.35 * (1 - e)).toFixed(3)})`,
        transformOrigin: "50% 60%", fontSize: size, whiteSpace: "pre",
        ...(accent ? { backgroundImage: ACCENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.8)) drop-shadow(0px 8px 14px rgba(0,0,0,0.45))" } : { color: "#FFFFFF", textShadow: SHADOW }) }}>
        {CAP_WORDS[i]!.text}
      </span>
    );
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: ox, top: 0, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: "0 0",
        fontFamily: "var(--reel-font), Sora, sans-serif", fontWeight: 700, lineHeight: 1, letterSpacing: "0.005em" }}>
        <div style={{ position: "absolute", left: X0, top: TOPS[0], width: SW, display: "flex", justifyContent: "space-between" }}>
          {word(0, SMALL, false)}{word(1, SMALL, false)}
        </div>
        <div style={{ position: "absolute", left: X0, top: TOPS[1], width: SW, display: "flex", justifyContent: "space-between" }}>
          {word(2, SMALL, false)}{word(3, SMALL, false)}{word(4, SMALL, false)}
        </div>
        <div style={{ position: "absolute", left: 0, top: TOPS[2], width: 1080, display: "flex", justifyContent: "center", gap: hero * 0.28 }}>
          {word(5, hero, true)}{word(6, hero, true)}
        </div>
      </div>
    </div>
  );
};
