// Hook X1, the two real marks. Claude's is huge, lit from inside and turning slowly in 3D from frame 0; on "anthropic"
// it is drained: its rays literally thin (an SVG erode on the real mark) and its light dims and flickers. Qwen's is
// built out of the stolen light: points sampled from the real mark light up where the river lands, white-hot, cooling
// through Claude's terracotta to Qwen's own colours, then on "models" the real mark ignites whole over them.
import React from "react";
import { Img } from "remotion";
import { ease, prog } from "../../../src/engine";
import { CLAUDE, QWEN, asset } from "./parts";
import { QPTS } from "./HookX1Points";
import { BOX, MS, Q, T, camAt, qPoint, revealAt } from "./HookX1World";

export const drainAt = (t: T) => prog(t.f, t.anth - 4, 34, ease.out);
const lightOf = (t: T) => 1 - 0.55 * drainAt(t) - 0.06 * prog(t.f, t.copy, 20, ease.out);

/** the glow the mark casts into the dark: breathing, flaring on every beat, shrinking as it is drained */
export const Halo: React.FC<{ t: T }> = ({ t }) => {
  const g = camAt(t, t.f);
  const L = lightOf(t);
  const beat = Math.max(0, Math.sin(Math.PI * prog(t.f, t.copy - 2, 16, ease.linear))) + 0.5 * Math.max(0, Math.sin(Math.PI * prog(t.f, t.co - 2, 16, ease.linear)));
  const r = MS * g.w * (1.1 + 0.08 * Math.sin(t.f / 9) + 0.25 * beat) * (0.7 + 0.3 * L);
  return (
    <div style={{ position: "absolute", left: g.cx - r, top: g.cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${CLAUDE}${L > 0.7 ? "88" : "55"} 0%, ${CLAUDE}33 30%, ${CLAUDE}0D 55%, transparent 72%)`, opacity: Math.min(1, 0.55 + 0.45 * L + 0.3 * beat) }} />
  );
};

/** frame 0 already has an event: a pulse of Claude's light leaving the mark */
export const Pulse: React.FC<{ t: T }> = ({ t }) => {
  const g = camAt(t, t.f);
  const u = prog(t.f, -6, 44, ease.outHard);
  if (u >= 1) return null;
  const r = 150 + 520 * u;
  return <div style={{ position: "absolute", left: g.cx - r, top: g.cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${(9 * (1 - u)).toFixed(1)}px solid #FFD9C6`, opacity: 1 - u, boxShadow: `0 0 50px ${CLAUDE}, inset 0 0 50px ${CLAUDE}88` }} />;
};

export const ClaudeMark: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const g = camAt(t, f);
  const size = MS * g.w;
  const dr = drainAt(t);
  const erode = 0.5 * prog(f, t.copy, 30, ease.out) + 2.4 * dr;
  const flick = dr > 0.05 ? 1 - 0.18 * dr * Math.max(0, Math.sin(f * 1.7) * Math.sin(f * 0.53)) : 1;
  const bright = (1.08 - 0.5 * dr) * flick;
  const sat = 1 - 0.45 * dr;
  const rz = 10 + f * 0.1 + 120 * (1 - Math.exp(-(f + 6) / 22));
  const ry = 16 * Math.sin(f / 46);
  const rx = 9 * Math.sin(f / 61 + 1);
  const sweep = ((f + 40) % 110) / 110;
  const mask = `url(${asset("logo-claude.png")}) center / contain no-repeat`;
  const glow = (26 + 30 * (1 - dr)) * flick;
  return (
    <div style={{ position: "absolute", left: g.cx - size / 2, top: g.cy - size / 2, width: size, height: size, perspective: 1100 }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`, filter: `drop-shadow(0 0 ${glow.toFixed(0)}px ${CLAUDE}${dr > 0.5 ? "88" : "DD"})` }}>
        <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <filter id="x1drain" x="-10%" y="-10%" width="120%" height="120%">
              {erode > 0.05 && <feMorphology operator="erode" radius={erode.toFixed(2)} />}
              <feColorMatrix type="saturate" values={sat.toFixed(3)} />
              <feComponentTransfer>
                <feFuncR type="linear" slope={bright.toFixed(3)} />
                <feFuncG type="linear" slope={bright.toFixed(3)} />
                <feFuncB type="linear" slope={bright.toFixed(3)} />
              </feComponentTransfer>
            </filter>
          </defs>
          <image href={asset("logo-claude.png")} width={size} height={size} filter="url(#x1drain)" />
        </svg>
        {dr < 0.6 && (
          <div style={{ position: "absolute", inset: 0, WebkitMask: mask, mask, opacity: 0.55 * (1 - dr / 0.6), background: `linear-gradient(120deg, transparent ${-40 + 180 * sweep}%, #FFF3EC ${-22 + 180 * sweep}%, transparent ${-4 + 180 * sweep}%)` }} />
        )}
      </div>
    </div>
  );
};

