import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CLAUDE_T, SANS } from "../ComposerParts";
import {
  BEZ, COL, CHIP_TOP, ComposerBox, Check, HEAD, LH, LineRow, Line, P0, PH0, Phone,
  STATUS, TXT_FS, TXT_TOP, compGeo, headAt, locate, tokenize, wrapToks,
} from "./Dparts";
import { Chip, INK, chipFs, chipFsBig, clamp01, easeInOut, easeOut } from "./shared";

// edit-h-oneshot family D: the phone (V10), the chaos (V11), the verdict (V12), the pour (V18).
// ONE object across the first three - the iPhone in the iOS dictation state - and in V18 it is the
// source of the payoff. The mirror of family C: there the thought outran the hand, here the mouth
// outruns the thought, so the two cards share one grammar (a rail, a ghost that lags, a bracket on
// the gap) with the roles swapped. The phone and the composer are REAL SURFACES and keep their own
// colours and faces; every word on the cream wall sits on a chip.
//
// The ramble breaks on the same words in all four cards because the phone is drawn at one stage
// (Dparts.P0) and scaled whole. The filler list lives on `chaos` and `funnel` in visuals.json;
// `dictate` and `verdict` carry the same sentence without it, so the layout falls back to this
// list (a different grouping would break "and" onto another line and the callback would jump).
const FILLERS = ["basically", "um", "like", "actually wait", "um", "like", "or something"];

const layout = (text: string, fillers?: string[]): Line[] =>
  wrapToks(tokenize(text, fillers && fillers.length ? fillers : FILLERS), TXT_FS, COL);

// a landing starts 43 ms early so the chip is visibly arriving ON the frame of its own word
const landing = (tMs: number, b: number | undefined, fps: number): React.CSSProperties | null => {
  if (b == null) return null;
  const f = ((tMs - b + HEAD) / 1000) * fps;
  if (f <= 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 320, mass: 0.7 } });
  return { opacity: clamp01(f), transform: `scale(${(0.86 + 0.14 * s).toFixed(4)})`, transformOrigin: "center" };
};

const HALO_BOX = "0 0 0 2px rgba(255,255,255,0.9)";
// the thought has to be READ on the cream wall, only lighter than what the mouth already said:
// shared GHOST (INK at 0.38) sank into the painting. The same value family C settled its rail on,
// so the two tickers speak one grammar (shared.tsx untouched).
const GHOST_INK = "rgba(20,22,31,0.62)";

/** the phone and the thought rail side by side on the 929 px wall card (V10 and V11 share it) */
const wall = (w: number, h: number) => {
  const gap = Math.round(0.097 * w);
  const px = Math.round((w - (P0 + gap + COL)) / 2);
  const py = Math.round((h - PH0) / 2);
  return {
    px, py, rx: px + P0 + gap,
    chipY: py + BEZ + STATUS + CHIP_TOP,
    textY: py + BEZ + STATUS + TXT_TOP,
  };
};

// ---------------------------------------------------------------- V10: the phone pours, the thought lags

type DictateData = {
  text: string; sayLabel: string; thinkLabel: string; gapLabel: string;
  sayCps: number; thinkCps: number;
};

