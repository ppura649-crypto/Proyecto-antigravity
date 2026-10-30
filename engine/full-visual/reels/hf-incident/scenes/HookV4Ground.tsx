// HookV4's battlefield floor and the near side: a dark map plane ruled in perspective, a scan line sweeping toward
// the fortress, the seven marching lanes lit while the army pours, pools of light under the source and the fortress;
// then the real OpenAI mark standing at the near edge as the gate the agents pour from, and the count beside it.
import React from "react";
import { interpolateColors } from "remotion";
import { ease, prog } from "../../../src/engine/moves";
import { AGENT, Logo, RED } from "./parts";
import { arcPts, FORT, HY, laneX, N, pathOf, proj, SRC, type P, type T4 } from "./HookV4World";

const line = (a: P, b: P) => `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;

/** the ruled plane: depth lines fade toward the horizon, the scan line rolls away from the camera */
const Grid: React.FC<{ f: number; T: T4 }> = ({ f, T }) => {
  const hot = prog(f, T.e, T.h - T.e, ease.linear);
  const ink = interpolateColors(hot, [0, 1], [AGENT, RED]);
  const rows: React.ReactNode[] = [];
  for (let d = 3.5; d < 34; d += 0.5) {
    const a = proj(-30, d);
    const b = proj(30, d);
    rows.push(<path key={`r${d}`} d={line(a, b)} stroke={ink} strokeWidth={1.2} opacity={0.2 * Math.pow(4 / d, 1.3)} />);
  }
  for (let X = -18; X <= 18; X += 1.2) {
    rows.push(<path key={`c${X}`} d={line(proj(X, 3.3), proj(X, 40))} stroke={ink} strokeWidth={1.1} opacity={0.11} />);
  }
  const scanD = 4 + ((f * 0.1) % 10);
  const scan = [proj(-30, scanD), proj(30, scanD)];
  return (
    <g>
      {rows}
      <path d={line(scan[0], scan[1])} stroke={ink} strokeWidth={3 * scan[0].s + 1} opacity={0.5 * Math.pow(4 / scanD, 0.8)} filter="url(#v4g)" />
    </g>
  );
};

/** the seven lanes the columns march up, bright while the army pours out */
const Lanes: React.FC<{ f: number; T: T4 }> = ({ f, T }) => {
  const o = 0.12 + 0.5 * (1 - prog(f, T.spawnEnd + 6, 30, ease.inOut));
  const out: React.ReactNode[] = [];
  for (let l = 0; l < 7; l++) {
    const pts: P[] = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const m = 1 - t;
      const X = 3 * m * m * t * laneX(l) * 0.2 + 3 * m * t * t * laneX(l) + t * t * t * laneX(l);
      const d = m * m * m * SRC.d + 3 * m * m * t * 4.35 + 3 * m * t * t * 6.2 + t * t * t * 7.0;
      pts.push(proj(X, d));
    }
    out.push(<path key={l} d={pathOf(pts)} fill="none" stroke={AGENT} strokeWidth={9} strokeLinecap="round" opacity={o * 0.55} filter="url(#v4g)" />);
    out.push(<path key={`k${l}`} d={pathOf(pts)} fill="none" stroke="#CFF1FF" strokeWidth={1.6} opacity={o} />);
  }
  return <g>{out}</g>;
};

export const Ground: React.FC<{ f: number; T: T4; light: number; burst: number }> = ({ f, T, light, burst }) => {
  const plane = [proj(-40, 3.3), proj(40, 3.3), proj(40, 60), proj(-40, 60)];
  const src = proj(0, SRC.d);
  const fort = proj(0, FORT.d);
  const oWave = prog(f, T.o, 34, ease.out);
  const ring = (R: number, dC: number) => {
    const pts: P[] = [];
    for (let i = 0; i <= 64; i++) pts.push(proj(Math.cos((i / 64) * Math.PI * 2) * R, dC + Math.sin((i / 64) * Math.PI * 2) * R));
    return pathOf(pts, true);
  };
  return (
    <>
      <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="v4plane" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#1A1E25" />
            <stop offset="0.7" stopColor="#0E1014" />
            <stop offset="1" stopColor="#0B0C0F" />
          </linearGradient>
          <filter id="v4g" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <path d={pathOf(plane, true)} fill="url(#v4plane)" opacity={0.5} />
        <Grid f={f} T={T} />
        <Lanes f={f} T={T} />
        {f >= T.o && oWave < 1 && <path d={pathOf(arcPts(0.6 + 7 * oWave, SRC.d, 0, 0, Math.PI))} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.7 * (1 - oWave)} filter="url(#v4g)" />}
        {f < 40 && <path d={pathOf(arcPts(0.5 + 3.5 * prog(f, 0, 40, ease.out), SRC.d, 0, 0, Math.PI))} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.8 * (1 - prog(f, 0, 40))} filter="url(#v4g)" />}
        {burst > 0 && burst < 1 && <path d={ring(FORT.R + 11 * burst, FORT.d)} fill="none" stroke="#FFF3C4" strokeWidth={10 * (1 - burst) + 2} opacity={1 - burst} filter="url(#v4g)" />}
      </svg>
      <div style={{ position: "absolute", left: 0, top: HY - 70, width: 900, height: 140, background: `radial-gradient(50% 50% at 50% 50%, rgba(255,210,30,${(0.1 + 0.25 * light).toFixed(3)}), transparent 70%)` }} />
      <div style={{ position: "absolute", left: fort.x - 300, top: fort.y - 95, width: 600, height: 190, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,${burst > 0 ? 240 : 210},${burst > 0 ? 170 : 30},${(0.12 + 0.35 * light).toFixed(3)}), transparent)` }} />
      <div style={{ position: "absolute", left: src.x - 260, top: src.y - 70, width: 520, height: 140, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(200,236,255,0.30), transparent)" }} />
    </>
  );
};

