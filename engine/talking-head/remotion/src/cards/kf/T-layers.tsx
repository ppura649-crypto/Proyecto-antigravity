import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { SORA } from "./R-util";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 hook T3 (builder T, round 2, 2026-09-25) "Claude edits / all my videos now". Title alone to NOW,
// then an exploded 3D stack is ASSEMBLED by Claude: their raw frame floats flat in perspective, the Claude mark hovers
// above it as the operator and drops each layer from under itself. AND: the CUT layer (a slice of their raw strip)
// slams on; its dead frames (empty chair, eyes down) drop out through the stack and the rest snap together.
// EXACTLY: the CAPTION layer (this video's own words, Sora 700 white + grey accent) drops on with weight.
// HOW: the VISUAL layer (the real Claude composer card from this video) lands. GOT: the layers compress flat into one
// finished frame, which turns face-on into their finished reel playing on the phone, landed ~2450, held.

const PW = 280, PH = 498;                         // one layer = the 9:16 frame at 0.2593
const GAP = 74, RX = 50, RZ = -30, DROP = 250;    // exploded gap, the stack's view, drop height
const PS = 0.92, PHONE_Y = 8;
const SCR = { w: 274 * PS, h: 582 * PS, cy: PHONE_Y + 9 * PS + (582 * PS) / 2 };
const FW = 104, FHH = 185, FG = 6;                // strip frames
const STRIP = [
  { img: "L-f03.jpg" }, { img: "L-f01.jpg", dead: true }, { img: "L-f05.jpg" }, { img: "L-f04.jpg", dead: true }, { img: "L-f08.jpg" },
];
export const LAYERS_ASSETS = ["T-rawp.jpg", "T-fin.jpg", "T-spark.png", "T-composer.jpg", ...STRIP.map((s) => s.img), "kf-finished-reel.mp4"];
const GRAD = "linear-gradient(100deg, #D4D7DC 0%, #9FA4AC 14%, #C6C9CF 26%, #D4D7DC 34%, #8E939B 42%, #D4D7DC 50%, #9FA4AC 64%, #C6C9CF 76%, #D4D7DC 84%, #8E939B 92%, #D4D7DC 100%)";
const CAP_SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

