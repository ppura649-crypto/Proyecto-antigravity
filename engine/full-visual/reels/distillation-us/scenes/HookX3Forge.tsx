// Hook X3, the forge itself: the bed of hot soft material, the Claude die that slams into it, the starburst imprint it
// leaves, and the violet metal that fills the imprint and cools. Everything here lives on the tilted bed (CSS 3D).
import React from "react";
import { Easing } from "remotion";
import { ease, prog } from "../../../src/engine";
import { Logo, QWEN, asset } from "./parts";
import { DS, Masked, T, heat, rand } from "./HookX3Space";

/** the die's height over the bed: already falling fast at f1 (gravity), a slam on "chinese", a small rebound, torn
 *  free and lifted on "ai" */
export const dieZ = (t: T, f: number) => {
  const fall = t.ch - (t.from + 1);
  if (f < t.ch) return 560 * ((t.ch - f) / fall) ** 1.4;
  const sink = -16 * prog(f, t.ch, 3, ease.out) + 7 * Math.sin(Math.PI * prog(f, t.ch + 3, 12, ease.linear)) * (1 - prog(f, t.ch + 3, 12, ease.linear));
  return sink + 1500 * prog(f, t.ai - 3, 34, ease.in);
};

/** how hot the bed is: a slow glow, the heat shock of the slam, and the violet pour */
export const bedHeat = (t: T, f: number) => 0.32 + 0.1 * Math.sin(f / 11) + 0.6 * Math.max(0, 1 - (f - t.ch) / 40) * (f >= t.ch ? 1 : 0);

export const Bed: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const k = bedHeat(t, f);
  const z = dieZ(t, f);
  const near = Math.max(0, Math.min(1, 1 - z / 700));
  const pour = prog(f, t.copy - 10, 10, ease.out) * (1 - 0.6 * prog(f, t.an, 40, ease.inOut));
  const shock = (d: number, i: number) => {
    const u = prog(f, t.ch + d, 30, ease.outHard);
    if (f < t.ch + d || u >= 1) return null;
    const r = 200 + 260 * u;
    return <div key={i} style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", boxShadow: `0 0 ${30 - 20 * u}px ${8 - 6 * u}px #FF8A3A, inset 0 0 40px #FFB86A`, opacity: (1 - u) * 0.9 }} />;
  };
  return (
    <>
      {/* the material: dark crust, hot underneath, fading into the dark all round */}
      <div style={{ position: "absolute", left: -900, top: -760, width: 1800, height: 1520, borderRadius: "50%", background: `radial-gradient(ellipse 50% 50% at 50% 50%, #3A1508 0%, #24100A 26%, #1A0C08B0 40%, #15100E50 50%, transparent 60%)` }} />
      <div style={{ position: "absolute", left: -700, top: -600, width: 1400, height: 1200, borderRadius: "50%", background: `radial-gradient(circle, #FF6A1F 0%, #C23A0E 22%, #5A1805 45%, transparent 70%)`, opacity: 0.55 * k }} />
      <Grain f={f} />
      {/* the die's shadow closing on its footprint as it falls, the lip of displaced material after the slam */}
      {f < t.ch + 2 && <div style={{ position: "absolute", left: -DS * (0.5 + z / 1400), top: -DS * (0.5 + z / 1400), width: DS * (1 + z / 700), height: DS * (1 + z / 700), borderRadius: "50%", background: "radial-gradient(circle, #000000E0 0%, #00000080 45%, transparent 70%)", opacity: 0.35 + 0.6 * near }} />}
      {f >= t.ch && <Lip t={t} />}
      {[0, 5].map(shock)}
      <div style={{ position: "absolute", left: -380, top: -380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${QWEN}CC 0%, ${QWEN}55 35%, transparent 70%)`, opacity: pour }} />
    </>
  );
};

/** crust grain and embers in the material, so it is a substance, not a gradient */
const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1600} height={1300} style={{ position: "absolute", left: -800, top: -650 }}>
    <defs>
      <filter id="x3grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.35" />
      </filter>
      <radialGradient id="x3grainfade">
        <stop offset="0.35" stopColor="#fff" />
        <stop offset="0.62" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <mask id="x3grainmask">
        <rect width={1600} height={1300} fill="url(#x3grainfade)" />
      </mask>
    </defs>
    <g mask="url(#x3grainmask)">
      <rect width={1600} height={1300} filter="url(#x3grain)" opacity={0.55} />
      {Array.from({ length: 140 }, (_, i) => {
        const a = rand(i, 61) * Math.PI * 2;
        const r = 170 + 360 * Math.sqrt(rand(i, 62));
        const fl = 0.5 + 0.5 * Math.sin(f / (4 + 6 * rand(i, 63)) + i);
        return <circle key={i} cx={800 + r * Math.cos(a)} cy={650 + r * Math.sin(a)} r={1.2 + 2.4 * rand(i, 64)} fill={rand(i, 65) > 0.7 ? "#FFD08A" : "#FF7A2A"} opacity={0.25 + 0.6 * fl * (1 - r / 800)} />;
      })}
    </g>
  </svg>
);

/** the material the die pushed aside: a hot lip that rises round the footprint and settles */
const Lip: React.FC<{ t: T }> = ({ t }) => {
  const u = prog(t.f, t.ch, 16, Easing.out(Easing.back(1.2)));
  const cool = prog(t.f, t.ch, 90, ease.out);
  const r = 185 + 45 * u;
  return (
    <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, transparent 62%, ${heat(0.72 - 0.35 * cool)} 72%, ${heat(0.4 - 0.2 * cool)}88 82%, transparent 100%)`, opacity: 0.9 * u }} />
  );
};

