// `in`, on "leaked": the key ring turns out to be lying on a public pavement at night. Everything drawn in code:
// paving slabs in perspective, a kerb and the dark road beyond, a street lamp that stutters on, its cone of light
// with dust drifting in it, the warm pool on the stones, and a "Public Street" plate on the post.
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { rand } from "./parts";

const LAMP = { x: 196, y: 668 }; // the bulb, column coords
const POOL = { x: 450, y: 1010 };

/** the ground plane: slabs, kerb, road, laid flat and seen from a standing height */
const Pavement: React.FC = () => {
  const cols = 9, rows = 14, S = 150, G = 7;
  const slabs: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const off = r % 2 ? S / 2 : 0; // running bond
      const l = 22 + rand(r * 31 + c, 5) * 14;
      slabs.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left: c * S - off, top: r * S, width: S - G, height: S - G, borderRadius: 4, background: `linear-gradient(${140 + rand(r, c) * 60}deg, hsl(30 6% ${l + 6}%), hsl(30 5% ${l}%))`, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.10), inset 0 -3px 0 rgba(0,0,0,0.35)" }}>
          {rand(r * 7 + c, 9) > 0.7 && <div style={{ position: "absolute", left: 20 + rand(r, c + 3) * 70, top: 30 + rand(c, r + 5) * 60, width: 40, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.18)", filter: "blur(4px)" }} />}
        </div>,
      );
    }
  }
  return (
    <div style={{ position: "absolute", left: -415, top: 745 - rows * S, width: 1650, height: rows * S, background: "#0B0B0C", transformOrigin: "50% 100%", transform: "rotateX(62deg)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1170, height: "100%", overflow: "hidden" }}>{slabs}</div>
      {/* kerb: long pale stones with a lit edge, then the road */}
      <div style={{ position: "absolute", left: 1178, top: 0, width: 64, height: "100%", background: "repeating-linear-gradient(180deg, #8A8780 0 292px, #1A1A1A 292px 300px)", boxShadow: "inset 6px 0 0 rgba(255,255,255,0.25), inset -10px 0 0 rgba(0,0,0,0.4)" }} />
      <div style={{ position: "absolute", left: 1242, top: 0, right: 0, height: "100%", background: "linear-gradient(90deg, #121214, #1C1C1F)" }} />
      <div style={{ position: "absolute", left: 1420, top: 0, width: 16, height: "100%", background: "repeating-linear-gradient(180deg, #CFC7AE 0 180px, transparent 180px 300px)", opacity: 0.55 }} />
    </div>
  );
};

/** the street lamp: post, curved arm, hood, glowing bulb, and a street plate */
const Lamp: React.FC<{ on: number }> = ({ on }) => (
  <svg width={900} height={930} viewBox="0 520 900 930" style={{ position: "absolute", left: 0, top: 520, overflow: "visible" }}>
    <defs>
      <linearGradient id="inPost" x1="0" x2="1">
        <stop offset="0" stopColor="#15171B" />
        <stop offset="0.45" stopColor="#4A4F58" />
        <stop offset="1" stopColor="#101114" />
      </linearGradient>
      <radialGradient id="inBulb">
        <stop offset="0" stopColor="#FFFBE8" />
        <stop offset="0.5" stopColor="#FFD58A" />
        <stop offset="1" stopColor="#FFB347" stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* post, base, arm */}
    <rect x={62} y={600} width={22} height={840} fill="url(#inPost)" />
    <path d="M52 1440 L94 1440 L90 1380 L56 1380 Z" fill="url(#inPost)" />
    <rect x={58} y={1000} width={30} height={10} rx={3} fill="#2B2E34" />
    <path d="M73 606 C73 560 110 548 160 552 L200 556" fill="none" stroke="url(#inPost)" strokeWidth={14} strokeLinecap="round" />
    {/* hood */}
    <path d="M160 648 L232 648 L220 612 L172 612 Z" fill="#1E2025" stroke="#3C4048" strokeWidth={2} />
    <rect x={190} y={556} width={12} height={58} fill="#23262B" />
    <ellipse cx={LAMP.x} cy={LAMP.y - 16} rx={38} ry={10} fill="url(#inBulb)" opacity={on} />
    <circle cx={LAMP.x} cy={LAMP.y - 14} r={70} fill="url(#inBulb)" opacity={0.55 * on} />
    {/* the plate on the post */}
    <g transform="translate(92 1232)">
      <rect x={0} y={0} width={196} height={62} rx={6} fill="#1D4E9E" stroke="#E9EEF7" strokeWidth={3} />
      <text x={98} y={40} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={25} fontWeight={700} fill="#FFFFFF" letterSpacing={0.5}>Public Street</text>
    </g>
    <rect x={84} y={1244} width={8} height={10} fill="#8C9099" />
    <rect x={84} y={1276} width={8} height={10} fill="#8C9099" />
  </svg>
);

/** the cone of light from the bulb to the pool, with dust hanging in it */
const Cone: React.FC<{ on: number; f: number }> = ({ on, f }) => (
  <div style={{ position: "absolute", inset: 0, opacity: on, mixBlendMode: "screen" }}>
    <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${LAMP.x - 34}px ${LAMP.y - 12}px, ${LAMP.x + 34}px ${LAMP.y - 12}px, 800px 1190px, 90px 1230px)`, background: `radial-gradient(ellipse 70% 62% at ${LAMP.x}px ${LAMP.y}px, rgba(255,205,120,0.32), rgba(255,180,90,0.10) 60%, transparent 100%)` }} />
    {Array.from({ length: 26 }, (_, i) => {
      const t = rand(i, 41);
      const y = LAMP.y + 40 + t * 470 + Math.sin((f + i * 17) / 40) * 10;
      const spread = 30 + (y - LAMP.y) * 0.62;
      const x = LAMP.x + 60 + (y - LAMP.y) * 0.4 + (rand(i, 42) - 0.5) * spread + Math.cos((f + i * 29) / 55) * 12;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + rand(i, 43) * 3, height: 3 + rand(i, 43) * 3, borderRadius: 3, background: "#FFE2A8", opacity: 0.25 + 0.5 * rand(i, 44) }} />;
    })}
  </div>
);

export const InStreet: React.FC<{ at: number }> = ({ at }) => {
  const { f } = useScene();
  if (f < at - 1) return null;
  const p = prog(f, at, 10, ease.out);
  // a sodium lamp coming on: two stutters, then steady, then a slow breathing hum
  const k = f - at;
  const on = k < 3 ? 0.25 : k < 5 ? 0.9 : k < 7 ? 0.35 : k < 9 ? 1 : 0.93 + 0.07 * Math.sin(k / 9);
  const edge = "radial-gradient(ellipse 58% 62% at 50% 55%, #000 55%, transparent 88%)";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 1450, opacity: p, zIndex: 0 }}>
      {/* ground, lit only where the lamp reaches */}
      <div style={{ position: "absolute", left: 40, top: 700, width: 820, height: 745, overflow: "hidden", WebkitMaskImage: edge, maskImage: edge }}>
        <div style={{ position: "absolute", inset: 0, perspective: 900, perspectiveOrigin: "50% -40%", transform: `translateY(${22 * (1 - p)}px)` }}>
          <Pavement />
        </div>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 44% 36% at ${POOL.x - 40}px ${POOL.y - 700}px, rgba(255,196,110,${0.34 * on}), rgba(255,160,70,${0.10 * on}) 60%, rgba(0,0,0,0.78) 100%)` }} />
      </div>
      <Cone on={on} f={f} />
      <Lamp on={on} />
    </div>
  );
};
