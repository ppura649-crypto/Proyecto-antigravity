// `out`: the tower's one small window. It already shows a sliver of light from outside; on "window" the same window
// stretches wide over the frame into a view of the internet (a glowing world map with pages floating over it), and the
// swarm stands at its sill looking through.
import React from "react";
import { Img } from "remotion";
import { ease, prog, useScene } from "../../../src/engine";
import { asset } from "./parts";
import { OUT_WIN, outWide, type OutCues } from "./OutServer";

export const OUT_WIDE = { x: 50, y: 640, w: 800, h: 540 };
export const outWinRect = (w: number) => ({
  x: OUT_WIN.x + (OUT_WIDE.x - OUT_WIN.x) * w,
  y: OUT_WIN.y + (OUT_WIDE.y - OUT_WIN.y) * w,
  w: OUT_WIN.w + (OUT_WIDE.w - OUT_WIN.w) * w,
  h: OUT_WIN.h + (OUT_WIDE.h - OUT_WIN.h) * w,
});

const PAGES = [
  { x: 0.14, y: 0.2, c: "#FF7A59" },
  { x: 0.62, y: 0.14, c: "#34C759" },
  { x: 0.8, y: 0.5, c: "#7C4DFF" },
  { x: 0.36, y: 0.52, c: "#FFB020" },
  { x: 0.06, y: 0.58, c: "#1E88E5" },
];

const Pages: React.FC<{ c: OutCues; r: { w: number; h: number } }> = ({ c, r }) => {
  const { f } = useScene();
  return (
    <svg width={r.w} height={r.h} style={{ position: "absolute", inset: 0 }}>
      {PAGES.map((p, i) => {
        const at = c.window - 4 + i * 5;
        const a = prog(f, at, 10);
        if (a <= 0) return null;
        const dx = Math.sin(f / 50 + i) * 10;
        const dy = Math.cos(f / 60 + i * 2) * 8 - (1 - a) * 30;
        const x = p.x * r.w + dx;
        const y = p.y * r.h + dy;
        const q = PAGES[(i + 1) % PAGES.length];
        return (
          <g key={i} opacity={a}>
            <line x1={x + 60} y1={y + 40} x2={q.x * r.w + 60} y2={q.y * r.h + 40} stroke="#7FDBFF" strokeOpacity={0.5} strokeWidth={2} />
            <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} style={{ filter: "drop-shadow(0 0 14px rgba(255,200,120,0.55))" }}>
              <rect width={120} height={82} rx={8} fill="#FFFFFF" fillOpacity={0.93} />
              <rect width={120} height={18} rx={8} fill={p.c} />
              <rect y={10} width={120} height={8} fill={p.c} />
              {[30, 44, 58].map((yy, k) => <rect key={yy} x={12} y={yy} width={k === 2 ? 56 : 94} height={7} rx={3.5} fill="#B8BEC8" />)}
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export const OutWindow: React.FC<{ c: OutCues }> = ({ c }) => {
  const { f } = useScene();
  const w = outWide(f, c);
  const r = outWinRect(w);
  const bar = 8 - 4 * w;
  const glowA = 0.25 + 0.55 * w + 0.08 * Math.sin(f / 8);
  const zoom = 1.9 - 0.8 * w + 0.03 * Math.sin(f / 70);
  const panX = -8 * Math.sin(f / 90);
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 10 + 12 * w, overflow: "hidden", background: "#050810", boxShadow: `0 0 0 ${(10 - 2 * w).toFixed(1)}px #3B424E, 0 0 0 ${(12 - 2 * w).toFixed(1)}px #5A6372, 0 0 ${(40 + 80 * w).toFixed(0)}px rgba(255,190,110,${glowA.toFixed(2)})` }}>
      <Img src={asset("out/internet-view.jpg")} style={{ position: "absolute", left: "50%", top: "50%", width: r.w * zoom, height: r.w * zoom, objectFit: "cover", transform: `translate(calc(-50% + ${panX.toFixed(1)}px), -50%)`, opacity: 0.85 + 0.15 * w }} />
      {w > 0.3 && <Pages c={c} r={r} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.06) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: r.h * 0.35, background: "linear-gradient(transparent, rgba(5,8,16,0.85))", opacity: w }} />
      <div style={{ position: "absolute", left: r.w / 2 - bar / 2, top: 0, width: bar, height: r.h, background: "#3B424E", opacity: 1 - 0.55 * w }} />
      <div style={{ position: "absolute", top: r.h / 2 - bar / 2, left: 0, height: bar, width: r.w, background: "#3B424E", opacity: 1 - 0.55 * w }} />
    </div>
  );
};

/** the sill the swarm climbs to, once wide */
export const OUT_SILL = { y: OUT_WIDE.y + OUT_WIDE.h, x0: OUT_WIDE.x + 60, x1: OUT_WIDE.x + OUT_WIDE.w - 60 };
