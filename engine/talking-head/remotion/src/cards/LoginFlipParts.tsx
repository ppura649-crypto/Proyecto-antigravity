import React from "react";
import { Img, staticFile } from "remotion";

// The two real sign-in pages, drawn at their own scale. Every string is the copy
// the live pages carry (claude.ai/login and the OpenAI log-in, read 2026-09-13);
// the colours are theirs. Nothing here is invented: what does not fit the card is
// left out (Apple, SSO, the sign-up line), never replaced with something else.

export const CREAM = "#F5F4EF";
export const WHITE = "#FFFFFF";
export const INK = "#1F1E1D";
export const MUTED = "#73726C";
export const PLACE = "#A3A097";
export const LINE = "#DCD8CE";
export const TERRA = "#D97757";
export const GPT_INK = "#0D0D0D";
export const GPT_LINE = "#D5D5DE";
export const GPT_PLACE = "#8E8EA0";
export const GREEN = "#1FA463";

export const SANS = "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', serif";

// Google's own four-colour G, its published geometry
export const GoogleG: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: "none", display: "block" }}>
    <title>Google</title>
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

export const Check: React.FC<{ size: number; s: number }> = ({ size, s }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", backgroundColor: GREEN,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 3),
      boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
      <title>done</title>
      <path d="M5 12.5L10 17.5L19 7" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const row = (height: number): React.CSSProperties => ({
  height, display: "flex", alignItems: "center", justifyContent: "center",
  boxSizing: "border-box", borderRadius: 10,
});

// the macOS pointer, so the page is used rather than filled in by nobody
export const Pointer: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 1.44} viewBox="0 0 25 36" style={{ display: "block", overflow: "visible" }}>
    <title>pointer</title>
    <path
      d="M2 1.5 L2 28 L8.6 21.8 L12.7 32.6 L17.2 30.8 L13.2 20.4 L21.8 20.1 Z"
      fill="#000000" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round"
    />
  </svg>
);

export type PageProps = {
  width: number; top: number; height: number;
  mark: string; point: number; press: boolean;
  pulse: number; check: number;
};

// claude.ai/login
export const ClaudePage: React.FC<PageProps> = ({ width, top, height, mark, point, press, pulse, check }) => {
  const COL = Math.round(width * 0.59); // 560 on a 950 card: narrow enough that 26 px reads
  const left = (width - COL) / 2;
  const MARK = 58, HEAD = 34, BTN = 62, FS = 26;
  const blocks = [MARK, 18, HEAD * 2.42, 28, BTN, 18, 28, 18, BTN, 14, BTN];
  const total = blocks.reduce((a, b) => a + b, 0);
  let y = top + (height - total) / 2;
  const at = (i: number) => {
    const v = y;
    y += blocks[i];
    return v;
  };
  const yMark = at(0); at(1);
  const yHead = at(2); at(3);
  const yGoogle = at(4); at(5);
  const yOr = at(6); at(7);
  const yField = at(8); at(9);
  const yBtn = at(10);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CREAM }}>
      <Img
        src={staticFile(mark)}
        style={{
          position: "absolute", left: left + COL / 2 - MARK / 2, top: yMark, width: MARK, height: MARK,
          transform: `scale(${1 + 0.20 * pulse})`, mixBlendMode: "multiply", display: "block",
        }}
      />
      <div
        style={{
          position: "absolute", left, top: yHead, width: COL, textAlign: "center",
          fontFamily: SERIF, fontSize: HEAD, lineHeight: 1.21, color: INK, letterSpacing: "-0.005em",
        }}
      >
        Your thinking partner for big ambitions
      </div>

      <div
        style={{
          position: "absolute", left, top: yGoogle, width: COL, ...row(BTN),
          backgroundColor: press ? "#E9E5DA" : WHITE, border: `1.5px solid ${press ? "#CBC6B9" : LINE}`, gap: 14,
          transform: press ? "scale(0.988)" : "none",
        }}
      >
        <GoogleG size={28} />
        <span style={{ fontFamily: SANS, fontSize: FS, fontWeight: 500, color: INK }}>Continue with Google</span>
      </div>

      <div style={{ position: "absolute", left, top: yOr, width: COL, height: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: LINE }} />
        <span style={{ fontFamily: SANS, fontSize: 22, color: MUTED }}>OR</span>
        <div style={{ flex: 1, height: 1, backgroundColor: LINE }} />
      </div>

      <div
        style={{
          position: "absolute", left, top: yField, width: COL, height: BTN, boxSizing: "border-box",
          backgroundColor: WHITE, border: `1.5px solid ${LINE}`, borderRadius: 10,
          display: "flex", alignItems: "center", paddingLeft: 20,
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 25, color: PLACE, whiteSpace: "pre" }}>
          Enter personal or work email
        </span>
      </div>

      <div style={{ position: "absolute", left, top: yBtn, width: COL, ...row(BTN), backgroundColor: TERRA }}>
        <span style={{ fontFamily: SANS, fontSize: FS, fontWeight: 600, color: WHITE }}>Continue with email</span>
      </div>

      {/* the pointer goes to the button the creator would actually press */}
      {point > 0 && (
        <div
          style={{
            position: "absolute",
            left: left + COL * 0.63 + (1 - point) * 96,
            top: yGoogle + BTN * 0.58 + (1 - point) * 122,
            opacity: Math.min(1, point * 4),
          }}
        >
          <Pointer w={30} />
        </div>
      )}
      {check > 0 && (
        <div style={{ position: "absolute", left: left + COL - 34, top: yGoogle + BTN / 2 - 29 }}>
          <Check size={58} s={check} />
        </div>
      )}
    </div>
  );
};

