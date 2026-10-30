import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PAPER, PHONE, PH_TOP, PS, Print, beatsW, title } from "./W-util";
// W1 "Accordion" (builder W, 2026-09-25). A long paper concertina printed with 18 frames of this raw take in order
// (empty chair, walking in, talking, eyes-down pauses, walking out, empty chair). After NOW it sets down half closed;
// AND pulls it open across the frame; EXACTLY folds the five dead pairs shut, backwards, out of sight; HOW squeezes
// the rest like a heavy bellows into one block (thud); on GOT the block turns face on, stands up and grows into their
// phone playing the finished reel, landed ~2480 and held under a slow push. Clean exit at 2997.

export const N = 18, PW = 196, PH = 334, MG = 9, CY = 280, PERSP = 1500;
export const DEAD = new Set([0, 1, 4, 5, 8, 9, 12, 13, 16, 17]);    // pairs, each starting on an even page: they fold away
export const PAGES = Array.from({ length: N }, (_, i) => `W-acc-${String(i).padStart(2, "0")}.jpg`);
export const ACCORDION_ASSETS = [...PAGES, "W-reel.jpg", "kf-finished-reel.mp4"];
export const TH0 = 76, TH1 = 31, TH_END = 88;                       // fold half-angles: set down, stretched, closed
const LX = -0.55, LY = -0.35, LZ = 0.76;                      // key light from the upper left, in front
export const TILT = -6;                                              // camera a little above: tops lean toward us
const lit = (s: number, th: number) => {
  const a = (s * th * Math.PI) / 180;
  return 0.4 + 0.64 * Math.max(0, LX * Math.sin(a) + LZ * Math.cos(a));
};

type Edge = "free" | "peak" | "valley";
const Crease: React.FC<{ side: "l" | "r"; kind: Edge; k: number }> = ({ side, kind, k }) => {
  if (kind === "free" || k < 0.02) return null;
  const dir = side === "l" ? "90deg" : "270deg";
  const bg = kind === "valley"
    ? `linear-gradient(${dir}, rgba(20,14,8,${0.55 * k}) 0%, rgba(20,14,8,${0.18 * k}) 10%, rgba(20,14,8,0) 32%)`
    : `linear-gradient(${dir}, rgba(255,255,255,${0.75 * k}) 0px, rgba(255,255,255,${0.2 * k}) 2px, rgba(255,255,255,0) 5px)`;
  return <div style={{ position: "absolute", inset: 0, background: bg }} />;
};

