import React from "react";
import { Glass, Header, Bar } from "./Glass";
import { SkillFile, type CardProps } from "./Objects";
import { SOFT, fade, microLabel, clamp01, since, type Box } from "./tokens";

// Her timeline family (XAFZ f255-372): a glass panel 0.112-0.886W x 0.136-0.36H with a
// header row and pastel rounded bars that arrive one at a time, 2-frame fades, in speech
// order; then a static hold. Used here as a rules list, a shrinking list, a prompt, and
// the study's two numbers. Bars never spring; a width change is a 7-frame linear move.

const PANEL: Box = { x: 0.112, y: 0.136, w: 0.774, h: 0.224 };
const WIDTHS = [170, 110, 190, 150, 90, 130, 200, 120, 160, 100, 180, 140, 110, 150, 90, 170];

const barRows = (n: number, rowW: number, opacities: number[]) => {
  const rows: React.ReactNode[][] = [[]];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const w = WIDTHS[i % WIDTHS.length];
    if (x + w > rowW) { rows.push([]); x = 0; }
    rows[rows.length - 1].push(<Bar key={i} w={w} color={SOFT.pastel[i % 5]} opacity={opacities[i]} />);
    x += w + 14;
  }
  return rows.map((r, i) => <div key={i} style={{ display: "flex", gap: 14 }}>{r}</div>);
};

// rules appended every time the agent fails: `initial` bars with the panel, one more per beat
export const Rules: React.FC<CardProps & { left: string; initial: number; adds: number[]; box?: Box }> = (p) => {
  const box = p.box ?? PANEL;
  const n = p.initial + p.adds.length;
  const ops = Array.from({ length: n }, (_, i) =>
    i < p.initial ? 1 : fade(p.tMs, p.adds[i - p.initial], 2, p.fps)
  );
  const count = p.initial + p.adds.filter((a) => p.tMs >= a).length;
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}>
      <Header left={p.left} right={`${count} RULES`} />
      <div style={{ position: "absolute", top: 126, left: 44, right: 44, display: "flex", flexDirection: "column", gap: 16 }}>
        {barRows(n, box.w * p.W - 88, ops)}
      </div>
      {/* her timeline's bottom rule (XAFZ f330) */}
      <div style={{ position: "absolute", left: 44, right: 44, bottom: 40, height: 1, backgroundColor: SOFT.glassRule }} />
    </Glass>
  );
};

// the smallest set: a full list morphs over 7 frames into one SKILL.md file (XAFZ f366-372)
export const Shrink: React.FC<CardProps & { left: string; count: number }> = (p) => {
  const at = p.beats.morph ?? p.toMs;
  const m = fade(p.tMs, at, 7, p.fps);
  const file: Box = { x: 0.361, y: 0.135, w: 0.269, h: 0.111 };
  const ops = Array.from({ length: p.count }, () => 1);
  return (
    <>
      <Glass
        box={PANEL} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}
        style={{ opacity: (1 - m) * fade(p.tMs, p.fromMs, 4, p.fps), transform: `scale(${1 - 0.45 * m})`, transformOrigin: "50% 20%" }}
      >
        <Header left={p.left} right={`${p.count} RULES`} />
        <div style={{ position: "absolute", top: 126, left: 44, right: 44, display: "flex", flexDirection: "column", gap: 16 }}>
          {barRows(p.count, PANEL.w * p.W - 88, ops)}
        </div>
      </Glass>
      {m > 0 ? <SkillFile W={p.W} H={p.H} box={file} opacity={m} scale={0.85 + 0.15 * m} /> : null}
    </>
  );
};

