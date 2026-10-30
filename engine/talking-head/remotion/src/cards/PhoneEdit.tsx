import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";

// V9, "So that AI could completely do the editing. Whether it's the layout, the timing,
// the captions. Or the visuals to support the video." The proof is THIS video: a phone
// playing real frames of this master, the Claude agent standing beside it, and each layer
// the creator names leaving the agent and landing on the phone in that layer's own real look.

export type PhoneEditData = { title: string; captionWord: string; cuts: number };

const HAIR = "#E8E5DD";
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PhoneEdit: React.FC<CardProps & { data: PhoneEditData }> = ({
  tMs, w, h, fps, fromMs, toMs, beats, assets, data,
}) => {
  const B = beats;
  const BX = Math.round(0.045 * w);
  const BY = Math.round(0.028 * h);
  const BH = Math.round(0.811 * h);
  const BEZ = Math.round(0.0174 * h);
  const SH = BH - 2 * BEZ;
  const SW = Math.round((SH * 270) / 480);
  const BW = SW + 2 * BEZ;
  const SX = BX + BEZ;
  const SY = BY + BEZ;
  const sc = SW / 1080; // everything INSIDE the phone is this reel at the phone's scale
  const PROG_Y = BY + BH + Math.round(0.025 * h);
  const PROG_H = Math.max(5, Math.round(0.013 * h));
  const FSY = PROG_Y + PROG_H + Math.round(0.022 * h);
  const FSH = Math.round(0.069 * h);
  // the agent is a small figure standing at the phone's upper right shoulder, not a slab
  const IW = Math.round(0.28 * w);
  const IH = Math.round((IW * 440) / 520);
  const IX = w - BX - IW;
  const IY = BY + Math.round(BH * 0.07);
  const SRCX = IX - Math.round(0.012 * w);
  const SRCY = IY + Math.round(IH * 0.55);

  const sp = (at: number, stiff = 300) =>
    spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 15, stiffness: stiff, mass: 0.7 } });
  const enter = sp(fromMs, 340);

  // the phone plays only while the creator says it plays; the frames advance at 2 fps
  const windows: [number, number][] = [[B.could, B.whether], [B.support, toMs]];
  let played = 0;
  for (const [a, b] of windows) if (tMs > a) played += Math.min(tMs, b) - a;
  const idx = Math.floor(played / 500);
  const cur = idx % 6;
  const prev = (idx + 5) % 6;
  const mixP = idx > 0 ? Math.min(1, (played - idx * 500) / 70) : 1;

  // "AI could completely do the editing": the edit runs to the end under the phone
  const prog = interpolate(tMs, [B.could, B.editing], [0, 1], clamp);
  const progPop = interpolate(tMs, [B.editing, B.editing + 90, B.editing + 260], [1, 1.9, 1], clamp);

  // the layers, each one leaving the agent and landing in its own slot on the phone
  const fly = (at: number, tx: number, ty: number) => {
    const p = Math.min(1.05, sp(at, 460));
    return { x: lerp(SRCX, tx, p), y: lerp(SRCY, ty, p), k: lerp(0.35, 1, Math.min(1.04, p)), o: Math.min(1, p * 4) };
  };
  const guide = interpolate(tMs, [B.layout, B.layout + 260], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const titleFs = Math.max(8, Math.round(46 * sc));
  // the caption face at true scale is unreadable on a phone-in-a-phone, so this one
  // layer is drawn at twice its scale: it has to be READ, not just recognised
  const capFs = Math.max(14, Math.round(46 * sc * 2));
  const titleY = SY + 0.275 * SH;
  const capY = SY + 0.748 * SH;
  const cardW = Math.round(SW * 0.62);
  const cardH = Math.round(SH * 0.10);
  const cardY = SY + Math.round(SH * 0.128);
  const T = tMs >= B.layout ? fly(B.layout, SX + SW / 2, titleY) : null;
  const C = tMs >= B.captions ? fly(B.captions, SX + SW / 2, capY) : null;
  const V = tMs >= B.visuals ? fly(B.visuals, SX + SW / 2, cardY + cardH / 2) : null;

  // "the timing": the cuts being made, 25 gaps snapping shut under the phone
  const cells = data.cuts + 1;
  const cellW = Math.max(6, Math.round(BW * 0.038));
  const gap0 = Math.max(3, Math.round(BW * 0.017));
  let run = 0;
  const cellX: number[] = [];
  for (let i = 0; i < cells; i++) {
    cellX.push(run);
    run += cellW;
    if (i < cells - 1) run += gap0 * (1 - interpolate(tMs, [B.timing + 200 + i * 13, B.timing + 300 + i * 13], [0, 1], clamp));
  }
  const slide = interpolate(tMs, [B.timing, B.timing + 220], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const headP = tMs >= B.support ? ((tMs - B.support) / 3000) % 1 : -1;

  const nod = tMs >= B.video ? 6 * Math.sin(Math.PI * Math.min(1, (tMs - B.video) / 380)) : 0;

  const glyph = (at: number, pause: boolean) => {
    const d = tMs - at;
    if (d < 0 || d > 620) return null;
    const g = Math.min(1, d / 130);
    const o = interpolate(d, [0, 130, 420, 620], [0, 1, 1, 0], clamp);
    const s = Math.round(SW * 0.17);
    return (
      <div
        style={{
          position: "absolute", left: SX + SW / 2 - s / 2, top: SY + SH / 2 - s / 2, width: s, height: s,
          display: "flex", alignItems: "center", justifyContent: "center", gap: s * 0.14,
          opacity: o, transform: `scale(${lerp(1.5, 1, g)})`, filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.85))",
        }}
      >
        {pause ? (
          [0, 1].map((i) => <div key={i} style={{ width: s * 0.24, height: s * 0.74, backgroundColor: "#FFFFFF" }} />)
        ) : (
          <div style={{ width: 0, height: 0, borderLeft: `${s * 0.62}px solid #FFFFFF`, borderTop: `${s * 0.37}px solid transparent`, borderBottom: `${s * 0.37}px solid transparent`, marginLeft: s * 0.1 }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      {/* the phone: this very reel, playing */}
      <div
        style={{
          position: "absolute", left: BX, top: BY, width: BW, height: BH, backgroundColor: "#171614",
          borderRadius: Math.round(0.055 * BW), boxShadow: "0 16px 34px rgba(31,30,29,0.26)",
          opacity: Math.min(1, enter * 5), transform: `scale(${0.94 + 0.06 * enter})`, transformOrigin: "50% 60%",
        }}
      >
        <div style={{ position: "absolute", left: BEZ, top: BEZ, width: SW, height: SH, overflow: "hidden", backgroundColor: "#000" }}>
          <Img src={staticFile(assets[1 + prev])} style={{ position: "absolute", inset: 0, width: SW, height: SH, display: "block" }} />
          <Img src={staticFile(assets[1 + cur])} style={{ position: "absolute", inset: 0, width: SW, height: SH, display: "block", opacity: mixP }} />

          {/* "the layout": the safe-area guides drawn on the frame */}
          {guide > 0 && (
            <>
              <div
                style={{
                  position: "absolute", left: SW * 0.075, top: SH * 0.105, width: SW * 0.85, height: SH * 0.755,
                  boxSizing: "border-box", border: `2px solid ${ACCENT}`, opacity: guide,
                  transform: `scale(${0.88 + 0.12 * guide})`, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))",
                }}
              />
              <div
                style={{
                  position: "absolute", left: SW * 0.5 - SW * 0.425 * guide, top: SH * 0.748,
                  width: SW * 0.85 * guide, height: 2, backgroundColor: ACCENT, opacity: guide,
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))",
                }}
              />
            </>
          )}
          {glyph(B.whether, true)}
          {glyph(B.support, false)}
        </div>
      </div>

      {/* the title label, the caption word and the visual card: this reel's own layers,
          each flying out of the agent and snapping into its real slot on the phone */}
      {T && (
        <div
          style={{
            position: "absolute", left: T.x, top: T.y, transform: `translate(-50%, -50%) scale(${T.k})`, opacity: T.o,
            backgroundColor: "#FFFFFF", padding: `${0.0085 * 1920 * sc}px ${0.026 * 1080 * sc}px`,
            whiteSpace: "nowrap", zIndex: 3,
          }}
        >
          <span style={{ ...label(titleFs, "#000000"), fontWeight: 700, letterSpacing: 0, lineHeight: 1.12 }}>{data.title}</span>
        </div>
      )}
      {V && (
        <div
          style={{
            position: "absolute", left: V.x - cardW / 2, top: V.y - cardH / 2, width: cardW, height: cardH,
            backgroundColor: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.45)", opacity: V.o,
            transform: `scale(${V.k})`, zIndex: 2, padding: cardH * 0.16, boxSizing: "border-box",
            display: "flex", alignItems: "flex-end", gap: cardH * 0.13,
          }}
        >
          {[0.42, 0.72, 1, 0.58].map((f, i) => (
            <div key={i} style={{ flex: 1, height: `${f * 100}%`, backgroundColor: i === 2 ? ACCENT : "#D5D1C7" }} />
          ))}
        </div>
      )}
      {C && (
        <div
          style={{
            position: "absolute", left: C.x, top: C.y, transform: `translate(-50%, -100%) scale(${C.k})`, opacity: C.o,
            transformOrigin: "50% 100%",
            whiteSpace: "nowrap", zIndex: 3, textShadow: SHADOW,
            ...label(capFs, "#FFFFFF"), fontWeight: 700, letterSpacing: "0.005em",
          }}
        >
          {data.captionWord}
        </div>
      )}

      {/* the edit running to the end, under the phone */}
      <div style={{ position: "absolute", left: BX, top: PROG_Y, width: BW, height: PROG_H, backgroundColor: HAIR, opacity: Math.min(1, enter * 5), transform: `scaleY(${progPop})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: BW * prog, backgroundColor: ACCENT }} />
        {prog > 0 && (
          <div style={{ position: "absolute", left: BW * prog - PROG_H * 0.9, top: -PROG_H * 0.45, width: PROG_H * 1.8, height: PROG_H * 1.9, borderRadius: "50%", backgroundColor: ACCENT }} />
        )}
      </div>

      {/* "the timing": the strip slides in and its 25 gaps snap shut */}
      {tMs >= B.timing && (
        <div style={{ position: "absolute", left: BX, top: FSY + (1 - slide) * FSH * 0.8, width: run, height: FSH, opacity: slide }}>
          {cellX.map((cx, i) => (
            <div key={i} style={{ position: "absolute", left: cx, top: 0, width: cellW, height: FSH, backgroundColor: "#211F1C" }}>
              <div style={{ position: "absolute", left: cellW * 0.16, top: FSH * 0.16, right: cellW * 0.16, bottom: FSH * 0.16, backgroundColor: i % 3 === 0 ? "#8E8C85" : i % 3 === 1 ? "#A9A69E" : "#767470" }} />
            </div>
          ))}
          {headP >= 0 && (
            <div style={{ position: "absolute", left: run * headP, top: -FSH * 0.12, width: 2, height: FSH * 1.24, backgroundColor: ACCENT }} />
          )}
        </div>
      )}

      {/* the one doing it */}
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: IX, top: IY, width: IW, height: IH, imageRendering: "pixelated",
          opacity: Math.min(1, sp(Math.max(fromMs, B.ai), 340) * 1.6),
          transform: `scale(${0.5 + 0.5 * sp(Math.max(fromMs, B.ai), 340)}) rotate(${nod}deg)`,
          transformOrigin: "50% 100%",
        }}
      />
    </div>
  );
};
