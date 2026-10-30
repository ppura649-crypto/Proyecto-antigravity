import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PAPER, PHONE, PH_TOP, PS, beatsW, title } from "./W-util";
// W4 "Claude writes all my captions" (builder W, round 2, 2026-09-25). A photo print of their raw frame (master 1.30 s,
// no captions). Across it runs their real voice for "AI edits all of my videos now," (master audio 0-1544 ms, peak
// envelope, data.wave) as a brushed-steel ribbon. The real Claude mark slides in along it and reads it; where it
// passes a word, on AND / IT'S / EXACTLY / HOW, that word lifts out of the steel as a heavy caption block ("AI",
// "EDITS", "ALL OF MY", "VIDEOS NOW,") and slams onto their frame in the exact place the finished reel puts it (Sora 700,
// white, the hero line in the grey accent), the print jolting under each. On GOT the print pulls back into their phone
// playing the finished reel from that same frame, landed ~2460, held. Clean exit at 2997.

export const CAPTIONS_ASSETS = ["W-raw.jpg", "W-claude.png", "kf-finished-reel.mp4"];
const START_SEC = 1.3;                                     // reel time of the raw frame: every caption is on
const CROP_Y = 470, S0 = 0.62;                              // print: frame rows 470..1330
const WIN0 = { x: 540 - (1080 * S0) / 2, y: 40, w: 1080 * S0, h: 860 * S0 };
const SCR = { x: 540 - 126, y: PH_TOP + 9 * PS, w: 252, h: 600 * PS - 18 * PS };  // the phone's screen
const S1 = SCR.h / 1920;                                    // cover fit of 1080 x 1920 in the screen
const RIB = { x0: 60, x1: 1020, y: 96, amp: 58 };
const WAVE_MS = 1544;
const ACCENT = "#BFC3C9";
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
// the caption blocks, in frame px (measured on the finished reel at 1.30 s)
type Cap = { words: string[]; left: number; right: number; top: number; size: number; accent: boolean; ms: number };
const CAPS: Cap[] = [
  { words: ["AI"], left: 138, right: 138, top: 1022, size: 62, accent: false, ms: 150 },
  { words: ["EDITS"], left: 938, right: 938, top: 1022, size: 62, accent: false, ms: 480 },
  { words: ["ALL", "OF", "MY"], left: 144, right: 936, top: 1112, size: 62, accent: false, ms: 840 },
  { words: ["VIDEOS NOW,"], left: 540, right: 540, top: 1196, size: 96, accent: true, ms: 1250 },
];
const ribX = (ms: number) => mix(RIB.x0, RIB.x1, ms / WAVE_MS);

const Ribbon: React.FC<{ wave: number[]; lit: number; lift: number }> = ({ wave, lit, lift }) => {
  const n = wave.length, pts = wave.map((v, i) => [mix(RIB.x0, RIB.x1, i / (n - 1)), RIB.amp * Math.pow(Math.max(0.03, v), 0.8)]);
  const top = pts.map(([x, a]) => `${x!.toFixed(1)},${(RIB.y - a!).toFixed(1)}`).join(" L");
  const bot = pts.slice().reverse().map(([x, a]) => `${x!.toFixed(1)},${(RIB.y + a!).toFixed(1)}`).join(" L");
  const d = `M${top} L${bot} Z`;
  const upper = `M${top}`;
  return (
    <svg width={1080} height={220} style={{ position: "absolute", left: 0, top: 0, overflow: "visible",
      transform: `translateY(${-lift * 200}px)`, opacity: 1 - lift, filter: "drop-shadow(0 12px 12px rgba(0,0,0,0.45))" }}>
      <defs>
        <linearGradient id="wrib" x1="0" y1={RIB.y - RIB.amp} x2="0" y2={RIB.y + RIB.amp} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbfcfd" /><stop offset="0.28" stopColor="#aab0b8" /><stop offset="0.5" stopColor="#eef0f3" />
          <stop offset="0.62" stopColor="#7f858e" /><stop offset="1" stopColor="#d9dde2" />
        </linearGradient>
        <clipPath id="wlit"><rect x={0} y={0} width={lit} height={220} /></clipPath>
      </defs>
      <path d={d} transform="translate(0,6)" fill="#3a3d42" />
      <path d={d} fill="url(#wrib)" stroke="#50545a" strokeWidth={1} />
      <path d={upper} fill="none" stroke="#D97757" strokeWidth={3} clipPath="url(#wlit)" style={{ filter: "drop-shadow(0 0 4px rgba(217,119,87,0.9))" }} />
    </svg>
  );
};

