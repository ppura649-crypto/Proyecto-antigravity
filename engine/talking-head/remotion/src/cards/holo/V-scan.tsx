import React from "react";
import { Img, staticFile } from "remotion";
import { CALM, CH, CW, JAKARTA, Photo, SHADOW, VB, type VBeats, type View, clamp, ease, exitOf, fullView, ink,
  lerp, lerpView, onView, pick, sp } from "./V-util";
// reference edit K hook-1 v03 (builder V, 2026-09-24) "Brand DNA scan", 1974 -> 4237.
// YOU: the real SKIMS campaign photo fills the band, Holo's mark waits at its top-left as a scanner head.
// WATCH: a thin light line sweeps down the photo; each brand piece it crosses lifts off as a raised layer
// (the wall wordmark, a type sample, two product crops, four eyedropped colours). THE FIX: the photo pulls
// back to a portrait in the middle and the lifted layers fly out to a neat constellation around it, each
// tied to the pixel it came from by a hairline. Settled ~3.4 s, held with a slow parallax drift, 150 ms exit.

const IMG = "skims-3755019.jpg", IW = 900, IH = 1612;
const W0: View = { x: 0, y: 0, w: CW, h: CH, k: 1.2, cx: 450, cy: 574 }; // wide: wall wordmark + the row of faces
const P1 = fullView(540 - 313 / 2, 36.5, 313, IW, IH); // the portrait it pulls back to
const SCAN = 470; // ms, top -> bottom of the band

type Piece = { kind: "wm" | "type" | "crop" | "sw"; src: [number, number, number, number]; slot: [number, number, number, number];
  depth: number; hex?: string; delay?: number };
// src = source rect (x, y, w, h) in the photo (a point for swatches); slot = centre x, y, w, h on the card
const PIECES: Piece[] = [
  { kind: "wm", src: [285, 318, 334, 112], slot: [181, 95, 310, 100], depth: 1 },
  { kind: "type", src: [285, 318, 334, 112], slot: [181, 257, 310, 150], depth: 0.4, delay: 90 },
  { kind: "sw", src: [120, 380, 0, 0], slot: [813.5, 107.5, 155, 125], depth: 0.8, hex: "#dfd9cb" },
  { kind: "sw", src: [440, 462, 0, 0], slot: [984.5, 248.5, 155, 125], depth: 0.2, hex: "#241e14" },
  { kind: "crop", src: [340, 520, 230, 240], slot: [181, 480, 240, 250], depth: 0.7 },
  { kind: "crop", src: [185, 560, 200, 210], slot: [899, 480, 240, 252], depth: 0.3 },
  { kind: "sw", src: [545, 690, 0, 0], slot: [813.5, 248.5, 155, 125], depth: 0.6, hex: "#b1714e" },
  { kind: "sw", src: [450, 780, 0, 0], slot: [984.5, 107.5, 155, 125], depth: 0.9, hex: "#eecfcd" },
];
const srcCenter = (p: Piece) => [p.src[0] + p.src[2] / 2, p.src[1] + p.src[3] / 2];
// the scan line crosses a piece when it reaches the piece's centre on the wide photo
const liftAt = (p: Piece, b: VBeats) => b.watch + (onView(W0, srcCenter(p)[0], srcCenter(p)[1]).y / CH) * SCAN + (p.delay ?? 0);

const viewAt = (t: number, fps: number, b: VBeats): View => {
  const push = 1 + 0.03 * clamp((t - b.you) / (b.the - b.you));
  const wide = { ...W0, k: W0.k * push };
  return lerpView(wide, P1, sp(t, b.the, fps, CALM));
};
// the slow drift of the finished constellation: deeper layers slide further (parallax)
const drift = (t: number, b: VBeats) => ease((t - b.the) / (b.own - b.the));

const Scanner: React.FC<{ t: number; b: VBeats; mark: string }> = ({ t, b, mark }) => {
  const p = clamp((t - b.watch) / SCAN), y = CH * ease(p);
  const gone = clamp((t - (b.watch + SCAN)) / 160);
  if (gone >= 1) return null;
  const on = p > 0 && p < 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - gone, pointerEvents: "none" }}>
      {on && <div style={{ position: "absolute", left: 0, top: y - 110, width: CW, height: 110,
        background: "linear-gradient(to top, rgba(255,255,255,0.32), rgba(255,255,255,0))" }} />}
      {on && <div style={{ position: "absolute", left: 0, top: y - 1.5, width: CW, height: 3, background: "#fff",
        boxShadow: "0 0 18px 4px rgba(255,255,255,0.85), 0 0 60px 10px rgba(255,245,230,0.45)" }} />}
      <div style={{ position: "absolute", left: 22, top: clamp(y, 34, CH - 34) - 34, width: 68, height: 68,
        borderRadius: "50%", background: "#08080a", boxShadow: "0 8px 22px rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(mark)} style={{ width: 40 }} />
      </div>
    </div>
  );
};

