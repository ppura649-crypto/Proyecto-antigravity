import React from "react";
import { Easing, Img, staticFile } from "remotion";
import { GREEN, HOLO_FONT, INK, MUTED, SHADOW, lerp, sp } from "./B-kit";
// HoloPlanCard (reference edit K B5/B6, reused by family D for B20): a goal card drawn in Holo's UI style, titled with
// the real chat title from Holo's sidebar ("30 day marketing plan"). No numbers or goal values of ours.
// Every stage is keyed on a beat; a missing beat means that stage is already done, so a callback can mount it
// settled and only pass `data.swap`.
//   beats.title  the title types in          beats.goal  the 30 day cells appear
//   beats.fill   the days start filling       beats.days  the fill ends and the flag lands on day 30
//   beats.build  the card grows, lanes open   beats.plan  week blocks drop into the lanes
//   data.swap = { atMs, lane, week }          one week block slides out and a new one slides in
export type PlanBeats = Partial<Record<"title" | "goal" | "fill" | "days" | "build" | "plan", number>>;
export type PlanData = { title?: string; lanes?: string[]; swap?: { atMs: number; lane: number; week: number } };

const LANE_FILL = ["#1A73E8", "linear-gradient(90deg, #8E5CF7, #E0457B)", "#2FB457"];
const WEEKS: [number, number][] = [[0, 7], [7, 14], [14, 21], [21, 30]];
const PAST = -1e9;

