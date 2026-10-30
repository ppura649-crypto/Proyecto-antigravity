import React from "react";
import { ACCENT } from "./theme";

// Parts for the FOOTAGE folder card (reference edit G V4). The macOS folder is the one
// Skills.tsx draws, copied here (not edited there) so its shadow can be a light-card
// shadow and its front flap can tip forward when it opens on "gather".

export const Folder: React.FC<{ w: number; open: number }> = ({ w, open }) => {
  const h = Math.round(w * 0.76);
  const k = 1 - 0.11 * open; // the front flap tips forward, hinged on its own bottom
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 152"
      style={{ display: "block", filter: "drop-shadow(0 12px 18px rgba(31,30,29,0.22))" }}
    >
      <defs>
        <linearGradient id="ftbk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#63A9F2" /><stop offset="1" stopColor="#3277CB" />
        </linearGradient>
        <linearGradient id="ftfr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#96CDFC" /><stop offset="1" stopColor="#4A93E6" />
        </linearGradient>
      </defs>
      <path
        d="M4,30 a12,12 0 0 1 12,-12 h58 a8,8 0 0 1 5.6,2.3 l9,9 a8,8 0 0 0 5.6,2.3 h89.8 a12,12 0 0 1 12,12 v96 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
        fill="url(#ftbk)"
      />
      <rect x={30} y={36 - 9 * open} width={140} height={86} rx={5} fill="#E9EEF6" opacity={0.95} />
      <rect x={38} y={44 - 15 * open} width={124} height={78} rx={4} fill="#FAFCFF" />
      <g transform={`translate(0 ${152 * (1 - k)}) scale(1 ${k})`}>
        <path
          d="M4,62 a7,7 0 0 1 7,-7 h178 a7,7 0 0 1 7,7 v78 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
          fill="url(#ftfr)"
        />
        <path d="M11,55.6 h178 a7,7 0 0 1 6.9,6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
      </g>
    </svg>
  );
};

// One film-strip clip: square corners, sprocket bands top and bottom, the picture between them.
export const Strip: React.FC<{ w: number; h: number; children?: React.ReactNode }> = ({ w, h, children }) => {
  const band = Math.max(6, Math.round(h * 0.145));
  const inX = Math.round(w * 0.035);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, backgroundColor: "#211F1C" }}>
      {[0, 1].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute", left: 0, top: r ? h - band : 0, width: w, height: band,
            display: "flex", alignItems: "center", justifyContent: "space-around",
            padding: `0 ${Math.round(w * 0.03)}px`, boxSizing: "border-box",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: Math.round(w * 0.072), height: Math.max(2, Math.round(band * 0.46)), backgroundColor: "#F3F1EC" }} />
          ))}
        </div>
      ))}
      <div style={{ position: "absolute", left: inX, top: band, width: w - 2 * inX, height: h - 2 * band, overflow: "hidden", backgroundColor: "#FFFFFF" }}>
        {children}
      </div>
    </div>
  );
};

const svg: React.CSSProperties = { display: "block", width: "100%", height: "100%" };
const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice" style={svg}>{children}</svg>
);

export type SceneKind = "beach" | "city" | "coffee" | "mountain" | "plant" | "cat";

