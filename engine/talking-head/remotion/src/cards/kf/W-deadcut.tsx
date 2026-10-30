import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { MONO, clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { Block, DEAD, N, PAGES, PH, PW, CY, PERSP, Panel, TH0, TH1, TH_END, TILT } from "./W-accordion";
import { PAPER, PHONE, PH_TOP, PS, beatsW, title } from "./W-util";
// W3 "Claude cuts every dead second" (builder W, round 2, 2026-09-25). The W1 paper concertina of this raw take, with
// Claude doing the edit: the real Claude mark rides the top edge of the paper like a rotary cutter head, a paper tab
// under it printing the running length in mono. The paper feeds under it; on AND, IT'S, then two beats to EXACTLY and
// just after, the head stops on each dead pair (empty chair + walking in, eyes down x3, walking out + empty chair),
// presses, an orange crease runs down the fold and the pair snaps shut backwards; the counter drops 1:29 -> 0:43
// (raw 88.9 s -> cut 42.9 s). HOW squeezes what is left into one block; on GOT it stands up as their phone playing the
// finished reel, landed ~2460 and held. Clean exit at 2997.

export const DEADCUT_ASSETS = [...PAGES, "W-reel.jpg", "W-claude.png", "kf-finished-reel.mp4"];
const RAW_S = 88.9, CUT_S = 42.9;
const PAIRS = [0, 4, 8, 12, 16];                  // first page of each dead pair
const clock = (s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

// per-page fold angles -> zigzag geometry
const layoutA = (th: (i: number) => number) => {
  const xs: number[] = [], zs: number[] = [], ths: number[] = [];
  let x = 0, z = 0;
  for (let i = 0; i < N; i++) {
    const a = th(i), r = (a * Math.PI) / 180;
    xs.push(x); zs.push(z); ths.push(a);
    x += PW * Math.cos(r);
    z += (i % 2 === 0 ? -1 : 1) * PW * Math.sin(r);
  }
  return { xs, zs, ths, width: x };
};
// strip x at a fractional page index
const xAt = (L: { xs: number[]; ths: number[]; width: number }, h: number) => {
  if (h <= 0) return h * PW * Math.cos((L.ths[0]! * Math.PI) / 180);
  if (h >= N) return L.width;
  const i = Math.floor(h);
  return L.xs[i]! + (h - i) * PW * Math.cos((L.ths[i]! * Math.PI) / 180);
};

export const DeadCut: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsW(beats);
  if (t < b.now) return <>{title(props, b.now)}</>;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));

  // the head's stops: one per dead pair
  const CUTS = [b.and, b.its, (b.its + b.exactly) / 2, b.exactly, b.how - 30];
  const KEYS: [number, number][] = [[b.now, -0.9], ...CUTS.map((c, p) => [c, PAIRS[p]! + 1] as [number, number])];
  const hOf = (x: number) => {
    if (x <= KEYS[0]![0]) return KEYS[0]![1];
    for (let k = 1; k < KEYS.length; k++) {
      const [t1, h1] = KEYS[k]!, [t0, h0] = KEYS[k - 1]!;
      if (x <= t1) return mix(h0, h1, k === 1 ? easeOut3(win(x, t0, t1)) : easeInOut(win(x, t0, t1)));
    }
    return KEYS[KEYS.length - 1]![1];
  };
  const foldOf = (p: number, x: number) => easeIn2(win(x, CUTS[p]! - 15, CUTS[p]! + 105));
  const open = easeOut3(win(t, b.now, b.and - 40));
  const squeezeEnd = b.how + 215;
  const squeeze = easeIn2(win(t, b.how + 40, squeezeEnd));
  const thud = t > squeezeEnd ? Math.sin(Math.PI * win(t, squeezeEnd, squeezeEnd + 150)) * Math.exp(-(t - squeezeEnd) / 120) : 0;
  const thLive = mix(mix(TH0, TH1, open), TH_END, squeeze) - 3 * thud;
  const th = (i: number) => {
    if (!DEAD.has(i)) return thLive;
    const p = PAIRS.indexOf(i - (i % 2 === 0 ? 0 : 1));
    return mix(thLive, 90, foldOf(p, t));
  };
  const L = layoutA(th);
  const h = hOf(t);
  const hx = mix(300, 790, easeInOut(win(t, b.and, b.how)));
  const center = easeInOut(win(t, b.how, squeezeEnd));
  const x0 = mix(hx - xAt(L, h), 540 - L.width / 2, center);
  const dy = mix(-40, 0, open) + 4 * thud;

  const turn0 = b.got - 130, land = b.got + 105;
  const turn = easeInOut(win(t, turn0, land));
  const morph = easeInOut(win(t, turn0 + 60, land));
  const push = 1 + 0.025 * easeInOut(win(t, land, toMs));
  const out = easeIn2(win(t, toMs - 140, toMs));
  const blockOn = t >= squeezeEnd, phoneOn = t >= land;

  // the head: rolls along the top edge, presses on each cut, leaves on HOW
  const press = CUTS.reduce((m, c) => Math.max(m, Math.sin(Math.PI * clamp((t - c + 40) / 150))), 0);
  const headOut = easeIn2(win(t, b.how - 10, b.how + 170));
  const headY = CY - PH / 2 - 10 + dy + 16 * press - 260 * headOut;
  const spin = -h * 150;
  const cutsDone = CUTS.reduce((s, _, p) => s + foldOf(p, t), 0);
  const secs = mix(RAW_S, CUT_S, cutsDone / CUTS.length);
  const crease = CUTS.reduce((m, c) => Math.max(m, clamp(1 - Math.abs(t - c - 30) / 90)), 0);

  const panels = (ghost: boolean) => PAGES.map((pg, i) => {
    const op = DEAD.has(i) ? 1 - win(L.ths[i]!, 80, 89) : 1;
    if (op <= 0) return null;
    const x = x0 + L.xs[i]!;
    if (x > 1300 || x < -400) return null;
    return <Panel key={i} i={i} x={x} z={L.zs[i]!} th={L.ths[i]!} src={src(pg)} op={op} last={i === N - 1} ghost={ghost} />;
  });
  const group = (ghost: boolean) => (
    <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `540px ${CY - 40}px` }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `540px ${CY}px`,
        transform: `translateY(${dy}px) rotateX(${TILT}deg)` }}>{panels(ghost)}</div>
    </div>
  );
  const cy = mix(CY + dy, PHONE.cy, turn) - 26 * Math.sin(Math.PI * turn);
  const bz = mix(-PW / 2, 0, turn) + 60 * Math.sin(Math.PI * turn);
  const shadowOp = 0.42 * (1 - 0.5 * morph);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${w / 1080})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${PHONE.cy}px`, transform: `scale(${push})` }}>
        {!blockOn && (
          <>
            <div style={{ position: "absolute", inset: 0, opacity: 0.42, filter: "blur(13px)", transform: "translate(16px, 30px)" }}>{group(true)}</div>
            {group(false)}
            {/* the crease Claude just pressed: an orange line down the fold under the head */}
            <div style={{ position: "absolute", left: hx - 1.5, top: CY - PH / 2 + dy + 4, width: 3, height: PH - 8, background: "#D97757",
              opacity: crease * (1 - headOut), boxShadow: "0 0 10px rgba(217,119,87,0.8)" }} />
          </>
        )}
        {headOut < 1 && !blockOn && (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - headOut }}>
            {/* the head's steel arm down the paper, to the counter tab */}
            <div style={{ position: "absolute", left: hx - 3, top: headY + 40, width: 6, height: PH - 30 - 16 * press,
              background: "linear-gradient(90deg, #6d7076, #e9ebee 45%, #8a8d93 60%, #4a4c51)", boxShadow: "3px 4px 6px rgba(0,0,0,0.35)" }} />
            {/* the counter tab: paper, the running length printed in mono */}
            <div style={{ position: "absolute", left: hx - 58, top: CY + PH / 2 + dy + 8, width: 116, height: 50, background: PAPER,
              boxShadow: "0 6px 14px rgba(0,0,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: MONO, fontWeight: 700, fontSize: 32, color: "#231f1b", letterSpacing: 0.5,
              transform: `translateY(${-260 * headOut}px)` }}>{clock(secs)}</div>
            {/* Claude, the cutter head */}
            <div style={{ position: "absolute", left: hx - 62, top: headY - 62, width: 124, height: 124,
              filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.45)) drop-shadow(0 2px 2px rgba(0,0,0,0.4))" }}>
              <Img src={src("W-claude.png")} style={{ width: 124, height: 124, transform: `rotate(${spin}deg)` }} />
            </div>
          </div>
        )}
        {blockOn && !phoneOn && (
          <>
            <div style={{ position: "absolute", left: 540 - mix(24, PHONE.w / 2, turn) + 14, top: cy - mix(PH, PHONE.h, morph) / 2 + 28,
              width: mix(48, PHONE.w, turn), height: mix(PH, PHONE.h, morph), background: "#000", opacity: shadowOp, filter: "blur(16px)" }} />
            <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `540px ${CY - 40}px` }}>
              <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
                <Block u={turn} m={morph} cy={cy} z={bz} tilt={mix(TILT, 0, turn)} src={src("W-reel.jpg")} sc={1} />
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
