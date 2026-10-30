// `logs`: the agents' leather logbook, open on the desk under a warm lamp. Handwritten lines, a red pen that scribbles
// lines out and writes new ones, a highlighted line that gets blacked out, then the right half closes over the left.
// Whatever is passed as `onPage` sits on the left page and is covered when it closes.
// Plain English words only (METR: agents "tried extensively to retroactively edit their transcripts").
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { draw, ease, prog, useScene } from "../../../src/engine";

loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] });
export const HAND = "Caveat, cursive";

/** book geometry, column coordinates: spine at x 450, pages 370 x 500, leather 16 px proud of the pages */
export const LOGS_BOOK = { spine: 450, top: 760, pageW: 370, pageH: 500, lip: 16 };
export const LOGS_INK = "#1E2A4A";
export const LOGS_PEN = "#D8261C";
const PAPER = "linear-gradient(90deg, #EFE6D2 0%, #F7F0DF 18%, #F8F2E2 100%)";
const LEATHER = "radial-gradient(120% 90% at 30% 20%, #7A4B2A 0%, #5B341C 55%, #3E2212 100%)";

export type LogsLine = { text: string; y: number; at: number; rewrite?: { to: string; at: number } };

/** one handwritten line: writes itself left to right; a rewrite scribbles it out in red and writes the new words above */
const Line: React.FC<{ l: LogsLine; x: number }> = ({ l, x }) => {
  const { f } = useScene();
  const w = prog(f, l.at, 12, ease.out);
  const r = l.rewrite;
  const zig = "M0 22 L22 8 L40 30 L62 6 L84 30 L106 8 L128 30 L150 6 L172 30 L194 8 L216 30 L238 8 L260 28 L282 10 L300 24";
  const nw = r ? prog(f, r.at + 9, 12, ease.out) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: l.y, width: 330, height: 50 }}>
      <div style={{ fontFamily: HAND, fontWeight: 500, fontSize: 44, lineHeight: "50px", color: LOGS_INK, whiteSpace: "nowrap", clipPath: `inset(0 ${(100 - w * 100).toFixed(1)}% 0 0)`, opacity: r && f > r.at + 6 ? 0.55 : 1 }}>
        {l.text}
      </div>
      {r && f >= r.at && (
        <svg width={320} height={40} viewBox="0 0 300 36" style={{ position: "absolute", left: -6, top: 8, overflow: "visible" }}>
          <path d={zig} fill="none" stroke={LOGS_PEN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...draw(f, r.at, 9)} />
        </svg>
      )}
      {r && f >= r.at + 9 && (
        <div style={{ position: "absolute", left: 18, top: -30, fontFamily: HAND, fontWeight: 700, fontSize: 40, color: LOGS_PEN, whiteSpace: "nowrap", transform: "rotate(-3deg)", clipPath: `inset(0 ${(100 - nw * 100).toFixed(1)}% 0 0)` }}>
          {r.to}
        </div>
      )}
    </div>
  );
};

/** the highlighted line that gets blacked out: marker on `hide`, black bar sweeping to land on `answers` */
const Redacted: React.FC<{ y: number; x: number; at: number; hl: number; black: number }> = ({ y, x, at, hl, black }) => {
  const { f } = useScene();
  const w = prog(f, at, 12, ease.out);
  const h = prog(f, hl, 10, ease.out);
  const b = prog(f, black, 10, ease.inOut);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 340, height: 50 }}>
      <div style={{ position: "absolute", left: -8, top: 8, height: 40, width: `${(h * 344).toFixed(1)}px`, background: "rgba(255,221,64,0.75)", borderRadius: 6, transform: "rotate(-1deg)" }} />
      <div style={{ position: "relative", fontFamily: HAND, fontWeight: 700, fontSize: 40, lineHeight: "50px", color: LOGS_INK, whiteSpace: "nowrap", clipPath: `inset(0 ${(100 - w * 100).toFixed(1)}% 0 0)` }}>
        how we got the answer
      </div>
      <div style={{ position: "absolute", left: -10, top: 4, height: 46, width: `${(b * 350).toFixed(1)}px`, background: "#0C0C0E", borderRadius: 4, boxShadow: "0 2px 0 rgba(0,0,0,0.25)" }} />
    </div>
  );
};

