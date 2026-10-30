import React from "react";
import { Easing } from "remotion";
import type { CardProps } from "../props";
import { COMP_ATT, COMP_H, ClaudeFrame, Composer, FileChip, GREEN, INK, LINE, MUTED, RemapVideo, SANS, SERIF, SkillTag, SparkMark,
  calm, clamp, exitK, mix, pick, ramp } from "./N-kit";
// V11 (25276 → 27377) "You give it to Claude and it comes back FINISHED": the same claude.ai chat as V5, now full band.
// It opens on V5's composer (the chip, the Keyframes tag) with the request typed. On GIVE the send dips and the
// message rises out of the composer to the top right (chip above the beige bubble), the composer empties. On CLAUDE the
// spark thinks; on COMES BACK the reply streams in serif while the chat scrolls up to make room; on FINISHED a video
// card lands in the reply playing this very reel (kf-finished-reel.mp4, 0:43), a green check pressing into its corner.

const W = { x: 40, y: 0, w: 1000, h: 614 };
const COMP = { x: 50, w: 900, bottom: 20 };
const REQ = "edit this reel";
const REPLY = "Done. Cut to 0:43, captions and graphics are in.";
const BW = 238; // the request bubble's width
const C0 = W.h - COMP.bottom - COMP_H - COMP_ATT; // the full composer's top
const FROM = { chip: { x: COMP.x + 18, y: C0 + 16 }, text: { x: COMP.x + 26 - 24, y: C0 + 20 + COMP_ATT - 10 } };
const TO = { chip: { x: W.w - 40 - 440, y: 88 }, text: { x: W.w - 40 - BW, y: 184 } };
const REPLY_Y = 262, CARD = { x: 48, y: 320, w: 600, h: 296 }, SCROLL = 180;

