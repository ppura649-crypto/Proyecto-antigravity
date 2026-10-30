import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beatsOf, clamp, easeIn2, easeOut3, exitP, hash, holdPush, noise1, pick, win, type GBeats } from "./G-util";
// edit-k-h3v4 "it melts" (builder G, 2026-09-24), 2233 -> 5937. A glossy fictional slop ad stands in the band.
// On "with AI" it starts to sag, and on "slop" it melts for real: the print runs down in drips and fingers,
// smearing as it goes, and drains off the bottom edge. On WATCH a real SKIMS print drops in from above with
// weight (motion blur in the fall), lands with a small squash on THIS and crushes what is left of the slop.
// Settled by "The fix", held under a slow push. Clean 130 ms exit into "own".

const PH = 610, SPH = 480, STOP = 36, SW_N = 96;
// the fingers of the melt: a few narrow runs that go further than the rest, seeded
const FINGERS = Array.from({ length: 5 }, (_, k) => ({ c: 8 + ((k + 0.2 + hash(k * 9.1 + 2) * 0.6) / 5) * (SW_N - 16), a: 0.45 + hash(k * 3.3) * 0.55, wd: 4 + hash(k * 5.7) * 3.5 }));
const finger = (i: number) => FINGERS.reduce((s, f) => s + f.a * Math.exp(-((i - f.c) ** 2) / (2 * f.wd * f.wd)), 0);
const BASE = Array.from({ length: SW_N }, (_, i) => noise1(i * 0.05, 5) * 0.8 + noise1(i * 0.16, 11) * 0.2);

const Slice: React.FC<{ i: number; sw: number; pw: number; src: string; m: number }> = ({ i, sw, pw, src, m }) => {
  const base = BASE[i], f = finger(i);
  const drop = SPH * (0.9 * m * m + 0.06 * m * base);
  const stretch = 1 + m * (0.1 + 0.15 * base + 1.0 * f);
  return (
    <div style={{ position: "absolute", left: i * sw, top: 0, width: sw + 1.6, height: SPH, overflow: "hidden",
      transformOrigin: "50% 0%", transform: `translateY(${drop.toFixed(1)}px) scaleY(${stretch.toFixed(4)})`,
      borderBottomLeftRadius: m > 0.05 ? sw / 2 : 0, borderBottomRightRadius: m > 0.05 ? sw / 2 : 0 }}>
      <Img src={src} style={{ position: "absolute", left: -i * sw, top: 0, width: pw, height: SPH }} />
    </div>
  );
};

const Melt: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets, data }) => {
  const b: GBeats = beatsOf(beats);
  const slop = staticFile(pick(assets, data?.slop ?? "famA-slop-serum.jpg"));
  const real = staticFile(pick(assets, data?.real ?? "skims-3754998.jpg"));
  const pw = SPH * (data?.slopAspect ?? 720 / 1080), rw = PH * (data?.realAspect ?? 900 / 1612);
  const sw = pw / SW_N;
  const out = exitP(t, b);
  // the melt: a first sag on "with", then it runs on "slop" and drains through WATCH
  const m = 0.06 * easeOut3(win(t, b.with, b.ai + 200)) + 1.0 * easeIn2(win(t, b.ai + 60, b.watch + 200));
  const smear = Math.min(12, 16 * Math.max(0, m - 0.08));
  // the real print: falls from above (gravity), lands, squashes, settles
  const fallAt = b.watch + 60, land = fallAt + 230;
  const tau = clamp((t - fallAt) / (land - fallAt));
  const y = t < fallAt ? -900 : -760 * (1 - tau * tau);
  const v = t >= fallAt && t < land ? (2 * 760 * tau) / ((land - fallAt) / 1000) / 30 : 0; // px per frame
  const after = (t - land) / 1000;
  const squash = t > land ? 0.06 * Math.exp(-after * 9) * Math.cos(after * 38) : 0;
  const crush = easeOut3(win(t, land, land + 160));
  const shake = t > land ? 5 * Math.exp(-after * 14) * Math.sin(after * 60) : 0;
  const s = holdPush(t, b.but, b, 0.03) * (1 - 0.03 * out);
  const blurId = `gmelt-${Math.round(t)}`, fallId = `gfall-${Math.round(t)}`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={blurId} x="-5%" y="-5%" width="110%" height="130%"><feGaussianBlur stdDeviation={`${(0.5 + smear * 0.08).toFixed(2)} ${smear.toFixed(2)}`} /></filter>
        <filter id={fallId} x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation={`0 ${Math.min(40, v * 0.4).toFixed(2)}`} /></filter>
      </svg>
      <div style={{ position: "absolute", left: 0, top: (h - PH) / 2, width: w, height: PH, transform: `translateY(${shake}px) scale(${s})` }}>
        {/* the slop: melting, drained through the bottom edge, crushed when the print lands */}
        {crush < 1 && (
          <div style={{ position: "absolute", left: (w - pw) / 2 - 10, top: 0, width: pw + 20, height: PH + 24, overflow: "hidden",
            opacity: 1 - crush, WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 80%, transparent 100%)",
            maskImage: "linear-gradient(180deg, #000 0%, #000 80%, transparent 100%)" }}>
            <div style={{ position: "absolute", left: 10, top: STOP, width: pw, height: PH, filter: smear > 0.3 ? `url(#${blurId}) saturate(${1 + 0.3 * clamp(m)})` : undefined }}>
              {m < 0.01 ? (
                <Img src={slop} style={{ position: "absolute", left: 0, top: 0, width: pw, height: SPH }} />
              ) : (
                BASE.map((_, i) => <Slice key={i} i={i} sw={sw} pw={pw} src={slop} m={m} />)
              )}
            </div>
          </div>
        )}
        {m < 0.2 && (
          <div style={{ position: "absolute", left: (w - pw) / 2, top: STOP, width: pw, height: SPH, zIndex: -1,
            boxShadow: "0 30px 70px rgba(0,0,0,0.6)", opacity: 1 - m / 0.2 }} />
        )}
        {/* the real print, dropped from above */}
        {t >= fallAt && (
          <div style={{ position: "absolute", left: (w - rw) / 2, top: 0, width: rw, height: PH, transformOrigin: "50% 100%",
            transform: `translateY(${y}px) scale(${1 + squash * 0.6}, ${1 - squash})`,
            boxShadow: `0 ${30 * tau}px ${70 * tau}px rgba(0,0,0,${0.6 * tau})`,
            filter: v > 1 ? `url(#${fallId})` : undefined }}>
            <Img src={real} style={{ width: rw, height: PH, display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
};

export const MELT_KINDS = { "holo-g-melt": Melt };
