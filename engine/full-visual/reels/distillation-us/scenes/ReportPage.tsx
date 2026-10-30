// The real report page, redrawn at phone scale: anthropic.com/threat-intelligence-report-september-2026 (read
// 2026-09-26). Its header (the black mark, the nav, the dark "Try Claude" button), the cream hero with the page's own
// H1 and its two buttons, the first line of the intro, then the Alibaba section: its H2 verbatim, and the section's
// closing italic line verbatim. Everything under that line (the counter, the months) is our annotation of that line.
import React from "react";
import { arrive, blurIn, ease, pop, prog, useScene } from "../../../src/engine";
import { Logo } from "./parts";
import { SERIF } from "./OpeningBits";

export const PAGE = {
  left: 110, top: 640, w: 840, h: 810,
  ink: "#141413", dim: "#5E5D59", hero: "#F0EEE6", body: "#FAF9F5", rule: "#E3E0D5",
  markX: 40, markSize: 46, headerH: 100,
  h2Y: 860, lineY: 1110, countY: 1290, monthsY: 1510,
  scroll1: 470, scroll2: 830,
};
const SANS = "Figtree, sans-serif";
const TITLE = ["Detecting and", "countering misuse of", "AI: September 2026"];
const H2 = "GTG 16005: Chain-of-thought distillation and AI R&D campaign by Alibaba (Qwen / Tongyi Lab)";
const LEAD = "Scale of distillation attacks attributable to Alibaba between May and July 2026: ";
const HIT = "over 151 million exchanges observed.";
const MONTHS = ["May", "June", "July"];

export type PageState = {
  titleAt: number; buttonsAt: number; alibabaAt: number; docked: boolean;
  hi: number; count: number | null; countAt: number; exchangesAt: number; claudeAt: number; months: number[];
};

const Header: React.FC<{ docked: boolean }> = ({ docked }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PAGE.w, height: PAGE.headerH, display: "flex", alignItems: "center", borderBottom: `1px solid ${PAGE.rule}` }}>
    <div style={{ width: PAGE.markSize, marginLeft: PAGE.markX, opacity: docked ? 1 : 0 }}>
      <Logo name="anthropic" size={PAGE.markSize} />
    </div>
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 30, fontFamily: SANS, fontSize: 26, color: PAGE.ink }}>
      <span>Research</span>
      <span>Policy</span>
      <span>News</span>
      <span style={{ background: PAGE.ink, color: "#FFFFFF", borderRadius: 10, padding: "12px 22px", marginRight: 36 }}>Try Claude</span>
    </div>
  </div>
);

const Hero: React.FC<{ s: PageState }> = ({ s }) => {
  const { f } = useScene();
  return (
    <div style={{ position: "absolute", left: 0, top: PAGE.headerH, width: PAGE.w, height: 480, background: PAGE.hero, textAlign: "center" }}>
      <div style={{ marginTop: 74, fontFamily: SANS, fontWeight: 700, fontSize: 70, lineHeight: "76px", letterSpacing: -1.6, color: PAGE.ink }}>
        {TITLE.map((l, i) => (
          <div key={l} style={blurIn(f, s.titleAt + i * 6, { dur: 9, rise: 22 })}>{l}</div>
        ))}
      </div>
      <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 18, fontFamily: SANS, fontSize: 28 }}>
        <span style={{ ...pop(f, s.buttonsAt, { dur: 9, from: 0.8 }), background: PAGE.ink, color: "#FFFFFF", borderRadius: 10, padding: "14px 26px" }}>Download report</span>
        <span style={{ ...pop(f, s.buttonsAt + 5, { dur: 9, from: 0.8 }), boxShadow: `inset 0 0 0 2px ${PAGE.ink}`, color: PAGE.ink, borderRadius: 10, padding: "14px 26px" }}>Download IOCs</span>
      </div>
    </div>
  );
};

