import React from "react";
import { Img, staticFile } from "remotion";
import { ACCENT, INK, LABEL_FONT, MONO_FONT, MUTED } from "../theme";

// reference edit J famD, the shared stage of THE SPONSOR (V20 dwall / V21 dvet / V22 dsafe).
// One object in three states: the real AIR mark floating over a wall of dark blocks,
// an empty floor, and the Claude agent standing on the protected side. Every card of
// the family reads these numbers so the three events are literally the same picture.

export const GREEN = "#5FBF86"; // the tick, and nothing else

export type Geo = ReturnType<typeof airGeo>;

export const airGeo = (w: number, h: number) => {
  const s = w / 1015;
  const blockH = 0.070 * h;
  const floorY = 0.80 * h;
  const wallX = 0.265 * w;
  const wallW = 0.21 * w;
  const agentW = 0.17 * w;
  const agentH = agentW * (440 / 520);
  const agentLeft = 0.758 * w;
  const chipW = 0.215 * w;
  const chipH = 0.10 * h;
  return {
    s, H: h, blockH, floorY, wallX, wallW, rows: 6,
    wallTop: floorY - 6 * blockH,
    gapY: floorY - 2.5 * blockH,
    markW: 0.125 * w, markTop: 0.042 * h, markCx: wallX + wallW / 2,
    agentW, agentH, agentLeft, agentTop: floorY - agentH,
    agentCx: agentLeft + agentW / 2,
    labelTop: floorY + 0.040 * h,
    chipW, chipH,
    scanLeft: 0.035 * w,            // where a chip waits to be swept, at the wall's foot
    scanTop: floorY - 2.5 * blockH - chipH / 2,
    outLeft: 0.012 * w,             // where the refused one lies, outside
    outTop: floorY - chipH - 0.052 * h,
    passLeft: 0.497 * w,            // the agent's side of the wall
    passTop1: floorY - chipH,
    passTop2: floorY - chipH - 0.118 * h,
  };
};

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number =>
  clamp01(t) < 0.5 ? 4 * clamp01(t) ** 3 : 1 - Math.pow(-2 * clamp01(t) + 2, 3) / 2;
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));

export const Floor: React.FC<{ g: Geo; w: number }> = ({ g, w }) => (
  <div
    style={{
      position: "absolute", left: 0.055 * w, width: w - 0.11 * w, top: g.floorY,
      height: Math.max(2, 3 * g.s), backgroundColor: "rgba(242,242,242,0.34)",
    }}
  />
);

// the wall, in running bond: every row is real brickwork with staggered joints and a lit
// top edge, so it reads as a wall and not as a stack of bars. `rise(i)` is 0..1 for the row
// i courses up from the floor; `seam` lights the slot a vetted chip goes through; `flash`
// is the top edge lighting on "firewall"; `live` is the slow highlight travelling along it.
const course = (i: number, W: number, m: number): { x: number; w: number }[] => {
  if (i % 2 === 0) {
    const b = (W - m) / 2;
    return [{ x: 0, w: b }, { x: b + m, w: b }];
  }
  const q = (W - 2 * m) / 4;
  return [{ x: 0, w: q }, { x: q + m, w: q * 2 }, { x: 3 * q + 2 * m, w: q }];
};

