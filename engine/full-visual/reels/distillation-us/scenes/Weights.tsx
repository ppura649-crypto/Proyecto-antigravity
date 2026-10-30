// "Training changes the model's weights: the billions of numbers the model calculates with."
// The student arrives from `distill` exactly where it left it (HANDOFF.student). On "Training" its label clears and
// the camera dives into the Qwen mark until the frame is its violet inside. On
// "weights:" a wall of Qwen3 0.6B's real weights (layer 0, 4 decimals, tiled) is there, scrolling. On "billions" the
// wall pulls back into a texture and the count of Qwen3's largest open model rolls to 235,000,000,000.
import React from "react";
import { blurIn, blurOut, countTo, ease, mix, on, prog, useScene } from "../../../src/engine";
import { EMBED, HANDOFF, Logo, PARAMS, QWEN, W_BEFORE, fmt } from "./parts";

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const P = HANDOFF.student;

// the wall: every row is a real row of weights (layer 0's query slice, then the embedding rows, which are weights too),
// shifted round so the tiling never repeats a line side by side. 24 values a row: at full size six are in view.
const SOURCE = [...W_BEFORE, ...EMBED.slice(0, 6)];
const COLS = 24;
const ROWS = 76;
const CELL = 150;
const PITCH = 52;
const WALL = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const row = SOURCE[(r + Math.floor(c / 6) * 5) % SOURCE.length];
    return fmt(row[(c + r) % 6], 4);
  }),
);

/** the student as `distill` hands it over (HANDOFF.student): Qwen alone, centred, its label under it. On "Training"
 *  the label clears and the camera dives into the mark */
const Student: React.FC<{ go: number; dive: number }> = ({ go, dive }) => {
  const { f, theme, scene } = useScene();
  // the ground flips from distill's light to dark under the label: it keeps the ground's ink through the flip
  const ink = mix(f, scene.from - 3, 6, theme.grounds.light.ink, theme.grounds.dark.ink);
  const zoom = prog(f, go + 12, dive - go - 12, ease.in); // accelerating into the mark
  const s = 1 + 10 * zoom;
  return (
    <>
      <div
        style={{
          position: "absolute", left: P.cx - 200, width: 400, top: P.labelTop, textAlign: "center", lineHeight: "52px",
          fontFamily: theme.font.ui, fontSize: 44, fontWeight: 700, color: ink, ...blurOut(f, go, { dur: 6 }),
        }}
      >
        student
      </div>
      {f < dive + 4 && (
        <div
          style={{
            position: "absolute", left: P.cx - P.size / 2, top: P.cy - P.size / 2,
            transform: `scale(${s.toFixed(3)})`, opacity: 1 - prog(f, dive - 26, 14, ease.linear),
            filter: zoom > 0.35 ? `blur(${((zoom - 0.35) * 18).toFixed(1)}px)` : undefined,
          }}
        >
          <Logo name="qwen" size={P.size} />
        </div>
      )}
    </>
  );
};

const H_MASK = "linear-gradient(to right, transparent 60px, #000 130px, #000 950px, transparent 1020px)";

/** the inside: real weights in rows, drifting upward; on "billions" the whole sheet pulls back into a texture */
const Wall: React.FC<{ at: number; back: number }> = ({ at, back }) => {
  const { f, theme, ground } = useScene();
  const k = prog(f, back, 40, ease.inOut);
  const scale = lerp(1, 0.26, k);
  const drift = (f - at) * 0.9; // slow scroll, never stops
  const inn = blurIn(f, at - 12, { dur: 14, blur: 20, scaleFrom: 1.35 });
  return (
    <div
      style={{
        position: "absolute", left: 0, top: 540, width: 1080, height: 900, overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent 0, #000 90px, #000 810px, transparent 900px)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 90px, #000 810px, transparent 900px)",
      }}
    >
      <div style={{ ...inn, position: "absolute", left: 0, top: 0, width: 1080, height: 900, maskImage: H_MASK, WebkitMaskImage: H_MASK }}>
        <div
          style={{
            position: "absolute", left: 540 - (COLS * CELL) / 2, top: 450 - (ROWS * PITCH) / 2 - (drift % (PITCH * 14)) * 1,
            width: COLS * CELL, transform: `scale(${scale.toFixed(4)})`, transformOrigin: `${(COLS * CELL) / 2}px ${(ROWS * PITCH) / 2}px`,
            opacity: lerp(1, 0.42, k),
          }}
        >
          {WALL.map((row, r) => (
            <div key={r} style={{ display: "flex", height: PITCH, alignItems: "center" }}>
              {row.map((v, c) => (
                <div
                  key={c}
                  style={{
                    width: CELL, fontFamily: theme.font.mono, fontSize: 34, whiteSpace: "pre", fontVariantNumeric: "tabular-nums",
                    color: (r * 7 + c * 3) % 11 === 0 ? "#B9B6FF" : ground.ink, opacity: (r * 5 + c) % 4 === 0 ? 0.62 : 0.94,
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** "weights", named in plain words over the wall, gone when the wall pulls back */
const WallLabel: React.FC<{ at: number; back: number }> = ({ at, back }) => {
  const { f, theme, ground } = useScene();
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 548, display: "flex", justifyContent: "center", ...(f < back ? blurIn(f, at, { dur: 8, rise: 14 }) : blurOut(f, back, { dur: 8 })) }}>
      <div style={{ padding: "10px 30px", borderRadius: 14, background: "rgba(16,16,16,0.88)", boxShadow: `inset 0 0 0 3px ${QWEN}`, fontFamily: theme.font.ui, fontSize: 60, fontWeight: 700, color: ground.ink }}>
        weights
      </div>
    </div>
  );
};

/** the count of Qwen3's largest open model, rolling over the texture; exact before "calculates" */
const Count: React.FC<{ at: number; land: number }> = ({ at, land }) => {
  const { f, theme, ground } = useScene();
  const n = Math.round(countTo(f, at, land - at, 0, PARAMS.big));
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 850, display: "flex", justifyContent: "center", ...blurIn(f, at, { dur: 10, scaleFrom: 0.9 }) }}>
      <div style={{ padding: "34px 44px 30px", borderRadius: 20, background: "rgba(16,16,16,0.9)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily: theme.font.ui, fontSize: 92, fontWeight: 800, color: ground.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -1, lineHeight: "100px" }}>
          {n.toLocaleString("en-US")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, ...blurIn(f, at + 10, { dur: 9, rise: 10 }) }}>
          <Logo name="qwen" size={46} />
          <span style={{ fontFamily: theme.font.ui, fontSize: 40, fontWeight: 600, color: ground.ink }}>Qwen3 235B · 235 billion weights</span>
        </div>
      </div>
    </div>
  );
};

export const Weights: React.FC = () => {
  const { f, cue } = useScene();
  const go = cue("Training");
  const wallAt = cue("weights");
  const back = cue("billions");
  const land = cue("calculates") - 4;
  // Qwen's violet fills the frame as the camera passes through the mark, and stays: this is inside the student
  const tint = prog(f, go + 20, wallAt - go - 20, ease.in);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: tint, background: `radial-gradient(ellipse 80% 55% at 50% 52%, ${QWEN}55 0%, ${QWEN}22 55%, transparent 100%)` }} />
      {on(f, wallAt - 12) && <Wall at={wallAt} back={back} />}
      {on(f, wallAt) && <WallLabel at={wallAt} back={back} />}
      <Student go={go} dive={wallAt} />
      {on(f, back + 6) && <Count at={back + 6} land={land} />}
    </>
  );
};
