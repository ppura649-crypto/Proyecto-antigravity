// Step 1's teacher picker, a macOS pop-up button. "model,": the cursor clicks it open; the menu of real Claude models
// scrolls and the highlight follows the cursor down to Claude Opus 4.7 (the model the report names); it is clicked,
// the menu closes, and on "teacher," a `teacher` badge stamps on it. The Claude mark in the field is the scene's thread
// (drawn by Distill.tsx, it flew here from the pair).
import React from "react";
import { Cursor, arrive, blurIn, ease, prog, useScene } from "../../../src/engine";
import { CLAUDE, Logo } from "./parts";
import { ACCENT, Chevron, IN, PICK, RoleBadge, type DT } from "./DistillKit";

/** real Claude models, oldest to newest; the report names Opus 4.6 and 4.7 */
const MODELS = ["Claude Haiku 4.5", "Claude Sonnet 4.5", "Claude Opus 4.5", "Claude Opus 4.6", "Claude Opus 4.7"];
const PICKED = 4;
const MENU = { top: PICK.top + PICK.h + 8, row: 68, shown: 4, pad: 8 };

const menuTimes = (t: DT) => ({ scroll: t.open + 10, hover: t.open + 16, closeAt: t.select + 2 });

/** the open menu: four rows in view, scrolled by one so Opus 4.7 comes up, the highlight tracking the cursor */
const Menu: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  const m = menuTimes(t);
  if (f < t.open || f > m.closeAt + 10) return null;
  const o = arrive(f, t.open, 12);
  const close = prog(f, m.closeAt, 9, ease.in);
  const scroll = prog(f, m.scroll, 22, ease.inOut) * MENU.row;
  // the highlight runs down the rows with the cursor, one row every few frames, and rests on the picked one
  const hi = Math.min(PICKED, Math.floor(Math.max(0, f - m.hover) / 5));
  const blink = f >= t.select && f < t.select + 6 && Math.floor((f - t.select) / 2) % 2 === 1; // the macOS click flash
  const w = IN.r - PICK.fieldL;
  return (
    <div
      style={{
        position: "absolute", left: PICK.fieldL, top: MENU.top, width: w, height: MENU.row * MENU.shown + MENU.pad * 2,
        borderRadius: 16, background: "rgba(255,255,255,0.98)", overflow: "hidden", zIndex: 20,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
        opacity: o * (1 - close), transform: `translateY(${((1 - o) * -14).toFixed(1)}px) scaleY(${(0.92 + 0.08 * o).toFixed(4)})`, transformOrigin: "top",
      }}
    >
      {MODELS.map((name, i) => {
        const y = MENU.pad + i * MENU.row - scroll;
        const on = i === hi && f >= m.hover && !blink;
        return (
          <div
            key={name}
            style={{
              position: "absolute", left: MENU.pad, top: y, width: w - MENU.pad * 2, height: MENU.row - 6, borderRadius: 10,
              background: on ? ACCENT : "transparent", display: "flex", alignItems: "center", gap: 16, paddingLeft: 18,
            }}
          >
            <Logo name="claude" size={34} style={{ filter: on ? "brightness(0) invert(1)" : undefined }} />
            <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 500, color: on ? "#FFFFFF" : ground.ink }}>{name}</span>
          </div>
        );
      })}
    </div>
  );
};

/** the pop-up button: "Choose a model" until Opus 4.7 is clicked, then the model's name and its role */
const Field: React.FC<{ t: DT }> = ({ t }) => {
  const { f, theme, ground } = useScene();
  const focus = f >= t.open - 2 && f < t.select + 8 ? prog(f, t.open - 2, 5) : 0;
  const chosen = f >= t.select + 2;
  return (
    <>
      <div style={{ position: "absolute", left: IN.l, top: PICK.top, height: PICK.h, display: "flex", alignItems: "center", ...blurIn(f, t.born + 16, { dur: 9, rise: 10 }) }}>
        <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim }}>Teacher</span>
      </div>
      <div
        style={{
          position: "absolute", left: PICK.fieldL, top: PICK.top, width: IN.r - PICK.fieldL, height: PICK.h, borderRadius: 16,
          background: "#FFFFFF", boxShadow: `0 1px 3px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(0,0,0,0.12), 0 0 0 ${(focus * 5).toFixed(1)}px ${ACCENT}55`,
          ...blurIn(f, t.born + 10, { dur: 9 }),
        }}
      >
        <div style={{ position: "absolute", left: PICK.textL - PICK.fieldL, top: 0, height: PICK.h, display: "flex", alignItems: "center", gap: 18 }}>
          {!chosen && <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 500, color: ground.dim }}>Choose a model</span>}
          {chosen && <span style={{ ...blurIn(f, t.select + 2, { dur: 6 }), fontFamily: theme.font.ui, fontSize: 34, fontWeight: 600, color: ground.ink }}>Claude Opus 4.7</span>}
          <RoleBadge text="teacher" color={CLAUDE} at={t.teacher} />
        </div>
        <div style={{ position: "absolute", right: 18, top: (PICK.h - 26) / 2 }}>
          <Chevron color={ground.dim} />
        </div>
      </div>
    </>
  );
};

export const Picker: React.FC<{ t: DT }> = ({ t }) => {
  const m = menuTimes(t);
  const rowY = (i: number) => MENU.top + MENU.pad + i * MENU.row + MENU.row / 2 - 14;
  return (
    <>
      <Field t={t} />
      <Menu t={t} />
      <Cursor
        until={t.teacher + 14}
        path={[
          { f: t.stronger - 2, x: 800, y: 1330 },
          { f: t.open - 6, x: 640, y: PICK.top + 30 },
          { f: t.open + 2, x: 640, y: PICK.top + 34 },
          { f: m.hover + 2, x: 600, y: rowY(1) },
          { f: t.select - 4, x: 590, y: rowY(PICKED) - MENU.row },
          { f: t.select, x: 590, y: rowY(PICKED) - MENU.row },
          { f: t.teacher + 14, x: 760, y: PICK.top + 180 },
        ]}
      />
    </>
  );
};
