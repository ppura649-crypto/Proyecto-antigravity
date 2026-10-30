import React from "react";
import { Easing, Img, staticFile } from "remotion";
import { FIELD, HOLO, SHADOW, calm, clamp, mix, pick, ramp, type BeatsE } from "./E-util";
// reference edit K family E: the hand-over shared by hooks 4 and 5. On WHOLE the work (chat + canvas, or the to-do
// list) flies into Holo's real mark on a white square; on TOOL the name lands under it; on STARTING the square
// opens into Holo's real URL field (url-pill.mp4 at 0.6 s, its empty yourdomain.com state, cropped exactly like B1) at the pixel B1's pill lands
// on, so the body's pill reads as the same field starting to type. Calm: one move at a time, no overshoot.

export const MARK = { cx: 540, cy: 250, s: 300 };

// the bundle's fly into the mark: returns the style for a wrapper whose visual centre is (cx, cy)
export const flyInto = (t: number, b: BeatsE, cx: number, cy: number): React.CSSProperties => {
  const f = ramp(t, b.whole!, b.whole! + 460, Easing.inOut(Easing.quad));
  return {
    transformOrigin: `${cx}px ${cy}px`,
    transform: `translate(${(MARK.cx - cx) * f}px, ${(MARK.cy - cy) * f}px) scale(${mix(1, 0.1, f)})`,
    opacity: 1 - ramp(t, b.whole! + 260, b.whole! + 460),
  };
};

// solo (round-2 hooks, 2026-09-24): no bundle flies in; the square arrives on its own on WHOLE (a calm rise, the mark
// settling a beat after it), then the name on TOOL and the field on STARTING exactly as the hand-over does.
export const HoloHandover: React.FC<{ t: number; fps: number; b: BeatsE; assets: string[]; solo?: boolean }> = ({ t, fps, b, assets, solo }) => {
  const t0 = solo ? b.whole! : b.whole! + 200;
  if (t < t0) return null;
  const inn = calm(t, t0, fps);                         // the white square grows under the incoming bundle (solo: rises in)
  const rise = solo ? 46 * (1 - inn) : 0;
  const markIn = solo ? calm(t, b.whole! + 110, fps) : 1;
  const name = calm(t, b.tool!, fps);                   // "Holo" lands on TOOL
  const dt = (t - b.tool!) / 420;
  const pulse = dt > 0 && dt < 1 ? 0.035 * Math.sin(Math.PI * dt) : 0;
  const open = ramp(t, b.starting!, b.starting! + 520, Easing.inOut(Easing.cubic)); // square -> field
  const markOut = ramp(t, b.starting!, b.starting! + 200);
  const fieldIn = ramp(t, b.starting! + 140, b.starting! + 460);
  const ex = ramp(t, b.out! - 150, b.out!, Easing.in(Easing.cubic)); // calm exit into B1
  const push = 1 + 0.03 * ramp(t, b.whole!, b.starting!, Easing.linear);

  const sq = { x: MARK.cx - MARK.s / 2, y: MARK.cy - MARK.s / 2, w: MARK.s, h: MARK.s };
  const x = mix(sq.x, FIELD.x, open), y = mix(sq.y, FIELD.y, open);
  const w = mix(sq.w, FIELD.w, open), h = mix(sq.h, FIELD.h, open);
  const sc = mix(0.86 + 0.14 * inn, 1, open) * mix(push, 1, open) * (1 + pulse);
  const blink = t > b.website! && Math.floor((t - b.website!) / 420) % 2 === 0;
  const k = FIELD.w / 976;

  return (
    <div style={{ position: "absolute", left: x, top: y + 24 * ex + rise, width: w, height: h, background: "#fff", overflow: "hidden",
      boxShadow: SHADOW, opacity: clamp(inn * 1.6) * (1 - ex), transform: `scale(${sc})` }}>
      {/* the mark and the name */}
      <div style={{ position: "absolute", left: w / 2 - 150, top: h / 2 - 150, width: 300, height: 300, opacity: (1 - markOut) * markIn,
        transform: solo ? `translateY(${22 * (1 - markIn)}px) scale(${0.9 + 0.1 * markIn})` : undefined }}>
        <Img src={staticFile(pick(assets, "holo-mark-black.png"))} style={{ position: "absolute", width: 190, height: 147,
          left: 55, top: 150 - 73 - 34 * name }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 196 + 16 * (1 - name), textAlign: "center",
          fontFamily: HOLO, fontWeight: 700, fontSize: 54, color: "#111", letterSpacing: -1, opacity: name }}>Holo</div>
      </div>
      {/* Holo's URL field, its empty yourdomain.com state */}
      <Img src={staticFile(pick(assets, "famE-urlfield.png"))} style={{ position: "absolute", left: w / 2 - FIELD.w / 2,
        top: h / 2 - FIELD.h / 2, width: FIELD.w, height: FIELD.h, opacity: fieldIn }} />
      {blink && <div style={{ position: "absolute", left: w / 2 - FIELD.w / 2 + 82 * k, top: h / 2 - FIELD.h / 2 + 96 * k,
        width: 3, height: 50 * k, background: "#1a73e8" }} />}
    </div>
  );
};
