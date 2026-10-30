import React from "react";
import { INK, MUTED, ACCENT, MONO_FONT } from "../theme";

// reference edit J family B: THE FOLDER, the story's recurring character.
// One blue macOS folder drawn from the `Folder` SVG in cards/Skills.tsx, split into a back
// plate and a front flap so things can fold IN BETWEEN them, and so the flap can tip forward
// on a real hinge when the folder opens. Every state it wears (the name on its tab, the green
// shield, the key tag) is a drawn object placed on it by the card, never a new folder.

export const GREEN = "#5FBF86"; // the ONLY green: a ✓ / trusted state the plan names
export const PANEL = "#0D1117"; // a file's own surface (GitHub's grammar)
export const RULE = "#30363D";

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBack = (t: number): number => {
  const x = clamp01(t);
  const c1 = 1.55, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
// one soft swell: 0 at both ends, so nothing ever snaps back
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
export const at = (tMs: number, ms: number, dur: number): number => clamp01((tMs - ms) / dur);

export const mono = (px: number, color: string = INK): React.CSSProperties => ({
  fontFamily: MONO_FONT, fontSize: px, color, lineHeight: 1, whiteSpace: "nowrap",
});

// the folder's proportions, straight from the Skills.tsx viewBox (200 x 152)
export const FOLDER_R = 0.76;        // height / width
const FLAP_Y = 54;                   // viewBox y where the front flap starts
export const FLAP_TOP = FLAP_Y / 152;

/** back plate, the tab, and the sheets inside (they lift as the folder opens) */
export const BFolderBack: React.FC<{ w: number; open: number; uid: string }> = ({ w, open, uid }) => {
  const h = w * FOLDER_R;
  return (
    <svg width={w} height={h} viewBox="0 0 200 152" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`fbk${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#63A9F2" /><stop offset="1" stopColor="#3277CB" />
        </linearGradient>
      </defs>
      <path
        d="M4,30 a12,12 0 0 1 12,-12 h58 a8,8 0 0 1 5.6,2.3 l9,9 a8,8 0 0 0 5.6,2.3 h89.8 a12,12 0 0 1 12,12 v96 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
        fill={`url(#fbk${uid})`}
      />
      {/* the sheets: they ride up out of the folder as it opens */}
      <rect x={30} y={36 - 9 * open} width={140} height={86} rx={5} fill="#E9EEF6" opacity={0.95} />
      <rect x={38} y={44 - 15 * open} width={124} height={78} rx={4} fill="#FAFCFF" />
    </svg>
  );
};

/** the front flap, on a real hinge: it tips toward the viewer as `open` goes 0 -> 1 */
export const BFolderFlap: React.FC<{ w: number; open: number; uid: string; shield?: number; angle?: number }> = ({
  w, open, uid, shield = 0, angle = 58,
}) => {
  const h = w * FOLDER_R;
  const flapH = (152 - FLAP_Y) / 152 * h;
  const sp = easeBack(shield);
  return (
    <div
      style={{
        position: "absolute", left: 0, top: FLAP_TOP * h, width: w, height: flapH,
        perspective: 620, perspectiveOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          width: w, height: flapH, transformOrigin: "50% 100%",
          transform: `rotateX(${-angle * easeIO(open)}deg)`,
        }}
      >
        <svg width={w} height={flapH} viewBox={`0 ${FLAP_Y} 200 ${152 - FLAP_Y}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id={`ffr${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#96CDFC" /><stop offset="1" stopColor="#4A93E6" />
            </linearGradient>
          </defs>
          <path
            d="M4,62 a7,7 0 0 1 7,-7 h178 a7,7 0 0 1 7,7 v78 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
            fill={`url(#ffr${uid})`}
          />
          <path d="M11,55.6 h178 a7,7 0 0 1 6.9,6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
          {shield > 0 && (
            <g transform={`translate(100 104) scale(${sp}) translate(-100 -104)`} opacity={clamp01(shield * 2)}>
              <path
                d="M100,78 L124,87 L124,104 C124,117 113,126 100,131 C87,126 76,117 76,104 L76,87 Z"
                fill={GREEN} stroke="#2E7B53" strokeWidth={1.4}
              />
              <path d="M89,103 L97,111 L112,94" fill="none" stroke="#0B2318" strokeWidth={6}
                strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

/** the whole folder when nothing has to slip in between the plates */
export const BFolder: React.FC<{ w: number; open: number; uid: string; shield?: number; angle?: number }> = (p) => (
  <div style={{ position: "relative", width: p.w, height: p.w * FOLDER_R }}>
    <BFolderBack w={p.w} open={p.open} uid={p.uid} />
    <BFolderFlap w={p.w} open={p.open} uid={p.uid} shield={p.shield} angle={p.angle} />
  </div>
);

/** a key, the thing a permission actually is */
export const BKey: React.FC<{ size: number; color?: string }> = ({ size, color = INK }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>key</title>
    <circle cx={7.6} cy={8.4} r={4.1} fill="none" stroke={color} strokeWidth={2.1} />
    <circle cx={7.6} cy={8.4} r={1.25} fill={color} />
    <path d="M10.4 11.2 L19.6 20.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    <path d="M16.2 17.0 L18.4 14.8" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    <path d="M18.6 19.4 L20.6 17.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
  </svg>
);

/** a check, only ever green */
export const BCheck: React.FC<{ size: number; color?: string }> = ({ size, color = GREEN }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>ok</title>
    <path d="M4.2 12.8 L9.6 18.2 L19.8 6.4" fill="none" stroke={color} strokeWidth={3.2}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** a file page, with the folded corner a real file icon has */
export const BPage: React.FC<{ w: number; ghost?: boolean }> = ({ w, ghost = false }) => {
  const h = w * 1.26;
  return (
    <svg width={w} height={h} viewBox="0 0 40 50" style={{ display: "block" }}>
      <title>file</title>
      <path
        d="M4,3 h22 l11,11 v33 a2,2 0 0 1 -2,2 h-31 a2,2 0 0 1 -2,-2 v-42 a2,2 0 0 1 2,-2 z"
        fill={ghost ? "none" : "#E9EEF6"}
        stroke={ghost ? MUTED : "#B9C2CE"}
        strokeWidth={ghost ? 2 : 1.4}
        strokeDasharray={ghost ? "4 3" : undefined}
      />
      <path d="M26,3 v11 h11" fill="none" stroke={ghost ? MUTED : "#B9C2CE"} strokeWidth={ghost ? 2 : 1.4}
        strokeDasharray={ghost ? "4 3" : undefined} />
      {!ghost && [22, 29, 36].map((y) => (
        <rect key={y} x={10} y={y} width={20} height={2.4} rx={1.2} fill="#9AA6B4" />
      ))}
    </svg>
  );
};

/** the tiny book GitHub puts before a repo name */
export const BRepoGlyph: React.FC<{ size: number; color?: string }> = ({ size, color = MUTED }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: "block" }}>
    <title>repo</title>
    <path
      d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"
      fill={color}
    />
  </svg>
);

export { INK, MUTED, ACCENT, MONO_FONT };
