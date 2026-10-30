import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { BODY, BW, CHALK, Cell, ChalkDefs, OSWALD, STK, Slate } from "./T-clap";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 hook T4 (builder T, round 2, 2026-09-25) "My video editor / is Claude". Title alone to NOW, then their
// raw take hangs as a strip of real frames above an editor's slate (PROD. THIS VIDEO, EDITOR = the Claude mark +
// Claude in chalk, TAKE 1, 2026). AND: the sticks slam. IT'S: the Claude mark flies in. EXACTLY: it slashes four
// orange cuts down the strip; HOW: the dead clips (empty chair, walking in, eyes down) drop away behind the slate and
// the rest snap together, the take visibly shorter. The slate then tips and falls over; its back swings up as the
// phone playing their finished reel, landed ~2450, held; exit at 2997.

const SC = 0.78, SH_ = 2 * STK + BODY;             // slate scale; slate height (unscaled)
const BY = 262, CY = BY + (SH_ * SC) / 2;          // slate top and its pivot, box px
const PS = 0.92, PH_Y = 8, PH_CY = PH_Y + 300 * PS;
const FW = 104, FH = 185, FG = 5, SY = 26;         // strip frames
const STRIP = [
  { img: "L-f00.jpg" }, { img: "L-f01.jpg", dead: true }, { img: "L-f02.jpg", dead: true }, { img: "L-f03.jpg" },
  { img: "L-f04.jpg", dead: true }, { img: "L-f05.jpg" }, { img: "L-f08.jpg" },
];
const CUTS = [1, 3, 4, 5];                         // a cut at the left edge of these frames
export const SLATE_ASSETS = [...STRIP.map((s) => s.img), "T-spark.png", "kf-finished-reel.mp4"];
const ORANGE = "#D97757";
const GRID4 = [[0, 92, BW, 3], [0, 180, BW, 3], [(2 * BW) / 3, 92, 3, 88], [BW / 2, 180, 3, 90]];