export const Panel: React.FC<{ i: number; x: number; z: number; th: number; src: string; op: number; last: boolean; ghost?: boolean }> = (
  { i, x, z, th, src, op, last, ghost },
) => {
  const s = i % 2 === 0 ? 1 : -1;
  const k = Math.sin((th * Math.PI) / 180);
  const L = lit(s, th);
  const left: Edge = i === 0 ? "free" : s > 0 ? "peak" : "valley";
  const right: Edge = last ? "free" : s > 0 ? "valley" : "peak";
  const base: React.CSSProperties = { position: "absolute", left: x, top: CY - PH / 2, width: PW, height: PH, opacity: op,
    transformOrigin: "0 50%", transform: `translateZ(${z.toFixed(2)}px) rotateY(${(s * th).toFixed(3)}deg)` };
  if (ghost) return <div style={{ ...base, background: "#000" }} />;
  // the print's gloss slides across as the page turns to the light
  const sheen = 50 + s * (th - 45) * 1.4;
  return (
    <div style={{ ...base, background: PAPER }}>
      <Img src={src} style={{ position: "absolute", left: MG, top: MG, width: PW - 2 * MG, height: PH - 2 * MG, objectFit: "cover" }} />
      <div style={{ position: "absolute", left: MG, top: MG, width: PW - 2 * MG, height: PH - 2 * MG,
        background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen - 22}%, rgba(255,255,255,0.16) ${sheen}%, rgba(255,255,255,0) ${sheen + 22}%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(1 - Math.min(1, L)).toFixed(3)})` }} />
      <Crease side="l" kind={left} k={k} />
      <Crease side="r" kind={right} k={k} />
    </div>
  );
};

// the zigzag: page i starts where page i-1 ends; even pages recede to the right, odd ones come back
const layout = (thL: number, thD: number) => {
  const xs: number[] = [], zs: number[] = [], ths: number[] = [];
  let x = 0, z = 0;
  for (let i = 0; i < N; i++) {
    const th = DEAD.has(i) ? thD : thL, a = (th * Math.PI) / 180;
    xs.push(x); zs.push(z); ths.push(th);
    x += PW * Math.cos(a);
    z += (i % 2 === 0 ? -1 : 1) * PW * Math.sin(a);
  }
  return { xs, zs, ths, width: x };
};

// the closed block: its left side (the page edges) faces us at turn 0, the finished print at turn 1
export const Block: React.FC<{ u: number; m: number; cy: number; z: number; tilt: number; src: string; sc: number }> = ({ u, m, cy, z, tilt, src, sc }) => {
  const fw = mix(PW, PHONE.w, m) * sc, fh = mix(PH, PHONE.h, m) * sc, T = mix(8 * PW * Math.cos((TH_END * Math.PI) / 180), 7, m) * sc;
  const ry = 90 * (1 - u);
  const pitch = T / 8;
  const face = (w: number, h: number, tr: string, bg: string, key: string) => (
    <div key={key} style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, background: bg, transform: tr, backfaceVisibility: "hidden" }} />
  );
  // the closed pack's edge: eight folds, each a lit ridge and a shaded valley, darker toward the back
  const edges = `linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.3)), repeating-linear-gradient(90deg, #f1ede5 0px, #e2ddd2 ${pitch * 0.45}px, #b3ac9f ${pitch * 0.8}px, #f1ede5 ${pitch}px)`;
  const metal = "linear-gradient(90deg, #1b1b1e, #4a4a50 45%, #1b1b1e)";
  return (
    <div style={{ position: "absolute", left: 540, top: cy, width: 0, height: 0, transformStyle: "preserve-3d",
      transform: `translateZ(${z.toFixed(2)}px) rotateX(${tilt.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)` }}>
      {face(T, fh, `rotateY(-90deg) translateZ(${fw / 2}px)`, m > 0.5 ? metal : edges, "l")}
      {face(fw, T, `rotateX(90deg) translateZ(${fh / 2}px)`, m > 0.5 ? "#2a2a2e" : "linear-gradient(90deg, #f4f0e8, #cfc9bd)", "t")}
      <div style={{ position: "absolute", left: -fw / 2, top: -fh / 2, width: fw, height: fh, transform: `translateZ(${T / 2}px)`, backfaceVisibility: "hidden" }}>
        <Print w={fw} h={fh} mg={MG * sc} m={m} src={src} light={mix(0.78, 1, u)} />
      </div>
    </div>
  );
};

