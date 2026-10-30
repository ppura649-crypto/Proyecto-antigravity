import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { COMP_ATT, COMP_H, ClaudeFrame, Composer, FileChip, INK, SANS, SERIF, SparkMark, bump, calm, clamp, exitK, fall, mix, pick, ramp } from "./N-kit";
// V16 (35733 → 39629) "Once you get it, you drop it into Claude or ChatGPT or whatever LLM you're using,": the
// Keyframes Talking Head box (the store's box art, cut out) arrives on GET and hangs above Claude's composer; on
// CLAUDE it drops with weight into the composer, the attachment row opening under it, and flattens into the pack chip
// "keyframes-talking-head.zip". On CHATGPT the Claude window slides away and ChatGPT's (its real mark, its composer)
// slides in with the same chip already in it. From WHATEVER the ChatGPT window steps back and Gemini, Cursor and Grok
// land in a row under it, each with the same chip in its own input. Held.

const WIN = { x: 40, y: 250, w: 1000, h: 364 };
const COMP = { x: 50, w: 900, bottom: 20 };
const CHIP_W = 500, NAME = "keyframes-talking-head.zip", META = "ZIP archive";
const SLOT = { x: WIN.x + COMP.x + 18 + 41, y: WIN.y + WIN.h - COMP.bottom - COMP_H - COMP_ATT + 16 + 41 };
const HOVER = { x: 540, y: 124, w: 150, h: 227 };

const HBlur: React.FC<{ id: string; s: number }> = ({ id, s }) => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <filter id={id} x="-15%" y="0" width="130%" height="100%"><feGaussianBlur stdDeviation={`${s} 0`} /></filter>
  </svg>
);

