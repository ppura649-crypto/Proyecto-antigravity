import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { GREEN, HFONT, INK, UI_SHADOW, calm, clamp, easeIn, lerp, win } from "./D-kit";
// B18 "or turn on AUTOPILOT": Holo's autopilot setting, big and centred. One 960 px row on a white
// square ground: Holo's mark, "Autopilot", its status, and the switch. The switch flips on on ON so
// the on-state is complete as AUTOPILOT is said and holds ~0.7 s (law 1). The night mascot clip was
// dropped: next to a 960 px row it would be too small to read.

type Data = { on: number };

const mix = (a: number[], b: number[], p: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(",")})`;

const Switch: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "relative", width: 236, height: 136, borderRadius: 68, background: mix([226, 226, 231], [52, 199, 89], p),
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.12)" }}>
    <div style={{ position: "absolute", top: 10, left: lerp(10, 110, p), width: 116, height: 116, borderRadius: 58,
      background: "#fff", boxShadow: "0 5px 14px rgba(0,0,0,0.25)" }} />
  </div>
);

export const HoloAutopilot: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fromMs, toMs, assets, data }) => {
  const rw = 960, rh = 200;
  const e = calm(tMs, fromMs, 240);
  const p = calm(tMs, data.on, 150);
  const x = easeIn(win(tMs, toMs - 70, toMs));
  const push = 1 + 0.025 * clamp((tMs - fromMs) / Math.max(1, toMs - fromMs));
  const onTxt = p > 0.5;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: (w - rw) / 2, top: (h - rh) / 2, width: rw, height: rh, borderRadius: 0,
        background: "#fff", boxShadow: `${UI_SHADOW}, 0 0 ${80 * p}px rgba(52,199,89,${0.35 * p})`, boxSizing: "border-box",
        display: "flex", alignItems: "center", padding: "0 40px 0 48px",
        transform: `translateY(${(1 - e) * 60 - x * 30}px) scale(${push})`, opacity: clamp(e * 1.4) * (1 - x) }}>
        <Img src={staticFile(assets[0])} style={{ height: 76, width: "auto" }} />
        <div style={{ marginLeft: 34, flex: 1 }}>
          <div style={{ fontFamily: HFONT, fontWeight: 800, fontSize: 76, letterSpacing: -1, color: INK, lineHeight: 1 }}>Autopilot</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: onTxt ? GREEN : "#C7C7CC" }} />
            <div style={{ marginLeft: 12, fontFamily: HFONT, fontWeight: 700, fontSize: 36, color: onTxt ? "#1E9E45" : "#8E8E93" }}>
              {onTxt ? "On" : "Off"}
            </div>
          </div>
        </div>
        <Switch p={p} />
      </div>
    </div>
  );
};
