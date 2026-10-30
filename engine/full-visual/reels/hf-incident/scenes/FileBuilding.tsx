// `file`: Hugging Face's building cut open like a doll's house, drawn in one-point perspective so each floor has a back
// wall, a floor and side walls. Upstairs: the server's vault (its own secrets) beside racks of machines. Downstairs:
// the intake, where people's parcels (their uploaded data files) ride in on a conveyor. Metaphor only.
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { HF, Logo, rand } from "./parts";
import { InKey } from "./InKeys";

export const B = { l: 60, r: 840, roof: 668, slab: 1030, slabH: 26, floor: 1385, wall: 22, inset: 50, depth: 36 };
export const UP = { top: B.roof + B.wall, bot: B.slab };
export const DOWN = { top: B.slab + B.slabH, bot: B.floor };
export const VAULT = { x: 262, y: 862, r: 104 };

/** one room: back wall, floor, ceiling and side walls converging on a vanishing point */
const Room: React.FC<{ top: number; bot: number; id: string; light: number }> = ({ top, bot, id, light }) => {
  const l = B.l + B.wall;
  const r = B.r - B.wall;
  const bl = l + B.inset;
  const br = r - B.inset;
  const bt = top + B.depth;
  const bb = bot - B.depth;
  return (
    <g>
      <defs>
        <linearGradient id={`floor${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23252B" />
          <stop offset="1" stopColor="#34373F" />
        </linearGradient>
        <radialGradient id={`lamp${id}`} cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="#FFF4D0" stopOpacity={0.22 * light} />
          <stop offset="1" stopColor="#FFF4D0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={bl} y={bt} width={br - bl} height={bb - bt} fill="#1C1E23" />
      <path d={`M${l} ${bot} L${bl} ${bb} L${br} ${bb} L${r} ${bot} Z`} fill={`url(#floor${id})`} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        return <line key={i} x1={l + (r - l) * t} y1={bot} x2={bl + (br - bl) * t} y2={bb} stroke="#000" strokeOpacity={0.25} strokeWidth={1.5} />;
      })}
      <path d={`M${l} ${top} L${bl} ${bt} L${br} ${bt} L${r} ${top} Z`} fill="#15171B" />
      <path d={`M${l} ${top} L${bl} ${bt} L${bl} ${bb} L${l} ${bot} Z`} fill="#191B20" />
      <path d={`M${r} ${top} L${br} ${bt} L${br} ${bb} L${r} ${bot} Z`} fill="#17191D" />
      <rect x={l} y={top} width={r - l} height={bot - top} fill={`url(#lamp${id})`} />
    </g>
  );
};