const Rules: React.FC = () => (
  <>
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: 24, right: 24, top: 96 + i * 54, height: 2, background: "rgba(70,110,170,0.18)" }} />
    ))}
  </>
);

export type LogsBookCues = { lines: LogsLine[]; right: LogsLine[]; red: { y: number; at: number; hl: number; black: number }; close: number; hit: number };

/** the whole book. Left half is fixed; the right half (page on its leather) swings over the spine on `close`; `onPage` draws on the left page, under it */
export const LogsBookView: React.FC<{ c: LogsBookCues; onPage?: React.ReactNode }> = ({ c, onPage }) => {
  const { f } = useScene();
  const B = LOGS_BOOK;
  const turn = prog(f, c.close, 16, ease.inOut);
  const shake = f >= c.hit && f < c.hit + 8 ? Math.sin((f - c.hit) * 2.4) * (8 - (f - c.hit)) * 0.9 : 0;
  const shadow = 0.6 - 0.25 * turn;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 1920, transform: `translateY(${shake.toFixed(2)}px)` }}>
      {/* the desk shadow under the book, shrinking as it closes */}
      <div style={{ position: "absolute", left: B.spine - B.pageW - B.lip - 10, top: B.top - 6, width: (B.pageW + B.lip) * (2 - turn) + 20, height: B.pageH + 2 * B.lip + 30, borderRadius: 20, background: `rgba(0,0,0,${shadow})`, filter: "blur(22px)", transform: "translateY(26px)" }} />
      {/* left half: leather, page stack edges, the page */}
      <div style={{ position: "absolute", left: B.spine - B.pageW - B.lip, top: B.top - B.lip, width: B.pageW + B.lip, height: B.pageH + 2 * B.lip, background: LEATHER, borderRadius: "14px 0 0 14px", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.25)" }} />
      <div style={{ position: "absolute", left: B.spine - B.pageW, top: B.top, width: B.pageW, height: B.pageH, background: PAPER, borderRadius: "6px 0 0 6px", boxShadow: "inset -26px 0 30px -18px rgba(90,60,20,0.45), -3px 3px 0 #E4D9C0, -6px 6px 0 #D8CCB0", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 30, top: 30, fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 4, color: "rgba(30,42,74,0.55)" }}>RUN LOG</div>
        <Rules />
        {c.lines.map((l) => <Line key={l.text} l={l} x={32} />)}
      </div>
      {onPage}
      {/* right half: swings over the spine; its back is the front cover */}
      <div style={{ position: "absolute", left: B.spine, top: B.top - B.lip, width: B.pageW + B.lip, height: B.pageH + 2 * B.lip, perspective: 2200, perspectiveOrigin: "0% 50%" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "0% 50%", transformStyle: "preserve-3d", transform: `rotateY(${(-180 * turn).toFixed(2)}deg)` }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: LEATHER, borderRadius: "0 14px 14px 0" }}>
            <div style={{ position: "absolute", left: 0, top: B.lip, width: B.pageW, height: B.pageH, background: PAPER, borderRadius: "0 6px 6px 0", boxShadow: `inset 26px 0 30px -18px rgba(90,60,20,0.45), 3px 3px 0 #E4D9C0, 6px 6px 0 #D8CCB0, inset 0 0 0 999px rgba(0,0,0,${(turn * 0.35).toFixed(3)})`, overflow: "hidden" }}>
              <Rules />
              {c.right.map((l) => <Line key={l.text} l={l} x={30} />)}
              <Redacted x={30} {...c.red} />
            </div>
          </div>
          <Cover />
        </div>
      </div>
    </div>
  );
};

/** the front cover: tooled leather, gold rule, embossed title. Mirrored so it reads once the half has turned */
const Cover: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: LEATHER, borderRadius: "14px 0 0 14px", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.3), inset 10px 0 18px rgba(0,0,0,0.35)" }}>
    <div style={{ position: "absolute", inset: 26, border: "3px solid rgba(214,172,96,0.7)", borderRadius: 8 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 64, letterSpacing: 14, color: "#D6AC60", textShadow: "0 2px 0 rgba(0,0,0,0.45), 0 -1px 0 rgba(255,230,170,0.3)" }}>LOG</div>
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: 22 + i * 3, right: 0, top: 18 + i * 3, bottom: 18 + i * 3, borderRight: "2px solid rgba(0,0,0,0.12)", pointerEvents: "none" }} />
    ))}
  </div>
);