type Geo = { x: number; y: number; w: number; h: number; sx: number; sy: number; l: number; g: number };
const geoOf = (p: Piece, i: number, t: number, fps: number, b: VBeats, v: View): Geo => {
  const l = sp(t, liftAt(p, b), fps, { damping: 24, stiffness: 320 });
  const g = sp(t, b.the + 40 + i * 30, fps, CALM);
  const [cx, cy] = srcCenter(p), s = onView(v, cx, cy);
  const d = drift(t, b) * p.depth;
  const tx = p.slot[0] + (p.slot[0] < 540 ? -1 : 1) * 8 * d, ty = p.slot[1] - 5 * d;
  const w0 = p.kind === "sw" ? 46 : p.src[2] * v.k * (1 + 0.06 * l), h0 = p.kind === "sw" ? 46 : p.src[3] * v.k * (1 + 0.06 * l);
  return { x: lerp(s.x, tx, g), y: lerp(s.y - 10 * l, ty, g), w: lerp(w0, p.slot[2], g), h: lerp(h0, p.slot[3], g),
    sx: s.x, sy: s.y, l, g };
};

const PieceView: React.FC<{ p: Piece; q: Geo; t: number; assets: string[] }> = ({ p, q, assets }) => {
  const { x, y, w, h, l, g } = q;
  const tilt = 14 * l * (1 - g);
  const box: React.CSSProperties = { position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h,
    transform: `perspective(900px) rotateX(${tilt}deg) scale(${1 + 0.04 * l * (1 - g)})`,
    boxShadow: l > 0 ? `0 ${lerp(4, 22, l)}px ${lerp(10, 50, l)}px rgba(0,0,0,${0.5 * l})` : undefined,
    outline: `${3 * l * (1 - g)}px solid rgba(255,255,255,${0.9 * (1 - g)})`, opacity: clamp(l * 3) };
  if (p.kind === "sw") {
    return (
      <div style={{ ...box, background: p.hex, borderRadius: lerp(23, 0, clamp(g * 1.4)),
        border: `${lerp(5, 0, clamp(g * 2))}px solid #fff`, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 12, bottom: 10, fontFamily: JAKARTA, fontWeight: 700, fontSize: 26,
          letterSpacing: -0.4, color: ink(p.hex!), opacity: clamp((g - 0.75) / 0.25) }}>{p.hex!.toUpperCase()}</div>
      </div>
    );
  }
  const crop: View = { x: 0, y: 0, w, h, k: w / p.src[2], cx: srcCenter(p)[0], cy: srcCenter(p)[1] };
  const morph = p.kind === "crop" ? 0 : clamp((g - 0.15) / 0.55);
  return (
    <div style={{ ...box, overflow: "hidden", background: p.kind === "type" ? "#fff" : "#dfd9cb" }}>
      {morph < 1 && <Photo src={pick(assets, IMG)} v={crop} iw={IW} ih={IH} style={{ opacity: 1 - morph }} />}
      {p.kind === "wm" && morph > 0 && (
        <Img src={staticFile(pick(assets, "famA-skims-wordmark.png"))} style={{ position: "absolute", left: "15%",
          top: "27%", width: "70%", opacity: morph }} />
      )}
      {p.kind === "type" && morph > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: p.slot[2], height: p.slot[3], opacity: morph,
          fontFamily: JAKARTA, display: "flex", alignItems: "center", gap: 20, paddingLeft: 26, boxSizing: "border-box",
          transform: `scale(${w / p.slot[2]}, ${h / p.slot[3]})`, transformOrigin: "0 0" }}>
          <div style={{ fontSize: 84, fontWeight: 800, color: "#111", letterSpacing: -3, lineHeight: 1 }}>Aa</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>Headline</div>
            <div style={{ fontSize: 27, fontWeight: 500, color: "#777" }}>Body copy</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DnaScan: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<VBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: VBeats = { ...VB, ...beats };
  const v = viewAt(t, fps, b);
  const ex = exitOf(t, toMs);
  const geos = PIECES.map((p, i) => geoOf(p, i, t, fps, b, v));
  const pull = sp(t, b.the, fps, CALM);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      <Photo src={pick(assets, IMG)} v={v} iw={IW} ih={IH} style={{ boxShadow: SHADOW }}>
        <Scanner t={t} b={b} mark={pick(assets, "holo-mark-white.png")} />
      </Photo>
      <svg width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {geos.map((q, i) => q.g > 0.02 && (
          <g key={i} opacity={clamp(q.g * 1.5) * 0.75}>
            <line x1={q.sx} y1={q.sy} x2={q.x} y2={q.y} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
            <circle cx={q.sx} cy={q.sy} r={5 * pull} fill="#fff" stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
          </g>
        ))}
      </svg>
      {PIECES.map((p, i) => geos[i].l > 0.001 && <PieceView key={i} p={p} q={geos[i]} t={t} assets={assets} />)}
    </div>
  );
};