/** the real OpenAI mark as the gate: flashes open at frame 0, pulses as each wave leaves, pulses again on "OpenAI" */
export const Source: React.FC<{ f: number; T: T4 }> = ({ f, T }) => {
  const size = 170;
  const base = proj(0, SRC.d);
  const open = prog(f, -6, 12, ease.back);
  const pour = f < T.spawnEnd ? 0.5 + 0.5 * Math.sin(f * 0.9) : 0;
  const pulse = Math.exp(-((f - T.o - 3) ** 2) / 30);
  const sc = 0.6 + 0.4 * open + 0.1 * pulse;
  const glow = 18 + 22 * pour + 40 * pulse;
  return (
    <div style={{ position: "absolute", left: base.x - size / 2, top: base.y - size - 6, width: size, height: size, transform: `scale(${sc.toFixed(4)})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", inset: -60, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(200,236,255,${(0.35 + 0.25 * pour + 0.4 * pulse).toFixed(3)}), transparent)` }} />
      <Logo name="openai" size={size} invert style={{ filter: `invert(1) drop-shadow(0 0 ${glow.toFixed(1)}px rgba(190,235,255,0.9))` }} />
    </div>
  );
};

/** the count racing with the pour, exact on "700", red with the swarm on "end up" */
export const Counter: React.FC<{ f: number; T: T4; n: number; font: string }> = ({ f, T, n, font }) => {
  const land = f >= T.spawnEnd + 1 ? 1 + 0.14 * Math.exp(-((f - T.spawnEnd - 4) ** 2) / 18) : 1;
  const col = interpolateColors(prog(f, T.e, 12, ease.linear), [0, 1], ["#FFFFFF", RED]);
  const lab = interpolateColors(prog(f, T.e, 12, ease.linear), [0, 1], [AGENT, RED]);
  const src = proj(0, SRC.d);
  return (
    <div style={{ position: "absolute", left: 610, top: src.y - 150, width: 250, opacity: prog(f, -6, 8, ease.linear) }}>
      <div style={{ fontFamily: font, fontSize: 92, fontWeight: 800, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: -2, transform: `scale(${land.toFixed(4)})`, transformOrigin: "0% 100%", textShadow: `0 0 30px ${lab}88` }}>
        {Math.min(N, n)}
      </div>
      <div style={{ fontFamily: font, fontSize: 32, fontWeight: 700, letterSpacing: 5, color: lab, marginTop: 6 }}>AGENTS</div>
    </div>
  );
};
