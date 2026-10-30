// What we see through the cutaway window once Claude's casing is shut, in turn: the full next-token distribution
// (151,936 bars, the top 40 at their real heights, then the flat tail) under a lock; the logit-lens race between the
// two leading words at the last layers (real: practice and learn swap the lead at layers 25-26); the real path of the
// model's best guess through the depth (logit lens, one chip per layer where the guess changes). All measured on
// Qwen3 0.6B. Everything here is positioned in screen px inside WIN.
import React from "react";
import { arrive, countTo, draw, ease, leave, pop, prog, useScene } from "../../../src/engine";
import { LENS, TOP40, VOCAB } from "./parts";
import { Lock, WIN } from "./CatchCasing";

export const PRACTICE = "#5AC8FA";
export const LEARN = "#E0719C";
const CX = WIN.x + WIN.w / 2;
const pOf = (layer: number, word: string) => LENS[layer].top.find((t) => t.token === word)?.p ?? 0;
const txt = (font: string, size: number, color: string, weight = 600): React.CSSProperties => ({ fontFamily: font, fontSize: size, fontWeight: weight, color, whiteSpace: "nowrap" });

/** the whole distribution for the next word, then the lock over it */
export const Distribution: React.FC<{ at: number; lockAt: number; outAt: number }> = ({ at, lockAt, outAt }) => {
  const { f, theme, ground } = useScene();
  if (f < at || f > outAt + 14) return null;
  const x0 = WIN.x + 40, base = WIN.y + WIN.h - 44, pitch = 11, H = 250;
  const tail = prog(f, at + 26, 22, ease.out);
  const n = Math.round(countTo(f, at, 46, 40, VOCAB));
  const dim = prog(f, lockAt - 4, 10);
  const colour = (i: number) => (i === 0 ? PRACTICE : i === 2 ? LEARN : "rgba(255,255,255,0.78)");
  const legend = [0, 1, 2].map((i) => ({ ...TOP40[i], c: colour(i) }));
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${(-720 * leave(f, outAt, 14)).toFixed(1)}px)` }}>
      <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 22, textAlign: "center", ...txt(theme.font.ui, 40, ground.ink, 700) }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("en-US")}</span> possible next tokens
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {TOP40.map((t, i) => {
          const k = arrive(f, at + i * 0.6, 14);
          return <rect key={t.token} x={x0 + i * pitch} y={base - (t.p / TOP40[0].p) * H * k} width={7} height={(t.p / TOP40[0].p) * H * k} rx={2} fill={colour(i)} />;
        })}
        <rect x={x0 + 40 * pitch} y={base - 2} width={(WIN.x + WIN.w - 28 - x0 - 40 * pitch) * tail} height={2} fill="rgba(255,255,255,0.7)" />
        {f > at + 24 && (
          <rect x={x0 - 60 + (((f - at - 24) * 9) % 700)} y={base - H - 10} width={46} height={H + 12} fill="rgba(255,255,255,0.10)" rx={6} />
        )}
        <rect x={x0 - 8} y={base + 4} width={(WIN.w - 64) * Math.max(prog(f, at, 20), tail)} height={2} fill={ground.hairline} />
      </svg>
      {legend.map((r, i) => (
        <div key={r.token} style={{ position: "absolute", left: WIN.x + 250, top: WIN.y + 100 + i * 50, display: "flex", alignItems: "center", gap: 14, ...pop(f, at + 10 + i * 6, { dur: 8, from: 0.8 }) }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: r.c }} />
          <span style={txt(theme.font.mono, 34, ground.ink)}>{r.token.trim()}</span>
          <span style={txt(theme.font.mono, 34, ground.dim)}>{(r.p * 100).toFixed(1)} %</span>
        </div>
      ))}
      <div style={{ position: "absolute", right: 1080 - (WIN.x + WIN.w - 28), top: base - 62, opacity: tail, ...txt(theme.font.mono, 32, ground.dim) }}>
        +151,896 more
      </div>
      {dim > 0 && <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: `rgba(11,11,13,${(0.62 * dim).toFixed(3)})` }} />}
      <Lock at={lockAt} cx={CX} cy={WIN.y + 196} />
      {f >= lockAt + 6 && (
        <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 290, textAlign: "center", ...txt(theme.font.ui, 40, ground.ink, 700), ...pop(f, lockAt + 6, { dur: 8, from: 0.85 }) }}>
          the student never sees these
        </div>
      )}
    </div>
  );
};

/** layer times for the race: the lens at layers 22..28, keyed so the lead swaps (25 -> 26) on "two words" */
export function raceKeys(at: number, chose: number) {
  return [
    { L: 22, t: at }, { L: 23, t: at + 14 }, { L: 24, t: at + 28 }, { L: 25, t: at + 46 },
    { L: 26, t: at + 70 }, { L: 27, t: chose - 40 }, { L: 28, t: chose - 14 },
  ];
}

function raceAt(f: number, keys: { L: number; t: number }[]) {
  let i = 0;
  while (i < keys.length - 1 && f >= keys[i + 1].t) i++;
  const b = keys[i], a = keys[Math.max(0, i - 1)];
  const k = prog(f, b.t, 12, ease.inOut);
  const val = (w: string) => pOf(a.L, w) + (pOf(b.L, w) - pOf(a.L, w)) * k;
  return { practice: val(" practice"), learn: val(" learn"), layer: b.L };
}

/** two bars racing layer by layer; the leader rides on top */
export const Race: React.FC<{ at: number; chose: number; outAt: number }> = ({ at, chose, outAt }) => {
  const { f, theme, ground } = useScene();
  if (f < at - 12 || f > outAt + 14) return null;
  const keys = raceKeys(at, chose);
  const r = raceAt(f, keys);
  const tie = keys[3].t;
  const lead = Math.max(-1, Math.min(1, (r.practice - r.learn) / 0.06));
  const rows = [
    { w: "practice", p: r.practice, c: PRACTICE, y: 0.5 - 0.5 * lead },
    { w: "learn", p: r.learn, c: LEARN, y: 0.5 + 0.5 * lead },
  ];
  const ended = prog(f, chose, 8);
  const enter = 1 - arrive(f, at - 12, 16);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${(720 * enter - 720 * leave(f, outAt, 14)).toFixed(1)}px)` }}>
      <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 24, textAlign: "center", ...txt(theme.font.ui, 34, ground.dim) }}>its best guess, layer by layer</div>
      <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 70, textAlign: "center", ...txt(theme.font.ui, 56, ground.ink, 700) }}>
        layer <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.layer}</span> <span style={{ color: ground.dim, fontWeight: 600 }}>of 28</span>
      </div>
      {rows.map((row) => {
        const lost = row.w === "learn" ? ended : 0;
        const top = WIN.y + 186 + row.y * 94;
        return (
          <div key={row.w} style={{ position: "absolute", left: WIN.x + 28, top, width: WIN.w - 56, height: 70, display: "flex", alignItems: "center", opacity: 1 - 0.55 * lost }}>
            <div style={{ width: 200, ...txt(theme.font.mono, 40, row.c, 700) }}>{row.w}</div>
            <div style={{ flex: 1, height: 44, borderRadius: 10, background: ground.hairline, overflow: "hidden" }}>
              <div style={{ width: `${(row.p * 100).toFixed(2)}%`, height: "100%", borderRadius: 10, background: row.c, boxShadow: `0 0 24px ${row.c}88` }} />
            </div>
            <div style={{ width: 120, textAlign: "right", fontVariantNumeric: "tabular-nums", ...txt(theme.font.mono, 38, ground.ink, 700) }}>{Math.round(row.p * 100)} %</div>
          </div>
        );
      })}
      {f >= tie && f < keys[5].t + 8 && (
        <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 382, display: "flex", justifyContent: "center", ...pop(f, tie, { dur: 10, from: 0.7 }), opacity: 1 - prog(f, keys[5].t, 8) }}>
          <div style={{ padding: "6px 26px", borderRadius: 30, background: "#FFFFFF", ...txt(theme.font.ui, 38, "#101010", 700) }}>two words, neck and neck</div>
        </div>
      )}
      {f >= chose + 4 && (
        <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 382, textAlign: "center", ...pop(f, chose + 4, { dur: 8, from: 0.8 }), ...txt(theme.font.ui, 36, ground.ink, 700) }}>
          <span style={{ color: LEARN }}>learn</span> stays inside
        </div>
      )}
    </div>
  );
};

