import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, beatsOf, clamp, land, mix, pick, ramp, stage, type JBeats } from "./J-util";
// h4v3 (builder J, 2026-09-24): "the die press". A printed sheet of four real ads lies on a steel bed. By hand, a
// craft knife cuts the first one out, slowly, a stretch per word (DOING -> YOURSELF), still not round it by YOU.
// Then the steel plate's shadow grows, on WATCH the plate comes down on the whole sheet, lifts, and the waste
// frame is stripped off: four finished ads cut clean, lying on the steel, held.

const AW = 206, AH = 366, GAP = 30, N = 4;
const SW = N * AW + (N - 1) * GAP + 56, SH = AH + 84;
const SX = (CW - SW) / 2, SY = (CH - SH) / 2 - 4;
const AX = (i: number) => SX + 28 + i * (AW + GAP), AY = SY + 30;
const ADS = ["skims-3754927.jpg", "crocs-5139685.jpg", "skims-3755019.jpg", "W-cf-04.jpg"];
const POS = ["50% 40%", "0% 50%", "50% 45%", "50% 30%"];
export const PRESS_ASSETS = ADS;
const E = 8; // the knife cuts just outside the print
const PER = 2 * (AW + AH + 4 * E);

// the knife's progress round ad 0 (0..1 of its perimeter): a stretch per word, slowing, stuck short
const cutP = (t: number, b: JBeats) =>
  0.16 * ramp(t, b.doing, b.doing + 300) + 0.14 * ramp(t, b.every, b.every + 280) +
  0.12 * ramp(t, b.ad, b.ad + 260) + 0.12 * ramp(t, b.yourself, b.yourself + 420) + 0.06 * ramp(t, b.yourself + 420, b.watch, Easing.linear);
// a point on ad 0's outline at perimeter fraction p (clockwise from its top-left)
const onRect = (p: number): [number, number] => {
  let d = p * PER;
  const x0 = AX(0) - E, y0 = AY - E, W = AW + 2 * E, H = AH + 2 * E;
  if (d < W) return [x0 + d, y0]; d -= W;
  if (d < H) return [x0 + W, y0 + d]; d -= H;
  if (d < W) return [x0 + W - d, y0 + H]; d -= W;
  return [x0, y0 + H - d];
};

