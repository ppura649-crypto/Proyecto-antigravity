import React from "react";
import { Img } from "remotion";
import type { CardProps } from "../props";
import { ClipAt, mono } from "./D-kit";
import { CARD_W, PlanCard, type PlanT, cardH } from "./P-card";
import { PHOTO_SHADOW, SHADOW, clamp, eInOut, land, mix, pick, win } from "./P-kit";
// B22 the recap (v2): three real objects at band size, each lands on its word and stays: Holo's URL field with
// yourbrand.com (WEBSITE; it types in big at the centre, then glides to the top just before PLAN), the plan
// calendar with its posts (PLAN), a fan of four real SKIMS / Crocs creatives (NEW CREATIVES). On KEEP IT ALL
// MOVING all three start a gentle continuous motion: the fan sways and breathes, the others float.

const CROP = { x: 120, y: 200, w: 960, h: 200 }; // url-pill.mp4 (1200x600): the field on its blue ground
const FAN = ["skims-3754970.jpg", "crocs-5139667.jpg", "skims-3755019.jpg", "crocs-5139703.jpg"]; // index 2 sits in front

const UrlField: React.FC<{ src: string; sec: number; fps: number; W: number }> = ({ src, sec, fps, W }) => {
  const k = W / CROP.w;
  return (
    <div style={{ width: W, height: CROP.h * k, overflow: "hidden", position: "relative", boxShadow: SHADOW }}>
      <ClipAt src={src} sec={sec} fps={fps} style={{ position: "absolute", width: 1200 * k, height: 600 * k, left: -CROP.x * k, top: -CROP.y * k }} />
    </div>
  );
};

const settled = (at: number): PlanT => ({
  enter: at - 6000, header: at - 6000, words: [at - 6000, at - 5900], chips: at - 5800, cal: at - 5600,
  sweep: [at - 5500, at - 5400], flag: at - 5300, grow: [at - 5000, at - 4700], posts: at - 4500,
});

export const PlanRecap: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const website = beats.website ?? 47080, plan = beats.plan ?? 48100, cr = beats.creatives ?? 48500, keep = beats.keep ?? 49899;
  const x = win(tMs, toMs - 90, toMs);
  const kk = Math.max(0, tMs - keep) / 1000;
  const amp = eInOut(clamp(kk / 0.7));
  // 1. the URL field: types yourbrand.com by WEBSITE, glides up in the 300 ms before PLAN
  const typed = mono([[fromMs, 0.95], [website - 60, 3.25], [toMs, 3.4]])(tMs);
  const ue = land(tMs, fromMs, 300);
  const g = eInOut(win(tMs, plan - 340, plan - 40));
  const uW = mix(940, 860, g), uH = (CROP.h * uW) / CROP.w;
  const uTop = mix((h - uH) / 2, 6, g) + Math.sin(kk * 2.1) * 6 * amp;
  // 2. the calendar, settled, at 0.56
  const cs = 0.58, cW = CARD_W * cs, cHh = cardH(1) * cs;
  const ce = land(tMs, plan, 300);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - x, transform: `translateY(${-16 * x}px)` }}>
      <div style={{ position: "absolute", left: (w - uW) / 2 + Math.sin(kk * 1.3) * 4 * amp, top: uTop, zIndex: 3, opacity: clamp(ue * 1.5),
        transform: `translateY(${(1 - ue) * 30}px) scale(${0.96 + 0.04 * ue})` }}>
        <UrlField src={assets.find((a) => a.endsWith("url-pill.mp4")) ?? "url-pill.mp4"} sec={typed} fps={fps} W={uW} />
      </div>
      {ce > 0 && (
        <div style={{ position: "absolute", left: 20, top: 214, width: cW, height: cHh, opacity: clamp(ce * 1.5),
          transform: `translateY(${(1 - ce) * 34 + Math.sin(kk * 1.7 + 1) * 7 * amp}px) rotate(${Math.sin(kk * 1.2) * 0.8 * amp}deg) scale(${0.95 + 0.05 * ce})` }}>
          <div style={{ width: CARD_W, height: cardH(1), transform: `scale(${cs})`, transformOrigin: "0 0" }}>
            <PlanCard tMs={tMs} T={settled(fromMs)} assets={assets} />
          </div>
        </div>
      )}
      <Fan tMs={tMs} at={cr} kk={kk} amp={amp} assets={assets} />
    </div>
  );
};

const Fan: React.FC<{ tMs: number; at: number; kk: number; amp: number; assets: string[] }> = ({ tMs, at, kk, amp, assets }) => {
  // a hand of four creatives fanned from a pivot under them; on KEEP the fan sways slowly and breathes
  const CXf = 832, top = 236, cw = 200, ch = 330;
  const sway = Math.sin(kk * 1.6) * 3 * amp, breathe = 1 + 0.08 * Math.sin(kk * 1.1) * amp;
  return (
    <>
      {FAN.map((src, i) => {
        const e = land(tMs, at + i * 80, 300);
        if (e <= 0) return null;
        const k = i - 1.5;
        const rot = k * 9 * breathe * e + sway;
        return (
          <Img key={src} src={pick(assets, src)} style={{ position: "absolute", left: CXf - cw / 2 + k * 56 * e, top: top + Math.abs(k) * 8,
            width: cw, height: ch, objectFit: "cover", boxShadow: PHOTO_SHADOW, opacity: clamp(e * 1.6), zIndex: 10 - Math.round(Math.abs(k - 0.5) * 2),
            transformOrigin: "50% 120%", transform: `translateY(${(1 - e) * 50}px) rotate(${rot}deg)` }} />
        );
      })}
    </>
  );
};
