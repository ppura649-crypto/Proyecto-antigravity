import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beatsOf, clamp, easeIn2, easeInOut, easeOut3, exitP, hash, holdPush, noise1, pick, win, type GBeats } from "./G-util";
// edit-k-h3v2 "rip it down" (builder G, 2026-09-24), 2233 -> 5937. A fictional slop poster is pasted flat
// over another poster. On "AI ... slop" its top corner starts to lift off the paste. On WATCH it rips: the
// torn half tears along a ragged line with a white paper edge, folds toward us showing its paper back, and is
// thrown off. On "fix" the rest is peeled away from its torn edge, and the real Crocs poster that was always
// under it is left clean, held under a slow push. Clean 130 ms exit into "own".

const PH = 610, PW = 458;
type Pt = [number, number];
// a ragged tear between two edge points (poster fractions), seeded
const ragged = (a: Pt, b: Pt, seed: number, n = 44): Pt[] => {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx * PW, dy * PH);
  const nx = (-dy * PH) / len, ny = (dx * PW) / len;
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, edge = i === 0 || i === n ? 0 : 1;
    const j = edge * ((noise1(u * 5, seed) - 0.5) * 30 + (hash(i * 3.7 + seed) - 0.5) * 7);
    return [a[0] + dx * u + (nx * j) / PW, a[1] + dy * u + (ny * j) / PH] as Pt;
  });
};
const L1 = ragged([0.1, 0], [1, 0.8], 3); // the first rip: the top-right half comes away
const A: Pt[] = [...L1, [1, 0]]; // top-right piece
const B: Pt[] = [[0, 0], ...L1, [1, 1], [0, 1]]; // the rest
const HINGE: [Pt, Pt] = [[0.66, 0], [1, 0.3]]; // the corner that lifts first
const CORNER: Pt[] = [HINGE[0], [1, 0], HINGE[1]];
const clip = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${(x * PW).toFixed(1)}px ${(y * PH).toFixed(1)}px`).join(",")})`;
const axis = (p: Pt, q: Pt) => { const x = (q[0] - p[0]) * PW, y = (q[1] - p[1]) * PH, l = Math.hypot(x, y); return [x / l, y / l]; };