// ChatGPT's page and composer (light theme), the pack chip already attached
const ChatGPT: React.FC<{ mark: string; box: string }> = ({ mark, box }) => (
  <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", overflow: "hidden", boxShadow: "0 26px 60px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)" }}>
    <div style={{ position: "absolute", left: 24, top: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
      <Img src={staticFile(mark)} style={{ width: 40, height: 40 }} />
      <div style={{ fontSize: 30, fontWeight: 600, color: "#0D0D0D", letterSpacing: -0.3 }}>ChatGPT</div>
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#8F8F8F" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
    </div>
    <div style={{ position: "absolute", left: COMP.x, bottom: COMP.bottom, width: COMP.w, height: COMP_H + COMP_ATT, borderRadius: 28, background: "#fff",
      border: "1.5px solid #E3E3E3", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", boxSizing: "border-box", fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 18, top: 16 }}><FileChip thumb={box} name={NAME} meta={META} w={CHIP_W} box /></div>
      <div style={{ position: "absolute", left: 28, top: 20 + COMP_ATT, fontSize: 30, color: "#8F8F8F" }}>Ask anything</div>
      <div style={{ position: "absolute", left: 22, bottom: 20, fontSize: 40, lineHeight: 1, color: "#5D5D5D", fontWeight: 300 }}>+</div>
      <svg style={{ position: "absolute", right: 84, bottom: 26 }} width="30" height="30" viewBox="0 0 24 24">
        <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#5D5D5D" strokeWidth="1.8" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" stroke="#5D5D5D" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
      <div style={{ position: "absolute", right: 18, bottom: 16, width: 50, height: 50, borderRadius: "50%", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  </div>
);

type TileSpec = { name: string; mark: string; bg: string; field: string; line: string; ink: string; muted: string; ph: string; dark: boolean; r: number };
const TILE = { w: 326, h: 272, y: 322 };
const Tile: React.FC<{ s: TileSpec; box: string }> = ({ s, box }) => (
  <div style={{ position: "absolute", inset: 0, background: s.bg, overflow: "hidden", fontFamily: SANS }}>
    <div style={{ position: "absolute", left: 20, top: 18, display: "flex", alignItems: "center", gap: 14 }}>
      <Img src={staticFile(s.mark)} style={{ width: 56, height: 56 }} />
      <div style={{ fontSize: 32, fontWeight: 600, color: s.ink, letterSpacing: -0.4 }}>{s.name}</div>
    </div>
    <div style={{ position: "absolute", left: 14, right: 14, top: 94, bottom: 14, borderRadius: s.r, background: s.field, border: `1.5px solid ${s.line}`, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 12, top: 12 }}><FileChip thumb={box} name={NAME} meta={META} w={CHIP_W} box dark={s.dark} scale={0.54} /></div>
      <div style={{ position: "absolute", left: 16, top: 72, fontSize: 20, color: s.muted, whiteSpace: "nowrap" }}>{s.ph}</div>
      <div style={{ position: "absolute", right: 12, bottom: 12, width: 36, height: 36, borderRadius: "50%", background: s.dark ? "#EDEDED" : "#1F1F1F",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke={s.dark ? "#111" : "#fff"} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  </div>
);

export const AnyLLM: React.FC<CardProps & { data: any }> = ({ tMs: t, fps, fromMs, toMs, beats: b, assets }) => {
  const box = pick(assets, "N-box.png"), claude = pick(assets, "mark-claude.png"), openai = pick(assets, "mark-openai.png");
  const get = b.get ?? 36088, drop = b.claude ?? 36948, gpt = b.chatgpt ?? 37488, or2 = b.or ?? 38109, what = b.whatever ?? 38289;
  const e = calm(t, fromMs - 70, fps);
  const ex = exitK(t, toMs);
  const impact = drop + 260;
  // the box: arrives on GET, hangs with a slow sway, falls on CLAUDE into the chip slot
  const bk = calm(t, get, fps);
  const sway = Math.sin((t - get) / 520) * 1.6, bob = Math.sin((t - get) / 700) * 4;
  const gx = ramp(t, drop, impact, Easing.out(Easing.quad)), gy = fall(t, drop, impact), g = ramp(t, drop, impact, Easing.in(Easing.quad));
  const bw = mix(HOVER.w, 58, g), bh = mix(HOVER.h, 88, g);
  const boxX = mix(HOVER.x, SLOT.x, gx), boxY = mix(HOVER.y + bob * (1 - gy), SLOT.y, gy);
  const att = calm(t, drop - 40, fps), open = calm(t, impact + 10, fps), sq = bump(t, impact, 150);
  // the slide to ChatGPT, then ChatGPT stepping back for the row
  const slideA = ramp(t, gpt, gpt + 380, Easing.inOut(Easing.cubic));
  const slideB = ramp(t, gpt + 40, gpt + 460, Easing.bezier(0.3, 0, 0.15, 1));
  const vA = Math.abs(ramp(t + 33, gpt, gpt + 380, Easing.inOut(Easing.cubic)) - slideA) * 1100;
  const vB = Math.abs(ramp(t + 33, gpt + 40, gpt + 460, Easing.bezier(0.3, 0, 0.15, 1)) - slideB) * 1060;
  const back = calm(t, or2, fps);
  const gs = mix(1, 0.64, back), gX = mix(1100, WIN.x, slideB) + (220 - WIN.x) * back, gY = mix(WIN.y, 18, back);
  const push = 1 + 0.015 * ramp(t, what + 700, toMs, Easing.linear);
  const tiles: TileSpec[] = [
    { name: "Gemini", mark: pick(assets, "mark-gemini.png"), bg: "#FFFFFF", field: "#F0F4F9", line: "#F0F4F9", ink: "#1F1F1F", muted: "#6B7280", ph: "Ask Gemini", dark: false, r: 26 },
    { name: "Cursor", mark: pick(assets, "mark-cursor.png"), bg: "#181818", field: "#212121", line: "#333333", ink: "#EDEDED", muted: "#8A8A8A", ph: "Plan, search, build anything", dark: true, r: 12 },
    { name: "Grok", mark: pick(assets, "mark-grok.png"), bg: "#0A0A0A", field: "#1C1C1C", line: "#2E2E2E", ink: "#FFFFFF", muted: "#8A8A8A", ph: "What do you want to know?", dark: true, r: 24 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex, transform: `translateY(${10 * ex}px)` }}>
      <HBlur id="n16a" s={clamp((vA - 12) / 10, 0, 4)} /><HBlur id="n16b" s={clamp((vB - 12) / 10, 0, 4)} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 300px", transform: `scale(${push})` }}>
        {/* Claude */}
        {slideA < 1 && (
          <div style={{ position: "absolute", left: mix(WIN.x, -1080, slideA), top: WIN.y, width: WIN.w, height: WIN.h, opacity: Math.min(1, e * 1.8),
            transform: `translateY(${(1 - e) * 36}px) scale(${0.97 + 0.03 * e})`, filter: vA > 14 ? "url(#n16a)" : undefined }}>
            <ClaudeFrame mark={claude} w={WIN.w} h={WIN.h}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 104, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, opacity: 1 - clamp(att * 2) }}>
                <SparkMark src={claude} size={40} rot={(t / 1000) * 8} />
                <div style={{ fontFamily: SERIF, fontSize: 40, color: INK, letterSpacing: -0.6 }}>Good afternoon</div>
              </div>
              <div style={{ position: "absolute", left: COMP.x, bottom: COMP.bottom, width: COMP.w, height: COMP_H + COMP_ATT }}>
                <Composer w={COMP.w} att={att} send={open}>
                  {t >= impact && <div style={{ transform: `scale(${1 + 0.05 * sq})`, transformOrigin: "0 50%" }}>
                    <FileChip thumb={box} name={NAME} meta={META} w={CHIP_W} open={open} box /></div>}
                </Composer>
              </div>
            </ClaudeFrame>
          </div>
        )}
        {/* the row: Gemini, Cursor, Grok, each landing with weight */}
        {tiles.map((s, i) => {
          const at = what + i * 120;
          if (t < at) return null;
          const k = fall(t, at, at + 330), q = bump(t, at + 330, 140);
          return (
            <div key={s.name} style={{ position: "absolute", left: 40 + i * (TILE.w + 11), top: TILE.y - 170 * (1 - k) + 3 * q, width: TILE.w, height: TILE.h,
              transform: `rotate(${(1 - k) * (i - 1) * 3}deg) scaleY(${1 - 0.025 * q})`, transformOrigin: "50% 100%",
              boxShadow: `0 ${10 + 40 * (1 - k)}px ${22 + 50 * (1 - k)}px rgba(0,0,0,${0.5 - 0.15 * (1 - k)}), 0 4px 10px rgba(0,0,0,0.3)` }}>
              <Tile s={s} box={box} />
            </div>
          );
        })}
        {/* ChatGPT */}
        {t >= gpt && (
          <div style={{ position: "absolute", left: gX, top: gY, width: WIN.w, height: WIN.h, transformOrigin: "0 0", transform: `scale(${gs})`,
            filter: vB > 14 ? "url(#n16b)" : undefined }}>
            <ChatGPT mark={openai} box={box} />
          </div>
        )}
        {/* the box */}
        {t >= get && t < impact + 10 && (
          <div style={{ position: "absolute", left: boxX - bw / 2, top: boxY - bh / 2, width: bw, height: bh, opacity: Math.min(1, bk * 2.2),
            transform: `translateY(${(1 - bk) * -50}px) rotate(${sway * (1 - g) - 6 * Math.sin(g * Math.PI)}deg)`,
            filter: `drop-shadow(0 ${10 + 24 * (1 - gy)}px ${14 + 26 * (1 - gy)}px rgba(0,0,0,0.55))` }}>
            <Img src={staticFile(box)} style={{ width: "100%", height: "100%" }} />
          </div>
        )}
      </div>
    </div>
  );
};
