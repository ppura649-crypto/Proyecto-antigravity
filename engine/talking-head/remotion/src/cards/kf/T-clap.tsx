import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 hook T2 (builder T, 2026-09-25) "Clapperboard". Title alone to NOW, then a real film slate rises in
// front of a still of their raw take: black acrylic slate with printed grid and chalk in their words (RAW TAKE, take 1),
// striped hinged sticks held open. The sticks slam shut on AND (the board jolts with the hit). On EXACTLY the slate
// tips forward, on HOW it falls over like a heavy board, receding as it goes edge-on; its back swings up as a
// phone playing their finished captioned reel, in front of the raw still, landed by ~2440 and held; exit at 2997.

export const OSWALD = `${loadOswald("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily}, sans-serif`;
export const CHALK = `${loadCaveat("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily}, cursive`;
export const CLAP_ASSETS = ["T-rawp.jpg", "kf-finished-reel.mp4"];

export const BW = 500, BODY = 270, STK = 52;            // board width, slate body height, stick height
const BX = 540 - BW / 2, BY = 190;                // board top-left (top of the fixed stick) in the box
const CX = 540, CY = BY + (2 * STK + BODY) / 2 - STK / 2; // board pivot (its centre)
const PS = 0.92, PH_Y = 8;
const PANEL = { x: 540 - 150, y: 20, w: 300, h: 533 };

const stripes = (deg: number) =>
  `repeating-linear-gradient(${deg}deg, #f4f4f1 0 34px, #111113 34px 68px)`;
