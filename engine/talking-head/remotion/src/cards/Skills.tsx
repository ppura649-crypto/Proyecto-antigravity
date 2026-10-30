import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { INK, MONO_FONT } from "./theme";

// The template, as the thing it actually is: an agent and the skills it owns.
// Each folder comes OUT of the agent icon and flies to its slot, so the picture
// is "it built these", not "here is a diagram of four folders".
// the creator 2026-09-04: "have like claude agent icon, with skills (blue folders
// ultra realistics) with names like captions, cut-hard, understanding,
// visuals-realistic".

export const Folder: React.FC<{ w: number; open: number }> = ({ w, open }) => {
  const h = Math.round(w * 0.76);
  return (
    <svg width={w} height={h} viewBox="0 0 200 152" style={{ display: "block", filter: "drop-shadow(0 14px 20px rgba(0,0,0,0.55))" }}>
      <defs>
        <linearGradient id="fbk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#63A9F2" /><stop offset="1" stopColor="#3277CB" />
        </linearGradient>
        <linearGradient id="ffr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#96CDFC" /><stop offset="1" stopColor="#4A93E6" />
        </linearGradient>
      </defs>
      {/* back plate with the tab */}
      <path
        d="M4,30 a12,12 0 0 1 12,-12 h58 a8,8 0 0 1 5.6,2.3 l9,9 a8,8 0 0 0 5.6,2.3 h89.8 a12,12 0 0 1 12,12 v96 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
        fill="url(#fbk)"
      />
      {/* the sheets inside, lifting a little as the folder lands */}
      <rect x={30} y={36 - 6 * open} width={140} height={86} rx={5} fill="#E9EEF6" opacity={0.95} />
      <rect x={38} y={44 - 10 * open} width={124} height={78} rx={4} fill="#FAFCFF" />
      {/* front flap */}
      <path
        d="M4,62 a7,7 0 0 1 7,-7 h178 a7,7 0 0 1 7,7 v78 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
        fill="url(#ffr)"
      />
      <path d="M11,55.6 h178 a7,7 0 0 1 6.9,6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
    </svg>
  );
};

export const Skills: React.FC<{
  tMs: number; w: number; h: number;
  icon: string; names: string[];
  beats: { agent: number; folders: number; per?: number };
}> = ({ tMs, w, h, icon, names, beats }) => {
  const P = Math.round(w * 0.030);
  const per = beats.per ?? 190;
  const n = names.length;
  const gap = Math.round(w * 0.022);
  const fw = Math.floor((w - 2 * P - gap * (n - 1)) / n);
  const fh = Math.round(fw * 0.76);
  const iconW = Math.round(h * 0.40);
  const iconH = Math.round(iconW * (440 / 520));
  const nameFs = Math.round(h * 0.052);

  const blockH = iconH + Math.round(h * 0.032) + fh + Math.round(h * 0.035) + nameFs * 2;
  const top = Math.max(Math.round(h * 0.05), Math.round((h - blockH) / 2));
  const rowTop = top + iconH + Math.round(h * 0.032);
  const iconX = (w - iconW) / 2;

  const ap = interpolate(tMs, [beats.agent, beats.agent + 240], [0, 1], {
    easing: Easing.out(Easing.back(1.6)), extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Img
        src={staticFile(icon)}
        style={{
          position: "absolute", left: iconX, top, width: iconW, height: iconH,
          imageRendering: "pixelated", opacity: Math.min(1, ap * 1.4),
          transform: `scale(${0.5 + 0.5 * ap})`, transformOrigin: "50% 100%",
        }}
      />
      {names.map((name, i) => {
        const at = beats.folders + i * per;
        const p = interpolate(tMs, [at, at + 340], [0, 1], {
          easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        // the folder leaves the agent icon and flies to its own slot
        const sx = iconX + iconW / 2 - fw / 2;
        const sy = top + iconH * 0.35;
        const dx = P + i * (fw + gap);
        const x = interpolate(p, [0, 1], [sx, dx]);
        const y = interpolate(p, [0, 1], [sy, rowTop]);
        const k = interpolate(p, [0, 1], [0.34, 1]);
        const rot = interpolate(p, [0, 1], [i % 2 ? 9 : -9, 0]);
        const np = interpolate(tMs, [at + 240, at + 420], [0, 1], {
          easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div key={name} style={{ position: "absolute", left: x, top: y, width: fw, opacity: Math.min(1, p * 3) }}>
            <div style={{ transform: `scale(${k}) rotate(${rot}deg)`, transformOrigin: "50% 40%" }}>
              <Folder w={fw} open={p} />
            </div>
            <div style={{
              marginTop: Math.round(h * 0.035), width: fw, textAlign: "center",
              fontFamily: MONO_FONT, fontSize: nameFs, lineHeight: 1.22, color: INK,
              opacity: np, transform: `translateY(${(1 - np) * 6}px)`,
              overflowWrap: "anywhere",
            }}>
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
