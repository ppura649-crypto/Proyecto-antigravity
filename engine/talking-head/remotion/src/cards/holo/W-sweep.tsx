import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { JAKARTA, WB, type WBeats, clamp, pick, smooth, wrapStyle } from "./W-util";
// edit-k-h1v07 (2026-09-24), builder W: "A month in one sweep". A cover-flow of 30 real Holo creatives
// (SKIMS / Crocs stills + frames of their clips), each tagged Day 1 ... Day 30. It sits near Day 3, a flick on
// WATCH whips it through the month (true motion blur: sub-frame samples averaged), friction brings it down to
// land centred on the hero SKIMS ad (Day 21) around "fix"; held under a slow push; clean exit at 4237.

const TILES = [
  "skims-3754927.jpg", "crocs-5139682.jpg", "W-cf-02.jpg", "skims-3754998.jpg", "W-cf-08.jpg", "crocs-5139667.jpg",
  "W-cf-13.jpg", "skims-3754960.jpg", "W-cf-03.jpg", "crocs-5139714.jpg", "W-cf-10.jpg", "W-cf-05.jpg",
  "W-cf-14.jpg", "skims-3754932.jpg", "W-cf-07.jpg", "W-cf-04.jpg", "crocs-5139703.jpg", "W-cf-09.jpg",
  "skims-3754962.jpg", "crocs-5139685.jpg", "skims-3754964.jpg", "skims-3755019.jpg", "crocs-5139281.jpg",
  "W-cf-11.jpg", "skims-3754970.jpg", "W-cf-15.jpg", "W-cf-12.jpg", "crocs-5139682.jpg", "W-cf-16.jpg", "W-cf-01.jpg",
];
export const SWEEP_ASSETS = Array.from(new Set(TILES));
const HERO = 20, S0 = 2, DRIFT = 0.18, TW = 330, TH = 462, TAG = 58, CY = 292;
const ACC = 70, DEC = 760; // flick: ramp to top speed in 70 ms, friction over 760 ms

// the flick's travel curve, integrated once: v = ramp * (1-u)^3.2, normalised to 1
const CURVE: number[] = (() => {
  const n = ACC + DEC, out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const ramp = smooth(0, ACC, i), u = clamp((i - ACC * 0.5) / (n - ACC * 0.5));
    acc += ramp * Math.pow(1 - u, 3.2); out.push(acc);
  }
  return out.map((x) => x / acc);
})();

// carousel position (tile index at the centre) at spine ms t
const pos = (t: number, b: WBeats) => {
  if (t <= b.watch) return S0 + DRIFT * smooth(b.you, b.watch + 200, t);
  const pre = S0 + DRIFT * smooth(b.you, b.watch + 200, t);
  const i = clamp(t - b.watch, 0, CURVE.length - 1), f = i - Math.floor(i);
  const c = CURVE[Math.floor(i)] * (1 - f) + CURVE[Math.min(CURVE.length - 1, Math.floor(i) + 1)] * f;
  return pre + (HERO - S0 - DRIFT) * c;
};

const Tile: React.FC<{ i: number; d: number; src: string; blurId: string | null }> = ({ i, d, src, blurId }) => {
  const a = clamp(d, -1, 1);
  const x = a * 322 + (d - a) * 124;
  const rot = -a * 58, z = -Math.abs(a) * 230;
  const dim = 1 - 0.38 * Math.min(1, Math.abs(d) * 0.8);
  return (
    <div style={{ position: "absolute", left: 540 - TW / 2 + x, top: CY - TH / 2 - TAG, width: TW, height: TH + TAG,
      zIndex: 100 - Math.round(Math.abs(d) * 10),
      transform: `perspective(1000px) translateZ(${z}px) rotateY(${rot}deg)`,
      WebkitBoxReflect: "below 6px linear-gradient(transparent 70%, rgba(255,255,255,0.26))",
      filter: blurId ? `url(#${blurId}) brightness(${dim})` : `brightness(${dim})` } as React.CSSProperties}>
      <Img src={src} style={{ position: "absolute", left: 0, top: TAG, width: TW, height: TH, objectFit: "cover",
        objectPosition: "50% 35%" }} />
      <div style={{ position: "absolute", left: 0, top: 0, padding: "5px 14px", borderRadius: 999, background: "#fff",
        fontFamily: JAKARTA, fontWeight: 700, fontSize: 26, color: "#111", letterSpacing: -0.3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>Day {i + 1}</div>
    </div>
  );
};

const Ring: React.FC<{ s: number; assets: string[]; blurId: string | null }> = ({ s, assets, blurId }) => {
  const lo = Math.max(0, Math.floor(s) - 6), hi = Math.min(TILES.length - 1, Math.ceil(s) + 6);
  const out: React.ReactNode[] = [];
  for (let i = lo; i <= hi; i++) out.push(<Tile key={i} i={i} d={i - s} src={staticFile(pick(assets, TILES[i]))} blurId={blurId} />);
  return <>{out}</>;
};

export const Sweep: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, beats, assets }) => {
  const b: WBeats = { ...WB, ...(beats as Partial<WBeats>) };
  // shutter 180 degrees: samples across the half frame before t, averaged by painting sample k at 1/k
  const shutter = 500 / fps;
  const span = Math.abs(pos(tMs, b) - pos(tMs - shutter, b)); // tiles travelled while the shutter is open
  const n = Math.max(1, Math.min(12, Math.ceil(span * 9)));
  const std = n > 1 ? Math.min(40, (span * 150) / n) : 0;
  const blurId = std > 0.5 ? `wsweep-${Math.round(tMs)}` : null;
  return (
    <div style={{ position: "absolute", left: (w - 1080) / 2, top: (h - 634) / 2, width: 1080, height: 634, overflow: "hidden" }}>
      <div style={{ ...wrapStyle(tMs, b, 0.035, "50% 42%"),
        background: "radial-gradient(ellipse 70% 80% at 50% 35%, #1d1d22 0%, #0d0d10 60%, #060607 100%)" }}>
        {blurId && (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id={blurId} x="-20%" y="0%" width="140%" height="100%">
              <feGaussianBlur stdDeviation={`${std} 0`} />
            </filter>
          </svg>
        )}
        {Array.from({ length: n }, (_, k) => (
          <div key={k} style={{ position: "absolute", inset: 0, opacity: 1 / (k + 1) }}>
            <Ring s={pos(tMs - (shutter * k) / Math.max(1, n - 1) * (n > 1 ? 1 : 0), b)} assets={assets} blurId={blurId} />
          </div>
        ))}
        {/* the floor line the reflections sit on */}
        <div style={{ position: "absolute", left: 0, right: 0, top: CY + TH / 2 + 4, height: 200,
          background: "linear-gradient(180deg, rgba(6,6,7,0) 0%, rgba(6,6,7,0.55) 55%, #060607 100%)" }} />
      </div>
    </div>
  );
};
