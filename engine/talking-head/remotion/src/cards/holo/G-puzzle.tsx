import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beatsOf, clamp, easeInOut, easeOut3, exitP, hash, holdPush, pick, sp, win, type GBeats } from "./G-util";
// edit-k-h3v3 "nothing fits" (builder G, 2026-09-24), 2233 -> 5937. A finished jigsaw of a fictional slop ad
// sits on the table. On "AI ... slop" four of its pieces pop out and come back down as pieces of OTHER slop
// ads, askew and unseated: nothing fits. On WATCH the whole puzzle drops away piece by piece, and from THIS a
// real Crocs poster flies in piece by piece and snaps together in a diagonal wave, whole by "fix", held under
// a slow push. Clean 130 ms exit into "own".

const PW = 480, PH = 600, C = 4, RW = 5, CW = PW / C, CH = PH / RW;
// tab direction of every inner edge, seeded: +1 bulges right/down, -1 left/up
const vTab = (r: number, c: number) => (hash(r * 11 + c * 3 + 1) > 0.5 ? 1 : -1); // edge right of (r, c)
const hTab = (r: number, c: number) => (hash(r * 5 + c * 13 + 7) > 0.5 ? 1 : -1); // edge below (r, c)

// one edge from (x0, y0) to (x1, y1), bulging by d along the left normal of the travel direction
const edge = (x0: number, y0: number, x1: number, y1: number, d: number) => {
  if (d === 0) return `L ${x1} ${y1}`;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = uy * d, ny = -ux * d;
  const P = (a: number, b: number) => `${(x0 + ux * a * L + nx * b * L).toFixed(1)} ${(y0 + uy * a * L + ny * b * L).toFixed(1)}`;
  return [`L ${P(0.36, 0)}`, `C ${P(0.42, 0)} ${P(0.33, 0.2)} ${P(0.42, 0.24)}`, `C ${P(0.47, 0.28)} ${P(0.53, 0.28)} ${P(0.58, 0.24)}`,
    `C ${P(0.67, 0.2)} ${P(0.58, 0)} ${P(0.64, 0)}`, `L ${x1} ${y1}`].join(" ");
};
// the outline of piece (r, c) in puzzle px, clockwise from its top-left corner
const piecePath = (r: number, c: number) => {
  const x0 = c * CW, y0 = r * CH, x1 = x0 + CW, y1 = y0 + CH;
  const top = r === 0 ? 0 : hTab(r - 1, c), right = c === C - 1 ? 0 : vTab(r, c);
  const bottom = r === RW - 1 ? 0 : hTab(r, c), left = c === 0 ? 0 : vTab(r, c - 1);
  // the two sides of a shared edge must move the same way: +1 bulges right/down on both pieces
  return [`M ${x0} ${y0}`, edge(x0, y0, x1, y0, -top), edge(x1, y0, x1, y1, right), edge(x1, y1, x0, y1, bottom),
    edge(x0, y1, x0, y0, -left), "Z"].join(" ");
};
const PIECES = Array.from({ length: C * RW }, (_, i) => ({ r: Math.floor(i / C), c: i % C, i, d: piecePath(Math.floor(i / C), i % C) }));
const WRONG: Record<number, { src: string; rot: number; dx: number; dy: number }> = {
  1: { src: "famA-slop-serum.jpg", rot: -7, dx: 6, dy: -5 },
  6: { src: "famA-slop-bike.jpg", rot: 9, dx: -7, dy: 6 },
  12: { src: "famA-slop-sneaker.jpg", rot: -10, dx: 8, dy: 4 },
  15: { src: "famA-slop-pyjama.jpg", rot: 6, dx: -5, dy: -7 },
};
export const PUZZLE_ASSETS = Object.values(WRONG).map((w) => w.src);

const Piece: React.FC<{ d: string; src: string; tf: string; o: string; shadow: number; dim?: number }> = ({ d, src, tf, o, shadow, dim = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transform: tf, transformOrigin: o,
    filter: shadow > 0.02 ? `drop-shadow(0 ${14 * shadow}px ${16 * shadow}px rgba(0,0,0,${0.5 * shadow}))` : undefined }}>
    <div style={{ position: "absolute", inset: 0, clipPath: `path('${d}')` }}>
      <Img src={src} style={{ position: "absolute", inset: 0, width: PW, height: PH, objectFit: "cover", objectPosition: "50% 0%",
        filter: dim ? `brightness(${1 - dim})` : undefined }} />
      <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={3} />
        <path d={d} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} transform="translate(1.2 1.2)" />
      </svg>
    </div>
  </div>
);

