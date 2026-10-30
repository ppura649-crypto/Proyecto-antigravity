import React from "react";
// reference edit K family A (2026-09-23): the drawn "AI slop" ad. Fifteen near-identical tiles: one beige
// gradient, one stock dropper bottle drawn in CSS, one cliché headline with a ✨ in a different
// cheap font each time. No real brand on any of them, on purpose.
export const SLOP_LINES = [
  "Elevate your everyday ✨", "Unlock your glow ✨", "Your best self starts here ✨",
  "Elevate your glow ✨", "Unlock your everyday ✨", "Your glow starts here ✨",
  "Elevate your routine ✨", "Unlock your best self ✨", "Glow, elevated ✨",
  "Your everyday, elevated ✨", "Unlock the glow ✨", "Elevate your ritual ✨",
  "Your ritual starts here ✨", "Discover your glow ✨", "Elevate everything ✨",
];
const FONTS = [
  "Papyrus", "Didot", "Futura", "Snell Roundhand", "Copperplate", "Bodoni 72", "Chalkboard",
  "Georgia", "Optima", "Marker Felt", "Baskerville", "Gill Sans", "American Typewriter",
  "Avenir Next", "Trebuchet MS",
];

const Bottle: React.FC<{ hue: number; s: number }> = ({ hue, s }) => (
  <div style={{ position: "absolute", left: "50%", bottom: 22, width: 60 * s, height: 112 * s,
    transform: "translateX(-50%)" }}>
    {/* floor shadow */}
    <div style={{ position: "absolute", left: -10 * s, right: -10 * s, bottom: -6 * s, height: 12 * s,
      borderRadius: "50%", background: "rgba(90,60,30,0.28)", filter: "blur(3px)" }} />
    {/* cap + dropper bulb */}
    <div style={{ position: "absolute", left: 17 * s, width: 26 * s, top: 0, height: 34 * s,
      borderRadius: `${13 * s}px ${13 * s}px ${4 * s}px ${4 * s}px`,
      background: "linear-gradient(90deg,#1c1714,#4a4039 45%,#1c1714)" }} />
    <div style={{ position: "absolute", left: 14 * s, width: 32 * s, top: 32 * s, height: 10 * s,
      borderRadius: 2 * s, background: "linear-gradient(90deg,#b8914f,#f4d99a 45%,#a07a3c)" }} />
    {/* amber body */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 40 * s, bottom: 0, borderRadius: 12 * s,
      background: `linear-gradient(90deg,hsl(${hue},55%,30%),hsl(${hue},60%,52%) 38%,hsl(${hue},55%,34%))`,
      boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.25)" }}>
      <div style={{ position: "absolute", left: 8 * s, top: 6 * s, width: 6 * s, bottom: 10 * s,
        borderRadius: 4 * s, background: "rgba(255,255,255,0.35)" }} />
      <div style={{ position: "absolute", left: 12 * s, right: 12 * s, top: 24 * s, height: 30 * s,
        borderRadius: 3 * s, background: "#f6efe4" }}>
        <div style={{ margin: `${7 * s}px auto 0`, width: "70%", height: 3 * s, background: "#b9a58c" }} />
        <div style={{ margin: `${5 * s}px auto 0`, width: "50%", height: 3 * s, background: "#d4c4ae" }} />
      </div>
    </div>
  </div>
);

// melt (hook 3, 0..1): the headline slides and softens, the bottle leans, the colour goes flat
export const SlopTile: React.FC<{ i: number; w: number; h: number; split: number; melt?: number }> = ({ i, w, h, split, melt = 0 }) => {
  const hue = 28 + ((i * 7) % 9);
  const font = FONTS[i % FONTS.length];
  // RGB split during the scan glitch: two coloured ghosts of the headline
  const ghost = split > 0
    ? `${split}px 0 0 rgba(255,0,70,0.75), ${-split}px 0 0 rgba(0,220,255,0.75)` : "none";
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: melt > 0 ? `saturate(${1 - melt * 0.4})` : undefined,
      background: `linear-gradient(${150 + (i % 3) * 8}deg, #f5ece0 0%, hsl(${hue},42%,80%) 62%, hsl(${hue},38%,70%) 100%)` }}>
      <div style={{ position: "absolute", left: 10, right: 10, top: 12, textAlign: "center",
        fontFamily: `"${font}", Georgia, serif`, fontSize: 26, lineHeight: 1.08, fontWeight: 600,
        color: "#5b4433", textShadow: ghost,
        transform: `translateY(${melt * 20}px) skewY(${melt * 4}deg) scaleY(${1 + melt * 0.18})`,
        transformOrigin: "50% 0%", filter: melt > 0 ? `blur(${melt * 0.7}px)` : undefined }}>
        {SLOP_LINES[i % SLOP_LINES.length]}
      </div>
      {/* the generic glow blob every one of them has */}
      <div style={{ position: "absolute", left: "50%", bottom: 34, width: 120, height: 120,
        transform: "translateX(-50%)", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,250,240,0.9), rgba(255,250,240,0) 70%)" }} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%",
        transform: `rotate(${melt * 9}deg) translateY(${melt * 6}px)` }}>
        <Bottle hue={hue} s={0.9 + ((i * 3) % 4) * 0.03} />
      </div>
      <div style={{ position: "absolute", left: 16, top: h * 0.5, fontSize: 18 }}>✨</div>
      <div style={{ position: "absolute", right: 18, top: h * 0.62, fontSize: 14 }}>✨</div>
    </div>
  );
};
