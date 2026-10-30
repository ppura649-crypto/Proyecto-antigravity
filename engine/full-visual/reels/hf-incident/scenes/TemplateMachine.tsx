// The machine behind the form in `template`: a graphite cabinet with a porthole of gears, a column of lamps and a
// reader slot. Idle it barely turns; on "code" it obeys: the gears spin up, the lamps go red one after another and a
// small "running" pill starts to pulse. No screen, no text on it but plain words.
import React from "react";
import { ease, mix, pop, prog, useScene } from "../../../src/engine";
import { RED } from "./parts";

export const MACHINE = { left: 180, top: 560, width: 540, height: 440 };

export type TemplateCues = { second: number; slip: number; commands: number; template: number; server: number; ran: number; code: number };

/** degrees a gear has turned: slow idle, then a 24-frame spin-up on "code" */
export const templateGearAngle = (f: number, code: number) => {
  const t = f - code;
  const R = 24;
  const extra = t <= 0 ? 0 : t < R ? (t * t) / (2 * R) : R / 2 + (t - R);
  return f * 0.35 + extra * 7;
};

const Gear: React.FC<{ cx: number; cy: number; r: number; teeth: number; angle: number; rim: string; face: string }> = ({ cx, cy, r, teeth, angle, rim, face }) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.84;
    const a2 = a + Math.PI / (teeth * 2);
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`, `${(Math.cos(a2) * rr).toFixed(1)},${(Math.sin(a2) * rr).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle.toFixed(2)})`}>
      <polygon points={pts.join(" ")} fill={face} stroke={rim} strokeWidth={3} strokeLinejoin="round" />
      <circle r={r * 0.55} fill="none" stroke={rim} strokeWidth={2} opacity={0.6} />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} cx={Math.cos((k / 5) * Math.PI * 2) * r * 0.36} cy={Math.sin((k / 5) * Math.PI * 2) * r * 0.36} r={r * 0.09} fill="#0C0D0F" />
      ))}
      <circle r={r * 0.14} fill={rim} />
    </g>
  );
};

/** the porthole: three meshing gears behind glass */
const Porthole: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f } = useScene();
  const a = templateGearAngle(f, c.code);
  const rim = mix(f, c.code, 10, "#8A9099", RED);
  const glow = prog(f, c.code, 14);
  const D = 290;
  return (
    <div style={{ position: "absolute", left: 40, top: 96, width: D, height: D, borderRadius: "50%", background: "radial-gradient(circle at 50% 45%, #23262B, #08090A 72%)", boxShadow: `inset 0 0 0 10px #3A3E45, inset 0 0 0 13px #1A1C1F, inset 0 10px 30px rgba(0,0,0,0.8), 0 0 ${(40 * glow).toFixed(0)}px rgba(255,59,48,${(0.35 * glow).toFixed(2)})`, overflow: "hidden" }}>
      <svg width={D} height={D} viewBox="0 0 290 290" style={{ position: "absolute", inset: 0 }}>
        <Gear cx={118} cy={128} r={78} teeth={12} angle={a} rim={rim} face="#2A2D33" />
        <Gear cx={206} cy={196} r={50} teeth={8} angle={-a * 1.5 + 11} rim={rim} face="#33373E" />
        <Gear cx={200} cy={70} r={38} teeth={7} angle={-a * 2 + 5} rim={rim} face="#33373E" />
      </svg>
      {/* red light filling the chamber once it runs, and the glass sheen on top */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 45% 50%, rgba(255,59,48,${(0.28 * glow * (0.8 + 0.2 * Math.sin(f / 4))).toFixed(3)}), transparent 70%)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.16), transparent 42%)" }} />
    </div>
  );
};

/** four lamps, dim green while idle, red one after another on "code" */
const Lamps: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f } = useScene();
  return (
    <div style={{ position: "absolute", left: 376, top: 104, display: "flex", flexDirection: "column", gap: 22 }}>
      {[0, 1, 2, 3].map((k) => {
        const at = c.code + k * 4;
        const lit = prog(f, at, 5);
        const col = mix(f, at, 5, "#2F6B45", RED);
        const idle = 0.55 + 0.25 * Math.sin(f / 11 + k * 1.7);
        const flick = lit > 0 ? 0.85 + 0.15 * Math.sin(f / 2.3 + k) : idle;
        return (
          <div key={k} style={{ width: 118, height: 40, borderRadius: 20, background: "#0E0F11", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", paddingLeft: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: col, opacity: flick, boxShadow: `0 0 ${(6 + 22 * lit).toFixed(0)}px ${col}` }} />
            <div style={{ marginLeft: 12, flex: 1, height: 6, marginRight: 14, borderRadius: 3, background: col, opacity: 0.25 + 0.5 * lit }} />
          </div>
        );
      })}
    </div>
  );
};

/** the "running" pill under the lamps */
const Running: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const at = c.code + 10;
  if (f < at) return null;
  const beat = 0.5 + 0.5 * Math.sin((f - at) / 5);
  return (
    <div style={{ position: "absolute", left: 360, top: 352, height: 56, padding: "0 22px 0 16px", borderRadius: 28, background: "rgba(255,59,48,0.14)", boxShadow: `inset 0 0 0 2px ${RED}`, display: "flex", alignItems: "center", gap: 12, fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#FFFFFF", transformOrigin: "left center", ...pop(f, at) }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: RED, boxShadow: `0 0 ${(8 + 12 * beat).toFixed(0)}px ${RED}`, opacity: 0.6 + 0.4 * beat }} />
      running
    </div>
  );
};

export const TemplateMachine: React.FC<{ c: TemplateCues; enter: number }> = ({ c, enter }) => {
  const { f, theme } = useScene();
  const p = prog(f, enter, 16, ease.out);
  const shake = f > c.code ? Math.sin(f * 2.1) * 1.4 * prog(f, c.code, 8) : 0;
  const hum = Math.sin(f / 13) * 2;
  return (
    <div style={{ position: "absolute", ...MACHINE, opacity: p, transform: `translate(${shake.toFixed(2)}px, ${((1 - p) * 60 + hum).toFixed(2)}px)`, filter: p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "linear-gradient(180deg, #3A3E45 0%, #24272C 40%, #17191C 100%)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), inset 0 -8px 20px rgba(0,0,0,0.5), 0 40px 70px -20px rgba(0,0,0,0.45), 0 10px 20px rgba(0,0,0,0.18)" }} />
      <div style={{ position: "absolute", left: 40, top: 30, width: 290, height: 40, borderRadius: 8, background: "linear-gradient(180deg, #C9CDD3, #9197A0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 26, fontWeight: 800, letterSpacing: 6, color: "#2A2D33" }}>
        SERVER
      </div>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <div key={k} style={{ position: "absolute", left: 380 + k * 20, top: 44, width: 8, height: 14, borderRadius: 4, background: "#0C0D0F" }} />
      ))}
      <Porthole c={c} />
      <Lamps c={c} />
      <Running c={c} />
      {/* the reader slot along the bottom edge: where the slip is read */}
      <div style={{ position: "absolute", left: 150, right: 150, bottom: 18, height: 14, borderRadius: 7, background: "#050506", boxShadow: `0 0 ${(18 * prog(f, c.server, 6)).toFixed(0)}px rgba(255,59,48,0.9), inset 0 2px 4px rgba(0,0,0,0.9)` }} />
    </div>
  );
};