// a glass sheet: every layer sits on one, so the stack reads as layers
const Sheet: React.FC<{ z: number; op: number; children?: React.ReactNode; glass?: boolean }> = ({ z, op, children, glass = true }) => (
  <div style={{ position: "absolute", left: -PW / 2, top: -PH / 2, width: PW, height: PH, transform: `translateZ(${z}px)`, opacity: op,
    transformStyle: "preserve-3d",
    ...(glass ? { background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.10) 100%)",
      boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.12)" } : {}) }}>
    {children}
  </div>
);
// the soft shadow a falling layer throws on the one below (bigger and fainter while it is high)
const Shade: React.FC<{ d: number; x: number; y: number; w: number; h: number }> = ({ d, x, y, w, h }) => {
  const k = clamp(1 - d / DROP);
  if (k <= 0.02) return null;
  const sp = mix(26, 6, k);
  return <div style={{ position: "absolute", left: x + 10 * (1 - k) + 6, top: y + 14 * (1 - k) + 8, width: w, height: h, background: "#000",
    opacity: 0.42 * k, filter: `blur(${sp}px)`, transform: "translateZ(0.5px)" }} />;
};

export const Layers: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) };
  const d = data ?? {};
  const k = w / 1080;
  const T = HOLO_H["holo-h-title"]!;
  if (t < b.now) {
    return <T {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["Claude edits", "all my videos now"], fontPx: d.fontPx ?? 120 }} />;
  }
  const src = (n: string) => staticFile(pick(assets, n));

  // --- each layer's fall: [release, land]; gravity, then held
  const L = [
    { rel: b.now + 150, land: b.and },
    { rel: b.its + 70, land: b.exactly },
    { rel: b.exactly + 20, land: b.how + 15 },
  ];
  const fallZ = (i: number) => DROP * (1 - easeIn2(win(t, L[i]!.rel, L[i]!.land)));
  const shown = (i: number) => t >= L[i]!.rel;
  const hitDip = L.reduce((s, l, i) => s + (4 - i) * Math.exp(-Math.max(0, t - l.land) / 60) * (t >= l.land ? Math.sin(((t - l.land) / 1000) * Math.PI * 2 * 7) : 0), 0);

  // --- the stack: enters, compresses on GOT, turns face-on and becomes the phone screen
  const enter = easeOut3(win(t, b.now, b.now + 300));
  const squash = easeInOut(win(t, b.got - 200, b.got - 20));
  const face = easeInOut(win(t, b.got - 90, 2450));
  const gap = GAP * (1 - squash);
  const fin = win(t, b.got - 110, b.got - 10);      // the merged frame shows the finished frame
  const cy = mix(mix(-380, 318, enter), SCR.cy, face);
  const rx = mix(RX, 0, face), rz = mix(RZ, 0, face) + (1 - enter) * 12;
  const bw = mix(PW, SCR.w, face), bh = mix(PH, SCR.h, face);
  const phoneIn = win(t, 2400, 2450);
  const push = 1 + 0.025 * win(t, 2450, toMs);
  const out = win(t, toMs - 150, toMs);
  const layerOp = 1 - win(t, b.got - 60, b.got + 10);

  // --- the cut: dead frames drop out, the rest close up
  const dropAt = b.and + 90, closeT = easeInOut(win(t, b.and + 190, b.its + 150));
  const alive = STRIP.map((s, i) => STRIP.slice(0, i).filter((q) => !q.dead).length);
  const nAlive = STRIP.filter((s) => !s.dead).length;
  const wFull = STRIP.length * FW + (STRIP.length - 1) * FG, wCut = nAlive * FW + (nAlive - 1) * FG;
  const sx = (i: number) => mix(PW / 2 - wFull / 2 + i * (FW + FG), PW / 2 - wCut / 2 + alive[i]! * (FW + FG), closeT);
  const SY = PH * 0.64 - FHH / 2;

  // --- Claude, the operator: hovers above, dips and turns as it lets each layer go
  const sparkIn = easeOut3(win(t, b.now, b.now + 260));
  const kick = L.reduce((s, l) => s + Math.sin(Math.PI * win(t, l.rel - 40, l.rel + 160)), 0);
  const sparkY = mix(-200, -6, sparkIn) + 10 * kick + 3 * Math.sin(t / 180);
  const sparkRot = t * 0.06 + L.reduce((s, l) => s + 50 * easeInOut(win(t, l.rel - 40, l.rel + 200)), 0);
  const sparkOp = 1 - win(t, b.got - 120, b.got - 20);
  const SPK = 118;

  const layerZ = (i: number) => (i + 1) * gap + (shown(i) ? fallZ(i) : 0);
  const dropIn = (i: number) => win(t, L[i]!.rel, L[i]!.rel + 70);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 540, top: cy + 2.5 * hitDip, width: 0, height: 0, perspective: 1500 }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d",
          transform: `scale(${push}) rotateX(${rx}deg) rotateZ(${rz}deg)` }}>
          {/* 0: their raw frame, becoming the finished frame as the layers merge */}
          <div style={{ position: "absolute", left: -bw / 2, top: -bh / 2, width: bw, height: bh, overflow: "hidden",
            borderRadius: 40 * PS * face, opacity: 1 - win(t, 2450, 2470),
            boxShadow: `0 ${mix(30, 20, face)}px ${mix(60, 44, face)}px rgba(0,0,0,0.5)` }}>
            <Img src={src("T-rawp.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <Img src={src("T-fin.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: fin }} />
          </div>
          {/* 1: the CUT layer */}
          {shown(0) && (
            <Sheet z={layerZ(0)} op={dropIn(0) * layerOp}>
              {STRIP.map((s, i) => {
                const tau = (t - dropAt - i * 25) / 1000;
                if (s.dead && tau > 0.24) return null;
                // Claude marks the dead frame, then flicks it up and out of the stack
                const u = s.dead && tau > 0 ? tau : 0, side = i < STRIP.length / 2 ? -1 : 1;
                const dz = 2400 * u * u + 420 * u;
                const dx = side * (1600 * u * u + 160 * u);
                const rot = side * 160 * u;
                return (
                  <div key={i} style={{ position: "absolute", left: sx(i), top: SY, width: FW, height: FHH, overflow: "hidden",
                    transform: `translate3d(${dx}px, 0, ${dz + 1}px) rotateZ(${rot}deg)`, opacity: s.dead ? 1 - win(tau, 0.1, 0.24) : 1,
                    boxShadow: `0 ${4 + 30 * u}px ${10 + 40 * u}px rgba(0,0,0,0.35)` }}>
                    <Img src={src(s.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {s.dead && <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 ${(5 * win(tau, -0.09, -0.03)).toFixed(1)}px #D97757`,
                      background: `rgba(217,119,87,${(0.25 * win(tau, -0.09, -0.03)).toFixed(3)})` }} />}
                  </div>
                );
              })}
            </Sheet>
          )}
          {/* 2: the CAPTION layer, this video's own first page */}
          {shown(1) && (
            <Sheet z={layerZ(1)} op={dropIn(1) * layerOp}>
              <Shade d={fallZ(1)} x={40} y={PH * 0.53} w={PW - 80} h={130} />
              <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.52, textAlign: "center", fontFamily: SORA, fontWeight: 700,
                color: "#fff", textShadow: CAP_SHADOW, lineHeight: 1.02, transform: "translateZ(1px)" }}>
                <div style={{ fontSize: 24 }}>AI EDITS</div>
                <div style={{ fontSize: 24 }}>ALL OF MY</div>
                <div style={{ fontSize: 38, backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))", textShadow: "none" } as React.CSSProperties}>VIDEOS NOW,</div>
              </div>
            </Sheet>
          )}
          {/* 3: the VISUAL layer, the real composer card of this video */}
          {shown(2) && (
            <Sheet z={layerZ(2)} op={dropIn(2) * layerOp}>
              <Shade d={fallZ(2)} x={6} y={56} w={268} h={132} />
              <Img src={src("T-composer.jpg")} style={{ position: "absolute", left: 6, top: 56, width: 268, height: 132, objectFit: "cover",
                transform: "translateZ(1px)", boxShadow: "0 6px 16px rgba(0,0,0,0.35)" }} />
            </Sheet>
          )}
          {/* the shade each falling layer throws on the stack */}
          {shown(0) && t < L[0]!.land + 40 && (
            <div style={{ position: "absolute", left: -PW / 2, top: -PH / 2, width: PW, height: PH, transform: `translateZ(${0.5}px)` }}>
              <Shade d={fallZ(0)} x={PW / 2 - wFull / 2} y={SY} w={wFull} h={FHH} />
            </div>
          )}
        </div>
      </div>
      {/* Claude, the operator */}
      {sparkOp > 0 && (
        <Img src={src("T-spark.png")} style={{ position: "absolute", left: 540 - SPK / 2 + 70, top: sparkY, width: SPK, height: SPK,
          opacity: sparkOp, transform: `rotate(${sparkRot}deg)`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }} />
      )}
      {t >= 2400 && (
        <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={2400} startSec={d.startSec ?? 0.92}
          style={{ left: 540 - 146, top: PHONE_Y, opacity: phoneIn, transformOrigin: "50% 0", transform: `scale(${PS * push})` }} />
      )}
    </div>
  );
};
