// Pieces of the hook that the developer scene also needs, so the window it inherits is pixel-identical:
// the AliExpress page inside the tab, the favicon, and the "spyware" stamp that becomes a badge on the tab strip.
import React from "react";
import { arrive, pop, prog, useScene } from "../../../src/engine";
import { HANDOFF, Logo, RED } from "./parts";

export const HW = HANDOFF.hookWindow;
/** the omnibox pill of the hook window, in stage px (ChromeWindow: tab strip 78, toolbar 84, pill 58 tall, 22 in) */
export const OMNI = { left: HW.left + 22, top: HW.top + 78 + 13, width: HW.width - 44, height: 58, iconCx: HW.left + 22 + 22 + 17, cy: HW.top + 78 + 42 };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** the AliExpress marks ship as square PNGs with white corners: clip them to the mark's own shape, never a tile */
export const AliMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ width: size, height: size, borderRadius: "22.5%", overflow: "hidden", flex: "none", ...style }}>
    <Logo name="aliexpress" size={size} style={{ transform: "scale(1.02)" }} />
  </div>
);
export const AlibabaMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flex: "none", ...style }}>
    <Logo name="alibaba" size={size} style={{ transform: "scale(1.03)" }} />
  </div>
);

/** the tab once AliExpress has loaded: its mark in the page, a finished load bar. `at` undefined = settled */
export const AliPage: React.FC<{ at?: number }> = ({ at }) => {
  const { f } = useScene();
  const load = at === undefined ? 1 : prog(f, at - 2, 22);
  const barOut = at === undefined ? 1 : prog(f, at + 22, 8);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 5, width: `${(load * 100).toFixed(1)}%`, background: "#8AB4F8", opacity: 1 - barOut }} />
      <div style={at === undefined ? undefined : pop(f, at, { dur: 12, from: 0.55 })}>
        <AliMark size={200} />
      </div>
    </div>
  );
};

/** an eye: the icon that names "spyware" next to the word */
const Eye: React.FC<{ size: number; c: string }> = ({ size, c }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
    <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
    <circle cx={12} cy={12} r={3.6} fill={c} />
  </svg>
);

/** "SPYWARE" slams onto the empty page on its word, then on `park` shrinks into a red badge on the tab strip */
export const SpyStamp: React.FC<{ at: number; park: number }> = ({ at, park }) => {
  const { f, theme } = useScene();
  if (f < at) return null;
  const slam = arrive(f, at, 10);
  const k = arrive(f, park, 22);
  const cx = lerp(540, 790, k);
  const cy = lerp(HW.top + 400, HW.top + 42, k);
  const s = lerp(1.75 - 0.75 * slam, 0.34, k) * (1 + 0.012 * Math.sin((f - at) / 9) * (1 - k));
  const rot = lerp(-7, 0, k);
  return (
    <div
      style={{
        position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`,
        opacity: prog(f, at, 3), display: "flex", alignItems: "center", gap: 22, padding: "10px 34px",
        border: `8px solid ${RED}`, borderRadius: 18, background: `rgba(229,56,59,${(0.1 + 0.9 * k).toFixed(3)})`,
        fontFamily: theme.font.ui, whiteSpace: "nowrap",
      }}
    >
      <Eye size={104} c={k > 0.5 ? "#FFFFFF" : RED} />
      <span style={{ fontSize: 112, fontWeight: 900, letterSpacing: 6, color: k > 0.5 ? "#FFFFFF" : RED, lineHeight: "130px" }}>SPYWARE</span>
    </div>
  );
};
