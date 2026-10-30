import React from "react";
import { Easing } from "remotion";
import type { CardProps } from "../props";
import { clipPose } from "./N-camera";
import { Body, CARD, COMP_ATT, COMP_H, ClaudeFrame, ClipCard, Composer, FileChip, INK, LAND, SERIF, SkillTag, SparkMark, Wordmark,
  calm, clamp, exitK, mix, pick, ramp } from "./N-kit";
// V5 (8600 → 11033) "I upload the raw footage into Claude. And with KEYFRAMES": the claude.ai new chat. The clip card
// V4 dropped is picked up where it rests; on UPLOAD it is thrown in an arc into the composer (the attachment row opens
// under it), lands with a small settle and flattens into the file chip "Keyframes v1.mov". On RAW FOOTAGE the upload
// bar fills; on CLAUDE. the send arrow lights (a ripple off it). On KEYFRAMES the white wordmark drops in above the
// window and settles (the Holo "logo above the field" move), then the chip gains a "Keyframes" skill tag. Held.

export const WIN5 = { x: 40, y: 120, w: 1000, h: 494 };
const COMP = { x: 50, w: 900, bottom: 24 }; // inside the window
const CHIP = { x: WIN5.x + COMP.x + 18, y: WIN5.y + WIN5.h - COMP.bottom - COMP_H - COMP_ATT + 16, w: 440 };
const SLOT = { x: CHIP.x + 9 + 32, y: CHIP.y + 9 + 32 };
const SEND = { x: WIN5.x + COMP.x + COMP.w - 20 - 24, y: WIN5.y + WIN5.h - COMP.bottom - 16 - 24 };

// the throw: a quadratic arc from the resting card to the chip's thumbnail slot
const throwPose = (t: number, a: number, b: number) => {
  const u = ramp(t, a, b, Easing.inOut(Easing.cubic));
  const q = (p0: number, p1: number, p2: number) => (1 - u) * (1 - u) * p0 + 2 * (1 - u) * u * p1 + u * u * p2;
  const s = Math.pow(u, 0.8);
  const u2 = ramp(t + 17, a, b, Easing.inOut(Easing.cubic));
  const v = Math.abs(u2 - u) * 900;
  return {
    x: q(LAND.x, 520, SLOT.x), y: q(LAND.y, -30, SLOT.y), w: mix(CARD.w, 64, s), h: mix(CARD.h, 64, s),
    rot: mix(LAND.rot, 0, u) - 12 * Math.sin(u * Math.PI), lift: Math.sin(u * Math.PI), blur: clamp((v - 40) / 30) * 1.5, dur: 1 - s,
  };
};

export const Upload: React.FC<CardProps & { data: any }> = ({ tMs: t, fps, toMs, beats: b, assets }) => {
  const thumb = pick(assets, "N-thumb.jpg"), mark = pick(assets, "mark-claude.png"), wm = pick(assets, "kf-wordmark.png");
  const upload = (b.upload ?? 8709) + 30, landAt = upload + 350;
  const raw = b.raw ?? 9249, send = b.claude ?? 9810, kf = b.keyframes ?? 10423;
  const e = calm(t, 8570, fps);
  const ex = exitK(t, toMs);
  const att = calm(t, upload + 120, fps);
  const open = calm(t, landAt + 20, fps);
  const settle = t > landAt && t < landAt + 140 ? Math.sin(((t - landAt) / 140) * Math.PI) : 0;
  const prog = ramp(t, raw, raw + 460, Easing.inOut(Easing.quad));
  const on = calm(t, send, fps);
  const rp = ramp(t, send, send + 450, Easing.out(Easing.cubic));
  const wk = calm(t, kf, fps), tag = calm(t, kf + 170, fps);
  const push = 1 + 0.015 * ramp(t, kf, toMs, Easing.linear);
  const pose = t < upload ? clipPose(t, b.something ?? 8303) : t < landAt ? throwPose(t, upload, landAt) : null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex, transform: `translateY(${10 * ex}px)` }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 360px", transform: `scale(${push})` }}>
        {/* the wordmark above the window */}
        {t >= kf && (
          <div style={{ position: "absolute", left: 0, right: 0, top: -14, display: "flex", justifyContent: "center" }}>
            <Wordmark src={wm} w={560} k={wk} />
          </div>
        )}
        <div style={{ position: "absolute", left: WIN5.x, top: WIN5.y, width: WIN5.w, height: WIN5.h, opacity: Math.min(1, e * 1.8),
          transform: `translateY(${(1 - e) * 40}px) scale(${0.97 + 0.03 * e})` }}>
          <ClaudeFrame mark={mark} w={WIN5.w} h={WIN5.h}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 124, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
              <SparkMark src={mark} size={48} rot={(t / 1000) * 8} />
              <div style={{ fontFamily: SERIF, fontSize: 48, color: INK, letterSpacing: -0.8 }}>Good afternoon</div>
            </div>
            <div style={{ position: "absolute", left: COMP.x, bottom: COMP.bottom, width: COMP.w, height: COMP_H + COMP_ATT }}>
              <Composer w={COMP.w} att={att} send={on}>
                {t >= landAt && (
                  <div style={{ transform: `scale(${1 + 0.06 * settle})`, transformOrigin: "0 50%" }}>
                    <FileChip thumb={thumb} name="Keyframes v1.mov" meta={prog > 0 && prog < 1 ? `Uploading… ${Math.round(prog * 100)}%` : "Video · 188 MB"}
                      w={CHIP.w} open={open} progress={prog} />
                  </div>
                )}
                {t >= kf + 170 && <SkillTag k={tag} />}
              </Composer>
            </div>
          </ClaudeFrame>
        </div>
        {/* the ripple off the send arrow when it lights */}
        {t >= send && rp < 1 && (
          <div style={{ position: "absolute", left: SEND.x - 30 - 50 * rp, top: SEND.y - 30 - 50 * rp, width: 2 * (30 + 50 * rp), height: 2 * (30 + 50 * rp),
            borderRadius: "50%", border: `${4 - 3 * rp}px solid rgba(217,119,87,${0.7 * (1 - rp)})` }} />
        )}
        {pose && <Body p={pose} z={5}><ClipCard thumb={thumb} w={pose.w} h={pose.h} dur={pose.dur} /></Body>}
      </div>
    </div>
  );
};
