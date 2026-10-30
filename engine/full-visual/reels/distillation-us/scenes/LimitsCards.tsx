// The "Model card" tab of `limits`: the student as a model page (Qwen/Qwen3-0.6B, its measured 596,049,920 parameters
// against Qwen3's largest open model), then its Skills box with a capacity gauge. The report's four skills fly up from
// a small Claude and load one by one; the fourth hits a full box and drops. Later ("collecting answers ... transfer
// useful skills") the page scrolls to the box, Claude's answers land in a strip under it, the transfer sweeps across
// the three loaded skills and they turn green.
import React from "react";
import { arrive, countTo, ease, leave, mix, pop, prog, useScene } from "../../../src/engine";
import { AMBER, CLAUDE, GOOD, Logo, PARAMS, QWEN } from "./parts";
import { BODY_TOP, CHIP, SKILLS, SkillChip, WIN, lerp, type LimitCues } from "./LimitsBits";

/** body coordinates (x from the window's left, y from the body's top) */
const Y = { header: 22, tags: 96, params: 154, row1: 190, row2: 260, skills: 344, slot: 414, strip: 700, bubbles: 752 };
const SLOT = (i: number) => Y.slot + i * 64;
/** the Skills box: room for exactly three chips */
const BOX = { top: Y.slot - 12, h: 3 * 64 - 8 + 24, w: CHIP.w + 24 };
const X0 = 34;
const BAR_W = 806;
export const SCROLL = Y.skills - 18; // phase C: the page scrolls so Skills sits at the top
export const SOURCE = { x: 540, y: 1400 }; // where the small Claude stands, stage coordinates

/** when each skill leaves Claude and when it lands: the fourth lands on "skill." */
const flight = (c: LimitCues, i: number) => ({ start: c.skill - 18 - (3 - i) * 12, land: c.skill - (3 - i) * 12 });
const bubbleAt = (c: LimitCues, i: number) => ({ start: c.collecting + i * 8, land: c.collecting + i * 8 + 16 });
const BUBBLES = ["Here's the fix.", "First, split it.", "Kernel updated.", "Tests pass now."];
const BW = 190;
const bubbleX = (i: number) => X0 + i * (BW + 14);

export const scrollAt = (f: number, c: LimitCues) => SCROLL * prog(f, c.so, 22, ease.inOut);

export const ModelBody: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, theme, ground } = useScene();
  const sc = scrollAt(f, c);
  const n = countTo(f, c.smaller, 26, PARAMS.big, PARAMS.small);
  const t = { fontSize: 32, color: ground.dim, fontWeight: 600 } as const;
  const row = (top: number): React.CSSProperties => ({ position: "absolute", left: X0, width: BAR_W, top, display: "flex", justifyContent: "space-between", fontSize: 34 });
  const bar = (top: number, w: number, color: string) => (
    <div style={{ position: "absolute", left: X0, top, width: BAR_W, height: 16, borderRadius: 8, background: "#EFEFF2" }}>
      <div style={{ width: Math.max(8, w), height: 16, borderRadius: 8, background: color }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: 1200, transform: `translateY(${(-sc).toFixed(1)}px)`, color: ground.ink }}>
      <div style={{ position: "absolute", left: X0, top: Y.header, height: 60, display: "flex", alignItems: "center", gap: 18 }}>
        <Logo name="qwen" size={60} />
        <span style={{ fontSize: 44, color: ground.dim }}>Qwen /</span>
        <span style={{ fontSize: 44, fontWeight: 700 }}>Qwen3-0.6B</span>
        <span style={{ marginLeft: 6, padding: "4px 16px", borderRadius: 10, background: `${QWEN}1F`, color: QWEN, fontSize: 32, fontWeight: 700, ...pop(f, c.student, { dur: 10 }) }}>student</span>
      </div>
      <div style={{ position: "absolute", left: X0, top: Y.tags, display: "flex", gap: 12 }}>
        {["Text Generation", "Transformers", "Safetensors"].map((s, i) => (
          <span key={s} style={{ padding: "6px 16px", borderRadius: 10, background: "#F2F2F5", fontSize: 28, color: "#4A4A50", ...pop(f, c.t0 + 10 + i * 4, { dur: 8 }) }}>{s}</span>
        ))}
      </div>
      <div style={{ position: "absolute", left: X0, top: Y.params, ...t }}>Parameters · open models</div>
      <div style={row(Y.row1)}><span style={{ color: ground.dim }}>Qwen3-235B-A22B</span><span style={{ fontFamily: theme.font.mono, color: ground.dim }}>235,000,000,000</span></div>
      {bar(Y.row1 + 48, BAR_W, "#C7C7CC")}
      <div style={row(Y.row2)}><span style={{ fontWeight: 700 }}>Qwen3-0.6B</span><span style={{ fontFamily: theme.font.mono, fontWeight: 700, color: QWEN }}>{Math.round(n).toLocaleString("en-US")}</span></div>
      {bar(Y.row2 + 48, (BAR_W * n) / PARAMS.big, QWEN)}
      <SkillsBox c={c} />
      <div style={{ position: "absolute", left: X0, top: Y.strip, ...t }}>Answers collected from Claude</div>
      {BUBBLES.map((s, i) => f >= bubbleAt(c, i).land && (
        <Bubble key={s} text={s} style={{ left: bubbleX(i), top: Y.bubbles, transform: `scale(${(1 + 0.05 * Math.sin(Math.PI * prog(f, c.transfer + i * 6, 12, ease.linear))).toFixed(3)})` }} />
      ))}
    </div>
  );
};