// The camera roll the creator is sorting: six flat scenes, muted so the terracotta X is the
// only saturated thing on the card. The beach and the cat are the two that leave.
export const Scene: React.FC<{ kind: SceneKind }> = ({ kind }) => {
  if (kind === "beach") {
    return (
      <Box>
        <rect x={0} y={0} width={100} height={50} fill="#CFDEE7" />
        <circle cx={73} cy={12} r={8.4} fill="#EBC97C" />
        <rect x={0} y={26} width={100} height={12} fill="#7FA3B6" />
        <path d="M0 30 q8 2.4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="#A9C4D1" strokeWidth={1.5} fill="none" />
        <rect x={0} y={37} width={100} height={13} fill="#E3D3AC" />
      </Box>
    );
  }
  if (kind === "city") {
    return (
      <Box>
        <rect x={0} y={0} width={100} height={50} fill="#D9DEE3" />
        {[[10, 20, 16, "#8B9198"], [28, 11, 14, "#A2A8AE"], [44, 23, 18, "#797F86"], [64, 15, 13, "#949AA1"], [79, 27, 14, "#868C93"]].map(
          ([x, y, bw, c], i) => (
            <rect key={i} x={x as number} y={y as number} width={bw as number} height={46 - (y as number)} fill={c as string} />
          ),
        )}
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => <rect key={`${r}${c}`} x={30 + c * 6} y={15 + r * 7} width={3} height={3} fill="#EDEFF2" />),
        )}
        <rect x={0} y={46} width={100} height={4} fill="#B9BEC4" />
      </Box>
    );
  }
  if (kind === "coffee") {
    return (
      <Box>
        <rect x={0} y={0} width={100} height={50} fill="#EFE9E0" />
        <ellipse cx={50} cy={43} rx={27} ry={5} fill="#D6CDBE" />
        <path d="M63 26 a7.5 7.5 0 0 1 0 11" stroke="#3E3C38" strokeWidth={3.2} fill="none" />
        <rect x={35} y={20} width={28} height={21} rx={3} fill="#3E3C38" />
        <path d="M44 15 q3.6 -4 0 -8" stroke="#B9B2A6" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        <path d="M54 15 q3.6 -4 0 -8" stroke="#B9B2A6" strokeWidth={1.7} fill="none" strokeLinecap="round" />
      </Box>
    );
  }
  if (kind === "mountain") {
    return (
      <Box>
        <rect x={0} y={0} width={100} height={50} fill="#DCE4E8" />
        <circle cx={80} cy={11} r={6} fill="#E8D9A8" />
        <path d="M0 50 L28 15 L56 50 Z" fill="#8D9AA0" />
        <path d="M28 15 L36 25 L20 25 Z" fill="#F2F4F5" />
        <path d="M38 50 L68 21 L100 50 Z" fill="#6E7A82" />
        <path d="M68 21 L75.5 30 L60.5 30 Z" fill="#F2F4F5" />
      </Box>
    );
  }
  if (kind === "plant") {
    return (
      <Box>
        <rect x={0} y={0} width={100} height={50} fill="#EDEAE3" />
        <ellipse cx={42} cy={22} rx={5} ry={11} fill="#6E8B62" transform="rotate(-27 42 22)" />
        <ellipse cx={58} cy={22} rx={5} ry={11} fill="#7C9A6F" transform="rotate(27 58 22)" />
        <ellipse cx={50} cy={16} rx={5} ry={12} fill="#5E7A54" />
        <path d="M50 34 L50 20 M50 30 L43 23 M50 28 L57 22" stroke="#5E7A54" strokeWidth={1.3} fill="none" />
        <rect x={36} y={31} width={28} height={4.5} fill="#A87E60" />
        <path d="M38 35.5 L62 35.5 L58 49 L42 49 Z" fill="#B98E6E" />
      </Box>
    );
  }
  return (
    <Box>
      <rect x={0} y={0} width={100} height={50} fill="#E9E6DF" />
      <path d="M62 44 q13 -1 9.5 -15" stroke="#2A2926" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M35 20 L33.5 7 L44 14 Z" fill="#2A2926" />
      <path d="M57 20 L58.5 7 L48 14 Z" fill="#2A2926" />
      <circle cx={46} cy={21} r={10.5} fill="#2A2926" />
      <path d="M38 30 q-6 8 -4 19 h24 q3 -13 -4.5 -20 z" fill="#2A2926" />
    </Box>
  );
};