const VideoCard: React.FC<{ t: number; fps: number; at: number; reel: string }> = ({ t, fps, at, reel }) => {
  const k = calm(t, at, fps), ck = calm(t, at + 260, fps);
  const V = { x: 12, y: 12, w: 153, h: 272 };
  return (
    <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, background: "#fff", border: `1.5px solid ${LINE}`,
      boxSizing: "border-box", opacity: Math.min(1, k * 3), transformOrigin: "30% 50%",
      transform: `translateY(${-14 * (1 - k)}px) scale(${1.07 - 0.07 * k})`,
      boxShadow: `0 ${6 + 34 * (1 - k)}px ${16 + 44 * (1 - k)}px rgba(20,20,19,${0.16 + 0.2 * (1 - k)})` }}>
      <div style={{ position: "absolute", left: V.x, top: V.y, width: V.w, height: V.h, overflow: "hidden", background: "#000" }}>
        <RemapVideo tMs={t} fps={fps} src={reel} segs={[{ t0: at, t1: at + 1200, s0: 0, s1: 1.2 }]}
          style={{ position: "absolute", left: 0, top: 0, width: V.w, height: V.h, objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 190, top: 28, fontFamily: SANS }}>
        <div style={{ fontSize: 27, fontWeight: 600, color: INK, letterSpacing: -0.3 }}>keyframes-v1-final.mp4</div>
        <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>Video · MP4 · 0:43</div>
      </div>
      <div style={{ position: "absolute", left: 190, bottom: 22, height: 52, padding: "0 24px", borderRadius: 12, border: `1.5px solid ${LINE}`,
        display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 24, fontWeight: 500, color: INK }}>
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Download
      </div>
      {t >= at + 260 && (
        <div style={{ position: "absolute", left: V.x + V.w - 30, top: V.y + V.h - 30, width: 52, height: 52, borderRadius: "50%", background: GREEN,
          border: "3px solid #fff", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: Math.min(1, ck * 2.5), transform: `scale(${1.6 - 0.6 * ck})`,
          boxShadow: `0 ${2 + 12 * (1 - ck)}px ${6 + 16 * (1 - ck)}px rgba(0,0,0,${0.25 + 0.15 * (1 - ck)})` }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </div>
  );
};

export const Finished: React.FC<CardProps & { data: any }> = ({ tMs: t, fps, fromMs, toMs, beats: b, assets }) => {
  const thumb = pick(assets, "N-thumb.jpg"), mark = pick(assets, "mark-claude.png"), reel = pick(assets, "kf-finished-reel.mp4");
  const give = b.give ?? 25376, sentAt = give + 50, think = b.claude ?? 25856, comes = b.comes ?? 26516, fin = b.finished ?? 26876;
  const e = calm(t, fromMs - 70, fps);
  const ex = exitK(t, toMs);
  const press = t >= give && t < give + 160 ? Math.sin(((t - give) / 160) * Math.PI) : 0;
  const m = calm(t, sentAt, fps); // the message rising
  const att = 1 - calm(t, sentAt + 30, fps);
  const scroll = SCROLL * ramp(t, comes, fin + 20, Easing.inOut(Easing.cubic));
  const n = Math.floor(clamp((t - comes) / 340) * REPLY.length);
  const streaming = t >= think && t < fin + 60;
  const sparkY = n > 0 ? REPLY_Y + 52 : REPLY_Y + 2;
  const push = 1 + 0.015 * ramp(t, fin, toMs, Easing.linear);
  const cx = mix(FROM.chip.x, TO.chip.x, m), cy = mix(FROM.chip.y, TO.chip.y, m) - scroll;
  const tx = mix(FROM.text.x, TO.text.x, m), ty = mix(FROM.text.y, TO.text.y, m) - scroll;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex, transform: `translateY(${10 * ex}px)` }}>
      <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, opacity: Math.min(1, e * 1.8), transformOrigin: "50% 60%",
        transform: `translateY(${(1 - e) * 30}px) scale(${(0.97 + 0.03 * e) * push})` }}>
        <ClaudeFrame mark={mark} w={W.w} h={W.h}>
          {/* the reply: thinking spark, streamed line, the video card */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: COMP.bottom + COMP_H + 8, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, height: 900 }}>
              {n > 0 && <div style={{ position: "absolute", left: 48, top: REPLY_Y, height: 46, display: "flex", alignItems: "center", fontFamily: SERIF,
                fontSize: 31, color: INK, whiteSpace: "pre" }}>{REPLY.slice(0, n)}</div>}
              {streaming && (
                <div style={{ position: "absolute", left: 48, top: sparkY, opacity: 1 - ramp(t, fin - 40, fin + 60) }}>
                  <SparkMark src={mark} size={38} rot={(t / 1000) * 110} />
                </div>
              )}
              {t >= fin && <VideoCard t={t} fps={fps} at={fin} reel={reel} />}
            </div>
          </div>
          {/* the message: in the composer until GIVE, then rising to the top right */}
          <div style={{ position: "absolute", left: cx, top: cy, zIndex: 3, transform: `scale(${1 + 0.03 * Math.sin(m * Math.PI)})`,
            filter: `drop-shadow(0 ${10 * Math.sin(m * Math.PI)}px ${18 * Math.sin(m * Math.PI)}px rgba(20,20,19,0.18))` }}>
            <FileChip thumb={thumb} name="Keyframes v1.mov" meta="Video · 188 MB" w={440} />
          </div>
          <div style={{ position: "absolute", left: tx, top: ty, width: BW, height: 58, zIndex: 3, borderRadius: 18, 
            backgroundColor: `rgba(240,238,230,${clamp(m * 1.5)})`, display: "flex", alignItems: "center", paddingLeft: 24, boxSizing: "border-box",
            fontFamily: SANS, fontSize: 30, color: INK, whiteSpace: "nowrap" }}>{REQ}</div>
          <div style={{ position: "absolute", left: COMP.x, bottom: COMP.bottom, width: COMP.w, height: COMP_H + COMP_ATT, zIndex: 2 }}>
            <Composer w={COMP.w} att={att} send={1 - clamp(m * 3)} press={press} placeholder="Reply to Claude…" text={m < 0.02 ? "" : undefined}>
              {att > 0.02 && <div style={{ width: 440, height: 84 }} />}
              {att > 0.02 && <div style={{ opacity: 1 - clamp(m * 4) }}><SkillTag k={1} /></div>}
            </Composer>
          </div>
        </ClaudeFrame>
      </div>
    </div>
  );
};
