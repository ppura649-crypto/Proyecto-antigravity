import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// The three packs, each drawn as the thing it makes: variations fanning out of
// one clip, a talking head wearing its caption and its card, and a strip cut on
// the beat. Names and commands come from ~/frame/AGENTS.md.
export type Pack = { name: string; cmd: string; art: string; imgs: string[] };

const F: React.CSSProperties = { position: "absolute", background: "#2a2a31", border: "2px solid rgba(255,255,255,0.38)" };

const Art: React.FC<{ art: string; w: number; h: number; p: number; imgs: string[] }> = ({ art, w, h, p, imgs }) => {
  const fh = h;
  const fw = Math.round(fh * 9 / 16);
  const cx = w / 2 - fw / 2;
  const shot = (src: string, st: React.CSSProperties) => (
    <div style={{ ...F, ...st, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );

  if (art === "variants") {
    // three real frames of their own timelapse, fanning out of one another
    const off = interpolate(p, [0.15, 1], [0, w * 0.26], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rot = interpolate(p, [0.15, 1], [0, 13], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: w, height: h }}>
        {[-1, 1].map((s, i) => (
          <React.Fragment key={s}>
            {shot(imgs[i], { position: "absolute", left: cx + s * off, top: h * 0.07, width: fw * 0.92, height: fh * 0.86, transform: `rotate(${s * rot}deg)` })}
          </React.Fragment>
        ))}
        {shot(imgs[2], { position: "absolute", left: cx, top: 0, width: fw, height: fh, borderColor: ACCENT })}
      </div>
    );
  }

  if (art === "head") {
    // this very reel, wearing its caption and its card
    const k = interpolate(p, [0, 1], [1.0, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: w, height: h }}>
        <div style={{ ...F, position: "absolute", left: cx, top: 0, width: fw, height: fh, overflow: "hidden" }}>
          <Img src={staticFile(imgs[0])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${k})` }} />
        </div>
      </div>
    );
  }

  // "cuts": their montage reel, with the beat under it and the playhead running
  const play = interpolate(p, [0.2, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticks = 5;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {shot(imgs[0], { position: "absolute", left: cx, top: 0, width: fw, height: fh * 0.86 })}
      {Array.from({ length: ticks }).map((_, i) => {
        const a = interpolate(p, [0.12 + i * 0.13, 0.26 + i * 0.13], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={i} style={{ position: "absolute", left: cx + (fw / (ticks + 1)) * (i + 1) - 2, top: h * 0.90, width: 4, height: h * 0.10 * a, background: ACCENT }} />;
      })}
      <div style={{ position: "absolute", left: cx + play * fw, top: 0, width: 2, height: fh * 0.86, background: ACCENT, opacity: play > 0 && play < 1 ? 1 : 0 }} />
    </div>
  );
};

export const Packs: React.FC<{
  tMs: number; w: number; h: number;
  packs: Pack[]; live: string;
  beats: { panels: number; per?: number; live: number };
}> = ({ tMs, w, h, packs, live, beats }) => {
  const P = Math.round(w * 0.030);
  const per = beats.per ?? 300;
  const gap = Math.round(w * 0.026);
  const pw = Math.floor((w - 2 * P - gap * (packs.length - 1)) / packs.length);
  const gH = Math.round(h * 0.55);
  const top = Math.round(h * 0.045);
  const nameFs = Math.round(h * 0.062);
  const cmdFs = Math.round(h * 0.050);
  const lp = interpolate(tMs, [beats.live, beats.live + 240], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {packs.map((pk, i) => {
        const at = beats.panels + i * per;
        const a = interpolate(tMs, [at, at + 220], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const p = interpolate(tMs, [at + 120, at + 900], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={pk.name} style={{
            position: "absolute", left: P + i * (pw + gap), top, width: pw,
            opacity: a, transform: `translateY(${(1 - a) * 16}px)`,
          }}>
            <Art art={pk.art} w={pw} h={gH} p={p} imgs={pk.imgs} />
            <div style={{ marginTop: Math.round(h * 0.030), width: pw, textAlign: "center", ...label(nameFs, INK), whiteSpace: "nowrap" }}>{pk.name}</div>
            <div style={{ marginTop: Math.round(h * 0.020), width: pw, textAlign: "center", fontFamily: MONO_FONT, fontSize: cmdFs, color: MUTED }}>{pk.cmd}</div>
          </div>
        );
      })}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: Math.round(h * 0.045), textAlign: "center",
        opacity: lp, transform: `translateY(${(1 - lp) * 8}px)`,
      }}>
        <span style={{ ...label(Math.round(h * 0.082), ACCENT) }}>{live}</span>
      </div>
    </div>
  );
};
