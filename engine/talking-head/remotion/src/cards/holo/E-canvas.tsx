import React from "react";
import { Easing } from "remotion";
import { SANS, SERIF, SHADOW, clamp, mix, ramp, type BeatsE } from "./E-util";
// reference edit K family E, H4.2-H4.3: "doing every ad yourself". A dark design editor (layers panel, one 4:5
// artboard) where a cursor drags a photo, a headline, a button into place, one per EVERY / AD / YOURSELF,
// while the counter reads `ad 1 of 10`. On WATCH the counter ticks to 2 and the artboard is blank again.
export const ED = { w: 520, h: 600, bar: 64, panel: 150 };
const AB = { w: 300, h: 375 };
const abX = ED.panel + (ED.w - ED.panel - AB.w) / 2, abY = ED.bar + (ED.h - ED.bar - AB.h) / 2;
// the three pieces, in artboard coords
const PIECES = [
  { name: "Photo", x: 20, y: 20, w: 260, h: 210 },
  { name: "Headline", x: 20, y: 246, w: 260, h: 44 },
  { name: "Button", x: 65, y: 306, w: 170, h: 52 },
];
const SRC = { x: 75, y: 470 }; // they come off the left panel (centre point, small), in editor coords

const Piece: React.FC<{ i: number }> = ({ i }) =>
  i === 0 ? (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#efe4d4,#d9c3a7)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 100, top: 52, width: 60, height: 22, background: "#3a302a", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 88, top: 72, width: 84, height: 116, background: "linear-gradient(90deg,#f4efe8,#fff 40%,#e3dbd0)", borderRadius: 14 }} />
      <div style={{ position: "absolute", left: 104, top: 112, width: 52, height: 30, background: "#d8cbb8" }} />
    </div>
  ) : i === 1 ? (
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: "#2b2420", textAlign: "center", lineHeight: "44px", whiteSpace: "nowrap" }}>Glow that lasts.</div>
  ) : (
    <div style={{ width: "100%", height: "100%", borderRadius: 26, background: "#111", color: "#fff", fontFamily: SANS, fontWeight: 600,
      fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>Shop now</div>
  );

const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width="34" height="40" viewBox="0 0 17 20" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))" }}>
    <path d="M1 1 L1 16 L5 12.5 L8 19 L10.5 18 L7.6 11.6 L13 11.6 Z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const Editor: React.FC<{ t: number; b: BeatsE }> = ({ t, b }) => {
  const drops = [b.every!, b.ad!, b.yourself!];
  const ends = [b.ad!, b.yourself!, b.yourself! + 380];
  const tick = ramp(t, b.watch!, b.watch! + 320);     // counter 1 -> 2
  const clear = ramp(t, b.watch!, b.watch! + 300);    // the artboard empties: start over
  // the cursor: follows the piece being dragged, then idles; after WATCH it sinks and stops
  let cx = SRC.x + 20, cy = SRC.y + 20;
  const pos = PIECES.map((p, i) => {
    const f = ramp(t, drops[i]!, ends[i]!, Easing.inOut(Easing.quad));
    // the piece's centre travels from the panel to its slot while it grows from 30% to full size
    const k = mix(0.3, 1, f);
    const mx = mix(SRC.x, abX + p.x + p.w / 2, f), my = mix(SRC.y, abY + p.y + p.h / 2, f);
    if (t >= drops[i]!) { cx = mx - 4; cy = my - 2; }
    return { x: mx - p.w / 2, y: my - p.h / 2, k, on: t >= drops[i]!, f };
  });
  // after the button lands the cursor keeps fiddling (small nudges) until WATCH, then it stops and sinks
  const fid = ramp(t, ends[2]!, ends[2]! + 200) * (1 - ramp(t, b.watch!, b.watch! + 200));
  cx += 6 * fid * Math.sin((t - ends[2]!) / 170); cy += 4 * fid * Math.sin((t - ends[2]!) / 230);
  cy += 14 * ramp(t, b.this!, b.this! + 700, Easing.out(Easing.quad));
  const last = pos.reduce((a, p, i) => (p.on ? i : a), -1);
  const shown = PIECES.filter((_, i) => pos[i]!.on).length;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: ED.w, height: ED.h, background: "#1E1E1E", boxShadow: SHADOW, overflow: "hidden", fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: ED.bar, background: "#2C2C2C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ height: 40, lineHeight: "40px", overflow: "hidden", fontSize: 30, fontWeight: 600, color: "#fff", display: "flex" }}>
          <span>ad&nbsp;</span>
          <span style={{ position: "relative", width: 19, height: 40, lineHeight: "40px" }}>
            <span style={{ position: "absolute", left: 0, top: -40 * tick, opacity: 1 - tick }}>1</span>
            <span style={{ position: "absolute", left: 0, top: 40 - 40 * tick, opacity: tick }}>2</span>
          </span>
          <span>&nbsp;of 10</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: ED.bar, width: ED.panel, bottom: 0, background: "#252525", borderRight: "1px solid #333" }}>
        <div style={{ margin: "16px 16px 10px", fontSize: 26, fontWeight: 600, color: "#9a9a9a" }}>Layers</div>
        {PIECES.map((p, i) => (pos[i]!.on ? (
          <div key={i} style={{ margin: "0 10px", padding: "6px 8px", fontSize: 26, color: "#e8e8e8", opacity: clamp(pos[i]!.f * 2) * (1 - clear),
            background: i === last && clear === 0 ? "rgba(13,153,255,0.25)" : "transparent" }}>{p.name}</div>
        ) : null)).reverse()}
      </div>
      <div style={{ position: "absolute", left: abX, top: abY, width: AB.w, height: AB.h, background: "#fff" }} />
      {PIECES.map((p, i) => (pos[i]!.on ? (
        <div key={i} style={{ position: "absolute", left: pos[i]!.x, top: pos[i]!.y + 40 * clear, width: p.w, height: p.h,
          opacity: (0.75 + 0.25 * pos[i]!.f) * (1 - clear), transform: `scale(${pos[i]!.k})`,
          outline: i === last && pos[i]!.f >= 1 && clear === 0 ? "2px solid #0D99FF" : "none" }}>
          <Piece i={i} />
        </div>
      ) : null))}
      {(shown === 0 || clear > 0) && <div style={{ position: "absolute", left: abX, top: abY + AB.h / 2 - 16, width: AB.w, textAlign: "center",
        fontSize: 26, color: "#b5b5b5", opacity: shown === 0 ? 1 : ramp(t, b.watch! + 260, b.watch! + 520) }}>Empty artboard</div>}
      <Cursor x={cx} y={cy} />
    </div>
  );
};