const Knife: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: o, transform: "rotate(-52deg) scale(1.3)" }}>
    {/* shadow */}
    <div style={{ position: "absolute", left: 30, top: 14, width: 250, height: 22, background: "rgba(0,0,0,0.35)", filter: "blur(7px)" }} />
    {/* blade, ferrule, handle: pointing left-down to the tip at (0,0) */}
    <svg width={60} height={26} style={{ position: "absolute", left: -2, top: -13 }}>
      <polygon points="2,13 46,3 46,23" fill="url(#jblade)" />
      <defs><linearGradient id="jblade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f6f8" /><stop offset="0.5" stopColor="#b9bec4" /><stop offset="1" stopColor="#7d838a" />
      </linearGradient></defs>
    </svg>
    <div style={{ position: "absolute", left: 44, top: -14, width: 34, height: 28,
      background: "linear-gradient(180deg, #e9ebee, #9aa0a7 55%, #6b7077)" }} />
    <div style={{ position: "absolute", left: 76, top: -12, width: 200, height: 24,
      background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 3px, rgba(0,0,0,0) 3px 9px), linear-gradient(180deg, #3a3a3f, #16161a 60%, #0b0b0d)" }} />
  </div>
);

export const Press: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, fromMs, toMs, beats, assets }) => {
  const b = beatsOf(beats);
  const p = cutP(t, b);
  const [kx, ky] = onRect(p);
  const knifeOut = ramp(t, b.you, b.you + 320);
  const IMPACT = b.watch + 140;
  const shadow = ramp(t, b.you, IMPACT, Easing.in(Easing.quad));              // the plate's shadow grows as it nears
  const down = ramp(t, b.watch - 40, IMPACT, Easing.in(Easing.cubic));         // the plate comes down
  const up = ramp(t, IMPACT + 80, IMPACT + 260, Easing.out(Easing.cubic));     // and lifts away
  const plateS = t < IMPACT + 80 ? mix(1.7, 1, down) : mix(1, 1.5, up);
  const plateO = t < IMPACT + 80 ? clamp(down * 3) : 1 - up;
  const cut = t >= IMPACT;
  const strip = ramp(t, IMPACT + 260, IMPACT + 600, Easing.inOut(Easing.cubic)); // the waste frame lifts off
  const settle = land(t, IMPACT + 420, fps);
  const bump = t >= IMPACT && t < IMPACT + 120 ? 1 - 0.012 * Math.sin((Math.PI * (t - IMPACT)) / 120) : 1;
  const holes = Array.from({ length: N }, (_, i) => `M ${AX(i) - SX} ${AY - SY} h ${AW} v ${AH} h ${-AW} Z`).join(" ");
  return (
    <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>
      <div style={{ ...stage(t, fromMs, toMs, 0.045), background:
        "repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, rgba(0,0,0,0) 1px 4px), linear-gradient(160deg, #3b3d42 0%, #26282c 45%, #17181b 100%)" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${bump})` }}>
          {/* the printed sheet: its waste frame (paper minus the four ads once they are cut) */}
          <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, background: "#f2efe8",
            clipPath: cut ? `path(evenodd, 'M 0 0 H ${SW} V ${SH} H 0 Z ${holes}')` : undefined,
            transformOrigin: "50% 0%", transform: `perspective(1200px) translateY(${-70 * strip}px) rotateX(${28 * strip}deg) scale(${1 + 0.04 * strip})`,
            opacity: 1 - strip, boxShadow: `0 ${6 + 30 * strip}px ${14 + 30 * strip}px rgba(0,0,0,${0.45})` }}>
            {/* crop marks and a colour bar: it reads as a print sheet */}
            {Array.from({ length: N }, (_, i) => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy], k) => (
              <React.Fragment key={`${i}${k}`}>
                <div style={{ position: "absolute", left: AX(i) - SX + cx * AW - (cx ? -4 : 16), top: AY - SY + cy * AH - 0.5, width: 12, height: 1, background: "#222" }} />
                <div style={{ position: "absolute", left: AX(i) - SX + cx * AW - 0.5, top: AY - SY + cy * AH - (cy ? -4 : 16), width: 1, height: 12, background: "#222" }} />
              </React.Fragment>
            )))}
            <div style={{ position: "absolute", left: 28, bottom: 14, display: "flex", gap: 3 }}>
              {["#00a0e4", "#e5007e", "#ffe600", "#111", "#7fcff5", "#f39ac7", "#fff27f", "#777"].map((c) => (
                <div key={c} style={{ width: 18, height: 12, background: c }} />
              ))}
            </div>
          </div>
          {/* the four ads: printed on the sheet, then cut pieces lying on the steel */}
          {ADS.map((a, i) => (
            <div key={a} style={{ position: "absolute", left: AX(i), top: AY, width: AW, height: AH, overflow: "hidden",
              boxShadow: strip > 0 ? `0 ${2 + 10 * strip}px ${4 + 16 * strip}px rgba(0,0,0,${0.5 * strip})` : undefined,
              transform: strip > 0 ? `translateY(${-3 * (1 - settle) * strip}px)` : undefined }}>
              <Img src={staticFile(pick(assets, a))} style={{ width: AW, height: AH, objectFit: "cover", objectPosition: POS[i] }} />
            </div>
          ))}
          {/* the knife's slit round ad 0, then the die's cut round all four */}
          <svg width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - strip }}>
            {!cut && [["rgba(255,255,255,0.9)", 4, 1.2], ["#151515", 2.4, 0]].map(([c, sw, off]) => (
              <path key={String(c)} d={`M ${AX(0) - E} ${AY - E + (off as number)} h ${AW + 2 * E} v ${AH + 2 * E} h ${-AW - 2 * E} Z`} fill="none"
                stroke={c as string} strokeWidth={sw as number} strokeDasharray={`${PER} ${PER}`} strokeDashoffset={PER * (1 - p)} />
            ))}
            {cut && Array.from({ length: N }, (_, i) => <rect key={i} x={AX(i)} y={AY} width={AW} height={AH} fill="none" stroke="#1b1b1b" strokeWidth={1.6} />)}
          </svg>
          {knifeOut < 1 && <Knife x={kx + 90 * knifeOut} y={ky - 120 * knifeOut} o={1 - knifeOut} />}
        </div>
        {/* the steel plate's shadow, then the plate itself */}
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * shadow * (1 - up)})` }} />
        {plateO > 0 && (
          <div style={{ position: "absolute", left: SX - 30, top: SY - 30, width: SW + 60, height: SH + 60, opacity: plateO,
            transform: `scale(${plateS})`, filter: down < 1 && t < IMPACT ? `blur(${4 * (1 - down)}px)` : undefined,
            background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, rgba(0,0,0,0) 1px 3px), linear-gradient(150deg, #6d7178 0%, #4a4e54 40%, #2d3035 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.4)" }}>
            {[[24, 24], [SW + 36, 24], [24, SH + 36], [SW + 36, SH + 36]].map(([x, y], k) => (
              <div key={k} style={{ position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 11,
                background: "radial-gradient(circle at 35% 35%, #c9ccd1, #5d6167 70%)", boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
