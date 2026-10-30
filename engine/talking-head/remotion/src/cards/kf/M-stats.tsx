import React from "react";
import type { CardProps } from "../props";
import { Drum, drumH } from "./M-drum";
import { clamp, easeInOut, easeOut3, exitP, FONT, settle, spin, win } from "./M-util";
// V3 "from 0 to 51,000 followers, 10M views, in 100 days" (builder M, 2026-09-25), 2997 -> 6800, above their head.
// The stats row of a real Instagram profile in dark mode (big number over a small label, cells centred), every
// digit a heavy counter drum. Lands on "from" reading 0 followers / 0 views. On 51,000 the followers drums kick
// (the new ones swing in from nothing), spin with blur and lock right to left with a soft settle; on 10M the views
// drums do the same and the M drops onto the line; on 100 a third cell "days" drops in with its drums already
// spinning, the row gliding left to make room, and locks right to left. The whole row held under a slow push.

type Slot = { d?: number; g?: string; from?: number; spinAt?: number; lockAt?: number; showAt?: number };
const FS = 66, DW = Math.round(FS * 0.64), GAP_D = 3, LFS = 27, CELL_GAP = 64;
const B = { from: 2997, n51: 3691, followers: 4471, n10m: 5251, views: 5911, n100: 6271, days: 6571 };

const drumP = (s: Slot, t: number) => {
  const from = s.from ?? 0;
  if (s.spinAt === undefined || s.lockAt === undefined || t < s.spinAt) return from;
  const laps = Math.max(1, Math.round((s.lockAt - s.spinAt) / 330));
  const D = laps * 10 + ((((s.d ?? 0) - from) % 10) + 10) % 10;
  return from + D * spin(win(t, s.spinAt, s.lockAt)) + settle(t, s.lockAt);
};
const grow = (s: Slot, t: number) => (s.showAt === undefined ? 1 : easeInOut(win(t, s.showAt, s.showAt + 280)));
const glyphW = (g: string) => (g === "," ? FS * 0.26 : FS * 0.86);

const Row: React.FC<{ slots: Slot[]; t: number; tag: string }> = ({ slots, t, tag }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: drumH(FS) }}>
    {slots.map((s, i) => {
      const g = grow(s, t);
      if (s.g !== undefined) {
        const w = glyphW(s.g) * g;
        return (
          <div key={i} style={{ width: w, height: drumH(FS), position: "relative", overflow: "visible", clipPath: "inset(-100% 0 -100% 0)" }}>
            <div style={{ position: "absolute", left: 0, bottom: s.g === "," ? drumH(FS) * 0.2 : (drumH(FS) - FS) / 2 - FS * 0.02,
              fontFamily: FONT, fontWeight: 700, fontSize: FS, lineHeight: 1, color: "#fff",
              opacity: easeOut3(clamp(g * 1.4)), transform: `translateY(${-FS * 0.5 * (1 - easeOut3(g))}px)` }}>{s.g}</div>
          </div>
        );
      }
      const w = DW * g;
      return (
        <div key={i} style={{ width: w + (i > 0 ? GAP_D * g : 0), height: drumH(FS), overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ flex: "0 0 auto", opacity: clamp(g * 1.6) }}>
            <Drum p={drumP(s, t)} pPrev={drumP(s, t - 1000 / 60)} fs={FS} w={DW} id={`kfm-${tag}-${i}-${Math.round(t)}`} />
          </div>
        </div>
      );
    })}
  </div>
);

const Cell: React.FC<{ slots: Slot[]; label: string; t: number; tag: string; lit: number; minW: number }> = ({ slots, label, t, tag, lit, minW }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: minW }}>
    <Row slots={slots} t={t} tag={tag} />
    <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: LFS, lineHeight: 1, marginTop: 4, color: "#f5f5f5",
      opacity: 0.62 + 0.38 * lit, letterSpacing: "0.005em" }}>{label}</div>
  </div>
);