// a small prompt that only grows when an observed failure justifies it
export const Prompt: React.FC<CardProps & { left: string; fail: string }> = (p) => {
  const box: Box = { ...PANEL, h: 0.2 };
  const failAt = p.beats.fail ?? p.toMs;
  const addAt = p.beats.add ?? p.toMs;
  const fo = fade(p.tMs, failAt, 3, p.fps);
  const ao = fade(p.tMs, addAt, 2, p.fps);
  const count = 2 + (p.tMs >= addAt ? 1 : 0);
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}>
      <Header left={p.left} right={`${count} RULES`} />
      <div style={{ position: "absolute", top: 126, left: 44, display: "flex", gap: 14 }}>
        <Bar w={190} color={SOFT.pastel[0]} />
        <Bar w={130} color={SOFT.pastel[3]} />
        <Bar w={160} color={SOFT.pastel[2]} opacity={ao} />
      </div>
      <div
        style={{
          position: "absolute", top: 206, left: 44, opacity: fo, display: "inline-flex", alignItems: "center", gap: 12,
          padding: "10px 20px", borderRadius: 12, backgroundColor: "rgba(30,33,30,0.86)",
        }}
      >
        <span style={{ fontFamily: SOFT.grotesque, fontWeight: 700, fontSize: 22, color: SOFT.white }}>✕</span>
        <span style={microLabel(18, "rgba(255,255,255,0.92)")}>{p.fail}</span>
      </div>
    </Glass>
  );
};

// the study's two results: a long bar that shrinks on the word, a second bar that grows
export const Stats: React.FC<
  CardProps & { left: string; right: string; row1: string; v1a: string; v1b: string; row2: string; v2: string }
> = (p) => {
  const bodyW = PANEL.w * p.W - 88;
  const shrinkAt = p.beats.shrink ?? p.toMs;
  const row2At = p.beats.row2 ?? p.toMs;
  const val2At = p.beats.val2 ?? row2At;
  const s = clamp01(since(p.tMs, shrinkAt, p.fps) / 7);
  const w1 = bodyW * (0.62 - 0.56 * s);
  const g = clamp01(since(p.tMs, row2At, p.fps) / 7);
  const o2 = fade(p.tMs, row2At, 3, p.fps);
  const v2o = fade(p.tMs, val2At, 3, p.fps);
  const value = (t: string, o = 1) => (
    <div style={{ fontFamily: SOFT.grotesque, fontWeight: 700, fontSize: 34, color: SOFT.glassInk, letterSpacing: "-0.01em", opacity: o, whiteSpace: "nowrap" }}>{t}</div>
  );
  return (
    <Glass box={{ ...PANEL, h: 0.195 }} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}>
      <Header left={p.left} right={p.right} />
      <div style={{ position: "absolute", top: 118, left: 44, right: 44 }}>
        <div style={microLabel(18, SOFT.glassMuted)}>{p.row1}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
          <Bar w={w1} h={40} color={SOFT.pastel[1]} />
          {value(p.tMs >= shrinkAt ? p.v1b : p.v1a)}
        </div>
        <div style={{ ...microLabel(18, SOFT.glassMuted), marginTop: 26, opacity: o2 }}>{p.row2}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10, opacity: o2 }}>
          <Bar w={Math.max(8, bodyW * 0.3 * g)} h={40} color={SOFT.pastel[3]} />
          {value(p.v2, v2o)}
        </div>
      </div>
    </Glass>
  );
};

// a client's SKILL.md read as bullets: each row fades in 3 frames on its word, keyword bold
export const Doc: React.FC<CardProps & { left: string; right?: string; rows: { atMs: number; strong: string; text: string }[] }> = (p) => {
  const box: Box = { x: 0.11, y: 0.135, w: 0.78, h: 0.205 };
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={34}>
      <Header left={p.left} right={p.right} />
      <div style={{ position: "absolute", top: 122, left: 44, right: 44, display: "flex", flexDirection: "column", gap: 22 }}>
        {p.rows.map((r, i) => (
          <div key={i} style={{ opacity: fade(p.tMs, r.atMs, 3, p.fps), fontFamily: SOFT.grotesque, fontSize: 31, color: SOFT.glassInk, display: "flex", gap: 16, lineHeight: 1.2 }}>
            <span style={{ opacity: 0.55 }}>•</span>
            <span><span style={{ fontWeight: 800 }}>{r.strong}</span>{" "}<span style={{ fontWeight: 500 }}>{r.text}</span></span>
          </div>
        ))}
      </div>
    </Glass>
  );
};
