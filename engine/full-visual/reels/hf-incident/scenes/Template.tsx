// `template` (light): "The second let them slip commands into a template, so the server ran their code."
// A fill-in-the-blank card ("Hello ____, your model is ready") stands in front of a machine. "second": a "2" badge.
// "slip": a glowing red slip appears under the card; "commands": plain words type onto it; it rises into the blank,
// landing on "template", where a name should go. "server": the machine's reader throws a red beam down and reads it.
// "code": the machine obeys, gears spin up, lamps go red, "running". A metaphor only: plain words, never code.
import React from "react";
import { Column, arrive, blurIn, ease, pop, prog, typeOn, useScene } from "../../../src/engine";
import { RED } from "./parts";
import { MACHINE, TemplateMachine, type TemplateCues } from "./TemplateMachine";

const CARD = { left: 90, top: 1030, width: 720, height: 290 };
const BLANK = { x: 250, y: 40, w: 340, h: 92 };
const SLIP = { w: 316, h: 76 };
const PARK = { x: BLANK.x + (BLANK.w - SLIP.w) / 2, y: BLANK.y + (BLANK.h - SLIP.h) / 2 };
const HOVER = { x: PARK.x, y: 326 };
const WORDS = "do what I say";

const useTemplateCues = (): TemplateCues => {
  const { cue } = useScene();
  return { second: cue("second"), slip: cue("slip"), commands: cue("commands"), template: cue("template"), server: cue("server"), ran: cue("ran"), code: cue("code") };
};

/** the slip: pops in under the card, takes its words, rises into the blank */
const TemplateSlip: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f, fps, theme } = useScene();
  if (f < c.slip) return null;
  const riseAt = c.template - 22;
  const k = arrive(f, riseAt, 22);
  const kPrev = arrive(f - 1, riseAt, 22);
  const y = HOVER.y + (PARK.y - HOVER.y) * k;
  const v = Math.abs((kPrev - k) * (PARK.y - HOVER.y));
  const t = typeOn(WORDS, f, c.commands, fps, 30);
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  const landed = prog(f, c.template, 10);
  const scan = prog(f, c.server + 2, 18, ease.inOut);
  const scanning = f >= c.server + 2 && f < c.server + 22;
  const float = (1 - k) * Math.sin(f / 9) * 5;
  return (
    <div style={{ position: "absolute", left: HOVER.x, top: y + float, width: SLIP.w, height: SLIP.h, ...pop(f, c.slip, { from: 0.5 }) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "linear-gradient(180deg, #FF5A4F, #E0241A)", boxShadow: `0 0 ${(26 + 18 * pulse + 30 * (1 - landed) * (f >= c.template ? 1 : 0)).toFixed(0)}px rgba(255,59,48,${(0.55 + 0.25 * pulse).toFixed(2)}), inset 0 2px 0 rgba(255,255,255,0.35), 0 ${(14 * (1 - k)).toFixed(0)}px 24px rgba(160,20,10,0.3)`, filter: v > 2 ? `blur(${Math.min(6, v * 0.15).toFixed(1)}px)` : undefined, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 38, fontWeight: 800, color: "#FFFFFF", whiteSpace: "pre" }}>
          {t.text}
          {t.typing && <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 3, background: "#FFFFFF" }} />}
        </div>
        {scanning && <div style={{ position: "absolute", top: 0, bottom: 0, left: -60 + scan * (SLIP.w + 60), width: 60, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)" }} />}
      </div>
    </div>
  );
};

