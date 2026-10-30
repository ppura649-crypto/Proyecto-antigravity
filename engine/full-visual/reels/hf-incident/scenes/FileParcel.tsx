// `file`, downstairs: people's parcels (their uploaded data files) ride in on the conveyor; Hugging Face's own claw
// (a yellow trolley with its mark, no face) picks one up on "opens", sets it on the table, and it opens on "upload".
// A paper tag rises out of it: "see other file", with an arrow that points at the other parcels on "point", swings
// up on "pointed", and shoots a beam through the ceiling into the vault on "server's".
import React from "react";
import { draw, ease, prog, useScene } from "../../../src/engine";
import { AMBER, HF, Logo } from "./parts";
import { VAULT } from "./FileBuilding";

const PW = 88;
const PH = 62;
const BELT = 1322;
const SPEED = 2.4;
const GAP = 132;
const GRAB_X = 380; // parcel centre under the claw
const TABLE = { l: 575, r: 755, top: 1300 };
const PLACE_X = 665;
export const PIVOT = { x: 540, y: 1172 };
const A0 = 136; // the arrow first points at the parcels on the belt
const A1 = (Math.atan2(VAULT.y - PIVOT.y, VAULT.x - PIVOT.x) * 180) / Math.PI + 360; // then at the vault
const REACH = Math.hypot(VAULT.x - PIVOT.x, VAULT.y - PIVOT.y) - VAULT.r + 6;

export type FileCues = { grab: number; upload: number; format: number; point: number; other: number; pointed: number; beam: number; beamDur: number; secrets: number };

/** the claw's tip (x, y) and whether it holds the parcel */
const claw = (f: number, g: number) => {
  const yUp = 1150;
  const yGrip = BELT - PH;
  const yCarry = 1172;
  const yPlace = TABLE.top - PH;
  if (f < g) return { x: GRAB_X, y: yUp, held: false, closed: 0 };
  if (f < g + 10) return { x: GRAB_X, y: yUp + (yGrip - yUp) * prog(f, g, 10, ease.inOut), held: false, closed: 0 };
  if (f < g + 14) return { x: GRAB_X, y: yGrip, held: true, closed: prog(f, g + 10, 4) };
  if (f < g + 26) return { x: GRAB_X, y: yGrip + (yCarry - yGrip) * prog(f, g + 14, 12, ease.inOut), held: true, closed: 1 };
  if (f < g + 46) return { x: GRAB_X + (PLACE_X - GRAB_X) * prog(f, g + 26, 20, ease.inOut), y: yCarry, held: true, closed: 1 };
  if (f < g + 56) return { x: PLACE_X, y: yCarry + (yPlace - yCarry) * prog(f, g + 46, 10, ease.inOut), held: true, closed: 1 };
  if (f < g + 60) return { x: PLACE_X, y: yPlace, held: false, closed: 1 - prog(f, g + 56, 4) };
  if (f < g + 74) return { x: PLACE_X, y: yPlace + (yUp - 40 - yPlace) * prog(f, g + 60, 14, ease.inOut), held: false, closed: 0 };
  return { x: PLACE_X + (800 - PLACE_X) * prog(f, g + 74, 18, ease.inOut), y: yUp - 40, held: false, closed: 0 };
};

