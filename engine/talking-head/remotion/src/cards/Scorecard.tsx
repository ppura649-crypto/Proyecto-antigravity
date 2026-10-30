import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, MONO_FONT, label } from "./theme";

// V7 / V8 / V9 (edit-c-evals): ONE light document seen at three stages, each stage
// opening on exactly what the previous one ended with, so the sheet never jumps.
//   sheet    the sheet is up with its title and three empty ruled rows; `Quality philosophy`
//            types itself in on `header` and takes a terracotta `1` badge when the typing ends.
//   criteria the three rows fill one per beat, each a dark mini UI tile that SHOWS the
//            criterion (hierarchy / spacing / typography) with the criterion beside it;
//            a greyed `…` row slides in under them on `more`.
//   expand   the first row grows downward, pushing the rows below past the card bottom (clipped,
//            never squeezed): a `reasoning` sub-row (two grey bars, no words) on `reasoning`,
//            a `success state` sub-row (green tick + the hierarchy tile done right) on `success`.
// Only the words the plan allows are authored; every other "text" is a drawn grey bar.
export type ScorecardData = {
  stage: "sheet" | "criteria" | "expand";
  title: string;
  header: string;
  criteria: string[];
  sub: string[];
  msPerChar?: number; // header typing speed, default 25
  growMs?: number; // one expansion step, default 350
};

// The theme tokens are authored for the BLACK card (INK is near-white), so the light sheet
// names its own ink the way Becomes.tsx and DocVsList.tsx do. ACCENT stays the token.
const INK_DARK = "#111111";
const INK_BODY = "#2A2A2A";
const RULE = "#D8D5CF";
const RULE_FAINT = "#EAE7E2";
const GREY_BAR = "#C6C3BD";
const GREY_TXT = "#8C8983";
const ELLIPSIS = "#B4B1AB";
const TILE = "#111111";
const GREEN = "#3FA35B";

const STAGES = { sheet: 0, criteria: 1, expand: 2 } as const;
const p01 = (v: number) => Math.min(1, Math.max(0, v));
const out = (v: number) => 1 - Math.pow(1 - p01(v), 3);

// --- the three pictures. Each one SHOWS its criterion, drawn white on the dark tile. ---

const HierarchyPic: React.FC<{ s: number }> = ({ s }) => {
  const p = 0.14 * s;
  const iw = s - 2 * p;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <rect x={p} y={p + 0.10 * s} width={0.62 * iw} height={0.120 * s} fill="#ffffff" />
      {[1, 0.88, 0.66].map((f, i) => (
        <rect key={i} x={p} y={p + 0.40 * s + i * 0.125 * s} width={f * iw} height={0.044 * s} fill="rgba(255,255,255,0.46)" />
      ))}
    </svg>
  );
};

const GridPic: React.FC<{ s: number }> = ({ s }) => {
  const p = 0.13 * s;
  const st = (s - 2 * p) / 8;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i <= 8; i++)
    for (let j = 0; j <= 8; j++)
      dots.push(<circle key={`${i}.${j}`} cx={p + i * st} cy={p + j * st} r={Math.max(1, 0.0135 * s)} fill="rgba(255,255,255,0.46)" />);
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {dots}
      {[[0, 3], [3, 4], [6, 2]].map(([bx, bh], i) => (
        <rect key={i} x={p + bx * st} y={p + 2 * st} width={2 * st} height={bh * st} fill="#ffffff" />
      ))}
    </svg>
  );
};

const TypePic: React.FC<{ s: number }> = ({ s }) => {
  const p = 0.14 * s;
  const iw = s - 2 * p;
  const bh = 0.055 * s;
  const bg = 0.075 * s;
  const sh = 0.028 * s;
  const sg = 0.045 * s;
  const y0 = p + 0.035 * s;
  const y1 = y0 + 2 * (bh + bg) + bh + 0.090 * s;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {[1, 0.92, 0.74].map((f, i) => (
        <rect key={`b${i}`} x={p} y={y0 + i * (bh + bg)} width={f * iw} height={bh} fill="rgba(255,255,255,0.92)" />
      ))}
      {[0.96, 1, 0.82, 0.9].map((f, i) => (
        <rect key={`s${i}`} x={p} y={y1 + i * (sh + sg)} width={f * iw} height={sh} fill="rgba(255,255,255,0.34)" />
      ))}
    </svg>
  );
};

