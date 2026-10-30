import React from "react";
import { interpolate, spring } from "remotion";
import { INK, MUTED, ACCENT, label, MONO_FONT } from "./theme";

// Takeover: 12 real rule lines -> arrow -> 3 refined pattern blocks.
// beats: { arrow, blocks, goal, reasoning, examples, condense }

const RULES = [
  "NEVER commit directly to main",
  "ALWAYS run prettier after editing",
  "keep functions under 80 lines",
  "NEVER use raw SQL in controllers",
  "ALWAYS update the changelog",
  "NEVER touch the migrations folder",
  "ALWAYS write tests for new utils",
  "NEVER expose keys in client code",
  "ALWAYS use the fetch wrapper",
  "NEVER add deps without approval",
  "ALWAYS follow the repo naming",
  "NEVER delete failing tests",
];

const BLOCKS = [
  { key: "goal", title: "the goal", sub: "the outcome we protect" },
  { key: "reasoning", title: "the reasoning", sub: "why it matters" },
  { key: "examples", title: "examples + counters", sub: "the decision boundary" },
];

export const Transform: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: {
    arrow: number; blocks: number; goal: number;
    reasoning: number; examples: number; condense: number;
  };
}> = ({ tMs, w, h, fps, beats }) => {
  const framesSince = (ms: number) => Math.max(0, ((tMs - ms) / 1000) * fps);
  const sprung = (f: number) =>
    spring({ frame: f, fps, config: { damping: 15, stiffness: 240, mass: 0.7 } });

  const pad = 0.06 * w;
  const leftX = pad;
  const leftW = 0.34 * w;
  const topY = 0.15 * h;
  const zoneH = 0.7 * h;
  const rowH = zoneH / RULES.length;

  const rightX = 0.55 * w;
  const rightW = w - rightX - pad;
  const blockH = zoneH / 3 - 0.025 * h;
  const blockAt = [beats.goal, beats.reasoning, beats.examples];

  const condenseP = interpolate(tMs, [beats.condense, beats.condense + 1300], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const arrowP = interpolate(tMs, [beats.arrow, beats.arrow + 700], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const ax0 = leftX + leftW + 0.03 * w;
  const ax1 = rightX - 0.03 * w;
  const ay = topY + zoneH / 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", top: 0.055 * h, left: pad, ...label(0.021 * w) }}>
        your rules
      </div>
      <div style={{ position: "absolute", top: 0.055 * h, left: rightX, ...label(0.021 * w, ACCENT) }}>
        high-level patterns
      </div>

      {RULES.map((text, i) => {
        const inP = sprung(framesSince(0) - i * 1.2);
        const target = Math.min(2, Math.floor(i / 4));
        const c = condenseP;
        const dx = c * (rightX + rightW * 0.5 - (leftX + leftW * 0.5));
        const dy = c * (topY + target * (blockH + 0.038 * h) + blockH / 2 - (topY + i * rowH + rowH / 2));
        const stag = Math.max(0, Math.min(1, condenseP * 1.6 - i * 0.045));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: leftX,
              top: topY + i * rowH,
              width: leftW,
              height: rowH,
              display: "flex",
              alignItems: "center",
              fontFamily: MONO_FONT,
              fontSize: 0.016 * w,
              color: "rgba(255,255,255,0.88)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              transform: `translate(${dx * stag}px, ${dy * stag}px) scale(${(0.9 + 0.1 * inP) * (1 - stag * 0.75)})`,
              transformOrigin: "left center",
              opacity: Math.min(1, inP * 1.3) * (1 - stag * 0.95),
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", marginRight: "0.6em" }}>-</span>
            {text}
          </div>
        );
      })}

      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={ax0} y1={ay} x2={ax0 + (ax1 - ax0) * arrowP} y2={ay}
          style={{ stroke: INK }} strokeWidth={5} strokeLinecap="round" opacity={0.9}
        />
        {arrowP > 0.95 && (
          <path
            d={`M ${ax1 - 18} ${ay - 16} L ${ax1 + 2} ${ay} L ${ax1 - 18} ${ay + 16}`}
            fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.9}
          />
        )}
      </svg>

      {BLOCKS.map((b, i) => {
        const at = blockAt[i];
        const on = tMs >= at;
        const pop = sprung(framesSince(at));
        const pulse = 1 + 0.04 * Math.sin(Math.min(1, Math.max(0, condenseP * 1.6 - i * 0.15)) * Math.PI);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: rightX,
              top: topY + i * (blockH + 0.038 * h),
              width: rightW,
              height: blockH,
              border: on ? `2px solid ${ACCENT}` : "1.5px solid rgba(255,255,255,0.16)",
              backgroundColor: on ? "var(--block-bg, #131317)" : "rgba(255,255,255,0.02)",
              boxShadow: on ? "0 6px 22px rgba(0,0,0,0.55)" : undefined,
              transform: on ? `scale(${0.9 + 0.1 * pop}) scale(${pulse})` : undefined,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 0.024 * w,
              gap: 0.012 * h,
            }}
          >
            {on && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 0.014 * w }}>
                  <div style={{ width: 0.011 * w, height: 0.011 * w, backgroundColor: ACCENT }} />
                  <span style={{ ...label(0.023 * w, INK), fontWeight: 700 }}>{b.title}</span>
                </div>
                <span style={{ fontFamily: MONO_FONT, fontSize: 0.015 * w, color: MUTED }}>
                  {b.sub}
                </span>
              </>
            )}
          </div>
        );
      })}

      {condenseP > 0.6 && (
        <div style={{ position: "absolute", bottom: 0.04 * h, left: 0, right: 0, textAlign: "center", ...label(0.02 * w, INK), opacity: Math.min(1, (condenseP - 0.6) * 4) }}>
          the smallest set that fully describes the behaviour
        </div>
      )}
    </div>
  );
};
