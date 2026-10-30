// `power`: the pass. A lanyard badge reading READ-ONLY waits in the machine's intake slot; on "renewed" it is pulled
// in; it comes back out of the front slot and flies up to the front, ending on "read-only" with READ-ONLY plain; on
// "admin" the same card turns gold, its chip rewrites to ADMIN, an ADMIN stamp slams on, and a shine sweeps across.
import React from "react";
import { arrive, ease, mix, prog, useScene } from "../../../src/engine";
import { AGENT, AgentIcon } from "./parts";
import { PM, PM_SLOT, type PowerCues } from "./PowerMachine";

const W = 250;
const H = 340;

const Card: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const g = prog(f, c.admin - 2, 7, ease.linear);
  const bg = `linear-gradient(160deg, ${mix(f, c.admin - 2, 7, "#FFFFFF", "#FFE9A3")} 0%, ${mix(f, c.admin - 2, 7, "#EEF1F5", "#E2B23C")} 100%)`;
  const head = mix(f, c.admin - 2, 7, "#4A5566", "#8A6212");
  const isAdmin = f >= c.admin;
  const roPulse = f >= c.ro && !isAdmin ? 1 + 0.1 * Math.sin(Math.min(Math.PI, ((f - c.ro) / 12) * Math.PI)) : 1;
  const chipCol = "#4A5566";
  const stamp = isAdmin ? prog(f, c.admin, 7, ease.in) : 0;
  const shine = prog(f, c.admin + 6, 26, ease.inOut);
  return (
    <div style={{ position: "relative", width: W, height: H, borderRadius: 20, background: bg, overflow: "hidden", boxShadow: `0 24px 50px rgba(15,23,42,0.28), inset 0 0 0 2px ${mix(f, c.admin - 2, 7, "#D5DAE1", "#B8891F")}, 0 0 ${(60 * g).toFixed(0)}px rgba(255,200,40,${(0.7 * g).toFixed(2)})` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 74, background: head }} />
      <div style={{ position: "absolute", left: W / 2 - 30, top: 14, width: 60, height: 14, borderRadius: 7, background: "#F2F4F7" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 32, textAlign: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, letterSpacing: 6, color: "#FFFFFF" }}>PASS</div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 90, height: 58, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${roPulse.toFixed(3)})`, boxShadow: `inset 0 0 0 3px ${chipCol}`, background: isAdmin ? "rgba(255,255,255,0.3)" : "#F3F5F8", fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: chipCol, whiteSpace: "nowrap", opacity: 1 - 0.65 * stamp }}>
        READ-ONLY
        {stamp > 0 && <div style={{ position: "absolute", left: 10, right: 10, top: 27, height: 4, background: chipCol }} />}
      </div>
      <div style={{ position: "absolute", left: W / 2 - 62, top: 170, width: 124, height: 124, borderRadius: 16, background: "radial-gradient(circle at 50% 45%, #1B2A3A, #0B121A)", boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.15)" }}>
        <div style={{ position: "absolute", left: 62 - 42, top: 62 - 44 }}>
          <AgentIcon size={84} color={AGENT} glow={1.2} seed={23} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 308, height: 8, borderRadius: 4, background: "rgba(0,0,0,0.12)" }} />
      {stamp > 0 && (
        <div style={{ position: "absolute", left: 6, right: 6, top: 80, height: 78, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 56, fontWeight: 900, letterSpacing: 4, color: "#B3261E", border: "7px solid #B3261E", borderRadius: 12, background: "rgba(255,240,200,0.55)", transform: `rotate(-7deg) scale(${(2.2 - 1.2 * stamp).toFixed(3)})`, opacity: 0.2 + 0.8 * stamp }}>ADMIN</div>
      )}
      {shine > 0 && shine < 1 && <div style={{ position: "absolute", top: -60, bottom: -60, width: 90, left: -120 + (W + 240) * shine, transform: "rotate(18deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)" }} />}
    </div>
  );
};

/** placement: waiting in the intake slot, pulled in on "renewed", flying out of the front slot to "read-only" */
export const PowerPass: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f } = useScene();
  const enter = c.from - 6;
  if (f < enter) return null;
  const slotX = PM_SLOT.x + (PM_SLOT.w - W) / 2;
  const restY = PM.y - 170;
  const inStart = c.renewed - 14;
  const outStart = c.ro - 20;
  const clipIn = (el: React.ReactNode, y: number, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: PM.y + 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: slotX, top: y, ...extra }}>{el}</div>
    </div>
  );
  if (f < outStart) {
    if (f < inStart) {
      const p = arrive(f, enter, 18);
      const bob = Math.sin((f - enter) / 14) * 4;
      return clipIn(<Card c={c} />, restY - (1 - p) * 220 + bob, { filter: p < 0.85 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined });
    }
    const q = prog(f, inStart, 14, ease.in);
    return f < inStart + 15 ? clipIn(<Card c={c} />, restY + (H + 10) * q) : null;
  }
  const p = arrive(f, outStart, 20);
  const x0 = slotX;
  const y0 = PM.y + PM.h - 60;
  const x1 = 450 - W / 2;
  const y1 = 780;
  const s = 0.5 + 0.8 * p;
  const glowAdmin = f >= c.admin ? Math.sin(Math.min(Math.PI, ((f - c.admin) / 16) * Math.PI)) : 0;
  return (
    <div style={{ position: "absolute", left: x0 + (x1 - x0) * p, top: y0 + (y1 - y0) * p, transform: `scale(${(s + 0.06 * glowAdmin).toFixed(3)})`, transformOrigin: "50% 0", opacity: prog(f, outStart, 3, ease.linear) }}>
      <svg width={W} height={170} viewBox={`0 0 ${W} 170`} style={{ position: "absolute", left: 0, top: -160, overflow: "visible" }}>
        <defs>
          <linearGradient id="pwStrap" gradientUnits="userSpaceOnUse" x1="0" y1="118" x2="0" y2="50"><stop offset="0" stopColor={mix(f, c.admin - 2, 7, "#1E88E5", "#B3261E")} /><stop offset="1" stopColor={mix(f, c.admin - 2, 7, "#1E88E5", "#B3261E")} stopOpacity={0} /></linearGradient>
        </defs>
        <path d={`M${W / 2 - 14} 118 L${W / 2 - 60} 50 L${W / 2 - 40} 50 L${W / 2 + 2} 112 Z`} fill="url(#pwStrap)" />
        <path d={`M${W / 2 + 14} 118 L${W / 2 + 60} 50 L${W / 2 + 40} 50 L${W / 2 - 2} 112 Z`} fill="url(#pwStrap)" />
      </svg>
      <div style={{ position: "absolute", left: W / 2 - 16, top: -46, width: 32, height: 58, borderRadius: 8, background: "linear-gradient(90deg,#9AA1AC,#E5E7EB,#9AA1AC)" }} />
      <Card c={c} />
    </div>
  );
};

/** how much the machine steps back while the pass is shown in front */
export const powerDim = (f: number, c: PowerCues) => arrive(f, c.ro - 20, 20);
