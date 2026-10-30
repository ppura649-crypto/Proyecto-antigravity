import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { ACCENT, BAR_GREY, INK, MUTED, MONO_FONT, label } from "./theme";

// A real editor's timeline for THIS take: a V1 filmstrip whose cells are the 24
// clips that survived cuts.json (each showing its own real frame from source.mov)
// laid out on the raw 7:15 axis, an A1 waveform from levels.txt under it, and a
// playhead. Then the edit is performed: the dead air between clips is selected,
// ripple-deleted, and the sequence zooms to fit at 0:59. Nothing here is drawn
// from imagination, every block and every bar is a measurement of the video.
export type TlClip = { inMs: number; outMs: number; cum: number; thumb: string };
export type TimelineData = {
  file: string;
  rawMs: number;
  cutMs: number;
  clips: TlClip[];
  raw?: boolean; // the untouched take: one continuous strip, no cut marks
  bars: number[]; // levels.txt downsampled
  packed: number[]; // per bar: its ms on the CUT timeline, -1 when it is dead air
  note: string;
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const Timeline: React.FC<{
  tMs: number;
  w: number;
  h: number;
  fromMs: number;
  toMs: number;
  data: TimelineData;
  beats: { select: number; collapse: number; fit: number; note: number };
}> = ({ tMs, w, h, fromMs, toMs, data, beats }) => {
  const { clips, bars, packed, rawMs, cutMs } = data;
  const P = Math.round(w * 0.030);
  const gutter = Math.round(w * 0.045);
  const W = w - 2 * P - gutter;

  const headH = Math.round(w * 0.036);
  const noteH = Math.round(w * 0.034);
  const inner = h - 2 * P - headH - noteH - Math.round(w * 0.048);
  const vH = Math.round(inner * 0.70);
  const aH = inner - vH - Math.round(w * 0.010);

  const ease = { easing: Easing.bezier(0.3, 0, 0.1, 1), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const cp = interpolate(tMs, [beats.collapse, beats.collapse + 620], [0, 1], ease);
  const fp = interpolate(tMs, [beats.fit, beats.fit + 560], [0, 1], ease);
  const sel = interpolate(tMs, [beats.select, beats.select + 140, beats.collapse + 180], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const noteOp = interpolate(tMs, [beats.note, beats.note + 220], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // the sequence is read at the raw scale, packed at the raw scale, then fitted
  const xr = (ms: number) => (ms / rawMs) * W;
  const xf = (ms: number) => (ms / cutMs) * W;
  const place = (rawStart: number, cutStart: number, durMs: number) => {
    const a = interpolate(cp, [0, 1], [xr(rawStart), xr(cutStart)]);
    return {
      x: interpolate(fp, [0, 1], [a, xf(cutStart)]),
      w: interpolate(fp, [0, 1], [xr(durMs), xf(durMs)]),
    };
  };

  const readout = mmss(interpolate(cp, [0, 1], [rawMs, cutMs]));

  // the dead air between the kept clips: what the edit removes
  const gaps: { at: number; ms: number }[] = [];
  let prev = 0;
  for (const c of clips) {
    if (c.inMs > prev) gaps.push({ at: prev, ms: c.inMs - prev });
    prev = c.outMs;
  }
  if (rawMs > prev) gaps.push({ at: prev, ms: rawMs - prev });

  const N = bars.length;
  const barMs = rawMs / N;

  // playhead: it plays the raw sequence in, then plays the finished cut out
  const pre = interpolate(tMs, [fromMs, beats.select], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // a raw-take pass parks collapse/fit past the event, so there is no second play
  const postFrom = beats.fit + 560;
  const post = postFrom < toMs
    ? interpolate(tMs, [postFrom, toMs], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const playing = tMs < beats.select || tMs > beats.fit + 560;
  const headX = (tMs < beats.select ? pre : post) * W;

  const track: React.CSSProperties = { position: "absolute", left: gutter, right: 0, overflow: "hidden" };

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
      <div style={{ height: headH, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: MONO_FONT, fontSize: headH * 0.60, color: MUTED }}>{data.file}</span>
        <span style={{ fontFamily: MONO_FONT, fontSize: headH * 0.80, fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{readout}</span>
      </div>

      <div style={{ position: "relative", height: inner, marginTop: Math.round(w * 0.024) }}>
        {/* V1 */}
        <div style={{ ...track, top: 0, height: vH, background: "rgba(255,255,255,0.05)" }}>
          {!data.raw && gaps.map((g, i) => {
            const pl = place(g.at, g.at, g.ms);
            const op = Math.max(0, 1 - cp * 2.4);
            if (op <= 0.01) return null;
            return (
              <div key={`g${i}`} style={{ position: "absolute", left: pl.x, top: 0, width: Math.max(1, xr(g.ms)), height: vH, background: sel > 0 ? ACCENT : BAR_GREY, opacity: op * (sel > 0 ? 0.30 + 0.35 * sel : 0.55) }} />
            );
          })}
          {(data.raw ? clips.map((c, i) => ({ ...c, inMs: (i * rawMs) / clips.length, outMs: ((i + 1) * rawMs) / clips.length, cum: (i * rawMs) / clips.length })) : clips).map((c) => {
            const pl = place(c.inMs, c.cum, c.outMs - c.inMs);
            return (
              <div key={c.thumb} style={{ position: "absolute", left: pl.x, top: 0, width: Math.max(1.5, pl.w - 1), height: vH, overflow: "hidden", background: "#111" }}>
                <Img src={staticFile(c.thumb)} style={{ position: "absolute", left: "50%", top: 0, height: vH, transform: "translateX(-50%)", maxWidth: "none" }} />
              </div>
            );
          })}
        </div>

        {/* A1 */}
        <div style={{ ...track, top: vH + Math.round(w * 0.010), height: aH, background: "rgba(255,255,255,0.05)" }}>
          {bars.map((v, i) => {
            const keep = data.raw ? true : packed[i] >= 0;
            const pl = keep && !data.raw ? place(i * barMs, packed[i], barMs) : { x: xr(i * barMs), w: xr(barMs) };
            const op = keep ? 1 : Math.max(0, 1 - cp * 2.4);
            if (op <= 0.01) return null;
            const bh = Math.max(2, v * aH * 0.90);
            return (
              <div key={i} style={{ position: "absolute", left: pl.x, top: (aH - bh) / 2, width: Math.max(1, pl.w * 0.72), height: bh, background: data.raw ? "rgba(255,255,255,0.55)" : keep ? ACCENT : BAR_GREY, opacity: op }} />
            );
          })}
        </div>

        {/* track heads, the way an NLE labels its lanes */}
        <div style={{ position: "absolute", left: 0, top: 0, width: gutter, height: vH, display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: MONO_FONT, fontSize: headH * 0.52, color: MUTED }}>V1</span>
        </div>
        <div style={{ position: "absolute", left: 0, top: vH + Math.round(w * 0.010), width: gutter, height: aH, display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: MONO_FONT, fontSize: headH * 0.52, color: MUTED }}>A1</span>
        </div>

        {playing && (
          <div style={{ position: "absolute", left: gutter + headX, top: -Math.round(w * 0.008), width: 2, height: inner + Math.round(w * 0.016), background: INK }} />
        )}
      </div>

      <div style={{ height: noteH, marginTop: Math.round(w * 0.024), display: "flex", alignItems: "center", opacity: noteOp }}>
        <span style={{ ...label(noteH * 0.60, INK) }}>{data.note}</span>
      </div>
    </div>
  );
};
