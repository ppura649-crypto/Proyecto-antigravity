import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PAPER, PHONE, PH_TOP, PS, Print, beatsW, title } from "./W-util";
// W2 "Flipbook" (builder W, 2026-09-25). A thick paper flipbook, left margin held in a black binder clip, lying tilted
// toward us. Its pages are 25 consecutive frames of this raw take (4.2 s -> 7.0 s: the creator walks in, sits, lifts the mic,
// starts talking). After NOW it drops in and lands on AND, an unseen thumb holding the page bunch up at the clip. On
// EXACTLY the pages riffle down one by one (each bends as it falls, sub-frame motion blur on the fast ones), animating
// them; the riffle slows on HOW; the last page lands on GOT: their finished captioned reel at the same instant. It then
// lifts off the book, stands up and becomes their phone playing the reel, landed ~2480 and held. Clean exit at 2997.

const NP = 24;                                        // raw pages W-fb-00..23; the reel is the 25th
const FB = Array.from({ length: NP }, (_, i) => `W-fb-${String(i).padStart(2, "0")}.jpg`);
export const FLIPBOOK_ASSETS = [...FB, "W-reel.jpg", "kf-finished-reel.mp4"];
const PR = 236, PH = 404, MG = 10, CLAMP = 50, PW = PR + CLAMP, TK = 30;   // leaf, page, clamp strip, book thickness
const K = 4, SW = PR / K;                             // a leaf bends as 4 hinged strips
const BX = 540 - CLAMP / 2, BY = 330, TILT = 38, RZ = -3, PERSP = 1400, PO = "540px 60px";
const PHI_UP = 88;                                   // the bunch, held just past upright by the thumb
// page k (0 = W-fb-01 ... NP-2 = W-fb-23, NP-1 = the reel) starts to fall at START[k]; gaps grow 8% a page, the reel starts at +300 ("I") and lands on GOT
const FALLS = NP;                                     // 23 raw pages + the reel
const START: number[] = (() => {
  const r = 1.08, n = FALLS - 1, span = 300, a = (span * (r - 1)) / (Math.pow(r, n) - 1);
  const out = [0]; for (let k = 1; k <= n; k++) out.push(out[k - 1]! + a * Math.pow(r, k - 1));
  return out;
})();
const srcOf = (k: number) => (k < FALLS - 1 ? FB[k + 1]! : "W-reel.jpg");