/** one river: a soft band of light from Claude's side, over the arc, into Qwen */
export const Ribbon: React.FC<{ t: T }> = ({ t }) => {
  const k = prog(t.f, t.copy + 4, 20, ease.out);
  if (k <= 0) return null;
  const g = camAt(t, t.f);
  const a = { x: g.cx + 120 * g.w, y: g.cy - 60 };
  const c = { x: g.cx + 250 * g.w, y: g.cy - 190 };
  const d = { x: Q.x - 40, y: Q.y - 20 };
  const path = `M${a.x} ${a.y} Q${c.x} ${c.y} ${d.x} ${d.y}`;
  const pulse = 0.85 + 0.15 * Math.sin(t.f / 5);
  return (
    <svg width={BOX.w} height={BOX.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "blur(16px)" }}>
      <defs>
        <linearGradient id="x1rib" gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={d.x} y2={d.y}>
          <stop offset="0" stopColor={CLAUDE} />
          <stop offset="0.7" stopColor={CLAUDE} />
          <stop offset="1" stopColor={QWEN} />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#x1rib)" strokeWidth={46} strokeLinecap="round" opacity={0.42 * k * pulse} />
    </svg>
  );
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, u: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(",")})`;
};

/** Qwen, assembled out of the stolen light, then igniting whole on "models" */
export const QwenMark: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const ig = prog(f, t.models - 1, 16, ease.back);
  const flash = f >= t.models - 1 ? 1 - prog(f, t.models - 1, 22, ease.out) : 0;
  const ptsO = 1 - prog(f, t.models - 1, 9, ease.out);
  const built = QPTS.filter((_, j) => f >= revealAt(t, j)).length / QPTS.length;
  const hum = 0.9 + 0.1 * Math.sin(f / 7);
  const bloomR = Q.size * (0.5 + 0.55 * built + 0.5 * ig) * (1 + 0.6 * flash);
  return (
    <>
      <div style={{ position: "absolute", left: Q.x - bloomR, top: Q.y - bloomR, width: bloomR * 2, height: bloomR * 2, borderRadius: "50%", background: `radial-gradient(circle, ${flash > 0.3 ? "#FFFFFF" : QWEN}${ig > 0 ? "AA" : "44"} 0%, ${QWEN}33 32%, transparent 70%)`, opacity: built > 0 ? hum : 0 }} />
      {ig > 0 && (
        <div style={{ position: "absolute", left: Q.x - Q.size / 2, top: Q.y - Q.size / 2, width: Q.size, height: Q.size, opacity: prog(f, t.models - 1, 5, ease.linear), transform: `scale(${(0.86 + 0.14 * ig).toFixed(3)})`, filter: `brightness(${(1 + 1.6 * flash).toFixed(2)}) drop-shadow(0 0 ${(30 + 40 * flash) * hum}px ${QWEN})` }}>
          <Img src={asset("logo-qwen.png")} style={{ width: Q.size, height: Q.size, display: "block" }} />
        </div>
      )}
      {ptsO > 0 && (
        <svg width={BOX.w} height={BOX.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ptsO, filter: `drop-shadow(0 0 6px ${CLAUDE})` }}>
          {QPTS.map((p, j) => {
            const r = revealAt(t, j);
            if (f < r) return null;
            const age = f - r;
            const col = age < 6 ? mixHex("#FFFFFF", CLAUDE, age / 6) : mixHex(CLAUDE, p[2], Math.min(1, (age - 6) / 16));
            const q = qPoint(j);
            return <circle key={j} cx={q.x} cy={q.y} r={3.9 + 3 * Math.max(0, 1 - age / 8)} fill={col} />;
          })}
        </svg>
      )}
    </>
  );
};

/** the shock ring as Qwen ignites */
export const Ignite: React.FC<{ t: T }> = ({ t }) => {
  const k = t.f - t.models;
  if (k < -1 || k > 40) return null;
  const u = prog(t.f, t.models - 1, 34, ease.outHard);
  const r = 90 + 330 * u;
  return <div style={{ position: "absolute", left: Q.x - r, top: Q.y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${(10 * (1 - u)).toFixed(1)}px solid #DCD9FF`, opacity: 1 - u, boxShadow: `0 0 40px ${QWEN}` }} />;
};
