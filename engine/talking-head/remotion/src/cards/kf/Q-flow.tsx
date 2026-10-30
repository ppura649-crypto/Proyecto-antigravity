import React from "react";
import type { CardProps } from "../props";
import { ChatWindow, ORDER } from "./Q-windows";
import { H1, H2, WH, Leaf1, Leaf2, PW, type TLData, leafShade } from "./Q-timeline";
import { BH, BW, calm, clamp, easeInOut, exitOf, lerp, pick, smooth } from "./Q-util";
// keyframes-v1 V6 (builder Q, 2026-09-25) "it basically turns any of my AIs into video editors", 11033 -> 14813.
// A cover-flow of five real agent apps (Claude, ChatGPT, Gemini, Cursor, Grok), repeating round a heavy wheel.
// It opens resting on Cursor; on TURNS a flick whips it through six windows in depth (true motion blur: sub-frame
// samples averaged), friction slows it like a heavy wheel and it lands on Claude's window on AIs. On INTO the
// other windows fall back into the dark and Claude's window comes forward to full width; on VIDEO the timeline
// of THIS video unfolds out of its bottom edge like folded paper (two leaves), the playhead running on the real
// clock, held under a slow push to the 150 ms exit at 14813.

type B = { it: number; turns: number; ais: number; into: number; video: number; editors: number };
const DB: B = { it: 11033, turns: 11449, ais: 12589, into: 13233, video: 13548, editors: 14029 };

const TW = 620, TH = 420, CY = BH / 2;
const S0 = 3, DRIFT = 0.22, HERO = 10; // index 3 = Cursor, index 10 = Claude (10 % 5 = 0)
const ACC = 90; // flick reaches top speed in 90 ms, friction takes the rest down to AIs

const curveFor = (n: number): number[] => {
  const out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const ramp = smooth(0, ACC, i), u = clamp((i - ACC * 0.5) / (n - ACC * 0.5));
    acc += ramp * Math.pow(1 - u, 3.2); out.push(acc);
  }
  return out.map((x) => x / acc);
};
let CURVE: number[] = []; let CURVE_N = 0;
const pos = (t: number, b: B) => {
  const pre = S0 + DRIFT * smooth(b.it, b.turns + 200, t);
  if (t <= b.turns) return pre;
  const n = Math.max(200, Math.round(b.ais - b.turns));
  if (CURVE_N !== n) { CURVE = curveFor(n); CURVE_N = n; }
  const i = clamp(t - b.turns, 0, n), f = i - Math.floor(i);
  const c = CURVE[Math.floor(i)] * (1 - f) + CURVE[Math.min(n, Math.floor(i) + 1)] * f;
  return pre + (HERO - pre) * c;
};

// one window on the wheel; `go` (0..1) = the others falling back once Claude's window comes forward
const Tile: React.FC<{ i: number; d: number; go: number; blurId: string | null; assets: string[] }> = ({ i, d, go, blurId, assets }) => {
  const a = clamp(d, -1, 1);
  const x = (a * 410 + (d - a) * 150) * (1 + 0.5 * go);
  const rot = -a * 56, z = -Math.abs(a) * 250 - 420 * go;
  const dim = (1 - 0.45 * Math.min(1, Math.abs(d) * 0.8)) * (1 - 0.6 * go);
  const app = ORDER[((i % 5) + 5) % 5];
  return (
    <div style={{ position: "absolute", left: BW / 2 - TW / 2 + x, top: CY - TH / 2, width: TW, height: TH,
      zIndex: 100 - Math.round(Math.abs(d) * 10), opacity: 1 - go,
      transform: `perspective(1100px) translateZ(${z}px) rotateY(${rot}deg)`,
      boxShadow: "0 34px 60px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.35)",
      filter: blurId ? `url(#${blurId}) brightness(${dim})` : `brightness(${dim})` }}>
      <ChatWindow app={app} w={TW} h={TH} assets={assets} />
    </div>
  );
};

