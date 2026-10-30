import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, MONO_FONT, MUTED, label } from "./theme";
import { GREEN, Mark, PLATE_SHADOW, MARK_SHADOW, clamp01, easeOut, lerp, triesGeom } from "./Tries";

// V6 / V6b / V16, the row of ten result tiles (frameless).
// mode one: the run-2 card shrinks to the first tile on `shrink`, nine dashed tiles land on `land`, they resolve to
// grey ? on `question`. mode disagree: row label on `label`, the ?s resolve to data.row1 (P/F per char), row 2
// lands on ONE cadence from `row2` to `row2End` as data.row2, disagreeing columns flash accent on `flash`.
// mode agree: row 1 all ticks on `row1`, row 2 lands `row2`..`row2End` all ticks lining up, both pulse on `pulse`.
//
// One object across three events, so the three states of the same ten tasks read as the same picture changing:
// a slot nobody ran is a thin dashed outline (with a `?` once the creator says it), a slot that was run is a solid dark
// tile carrying its mark. The only saturated colours are the semantic green on a pass and the accent on the
// columns where the two runs disagree.
export type RunsData = { mode: "one" | "disagree" | "agree"; n: number; rows: string[]; row1?: string; row2?: string };

type Kind = "tick" | "cross";
const kindAt = (s: string | undefined, i: number): Kind => ((s ?? "")[i] === "F" ? "cross" : "tick");

