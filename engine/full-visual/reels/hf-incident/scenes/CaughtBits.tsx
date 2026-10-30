// `caught`: Hugging Face's security card (a plain status card that becomes the alert), the cable from the swarm and
// the spark that cuts it, and the tear-off desk calendar. Facts: HF "The attack was initially surfaced through
// AI-assisted detection"; access cut July 13; OpenAI connected it July 20 (facts.md sections 2 and 4).
import React from "react";
import { blurIn, ease, mix, pop, prog, useScene } from "../../../src/engine";
import { HF, Logo, RED } from "./parts";

export const CAUGHT_CARD = { x: 90, y: 560, w: 720, h: 320 };

/** the card: "All systems normal" until `caught`, then the alert. A scan beam sweeps it on "AI tools" */
export const CaughtCard: React.FC<{ t0: number; ai: number; caught: number; access: number; ring: number }> = ({ t0, ai, caught, access, ring }) => {
  const { f } = useScene();
  const C = CAUGHT_CARD;
  const alert = f >= caught;
  const head = mix(f, caught, 5, "#F3F4F6", RED);
  const scanK = prog(f, ai, caught - ai, ease.inOut);
  const scanning = f >= ai && f < caught + 4;
  const scanY = (Math.abs(Math.sin(scanK * Math.PI * 1.5)) * (C.h - 20)).toFixed(1);
  const pulse = f >= ring ? 1 - prog(f, ring, 22, ease.out) : 0;
  const shake = f >= caught && f < caught + 10 ? Math.sin((f - caught) * 2.2) * (10 - (f - caught)) * 0.9 : 0;
  return (
    <div style={{ position: "absolute", left: C.x, top: C.y, width: C.w, height: C.h, transform: `translateX(${shake.toFixed(1)}px)`, ...blurIn(f, t0, { dur: 10, rise: -40 }) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "#FFFFFF", overflow: "hidden", boxShadow: `0 30px 70px rgba(20,24,40,0.14), 0 0 0 ${alert ? 3 : 1.5}px ${alert ? RED : "rgba(0,0,0,0.07)"}` }}>
        <div style={{ height: 110, background: head, display: "flex", alignItems: "center", gap: 20, padding: "0 30px" }}>
          <Logo name="huggingface" size={78} />
          <div style={{ flex: 1, fontFamily: "Inter", fontWeight: 800, fontSize: 40, color: alert ? "#FFFFFF" : "#0B0B0B" }}>Hugging Face</div>
          <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 32, color: alert ? "#FFFFFF" : "#6B7280" }}>{alert ? "July 13" : "Production"}</div>
        </div>
        <div style={{ padding: "28px 34px", fontFamily: "Inter" }}>
          {!alert ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 600, color: "#0B0B0B" }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "#34C759", boxShadow: `0 0 ${10 + 6 * Math.sin(f / 6)}px #34C759` }} />
              All systems normal
            </div>
          ) : (
            <div style={{ fontSize: 50, fontWeight: 800, color: "#0B0B0B", letterSpacing: -0.5, ...blurIn(f, caught, { dur: 6 }) }}>Intrusion detected</div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
            {alert && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderRadius: 999, background: "#FFF7D6", boxShadow: `inset 0 0 0 2px ${HF}`, fontSize: 32, fontWeight: 700, color: "#8A5A00", ...pop(f, caught + 4) }}>
                <Sparkle /> AI-assisted detection
              </div>
            )}
            {f >= access && (
              <div style={{ padding: "10px 20px", borderRadius: 999, background: "#111", fontSize: 32, fontWeight: 700, color: "#FFF", ...pop(f, access) }}>Access cut</div>
            )}
          </div>
        </div>
        {scanning && (
          <div style={{ position: "absolute", left: 0, right: 0, top: +scanY, height: 20, background: `linear-gradient(180deg, rgba(255,210,30,0) 0%, rgba(255,210,30,0.8) 50%, rgba(255,210,30,0) 100%)`, opacity: 1 - prog(f, caught, 4) }} />
        )}
      </div>
      {pulse > 0 && <div style={{ position: "absolute", inset: -10 - 30 * (1 - pulse), borderRadius: 40, boxShadow: `0 0 0 4px rgba(11,11,11,${(pulse * 0.8).toFixed(3)})` }} />}
    </div>
  );
};

const Sparkle: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 24 24"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill={HF} stroke="#8A5A00" strokeWidth={1.2} /></svg>
);

