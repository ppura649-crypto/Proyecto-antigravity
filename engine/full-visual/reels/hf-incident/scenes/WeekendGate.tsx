// `weekend`: Hugging Face's building, drawn with a side face for depth, its real mark on the roof, lit windows, and a
// steel gate held by two padlocks. On "attacked" the windows flicker red as the swarm hits the gate; on "two" each
// padlock cracks (the two zero-days) and its shackle lifts.
import React from "react";
import { draw, ease, prog, useScene } from "../../../src/engine";
import { HF, Logo, RED, rand } from "./parts";

export const BLD = { l: 400, r: 800, top: 975, bot: 1405, side: 44, gate: { l: 500, r: 700, top: 1190 } };
export const LOCKS = [{ x: 552, y: 1262 }, { x: 648, y: 1262 }];

/** one padlock, local 0..76 x 0..100; `crack` is the crack's start frame */
export const Padlock: React.FC<{ x: number; y: number; crack: number; id: string; size?: number }> = ({ x, y, crack, id, size = 1 }) => {
  const { f } = useScene();
  const c = prog(f, crack, 8, ease.out);
  const lift = c * 12;
  const shake = f >= crack && f < crack + 10 ? Math.sin((f - crack) * 2.6) * 3 * (1 - (f - crack) / 10) : 0;
  return (
    <svg width={76} height={104} viewBox="0 0 76 104" style={{ position: "absolute", left: x - 38, top: y - 40, overflow: "visible", transform: `translateX(${shake}px) scale(${size})`, transformOrigin: "38px 40px", zIndex: 4 }}>
      <defs>
        <linearGradient id={`brass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE57A" />
          <stop offset="0.5" stopColor={HF} />
          <stop offset="1" stopColor="#B98300" />
        </linearGradient>
      </defs>
      <path d={`M18 ${46 - lift} V${26 - lift} a20 20 0 0 1 40 0 V${46 - (lift > 0 ? 0 : 0)}`} fill="none" stroke="#9EA2AA" strokeWidth={9} strokeLinecap="round" transform={`translate(0 ${0})`} />
      <rect x={4} y={42} width={68} height={56} rx={9} fill={`url(#brass${id})`} stroke="#8A6200" strokeWidth={2} />
      <circle cx={38} cy={64} r={7} fill="#3A2A00" />
      <rect x={35} y={66} width={6} height={16} rx={2} fill="#3A2A00" />
      {f >= crack && (
        <>
          <path d="M22 42 L30 55 L24 66 L34 77 L28 98" fill="none" stroke="#2A1A00" strokeWidth={5.5} strokeLinejoin="round" {...draw(f, crack, 7)} />
          <path d="M23 43 L31 55 L25 66 L35 77 L29 98" fill="none" stroke="#FFF6C8" strokeWidth={1.2} strokeLinejoin="round" opacity={0.9} {...draw(f, crack, 7)} />
          <circle cx={30} cy={55} r={34 * c} fill={RED} opacity={0.5 * (1 - prog(f, crack + 4, 16))} />
        </>
      )}
      {f >= crack &&
        [0, 1, 2].map((k) => {
          const t = Math.max(0, f - crack) / 60;
          return <path key={k} d="M0 0 L7 2 L3 8 Z" fill="#C99A10" transform={`translate(${22 + k * 6 + t * 60 * (rand(k, 4) - 0.5)} ${60 + t * 180 + 300 * t * t})`} opacity={1 - Math.min(1, t * 2)} />;
        })}
    </svg>
  );
};

/** the building: side face, facade, windows, roof mark, the gate */
export const Building: React.FC<{ attacked: number; two: number }> = ({ attacked, two }) => {
  const { f } = useScene();
  const { l, r, top, bot, side, gate } = BLD;
  const alarm = f >= attacked ? 0.5 + 0.5 * Math.sin((f - attacked) / 4) : 0;
  const hit = f >= attacked ? Math.sin((f - attacked) * 1.7) * 1.4 * (1 - prog(f, attacked, 60)) : 0;
  const cols = 5;
  const rows = 3;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${hit}px)` }}>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="wkFacade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E4E4E8" />
          </linearGradient>
          <linearGradient id="wkSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#C9C9CF" />
            <stop offset="1" stopColor="#B2B2B9" />
          </linearGradient>
          <linearGradient id="wkSteel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5B5E66" />
            <stop offset="0.5" stopColor="#80848D" />
            <stop offset="1" stopColor="#4A4D54" />
          </linearGradient>
        </defs>
        {/* ground shadow */}
        <ellipse cx={(l + r) / 2 + 20} cy={bot + 6} rx={(r - l) / 2 + 60} ry={14} fill="rgba(0,0,0,0.12)" />
        {/* side face, receding to the right */}
        <path d={`M${r} ${top} L${r + side} ${top - 26} L${r + side} ${bot - 20} L${r} ${bot} Z`} fill="url(#wkSide)" />
        <path d={`M${l} ${top} L${l + side} ${top - 26} L${r + side} ${top - 26} L${r} ${top} Z`} fill="#D8D8DD" />
        <rect x={l} y={top} width={r - l} height={bot - top} fill="url(#wkFacade)" stroke="#D2D2D8" strokeWidth={2} />
        {/* parapet band in HF yellow */}
        <rect x={l} y={top} width={r - l} height={16} fill={HF} />
        {Array.from({ length: rows * cols }, (_, i) => {
          const cx = l + 34 + (i % cols) * ((r - l - 68) / (cols - 1)) - 24;
          const cy = top + 44 + Math.floor(i / cols) * 58;
          const red = alarm * (rand(i, 9) > 0.35 ? 1 : 0.2);
          return (
            <g key={i}>
              <rect x={cx} y={cy} width={48} height={38} rx={4} fill="#C9D6E3" />
              <rect x={cx} y={cy} width={48} height={38} rx={4} fill={HF} opacity={0.9 * (1 - red) * (0.75 + 0.25 * rand(i, 2))} />
              <rect x={cx} y={cy} width={48} height={38} rx={4} fill={RED} opacity={0.95 * red} />
              <path d={`M${cx + 4} ${cy + 30} L${cx + 30} ${cy + 4}`} stroke="#fff" strokeWidth={3} opacity={0.5} />
            </g>
          );
        })}
        {/* the gate: an arch of stone around two steel doors */}
        <path d={`M${gate.l - 22} ${bot} V${gate.top} a${(gate.r - gate.l) / 2 + 22} 60 0 0 1 ${gate.r - gate.l + 44} 0 V${bot} Z`} fill="#D0D0D6" />
        <path d={`M${gate.l} ${bot} V${gate.top + 10} a${(gate.r - gate.l) / 2} 46 0 0 1 ${gate.r - gate.l} 0 V${bot} Z`} fill="url(#wkSteel)" />
        <line x1={(gate.l + gate.r) / 2} y1={gate.top - 34} x2={(gate.l + gate.r) / 2} y2={bot} stroke="#2F3137" strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={gate.l + 14 + (i % 2) * (gate.r - gate.l - 28)} cy={gate.top + 30 + Math.floor(i / 2) * 30} r={3.5} fill="#2F3137" />
        ))}
        <rect x={gate.l} y={gate.top + 10} width={gate.r - gate.l} height={bot - gate.top - 10} fill={RED} opacity={0.18 * alarm} />
      </svg>
      {/* the real mark, standing on the roof like a sign */}
      <div style={{ position: "absolute", left: (l + r) / 2 - 70, top: top - 150, filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.18))" }}>
        <Logo name="huggingface" size={140} />
      </div>
      <Padlock x={LOCKS[0].x} y={LOCKS[0].y} crack={two - 2} id="a" size={1.3} />
      <Padlock x={LOCKS[1].x} y={LOCKS[1].y} crack={two + 6} id="b" size={1.3} />
    </div>
  );
};
