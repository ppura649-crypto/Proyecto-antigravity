import React from "react";
import { Easing } from "remotion";
import type { CardProps } from "../props";
import { exitK, lerp, push, ramp, wave } from "./C-kit";
import { AdCard, EmailCard, IgPhone } from "./C-social";
// reference edit K B8 (17750 → 19867) "ads, emails, social posts", v5 (law 1): the three outputs ACCUMULATE in one row
// and all stay. ADS: a Crocs Meta feed ad lands centred; EMAILS: the row opens and the real Crocs email joins
// beside it, scrolling; SOCIAL POSTS: the row opens again and an Instagram post from @crocs on a phone joins.
// Each join is ~300 ms; the row is complete by ~19170 and held (slow push) to 19867.

const IO = Easing.inOut(Easing.cubic);
const GAP = 18;
// item sizes (device px); all three stand ~540 tall so the row reads as one shelf
const AD_W = 312, EM_W = 404, EM_H = 540, PH_W = 262, PH_H = 540;
const AD_H = 64 + Math.round(AD_W * 1.25) + 64; // 518

export const Deal: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const tEmail = beats.emails ?? 18200, tSocial = beats.social ?? 18867;
  const j = [ramp(tMs, fromMs, fromMs + 300), ramp(tMs, tEmail, tEmail + 320, IO), ramp(tMs, tSocial, tSocial + 320, IO)];
  const ws = [AD_W, EM_W, PH_W];
  // the row re-centres as each item joins (its slot opens with its join factor)
  const slot = ws.map((x, i) => (i === 0 ? x : (x + GAP) * j[i]));
  const total = slot.reduce((a, b) => a + b, 0);
  let x = (w - total) / 2;
  const xs = slot.map((s, i) => { const at = x + (i === 0 ? 0 : GAP * j[i]); x += s; return at; });
  const out = exitK(tMs, toMs, 180);
  const cam = push(tMs, tSocial + 320, toMs, 0.025);
  const cy = h / 2;
  const item = (i: number, hh: number, extra: string, child: React.ReactNode) => (
    <div style={{ position: "absolute", left: xs[i], top: cy - hh / 2 + 2.5 * wave(tMs, 3200, i * 1.3), width: ws[i], height: hh,
      opacity: Math.min(1, j[i] * 1.6), transform: extra }}>{child}</div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600, opacity: 1 - out,
      transform: `scale(${cam * (1 - 0.03 * out)})` }}>
      {item(0, AD_H, `translateY(${lerp(36, 0, j[0])}px) scale(${lerp(0.94, 1, j[0])})`, <AdCard w={AD_W} assets={assets} />)}
      {tMs >= tEmail && item(1, EM_H, `translateX(${lerp(60, 0, j[1])}px) rotateY(${lerp(-14, 0, j[1])}deg)`,
        <EmailCard w={EM_W} h={EM_H} assets={assets} startMs={tEmail} fps={fps} />)}
      {tMs >= tSocial && item(2, PH_H, `translateY(${lerp(50, 0, j[2])}px) scale(${lerp(0.94, 1, j[2])})`,
        <IgPhone w={PH_W} h={PH_H} assets={assets} />)}
    </div>
  );
};
