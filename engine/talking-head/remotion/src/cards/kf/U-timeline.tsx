import React from "react";
import { MONO, hash } from "./L-util";
// keyframes-v1 builder U (round 2): a printed page of a generic pro editing timeline, no brand, for hook U4.
// It is their raw take laid out to edit: the ruler runs 00:00 to 01:28 (source.mov is 88.9 s), V1 is the take cut
// into clips with their real frames as thumbnails, V2 carries B-roll clips with keyframe diamonds, A1 the voice
// waveform with a volume line, A2 a music bed; a playhead. Printed: muted ink on off-white paper with grain.

export const TL = { w: 380, h: 280 };
const HEAD = 30, RULER = 30, TOP = 26, X0 = HEAD + 4, XW = TL.w - X0 - 6;
const INK = "#2d2f33", PAPER = "#f3f0e9";
const TRACKS = [
  { name: "V2", y: TOP + RULER + 4, h: 40 },
  { name: "V1", y: TOP + RULER + 48, h: 58 },
  { name: "A1", y: TOP + RULER + 110, h: 44 },
  { name: "A2", y: TOP + RULER + 158, h: 38 },
];
const V1 = [0.0, 0.07, 0.15, 0.21, 0.3, 0.38, 0.45, 0.53, 0.6, 0.69, 0.77, 0.85, 0.92, 1.0];
const V1F = ["L-f16.jpg", "L-f00.jpg", "L-f01.jpg", "L-f02.jpg", "L-f03.jpg", "L-f04.jpg", "L-f05.jpg", "L-f08.jpg", "L-f09.jpg",
  "L-f10.jpg", "L-f11.jpg", "L-f12.jpg", "L-f13.jpg"];
const V2 = [{ a: 0.12, b: 0.27, img: "R-roll-00.jpg" }, { a: 0.41, b: 0.52, img: "R-roll-03.jpg" }, { a: 0.7, b: 0.86, img: "R-roll-06.jpg" }];
export const TIMELINE_ASSETS = [...V1F, ...V2.map((c) => c.img)];

