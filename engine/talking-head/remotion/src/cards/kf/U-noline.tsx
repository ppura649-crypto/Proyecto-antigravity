import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, hash, mix, pick, win } from "./L-util";
import { CAP_WORDS, CapStack } from "./U-caps";
import { PH, SCR, Title, type UBeats, beatsU, exitU } from "./U-kit";
import { SLOT_Y, Shredder } from "./U-shredder";
import { TL, TIMELINE_ASSETS, TimelineSheet } from "./U-timeline";
// keyframes-v1 hook U4 "No timeline. / Just Claude." (builder U, round 2). The title alone to NOW, then the steel
// shredder head (hook U1's, set higher) stands in the band with a printed page of their editing timeline standing in
// its mouth: the raw take on V1 cut into clips with their real frames, B-roll on V2 with keyframes, the voice and a
// music bed, 00:00 to 01:28. The real Claude mark sits on the shredder's control panel, dark. On AND it lights
// orange and the machine pulls the timeline in; on EXACTLY the page comes out underneath as falling strips. On HOW
// / GOT the same slot hands back the edit: their reel rises out of the top of the shredder as a phone playing it,
// this video's caption words landing on it live, the shredder sinks away, landed ~2450 and held. Exit at 2997.

const DY = -170;                                   // the shredder head sits 170 px higher than in U1
const SLOT = SLOT_Y + DY;                          // 335
const BODY_BOT = 602 + DY;                         // 432, the underside the strips fall from
const SH = { x: 540 - TL.w / 2, y: SLOT - TL.h + 6 };
const COLS = 12, ROWS = 3, CWD = TL.w / COLS, RH = TL.h / ROWS;
const FEED = TL.h + 6;

const feedOf = (t: number, b: UBeats) => FEED * Math.pow(win(t, b.and, b.how + 30), 1.15);
const tOfFeed = (f: number, b: UBeats) => b.and + Math.pow(Math.max(0, f) / FEED, 1 / 1.15) * (b.how + 30 - b.and);

// the machine's own clock for the sinking (the Shredder reads b.how): it leaves once the reel is out
const machineBeats = (b: UBeats): UBeats => ({ ...b, how: 2170 });
const machineAway = (t: number, bm: UBeats) => easeIn2(win(t, bm.how + 90, bm.how + 330));
const machineWrap = (t: number, bm: UBeats): React.CSSProperties => {
  const away = machineAway(t, bm);
  const run = t > bm.and - 60 && t < bm.how + 200 ? 1 : 0.25;
  const shiver = run * 0.9 * Math.sin(t * 0.37) + run * 0.5 * Math.sin(t * 0.91);
  return { position: "absolute", left: 0, top: 0, width: 1080, height: 614, transformOrigin: "540px 600px",
    transform: `perspective(900px) translateY(${(shiver + 30 * away).toFixed(2)}px) rotateX(${(-38 * away).toFixed(2)}deg) scale(${mix(1, 0.86, away)})`,
    opacity: clamp(1 - win(t, bm.how + 90, bm.how + 210)) };
};

// the control panel: a recessed steel button carrying the Claude mark, dark until AND, then lit and breathing
const Panel: React.FC<{ t: number; b: UBeats; mark: string }> = ({ t, b, mark }) => {
  const on = easeOut3(win(t, b.and - 30, b.and + 90));
  const breathe = on * (0.85 + 0.15 * Math.sin((t - b.and) / 90));
  const cx = 786, cy = 488;                       // on the plate, right of the mouth (shredder coordinates)
  return (
    <div style={{ position: "absolute", left: cx - 36, top: cy - 26, width: 72, height: 52, borderRadius: "50%",
      background: "radial-gradient(ellipse at 50% 40%, #2a2b2f 0%, #16171a 70%, #0b0b0c 100%)",
      boxShadow: "inset 0 2px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.6), 0 0 0 2px #8d9299" }}>
      <div style={{ position: "absolute", left: 36 - 23, top: 26 - 23, width: 46, height: 46, transform: "scaleY(0.8)" }}>
        <Img src={mark} style={{ width: "100%", height: "100%",
          filter: `grayscale(${(1 - on).toFixed(3)}) brightness(${mix(0.35, 1.1, on).toFixed(3)}) drop-shadow(0 0 ${(10 * breathe).toFixed(2)}px rgba(217,119,87,${(0.95 * breathe).toFixed(3)}))` }} />
      </div>
    </div>
  );
};