/** one cardboard parcel; flaps open outward from `open` */
const Parcel: React.FC<{ x: number; y: number; open?: number; glow?: number; sticker: string; hot?: number }> = ({ x, y, open = 0, glow = 0, sticker, hot = 0 }) => (
  <div style={{ position: "absolute", left: x - PW / 2, top: y, width: PW, height: PH, zIndex: 4 }}>
    {glow > 0 && <div style={{ position: "absolute", left: -60, top: -110, width: PW + 120, height: 150, background: `radial-gradient(ellipse at 50% 100%, ${HF}cc, transparent 65%)`, opacity: glow }} />}
    <div style={{ position: "absolute", left: 0, top: -12 * (1 - open), width: PW / 2, height: 12, background: "#B98A52", transformOrigin: "0 100%", transform: `rotate(${-130 * open}deg)` }} />
    <div style={{ position: "absolute", right: 0, top: -12 * (1 - open), width: PW / 2, height: 12, background: "#A97C48", transformOrigin: "100% 100%", transform: `rotate(${130 * open}deg)` }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: "linear-gradient(160deg,#D9A868,#B07D45)", boxShadow: `0 6px 10px rgba(0,0,0,0.5), 0 0 0 ${3 * hot}px ${HF}` }} />
    <div style={{ position: "absolute", left: PW / 2 - 7, top: 0, width: 14, height: PH, background: "#E8C98F", opacity: open > 0 ? 0.5 : 0.85 }} />
    <div style={{ position: "absolute", left: 10, top: 20, width: 26, height: 20, borderRadius: 3, background: sticker }} />
    <div style={{ position: "absolute", left: 13, top: 25, width: 18, height: 3, background: "rgba(0,0,0,0.3)" }} />
    <div style={{ position: "absolute", left: 13, top: 31, width: 12, height: 3, background: "rgba(0,0,0,0.3)" }} />
  </div>
);

const STICKERS = ["#FFFFFF", "#9FD3FF", "#FFB3C1", "#B8F2C3", "#FFE39A", "#D7C4FF"];

/** belt, rollers, moving parcels, and the grabbed one */
export const Intake: React.FC<{ c: FileCues }> = ({ c }) => {
  const { f } = useScene();
  const t0 = c.grab - (GRAB_X - PW / 2 + 60) / SPEED;
  const cl = claw(f, c.grab);
  const hotOther = prog(f, c.other, 6) * (1 - prog(f, c.pointed, 10));
  const parcels: React.ReactNode[] = [];
  for (let k = -3; k < 9; k++) {
    if (k === 0 && f >= c.grab + 10) continue;
    const x = -60 + SPEED * (f - t0) - GAP * k + PW / 2;
    if (x < 10 || x > 470) continue;
    const fade = Math.min(1, (x - 10) / 30, (470 - x) / 30);
    parcels.push(
      <div key={k} style={{ opacity: fade }}>
        <Parcel x={x} y={BELT - PH} sticker={STICKERS[(k + 12) % 6]} hot={k > 0 && x > 170 && x < 450 ? hotOther : 0} />
      </div>,
    );
  }
  const openP = prog(f, c.upload, 8, ease.out);
  const glow = f >= c.upload ? 0.6 + 0.2 * Math.sin((f - c.upload) / 6) : 0;
  const px = f >= c.grab + 10 ? cl.x : GRAB_X;
  const py = f >= c.grab + 10 && f < c.grab + 60 ? cl.y : f >= c.grab + 60 ? TABLE.top - PH : BELT - PH;
  return (
    <>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 3 }}>
        <rect x={30} y={BELT} width={440} height={16} rx={8} fill="#2C2F36" stroke="#50545D" strokeWidth={2} />
        {Array.from({ length: 11 }, (_, i) => {
          const x = 48 + i * 40;
          const a = (f * SPEED * 6) % 360;
          return <circle key={i} cx={x} cy={BELT + 8} r={6} fill="#6B6F78" stroke="#3A3D44" strokeWidth={2} strokeDasharray="4 3" transform={`rotate(${a} ${x} ${BELT + 8})`} />;
        })}
        {[60, 440].map((x) => <rect key={x} x={x - 5} y={BELT + 16} width={10} height={B_FLOOR - BELT - 16} fill="#3A3D44" />)}
        {/* the inspection table */}
        <rect x={TABLE.l} y={TABLE.top} width={TABLE.r - TABLE.l} height={12} rx={3} fill="#5B5F68" />
        <rect x={TABLE.l + 12} y={TABLE.top + 12} width={10} height={B_FLOOR - TABLE.top - 12} fill="#3A3D44" />
        <rect x={TABLE.r - 22} y={TABLE.top + 12} width={10} height={B_FLOOR - TABLE.top - 12} fill="#3A3D44" />
      </svg>
      {parcels}
      <Parcel x={px} y={py} sticker={STICKERS[0]} open={openP} glow={glow} />
    </>
  );
};
const B_FLOOR = 1385;

