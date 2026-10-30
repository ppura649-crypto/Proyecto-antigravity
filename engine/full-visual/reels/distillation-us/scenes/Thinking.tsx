// "That's why Alibaba went after Claude's thinking, the step-by-step reasoning it writes before answering. It's the
// closest thing to seeing how it thinks. And Anthropic now only shows a summary of it."
// A claude.ai reply lands with its thinking row closed; Alibaba's mark enters big, then docks on that row. The row
// opens and the steps appear one by one (an illustration, labelled so, not a real Claude transcript), then the answer
// types. On "closest" the chat falls away and the open block slides beside a small frosted Claude: the one window
// into it. On "summary" the steps fold into one line.
// Source: anthropic.com/threat-intelligence-report-september-2026 ("targeted the chain-of-thought (CoT) reasoning
// transcripts of Opus 4.6 and 4.7"; "Claude now summarizes its internal reasoning before responding").
import React from "react";
import { Travel, arriveEase, blurIn, blurOut, ease, pop, prog, typeOn, useScene } from "../../../src/engine";
import { CLAUDE, Logo } from "./parts";
import { FrostedClaude } from "./CatchBits";
import { Answer, CHAT, Spark, ThinkingBlock, UserBubble, easeOpen } from "./ClaudeChat";

const PANEL = { x: 90, y: 560, w: 900, h: 860 };
const UNIT_Y = 818;
const DROP = 110; // once the chat is gone, the block and the glass settle lower, centred in the stage
const MINI = { x: 96, y: 800 + DROP, w: 244, h: 290 };
const STEPS = ["It's a known saying.", "Teaching makes you understand.", "So the next word: “teach”."];
const ANSWER = "The best way to learn is to teach.";