/** the form card with its blank; the slip lives inside it so it shares the tilt */
const TemplateCard: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f, scene, theme } = useScene();
  const bump = f >= c.template ? Math.sin(prog(f, c.template, 12) * Math.PI) * 6 : 0;
  const drift = Math.sin(f / 17) * 3;
  const nameGone = prog(f, c.template - 8, 8);
  const flash = f >= c.template && f < c.template + 14 ? 1 - (f - c.template) / 14 : 0;
  const text: React.CSSProperties = { position: "absolute", fontFamily: theme.font.ui, fontSize: 62, fontWeight: 700, color: "#15171A", letterSpacing: -1 };
  return (
    <div style={{ position: "absolute", ...CARD, ...blurIn(f, scene.from - 6, { dur: 10, rise: 50 }) }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(-2deg) translateY(${(drift - bump).toFixed(2)}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(180deg, #FFFFFF, #F4F2EE)", boxShadow: "0 40px 60px -24px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
        <div style={{ ...text, left: 56, top: 50 }}>Hello</div>
        <div style={{ position: "absolute", left: BLANK.x, top: BLANK.y, width: BLANK.w, height: BLANK.h, borderRadius: 14, background: "#EFECE6", boxShadow: `inset 0 3px 8px rgba(0,0,0,0.12), 0 0 0 ${(6 * flash).toFixed(1)}px rgba(255,59,48,${(0.5 * flash).toFixed(2)})` }}>
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 16, height: 4, borderRadius: 2, background: "#B9B4AA" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 36, fontStyle: "italic", color: "#A39E94", opacity: 1 - nameGone, transform: `translateY(${(-20 * nameGone).toFixed(1)}px)` }}>
            name
          </div>
        </div>
        <div style={{ ...text, left: BLANK.x + BLANK.w + 6, top: 50 }}>,</div>
        <div style={{ ...text, left: 56, top: 160 }}>your model is ready</div>
        <TemplateSlip c={c} />
      </div>
    </div>
  );
};

/** the reader's red beam from the machine's slot down to the slip, with sparks climbing it */
const TemplateBeam: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.server) return null;
  const o = prog(f, c.server, 6) * (1 - prog(f, c.code + 16, 14));
  const top = MACHINE.top + MACHINE.height - 22;
  const bottom = CARD.top + PARK.y + SLIP.h / 2;
  const sparks = Array.from({ length: 9 }, (_, i) => {
    const life = ((f - c.server - i * 3) % 24) / 24;
    return f - c.server - i * 3 < 0 ? null : { x: 510 - 60 * life + ((i * 53) % 110) - 55 + Math.sin(f / 5 + i) * 8, y: bottom - (bottom - top) * life, o: 1 - life };
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 1450, opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 330, width: 338, top, height: bottom - top, clipPath: "polygon(0 0, 71% 0, 100% 100%, 6.5% 100%)", background: "linear-gradient(180deg, rgba(255,59,48,0.75), rgba(255,59,48,0.12))", mixBlendMode: "multiply" }} />
      {sparks.map((s, i) => s && <div key={i} style={{ position: "absolute", left: s.x - 5, top: s.y - 5, width: 10, height: 10, borderRadius: 5, background: RED, opacity: s.o, boxShadow: `0 0 10px ${RED}` }} />)}
    </div>
  );
};

/** the "2": this is the second way in */
const TemplateBadge: React.FC<{ c: TemplateCues }> = ({ c }) => {
  const { f, theme } = useScene();
  if (f < c.second) return null;
  return (
    <div style={{ position: "absolute", left: 40, top: 972, width: 110, height: 110, borderRadius: 55, background: "#15171A", boxShadow: `0 0 0 6px ${RED}, 0 18px 30px rgba(0,0,0,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontSize: 72, fontWeight: 800, color: "#FFFFFF", zIndex: 5, ...pop(f, c.second, { dur: 10, from: 0.3 }) }}>
      2
    </div>
  );
};

export const Template: React.FC = () => {
  const { scene } = useScene();
  const c = useTemplateCues();
  return (
    <Column>
      <TemplateMachine c={c} enter={scene.from - 2} />
      <TemplateCard c={c} />
      <TemplateBeam c={c} />
      <TemplateBadge c={c} />
    </Column>
  );
};
