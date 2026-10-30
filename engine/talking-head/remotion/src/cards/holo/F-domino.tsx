import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SLOP, Stage, WASH, WASH_HERO, beatsOf, easeIn2, easeInOut, hash, lerp, pick, sp, win, type FBeats } from "./F-util";
// edit-k-h2v3 "last one standing" (builder F, 2026-09-24), 1707 -> 4404. Rows of AI ads stand on a dark floor
// like dominoes, all washed into the same beige. On NOT a wave knocks them flat, row after row, each falling with
// gravity and a small bounce; one card rocks and stays up: the SKIMS ad. On "The fix" the camera dollies in, the
// card turns to face us and its real colour floods back; the fallen ones sink into the dark. Held, 130 ms exit.
const CW = 138, CH = 207, DX = 172, FLOOR = 60, PERSP = 1000;
const ROWS = [230, -20, -270];              // floor depth of each row (front row first)
const COLS = [-2, -1, 0, 1, 2];
const FALL = 300;
const HERO_DY = 250, HERO_DZ = 40, HERO_S = 1.72;   // the survivor's walk to the front of the floor

const fallAngle = (t: number, start: number) => {
  if (t < start) return -90;
  const u = (t - start) / FALL;
  if (u < 1) return -90 + 90 * easeIn2(u);
  const v = (t - start - FALL) / 170;       // one small bounce off the floor
  return v < 1 ? -9 * Math.sin(Math.PI * v) * (1 - 0.3 * v) : 0;
};

const Card: React.FC<{ x: number; y: number; ang: number; src: string; dim: number; blur: number; hero?: boolean; flood?: number; pre?: string; post?: string }> =
  ({ x, y, ang, src, dim, blur, hero, flood = 0, pre = "", post = "" }) => {
    const r = lerp(-20, 135, flood);
    return (
      <div style={{ position: "absolute", left: x - CW / 2, top: y - CH, width: CW, height: CH, transformOrigin: "50% 100%",
        transform: `${pre} rotateX(${ang}deg) ${post}`, background: "#cfc6b6", overflow: "hidden",
        filter: dim > 0.01 || blur > 0.05 ? `brightness(${1 - dim}) blur(${blur.toFixed(2)}px)` : undefined }}>
        <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: hero ? WASH_HERO : WASH }} />
        {hero && (
          <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            WebkitMaskImage: `radial-gradient(circle at 50% 55%, #000 ${r}%, transparent ${r + 22}%)` } as React.CSSProperties} />
        )}
      </div>
    );
  };

export const Domino: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b = beatsOf(beats);
  const hero = staticFile(pick(assets, data?.hero ?? "skims-3755019.jpg"));
  const slop = SLOP.map((n) => staticFile(pick(assets, n)));
  const start = (ri: number, c: number) => b.not + ri * 150 + Math.abs(c) * 34 + hash(ri * 11 + c) * 20;
  const dolly = sp(t, b.the, fps, 20, 70, 1.1);
  const flood = easeInOut(win(t, b.the + 80, b.fix + 260));
  const dimFallen = win(t, b.the, b.fix + 200);
  // the survivor: rocks once as its row goes down, then turns to face the camera
  const rockT = t - (b.not + 150 + 60);
  const rock = rockT > 0 ? -7 * Math.sin(rockT / 55) * Math.exp(-rockT / 160) : 0;
  const heroAng = -90 + rock + (90 - FLOOR) * Math.min(1, dolly);
  const push = 1 + 0.035 * easeInOut(win(t, b.fix, b.own));
  const drift = 30 * easeInOut(win(t, b.here, b.the));
  return (
    <Stage w={w} h={h} t={t} b={b} bg="radial-gradient(ellipse 70% 80% at 50% 30%, #1d1c1f 0%, #0b0b0d 70%)">
      <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: "50% 26%", transform: `scale(${push})` }}>
        <div style={{ position: "absolute", left: 540, top: 360, width: 0, height: 0, transformStyle: "preserve-3d",
          transform: `rotateX(${FLOOR}deg) rotateZ(${lerp(-3, 0, Math.min(1, dolly)) + drift * 0.02}deg)` }}>
          {/* the floor: a soft pool of light */}
          <div style={{ position: "absolute", left: -900, top: -800, width: 1800, height: 1400, transform: "translateZ(-3px)",
            background: "radial-gradient(ellipse 40% 45% at 50% 60%, #2b2926 0%, #141315 60%, #0b0b0d 100%)",
            filter: `brightness(${lerp(1, 0.6, dimFallen)})` }} />
          {ROWS.map((y, ri) => COLS.map((c) => {
            const isHero = ri === 1 && c === 0;
            if (isHero) return null;
            const k = (ri * 5 + c + 12) % 5;
            return <Card key={`${ri}.${c}`} x={c * DX + (ri - 1) * 18} y={y} ang={fallAngle(t, start(ri, c))} src={slop[k]}
              dim={0.55 * dimFallen} blur={2.5 * dimFallen} />;
          }))}
          <Card x={0} y={ROWS[1]} ang={heroAng} src={hero} dim={0} blur={0} hero flood={flood}
            pre={`translate3d(0px, ${HERO_DY * dolly}px, ${HERO_DZ * dolly}px)`} post={`scale(${lerp(1, HERO_S, dolly)})`} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 85% 90% at 50% 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />
    </Stage>
  );
};
export const DOMINO_ASSETS = [...SLOP, "skims-3755019.jpg"];
