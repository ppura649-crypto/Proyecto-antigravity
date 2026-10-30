// The one thing every sandbox shared: a row of sealed sandbox cells (report's steel-and-glass cell, ReportChamber, shut,
// bolted, lamp red), each fed by a glass tube through an inlet in its lid, the tubes joined into one manifold and one
// pipe up to one rack server. Parcels (software packages) drop from the server down the pipe and into each cell; the
// agent inside (the AgentIcon) jumps and lights up as its parcel lands. The server face is drawn here too, so `Locker` can grow
// it into the locker wall.
import React from "react";
import { blurIn, draw, typeOn, useScene } from "../../../src/engine";
import { AGENT, AgentIcon, rand } from "./parts";
import { Chamber, FOOT, ROOM } from "./ReportChamber";

export const SERVER = { left: 305, top: 600, w: 290, h: 380 };
export const CUBES = [116, 283, 450, 617, 784].map((x) => ({ x, y: 1345 }));
const CELL_S = 0.29;
const MANIFOLD = 1182;
/** the inlet on each cell's lid: local (262, -32) of the cell, in page y */
const INTO = 1345 + (-32 - FOOT.y) * CELL_S;
const AGENT_SIZE = 190;
const SPEED = 13; // px a frame
const SPAWN = 8; // frames between parcels
const ORDER = [2, 0, 4, 1, 3];

export type RigCues = { t0: number; shared: number; one: number; installs: number; packages: number; so: number };

type Pt = [number, number];
const route = (i: number): Pt[] => [[450, SERVER.top + SERVER.h], [450, MANIFOLD], [CUBES[i].x, MANIFOLD], [CUBES[i].x, INTO]];
const lenOf = (pts: Pt[]) => pts.slice(1).reduce((a, p, k) => a + Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]), 0);
function along(pts: Pt[], d: number): Pt {
  for (let k = 1; k < pts.length; k++) {
    const seg = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    if (d <= seg) {
      const t = d / seg;
      return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
}

/** every parcel in flight on this frame, and when each cube last received one */
function parcels(f: number, c: RigCues) {
  const start = c.installs - 10;
  const out: { x: number; y: number; k: number }[] = [];
  const landed = CUBES.map(() => -999);
  if (f < start) return { out, landed };
  const n = Math.floor((f - start) / SPAWN);
  for (let k = Math.max(0, n - 20); k <= n; k++) {
    const born = start + k * SPAWN;
    if (born > c.so) break;
    const i = ORDER[k % ORDER.length];
    const pts = route(i);
    const d = (f - born) * SPEED;
    const L = lenOf(pts);
    if (d >= L) landed[i] = Math.max(landed[i], born + L / SPEED);
    else if (d >= 0) {
      const [x, y] = along(pts, d);
      out.push({ x, y, k });
    }
  }
  return { out, landed };
}

const Parcel: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <div style={{ position: "absolute", left: x - 13, top: y - 11, width: 26, height: 22, borderRadius: 3, transform: `rotate(${(rand(k, 4) - 0.5) * 16}deg)`, background: "linear-gradient(160deg, #E0B57A, #A87842)", boxShadow: "0 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
    <div style={{ position: "absolute", left: 10, top: 0, width: 6, height: 22, background: "#F3E3C4", opacity: 0.8 }} />
  </div>
);

/** glass tubes: a dark core the parcels ride in, a cyan rim, a highlight on top */
const Pipes: React.FC<{ c: RigCues; layer: "under" | "over" }> = ({ c, layer }) => {
  const { f } = useScene();
  const paths = [
    `M 450 ${SERVER.top + SERVER.h - 4} V ${MANIFOLD}`,
    `M ${CUBES[0].x} ${MANIFOLD} H ${CUBES[4].x}`,
    ...CUBES.map((q) => `M ${q.x} ${MANIFOLD} V ${INTO}`),
  ];
  const at = (k: number) => (k === 0 ? c.shared - 6 : k === 1 ? c.shared + 4 : c.shared + 10 + (k - 2) * 2);
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {paths.map((d, k) =>
        layer === "under" ? (
          <g key={k}>
            <path d={d} stroke="rgba(90,200,250,0.35)" strokeWidth={38} fill="none" strokeLinecap="butt" {...draw(f, at(k), 12)} />
            <path d={d} stroke="#0A1016" strokeWidth={30} fill="none" strokeLinecap="butt" {...draw(f, at(k), 12)} />
          </g>
        ) : (
          <path key={k} d={d} stroke="rgba(200,240,255,0.28)" strokeWidth={5} fill="none" strokeLinecap="round" transform="translate(-8,-2)" {...draw(f, at(k), 12)} />
        ),
      )}
      {layer === "over" && CUBES.map((q) => <rect key={q.x} x={q.x - 22} y={MANIFOLD - 22} width={44} height={44} rx={6} fill="#39424E" stroke="#5AC8FA" strokeOpacity={0.5} strokeWidth={2} opacity={f >= c.shared + 10 ? 1 : 0} />)}
    </svg>
  );
};

export const Rig: React.FC<{ c: RigCues }> = ({ c }) => {
  const { f } = useScene();
  const { out, landed } = parcels(f, c);
  return (
    <>
      <Pipes c={c} layer="under" />
      {out.map((p) => <Parcel key={p.k} {...p} />)}
      <Pipes c={c} layer="over" />
      {CUBES.map((q, i) => {
        const since = f - landed[i];
        const pulse = since >= 0 && since < 16 ? 1 - since / 16 : 0;
        const hop = since >= 0 && since < 12 ? Math.sin((Math.PI * since) / 12) * 26 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, ...blurIn(f, c.t0 + i * 3, { dur: 8 }) }}>
            <Chamber x={q.x} y={q.y} scale={CELL_S} door={1} bolts={1} red={1} f={f + i * 41} glow={1 + pulse * 0.8}>
              <div style={{ position: "absolute", left: ROOM.x + 6 - AGENT_SIZE / 2, top: ROOM.y + 24 - AGENT_SIZE / 2 + Math.sin(f / 16 + i * 1.3) * 7 - hop }}>
                <AgentIcon size={AGENT_SIZE} color={AGENT} state={pulse > 0.3 ? "active" : "idle"} glow={1 + pulse} look={{ x: pulse > 0 ? 0 : Math.sin(f / 19 + i) * 0.7, y: pulse > 0 ? -0.9 : 0.1 }} seed={i * 29 + 3} />
              </div>
            </Chamber>
            {/* the steel inlet collar where the tube enters the lid */}
            <div style={{ position: "absolute", left: q.x - 20, top: INTO - 12, width: 40, height: 16, borderRadius: 4, background: "linear-gradient(180deg, #E4E8EC, #7E868F)", boxShadow: `0 2px 4px rgba(0,0,0,0.5), 0 0 ${(14 * pulse).toFixed(1)}px ${AGENT}` }} />
          </div>
        );
      })}
    </>
  );
};