/** the claw on its ceiling rail: HF's worker, a trolley with the mark */
export const Claw: React.FC<{ c: FileCues }> = ({ c }) => {
  const { f } = useScene();
  const cl = claw(f, c.grab);
  const spread = 16 - 10 * cl.closed;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={110} y={1066} width={680} height={10} fill="#50545D" />
        <line x1={cl.x} y1={1112} x2={cl.x} y2={cl.y - 30} stroke="#9EA2AA" strokeWidth={4} />
        <rect x={cl.x - 22} y={cl.y - 34} width={44} height={16} rx={4} fill={HF} stroke="#A87900" strokeWidth={2} />
        <path d={`M${cl.x - 14} ${cl.y - 18} L${cl.x - 14 - spread} ${cl.y + 2} L${cl.x - 8 - spread * 0.3} ${cl.y + 14}`} fill="none" stroke="#C9CCD2" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${cl.x + 14} ${cl.y - 18} L${cl.x + 14 + spread} ${cl.y + 2} L${cl.x + 8 + spread * 0.3} ${cl.y + 14}`} fill="none" stroke="#C9CCD2" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: cl.x - 50, top: 1072, width: 100, height: 42, borderRadius: 8, background: `linear-gradient(180deg, ${HF}, ${AMBER})`, border: "2px solid #A87900", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 12px rgba(0,0,0,0.5)" }}>
        <Logo name="huggingface" size={34} />
      </div>
    </div>
  );
};

/** the tag, its arrow, and the beam to the vault */
export const Pointer: React.FC<{ c: FileCues }> = ({ c }) => {
  const { f } = useScene();
  const rise = prog(f, c.format - 16, 16, ease.out);
  if (f < c.format - 16) return null;
  const cy = TABLE.top - PH - 20 + (PIVOT.y - (TABLE.top - PH - 20)) * rise;
  const grow = prog(f, c.point, 8, ease.back);
  const a = A0 + (A1 - A0) * prog(f, c.pointed, 14, ease.inOut);
  const rad = (a * Math.PI) / 180;
  const tip = { x: PIVOT.x + 128 * Math.cos(rad), y: PIVOT.y + 128 * Math.sin(rad) };
  const end = { x: PIVOT.x + REACH * Math.cos(rad), y: PIVOT.y + REACH * Math.sin(rad) };
  const hitSlab = prog(f, c.beam + 4, 6) * (1 - prog(f, c.beam + 20, 30));
  const pulse = 0.8 + 0.2 * Math.sin(f / 3);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 6 }}>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 0 10px ${HF})` }}>
        {f >= c.beam && <path d={`M${tip.x} ${tip.y} L${end.x} ${end.y}`} stroke={HF} strokeWidth={10 * pulse} strokeLinecap="round" fill="none" {...draw(f, c.beam, c.beamDur)} />}
        {f >= c.beam && <circle cx={PIVOT.x + ((PIVOT.y - 1043) / -Math.sin(rad)) * Math.cos(rad)} cy={1043} r={34 * hitSlab} fill="#FFF3B0" opacity={0.8 * hitSlab} />}
        {f >= c.point && (
          <g transform={`translate(${PIVOT.x} ${cy - PIVOT.y + PIVOT.y}) rotate(${a}) scale(${grow} 1)`}>
            <line x1={0} y1={0} x2={100} y2={0} stroke={HF} strokeWidth={12} strokeLinecap="round" />
            <path d="M92 -22 L130 0 L92 22 Z" fill={HF} />
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", left: PIVOT.x, top: cy - 32, width: 250, height: 64, borderRadius: 8, background: "#FFF6DD", boxShadow: "0 10px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 31, color: "#1A1A1A", opacity: prog(f, c.format - 16, 5) }}>
        <div style={{ position: "absolute", left: -9, top: 26, width: 12, height: 12, borderRadius: 6, background: "#1A1A1A" }} />
        see other file
      </div>
    </div>
  );
};