const PICS = [HierarchyPic, GridPic, TypePic];

export const Scorecard: React.FC<CardProps & { data: ScorecardData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const stage = STAGES[data.stage] ?? 0;
  const b = (k: string, d: number) => (typeof beats[k] === "number" ? beats[k] : d);
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });

  // ---- geometry (the sheet) ----
  const edgeW = 0.012 * w;
  const padL = 0.058 * w;
  const padR = 0.045 * w;
  const contentW = w - padL - padR;
  const titleFs = 0.055 * h;
  const titleTop = 0.048 * h;
  const headerFs = 0.045 * h;
  const headerTop = titleTop + titleFs * 1.16 + 0.050 * h;
  const rowsTop = headerTop + headerFs * 1.20 + 0.030 * h;
  const tileS = 0.185 * h;
  const rowH = tileS;
  const rowGap = 0.020 * h;
  const textX = padL + tileS + 0.028 * w;
  const textW = w - padR - textX;
  const critFs = Math.min(0.037 * w, textW / (Math.max(...data.criteria.map((c) => c.length)) * 0.72));
  const rowTop = (i: number) => rowsTop + i * (rowH + rowGap);
  const moreH = 0.078 * h;

  // ---- the expansion inside row 1 (two steps: the sheet grows once per sub-row) ----
  const growMs = data.growMs ?? 350;
  const expPad = 0.020 * h;
  const sub1H = 0.078 * h;
  const sub2H = 0.142 * h;
  const labCol = 0.215 * w;
  const thumbS = 0.121 * h;
  const H1 = expPad + sub1H + expPad;
  const H2 = sub2H + expPad;
  const e1 = stage === 2 ? out((tMs - b("reasoning", fromMs)) / growMs) : 0;
  const e2 = stage === 2 ? out((tMs - b("success", fromMs)) / growMs) : 0;
  const expH = H1 * e1 + H2 * e2;

  // ---- the header types, then takes its badge ----
  const headerMs = b("header", fromMs);
  const perChar = data.msPerChar ?? 25;
  const typeEnd = headerMs + data.header.length * perChar;
  const typed =
    stage > 0 ? data.header.length : Math.max(0, Math.min(data.header.length, Math.floor((tMs - headerMs) / perChar)));
  const typing = stage === 0 && tMs >= headerMs && tMs < typeEnd;
  const badge = stage > 0 ? 1 : sp(typeEnd);

  // ---- the rows ----
  const rowIn = (i: number) => (stage > 1 ? 1 : stage === 1 ? sp(b(`c${i + 1}`, fromMs)) : 0);
  const rowText = (i: number) => (stage > 1 ? 1 : stage === 1 ? out((tMs - (b(`c${i + 1}`, fromMs) + 190)) / 240) : 0);
  const moreIn = stage > 1 ? 1 : stage === 1 ? out((tMs - b("more", fromMs)) / 320) : 0;

  const rule = (top: number, color: string, o = 1) => (
    <div style={{ position: "absolute", left: padL, top, width: contentW, height: 1.6, backgroundColor: color, opacity: o }} />
  );

  const subLabel = (t: string) => (
    <div style={{ width: labCol, flex: "none", fontFamily: MONO_FONT, fontSize: 0.033 * h, color: GREY_TXT, lineHeight: 1, whiteSpace: "nowrap" }}>{t}</div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* the terracotta left edge of the sheet */}
      <div style={{ position: "absolute", left: 0, top: 0, width: edgeW, height: h, backgroundColor: ACCENT }} />

      {/* title */}
      <div style={{ position: "absolute", left: padL, top: titleTop, ...label(titleFs, INK_DARK), lineHeight: 1.1, whiteSpace: "nowrap" }}>
        {data.title}
      </div>

      {/* section header, typed, with its badge */}
      {tMs >= headerMs && (
        <div style={{ position: "absolute", left: padL, top: headerTop, display: "flex", alignItems: "center", height: headerFs * 1.2 }}>
          <div style={{ ...label(headerFs, INK_DARK), lineHeight: 1.2, whiteSpace: "pre" }}>{data.header.slice(0, typed)}</div>
          {typing && (
            <div style={{ width: headerFs * 0.50, height: headerFs * 0.94, marginLeft: headerFs * 0.16, backgroundColor: INK_DARK }} />
          )}
          {badge > 0 && (
            <div
              style={{
                marginLeft: headerFs * 0.62,
                width: headerFs * 1.30,
                height: headerFs * 1.30,
                backgroundColor: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: Math.min(1, badge * 3),
                transform: `scale(${0.55 + 0.45 * Math.min(1, badge)})`,
              }}
            >
              <div style={{ fontFamily: MONO_FONT, fontSize: headerFs * 0.68, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>1</div>
            </div>
          )}
        </div>
      )}

      {/* the three ruled rows */}
      {data.criteria.map((c, i) => {
        const push = i === 0 ? 0 : expH;
        const top = rowTop(i) + push;
        const s = rowIn(i);
        const a = rowText(i);
        const Pic = PICS[i] ?? HierarchyPic;
        return (
          <React.Fragment key={c}>
            {s > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: padL,
                  top,
                  width: tileS,
                  height: tileS,
                  backgroundColor: TILE,
                  opacity: Math.min(1, s * 3),
                  transform: `scale(${0.72 + 0.28 * Math.min(1, s)})`,
                  transformOrigin: "50% 50%",
                }}
              >
                <Pic s={tileS} />
              </div>
            )}
            {a > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: textX,
                  top: top + rowH / 2 - critFs * 0.66,
                  width: textW,
                  ...label(critFs, INK_BODY),
                  lineHeight: 1.3,
                  opacity: a,
                  transform: `translateX(${(1 - a) * -0.012 * w}px)`,
                }}
              >
                {c}
              </div>
            )}
            {rule(top + rowH + (i === 0 ? expH : 0), RULE)}
          </React.Fragment>
        );
      })}

      {/* the fourth, greyed row: there are more of these */}
      {moreIn > 0 && (
        <div style={{ position: "absolute", left: 0, top: rowTop(2) + rowH + rowGap + expH, width: w, height: moreH, opacity: moreIn, transform: `translateY(${(1 - moreIn) * 0.030 * h}px)` }}>
          <div style={{ position: "absolute", left: padL, top: 0, height: moreH, display: "flex", alignItems: "center", fontFamily: MONO_FONT, fontSize: 0.105 * h, color: ELLIPSIS, lineHeight: 1 }}>…</div>
          <div style={{ position: "absolute", left: padL, top: moreH, width: contentW, height: 1.6, backgroundColor: RULE_FAINT }} />
        </div>
      )}

      {/* row 1 grows: reasoning, then success state */}
      <div style={{ position: "absolute", left: 0, top: rowTop(0) + rowH, width: w, height: Math.max(0, expH), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: textX, top: expPad, width: w - textX, height: sub1H, display: "flex", alignItems: "center", opacity: Math.min(1, e1 * 2) }}>
          {subLabel(data.sub[0] ?? "reasoning")}
          <div>
            <div style={{ width: 0.355 * w, height: 0.012 * h, backgroundColor: GREY_BAR }} />
            <div style={{ width: 0.275 * w, height: 0.012 * h, backgroundColor: GREY_BAR, marginTop: 0.026 * h }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: textX, top: H1, width: w - textX, height: sub2H, display: "flex", alignItems: "center", opacity: Math.min(1, e2 * 2) }}>
          {subLabel(data.sub[1] ?? "success state")}
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width={0.058 * h} height={0.058 * h} viewBox="0 0 24 24" fill="none">
              <path d="M4 12.6L9.4 18L20 6.4" stroke={GREEN} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ marginLeft: 0.022 * w, width: thumbS, height: thumbS, backgroundColor: TILE }}>
              <HierarchyPic s={thumbS} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
