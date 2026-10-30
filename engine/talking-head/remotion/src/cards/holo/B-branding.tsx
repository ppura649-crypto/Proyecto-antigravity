import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CHIP, HOLO_FONT, INK2, SHADOW, lerp, sp } from "./B-kit";
// B3 + B4 (one page, two events chained by `callback`): Holo's "Branding overview" redrawn at its own
// geometry, type and colours (read from url-drop 6.8 s and 8.1-8.9 s at 4K). Mission is left out (two typos).
// v2 round 2 (their "changing too quickly"): ONE surface that GROWS and never swaps. The page enters with its
// Competitors section, the chips arriving filled on COMPETITORS; on LOOKS the Brand colors + Brand logo row
// joins under it; on SOUNDS the Personality + Key Styles row joins. Every section arrives already filled (no
// grey slots), the page grows from its centre, and all three rows stay together until the hand-over.
const SWATCH = ["#1A4336", "#E3F8DA", "#101010", "#F3F3F3"];
const COMPETITORS = ["Ordinary", "Mamaearth", "Versed", "Supergoop!"];
const PAD = 36, GAP = 18, HEAD = 84, H_COMP = 150, H_LOOK = 172, H_VOICE = 186, FOOT = 24;
const FULL = HEAD + H_COMP + GAP + H_LOOK + GAP + H_VOICE + FOOT; // 652

const sub = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 0, background: "#FFFFFF",
  boxShadow: "0 2px 14px rgba(0,0,0,0.07)", border: "1.5px solid #F0F0F0", boxSizing: "border-box",
});
const title: React.CSSProperties = { position: "absolute", left: 28, top: 20, fontSize: 34, fontWeight: 600, color: INK2 };
const pill = (w: number): React.CSSProperties => ({
  width: w, height: 50, borderRadius: 25, background: CHIP, display: "flex", alignItems: "center",
  justifyContent: "space-between", padding: "0 24px", boxSizing: "border-box", fontSize: 27, fontWeight: 500, color: "#333",
});
// a section joining the page: rises 26 px and fades in, done in ~300 ms (calm spring, no overshoot)
const join = (tMs: number, at: number, fps: number): React.CSSProperties => {
  const e = sp(tMs, at, fps);
  return { transform: `translateY(${(1 - e) * 26}px)`, opacity: Math.min(1, e * 1.8) };
};

const Competitors: React.FC<{ tMs: number; fps: number; at: number; cw: number }> = ({ tMs, fps, at, cw }) => (
  <div style={sub(0, 0, cw, H_COMP)}>
    <div style={title}>Competitors</div>
    <div style={{ position: "absolute", left: 26, top: 76, display: "flex", gap: 14 }}>
      {COMPETITORS.map((c, i) => {
        const e = sp(tMs, at + i * 70, fps);
        return (
          <div key={c} style={{
            height: 54, lineHeight: "54px", padding: "0 24px", borderRadius: 999, background: CHIP, fontSize: 29, fontWeight: 500,
            color: "#2A2A2A", transform: `translateY(${(1 - e) * 10}px) scale(${0.9 + 0.1 * e})`, opacity: Math.min(1, e * 1.8),
          }}>{c}</div>
        );
      })}
    </div>
  </div>
);

const Looks: React.FC<{ cw: number; logo: string }> = ({ cw, logo }) => (
  <>
    <div style={sub(0, 0, cw, H_LOOK)}>
      <div style={title}>Brand colors</div>
      <div style={{ position: "absolute", left: 28, top: 76, display: "flex", gap: 18 }}>
        {SWATCH.map((c) => (
          <div key={c} style={{ width: 76, height: 76, borderRadius: 16, background: c, boxShadow: c === "#F3F3F3" ? "inset 0 0 0 1.5px #E2E2E2" : undefined }} />
        ))}
      </div>
    </div>
    <div style={sub(cw + GAP, 0, cw, H_LOOK)}>
      <div style={title}>Brand logo</div>
      <div style={{ position: "absolute", left: 28, top: 72, width: cw - 56, height: 84, borderRadius: 20, border: "2px solid #E4E4E4", boxSizing: "border-box", background: "#FAFAFA", overflow: "hidden" }}>
        <Img src={staticFile(logo)} style={{ position: "absolute", left: 0, top: (84 - ((cw - 56) * 250) / 980) / 2 - 2, width: cw - 56, height: ((cw - 56) * 250) / 980 }} />
      </div>
    </div>
  </>
);

const Voice: React.FC<{ cw: number }> = ({ cw }) => {
  const card = (x: number, name: string, rs: string[][]) => (
    <div style={sub(x, 0, cw, H_VOICE)}>
      <div style={title}>{name}</div>
      <div style={{ position: "absolute", left: 22, top: 72, display: "flex", flexDirection: "column", gap: 10 }}>
        {rs.map(([a, b]) => <div key={a} style={pill(cw - 44)}><span>{a}</span><span>{b}</span></div>)}
      </div>
    </div>
  );
  return <>{card(0, "Personality", [["Quirky", ""], ["Precise", ""]])}{card(cw + GAP, "Key Styles", [["Style", "Conversational"], ["Formality", "Semi-formal"]])}</>;
};

export const Branding: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const enter = data?.enterMs ?? 9333, exit = data?.exitMs ?? 12100;
  const looks = (beats.looks ?? 11073) - 60, sounds = (beats.sounds ?? 11613) - 60;
  const s = Math.min(1, (h - 4) / FULL);
  const W = Math.min(w - 60, 1020) / s;
  const cw = (W - 2 * PAD - GAP) / 2;
  // the page's height grows as each row joins (eased with the row's own rise), centred in the band
  const gL = lerp(tMs, looks, looks + 220, 0, 1, Easing.out(Easing.cubic));
  const gS = lerp(tMs, sounds, sounds + 220, 0, 1, Easing.out(Easing.cubic));
  const H = HEAD + H_COMP + FOOT + (GAP + H_LOOK) * gL + (GAP + H_VOICE) * gS;
  const e = sp(tMs, enter, fps);
  const ex = lerp(tMs, exit - 120, exit, 0, 1, Easing.in(Easing.cubic));
  const push = lerp(tMs, enter, exit, 1, 1.015, Easing.linear);
  const yLook = HEAD + H_COMP + GAP, yVoice = yLook + H_LOOK + GAP;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: HOLO_FONT }}>
      <div style={{
        position: "absolute", left: (w - W * s) / 2, top: (h - H * s) / 2, width: W, height: H, borderRadius: 0, overflow: "hidden",
        background: "#FFFFFF", boxShadow: SHADOW, opacity: Math.min(1, e * 1.8) * (1 - ex), transformOrigin: "0 0",
        transform: `scale(${s}) translateY(${(1 - e) * 24}px)`,
      }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `scale(${push * (1 - 0.02 * ex)})` }}>
          <div style={{ position: "absolute", left: PAD, top: 22, fontSize: 44, fontWeight: 600, color: INK2, letterSpacing: -0.5 }}>Branding overview</div>
          <div style={{ position: "absolute", left: PAD, top: HEAD }}>
            <Competitors tMs={tMs} fps={fps} at={enter + 40} cw={W - 2 * PAD} />
          </div>
          {tMs >= looks && <div style={{ position: "absolute", left: PAD, top: yLook, ...join(tMs, looks, fps) }}><Looks cw={cw} logo={assets[0]!} /></div>}
          {tMs >= sounds && <div style={{ position: "absolute", left: PAD, top: yVoice, ...join(tMs, sounds, fps) }}><Voice cw={cw} /></div>}
        </div>
      </div>
    </div>
  );
};