/** the section's closing line, verbatim, italic serif as on the page; the hit phrase gets a marker on "151" */
const ScaleLine: React.FC<{ hi: number }> = ({ hi }) => (
  <div style={{ position: "absolute", left: 60, top: PAGE.lineY, width: 720, fontFamily: SERIF, fontStyle: "italic", fontSize: 36, lineHeight: "52px", color: PAGE.ink }}>
    {LEAD}
    <span
      style={{
        backgroundImage: "linear-gradient(rgba(46,122,234,0.24), rgba(46,122,234,0.24))", backgroundRepeat: "no-repeat",
        backgroundSize: `${(hi * 100).toFixed(1)}% 100%`, WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone",
        fontWeight: hi > 0.5 ? 600 : 400, padding: "2px 0",
      }}
    >
      {HIT}
    </span>
  </div>
);

const Figure: React.FC<{ s: PageState }> = ({ s }) => {
  const { f } = useScene();
  if (s.count === null) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: PAGE.countY, width: 720, fontFamily: SANS }}>
      <div style={{ ...blurIn(f, s.countAt, { dur: 8 }), fontSize: 124, lineHeight: "130px", fontWeight: 700, letterSpacing: -2, color: PAGE.ink, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(s.count).toLocaleString("en-US")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, fontSize: 40, fontWeight: 600, color: PAGE.dim, height: 56 }}>
        {f >= s.exchangesAt && <span style={blurIn(f, s.exchangesAt, { dur: 8, rise: 10 })}>exchanges with</span>}
        {f >= s.claudeAt && (
          <span style={{ ...pop(f, s.claudeAt, { dur: 10 }), display: "flex", alignItems: "center", gap: 10, color: PAGE.ink }}>
            <Logo name="claude" size={46} />
            Claude
          </span>
        )}
      </div>
    </div>
  );
};

/** May, June, July: three cells that fill left to right, the last one on "months" */
const Months: React.FC<{ fill: number[] }> = ({ fill }) => (
  <div style={{ position: "absolute", left: 60, top: PAGE.monthsY, display: "flex", gap: 12, fontFamily: SANS }}>
    {MONTHS.map((m, i) => (
      <div key={m} style={{ position: "relative", width: 232, height: 78, borderRadius: 10, background: "#E8E6DC", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(fill[i] * 100).toFixed(1)}%`, background: PAGE.ink }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 700, color: fill[i] > 0.5 ? "#FFFFFF" : PAGE.dim }}>{m}</div>
      </div>
    ))}
  </div>
);

export const ReportPage: React.FC<{ s: PageState; scroll: number }> = ({ s, scroll }) => {
  const { f } = useScene();
  return (
    <div style={{ position: "absolute", left: 0, top: -scroll, width: PAGE.w, height: 1700 }}>
      <Header docked={s.docked} />
      <Hero s={s} />
      <div style={{ position: "absolute", left: 60, top: 640, width: 720, fontFamily: SERIF, fontSize: 32, lineHeight: "48px", color: PAGE.ink }}>
        Over the past eight months, our Threat Intelligence team identified and disrupted operations in which threat actors
        tried to use Claude for malicious activity.
      </div>
      <div style={{ position: "absolute", left: 60, top: PAGE.h2Y, width: 560, fontFamily: SANS, fontSize: 44, lineHeight: "54px", fontWeight: 700, letterSpacing: -0.6, color: PAGE.ink }}>
        {H2}
      </div>
      {f >= s.alibabaAt && (
        <div style={{ position: "absolute", left: 620, top: PAGE.h2Y + 16, opacity: prog(f, s.alibabaAt, 3, ease.linear), transform: `translateX(${((1 - arrive(f, s.alibabaAt, 20)) * 320).toFixed(1)}px) rotate(${((1 - arrive(f, s.alibabaAt, 20)) * 40).toFixed(1)}deg)` }}>
          <Logo name="alibaba" size={190} style={{ marginTop: -60 }} />
        </div>
      )}
      <ScaleLine hi={s.hi} />
      <Figure s={s} />
      {s.months.some((m) => m > 0) && <Months fill={s.months} />}
    </div>
  );
};
