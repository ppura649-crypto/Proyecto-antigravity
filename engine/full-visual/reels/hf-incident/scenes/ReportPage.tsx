// The real report page, redrawn: openai.com/index/hugging-face-incident-and-the-road-ahead (screenshot read
// 2026-09-26). Its header (wordmark, nav, "Try ChatGPT" pill), the date line, the H1 verbatim, its first two buttons
// verbatim, then the page's first sentence verbatim (facts.md section 1). Only what the sentence needs, at phone size.
import React from "react";
import { arrive, blurIn, draw, ease, pop, prog, useScene } from "../../../src/engine";
import { Logo } from "./parts";

export const PAGE = { left: 40, top: 590, w: 820, h: 780, headerH: 86, markX: 34, markSize: 40 };
const INK = "#0D0D0D";
const DIM = "#6E6E73";
const SANS = "Inter, sans-serif";
const BODY =
  "In July 2026, during internal cybersecurity evaluations, OpenAI models circumvented controls designed to isolate them from the internet and compromised parts of OpenAI’s internal research infrastructure and Hugging Face’s systems.";

export type PageCues = { rise: number; report: number; wild: number; out: number };

const Header: React.FC<{ docked: number }> = ({ docked }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PAGE.w, height: PAGE.headerH, display: "flex", alignItems: "center", borderBottom: "1px solid #ECECEC" }}>
    <div style={{ width: PAGE.markSize, marginLeft: PAGE.markX, opacity: docked }}>
      <Logo name="openai" size={PAGE.markSize} />
    </div>
    <span style={{ marginLeft: 12, fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: -0.8, color: INK, opacity: docked }}>OpenAI</span>
    <span style={{ marginLeft: 36, fontFamily: SANS, fontSize: 26, color: INK, opacity: 0.85 }}>Research</span>
    <span style={{ marginLeft: 24, fontFamily: SANS, fontSize: 26, color: INK, opacity: 0.85 }}>Products</span>
    <span style={{ marginLeft: "auto", marginRight: 26, background: INK, color: "#FFF", fontFamily: SANS, fontWeight: 500, fontSize: 24, borderRadius: 999, padding: "11px 22px" }}>Try ChatGPT {"↗"}</span>
  </div>
);

/** the title, and the marker stroke that underlines it on "wild" */
const Title: React.FC<{ c: PageCues }> = ({ c }) => {
  const { f } = useScene();
  const wobble = f >= c.wild ? Math.sin((f - c.wild) * 0.25) * 0.6 : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 190, width: PAGE.w, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 60, lineHeight: "70px", letterSpacing: -1.6, color: INK }}>
      <div style={blurIn(f, c.rise + 8, { dur: 9, rise: 18 })}>The Hugging Face incident</div>
      <div style={{ ...blurIn(f, c.rise + 13, { dur: 9, rise: 18 }), position: "relative", display: "inline-block" }}>
        and the road ahead
        <svg width={600} height={60} viewBox="0 0 600 60" style={{ position: "absolute", left: -32, top: 58, overflow: "visible", transform: `rotate(${wobble.toFixed(2)}deg)` }}>
          <path d="M 8 30 C 120 14, 260 40, 380 22 S 560 28, 592 18" fill="none" stroke="#2E7AEA" strokeWidth={11} strokeLinecap="round" {...draw(f, c.wild - 10, 12)} />
          <path d="M 40 48 C 180 36, 330 54, 560 38" fill="none" stroke="#2E7AEA" strokeWidth={7} strokeLinecap="round" opacity={0.75} {...draw(f, c.wild - 2, 10)} />
        </svg>
      </div>
    </div>
  );
};

/** the page's two first buttons; "Read the technical report" is pressed on "report" */
const Buttons: React.FC<{ c: PageCues }> = ({ c }) => {
  const { f } = useScene();
  const press = f >= c.report ? 1 - 0.05 * Math.sin(Math.PI * prog(f, c.report, 10, ease.linear)) : 1;
  const ring = prog(f, c.report, 16, ease.out);
  return (
    <div style={{ position: "absolute", left: 0, top: 380, width: PAGE.w, display: "flex", justifyContent: "center", gap: 16, fontFamily: SANS, fontWeight: 500, fontSize: 27 }}>
      <span style={{ ...pop(f, c.report - 4, { dur: 9, from: 0.7 }), position: "relative", display: "inline-block" }}>
        <span style={{ display: "inline-block", background: INK, color: "#FFF", borderRadius: 999, padding: "16px 28px", transform: `scale(${press.toFixed(4)})` }}>Read the technical report</span>
        {ring > 0 && ring < 1 && (
          <span style={{ position: "absolute", inset: -14 * ring, borderRadius: 999, border: `3px solid ${INK}`, opacity: 1 - ring }} />
        )}
      </span>
      <span style={{ ...pop(f, c.report + 2, { dur: 9, from: 0.7 }), display: "inline-block", background: "#F0F0F2", color: INK, borderRadius: 999, padding: "16px 26px" }}>Read METR report {"↗"}</span>
    </div>
  );
};

export const ReportPage: React.FC<{ c: PageCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.rise || f > c.out + 14) return null;
  const y = (1 - arrive(f, c.rise, 22)) * 820 - prog(f, c.out, 12, ease.in) * 260;
  const o = prog(f, c.rise, 2, ease.linear) * (1 - prog(f, c.out + 4, 8, ease.linear));
  const docked = prog(f, c.rise + 14, 6, ease.linear);
  return (
    <div style={{ position: "absolute", left: PAGE.left, top: PAGE.top + y, width: PAGE.w, height: PAGE.h, background: "#FFFFFF", borderRadius: 30, overflow: "hidden", opacity: o, boxShadow: "0 40px 90px rgba(0,0,0,0.13), 0 6px 18px rgba(0,0,0,0.06)", border: "1px solid #E8E8EA" }}>
      <Header docked={docked} />
      <div style={{ position: "absolute", left: 0, top: 128, width: PAGE.w, textAlign: "center", fontFamily: SANS, fontSize: 30, color: DIM, ...blurIn(f, c.rise + 6, { dur: 8 }) }}>August 26, 2026</div>
      <Title c={c} />
      <Buttons c={c} />
      <div style={{ position: "absolute", left: 70, top: 500, width: 680, fontFamily: SANS, fontSize: 32, lineHeight: "46px", color: "#2B2B2E", ...blurIn(f, c.rise + 16, { dur: 10 }) }}>
        {BODY}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 110, background: "linear-gradient(transparent, #FFFFFF)" }} />
    </div>
  );
};

/** the OpenAI mark: big and centred on the first word, then flown into the page's header as the page rises */
export const FlyingMark: React.FC<{ t0: number; rise: number; out: number }> = ({ t0, rise, out }) => {
  const { f } = useScene();
  if (f > rise + 24) return null;
  const k = arrive(f, rise, 22);
  const size = 230 + (PAGE.markSize - 230) * k;
  const endX = PAGE.left + PAGE.markX;
  const endY = PAGE.top + (PAGE.headerH - PAGE.markSize) / 2;
  const x = 450 - 115 + (endX - (450 - 115)) * k;
  const y = 800 + (1 - arrive(f, t0, 18)) * 140 + (endY - 800) * k;
  void out;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: prog(f, t0, 3, ease.linear) * (1 - prog(f, rise + 20, 4, ease.linear)) }}>
      <Logo name="openai" size={size} />
    </div>
  );
};