const Puzzle: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b: GBeats = beatsOf(beats);
  const slop = staticFile(pick(assets, data?.slop ?? "famA-slop-dog.jpg"));
  const real = staticFile(pick(assets, data?.real ?? "crocs-5139714.jpg"));
  const out = exitP(t, b);
  const s = holdPush(t, b.but, b, 0.035) * (1 - 0.03 * out);
  const falls = t >= b.watch;
  const inAt = (p: { r: number; c: number; i: number }) => b.this + 110 + (p.r + p.c) * 38 + hash(p.i * 3.1) * 30;
  const seamFade = easeInOut(win(t, b.fix + 250, b.fix + 800));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: (w - PW) / 2, top: (h - PH) / 2, width: PW, height: PH, transform: `scale(${s})`, perspective: 1400 }}>
        {/* the slop puzzle: whole, then four wrong pieces, then it drops away from the bottom row up */}
        {PIECES.map((p) => {
          const wr = WRONG[p.i];
          const tau = (t - b.watch - (RW - 1 - p.r) * 35 - hash(p.i * 7.7) * 40) / 1000;
          if (falls && tau > 0.26) return null;
          let tf = "", shadow = 0, src = slop;
          if (wr) {
            const at = b.ai + (p.i % 4) * 70;
            const lift = Math.sin(Math.PI * win(t, at, at + 300)); // up and back down
            const seat = easeOut3(win(t, at + 150, at + 320));
            if (t >= at + 150) src = staticFile(pick(assets, wr.src));
            tf = `translate(${wr.dx * seat}px, ${wr.dy * seat - 26 * lift}px) rotate(${wr.rot * seat}deg) scale(${1 + 0.12 * lift})`;
            shadow = 0.9 * lift + 0.35 * seat;
          }
          if (falls && tau > 0) {
            const y = 900 * tau + 3600 * tau * tau, x = (hash(p.i * 2.3) - 0.5) * 420 * tau;
            const rot = (hash(p.i * 5.9) - 0.5) * 300 * tau;
            tf = `${tf} translate(${x}px, ${y}px) rotate(${rot}deg)`;
            shadow = Math.max(shadow, 0.8);
          }
          const op = falls ? 1 - clamp((tau - 0.1) / 0.15) : 1;
          const cx = (p.c + 0.5) * CW, cy = (p.r + 0.5) * CH;
          return (
            <div key={`s${p.i}`} style={{ position: "absolute", inset: 0, opacity: op, transformOrigin: `${cx}px ${cy}px`, zIndex: wr ? 2 : 1 }}>
              <Piece d={p.d} src={src} tf={tf || "none"} o={`${cx}px ${cy}px`} shadow={shadow} />
            </div>
          );
        })}
        {/* the real poster: every piece flies in from above and snaps into its slot */}
        {PIECES.map((p) => {
          const at = inAt(p);
          if (t < at) return null;
          const k = sp(t, at, fps, { damping: 19, stiffness: 250 });
          const land = clamp((t - at) / 260);
          const side = p.c < C / 2 ? -1 : 1;
          const fx = side * (330 + hash(p.i * 4.1) * 220), fy = (hash(p.i * 6.3) - 0.5) * 240 - 60, fr = side * (20 + hash(p.i * 8.8) * 40);
          const click = Math.sin(Math.PI * win(t, at + 250, at + 340)) * 0.025;
          const tf = `translate(${fx * (1 - k)}px, ${fy * (1 - k)}px) rotate(${fr * (1 - k)}deg) scale(${1 + 0.18 * (1 - easeOut3(land)) - click})`;
          const cx = (p.c + 0.5) * CW, cy = (p.r + 0.5) * CH;
          return (
            <div key={`r${p.i}`} style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${cy}px`, zIndex: 3,
              opacity: easeOut3(win(t, at, at + 90)) }}>
              <Piece d={p.d} src={real} tf={tf} o={`${cx}px ${cy}px`} shadow={(1 - easeOut3(land)) * 0.9} />
            </div>
          );
        })}
        {/* once whole, the seams close up into one clean print */}
        {seamFade > 0 && (
          <Img src={real} style={{ position: "absolute", inset: 0, width: PW, height: PH, objectFit: "cover", objectPosition: "50% 0%",
            opacity: 0.85 * seamFade, zIndex: 4 }} />
        )}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
          opacity: t < b.watch + 120 ? 1 : easeOut3(win(t, b.fix - 100, b.fix + 200)) }} />
      </div>
    </div>
  );
};

export const PUZZLE_KINDS = { "holo-g-puzzle": Puzzle };