// the OpenAI log-in chatgpt.com hands you
export const ChatGptPage: React.FC<PageProps> = ({ width, top, height, mark, check }) => {
  const COL = Math.round(width * 0.59);
  const left = (width - COL) / 2;
  const MARK = 54, BTN = 62, FS = 26;
  const blocks = [MARK, 22, 46, 30, BTN, 14, BTN, 20, 28, 20, BTN];
  const total = blocks.reduce((a, b) => a + b, 0);
  let y = top + (height - total) / 2;
  const at = (i: number) => {
    const v = y;
    y += blocks[i];
    return v;
  };
  const yMark = at(0); at(1);
  const yHead = at(2); at(3);
  const yField = at(4); at(5);
  const yBtn = at(6); at(7);
  const yOr = at(8); at(9);
  const yGoogle = at(10);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: WHITE }}>
      <Img
        src={staticFile(mark)}
        style={{ position: "absolute", left: left + COL / 2 - MARK / 2, top: yMark, width: MARK, height: MARK, display: "block" }}
      />
      <div
        style={{
          position: "absolute", left, top: yHead, width: COL, textAlign: "center",
          fontFamily: SANS, fontSize: 38, fontWeight: 600, color: GPT_INK, lineHeight: 1.2,
        }}
      >
        Welcome back
      </div>

      <div
        style={{
          position: "absolute", left, top: yField, width: COL, height: BTN, boxSizing: "border-box",
          backgroundColor: WHITE, border: `1.5px solid ${GPT_LINE}`, borderRadius: 10,
          display: "flex", alignItems: "center", paddingLeft: 20,
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 25, color: GPT_PLACE }}>Email address</span>
      </div>

      <div style={{ position: "absolute", left, top: yBtn, width: COL, ...row(BTN), backgroundColor: GPT_INK }}>
        <span style={{ fontFamily: SANS, fontSize: FS, fontWeight: 600, color: WHITE }}>Continue</span>
      </div>

      <div style={{ position: "absolute", left, top: yOr, width: COL, height: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: GPT_LINE }} />
        <span style={{ fontFamily: SANS, fontSize: 22, color: GPT_PLACE }}>OR</span>
        <div style={{ flex: 1, height: 1, backgroundColor: GPT_LINE }} />
      </div>

      <div
        style={{
          position: "absolute", left, top: yGoogle, width: COL, ...row(BTN),
          backgroundColor: WHITE, border: `1.5px solid ${GPT_LINE}`, gap: 14,
        }}
      >
        <GoogleG size={28} />
        <span style={{ fontFamily: SANS, fontSize: FS, fontWeight: 500, color: GPT_INK }}>Continue with Google</span>
      </div>
      {check > 0 && (
        <div style={{ position: "absolute", left: left + COL - 34, top: yGoogle + BTN / 2 - 29 }}>
          <Check size={58} s={check} />
        </div>
      )}
    </div>
  );
};
