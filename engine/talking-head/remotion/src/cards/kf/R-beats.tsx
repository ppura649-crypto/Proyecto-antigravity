import React from "react";
import { Img, staticFile } from "remotion";
import { BlurDef, CALM, Clip, GREEN, PhoneBody, UI, clamp, ease, easeIn, exitOf, lerp, liftShadow, pick, sp } from "./R-util";
// V9 (20036 -> 22733) "multiple clips ... into a montage". An editor timeline: the song's real waveform (RMS of the
// store montage's track, frames 111-244) with its real beat cuts (story.json boundaries). On "multiple clips"
// six of their real work clips drop onto the video track, each thudding onto its beat marker, the marker flashing;
// on "turn into a montage" the whole timeline pulls together into one phone that plays that montage on those
// beats, the timeline shrunk under it with the playhead crossing the markers as the cuts happen.

export type BeatBeats = { or: number; multiple: number; clips: number; turn: number; montage: number };
const BB: BeatBeats = { or: 20036, multiple: 20676, clips: 20976, turn: 21796, montage: 22176 };

const WAVE = [0.28,0.32,0.28,0.25,0.26,0.25,0.22,0.19,0.21,0.21,0.20,0.18,0.18,0.17,0.14,0.15,0.17,0.19,0.23,0.22,
  0.21,0.21,0.25,0.23,0.22,0.21,0.24,0.23,0.26,0.29,0.29,0.25,0.28,0.30,0.30,0.29,0.28,0.28,0.30,0.31,0.37,0.37,0.33,
  0.28,0.25,0.30,0.32,0.30,0.28,0.28,0.28,0.29,0.30,0.28,0.27,0.24,0.29,0.49,0.44,0.35,0.35,0.36,0.28,0.30,0.24,0.23,
  0.23,0.26,0.24,0.24,0.24,0.22,0.24,0.25,0.24,0.23,0.22,0.21,0.20,0.20,0.19,0.19,0.16,0.15,0.18,0.22,0.28,0.31,0.29,
  0.23,0.21,0.17,0.20,0.24,0.30,0.34,0.35,0.33,0.28,0.23,0.19,0.20,0.20,0.22,0.22,0.19,0.20,0.21,0.23,0.26,0.28,0.27,
  0.92,0.93,0.90,0.88,0.86,0.74,0.68,0.83,0.93,0.84,0.85,0.76,0.78,0.70,0.84,0.76,0.73,0.62,0.57,0.43,0.39,0.76,0.87,
  0.72,0.78,0.81,0.73,0.69,0.73,0.66,0.59,0.69,0.76,0.70,0.80,0.88,0.85,0.89,0.96,0.90,0.88,0.82,0.87,0.90,1.00,0.14];
const F0 = 111, F1 = 244, CUTS = [111, 132, 153, 175, 196, 218, 244];
// the timeline surface
const TX = 60, TW = 960, PANEL = { x: 40, y: 118, w: 1000, h: 452 };
const VT = { y: 176, h: 150 }, AT = { y: 360, h: 180 }; // video track, audio track
const fx = (f: number, x0: number, w: number) => x0 + ((f - F0) / (F1 - F0)) * w;
// the phone it pulls into
const PH = { w: 206, h: 440, x: 540 - 103, y: 8 }, STRIP = { x: 540 - 140, w: 280, y: 466, h: 48 }; // all inside the card, clear of their eyes
const FALL = 250, STAGGER = 92, DROP = 110;

const Wave: React.FC<{ x0: number; w: number; y: number; h: number; draw: number; hit: (x: number) => number }> = (
  { x0, w, y, h, draw, hit }) => {
  const n = WAVE.length, pitch = w / n;
  return (
    <>
      {WAVE.map((a, i) => {
        const x = x0 + i * pitch, grow = clamp(draw * n * 1.15 - i);
        const bump = hit(x);
        const bh = Math.max(2, a * h * 0.92 * grow * (1 + 0.25 * bump));
        return <div key={i} style={{ position: "absolute", left: x + pitch * 0.18, top: y + h / 2 - bh / 2, width: pitch * 0.64,
          height: bh, borderRadius: 2, background: bump > 0.05 ? `rgb(${lerp(236, 74, bump)},${lerp(236, 222, bump)},${lerp(240, 128, bump)})` : "#ececf0" }} />;
      })}
    </>
  );
};

