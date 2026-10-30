// `out`: the package server as a tower (HANDOFF.server box, the same box `locker` ends on), its "packages only" sign,
// the single cable to a globe that lights on "online", and the sandboxed swarm at its foot passing a note up on "asked".
import React from "react";
import { arrive, draw, ease, mix, prog, useScene } from "../../../src/engine";
import { Agent, HANDOFF, RED, rand } from "./parts";

export type OutCues = { from: number; out: number; server: number; online: number; packages: number; asked: number; anything: number; window: number; to: number };

const S = HANDOFF.server;
export const OUT_GLOBE = { x: 770, y: 668, r: 58 };
/** the small window on the tower's face, column coords */
export const OUT_WIN = { x: S.left + 105, y: S.top + 78, w: 90, h: 90 };
/** the cable, globe to window: a quadratic curve */
export const OUT_CABLE = { p0: { x: OUT_GLOBE.x - 20, y: OUT_GLOBE.y + 50 }, c: { x: 740, y: 860 }, p2: { x: OUT_WIN.x + OUT_WIN.w + 6, y: OUT_WIN.y + 46 } };
export const outCableAt = (t: number) => {
  const { p0, c, p2 } = OUT_CABLE;
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y };
};

/** 0 while the scene lives, 1 once the window has taken over the frame */
export const outWide = (f: number, c: OutCues) => arrive(f, c.window - 18, 18);

export const OutTower: React.FC<{ c: OutCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const wide = outWide(f, c);
  const flash = f >= c.server ? 1 - prog(f, c.server, 16, ease.out) : 0;
  return (
    <div style={{ position: "absolute", left: S.left, top: S.top, width: S.width, height: S.height, opacity: 1 - 0.7 * wide }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "linear-gradient(90deg,#1B1F26 0%,#2C323C 45%,#20242B 100%)", boxShadow: "inset 0 0 0 2px #3B424E, inset 0 2px 0 #5A6372, 0 30px 60px rgba(0,0,0,0.6), 0 0 80px rgba(90,200,250,0.06)" }} />
      <div style={{ position: "absolute", left: 20, right: 20, top: -44, height: 40, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "0 16px", borderRadius: 8, background: mix(f, c.server, 2, "#2A303A", "#2A303A"), boxShadow: `inset 0 0 0 2px #4A5363, 0 0 ${(24 * flash).toFixed(1)}px rgba(255,255,255,${(0.7 * flash).toFixed(2)})`, fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: flash > 0 ? "#FFFFFF" : "#C9CED6", lineHeight: "40px", whiteSpace: "nowrap" }}>package server</div>
      </div>
      {Array.from({ length: 6 }, (_, r) => (
        <div key={r} style={{ position: "absolute", left: 26, right: 26, top: 240 + r * 30, height: 22, borderRadius: 5, background: "#14171C", boxShadow: "inset 0 1px 0 #0A0C0F, 0 1px 0 #39404B" }}>
          {Array.from({ length: 4 }, (_, k) => {
            const on = rand(r * 4 + k + Math.floor((f + r * 7) / (9 + k * 3)), 13) > 0.45;
            return <div key={k} style={{ position: "absolute", right: 12 + k * 18, top: 7, width: 8, height: 8, borderRadius: 4, background: on ? (k === 0 ? "#34C759" : "#5AC8FA") : "#2A2F37", boxShadow: on ? `0 0 8px ${k === 0 ? "#34C759" : "#5AC8FA"}` : undefined }} />;
          })}
          <div style={{ position: "absolute", left: 12, top: 9, width: 90, height: 4, borderRadius: 2, background: "#2E343E" }} />
        </div>
      ))}
    </div>
  );
};

/** "packages only": a small enamel sign under the window; on "anything" one screw lets go and it swings down */
export const OutSign: React.FC<{ c: OutCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const wide = outWide(f, c);
  if (f < c.online - 2 || wide > 0.99) return null;
  const drop = f >= c.anything ? arrive(f, c.anything, 20) : 0;
  const swing = drop * 58 + (f >= c.anything ? Math.sin((f - c.anything) / 5) * 8 * (1 - prog(f, c.anything, 50, ease.linear)) : 0);
  return (
    <div style={{ position: "absolute", left: S.left + 20, top: OUT_WIN.y + OUT_WIN.h + 18, width: 260, height: 50, transformOrigin: "14px 14px", transform: `rotate(${swing.toFixed(2)}deg)`, opacity: (1 - wide) * prog(f, c.online - 2, 3, ease.linear), ...(f < c.online + 6 ? { filter: `blur(${((1 - prog(f, c.online - 2, 8)) * 10).toFixed(1)}px)` } : {}) }}>
      <div style={{ width: 260, height: 50, borderRadius: 8, background: "linear-gradient(180deg,#FFD84A,#F5B60A)", boxShadow: "0 6px 14px rgba(0,0,0,0.5), inset 0 0 0 3px #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#1A1A1A", whiteSpace: "nowrap" }}>packages only</div>
      {[14, 246].map((x) => <div key={x} style={{ position: "absolute", left: x - 5, top: 9, width: 10, height: 10, borderRadius: 5, background: "#6B6B6B" }} />)}
    </div>
  );
};