const bright = (a: number, back: boolean) => {
  const r = (a * Math.PI) / 180, s = back ? -1 : 1;
  const dot = Math.max(0, s * (-0.35 * Math.sin(r) + 0.82 * Math.cos(r)));
  return back ? 0.74 + 0.3 * dot : 0.46 + 0.58 * dot;               // the backs are bare paper, bounce-lit
};
const shade = (v: number) => <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${clamp(1 - v).toFixed(3)})` }} />;

// the leaf content: paper, the frame printed with a margin
const LeafFace: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PR, height: PH, background: PAPER }}>
    <Img src={src} style={{ position: "absolute", left: MG, top: MG, width: PR - 2 * MG, height: PH - 2 * MG, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: MG, top: MG, width: PR - 2 * MG, height: PH - 2 * MG,
      background: "linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 40%)" }} />
  </div>
);

// one leaf hinged at the clip jaw, lifted phi degrees, its free end bent by `curl` degrees per strip
const Leaf: React.FC<{ phi: number; curl: number; src: string; op?: number; z?: number }> = ({ phi, curl, src, op = 1, z = 0.6 }) => {
  const strip = (j: number): React.ReactNode => {
    const a = phi + j * curl;
    return (
      <div style={{ position: "absolute", left: j === 0 ? 0 : SW, top: 0, width: SW, height: PH, transformStyle: "preserve-3d",
        transformOrigin: "0 50%", transform: j === 0 ? undefined : `rotateY(${(-curl).toFixed(3)}deg)` }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", backfaceVisibility: "hidden" }}>
          <div style={{ position: "absolute", left: -j * SW, top: 0 }}><LeafFace src={src} /></div>
          {shade(bright(a, false))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "#ece7dd", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {shade(bright(a, true))}
        </div>
        {j < K - 1 && strip(j + 1)}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: -PW / 2 + CLAMP, top: -PH / 2, width: SW, height: PH, transformStyle: "preserve-3d",
      transformOrigin: "0 50%", opacity: op, transform: `translateZ(${z}px) rotateY(${(-phi).toFixed(3)}deg)` }}>
      {strip(0)}
    </div>
  );
};

// page k's lift angle and bend at time t (null once it has landed, PHI_UP while still held)
const DUR = (k: number) => (k === FALLS - 1 ? 180 : mix(62, 125, Math.pow(k / (FALLS - 2), 2)));
const fallAt = (k: number, t: number, t0: number) => {
  const s = t0 + START[k]!, u = (t - s) / DUR(k);
  if (u <= 0) return { phi: PHI_UP, curl: -3.5, state: "held" as const };
  if (u >= 1) return { phi: 0, curl: 0, state: "down" as const };
  const f = k === FALLS - 1 ? easeInOut(u) : easeIn2(u);
  return { phi: PHI_UP * (1 - f), curl: mix(-3.5, 9, Math.sin(Math.PI * u)), state: "fall" as const };
};

const Clip: React.FC = () => {
  const x0 = -PW / 2 - 12, w = CLAMP + 8, h = 170, top = 18;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d" }}>
      {/* contact shadow on the paper */}
      <div style={{ position: "absolute", left: x0 + 6, top: -h / 2 + 8, width: w + 10, height: h + 6, background: "rgba(0,0,0,0.45)",
        filter: "blur(7px)", transform: "translateZ(0.8px)" }} />
      {/* the steel body: top plate, front and right lips */}
      <div style={{ position: "absolute", left: x0, top: -h / 2, width: w, height: h, transform: `translateZ(${top}px)`,
        background: "linear-gradient(90deg, #0b0b0d 0%, #1d1d21 30%, #5a5b61 47%, #1c1c20 58%, #0e0e10 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", left: x0, top: h / 2, width: w, height: top, transformOrigin: "50% 0", transform: `translateZ(${top}px) rotateX(-90deg)`,
        background: "linear-gradient(180deg, #26262a, #09090a)" }} />
      <div style={{ position: "absolute", left: x0 + w, top: -h / 2, width: top, height: h, transformOrigin: "0 50%", transform: `translateZ(${top}px) rotateY(90deg)`,
        background: "linear-gradient(90deg, #3a3a40, #0c0c0e)" }} />
      {/* the two wire handles folded flat to the left */}
      {[0, 1].map((i) => (
        <div key={i} style={{ position: "absolute", left: x0 - 44 + i * 4, top: -h / 2 + 30 + i * 7, width: 52, height: h - 60 - i * 14,
          border: "3.5px solid #cfd2d7", borderRight: "none", borderRadius: "16px 0 0 16px", transform: `translateZ(${top + 1 + i * 2}px)`,
          boxShadow: "1px 2px 2px rgba(0,0,0,0.5)" }} />
      ))}
    </div>
  );
};

export const Flipbook: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsW(beats);
  if (t < b.now) return <>{title(props, b.now)}</>;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));

  // --- the drop, landing on AND
  const fall = easeIn2(win(t, b.now, b.and));
  const sinceLand = t - b.and;
  const bump = sinceLand > 0 ? Math.sin(Math.PI * clamp(sinceLand / 170)) * Math.exp(-sinceLand / 140) : 0;
  const by = mix(-250, 0, fall), bz = mix(230, 0, fall), rx = mix(TILT - 14, TILT, fall) + 1.5 * bump;
  // --- the riffle
  const t0 = b.exactly;
  const last = FALLS - 1, landReel = t0 + START[last]! + DUR(last);
  const lift0 = Math.max(landReel + 20, b.got), land = lift0 + 125;
  const lift = easeInOut(win(t, lift0, land));
  const morph = easeInOut(win(t, lift0 + 30, land));
  const bookOut = easeIn2(win(t, lift0, lift0 + 160));
  const push = 1 + 0.025 * easeInOut(win(t, land, toMs));
  const out = easeIn2(win(t, toMs - 140, toMs));

  // the pile's top page, the leaves in the air (with sub-frame samples when fast), the held bunch
  let topSrc = FB[0]!;
  const air: React.ReactNode[] = [];
  let held = 0;
  const shutter = 500 / fps;
  for (let k = 0; k < FALLS; k++) {
    const st = fallAt(k, t, t0);
    if (st.state === "down") { if (!(k === last && t >= lift0)) topSrc = srcOf(k); continue; }
    if (st.state === "held") { held++; continue; }
    const prev = fallAt(k, t - shutter, t0);
    const speed = Math.abs(prev.phi - st.phi);
    const n = speed > 30 ? 3 : speed > 12 ? 2 : 1;
    for (let q = 0; q < n; q++) {
      const s = q === 0 ? st : fallAt(k, t - (shutter * q) / (n - 1 || 1), t0);
      if (s.state !== "fall") continue;
      air.push(<Leaf key={`${k}-${q}`} phi={s.phi} curl={s.curl} src={src(srcOf(k))} op={q === 0 ? 1 : 0.32 / q} z={0.6 + k * 0.05} />);
    }
  }
  const bunch: React.ReactNode[] = [];
  const firstHeld = FALLS - held;
  for (let j = Math.min(held, 6) - 1; j >= 0; j--) {
    const k = firstHeld + j;
    bunch.push(<Leaf key={`h${k}`} phi={PHI_UP + j * 2} curl={-3.5 - j * 0.4} src={src(srcOf(k))} z={0.6 + k * 0.05} />);
  }
  const thumbX = -PW / 2 + CLAMP + 70, thumbOp = held > 0 ? 0.26 : 0.26 * (1 - win(t, landReel - 120, landReel));

  const book = (
    <div style={{ position: "absolute", left: BX, top: BY, width: 0, height: 0, transformStyle: "preserve-3d",
      transform: `translate3d(0, ${by + 5 * bump}px, ${bz}px) rotateX(${rx}deg) rotateZ(${RZ}deg)` }}>
      {/* page-edge sides */}
      <div style={{ position: "absolute", left: -PW / 2, top: PH / 2, width: PW, height: TK, transformOrigin: "50% 0", transform: "rotateX(-90deg)",
        background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3)), repeating-linear-gradient(180deg, #f1ede5 0px, #f1ede5 1.5px, #bfb7a8 1.5px, #bfb7a8 2.5px)" }} />
      <div style={{ position: "absolute", left: PW / 2, top: -PH / 2, width: TK, height: PH, transformOrigin: "0 50%", transform: "rotateY(90deg)",
        background: "linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.4)), repeating-linear-gradient(90deg, #f1ede5 0px, #f1ede5 1.5px, #bfb7a8 1.5px, #bfb7a8 2.5px)" }} />
      {/* the pile's top page */}
      <div style={{ position: "absolute", left: -PW / 2, top: -PH / 2, width: PW, height: PH, background: PAPER }}>
        <div style={{ position: "absolute", left: CLAMP, top: 0 }}><LeafFace src={src(topSrc)} /></div>
        {shade(bright(0, false))}
        <div style={{ position: "absolute", left: CLAMP - 1, top: 0, width: 3, height: PH, background: "linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: thumbX - 60, top: 30, width: 150, height: 90, borderRadius: "50%", background: "#000",
          opacity: thumbOp, filter: "blur(16px)", transform: "rotate(-18deg)" }} />
      </div>
      <Clip />
      {bunch}
      {air}
    </div>
  );
  // the reel page lifting off: from its place on the pile to the phone, in one move
  const lx = mix(BX, 540, lift), ly = mix(BY, PHONE.cy, lift) - 30 * Math.sin(Math.PI * lift);
  const lz = 90 * Math.sin(Math.PI * lift);
  const ox = mix(-PW / 2 + CLAMP + PR / 2, 0, lift);
  const lw = mix(PR, PHONE.w, morph), lh = mix(PH, PHONE.h, morph);
  const phoneOn = t >= land;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${w / 1080})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${PHONE.cy}px`, transform: `scale(${push})` }}>
        {/* the book's cast shadow, on the plane it lands on */}
        <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: PO, opacity: 1 - bookOut }}>
          <div style={{ position: "absolute", left: BX - PW / 2 - 10 + 18, top: BY - PH / 2 + 30, width: PW + 30, height: PH + 20, background: "#000",
            opacity: mix(0.12, 0.5, fall), filter: `blur(${mix(34, 14, fall)}px)`, transformOrigin: `${PW / 2 + 10}px ${PH / 2}px`,
            transform: `translateZ(${-TK}px) rotateX(${TILT}deg) rotateZ(${RZ}deg)` }} />
        </div>
        <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: PO, opacity: 1 - bookOut,
          transform: `translateY(${40 * bookOut}px)` }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>{book}</div>
        </div>
        {t >= lift0 && !phoneOn && (
          <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: PO }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d",
              transform: `translate3d(${lx}px, ${ly}px, ${lz}px) rotateX(${mix(TILT, 0, lift)}deg) rotateZ(${mix(RZ, 0, lift)}deg) translate3d(${ox}px, 0, 1px)` }}>
              <div style={{ position: "absolute", left: -lw / 2 + 10, top: -lh / 2 + 26, width: lw, height: lh, background: "#000",
                opacity: 0.45 * lift, filter: "blur(18px)", transform: `translateZ(${-lz}px)` }} />
              <Print w={lw} h={lh} mg={MG} m={morph} src={src("W-reel.jpg")} style={{ left: -lw / 2, top: -lh / 2 }} />
            </div>
          </div>
        )}
        {phoneOn && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={land} startSec={d.startSec ?? 0.92}
            style={{ left: 540 - 146, top: PH_TOP, transformOrigin: "50% 0%", transform: `scale(${PS})` }} />
        )}
      </div>
    </div>
  );
};
