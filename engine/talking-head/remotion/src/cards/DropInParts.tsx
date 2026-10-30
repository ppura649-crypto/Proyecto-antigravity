import React from "react";

// The drawn pieces of the drop: a macOS folder, the pointer, and the two
// composers' glyphs. Geometry and colours from remocn `claude-chat` (verbatim,
// as cards/Before.tsx keeps them) and from chatgpt.com.

export const PAGE = "#F5F4EF";
export const SURFACE = "#FFFFFF";
export const HAIRLINE = "#E8E5DD";
export const BTN_LINE = "#E0DDD4";
export const FG = "#1F1E1D";
export const FG_MUTED = "#73726C";
export const FG_PLACEHOLDER = "#A3A097";
export const SEND_BG = "#D97757";

export const GPT_PAGE = "#212121";
export const GPT_INPUT = "#2F2F2F";
export const GPT_CHIP = "#424242";
export const GPT_LINE = "#3D3D3D";
export const GPT_MUTED = "#9B9B9B";

export const SANS = "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

// the Finder folder: a flat two-tone blue, its tab on the back panel
export const Folder: React.FC<{ w: number }> = ({ w }) => {
  const hgt = w * 0.80;
  return (
    <svg width={w} height={hgt} viewBox="0 0 140 112" style={{ display: "block", overflow: "visible" }}>
      <title>a folder</title>
      <path d="M4 20a8 8 0 0 1 8-8h40l12 13h64a8 8 0 0 1 8 8v10H4z" fill="#3E8FE0" />
      <path d="M4 33h132v63a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8z" fill="#66AFF2" />
      <path d="M4 33h132v7H4z" fill="#7CBDF7" />
    </svg>
  );
};

// the macOS pointer
export const Pointer: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 1.44} viewBox="0 0 25 36" style={{ display: "block", overflow: "visible" }}>
    <title>pointer</title>
    <path d="M2 1.5 L2 28 L8.6 21.8 L12.7 32.6 L17.2 30.8 L13.2 20.4 L21.8 20.1 Z" fill="#000000" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

export const Plus: React.FC<{ color: string }> = ({ color }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <title>add</title>
    <path d="M8 3.4V12.6M3.4 8H12.6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

export const Chevron: React.FC<{ color: string }> = ({ color }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <title>menu</title>
    <path d="M4 6.5L8 10.5L12 6.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Mic: React.FC<{ color: string }> = ({ color }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <title>voice</title>
    <rect x={5.9} y={1.7} width={4.2} height={7.4} rx={2.1} stroke={color} strokeWidth={1.4} />
    <path d="M3.6 7.6v0.5a4.4 4.4 0 0 0 8.8 0V7.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <path d="M8 12.5V14.4" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);

export const ArrowUp: React.FC<{ color: string; size?: number }> = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <title>send</title>
    <path d="M9 14.2V4.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <path d="M4.4 8.6L9 4L13.6 8.6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// a file glyph, and a folder glyph for the one chip that is a directory
export const ChipGlyph: React.FC<{ size: number; color: string; dir: boolean }> = ({ size, color, dir }) =>
  dir ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flex: "none", display: "block" }}>
      <title>folder</title>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.4h8.8A1.5 1.5 0 0 1 21 8.9v9.6A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flex: "none", display: "block" }}>
      <title>file</title>
      <path d="M6 3h8l4.5 4.5V21H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <path d="M14 3v4.5h4.5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </svg>
  );