/** the one cable and the globe it reaches: dark until "online", then lit, with light running along it */
export const OutCable: React.FC<{ c: OutCues }> = ({ c }) => {
  const { f } = useScene();
  const wide = outWide(f, c);
  const lit = prog(f, c.online - 4, 10, ease.out);
  const { p0, c: k, p2 } = OUT_CABLE;
  const d = `M${p0.x} ${p0.y} Q${k.x} ${k.y} ${p2.x} ${p2.y}`;
  const flow = ((f - c.online) / 30) % 1;
  const G = OUT_GLOBE;
  return (
    <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - wide }}>
      <defs>
        <radialGradient id="outGlobe" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stopColor="#8FE3FF" /><stop offset="0.55" stopColor="#1E7FB8" /><stop offset="1" stopColor="#0B2E4A" /></radialGradient>
      </defs>
      <path d={d} stroke="#2A2F37" strokeWidth={10} fill="none" strokeLinecap="round" />
      {lit > 0 && <path d={d} stroke="#7FDBFF" strokeWidth={5} fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px #5AC8FA)" }} {...draw(f, c.online - 4, 12)} />}
      {lit > 0.9 && [0, 0.33, 0.66].map((o) => {
        const q = outCableAt((flow + o) % 1);
        return <circle key={o} cx={q.x} cy={q.y} r={5} fill="#FFFFFF" style={{ filter: "drop-shadow(0 0 6px #7FDBFF)" }} />;
      })}
      <g opacity={0.35 + 0.65 * lit} style={{ filter: lit > 0 ? `drop-shadow(0 0 ${(22 * lit).toFixed(1)}px rgba(90,200,250,0.8))` : undefined }}>
        <circle cx={G.x} cy={G.y} r={G.r} fill={lit > 0 ? "url(#outGlobe)" : "#1C2027"} stroke="#9FE7FF" strokeOpacity={0.3 + 0.5 * lit} strokeWidth={2} />
        {[-0.55, 0, 0.55].map((y) => <ellipse key={y} cx={G.x} cy={G.y + y * G.r} rx={G.r * Math.sqrt(1 - y * y)} ry={4} fill="none" stroke="#CFF4FF" strokeOpacity={0.45} strokeWidth={1.5} />)}
        {[0.3, 0.65, 1].map((w, i) => <ellipse key={i} cx={G.x} cy={G.y} rx={G.r * w * Math.abs(Math.cos(f / 40 + i))} ry={G.r} fill="none" stroke="#CFF4FF" strokeOpacity={0.45} strokeWidth={1.5} />)}
      </g>
    </svg>
  );
};

/** the sandboxed swarm at the tower's foot; on "asked" a note goes up to the window; as the window widens they climb to its sill */
export const OutSwarm: React.FC<{ c: OutCues; sill: { y: number; x0: number; x1: number } }> = ({ c, sill }) => {
  const { f } = useScene();
  const n = 14;
  const lean = f >= c.asked ? 1 - prog(f, c.asked, 20, ease.out) : 0;
  const climb = arrive(f, c.window - 14, 22);
  const noteP = prog(f, c.asked, 18, ease.inOut);
  const nx = 450 + (OUT_WIN.x + OUT_WIN.w / 2 - 450) * noteP;
  const ny = 1250 + (OUT_WIN.y + OUT_WIN.h / 2 - 1250) * noteP - Math.sin(noteP * Math.PI) * 60;
  return (
    <>
      {Array.from({ length: n }, (_, k) => {
        const bx = 250 + (k % 7) * 66 + (Math.floor(k / 7) ? 33 : 0) + Math.sin(f / 13 + k) * 5;
        const by = 1262 + Math.floor(k / 7) * 58 + Math.cos(f / 11 + k * 2) * 5 - 14 * lean;
        const tx = sill.x0 + ((sill.x1 - sill.x0) * (k + 0.5)) / n;
        const ty = sill.y - 22 - (k % 2) * 16 + Math.sin(f / 9 + k) * 3;
        return <Agent key={k} x={bx + (tx - bx) * climb} y={by + (ty - by) * climb} r={12} color={RED} glow={1.1 + 0.3 * Math.sin(f / 7 + k)} opacity={prog(f, c.from - 6 + k, 6, ease.linear)} />;
      })}
      {f >= c.asked && noteP < 1 && (
        <div style={{ position: "absolute", left: nx - 22, top: ny - 16, width: 44, height: 32, borderRadius: 4, background: "#FFFFFF", transform: `rotate(${(-12 + 24 * noteP).toFixed(1)}deg) scale(${(1 - 0.5 * noteP).toFixed(3)})`, boxShadow: "0 0 18px rgba(255,255,255,0.8)" }}>
          {[8, 15, 22].map((y) => <div key={y} style={{ position: "absolute", left: 7, right: 7 + (y === 22 ? 12 : 0), top: y, height: 3, borderRadius: 2, background: "#B0B6BF" }} />)}
        </div>
      )}
    </>
  );
};
