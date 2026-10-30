import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, SCREEN, Title, yBeats } from "./Y-kit";
import { GlassBack, GlassFront, Print, fadeBelow, steel } from "./Y-hopper";
import { HOP, SIM_MS, makeSim } from "./Y-sim";
// keyframes-v1 hook Y3 "Machine" (builder Y, round 2, 2026-09-25). Title "Raw footage in, / finished reel out".
// Then the Y2 hopper becomes Claude's editing machine: the real Claude mark sits in a round steel turbine housing
// under the funnel. AND: prints of their raw clips pour in (Y-sim, deterministic). EXACTLY: the turbine spins up, the
// dead prints (empty chair, walking in, eyes-down pauses; drawn with a grey cast) get an orange score line and are
// ejected one by one out of a side chute and fall away; the rest swirl down into the turbine. GOT: the camera tilts
// down with the one finished reel as it drops out of the nozzle into the phone, landed ~2470, held.

const { cx, rimY, rimW, neckY, neckW } = HOP;
const PAN = 640, TUR = { y: 452, r: 64 }, NOZ = 548;
const LIVE_R = ["00", "02", "04", "06", "07", "09", "10", "11", "14", "15", "16", "20", "21"].map((n) => `R-roll-${n}.jpg`);
const LIVE_L = ["00", "03", "05", "08", "11"].map((n) => `L-f${n}.jpg`);
const DEAD = ["L-f01.jpg", "L-f02.jpg", "L-f04.jpg", "L-f06.jpg", "L-f07.jpg"];
const IMGS: string[] = [...LIVE_R, ...LIVE_L];
[3, 8, 12, 16, 20].forEach((at, k) => IMGS.splice(at, 0, DEAD[k]!));
const SIM = makeSim(IMGS);
export const MACHINE_ASSETS = [...new Set(IMGS), "Y-claude.png", "Y-fin.jpg", "kf-finished-reel.mp4"];
const CLIP = `polygon(0px -600px, 1080px -600px, 1080px ${rimY}px, ${cx + rimW}px ${rimY}px, ${cx + neckW}px ${neckY}px, ${cx + neckW}px 480px, ${cx - neckW}px 480px, ${cx - neckW}px ${neckY}px, ${cx - rimW}px ${rimY}px, 0px ${rimY}px)`;
const coneHalf = (y: number) => mix(rimW, neckW, clamp((y - rimY) / (neckY - rimY)));
// the side chute: mouth in the right wall, a steel trough sloping out and down
const MOUTH = { x: cx + coneHalf(262) - 26, y: 262 };
const CH = { x0: cx + coneHalf(262) - 8, y0: 238, len: 300, deg: 17 };
const CEND = { x: CH.x0 + CH.len * Math.cos((CH.deg * Math.PI) / 180), y: 262 + CH.len * Math.sin((CH.deg * Math.PI) / 180) };

// turbine angle: idle turn, spin-up on EXACTLY, full speed until GOT, spin-down
const omega = (t: number, b: ReturnType<typeof yBeats>) => 50 + 1450 * easeIn2(win(t, b.exactly - 40, b.exactly + 220)) * (1 - easeOut3(win(t, b.got + 60, b.got + 420)));
const spinAt = (t: number, b: ReturnType<typeof yBeats>) => { let a = 0; for (let x = b.now; x < t; x += 10) a += (omega(x, b) * Math.min(10, t - x)) / 1000; return a; };

const Dead: React.FC<{ src: string; x: number; y: number; w: number; h: number; a: number; flag: number; op: number }> = ({ src, x, y, w, h, a, flag, op }) => {
  const rad = (a * Math.PI) / 180, lx = 5 * Math.sin(rad), ly = 5 * Math.cos(rad);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, background: "#e9e6df", padding: 3, boxSizing: "border-box",
      transform: `rotate(${a}deg)`, opacity: op, boxShadow: `${lx.toFixed(1)}px ${ly.toFixed(1)}px 0 #9d9586, ${(lx * 2.6).toFixed(1)}px ${(ly * 2.6).toFixed(1)}px 14px rgba(0,0,0,0.45)` }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(0.6) brightness(0.9) contrast(0.92)" }} />
      <div style={{ position: "absolute", inset: -2, boxShadow: `inset 0 0 0 ${(3.5 * flag).toFixed(2)}px rgba(217,119,87,${flag.toFixed(2)})` }} />
    </div>
  );
};

