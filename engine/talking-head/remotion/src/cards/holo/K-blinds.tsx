import React from "react";
import { Easing, Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SANS, TODOS, beatsOf, box, clamp, mix, outC, pick, ramp, wrap, type KBeats } from "./K-util";
// h5v3 "Blinds" (builder K): the to-do list is a venetian blind, one to-do per slat. BECAME .. LIST: the blind
// keeps lowering, a new slat (a new to-do) at a time, until the window is shut. WATCH: every slat tilts open in a
// wave from the top and light pours through; THIS: the whole blind is pulled up out of frame. Behind it the whole
// time: real ads (a SKIMS try-on clip playing, a Crocs ad, a SKIMS ad). Held under a slow push.

const WX = 40, WY = 30, WW = 1000, WH = 574, N = 10, P = WH / N; // window + slats
const PANES: { src: string; w: number; pos?: string }[] = [
  { src: "K-tryon-turn.mp4", w: 322 },
  { src: "crocs-5139685.jpg", w: 356, pos: "0% 50%" },
  { src: "skims-3754964.jpg", w: 322 },
];
export const BLINDS_ASSETS = PANES.map((p) => p.src);
const LABELS = ["30-DAY MARKETING PLAN", ...TODOS.slice(0, N - 1)];

// how many slats are down at t (a float: the last one is still sliding out)
const down = (t: number, b: KBeats) => {
  const steps = [b.became, b.another + 60, b.todo, b.todo + 180, b.list - 180, b.list];
  return 4 + steps.reduce((s, at) => s + ramp(t, at, at + 170, outC), 0);
};

const Slat: React.FC<{ i: number; y: number; tilt: number; vis: number }> = ({ i, y, tilt, vis }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: WW, height: P + 4, opacity: vis,
    transform: `rotateX(${tilt}deg)`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", inset: 0,
      background: `linear-gradient(180deg, #FBFAF6 0%, #F1EFE9 55%, #DAD6CC 100%)`,
      boxShadow: `0 ${3 + 6 * (tilt / 80)}px 6px rgba(0,0,0,0.28)`, filter: `brightness(${mix(1, 1.18, tilt / 80)})` }} />
    <div style={{ position: "absolute", left: 64, top: 0, height: P + 4, display: "flex", alignItems: "center",
      fontFamily: SANS, color: "#1d1d20", whiteSpace: "nowrap" }}>
      {i === 0 ? (
        <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: 3 }}>{LABELS[0]}</span>
      ) : (
        <>
          <span style={{ width: 28, height: 28, border: "3px solid #2a2a2e", borderRadius: 5, marginRight: 18 }} />
          <span style={{ fontSize: 29, fontWeight: 500 }}>{LABELS[i]}</span>
        </>
      )}
    </div>
  </div>
);

const View: React.FC<{ t: number; b: KBeats; assets: string[]; fps: number; light: number }> = ({ t, b, assets, fps, light }) => {
  let x = 0;
  return (
    <div style={{ position: "absolute", left: WX, top: WY, width: WW, height: WH, overflow: "hidden", background: "#0b0b0d",
      filter: `brightness(${mix(1, 1.35, light)})` }}>
      {PANES.map((p) => {
        const left = x;
        x += p.w;
        const style: React.CSSProperties = { position: "absolute", left, top: 0, width: p.w - (x < WW ? 6 : 0), height: WH, objectFit: "cover", objectPosition: p.pos ?? "50% 50%" };
        return p.src.endsWith(".mp4") ? (
          <Sequence key={p.src} from={Math.ceil(((b.watch - 60) / 1000) * fps)} layout="none">
            <OffthreadVideo src={staticFile(pick(assets, p.src))} muted startFrom={0} style={style} />
          </Sequence>
        ) : <Img key={p.src} src={staticFile(pick(assets, p.src))} style={style} />;
      })}
    </div>
  );
};

export const Blinds: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets }) => {
  const b = beatsOf(beats);
  const n = down(t, b);
  const shut = t >= b.list + 170;
  const rise = ramp(t, b.this + 30, b.this + 470, Easing.inOut(Easing.cubic));
  const light = ramp(t, b.watch, b.watch + 300, outC) * (1 - ramp(t, b.this + 300, b.this + 900));
  const rail = WY + Math.min(n, N) * P - rise * (WH + 90);
  return (
    <div style={box(w, h)}>
      <div style={{ ...wrap(t, b, 0.035), background: "radial-gradient(ellipse 80% 90% at 50% 45%, #1c1c20 0%, #0c0c0e 62%, #060607 100%)" }}>
        {shut ? <View t={t} b={b} assets={assets} fps={fps} light={light} />
          : <div style={{ position: "absolute", left: WX, top: WY, width: WW, height: WH, background: "linear-gradient(180deg, #16161a, #0d0d10)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.05)" }} />}
        <div style={{ position: "absolute", left: WX, top: 0, width: WW, height: WY + WH, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: WY - rise * (WH + 90), width: WW, height: WH, perspective: 900 }}>
            {Array.from({ length: N }, (_, i) => {
              const slide = clamp(n - i);
              if (slide <= 0) return null;
              const at = b.watch + i * 22;
              const tilt = 78 * ramp(t, at, at + 300, Easing.out(Easing.quad));
              return <Slat key={i} i={i} y={i * P - (1 - slide) * P * 0.9} tilt={tilt} vis={clamp(slide * 3)} />;
            })}
            {[170, 830].map((cx) => (
              <div key={cx} style={{ position: "absolute", left: cx, top: 0, width: 3, height: Math.min(n, N) * P,
                background: "rgba(245,240,230,0.85)", boxShadow: "0 0 2px rgba(0,0,0,0.4)" }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: -6, top: rail - 4, width: WW + 12, height: 20,
            background: "linear-gradient(180deg, #F6F4EE, #CFCBC1)", boxShadow: "0 6px 12px rgba(0,0,0,0.45)" }} />
        </div>
        <div style={{ position: "absolute", left: WX - 14, top: WY - 22 - rise * (WH + 90), width: WW + 28, height: 26,
          background: "linear-gradient(180deg, #FFFFFF, #D9D5CB)", boxShadow: "0 8px 16px rgba(0,0,0,0.5)" }} />
      </div>
    </div>
  );
};
