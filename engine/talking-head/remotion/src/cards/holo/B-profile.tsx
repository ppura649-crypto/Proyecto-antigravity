import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { HOLO_FONT, INK, SHADOW, lerp, sp } from "./B-kit";
// B2 "It picks up what you sell, who is it for" (round 3, their "the three cards look bad, too vibe coded"):
// the brand profile Holo builds from the pasted site, for ONE brand, SKIMS (the hook's kit brand). A white,
// square page: header (SKIMS wordmark, "Brand profile", the yourbrand.com source chip); "What you sell" joins
// with four real SKIMS pieces cropped from the campaign stills (famB-sell-1..4); "Who it's for" joins with
// three portrait faces from the same stills (famB-face-1..3) and three audience chips. The page grows from
// its centre as each section joins (one move at a time), everything arrives filled, and the finished page
// holds before the hand-over to the Branding overview at 9333.
// assets: [wordmark, sell1..4, face1..3]
const PAD = 30, HEAD = 70, T = 48, TILE_H = 226, LABEL = 46, SEC_GAP = 24, ROW = 104;
const H_HEAD = PAD + HEAD + 18;                        // header + rule
const H_SELL = T + TILE_H + LABEL;                     // section 1
const H_WHO = SEC_GAP + T + ROW;                       // section 2
const FULL = H_HEAD + H_SELL + H_WHO + PAD;            // 644
const SELL = ["Halter Onesie", "Knit Dress", "Tank Onesie", "Catsuit"];
const WHO = ["Women 22-40", "Comfort-first", "Shops on Instagram"];

const secTitle: React.CSSProperties = { fontSize: 30, fontWeight: 700, color: INK, letterSpacing: -0.3, height: T, lineHeight: `${T - 10}px` };
const chip: React.CSSProperties = {
  height: 56, lineHeight: "56px", padding: "0 20px", borderRadius: 999, background: "#F2F2F2",
  fontSize: 26, fontWeight: 600, color: "#1E1E1E", whiteSpace: "nowrap",
};
const rise = (e: number, d = 18): React.CSSProperties => ({ transform: `translateY(${(1 - e) * d}px)`, opacity: Math.min(1, e * 1.8) });

const Header: React.FC<{ W: number; mark: string }> = ({ W, mark }) => (
  <div style={{ position: "absolute", left: PAD, top: PAD, width: W - 2 * PAD, height: HEAD, display: "flex", alignItems: "center" }}>
    <Img src={staticFile(mark)} style={{ height: 42, width: (42 * 971) / 223 }} />
    <div style={{ width: 2, height: 40, background: "#E6E6E6", margin: "0 24px" }} />
    <div style={{ fontSize: 32, fontWeight: 600, color: INK }}>Brand profile</div>
    <div style={{ flex: 1 }} />
    <div style={{ ...chip, height: 50, lineHeight: "50px", fontSize: 26, fontWeight: 500, color: "#3A3A3A", display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2.2" strokeLinecap="round">
        <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
      </svg>
      yourbrand.com
    </div>
  </div>
);

const Sell: React.FC<{ tMs: number; fps: number; at: number; W: number; imgs: string[] }> = ({ tMs, fps, at, W, imgs }) => {
  const tw = (W - 2 * PAD - 3 * 16) / 4;
  return (
    <div style={{ position: "absolute", left: PAD, top: H_HEAD, ...rise(sp(tMs, at, fps), 26) }}>
      <div style={secTitle}>What you sell</div>
      <div style={{ display: "flex", gap: 16 }}>
        {SELL.map((name, i) => {
          const e = sp(tMs, at + 40 + i * 60, fps);
          return (
            <div key={name} style={{ width: tw, ...rise(e, 16) }}>
              <div style={{ width: tw, height: TILE_H, overflow: "hidden", background: "#EEE" }}>
                <Img src={staticFile(imgs[i]!)} style={{ width: tw, height: TILE_H, objectFit: "cover" }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: INK, marginTop: 10, whiteSpace: "nowrap" }}>{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Who: React.FC<{ tMs: number; fps: number; at: number; faces: string[] }> = ({ tMs, fps, at, faces }) => (
  <div style={{ position: "absolute", left: PAD, top: H_HEAD + H_SELL + SEC_GAP, ...rise(sp(tMs, at, fps), 26) }}>
    <div style={secTitle}>Who it’s for</div>
    <div style={{ display: "flex", alignItems: "center", height: ROW - 8 }}>
      <div style={{ display: "flex", marginRight: 20 }}>
        {faces.map((f, i) => (
          <div key={f} style={{ width: 92, height: 92, borderRadius: "50%", overflow: "hidden", border: "4px solid #FFF", boxSizing: "border-box", marginLeft: i ? -24 : 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", ...rise(sp(tMs, at + 30 + i * 40, fps), 10) }}>
            <Img src={staticFile(f)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {WHO.map((c, i) => <div key={c} style={{ ...chip, ...rise(sp(tMs, at + 150 + i * 40, fps), 10) }}>{c}</div>)}
      </div>
    </div>
  </div>
);

export const Profile: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const sellAt = (beats.sell ?? 8146) - 420;   // lands on SELL
  const whoAt = Math.min((beats.for ?? 8913) - 580, toMs - 1000); // done ~700 ms before the hand-over
  const s = Math.min(1, (h - 2) / FULL);
  const W = Math.min(w - 60, 1020) / s;
  const g1 = lerp(tMs, sellAt, sellAt + 240, 0, 1, Easing.out(Easing.cubic));
  const g2 = lerp(tMs, whoAt, whoAt + 240, 0, 1, Easing.out(Easing.cubic));
  const H = H_HEAD - 18 + PAD + (H_SELL + 18) * g1 + H_WHO * g2;
  const e = sp(tMs, fromMs, fps);
  const ex = lerp(tMs, toMs - 120, toMs, 0, 1, Easing.in(Easing.cubic));
  const push = lerp(tMs, fromMs, toMs, 1, 1.012, Easing.linear);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: HOLO_FONT }}>
      <div style={{
        position: "absolute", left: (w - W * s) / 2, top: (h - H * s) / 2, width: W, height: H, overflow: "hidden",
        background: "#FFFFFF", boxShadow: SHADOW, transformOrigin: "0 0", opacity: Math.min(1, e * 1.8) * (1 - ex),
        transform: `scale(${s}) translateY(${(1 - e) * 20}px)`,
      }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: `scale(${push * (1 - 0.02 * ex)})` }}>
          <Header W={W} mark={assets[0]!} />
          <div style={{ position: "absolute", left: PAD, top: PAD + HEAD + 8, width: W - 2 * PAD, height: 2, background: "#F0F0F0", opacity: g1 }} />
          {tMs >= sellAt && <Sell tMs={tMs} fps={fps} at={sellAt} W={W} imgs={assets.slice(1, 5)} />}
          {tMs >= whoAt && <Who tMs={tMs} fps={fps} at={whoAt} faces={assets.slice(5, 8)} />}
        </div>
      </div>
    </div>
  );
};