// "the work you've been putting in": an editor and a canvas on a laptop, and the
// hours going by in the corner. The clock runs on a rate, not on the card's length.
export const WorkScene: React.FC<{ tMs: number }> = ({ tMs }) => {
  const min = (tMs / 1000) * 540;
  const hr = (tMs / 1000) * 45;
  return (
    <Box>
      <rect x={0} y={0} width={100} height={50} fill="#F1EFEA" />
      <path d="M6 39 L74 39 L79 45 L1 45 Z" fill="#C9C4B8" />
      <rect x={12} y={6} width={60} height={33} rx={1.5} fill="#1F1E1D" />
      <rect x={14} y={8} width={26} height={29} fill="#2B2A27" />
      {[16, 11, 21, 14, 18, 9].map((lw, i) => (
        <rect key={i} x={16} y={10.5 + i * 4.4} width={lw} height={1.9} fill={i === 3 ? ACCENT : "#8B8880"} />
      ))}
      <rect x={42} y={8} width={28} height={29} fill="#F6F5F1" />
      <rect x={44.5} y={11} width={12} height={9} fill="#C9C4B8" />
      <circle cx={64} cy={15.5} r={4} fill="#D8D4C9" />
      <rect x={44.5} y={24} width={23} height={2.6} fill="#DEDAD0" />
      <rect x={44.5} y={29} width={15} height={2.6} fill="#DEDAD0" />
      <circle cx={87} cy={12} r={8.5} fill="#FFFFFF" stroke="#1F1E1D" strokeWidth={1.5} />
      <line x1={87} y1={12} x2={87} y2={5.6} stroke={ACCENT} strokeWidth={1.5} strokeLinecap="round" transform={`rotate(${min % 360} 87 12)`} />
      <line x1={87} y1={12} x2={87} y2={7.8} stroke="#1F1E1D" strokeWidth={1.9} strokeLinecap="round" transform={`rotate(${hr % 360} 87 12)`} />
      <circle cx={87} cy={12} r={1.1} fill="#1F1E1D" />
    </Box>
  );
};

// "a demo video of the actual product": a phone, a product UI, a cursor tapping
// from the list screen to the detail screen and back, on its own rate.
export const DemoScene: React.FC<{ tMs: number; sinceMs: number }> = ({ tMs, sinceMs }) => {
  const t = Math.max(0, tMs - sinceMs);
  const CYCLE = 760;
  const taps = Math.floor(t / CYCLE);
  const inTap = t - taps * CYCLE;
  const detail = taps % 2 === 1;
  const ring = inTap < 220 ? 1 - inTap / 220 : 0;
  const press = inTap < 130 ? 1 - inTap / 130 : 0;
  const cy = detail ? 37 : 21;
  return (
    <Box>
      <rect x={0} y={0} width={100} height={50} fill="#EFEDE8" />
      <rect x={36} y={1.5} width={27} height={47} rx={3.5} fill="#1F1E1D" />
      <rect x={38.6} y={4.5} width={21.8} height={41} fill="#FFFFFF" />
      {detail ? (
        <>
          <rect x={38.6} y={4.5} width={21.8} height={14} fill="#C9C4B8" />
          <rect x={41} y={21} width={17} height={2.6} fill="#DCD8CE" />
          <rect x={41} y={25.5} width={11} height={2.6} fill="#DCD8CE" />
          <rect x={41} y={33} width={17} height={7} rx={1} fill={ACCENT} />
        </>
      ) : (
        <>
          <rect x={38.6} y={4.5} width={21.8} height={6} fill={ACCENT} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={41} y={14 + i * 7.4} width={17} height={5} fill="#DCD8CE" />
          ))}
        </>
      )}
      <circle cx={49.5} cy={cy} r={3 + 7 * (1 - ring)} fill="none" stroke="#1F1E1D" strokeWidth={1.2} opacity={ring * 0.55} />
      <g transform={`translate(${50.5 - press * 1.2} ${cy - 1 + press * 1.2})`}>
        <path d="M0 0 L0 12 L3.3 9.1 L5.3 13.4 L7.6 12.3 L5.6 8.2 L9.4 7.9 Z" fill="#FFFFFF" stroke="#1F1E1D" strokeWidth={1.1} strokeLinejoin="round" />
      </g>
    </Box>
  );
};