const Noline: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsU(beats);
  if (t < b.now) return <Title {...props} toMs={b.now} />;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const img = (n: string) => src(n);
  const paper = src("U-paper.png");
  const k = w / 1080;
  const e = easeOut3(win(t, b.now, b.now + 300));
  const enterOp = 0.4 + 0.6 * win(t, b.now, b.now + 90);
  const bm = machineBeats(b);
  const f = feedOf(t, b);
  const tug = t > b.and && t < b.how + 60 ? 0.8 * Math.sin(t * 0.61) : 0;
  // the reel rises out of the slot from HOW, soft landing at 2430
  const rise = easeOut3(win(t, b.how + 10, 2430));
  const phoneTop = mix(SLOT + 12, PH.y, rise);
  const reveal = easeInOut(win(t, bm.how + 90, bm.how + 240));
  const clipBottom = mix(SLOT, 700, reveal);
  const push = 1 + 0.022 * easeInOut(win(t, 2450, toMs));
  const gone = exitU(t, toMs);
  const vt = 500 + (t - 2000);                      // the reel's own clock (0.5 s at 2000, 0.92 s at 2420)
  const capP = (i: number) => win(vt, CAP_WORDS[i]!.at, CAP_WORDS[i]!.at + 130);
  const clip = `polygon(-400px -400px, 1480px -400px, 1480px ${clipBottom}px, -400px ${clipBottom}px)`;
  // the strips: each 32 x 93 piece leaves the underside once it has passed the cutters, then falls
  const pieces: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const n = r * COLS + c;
    const te = Math.min(tOfFeed((r + 1) * RH + 40, b), b.how + 70) + 35 * hash(n * 1.3 + 2);
    const tau = (t - te) / 1000;
    if (tau < 0 || tau > 0.45) continue;
    const y = BODY_BOT - RH + 8 + 90 * tau + 0.5 * 2600 * tau * tau;
    const a = clamp((600 - (y + RH)) / 45) * clamp(tau / 0.04);
    if (a <= 0.01) continue;
    const x = SH.x + c * CWD + (c - (COLS - 1) / 2) * 60 * tau + 14 * Math.sin(tau * 18 + n);
    const rz = (hash(n * 2.1) - 0.5) * 70 * tau;
    const rx = 40 * Math.sin(tau * 14 + n) * Math.min(1, tau * 6);
    pieces.push(
      <div key={n} style={{ position: "absolute", left: x, top: y, width: CWD, height: RH, overflow: "hidden", opacity: a,
        transform: `perspective(600px) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`,
        boxShadow: "0 6px 10px rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.5)" }}>
        <div style={{ position: "absolute", left: -c * CWD, top: -(TL.h - (r + 1) * RH) }}>
          <TimelineSheet img={img} paper={paper} />
        </div>
      </div>,
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: (1 - gone) * enterOp }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 300px",
        transform: `translateY(${34 * (1 - e)}px) scale(${(0.95 + 0.05 * e) * push})` }}>
        <div style={{ position: "absolute", left: 0, top: DY, width: 1080, height: 614 }}>
          <Shredder t={t} b={bm} part="back" />
        </div>
        {/* the timeline page, pulled down into the mouth */}
        {f < FEED && (
          <div style={{ position: "absolute", inset: 0, clipPath: `polygon(-400px -400px, 1480px -400px, 1480px ${SLOT}px, -400px ${SLOT}px)` }}>
            <div style={{ position: "absolute", left: SH.x + tug, top: SH.y + f, width: TL.w, height: TL.h,
              boxShadow: "0 18px 30px rgba(0,0,0,0.3)", transform: "perspective(900px) rotateX(4deg)", transformOrigin: "50% 100%" }}>
              <TimelineSheet img={img} paper={paper} />
            </div>
          </div>
        )}
        {pieces}
        {/* the reel, rising out of the same slot */}
        {t >= b.how && (
          <div style={{ position: "absolute", inset: 0, clipPath: clip }}>
            <Phone video={src("U-master.mp4")} fps={fps} fromMs={2000} startSec={d.startSec ?? 0.5}
              style={{ left: PH.x, top: phoneTop, transformOrigin: "50% 0%", transform: `scale(${PH.s})` }} />
            <div style={{ position: "absolute", left: SCR.x, top: phoneTop + 9 * PH.s, width: SCR.w, height: SCR.h, borderRadius: SCR.r, overflow: "hidden" }}>
              <CapStack w={SCR.w} h={SCR.h} p={capP} />
            </div>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, top: DY, width: 1080, height: 614 }}>
          <Shredder t={t} b={bm} part="front" />
          <div style={machineWrap(t, bm)}>
            <Panel t={t} b={b} mark={src("U-claude.png")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const NOLINE_KINDS = { "kf-u-noline": Noline };
export const NOLINE_ASSETS = ["U-paper.png", "U-claude.png", "U-master.mp4", ...TIMELINE_ASSETS];