/** the cable from the swarm up into the card, with red pulses running up it until it is cut at `cut` */
export const CaughtCable: React.FC<{ t0: number; cut: number; fade: number; y0: number; y1: number }> = ({ t0, cut, fade, y0, y1 }) => {
  const { f } = useScene();
  const mid = (y0 + y1) / 2;
  const k = prog(f, cut, 12, ease.out);
  const up = -46 * k;
  const down = 60 * k;
  const o = (1 - prog(f, fade, 12)) * prog(f, t0, 8);
  const seg = (a: number, b: number, dy: number, key: string, capAt: number) => (
    <g key={key} transform={`translate(0 ${dy.toFixed(1)})`}>
      <path d={`M450 ${a} C 430 ${(a + b) / 2}, 470 ${(a + b) / 2}, 450 ${b}`} stroke="#23262E" strokeWidth={26} fill="none" strokeLinecap="butt" />
      <path d={`M444 ${a} C 424 ${(a + b) / 2}, 464 ${(a + b) / 2}, 444 ${b}`} stroke="rgba(255,255,255,0.18)" strokeWidth={5} fill="none" />
      {f >= cut && <circle cx={450} cy={capAt} r={11} fill="#C8742E" />}
    </g>
  );
  const pulses = f < cut ? Array.from({ length: 5 }, (_, i) => y1 - ((((f - t0) * 9 + i * 70) % (y1 - y0)))) : [];
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: o, overflow: "visible" }}>
      {f < cut ? seg(y0, y1, 0, "whole", 0) : [seg(y0, mid - 8, up, "top", mid - 8), seg(mid + 8, y1, down, "bottom", mid + 8)]}
      {pulses.map((y, i) => <rect key={i} x={442} y={y - 18} width={16} height={36} rx={8} fill={RED} style={{ filter: `drop-shadow(0 0 8px ${RED})` }} />)}
      <Spark x={450} y={mid} at={cut} />
    </svg>
  );
};

/** the spark where the cable parts: rays and a flash, over about 14 frames */
const Spark: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const { f } = useScene();
  if (f < at || f > at + 16) return null;
  const p = prog(f, at, 14, ease.out);
  const fade = 1 - prog(f, at + 4, 12, ease.linear);
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={20 + 50 * p} fill="rgba(255,220,90,0.55)" />
      <circle cx={x} cy={y} r={14 + 10 * p} fill="#FFFBE6" />
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        const r0 = 20 + 60 * p;
        const r1 = r0 + 30 + (i % 3) * 18;
        return <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={i % 2 ? "#FFB020" : "#FFE27A"} strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** the tear-off desk calendar: July 13, then seven pages flip off to land on 20 exactly on `week` */
export const CaughtCalendar: React.FC<{ x: number; y: number; at: number; week: number; later: number }> = ({ x, y, at, week, later }) => {
  const { f } = useScene();
  const step = 6;
  const start = week - 7 * step;
  const k = Math.max(0, Math.min(7, Math.floor((f - start) / step)));
  const inStep = f >= start && k < 7 ? prog(f, start + k * step, step, ease.in) : 0;
  const n = 13 + k;
  const page = (num: number, style?: React.CSSProperties) => (
    <div style={{ position: "absolute", left: 0, top: 70, width: 260, height: 210, background: "#FFFFFF", borderRadius: "0 0 22px 22px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 150, color: "#0B0B0B", letterSpacing: -4, transformOrigin: "50% 0%", boxShadow: "inset 0 1px 0 #E5E5E5", ...style }}>
      {num}
    </div>
  );
  const ring = prog(f, later, 12, ease.inOut);
  return (
    <div style={{ position: "absolute", left: x - 130, top: y, width: 260, height: 290, ...pop(f, at, { dur: 10 }) }}>
      <div style={{ position: "absolute", left: 6, top: 14, width: 260, height: 280, borderRadius: 24, background: "rgba(0,0,0,0.12)", filter: "blur(14px)", transform: "translateY(14px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 260, height: 280, borderRadius: 24, background: "#FFFFFF", overflow: "hidden", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.08)", perspective: 900 }}>
        <div style={{ height: 70, background: RED, color: "#FFF", fontFamily: "Inter", fontWeight: 800, fontSize: 36, letterSpacing: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>JULY</div>
        {page(k < 7 ? n + 1 : n)}
        {k < 7 && page(n, { transform: `rotateX(${(inStep * 100).toFixed(1)}deg)`, opacity: 1 - inStep * 0.6, boxShadow: `0 ${(inStep * 20).toFixed(0)}px 20px rgba(0,0,0,${(inStep * 0.25).toFixed(2)})` })}
      </div>
      {[36, 224].map((cx) => <div key={cx} style={{ position: "absolute", left: cx - 8, top: -14, width: 16, height: 40, borderRadius: 8, background: "#3A3F4A" }} />)}
      {f >= later && (
        <svg width={260} height={210} viewBox="0 0 260 210" style={{ position: "absolute", left: 0, top: 70, overflow: "visible" }}>
          <ellipse cx={130} cy={108} rx={112} ry={84} fill="none" stroke={RED} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-8 130 108)" />
        </svg>
      )}
    </div>
  );
};
