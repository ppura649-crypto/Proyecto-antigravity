import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, LABEL_FONT, label } from "./theme";

// "the thing that actually worked for me is deciding WHAT TANGIBLE THING can I
// get out of AI BEFORE I START PROMPTING it?" - the teaching is ORDER, so the
// card is ONE still composition (an empty slot ABOVE Claude's composer) that a
// camera walks: hold the two-box shape wide, push onto the slot as the outcome
// lands, pull back so the 1 and the 2 read together, then push down onto the
// composer while the prompt types. No size inside the replica is ever changed.

const SANS = "Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif";

// remocn `claude-chat` (remocn.dev/r/claude-chat.json), verbatim. Every number
// below is the component's own, in its own coordinate space, never re-derived
// as a fraction of the card - reflowing a real UI to the card is the documented
// way this goes wrong, and the push is the documented fix (see ClaudeCode.tsx).
const PAGE = "#F5F4EF";
const SURFACE = "#FFFFFF";
const HAIRLINE = "#E8E5DD";
const BTN_LINE = "#E0DDD4";
const FG = "#1F1E1D";
const FG_MUTED = "#73726C";
const FG_PLACEHOLDER = "#A3A097";
const SEND_BG = "#D97757";

const COMPOSER_W = 860;
const COMPOSER_RADIUS = 24;
const COMPOSER_SHADOW = "0 8px 30px -12px rgba(31,30,29,0.12)";
const PROMPT_PAD_Y = 26;
const PROMPT_PAD_X = 28;
const PROMPT_MIN_H = 58;
const PROMPT_FS = 21;
const CTRL_PAD_Y = 14;
const CTRL_PAD_X = 18;
const CTRL_FS = 18;
const CIRCLE = 36;
const SEND = 40;
const CARET_W = 2;
const CARET_H = 24;
const COMPOSER_H = 2 + (PROMPT_PAD_Y * 2 + PROMPT_MIN_H) + (CTRL_PAD_Y * 2 + SEND); // 180

// the reel's own voice, sized in the same stage space so that at scale
// STAGE_W -> w the label is exactly 0.050*w and a badge exactly 0.075*w.
const SIDE = 46;
const STAGE_W = COMPOSER_W + 2 * SIDE; // 952
const SLOT_H = 152;
const LABEL_FS = Math.round(0.05 * STAGE_W); // 48
const BADGE = Math.round(0.075 * STAGE_W); // 71
const FIXED = LABEL_FS + SLOT_H + COMPOSER_H;
const MIN_GAP = 24;
const Z_IN = 1.95; // the push, on the slot and again on the composer
const LABEL_OVER = Math.round(LABEL_FS * 0.14); // ascender allowance above the line box
const MARGIN = Math.round(0.032 * STAGE_W); // the air the pulled-back shot keeps

const PLACEHOLDER = "How can I help you today?";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Shot = { z: number; cx: number; cy: number };
const mix = (a: Shot, b: Shot, t: number): Shot => ({
  z: a.z + (b.z - a.z) * t, cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t,
});

// the +, chevron, mic and send arrow, drawn here rather than pulled from a set
const Plus: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M8 3.4V12.6M3.4 8H12.6" stroke={FG} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);
const Chevron: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M4 6.5L8 10.5L12 6.5" stroke={FG_MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Mic: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <rect x={5.9} y={1.7} width={4.2} height={7.4} rx={2.1} stroke={FG} strokeWidth={1.4} />
    <path d="M3.6 7.6v0.5a4.4 4.4 0 0 0 8.8 0V7.6" stroke={FG} strokeWidth={1.4} strokeLinecap="round" />
    <path d="M8 12.5V14.4" stroke={FG} strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);
const ArrowUp: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <path d="M9 14.2V4.2" stroke="#FFFFFF" strokeWidth={1.9} strokeLinecap="round" />
    <path d="M4.4 8.6L9 4L13.6 8.6" stroke="#FFFFFF" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const circleBtn: React.CSSProperties = {
  width: CIRCLE, height: CIRCLE, borderRadius: "50%", border: `1px solid ${BTN_LINE}`,
  boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
  backgroundColor: SURFACE,
};

