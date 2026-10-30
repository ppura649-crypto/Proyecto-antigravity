import React from "react";
import type { CardProps } from "../props";
import { ClipAt, UI_SHADOW, calm, clamp, easeIn, mono, win } from "./D-kit";
// reference edit K family D: one of Holo's own clips, retimed onto their words (a smooth monotone map of
// spine ms -> source seconds), cropped to its active area. v2: one fixed framing (no camera pans),
// as big as the band allows, centred in the card box. `windows` are source-px crops stacked
// vertically (analytics shows its two tiles, calendar and runs one window each). A slow push on
// the whole surface keeps the hold alive; the finished state is reached early by the map.
// Used by B16 calendar, B19 analytics, B21 runs.

type Data = {
  srcW: number; srcH: number;
  map: [number, number][];                // [spine ms, source s]
  windows: [number, number, number, number][]; // [x, y, w, h] in source px
  s: number;                              // display px per source px
  gap?: number;                           // display px between windows
  ground?: string;
  push?: number;                          // total slow scale-up over the event (e.g. 0.02)
};

export const RetimedClip: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fps, fromMs, toMs, assets, data }) => {
  const sec = mono(data.map)(tMs);
  const s = data.s, gap = data.gap ?? 14;
  const cw = Math.max(...data.windows.map((r) => r[2])) * s;
  const ch = data.windows.reduce((a, r) => a + r[3] * s, 0) + gap * (data.windows.length - 1);
  // entrance ~300 ms rise, no overshoot; exit: the last 120 ms, a small lift and fade
  const e = calm(tMs, fromMs, 300);
  const x = easeIn(win(tMs, toMs - 120, toMs));
  const push = 1 + (data.push ?? 0.02) * clamp((tMs - fromMs) / Math.max(1, toMs - fromMs));
  let top = 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", left: (w - cw) / 2, top: (h - ch) / 2, width: cw, height: ch,
        transform: `translateY(${(1 - e) * 60 - x * 40}px) scale(${push * (1 - 0.03 * x)})`,
        opacity: Math.min(e * 1.4, 1) * (1 - x),
      }}>
        {data.windows.map((r, i) => {
          const [sx, sy, sw, sh] = r;
          const el = (
            <div key={i} style={{
              position: "absolute", left: (cw - sw * s) / 2, top, width: sw * s, height: sh * s,
              overflow: "hidden", borderRadius: 0, background: data.ground ?? "#fff", boxShadow: UI_SHADOW,
            }}>
              <ClipAt src={assets[0]} sec={sec} fps={fps}
                style={{ position: "absolute", width: data.srcW * s, height: data.srcH * s, left: -sx * s, top: -sy * s }} />
            </div>
          );
          top += sh * s + gap;
          return el;
        })}
      </div>
    </div>
  );
};
