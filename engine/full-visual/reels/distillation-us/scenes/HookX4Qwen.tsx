// Hook X4, the vessel. The real Qwen mark stands empty (smoked, only its violet edge lit) until the stolen light
// pours in on "copy": it fills from the bottom, the true mark rising under a glowing wavy surface, the part below
// warmed by Claude's terracotta. On "models" it is full and blooms: a white-hot flash, a shock ring, and behind it a
// halo in the shape of Claude's own starburst, the stolen light now shining out of Qwen.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { CLAUDE, Logo, QWEN, asset } from "./parts";
import { T, QS, levelAt, qwenAt } from "./HookX4Geo";

const MASK = `url(${asset("logo-qwen.png")}) center / contain no-repeat`;

/** the wavy fill line as a clip polygon, in % of the mark box; 0 = empty (surface at the bottom), 1 = full */
function surface(level: number, f: number) {
  const top = 100 - level * 104;
  const amp = 2.2 * (1 - level * 0.7);
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = (i / 24) * 100;
    const y = top + amp * Math.sin(x * 0.11 + f * 0.32) + amp * 0.6 * Math.sin(x * 0.23 - f * 0.21);
    pts.push(`${x.toFixed(1)}% ${y.toFixed(2)}%`);
  }
  return { poly: `polygon(${pts.join(",")}, 100% 102%, 0% 102%)`, top };
}

const bloomAt = (t: T) => prog(t.f, t.models, 14, ease.back);

export const Vessel: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const q = qwenAt(t);
  const L = levelAt(t);
  const b = bloomAt(t);
  const sc = (0.86 + 0.14 * q.u) * (1 + 0.1 * b - 0.04 * prog(f, t.models + 12, 26, ease.inOut)) * (1 + 0.012 * Math.sin(f / 9) * b);
  const s = surface(L, f);
  const glow = b > 0 ? `drop-shadow(0 0 ${(20 + 30 * b).toFixed(0)}px ${CLAUDE}CC) drop-shadow(0 0 ${(40 * b).toFixed(0)}px ${QWEN}AA)` : `drop-shadow(0 0 ${(4 + 18 * L).toFixed(0)}px ${CLAUDE}${L > 0.1 ? "99" : "00"})`;
  return (
    <div style={{ position: "absolute", left: q.x - QS / 2, top: q.y - QS / 2, width: QS, height: QS, transform: `scale(${sc.toFixed(4)})`, filter: glow }}>
      <Logo name="qwen" size={QS} style={{ position: "absolute", inset: 0, filter: `brightness(0.2) saturate(0.6) drop-shadow(0 0 1.5px ${QWEN}) drop-shadow(0 0 8px ${QWEN}88)` }} />
      <div style={{ position: "absolute", inset: 0, clipPath: s.poly }}>
        <Logo name="qwen" size={QS} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, WebkitMask: MASK, mask: MASK, mixBlendMode: "screen", background: `linear-gradient(to top, ${CLAUDE}22 0%, ${CLAUDE}55 60%, #FFB793AA 100%)`, opacity: 0.9 - 0.45 * b }} />
      </div>
      {L > 0.01 && L < 0.995 && (
        <div style={{ position: "absolute", inset: 0, WebkitMask: MASK, mask: MASK }}>
          <div style={{ position: "absolute", left: 0, width: QS, top: `${(s.top - 2.5).toFixed(2)}%`, height: 16, background: "linear-gradient(to bottom, transparent, #FFF3EA 45%, #FFB08A 70%, transparent)", filter: "blur(2px)" }} />
        </div>
      )}
      {b > 0 && (
        <div style={{ position: "absolute", inset: 0, WebkitMask: MASK, mask: MASK, background: "#FFF6F0", opacity: 0.85 * (1 - prog(f, t.models, 16, ease.out)) }} />
      )}
    </div>
  );
};

/** behind the vessel: violet at rest, then the stolen light (Claude's starburst) opening out of it on "models" */
export const Halo: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const q = qwenAt(t);
  const L = levelAt(t);
  const b = bloomAt(t);
  const pool = 260 + 120 * L + 160 * b;
  const halo = QS * (1.05 + 0.55 * b);
  return (
    <>
      <div style={{ position: "absolute", left: q.x - pool, top: q.y - pool, width: pool * 2, height: pool * 2, borderRadius: "50%", background: `radial-gradient(circle, ${b > 0.3 ? CLAUDE : QWEN}${b > 0.3 ? "55" : "30"} 0%, ${QWEN}18 40%, transparent 68%)`, opacity: 0.6 + 0.4 * Math.max(L, b) }} />
      {b > 0 && (
        <div style={{ position: "absolute", left: q.x - halo / 2, top: q.y - halo / 2, width: halo, height: halo, opacity: (0.62 + 0.08 * Math.sin(f / 8)) * Math.min(1, b), transform: `rotate(${(f - t.models) * 0.5 - 20}deg)` }}>
          <Logo name="claude" size={halo} style={{ filter: `blur(${(8 - 5.5 * Math.min(1, b)).toFixed(1)}px) brightness(1.25) drop-shadow(0 0 26px ${CLAUDE})` }} />
        </div>
      )}
    </>
  );
};

/** the bloom's hit: a white flash and a shock ring racing out from the full vessel */
export const Bloom: React.FC<{ t: T }> = ({ t }) => {
  const k = t.f - t.models;
  if (k < 0 || k > 28) return null;
  const q = qwenAt(t);
  const fl = 1 - prog(t.f, t.models, 18, ease.out);
  const r = 80 + 300 * prog(t.f, t.models, 30, ease.outHard);
  return (
    <>
      <div style={{ position: "absolute", left: q.x - 380, top: q.y - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, #FFFFFF 0%, #FFE3D4 16%, ${CLAUDE}77 34%, transparent 62%)`, opacity: 0.9 * fl }} />
      <div style={{ position: "absolute", left: q.x - r, top: q.y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${(6 * (1 - k / 28)).toFixed(1)}px solid #FFD2BD`, opacity: 0.8 * (1 - k / 28), boxShadow: `0 0 30px ${CLAUDE}` }} />
    </>
  );
};