export const Stats: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats }) => {
  const b = { ...B, ...(beats as Partial<typeof B>) };
  const k = w / 1080, H = h / k;
  const S1 = b.n51, S2 = b.n10m, S3 = b.n100;
  // followers: 0 -> 51,000, the new drums swing in on the word, locks right to left
  const fol: Slot[] = [
    { d: 5, from: 0, spinAt: S1, lockAt: S1 + 860, showAt: S1 },
    { d: 1, from: 0, spinAt: S1, lockAt: S1 + 740, showAt: S1 },
    { g: ",", showAt: S1 + 40 },
    { d: 0, from: 0, spinAt: S1, lockAt: S1 + 620, showAt: S1 },
    { d: 0, from: 0, spinAt: S1, lockAt: S1 + 500, showAt: S1 },
    { d: 0, from: 0, spinAt: S1, lockAt: S1 + 380 },
  ];
  const vie: Slot[] = [
    { d: 1, from: 0, spinAt: S2, lockAt: S2 + 540, showAt: S2 },
    { d: 0, from: 0, spinAt: S2, lockAt: S2 + 400 },
    { g: "M", showAt: S2 + 560 },
  ];
  const day: Slot[] = [
    { d: 1, from: 7, spinAt: S3 - 120, lockAt: S3 + 340 },
    { d: 0, from: 3, spinAt: S3 - 120, lockAt: S3 + 270 },
    { d: 0, from: 5, spinAt: S3 - 120, lockAt: S3 + 200 },
  ];
  const litF = easeOut3(win(t, S1 + 860, S1 + 1060)), litV = easeOut3(win(t, S2 + 560, S2 + 760));
  const litD = easeOut3(win(t, S3 + 340, S3 + 540));
  // the third cell: its column opens (the row glides left, heavy) while the cell drops onto the line
  const open = easeInOut(win(t, S3 - 260, S3 + 120));
  const drop = easeOut3(win(t, S3 - 120, S3 + 260));
  const dayW = 3 * DW + 2 * GAP_D;
  // the landing on "from": in from above, the shadow tightening as it meets the wall; first frame already a picture
  const land = easeOut3(win(t, fromMs - 110, fromMs + 300));
  const out = exitP(t, toMs);
  const push = 1 + 0.022 * easeInOut(win(t, fromMs + 300, toMs));
  const y = -46 * (1 - land) - 10 * out;
  const plateH = 22 + drumH(FS) + 4 + LFS + 24;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "visible" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: H - 24 - plateH, display: "flex", justifyContent: "center",
          opacity: (0.7 + 0.3 * land) * (1 - out) }}>
          <div style={{ display: "flex", alignItems: "flex-start", padding: "22px 46px 24px", background: "rgba(0,0,0,0.9)", overflow: "hidden",
            transform: `translateY(${y}px) scale(${push * (1.035 - 0.035 * land)})`, transformOrigin: "50% 100%",
            boxShadow: `0 ${18 + 34 * (1 - land)}px ${46 + 40 * (1 - land)}px rgba(0,0,0,${0.42 - 0.14 * (1 - land)}), 0 6px 14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.09)` }}>
            <Cell slots={fol} label="followers" t={t} tag="f" lit={litF} minW={0} />
            <div style={{ width: CELL_GAP }} />
            <Cell slots={vie} label="views" t={t} tag="v" lit={litV} minW={0} />
            <div style={{ width: (CELL_GAP + dayW) * open, height: 1, position: "relative", overflow: "visible" }}>
              {t >= S3 - 260 && (
                <div style={{ position: "absolute", left: CELL_GAP, top: 0, width: dayW,
                  transform: `translateY(${-70 * (1 - drop)}px)`, opacity: clamp(drop * 2.2) }}>
                  <Cell slots={day} label="days" t={t} tag="d" lit={litD} minW={dayW} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