export const Before: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  slotLabel: string; outcome: string; prompt: string;
  model: string; tier: string;
  beats: { slot: number; drop: number; order: number; type: number };
}> = ({ tMs, w, h, fps, fromMs, slotLabel, outcome, prompt, model, tier, beats }) => {
  const scale = Math.min(w / STAGE_W, h / (FIXED + 2 * MIN_GAP));
  const H = h / scale;
  const offX = (w - STAGE_W * scale) / 2;
  const vw = STAGE_W / Z_IN; // what the pushed camera can see, in stage px
  const vh = H / Z_IN;

  // The page is laid out FROM the camera: the air above and below the slot is
  // half the pushed window plus a margin, so the pushed frame's top and bottom
  // edges always land on empty page and never cut an element in half.
  const gap = Math.max(MIN_GAP, Math.min((vh - SLOT_H) / 2 + 14, (H - FIXED) / 2));
  const top = Math.max(0, (H - (FIXED + 2 * gap)) * 0.52);
  const slotTop = top + LABEL_FS + gap;
  const composerTop = slotTop + SLOT_H + gap;
  // both pushes hold the same left column, so the camera walks straight down;
  // the window opens 16 px left of the page so badge 2 is never against the edge
  const colX = SIDE + PROMPT_PAD_X;
  const colW = vw - colX - 20;
  const pushX = vw / 2 - 16;

  // The pulled-back shot is framed on the REAL bounds of everything drawn - the
  // label's ascender and the badges hanging off the left edge included - with
  // MARGIN of air kept on every side. If that does not fit at z = 1 for this
  // card's aspect it pulls back past 1 rather than cropping the label.
  const bx0 = SIDE - BADGE / 2, bx1 = SIDE + COMPOSER_W;
  const by0 = top - LABEL_OVER, by1 = composerTop + COMPOSER_H;
  const zOut = Math.min(1, H / (by1 - by0 + 2 * MARGIN), STAGE_W / (bx1 - bx0 + 2 * MARGIN));

  const wide: Shot = { z: zOut, cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2 };
  const onSlot: Shot = { z: Z_IN, cx: pushX, cy: slotTop + SLOT_H / 2 };
  const onComposer: Shot = { z: Z_IN, cx: pushX, cy: composerTop + COMPOSER_H / 2 };

  // 1 hold wide, 2 in on the slot, 3 back out for the two badges, 4 down on the
  // composer. Eased, never cut; the hold is guaranteed at least 500 ms.
  const held = Math.max(beats.drop, beats.slot + 500);
  let cam = mix(wide, onSlot, easeIO(p01((tMs - held) / 760)));
  cam = mix(cam, wide, easeIO(p01((tMs - beats.order) / 680)));
  cam = mix(cam, onComposer, easeIO(p01((tMs - beats.type) / 760)));

  // Nothing is ever drawn half-cut: an element only carries opacity once its
  // whole box is inside the camera's window with a little clearance. During the
  // pull-back the top edge sweeps across the label, so this is what stops the
  // "D" being sliced; at rest the clearance is MARGIN, so everything is solid.
  const halfW = STAGE_W / (2 * cam.z);
  const halfH = H / (2 * cam.z);
  const winL = cam.cx - halfW, winT = cam.cy - halfH;
  const winR = cam.cx + halfW, winB = cam.cy + halfH;
  const gate = (x0: number, y0: number, x1: number, y1: number) =>
    p01((Math.min(x0 - winL, y0 - winT, winR - x1, winB - y1) - 3) / 22);

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const slotS = sp(beats.slot);
  const dropS = sp(beats.drop);
  const solid = interpolate(tMs, [beats.drop, beats.drop + 260], [0, 1], clamp);
  const b1 = sp(beats.order + 520); // the badges land once the pull-back has settled
  const b2 = sp(beats.order + 640);
  const enter = interpolate(tMs, [fromMs, fromMs + 220], [0, 1], clamp);
  const wake = interpolate(tMs, [beats.type, beats.type + 260], [0.55, 1], clamp);

  const typing = tMs >= beats.type;
  const chars = typing ? Math.floor(((tMs - beats.type) / 1000) * 22) : 0;
  const shown = prompt.slice(0, Math.min(prompt.length, chars));
  const done = typing && chars >= prompt.length;
  const caretOn = typing && (!done || Math.floor(tMs / 500) % 2 === 0);

  const badge = (n: string, boxTop: number, s: number) => (
    <div
      style={{
        position: "absolute",
        left: SIDE - BADGE / 2, top: boxTop - BADGE / 2, width: BADGE, height: BADGE,
        backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${0.5 + 0.5 * s})`,
        opacity: Math.min(1, s * 2) * gate(SIDE - BADGE / 2, boxTop - BADGE / 2, SIDE + BADGE / 2, boxTop + BADGE / 2),
      }}
    >
      <span style={{ fontFamily: LABEL_FONT, fontSize: BADGE * 0.62, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
        {n}
      </span>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: PAGE }}>
      <div
        style={{
          position: "absolute", left: offX, top: 0, width: STAGE_W, height: H,
          transform: `scale(${scale})`, transformOrigin: "top left", fontFamily: SANS,
        }}
      >
        <div
          style={{
            position: "absolute", left: 0, top: 0, width: STAGE_W, height: H,
            transform: `translate(${STAGE_W / 2 - cam.cx * cam.z}px, ${H / 2 - cam.cy * cam.z}px) scale(${cam.z})`,
            transformOrigin: "0 0",
          }}
        >
          {/* the reel's label for the slot, not Anthropic's UI */}
          <div
            style={{
              position: "absolute", left: SIDE, top, ...label(LABEL_FS, ACCENT),
              lineHeight: 1, whiteSpace: "nowrap",
              opacity: Math.min(1, slotS * 2) * gate(SIDE, top - LABEL_OVER, SIDE, top + LABEL_FS),
            }}
          >
            {slotLabel}
          </div>

          {/* the slot you fill BEFORE you touch the box below */}
          <div
            style={{
              position: "absolute", left: SIDE, top: slotTop, width: COMPOSER_W, height: SLOT_H,
              opacity: Math.min(1, slotS * 2), transform: `scale(${0.96 + 0.04 * slotS})`,
              transformOrigin: "50% 0%",
            }}
          >
            <div style={{ position: "absolute", inset: 0, border: "2px dashed #C9C4B8", boxSizing: "border-box", opacity: 1 - solid }} />
            <div style={{ position: "absolute", inset: 0, border: `2px solid ${FG}`, boxSizing: "border-box", opacity: solid }} />
            <div
              style={{
                position: "absolute", inset: 0, overflow: "hidden", boxSizing: "border-box",
                display: "flex", alignItems: "center", paddingLeft: PROMPT_PAD_X - 1,
              }}
            >
              <div
                style={{
                  maxWidth: colW, fontSize: PROMPT_FS, fontWeight: 500, lineHeight: 1.35, color: FG,
                  opacity: Math.min(1, dropS * 3),
                  transform: `translateY(${(1 - dropS) * -(SLOT_H * 0.85)}px)`,
                }}
              >
                {outcome}
              </div>
            </div>
          </div>

          {/* remocn claude-chat, unchanged */}
          <div
            style={{
              position: "absolute", left: SIDE, top: composerTop, width: COMPOSER_W,
              height: COMPOSER_H, boxSizing: "border-box", backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`, borderRadius: COMPOSER_RADIUS,
              boxShadow: COMPOSER_SHADOW, opacity: enter * wake,
            }}
          >
            <div style={{ padding: `${PROMPT_PAD_Y}px ${PROMPT_PAD_X}px`, boxSizing: "content-box" }}>
              <div
                style={{
                  minHeight: PROMPT_MIN_H, maxWidth: colW, fontSize: PROMPT_FS, lineHeight: 1.3,
                  color: typing ? FG : FG_PLACEHOLDER,
                }}
              >
                <span style={{ whiteSpace: "pre-wrap" }}>{typing ? shown : PLACEHOLDER}</span>
                <span
                  style={{
                    display: "inline-block", width: CARET_W, height: CARET_H, marginLeft: 2,
                    verticalAlign: "-0.18em", backgroundColor: FG, opacity: caretOn ? 1 : 0,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: `${CTRL_PAD_Y}px ${CTRL_PAD_X}px`, boxSizing: "content-box", height: SEND,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={circleBtn}>
                <Plus />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: CTRL_FS, fontWeight: 500, color: FG, whiteSpace: "nowrap" }}>{model}</span>
                <span style={{ fontSize: CTRL_FS, fontWeight: 400, color: FG_MUTED, whiteSpace: "nowrap" }}>{tier}</span>
                <Chevron />
                <div style={{ ...circleBtn, marginLeft: 6 }}>
                  <Mic />
                </div>
                <div
                  style={{
                    width: SEND, height: SEND, borderRadius: 10, backgroundColor: SEND_BG,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ArrowUp />
                </div>
              </div>
            </div>
          </div>

          {badge("1", slotTop, b1)}
          {badge("2", composerTop, b2)}
        </div>
      </div>
    </div>
  );
};