/** the real path of best guesses through the depth: layer, word (only where the guess changes, as named in the plan) */
export const TRAIL = [1, 3, 4, 9, 11, 16, 18, 26, 28].map((L) => ({ L, w: LENS[L].top[0].token.trim() }));
/** one row per change, in depth order (the layer is written beside each chip): readable, and the order is real */
const chipW = (w: string) => 34 + w.length * 19.2;
export const trailPos = (i: number) => {
  const w = chipW(TRAIL[i].w);
  return { x: i % 2 ? WIN.x + 606 - w / 2 : WIN.x + 176 + w / 2, y: WIN.y + 82 + i * 42.5, w };
};

export const Trail: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const { f, theme, ground } = useScene();
  if (f < at - 10) return null;
  const pts = TRAIL.map((_, i) => trailPos(i));
  const k = prog(f, at, dur, ease.inOut) * (pts.length - 1);
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const run = ((f - at - dur) % 50) / 50;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: prog(f, at - 10, 10) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {pts.map((p, i) => (
          <line key={i} x1={WIN.x + 24} x2={WIN.x + WIN.w - 24} y1={p.y} y2={p.y} stroke="rgba(210,225,255,0.07)" strokeWidth={2} />
        ))}
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))" }} {...draw(f, at, dur)} />
        {f > at + dur && <circle cx={pts[Math.floor(run * 8)].x + (pts[Math.min(8, Math.floor(run * 8) + 1)].x - pts[Math.floor(run * 8)].x) * ((run * 8) % 1)} cy={pts[Math.floor(run * 8)].y + (pts[Math.min(8, Math.floor(run * 8) + 1)].y - pts[Math.floor(run * 8)].y) * ((run * 8) % 1)} r={9} fill="#FFFFFF" style={{ filter: "drop-shadow(0 0 12px #fff)" }} />}
      </svg>
      {TRAIL.map((t, i) => {
        const p = pts[i];
        const last = i === TRAIL.length - 1;
        const c = t.w === "practice" ? PRACTICE : t.w === "learn" ? LEARN : "rgba(255,255,255,0.55)";
        return k >= i - 0.05 ? (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}>
              <div style={{ ...pop(f, at + (i / 8) * dur, { dur: 8, from: 0.6 }), padding: "0 16px", height: 40, lineHeight: "40px", borderRadius: 10, background: "#16171B", boxShadow: `inset 0 0 0 ${last ? 3 : 2}px ${c}`, ...txt(theme.font.mono, 32, ground.ink, 600) }}>{t.w}</div>
            </div>
            <div style={{ position: "absolute", top: p.y - 17, left: WIN.x + 20, ...txt(theme.font.mono, 28, ground.dim, 500), opacity: prog(f, at + (i / 8) * dur, 6) }}>layer {t.L}</div>
          </React.Fragment>
        ) : null;
      })}
      <div style={{ position: "absolute", left: WIN.x, width: WIN.w, top: WIN.y + 16, textAlign: "center", ...txt(theme.font.ui, 40, ground.ink, 700), ...pop(f, at, { dur: 8, from: 0.8 }) }}>how it got there</div>
    </div>
  );
};