/** the starburst the die left: a glowing recess (its far wall lit, its floor darker), cooling after the slam */
export const Imprint: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  if (f < t.ch) return null;
  const cool = prog(f, t.ch, 110, ease.out);
  const h = 0.9 - 0.3 * cool + 0.04 * Math.sin(f / 6);
  const wall = `radial-gradient(circle, ${heat(h)} 0%, ${heat(h - 0.12)} 55%, ${heat(h - 0.3)} 100%)`;
  const floor = `radial-gradient(circle, ${heat(h - 0.3)} 0%, ${heat(h - 0.42)} 70%, #1A0804 100%)`;
  return (
    <div style={{ position: "absolute", transformStyle: "preserve-3d" }}>
      <Masked name="claude" size={DS * 1.04} bg={heat(h - 0.1)} style={{ filter: "blur(16px)", opacity: 0.9 }} />
      <Masked name="claude" size={DS} bg={wall} />
      <Masked name="claude" size={DS} bg={floor} extra={`url(${maskUrl()}) 0px 14px / 100% 100% no-repeat`} />
    </div>
  );
};
const maskUrl = () => asset("logo-claude.png");

/** the metal in the Claude shape: violet molten while it pours (a flowing sheen), then on "anthropic" the colour of
 *  real hot metal leaving it, edges first. `r` is how far the pour has spread from the centre */
export const MetalFace: React.FC<{ t: T; f: number; r?: number; name?: string }> = ({ t, f, r = 999, name = "claude" }) => {
  const reveal = r < 400 ? `radial-gradient(circle ${Math.max(1, r)}px at 50% 50%, #000 82%, transparent 100%)` : undefined;
  const molten = 1 - prog(f, t.an, 10, ease.inOut);
  const h = 1 - 0.95 * prog(f, t.an, t.mo + 40 - t.an, Easing.out(Easing.quad));
  const hc = Math.min(1, h + 0.14);
  const he = h - 0.34;
  const fx = 50 + 18 * Math.sin(f / 13);
  const fy = 50 + 14 * Math.cos(f / 17);
  const body = `radial-gradient(circle at 45% 40%, #8C88FF 0%, ${QWEN} 55%, #3A34B0 100%)`;
  const melt = `radial-gradient(circle at ${fx}% ${fy}%, #FFFFFF 0%, #EAE8FF 18%, transparent 42%), radial-gradient(circle, #F4F2FF 0%, #BDB9FF 45%, #7F7AFF 100%)`;
  const hot = `radial-gradient(circle, ${heat(hc)} 0%, ${heat((hc + he) / 2)} 50%, ${heat(he)} 100%)`;
  return (
    <>
      <Masked name={name} size={DS} bg={body} extra={reveal} />
      <Masked name={name} size={DS} bg={hot} extra={reveal} style={{ opacity: Math.min(1, 1.3 * h + 0.1) * (1 - molten) }} />
      <Masked name={name} size={DS} bg={melt} extra={reveal} style={{ opacity: molten }} />
    </>
  );
};

/** the fill: the pour spreading through the imprint from the centre on "copy" */
export const Fill: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  if (f < t.copy || f >= t.mo - 6) return null;
  const r = 20 + 240 * prog(f, t.copy, 26, Easing.out(Easing.quad));
  const glow = 1 - 0.7 * prog(f, t.an, 40, ease.out);
  return (
    <div style={{ position: "absolute", transform: "translateZ(1px)", transformStyle: "preserve-3d" }}>
      <Masked name="claude" size={DS * 1.08} bg={QWEN} style={{ filter: "blur(22px)", opacity: 0.8 * glow }} extra={`radial-gradient(circle ${r + 40}px at 50% 50%, #000 60%, transparent 100%)`} />
      <MetalFace t={t} f={f} r={r} />
    </div>
  );
};

/** the die: the real Claude mark as a thick block of metal, its underside lit by the bed as it closes in */
export const Die: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const z = dieZ(t, f);
  if (z > 1450) return null;
  const pre = f < t.ch;
  const spin = pre ? 7 * ((t.ch - f) / (t.ch - t.from)) : 0;
  const lift = prog(f, t.ai - 3, 34, ease.in);
  const glowUnder = pre ? Math.max(0, 1 - z / 500) : 1 - 0.6 * prog(f, t.ch, 40, ease.out);
  const layers = 11;
  const block = (zz: number, ghost: number, key: string) => (
    <div key={key} style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateZ(${zz.toFixed(1)}px) rotateX(${(-spin - 12 * lift).toFixed(2)}deg) rotateZ(${(spin * 0.6 + 6 * lift).toFixed(2)}deg)`, opacity: ghost }}>
      {ghost === 1 &&
        Array.from({ length: layers }, (_, i) => {
          const u = i / (layers - 1);
          const c = u < 0.35 ? heat(0.2 + 0.55 * glowUnder * (1 - u / 0.35)) : `hsl(15, 45%, ${10 + 16 * u}%)`;
          return <Masked key={i} name="claude" size={DS} bg={c} style={{ transform: `translateZ(${i * 4}px)` }} />;
        })}
      <div style={{ position: "absolute", left: -DS / 2, top: -DS / 2, transform: `translateZ(${layers * 4}px)` }}>
        <Logo name="claude" size={DS} />
      </div>
      {ghost === 1 && <Masked name="claude" size={DS} bg={`linear-gradient(${120 + (f % 360) * 0.3}deg, transparent 30%, #FFFFFF55 46%, #FFE9D8AA 50%, #FFFFFF44 54%, transparent 70%)`} style={{ transform: `translateZ(${layers * 4 + 1}px)` }} />}
    </div>
  );
  const out = [block(z, 1, "m")];
  if (pre) out.unshift(block(dieZ(t, f - 1.2), 0.22, "g1"), block(dieZ(t, f - 2.4), 0.1, "g2"));
  return <>{out}</>;
};