const Words: React.FC<{ c: Cap; heavy: number; hidden?: string }> = ({ c, heavy }) => {
  const depth = Array.from({ length: 6 }, (_, k) => `0px ${((k + 1) * heavy).toFixed(2)}px 0px rgb(${118 - k * 10},${122 - k * 10},${128 - k * 10})`).join(", ");
  const style: React.CSSProperties = { fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: c.size, lineHeight: 1, letterSpacing: "0.005em",
    color: c.accent ? ACCENT : "#FFFFFF", textShadow: heavy > 0.05 ? `${depth}, 0px ${(10 * heavy).toFixed(1)}px 22px rgba(0,0,0,0.6)` : SHADOW, whiteSpace: "pre" };
  if (c.words.length === 1) return <div style={style}>{c.words[0]}</div>;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: c.right - c.left }}>
      {c.words.map((w) => <div key={w} style={style}>{w}</div>)}
    </div>
  );
};

export const Captions: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsW(beats);
  if (t < b.now) return <>{title(props, b.now)}</>;
  const d = data ?? {};
  const wave: number[] = d.wave ?? [];
  const src = (n: string) => staticFile(pick(assets, n));
  const LIFT = [b.and, b.its, b.exactly, b.how];
  const FLY = 200;

  // the print, its jolts, the pull back into the phone
  const inP = easeOut3(win(t, b.now - 60, b.now + 200));
  const jolt = LIFT.reduce((s, at) => { const u = t - at - FLY; return s + (u > 0 ? Math.sin(Math.PI * clamp(u / 140)) * Math.exp(-u / 110) : 0); }, 0);
  const g0 = b.got - 110, land = b.got + 105;
  const g = easeInOut(win(t, g0, land));
  const S = S0 * Math.pow(S1 / S0, g);
  const win0 = { x: WIN0.x, y: WIN0.y + mix(-36, 0, inP) + 5 * jolt, w: WIN0.w, h: WIN0.h };
  const W = { x: mix(win0.x, SCR.x, g), y: mix(win0.y, SCR.y, g), w: mix(win0.w, SCR.w, g), h: mix(win0.h, SCR.h, g) };
  // frame origin: crop rows start at the window top; at the end the frame is centred in the screen
  const fx0 = win0.x, fy0 = win0.y - CROP_Y * S0;
  const fx1 = SCR.x + SCR.w / 2 - (1080 * S1) / 2, fy1 = SCR.y;
  const Fx = mix(fx0, fx1, g), Fy = mix(fy0, fy1, g) - 24 * Math.sin(Math.PI * g);
  const Wy = W.y - 24 * Math.sin(Math.PI * g);
  const edge = mix(12, 9 * PS, g), rO = 48 * PS * g, rI = 40 * PS * g;
  const body = `rgb(${mix(242, 10, g)}, ${mix(238, 10, g)}, ${mix(230, 11, g)})`;
  const phoneIn = win(t, land - 70, land);
  const push = 1 + 0.025 * easeInOut(win(t, land, toMs));
  const out = easeIn2(win(t, toMs - 140, toMs));
  // Claude along the ribbon: in from the left, then word to word, then off to the right
  const KEYS: [number, number][] = [[b.now, -40], ...LIFT.map((at, k) => [at - 20, ribX(CAPS[k]!.ms)] as [number, number]), [b.how + 170, 1140]];
  let mx = KEYS[KEYS.length - 1]![1];
  for (let k = 1; k < KEYS.length; k++) {
    const [t1, x1] = KEYS[k]!, [t0, x0] = KEYS[k - 1]!;
    if (t <= t1) { mx = mix(x0, x1, easeInOut(win(t, t0, t1))); break; }
  }
  const ribLift = easeIn2(win(t, b.how + 260, g0 + 40));
  const touch = LIFT.reduce((m, at) => Math.max(m, Math.sin(Math.PI * clamp((t - at + 60) / 140))), 0);

  const caps = CAPS.map((c, k) => {
    const at = LIFT[k]!;
    if (t < at) return null;
    const u = clamp((t - at) / FLY);
    // from the ribbon (in frame px) to the slot, rising toward us then down with weight
    const cx0 = (ribX(c.ms) - Fx) / S, cy0 = (RIB.y - 20 - Fy) / S;
    const slotX = c.words.length > 1 ? (c.left + c.right) / 2 : c.left === c.right && c.accent ? 540 : c.left;
    // it travels over its slot while rising toward us, then drops straight down onto the paper (the scale is the fall)
    const p = easeInOut(clamp(u / 0.62));
    const tx = mix(cx0, slotX, p), ty = mix(cy0, c.top + c.size / 2, p) - (1 - p) * p * 220;
    const rise = u < 0.55 ? mix(0.55, 1.5, easeOut3(u / 0.55)) : mix(1.5, 1, easeIn2((u - 0.55) / 0.45));
    const sc = rise * (u >= 1 ? 1 - 0.04 * Math.sin(Math.PI * clamp((t - at - FLY) / 120)) : 1);
    const anchor = c.words.length > 1 || c.accent ? "-50%" : c.left < 540 ? "0%" : "-100%";
    return (
      <div key={k} style={{ position: "absolute", left: tx, top: ty, transform: `translate(${anchor}, -50%) scale(${sc / (u < 1 ? 1 : 1)})`,
        transformOrigin: anchor === "0%" ? "0 50%" : anchor === "-100%" ? "100% 50%" : "50% 50%" }}>
        <Words c={c} heavy={1 - easeIn2(u)} />
      </div>
    );
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${w / 1080})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${PHONE.cy}px`, transform: `scale(${push})` }}>
        {/* the print (paper edge -> the phone's bezel) */}
        <div style={{ position: "absolute", left: W.x - edge, top: Wy - edge, width: W.w + 2 * edge, height: W.h + 2 * edge, background: body,
          borderRadius: rO, opacity: inP,
          boxShadow: `0 ${mix(22, 34, g)}px ${mix(40, 70, g)}px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.35)${g > 0 ? `, 0 0 0 ${3 * g}px rgba(58,58,62,${g})` : ""}` }} />
        <div style={{ position: "absolute", left: W.x, top: Wy, width: W.w, height: W.h, overflow: "hidden", borderRadius: rI, opacity: inP }}>
          <Img src={src("W-raw.jpg")} style={{ position: "absolute", left: Fx - W.x, top: Fy - Wy, width: 1080 * S, height: 1920 * S }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 35%)" }} />
        </div>
        {/* the caption blocks, in frame coordinates */}
        <div style={{ position: "absolute", left: Fx, top: Fy, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${S})` }}>{caps}</div>
        <Ribbon wave={wave} lit={mx} lift={ribLift} />
        {/* Claude reading the voice */}
        {t < b.how + 170 && (
          <div style={{ position: "absolute", left: mx - 50, top: RIB.y - 50 - RIB.amp - 26 + 14 * touch - 200 * ribLift, width: 100, height: 100,
            filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.45))" }}>
            <Img src={src("W-claude.png")} style={{ width: 100, height: 100, transform: `rotate(${(mx / 3).toFixed(1)}deg)` }} />
          </div>
        )}
        {t >= land - 70 && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={land - 70} startSec={d.startSec ?? START_SEC}
            style={{ left: 540 - 146, top: PH_TOP, transformOrigin: "50% 0%", transform: `scale(${PS})`, opacity: phoneIn }} />
        )}
      </div>
    </div>
  );
};
