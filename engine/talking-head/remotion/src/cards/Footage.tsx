import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";
import { DemoScene, Folder, Scene, Strip, WorkScene, type SceneKind } from "./FootageParts";

// V4, "Second, gather some footage that you think is relevant to your product or
// business. Whether it's videos of you, the work you've been putting in, or a demo
// video of the actual product." Eight and a half seconds on ONE object: a blue macOS
// folder named FOOTAGE that opens, takes a camera roll in from the four edges, stamps
// it, throws the beach and the cat out on the two words that name the filter, swallows
// the rest and then lays the three kinds out to its right, counting them 1, 2, 3.

export type FootageData = { step: string; folder: string; kinds: string[] };

const INK = "#1F1E1D";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lbl = (px: number, c: string): React.CSSProperties => ({ ...label(px, c), fontWeight: 700, lineHeight: 1 });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// the camera roll, in the order it flies in; the beach and the cat are the rejects
const ROLL: { kind: SceneKind; edge: "l" | "t" | "b" | "r"; rot: number }[] = [
  { kind: "beach", edge: "l", rot: -3 },
  { kind: "city", edge: "t", rot: 2.2 },
  { kind: "coffee", edge: "t", rot: -2 },
  { kind: "mountain", edge: "b", rot: 3 },
  { kind: "plant", edge: "b", rot: -1.6 },
  { kind: "cat", edge: "r", rot: 2.6 },
];
const NAMED_ROT = [-2.6, 2, -1.5];

