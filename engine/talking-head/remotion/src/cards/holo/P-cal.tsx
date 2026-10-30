import React from "react";
import { Img } from "remotion";
import { ChannelMark, DAY30, Flag, GREEN, HFONT, INK, MUTED, POSTS, SWAP, clamp, dateOf, eIn, eInOut, land, mix, pick, win } from "./P-kit";
// The plan calendar (reference edit K B5/B6/B20/B22). One grid of 35 day cells (Mon Oct 5 -> Sun Nov 8) that morphs
// from Holo's compact date picker (m = 0, right column of the goal answer) into the full content calendar
// (m = 1), where real posts land on their days. Times are spine ms; a time in the far past = already done.
export type CalT = { cal: number; sweep: [number, number]; flag: number; posts: number; swap?: number };

// compact picker (card-inner px) and full calendar geometry
const C = { x: 604, y: 160, w: 368, gap: 4, rh: 44 };
const F = { x: 24, y: 128, w: 952, gap: 8, rh: 90 };
const colW = (g: typeof C) => (g.w - 6 * g.gap) / 7;
export const cellRect = (r: number, c: number, m: number) => {
  const cw = colW(C), fw = colW(F);
  return {
    x: mix(C.x + c * (cw + C.gap), F.x + c * (fw + F.gap), m),
    y: mix(C.y + r * (C.rh + C.gap), F.y + r * (F.rh + F.gap), m),
    w: mix(cw, fw, m), h: mix(C.rh, F.rh, m),
  };
};
const WD = ["M", "T", "W", "T", "F", "S", "S"];
const WD_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CalGrid: React.FC<{ tMs: number; m: number; T: CalT; assets: string[] }> = ({ tMs, m, T, assets }) => {
  const a = land(tMs, T.cal, 260);
  if (a <= 0) return null;
  const flagIn = land(tMs, T.flag, 240);
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 35; i++) {
    const r = Math.floor(i / 7), c = i % 7, R = cellRect(r, c, m);
    const inRange = i <= DAY30;
    // the range fills day by day across the sweep window (compact: Holo-green tint; full: the calendar grey)
    const lit = inRange ? eInOut(win(tMs, mix(T.sweep[0], T.sweep[1], i / DAY30) - 60, mix(T.sweep[0], T.sweep[1], i / DAY30) + 60)) : 0;
    const tint = `rgba(52,199,89,${0.16 * lit * (1 - m)})`;
    const grey = `rgba(0,0,0,${(inRange ? 0.04 : 0.018) * m})`;
    const { m: mo, d } = dateOf(i);
    const is30 = i === DAY30;
    const num = i === 0 || (mo === 1 && d === 1) ? `${mo === 0 ? "Oct" : "Nov"} ${d}` : `${d}`;
    const fs = mix(22, 21, m);
    cells.push(
      <div key={i} style={{ position: "absolute", left: R.x, top: R.y, width: R.w, height: R.h, borderRadius: mix(8, 12, m),
        background: `linear-gradient(${tint}, ${tint}), linear-gradient(${grey}, ${grey})` }}>
        <div style={{ position: "absolute", left: mix(R.w / 2, 10, m), top: mix(R.h / 2, 16, m), transform: `translate(${-50 * (1 - m)}%, -50%)`,
          fontSize: fs, fontWeight: is30 ? 800 : 600, whiteSpace: "nowrap", lineHeight: 1,
          color: is30 && flagIn > 0 ? "#fff" : inRange ? INK : "#C2C2C2",
          padding: is30 ? `${mix(9, 5, m)}px ${mix(9, 9, m)}px` : 0, borderRadius: 999,
          background: is30 ? `rgba(17,17,17,${flagIn})` : "transparent" }}>
          {m < 0.5 && num.includes(" ") ? `${d}` : num}
        </div>
        {is30 && flagIn > 0 && (
          <div style={{ position: "absolute", right: mix(-20, 12, m), top: mix(4, 10, m), opacity: clamp(flagIn * 1.5),
            transform: `translateY(${(1 - flagIn) * -14}px)` }}>
            <Flag s={mix(26, 30, m)} />
          </div>
        )}
      </div>,
    );
  }
  // weekday header row: single letters over the picker, day names over the calendar
  const heads = WD.map((l, c) => {
    const R = cellRect(0, c, m);
    return (
      <div key={c} style={{ position: "absolute", left: R.x, width: R.w, top: mix(C.y - 34, F.y - 34, m), textAlign: m < 0.5 ? "center" : "left",
        paddingLeft: m < 0.5 ? 0 : 10, boxSizing: "border-box", fontSize: 20, fontWeight: 700, color: MUTED }}>
        {m < 0.5 ? l : WD_FULL[c]}
      </div>
    );
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: a, transform: `translateY(${(1 - a) * 16}px)`, fontFamily: HFONT }}>
      {heads}
      {cells}
      {m > 0.02 && POSTS.map((p, k) => (
        <PostTile key={k} tMs={tMs} k={k} R={cellRect(p.r, p.c, m)} at={T.posts + k * 28} swap={k === SWAP.index ? T.swap : undefined} assets={assets} m={m} />
      ))}
    </div>
  );
};

