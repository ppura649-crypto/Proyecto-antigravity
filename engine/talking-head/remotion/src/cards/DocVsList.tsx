import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, MONO_FONT, label } from "./theme";

// "instead of a DATA FILLED DOCUMENT that you might ONLY READ ONCE, you
// actually get a LIST of things you can WORK THROUGH TODAY." - one object
// becomes another on the same page: the document writes itself, goes dim on the
// beat it is read (the guest 2026-09-05: the OPENED 1x stamp and its pop are gone, and
// nothing replaces them), then every line squashes toward the top and the page
// closes up, and the same page re-forms as a checklist you can start ticking.

const PAPER = "#FFFFFF";
const EDGE = "#E4E1DA";
const CHIP_BG = "#F7F6F3";
const INK_DARK = "#1F1E1D";
const INK_BODY = "#3A3936";
const CHIP_FG = "#6B6A64";

const DOC_FONT = "Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif";

const PER_LINE_MS = 125; // ~8 lines per second
const PER_ITEM_MS = 120;
const CHECK_LEN = 21;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const out = (t: number) => 1 - Math.pow(1 - p01(t), 3);
const linesOf = (text: string, fs: number, avail: number, factor: number) =>
  Math.max(1, Math.ceil((text.length * fs * factor) / avail));

export const DocVsList: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  docTitle: string; docLines: { t: string; kind: "h" | "p" }[];
  pages: number; readMark?: string;
  items: string[];
  beats: { build: number; once: number; collapse: number; list: number; tick: number };
}> = ({ tMs, w, h, fps, fromMs, docTitle, docLines, pages, readMark, items, beats }) => {
  const pad = 0.055 * w;
  const avail = w - 2 * pad;

  const titleFs = 0.042 * w;
  const titleLh = titleFs * 1.28;
  const titleGap = 0.030 * w;
  const hFs = 0.032 * w;
  const hLh = hFs * 1.45;
  const hMt = 0.020 * w;
  const pFs = 0.026 * w;
  const pLh = pFs * 1.55;

  const pageIn = p01((tMs - fromMs) / 180);
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });

  // ---- the document: written top to bottom, then squashed toward the top ----
  const coll = (i: number) => out((tMs - (beats.collapse + i * 16)) / 460);
  const titleC = coll(0);
  const titleH = titleLh * linesOf(docTitle, titleFs, avail, 0.54);

  let y = titleH * (1 - titleC) + titleGap * (1 - titleC);
  const rows = docLines.map((ln, i) => {
    const c = coll(i + 1);
    const isH = ln.kind === "h";
    const fs = isH ? hFs : pFs;
    const lh = isH ? hLh : pLh;
    const mt = isH && i > 0 ? hMt : 0;
    const rowH = lh * linesOf(ln.t, fs, avail, isH ? 0.54 : 0.50);
    const top = y + mt * (1 - c);
    y = top + rowH * (1 - c);
    const a = out((tMs - (beats.build + (i + 1) * PER_LINE_MS)) / 170);
    return { ln, isH, fs, lh, rowH, top, c, a };
  });

  const titleA = out((tMs - beats.build) / 200);
  const dim = interpolate(tMs, [beats.once, beats.once + 380], [1, 0.35], clamp);
  const built = tMs >= beats.build;
  const count = Math.max(
    1,
    Math.round(
      interpolate(tMs, [beats.build, beats.build + (docLines.length + 1) * PER_LINE_MS], [0, pages], clamp),
    ),
  );

  // ---- the stamp, only when the card is given one ----
  const stampS = readMark ? sp(beats.once) : 0;
  const stampFs = Math.min(0.058 * w, (0.78 * w) / (Math.max(4, (readMark ?? "").length) * 0.92));
  const stampScale = interpolate(stampS, [0, 1], [1.5, 1]);

  // ---- the checklist that takes the page ----
  const boxSize = 0.038 * w;
  const boxGap = 0.030 * w;
  const itemFs = 0.044 * w;
  const itemLh = itemFs * 1.3;
  const rowGap = 0.030 * w;
  const itemAvail = avail - boxSize - boxGap;
  const itemHs = items.map((it) => itemLh * linesOf(it, itemFs, itemAvail, 0.50));
  const listH = itemHs.reduce((s, v) => s + v, 0) + rowGap * Math.max(0, items.length - 1);
  const listTop = Math.max(pad, (h - listH) / 2);
  const tick = out((tMs - beats.tick) / 380);
  const draw = out((tMs - (beats.tick + 90)) / 320);

  let iy = listTop;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: PAPER }}>
      <div style={{ position: "absolute", inset: 0, border: `1px solid ${EDGE}`, boxSizing: "border-box", opacity: pageIn }}>
        {/* the data filled document */}
        <div style={{ position: "absolute", left: pad, top: pad, width: avail, opacity: dim }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: avail,
              fontFamily: DOC_FONT,
              fontWeight: 700,
              fontSize: titleFs,
              lineHeight: `${titleLh}px`,
              color: INK_DARK,
              opacity: titleA * (1 - titleC),
              clipPath: `inset(0 ${(1 - titleA) * 100}% 0 0)`,
              transform: `scaleY(${1 - titleC})`,
              transformOrigin: "top left",
            }}
          >
            {docTitle}
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: r.top,
                width: avail,
                fontFamily: DOC_FONT,
                fontWeight: r.isH ? 700 : 400,
                fontSize: r.fs,
                lineHeight: `${r.lh}px`,
                color: r.isH ? INK_DARK : INK_BODY,
                opacity: r.a * (1 - r.c),
                clipPath: `inset(0 ${(1 - r.a) * 100}% 0 0)`,
                transform: `scaleY(${1 - r.c})`,
                transformOrigin: "top left",
              }}
            >
              {r.ln.t}
            </div>
          ))}
        </div>

        {/* page count, counting up while it writes */}
        {built && (
          <div
            style={{
              position: "absolute",
              right: pad,
              bottom: pad,
              padding: `${0.010 * w}px ${0.016 * w}px`,
              border: `1px solid ${EDGE}`,
              backgroundColor: CHIP_BG,
              fontFamily: MONO_FONT,
              fontSize: 0.024 * w,
              lineHeight: 1,
              color: CHIP_FG,
              opacity: dim * (1 - titleC),
            }}
          >
            {count} {pages === 1 && count === 1 ? "page" : "pages"}
          </div>
        )}

        {/* read once */}
        {stampS > 0 && (
          <div
            style={{
              position: "absolute",
              left: w / 2,
              top: 0.42 * h,
              padding: `${0.016 * w}px ${0.030 * w}px`,
              border: `3px solid ${ACCENT}`,
              whiteSpace: "nowrap",
              ...label(stampFs, ACCENT),
              letterSpacing: "0.12em",
              fontWeight: 800,
              lineHeight: 1.05,
              opacity: Math.min(1, stampS * 4) * (1 - titleC),
              transform: `translate(-50%, -50%) rotate(-8deg) scale(${stampScale})`,
            }}
          >
            {readMark}
          </div>
        )}

        {/* the list you work through today */}
        {items.map((it, i) => {
          const a = out((tMs - (beats.list + i * PER_ITEM_MS)) / 260);
          const rowH = itemHs[i];
          const top = iy;
          iy = top + rowH + rowGap;
          if (a <= 0) return null;
          const first = i === 0;
          const fill = first ? Math.min(1, tick * 2.2) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pad,
                top,
                width: avail,
                display: "flex",
                alignItems: "flex-start",
                gap: boxGap,
                opacity: a,
                clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`,
                transform: `translateX(${(1 - a) * -0.014 * w}px)`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: boxSize,
                  height: boxSize,
                  marginTop: (itemLh - boxSize) / 2,
                  border: `2px solid ${INK_DARK}`,
                  boxSizing: "border-box",
                }}
              >
                {/* the fill covers the outline, so the box reads solid terracotta */}
                {first && fill > 0 && (
                  <div style={{ position: "absolute", inset: -2, backgroundColor: ACCENT, opacity: fill }} />
                )}
                {first && draw > 0 && (
                  <svg
                    width={boxSize}
                    height={boxSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ position: "absolute", left: 0, top: 0 }}
                  >
                    <path
                      d="M5 12.4L9.6 17L19 6.8"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={CHECK_LEN}
                      strokeDashoffset={CHECK_LEN * (1 - draw)}
                    />
                  </svg>
                )}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: itemFs,
                  lineHeight: `${itemLh}px`,
                  fontWeight: first && tick > 0.35 ? 600 : 400,
                  color: INK_DARK,
                }}
              >
                {it}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
