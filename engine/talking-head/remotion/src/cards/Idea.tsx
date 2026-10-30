import React from "react";
import { OffthreadVideo, Sequence, interpolate, staticFile, Easing } from "remotion";
import { ACCENT, MONO_FONT, MUTED, label } from "./theme";

// An idea, and the thing it turned into. The note is written in plain english,
// then the line travels and the phone comes on playing the finished reel: the
// concrete example of "bring their video ideas to life", not a chain of chips.
export const Idea: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  note: string; head: string; clip: string; time: string;
  beats: { note: number; type: number; typeMs?: number; live: number; tick: number };
}> = ({ tMs, w, h, fps, note, head, clip, time, beats }) => {
  const P = Math.round(w * 0.030);
  const timeRow = Math.round(h * 0.095);
  const ph = h - 2 * P - timeRow;
  const pw = Math.round(ph * 9 / 16);
  const gap = Math.round(w * 0.045);
  const nw = w - 2 * P - pw - gap;
  const bez = Math.round(pw * 0.030);

  const np = interpolate(tMs, [beats.note, beats.note + 240], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const typed = Math.floor(interpolate(tMs, [beats.type, beats.type + (beats.typeMs ?? 620)], [0, note.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const caretOn = Math.floor((tMs - beats.type) / 400) % 2 === 0 && typed < note.length;
  const wire = interpolate(tMs, [beats.live - 180, beats.live + 120], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const on = interpolate(tMs, [beats.live, beats.live + 260], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const run = interpolate(tMs, [beats.live + 120, beats.tick + 1100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = interpolate(tMs, [beats.tick, beats.tick + 220], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const liveFrame = Math.round((beats.live / 1000) * fps);

  const bodyFs = Math.round(h * 0.092);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the idea, written down */}
      <div style={{
        position: "absolute", left: P, top: P, width: nw, height: ph,
        background: "#FBFAF5", borderRadius: 4, boxSizing: "border-box",
        padding: Math.round(h * 0.052), opacity: np, transform: `translateY(${(1 - np) * 10}px)`,
        boxShadow: "0 16px 26px rgba(0,0,0,0.45)", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ ...label(Math.round(h * 0.042), "#8b8577") }}>{head}</div>
        <div style={{ height: 1, background: "#e2ded2", margin: `${Math.round(h * 0.030)}px 0 0` }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{
            fontFamily: "-apple-system, Helvetica Neue, Arial, sans-serif",
            fontSize: bodyFs, lineHeight: 1.26, color: "#1c1b18", letterSpacing: "-0.01em",
          }}>
            {note.slice(0, typed)}
            <span style={{ opacity: caretOn ? 1 : 0, color: ACCENT }}>{"|"}</span>
          </div>
        </div>
      </div>

      {/* the line that carries it across */}
      <div style={{
        position: "absolute", left: P + nw, top: P + ph / 2 - 1,
        width: gap * wire, height: 2, background: ACCENT,
      }} />

      {/* the phone, playing what came out */}
      <div style={{
        position: "absolute", left: P + nw + gap, top: P, width: pw, height: ph,
        background: "#141416", borderRadius: Math.round(pw * 0.11), padding: bez, boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 18px 30px rgba(0,0,0,0.55)",
        opacity: np,
      }}>
        <div style={{
          position: "relative", width: "100%", height: "100%", overflow: "hidden",
          borderRadius: Math.round(pw * 0.085), background: "#000",
        }}>
          {tMs >= beats.live && (
            <Sequence from={liveFrame} layout="none">
              <OffthreadVideo src={staticFile(clip)} muted
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: on }} />
            </Sequence>
          )}
          {/* notch */}
          <div style={{
            position: "absolute", left: "50%", top: Math.round(pw * 0.028), transform: "translateX(-50%)",
            width: Math.round(pw * 0.34), height: Math.round(pw * 0.075), borderRadius: 99, background: "#000",
          }} />
          {/* it is running */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: Math.round(ph * 0.012), background: "rgba(255,255,255,0.18)" }}>
            <div style={{ width: `${run * 100}%`, height: "100%", background: ACCENT }} />
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", left: P + nw + gap, top: P + ph + Math.round(h * 0.022), width: pw,
        textAlign: "center", fontFamily: MONO_FONT, fontSize: Math.round(h * 0.060), color: MUTED,
        opacity: tick,
      }}>{time}</div>
    </div>
  );
};