export const Accordion: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsW(beats);
  if (t < b.now) return <>{title(props, b.now)}</>;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));

  // --- the clock
  const setDown = easeOut3(win(t, b.now, b.now + 280));
  const stretch = easeOut3(win(t, b.and, b.and + 380));
  const drift = easeInOut(win(t, b.and + 380, b.exactly));
  const deadClose = easeInOut(win(t, b.exactly, b.exactly + 190));
  const squeezeEnd = b.how + 215;
  const squeeze = easeIn2(win(t, b.how, squeezeEnd));
  const thud = t > squeezeEnd ? Math.sin(Math.PI * win(t, squeezeEnd, squeezeEnd + 150)) * Math.exp(-(t - squeezeEnd) / 120) : 0;
  const thOpen = mix(mix(TH0, TH1 + 1.5, stretch), TH1, drift);
  const thL = mix(thOpen, TH_END, squeeze) - 3 * thud;
  const thD = mix(thOpen, 90, deadClose);
  const turn0 = b.got - 110, land = b.got + 125;
  const turn = easeInOut(win(t, turn0, land));
  const morph = easeInOut(win(t, turn0 + 60, land));
  const push = 1 + 0.025 * easeInOut(win(t, land, toMs));
  const out = easeIn2(win(t, toMs - 140, toMs));

  const { xs, zs, ths, width } = layout(thL, thD);
  const wPrev = (() => { const tp = t - 1000 / fps / 2; const sq = easeIn2(win(tp, b.how, squeezeEnd));
    const dc = easeInOut(win(tp, b.exactly, b.exactly + 190)); const st = easeOut3(win(tp, b.and, b.and + 380));
    const op = mix(mix(TH0, TH1 + 1.5, st), TH1, easeInOut(win(tp, b.and + 380, b.exactly)));
    return layout(mix(op, TH_END, sq), mix(op, 90, dc)).width; })();
  const mblur = t > b.how ? Math.min(2.5, Math.abs(width - wPrev) / 60) : 0;
  // AND pulls it out from the left end (the empty chair in view), the close brings it back to the centre
  const x0 = Math.max(540 - width / 2, 36);
  const dy = mix(-70, 0, setDown) + 4 * thud;
  const setScale = mix(0.95, 1, setDown);
  const blockOn = t >= squeezeEnd;
  const tilt = mix(TILT, 0, turn);

  const panels = (ghost: boolean) => PAGES.map((p, i) => {
    const dead = DEAD.has(i);
    const op = dead ? 1 - win(thD, 80, 89) : 1;
    if (op <= 0) return null;
    return <Panel key={i} i={i} x={x0 + xs[i]!} z={zs[i]!} th={ths[i]!} src={src(p)} op={op} last={i === N - 1} ghost={ghost} />;
  });
  const group = (ghost: boolean) => (
    <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `540px ${CY - 40}px` }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `540px ${CY}px`,
        transform: `translateY(${dy}px) scale(${setScale}) rotateX(${TILT}deg)` }}>{panels(ghost)}</div>
    </div>
  );
  // block: from the closed concertina (centre 540, depth centre -PW/2) to the phone (centre PHONE.cy, z 0)
  const sc = 1;
  const cy = mix(CY + dy, PHONE.cy, turn) - 26 * Math.sin(Math.PI * turn);
  const bz = mix(-PW / 2, 0, turn) + 60 * Math.sin(Math.PI * turn);
  const phoneOn = t >= land;
  const shadowOp = 0.42 * (1 - 0.5 * morph);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${w / 1080})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${PHONE.cy}px`, transform: `scale(${push})` }}>
        {!blockOn && (
          <>
            <div style={{ position: "absolute", inset: 0, opacity: shadowOp, filter: "blur(13px)", transform: "translate(16px, 30px)" }}>{group(true)}</div>
            <div style={{ position: "absolute", inset: 0, filter: mblur > 0.4 ? `blur(${mblur.toFixed(2)}px)` : undefined }}>{group(false)}</div>
          </>
        )}
        {blockOn && !phoneOn && (
          <>
            <div style={{ position: "absolute", left: 540 - mix(24, PHONE.w / 2, turn) + 14, top: cy - mix(PH, PHONE.h, morph) / 2 + 28,
              width: mix(48, PHONE.w, turn), height: mix(PH, PHONE.h, morph), background: "#000", opacity: shadowOp, filter: "blur(16px)" }} />
            <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `540px ${CY - 40}px` }}>
              <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
                <Block u={turn} m={morph} cy={cy} z={bz} tilt={tilt} src={src("W-reel.jpg")} sc={sc} />
              </div>
            </div>
          </>
        )}
        {phoneOn && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={land} startSec={d.startSec ?? 0.92}
            style={{ left: 540 - 146, top: PH_TOP, transformOrigin: "50% 0%", transform: `scale(${PS})` }} />
        )}
      </div>
    </div>
  );
};
