import React from "react";
import { Img, interpolate, interpolateColors, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";

// V3: "First, you need an ACCOUNT with an AI MODEL of your choice, CLAUDE or
// CHATGPT will do." One object, five states: a real sign-in card with an EMPTY
// round mark slot in its header (which model? a dashed ring and a "?"), it
// wobbles while the creator says "of your choice", the real Claude mark drops into the
// slot and the whole card takes Claude's cream palette, then on "or" it FLIPS on
// its vertical axis and the back is the same sign-in in ChatGPT's black, and the
// button goes green on "will do." The flip is the sentence: either door works.
export type SignInData = { step?: string; signed?: string };

const DW = 950;
const DH = 576;
const SANS = "Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// the panel, in the 950 x 576 design space
const PW = 740, PH = 512, PX = (DW - PW) / 2, PY = (DH - PH) / 2;
const PAD = 46, CW = PW - 2 * PAD;
const SLOT = 96, SLOT_TOP = 30;
const HEAD_TOP = 146, HEAD_FS = 38;
const F1 = 216, FH = 74, F2 = 306, BTN = 406, BTN_H = 78;
const FS = 34, BTN_FS = 36;

const EMAIL = "you@business.com";
const GREEN = "#2E9E4F";

type Theme = {
  panel: string; border: string; radius: number; head: string;
  fieldBg: string; fieldBorder: string; ink: string; ph: string;
  btnBg: string; btnInk: string; btnRadius: number; shadow: string;
};

const check = (size: number, color: string, draw: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
    <path
      d="M4.5 12.6 L9.8 17.8 L19.6 6.6" stroke={color} strokeWidth={3.2}
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={23} strokeDashoffset={23 * (1 - draw)}
    />
  </svg>
);

export const SignIn: React.FC<CardProps & { data: SignInData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const S = Math.min(w / DW, h / DH);
  const oX = (w - DW * S) / 2, oY = (h - DH * S) / 2;
  const b = (k: string, d: number) => beats[k] ?? d;
  const bAccount = b("account", fromMs + 1400);
  const bModel = b("model", bAccount + 510);
  const bChoice = b("choice", bModel + 810);
  const bClaude = b("claude", bChoice + 570);
  const bOr = b("or", bClaude + 290);
  const bDone = b("willdo", bOr + 840);

  const sp = (ms: number, damp = 13) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: damp, stiffness: 320, mass: 0.7 } });

  // 1. the numeral lands in its corner on "First,"
  const nIn = sp(fromMs, 11);

  // 2. the card is THERE from the first frame, as a dimmed skeleton (no text,
  // faint lines where the fields will be), and it WAKES on "account": the
  // opacity comes up over 200 ms and the email types itself into it
  const wake = interpolate(tMs, [bAccount, bAccount + 200], [0, 1], clamp);
  const skel = Math.max(0, 1 - wake * 2.5);      // the lines are gone before
  const woke = p01((wake - 0.35) / 0.65);        // any word fades in over them
  const chars = Math.floor(p01((tMs - (bAccount + 120)) / 1000) * 30);
  const typed = EMAIL.slice(0, Math.min(EMAIL.length, chars));
  const typing = tMs >= bAccount + 120 && chars < EMAIL.length;
  const dots = Math.min(9, Math.max(0, Math.floor((tMs - (bAccount + 780)) / 45)));

  // 3. the slot asks the question, 4. the card wobbles, undecided
  const ask = interpolate(tMs, [bModel, bModel + 300], [0, 1], clamp);
  const askOut = interpolate(tMs, [bClaude - 60, bClaude + 100], [1, 0], clamp);
  const wobT = p01((tMs - bChoice) / 700);
  const wob = tMs < bChoice ? 0 : 3.1 * (1 - wobT) * Math.sin((2 * Math.PI * (tMs - bChoice)) / 235);

  // 5. Claude snaps in and the palette goes cream, 6. the card flips on "or"
  const mark = sp(bClaude, 11);
  const cream = interpolate(tMs, [bClaude, bClaude + 110], [0, 1], clamp);
  const flipP = easeIO(p01((tMs - bOr) / 260));
  const flip = 180 * flipP;
  const back = flipP > 0.5;

  // 7. the button goes green with a drawn check on "will do."
  const green = interpolate(tMs, [bDone, bDone + 80], [0, 1], clamp);
  const drawn = interpolate(tMs, [bDone + 40, bDone + 240], [0, 1], clamp);
  const gPop = 1 + 0.06 * Math.sin(Math.PI * p01((tMs - bDone) / 260));

  const page = back
    ? interpolateColors(p01((tMs - bOr) / 260), [0, 1], ["#F5F4EF", "#FFFFFF"])
    : interpolateColors(cream, [0, 1], ["#E9EAEC", "#F5F4EF"]);

  const front: Theme = {
    panel: "#FFFFFF", border: interpolateColors(cream, [0, 1], ["#E4E3DE", "#E8E5DD"]),
    radius: interpolate(cream, [0, 1], [10, 18]), head: "#1F1E1D",
    fieldBg: "#FFFFFF", fieldBorder: interpolateColors(cream, [0, 1], ["#DEDDD8", "#E0DCD2"]),
    ink: "#1F1E1D", ph: "#A3A097",
    btnBg: interpolateColors(cream, [0, 1], ["#1F1E1D", "#D97757"]), btnInk: "#FFFFFF",
    btnRadius: interpolate(cream, [0, 1], [6, 14]),
    shadow: "0 18px 44px rgba(31,30,29,0.14), 0 2px 6px rgba(31,30,29,0.07)",
  };
  const rear: Theme = {
    panel: "#171717", border: "#2E2E2E", radius: 18, head: "#FFFFFF",
    fieldBg: "#FFFFFF", fieldBorder: "#FFFFFF", ink: "#1F1E1D", ph: "#8E8D88",
    btnBg: "#FFFFFF", btnInk: "#0D0D0D", btnRadius: 999,
    shadow: "0 18px 44px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18)",
  };

  // a faint line stands in for every word until the card wakes
  const bar = (wpx: number) => (
    <div style={{
      position: "absolute", left: 22, top: FH / 2 - 7, width: wpx, height: 14,
      borderRadius: 7, backgroundColor: "#E8E5DD", opacity: skel,
    }} />
  );

  const field = (th: Theme, top: number, node: React.ReactNode, barW: number) => (
    <div style={{
      position: "absolute", left: PAD, top, width: CW, height: FH, boxSizing: "border-box",
      backgroundColor: th.fieldBg, border: `1.5px solid ${th.fieldBorder}`, borderRadius: 8,
      display: "flex", alignItems: "center", paddingLeft: 22, overflow: "hidden",
    }}>
      {bar(barW)}
      <div style={{ opacity: woke, display: "flex", alignItems: "center" }}>{node}</div>
    </div>
  );

  const face = (th: Theme, slot: React.ReactNode, mail: string, caret: boolean, nDots: number) => (
    <div style={{
      position: "absolute", inset: 0, backgroundColor: th.panel, borderRadius: th.radius,
      border: `1px solid ${th.border}`, boxSizing: "border-box", boxShadow: th.shadow,
      fontFamily: SANS, overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: (PW - SLOT) / 2, top: SLOT_TOP, width: SLOT, height: SLOT }}>
        {slot}
      </div>
      <div style={{
        position: "absolute", left: 0, top: HEAD_TOP, width: PW, textAlign: "center",
        fontSize: HEAD_FS, fontWeight: 600, letterSpacing: "0.01em", lineHeight: 1.2, color: th.head,
        opacity: woke,
      }}>
        Sign in
      </div>
      <div style={{
        position: "absolute", left: (PW - 190) / 2, top: HEAD_TOP + 12, width: 190, height: 16,
        borderRadius: 8, backgroundColor: "#E8E5DD", opacity: skel,
      }} />
      {field(th, F1,
        <span style={{ fontSize: FS, color: mail ? th.ink : th.ph, whiteSpace: "nowrap" }}>
          {mail || "Email"}
          {caret && <span style={{
            display: "inline-block", width: 2.5, height: FS * 0.95, marginLeft: 3,
            verticalAlign: "-0.16em", backgroundColor: th.ink,
          }} />}
        </span>,
        286
      )}
      {field(th, F2, nDots > 0
        ? <div style={{ display: "flex", gap: 9 }}>
            {Array.from({ length: nDots }, (_, i) => (
              <span key={i} style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: th.ink }} />
            ))}
          </div>
        : <span style={{ fontSize: FS, color: th.ph }}>Password</span>,
        212
      )}
      <div style={{
        position: "absolute", left: PAD, top: BTN, width: CW, height: BTN_H,
        backgroundColor: interpolateColors(green, [0, 1], [interpolateColors(wake, [0, 1], ["#EDEBE4", th.btnBg]), GREEN]),
        borderRadius: interpolate(green, [0, 1], [th.btnRadius, 999]),
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${gPop})`,
      }}>
        <span style={{
          width: 56 * Math.min(1, green * 2.4), overflow: "hidden", display: "flex",
          justifyContent: "flex-start", flex: "0 0 auto",
        }}>
          {check(42, "#FFFFFF", drawn)}
        </span>
        <span style={{
          fontSize: BTN_FS, fontWeight: 600, letterSpacing: "0.015em", opacity: woke,
          color: green > 0.35 ? "#FFFFFF" : th.btnInk,
        }}>
          {green > 0.35 ? (data.signed ?? "SIGNED IN") : "Continue"}
        </span>
      </div>
    </div>
  );

  const ring = (
    <svg width={SLOT} height={SLOT} viewBox="0 0 96 96" style={{ position: "absolute", inset: 0 }}>
      <circle cx={48} cy={48} r={46} fill="none" stroke="#D5D2C9" strokeWidth={2} opacity={(1 - ask) * askOut} />
      <circle
        cx={48} cy={48} r={46} fill="none" stroke="#ADAAA1" strokeWidth={2.8}
        strokeDasharray="10 10" strokeDashoffset={289 * (1 - ask)} opacity={ask * askOut}
      />
    </svg>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: page }}>
      <div style={{ position: "absolute", left: oX, top: oY, width: DW, height: DH, transform: `scale(${S})`, transformOrigin: "top left" }}>
        <div style={{
          position: "absolute", left: PX, top: PY, width: PW, height: PH,
          perspective: 1700, opacity: 0.4 + 0.6 * wake,
        }}>
          <div style={{
            position: "absolute", inset: 0, transformStyle: "preserve-3d",
            transform: `rotate(${wob}deg) rotateY(${flip}deg) scale(${0.988 + 0.012 * wake})`,
          }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              {face(front,
                <>
                  {ring}
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    ...label(46, "#73726C"), lineHeight: 1, opacity: ask * askOut,
                  }}>?</div>
                  {assets[0] && (
                    <Img src={staticFile(assets[0])} style={{
                      position: "absolute", left: 5, top: 5, width: SLOT - 10, height: SLOT - 10,
                      opacity: Math.min(1, mark * 2.5),
                      transform: `translateY(${(1 - mark) * -26}px) scale(${0.45 + 0.55 * mark})`,
                    }} />
                  )}
                </>,
                typed, typing, dots)}
            </div>
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)",
            }}>
              {face(rear,
                assets[1] ? (
                  <Img src={staticFile(assets[1])} style={{
                    position: "absolute", left: 7, top: 7, width: SLOT - 14, height: SLOT - 14,
                    filter: "invert(1)",
                  }} />
                ) : null,
                EMAIL, false, 9)}
            </div>
          </div>
        </div>

        {/* the step numeral lands big and flies OVER the card to its corner */}
        <div style={{
          position: "absolute", left: 28, top: 14, ...label(64, ACCENT), lineHeight: 1,
          opacity: Math.min(1, nIn * 2.5), transform: `scale(${0.6 + 0.4 * nIn})`, transformOrigin: "0 0",
        }}>
          {data.step ?? "1"}
        </div>
      </div>
    </div>
  );
};