const Tag: React.FC<{ text: string; fg: string; bg: string; op: number }> = ({ text, fg, bg, op }) => (
  <div style={{ position: "absolute", right: 6, top: 6, padding: "4px 9px", borderRadius: 999, background: bg, color: fg,
    fontSize: 18, fontWeight: 800, opacity: op, transform: `translateY(${(1 - op) * -6}px)`, whiteSpace: "nowrap", zIndex: 3 }}>{text}</div>
);

/** one post on its day: the real creative, its day number, and a white chip with the channel mark and time */
const Face: React.FC<{ img: string; day: string; label: string; ch: any; assets: string[]; gray?: number }> = ({ img, day, label, ch, assets, gray = 0 }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", background: "#ddd" }}>
    <Img src={pick(assets, img)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%",
      filter: gray > 0 ? `grayscale(${gray}) brightness(${1 + 0.15 * gray})` : undefined }} />
    <div style={{ position: "absolute", left: 6, top: 6, minWidth: 28, height: 28, padding: "0 6px", boxSizing: "border-box", borderRadius: 999,
      background: "rgba(255,255,255,0.94)", fontSize: 18, fontWeight: 800, color: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
    <div style={{ position: "absolute", left: 6, bottom: 6, height: 30, padding: "0 8px 0 5px", borderRadius: 8, background: "rgba(255,255,255,0.96)",
      display: "flex", alignItems: "center", gap: 5, fontSize: 19, fontWeight: 800, color: INK, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
      <ChannelMark ch={ch} s={21} assets={assets} />{label}
    </div>
  </div>
);

const PostTile: React.FC<{ tMs: number; k: number; R: ReturnType<typeof cellRect>; at: number; swap?: number; assets: string[]; m: number }> = ({ tMs, k, R, at, swap, assets, m }) => {
  const e = land(tMs, at, 240);
  if (e <= 0) return null;
  const p = POSTS[k]!;
  const day = `${dateOf(p.r * 7 + p.c).d}`;
  // B20 swap: "Low reach" tag, the post greys out, flips over, the new creative flips in with "New"
  const s = swap ?? 1e12;
  const tagIn = land(tMs, s, 180);
  const gray = win(tMs, s + 90, s + 210);
  const flipOut = eIn(win(tMs, s + 190, s + 300));
  const flipIn = land(tMs, s + 300, 170);
  const showNew = tMs >= s + 300;
  const base: React.CSSProperties = { position: "absolute", left: R.x, top: R.y, width: R.w, height: R.h, zIndex: 2,
    opacity: clamp(e * 1.6), boxShadow: `0 ${4 * m}px ${12 * m}px rgba(0,0,0,${0.18 * m})`, borderRadius: 12 };
  if (!showNew) {
    return (
      <div style={{ ...base, transform: `perspective(700px) translateY(${(1 - e) * -16}px) scale(${0.88 + 0.12 * e}) rotateY(${90 * flipOut}deg)` }}>
        <Face img={p.img} day={day} label={p.label} ch={p.ch} assets={assets} gray={gray * 0.9} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: `rgba(255,255,255,${0.35 * gray})` }} />
        {tagIn > 0 && <Tag text="Low reach" fg="#D3345F" bg="#FDE7EC" op={tagIn} />}
      </div>
    );
  }
  return (
    <div style={{ ...base, opacity: 1, transform: `perspective(700px) rotateY(${-90 * (1 - flipIn)}deg)` }}>
      <Face img={SWAP.img} day={day} label={p.label} ch={p.ch} assets={assets} />
      <div style={{ position: "absolute", inset: -3, borderRadius: 14, border: `3px solid ${GREEN}`, opacity: flipIn }} />
      <Tag text="New" fg="#17873A" bg="#E4F7E9" op={flipIn} />
    </div>
  );
};
