import React from "react";
import { Easing } from "remotion";
import { Bubble, ClaudeFrame, Composer, Reply, Spark, type Line } from "./E-claude";
import { ED, Editor } from "./E-canvas";
import { HoloHandover, flyInto } from "./E-holo";
import { INK, SERIF, calm, mix, pick, ramp, type BeatsE } from "./E-util";
// reference edit K hook 4 (family E): "If you're still using Claude for marketing and then doing every ad yourself,
// you need to watch this. You can now hand over that whole work to one tool just starting with your website."
// One continuous object across five chained events: the claude.ai chat (prompt sent on CLAUDE, the reply
// streams on MARKETING) -> it shrinks left beside a design editor where every ad is built by hand -> the
// counter ticks, the work stalls -> on HAND both gather, on WHOLE they fly into Holo -> the URL field.

export const PROMPT4 = "Give me 10 ad ideas for my brand";
const IDEAS: [string, string][] = [
  ["Before and after.", " Split screen, problem vs. result"], ["Review card.", " One real customer quote, big"],
  ["3 reasons why.", " A carousel, one reason per slide"], ["Founder story.", " 15 seconds, why you started"],
  ["Close-up.", " The product and one benefit line"], ["Countdown.", " A limited offer with a deadline"],
  ["Unboxing.", " Filmed by a real customer"], ["Problem, fix.", " Name the pain, show the product"],
  ["Us vs. them.", " A simple comparison chart"], ["Behind the scenes.", " How it is made"],
];
const LINES4: Line[] = [{ k: "p", t: "Here are 10 ad ideas for your brand:" },
  ...IDEAS.map(([b, t], i) => ({ k: "num" as const, n: i + 1, b, t }))];

const TOTAL4 = LINES4.reduce((a, l) => a + l.t.length + (l.b?.length ?? 0), 0);
const WIN = { x: 40, y: 17, w: 1000, h: 600 };
// chars streamed by spine ms t: steady after the send, fast from MARKETING
const streamed = (t: number, b: BeatsE) => {
  const a = b.claude! + 200, m = b.marketing!;
  if (t < a) return 0;
  return t < m ? (t - a) * 0.09 : (m - a) * 0.09 + (t - m) * 0.33;
};

const Chat: React.FC<{ t: number; fps: number; b: BeatsE; spark: string }> = ({ t, fps, b, spark }) => {
  const sent = calm(t, b.claude!, fps);
  const press = t >= b.claude! && t < b.claude! + 140 ? Math.sin(((t - b.claude!) / 140) * Math.PI) : 0;
  const n = streamed(t, b);
  const compY = mix(318, WIN.h - 142 - 22, sent);
  return (
    <ClaudeFrame spark={spark} w={WIN.w} h={WIN.h}>
      {/* the empty chat's greeting, gone once the prompt is sent */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 212 - 40 * sent, display: "flex", justifyContent: "center",
        alignItems: "center", gap: 16, opacity: Math.max(0, 1 - sent * 2.5) }}>
        <Spark src={spark} size={46} rot={(t / 1000) * 12} />
        <div style={{ fontFamily: SERIF, fontSize: 48, color: INK, letterSpacing: -0.8 }}>How can I help you today?</div>
      </div>
      <div style={{ position: "absolute", right: 40, top: 92 + 30 * (1 - sent), opacity: Math.max(0, (sent - 0.35) / 0.65) }}><Bubble text={PROMPT4} /></div>
      <div style={{ position: "absolute", left: 48, right: 48, top: 172 }}>
        <Reply lines={LINES4} n={n} vh={compY - 172 - 14} spark={spark} rot={(t / 1000) * 90} streaming={n > 0 && n < TOTAL4} />
      </div>
      <div style={{ position: "absolute", left: 60, top: compY }}>
        <Composer w={880} text={t < b.claude! + 60 ? PROMPT4 : undefined} caret={t < b.claude! && Math.floor(t / 450) % 2 === 0} press={press} />
      </div>
    </ClaudeFrame>
  );
};

export const Hook4: React.FC<{ t: number; fps: number; b: BeatsE; assets: string[] }> = ({ t, fps, b, assets }) => {
  const spark = pick(assets, "famE-claude.png");
  // 1) a slow push on the whole chat until AND
  const push = 1 + 0.025 * ramp(t, -200, b.and!, Easing.linear);
  // 2) AND: the chat shrinks to a column on the left, the editor comes in from the right
  const col = calm(t, b.and!, fps);
  const edIn = calm(t, b.and! + 120, fps);
  // 3) after THIS: the editor tilts back into depth; 4) HAND: both gather into one bundle at the centre
  const tilt = ramp(t, b.this! + 60, b.this! + 760);
  const gather = ramp(t, b.hand!, b.hand! + 480);
  const chatS = mix(push, 0.5, col) * mix(1, 0.9, gather);
  const chatX = mix(WIN.x, 20, col) + 150 * gather, chatY = mix(WIN.y, 167, col) + 20 * gather;
  const edX = mix(1120, 540, edIn) - 110 * gather, edY = WIN.y + 10 * gather;
  const drift = 1 + 0.025 * ramp(t, b.yourself!, b.whole!, Easing.linear); // a slow push while it stalls
  if (t >= b.whole! + 470) return <HoloHandover t={t} fps={fps} b={b} assets={assets} />;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <HoloHandover t={t} fps={fps} b={b} assets={assets} />
      <div style={{ position: "absolute", inset: 0, ...flyInto(t, b, 540, 317) }}>
       <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 317px", transform: `scale(${drift})` }}>
        <div style={{ position: "absolute", left: chatX, top: chatY, transformOrigin: "0 0", transform: `scale(${chatS})` }}>
          <Chat t={t} fps={fps} b={b} spark={spark} />
        </div>
        {t >= b.and! && (
          <div style={{ position: "absolute", left: edX, top: edY, width: ED.w, height: ED.h, perspective: 1600 }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%",
              transform: `rotateX(${9 * tilt}deg) rotateZ(${2.5 * gather}deg) scale(${mix(1, 0.94, tilt)})` }}>
              <Editor t={t} b={b} />
            </div>
          </div>
        )}
       </div>
      </div>
    </div>
  );
};
