import React from "react";
import { staticFile } from "remotion";
import type { CardProps } from "../props";
import { NH, NW, Nle } from "./S-nle";
import { beat, box, clamp, inQ, life, mix, pick, ramp, settle } from "./S-util";
// V12 "blinds" (builder S, 2026-09-25), You 27377 -> 29623. A crowded pro editing window sits heavy in the band,
// its export crawling (THIS video's 2,566 frames). A venetian blind hangs rolled up above it. On "editing" the
// bottom rail drops and the stack rides down on it, leaving one slat behind at a time: each step falls with
// gravity and lands with a catch, the first on "editing", the last on "softwares.". Closed, held under a push.

const WX = 40, WY = 84;                    // the window
const Y0 = 24, RAIL_H = 14, YB = 612;      // blind: under the head rail -> bottom of the bottom rail
const N = 8, TH = 5.5;
const P = (YB - RAIL_H - Y0) / N;          // a deployed slat's pitch
const BX = 32, BW = 1016;                  // slat span (a little wider than the window)
const I = 55, F = 115;                     // step interval, fall time
const TAPES = [210, 870];

// the bottom rail's top at t: N steps, each an accelerating fall of one pitch and a small catch on landing
const railTop = (t: number, t0: number) => {
  let y = Y0 + N * TH;
  for (let k = 0; k < N; k++) {
    const s = t0 + k * I;
    y += (P - TH) * ramp(t, s, s + F, inQ);
    const u = clamp((t - s - F) / 110);
    if (u > 0 && u < 1) y += (k === N - 1 ? 4 : 2.5) * Math.sin(Math.PI * u) * (1 - u);
  }
  return y;
};

const Slat: React.FC<{ top: number; h: number; i: number }> = ({ top, h, i }) => {
  const open = clamp((h - TH) / (P - TH));
  return (
    <div style={{ position: "absolute", left: BX, top, width: BW, height: h + 2.5, overflow: "hidden",
      background: `linear-gradient(180deg, #FFFFFF 0%, #F3F1EC ${mix(30, 18, open)}%, #E4E1DA ${mix(60, 70, open)}%, #C9C5BC 100%)`,
      filter: `brightness(${mix(0.86, 1, open) - 0.012 * i})`,
      boxShadow: `0 ${mix(1, 3, open)}px ${mix(2, 5, open)}px rgba(0,0,0,${mix(0.35, 0.22, open)})` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1.5, background: "rgba(255,255,255,0.95)" }} />
      {/* the lift-cord holes, only on an open slat */}
      {TAPES.map((x) => (
        <div key={x} style={{ position: "absolute", left: x - BX + 3, top: h * 0.45, width: 5, height: Math.max(1, 3 * open), borderRadius: 2,
          background: "rgba(40,36,30,0.55)", opacity: open }} />
      ))}
    </div>
  );
};

export const Blinds: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, assets }) => {
  const editing = beat(beats, "editing", 28497);
  const t0 = editing - F * 0.8;            // first slat lands on "editing"
  const thumbs = staticFile(pick(assets, "S-thumbs.jpg"));
  const viewer = staticFile(pick(assets, "S-viewer.jpg"));
  const rt = railTop(t, t0);
  const tops = Array.from({ length: N }, (_, i) => Math.min(Y0 + i * P, rt - (N - i) * TH));
  // the unit arrives heavy: already in frame, settling down onto its mark
  const s = settle(t, fromMs - 90, 430);
  const dy = mix(-34, 0, s), sc = mix(1.025, 1, s);
  const lastLand = t0 + (N - 1) * I + F;
  const thud = t > lastLand ? Math.sin(Math.PI * clamp((t - lastLand) / 140)) * (1 - clamp((t - lastLand) / 140)) : 0;
  const wand = t > t0 ? 1.6 * Math.exp(-(t - t0) / 380) * Math.sin((t - t0) / 70) : 0;
  const cover = clamp((rt - (Y0 + N * TH)) / (YB - RAIL_H - Y0 - N * TH));
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0.03, "50% 45%")}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${dy + 1.5 * thud}px) scale(${sc})`, transformOrigin: "50% 0%" }}>
          {/* the window, heavy shadow on the wall */}
          <div style={{ position: "absolute", left: WX, top: WY, width: NW, height: NH,
            boxShadow: `0 ${mix(40, 26, s)}px ${mix(80, 56, s)}px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.4)` }}>
            <Nle t={t} t0={fromMs} thumbs={thumbs} viewer={viewer} />
            {/* the blind's shade on the screen just under the rail */}
            <div style={{ position: "absolute", left: 0, top: rt + RAIL_H - WY, width: NW, height: 46,
              background: "linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0))", opacity: rt + RAIL_H > WY ? 1 : 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.18 * cover, pointerEvents: "none" }} />
          </div>
          {/* the slats: deployed above the rail, the rest stacked on it */}
          {tops.map((top, i) => <Slat key={i} i={i} top={top} h={(i < N - 1 ? tops[i + 1]! : rt) - top} />)}
          {/* light falls across the blind from the left, a little occlusion under the head rail */}
          <div style={{ position: "absolute", left: BX, top: Y0, width: BW, height: rt - Y0 + 2, mixBlendMode: "multiply", pointerEvents: "none",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(214,208,198,0.35) 70%, rgba(170,164,154,0.55) 100%), linear-gradient(180deg, rgba(150,145,135,0.45) 0%, rgba(255,255,255,0) 14%)" }} />
          {/* ladder tapes and lift cords, head rail down to the bottom rail */}
          {TAPES.map((x) => (
            <React.Fragment key={x}>
              <div style={{ position: "absolute", left: x - 6, top: Y0, width: 12, height: rt - Y0 + 3,
                background: "linear-gradient(90deg, rgba(232,228,218,0.85), rgba(250,248,242,0.95), rgba(222,218,208,0.85))",
                boxShadow: "1px 0 2px rgba(0,0,0,0.18)" }} />
              <div style={{ position: "absolute", left: x - 0.8, top: Y0, width: 1.6, height: rt - Y0, background: "rgba(150,144,132,0.9)" }} />
            </React.Fragment>
          ))}
          {/* bottom rail */}
          <div style={{ position: "absolute", left: BX - 4, top: rt, width: BW + 8, height: RAIL_H,
            background: "linear-gradient(180deg, #FFFFFF 0%, #ECE9E2 45%, #BDB8AE 100%)", boxShadow: "0 7px 14px rgba(0,0,0,0.45)" }} />
          {/* head rail */}
          <div style={{ position: "absolute", left: BX - 12, top: 2, width: BW + 24, height: Y0 - 1,
            background: "linear-gradient(180deg, #FFFFFF 0%, #F0EEE8 50%, #C8C3B9 100%)", boxShadow: "0 8px 16px rgba(0,0,0,0.45)" }} />
          {/* the tilt wand, swaying a little as the blind drops */}
          <div style={{ position: "absolute", left: BX + BW - 26, top: Y0 - 2, width: 7, height: 236, transformOrigin: "50% 0%",
            transform: `rotate(${wand}deg)`, background: "linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.8), rgba(200,205,210,0.4))",
            boxShadow: "2px 3px 6px rgba(0,0,0,0.3)" }} />
        </div>
      </div>
    </div>
  );
};
