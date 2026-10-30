// scary, dark, 108.6-113.2 s: "These agents weren't trying to take over. They were trying to pass a test. That's what
// makes it scary."
// First frame: the red swarm we have followed, drifting loose across the stage. "take": a faint globe rises in the
// middle of them; "over": one red stroke strikes it through, and it fades on "They". "pass": a small test sheet lands
// where the globe was; the dots calm from red to cyan and white and gather round it, landing on "test". "That's":
// the stage pulls back, slowly, ending on "scary": the swarm is 1,200 dots filling the stage around a tiny sheet, and
// the field breathes in slow waves. A counter runs 180 to 1,200 with the pull-back. Quiet, no stamps, no red after "over".
import React from "react";
import { Column, blurIn, countTo, draw, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { AGENT, RED } from "./parts";
import { SCARY_C, ScaryField, scaryZoom } from "./ScaryField";

const Globe: React.FC<{ take: number; over: number; gone: number }> = ({ take, over, gone }) => {
  const { f } = useScene();
  if (f < take || f > gone + 10) return null;
  const st = blurIn(f, take, { dur: 10, scaleFrom: 0.9 });
  const fade = 1 - prog(f, gone, 10, ease.in);
  const ink = "rgba(235,240,255,0.75)";
  return (
    <svg width={400} height={400} viewBox="-200 -200 400 400" style={{ position: "absolute", left: SCARY_C.x - 200, top: SCARY_C.y - 200, overflow: "visible", ...st, opacity: (st.opacity as number) * fade, filter: fade < 1 ? `blur(${((1 - fade) * 12).toFixed(1)}px)` : st.filter }}>
      <circle r={160} fill="rgba(90,200,250,0.06)" stroke={ink} strokeWidth={4} />
      {[60, 110].map((rx) => <ellipse key={rx} rx={rx} ry={160} fill="none" stroke={ink} strokeWidth={3} transform={`rotate(${Math.sin(f / 40) * 4})`} />)}
      <line x1={0} y1={-160} x2={0} y2={160} stroke={ink} strokeWidth={3} />
      {[-90, 0, 90].map((y) => <ellipse key={y} cy={y} rx={Math.sqrt(160 * 160 - y * y)} ry={14} fill="none" stroke={ink} strokeWidth={3} />)}
      {f >= over && <path d="M-190 170 L190 -170" stroke={RED} strokeWidth={14} strokeLinecap="round" {...draw(f, over, 10)} />}
    </svg>
  );
};

/** the test sheet: a small paper with ticked boxes; it lives in the field's world, so it shrinks with the pull-back */
const Sheet: React.FC<{ at: number; z: number }> = ({ at, z }) => {
  const { f } = useScene();
  if (f < at) return null;
  const glow = 30 + 10 * Math.sin(f / 12);
  return (
    <div style={{ position: "absolute", left: SCARY_C.x - 110, top: SCARY_C.y - 140, width: 220, height: 280, transform: `scale(${z.toFixed(4)})`, transformOrigin: "50% 50%" }}>
      <div style={{ width: 220, height: 280, borderRadius: 14, background: "#F7F8FA", boxShadow: `0 0 ${glow}px rgba(90,200,250,0.55)`, padding: "22px 24px", boxSizing: "border-box", ...blurIn(f, at, { dur: 9, scaleFrom: 0.8 }) }}>
        <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 4, color: "#101010" }}>TEST</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, border: "3px solid #9AA1AD" }} />
            <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#D5D9E0", width: 90 + (i % 2) * 30 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const Scary: React.FC = () => {
  const { f, cue, scene, ground } = useScene();
  const t0 = scene.from - LEAD;
  const take = cue("take");
  const over = cue("over");
  const they = cue("they");
  const pass = cue("pass");
  const test = cue("test");
  const scary = cue("scary");
  const gDur = Math.max(20, test - pass + 6);
  const pDur = 44;
  const pull = scary - pDur;
  const z = scaryZoom(f, pull, pDur);
  const n = Math.round(countTo(f, pull, pDur, 180, 1200));
  const labelIn = blurIn(f, pull, { dur: 10 });
  return (
    <Column>
      <div style={{ position: "absolute", left: 40, top: 540, width: 820, height: 900, background: `radial-gradient(45% 40% at 50% 52%, rgba(90,200,250,${(0.07 * prog(f, pass, 30)).toFixed(3)}) 0%, rgba(90,200,250,0) 100%)` }} />
      <Globe take={take} over={over} gone={they} />
      <ScaryField t0={t0} gather={test - gDur} gDur={gDur} pull={pull} pDur={pDur} />
      <Sheet at={pass} z={z} />
      {f >= pull && (
        <div style={{ position: "absolute", left: 250, width: 400, top: 1348, height: 84, borderRadius: 42, background: "rgba(16,16,16,0.82)", boxShadow: `0 0 0 1.5px ${ground.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Inter", ...labelIn }}>
          <span style={{ fontSize: 50, fontWeight: 800, color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("en-US")}</span>
          <span style={{ fontSize: 36, fontWeight: 600, color: AGENT }}>agents</span>
        </div>
      )}
    </Column>
  );
};
