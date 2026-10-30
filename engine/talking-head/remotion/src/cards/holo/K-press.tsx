import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SANS, TODOS, beatsOf, box, clamp, mix, outC, pick, ramp, wrap, type KBeats } from "./K-util";
// h5v2 "Press" (builder K): the plan is a printed to-do sheet lying on a press bed, seen at an angle. BECAME ..
// LIST: its rows keep being added. "you need to": a shadow grows on the sheet, something heavy is above it.
// WATCH -> THIS: the steel platen drops into frame and slams (weight: a small dip of the whole bed). It lifts away and the
// same sheet is now a press sheet of three real ads with crop marks. Held under a slow push.

const SW = 900, SH = 560, TILT = 32, PT = 64, PM = 26; // sheet, bed tilt, platen thickness + margin
const ADS = [
  { src: "skims-3754962.jpg", w: 234 },
  { src: "crocs-5139703.jpg", w: 336 },
  { src: "skims-3754970.jpg", w: 234 },
];
export const PRESS_ASSETS = ADS.map((a) => a.src);
const AH = 420, GAP = 18;

// platen height above the bed (px, bed coords): hidden, lowers and hangs, slams on THIS, lifts off
const platenZ = (t: number, b: KBeats) => {
  if (t < b.watch + 20) return 2400;
  if (t < b.this) return mix(1000, 0, ramp(t, b.watch + 20, b.this, Easing.in(Easing.quad)));
  return mix(0, 2400, ramp(t, b.this + 30, b.this + 300, Easing.in(Easing.quad)));
};

const Row: React.FC<{ text: string; f: number }> = ({ text, f }) => (
  <div style={{ height: 64, display: "flex", alignItems: "center", opacity: f, transform: `translateY(${(1 - f) * 10}px)` }}>
    <div style={{ width: 30, height: 30, border: "3px solid #2a2a2e", borderRadius: 5, marginRight: 18, flexShrink: 0 }} />
    <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 500, color: "#18181b", whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

const TodoSheet: React.FC<{ t: number; b: KBeats }> = ({ t, b }) => {
  const at = (i: number) => (i < 4 ? b.just - 400 : b.became + ((b.list - b.became) / 7) * (i - 4));
  const col = (from: number) => TODOS.slice(from, from + 6).map((x, k) => (
    <Row key={x} text={x} f={ramp(t, at(from + k), at(from + k) + 180, outC)} />));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBFAF6", padding: "34px 44px", boxSizing: "border-box" }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#111", letterSpacing: -0.6 }}>30-day marketing plan</div>
      <div style={{ height: 2, background: "#1a1a1d", margin: "14px 0 10px" }} />
      <div style={{ display: "flex", gap: 34 }}><div>{col(0)}</div><div>{col(6)}</div></div>
    </div>
  );
};

const Crop: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => {
  const L = 16, O = 6, s = { position: "absolute" as const, background: "#222" };
  return (
    <>
      {[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy], k) => (
        <React.Fragment key={k}>
          <div style={{ ...s, left: cx! + (cx === x ? -O - L : O), top: cy! - 0.75, width: L, height: 1.5 }} />
          <div style={{ ...s, left: cx! - 0.75, top: cy! + (cy === y ? -O - L : O), width: 1.5, height: L }} />
        </React.Fragment>
      ))}
    </>
  );
};

const AdSheet: React.FC<{ assets: string[]; wet: number }> = ({ assets, wet }) => {
  let x = (SW - (ADS.reduce((s, a) => s + a.w, 0) + GAP * 2)) / 2;
  const y = (SH - AH) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBFAF6" }}>
      {ADS.map((a) => {
        const el = (
          <React.Fragment key={a.src}>
            <Img src={staticFile(pick(assets, a.src))} style={{ position: "absolute", left: x, top: y, width: a.w, height: AH, objectFit: "cover",
              filter: `saturate(${mix(1, 1.18, wet)}) contrast(${mix(1, 1.06, wet)})` }} />
            <Crop x={x} y={y} w={a.w} h={AH} />
          </React.Fragment>
        );
        x += a.w + GAP;
        return el;
      })}
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 * wet,
        background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0) 62%)" }} />
    </div>
  );
};

const Platen: React.FC<{ z: number }> = ({ z }) => {
  const W = SW + PM * 2, H = SH + PM * 2;
  const face = { position: "absolute" as const, left: -PM, width: W, backfaceVisibility: "visible" as const };
  return (
    <>
      <div style={{ ...face, top: SH + PM, height: PT, transformOrigin: "50% 0%",
        transform: `translateZ(${z}px) rotateX(90deg)`,
        background: "linear-gradient(180deg, #3a3b40 0%, #202126 100%)", borderTop: "2px solid #6d6f76" }} />
      <div style={{ ...face, top: -PM, height: H, transform: `translateZ(${z + PT}px)`,
        background: "linear-gradient(160deg, #8d9098 0%, #5d6068 38%, #474a51 62%, #6e717a 100%)",
        boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.12), inset 0 0 60px rgba(0,0,0,0.35)" }}>
        {[[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].map(([x, y], k) => (
          <div key={k} style={{ position: "absolute", left: x! - 17, top: y! - 17, width: 34, height: 34, borderRadius: 17,
            background: "radial-gradient(circle at 35% 35%, #b9bcc4, #50535a 70%)", boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }} />
        ))}
        <div style={{ position: "absolute", left: 90, right: 90, top: H / 2 - 2, height: 4, background: "rgba(0,0,0,0.18)" }} />
      </div>
    </>
  );
};

export const Press: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets }) => {
  const b = beatsOf(beats);
  const z = platenZ(t, b);
  const printed = t >= b.this;
  const dip = t >= b.this ? Math.sin(Math.PI * clamp((t - b.this) / 160)) : 0;
  const shadow = printed ? 0.7 * clamp(1 - z / 1500) : Math.max(clamp(1 - z / 1500), 0.75 * ramp(t, b.you, b.watch, (x) => x * x));
  const wet = printed ? 1 - ramp(t, b.this + 300, b.this + 1100) : 0;
  return (
    <div style={box(w, h)}>
      <div style={{ ...wrap(t, b, 0.035, "50% 55%"),
        background: "radial-gradient(ellipse 80% 90% at 50% 55%, #1e1e22 0%, #0d0d10 62%, #060607 100%)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 634, perspective: 1500, perspectiveOrigin: "50% 20%" }}>
          <div style={{ position: "absolute", left: (1080 - SW) / 2, top: 38, width: SW, height: SH, transformStyle: "preserve-3d",
            transform: `rotateX(${TILT}deg) scale(${1 - 0.012 * dip}) translateZ(${-6 * dip}px)` }}>
            <div style={{ position: "absolute", left: -120, top: -80, right: -120, bottom: -100,
              background: "linear-gradient(180deg, #2a2b30 0%, #1b1c20 100%)", boxShadow: "inset 0 0 90px rgba(0,0,0,0.8)" }} />
            <div style={{ position: "absolute", inset: 0, boxShadow: "0 18px 40px rgba(0,0,0,0.55)", overflow: "hidden", transform: "translateZ(1px)" }}>
              {printed ? <AdSheet assets={assets} wet={wet} /> : <TodoSheet t={t} b={b} />}
              <div style={{ position: "absolute", inset: -40, background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,${0.55 * shadow}), rgba(0,0,0,${0.25 * shadow}))` }} />
            </div>
            {z < 2300 && <Platen z={z} />}
          </div>
        </div>
      </div>
    </div>
  );
};