/** racks of machines upstairs, LEDs blinking */
const Racks: React.FC = () => {
  const { f } = useScene();
  return (
    <g>
      {[0, 1, 2].map((k) => {
        const x = 470 + k * 102;
        return (
          <g key={k}>
            <rect x={x} y={760} width={86} height={230} rx={4} fill="#0E0F12" stroke="#2E3138" strokeWidth={2} />
            {Array.from({ length: 9 }, (_, j) => {
              const on = rand(k * 20 + j + Math.floor((f + k * 7 + j * 3) / 9), 5) > 0.45;
              return (
                <g key={j}>
                  <rect x={x + 8} y={772 + j * 24} width={70} height={16} rx={2} fill="#1D2026" />
                  <circle cx={x + 18} cy={780 + j * 24} r={3} fill={on ? "#5AC8FA" : "#1F3A48"} />
                  <circle cx={x + 30} cy={780 + j * 24} r={3} fill={on && j % 3 === 0 ? HF : "#3A3320"} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** the vault: a round steel door in the back wall; on "secrets" it swings open on its hinge and the keys inside glow */
export const Vault: React.FC<{ open: number; beam: number }> = ({ open, beam }) => {
  const { f } = useScene();
  const o = prog(f, open, 9, ease.out);
  const heat = prog(f, beam + 10, 10);
  const { x, y, r } = VAULT;
  return (
    <div style={{ position: "absolute", left: x - r - 14, top: y - r - 14, width: (r + 14) * 2, height: (r + 14) * 2, zIndex: 2 }}>
      {/* the chamber behind the door */}
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: `radial-gradient(circle, ${HF} 0%, #7A5A00 55%, #1A1400 100%)`, boxShadow: `0 0 ${60 * o}px ${24 * o}px ${HF}88`, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} style={{ position: "absolute", left: 50 + (k % 3) * 46 + Math.floor(k / 3) * 22, top: 36 + Math.floor(k / 3) * 70, transform: `rotate(${90 + (k % 2 ? 8 : -8)}deg)`, transformOrigin: "0 0", filter: `drop-shadow(0 0 ${6 * o}px #FFF3B0)` }}>
            <div style={{ position: "absolute", left: -3, top: -12 }}><InKey id={`v${k}`} scale={0.42} /></div>
          </div>
        ))}
      </div>
      {/* steel frame ring */}
      <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: "10px solid #5E626B", boxShadow: `inset 0 0 0 3px #2A2C31, 0 0 ${30 * heat}px ${8 * heat}px ${HF}66` }} />
      {/* the door, hinged on its left edge */}
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", transformOrigin: "0% 50%", transform: `perspective(700px) rotateY(${-105 * o}deg)`, background: "radial-gradient(circle at 38% 32%, #B7BBC3, #7B8089 55%, #4B4F57)", border: "3px solid #3A3D44", backfaceVisibility: "visible" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: "50%", border: "8px solid #3E4148", transform: `rotate(${(f / 3) % 360 * (1 - o) + (f >= open ? 0 : 0)}deg)` }}>
          {[0, 1, 2, 3].map((k) => <div key={k} style={{ position: "absolute", left: 33, top: -22, width: 8, height: 118, background: "#3E4148", transform: `rotate(${k * 45}deg)`, transformOrigin: "4px 59px" }} />)}
        </div>
        {Array.from({ length: 10 }, (_, k) => {
          const a = (k / 10) * Math.PI * 2;
          return <div key={k} style={{ position: "absolute", left: r - 3 + (r - 20) * Math.cos(a) - 6, top: r - 3 + (r - 20) * Math.sin(a) - 6, width: 12, height: 12, borderRadius: 6, background: "#4B4F57" }} />;
        })}
      </div>
      {/* the plaque */}
      <div style={{ position: "absolute", left: "50%", top: -40, transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 6, background: "#2A2C31", border: `2px solid ${o > 0 ? HF : "#4A4D55"}`, color: o > 0 ? HF : "#C9CCD2", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: 1, whiteSpace: "nowrap" }}>
        secrets
      </div>
    </div>
  );
};

/** the shell: rooms, slab, walls with a cut edge, the intake opening, the roof sign */
export const Shell: React.FC = () => {
  const { f } = useScene();
  const hum = 0.9 + 0.1 * Math.sin(f / 7);
  return (
    <>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }}>
        <defs>
          <pattern id="fileHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#4A4D55" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#5D616A" strokeWidth={3} />
          </pattern>
        </defs>
        <Room top={UP.top} bot={UP.bot} id="u" light={hum} />
        <Room top={DOWN.top} bot={DOWN.bot} id="d" light={hum} />
        <Racks />
        {/* cut concrete: roof, slab, base, right wall, left wall with the intake opening */}
        <rect x={B.l} y={B.roof} width={B.r - B.l} height={B.wall} fill="url(#fileHatch)" />
        <rect x={B.l} y={B.slab} width={B.r - B.l} height={B.slabH} fill="url(#fileHatch)" />
        <rect x={B.l} y={B.floor} width={B.r - B.l} height={20} fill="url(#fileHatch)" />
        <rect x={B.r - B.wall} y={B.roof} width={B.wall} height={B.floor - B.roof} fill="url(#fileHatch)" />
        <rect x={B.l} y={B.roof} width={B.wall} height={1236 - B.roof} fill="url(#fileHatch)" />
        <rect x={B.l} y={1236} width={B.wall + 4} height={6} fill="#6B6F78" />
        <rect x={B.l - 4} y={B.roof - 6} width={B.r - B.l + 8} height={8} fill={HF} />
      </svg>
      <div style={{ position: "absolute", left: 450 - 48, top: B.roof - 100, zIndex: 3, filter: `drop-shadow(0 0 ${14 * hum}px ${HF}66)` }}>
        <Logo name="huggingface" size={96} />
      </div>
    </>
  );
};
