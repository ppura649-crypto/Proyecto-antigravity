import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, label } from "./theme";

// "Honestly, people were skeptical, me included."
// Three replies land 150 ms apart, staggered like a comment thread, unattributed
// (they are "people"). Then on `included.` their own profile photo pops in as the
// fourth one, with ME INCLUDED beside it in the accent. The one HUMOR beat.
//
// Frameless over their dark curtain, so each reply is a solid near-black plate with a
// 0-offset halo, square corners, white text. The replies use a plain sans, the way
// MONO and the chart face imitate a real artifact: a comment is typed, not titled.
// Two type sizes, one accent, nothing outside the box.

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type BubblesData = { items: string[]; me: string };

export const Bubbles: React.FC<CardProps & { data: BubblesData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const P = 0.030 * w;
  const fs = 0.037 * w;
  const meFs = 0.043 * w;
  const padY = 0.021 * w;
  const padX = 0.028 * w;
  const rowH = fs * 1.2 + 2 * padY;
  const avatar = 0.260 * h;

  const tsh = `0px 0px ${0.013 * w}px rgba(0,0,0,0.94), ${SHADOW}`;
  const halo = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 4px 14px rgba(0,0,0,0.8))`;
  const plateSh = `0px 0px ${0.014 * w}px rgba(0,0,0,0.95), 0px 12px 34px rgba(0,0,0,0.6)`;

  const tops = [0.026 * h, 0.242 * h, 0.458 * h];
  const sides: ("left" | "right")[] = ["left", "right", "left"];
  const at = [beats.b1 ?? fromMs, beats.b2 ?? fromMs + 150, beats.b3 ?? fromMs + 300];
  const meAt = beats.me ?? fromMs + 840;

  const sp = (ms: number, damping: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping, stiffness: 330, mass: 0.6 } });

  const meIn = sp(meAt, 13);
  const meRowTop = 0.655 * h;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {data.items.slice(0, 3).map((t, i) => {
        const s = sp(at[i], 15);
        if (s <= 0) return null;
        const side = sides[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute", top: tops[i], height: rowH,
              ...(side === "left" ? { left: P } : { right: P }),
              display: "flex", alignItems: "center",
              opacity: clamp01(s * 3),
              transform: `translateY(${(1 - Math.min(1, s)) * 0.028 * h}px) scale(${0.9 + 0.1 * Math.min(1, s)})`,
              transformOrigin: side === "left" ? "0% 50%" : "100% 50%",
            }}
          >
            <div
              style={{
                backgroundColor: CARD_BG, borderRadius: 0, boxShadow: plateSh,
                padding: `${padY}px ${padX}px`, boxSizing: "border-box",
              }}
            >
              <span style={{
                fontFamily: SANS, fontSize: fs, fontWeight: 500, color: INK,
                lineHeight: 1.2, whiteSpace: "nowrap", textShadow: tsh, display: "block",
              }}>{t}</span>
            </div>
          </div>
        );
      })}

      {/* the fourth reply is them: their real photo, and the accent lands with it */}
      {meIn > 0 && (
        <div
          style={{
            position: "absolute", right: P, top: meRowTop, height: avatar,
            display: "flex", alignItems: "center", gap: 0.030 * w,
            opacity: clamp01(meIn * 3),
            transform: `translateY(${(1 - Math.min(1, meIn)) * 0.030 * h}px) scale(${0.84 + 0.16 * Math.min(1, meIn)})`,
            transformOrigin: "100% 50%",
          }}
        >
          <div style={{ ...label(meFs, ACCENT), lineHeight: 1, whiteSpace: "nowrap", textShadow: tsh }}>
            {data.me}
          </div>
          {assets[0] ? (
            <Img
              src={staticFile(assets[0])}
              style={{
                width: avatar, height: avatar, borderRadius: "50%", objectFit: "cover",
                display: "block", filter: halo,
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
