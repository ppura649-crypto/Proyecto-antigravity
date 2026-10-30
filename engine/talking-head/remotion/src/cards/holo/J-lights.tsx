import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, beatsOf, mix, pick, ramp, stage, type JBeats } from "./J-util";
// h4v4 (builder J, 2026-09-24): "lights on". A long gallery wall of framed real ads recedes into the dark. By hand,
// one small lamp clicks on over one poster per word (DOING, EVERY, AD, YOURSELF): four warm pools, the rest of the
// wall still black. On WATCH the ceiling banks come on down the whole corridor, near to far: a lit gallery of a
// month's ads, held under a slow dolly until the Holo hand-over.

const N = 10, PW = 210, PHt = 372, PITCH = 300, X0 = 70, WALL_H = 560, PY = 112;
const WALL_W = X0 + N * PITCH + 200;
const ADS = ["skims-3754927.jpg", "W-cf-08.jpg", "skims-3754962.jpg", "W-cf-04.jpg", "skims-3755019.jpg",
  "W-cf-12.jpg", "skims-3754998.jpg", "W-cf-10.jpg", "skims-3754964.jpg", "crocs-5139685.jpg"];
const POS: Record<number, string> = { 9: "0% 50%", 1: "50% 30%", 3: "50% 30%", 7: "50% 30%" };
export const LIGHTS_ASSETS = ADS;

const DARK = [11, 11, 12], LIT = [214, 209, 199];
const rgb = (a: number[], b: number[], f: number) => `rgb(${a.map((x, i) => Math.round(mix(x, b[i], f))).join(",")})`;

// the lamp over poster i (by hand) and the ceiling bank over it (on WATCH, near to far)
const lampOn = (i: number, t: number, b: JBeats) => {
  const at = [b.doing, b.every, b.ad, b.yourself][i];
  return at === undefined ? 0 : ramp(t, at, at + 90, Easing.out(Easing.quad));
};
const bankOn = (i: number, t: number, b: JBeats) => ramp(t, b.watch + i * 55, b.watch + i * 55 + 110, Easing.out(Easing.quad));

const Bay: React.FC<{ i: number; t: number; b: JBeats; assets: string[] }> = ({ i, t, b, assets }) => {
  const lamp = lampOn(i, t, b), bank = bankOn(i, t, b);
  const x = X0 + i * PITCH - (PITCH - PW) / 2;
  const light = Math.max(bank, 0.001);
  return (
    <>
      {/* the wall bay: black, a warm pool under its lamp, then the gallery white under the bank */}
      <div style={{ position: "absolute", left: x, top: 0, width: PITCH, height: WALL_H,
        background: `radial-gradient(ellipse 62% 48% at 50% 0%, rgba(255,248,230,${0.55 * bank}), rgba(255,248,230,0) 72%),
          radial-gradient(ellipse 46% 58% at 50% 42%, rgba(255,196,120,${0.34 * lamp * (1 - bank)}), rgba(255,196,120,0) 70%),
          ${rgb(DARK, LIT, light)}` }} />
      {/* the track lamp */}
      <div style={{ position: "absolute", left: x + PITCH / 2 - 16, top: 14, width: 32, height: 22, background: "#1a1a1c",
        boxShadow: `0 6px ${18 * Math.max(lamp, bank)}px rgba(255,236,200,${0.9 * Math.max(lamp, bank)})` }}>
        <div style={{ position: "absolute", left: 6, right: 6, bottom: -3, height: 4,
          background: `rgba(255,244,220,${0.25 + 0.75 * Math.max(lamp, bank)})` }} />
      </div>
      {/* the framed poster: black frame, white mat, the real ad */}
      <div style={{ position: "absolute", left: X0 + i * PITCH, top: PY, width: PW, height: PHt, background: "#0d0d0e", padding: 7,
        boxSizing: "border-box", boxShadow: `0 ${10 + 14 * bank}px ${22 + 16 * bank}px rgba(0,0,0,${0.35 + 0.25 * bank})` }}>
        <div style={{ position: "absolute", inset: 7, background: rgb([30, 30, 30], [246, 245, 241], Math.max(bank, lamp * 0.8)), padding: 12, boxSizing: "border-box" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            <Img src={staticFile(pick(assets, ADS[i]))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: POS[i] ?? "50% 40%",
              filter: `brightness(${0.07 + 0.8 * lamp * (1 - bank) + 0.93 * bank})` }} />
            <div style={{ position: "absolute", inset: 0, opacity: lamp * (1 - bank),
              background: "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)" }} />
          </div>
        </div>
      </div>
    </>
  );
};

export const Lights: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, assets }) => {
  const b = beatsOf(beats);
  const all = ramp(t, b.watch, b.watch + N * 55 + 110);
  const dolly = 20 - 60 * ramp(t, fromMs, toMs, Easing.linear) - 30 * ramp(t, b.watch, b.watch + 900, Easing.out(Easing.cubic));
  const turn = mix(40, 34, ramp(t, fromMs, fromMs + 500, Easing.out(Easing.cubic))) + 4 * ramp(t, b.watch, b.watch + 900);
  return (
    <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>
      <div style={{ ...stage(t, fromMs, toMs, 0.03), overflow: "hidden", background: rgb([6, 6, 7], [60, 57, 53], all) }}>
        {/* the floor, catching the light */}
        <div style={{ position: "absolute", left: 0, right: 0, top: CH * 0.78, bottom: 0,
          background: `linear-gradient(180deg, ${rgb([8, 8, 9], [96, 90, 82], all)}, ${rgb([4, 4, 5], [40, 37, 34], all)})` }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, perspective: 950, perspectiveOrigin: "38% 45%" }}>
          <div style={{ position: "absolute", left: 30, top: (CH - WALL_H) / 2 - 20, width: WALL_W, height: WALL_H, transformOrigin: "0% 50%",
            transform: `translateX(${dolly}px) rotateY(${turn}deg)` }}>
            {Array.from({ length: N }, (_, i) => <Bay key={i} i={i} t={t} b={b} assets={assets} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