export const Wall: React.FC<{
  g: Geo; rise: (i: number) => number; seam: number; flash: number; live: number;
}> = ({ g, rise, seam, flash, live }) => {
  const m = Math.max(3, 4 * g.s);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
      {Array.from({ length: g.rows }, (_, i) => {
        const p = rise(i);
        if (p <= 0) return null;
        const top = g.floorY - (i + 1) * g.blockH;
        const isTop = i === g.rows - 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: g.wallX, width: g.wallW,
              top: top + (1 - easeOut(p)) * g.blockH * 0.95,
              height: g.blockH - m, opacity: Math.min(1, p * 2.4),
            }}
          >
            {course(i, g.wallW, m).map((b) => (
              <div
                key={b.x}
                style={{
                  position: "absolute", left: b.x, width: b.w, top: 0, height: "100%",
                  background: "linear-gradient(180deg, #2b323c 0%, #14171d 100%)",
                  borderTop: `${Math.max(2, 2.5 * g.s)}px solid rgba(255,255,255,${isTop ? 0.3 + 0.55 * flash : 0.22})`,
                  boxShadow: isTop && flash > 0
                    ? `0 0 ${26 * g.s * flash}px rgba(255,255,255,${0.4 * flash})`
                    : "inset -2px 0 6px rgba(0,0,0,0.55)",
                }}
              />
            ))}
          </div>
        );
      })}
      {/* the travelling highlight on the finished top edge */}
      {live > 0 && (
        <div
          style={{
            position: "absolute", left: g.wallX, width: g.wallW,
            top: g.floorY - g.rows * g.blockH, height: Math.max(2, 3 * g.s),
            overflow: "hidden", opacity: 0.9,
          }}
        >
          <div
            style={{
              position: "absolute", top: 0, height: "100%", width: g.wallW * 0.35,
              left: (live * 1.35 - 0.35) * g.wallW,
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      )}
      {/* the slot a vetted chip passes through */}
      {seam > 0 && (
        <div
          style={{
            position: "absolute", left: g.wallX, width: g.wallW,
            top: g.gapY - Math.max(2, 2 * g.s), height: Math.max(3, 4 * g.s),
            backgroundColor: `rgba(242,242,242,${0.8 * seam})`,
            boxShadow: `0 0 ${20 * g.s}px rgba(242,242,242,${0.5 * seam})`,
            transform: `scaleX(${easeOut(seam)})`, transformOrigin: "center",
          }}
        />
      )}
    </div>
  );
};

export const Mark: React.FC<{ g: Geo; src: string; pop: number; url?: string }> = ({ g, src, pop, url }) => (
  <>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", left: g.markCx - g.markW / 2, top: g.markTop,
        width: g.markW, height: g.markW, zIndex: 4,
        transform: `scale(${0.7 + 0.3 * pop})`, opacity: Math.min(1, pop * 2),
      }}
    />
    {/* the sponsor's real address, landing with the mark and inherited by every state after it */}
    {url && (
      <div
        style={{
          position: "absolute", left: g.markCx, top: g.markTop + g.markW + 10 * g.s, zIndex: 4,
          transform: `translateX(-50%) scale(${0.82 + 0.18 * pop})`, opacity: Math.min(1, pop * 2),
          fontFamily: MONO_FONT, fontSize: 30 * g.s, color: MUTED,
          letterSpacing: "0.02em", whiteSpace: "nowrap",
        }}
      >
        {url}
      </div>
    )}
  </>
);