const Stamp: React.FC<{ d: number; p: number; x: boolean }> = ({ d, p, x }) => (
  <div
    style={{
      position: "absolute", right: -Math.round(d * 0.22), bottom: -Math.round(d * 0.22),
      width: d, height: d, borderRadius: "50%", backgroundColor: x ? ACCENT : "#FFFFFF",
      boxShadow: "0 3px 9px rgba(31,30,29,0.34)", display: "flex", alignItems: "center", justifyContent: "center",
      transform: `scale(${0.18 + 0.82 * p}) rotate(${(1 - p) * -26}deg)`, opacity: Math.min(1, p * 3),
    }}
  >
    <svg width={Math.round(d * 0.58)} height={Math.round(d * 0.58)} viewBox="0 0 24 24" fill="none">
      {x ? (
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" />
      ) : (
        <path d="M4.6 12.6 L9.8 17.6 L19.4 6.8" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  </div>
);

export const Footage: React.FC<CardProps & { data: FootageData }> = ({ tMs, w, h, fps, fromMs, beats, assets, data }) => {
  const B = beats;
  const P = Math.round(0.036 * w);
  const FW = Math.round(0.27 * w);
  const FH = Math.round(FW * 0.76);
  const FX = Math.round(0.046 * w);
  const RX = Math.round(0.352 * w);
  const GX = Math.round(0.025 * w);
  const CW = Math.floor((w - P - RX - 2 * GX) / 3);
  const CH = Math.round(CW * 0.667);
  const MID = Math.round(0.568 * h);
  const FY = MID - Math.round(FH / 2);
  const GY = [MID - CH - 11, MID + 11];
  const NCY = MID - Math.round(CH / 2);
  const inX = Math.round(CW * 0.035);
  const innerW = CW - 2 * inX;
  // guest-clip.png is 1080x1920; this is the window that holds their head, cropped to the clip
  const CROP = { x: 100, y: 835, w: 880 };
  const K = innerW / CROP.w;
  const slotX = (i: number) => RX + i * (CW + GX);

  const sp = (at: number, stiff = 260) =>
    spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 15, stiffness: stiff, mass: 0.8 } });
  const pulse = (at: number) => {
    const d = tMs - at;
    return d < 0 || d > 340 ? 0 : Math.sin((Math.PI * d) / 340);
  };

  const enter = sp(fromMs, 340);
  const open = interpolate(tMs, [B.gather, B.gather + 300], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // the three kinds, and the count on the folder
  const at = [B.videos, B.work, B.demo];
  const stamps = at.map((a) => a + 320);
  let count = 0;
  let lastCount = 0;
  stamps.forEach((s, i) => { if (tMs >= s) { count = i + 1; lastCount = s; } });
  if (tMs >= B.done) lastCount = B.done;
  const badge = Math.round(CW * 0.30);
  const badgeP = sp(stamps[0], 340);
  const align = interpolate(tMs, [B.done, B.done + 240], [1, 0], clamp);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      {/* step two of the recipe */}
      <div
        style={{
          position: "absolute", left: P, top: Math.round(0.058 * h), ...lbl(Math.round(0.135 * h), ACCENT),
          opacity: Math.min(1, enter * 5), transform: `translateY(${(1 - enter) * -18}px)`,
        }}
      >
        {data.step}
      </div>

      {/* the folder, and its name under it */}
      <div
        style={{
          position: "absolute", left: FX, top: FY, width: FW,
          opacity: Math.min(1, enter * 5), transform: `scale(${0.86 + 0.14 * enter})`, transformOrigin: "50% 60%",
        }}
      >
        <Folder w={FW} open={open} />
        <div style={{ position: "absolute", left: 0, top: FH + Math.round(0.028 * h), width: FW, textAlign: "center", ...lbl(Math.round(0.055 * h), INK) }}>
          {data.folder}
        </div>
        {count > 0 && (
          <div
            style={{
              position: "absolute", left: FW - Math.round(badge * 0.62), top: -Math.round(badge * 0.30),
              width: badge, height: badge, borderRadius: "50%", backgroundColor: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(31,30,29,0.30)",
              transform: `scale(${(0.4 + 0.6 * badgeP) * (1 + 0.24 * pulse(lastCount))})`,
            }}
          >
            <span style={{ ...lbl(Math.round(badge * 0.56), "#FFFFFF"), letterSpacing: 0 }}>{count}</span>
          </div>
        )}
      </div>

      {/* the camera roll: in on "gather", stamped on "relevant", two thrown out */}
      {ROLL.map((clip, i) => {
        const t0 = B.gather + i * 68;
        const p = interpolate(tMs, [t0, t0 + 420], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        if (p <= 0) return null;
        const gx = slotX(i % 3);
        const gy = GY[i < 3 ? 0 : 1];
        const sx = clip.edge === "l" ? -CW - 40 : clip.edge === "r" ? w + 40 : gx;
        const sy = clip.edge === "t" ? -CH - 40 : clip.edge === "b" ? h + 40 : gy;
        let x = lerp(sx, gx, p);
        let y = lerp(sy, gy, p);
        let rot = lerp(clip.rot + (i % 2 ? 17 : -17), clip.rot, p);
        let k = lerp(0.72, 1, p);

        const reject = i === 0 ? B.product : i === 5 ? B.business : 0;
        const sink = reject ? 0 : B.videos + (i - 1) * 45;
        const stamped = interpolate(tMs, [B.relevant + i * 70, B.relevant + i * 70 + 170], [0, 1], clamp);
        const xed = reject ? interpolate(tMs, [reject, reject + 130], [0, 1], clamp) : 0;

        if (reject) {
          // out over the folder's edge on the word that rejects it, and off the card
          const q = interpolate(tMs, [reject + 130, reject + 690], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
          if (q > 0) {
            x = lerp(gx, i === 0 ? -CW - 90 : w + 90, q);
            y = gy - 170 * Math.sin(Math.PI * q) + 90 * q * q;
            rot = clip.rot + (i === 0 ? -300 : 300) * q;
            k = lerp(1, 0.82, q);
          }
        } else {
          // the rest go into the folder when the creator starts naming the three kinds
          const q = interpolate(tMs, [sink, sink + 340], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
          if (q > 0) {
            x = lerp(gx, FX + Math.round(FW * 0.5) - CW / 2, q);
            y = lerp(gy, FY + Math.round(FH * 0.16), q);
            k = lerp(1, 0.24, q);
            rot = lerp(clip.rot, 0, q);
            if (q >= 1) return null;
          }
        }
        const fade = reject ? 1 : interpolate(tMs, [sink + 250, sink + 340], [1, 0], clamp);

        return (
          <div
            key={clip.kind}
            style={{
              position: "absolute", left: x, top: y, width: CW, height: CH,
              transform: `scale(${k}) rotate(${rot}deg)`, transformOrigin: "50% 50%",
              opacity: Math.min(1, p * 4) * fade,
            }}
          >
            <Strip w={CW} h={CH}><Scene kind={clip.kind} /></Strip>
            {(stamped > 0 || xed > 0) && <Stamp d={Math.round(CW * 0.30)} p={xed > 0 ? xed : stamped} x={xed > 0} />}
          </div>
        );
      })}

      {/* the three kinds, out of the folder, one per sentence */}
      {data.kinds.map((name, i) => {
        const p = sp(at[i] + 120, 210);
        if (tMs < at[i] + 120) return null;
        const gx = slotX(i);
        const x = lerp(FX + Math.round(FW * 0.32), gx, Math.min(1.06, p));
        const y = lerp(FY + Math.round(FH * 0.2), NCY, Math.min(1.06, p));
        const np = interpolate(tMs, [at[i] + 380, at[i] + 560], [0, 1], clamp);
        return (
          <div key={name} style={{ position: "absolute", left: x, top: y, width: CW, opacity: Math.min(1, p * 4) }}>
            <div
              style={{
                position: "relative", width: CW, height: CH,
                transform: `scale(${lerp(0.4, 1, Math.min(1.04, p))}) rotate(${NAMED_ROT[i] * align}deg)`,
                transformOrigin: "50% 50%",
              }}
            >
              <Strip w={CW} h={CH}>
                {i === 0 ? (
                  <Img
                    src={staticFile(assets[0])}
                    style={{
                      position: "absolute", left: -Math.round(CROP.x * K), top: -Math.round(CROP.y * K),
                      width: Math.round(1080 * K), display: "block",
                    }}
                  />
                ) : i === 1 ? (
                  <WorkScene tMs={tMs} />
                ) : (
                  <DemoScene tMs={tMs} sinceMs={at[2] + 420} />
                )}
              </Strip>
            </div>
            <div
              style={{
                position: "absolute", left: 0, top: CH + Math.round(0.028 * h), width: CW, textAlign: "center",
                ...lbl(Math.round(0.052 * h), INK), opacity: np, transform: `translateY(${(1 - np) * 8}px)`,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
      {/* the band the labels sit on, so the row reads as one shelf */}
      <div
        style={{
          position: "absolute", left: RX, top: NCY + CH + Math.round(0.014 * h), width: w - P - RX, height: 2,
          backgroundColor: "#E8E5DD", opacity: interpolate(tMs, [B.videos + 380, B.videos + 620], [0, 1], clamp),
        }}
      />
    </div>
  );
};
