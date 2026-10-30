import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// The sequence's track stack. The first lanes are what a simple edit is (a cut,
// the voice, captions); the rest land on the second beat and are the layers this
// video actually carries, each with its real count. Same editor, same project,
// more work in it: the picture of "capable of way more".
export type Lane = { code: string; name: string; count: string; blocks: number[][] };

export const Tracks: React.FC<{
  tMs: number; w: number; h: number;
  lanes: Lane[]; simple: number;
  beats: { simple: number; more: number; per?: number };
  title: string; titleMore: string;
}> = ({ tMs, w, h, lanes, simple, beats, title, titleMore }) => {
  const P = Math.round(w * 0.030);
  const gut = Math.round(w * 0.075);
  const nameW = Math.round(w * 0.185);
  const cntW = Math.round(w * 0.135);
  const headH = Math.round(w * 0.034);
  const per = beats.per ?? 120;

  const rows = lanes.length;
  const gap = Math.round(h * 0.022);
  const laneH = (h - 2 * P - headH - Math.round(w * 0.022) - gap * (rows - 1)) / rows;
  const trackW = w - 2 * P - gut - nameW - cntW;

  const on = (i: number) => (i < simple ? beats.simple : beats.more + (i - simple) * per);
  const isMore = tMs >= beats.more;

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
      <div style={{ height: headH, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...label(headH * 0.60, isMore ? ACCENT : MUTED) }}>{isMore ? titleMore : title}</span>
        <span style={{ fontFamily: MONO_FONT, fontSize: headH * 0.58, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
          {`${Math.min(rows, lanes.filter((_, i) => tMs >= on(i)).length)} tracks`}
        </span>
      </div>

      <div style={{ marginTop: Math.round(w * 0.022) }}>
        {lanes.map((ln, i) => {
          const t0 = on(i);
          const a = interpolate(tMs, [t0, t0 + 200], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (a <= 0.01) return <div key={ln.code} style={{ height: laneH, marginBottom: i === rows - 1 ? 0 : gap }} />;
          const accent = i >= simple;
          return (
            <div key={ln.code} style={{ height: laneH, marginBottom: i === rows - 1 ? 0 : gap, display: "flex", alignItems: "center", opacity: a, transform: `translateX(${(1 - a) * 18}px)` }}>
              <span style={{ width: gut, fontFamily: MONO_FONT, fontSize: laneH * 0.42, color: accent ? ACCENT : MUTED }}>{ln.code}</span>
              <span style={{ width: nameW, ...label(laneH * 0.36, INK) }}>{ln.name}</span>
              <div style={{ width: trackW, height: laneH, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                {ln.blocks.map(([s, e], j) => (
                  <div key={j} style={{ position: "absolute", left: s * trackW, top: laneH * 0.16, width: Math.max(1.2, ((e - s) * trackW - 2) * a), height: laneH * 0.68, background: accent ? ACCENT : "rgba(255,255,255,0.55)" }} />
                ))}
              </div>
              <span style={{ width: cntW, textAlign: "right", fontFamily: MONO_FONT, fontSize: laneH * 0.38, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{ln.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