/** the rack server's face, drawn to fill whatever box it is given (it grows into the wall) */
export const ServerFace: React.FC<{ c: RigCues }> = ({ c }) => {
  const { f } = useScene();
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "linear-gradient(180deg, #343B46, #161A20)", boxShadow: "0 30px 80px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.18), 0 0 60px rgba(90,200,250,0.12)" }}>
      <div style={{ position: "absolute", left: "7%", right: "7%", top: "4%", height: "12%", borderRadius: 6, background: "repeating-linear-gradient(90deg, #0B0E12 0 6px, #2A313A 6px 10px)" }} />
      {Array.from({ length: 5 }).map((_, r) => (
        <div key={r} style={{ position: "absolute", left: "7%", right: "7%", top: `${20 + r * 12.5}%`, height: "10%", borderRadius: 5, background: "linear-gradient(180deg, #232931, #12161B)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", display: "flex", alignItems: "center", padding: "0 6%" }}>
          {[0, 1, 2].map((l) => {
            const on = rand(Math.floor(f / (4 + l)) + r * 5 + l * 11, 7) > 0.35;
            const col = l === 0 ? "#34C759" : AGENT;
            return <div key={l} style={{ width: 10, height: 10, borderRadius: 5, marginRight: 10, background: on ? col : "#1E252D", boxShadow: on ? `0 0 8px ${col}` : "none" }} />;
          })}
          <div style={{ marginLeft: "auto", width: "30%", height: 6, borderRadius: 3, background: "#0A0D10" }} />
        </div>
      ))}
      {/* where the pipe goes in */}
      <div style={{ position: "absolute", left: "50%", bottom: -6, width: 50, height: 18, marginLeft: -25, borderRadius: 4, background: "#39424E" }} />
    </div>
  );
};

/** the plate over the server: typed so it finishes on "packages" */
export const ServerPlate: React.FC<{ c: RigCues; y: number; opacity: number }> = ({ c, y, opacity }) => {
  const { f, fps } = useScene();
  const t = typeOn("package server", f, c.packages - 22, fps, 30);
  if (f < c.packages - 24) return null;
  return (
    <div style={{ position: "absolute", left: 450, top: y, transform: "translateX(-50%)", opacity }}>
      <div style={{ ...blurIn(f, c.packages - 24, { dur: 6 }), minWidth: 330, height: 60, borderRadius: 10, background: "linear-gradient(180deg, #E9EDF1, #AEB6BF)", boxShadow: "0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 #FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 34, color: "#15191E", padding: "0 20px", whiteSpace: "nowrap" }}>
        {t.text}
        <span style={{ opacity: t.typing ? 1 : 0 }}>_</span>
      </div>
    </div>
  );
};
