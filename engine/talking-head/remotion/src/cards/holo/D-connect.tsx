import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { GREEN, HFONT, INK, UI_SHADOW, calm, clamp, easeIn, lerp, win } from "./D-kit";
// B15 "And if you connect your social media": a Holo-styled Channels card with three plug slots.
// The real Meta, TikTok and LinkedIn marks drop into their slots; the toggles flip green in a
// stagger from CONNECT, all done ~0.7 s before the hand-over (law 1), then held with a slow push.

type Data = { names: string[]; drops: number[]; ons: number[]; marks: number[] };

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <div style={{ position: "relative", width: 132, height: 76, borderRadius: 38, background: on > 0.5 ? GREEN : "#E3E3E8",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)" }}>
    <div style={{ position: "absolute", top: 6, left: lerp(6, 62, on), width: 64, height: 64, borderRadius: 32,
      background: "#fff", boxShadow: "0 3px 8px rgba(0,0,0,0.25)" }} />
  </div>
);

const Row: React.FC<{ t: number; fps: number; i: number; name: string; mark: string; drop: number; onAt: number; markH: number }> = ({
  t, fps, i, name, mark, drop, onAt, markH,
}) => {
  const d = calm(t, drop, 340);
  const on = calm(t, onAt, 160);
  const landed = clamp((t - drop) / 160);
  const pulse = 0;
  return (
    <div style={{ position: "relative", height: 146, borderRadius: 0, marginBottom: i < 2 ? 12 : 0,
      background: on > 0.02 ? `rgba(52,199,89,${0.08 + 0.1 * clamp(on)})` : "#F5F5F7",
      boxShadow: pulse > 0.01 ? `0 0 0 ${6 * pulse}px rgba(52,199,89,${0.35 * pulse})` : "none",
      display: "flex", alignItems: "center", padding: "0 28px" }}>
      <div style={{ position: "relative", width: 112, height: 112, borderRadius: 0,
        border: landed > 0.5 ? "3px solid #E6E6EA" : "3px dashed #C9C9D0", background: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          transform: `translateY(${(1 - d) * -120}px) scale(${lerp(1.12, 1, d)})`,
          opacity: clamp(d * 2) }}>
          <Img src={staticFile(mark)} style={{ height: markH, width: "auto" }} />
        </div>
      </div>
      <div style={{ marginLeft: 30, flex: 1, fontFamily: HFONT, fontWeight: 700, fontSize: 46, color: INK }}>{name}</div>
      <div style={{ fontFamily: HFONT, fontWeight: 600, fontSize: 32, marginRight: 24,
        color: on > 0.5 ? "#1E9E45" : "#8E8E93" }}>{on > 0.5 ? "Connected" : "Connect"}</div>
      <Toggle on={clamp(on, 0, 1.08)} />
    </div>
  );
};

export const HoloConnect: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fps, fromMs, toMs, assets, data }) => {
  // v2: 960 wide, centred in its box; all three toggles are green ~0.7 s before the hand-over
  const cw = 960, ch = 620;
  const e = calm(tMs, fromMs, 300);
  const x = easeIn(win(tMs, toMs - 120, toMs));
  const push = 1 + 0.02 * clamp((tMs - fromMs) / Math.max(1, toMs - fromMs));
  const t = `translateY(${(1 - e) * 60 - x * 40}px) scale(${push * (1 - 0.03 * x)})`;
  const markHs = [64, 80, 86];
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1700 }}>
      <div style={{ position: "absolute", left: (w - cw) / 2, top: (h - ch) / 2, width: cw, height: ch, borderRadius: 0, opacity: Math.min(1, e * 1.4) * (1 - x),
        background: "#fff", boxShadow: UI_SHADOW, transform: t, transformOrigin: "50% 50%", padding: "26px 34px",
        boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", height: 84, marginBottom: 18 }}>
          <Img src={staticFile(assets[0])} style={{ height: 46, width: "auto" }} />
          <div style={{ marginLeft: 18, fontFamily: HFONT, fontWeight: 800, fontSize: 44, color: INK }}>Channels</div>
        </div>
        {data.names.map((n, i) => (
          <Row key={n} t={tMs} fps={fps} i={i} name={n} mark={assets[data.marks[i]]} drop={data.drops[i]} onAt={data.ons[i]}
            markH={markHs[i]} />
        ))}
      </div>
    </div>
  );
};
