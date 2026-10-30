// report, light, 3.76-15.2 s. Starts at HANDOFF.pair with the stream flowing. "Anthropic": the black Anthropic mark
// arrives above the pair. "report": the pair shrinks to a strip at the top (the stream keeps flowing, small) while the
// real report page rises and the Anthropic mark docks into its header; the title builds line by line. "how.": an
// Apple-like scroll to the Alibaba section. "Alibaba": the Alibaba mark docks by the heading. "collected": a second
// scroll. "over" -> "151": a counter lands on 151,000,000 exactly on the word as the report's line is marked.
// "exchanges" / "Claude": its label. "three months": May, June, July fill. "Qwen": the strip makes room and the stream
// is tagged Qwen 3.5 · 3.6 · 3.7. "understand": the page slides away and the pair comes back. Ends at HANDOFF.pair.
import React from "react";
import { Easing } from "remotion";
import { arrive, blurIn, countTo, ease, leave, pop, prog, useScene } from "../../../src/engine";
import { HANDOFF, Logo, QWEN } from "./parts";
import { HitRings, MarkAt, MarkLabel, Stream, TRAVEL, grid, hitKick, lerp, type MarkState } from "./OpeningBits";
import { PAGE, ReportPage, type PageState } from "./ReportPage";

const P = HANDOFF.pair;
const STRIP = { cy: 572, size: 66 };
const apple = Easing.bezier(0.3, 0.05, 0.1, 1); // a trackpad fling: quick off the mark, a long soft landing

function useTimes() {
  const { cue, endsOn } = useScene();
  return {
    anthropic: cue("Anthropic"),
    rise: endsOn("report", 28),
    report: cue("report"),
    explaining: cue("explaining"),
    how: cue("how."),
    alibaba: cue("Alibaba"),
    collected: cue("collected"),
    over: cue("over"),
    n151: cue("151"),
    exchanges: cue("exchanges"),
    claude: cue("Claude"),
    months: endsOn("months", 30),
    qwen: cue("Qwen"),
    understand: cue("understand"),
  };
}
type T = ReturnType<typeof useTimes>;

/** the pair: centre stage, then a strip over the page, then centre again. The strip makes room for the tag on "Qwen" */
const marks = (fr: number, t: T): { c: MarkState; q: MarkState } => {
  const toStrip = arrive(fr, t.rise, 28);
  const back = arrive(fr, t.understand, 26);
  const room = prog(fr, t.qwen - 4, 18, ease.inOut);
  const sc = lerp(360, 200, room);
  const sq = lerp(720, 500, room);
  const at = (pair: number, strip: number) => lerp(lerp(pair, strip, toStrip), pair, back);
  const size = at(P.size, STRIP.size);
  return {
    c: { cx: at(P.claude.cx, sc), cy: at(P.claude.cy, STRIP.cy), size },
    q: { cx: at(P.qwen.cx, sq), cy: at(P.qwen.cy, STRIP.cy), size },
  };
};

const pageTop = (fr: number, t: T) => lerp(1960, PAGE.top, arrive(fr, t.rise, 28)) + 1500 * leave(fr, t.understand - 2, 16);
// after the second fling the page keeps drifting, very slowly, as a page under a resting finger does: never a still slide
const scrollAt = (fr: number, t: T) =>
  PAGE.scroll1 * prog(fr, t.how, 50, apple) + (PAGE.scroll2 - PAGE.scroll1) * prog(fr, t.collected, 48, apple) + 44 * prog(fr, t.collected + 40, t.understand - t.collected - 40, ease.linear);

/** the Anthropic mark: arrives over the pair on its name, then rides the rising page into its header */
const AnthropicMark: React.FC<{ t: T; top: number }> = ({ t, top }) => {
  const { f } = useScene();
  if (f < t.anthropic || f >= t.rise + 28) return null;
  const k = arrive(f, t.rise, 28);
  const hx = PAGE.left + PAGE.markX + PAGE.markSize / 2;
  const hy = top + PAGE.headerH / 2;
  const size = lerp(120, PAGE.markSize, k);
  const cx = lerp(540, hx, k);
  const cy = lerp(630, hy, k);
  return (
    <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, zIndex: 8, ...(k === 0 ? pop(f, t.anthropic, { dur: 12, from: 0.3 }) : {}) }}>
      <Logo name="anthropic" size={size} />
    </div>
  );
};