export const HoloPlanCard: React.FC<{ tMs: number; w: number; h: number; fps: number; beats: PlanBeats; mark: string; data?: PlanData }> = ({ tMs, w, h, fps, beats, mark, data }) => {
  const b = (k: keyof PlanBeats) => beats[k] ?? PAST;
  const titleText = data?.title ?? "30 day marketing plan";
  const lanes = data?.lanes ?? ["Ads", "Social", "Email"];
  const lp = sp(tMs, b("build"), fps, { damping: 15, stiffness: 150 });
  const gp = sp(tMs, b("goal") - 120, fps, { damping: 14, stiffness: 170 });
  const W = Math.min(w - 80, 1000);
  const H = Math.min(h - 26, 150 + 250 * gp + 220 * lp);
  const x0 = 40 + 150 * lp, x1 = W - 44;
  const sy = 200 - 52 * lp, ch = 72 - 32 * lp, gap = 5;
  const cw = (x1 - x0 - 29 * gap) / 30;
  const cx = (d: number) => x0 + d * (cw + gap);
  const nT = Math.round(lerp(tMs, b("title"), b("title") + 480, 0, titleText.length, Easing.linear));
  const typing = tMs >= b("title") && nT < titleText.length;
  const flag = sp(tMs, b("days"), fps, { damping: 9, stiffness: 220, mass: 0.7 });
  return (
    <div style={{ position: "absolute", left: (w - W) / 2, top: h - H - 16, width: W, height: H, borderRadius: 0, background: "#FFFFFF", boxShadow: SHADOW, overflow: "hidden", fontFamily: HOLO_FONT }}>
      <Img src={staticFile(mark)} style={{ position: "absolute", left: 40, top: 40, width: 62, height: 48 }} />
      <div style={{ position: "absolute", left: 122, top: 34, fontSize: 46, fontWeight: 700, color: INK, letterSpacing: -0.6, whiteSpace: "nowrap" }}>
        {titleText.slice(0, nT)}
        {typing && <span style={{ display: "inline-block", width: 4, height: 44, background: INK, marginLeft: 3, verticalAlign: -6 }} />}
      </div>
      {tMs < b("title") && <div style={{ position: "absolute", left: 122, top: 46, width: 520, height: 30, borderRadius: 15, background: `linear-gradient(90deg, #F1F1F1 ${lerp(tMs % 900, 0, 900, -40, 100, Easing.linear)}%, #FAFAFA ${lerp(tMs % 900, 0, 900, -20, 120, Easing.linear)}%, #F1F1F1)` }} />}
      {/* the 30 day strip */}
      {Array.from({ length: 30 }, (_, d) => {
        const a = sp(tMs, b("goal") + d * 11, fps, { damping: 12, stiffness: 240 });
        const fillAt = b("fill") + ((b("days") - b("fill")) * d) / 29;
        const f = sp(tMs, fillAt, fps, { damping: 10, stiffness: 300, mass: 0.5 });
        return (
          <div key={d} style={{ position: "absolute", left: cx(d), top: sy, width: cw, height: ch, borderRadius: 4, background: "#EFEFEF", transform: `scaleY(${a})`, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: GREEN, opacity: Math.min(1, f * 1.6), transform: `scale(${0.6 + 0.4 * f})`, borderRadius: "inherit" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: x0, top: sy + ch + 12, fontSize: 27, fontWeight: 600, color: MUTED, opacity: sp(tMs, b("goal"), fps) }}>Day 1</div>
      <div style={{ position: "absolute", right: W - x1, top: sy + ch + 12, fontSize: 27, fontWeight: 700, color: tMs >= b("days") ? INK : MUTED, opacity: sp(tMs, b("goal") + 330, fps) }}>Day 30</div>
      {/* the flag on day 30, and its line down through the lanes */}
      <div style={{ position: "absolute", left: cx(29) + cw / 2 - 2, top: sy + ch, width: 0, height: 380 * lp, borderLeft: "3px dashed rgba(17,17,17,0.35)", opacity: lp }} />
      <div style={{ position: "absolute", left: cx(29) + cw / 2 - 2, top: sy - 84, opacity: Math.min(1, flag * 2), transform: `translateY(${(1 - flag) * -24}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: 86, borderRadius: 3, background: INK }} />
        <div style={{ position: "absolute", left: 5, top: 2, width: 46, height: 32, background: GREEN, clipPath: "polygon(0 0, 100% 0, 78% 50%, 100% 100%, 0 100%)", transformOrigin: "0 50%", transform: `skewY(${Math.sin(tMs / 160) * 4}deg)` }} />
      </div>
      <Lanes tMs={tMs} fps={fps} lanes={lanes} lp={lp} build={b("build")} plan={b("plan")} cx={cx} cw={cw} x0={x0} x1={x1} top={sy + ch + 62} swap={data?.swap} />
    </div>
  );
};

const Lanes: React.FC<{ tMs: number; fps: number; lanes: string[]; lp: number; build: number; plan: number; cx: (d: number) => number; cw: number; x0: number; x1: number; top: number; swap?: PlanData["swap"] }> = (p) => {
  if (p.lp <= 0.001) return null;
  return (
    <>
      {p.lanes.map((name, li) => {
        const y = p.top + li * 108;
        const l = sp(p.tMs, p.build + 120 + li * 80, p.fps, { damping: 13, stiffness: 200 });
        return (
          <React.Fragment key={name}>
            <div style={{ position: "absolute", left: 40, top: y + 20, fontSize: 31, fontWeight: 600, color: INK, opacity: Math.min(1, l * 1.6), transform: `translateX(${(1 - l) * -20}px)` }}>{name}</div>
            <div style={{ position: "absolute", left: p.x0, top: y, width: (p.x1 - p.x0) * l, height: 80, borderRadius: 0, background: "#F5F5F5" }} />
            {WEEKS.map(([d0, d1], wi) => {
              const swapped = p.swap && p.swap.lane === li && p.swap.week === wi;
              const e = sp(p.tMs, p.plan + wi * 95 + li * 45, p.fps, { damping: 10, stiffness: 210, mass: 0.7 });
              const so = swapped ? lerp(p.tMs, p.swap!.atMs, p.swap!.atMs + 260, 0, 1, Easing.in(Easing.cubic)) : 0;
              const si = swapped ? sp(p.tMs, p.swap!.atMs + 200, p.fps, { damping: 11, stiffness: 200 }) : 0;
              const bx = p.cx(d0) + 3, bw = p.cx(d1 - 1) + p.cw - bx - 3;
              const block = (dx: number, op: number, bg: string, border?: string) => (
                <div style={{ position: "absolute", left: bx + dx, top: y + 8, width: bw, height: 64, borderRadius: 6, background: bg, opacity: op, boxShadow: "0 4px 10px rgba(0,0,0,0.12)", border, boxSizing: "border-box", transform: `translateY(${(1 - e) * -26}px) scale(${0.92 + 0.08 * e})` }} />
              );
              return (
                <React.Fragment key={wi}>
                  {block(so * 60, Math.min(1, e * 2) * (1 - so), LANE_FILL[li % 3]!)}
                  {swapped && si > 0 && block((1 - si) * -60, Math.min(1, si * 2), "#FFFFFF", `4px solid ${li === 1 ? "#B45CE0" : li === 0 ? "#1A73E8" : "#2FB457"}`)}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};
