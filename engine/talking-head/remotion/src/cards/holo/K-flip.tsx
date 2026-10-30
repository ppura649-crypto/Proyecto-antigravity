import React from "react";
import { Easing, Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { CardProps } from "../props";
import { HAND, beatsOf, box, mix, outC, pick, ramp, wrap, type KBeats } from "./K-util";
// h5v4 "Flipbook" (builder K): the plan is a ruled notepad, its top page the to-do list, handwritten. BECAME ..
// LIST: line after line gets written. "you need to": a thumb bends the page corner up. WATCH: the page flips off
// and the pad riffles like a flipbook, fast then slowing; every page under it is a frame of a real SKIMS try-on
// video, so the riffle becomes the ad playing. The last page lands and the clip plays on under a slow push.

const PW = 372, PH = 580, PX = (1080 - PW) / 2, PY = 46; // the page
const LINE = 52, L0 = 92;
const LINES = ["5 Instagram posts", "3 product videos", "4 ad creatives", "Welcome emails", "Launch Meta ads",
  "TikTok every day", "Reply to comments", "Test 2 headlines"];
const GAPS = [40, 42, 45, 50, 56, 64, 75, 90];          // the riffle: fast off the thumb, then slowing (8 pages)
export const FLIP_ASSETS = ["K-tryon-front.mp4", ...GAPS.map((_, k) => `K-flip-${k + 1}.jpg`)];
// page k (1..8) starts lifting at S[k-1]; after page 8 the live clip plays on (from its frame 14, 35 ms after K-flip-8)
const starts = (b: KBeats) => GAPS.slice(0, -1).reduce((s, g) => [...s, s[s.length - 1]! + g], [b.watch + 120]);

const Ruled: React.FC = () => (
  <>
    {Array.from({ length: 10 }, (_, k) => (
      <div key={k} style={{ position: "absolute", left: 0, right: 0, top: L0 + 40 + k * LINE, height: 1.5, background: "rgba(80,130,200,0.35)" }} />
    ))}
    <div style={{ position: "absolute", left: 50, top: 0, bottom: 0, width: 1.5, background: "rgba(220,70,70,0.45)" }} />
  </>
);

const TodoPage: React.FC<{ t: number; b: KBeats }> = ({ t, b }) => {
  const at = (i: number) => (i < 3 ? b.just - 500 : b.became + ((b.list - b.became) / 4) * (i - 3));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFEFA", overflow: "hidden" }}>
      <Ruled />
      <div style={{ position: "absolute", left: 64, top: 20, fontFamily: HAND, fontWeight: 700, fontSize: 46, color: "#1d2a5c" }}>
        30-day plan
        <div style={{ height: 4, background: "#D94B3A", marginTop: -4, width: 190, transform: "rotate(-1.5deg)" }} />
      </div>
      {LINES.map((l, i) => {
        const f = ramp(t, at(i), at(i) + 240, Easing.linear);
        return (
          <div key={l} style={{ position: "absolute", left: 60, top: L0 + i * LINE, height: LINE, display: "flex", alignItems: "flex-end",
            fontFamily: HAND, fontWeight: 600, fontSize: 36, color: "#1d2a5c", whiteSpace: "nowrap",
            clipPath: `inset(-10px ${100 - f * 100}% -10px 0)` }}>
            <span style={{ width: 22, height: 22, border: "2.5px solid #1d2a5c", marginRight: 12, marginBottom: 9, transform: `rotate(${(i % 3) - 1}deg)` }} />
            {l}
          </div>
        );
      })}
    </div>
  );
};

// one page lifting off the pad: 0..90 deg about its top edge (bottom toward the viewer), lit as it rises
const Lift: React.FC<{ deg: number; children: React.ReactNode }> = ({ deg, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transformOrigin: "50% 0%",
    transform: `perspective(2600px) rotateX(${deg}deg)`, boxShadow: `0 ${6 + deg * 0.2}px ${12 + deg * 0.3}px rgba(0,0,0,${0.25 + deg * 0.003})` }}>
    {children}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, rgba(0,0,0,${deg * 0.004}), rgba(255,255,255,${deg * 0.002}))` }} />
  </div>
);

export const Flipbook: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets }) => {
  const b = beatsOf(beats);
  const S = starts(b);
  const thumb = 9 * ramp(t, b.you, b.watch, (x) => x * x);
  const list = t < b.watch ? thumb : mix(9, 90, ramp(t, b.watch, b.watch + 230, Easing.in(Easing.quad)));
  const u = S.filter((s, k) => k < GAPS.length && t >= s).length; // pages already lifting off
  const img: React.CSSProperties = { position: "absolute", inset: 0, width: PW, height: PH, objectFit: "cover" };
  const land = ramp(t, S[S.length - 1]!, S[S.length - 1]! + 240, outC);
  return (
    <div style={box(w, h)}>
      <div style={{ ...wrap(t, b, 0.05, "50% 55%") }}>
        <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH, transform: `rotate(-1.5deg) scale(${mix(1, 1.02, land)})` }}>
          {[5, 4, 3, 2, 1].map((k) => (
            <div key={k} style={{ position: "absolute", left: k * 1.6, top: k * 2.2, width: PW, height: PH,
              background: k % 2 ? "#EFECE4" : "#F7F5EE", boxShadow: k === 5 ? "0 30px 60px rgba(0,0,0,0.6), 0 10px 20px rgba(0,0,0,0.4)" : undefined }} />
          ))}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#111" }}>
            {u >= GAPS.length ? (
              <Sequence from={Math.ceil((S[GAPS.length - 1]! / 1000) * fps)} layout="none">
                <OffthreadVideo src={staticFile(pick(assets, "K-tryon-front.mp4"))} muted startFrom={14} style={img} />
              </Sequence>
            ) : <Img src={staticFile(pick(assets, `K-flip-${u + 1}.jpg`))} style={img} />}
          </div>
          {S.map((s, k) => {
            const p = ramp(t, s, s + 170, Easing.in(Easing.quad));
            if (t < b.watch || p >= 1) return null;
            return <Lift key={k} deg={90 * p}><Img src={staticFile(pick(assets, `K-flip-${k + 1}.jpg`))} style={img} /></Lift>;
          })}
          {list < 90 && <Lift deg={list}><TodoPage t={t} b={b} /></Lift>}
          <div style={{ position: "absolute", left: -8, right: -8, top: -22, height: 30, background: "linear-gradient(180deg, #2b2b2f, #151517)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.5)" }}>
            {Array.from({ length: 13 }, (_, k) => (
              <div key={k} style={{ position: "absolute", left: 20 + k * 27, top: -9, width: 10, height: 30, borderRadius: 5,
                background: "linear-gradient(90deg, #8a8d94, #e3e5ea 45%, #7c7f86)", boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
