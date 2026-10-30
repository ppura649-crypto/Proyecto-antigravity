import React from "react";
import { Img, staticFile } from "remotion";
import { CALM, Clip, GREEN, UI, clamp, ease, exitOf, lerp, pick, sp } from "./R-util";
// V10 (22733 -> 25276) "or even a product that you want to demo video for". A browser lands and yourproduct.app is
// typed in; on "product" the product's real homepage slides up into the window; on "want to" the whole window
// folds in thirds like a printed letter (paper back, crease shading, each flap casting onto the middle); on
// "demo" the folded letter opens again as a video player, and on "video" play is pressed: the real the product
// film runs with its scrubber. Held, clean exit.

export type FoldBeats = { or: number; product: number; want: number; demo: number; video: number };
const FB: FoldBeats = { or: 22733, product: 23628, want: 24228, demo: 24468, video: 24708 };

const SX = 60, SY = 17, SW = 960, SH = 580, CHROME = 40, H3 = SH / 3;
const URL = "yourproduct.app";

const Lock = () => (
  <svg width="12" height="15" viewBox="0 0 16 20"><rect x="1" y="8" width="14" height="11" rx="2" fill="#9a9aa2" />
    <path d="M4 8V5a4 4 0 0 1 8 0v3" stroke="#9a9aa2" strokeWidth="2" fill="none" /></svg>
);

const PageFace: React.FC<{ t: number; fps: number; b: FoldBeats; assets: string[] }> = ({ t, fps, b, assets }) => {
  const typed = Math.floor(clamp((t - (b.or + 90)) / 55, 0, URL.length));
  const caret = typed < URL.length || Math.floor((t - b.or) / 380) % 2 === 0;
  const load = clamp((t - (b.product - 260)) / 420);
  const slide = sp(t, b.product, fps, CALM);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, background: "#0b0c0c" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: CHROME, background: "#232326",
        borderBottom: "1px solid #313135" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
          <div key={c} style={{ position: "absolute", left: 16 + i * 20, top: 14, width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ position: "absolute", left: 300, top: 7, width: 360, height: 26, borderRadius: 7, background: "#38383c",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: UI, fontSize: 17,
          fontWeight: 500, color: "#e8e8ea" }}>
          <Lock /><span>{URL.slice(0, typed)}</span>
          {typed < URL.length && caret && <span style={{ width: 1.5, height: 17, background: "#e8e8ea", marginLeft: -6 }} />}
        </div>
      </div>
      {load > 0 && load < 1 && (
        <div style={{ position: "absolute", left: 0, top: CHROME, height: 3, width: SW * ease(load), background: "#9fe3c7" }} />
      )}
      <div style={{ position: "absolute", left: 0, top: CHROME, width: SW, height: SH - CHROME, overflow: "hidden" }}>
        {slide > 0 && (
          <Img src={staticFile(pick(assets, "R-fs-page.jpg"))} style={{ position: "absolute", left: 0,
            top: lerp(SH - CHROME, 0, slide), width: SW, height: SW * 9 / 16 }} />
        )}
      </div>
    </div>
  );
};

const PlayerFace: React.FC<{ t: number; fps: number; b: FoldBeats; assets: string[] }> = ({ t, fps, b, assets }) => {
  const playAt = b.video + 60;
  const press = clamp((t - b.video) / 110), release = clamp((t - (b.video + 110)) / 200);
  const btnScale = lerp(1, 0.84, press) + lerp(0, 0.34, release);
  const btnOp = 1 - clamp((t - (b.video + 120)) / 220);
  const el = Math.max(0, t - playAt) + 1050; // the film was cued at 0:01.05
  const prog = el / 29000;
  const s = Math.floor(el / 1000);
  const VH = SH - CHROME;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, background: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: VH, overflow: "hidden" }}>
        <Img src={staticFile(pick(assets, "R-fs-poster.jpg"))} style={{ position: "absolute", inset: 0, width: SW, height: VH }} />
        {t >= playAt - 40 && <Clip src={pick(assets, "R-fs-film.mp4")} startMs={playAt} fps={fps} />}
        {btnOp > 0 && (
          <div style={{ position: "absolute", left: SW / 2 - 52, top: VH / 2 - 52, width: 104, height: 104, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", opacity: btnOp,
            transform: `scale(${btnScale})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="44" viewBox="0 0 40 44" style={{ marginLeft: 8 }}><path d="M2 2 L38 22 L2 42 Z" fill="#0b0c0c" /></svg>
          </div>
        )}
      </div>
      {/* the control bar */}
      <div style={{ position: "absolute", left: 0, top: VH, width: SW, height: CHROME, background: "#101112",
        display: "flex", alignItems: "center", fontFamily: UI, fontSize: 17, fontWeight: 600, color: "#e9e9ec" }}>
        <div style={{ width: 46, display: "flex", justifyContent: "center" }}>
          {t < b.video + 60 ? (
            <svg width="16" height="18" viewBox="0 0 16 18"><path d="M1 1 L15 9 L1 17 Z" fill="#e9e9ec" /></svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 16 18"><rect x="1" y="1" width="5" height="16" fill="#e9e9ec" /><rect x="10" y="1" width="5" height="16" fill="#e9e9ec" /></svg>
          )}
        </div>
        <div style={{ width: 96, fontVariantNumeric: "tabular-nums" }}>0:{String(s).padStart(2, "0")} / 0:29</div>
        <div style={{ position: "relative", flex: 1, height: 5, marginRight: 22, background: "#3a3b3e", borderRadius: 3 }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: 5, width: `${prog * 100}%`, background: GREEN, borderRadius: 3 }} />
          <div style={{ position: "absolute", left: `calc(${prog * 100}% - 7px)`, top: -4.5, width: 14, height: 14, borderRadius: "50%",
            background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.6)" }} />
        </div>
        <div style={{ marginRight: 16, fontSize: 15, color: "#a9a9ae" }}>the product</div>
      </div>
    </div>
  );
};

// the back of the printed sheet
const PaperBack: React.FC<{ j: number; lit: number }> = ({ j, lit }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${j === 0 ? 180 : 0}deg, #f1eee8 0%, #e2ded6 70%, #cfcac1 100%)`,
    filter: `brightness(${lit.toFixed(3)})` }} />
);

type Faces = "page" | "player";
const Panel: React.FC<{ j: number; ang: number; face: Faces; t: number; fps: number; b: FoldBeats; assets: string[] }> = (
  { j, ang, face, t, fps, b, assets }) => {
  // j = 0 hinges on its bottom edge, j = 2 on its top edge; both fold toward the camera over the middle
  const rad = (ang * Math.PI) / 180;
  const frontLit = 0.5 + 0.5 * Math.max(0, Math.cos(rad));
  const backLit = 0.62 + 0.38 * Math.max(0, -Math.cos(rad));
  const rot = j === 0 ? -ang : j === 2 ? ang : 0;
  const z = ang > 90 ? (j === 2 ? 3 : 1.5) : 0;
  const Face = face === "page" ? PageFace : PlayerFace;
  const crease = Math.sin(rad) * 0.55;
  return (
    <div style={{ position: "absolute", left: 0, top: j * H3, width: SW, height: H3, transformStyle: "preserve-3d",
      transformOrigin: j === 0 ? "50% 100%" : "50% 0%", transform: `translateZ(${z}px) rotateX(${rot}deg)` }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", backfaceVisibility: "hidden",
        filter: frontLit < 0.999 ? `brightness(${frontLit.toFixed(3)})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: -j * H3, width: SW, height: SH }}>
          <Face t={t} fps={fps} b={b} assets={assets} />
        </div>
        {j !== 1 && crease > 0.01 && (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${j === 0 ? 0 : 180}deg, rgba(0,0,0,${crease}) 0%, rgba(0,0,0,0) 60%)` }} />
        )}
      </div>
      <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
        <PaperBack j={j} lit={backLit} />
      </div>
    </div>
  );
};