const Dictate: React.FC<CardProps & { data: DictateData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const lines = React.useMemo(() => layout(data.text), [data.text]);
  const g = wall(w, h);
  const bTalk = beats.talking ?? fromMs;
  const bSay = beats.saying ?? bTalk + 840;
  const el = Math.max(0, tMs - bTalk) / 1000;
  // a run card: the pour is a RATE, never a map over the card's life
  const say = Math.floor(el * data.sayCps);
  const think = Math.floor(el * data.thinkCps);
  const amp = clamp01((tMs - bTalk + HEAD) / 220);
  const open = easeOut(clamp01((tMs - bSay + HEAD) / 280));

  const a = headAt(lines, think, TXT_FS);
  const b = headAt(lines, say, TXT_FS);
  const bars: { li: number; x0: number; x1: number }[] = [];
  if (open > 0.001) {
    for (let i = a.li; i <= b.li && i < lines.length; i++) {
      const x0 = i === a.li ? a.x : 0;
      const x1 = i === b.li ? b.x : lines[i].w;
      if (x1 > x0 + 3) bars.push({ li: i, x0, x1 });
    }
  }
  const tick = 18, rule = 3;
  const gapFs = chipFs(w);
  const chipTop = g.textY + (b.f + 1) * LH + 26;
  const land = landing(tMs, bSay + 40, fps);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Phone
        x={g.px} y={g.py} s={1} lines={lines} shown={say} tMs={tMs} amp={amp}
        blue={[]} scatter={0} label={data.sayLabel}
      />

      {/* the thought rail: the same words, the same column, the same face, running at a third of
          the speed. What is said and not yet thought is the empty room the bracket measures. */}
      <div style={{ position: "absolute", left: g.rx, top: g.chipY }}>
        <Chip text={data.thinkLabel} fs={chipFs(w)} />
      </div>
      <div style={{ position: "absolute", left: g.rx, top: g.textY, width: COL }}>
        {lines.map((l, i) => (
          <LineRow key={i} l={l} idx={i} shown={think} blue={[]} scatter={0} color={GHOST_INK} halo />
        ))}
      </div>
      {bars.map((bar) => {
        const y = g.textY + bar.li * LH + LH / 2;
        const wid = (bar.x1 - bar.x0) * open;
        return (
          <div key={bar.li} style={{ position: "absolute", left: g.rx + bar.x0, top: y - tick / 2, width: wid, height: tick }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: (tick - rule) / 2, height: rule, backgroundColor: INK, boxShadow: HALO_BOX }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: rule, height: tick, backgroundColor: INK, boxShadow: HALO_BOX }} />
            <div style={{ position: "absolute", right: 0, top: 0, width: rule, height: tick, backgroundColor: INK, boxShadow: HALO_BOX }} />
          </div>
        );
      })}
      {land && bars.length > 0 && (
        // the leader that makes the chip a TAG on the gap, not a label floating under the rail
        <div style={{
          position: "absolute",
          left: g.rx + (bars[bars.length - 1].x0 + bars[bars.length - 1].x1) / 2,
          top: g.textY + bars[bars.length - 1].li * LH + LH / 2 + tick / 2,
          width: rule, height: Math.max(0, chipTop - (g.textY + bars[bars.length - 1].li * LH + LH / 2 + tick / 2)),
          backgroundColor: INK, boxShadow: HALO_BOX, opacity: Number(land.opacity ?? 1),
        }} />
      )}
      {land && (
        <div style={{ position: "absolute", left: g.rx + COL / 2, top: chipTop, transform: "translateX(-50%)" }}>
          <Chip text={data.gapLabel} accent fs={gapFs} style={land} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- V11: the fillers light, the lines scatter

type ChaosData = { text: string; fillers: string[]; chip: string };

const Chaos: React.FC<CardProps & { data: ChaosData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const lines = React.useMemo(() => layout(data.text, data.fillers), [data.text, data.fillers]);
  const g = wall(w, h);
  const bRamble = beats.rambling ?? fromMs + 1270;
  const bPrompt = beats.prompt ?? bRamble + 1200;
  const bChaotic = beats.chaotic ?? bPrompt + 300;
  // the fillers flip one every 120 ms, in the order the plan lists them
  const blue = data.fillers.map((_, i) => easeOut(clamp01((tMs - (bRamble + i * 120) + HEAD) / 200)));
  // the drift starts on `prompt` and lands, settled, on `chaotic`: a skew, not a shake that runs on
  const scatter = spring({
    frame: Math.max(0, ((tMs - bPrompt + HEAD) / 1000) * fps), fps,
    durationInFrames: Math.max(4, Math.round(((bChaotic - bPrompt) / 1000) * fps)),
    config: { damping: 11, stiffness: 200, mass: 0.8 },
  });
  const land = landing(tMs, bChaotic, fps);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Phone
        x={g.px} y={g.py} s={1} lines={lines} shown={9999} tMs={tMs} amp={1}
        blue={blue} scatter={scatter} label="SAYING"
      />
      {land && (
        <div style={{ position: "absolute", left: g.rx + COL / 2, top: g.py + PH0 / 2, transform: "translate(-50%, -50%)" }}>
          <Chip text={data.chip} fs={chipFsBig(w)} style={land} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- V12: the two prompts judged

type VerdictData = {
  prompt: string; ramble: string; leftChip: string; rightChip: string; win: string;
};

const PlainLines: React.FC<{ lines: Line[]; fs: number; lh: number; color: string }> = ({ lines, fs, lh, color }) => (
  <>
    {lines.map((l, i) => (
      <div key={i} style={{ height: lh, lineHeight: `${lh}px`, fontFamily: SANS, fontSize: fs, color, whiteSpace: "pre" }}>
        {l.text}
      </div>
    ))}
  </>
);

// The two cards this hand-over crosses, from visuals.json and format.json. V11 is 0.86 W x 0.36 H
// and V12 is 0.92 W x 0.34 H, so they sit at a different left and top on the frame: the phone's
// V11 pose has to be re-expressed in THIS card's coordinates before it can be travelled from.
const CHAOS_W = 0.86, CHAOS_H = 0.36, VERDICT_W = 0.92, VERDICT_H = 0.34;
const BAND_TOP = 0.105, BAND_BOTTOM = 0.47;
const MOVE = 320;

const Verdict: React.FC<CardProps & { data: VerdictData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const lines = React.useMemo(() => layout(data.ramble), [data.ramble]);
  const cf = chipFs(w);
  const chipH = cf + 2 * Math.round(0.42 * cf);
  const top = Math.round(0.016 * h);
  const objH = h - top - 16 - chipH - 12 - chipH - top;
  const s = objH / PH0;
  const compW = Math.round(0.56 * w);
  const gap = Math.round(0.09 * w);
  const left = Math.round((w - (compW + gap + P0 * s)) / 2);
  const phoneX = left + compW + gap;
  const pFs = 28;
  const pLines = React.useMemo(
    () => wrapToks(tokenize(data.prompt, []), pFs, compGeo(0, 0, compW, pFs, 2).innerW),
    [data.prompt, compW],
  );
  const cg = compGeo(left, 0, compW, pFs, pLines.length);
  const g2 = compGeo(left, top + objH - cg.h, compW, pFs, pLines.length);
  const chipY = top + objH + 16;
  const clearY = chipY + chipH + 12;
  const clear = landing(tMs, beats.clear, fps);
  const q = clear ? " ?" : "";

  // the hand-over from V11: ONE movement, no re-pop. Frame 0 draws exactly what chaos left on the
  // wall (the phone in the left column at full size, 37 WORDS beside it), then over 320 ms the
  // phone travels to its slot here, its chip rides with it to the baseline, and the composer
  // slides in from off-frame. The beats `ai` and `clear` are untouched, both land after the move.
  const m = easeInOut(clamp01((tMs - fromMs) / MOVE));
  const W = w / VERDICT_W, H = h / VERDICT_H;              // the frame, from this card's own fracs
  const cw = CHAOS_W * W, chh = CHAOS_H * H;               // the card V11 was drawn in
  const dx = (W - cw) / 2 - (W - w) / 2;
  const dy = Math.max(BAND_TOP * H, BAND_BOTTOM * H - chh) - Math.max(BAND_TOP * H, BAND_BOTTOM * H - h);
  const c = wall(cw, chh);
  const fromX = c.px + dx, fromY = c.py + dy;
  const phX = fromX + (phoneX - fromX) * m;
  const phY = fromY + (top - fromY) * m;
  const phS = 1 + (s - 1) * m;
  // the chip travels by its CENTRE (it was centred on the phone in V11, it sits on the baseline
  // here) and shrinks from V11's big chip to this card's chip size
  const cx0 = c.rx + COL / 2 + dx, cy0 = c.py + PH0 / 2 + dy;
  const cx1 = phoneX + (P0 * s) / 2, cy1 = chipY + chipH / 2;
  const k0 = chipFsBig(cw) / cf;
  // the composer comes in on the same 320 ms, over a throw the size of the phone's own travel so
  // the two read as ONE movement; it is exactly absent on the first tenth of it, so frame 0 is the
  // picture chaos left. A slide from off-frame would be 1000 px in 320 ms and would strobe.
  const slide = (1 - m) * -0.17 * w;
  const cIn = clamp01((m - 0.06) / 0.44);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide.toFixed(2)}px)`, opacity: cIn }}>
        <ComposerBox g={g2}>
          <div style={{ position: "absolute", left: g2.textX, top: g2.textY, width: g2.innerW }}>
            <PlainLines lines={pLines} fs={g2.fs} lh={g2.lh} color={CLAUDE_T.ink} />
          </div>
        </ComposerBox>
        <div style={{ position: "absolute", left: left + compW / 2, top: chipY, transform: "translateX(-50%)" }}>
          <Chip text={data.leftChip} fs={cf} />
        </div>
        {clear && (
          <div style={{ position: "absolute", left: left + compW / 2, top: clearY, transform: "translateX(-50%)" }}>
            <Chip text={data.win} accent fs={cf} style={clear} glyph={<Check size={cf} color="#0E1B2E" />} />
          </div>
        )}
      </div>
      <Phone
        x={phX} y={phY} s={phS} lines={lines} shown={9999} tMs={tMs} amp={1}
        blue={[1, 1, 1, 1, 1, 1, 1]} scatter={1} label="SAYING"
      />
      <div style={{
        position: "absolute", left: cx0 + (cx1 - cx0) * m, top: cy0 + (cy1 - cy0) * m,
        transform: `translate(-50%, -50%) scale(${(k0 + (1 - k0) * m).toFixed(4)})`,
      }}>
        <Chip text={data.rightChip + q} fs={cf} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- V18: the ramble pours through the marks

type FunnelData = {
  ramble: string; fillers: string[]; marks: string[]; lines: string[]; chip: string;
};

const FLY: { label: string; needle: string; row: number }[] = [
  { label: "script", needle: "script", row: 0 },
  { label: "60 second", needle: "60 second", row: 0 },
  { label: "talking", needle: "talking", row: 0 },
  { label: "typing", needle: "typing", row: 0 },
  { label: "hook first", needle: "hook first", row: 1 },
  { label: "rule", needle: "rule", row: 2 },
];
// the six chips leave 106 ms apart and fly for 260, so the last one lands ON `land` (5 x 106 + 260
// = 790 ms, the turn-to-land span) and never more than two share the corridor. Three lanes keep
// those two apart in the air.
const STEP = 106, FLIGHT = 260;

const Funnel: React.FC<CardProps & { data: FunnelData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const lines = React.useMemo(() => layout(data.ramble, data.fillers), [data.ramble, data.fillers]);
  const cf = chipFs(w);
  const chipH = cf + 2 * Math.round(0.42 * cf);
  // three columns: the ramble it came from, the two marks it passes through, the prompt it becomes.
  // The phone is small on purpose - the viewer read this ramble for three seconds in V10/V11, here
  // it is the SHAPE of a mess with blue junk in it, and the payload is what flies out of it.
  const s = 0.58;
  const px = Math.round(0.018 * w);
  const py = Math.round((h - PH0 * s) / 2);
  const phoneR = px + P0 * s;
  const cy = py + (BEZ + STATUS + TXT_TOP + (lines.length * LH) / 2) * s;   // the corridor, on the ramble
  const mark = Math.round(0.121 * w);                                      // ~120 px marks
  const nameW = Math.round(0.195 * w);                                     // the widest name chip
  const gap = Math.round(0.032 * w);
  const mx = phoneR + gap + nameW / 2;
  const compLeft = phoneR + gap + nameW + gap;
  const compW = w - px - compLeft;
  const fFs = 26;
  // the three typed lines, wrapped in the composer's own inner width
  const probe = compGeo(0, 0, compW, fFs, 1);
  const rows = React.useMemo(
    () => data.lines.map((t) => wrapToks(tokenize(t, []), fFs, probe.innerW)),
    [data.lines, probe.innerW],
  );
  const nVis = rows.reduce((n, r) => n + r.length, 0);
  const rowTop: number[] = [];
  rows.reduce((n, r, i) => { rowTop[i] = n; return n + r.length; }, 0);
  const cg = compGeo(compLeft, 0, compW, fFs, nVis);
  const g = compGeo(compLeft, Math.round(cy - cg.h / 2), compW, fFs, nVis);

  const bRamble = beats.ramble ?? 0;
  const bTurn = beats.turn ?? 0;
  const bLand = beats.land ?? bTurn + 800;
  const blue = data.fillers.map((_, i) => easeOut(clamp01((tMs - (bRamble + i * 45) + HEAD) / 260)));
  // each chip TYPES its share of its line as it lands, so the prompt assembles out of the words
  // that flew, instead of appearing whole once the last one is in
  const arrive = FLY.map((_, i) => bTurn + i * STEP + FLIGHT - 70);
  const rowFrac = data.lines.map((_, r) => {
    const idx: number[] = [];
    FLY.forEach((f, i) => { if (f.row === r) idx.push(i); });
    if (!idx.length) return 0;
    return idx.reduce((n, i) => n + clamp01((tMs - arrive[i]) / 150), 0) / idx.length;
  });
  // the waiting list is 1. 2. 3. on three rows; the moment the long first line starts landing it
  // takes two rows and the two under it make room, the way a real list does
  const expand = easeOut(clamp01((tMs - arrive[0]) / 200));
  const rowIdx = rows.map((_, i) => (i === 0 ? 0 : i + (rowTop[i] - i) * expand));

  // the chips: each lifts off the phone at the height of its own word and lands on its line
  const flights = FLY.map((f, i) => {
    const at = locate(lines, f.needle, TXT_FS);
    const x0 = phoneR - 14;
    const y0 = py + (BEZ + STATUS + TXT_TOP + at.li * LH + LH / 2) * s;
    const x1 = g.textX + 22 + (i % 3) * 16;
    const y1 = g.textY + (rowTop[f.row] + 0.5) * g.lh;
    const lane = ((i % 3) - 1) * 24;
    const u = clamp01((tMs - (bTurn + i * STEP) + HEAD) / FLIGHT);
    const e = easeInOut(u);
    const q = (1 - e) * (1 - e), m = 2 * (1 - e) * e, r2 = e * e;
    return {
      f, u,
      x: q * x0 + m * ((x0 + x1) / 2) + r2 * x1,
      y: q * y0 + m * (cy + lane) + r2 * y1,
      k: 1 - 0.34 * e,
      // it dissolves into the line it becomes over the last third of the flight, so it never sits
      // opaque on top of the words it is writing
      o: u <= 0 ? 0 : Math.min(clamp01(u / 0.12), clamp01((1 - u) / 0.32)),
    };
  });
  // both marks pulse as a chip passes between them
  let pulse = 0;
  flights.forEach((fl) => {
    if (fl.u <= 0 || fl.u >= 1) return;
    pulse = Math.max(pulse, Math.max(0, 1 - Math.abs(fl.x - mx) / 90));
  });
  const gpt = landing(tMs, beats.chatgpt, fps);
  const cla = landing(tMs, beats.claude, fps);
  const clean = landing(tMs, bLand, fps);
  const markStyle = (st: React.CSSProperties | null): React.CSSProperties => ({
    width: mark, height: mark, objectFit: "contain",
    opacity: st ? Number(st.opacity ?? 1) : 0,
    transform: `${st?.transform ?? "scale(0.86)"} scale(${(1 + 0.13 * pulse).toFixed(4)})`,
  });
  const gptTop = Math.round(cy - 96 - chipH - 12 - mark);
  const claTop = Math.round(cy + 96);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Phone
        x={px} y={py} s={s} lines={lines} shown={9999} tMs={tMs} amp={1}
        blue={blue} scatter={0} label="SAYING"
      />

      {/* the two marks, bare on the wall, names under them on a chip. Nothing behind a logo. */}
      <div style={{ position: "absolute", left: mx, top: gptTop, transform: "translateX(-50%)" }}>
        <Img src={staticFile(assets[0])} style={markStyle(gpt)} />
      </div>
      <div style={{ position: "absolute", left: mx, top: gptTop + mark + 12, transform: "translateX(-50%)", opacity: gpt ? 1 : 0 }}>
        <Chip text={data.marks[0]} fs={cf} />
      </div>
      <div style={{ position: "absolute", left: mx, top: claTop, transform: "translateX(-50%)" }}>
        <Img src={staticFile(assets[1])} style={markStyle(cla)} />
      </div>
      <div style={{ position: "absolute", left: mx, top: claTop + mark + 12, transform: "translateX(-50%)", opacity: cla ? 1 : 0 }}>
        <Chip text={data.marks[1]} fs={cf} />
      </div>

      {/* the composer waiting with its three ghost numbers, then holding the clean prompt */}
      <ComposerBox g={g}>
        {rows.map((r, i) => {
          const done = rowFrac[i] > 0.001;
          const total = r.reduce((n, l) => n + l.text.length, 0);
          const chars = Math.floor(rowFrac[i] * (total + 4));
          return (
            <div key={i} style={{
              position: "absolute", left: g.textX, top: g.textY + rowIdx[i] * g.lh, width: g.innerW,
            }}>
              {(done ? r : [r[0]]).map((l, j) => (
                <div key={j} style={{
                  height: g.lh, lineHeight: `${g.lh}px`, fontFamily: SANS, fontSize: g.fs,
                  color: done ? CLAUDE_T.ink : CLAUDE_T.ph, whiteSpace: "pre",
                }}>
                  {done ? l.text.slice(0, Math.max(0, chars - l.start)) : `${i + 1}.`}
                </div>
              ))}
            </div>
          );
        })}
      </ComposerBox>

      {flights.map((fl, i) => (
        fl.o <= 0.001 ? null : (
          <div key={i} style={{
            position: "absolute", left: fl.x, top: fl.y,
            transform: `translateY(-50%) scale(${fl.k.toFixed(4)})`, transformOrigin: "left center",
            opacity: fl.o,
          }}>
            <Chip text={fl.f.label} fs={Math.round(0.032 * w)} />
          </div>
        )
      ))}

      {clean && (
        <div style={{ position: "absolute", left: compLeft + compW, top: g.top, transform: "translate(-100%, -88%)" }}>
          <Chip text={data.chip} accent fs={cf} style={clean} glyph={<Check size={cf} color="#0E1B2E" />} />
        </div>
      )}
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  dictate: Dictate, chaos: Chaos, verdict: Verdict, funnel: Funnel,
};