export const BeatMontage: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<BeatBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: BeatBeats = { ...BB, ...beats };
  const ex = exitOf(t, toMs);
  const enter = sp(t, b.or, fps, CALM);
  const draw = 0.3 + 0.7 * ease((t - b.or) / 480); // already a picture on the first frame
  const pullAt = b.turn - 100;
  const g = sp(t, pullAt, fps, CALM); // the pull
  const land = (k: number) => b.multiple + k * STAGGER + FALL; // tile k hits its marker
  // how much marker x is ringing right now (for the waveform bump)
  const ring = (k: number) => { const dt = t - land(k); return dt < 0 ? 0 : Math.exp(-dt / 170); };
  const tl = { x0: lerp(TX, STRIP.x, g), w: lerp(TW, STRIP.w, g) };
  const hit = (x: number) => {
    let m = 0;
    for (let k = 0; k < 6; k++) { const mx = fx(CUTS[k], tl.x0, tl.w); m = Math.max(m, ring(k) * Math.exp(-Math.pow((x - mx) / 26, 2))); }
    return m * (1 - g);
  };
  const clipStart = pullAt;
  const play = t >= clipStart ? ((t - clipStart) / 1000) * 30 : 0; // frames into the montage slice
  const ph = F0 + play;
  const push = 1 + 0.02 * ease((t - (b.montage + 150)) / (toMs - b.montage - 150));
  const waveY = lerp(AT.y, STRIP.y, g), waveH = lerp(AT.h, STRIP.h, g);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${push * ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      {/* the timeline surface, it closes in with the pull */}
      <div style={{ position: "absolute", left: lerp(PANEL.x, STRIP.x - 14, g), top: lerp(PANEL.y, STRIP.y - 8, g) + lerp(30, 0, enter),
        width: lerp(PANEL.w, STRIP.w + 28, g), height: lerp(PANEL.h, STRIP.h + 16, g), background: "rgba(16,16,19,0.95)",
        boxShadow: "0 26px 60px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.32)" }}>
        <div style={{ position: "absolute", left: 18, top: 12, fontFamily: UI, fontWeight: 600, fontSize: 22, color: "#8b8b93",
          opacity: 1 - clamp(g * 3) }}>Beat cuts  ·  6</div>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${lerp(30, 0, enter)}px)` }}>
        <Wave x0={tl.x0} w={tl.w} y={waveY} h={waveH} draw={draw} hit={hit} />
        {CUTS.map((f, k) => {
          const x = fx(f, tl.x0, tl.w), on = ring(k);
          const top = lerp(VT.y - 22, STRIP.y - 4, g), bot = waveY + waveH + lerp(10, 4, g);
          const passed = g > 0.5 && ph >= f; // the playhead has crossed this cut
          return (
            <div key={f} style={{ position: "absolute", left: x - 1.5, top, width: 3, height: bot - top,
              background: on > 0.05 || passed ? GREEN : "rgba(255,255,255,0.55)",
              boxShadow: on > 0.05 ? `0 0 ${(18 * on).toFixed(1)}px rgba(74,222,128,${(0.9 * on).toFixed(2)})` : undefined,
              opacity: clamp(draw * 7 - k * 0.8) }} />
          );
        })}
        {/* the playhead, once it is the phone's timeline */}
        {g > 0.6 && (
          <div style={{ position: "absolute", left: fx(Math.min(F1, ph), tl.x0, tl.w) - 1, top: STRIP.y - 10, width: 2,
            height: STRIP.h + 20, background: "#fff", opacity: clamp((g - 0.6) * 4), boxShadow: "0 0 6px rgba(0,0,0,0.6)" }} />
        )}
      </div>
      {/* the six clips */}
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const start = b.multiple + k * STAGGER, u = clamp((t - start) / FALL);
        if (t < start) return null;
        const x0 = fx(CUTS[k], TX, TW) + 3, w0 = fx(CUTS[k + 1], TX, TW) - fx(CUTS[k], TX, TW) - 6;
        const fall = easeIn(u), v = u < 1 ? (3 * u * u) * DROP / FALL * (1000 / fps / 2) : 0; // px per half frame
        const dt = t - land(k), squash = dt > 0 ? 0.06 * Math.exp(-dt / 70) * Math.cos(dt / 45) : 0;
        const depth = lerp(1.32, 1, fall); // it falls toward the track from nearer the camera
        let x = x0 - (w0 * (depth - 1)) / 2, y = lerp(VT.y - DROP, VT.y, fall) - VT.h * (depth - 1) + lerp(30, 0, enter);
        let w = w0 * depth, h = VT.h * depth; const rot = (k % 2 ? 1 : -1) * 4 * (1 - fall);
        // the pull: every clip slides into the phone's screen and dissolves into the montage
        x = lerp(x, PH.x, g); y = lerp(y, PH.y, g); w = lerp(w, PH.w, g); h = lerp(h, PH.h, g);
        const blur = v * 0.12;
        const id = `rbeat-${k}-${Math.round(t)}`;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden",
            transform: `rotate(${rot}deg) scaleY(${1 - squash}) scaleX(${1 + squash * 0.5})`, transformOrigin: "50% 100%",
            opacity: 1 - clamp((g - 0.8) / 0.16), zIndex: 3,
            boxShadow: liftShadow(lerp(0.9, 0.1, fall)), filter: blur > 0.5 ? `url(#${id})` : undefined }}>
            {blur > 0.5 && <BlurDef id={id} x={0} y={Math.min(12, blur)} />}
            <Img src={staticFile(pick(assets, `R-clip-${k}.jpg`))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      {/* the phone the timeline became */}
      {g > 0.3 && (
        <div style={{ position: "absolute", left: PH.x, top: PH.y, width: PH.w, height: PH.h, zIndex: 2,
          opacity: clamp((g - 0.3) / 0.3), transform: `scale(${lerp(0.94, 1, g)})` }}>
          <PhoneBody w={PH.w} h={PH.h} shadow={liftShadow(0.35)}>
            <Clip src={pick(assets, "R-montage.mp4")} startMs={clipStart} fps={fps} />
          </PhoneBody>
        </div>
      )}
    </div>
  );
};
