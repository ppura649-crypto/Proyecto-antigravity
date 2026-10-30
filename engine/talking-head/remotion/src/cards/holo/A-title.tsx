import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { clamp, pick } from "./A-util";
// edit-k-h1t (2026-09-24): the hook as ONE white card with one sentence that sums up the whole video
// (paste your site -> Holo reads the brand, plans the month, makes and runs the marketing). Complete at
// frame 0, readable instantly; the only life is a very slow push 1.00 -> 1.03. A 120 ms exit into the wall.
loadFont("normal", { weights: ["800"], subsets: ["latin"] });
const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;

type Seg = { t: string; accent?: boolean };
const LINES: Seg[][] = [
  [{ t: "Your website in," }],
  [{ t: "a month of marketing", accent: true }, { t: " out." }],
];

export const TitleCard: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fromMs, toMs, assets, data }) => {
  const lines: Seg[][] = data?.lines ?? LINES;
  const size: number = data?.fontSize ?? 76;
  const push = 1 + 0.03 * clamp((tMs - fromMs) / (toMs - fromMs));
  const e = clamp((tMs - (toMs - 120)) / 120);
  const W = 980;
  return (
    <div style={{ position: "absolute", left: (w - W) / 2, top: 0, width: W, height: h, background: "#fff",
      borderRadius: 0, boxShadow: "0 26px 64px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)",
      transform: `scale(${push * (1 - 0.04 * e)})`, opacity: 1 - e, fontFamily: JAKARTA,
      display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 56, boxSizing: "border-box" }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ fontSize: size, fontWeight: 800, lineHeight: 1.06, letterSpacing: -0.035 * size,
          color: "#111", whiteSpace: "nowrap" }}>
          {ln.map((s, k) => <span key={k} style={{ color: s.accent ? "#E07850" : "#111" }}>{s.t}</span>)}
        </div>
      ))}
      <Img src={staticFile(pick(assets, "holo-mark-black.png"))}
        style={{ position: "absolute", right: 40, top: 36, width: 70, height: 70 * 221 / 286 }} />
    </div>
  );
};
