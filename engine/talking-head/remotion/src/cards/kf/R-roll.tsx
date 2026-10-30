import React from "react";
import { Img, staticFile } from "remotion";
import { BlurDef, CALM, Clip, GLIDE, HEAVY, PhoneBody, SORA, UI, clamp, ease, exitOf, lerp, liftShadow, pick, sp } from "./R-util";
// V8 (15967 -> 20036) "whatever footage ... one clip ... 5 different hooks". Their camera roll (real clips: their
// desk, nights out, talking takes, the product screen recordings, and THIS raw take, 1:29) flicks up with
// inertia; on "one" their take lifts out toward the camera and becomes a phone; on "5" four more phones are
// dealt off it along an arc like cards; on "different hooks" a different white hook lands on each, left to right.

export type RollBeats = { so: number; whatever: number; one: number; five: number; different: number; hooks: number };
const RB: RollBeats = { so: 15967, whatever: 16069, one: 17608, five: 18688, different: 18988, hooks: 19228 };

const PX = 90, PW = 900, GAP = 3, T = (PW - 4 * GAP) / 5, P = T + GAP, Y0 = 72;
const TAKE = 17, SCROLL = 2 * P;
// every tile is one of their real B-roll clips (Downloads/B roll), badge = that clip's real length (ffprobe); 17 = this raw take
const DUR: Record<number, string> = { 0: "0:14", 1: "0:08", 2: "0:13", 3: "0:07", 4: "0:07", 5: "0:09", 6: "0:10", 7: "0:12", 8: "0:13", 9: "0:08", 10: "0:02", 11: "0:31", 12: "0:06", 13: "0:08", 14: "0:14", 15: "0:14", 16: "0:07", 17: "1:29", 18: "0:09", 19: "0:07", 20: "0:15", 21: "0:08", 22: "0:08", 23: "0:07", 24: "0:12" };
const FLICK = 980;
const scrollAt = (t: number, b: RollBeats) => {
  const u = clamp((t - b.whatever) / FLICK);
  const soft = clamp((t - b.whatever) / 70); // the finger's first 70 ms
  return SCROLL * (1 - Math.pow(1 - u, 4)) * (0.35 + 0.65 * soft);
};

// the phones: centre phone at (540, 272), pivot of the fan far below
const PHW = 204, PHH = 436, PCX = 540, PCY = 262, R = 1150, STEP = 8.8;
export const HOOKS: [string, string][] = [
  ["AI edits all", "my videos now"], ["I stopped editing", "my own videos"], ["0 to 51K", "without an editor"],
  ["Your AI is now", "a video editor"], ["Record it.", "It's done."],
];

const Title: React.FC<{ lines: [string, string]; t: number; at: number; fps: number }> = ({ lines, t, at, fps }) => {
  const k = sp(t, at, fps, CALM);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: PHH * 0.095, textAlign: "center", fontFamily: SORA,
      fontWeight: 700, fontSize: 18.5, lineHeight: 1.16, color: "#fff", letterSpacing: -0.3,
      textShadow: "0 1px 2px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.35)", opacity: clamp(k * 1.6),
      transform: `translateY(${lerp(-12, 0, k)}px) scale(${lerp(1.1, 1, k)})` }}>
      <div>{lines[0]}</div><div>{lines[1]}</div>
    </div>
  );
};