export const Agent: React.FC<{ g: Geo; src: string; label: string; pop: number }> = ({ g, src, label, pop }) => (
  <>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", left: g.agentLeft, top: g.agentTop,
        width: g.agentW, height: g.agentH, zIndex: 4,
        transform: `scale(${0.72 + 0.28 * pop})`, transformOrigin: "center bottom",
        opacity: Math.min(1, pop * 2),
        filter: "drop-shadow(0px 0px 10px rgba(255,255,255,0.30)) drop-shadow(0px 0px 30px rgba(255,255,255,0.18))",
      }}
    />
    <div
      style={{
        position: "absolute", left: g.agentCx, top: g.labelTop, zIndex: 4,
        transform: "translateX(-50%)", opacity: Math.min(1, pop * 2),
        fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 30 * g.s,
        color: INK, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  </>
);

// one tile: the thing being vetted. `tick` lands the verdict, `sweep` is the beam
// crossing it, `reveal` opens the mono line the sweep found inside it.
export const DChip: React.FC<{
  g: Geo; left: number; top: number; width: number; text: string; fs: number;
  tick?: "ok" | "no"; tickP?: number; sweep?: number; rot?: number; opacity?: number;
  reveal?: number; revealText?: string; z?: number; badge?: string; badgeFs?: number; scale?: number;
}> = ({ g, left, top, width, text, fs, tick, tickP = 0, sweep, rot = 0, opacity = 1, reveal = 0, revealText, z = 2, badge, badgeFs, scale = 1 }) => {
  const extra = reveal > 0 ? easeOut(reveal) * 0.052 * g.H : 0;
  const bfs = badgeFs ?? fs * 0.86;
  const height = g.chipH + extra + (badge ? 0.072 * g.H : 0);
  return (
    <div
      style={{
        position: "absolute", left, top, width, height, zIndex: z, opacity,
        transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: "center bottom",
        background: "linear-gradient(180deg, #1e222a 0%, #12141a 100%)",
        borderTop: `${Math.max(2, 2 * g.s)}px solid rgba(255,255,255,0.20)`,
        boxShadow: z >= 5 ? "0 14px 40px rgba(0,0,0,0.85)" : "0 8px 22px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", left: 0.055 * width, top: g.chipH * 0.24,
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs, color: INK,
          textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
      {badge && (
        <div
          style={{
            position: "absolute", left: 0.055 * width, top: g.chipH * 0.94,
            display: "flex", alignItems: "center", gap: 0.028 * width,
          }}
        >
          <svg width={bfs * 0.74} height={bfs * 0.74} viewBox="0 0 24 24">
            <title>checked</title>
            <path d="M4.6 12.6 L9.8 17.6 L19.4 7.0" fill="none" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: LABEL_FONT, fontWeight: 600, fontSize: bfs, color: INK, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
            {badge}
          </span>
        </div>
      )}
      {reveal > 0 && revealText && (
        <div
          style={{
            position: "absolute", left: 0.055 * width, top: g.chipH * 0.92,
            fontFamily: MONO_FONT, fontSize: fs * 0.82, color: ACCENT,
            whiteSpace: "nowrap", opacity: clamp01(reveal * 1.6),
          }}
        >
          {revealText}
        </div>
      )}
      {tick && tickP > 0 && (
        <div
          style={{
            position: "absolute", right: 0.055 * width, top: g.chipH * 0.22,
            width: fs * 1.05, height: fs * 1.05,
            transform: `scale(${0.4 + 0.6 * easeOut(tickP)})`, opacity: clamp01(tickP * 2),
          }}
        >
          {tick === "ok" ? (
            <svg width="100%" height="100%" viewBox="0 0 24 24">
              <title>vetted</title>
              <path d="M4.6 12.6 L9.8 17.6 L19.4 7.0" fill="none" stroke={GREEN} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 24 24">
              <title>refused</title>
              <path d="M5.6 5.6 L18.4 18.4 M18.4 5.6 L5.6 18.4" fill="none" stroke={ACCENT} strokeWidth={3.6} strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}
      {sweep !== undefined && sweep > 0 && sweep < 1 && (
        <div
          style={{
            position: "absolute", top: 0, height: "100%", width: width * 0.3,
            left: (sweep * 1.3 - 0.3) * width,
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      )}
    </div>
  );
};

// the scanner: one bright line drawn down the wall's face on "vet"
export const Beam: React.FC<{ g: Geo; p: number }> = ({ g, p }) => {
  if (p <= 0 || p >= 1) return null;
  const y = g.wallTop + easeIO(p) * (g.gapY - g.wallTop);
  return (
    <div
      style={{
        position: "absolute", left: g.wallX, width: g.wallW, top: y,
        height: Math.max(3, 5 * g.s), zIndex: 5,
        backgroundColor: "rgba(255,255,255,0.92)",
        boxShadow: `0 0 ${26 * g.s}px rgba(255,255,255,0.6)`,
        opacity: 1 - Math.pow(p, 4),
      }}
    />
  );
};
