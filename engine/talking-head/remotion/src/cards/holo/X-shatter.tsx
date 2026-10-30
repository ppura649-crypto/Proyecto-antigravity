import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Caveat";
import type { CardProps } from "../props";
import { clamp, easeInOut, easeOut3, exitP, pick, sp, win, XB, type XBeats } from "./X-util";
import { SHARDS, crackP, pose, releaseDelay } from "./X-shards";
// reference edit K v09 "the slop dissolves" (builder X, 2026-09-24), 1974 -> 4237. A fictional slop ad fills the
// band; on YOU a designer's red markup circles its tells one by one (the typo headline, the second
// handlebar, the gibberish button). On WATCH the glass cracks out from the middle, on THIS it bursts into
// shards that fly past the lens, and the real Crocs creative behind it comes forward into focus, crisp by
// "fix", then held with a slow push. Clean 130 ms exit into the own-brand card.
const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

const RED = "#FF2B2B";
type Ring = { cx: number; cy: number; rx: number; ry: number; rot: number; at: number; tag: string; side: -1 | 1; ty: number };
// tells, in poster fractions (slop-bike: headline, lower brake bar, the "Shpo Nwo" button)
const RINGS = (b: XBeats): Ring[] => [
  { cx: 0.52, cy: 0.455, rx: 0.3, ry: 0.105, rot: -4, at: b.you + 20, tag: "typos", side: -1, ty: 0.42 },
  { cx: 0.52, cy: 0.655, rx: 0.46, ry: 0.068, rot: 2, at: b.you + 115, tag: "2 handlebars", side: 1, ty: 0.64 },
  { cx: 0.5, cy: 0.91, rx: 0.23, ry: 0.058, rot: -3, at: b.you + 205, tag: "gibberish", side: -1, ty: 0.87 },
];
const DRAW = 160;