const Grid: React.FC<{ t: number; fps: number; b: RollBeats; assets: string[]; lift: number }> = ({ t, fps, b, assets, lift }) => {
  const s = scrollAt(t, b);
  const v = s - scrollAt(t - 1000 / fps / 2, b); // px travelled in half a frame (180-degree shutter)
  const blur = Math.min(16, Math.abs(v) * 0.5);
  const enter = sp(t, b.so, fps, CALM);
  const gone = ease((t - (b.five - 250)) / 450);
  if (gone >= 1) return null;
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < 25; i++) {
    const x = (i % 5) * P, y = Y0 + Math.floor(i / 5) * P - s;
    if (y > 620 || y < -T) continue;
    tiles.push(
      <div key={i} style={{ position: "absolute", left: x, top: y, width: T, height: T, overflow: "hidden", background: "#1a1a1a" }}>
        {i !== TAKE && <Img src={staticFile(pick(assets, `R-roll-${String(i).padStart(2, "0")}.jpg`))}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {i === TAKE && lift <= 0 && <Clip src={pick(assets, "R-take.mp4")} startMs={b.so} fps={fps} style={{ objectPosition: "50% 30%" }} />}
        {DUR[i] && (
          <div style={{ position: "absolute", right: 8, bottom: 6, fontFamily: UI, fontWeight: 600, fontSize: 17, color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{DUR[i]}</div>
        )}
      </div>,
    );
  }
  return (
    <div style={{ position: "absolute", left: PX, top: 0, width: PW, height: 614, overflow: "hidden", background: "#000",
      boxShadow: "0 24px 60px rgba(0,0,0,0.55)", opacity: 1 - gone,
      transform: `translateY(${lerp(34, 0, enter) + 40 * gone}px) scale(${1 - 0.05 * lift - 0.03 * gone})`,
      filter: `brightness(${1 - 0.62 * lift})${lift > 0 ? ` blur(${(2.2 * lift).toFixed(2)}px)` : ""}` }}>
      {blur > 0.4 && <BlurDef id={`rroll-${Math.round(t)}`} x={0} y={blur} />}
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.4 ? `url(#rroll-${Math.round(t)})` : undefined }}>{tiles}</div>
      {/* the Photos header over the grid */}
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 96,
        background: "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 100%)" }} />
      <div style={{ position: "absolute", left: 22, top: 12, fontFamily: UI, fontWeight: 800, fontSize: 38, color: "#fff",
        letterSpacing: -0.6 }}>Recents</div>
      <div style={{ position: "absolute", right: 20, top: 18, padding: "6px 18px", borderRadius: 99,
        background: "rgba(120,120,128,0.45)", fontFamily: UI, fontWeight: 600, fontSize: 21, color: "#fff" }}>Select</div>
    </div>
  );
};

// one phone of the fan: i = 0..4 (2 = the lifted take itself)
const FanPhone: React.FC<{ i: number; t: number; fps: number; b: RollBeats; assets: string[]; lift: number }> = (
  { i, t, fps, b, assets, lift }) => {
  const order = [0, 1, -1, 2, 3][i];
  const d = i === 2 ? 1 : sp(t, b.five + order * 65, fps, HEAVY);
  if (i !== 2 && d <= 0) return null;
  // the lifted tile: from its grid square to the centre phone, a swell toward the camera on the way
  const tile = { x: PX + (TAKE % 5) * P, y: Y0 + Math.floor(TAKE / 5) * P - SCROLL, w: T, h: T };
  let x = PCX - PHW / 2, y = PCY - PHH / 2, w = PHW, h = PHH, rot = 0, sc = 1, air = 0;
  if (i === 2) {
    x = lerp(tile.x, x, lift); y = lerp(tile.y, y, lift); w = lerp(tile.w, w, lift); h = lerp(tile.h, h, lift);
    const swell = Math.sin(Math.PI * clamp(lift));
    sc = 1 + 0.13 * swell; air = Math.max(0.55 * clamp(lift * 3), swell);
    air = lerp(air, 0.28, clamp((t - (b.one + 600)) / 400));
  } else {
    const a = ((i - 2) * STEP * d * Math.PI) / 180;
    const cx = PCX + R * Math.sin(a), cy = PCY + R - R * Math.cos(a);
    x = cx - PHW / 2; y = cy - PHH / 2; rot = (i - 2) * STEP * d;
    const fly = Math.sin(Math.PI * clamp(d));
    sc = 1 + 0.045 * fly; air = 0.28 + 0.5 * fly;
  }
  const bezel = i === 2 ? clamp((lift - 0.45) / 0.45) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, zIndex: 10 - Math.abs(i - 2),
      transform: `rotate(${rot}deg) scale(${sc})`, transformOrigin: "50% 50%" }}>
      <PhoneBody w={w} h={h} bezel={bezel} shadow={liftShadow(air)}>
        <Clip src={pick(assets, "R-take.mp4")} startMs={b.so} fps={fps} style={{ objectPosition: "50% 30%" }} />
        <Title lines={HOOKS[i]} t={t} at={b.different + i * 62} fps={fps} />
      </PhoneBody>
    </div>
  );
};

export const RollToHooks: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<RollBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: RollBeats = { ...RB, ...beats };
  const lift = sp(t, b.one, fps, GLIDE);
  const ex = exitOf(t, toMs);
  const push = 1 + 0.025 * ease((t - (b.hooks + 250)) / (toMs - b.hooks - 250));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${push * ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      <Grid t={t} fps={fps} b={b} assets={assets} lift={lift} />
      {lift > 0 && [0, 1, 3, 4, 2].map((i) => <FanPhone key={i} i={i} t={t} fps={fps} b={b} assets={assets} lift={lift} />)}
    </div>
  );
};