// one piece of paper: its print while it faces us, its paper back once it has turned past 90 degrees
const Sheet: React.FC<{ pts: Pt[]; src: string; ang: number; tear?: Pt[]; dim?: number }> = ({ pts, src, ang, tear, dim = 0 }) => {
  const back = Math.cos((ang * Math.PI) / 180) < 0;
  const light = Math.cos((ang * Math.PI) / 180);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, clipPath: clip(pts) }}>
      {back ? (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, #f3f0ea, #d9d4ca)`,
          filter: `brightness(${0.75 + 0.25 * Math.abs(light)})` }}>
          <Img src={src} style={{ position: "absolute", inset: 0, width: PW, height: PH, objectFit: "cover",
            objectPosition: "50% 0%", opacity: 0.12, transform: "scaleX(-1)", filter: "grayscale(1)" }} />
        </div>
      ) : (
        <Img src={src} style={{ position: "absolute", inset: 0, width: PW, height: PH, objectFit: "cover",
          objectPosition: "50% 0%", filter: `brightness(${(1 - dim) * (0.8 + 0.2 * light) + 0.12 * (1 - light)})` }} />
      )}
      {tear && (
        <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={tear.map(([x, y]) => `${x * PW},${y * PH}`).join(" ")} fill="none"
            stroke="#f4f1ea" strokeWidth={9} strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};

const Tear: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets, data }) => {
  const b: GBeats = beatsOf(beats);
  const slop = staticFile(pick(assets, data?.slop ?? "famA-slop-pyjama.jpg"));
  const real = staticFile(pick(assets, data?.real ?? "crocs-5139685.jpg"));
  const out = exitP(t, b);
  const s = holdPush(t, b.but, b, 0.03) * (1 - 0.03 * out);
  // the corner: lifts on AI, curls a little more on SLOP, keeps its curl while the half comes away
  const corner = 40 * easeOut3(win(t, b.ai, b.ai + 300)) + 105 * easeInOut(win(t, b.slop - 60, b.slop + 280));
  // rip 1 (WATCH): the tear runs in 150 ms, the half folds toward us, then is thrown off to the right
  const run = easeOut3(win(t, b.watch, b.watch + 150));
  const fold = 128 * easeInOut(win(t, b.watch + 40, b.this + 200));
  const throw1 = easeIn2(win(t, b.this + 120, b.the + 40));
  // rip 2 (FIX): the rest peels from its torn edge like a door on its left side, then drops away left
  const peel = -150 * easeInOut(win(t, b.fix - 60, b.fix + 200));
  const throw2 = easeIn2(win(t, b.fix + 130, b.fix + 380));
  const realFocus = easeOut3(win(t, b.fix, b.fix + 300));
  const [ux, uy] = axis(L1[0], L1[L1.length - 1]);
  const [hx, hy] = axis(HINGE[0], HINGE[1]);
  const lifted = (k: number) => `drop-shadow(${-10 * k}px ${18 * k}px ${22 * k}px rgba(0,0,0,${0.45 * k}))`;
  const k1 = clamp(fold / 40), k2 = clamp(-peel / 40);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: (w - PW) / 2, top: (h - PH) / 2, width: PW, height: PH,
        transform: `scale(${s})`, perspective: 1500 }}>
        <div style={{ position: "absolute", inset: 0, boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)" }}>
          <Img src={real} style={{ width: PW, height: PH, objectFit: "cover", display: "block",
            filter: `brightness(${0.82 + 0.18 * realFocus}) saturate(${0.85 + 0.15 * realFocus})` }} />
        </div>
        {/* the rest (B): peels on FIX around its left edge, then drops away */}
        {throw2 < 1 && (
          <div style={{ position: "absolute", inset: 0, filter: k2 > 0.02 ? lifted(k2) : undefined, opacity: 1 - win(throw2, 0.75, 1),
            transform: `translate3d(${-900 * throw2}px, ${260 * throw2}px, 0) rotate(${-24 * throw2}deg)` }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: "0px 50%", transform: `rotateY(${peel}deg)` }}>
              <Sheet pts={B} src={slop} ang={peel} tear={t >= b.watch ? L1.slice(0, 1 + Math.round(run * (L1.length - 1))) : undefined} />
            </div>
          </div>
        )}
        {/* the torn half (A): folds toward us around the tear line, then is thrown off */}
        {throw1 < 1 && (
          <div style={{ position: "absolute", inset: 0, filter: k1 > 0.02 ? lifted(k1) : undefined, opacity: 1 - win(throw1, 0.75, 1),
            transform: `translate3d(${900 * throw1}px, ${-120 * throw1 + 380 * throw1 * throw1}px, 0) rotate(${38 * throw1}deg)` }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: `${L1[0][0] * PW}px ${L1[0][1] * PH}px`,
              transform: `rotate3d(${ux}, ${uy}, 0, ${-fold}deg)` }}>
              <Sheet pts={A.filter((p) => !(p[0] === 1 && p[1] === 0)).concat([HINGE[1], HINGE[0]])} src={slop} ang={fold}
                tear={t >= b.watch ? L1 : undefined} />
              <div style={{ position: "absolute", inset: 0, transformOrigin: `${HINGE[0][0] * PW}px ${HINGE[0][1] * PH}px`,
                transform: `rotate3d(${hx}, ${hy}, 0, ${-corner}deg)`, filter: corner > 1 ? lifted(clamp(corner / 60) * 0.7) : undefined }}>
                <Sheet pts={CORNER} src={slop} ang={fold + corner} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TEAR_KINDS = { "holo-g-tear": Tear };
