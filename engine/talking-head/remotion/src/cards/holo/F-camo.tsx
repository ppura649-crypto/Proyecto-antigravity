import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SLOP, Stage, WASH, WASH_HERO, beatsOf, easeInOut, hash, lerp, pick, sp, win, type FBeats } from "./F-util";
// edit-k-h2v1 "camouflage" (builder F, 2026-09-24), 1707 -> 4404. A wall of AI ads seen at an angle, every one
// washed into the same flat beige; the real SKIMS ad is one of the tiles and is invisible in the crowd. The camera
// trucks along the wall; on BLEND the SKIMS tile pushes out of the wall toward the camera, turning to face us, and
// its real colour floods back from the centre while the wall behind darkens and falls out of focus, leaving an
// empty slot and a cast shadow. Held under a slow push; clean 130 ms exit into the own-brand card.
const TW = 200, TH = 300, GAP = 18, PERSP = 1000, ZMAX = 430;
const COLS = [-4, -3, -2, -1, 0, 1, 2, 3, 4], ROWS = [-2, -1, 0, 1, 2];

const cam = (t: number, b: FBeats, p: number) => {
  const d = easeInOut(win(t, b.here, b.blend + 200));
  return { ry: lerp(33, 20, d) - 6 * p, rx: lerp(6, 3, d) - 1 * p, tx: lerp(190, 50, d) * (1 - p) };
};

const Tile: React.FC<{ c: number; r: number; src: string }> = ({ c, r, src }) => (
  <div style={{ position: "absolute", left: c * (TW + GAP) - TW / 2, top: r * (TH + GAP) - TH / 2, width: TW, height: TH,
    boxShadow: "0 10px 22px rgba(0,0,0,0.45)", overflow: "hidden", background: "#cfc6b6" }}>
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: WASH }} />
  </div>
);

export const Camo: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b = beatsOf(beats);
  const heroName: string = data?.hero ?? "skims-3754964.jpg";
  const hero = staticFile(pick(assets, heroName));
  const slop = SLOP.map((n) => staticFile(pick(assets, n)));
  const p = sp(t, b.blend, fps, 19, 70, 1.1);            // the pull out of the wall (0 -> 1, soft landing)
  const { ry, rx, tx } = cam(t, b, Math.min(1, p));
  const flood = win(t, b.blend + 180, b.fix);            // colour returns from the centre
  const r = lerp(-20, 135, easeInOut(flood));
  const dim = win(t, b.blend + 60, b.the + 60);
  const push = 1 + 0.045 * easeInOut(win(t, b.here, b.own));
  const chain = `translate(-50%, -50%) translateX(${tx}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
  const bob = Math.sin((t - b.fix) / 520) * 4 * win(t, b.fix, b.fix + 400);
  let k = 0;
  return (
    <Stage w={w} h={h} t={t} b={b}>
      <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: "50% 48%", transform: `scale(${push})` }}>
        {/* the wall: flat, so it can darken and defocus as one sheet */}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, transform: chain,
          filter: `brightness(${lerp(1, 0.4, dim)}) blur(${(3.6 * dim).toFixed(2)}px)` }}>
          {ROWS.map((row) => COLS.map((c) => {
            if (c === 0 && row === 0) return null;
            k += 1;
            const pickI = Math.floor(hash(c * 31 + row * 7 + 3) * 5 + k) % 5;
            return <Tile key={`${c}.${row}`} c={c} r={row} src={slop[pickI]} />;
          }))}
          {/* the empty slot the ad leaves, and the shadow the lifted ad casts on the wall */}
          <div style={{ position: "absolute", left: -TW / 2, top: -TH / 2, width: TW, height: TH,
            background: "#0b0a09", boxShadow: "inset 0 8px 20px rgba(0,0,0,0.9)" }} />
          <div style={{ position: "absolute", left: -TW / 2 + 40 * p, top: -TH / 2 + 46 * p, width: TW, height: TH,
            background: "rgba(0,0,0,0.75)", filter: `blur(${14 + 26 * p}px)`, opacity: Math.min(1, p * 1.2) }} />
        </div>
        {/* the ad itself: same chain, lifted along the wall's normal and turned back to face the camera */}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: TW, height: TH, overflow: "hidden",
          transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${ZMAX * p}px) rotateY(${ry * (1 - Math.min(1, p))}deg) rotateX(${rx * (1 - Math.min(1, p)) + bob * 0.2}deg)`,
          boxShadow: `0 ${10 + 30 * p}px ${22 + 50 * p}px rgba(0,0,0,${0.45 + 0.25 * p})`, background: "#cfc6b6" }}>
          <Img src={hero} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: WASH_HERO }} />
          <Img src={hero} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            WebkitMaskImage: `radial-gradient(circle at 50% 55%, #000 ${r}%, transparent ${r + 22}%)` } as React.CSSProperties} />
        </div>
      </div>
      {/* the room: a soft top light and a vignette */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 90% at 50% 30%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
    </Stage>
  );
};
export const CAMO_ASSETS = [...SLOP, "skims-3754964.jpg"];
