import React from "react";
import { Img, interpolate, spring, staticFile, Easing } from "remotion";
import { ACCENT, LABEL_FONT, MONO_FONT } from "./theme";
import { RAW_MS, CUT_MS, SPANS, BARS, PACKED, CAPS, CAP_WORD, CARDS, FRAMES } from "./NleData";
import { Chip, Ruler, Head, Lane } from "./NleParts";
import type { CardProps } from "./props";

// V9. "AI could completely do the editing. Whether it's the layout, the timing,
// the captions, or the visuals to support the video." So the card is an editor,
// and the sequence in it is THIS take. Every block is a measurement of the video
// you are watching: the raw 5:10.8 laid out whole on V1 as a filmstrip of its own
// real frames, its own waveform on A1, the 25 clips that survived and the 34 s of
// dead air that did not, the 235 real caption pages, the 16 cards of this plan.
// The edit is then performed on screen: the removed material lights red, the
// keepers ripple left and the readout counts 05:10.8 down to 01:04.9.

export type NleData = {
  title: string; rawS: number; cutS: number; clips: number; pages: number;
  captionWord: string; settings: string;
};

const PANEL = "#141417", BAR = "#232329", LANE = "#1D1D21";
const TXT = "#E8E8EC", RED = "rgba(214,46,46,0.42)", RED_LINE = "#EF3A31";
const AUD = "#77A085", AUD_LANE = "#1A201C", CAPC = "#5C7EA6", CAP_LANE = "#1B1F26";