const Wheel: React.FC<{ s: number; go: number; blurId: string | null; assets: string[]; skipHero: boolean }> = ({ s, go, blurId, assets, skipHero }) => {
  const out: React.ReactNode[] = [];
  for (let i = Math.floor(s) - 3; i <= Math.ceil(s) + 3; i++) {
    if (skipHero && i === HERO) continue;
    out.push(<Tile key={i} i={i} d={i - s} go={go} blurId={blurId} assets={assets} />);
  }
  return <>{out}</>;
};

export const AgentFlow: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, toMs, beats, assets, data }) => {
  const b: B = { ...DB, ...(beats as Partial<B>) };
  const tl: TLData = { ...(data as TLData), strip: { ...(data as TLData).strip, file: pick(assets, "Q-take-strip.jpg") } };
  const t = tMs;
  // motion blur on the whip: a 180-degree shutter sampled and averaged
  const shutter = 500 / fps;
  const span = Math.abs(pos(t, b) - pos(t - shutter, b));
  const n = Math.max(1, Math.min(10, Math.ceil(span * 8)));
  const std = n > 1 ? Math.min(36, (span * 150) / n) : 0;
  const blurId = std > 0.5 ? `qflow-${Math.round(t)}` : null;
  // INTO: the hero comes forward to full width, the others fall back
  const g = calm(t, b.into, fps, 170);
  const hero = { x: lerp(BW / 2 - TW / 2, 40, g), y: lerp(CY - TH / 2, 38, g), w: lerp(TW, PW, g), h: lerp(TH, WH, g) };
  const landed = t >= b.into;
  // VIDEO: the timeline unfolds from the window's bottom edge, two leaves like paper
  const u1 = calm(t, b.video, fps, 150), u2 = calm(t, b.video + 150, fps, 150);
  const a1 = 90 * (1 - u1), a2 = -178 * (1 - u2);
  const push = 1 + 0.025 * easeInOut((t - b.ais) / (toMs - b.ais));
  const ex = exitOf(t, toMs);
  return (
    <div style={{ position: "absolute", left: (w - BW) / 2, top: (h - BH) / 2, width: BW, height: BH }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push * ex.scale})`, transformOrigin: "50% 45%", opacity: ex.opacity }}>
        {blurId && (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id={blurId} x="-20%" y="0%" width="140%" height="100%"><feGaussianBlur stdDeviation={`${std} 0`} /></filter>
          </svg>
        )}
        {g < 0.999 && Array.from({ length: n }, (_, k) => (
          <div key={k} style={{ position: "absolute", inset: 0, opacity: 1 / (k + 1) }}>
            <Wheel s={pos(t - (n > 1 ? (shutter * k) / (n - 1) : 0), b)} go={g} blurId={blurId} assets={assets} skipHero={landed} />
          </div>
        ))}
        {landed && (
          <div style={{ position: "absolute", left: hero.x, top: hero.y, width: hero.w, height: hero.h + H1 + H2 * 0, zIndex: 200 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: hero.w, height: hero.h,
              boxShadow: `0 ${lerp(34, 40, g)}px ${lerp(60, 80, g)}px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.35)` }}>
              <ChatWindow app="claude" w={hero.w} h={hero.h} assets={assets} />
            </div>
            {t >= b.video && (
              <div style={{ position: "absolute", left: 0, top: hero.h, width: PW, height: H1, transformOrigin: "50% 0",
                transform: `perspective(1400px) rotateX(${a1}deg)`, transformStyle: "preserve-3d",
                boxShadow: `0 ${30 * u1}px ${60 * u1}px rgba(0,0,0,${0.5 * u1})` }}>
                <Leaf1 d={tl} t={t} />
                <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${leafShade(a1)})` }} />
                <div style={{ position: "absolute", left: 0, top: H1, width: PW, height: H2, transformOrigin: "50% 0",
                  transform: `rotateX(${a2}deg)`, backfaceVisibility: "hidden" }}>
                  <Leaf2 d={tl} t={t} />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,${leafShade(a1 + a2) * 0.6}), rgba(0,0,0,${leafShade(a1 + a2)}))` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