/** the Skills title, the capacity gauge, and the chips that made it in */
const SkillsBox: React.FC<{ c: LimitCues }> = ({ c }) => {
  const { f, ground } = useScene();
  const hit = flight(c, 3).land;
  const full = f >= hit && f < c.so;
  const flash = full ? 0.5 + 0.5 * Math.cos((f - hit) / 3) * (1 - prog(f, hit, 30, ease.linear)) : 0;
  return (
    <>
      <div style={{ position: "absolute", left: X0, top: Y.skills, fontSize: 38, fontWeight: 700 }}>Skills</div>
      <div style={{ position: "absolute", right: WIN.w - X0 - BAR_W, top: Y.skills + 2, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: full ? AMBER : ground.dim }}>{full ? "full" : "capacity"}</span>
        {[0, 1, 2].map((i) => {
          const k = prog(f, flight(c, i).land, 6, ease.linear);
          const base = mix(f, c.skills + i * 4, 8, QWEN, GOOD);
          const col = full ? mix(f, hit, 4, QWEN, AMBER) : base;
          return (
            <div key={i} style={{ width: 64, height: 26, borderRadius: 7, background: "#EFEFF2", overflow: "hidden", transform: `scaleY(${(1 + 0.25 * flash).toFixed(3)})` }}>
              <div style={{ width: `${(k * 100).toFixed(1)}%`, height: "100%", background: col }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: X0 - 12, top: BOX.top, width: BOX.w, height: BOX.h, borderRadius: 18, background: "#FAFAFC", boxShadow: `inset 0 0 0 ${full ? 3 : 2}px ${full ? AMBER : "#E3E3E6"}` }} />
      {SKILLS.slice(0, 3).map((s, i) => f >= flight(c, i).land && (
        <SkillChip key={s} text={s} tint={QWEN} fill={prog(f, c.transfer + i * 8, 20, ease.inOut)} glow={prog(f, c.skills + i * 4, 10)} style={{ left: X0, top: SLOT(i) }} />
      ))}
    </>
  );
};

const Bubble: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const { theme, ground } = useScene();
  return (
    <div style={{ position: "absolute", width: BW, height: 124, borderRadius: 16, background: "#FFFFFF", boxShadow: `inset 0 0 0 1.5px ${ground.hairline}, 0 10px 26px rgba(20,24,40,0.08)`, padding: "14px 16px", boxSizing: "border-box", fontFamily: theme.font.ui, fontSize: 26, lineHeight: "31px", color: ground.ink, ...style }}>
      <Logo name="claude" size={26} style={{ marginBottom: 6 }} />
      {text}
    </div>
  );
};

/** what is in flight between the small Claude and the page, drawn over the window (stage coordinates) */
export const InFlight: React.FC<{ c: LimitCues; winY: number }> = ({ c, winY }) => {
  const { f } = useScene();
  const sc = scrollAt(f, c);
  const out: React.ReactNode[] = [];
  SKILLS.forEach((s, i) => {
    const { start, land } = flight(c, i);
    if (f < start) return;
    const k = arrive(f, start, 18);
    const tx = WIN.left + X0 + CHIP.w / 2;
    const ty = BODY_TOP + winY + (i === 3 ? BOX.top + BOX.h + 8 : SLOT(i)) + CHIP.h / 2;
    let x = lerp(SOURCE.x, tx, k);
    let y = lerp(SOURCE.y, ty, k);
    let rot = 0;
    if (i < 3 && f >= land) return;
    if (i === 3) {
      // it reaches the full box, is pushed back, turns amber and falls out of the frame
      x += f >= land ? Math.sin((f - land) * 1.4) * 14 * (1 - prog(f, land, 16, ease.linear)) : 0;
      const fall = leave(f, land + 14, 26);
      y += fall * 900;
      rot = fall * 18;
      if (fall >= 1) return;
    }
    const tint = i === 3 ? mix(f, land, 5, CLAUDE, AMBER) : mix(f, land - 6, 6, CLAUDE, QWEN);
    out.push(<SkillChip key={s} text={s} tint={tint} style={{ left: x - CHIP.w / 2, top: y - CHIP.h / 2, transform: `rotate(${rot.toFixed(2)}deg) scale(${(0.35 + 0.65 * Math.min(1, k)).toFixed(3)})`, zIndex: 8 }} />);
  });
  BUBBLES.forEach((s, i) => {
    const { start, land } = bubbleAt(c, i);
    if (f < start || f >= land) return;
    const k = arrive(f, start, 16);
    const tx = WIN.left + bubbleX(i) + BW / 2;
    const ty = BODY_TOP + winY + Y.bubbles - sc + 62;
    out.push(<Bubble key={s} text={s} style={{ left: lerp(SOURCE.x, tx, k) - BW / 2, top: lerp(SOURCE.y, ty, k) - 62, transform: `scale(${(0.4 + 0.6 * k).toFixed(3)})`, zIndex: 8 }} />);
  });
  return <>{out}</>;
};