const cl = (v: number) => Math.max(0, Math.min(1, v));
const EASE = { easing: Easing.bezier(0.28, 0, 0.1, 1), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const tc = (ms: number) => {
  const t = Math.max(0, Math.round(ms / 100) * 100);   // the tenth the plan names: 05:10.8 and 01:04.9
  return `${String(Math.floor(t / 60000)).padStart(2, "0")}:${String(Math.floor((t % 60000) / 1000)).padStart(2, "0")}.${Math.floor((t % 1000) / 100)}`;
};

// the removed material, merged into the ranges an editor would select in one drag
const CUTAWAY: number[][] = (() => {
  const out: number[][] = [];
  for (const [a, d, keep, cum] of SPANS) {
    if (keep) continue;
    const last = out[out.length - 1];
    if (last && last[0] + last[1] === a) last[1] += d;
    else out.push([a, d, cum]);
  }
  return out;
})();

export const Nle: React.FC<CardProps & { data: NleData }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets, data }) => {
  const k = w / 1037, ky = h / 576;
  const src = (i: number) => staticFile(assets[0] ? assets[0].replace(/[^/]+$/, FRAMES[i]) : FRAMES[i]);

  const PADX = 26 * k, HEAD = 110 * ky, RUL_T = 120 * ky, RUL_H = 32 * ky;
  const TX = PADX + 104 * k;                 // where the tracks start, right of the headers
  const W = w - TX - PADX;
  // V1 and A1 sit straight under the ruler until a second video track is inserted
  // above them on "the visuals", and the stack takes the step down an editor sees
  const v2P = interpolate(tMs, [beats.visuals ?? fromMs + 4570, (beats.visuals ?? fromMs + 4570) + 220], [0, 1], EASE);
  const step = v2P * 62 * ky;
  const V2 = { t: 158 * ky, h: 58 * ky }, V1 = { t: 158 * ky + step, h: 144 * ky };
  const A1 = { t: 306 * ky + step, h: 100 * ky }, C1 = { t: 410 * ky + step, h: 76 * ky };

  const B = {
    ai: beats.ai ?? fromMs, could: beats.could ?? fromMs + 360, layout: beats.layout ?? fromMs + 2360,
    timing: beats.timing ?? fromMs + 2960, captions: beats.captions ?? fromMs + 3560,
    visuals: beats.visuals ?? fromMs + 4570, support: beats.support ?? fromMs + 5140,
    video: beats.video ?? fromMs + 5590,
  };
  const RED_MS = 130, RIP_MS = 460;
  const ripFrom = B.timing + RED_MS;

  // the ripple delete, in the two moves an editor sees: the removed material
  // closes up and the keepers pack left to a fifth of the track (cp), then the
  // sequence zooms to fit its new length (fp)
  const cp = interpolate(tMs, [ripFrom, ripFrom + 270], [0, 1], EASE);
  const fp = interpolate(tMs, [ripFrom + 260, ripFrom + RIP_MS], [0, 1], EASE);
  const xr = (ms: number) => (ms / RAW_MS) * W;
  const xc = (ms: number) => (ms / CUT_MS) * W;
  const place = (a: number, dur: number, cum: number, keep: boolean) => {
    const packed = interpolate(cp, [0, 1], [xr(a), xr(cum)]);
    const wide = interpolate(cp, [0, 1], [xr(dur), keep ? xr(dur) : 0]);
    return {
      x: interpolate(fp, [0, 1], [packed, xc(cum)]),
      w: interpolate(fp, [0, 1], [wide, keep ? xc(dur) : 0]),
    };
  };
  // the playhead stands on the sequence end, so it rides the collapse and the zoom
  const endX = interpolate(fp, [0, 1], [interpolate(cp, [0, 1], [W, xr(CUT_MS)]), W]);

  // the playhead: it plays the raw take in, parks on the end while the cut is made,
  // scrubs back to the caption it is checking, then rewinds and plays the finished cut
  const scrubX = xc(CAPS[CAP_WORD][0]);
  const ph = tMs < B.could ? 0
    : tMs < B.timing ? interpolate(tMs, [B.could, B.could + 840], [0, W], CLAMP)
    : tMs < B.captions ? endX
    : tMs < B.support ? interpolate(tMs, [B.captions + 260, B.captions + 540], [W, scrubX], EASE)
    : tMs < B.support + 180 ? interpolate(tMs, [B.support, B.support + 180], [scrubX, 0], EASE)
    : interpolate(tMs, [B.support + 180, toMs], [0, W], CLAMP);
  const readout = tMs < B.timing + RED_MS ? (ph / W) * RAW_MS
    : tMs < ripFrom + RIP_MS ? interpolate(cp, [0, 1], [RAW_MS, CUT_MS])
    : (ph / W) * CUT_MS;

  // the pop: the panel arrives whole, the media renders into it left to right
  const loadV = interpolate(tMs, [fromMs, fromMs + 180], [0, 1], CLAMP);
  const loadA = interpolate(tMs, [fromMs + 40, fromMs + 220], [0, 1], CLAMP);
  const wipe = (p: number, x: number) => cl((p * (W + 90) - x) / 70);

  const redOn = interpolate(tMs, [B.timing, B.timing + 80], [0, 1], CLAMP);
  const gone = 1 - cl(cp * 2.6);

  const capLand = spring({ frame: ((tMs - B.captions) / 1000) * fps, fps, config: { damping: 15, stiffness: 320, mass: 0.7 } });
  const capFill = interpolate(tMs, [B.captions + 120, B.captions + 820], [0, 1], CLAMP);
  const mag = interpolate(tMs, [B.captions + 540, B.captions + 740], [0, 1], EASE);
  const nod = interpolate(tMs, [B.video, B.video + 150, B.video + 420], [0, 6, 0], CLAMP);

  const tile = 96 * ky;
  const lane = (t: number, hh: number, bg: string): React.CSSProperties =>
    ({ position: "absolute", left: TX, top: t, width: W, height: hh, background: bg, overflow: "hidden" });

  return (
    <div style={{ position: "absolute", inset: 0, background: PANEL, overflow: "hidden" }}>
      {/* the sequence head: its name, its settings, its readout, and the editor */}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: HEAD, background: BAR, borderBottom: `1px solid #0C0C0F` }} />
      <div style={{ position: "absolute", left: PADX, top: 0, height: HEAD, display: "flex", alignItems: "center", gap: 30 * k }}>
        <span style={{ fontFamily: LABEL_FONT, fontSize: 30 * k, letterSpacing: "0.10em", color: TXT, fontWeight: 700 }}>{data.title}</span>
        <Chip k={k} ky={ky} text={data.settings} tMs={tMs} at={B.layout} />
      </div>
      <div style={{ position: "absolute", right: PADX + tile * 1.08 + 30 * k, top: 0, height: HEAD, display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: MONO_FONT, fontSize: 40 * k, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          color: tMs < B.timing + RED_MS ? TXT : ACCENT }}>{tc(readout)}</span>
      </div>
      <div style={{ position: "absolute", right: PADX, top: (HEAD - tile) / 2, width: tile * 1.08, height: tile,
        background: "#EDEAE3", display: "flex", alignItems: "center", justifyContent: "center",
        transform: `rotate(${nod}deg)`, transformOrigin: "50% 100%" }}>
        <Img src={staticFile(assets[0])} style={{ height: 74 * ky, width: "auto", maxWidth: "none" }} />
      </div>

      <Ruler x={TX} w={W} top={RUL_T} h={RUL_H} k={k} totalMs={interpolate(fp, [0, 1], [RAW_MS, CUT_MS])}
        fade={interpolate(fp, [0.1, 0.34, 0.66, 0.9], [1, 0.12, 0.12, 1], CLAMP)} />

      {/* the lanes. V2 and C1 do not exist until the creator names them */}
      <Lane on={v2P} dy={-16 * ky} style={lane(V2.t, V2.h, LANE)}>
        {CARDS.map(([a, b], i) => {
          const p = cl((tMs - (B.visuals + 90 + i * 22)) / 110);
          const cx = xc(a), cw = Math.max(3, xc(b) - cx - 2 * k);
          const live = tMs > B.support + 180 && ph >= cx && ph <= cx + cw;
          return <div key={a} style={{ position: "absolute", left: cx, top: (V2.h - 42 * ky) / 2, width: cw, height: 42 * ky,
            background: ACCENT, opacity: p * (live ? 1 : 0.86), transform: `scaleY(${0.3 + 0.7 * p})` }} />;
        })}
      </Lane>

      <div style={lane(V1.t, V1.h, "#0E0E10")}>
        {SPANS.map(([a, d, keep, cum, fi], i) => {
          const pl = place(a, d, cum, !!keep);
          const op = (keep ? 1 : gone) * wipe(loadV, pl.x);
          if (op <= 0.02 || pl.w < 0.15) return null;
          return (
            <div key={i} style={{ position: "absolute", left: pl.x, top: 0, width: pl.w, height: V1.h, overflow: "hidden", opacity: op, background: "#0B0B0D" }}>
              <Img src={src(fi)} style={{ position: "absolute", left: "50%", top: 0, height: V1.h, width: "auto", maxWidth: "none", transform: "translateX(-50%)" }} />
              {keep ? <div style={{ position: "absolute", right: 0, top: 0, width: 1, height: V1.h, background: "#000", opacity: cp }} /> : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 8 * k, top: 8 * ky, padding: `${3 * ky}px ${9 * k}px`, background: "rgba(8,8,10,0.74)",
          fontFamily: MONO_FONT, fontSize: 26 * k, color: TXT, opacity: (1 - cl(cp * 3)) * cl((tMs - fromMs - 160) / 160) }}>source.mov</div>
      </div>

      <div style={lane(A1.t, A1.h, AUD_LANE)}>
        {BARS.map((v, i) => {
          const barMs = RAW_MS / BARS.length, keep = PACKED[i] >= 0;
          const pl = place(i * barMs, barMs, keep ? PACKED[i] : 0, keep);
          const op = (keep ? 1 : gone) * wipe(loadA, pl.x);
          if (op <= 0.02) return null;
          const bh = Math.max(2 * ky, v * A1.h * 0.92);
          return <div key={i} style={{ position: "absolute", left: pl.x, top: (A1.h - bh) / 2, width: Math.max(0.8, pl.w * (keep ? 0.76 : 1)), height: bh, background: AUD, opacity: op }} />;
        })}
      </div>

      {/* the material the edit throws away: selected across both tracks, then gone */}
      {redOn > 0.01 && CUTAWAY.map(([a, d, cum], i) => {
        const pl = place(a, d, cum, false);
        if (pl.w < 0.4) return null;
        return <div key={i} style={{ position: "absolute", left: TX + pl.x, top: V1.t, width: pl.w, height: A1.t + A1.h - V1.t,
          background: RED, opacity: redOn * gone, boxShadow: `inset 0 0 0 ${2 * k}px ${RED_LINE}` }} />;
      })}

      <Lane on={capLand} dy={18 * ky} style={lane(C1.t, C1.h, CAP_LANE)}>
        {CAPS.map(([a, d], i) => {
          if (i === CAP_WORD) return null;
          const cx = xc(a);
          return <div key={i} style={{ position: "absolute", left: cx, top: (C1.h - 24 * ky) / 2, width: Math.max(2, xc(d) - 1), height: 24 * ky,
            background: CAPC, opacity: wipe(capFill, cx) * 0.92 }} />;
        })}
        {(() => {
          const bw = 160 * k, bh = 24 * ky + mag * 34 * ky;
          const cx = xc(CAPS[CAP_WORD][0]);
          const ww = Math.max(2, xc(CAPS[CAP_WORD][1]) - 1) + mag * (bw - 2);
          return (
            <div style={{ position: "absolute", left: cx - mag * (bw - 2) / 2, top: (C1.h - bh) / 2, width: ww, height: bh,
              background: CAPC, opacity: wipe(capFill, cx), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <span style={{ fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 30 * k, letterSpacing: "0.04em", color: "#fff", opacity: mag, whiteSpace: "nowrap" }}>{data.captionWord}</span>
            </div>
          );
        })()}
      </Lane>

      {/* the track headers, the way an editor labels its lanes */}
      <div style={{ position: "absolute", left: 0, top: HEAD, width: TX - 6 * k, height: h - HEAD, background: "#191919" }} />
      <Head x={PADX} y={V2.t} h={V2.h} k={k} ky={ky} name="V2" on={v2P} dy={-16 * ky} />
      <Head x={PADX} y={V1.t} h={V1.h} k={k} ky={ky} name="V1" on={1} dy={0} />
      <Head x={PADX} y={A1.t} h={A1.h} k={k} ky={ky} name="A1" on={1} dy={0} />
      <Head x={PADX} y={C1.t} h={C1.h} k={k} ky={ky} name="C1" on={capLand} dy={18 * ky} />

      <div style={{ position: "absolute", left: TX + ph - 1.5 * k, top: RUL_T, width: 3 * k, height: C1.t + C1.h - RUL_T, background: "#F2F2F4" }} />
      <div style={{ position: "absolute", left: TX + ph - 9 * k, top: RUL_T, width: 18 * k, height: 12 * ky, background: "#F2F2F4" }} />
    </div>
  );
};

