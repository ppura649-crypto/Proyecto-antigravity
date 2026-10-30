import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, SCREEN, Title, yBeats } from "./Y-kit";
import { BODIES, BODY_IMGS, HOP, SIM_MS, pour } from "./Y-sim";
// keyframes-v1 hook Y2 "Hopper" (builder Y, 2026-09-25). The title alone to NOW, then a glass-and-steel hopper is
// lowered in on its frame. AND: two dozen thick prints of their real raw clips pour in from above, tumbling and piling
// on the closed valve (Y-sim, deterministic). EXACTLY, HOW: the valve opens and the pile swirls down the neck, prints
// circling the glass cone, nearer ones bigger, and vanishing into the steel collar. GOT: the camera tilts down with
// the one finished reel as it drops out of the spout and lands in the phone below, which plays it, held.

const { cx, rimY, rimW, rimRy, neckY, neckW, collarY, collarB, spoutB } = HOP;
const PAN = 600;                                          // the phone waits this far below, out of the band
export const HOPPER_ASSETS = [...BODY_IMGS, "Y-fin.jpg", "kf-finished-reel.mp4"];
const coneHalf = (y: number) => mix(rimW, neckW, clamp((y - rimY) / (neckY - rimY)));
const CLIP = `polygon(0px -600px, 1080px -600px, 1080px ${rimY}px, ${cx + rimW}px ${rimY}px, ${cx + neckW}px ${neckY}px, ${cx + neckW}px ${collarB}px, ${cx - neckW}px ${collarB}px, ${cx - neckW}px ${neckY}px, ${cx - rimW}px ${rimY}px, 0px ${rimY}px)`;

export const Print: React.FC<{ src: string; x: number; y: number; w: number; h: number; a: number; s: number; sx: number; dim: number; z: number }> = ({ src, x, y, w, h, a, s, sx, dim, z }) => {
  const rad = (a * Math.PI) / 180, d = 5 * s, lx = d * Math.sin(rad), ly = d * Math.cos(rad);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: z, background: "#f3efe6", padding: 3, boxSizing: "border-box",
      transform: `rotate(${a}deg) scale(${s * sx}, ${s})`, filter: dim < 0.99 ? `brightness(${dim.toFixed(3)})` : undefined,
      boxShadow: `${(lx * 0.4).toFixed(1)}px ${(ly * 0.4).toFixed(1)}px 0 #e2ddd1, ${(lx * 0.7).toFixed(1)}px ${(ly * 0.7).toFixed(1)}px 0 #c9c2b3, ${lx.toFixed(1)}px ${ly.toFixed(1)}px 0 #9d9586, ${(lx * 2.6).toFixed(1)}px ${(ly * 2.6).toFixed(1)}px 14px rgba(0,0,0,0.45)` }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 3, background: "linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0) 42%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.12))" }} />
    </div>
  );
};

export const steel = (id: string, vertical = false, dark = 0) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
    {[["0", 58], ["0.18", 150], ["0.34", 236], ["0.5", 128], ["0.72", 92], ["0.88", 170], ["1", 44]].map(([o, v]) => {
      const c = Math.round((v as number) * (1 - dark));
      return <stop key={o} offset={o as string} stopColor={`rgb(${c},${c + 3},${c + 7})`} />;
    })}
  </linearGradient>
);
const cone = `M ${cx - rimW} ${rimY} L ${cx - neckW} ${neckY} L ${cx + neckW} ${neckY} L ${cx + rimW} ${rimY} Z`;
const arc = (upper: boolean) => `M ${cx - rimW} ${rimY} A ${rimW} ${rimRy} 0 0 ${upper ? 1 : 0} ${cx + rimW} ${rimY}`;

export const GlassBack: React.FC = () => (
  <svg width={1080} height={614} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <linearGradient id="yhg" x1="0" x2="1">
        <stop offset="0" stopColor="rgba(22,38,46,0.5)" /><stop offset="0.14" stopColor="rgba(40,60,70,0.2)" />
        <stop offset="0.5" stopColor="rgba(60,80,90,0.08)" /><stop offset="0.86" stopColor="rgba(40,60,70,0.18)" /><stop offset="1" stopColor="rgba(22,38,46,0.46)" />
      </linearGradient>
      {steel("yhs1", false, 0.25)}
    </defs>
    <path d={cone} fill="url(#yhg)" />
    <path d={arc(true)} fill="rgba(30,45,55,0.10)" stroke="url(#yhs1)" strokeWidth={16} />
  </svg>
);

