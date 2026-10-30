import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";

// "It FEELS PRODUCTIVE, but it DOESN'T ACTUALLY MOVE YOU FORWARD most of the
// time" (mode "stuck"), and later, as the deliberate callback, "this actually
// helped me MOVE FORWARD A LOT FASTER, and I LEARN A LOT MORE" (mode "moving").
// One object twice: the same track, the same marker, the same zero line, the
// same dimension hugging the track. Stuck, the marker shakes itself apart on
// the start line, the dimension collapses to a point and reads 0, and ten past
// attempts pile up at zero. Moving, the marker steps down the track slot by
// slot, the dimension grows with it, a lighter one overtakes, learning rises.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const GLOW = "drop-shadow(0px 3px 10px rgba(0,0,0,0.85))";

// deterministic scatter: the same frame renders identically on every machine
const rnd = (i: number): number => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

// "most of the time": eight attempts piled on the start line, two barely ahead
const ATTEMPTS = [0, 0.012, 0.024, 0.036, 0.048, 0.06, 0.072, 0.084, 0.125, 0.155];

export const Forward: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  mode: "stuck" | "moving";
  startLabel: string; markerLabel: string; measureLabel: string;
  steps?: string[];
  beats: { activity?: number; measure?: number; history?: number; fast?: number; learn?: number };
}> = ({ tMs, w, h, fps, fromMs, mode, startLabel, markerLabel, measureLabel, steps, beats }) => {
  const at = {
    activity: beats.activity ?? fromMs + 480,
    measure: beats.measure ?? fromMs + 1600,
    history: beats.history ?? fromMs + 2500,
    fast: beats.fast ?? fromMs + 2400,
    learn: beats.learn ?? fromMs + 3300,
  };
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- type and stroke: sized to hold up over a bright, busy room
  const mFs = 0.044 * w;   // the marker's name
  const sFs = 0.034 * w;   // start / measure captions
  const lFs = 0.042 * w;   // the payoff word at the foot of the learn axis
  const stFs = 0.028 * w;  // the step slots
  const zFs = Math.min(0.13 * w, 0.26 * h);
  const mk = 0.045 * w;    // the marker square
  const sw = 0.008 * w;    // the track and every heavy stroke
  const thin = 0.005 * w;  // guides and attempt ticks

  // ---- furniture, measured identically in both modes so the callback lands
  const trackW = 0.92 * w;
  const x0 = 0.04 * w;
  const x1 = x0 + trackW;
  const LBL_T = 0.055 * h;
  const LEAD_T = 0.165 * h;
  const trackY = 0.333 * h;
  const tickHalf = 0.07 * h;
  const BR_Y = trackY + 0.07 * h;
  const BR_CAP = 0.048 * h;
  const ROW_M = 0.52 * h;
  const HIST_H = 0.28 * h;
  const BASE_T = 0.855 * h;
  const axisH = 0.185 * h;
  const ZERO_T = BR_Y - zFs / 2;
  const CAP_T = ZERO_T + zFs + 0.016 * h;

  const drawn = ramp(fromMs, fromMs + 420);
  const mIn = sp(fromMs + 160);

  // ---- where the marker is. Steps land on the centre of their own slot, so a
  // tick and its caption always share an x and no two captions can touch.
  const st = steps ?? [];
  const n = Math.max(1, st.length);
  const slot = trackW / n;
  const pos = (k: number) => (k <= 0 ? x0 : x0 + slot * (k - 0.5));
  const stepGap = Math.max(240, (at.fast - (fromMs + 340)) / n);
  const stepAt = (i: number) => fromMs + 340 + i * stepGap;

  let travelled = x0;
  if (mode === "moving" && st.length > 0) {
    for (let i = 0; i < st.length; i++) travelled += sp(stepAt(i)) * (pos(i + 1) - pos(i));
  }
  const shake =
    mode === "stuck"
      ? 0.006 * w * ramp(at.activity, at.activity + 260) * Math.sin((2 * Math.PI * 18 * (tMs - at.activity)) / 1000)
      : 0;
  const mx = mode === "stuck" ? x0 + shake : clamp(travelled, x0, x0 + trackW * 0.92);

  // the name rides the marker, pushed off it only as far as staying in frame needs
  const mHalf = (markerLabel.length * mFs * 0.78) / 2;
  const lx = clamp(mx, mHalf + 0.02 * w, w - mHalf - 0.02 * w);

  // ---- the dimension: collapsed at zero, or grown to wherever the marker got
  const bIn = ramp(at.measure, at.measure + 320);
  const bEnd = x0 + (mx - x0) * bIn;
  const zS = sp(at.measure + 220);
  const dash = `${0.016 * w} ${0.011 * w}`;

  const fT = ramp(at.fast, at.fast + 950);
  const fx = x0 + (x1 - x0) * fT;
  const lT = ramp(at.learn, at.learn + 850);

  const flying: React.ReactElement[] = [];
  if (mode === "stuck") {
    const on = ramp(at.activity, at.activity + 320);
    if (on > 0) {
      for (let i = 0; i < 12; i++) {
        const ph = (tMs - at.activity) / 620 + rnd(i);
        if (ph <= 0) continue;
        const cyc = Math.floor(ph);
        const life = ph - cyc;
        const ang = rnd(i * 7 + cyc * 13) * Math.PI * 2;
        const r = 0.038 * w + 0.07 * w * life;
        flying.push(
          <line
            key={i}
            x1={mx + Math.cos(ang) * r}
            y1={trackY + Math.sin(ang) * r}
            x2={mx + Math.cos(ang) * (r + 0.036 * w)}
            y2={trackY + Math.sin(ang) * (r + 0.036 * w)}
            stroke={INK}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeOpacity={(1 - life) * 0.9 * on}
          />
        );
      }
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>{mode === "stuck" ? "furious motion, zero distance covered" : "the same track, actually crossed"}</title>
        <g style={{ filter: GLOW }}>
          {/* the zero line: everything that never left the start hangs off it */}
          <line
            x1={x0} y1={trackY + tickHalf} x2={x0} y2={BASE_T}
            stroke={INK} strokeWidth={thin} strokeOpacity={0.3 * drawn} strokeDasharray={dash}
          />

          {/* the track and its start */}
          <line x1={x0} y1={trackY} x2={x0 + trackW * drawn} y2={trackY} stroke={INK} strokeWidth={sw} strokeOpacity={0.92} />
          <line
            x1={x0} y1={trackY - tickHalf} x2={x0} y2={trackY + tickHalf}
            stroke={INK} strokeWidth={sw} strokeOpacity={0.92 * drawn}
          />

          {/* every attempt that never left the start line */}
          {mode === "stuck" &&
            ATTEMPTS.map((f, i) => {
              const a = ramp(at.history + i * 70, at.history + i * 70 + 240);
              if (a <= 0) return null;
              const hx = x0 + trackW * f;
              return (
                <line
                  key={i}
                  x1={hx} y1={ROW_M} x2={hx} y2={ROW_M + HIST_H * a}
                  stroke={INK} strokeWidth={thin} strokeOpacity={0.7 * a}
                />
              );
            })}

          {/* one tick per step actually taken, on the centre of its slot */}
          {mode === "moving" &&
            st.map((_, i) => {
              const s = sp(stepAt(i));
              if (s <= 0.02) return null;
              return (
                <line
                  key={i}
                  x1={pos(i + 1)} y1={trackY - 0.05 * h} x2={pos(i + 1)} y2={trackY + 0.05 * h}
                  stroke={INK} strokeWidth={thin} strokeOpacity={0.75 * Math.min(1, s * 2)}
                />
              );
            })}

          {/* the dimension, hugging the track, from the start to the marker */}
          {bIn > 0 && (
            <g opacity={bIn}>
              <line x1={x0} y1={BR_Y} x2={bEnd} y2={BR_Y} stroke={ACCENT} strokeWidth={sw} strokeDasharray={dash} />
              <line x1={x0} y1={BR_Y} x2={x0} y2={BR_Y + BR_CAP} stroke={ACCENT} strokeWidth={sw} />
              <line x1={bEnd} y1={BR_Y} x2={bEnd} y2={BR_Y + BR_CAP} stroke={ACCENT} strokeWidth={sw} />
            </g>
          )}

          {/* everything it throws off without going anywhere */}
          {flying}

          {/* the name's leader, so it can ride the marker without crowding it */}
          {mIn > 0 && (
            <line
              x1={lx} y1={LEAD_T} x2={mx} y2={trackY - mk / 2}
              stroke={ACCENT} strokeWidth={thin} strokeOpacity={0.7 * Math.min(1, mIn * 2)}
            />
          )}

          {/* the one that overtakes */}
          {mode === "moving" && fT > 0 && (
            <g opacity={0.65}>
              <line x1={Math.max(x0, fx - 0.12 * w)} y1={trackY} x2={fx} y2={trackY} stroke={ACCENT} strokeWidth={sw * 1.6} strokeOpacity={0.45} />
              <rect x={fx - mk / 2} y={trackY - mk / 2} width={mk} height={mk} fill={ACCENT} />
            </g>
          )}

          {/* what got learned on the way, and the column its name hangs in */}
          {mode === "moving" && lT > 0 && (
            <g>
              <line
                x1={x1} y1={trackY} x2={x1} y2={trackY - axisH * Math.min(1, lT * 1.4)}
                stroke={INK} strokeWidth={sw} strokeOpacity={0.92}
              />
              <rect x={x1 - 0.055 * w} y={trackY - axisH * lT} width={0.045 * w} height={axisH * lT} fill={ACCENT} />
              <line
                x1={x1} y1={trackY + tickHalf} x2={x1} y2={BASE_T}
                stroke={INK} strokeWidth={thin} strokeOpacity={0.3 * lT} strokeDasharray={dash}
              />
            </g>
          )}

          {/* the marker itself */}
          {mIn > 0 && (
            <g transform={`translate(${mx} ${trackY}) scale(${0.4 + 0.6 * mIn})`} opacity={Math.min(1, mIn * 2)}>
              <rect x={-mk / 2} y={-mk / 2} width={mk} height={mk} fill={ACCENT} />
            </g>
          )}
        </g>
      </svg>

      {/* what the marker is */}
      {mIn > 0 && (
        <div
          style={{
            position: "absolute", left: lx - w / 2, top: LBL_T, width: w,
            textAlign: "center", lineHeight: 1, whiteSpace: "nowrap",
            ...label(mFs, INK), textShadow: SHADOW, opacity: Math.min(1, mIn * 2),
          }}
        >
          {markerLabel}
        </div>
      )}

      {/* where it started: the foot of the zero line */}
      <div
        style={{
          position: "absolute", left: x0, top: BASE_T, lineHeight: 1, whiteSpace: "nowrap",
          ...label(sFs, INK), textShadow: SHADOW, opacity: drawn,
        }}
      >
        {startLabel}
      </div>

      {/* the steps: one slot each, truncated to its slot, so none can ever touch */}
      {mode === "moving" &&
        st.map((s0, i) => {
          const s = sp(stepAt(i));
          if (s <= 0.02) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: x0 + slot * i + slot * 0.03, top: ROW_M, width: slot * 0.94,
                textAlign: "center", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                ...label(stFs, MUTED), textShadow: SHADOW, opacity: Math.min(1, s * 2),
              }}
            >
              {s0}
            </div>
          );
        })}

      {/* how far it actually got, called out beside the collapsed dimension */}
      {mode === "stuck" && zS > 0 && (
        <>
          <div
            style={{
              position: "absolute", left: x0 + trackW * 0.55 - w / 2, top: ZERO_T, width: w, textAlign: "center",
              fontFamily: MONO_FONT, fontSize: zFs, fontWeight: 600, lineHeight: 1, color: ACCENT,
              textShadow: SHADOW, opacity: Math.min(1, zS * 2), transform: `scale(${0.84 + 0.16 * zS})`,
            }}
          >
            0
          </div>
          <div
            style={{
              position: "absolute", left: x0 + trackW * 0.55 - w / 2, top: CAP_T, width: w, textAlign: "center",
              lineHeight: 1, whiteSpace: "nowrap",
              ...label(sFs, MUTED), textShadow: SHADOW, opacity: Math.min(1, zS * 2),
            }}
          >
            {measureLabel}
          </div>
        </>
      )}

      {/* the axis that only exists when you are actually moving */}
      {mode === "moving" && lT > 0 && (
        <div
          style={{
            position: "absolute", left: 0, top: BASE_T, width: x1, textAlign: "right",
            lineHeight: 1, whiteSpace: "nowrap",
            ...label(lFs, INK), textShadow: SHADOW, opacity: Math.min(1, lT * 2),
          }}
        >
          {measureLabel}
        </div>
      )}
    </div>
  );
};