export const Runs: React.FC<CardProps & { data: RunsData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const n = Math.max(1, Math.min(12, data.n || 10));

  // ten tiles plus their gaps sit in 0.81 w, with the row name right-aligned in the space at the left.
  // A cell is a shade taller than it is wide, so ten of them across still carry mass on a phone.
  const rowX = 0.162 * w;
  const rowW = w - rowX - 0.030 * w;
  const tileGap = 0.010 * w;
  const tileW = (rowW - (n - 1) * tileGap) / n;
  const tileH = 1.32 * tileW;
  const pitch = tileH + 0.062 * h;             // the two rows stay close: the payload is reading DOWN a column
  const blockTop = (h - (tileH + pitch)) / 2;  // the same row 1 in all three modes: V6b and V16 are callbacks
  const rowTop = (r: number) => blockTop + r * pitch;
  const tileX = (i: number) => rowX + i * (tileW + tileGap);
  const markS = 0.76 * tileW;
  const labelFs = 0.028 * w;
  const labelRight = rowX - 0.017 * w;
  const dash = `${0.26 * tileW} ${0.20 * tileW}`;
  const thin = 0.0038 * w;
  const outline = 0.0034 * w;                  // the accent box sits inside the gap, so two next to each other never touch

  const sp = (ms: number, damping = 13) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping, stiffness: 380, mass: 0.55 } });

  // ---- the beats, per mode -------------------------------------------------
  const mode = data.mode;
  const shrinkAt = beats.shrink ?? fromMs;
  const landAt = beats.land ?? shrinkAt + 850;
  const questionAt = beats.question ?? landAt + 540;
  const labelAt = beats.label ?? fromMs;
  const r1At = beats.row1 ?? fromMs;
  const r2At = beats.row2 ?? (mode === "agree" ? r1At + 1100 : labelAt + 960);
  const r2End = beats.row2End ?? r2At + 960;
  const flashAt = beats.flash ?? r2End;
  const pulseAt = beats.pulse ?? r2End;

  // ---- what each slot is, on this frame ------------------------------------
  // slot = { plate: 0..1 how solid the tile is, mark, markIn 0..1, q 0..1 how present the ? and the dashes are }
  type Slot = { plate: number; mark: Kind | null; markIn: number; q: number; slot: number };
  const empty: Slot = { plate: 0, mark: null, markIn: 0, q: 0, slot: 0 };
  const row0: Slot[] = Array.from({ length: n }, () => ({ ...empty }));
  const row1: Slot[] = Array.from({ length: n }, () => ({ ...empty }));

  // mode one: the run-2 plate keeps its tick and becomes tile 0; nine dashed slots land after it.
  // A cosine ease, not a cubic: the middle of the shrink has to be readable as a card on its way in.
  const e = 0.5 - 0.5 * Math.cos(Math.PI * clamp01((tMs - shrinkAt) / 320));
  const g = triesGeom(w, h);
  const shrinkBox = {
    x: lerp(g.x(1), tileX(0), e), y: lerp(g.top, rowTop(0), e),
    w: lerp(g.plateW, tileW, e), h: lerp(g.plateH, tileH, e),
    s: lerp(g.markS * 1.25, markS, e),
    cyFrac: lerp(g.markCyFrac, 0.5, e),
  };

  if (mode === "one") {
    for (let i = 1; i < n; i++) {
      const at = landAt + (i - 1) * 60;
      const s = Math.min(1, sp(at));
      row0[i] = { ...empty, slot: s, q: Math.min(1, sp(questionAt + (i - 1) * 15)) };
    }
  } else if (mode === "disagree") {
    // the ten slots are already there (V6's state), tile 0 still carrying the run the creator did; each ? gives way
    // to the run's real mark. Tile 0 is NOT sprung: it is the object handed over, complete on the first frame.
    row0[0] = { plate: 1, mark: kindAt(data.row1, 0), markIn: 1, q: 0, slot: 0 };
    for (let i = 1; i < n; i++) {
      const at = labelAt + (i - 1) * 45;
      const q = 1 - clamp01((tMs - at) / 60);      // the ? clears first, then the mark lands: never both at once
      const inn = Math.min(1, sp(at + 55));
      row0[i] = { plate: inn, mark: kindAt(data.row1, i), markIn: inn, q, slot: q };
    }
    const step = (r2End - r2At) / n;
    for (let i = 0; i < n; i++) {
      const inn = Math.min(1, sp(r2At + i * step));
      row1[i] = { plate: inn, mark: kindAt(data.row2, i), markIn: inn, q: 0, slot: 0 };
    }
  } else {
    for (let i = 0; i < n; i++) {
      const inn = Math.min(1, sp(r1At + i * 60));
      row0[i] = { plate: inn, mark: kindAt(data.row1, i), markIn: inn, q: 0, slot: 0 };
    }
    const step = (r2End - r2At) / n;
    for (let i = 0; i < n; i++) {
      const inn = Math.min(1, sp(r2At + i * step));
      row1[i] = { plate: inn, mark: kindAt(data.row2, i), markIn: inn, q: 0, slot: 0 };
    }
  }

  // the columns where the two runs do not agree, outlined in the accent and flashed twice
  const disagreeCols = mode === "disagree" && tMs >= flashAt
    ? Array.from({ length: n }, (_, i) => i).filter((i) => kindAt(data.row1, i) !== kindAt(data.row2, i))
    : [];
  const fu = tMs - flashAt;
  const flashOp = fu < 320 ? 0.62 + 0.38 * Math.cos((fu / 320) * Math.PI * 4) : 1;

  // both rows pulse once together on the thesis
  const pu = clamp01((tMs - pulseAt) / 300);
  const scale = mode === "agree" && tMs >= pulseAt ? 1 + 0.06 * Math.sin(Math.PI * pu) : 1;

  const rows = mode === "one" ? [row0] : [row0, row1];
  const names = mode === "one" ? [] : [data.rows[0], data.rows[1]];
  const nameIn = [
    mode === "agree" ? Math.min(1, sp(r1At)) : 1,   // on V6b the name is already written, the card is a callback
    Math.min(1, sp(r2At)),
  ];

  const plate = (x: number, y: number, tw: number, th: number, op: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute", left: x, top: y, width: tw, height: th,
        backgroundColor: CARD_BG, borderRadius: 0, boxShadow: PLATE_SHADOW, opacity: clamp01(op * 3),
      }}
    />
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${scale})`, transformOrigin: `${w / 2}px ${h / 2}px`,
      }}>
        {/* the solid tiles: a slot somebody actually ran */}
        {mode === "one"
          ? plate(shrinkBox.x, shrinkBox.y, shrinkBox.w, shrinkBox.h, 1, "shrink")
          : null}
        {rows.map((r, ri) => r.map((s, i) => (
          s.plate > 0 ? plate(tileX(i), rowTop(ri), tileW, tileH, s.plate, `p${ri}-${i}`) : null
        )))}

        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <title>the same ten tasks, run twice</title>

          {/* the empty slots: a thin dashed outline, nobody ran them */}
          {rows.map((r, ri) => r.map((s, i) => (
            s.slot > 0 ? (
              <rect
                key={`s${ri}-${i}`}
                x={tileX(i) + thin / 2} y={rowTop(ri) + thin / 2}
                width={tileW - thin} height={tileH - thin}
                fill="none" stroke={MUTED} strokeWidth={thin} strokeDasharray={dash}
                opacity={0.80 * clamp01(s.slot * 2)}
                style={{ filter: MARK_SHADOW }}
                transform={`translate(${tileX(i) + tileW / 2} ${rowTop(ri) + tileH / 2}) scale(${0.80 + 0.20 * Math.min(1, s.slot)}) translate(${-(tileX(i) + tileW / 2)} ${-(rowTop(ri) + tileH / 2)})`}
              />
            ) : null
          )))}

          {/* nobody ran them: a grey ? in the slot */}
          {rows.map((r, ri) => r.map((s, i) => (
            s.q > 0 && s.slot > 0 ? (
              <text
                key={`q${ri}-${i}`}
                x={tileX(i) + tileW / 2} y={rowTop(ri) + tileH / 2}
                textAnchor="middle" dominantBaseline="central"
                fontFamily={MONO_FONT} fontSize={0.62 * tileH} fill={MUTED}
                opacity={clamp01(s.q * 1.6)} style={{ filter: MARK_SHADOW }}
              >?</text>
            ) : null
          )))}

          {/* the marks */}
          {mode === "one" && (
            <Mark
              cx={shrinkBox.x + shrinkBox.w / 2}
              cy={shrinkBox.y + shrinkBox.cyFrac * shrinkBox.h}
              s={shrinkBox.s} kind="tick" color={GREEN}
            />
          )}
          {rows.map((r, ri) => r.map((s, i) => (
            s.mark && s.markIn > 0 ? (
              <Mark
                key={`m${ri}-${i}`}
                cx={tileX(i) + tileW / 2} cy={rowTop(ri) + tileH / 2}
                s={markS} kind={s.mark} color={s.mark === "tick" ? GREEN : MUTED}
                scale={0.72 + 0.28 * s.markIn}
              />
            ) : null
          )))}

          {/* the payload: the columns where run 1 and run 2 do not agree */}
          {disagreeCols.map((i) => (
            <rect
              key={`d${i}`}
              x={tileX(i) - tileGap * 0.32} y={rowTop(0) - tileGap * 0.32}
              width={tileW + tileGap * 0.64} height={rowTop(1) + tileH - rowTop(0) + tileGap * 0.64}
              fill="none" stroke={ACCENT} strokeWidth={outline} opacity={flashOp}
              style={{ filter: MARK_SHADOW }}
            />
          ))}
        </svg>

        {/* the two run names, the only authored words on the card */}
        {names.map((t, ri) => (
          nameIn[ri] > 0 ? (
            <div
              key={t}
              style={{
                position: "absolute", left: 0, top: rowTop(ri) + tileH / 2 - labelFs * 0.62, width: labelRight,
                textAlign: "right", whiteSpace: "nowrap", lineHeight: 1.2,
                ...label(labelFs, INK), opacity: clamp01(nameIn[ri] * 3),
                textShadow: "0px 0px 12px rgba(0,0,0,0.92), 0px 2px 6px rgba(0,0,0,0.9)",
              }}
            >
              {t}
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
};
