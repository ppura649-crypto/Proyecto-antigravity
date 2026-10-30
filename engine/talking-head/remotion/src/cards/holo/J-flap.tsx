import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, beatsOf, clamp, mix, pick, ramp, stage, type JBeats } from "./J-util";
// h4v1 (builder J, 2026-09-24): "the departures board". A split-flap board of 12 blank tiles, each tile a day's
// ad. By hand, one tile flips per word (DOING, EVERY, AD, YOURSELF): a slow, heavy single flap each. Then on
// WATCH the other eight rattle through in one wave, left to right, and land: a full board of real SKIMS / Crocs
// ads, held under a slow push until the Holo hand-over on WHOLE.

const COLS = 6, ROWS = 2, TW = 150, TH = 250, GAP = 12, PAD = 20;
const BW = COLS * TW + (COLS - 1) * GAP + PAD * 2, BH = ROWS * TH + (ROWS - 1) * GAP + PAD * 2;
const FINAL = [
  "skims-3754927.jpg", "W-cf-04.jpg", "crocs-5139682.jpg", "skims-3754962.jpg", "W-cf-10.jpg", "skims-3754998.jpg",
  "W-cf-13.jpg", "crocs-5139685.jpg", "skims-3755019.jpg", "W-cf-08.jpg", "skims-3754964.jpg", "W-cf-02.jpg",
];
const POOL = ["W-cf-07.jpg", "skims-3754960.jpg", "skims-3754970.jpg", "W-cf-15.jpg", "skims-3754932.jpg",
  "W-cf-12.jpg", "crocs-5139703.jpg", "W-cf-05.jpg", "W-cf-09.jpg"];
const POS: Record<string, string> = { "crocs-5139682.jpg": "0% 50%", "crocs-5139685.jpg": "0% 50%", "crocs-5139703.jpg": "50% 70%" };
export const FLAP_ASSETS = Array.from(new Set([...FINAL, ...POOL]));

type Flip = { at: number; dur: number; from: string | null; to: string; heavy: boolean };
const flipsOf = (i: number, b: JBeats): Flip[] => {
  const manual = [b.doing, b.every, b.ad, b.yourself];
  if (i < 4) return [{ at: manual[i], dur: 430, from: null, to: FINAL[i], heavy: true }];
  const c = i % COLS, r = Math.floor(i / COLS);
  let at = b.watch + (c - (r === 0 ? 4 : 0)) * 52 + r * 28 + (r === 0 ? 150 : 0);
  const seq: (string | null)[] = [null, POOL[(i * 3) % POOL.length], POOL[(i * 3 + 4) % POOL.length], POOL[(i * 5 + 2) % POOL.length], FINAL[i]];
  const out: Flip[] = [];
  for (let k = 1; k < seq.length; k++) {
    const last = k === seq.length - 1, dur = last ? 170 : 92;
    out.push({ at, dur, from: seq[k - 1], to: seq[k]!, heavy: last });
    at += dur;
  }
  return out;
};

const Half: React.FC<{ src: string | null; top: boolean; assets: string[]; name: string | null }> = ({ src, top, assets, name }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: TW, height: TH / 2, overflow: "hidden",
    background: top ? "linear-gradient(180deg, #232327, #19191c)" : "linear-gradient(180deg, #151517, #1c1c1f)" }}>
    {src && <Img src={staticFile(pick(assets, src))} style={{ position: "absolute", left: 0, top: top ? 0 : -TH / 2, width: TW,
      height: TH, objectFit: "cover", objectPosition: (name && POS[name]) || "50% 30%" }} />}
    <div style={{ position: "absolute", inset: 0, background: top
      ? "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.12))"
      : "linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0) 45%)" }} />
  </div>
);

const Tile: React.FC<{ i: number; t: number; b: JBeats; assets: string[] }> = ({ i, t, b, assets }) => {
  const flips = flipsOf(i, b);
  let f: Flip | null = null;
  for (const x of flips) if (t >= x.at) f = x;
  const active = f && t < f.at + f.dur ? f : null;
  const p = active ? clamp((t - active.at) / active.dur) : 0;
  const th = 180 * (active?.heavy ? Easing.in(Easing.quad)(p) : Easing.in(Easing.sin)(p));
  // the heavy flap's slap: a small lift and settle in the 170 ms after it lands
  const u = f && !active && f.heavy ? (t - f.at - f.dur) / 170 : 1;
  const slap = u < 1 ? 6 * Math.sin(Math.PI * u) * (1 - u) : 0;
  const c = i % COLS, r = Math.floor(i / COLS);
  const shade = 1 - 0.5 * Math.sin((th * Math.PI) / 180);
  return (
    <div style={{ position: "absolute", left: PAD + c * (TW + GAP), top: PAD + r * (TH + GAP), width: TW, height: TH,
      perspective: 700, boxShadow: "0 6px 14px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: TW, height: TH / 2 }}>
        <Half src={active ? active.to : f ? f.to : null} top assets={assets} name={active ? active.to : f?.to ?? null} />
      </div>
      <div style={{ position: "absolute", left: 0, top: TH / 2, width: TW, height: TH / 2, transformOrigin: "50% 0%",
        transform: `rotateX(${active ? 0 : slap}deg)` }}>
        <Half src={active ? active.from : f ? f.to : null} top={false} assets={assets} name={active ? active.from : f?.to ?? null} />
      </div>
      {active && th < 90 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: TW, height: TH / 2, transformOrigin: "50% 100%",
          transform: `rotateX(${-th}deg)`, filter: `brightness(${shade})`, backfaceVisibility: "hidden" }}>
          <Half src={active.from} top assets={assets} name={active.from} />
        </div>
      )}
      {active && th >= 90 && (
        <div style={{ position: "absolute", left: 0, top: TH / 2, width: TW, height: TH / 2, transformOrigin: "50% 0%",
          transform: `rotateX(${180 - th}deg)`, filter: `brightness(${shade})`, backfaceVisibility: "hidden" }}>
          <Half src={active.to} top={false} assets={assets} name={active.to} />
        </div>
      )}
      {/* the hinge: a hairline split and two axle pins */}
      <div style={{ position: "absolute", left: 0, right: 0, top: TH / 2 - 1, height: 2, background: "rgba(0,0,0,0.85)" }} />
      <div style={{ position: "absolute", left: -5, top: TH / 2 - 8, width: 6, height: 16, background: "#2c2c31" }} />
      <div style={{ position: "absolute", right: -5, top: TH / 2 - 8, width: 6, height: 16, background: "#2c2c31" }} />
    </div>
  );
};

export const Flap: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fromMs, toMs, beats, assets }) => {
  const b = beatsOf(beats);
  const tilt = mix(16, 5, ramp(tMs, fromMs, fromMs + 420, Easing.out(Easing.cubic))) - 2 * ramp(tMs, b.watch, b.watch + 900);
  return (
    <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>
      <div style={stage(tMs, fromMs, toMs, 0.05)}>
        <div style={{ position: "absolute", left: (CW - BW) / 2, top: (CH - BH) / 2, width: BW, height: BH, perspective: 1600 }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 60%", transform: `rotateX(${tilt}deg)`,
            background: "linear-gradient(180deg, #121214 0%, #0a0a0b 100%)", border: "2px solid #202024",
            boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 10px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            {Array.from({ length: COLS * ROWS }, (_, i) => <Tile key={i} i={i} t={tMs} b={b} assets={assets} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
