import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";
import { ChatGptPage, ClaudePage, CREAM, INK, MUTED, SANS, WHITE } from "./LoginFlipParts";

// "FIRST you need an ACCOUNT with the AI MODEL OF YOUR CHOICE. CLAUDE OR CHATGPT
// will do." - one browser window, two real sign-in pages. It wakes on ACCOUNT and
// the pointer presses Continue with Google (nothing is typed: no address of their is
// known, and the one-click path is how an account is actually made). A second tab
// peeks in on MODEL, the Claude mark pulses on its own name, and on OR the whole
// window turns over on its vertical axis and lands on the OpenAI log-in for
// CHATGPT. A green check lands on that page's Continue with Google, so "will do"
// is answered on screen by the same button the creator just pressed on the other face.

export type LoginFlipData = { step: string };

const DESIGN_W = 950;
const DESIGN_H = 576;
const TAB_H = 50;
const FLIP_MS = 340;
const PRESS_MS = 68; // two frames held down, then the button comes back up

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type TabProps = { x: number; w: number; active: boolean; mark: string; name: string; y: number; opacity: number; cream: boolean };

const Tab: React.FC<TabProps> = ({ x, w, active, mark, name, y, opacity, cream }) => (
  <div
    style={{
      position: "absolute", left: x, top: 8 + y, width: w, height: TAB_H - 8,
      backgroundColor: active ? (cream ? CREAM : WHITE) : "rgba(255,255,255,0.34)",
      borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center",
      gap: 10, paddingLeft: 14, boxSizing: "border-box", opacity,
    }}
  >
    <Img
      src={staticFile(mark)}
      style={{ width: 24, height: 24, display: "block", flex: "none", mixBlendMode: "multiply", opacity: active ? 1 : 0.8 }}
    />
    <span
      style={{
        fontFamily: SANS, fontSize: 24, color: active ? INK : MUTED,
        whiteSpace: "nowrap", overflow: "hidden",
      }}
    >
      {name}
    </span>
  </div>
);

export const LoginFlip: React.FC<CardProps & { data: LoginFlipData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const k = Math.min(w / DESIGN_W, h / DESIGN_H);
  const W = DESIGN_W, H = DESIGN_H;
  const b = beats as Record<string, number>;
  const tFirst = b.first ?? fromMs;
  const tAccount = b.account ?? tFirst + 1400;
  const tModel = b.model ?? tAccount + 510;
  const tClaude = b.claude ?? tModel + 1380;
  const tOr = b.or ?? tClaude + 290;
  const tWillDo = b.willdo ?? tOr + 840;

  const sp = (ms: number, damping = 13) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping, stiffness: 320, mass: 0.7 } });

  // the page sleeps until the creator says ACCOUNT, then the pointer runs in and clicks
  const wake = interpolate(tMs, [tAccount, tAccount + 260], [0.40, 1], clamp);
  const tLand = tAccount + 170;
  const point = interpolate(tMs, [tAccount, tLand], [0, 1], { ...clamp, easing: easeIO });
  const press = tMs >= tLand && tMs < tLand + PRESS_MS;

  // the second tab peeks down into the bar
  const tabIn = sp(tModel, 15);
  // the Claude mark pulses once on its own name
  const pulseP = p01((tMs - tClaude) / 420);
  const pulse = Math.sin(Math.PI * pulseP) * (tMs >= tClaude ? 1 : 0);

  // the window turns over
  const deg = interpolate(tMs, [tOr, tOr + FLIP_MS], [0, 180], { ...clamp, easing: easeIO });
  const back = deg >= 90;
  const faceDeg = back ? deg - 180 : deg;
  const edge = Math.sin((deg * Math.PI) / 180); // 1 at edge-on, 0 flat
  const check = sp(tWillDo, 11);

  const numFs = 64;
  const page = { width: W, top: TAB_H, height: H - TAB_H, mark: "", point, press, pulse, check };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: CREAM }}>
      <div
        style={{
          position: "absolute", left: (w - W * k) / 2, top: (h - H * k) / 2, width: W, height: H,
          transform: `scale(${k})`, transformOrigin: "top left",
        }}
      >
        <div style={{ position: "absolute", inset: 0, perspective: 2400, perspectiveOrigin: "50% 50%" }}>
          {/* the window turns and draws back a little as it does, so no corner
              of it ever runs past the card and gets sliced by the frame */}
          <div
            style={{
              position: "absolute", inset: 0,
              transform: `scale(${1 - 0.14 * edge}) rotateY(${faceDeg}deg)`,
              filter: `brightness(${1 - 0.30 * edge})`,
            }}
          >
            {/* the browser's own bar, so the two tabs carry the two products */}
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: TAB_H, backgroundColor: back ? "#E7E7E7" : "#E4E0D6" }}>
              <Tab
                x={12} w={252} active={!back} cream mark={assets[0]} name="Claude"
                y={0} opacity={back ? 0.9 : 1}
              />
              <Tab
                x={272} w={252} active={back} cream={false} mark={assets[1]} name="ChatGPT"
                y={back ? 0 : (1 - tabIn) * -46} opacity={back ? 1 : Math.min(1, tabIn * 1.6)}
              />
            </div>

            <div style={{ position: "absolute", left: 0, top: TAB_H, width: W, height: H - TAB_H, overflow: "hidden" }}>
              {/* the check answers "will do" on whichever page is facing you */}
              {back ? (
                <ChatGptPage {...page} top={0} height={H - TAB_H} mark={assets[1]} />
              ) : (
                <div style={{ position: "absolute", inset: 0, opacity: wake }}>
                  <ClaudePage {...page} top={0} height={H - TAB_H} mark={assets[0]} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* the reel's own step marker, flat on the card, never turning with the window */}
        <div
          style={{
            position: "absolute", left: 26, top: TAB_H + 14,
            fontFamily: LABEL_FONT, fontSize: numFs, fontWeight: 700, lineHeight: 1,
            color: ACCENT, letterSpacing: "0.02em",
            transform: `scale(${0.6 + 0.4 * sp(tFirst, 10)})`, transformOrigin: "left top",
            opacity: Math.min(1, sp(tFirst, 10) * 3),
          }}
        >
          {data.step}
        </div>
      </div>
    </div>
  );
};
