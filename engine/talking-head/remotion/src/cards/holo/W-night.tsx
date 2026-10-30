import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { CardProps } from "../props";
import { JAKARTA, WB, type WBeats, clamp, easeInOut, pick, sp, wrapStyle } from "./W-util";
// edit-k-h1v08 (2026-09-24), builder W: "Night shift". Holo's own mascot at its desk: the room is lit on YOU,
// the lights go out by THIS (W-night.mp4 = url-night.mp4 frames 6-31, cropped above the live comments, graded),
// then the dark room holds under a slow push toward the glowing monitor. Holo notifications (real iOS shape)
// arrive on WATCH, THE, IS, newest on top, each carrying a finished creative; all settled by ~3530, held.

// the clip's right-edge colour per frame (sampled with numpy), so the ground past the clip follows the lights
const EDGE = ["#f3f3f0", "#f2f3f0", "#f2f2ee", "#f0f0ed", "#eeeeeb", "#ebece8", "#e8e9e4", "#e4e4df", "#ddded9",
  "#d4d6d1", "#c7c9c5", "#b4b6b3", "#979b99", "#757877", "#535555", "#373838", "#282829"];
const VW = 757, VX = -90, NX = 498, NW = 562, NH = 142, GAP = 14;

type Note = { at: keyof WBeats; time: string; title: string; body: string; thumb: string };
const NOTES: Note[] = [
  { at: "watch", time: "1:12 AM", title: "New ad ready", body: "SKIMS · ready to review", thumb: "skims-3754964.jpg" },
  { at: "the", time: "2:47 AM", title: "Email drafted", body: "Crocs · Come As You Are", thumb: "crocs-5139281.jpg" },
  { at: "is", time: "4:05 AM", title: "Post scheduled", body: "SKIMS · live at 9:00 AM", thumb: "skims-3755019.jpg" },
];
const SPR = [22, 180] as const; // near-critical: lands without a wobble

const Banner: React.FC<{ n: Note; assets: string[] }> = ({ n, assets }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden",
    background: "rgba(246,246,248,0.9)", backdropFilter: "blur(24px) saturate(1.6)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.35) inset",
    display: "flex", alignItems: "center", padding: "0 18px", gap: 16, fontFamily: JAKARTA }}>
    <div style={{ width: 62, height: 62, borderRadius: 15, background: "#111", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile(pick(assets, "holo-mark-white.png"))} style={{ width: 40 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0, color: "#111" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 600, color: "#6e6e73",
        letterSpacing: 0.4, lineHeight: "30px" }}>
        <span>HOLO</span><span style={{ letterSpacing: 0 }}>{n.time}</span>
      </div>
      <div style={{ fontSize: 31, fontWeight: 800, letterSpacing: -0.5, lineHeight: "38px" }}>{n.title}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#3a3a3c", lineHeight: "33px", whiteSpace: "nowrap" }}>{n.body}</div>
    </div>
    <Img src={staticFile(pick(assets, n.thumb))} style={{ width: 88, height: 110, objectFit: "cover", objectPosition: "50% 30%",
      borderRadius: 10, flexShrink: 0 }} />
  </div>
);

const Stack: React.FC<{ t: number; fps: number; b: WBeats; assets: string[] }> = ({ t, fps, b, assets }) => {
  // the older banners make room fast; the newcomer then drops into the freed slot, so no two ever cross
  const en = NOTES.map((n) => sp(t, b[n.at], fps, SPR[0], SPR[1]));
  const room = NOTES.map((n) => sp(t, b[n.at], fps, 26, 320));
  const count = room.reduce((a, e) => a + e, 0);
  const top = (634 - (count * (NH + GAP) - GAP * Math.min(1, count))) / 2;
  return (
    <>
      {NOTES.map((n, k) => {
        if (t < b[n.at]) return null;
        const e = en[k], newer = room.slice(k + 1).reduce((a, x) => a + x, 0);
        const y = top + newer * (NH + GAP) - 60 * (1 - e);
        const op = k === 0 ? clamp(e * 2.2) : clamp((room[k] - 0.65) / 0.3);
        return (
          <div key={n.title} style={{ position: "absolute", left: NX, top: y, width: NW, height: NH,
            opacity: op, transform: `scale(${0.92 + 0.08 * e})`, transformOrigin: "50% 0%" }}>
            <Banner n={n} assets={assets} />
          </div>
        );
      })}
    </>
  );
};

export const NightShift: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, beats, assets }) => {
  const b: WBeats = { ...WB, ...(beats as Partial<WBeats>) };
  const f0 = Math.ceil((b.you / 1000) * fps);
  const vf = clamp(Math.floor((tMs / 1000) * fps) - f0, 0, EDGE.length - 1);
  const push = 1 + 0.07 * easeInOut((tMs - b.you) / (b.own - b.you));
  const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <div style={{ position: "absolute", left: (w - 1080) / 2, top: (h - 634) / 2, width: 1080, height: 634, overflow: "hidden" }}>
      <div style={{ ...wrapStyle(tMs, b, 0), background: EDGE[vf] }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "36% 42%" }}>
          <div style={{ position: "absolute", left: VX, top: 0, width: VW, height: 634,
            WebkitMaskImage: "linear-gradient(90deg, #000 78%, transparent 100%)",
            maskImage: "linear-gradient(90deg, #000 78%, transparent 100%)" }}>
            <Img src={staticFile(pick(assets, "W-night-dark.jpg"))} style={fill} />
            <Sequence from={f0} durationInFrames={26} layout="none">
              <OffthreadVideo src={staticFile(pick(assets, "W-night.mp4"))} muted style={fill} />
            </Sequence>
          </div>
        </div>
        {/* night falls: a cool deepening that follows the lights out */}
        <div style={{ position: "absolute", inset: 0, background: "#070b16", opacity: 0.25 * (vf / (EDGE.length - 1)) }} />
        <Stack t={tMs} fps={fps} b={b} assets={assets} />
      </div>
    </div>
  );
};