export const PageFold: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<FoldBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: FoldBeats = { ...FB, ...beats };
  const ex = exitOf(t, toMs);
  const enter = sp(t, b.or, fps, CALM);
  // fold: top flap then bottom flap; open again (bottom first, it lies on top) as the player
  const f0 = ease((t - (b.want - 110)) / 240), f2 = ease((t - (b.want - 10)) / 230);
  const swap = b.demo - 20;
  const u2 = ease((t - swap) / 180), u0 = ease((t - (swap + 90)) / 190);
  const opened = t >= swap;
  const a0 = opened ? 180 * (1 - u0) : 180 * f0, a2 = opened ? 180 * (1 - u2) : 180 * f2;
  const face: Faces = opened ? "player" : "page";
  // the sheet lifts a little while it is folded, and settles back as the player
  const folded = Math.max(Math.min(f0, f2), 0) * (1 - Math.min(u0, u2));
  const lift = Math.sin(Math.PI * clamp(f0)) * 0.5 + folded * 0.5;
  const castTop = Math.sin((a0 * Math.PI) / 180) * 0.45 * (a0 < 170 ? 1 : 0);
  const castBot = Math.sin((a2 * Math.PI) / 180) * 0.45 * (a2 < 170 ? 1 : 0);
  const push = 1 + 0.02 * ease((t - (b.video + 300)) / (toMs - b.video - 300));
  const whole = Math.max(a0, a2) < 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${push * ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      <div style={{ position: "absolute", left: SX, top: SY + lerp(34, 0, enter) - 8 * lift, width: SW, height: SH,
        perspective: 1700, perspectiveOrigin: "50% 50%", transform: `scale(${1 - 0.02 * lift})` }}>
        {/* the shadow the sheet (or the folded letter) throws */}
        <div style={{ position: "absolute", left: 0, width: SW, top: whole ? 0 : H3 - (a0 < 90 ? H3 * Math.cos((a0 * Math.PI) / 180) : 0),
          height: whole ? SH : H3 + (a0 < 90 ? H3 * Math.cos((a0 * Math.PI) / 180) : 0) + (a2 < 90 ? H3 * Math.cos((a2 * Math.PI) / 180) : 0),
          boxShadow: `0 ${lerp(24, 40, lift)}px ${lerp(56, 80, lift)}px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.32)` }} />
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          <Panel j={1} ang={0} face={face} t={t} fps={fps} b={b} assets={assets} />
          {/* the flaps' shadows cast onto the middle */}
          {(castTop > 0.01 || castBot > 0.01) && (
            <div style={{ position: "absolute", left: 0, top: H3, width: SW, height: H3, pointerEvents: "none",
              background: `linear-gradient(180deg, rgba(0,0,0,${castTop.toFixed(3)}) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,${castBot.toFixed(3)}) 100%)`,
              transform: "translateZ(0.5px)" }} />
          )}
          <Panel j={0} ang={a0} face={face} t={t} fps={fps} b={b} assets={assets} />
          <Panel j={2} ang={a2} face={face} t={t} fps={fps} b={b} assets={assets} />
        </div>
      </div>
    </div>
  );
};
