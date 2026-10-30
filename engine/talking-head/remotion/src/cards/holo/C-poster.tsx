import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { SHADOW, asset, clamp, exitK, lerp, ramp, wave } from "./C-kit";
// reference edit K B12 + B13 (26033 → 28204): the Crocs poster (its first appearance in v2) is edited live.
// CHANGE THE TEXT: the headline is selected and retyped to "Make It Yours." (Crocs' own line in the email).
// SWAP THE PRODUCT: the plain clog flips over and lands as the charm clog (5139714, the same layout).
// One pure function of spine ms for both events, so the second event continues the first frame for frame.

const PW = 488, PH = 610, K = PW / 900; // v5: full band height, centred // stills are 900x1125 poster px
const BG = "#fefefe";
const LINES = [{ y0: 40, y1: 248, x1: 842 }, { y0: 258, y1: 446, x1: 842 }, { y0: 457, y1: 650, x1: 520 }];
const NEW = ["Make", "It", "Yours."];
const BASE = [246, 446, 650], FS = 262;
const SHOE = { x0: 190, y0: 752, x1: 830, y1: 1048 };

const Typed: React.FC<{ tMs: number; tText: number; tSwap: number }> = ({ tMs, tText, tSwap }) => {
  const n = Math.floor((tMs - tText) / 16) + 1; // characters typed, one every 16 ms (done in ~220 ms)
  let used = 0;
  const caretOn = n < 14 || tMs < tText + 420; // the caret leaves once the line is typed: a clean finished poster
  const caretLine = n <= 5 ? 0 : n <= 8 ? 1 : 2;
  return (
    <>
      {NEW.map((word, i) => {
        const start = used; used += word.length + 1;
        const shown = word.slice(0, clamp(n - start, 0, word.length));
        const here = caretLine === i;
        if (!shown && !here) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 34 * K, top: (BASE[i] - 0.8635 * FS) * K, whiteSpace: "pre",
            fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: FS * K, lineHeight: 1, letterSpacing: "-0.055em", color: "#111" }}>
            {shown}
            {here && caretOn && (
              <span style={{ display: "inline-block", width: 7, height: FS * K * 0.78, marginLeft: 6, background: "#1a73e8", verticalAlign: "-0.02em" }} />
            )}
          </div>
        );
      })}
    </>
  );
};

export const Poster: React.FC<CardProps & { data: any }> = ({ tMs, w, h, toMs, assets, data }) => {
  const t0 = data.times as { you: number; change: number; text: number; swap: number; product: number };
  // v5 (law 1): the retype starts 220 ms after CHANGE (not on TEXT) so "Make It Yours." is finished by ~26820
  // and held; the product flip is done ~380 ms after SWAP and held ~700 ms
  const t = { ...t0, text: t0.change + 220 };
  const cam = 1 + 0.025 * clamp((tMs - t.you) / 2200);
  const enter = ramp(tMs, t.you, t.you + 360);
  const out = data.exit ? exitK(tMs, toMs, 200) : 0;
  const img = (f: string) => staticFile(asset(assets, f));
  // the product flip: the plain clog lifts and turns away, the charm clog turns in and lands
  const away = ramp(tMs, t.swap, t.swap + 160, Easing.in(Easing.cubic));
  const land = ramp(tMs, t.swap + 160, t.swap + 380);
  const showCharm = tMs >= t.swap + 160;
  const shoeTf = showCharm ? `scale(${lerp(1.04, 1, land)}) rotateY(${lerp(-90, 0, land)}deg)`
    : `scale(${1 + 0.04 * away}) rotateY(${90 * away}deg)`;
  const SW = (SHOE.x1 - SHOE.x0) * K, SH = (SHOE.y1 - SHOE.y0) * K;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
      <div style={{ position: "absolute", left: (w - PW) / 2, top: (h - PH) / 2, width: PW, height: PH, boxShadow: SHADOW, background: BG, backfaceVisibility: "hidden",
        opacity: enter * (1 - out),
        transform: `rotateY(${1.5 * wave(tMs, 4200)}deg) scale(${lerp(0.96, 1, enter) * cam * (1 - 0.04 * out)})` }}>
        <Img src={img("crocs-5139667.jpg")} style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH }} />
        {/* SELECT: the three headline lines highlight like a text selection, one after another */}
        {tMs >= t.change && tMs < t.text && LINES.map((l, i) => {
          const s = ramp(tMs, t.change + i * 40, t.change + i * 40 + 120);
          return <div key={i} style={{ position: "absolute", left: 28 * K, top: (l.y0 - 6) * K, height: (l.y1 - l.y0 + 12) * K,
            width: (l.x1 - 28 + 8) * K * s, background: "rgba(38,132,255,0.38)" }} />;
        })}
        {/* RETYPE: the selection is replaced, "Make It Yours." types in */}
        {tMs >= t.text && (
          <>
            <div style={{ position: "absolute", left: 16 * K, top: 26 * K, width: 868 * K, height: 638 * K, background: BG }} />
            <Typed tMs={tMs} tText={t.text} tSwap={t.swap} />
          </>
        )}
        {/* SWAP: the shoe panel flips (same layout on both posters, so only the clog changes) */}
        {tMs >= t.swap && (
          <>
            <div style={{ position: "absolute", left: SHOE.x0 * K, top: SHOE.y0 * K, width: SW, height: SH, background: BG }} />
            <div style={{ position: "absolute", left: SHOE.x0 * K, top: SHOE.y0 * K, width: SW, height: SH, overflow: "hidden", transform: shoeTf }}>
              <Img src={img(showCharm ? "crocs-5139714.jpg" : "crocs-5139667.jpg")}
                style={{ position: "absolute", left: -SHOE.x0 * K, top: -SHOE.y0 * K, width: PW, height: PH }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
