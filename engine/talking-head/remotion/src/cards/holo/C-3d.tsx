import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Clip, SHADOW, asset, clamp, exitK, lerp, ramp, wave } from "./C-kit";
// reference edit K B14 (28204 → out) "or ask for a different direction": Holo's own exploded 3D ad (url-drop 26-31 s).
// The layers orbit apart, and the source's orange → green swap (2.0 s into url-3d.mp4) is placed on DIFFERENT
// (28924), so the whole design turns green as the creator says "different direction". A glow under the card turns with it.

// v5 (law 1): the clip plays at 1.4x with its swap (source 2.000 s) placed 60 ms before DIFFERENT, and freezes on
// source 2.42 s (famC-3d-green.png: green panels, green-lid jar, all layers still apart) at ~29160, so the
// finished green ad is held ~700 ms (the source goes on to strip the products, which read as unfinished).
const RATE = 1.4, SWAP = 2.0, HOLD = 2.42;
export const Exploded: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const tDiff = (beats.different ?? 28924) - 60;
  const from = Math.max(0, SWAP - (RATE * (tDiff - fromMs)) / 1000);
  const tHold = fromMs + ((HOLD - from) / RATE) * 1000;
  const CW = 1000, CH = Math.round(CW * (826 / 1500));
  const enter = ramp(tMs, fromMs, fromMs + 360);
  const out = exitK(tMs, toMs, 150);
  const green = ramp(tMs, tDiff - 40, tDiff + 220);
  const pulse = 0.012 * Math.sin(Math.PI * ramp(tMs, tDiff, tDiff + 420));
  const inner = 1 + 0.035 * clamp((tMs - fromMs) / (toMs - fromMs)); // the camera keeps pushing into the scene
  const glow = `0 0 40px 4px rgba(${Math.round(lerp(236, 52, green))},${Math.round(lerp(120, 199, green))},${Math.round(lerp(60, 89, green))},0.55)`;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
      <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH, overflow: "hidden",
        background: "#eef3f4", boxShadow: `${SHADOW}, ${glow}`, opacity: enter * (1 - out),
        transform: `rotateY(${1.2 * wave(tMs, 4200, 0.6)}deg) scale(${lerp(0.96, 1, enter) * (1 + pulse) * (1 - 0.04 * out)})` }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${inner})` }}>
          {tMs < tHold ? (
            <Clip src={asset(assets, "url-3d.mp4")} startMs={fromMs} fromSec={from} fps={fps} rate={RATE}
              style={{ left: 0, top: 0, width: CW, height: CH, objectFit: "cover" }} />
          ) : (
            <Img src={staticFile(asset(assets, "famC-3d-green.png"))} style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, objectFit: "cover" }} />
          )}
        </div>
      </div>
    </div>
  );
};