export const TimelineSheet: React.FC<{ img: (n: string) => string; paper: string }> = ({ img, paper }) => {
  const X = (f: number) => X0 + f * XW;
  const t1 = TRACKS[0]!, v1 = TRACKS[1]!, a1 = TRACKS[2]!, a2 = TRACKS[3]!;
  const bars = (n: number, seed: number, h: number, amp: number) => Array.from({ length: n }, (_, i) => {
    const e = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.37 + seed)) * (0.55 + 0.45 * hash(i * 1.7 + seed));
    return <div key={i} style={{ position: "absolute", left: (i / n) * XW, top: (h - h * e * amp) / 2, width: Math.max(1, XW / n - 0.6),
      height: h * e * amp, background: "currentColor" }} />;
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: TL.w, height: TL.h, background: PAPER, overflow: "hidden", fontFamily: MONO, color: INK }}>
      {/* the viewer bar: sequence name and the source length */}
      <div style={{ position: "absolute", left: 0, top: 0, width: TL.w, height: TOP, borderBottom: `1px solid ${INK}33`, display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontSize: 11, fontWeight: 700, boxSizing: "border-box" }}>
        <span>SEQ 01 · raw take</span><span>00:01:28:26</span>
      </div>
      {/* the ruler */}
      <div style={{ position: "absolute", left: 0, top: TOP, width: TL.w, height: RULER, borderBottom: `1px solid ${INK}44` }}>
        {Array.from({ length: 45 }, (_, i) => {
          const f = i / 44, major = i % 11 === 0;
          return <div key={i} style={{ position: "absolute", left: X(f), bottom: 0, width: 1, height: major ? 12 : 5, background: INK, opacity: major ? 0.8 : 0.45 }} />;
        })}
        {["00:00", "00:22", "00:44", "01:06", "01:28"].map((s, i) => (
          <div key={s} style={{ position: "absolute", left: X(i / 4) + (i === 4 ? -32 : 2), top: 3, fontSize: 9, fontWeight: 500, opacity: 0.85 }}>{s}</div>
        ))}
      </div>
      {/* track headers and lanes */}
      {TRACKS.map((tr) => (
        <React.Fragment key={tr.name}>
          <div style={{ position: "absolute", left: 0, top: tr.y, width: HEAD, height: tr.h, background: "#e2ded5", borderRight: `1px solid ${INK}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{tr.name}</div>
          <div style={{ position: "absolute", left: HEAD, top: tr.y, width: TL.w - HEAD, height: tr.h, background: "#ebe7de" }} />
        </React.Fragment>
      ))}
      {/* V2: B-roll with keyframes */}
      {V2.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: X(c.a), top: t1.y + 3, width: X(c.b) - X(c.a) - 1, height: t1.h - 6, background: "#8a78a8",
          border: `1px solid ${INK}88`, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: t1.h - 6, backgroundImage: `url(${img(c.img)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          {[0.35, 0.7].map((k) => (
            <div key={k} style={{ position: "absolute", left: `${k * 100}%`, top: t1.h / 2 - 7, width: 7, height: 7, marginLeft: -3.5,
              background: "#fff5c8", border: `1px solid ${INK}`, transform: "rotate(45deg)" }} />
          ))}
        </div>
      ))}
      {/* V1: the take, cut into clips, a thumbnail at the head of each */}
      {V1.slice(0, -1).map((a, i) => (
        <div key={i} style={{ position: "absolute", left: X(a), top: v1.y + 3, width: X(V1[i + 1]!) - X(a) - 1, height: v1.h - 6, background: "#6f8fb4",
          border: `1px solid ${INK}88`, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (v1.h - 6) * 0.56, backgroundImage: `url(${img(V1F[i]!)})`,
            backgroundSize: "cover", backgroundPosition: "center 30%" }} />
          <div style={{ position: "absolute", left: (v1.h - 6) * 0.56 + 2, top: 2, fontSize: 7, color: "#fff", opacity: 0.9 }}>{`C${String(i + 1).padStart(2, "0")}`}</div>
        </div>
      ))}
      {/* A1: their voice, with a volume line and two keyframes */}
      <div style={{ position: "absolute", left: X0, top: a1.y + 3, width: XW, height: a1.h - 6, background: "#7fae8a", border: `1px solid ${INK}88`, boxSizing: "border-box",
        color: "#2f5a3a", overflow: "hidden" }}>
        {bars(90, 1.3, a1.h - 6, 0.9)}
        <svg width={XW} height={a1.h - 6} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={`0,12 ${XW * 0.3},12 ${XW * 0.36},7 ${XW},7`} fill="none" stroke="#fff5c8" strokeWidth={1.4} />
          {[0.3, 0.36].map((k) => <rect key={k} x={XW * k - 3} y={(k === 0.3 ? 12 : 7) - 3} width={6} height={6} fill="#fff5c8" stroke={INK} strokeWidth={0.8} transform={`rotate(45 ${XW * k} ${k === 0.3 ? 12 : 7})`} />)}
        </svg>
      </div>
      {/* A2: a music bed */}
      <div style={{ position: "absolute", left: X0, top: a2.y + 3, width: XW * 0.93, height: a2.h - 6, background: "#9fc0a6", border: `1px solid ${INK}66`,
        boxSizing: "border-box", color: "#4f7a5a", overflow: "hidden" }}>
        {bars(70, 4.1, a2.h - 6, 0.6)}
      </div>
      {/* the playhead */}
      <div style={{ position: "absolute", left: X(0.47), top: TOP + 4, width: 1.5, height: TL.h - TOP - 4, background: "#c0392b" }} />
      <div style={{ position: "absolute", left: X(0.47) - 5, top: TOP + 2, width: 11, height: 9, background: "#c0392b", clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)" }} />
      {/* print: paper grain over the ink */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${paper})`, backgroundSize: "180px 180px", mixBlendMode: "soft-light", opacity: 0.95 }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(243,240,233,0.12)" }} />
    </div>
  );
};
