import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT, MONO_FONT } from "./theme";

// V10 "this system I'm talking about has gotten us tens of millions of views in the past year."
// The two real accounts as a tally the creator could screenshot (the Reach.tsx idiom, on white):
// the real avatar, the real handle, a bar on ONE shared scale, and the real 12-month figure
// rolling up in mono with the unit each platform actually reports. Under them the sum, which
// is the phrase the creator says. Every figure is the real number; the source of both is on the card.
export type AccountsRow = { handle: string; value: number; unit: string };
export type AccountsData = {
  rows: AccountsRow[];
  total: number;
  totalLabel: string;
  source: string;
};

const INK = "#1F1E1D";
const MUTED = "#73726C";
const HAIR = "#E8E5DD";
const BAR = "#2A2927";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const mfmt = (n: number) => `${(n / 1e6).toFixed(1)}M`;

export const Accounts: React.FC<CardProps & { data: AccountsData }> = ({ tMs, w, h, fps, assets, beats, data }) => {
  const P = Math.round(0.034 * w);
  const W = w - 2 * P;

  const av = Math.round(0.100 * w);          // 99
  const gap = Math.round(0.024 * w);         // 24
  const figW = Math.round(0.300 * w);        // 298
  const colW = W - av - figW - 2 * gap;

  const fsHandle = Math.round(0.032 * w);    // 32
  const fsFig = Math.round(0.047 * w);       // 47
  const fsUnit = Math.round(0.026 * w);      // 26
  const fsTotal = Math.round(0.122 * w);     // 121
  const fsLabel = Math.round(0.030 * w);     // 30
  const fsSrc = Math.round(0.024 * w);       // 24

  const barH = Math.round(0.056 * h);        // 30
  const rowH = Math.round(0.216 * h);        // 116
  const rowTop = Math.round(0.044 * h);

  const max = Math.max(...data.rows.map((r) => r.value));

  // ONE movement at a rate: the bars grow and the figures roll together over 1.2 s from
  // "gotten", and the sum rolls from "tens" and lands on "views" so the unit lights on a
  // settled number. Never mapped over the card's life.
  const grow = interpolate(tMs, [beats.gotten, beats.gotten + 1200], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // the sum runs on the SAME clock as the two rows, so the tally adds up on every frame
  // (rolling it on its own made the card read 12.2 + 5.6 = 6.1 for a second); it appears
  // on "tens", already moving, and settles before the units light on "views"
  const sum = data.total * grow;

  const rowsIn = spring({
    frame: Math.max(0, ((tMs - beats.this) / 1000) * fps),
    fps, config: { damping: 16, stiffness: 330, mass: 0.7 },
  });
  const totalOn = tMs >= beats.tens;
  const unitsSp = spring({
    frame: Math.max(0, ((tMs - beats.views) / 1000) * fps),
    fps, config: { damping: 14, stiffness: 340, mass: 0.6 },
  });
  const srcF = ((tMs - beats.past) / 1000) * fps;

  const hairY = rowTop + 2 * rowH + Math.round(0.024 * h);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {data.rows.map((r, i) => {
        const f = ((tMs - (beats.this + i * 70)) / 1000) * fps;
        if (f < 0) return null;
        const sp = spring({ frame: f, fps, config: { damping: 16, stiffness: 330, mass: 0.7 } });
        return (
          <div
            key={r.handle}
            style={{
              position: "absolute", left: P, top: rowTop + i * rowH, width: W, height: rowH,
              display: "flex", alignItems: "center", gap,
              opacity: Math.min(1, f / 2), transform: `translateY(${(1 - sp) * 12}px)`,
            }}
          >
            <Img
              src={staticFile(assets[i] ?? assets[0])}
              style={{ width: av, height: av, borderRadius: "50%", objectFit: "cover", display: "block", flex: "none" }}
            />
            <div style={{ width: colW, flex: "none" }}>
              <div style={{ fontFamily: MONO_FONT, fontSize: fsHandle, color: INK, lineHeight: 1.1 }}>{r.handle}</div>
              <div style={{ marginTop: Math.round(0.018 * h), height: barH, width: colW, background: "#F1EFE9" }}>
                <div style={{ height: barH, width: colW * (r.value / max) * grow, background: BAR }} />
              </div>
            </div>
            <div style={{ width: figW, flex: "none", textAlign: "right", whiteSpace: "nowrap" }}>
              {grow > 0 && (
                <span style={{
                  fontFamily: MONO_FONT, fontSize: fsFig, fontWeight: 700, color: INK,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {mfmt(r.value * grow)}
                </span>
              )}
              <span style={{
                fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fsUnit, letterSpacing: "0.09em",
                textTransform: "uppercase", marginLeft: Math.round(0.012 * w),
                color: unitsSp > 0 ? INK : MUTED,
                opacity: unitsSp > 0 ? 1 : 0.72,
              }}>
                {r.unit}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: P, top: hairY, width: W, height: 2, background: HAIR, opacity: Math.min(1, rowsIn * 2) }} />

      {totalOn && (
        <div style={{
          position: "absolute", left: 0, top: hairY + Math.round(0.046 * h), width: w,
          display: "flex", alignItems: "baseline", justifyContent: "center", gap: Math.round(0.026 * w),
          opacity: Math.min(1, ((tMs - beats.tens) / 1000) * fps / 4),
        }}>
          <span style={{
            fontFamily: MONO_FONT, fontSize: fsTotal, fontWeight: 700, color: ACCENT,
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {mfmt(sum)}
          </span>
          <span style={{
            fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fsLabel, letterSpacing: "0.09em",
            textTransform: "uppercase", color: INK,
          }}>
            {data.totalLabel}
          </span>
        </div>
      )}

      {srcF >= 0 && (
        <div style={{
          position: "absolute", right: P, bottom: Math.round(0.046 * h),
          fontFamily: MONO_FONT, fontSize: fsSrc, color: MUTED, whiteSpace: "nowrap",
          opacity: Math.min(1, srcF / 3), transform: `translateY(${Math.max(0, 1 - srcF / 3) * 8}px)`,
        }}>
          {data.source}
        </div>
      )}
    </div>
  );
};