export const GlassFront: React.FC = () => (
  <svg width={1080} height={614} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      {steel("yhs2")}{steel("yhs3", false, 0.2)}{steel("yhs4", false, 0.45)}
      <linearGradient id="yhsh" x1="0" x2="1"><stop offset="0" stopColor="rgba(255,255,255,0)" /><stop offset="0.5" stopColor="rgba(255,255,255,0.5)" /><stop offset="1" stopColor="rgba(255,255,255,0)" /></linearGradient>
    </defs>
    {/* the frame it hangs from */}
    {[-1, 1].map((sg) => <rect key={sg} x={cx + sg * (rimW + 4) - 6} y={-700} width={12} height={700 + rimY} fill="url(#yhs3)" />)}
    {/* glass: thick walls, a long sheen down each side */}
    <path d={`M ${cx - rimW + 30} ${rimY + 20} L ${cx - neckW - 6} ${neckY - 10}`} stroke="rgba(255,255,255,0.38)" strokeWidth={9} strokeLinecap="round" style={{ filter: "blur(2.5px)" }} />
    <path d={`M ${cx + rimW - 44} ${rimY + 22} L ${cx + neckW + 10} ${neckY - 16}`} stroke="rgba(255,255,255,0.18)" strokeWidth={5} strokeLinecap="round" style={{ filter: "blur(1.5px)" }} />
    <path d={`M ${cx - rimW} ${rimY} L ${cx - neckW} ${neckY} M ${cx + rimW} ${rimY} L ${cx + neckW} ${neckY}`} stroke="rgba(245,250,252,0.95)" strokeWidth={3.5} fill="none" />
    <path d={`M ${cx - rimW + 9} ${rimY + 3} L ${cx - neckW + 4} ${neckY} M ${cx + rimW - 9} ${rimY + 3} L ${cx + neckW - 4} ${neckY}`} stroke="rgba(20,34,42,0.55)" strokeWidth={5} fill="none" />
    {/* the steel rim, front half */}
    <path d={arc(false)} fill="none" stroke="url(#yhs2)" strokeWidth={18} />
    <path d={arc(false)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} transform="translate(0,-6)" />
    {/* collar + spout: turned steel cylinders */}
    <rect x={cx - 54} y={collarY} width={108} height={collarB - collarY} fill="url(#yhs2)" />
    <ellipse cx={cx} cy={collarY} rx={54} ry={7} fill="url(#yhs3)" />
    <ellipse cx={cx} cy={collarB} rx={54} ry={7} fill="url(#yhs4)" />
    {[-30, 30].map((dx) => <circle key={dx} cx={cx + dx} cy={(collarY + collarB) / 2} r={4.5} fill="#2a2d31" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />)}
    <rect x={cx - 33} y={collarB} width={66} height={spoutB - collarB} fill="url(#yhs4)" />
    <ellipse cx={cx} cy={spoutB} rx={33} ry={5} fill="#0d0e10" stroke="url(#yhs3)" strokeWidth={2} />
  </svg>
);

export const fadeBelow = (y: number): React.CSSProperties => {
  const m = `linear-gradient(180deg, #000 0px, #000 ${(y - 50).toFixed(1)}px, rgba(0,0,0,0) ${y.toFixed(1)}px)`;
  return { maskImage: m, WebkitMaskImage: m };
};

