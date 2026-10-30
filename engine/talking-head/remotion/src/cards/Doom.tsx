import React from "react";
import { interpolate } from "remotion";
import { ACCENT, MONO_FONT } from "./theme";

// "I think AI research is the most productive FEELING way OF doing nothing."
// The villain object, shown the way reference edit A showed its bloated doc: a real research
// report doom-scrolling faster than anyone could read it, the page counter running away.
// The motion IS the message, so the scroll runs at a fixed rate per SECOND and the card
// can be any length without changing how fast it reads (the guest 2026-09-05: "it leaves too
// early, extend it through the end of the word nothing"); only the counter and the
// scrollbar are mapped over the whole card, so they still finish on the cut.
const PAGE = "#FFFFFF";
const EDGE = "#E4E1DA";
const HEAD = "#1F1E1D";
const BODY = "#3A3936";
const SERIF = "Georgia, 'Times New Roman', serif";

export const Doom: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number; toMs: number;
  title: string; lines: { t: string; kind: "h" | "p" }[]; pages: number;
}> = ({ tMs, w, h, fromMs, toMs, title, lines, pages }) => {
  const pad = 0.030 * w;
  const titleFs = 0.030 * w;
  const headFs = 0.026 * w;
  const bodyFs = 0.021 * w;
  const rowH = 1.62 * bodyFs;
  const barH = titleFs * 2.3;

  const p = interpolate(tMs, [fromMs, toMs], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // it never ends: 2.7 passes of the document every second, whatever the duration
  const loop = lines.length * rowH;
  const offset = ((tMs - fromMs) / 1000) * loop * 2.7;
  const page = Math.min(pages, 1 + Math.floor(p * (pages - 1)));

  // draw enough copies that the viewport is always full while it wraps
  const need = Math.ceil((h - barH) / rowH) + lines.length + 2;
  const rows = Array.from({ length: need }, (_, i) => lines[i % lines.length]);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: PAGE, overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: barH,
        borderBottom: `1px solid ${EDGE}`, display: "flex", alignItems: "center",
        paddingLeft: pad, boxSizing: "border-box", zIndex: 2, backgroundColor: PAGE,
      }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: titleFs, color: HEAD }}>
          {title}
        </span>
      </div>

      <div style={{ position: "absolute", left: pad, right: pad, top: barH, bottom: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -(offset % loop) }}>
          {rows.map((l, i) => (
            <div
              key={i}
              style={{
                height: rowH, lineHeight: `${rowH}px`,
                fontFamily: SERIF,
                fontWeight: l.kind === "h" ? 700 : 400,
                fontSize: l.kind === "h" ? headFs : bodyFs,
                color: l.kind === "h" ? HEAD : BODY,
                whiteSpace: "nowrap", overflow: "hidden",
              }}
            >
              {l.t}
            </div>
          ))}
        </div>
      </div>

      {/* the scrollbar racing down: the reason you know it never ends */}
      <div style={{
        position: "absolute", right: 0.008 * w, top: barH + 0.02 * h, bottom: 0.02 * h,
        width: 0.007 * w, backgroundColor: EDGE,
      }}>
        <div style={{
          position: "absolute", left: 0, width: "100%", height: "16%",
          top: `${p * 84}%`, backgroundColor: ACCENT,
        }} />
      </div>

      <div style={{
        position: "absolute", right: 0.030 * w, bottom: 0.030 * h,
        fontFamily: MONO_FONT, fontSize: 0.024 * w, color: HEAD,
        backgroundColor: PAGE, padding: `${0.008 * h}px ${0.012 * w}px`,
        fontVariantNumeric: "tabular-nums",
      }}>
        {page} / {pages}
      </div>
    </div>
  );
};
