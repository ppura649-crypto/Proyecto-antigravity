import React from "react";
import { interpolate, interpolateColors } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";

// V13: "and the awesome part is there's NO PAID SUBSCRIPTION." The thing the creator is
// negating, drawn the way every SaaS draws it: a plan card whose hero is not a
// price (the creator says no number, so none is shown) but the renew arrow, turning and
// turning. It holds long enough to be recognised as the usual thing, then one
// thick terracotta strike crosses it on "no", the SUBSCRIBE button greys out on
// "paid", and on "subscription." the renew arrow stops mid-turn and falls off
// the card. Held struck.
export type PricingData = { plan?: string; renews?: string; button?: string };

const DW = 864;
const DH = 538;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (v: number) => Math.max(0, Math.min(1, v));

const PW = 600, PH = 470, PX = (DW - PW) / 2, PY = (DH - PH) / 2;
const PAD = 44, CW = PW - 2 * PAD;
const RULE = 106;
const ARR = 148, ARR_TOP = 124;
const REN_TOP = 290, REN_FS = 30;
const BTN_TOP = 352, BTN_H = 84, BTN_FS = 34;

const TURN_MS = 1500; // one turn per 1.5 s: a rate, never mapped over the card
const FALL_MS = 400;

const R = 34;
const pt = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [50 + R * Math.cos(a), 50 + R * Math.sin(a)];
};
const arc = (a0: number, a1: number) => {
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const head = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  const [px, py] = pt(deg);
  const tx = -Math.sin(a), ty = Math.cos(a);
  const nx = -ty, ny = tx;
  const p = (fx: number, fn: number) => `${(px + tx * fx + nx * fn).toFixed(2)},${(py + ty * fx + ny * fn).toFixed(2)}`;
  return `${p(14, 0)} ${p(-4, 10.5)} ${p(-4, -10.5)}`;
};

export const Pricing: React.FC<CardProps & { data: PricingData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const S = Math.min(w / DW, h / DH);
  const oX = (w - DW * S) / 2, oY = (h - DH * S) / 2;
  const bNo = beats.no ?? fromMs + 1080;
  const bPaid = beats.paid ?? bNo + 60;
  const bSub = beats.subscription ?? bNo + 240;

  // the renew arrow turns at a rate, and stops dead on "subscription."
  const spinT = Math.min(tMs, bSub) - fromMs;
  const spin = (spinT / TURN_MS) * 360;
  const fall = p01((tMs - bSub) / FALL_MS);
  const dy = 4400 * Math.pow((fall * FALL_MS) / 1000, 2);
  const dx = 34 * fall;
  const tumble = 74 * fall;
  const gone = interpolate(tMs, [bSub + 210, bSub + FALL_MS], [1, 0], clamp);

  // one thick strike, corner to corner, drawn over 200 ms on "no"
  const cut = p01((tMs - bNo) / 200);
  const x0 = PX - 20, y0 = PY - 16, x1 = PX + PW + 20, y1 = PY + PH + 16;
  const grey = interpolate(tMs, [bPaid, bPaid + 160], [0, 1], clamp);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#F2F1ED" }}>
      <div style={{ position: "absolute", left: oX, top: oY, width: DW, height: DH, transform: `scale(${S})`, transformOrigin: "top left" }}>
        {/* the plan card */}
        <div style={{
          position: "absolute", left: PX, top: PY, width: PW, height: PH, boxSizing: "border-box",
          backgroundColor: "#FFFFFF", border: "1px solid #E8E5DD", borderRadius: 14,
          boxShadow: "0 18px 44px rgba(31,30,29,0.13), 0 2px 6px rgba(31,30,29,0.06)",
        }}>
          <div style={{ position: "absolute", left: 0, top: 40, width: PW, textAlign: "center", ...label(44, "#1F1E1D"), lineHeight: 1.15 }}>
            {data.plan ?? "MONTHLY"}
          </div>
          <div style={{ position: "absolute", left: PAD, top: RULE, width: CW, height: 1, backgroundColor: "#E8E5DD" }} />
          <div style={{
            position: "absolute", left: 0, top: REN_TOP, width: PW, textAlign: "center",
            ...label(REN_FS, "#73726C"), lineHeight: 1.2,
          }}>
            {data.renews ?? "RENEWS EVERY MONTH"}
          </div>
          <div style={{
            position: "absolute", left: PAD, top: BTN_TOP, width: CW, height: BTN_H,
            backgroundColor: interpolateColors(grey, [0, 1], ["#1F1E1D", "#D9D7D0"]),
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              ...label(BTN_FS, interpolateColors(grey, [0, 1], ["#FFFFFF", "#1F1E1D"])),
              opacity: interpolate(grey, [0, 1], [1, 0.3]), lineHeight: 1,
            }}>
              {data.button ?? "SUBSCRIBE"}
            </span>
          </div>
        </div>

        {/* the renew arrow: it turns, it stops mid-turn, it falls off the card */}
        <svg
          width={ARR} height={ARR} viewBox="0 0 100 100"
          style={{
            position: "absolute", left: PX + (PW - ARR) / 2 + dx, top: PY + ARR_TOP + dy,
            transform: `rotate(${spin + tumble}deg)`, transformOrigin: "50% 50%", opacity: gone,
          }}
        >
          <title>renews every month</title>
          <path d={arc(20, 152)} fill="none" stroke="#1F1E1D" strokeWidth={9} strokeLinecap="butt" />
          <path d={arc(200, 332)} fill="none" stroke="#1F1E1D" strokeWidth={9} strokeLinecap="butt" />
          <polygon points={head(160)} fill="#1F1E1D" />
          <polygon points={head(340)} fill="#1F1E1D" />
        </svg>

        {/* the negation */}
        <svg width={DW} height={DH} style={{ position: "absolute", left: 0, top: 0 }}>
          <title>no paid subscription</title>
          <line
            x1={x0} y1={y0}
            x2={x0 + (x1 - x0) * cut} y2={y0 + (y1 - y0) * cut}
            stroke={ACCENT} strokeWidth={18} strokeLinecap="butt" opacity={cut > 0 ? 1 : 0}
          />
        </svg>
      </div>
    </div>
  );
};