/** the report's own versions, tagged onto the stream's end: Qwen 3.5 · 3.6 · 3.7 */
const Tag: React.FC<{ t: T; q: MarkState }> = ({ t, q }) => {
  const { f, theme } = useScene();
  if (f < t.qwen || f >= t.understand + 8) return null;
  const parts = ["Qwen 3.5", "· 3.6", "· 3.7"];
  return (
    <div style={{ position: "absolute", left: q.cx + q.size / 2 + 20, top: q.cy - 26, height: 52, display: "flex", alignItems: "center", gap: 12, fontFamily: theme.font.ui, fontSize: 38, fontWeight: 700, color: QWEN, whiteSpace: "nowrap", opacity: 1 - prog(f, t.understand, 8) }}>
      {parts.map((p, i) => (
        <span key={p} style={{ ...pop(f, t.qwen + 2 + i * 7, { dur: 10, from: 0.5 }), transformOrigin: "left center" }}>{p}</span>
      ))}
    </div>
  );
};

const pageState = (f: number, t: T): PageState => ({
  titleAt: t.report - 4,
  buttonsAt: t.explaining,
  alibabaAt: t.alibaba,
  docked: f >= t.rise + 28,
  hi: prog(f, t.n151 - 2, 12, ease.inOut),
  count: f >= t.over - 6 ? countTo(f, t.over, t.n151 - t.over, 0, 151_000_000) : null,
  countAt: t.over - 6,
  exchangesAt: t.exchanges,
  claudeAt: t.claude,
  months: [0, 1, 2].map((i) => prog(f, t.months + i * 10, 10, ease.inOut)),
});

export const Report: React.FC = () => {
  const { f, scene } = useScene();
  const t = useTimes();
  const { c, q } = marks(f, t);
  const prev = marks(f - 1, t);
  const emits = grid(scene.from - 48, scene.to + 60);
  const arrivals = emits.map((e) => e + TRAVEL);
  const top = pageTop(f, t);
  const vy = Math.abs(top - pageTop(f - 1, t));
  const labelsOut = prog(f, t.rise, 8);
  const cKick = f >= t.claude && f < t.claude + 24 ? Math.exp(-(f - t.claude) / 6) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {top < 1920 && (
        <div
          style={{
            position: "absolute", left: PAGE.left, top, width: PAGE.w, height: PAGE.h, overflow: "hidden", borderRadius: 20, zIndex: 2,
            background: PAGE.body, boxShadow: "0 24px 60px rgba(20,20,19,0.16), 0 0 0 1px #E3E0D5",
            filter: vy > 3 ? `blur(${Math.min(10, vy * 0.08).toFixed(1)}px)` : undefined,
          }}
        >
          <ReportPage s={pageState(f, t)} scroll={scrollAt(f, t)} />
        </div>
      )}
      <AnthropicMark t={t} top={top} />
      <Stream c={c} q={q} emits={emits} dark={false} />
      <HitRings q={q} arrivals={arrivals} />
      <MarkAt name="claude" s={{ ...c, scale: 1 + 0.12 * cKick }} prev={prev.c} />
      <MarkAt name="qwen" s={{ ...q, scale: 1 + 0.07 * hitKick(f, arrivals) }} prev={prev.q} />
      <Tag t={t} q={q} />
      {labelsOut < 1 && <MarkLabel text="Claude" s={c} style={{ opacity: 1 - labelsOut }} />}
      {labelsOut < 1 && <MarkLabel text="Qwen" s={q} style={{ opacity: 1 - labelsOut }} />}
      {f >= t.understand + 12 && <MarkLabel text="Claude" s={c} style={blurIn(f, t.understand + 12, { dur: 9, rise: 14 })} />}
      {f >= t.understand + 16 && <MarkLabel text="Qwen" s={q} style={blurIn(f, t.understand + 16, { dur: 9, rise: 14 })} />}
    </div>
  );
};