const Hopper: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = yBeats(beats);
  const d = data ?? {};
  if (t < b.now) return <Title {...props} now={b.now} />;
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;

  const enter = easeOut3(win(t, b.now, b.now + 330));
  const lower = mix(-260, 0, enter) + 5 * Math.sin(Math.PI * win(t, b.now + 300, b.now + 460));
  // the camera tilts down with the reel; the reel leaves the spout and lands on the phone's screen
  const t0 = b.got - 70, t1 = b.got + 115;
  const panU = win(t, t0, t1);
  const cam = PAN * easeInOut(panU);
  const vblur = 7 * Math.sin(Math.PI * panU);
  const out = easeIn2(win(t, toMs - 140, toMs));
  const push = 1 + 0.025 * easeInOut(win(t, t1 + 60, toMs));
  const landDip = 6 * Math.sin(Math.PI * win(t, t1, t1 + 170));

  // the prints: poured (simulated) until EXACTLY, then the vortex down the neck
  const ranks = BODIES.map((_, i) => i).sort((p, q) => pour(q, SIM_MS).y - pour(p, SIM_MS).y);
  const prints: React.ReactNode[] = [];
  ranks.forEach((i, rank) => {
    const bd = BODIES[i]!, ms = t - b.and;
    if (ms < bd.spawn) return;
    const p = t < b.exactly ? pour(i, ms) : pour(i, Math.min(ms, SIM_MS));
    let x = p.x, y = p.y, a = p.a, s = 1, sx = 1, dim = 1, z = 100 + i;
    const s0 = b.exactly + rank * 7, D = 270;
    if (t >= s0) {
      const u = win(t, s0, s0 + D);
      if (u >= 1) return;
      const r0 = p.x - cx, R0 = Math.hypot(r0, 28), psi0 = Math.asin(r0 / R0);
      y = mix(p.y, collarY + 36, Math.pow(easeIn2(u), 0.8));
      const R = Math.min(R0 * (1 - 0.85 * easeIn2(u)), coneHalf(y) - 10);
      const psi = psi0 + 2.4 * Math.PI * Math.pow(u, 1.5);
      x = cx + R * Math.sin(psi);
      const zz = R * Math.cos(psi) / rimW;
      s = (1 + 0.22 * zz) * mix(1, 0.45, win(y, neckY - 70, collarY + 30));
      sx = 0.5 + 0.5 * Math.abs(Math.cos(psi));
      dim = 0.82 + 0.18 * clamp(zz + 0.5);
      a = p.a + 380 * easeIn2(u);
      z = 300 + Math.round(zz * 100);
    }
    prints.push(<Print key={i} src={src(bd.img)} x={x} y={y} w={bd.w} h={bd.h} a={a} s={s} sx={sx} dim={dim} z={z} />);
  });

  const tileU = win(t, t0 + 10, t1);
  const tg = easeOut3(win(t, t0 + 40, t1 - 20));
  const tw = mix(40, SCREEN.w, tg), th = mix(40 * 16 / 9, SCREEN.h, tg);
  const ty = mix(spoutB - 30, SCREEN.y + PAN, easeIn2(tileU));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: out > 0 ? 1 - out : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="yhvb" x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation={`0 ${vblur.toFixed(2)}`} /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-cam}px)`, filter: vblur > 0.4 ? "url(#yhvb)" : undefined }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${lower}px)`, opacity: win(t, b.now, b.now + 70) * (1 - win(t, t1 - 100, t1 - 10)) }}>
          <GlassBack />
          <div style={{ position: "absolute", inset: 0, clipPath: CLIP }}>{prints}</div>
          <GlassFront />
        </div>
        {t >= t0 && (
          <div style={{ position: "absolute", left: 0, top: PAN + landDip, width: 1080, height: 614, ...fadeBelow(cam + mix(520, 720, easeIn2(panU)) - PAN - landDip) }}>
            <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={t1} startSec={d.startSec ?? 0.95}
              style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PH.s * push})` }} />
          </div>
        )}
          {t >= t0 + 10 && t < t1 + 40 && (
          <div style={{ position: "absolute", inset: 0, clipPath: `polygon(0px ${spoutB - 4}px, 1080px ${spoutB - 4}px, 1080px 2000px, 0px 2000px)` }}><div style={{ position: "absolute", left: cx - tw / 2, top: ty + landDip, width: tw, height: th, overflow: "hidden", borderRadius: 34 * tileU,
            boxShadow: "0 16px 30px rgba(0,0,0,0.5)" }}>
            <Img src={src("Y-fin.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div></div>
        )}
      </div>
    </div>
  );
};

export const HOPPER_KINDS = { "kf-y-hopper": Hopper };