// a hand-drawn loop: 1.12 turns, a little wobble, the pen drifting outward, rotated
const ringPath = (r: Ring, pw: number, ph: number) => {
  const pts: string[] = [];
  let len = 0, px = 0, py = 0;
  const th0 = 3.6, n = 56, rot = (r.rot * Math.PI) / 180;
  for (let k = 0; k <= n; k++) {
    const th = th0 + (k / n) * Math.PI * 2 * 1.12;
    const grow = 1 + 0.06 * (k / n) + 0.03 * Math.sin(3 * th + r.at);
    const ex = Math.cos(th) * r.rx * pw * grow, ey = Math.sin(th) * r.ry * ph * grow;
    const x = r.cx * pw + ex * Math.cos(rot) - ey * Math.sin(rot);
    const y = r.cy * ph + ex * Math.sin(rot) + ey * Math.cos(rot);
    if (k) len += Math.hypot(x - px, y - py);
    pts.push(`${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    px = x; py = y;
  }
  return { d: pts.join(" "), len };
};

const Rings: React.FC<{ t: number; b: XBeats; pw: number; ph: number }> = ({ t, b, pw, ph }) => (
  <svg width={pw} height={ph} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {RINGS(b).map((r, k) => {
      const { d, len } = ringPath(r, pw, ph);
      const p = easeOut3(win(t, r.at, r.at + DRAW));
      return p <= 0 ? null : (
        <path key={k} d={d} fill="none" stroke={RED} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - p)}
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
      );
    })}
  </svg>
);

// the white markup tags in the margins, each with its leader; they pop after their ring and blow off on THIS
const Tags: React.FC<{ t: number; b: XBeats; fps: number; px: number; pw: number; ph: number }> = ({ t, b, fps, px, pw, ph }) => (
  <>
    {RINGS(b).map((r, k) => {
      const s = sp(t, r.at + 90, fps, { damping: 15, stiffness: 240 });
      if (s <= 0) return null;
      const tau = (t - b.this - 20 - k * 25) / 1000;
      const fly = tau > 0 ? (1 - Math.exp(-3.4 * tau)) / 3.4 : 0;
      const op = Math.min(1, s * 2) * (1 - win(tau, 0.05, 0.28));
      const ringEdge = px + r.cx * pw + r.side * r.rx * pw * 0.96;
      const tagX = r.side < 0 ? px - 34 : px + pw + 34;
      const y = r.ty * ph;
      const lp = easeOut3(win(t, r.at + 70, r.at + 200));
      return (
        <div key={k} style={{ position: "absolute", left: 0, top: 0, opacity: op,
          transform: `translate(${r.side * 700 * fly}px, ${-260 * fly}px)` }}>
          <svg width={1080} height={ph} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={tagX} y1={y} x2={tagX + (ringEdge - tagX) * lp} y2={y + (r.cy * ph - y) * lp}
              stroke={RED} strokeWidth={4} strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
          </svg>
          <div style={{ position: "absolute", top: y, left: tagX,
            transform: `translate(${r.side < 0 ? "-100%" : "0"}, -50%) rotate(${r.side * -3 + fly * r.side * 90}deg) scale(${0.6 + 0.4 * s})`,
            transformOrigin: r.side < 0 ? "100% 50%" : "0% 50%",
            background: "#fff", padding: "4px 16px 6px", boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
            fontFamily: HAND, fontWeight: 700, fontSize: 48, lineHeight: 1, color: RED, whiteSpace: "nowrap" }}>
            {r.tag}
          </div>
        </div>
      );
    })}
  </>
);

// the poster as glass: from WATCH it renders as shards (cracks drawn on each shard's own edge), from THIS
// each shard flies on its own clock
const Glass: React.FC<{ t: number; b: XBeats; src: string; pw: number; ph: number }> = ({ t, b, src, pw, ph }) => (
  <>
    {SHARDS.map((s) => {
      const tau = (t - b.this - releaseDelay(s)) / 1000;
      const p = pose(s, tau, pw, ph);
      if (p.op <= 0.01) return null;
      const poly = s.pts.map(([x, y]) => `${(x * pw).toFixed(2)}px ${(y * ph).toFixed(2)}px`).join(",");
      const pts = s.pts.map(([x, y]) => `${x * pw},${y * ph}`).join(" ");
      const crack = crackP(s, t, b.watch, b.this);
      // a hairline of separation once cracked, so the lines read as breaks, not a drawing
      const nudge = crack * 1.2;
      return (
        <div key={s.i} style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph,
          clipPath: `polygon(${poly})`, opacity: p.op,
          transformOrigin: `${s.cx * pw}px ${s.cy * ph}px`,
          transform: `translate3d(${p.dx + (s.cx - 0.52) * nudge}px, ${p.dy + (s.cy - 0.5) * nudge}px, ${p.dz}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`,
          filter: p.blur > 0.2 ? `blur(${p.blur.toFixed(2)}px)` : undefined }}>
          <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph }} />
          <Rings t={t} b={b} pw={pw} ph={ph} />
          {crack > 0 && (
            <svg width={pw} height={ph} style={{ position: "absolute", left: 0, top: 0 }}>
              <polygon points={pts} fill={`rgba(255,255,255,${0.1 * crack})`} stroke={`rgba(255,255,255,${0.9 * crack})`} strokeWidth={2.2} />
            </svg>
          )}
        </div>
      );
    })}
  </>
);

const Shatter: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b: XBeats = { ...XB, ...(beats as Partial<XBeats>) };
  const slop = staticFile(pick(assets, data?.slop ?? "famA-slop-bike.jpg"));
  const real = staticFile(pick(assets, data?.real ?? "crocs-5139685.jpg"));
  const ph = h, pw = (h * 720) / 1080, px = (w - pw) / 2;
  const rh = h, rw = h * (data?.realAspect ?? 0.8);
  // the real ad: hidden at 0.83 under the slop, comes forward into focus from THIS, crisp by "fix"
  const come = sp(t, b.this, fps, { damping: 22, stiffness: 95 });
  const focus = easeOut3(win(t, b.this, b.this + 520));
  const hold = easeInOut(win(t, b.fix, b.own - 130));
  const out = exitP(t, b);
  const rs = (0.83 + 0.17 * come) * (1 + 0.03 * hold) * (1 + 0.02 * out);
  // the slop, alive while it is marked up: a slow push, then a small impact dip on WATCH
  const dip = Math.sin(Math.PI * win(t, b.watch, b.this + 40)) * 0.012;
  const ps = (1 + 0.02 * easeInOut(win(t, b.you, b.watch))) * (1 - dip);
  const intact = t < b.watch;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: (w - rw) / 2, top: 0, width: rw, height: rh,
        transform: `scale(${rs})`, boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
        filter: focus < 1 ? `blur(${(10 * (1 - focus)).toFixed(2)}px) brightness(${0.55 + 0.45 * focus})` : undefined }}>
        <Img src={real} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: px, top: 0, width: pw, height: ph, perspective: 1100,
        perspectiveOrigin: "50% 50%", transform: `scale(${ps})` }}>
        {/* the poster's shadow stays under the glass until the glass is gone */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
          opacity: 1 - easeOut3(win(t, b.this, b.this + 160)) }} />
        {intact ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <Img src={slop} style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph }} />
            <Rings t={t} b={b} pw={pw} ph={ph} />
          </div>
        ) : <Glass t={t} b={b} src={slop} pw={pw} ph={ph} />}
      </div>
      <Tags t={t} b={b} fps={fps} px={px} pw={pw} ph={ph} />
      {/* a white flash on the break, 90 ms, only where the glass was */}
      <div style={{ position: "absolute", left: px, top: 0, width: pw, height: ph, pointerEvents: "none",
        background: "radial-gradient(ellipse at 52% 50%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)",
        opacity: clamp(1 - Math.abs(t - b.this - 20) / 70) }} />
    </div>
  );
};

export const SHATTER_KINDS = { "holo-x-shatter": Shatter };