export const Thinking: React.FC = () => {
  const { f, fps, cue, scene, theme, ground } = useScene();
  const enter = scene.from - 6;
  const alibaba = cue("Alibaba");
  const thinking = cue("thinking,");
  const step = cue("step-by-step");
  const answering = cue("answering.");
  const closest = cue("closest");
  const summary = cue("summary");
  const steps = [
    { text: STEPS[0], at: step + 4 },
    { text: STEPS[1], at: cue("reasoning") },
    { text: STEPS[2], at: cue("writes") },
  ];

  const open = easeOpen(f, step, 16) * (1 - easeOpen(f, summary, 16));
  const lane = prog(f, closest, 20, ease.inOut); // the block moves over to sit beside the glass: sharp, readable
  const UNIT_TOP = UNIT_Y + DROP * lane;
  const left = 130 + 270 * lane;
  const width = 820 - 250 * lane;
  const unitH = 64 + (STEPS.length * 48 + 34) * open;
  const answerMs = 22;
  const typed = typeOn(ANSWER, f, answering - Math.round((ANSWER.length * answerMs * fps) / 1000), fps, answerMs);
  const answerTop = UNIT_TOP + unitH + 30;
  const chatGone = f >= closest ? blurOut(f, closest, { dur: 12, blur: 14 }) : {};
  const ring = prog(f, thinking + 6, 8) * (1 - prog(f, closest, 10));

  // Alibaba's mark: big and centred first, then it docks on the thinking row it went after
  const dock = prog(f, thinking, 18, arriveEase(18));
  const aSize = 190 - 134 * dock;
  const ax = 540 + (left + width - 96 - 540) * dock;
  const ay = 1000 + (UNIT_TOP + 32 - 1000) * dock;

  const beam = prog(f, closest + 10, 12) * (1 - 0.65 * prog(f, summary, 14));
  const since = f - closest - 14;
  const sweep = since < 0 ? -1 : (since % 110) / 40;

  return (
    <>
      <Travel curve="measured" at={enter} from="bottom" dist={1000} dur={26} style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", inset: 0, ...chatGone }}>
          <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 22, background: CHAT.bg, boxShadow: `inset 0 0 0 2px ${CHAT.line}` }} />
          <div style={{ position: "absolute", left: 124, top: 584, fontFamily: theme.font.ui, fontSize: 30, fontWeight: 500, color: CHAT.grey }}>Finish the saying</div>
          <div style={{ position: "absolute", right: 124, top: 580, padding: "2px 16px", borderRadius: 10, boxShadow: `inset 0 0 0 2px ${CHAT.line}`, fontFamily: theme.font.ui, fontSize: 28, color: CHAT.dim }}>illustration</div>
          <UserBubble text="Finish the saying: the best way to learn is to" style={{ top: 648, ...blurIn(f, enter + 10, { dur: 8, rise: 14 }) }} />
          {f >= thinking && <Answer text={typed.text} typing={typed.typing} style={{ top: answerTop }} />}
          {f >= thinking && (
            <Spark spin={(f - thinking) * (typed.done ? 0.6 : 3)} style={{ top: (typed.text ? answerTop + 80 : UNIT_TOP + unitH + 26), ...pop(f, thinking + 4) }} />
          )}
        </div>
      </Travel>

      {/* the small frosted Claude, and the one window into it */}
      <Travel curve="measured" at={closest} from="left" dist={420} dur={18} style={{ position: "absolute", left: MINI.x, top: MINI.y }}>
        <FrostedClaude w={MINI.w} h={MINI.h} frost={1} sweep={sweep} />
      </Travel>
      {beam > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: beam }}>
          <defs>
            <linearGradient id="beam" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={CLAUDE} stopOpacity={0.55} />
              <stop offset="1" stopColor={CLAUDE} stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <polygon points={`${MINI.x + MINI.w},${MINI.y + 110} ${MINI.x + MINI.w},${MINI.y + 190} ${left},${UNIT_TOP + unitH} ${left},${UNIT_TOP}`} fill="url(#beam)" />
        </svg>
      )}

      {f >= thinking && (
        <div style={{ position: "absolute", left, top: UNIT_TOP, background: CHAT.bg, borderRadius: 14, ...blurIn(f, thinking, { dur: 9, rise: 26 }) }}>
          <ThinkingBlock width={width} open={open} steps={steps} fold={summary} summary="Recognized a known saying" live={!typed.done} ring={ring} />
        </div>
      )}

      {/* what the block is now, in plain words: first the window, then a summary only */}
      {f >= closest + 12 && (
        <div style={{ position: "absolute", left, top: UNIT_TOP + unitH + 22, fontFamily: theme.font.ui, fontSize: 36, fontWeight: 600, color: ground.ink, ...(f < summary ? blurIn(f, closest + 12, { dur: 9, rise: 12 }) : blurOut(f, summary, { dur: 6 })) }}>
          the closest window in
        </div>
      )}
      {f >= summary + 6 && (
        <div style={{ position: "absolute", left, top: UNIT_TOP + unitH + 22, ...pop(f, summary + 6, { dur: 10, from: 0.7 }) }}>
          <div style={{ padding: "10px 24px", borderRadius: 14, background: "rgba(217,119,87,0.16)", boxShadow: `inset 0 0 0 2px ${CLAUDE}`, fontFamily: theme.font.ui, fontSize: 38, fontWeight: 700, color: ground.ink, whiteSpace: "nowrap" }}>
            now: a summary only
          </div>
        </div>
      )}

      {f >= alibaba && f < closest + 12 && (
        <div style={{ position: "absolute", left: ax - aSize / 2, top: ay - aSize / 2, ...(f < closest ? pop(f, alibaba, { dur: 10, from: 0.6 }) : blurOut(f, closest, { dur: 10 })) }}>
          <Logo name="alibaba" size={aSize * 2.2} style={{ margin: `${-aSize * 0.6}px 0 0 ${-aSize * 0.6}px` }} /> {/* a wordmark: wider than its square box */}
        </div>
      )}
    </>
  );
};
