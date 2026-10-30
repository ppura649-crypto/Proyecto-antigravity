import React from "react";
// keyframes-v1 builder X (2026-09-25): the physical parts of the claw machine hook: the chrome three-prong claw,
// the gantry carriage, the cabinet shell (back wall, floor, chrome posts, glass) and a thick glossy print.

// ---- the claw, hub top at (0,0), drawn pointing down; `open` 0 = shut, 1 = wide
const DARK = "#2b2f35", MID = "#a9b0b8", HI = "#f4f7fa";
const Prong: React.FC<{ side: -1 | 1; deg: number }> = ({ side, deg }) => {
  const d = `M0 0 L${-13 * side} 40 Q${-15 * side} 62 ${-4 * side} 80 L${3 * side} 84`;
  return (
    <g transform={`translate(${14 * side} 46) rotate(${deg * side})`}>
      <path d={d} fill="none" stroke={DARK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={MID} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={HI} strokeWidth={2} strokeLinecap="round" transform={`translate(${-1.6 * side} -0.5)`} opacity={0.9} />
      <circle cx={-13 * side} cy={40} r={5.5} fill="url(#xcChromeR)" stroke={DARK} strokeWidth={1.4} />
      <circle cx={0} cy={0} r={5} fill="url(#xcChromeR)" stroke={DARK} strokeWidth={1.4} />
    </g>
  );
};
export const Claw: React.FC<{ open: number; front?: boolean }> = ({ open, front }) => {
  const deg = 4 + 34 * open;
  const cz = 1 - 0.42 * open;                    // the centre prong swings toward the camera: foreshortened
  return (
    <svg width={220} height={200} viewBox="-110 -12 220 200" style={{ position: "absolute", left: -110, top: -12, overflow: "visible" }}>
      <defs>
        <linearGradient id="xcChrome" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5b626b" /><stop offset="0.16" stopColor="#dfe4e9" /><stop offset="0.3" stopColor="#fbfdff" />
          <stop offset="0.46" stopColor="#8d949c" /><stop offset="0.7" stopColor="#c7ccd2" /><stop offset="0.9" stopColor="#6d747c" />
          <stop offset="1" stopColor="#3f454c" />
        </linearGradient>
        <radialGradient id="xcChromeR" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.45" stopColor="#b3bac2" /><stop offset="1" stopColor="#4a5058" />
        </radialGradient>
      </defs>
      {!front && <>
        <Prong side={-1} deg={deg} />
        <Prong side={1} deg={deg} />
      </>}
      {front && (
        <g transform={`translate(0 48) scale(1 ${cz})`}>
          <path d="M0 0 L0 40 Q-2 62 6 80 L1 86" fill="none" stroke={DARK} strokeWidth={10} strokeLinecap="round" />
          <path d="M0 0 L0 40 Q-2 62 6 80 L1 86" fill="none" stroke={MID} strokeWidth={7} strokeLinecap="round" />
          <path d="M-1.8 0 L-1.8 40 Q-3.5 60 4 78" fill="none" stroke={HI} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
          <circle cx={0} cy={40} r={5.5} fill="url(#xcChromeR)" stroke={DARK} strokeWidth={1.4} />
        </g>
      )}
      {front && <>
        {/* motor housing: a chrome can with a domed cap and a dark seam, then the prong collar */}
        <rect x={-18} y={34} width={36} height={16} rx={3} fill="#3a3f46" />
        <rect x={-18} y={34} width={36} height={16} rx={3} fill="url(#xcChrome)" opacity={0.55} />
        <rect x={-27} y={2} width={54} height={36} rx={7} fill="url(#xcChrome)" stroke={DARK} strokeWidth={1.2} />
        <rect x={-27} y={25} width={54} height={4} fill="#262a30" opacity={0.85} />
        <ellipse cx={0} cy={3} rx={27} ry={6} fill="url(#xcChromeR)" stroke={DARK} strokeWidth={1.2} />
        <rect x={-6} y={-12} width={12} height={12} rx={2} fill="url(#xcChrome)" stroke={DARK} strokeWidth={1} />
        <rect x={-21} y={7} width={5} height={26} rx={2.5} fill="#ffffff" opacity={0.55} />
      </>}
    </svg>
  );
};

// ---- the gantry: two chrome rods across the ceiling and a carriage riding them
export const Gantry: React.FC<{ x0: number; x1: number; y: number; cx: number }> = ({ x0, x1, y, cx }) => (
  <>
    {[0, 18].map((dy) => (
      <div key={dy} style={{ position: "absolute", left: x0, top: y + dy, width: x1 - x0, height: 7, borderRadius: 4,
        background: "linear-gradient(180deg, #eef2f5 0%, #aab1b9 35%, #5d646c 70%, #2b2f35 100%)",
        boxShadow: "0 3px 5px rgba(0,0,0,0.5)" }} />
    ))}
    <div style={{ position: "absolute", left: cx - 38, top: y - 8, width: 76, height: 40, borderRadius: 5,
      background: "linear-gradient(180deg, #4a4f57 0%, #25282d 60%, #16181b 100%)",
      boxShadow: "0 8px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", left: 8, top: 7, width: 60, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", left: 30, top: 30, width: 16, height: 12, borderRadius: 2,
        background: "linear-gradient(90deg, #5b626b, #e9edf1 40%, #6d747c)" }} />
    </div>
  </>
);

// ---- a thick glossy print: a white rim, the photo, a paper-core edge and a gloss band
export const Print: React.FC<{ src: string; w: number; h: number; pos?: string; lit?: number; style?: React.CSSProperties }> =
  ({ src, w, h, pos = "50% 35%", lit = 1, style }) => (
    <div style={{ position: "absolute", width: w, height: h, background: "#f3f1ec",
      boxShadow: "1px 1.5px 0 #d9d5cc, 2px 3px 0 #b8b3a8, 3px 5px 8px rgba(0,0,0,0.55), 0 10px 18px rgba(0,0,0,0.35)", ...style }}>
      <div style={{ position: "absolute", left: 4, top: 4, right: 4, bottom: 4, backgroundImage: `url(${src})`, backgroundSize: "cover",
        backgroundPosition: pos, filter: `brightness(${lit.toFixed(3)}) contrast(1.05)` }} />
      <div style={{ position: "absolute", inset: 0, background:
        "linear-gradient(118deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.34) 40%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 62%)" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.25)" }} />
    </div>
  );

// ---- the cabinet: back wall under a warm LED strip, a floor, chrome posts and header (glass drawn separately)
export const CAB = { x0: 150, x1: 930, top: 0, bottom: 600, floor: 440 };
export const CabinetBack: React.FC = () => (
  <div style={{ position: "absolute", left: CAB.x0, top: CAB.top, width: CAB.x1 - CAB.x0, height: CAB.bottom - CAB.top, overflow: "hidden",
    background: "linear-gradient(180deg, #2a2230 0%, #1b1822 38%, #121117 100%)" }}>
    {/* the LED strip light pooling down the back wall */}
    <div style={{ position: "absolute", left: "8%", right: "8%", top: -80, height: 360, borderRadius: "50%",
      background: "radial-gradient(ellipse at 50% 20%, rgba(255,214,170,0.34) 0%, rgba(255,170,120,0.12) 40%, rgba(0,0,0,0) 70%)" }} />
    {/* the floor plane */}
    <div style={{ position: "absolute", left: 0, right: 0, top: CAB.floor, bottom: 0,
      background: "linear-gradient(180deg, #2c2833 0%, #1c1a21 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }} />
    <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 90px rgba(0,0,0,0.75)" }} />
  </div>
);
export const CabinetFront: React.FC<{ sheen: number }> = ({ sheen }) => {
  const post = (x: number): React.CSSProperties => ({ position: "absolute", left: x, top: CAB.top, width: 20, height: CAB.bottom - CAB.top,
    background: "linear-gradient(90deg, #3d434a 0%, #e8ecf0 22%, #ffffff 34%, #8e959d 55%, #c6cbd1 75%, #4a5057 100%)",
    boxShadow: "0 0 10px rgba(0,0,0,0.6)" });
  return (
    <>
      {/* glass: two soft diagonal reflections and a faint edge sheen that slides as the camera settles */}
      <div style={{ position: "absolute", left: CAB.x0, top: CAB.top, width: CAB.x1 - CAB.x0, height: CAB.bottom - CAB.top, overflow: "hidden",
        pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 60 + sheen, top: -120, width: 70, height: 900, transform: "rotate(24deg)",
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.10) 50%, rgba(255,255,255,0))" }} />
        <div style={{ position: "absolute", left: 150 + sheen, top: -120, width: 24, height: 900, transform: "rotate(24deg)",
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.13) 50%, rgba(255,255,255,0))" }} />
        <div style={{ position: "absolute", left: 590 + sheen * 0.6, top: -120, width: 120, height: 900, transform: "rotate(24deg)",
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.06) 50%, rgba(255,255,255,0))" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />
      </div>
      <div style={post(CAB.x0 - 14)} />
      <div style={post(CAB.x1 - 6)} />
      <div style={{ position: "absolute", left: CAB.x0 - 14, top: CAB.top - 2, width: CAB.x1 - CAB.x0 + 28, height: 16,
        background: "linear-gradient(180deg, #ffffff 0%, #b8bec5 40%, #5a6168 100%)", boxShadow: "0 4px 8px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", left: CAB.x0 - 14, top: CAB.bottom - 14, width: CAB.x1 - CAB.x0 + 28, height: 18,
        background: "linear-gradient(180deg, #d9dee3 0%, #8c939b 45%, #3a4046 100%)", boxShadow: "0 8px 14px rgba(0,0,0,0.55)" }} />
    </>
  );
};