export const EditorSlate: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) };
  const d = data ?? {};
  const k = w / 1080;
  const T = HOLO_H["holo-h-title"]!;
  if (t < b.now) {
    return <T {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["My video editor", "is Claude"], fontPx: d.fontPx ?? 120 }} />;
  }
  const src = (n: string) => staticFile(pick(assets, n));
  const hit = b.and + 12;

  // --- entrance and the clap (as T2)
  const rise = easeOut3(win(t, b.now, b.now + 330));
  const stripIn = easeOut3(win(t, b.now, b.now + 260));
  const fall = easeIn2(win(t, b.now + 190, hit));
  const open = t < hit ? 34 * (1 - fall) : 1.6 * Math.sin(Math.PI * win(t, hit, hit + 90));
  const stickBlur = t < hit ? 3.5 * win(t, hit - 70, hit) : 0;
  const jolt = t >= hit ? Math.exp(-(t - hit) / 70) * Math.sin(((t - hit) / 1000) * 2 * Math.PI * 9) : 0;

  // --- the edit: four slashes on EXACTLY, dead clips drop and the rest close up on HOW
  const x0 = 540 - (STRIP.length * FW + (STRIP.length - 1) * FG) / 2;
  const alive = STRIP.map((_, i) => STRIP.slice(0, i).filter((q) => !q.dead).length);
  const nA = STRIP.filter((s) => !s.dead).length;
  const x1 = 540 - (nA * FW + (nA - 1) * FG) / 2;
  const close = easeInOut(win(t, b.how + 80, b.how + 260));
  const cutX = CUTS.map((c) => x0 + c * (FW + FG) - FG / 2);
  const cT = CUTS.map((_, i) => b.exactly - 60 + i * 55);        // each slash starts here, 40 ms long
  const SL = 40, YT = SY - 16, YB = SY + FH + 16;
  // the spark: flies in on IT'S, then slash - hop - slash, then leaves up and out
  let spx = 1000, spy = -80;
  const inU = easeOut3(win(t, b.its, cT[0]! - 10));
  spx = mix(1010, cutX[0]!, inU); spy = mix(-90, YT, inU);
  for (let i = 0; i < CUTS.length; i++) {
    if (t >= cT[i]!) { const u = easeInOut(win(t, cT[i]!, cT[i]! + SL)); spx = cutX[i]!; spy = mix(YT, YB, u); }
    if (i < CUTS.length - 1 && t >= cT[i]! + SL) {
      const u = easeInOut(win(t, cT[i]! + SL, cT[i + 1]!)); spx = mix(cutX[i]!, cutX[i + 1]!, u); spy = mix(YB, YT, u);
    }
  }
  const lastEnd = cT[CUTS.length - 1]! + SL;
  if (t >= lastEnd) { const u = easeInOut(win(t, lastEnd, lastEnd + 220)); spx = mix(cutX[CUTS.length - 1]!, 900, u); spy = mix(YB, -120, u); }
  const spRot = t * 0.08 + 90 * win(t, cT[0]!, lastEnd);
  const spOp = 1 - win(t, lastEnd + 120, lastEnd + 220);

  // --- the flip: tip, fall over, the back swings up as the phone
  const tEdge = b.got - 40, tLand = 2450;
  const tip = -13 * easeInOut(win(t, b.how + 120, b.how + 230));
  const f1 = easeIn2(win(t, b.how + 230, tEdge));
  const f2 = win(t, tEdge, tLand);
  const edge = t >= tEdge;
  const aSlate = tip + (-90 - tip) * f1;
  const aPhone = 90 * Math.pow(1 - f2, 3);
  const sSlate = SC * mix(1, 0.69, f1);           // edge-on it is as wide as the phone
  const cyNow = mix(CY, PH_CY, easeInOut(win(t, b.how + 230, tLand - 60)));
  const flipBlur = 4 * Math.max(0, 1 - Math.abs(t - tEdge) / 90);
  const push = 1 + 0.025 * win(t, tLand, toMs);
  const out = win(t, toMs - 150, toMs);
  const lightK = clamp(Math.cos((aSlate * Math.PI) / 180) * 1.05);
  const boardY = mix(-560, 0, rise) + 5 * jolt;
  const boardRot = mix(-8, -1.5, rise) - 0.7 * jolt;
  const stripOp = 1 - win(t, tEdge, tLand - 20);

  const body = (
    <>
      <Cell x={0} y={0} w={BW} label="PROD." val="THIS VIDEO" px={60} />
      <div style={{ position: "absolute", left: 0, top: 95, width: (2 * BW) / 3 }}>
        <div style={{ fontFamily: OSWALD, fontWeight: 500, fontSize: 17, letterSpacing: 2.5, color: "rgba(245,245,240,0.82)", paddingLeft: 12, paddingTop: 7 }}>EDITOR</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: -2 }}>
          <Img src={src("T-spark.png")} style={{ width: 44, height: 44 }} />
          <div style={{ fontFamily: CHALK, fontWeight: 700, fontSize: 50, lineHeight: 1, color: "#f3f3ee", filter: "url(#tclapchalk)", opacity: 0.93 }}>Claude</div>
        </div>
      </div>
      <Cell x={(2 * BW) / 3} y={95} w={BW / 3} label="TAKE" val="1" px={50} />
      <Cell x={0} y={183} w={BW / 2} label="ROLL" val="A001" px={44} />
      <Cell x={BW / 2} y={183} w={BW / 2} label="DATE" val="2026" px={44} />
    </>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <ChalkDefs />
      {/* their raw take as a strip of real frames */}
      <div style={{ position: "absolute", inset: 0, opacity: stripOp, transform: `translateY(${mix(-320, 0, stripIn)}px)` }}>
        {STRIP.map((s, i) => {
          const tau = (t - b.how - (i % 3) * 30) / 1000;
          if (s.dead && tau > 0.36) return null;
          const x = mix(x0 + i * (FW + FG), x1 + alive[i]! * (FW + FG), close);
          const dy = s.dead && tau > 0 ? 0.5 * 3400 * tau * tau : 0;
          const rot = s.dead && tau > 0 ? (i % 2 ? 1 : -1) * 55 * tau : 0;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: SY + dy, width: FW, height: FH, overflow: "hidden",
              transform: `rotate(${rot}deg)`, opacity: s.dead ? 1 - win(tau, 0.2, 0.36) : 1,
              boxShadow: "0 10px 22px rgba(0,0,0,0.45)" }}>
              <Img src={src(s.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {s.dead && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(0.35 * win(t, cT[0]!, b.how)).toFixed(3)})` }} />}
            </div>
          );
        })}
        {/* the orange strokes Claude cuts with */}
        {CUTS.map((_, i) => {
          const u = easeInOut(win(t, cT[i]!, cT[i]! + SL));
          const op = u * (1 - win(t, cT[i]! + 140, cT[i]! + 320));
          if (op <= 0.01) return null;
          return (
            <div key={i} style={{ position: "absolute", left: cutX[i]! - 3, top: YT, width: 6, height: (YB - YT) * u, borderRadius: 3,
              background: ORANGE, opacity: op, boxShadow: `0 0 10px 2px rgba(217,119,87,0.75), 0 0 2px #fff` }} />
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, perspective: 1300, perspectiveOrigin: `540px ${CY}px` }}>
        {!edge && (
          <div style={{ position: "absolute", left: 540 - BW / 2, top: CY - SH_ / 2, width: BW, height: SH_, transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
            filter: `drop-shadow(0 ${mix(26, 8, f1)}px ${mix(30, 14, f1)}px rgba(0,0,0,0.5))${flipBlur > 0.3 ? ` blur(${flipBlur.toFixed(2)}px)` : ""}`,
            transform: `translateY(${boardY + (cyNow - CY)}px) scale(${sSlate}) rotateZ(${boardRot * (1 - f1)}deg) rotateY(-9deg) rotateX(${aSlate}deg)` }}>
            <Slate open={open} blur={stickBlur} lightK={lightK} body={body} grid={GRID4} />
          </div>
        )}
        {edge && (
          <div style={{ position: "absolute", left: 540 - 146, top: cyNow - 300, width: 292, height: 600,
            transformOrigin: "50% 50%", filter: flipBlur > 0.3 ? `blur(${flipBlur.toFixed(2)}px)` : undefined,
            transform: `scale(${PS * push}) rotateX(${aPhone}deg)` }}>
            <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={tEdge} startSec={d.startSec ?? 0.92} style={{ left: 0, top: 0 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "#000", opacity: 0.55 * Math.sin((aPhone * Math.PI) / 180) }} />
          </div>
        )}
      </div>
      {/* Claude, the editor */}
      {spOp > 0 && t >= b.its && (
        <Img src={src("T-spark.png")} style={{ position: "absolute", left: spx - 42, top: spy - 42, width: 84, height: 84, opacity: spOp,
          transform: `rotate(${spRot}deg)`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }} />
      )}
    </div>
  );
};