const Machine: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = yBeats(beats);
  const d = data ?? {};
  if (t < b.now) return <Title {...props} now={b.now} />;
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;

  const enter = easeOut3(win(t, b.now, b.now + 330));
  const lower = mix(-260, 0, enter) + 5 * Math.sin(Math.PI * win(t, b.now + 300, b.now + 460));
  const t0 = b.got - 70, t1 = b.got + 115;
  const panU = win(t, t0, t1);
  const cam = PAN * easeInOut(panU);
  const vblur = 7 * Math.sin(Math.PI * panU);
  const out = easeIn2(win(t, toMs - 140, toMs));
  const push = 1 + 0.025 * easeInOut(win(t, t1 + 60, toMs));
  const landDip = 6 * Math.sin(Math.PI * win(t, t1, t1 + 170));
  const spin = spinAt(t, b), om = omega(t, b);

  const deadIdx = IMGS.map((im, i) => (DEAD.includes(im) ? i : -1)).filter((i) => i >= 0);
  const liveIdx = IMGS.map((_, i) => i).filter((i) => !deadIdx.includes(i));
  const ranks = liveIdx.sort((p, q) => SIM.pour(q, SIM_MS).y - SIM.pour(p, SIM_MS).y);
  const prints: React.ReactNode[] = [];
  const ejected: React.ReactNode[] = [];
  ranks.forEach((i, rank) => {
    const bd = SIM.bodies[i]!, ms = t - b.and;
    if (ms < bd.spawn) return;
    const p = SIM.pour(i, Math.min(ms, SIM_MS));
    let x = p.x, y = p.y, a = p.a, s = 1, sx = 1, dim = 1, z = 100 + i;
    const s0 = b.exactly + 70 + rank * 7, D = 260;
    if (t >= s0) {
      const u = win(t, s0, s0 + D);
      if (u >= 1) return;
      const r0 = p.x - cx, R0 = Math.hypot(r0, 28), psi0 = Math.asin(r0 / R0);
      y = mix(p.y, TUR.y, Math.pow(easeIn2(u), 0.8));
      const R = Math.min(R0 * (1 - 0.85 * easeIn2(u)), coneHalf(y) - 10);
      const psi = psi0 + 2.4 * Math.PI * Math.pow(u, 1.5);
      x = cx + R * Math.sin(psi);
      const zz = (R * Math.cos(psi)) / rimW;
      s = (1 + 0.22 * zz) * mix(1, 0.4, win(y, neckY - 70, TUR.y - 20));
      sx = 0.5 + 0.5 * Math.abs(Math.cos(psi));
      dim = 0.82 + 0.18 * clamp(zz + 0.5);
      a = p.a + 380 * easeIn2(u);
      z = 300 + Math.round(zz * 100);
    }
    prints.push(<Print key={i} src={src(bd.img)} x={x} y={y} w={bd.w} h={bd.h} a={a} s={s} sx={sx} dim={dim} z={z} />);
  });
  deadIdx.forEach((i, kk) => {
    const bd = SIM.bodies[i]!, ms = t - b.and;
    if (ms < bd.spawn) return;
    const p = SIM.pour(i, Math.min(ms, SIM_MS));
    const flag = win(t, b.exactly - 20 + kk * 25, b.exactly + 60 + kk * 25) * (1 - win(t, b.exactly + 200 + kk * 55, b.exactly + 320 + kk * 55));
    const te = b.exactly + 50 + kk * 55;
    if (t < te) { prints.push(<Dead key={i} src={src(bd.img)} x={p.x} y={p.y} w={bd.w} h={bd.h} a={p.a} flag={flag} op={1} />); return; }
    let x: number, y: number, a: number;
    const uA = win(t, te, te + 110), uB = win(t, te + 110, te + 220);
    if (t < te + 110) { const e = easeIn2(uA); x = mix(p.x, MOUTH.x, e); y = mix(p.y, MOUTH.y, e); a = mix(p.a, CH.deg, e); }
    else if (t < te + 220) { const e = easeIn2(uB); x = mix(MOUTH.x, CEND.x, e); y = mix(MOUTH.y, CEND.y, e) - 30 * (1 - e); a = CH.deg + 8 * e; }
    else { const dt = (t - te - 220) / 1000; x = CEND.x + 1150 * dt; y = CEND.y - 30 * 0 + 380 * dt + 0.5 * 3200 * dt * dt; a = CH.deg + 8 + 520 * dt; }
    if (x > 1200) return;
    ejected.push(<Dead key={i} src={src(bd.img)} x={x} y={y} w={bd.w} h={bd.h} a={a} flag={flag} op={1 - win(y, 470, 560)} />);
  });

  const tileU = win(t, t0 + 10, t1);
  const tg = easeOut3(win(t, t0 + 40, t1 - 20));
  const tw = mix(40, SCREEN.w, tg), th = mix((40 * 16) / 9, SCREEN.h, tg);
  const ty = mix(NOZ - 30, SCREEN.y + PAN, easeIn2(tileU));
  const ghosts = om > 400 ? [0, -9, -18] : [0];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: out > 0 ? 1 - out : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>{steel("ymt1")}{steel("ymt2", false, 0.4)}</defs>
        <filter id="ymvb" x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation={`0 ${vblur.toFixed(2)}`} /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-cam}px)`, filter: vblur > 0.4 ? "url(#ymvb)" : undefined }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${lower}px)`, opacity: win(t, b.now, b.now + 70) * (1 - win(t, t1 - 100, t1 - 10)) }}>
          <GlassBack />
          <div style={{ position: "absolute", inset: 0, clipPath: CLIP }}>{prints}</div>
          {/* the side chute: a steel trough out of a slot in the right wall */}
          <div style={{ position: "absolute", left: CH.x0, top: CH.y0, width: CH.len, height: 52, transformOrigin: "0 24px", transform: `rotate(${CH.deg}deg)`,
            background: "linear-gradient(180deg, #cfd4d9 0%, #8b9197 18%, #3b3f44 60%, #6c7278 88%, #2a2d31 100%)", boxShadow: "0 14px 22px rgba(0,0,0,0.35)" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "rgba(255,255,255,0.8)" }} />
          </div>
          <GlassFront />
          <div style={{ position: "absolute", left: MOUTH.x - 6, top: 226, width: 30, height: 74, background: "#15171a", borderRadius: 4,
            transform: `skewY(${-40}deg)`, boxShadow: "inset 0 0 0 2px #7d838a" }} />
          {ejected}
          {/* the turbine housing with Claude's mark spinning inside */}
          <svg width={1080} height={614} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <rect x={cx - 22} y={TUR.y + 40} width={44} height={NOZ - TUR.y - 40} fill="url(#ymt2)" />
            <ellipse cx={cx} cy={NOZ} rx={22} ry={4} fill="#0d0e10" />
            <circle cx={cx} cy={TUR.y} r={TUR.r + 6} fill="url(#ymt1)" />
            <circle cx={cx} cy={TUR.y} r={TUR.r - 6} fill="#16181b" stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
            {Array.from({ length: 8 }, (_, i) => { const an = (i / 8) * Math.PI * 2; return <circle key={i} cx={cx + (TUR.r) * Math.cos(an)} cy={TUR.y + (TUR.r) * Math.sin(an)} r={3} fill="#2a2d31" stroke="rgba(255,255,255,0.45)" strokeWidth={0.8} />; })}
          </svg>
          {ghosts.map((g, gi) => (
            <Img key={gi} src={src("Y-claude.png")} style={{ position: "absolute", left: cx - 50, top: TUR.y - 50, width: 100, height: 100,
              transform: `rotate(${spin + g}deg)`, opacity: gi === 0 ? 1 : 0.32 / gi }} />
          ))}
          <div style={{ position: "absolute", left: cx - TUR.r + 6, top: TUR.y - TUR.r + 6, width: 2 * TUR.r - 12, height: 2 * TUR.r - 12, borderRadius: "50%",
            background: "radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255,255,255,0.28), rgba(255,255,255,0) 70%)", boxShadow: "inset 0 4px 10px rgba(0,0,0,0.6)" }} />
        </div>
        {t >= t0 && (
          <div style={{ position: "absolute", left: 0, top: PAN + landDip, width: 1080, height: 614, ...fadeBelow(cam + mix(520, 720, easeIn2(panU)) - PAN - landDip) }}>
            <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={t1} startSec={d.startSec ?? 0.95}
              style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PH.s * push})` }} />
          </div>
        )}
        {t >= t0 + 10 && t < t1 + 40 && (
          <div style={{ position: "absolute", inset: 0, clipPath: `polygon(0px ${NOZ - 4}px, 1080px ${NOZ - 4}px, 1080px 2000px, 0px 2000px)` }}>
            <div style={{ position: "absolute", left: cx - tw / 2, top: ty + landDip, width: tw, height: th, overflow: "hidden", borderRadius: 34 * tileU, boxShadow: "0 16px 30px rgba(0,0,0,0.5)" }}>
              <Img src={src("Y-fin.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MACHINE_KINDS = { "kf-y-machine": Machine };
