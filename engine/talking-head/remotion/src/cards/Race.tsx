import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, BAR_GREY, CARD_BG, INK, MONO_FONT, MUTED, label } from "./theme";

// "a SPEED that NO HUMAN IN HISTORY has EVER been able to get it BEFORE."
// The same question is dropped into two lanes at once. The top one runs the
// whole lane in under half a second, wraps, runs it again, then halves its lap
// time so it visibly accelerates, and its lap tally climbs. The bottom one
// inches a few percent along and stops dead at a hatched wall: the ceiling
// nobody has ever passed, which the top lane has already lapped many times.

// The creator films against a bright cream wall in daylight, so nothing on this card may
// rely on a white stroke plus an offset shadow: an offset-only shadow leaves the
// top edge of every glyph and stroke unbacked. Every lane, bar, wall and word is
// an opaque object or sits on one, and every stroke carries a 0-offset halo too.
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const HATCH = "race-wall-hatch";

const LAP_SLOW = 400; // ms per lap
const LAP_FAST = 200; // ms per lap once it accelerates

export const Race: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  top: { label: string }; bottom: { label: string };
  wallLabel: string;
  beats: { go: number; wall: number; loops: number };
}> = ({ tMs, w, h, fps, fromMs, top, bottom, wallLabel, beats }) => {
  const P = 0.02 * w;
  const nameFs = 0.050 * w;
  const cntFs = 0.07 * w;
  const wallFs = 0.048 * w;
  const nameW = 0.26 * w;
  const gap = 0.022 * w;
  const cntW = 0.17 * w;
  const laneX = P + nameW + gap;
  const laneW = w - laneX - gap - cntW - P;
  const sw = 0.007 * w;

  const laneH = 0.24 * h;
  const barH = 0.09 * h;
  const barY = (laneH - barH) / 2;
  const gapV = 0.37 * h;
  const y0 = (h - (2 * laneH + gapV)) / 2;
  const topY = y0;
  const botY = y0 + laneH + gapV;

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enter = ramp(fromMs, fromMs + 380);

  const glow = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 10px rgba(0,0,0,0.85))`;
  const textShadow = `0px 0px ${0.01 * w}px rgba(0,0,0,0.92), ${SHADOW}`;
  // every word on the card is cut out of a solid plate, like the chips on Firehose
  const plate = (text: string, css: React.CSSProperties, padY: number, padX: number): React.ReactElement => (
    <div
      style={{
        position: "relative", display: "inline-block", borderRadius: 0,
        padding: `${padY}px ${padX}px`, maxWidth: "100%", overflow: "hidden",
        
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0 }} />
      <span style={{ ...css, position: "relative", display: "block", lineHeight: 1, whiteSpace: "nowrap", textShadow }}>
        {text}
      </span>
    </div>
  );

  // ---- the top lane: laps, then faster laps
  const go = beats.go;
  const loops = Math.max(go, beats.loops);
  const lapsAt = (t: number): number => {
    if (t <= go) return 0;
    if (t <= loops) return (t - go) / LAP_SLOW;
    return (loops - go) / LAP_SLOW + (t - loops) / LAP_FAST;
  };
  const L = lapsAt(tMs);
  const laps = Math.max(0, Math.floor(L));
  const lead = laneW * (L - Math.floor(L));
  const headW = 0.22 * laneW;
  const headX = laneX + Math.max(0, lead - headW);
  const headLen = laneX + lead - headX;
  const trailX = laneX + Math.max(0, lead - 0.55 * laneW);
  const trailLen = laneX + lead - trailX;

  // ---- the bottom lane: a crawl that stops
  const crawlEnd = Math.max(beats.wall, go + 2500);
  const crawl = ramp(go, crawlEnd);
  const botLen = laneW * 0.06 * (1 - Math.pow(1 - crawl, 2));

  // ---- the ceiling
  const wallX = laneX + laneW * 0.06 + 0.016 * w;
  const wallW = 0.05 * w;
  const wIn = spring({
    frame: Math.max(0, ((tMs - beats.wall) / 1000) * fps),
    fps,
    config: { damping: 14, stiffness: 300, mass: 0.7 },
  });
  const wallTop = botY - 0.025 * h;
  const wallH = laneH + 0.05 * h;
  const hatchP = 0.026 * w;
  // the claim rides the open band between the lanes: one line, clear of both the
  // wall and the bars, with the wall's own guide broken around it
  const wallPadY = 0.018 * w;
  const wallPlateH = wallFs + 2 * wallPadY;
  const labelTop = topY + laneH + (gapV - wallPlateH) / 2;
  const labelGap = 0.024 * h;

  const lane = (y: number) => (
    <g>
      <rect x={laneX} y={y} width={laneW * enter} height={laneH} fill={CARD_BG} fillOpacity={0.26} />
      <line x1={laneX} y1={y} x2={laneX + laneW * enter} y2={y} stroke={INK} strokeWidth={sw} strokeOpacity={0.85} />
      <line x1={laneX} y1={y + laneH} x2={laneX + laneW * enter} y2={y + laneH} stroke={INK} strokeWidth={sw} strokeOpacity={0.85} />
    </g>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>one lane laps the track over and over, the other stops at a wall</title>
        <defs>
          <pattern id={HATCH} width={hatchP} height={hatchP} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={hatchP} stroke={INK} strokeOpacity={0.5} strokeWidth={0.011 * w} />
          </pattern>
        </defs>

        <g style={{ filter: glow }}>
          {lane(topY)}
          {lane(botY)}

          {/* the top lane, running the whole lane again and again */}
          {tMs > go && (
            <g>
              <rect x={trailX} y={topY + barY} width={trailLen} height={barH} fill={ACCENT} opacity={0.34} />
              <rect x={headX} y={topY + barY} width={headLen} height={barH} fill={ACCENT} />
            </g>
          )}

          {/* the bottom lane, inching forward: same kind of bar, a fraction of the speed */}
          {tMs > go && botLen > 0 && <rect x={laneX} y={botY + barY} width={botLen} height={barH} fill={INK} />}

          {/* the ceiling nobody has ever passed, and the line the top lane keeps crossing */}
          {wIn > 0 && (
            <g opacity={Math.min(1, wIn * 2)}>
              <line
                x1={wallX + wallW / 2} y1={topY - 0.02 * h} x2={wallX + wallW / 2} y2={labelTop - labelGap}
                stroke={BAR_GREY} strokeWidth={0.007 * w} strokeOpacity={0.9} strokeDasharray={`${0.016 * w} ${0.014 * w}`}
              />
              <line
                x1={wallX + wallW / 2} y1={labelTop + wallPlateH + labelGap} x2={wallX + wallW / 2} y2={botY}
                stroke={BAR_GREY} strokeWidth={0.007 * w} strokeOpacity={0.9} strokeDasharray={`${0.016 * w} ${0.014 * w}`}
              />
              <g
                transform={`translate(${wallX + wallW / 2} ${wallTop + wallH / 2}) scale(1 ${0.35 + 0.65 * wIn}) translate(${-(wallX + wallW / 2)} ${-(wallTop + wallH / 2)})`}
              >
                <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill={CARD_BG} fillOpacity={0.26} />
                <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill={`url(#${HATCH})`} />
                <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill="none" stroke={INK} strokeOpacity={0.85} strokeWidth={0.008 * w} />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* who is in each lane */}
      <div
        style={{
          position: "absolute", left: P, top: topY, width: nameW, height: laneH,
          display: "flex", alignItems: "center", justifyContent: "flex-end", opacity: enter,
        }}
      >
        {plate(top.label, label(nameFs, INK), 0.016 * w, 0.022 * w)}
      </div>
      <div
        style={{
          position: "absolute", left: P, top: botY, width: nameW, height: laneH,
          display: "flex", alignItems: "center", justifyContent: "flex-end", opacity: enter,
        }}
      >
        {plate(bottom.label, label(nameFs, MUTED), 0.016 * w, 0.022 * w)}
      </div>

      {/* its own count of its own laps, the only figure on the card */}
      <div
        style={{
          position: "absolute", left: laneX + laneW + gap, top: topY, width: cntW, height: laneH,
          display: "flex", alignItems: "center", opacity: tMs > go ? 1 : 0,
        }}
      >
        {plate(
          `×${laps}`,
          { fontFamily: MONO_FONT, fontSize: cntFs, fontWeight: 600, color: ACCENT, fontVariantNumeric: "tabular-nums" },
          0.012 * w,
          0.016 * w
        )}
      </div>

      {/* what the wall is: the half of the comparison that carries the claim */}
      {wIn > 0 && (
        <div
          style={{
            position: "absolute", left: 0, top: labelTop, width: w,
            display: "flex", justifyContent: "center", opacity: Math.min(1, wIn * 2),
          }}
        >
          {plate(wallLabel, label(wallFs, INK), wallPadY, 0.026 * w)}
        </div>
      )}
    </div>
  );
};
