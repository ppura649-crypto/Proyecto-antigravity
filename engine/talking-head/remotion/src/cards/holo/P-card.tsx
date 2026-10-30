import React from "react";
import { Img } from "remotion";
import { CalGrid, type CalT } from "./P-cal";
import { CH_NAME, ChannelMark, HFONT, INK, MUTED, PILL, RANGE_LABEL, SHADOW, type Channel, clamp, eInOut, land, mix, pick, win } from "./P-kit";
// The Holo plan card (reference edit K B5 -> B6, called back in B20 and B22). A Holo chat answer: the mark, "Recommended
// goal · next 30 days", the goal in plain words, the channels it uses, and Holo's date picker with day 30 flagged.
// On BUILD the same card grows: the answer column steps aside and the picker opens into the month's content
// calendar, real posts landing on their days. White, square outer corners, rounded internals like Holo's own UI.
export type PlanT = CalT & { enter: number; header: number; words: [number, number]; chips: number; grow: [number, number] };
export const CARD_W = 1000;
export const cardH = (m: number) => mix(424, 634, m);
/** the live height: a one-line answer strip while Holo thinks, opening as the answer streams in, then the calendar */
export const planH = (tMs: number, T: PlanT) => {
  const m = eInOut(win(tMs, T.grow[0], T.grow[1]));
  return mix(mix(92, 424, eInOut(win(tMs, T.header, T.header + 320))), 634, m);
};

const GOAL = "Launch the fall drop and grow Instagram with 3 posts a week, backed by Meta ads".split(" ");
const CHIPS: Channel[] = ["ig", "meta", "tiktok", "email"];

const Dots: React.FC<{ tMs: number }> = ({ tMs }) => (
  <div style={{ display: "flex", gap: 9, paddingTop: 12 }}>
    {[0, 1, 2].map((i) => {
      const k = 0.5 + 0.5 * Math.sin(tMs / 130 - i * 0.9);
      return <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: `rgba(17,17,17,${0.25 + 0.5 * k})`, transform: `translateY(${-4 * k}px)` }} />;
    })}
  </div>
);

const GoalColumn: React.FC<{ tMs: number; T: PlanT; m: number; assets: string[] }> = ({ tMs, T, m, assets }) => {
  const out = eInOut(win(tMs, T.grow[0], T.grow[0] + 170));
  if (out >= 1) return null;
  const n = GOAL.length;
  return (
    <div style={{ position: "absolute", left: 28, top: 84, width: 548, opacity: 1 - out, transform: `translateX(${-34 * out}px)` }}>
      <div style={{ fontSize: 36, lineHeight: "46px", fontWeight: 700, color: INK, letterSpacing: -0.4 }}>
        {GOAL.map((wd, i) => {
          const e = land(tMs, mix(T.words[0], T.words[1], i / (n - 1)) - 130, 150);
          return <span key={i} style={{ opacity: e, display: "inline-block", transform: `translateY(${(1 - e) * 8}px)`, marginRight: 10 }}>{wd}</span>;
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        {CHIPS.map((ch, i) => {
          const e = land(tMs, T.chips + i * 70, 220);
          return (
            <div key={ch} style={{ height: 52, padding: "0 20px 0 12px", borderRadius: 999, background: PILL, display: "flex", alignItems: "center", gap: 10,
              fontSize: 24, fontWeight: 700, color: INK, opacity: e, transform: `scale(${0.9 + 0.1 * e})` }}>
              <ChannelMark ch={ch} s={30} assets={assets} />{CH_NAME[ch]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** The card at its natural size (CARD_W x cardH(m)); the caller places and moves it. */
export const PlanCard: React.FC<{ tMs: number; T: PlanT; assets: string[] }> = ({ tMs, T, assets }) => {
  const m = eInOut(win(tMs, T.grow[0], T.grow[1]));
  const H = planH(tMs, T);
  const hdr = land(tMs, T.header, 200);
  const cal = land(tMs, T.cal, 260);
  const oldOut = eInOut(win(tMs, T.grow[0], T.grow[0] + 120));
  const swapTitle = eInOut(win(tMs, T.grow[0] + 120, T.grow[0] + 280));
  // the range label: above the picker, then a pill at the header's right
  const pillW = 214;
  return (
    <div style={{ position: "relative", width: CARD_W, height: H, background: "#FFFFFF", boxShadow: SHADOW, overflow: "hidden", fontFamily: HFONT }}>
      <Img src={pick(assets, "holo-mark-black.png")} style={{ position: "absolute", left: 28, top: 26, width: 46, height: 36 }} />
      <div style={{ position: "absolute", left: 90, top: 22, height: 44, display: "flex", alignItems: "center" }}>
        {hdr <= 0 && <Dots tMs={tMs} />}
        {hdr > 0 && oldOut < 1 && (
          <div style={{ fontSize: 28, fontWeight: 700, color: INK, whiteSpace: "nowrap", opacity: hdr * (1 - oldOut), position: "absolute", left: 0 }}>
            Recommended goal <span style={{ color: MUTED }}>· next 30 days</span>
          </div>
        )}
        {swapTitle > 0 && (
          <div style={{ fontSize: 34, fontWeight: 800, color: INK, whiteSpace: "nowrap", letterSpacing: -0.5, opacity: swapTitle, position: "absolute", left: 0,
            transform: `translateY(${(1 - swapTitle) * 10}px)` }}>30 day marketing plan</div>
        )}
      </div>
      <GoalColumn tMs={tMs} T={T} m={m} assets={assets} />
      {cal > 0 && (
        <div style={{ position: "absolute", left: mix(604, CARD_W - 24 - pillW, m), top: mix(84, 22, m), width: mix(368, pillW, m), height: 44,
          display: "flex", alignItems: "center", justifyContent: m < 0.5 ? "flex-start" : "center", borderRadius: 999,
          background: `rgba(243,243,243,${m})`, fontSize: 24, fontWeight: 800, color: INK, opacity: cal, whiteSpace: "nowrap" }}>
          {RANGE_LABEL}
        </div>
      )}
      <CalGrid tMs={tMs} m={m} T={T} assets={assets} />
    </div>
  );
};

/** Place the card centred in the event's box, with its entrance, a slow living push, and a short exit. */
export const PlacedPlan: React.FC<{ tMs: number; w: number; h: number; T: PlanT; exitAt: number; assets: string[]; focus?: { x: number; y: number } }> = ({ tMs, w, h, T, exitAt, assets, focus }) => {
  const H = planH(tMs, T);
  const e = land(tMs, T.enter, 320);
  const x = win(tMs, exitAt - 90, exitAt);
  const push = 1 + 0.02 * clamp((tMs - T.enter) / 4000);
  const origin = focus ? `${focus.x}px ${focus.y}px` : "50% 50%";
  return (
    <div style={{ position: "absolute", left: (w - CARD_W) / 2, top: (h - H) / 2, width: CARD_W, height: H, transformOrigin: origin,
      opacity: clamp(e * 1.4) * (1 - x), transform: `translateY(${(1 - e) * 40 - 18 * x}px) scale(${(0.96 + 0.04 * e) * push})` }}>
      <PlanCard tMs={tMs} T={T} assets={assets} />
    </div>
  );
};
