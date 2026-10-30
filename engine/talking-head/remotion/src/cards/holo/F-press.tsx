import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Stage, WASH, beatsOf, easeInOut, easeOut3, easeOut5, hash, lerp, pick, sp, win, type FBeats } from "./F-util";
// edit-k-h2v2 "the press" (builder F, 2026-09-24), 1707 -> 4404. Seen from above: a print machine's output slot
// feeding a tray where three stacks of the SAME washed-out AI ad pile up. Copy after copy shoots out of the slot
// and lands on the middle stack (IS, TO, BLEND, IN), rollers turning. Then one sheet comes out different: the real
// Crocs "Come As You Are" ad in full colour, and instead of landing it lifts off the tray and turns to face the
// camera while the machine and the stacks fall back into the dark. Held under a slow push; 130 ms exit.
const SW = 250, SH = 375, TOP = 176, PERSP = 1400, TILT = 24, SLOT = 124;
const XS = [-330, 0, 330];
const FLY = 230;

// the paper edges under a stack's top sheet
const Edges: React.FC<{ x: number; n: number; rot: number }> = ({ x, n, rot }) => (
  <>{Array.from({ length: n }, (_, k) => (
    <div key={k} style={{ position: "absolute", left: 540 + x - SW / 2 + (n - k) * 1.4, top: TOP + (n - k) * 3.2, width: SW, height: SH,
      background: k % 2 ? "#ddd6c8" : "#e8e2d6", transform: `rotate(${rot + (hash(x + k) - 0.5) * 2.2}deg)`,
      boxShadow: k === 0 ? "0 18px 30px rgba(0,0,0,0.55)" : "0 1px 1px rgba(0,0,0,0.25)" }} />
  ))}</>
);

const Sheet: React.FC<{ x: number; y: number; rot: number; lift: number; src: string; wash?: boolean }> = ({ x, y, rot, lift, src, wash = true }) => (
  <div style={{ position: "absolute", left: 540 + x - SW / 2, top: y, width: SW, height: SH, overflow: "hidden", background: "#e8e2d6",
    transform: `translateZ(${lift}px) rotate(${rot}deg)`, boxShadow: `0 ${4 + lift * 0.5}px ${8 + lift}px rgba(0,0,0,0.5)` }}>
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: wash ? WASH : undefined }} />
  </div>
);

// the machine: a dark steel body across the top, its slot and the roller inside it
const Machine: React.FC<{ roll: number; dim: number }> = ({ roll, dim }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SLOT + 16, filter: `brightness(${lerp(1, 0.4, dim)})` }}>
    <div style={{ position: "absolute", inset: 0, bottom: 16,
      background: "linear-gradient(180deg, #3a3b40 0%, #26272b 55%, #17171a 100%)", boxShadow: "0 14px 30px rgba(0,0,0,0.7)" }} />
    <div style={{ position: "absolute", left: 60, right: 60, top: 26, height: 3, background: "rgba(255,255,255,0.08)" }} />
    {[160, 920].map((x) => (
      <div key={x} style={{ position: "absolute", left: x - 11, top: 50, width: 22, height: 22, borderRadius: 11,
        background: "radial-gradient(circle at 35% 35%, #8a8b90, #2a2a2e)" }} />
    ))}
    {/* the slot: a black lip and the turning roller seen through it */}
    <div style={{ position: "absolute", left: 40, right: 40, top: SLOT - 30, height: 30, background: "#050506", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 4, backgroundImage:
        "repeating-linear-gradient(0deg, #3b3c41 0px, #1a1a1d 5px, #3b3c41 10px)", backgroundPosition: `0 ${roll}px`, opacity: 0.9 }} />
    </div>
  </div>
);

export const Press: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b = beatsOf(beats);
  const copy = staticFile(pick(assets, data?.copy ?? "famA-slop-serum.jpg"));
  const hero = staticFile(pick(assets, data?.hero ?? "crocs-5139667.jpg"));
  const lands: number[] = [1880, b.to, b.blend, b.in - 140];
  const heroOut = b.in - 84;                                    // the different sheet starts out of the slot
  const lift = sp(t, b.the, fps, 18, 80, 1);               // and lifts off the tray to face the camera
  const dim = win(t, b.the, b.fix + 150);
  let roll = 0;                                                 // roller turns while paper runs through it
  for (const L of [...lands, heroOut + FLY]) roll += 180 * easeInOut(win(t, L - FLY, L));
  const landed = lands.filter((L) => t >= L).length;
  const push = 1 + 0.04 * easeInOut(win(t, b.here, b.own));
  const fly = lands.findIndex((L) => t >= L - FLY && t < L);
  const heroY = lerp(-SH - 40, TOP - 6, easeOut5(win(t, heroOut, heroOut + FLY)));
  const hs = lerp(1, 1.3, easeOut3(lift));
  return (
    <Stage w={w} h={h} t={t} b={b} bg="linear-gradient(180deg, #121215 0%, #0b0b0d 100%)">
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: "50% 0%" }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg)`, transformOrigin: "50% 0%" }}>
            {/* the tray: matte dark with a faint grain of light */}
            <div style={{ position: "absolute", left: -200, right: -200, top: 0, height: 900, filter: `brightness(${lerp(1, 0.45, dim)})`,
              background: "radial-gradient(ellipse 50% 60% at 50% 45%, #2a2926 0%, #161513 70%)" }}>
              <div style={{ position: "absolute", left: 200, width: 1080, top: 0, height: 900 }}>
                {XS.map((x, i) => i === 1 ? null : (
                  <React.Fragment key={x}>
                    <Edges x={x} n={6} rot={(hash(i) - 0.5) * 3} />
                    <Sheet x={x} y={TOP} rot={(hash(i + 9) - 0.5) * 3} lift={0} src={copy} />
                  </React.Fragment>
                ))}
                <Edges x={0} n={3 + landed} rot={0.6} />
                <Sheet x={0} y={TOP} rot={-1.1} lift={0} src={copy} />
                {lands.map((L, i) => t < L - FLY ? null : (
                  <Sheet key={L} x={(hash(i * 5 + 1) - 0.5) * 14} rot={(hash(i * 3 + 2) - 0.5) * 4 * (1 - 0.6 * easeOut3(win(t, L - 60, L + 120)))}
                    y={lerp(-SH - 40, TOP, easeOut5(win(t, L - FLY, L)))} lift={i === fly ? 18 : 0} src={copy} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Machine roll={roll} dim={dim} />
        {/* the one that comes out different: clipped by the slot until it is out, then lifted above everything */}
        {t >= heroOut && (
          <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: "50% 0%",
            clipPath: `inset(${lerp(SLOT - 6, -200, win(t, heroOut + FLY - 20, heroOut + FLY))}px -200px -200px -200px)` }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg)`, transformOrigin: "50% 0%" }}>
              <div style={{ position: "absolute", left: 540 - SW / 2, top: heroY, width: SW, height: SW * 1.25, overflow: "hidden",
                transformOrigin: "50% 0%",
                transform: `translateY(${-5 * easeInOut(lift)}px) translateZ(${220 * lift}px) rotateX(${-TILT * Math.min(1, lift)}deg) scale(${hs})`,
                boxShadow: `0 ${10 + 30 * lift}px ${20 + 50 * lift}px rgba(0,0,0,0.6)` }}>
                <Img src={hero} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
};
export const PRESS_ASSETS = ["famA-slop-serum.jpg", "crocs-5139667.jpg"];