const Stick: React.FC<{ deg: number; top: number; open: number; blur: number }> = ({ deg, top, open, blur }) => (
  <div style={{ position: "absolute", left: 0, top, width: BW, height: STK, transformOrigin: `16px ${STK}px`,
    transform: `rotate(${-open}deg)`, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
    background: stripes(deg), borderRadius: 3,
    boxShadow: "inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.45), 0 6px 10px rgba(0,0,0,0.35)" }}>
    {/* satin sheen on the lacquered wood */}
    <div style={{ position: "absolute", inset: 0, borderRadius: 3,
      background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%)" }} />
  </div>
);

export const Cell: React.FC<{ x: number; y: number; w: number; label: string; val: string; px: number }> = ({ x, y, w, label, val, px }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>
    <div style={{ fontFamily: OSWALD, fontWeight: 500, fontSize: 17, letterSpacing: 2.5, color: "rgba(245,245,240,0.82)", paddingLeft: 12, paddingTop: 7 }}>{label}</div>
    <div style={{ fontFamily: CHALK, fontWeight: 700, fontSize: px, lineHeight: 1, color: "#f3f3ee", textAlign: "center", marginTop: -4,
      filter: "url(#tclapchalk)", opacity: 0.93, textShadow: "0 0 2px rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{val}</div>
  </div>
);

const GRID = [[0, 92, BW, 3], [0, 180, BW, 3], [BW / 3, 92, 3, 88], [(2 * BW) / 3, 92, 3, 88], [BW / 2, 180, 3, 90]];
export const Slate: React.FC<{ open: number; blur: number; lightK: number; body?: React.ReactNode; grid?: number[][] }> = ({ open, blur, lightK, body, grid = GRID }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: 2 * STK + BODY, transformStyle: "preserve-3d" }}>
    {/* the acrylic's thickness: stacked edge layers */}
    {[10, 7, 4].map((z) => (
      <div key={z} style={{ position: "absolute", left: 0, top: 2 * STK, width: BW, height: BODY, background: "#050506", borderRadius: 4,
        transform: `translateZ(${-z}px)` }} />
    ))}
    <div style={{ position: "absolute", left: 0, top: 2 * STK, width: BW, height: BODY, borderRadius: 4, overflow: "hidden",
      background: "linear-gradient(160deg, #202023 0%, #111113 45%, #0a0a0b 100%)",
      boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 2px 0 rgba(255,255,255,0.12)" }}>
      {/* printed grid */}
      {grid.map(([x, y, w, h], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: h, background: "rgba(240,240,235,0.78)" }} />
      ))}
      {body ?? (<>
        <Cell x={0} y={0} w={BW} label="PROD." val="RAW TAKE" px={62} />
        <Cell x={0} y={95} w={BW / 3} label="ROLL" val="A001" px={46} />
        <Cell x={BW / 3} y={95} w={BW / 3} label="SCENE" val="1" px={50} />
        <Cell x={(2 * BW) / 3} y={95} w={BW / 3} label="TAKE" val="1" px={50} />
        <Cell x={0} y={183} w={BW / 2} label="CAMERA" val="iPhone" px={44} />
        <Cell x={BW / 2} y={183} w={BW / 2} label="DATE" val="2026" px={44} />
      </>)}
      {/* old chalk smudges and the acrylic's sheen */}
      <div style={{ position: "absolute", inset: 0, filter: "url(#tclapdust)", opacity: 0.16, background: "#fff", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.10) 42%, rgba(255,255,255,0) 55%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - lightK }} />
    </div>
    <Stick deg={60} top={STK} open={0} blur={0} />
    <Stick deg={-60} top={0} open={open} blur={blur} />
    {/* hinge: a steel plate with its pin */}
    <div style={{ position: "absolute", left: 2, top: STK - 20, width: 38, height: 40, borderRadius: 6,
      background: "linear-gradient(145deg, #e3e5e8 0%, #9aa0a6 45%, #5d6166 100%)", boxShadow: "0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
      <div style={{ position: "absolute", left: 11, top: 12, width: 16, height: 16, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #fbfbfb, #8b9096 60%, #4a4d51)", boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
    </div>
  </div>
);

export const ChalkDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="tclapchalk" x="-5%" y="-10%" width="110%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feComponentTransfer in="n" result="grain"><feFuncA type="linear" slope={1.5} intercept={-0.12} /></feComponentTransfer>
      <feComposite in="d" in2="grain" operator="in" />
    </filter>
    <filter id="tclapdust"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves={3} seed={9} />
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.2 -0.55" /></filter>
  </svg>
);

export const Clapper: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) };
  const d = data ?? {};
  const k = w / 1080;
  const T = HOLO_H["holo-h-title"]!;
  if (t < b.now) {
    return <T {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;
  }
  const src = (n: string) => staticFile(pick(assets, n));
  const hit = b.and + 12;

  // entrance: the board drops in from above (never across their eyes), sticks open
  const rise = easeOut3(win(t, b.now, b.now + 330));
  const panelIn = easeOut3(win(t, b.now, b.now + 280));
  const panelOp = 1;
  const panelY = mix(-600, 0, easeOut3(win(t, b.now, b.now + 250)));
  // the clap: the top stick falls shut with gravity, a 1.5 degree rebound, the board takes the hit
  const fall = easeIn2(win(t, b.now + 190, hit));
  const reb = 1.6 * Math.sin(Math.PI * win(t, hit, hit + 90));
  const open = t < hit ? 34 * (1 - fall) : reb;
  const stickBlur = t < hit ? 3.5 * win(t, hit - 70, hit) : 0;
  const jolt = t >= hit ? Math.exp(-(t - hit) / 70) * Math.sin(((t - hit) / 1000) * 2 * Math.PI * 9) : 0;

  // the flip: tip on EXACTLY, fall over on HOW, the back swings up as the phone
  const tip = -13 * easeInOut(win(t, b.exactly - 150, b.exactly + 40));
  const tEdge = b.how + 60, tLand = 2430;
  const f1 = easeIn2(win(t, b.exactly + 40, tEdge));      // slate half: -13 -> -90, gravity
  const f2 = win(t, tEdge, tLand);                          // phone half: 90 -> 0, soft landing
  const edge = t >= tEdge;
  const aSlate = tip + (-90 - tip) * f1;
  const aPhone = 90 * (1 - (1 - Math.pow(1 - f2, 3)));
  const sSlate = mix(1, 0.54, f1);
  const cyNow = mix(CY, PH_Y + 300 * PS, easeInOut(win(t, b.exactly + 40, tLand - 60)));
  const flipBlur = 4 * Math.max(0, 1 - Math.abs(t - tEdge) / 90);
  const push = 1 + 0.025 * win(t, tLand, toMs);
  const out = win(t, toMs - 150, toMs);
  const idle = 1 + 0.012 * win(t, hit, b.exactly);

  const lightK = clamp(Math.cos((aSlate * Math.PI) / 180) * 1.05);
  const boardY = mix(-560, 0, rise) + 5 * jolt;
  const boardRot = mix(-8, -1.5, rise) - 0.7 * jolt;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <ChalkDefs />
      {/* their raw take, behind the slate */}
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, overflow: "hidden",
        opacity: panelOp * (1 - win(t, tLand - 120, tLand + 20)),
        transform: `translateY(${panelY}px) scale(${mix(1.05, 1, panelIn) * mix(1, 0.94, easeInOut(win(t, tEdge, tLand)))}) rotate(${mix(0, -2.5, panelIn)}deg)`,
        boxShadow: "0 22px 46px rgba(0,0,0,0.5), 0 0 0 5px #0c0c0d",
        filter: `brightness(${mix(1, 0.75, win(t, tEdge, tLand))})` }}>
        <Img src={src("T-rawp.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.08) saturate(1.1)" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, perspective: 1300, perspectiveOrigin: `540px ${CY}px` }}>
        {!edge && (
          <div style={{ position: "absolute", left: BX, top: BY, width: BW, height: 2 * STK + BODY, transformStyle: "preserve-3d",
            transformOrigin: `${BW / 2}px ${CY - BY}px`,
            filter: `drop-shadow(0 ${mix(26, 8, f1)}px ${mix(30, 14, f1)}px rgba(0,0,0,0.5))${flipBlur > 0.3 ? ` blur(${flipBlur.toFixed(2)}px)` : ""}`,
            transform: `translateY(${boardY + (cyNow - CY)}px) scale(${sSlate * idle}) rotateZ(${boardRot * (1 - f1)}deg) rotateY(-9deg) rotateX(${aSlate}deg)` }}>
            <Slate open={open} blur={stickBlur} lightK={lightK} />
          </div>
        )}
        {edge && (
          <div style={{ position: "absolute", left: 540 - 146, top: cyNow - 300, width: 292, height: 600,
            transformOrigin: "50% 50%", filter: flipBlur > 0.3 ? `blur(${flipBlur.toFixed(2)}px)` : undefined,
            transform: `scale(${PS * push}) rotateX(${aPhone}deg)` }}>
            <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={tEdge} startSec={d.startSec ?? 0.92}
              style={{ left: 0, top: 0 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "#000", opacity: 0.55 * Math.sin((aPhone * Math.PI) / 180) }} />
          </div>
        )}
      </div>
    </div>
  );
};
