import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, PSF, SCREEN } from "./X-contact";
// keyframes-v1 hook X4 "Claude added / every visual here" (builder X, round 2, 2026-09-25). The phone stands in the
// middle playing their raw take. The real Claude mark hangs beside it and, from AND, flicks this video's own visuals at
// it one by one (real crops of visuals-v6.mp4: the 51,000 stats drum, the FILMED calendar, the ebook, Claude's agent
// reply, their upload in Claude). Each card flies with weight, snaps big onto the top of the screen like a magnet, then
// shrinks into the exact place it holds above their head in the video. On GOT the raw take becomes their finished
// captioned reel with the last visual in place, landed ~2450, held.

const CLAUDE_MARK = "X-mark.png";
type V = { img: string; c: [number, number, number, number] };  // crop box in the 1080 x 1920 frame
const VIS: V[] = [
  { img: "X-v-stats.jpg", c: [268, 236, 810, 416] },
  { img: "X-v-calendar.jpg", c: [266, 116, 824, 436] },
  { img: "X-v-box.jpg", c: [326, 146, 474, 364] },
  { img: "X-v-agents.jpg", c: [236, 207, 856, 626] },
  { img: "X-v-upload.jpg", c: [36, 230, 1040, 698] },
];
export const VISUALS_ASSETS = [...VIS.map((v) => v.img), CLAUDE_MARK, "R-take.mp4", "kf-finished-reel.mp4"];
const MARK = { x: 200, y: 300 };
const FLY = 190, SHRINK = 150;                          // ms in the air, ms to shrink into place
const final = (v: V) => ({ x: SCREEN.x + (v.c[0] / 1080) * SCREEN.w, y: SCREEN.y + (v.c[1] / 1920) * SCREEN.h,
  w: ((v.c[2] - v.c[0]) / 1080) * SCREEN.w, h: ((v.c[3] - v.c[1]) / 1920) * SCREEN.h });

type B = { now: number; and: number; got: number };
const Card: React.FC<{ v: V; t: number; t0: number; tNext: number; src: string }> = ({ v, t, t0, tNext, src }) => {
  if (t < t0) return null;
  const f = final(v);
  // the magnet spot: the same card at 2.1x, centred on the top of the screen
  const big = Math.min(2.1, 560 / f.w);
  const snap = { w: f.w * big, h: f.h * big, x: 540 - (f.w * big) / 2, y: Math.max(8, f.y + f.h / 2 - (f.h * big) / 2) };
  const u = win(t, t0, t0 + FLY), e = easeIn2(u) * 0.35 + easeOut3(u) * 0.65;
  const sEnd = t0 + FLY + SHRINK, s = easeInOut(win(t, t0 + FLY, sEnd));
  const w0 = f.w * 0.3, h0 = f.h * 0.3;
  let x = mix(MARK.x - w0 / 2, snap.x, e), y = mix(MARK.y - h0 / 2, snap.y, e) - 70 * Math.sin(Math.PI * u);
  let ww = mix(w0, snap.w, e), hh = mix(h0, snap.h, e);
  const bump = u >= 1 ? 1 + 0.035 * Math.sin(Math.PI * win(t, t0 + FLY, t0 + FLY + 90)) : 1;  // the magnet clack
  x = mix(x, f.x, s); y = mix(y, f.y, s); ww = mix(ww, f.w, s) * bump; hh = mix(hh, f.h, s) * bump;
  const rot = mix(-16, 0, easeOut3(u));
  const air = 1 - s;
  const gone = win(t, tNext + FLY, tNext + FLY + 90);   // replaced once the next one snaps on
  if (gone >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: ww, height: hh, transform: `rotate(${rot}deg)`, opacity: 1 - gone,
      boxShadow: `0 ${6 + 26 * air}px ${10 + 40 * air}px rgba(0,0,0,${0.3 + 0.25 * air}), 0 2px 4px rgba(0,0,0,0.3)`,
      filter: u < 1 && u > 0.1 ? `blur(${(1.6 * Math.sin(Math.PI * u)).toFixed(2)}px)` : undefined }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }} />
    </div>
  );
};

const Hook: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, got: 2357, ...(beats as Record<string, number>) } as B;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const TT = HOLO_H["holo-h-title"]!;
  if (t < b.now) return <TT {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["Claude added", "every visual here"], fontPx: d.fontPx ?? 120 }} />;

  const arrive = easeOut3(win(t, b.now, b.now + 320));
  const last = b.got - FLY - SHRINK + 40;                // the last visual lands on GOT
  const starts = VIS.map((_, i) => mix(b.and, last, i / (VIS.length - 1)));
  const hold = 1 + 0.022 * win(t, 2450, toMs);
  const done = easeInOut(win(t, b.got, b.got + 80));
  const out = easeIn2(win(t, toMs - 140, toMs));
  // the mark: floats beside the phone, winds back and flicks on each throw, then drifts off once the reel lands
  const fl = starts.reduce((a, s0) => a + (t >= s0 - 60 && t < s0 + 90 ? Math.sin(Math.PI * win(t, s0 - 60, s0 + 90)) * (t < s0 ? -0.5 : 1) : 0), 0);
  const markOp = clamp(win(t, b.now + 60, b.now + 220)) * (1 - win(t, b.got + 60, b.got + 200));
  const mx = MARK.x + 22 * fl - 60 * win(t, b.got + 60, b.got + 200), my = MARK.y - 10 * fl + 4 * Math.sin((t - b.now) / 260);
  const spin = (t - b.now) * 0.05 + 40 * fl;
  const phoneY = 70 * (1 - arrive);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0",
      opacity: (1 - out) * clamp(0.25 + arrive * 2) }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 0px", transform: `translateY(${phoneY}px) scale(${hold})` }}>
        <Phone video={src("R-take.mp4")} fps={fps} fromMs={b.now} startSec={d.rawStartSec ?? 0}
          style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PSF})` }} />
        {t >= b.got - 20 && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={b.got - 20} startSec={d.startSec ?? 0.92}
            style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PSF})`, opacity: done }} />
        )}
        {VIS.map((v, i) => (
          <Card key={v.img} v={v} t={t} t0={starts[i]!} tNext={i < VIS.length - 1 ? starts[i + 1]! : 1e9} src={src(v.img)} />
        ))}
      </div>
      {markOp > 0 && (
        <div style={{ position: "absolute", left: mx, top: my, width: 0, height: 0, opacity: markOp }}>
          <Img src={src(CLAUDE_MARK)} style={{ position: "absolute", left: -58, top: -38, width: 116, height: 116, opacity: 0.3,
            filter: "brightness(0) blur(9px)" }} />
          <Img src={src(CLAUDE_MARK)} style={{ position: "absolute", left: -70, top: -70, width: 140, height: 140,
            transform: `rotate(${spin}deg)`, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }} />
        </div>
      )}
    </div>
  );
};

export const VISUALS_KINDS = { "kf-x-visuals": Hook };
