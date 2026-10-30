// "But the only way to protect yourself is through your browser. Which browser you choose matters. Because this
// technique is so well known, a lot of browsers have already taken steps to stop it."
// Chrome arrives big and centred, spinning in, and is named; on "browser." it moves into slot 0 of the row as Safari,
// Firefox and Brave rise into theirs, all landing together. A cursor hovers across the four on "Which browser you
// choose"; on "matters." an empty verdict slot opens under each. On "technique" the audio signal runs through the row;
// the marks bob on "browsers"; on "stop" the signal goes flat and the laptop's hash slides in above the row, landing
// on "it.". End state = the start of `browsers`: four marks at ROW, four empty SLOTs, the hash line.
import React from "react";
import { Cursor, Travel, arrive, blurOut, ease, prog, typeOn, useScene } from "../../../src/engine";
import { Logo, ROW, rowX } from "./parts";
import { HashLine, RowWave, VerdictSlot } from "./ChooseBits";

const BIG = { x: 540, y: 1000, size: 300 };
const MOVE = 24; // the row assembling: Chrome's move and the others' rise land on the same frame
const NAME = "Google Chrome";

export const Choose: React.FC = () => {
  const { f, fps, cue, endsOn, scene, theme, ground } = useScene();
  const enter = scene.from - 6;
  const browser = cue("browser");
  const hover = [cue("browser", 2), cue("you"), cue("choose"), cue("choose") + 12];
  const matters = cue("matters");
  const technique = cue("technique");
  const bob = cue("browsers");
  const stop = cue("stop");
  const hashAt = endsOn("it", 16);
  const hashP = arrive(f, hashAt, 16);
  const hashBlur = Math.min(10, 260 * (hashP - arrive(f - 1, hashAt, 16)) * 0.3);

  // Chrome: big centre (spinning in), then into slot 0
  const inP = arrive(f, enter, 28);
  const m = arrive(f, browser, MOVE);
  const cx = BIG.x + (rowX(0) - BIG.x) * m;
  const cy = BIG.y + 900 * (1 - inP) + (ROW.y - BIG.y) * m;
  const size = BIG.size + (ROW.size - BIG.size) * m;
  const spin = -200 * (1 - inP);
  const breathe = 1 + 0.02 * Math.sin((f - enter) / 16) * (1 - m);
  const name = typeOn(NAME, f, cue("only"), fps, 45);

  // hover: each mark lifts while the cursor rests on it
  const lift = (i: number) => {
    const a = hover[i] - 4;
    const b = i < 3 ? hover[i + 1] - 4 : matters - 2;
    return prog(f, a, 6, ease.out) * (1 - prog(f, b, 6, ease.out));
  };
  const bobY = (i: number) => -16 * Math.sin(Math.PI * prog(f, bob + i * 6, 18, ease.inOut));
  const markY = (i: number) => ROW.y - 18 * lift(i) + bobY(i);

  const waveDrawn = prog(f, technique, 30, ease.out);
  const amp = 1 - prog(f, stop, 12, ease.inOut);
  const waveGone = prog(f, stop + 10, 8, ease.linear);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {f >= technique && waveGone < 1 && <RowWave drawn={waveDrawn} amp={amp} phase={(f - technique) * 3} opacity={1 - waveGone} />}

      {[0, 1, 2, 3].map((i) => <VerdictSlot key={i} i={i} open={prog(f, matters + i * 5, 12, ease.out)} />)}

      {/* Chrome, one object from the big centre to its slot */}
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2 - 18 * lift(0) + bobY(0), width: size, height: size, transform: `rotate(${spin.toFixed(2)}deg) scale(${(breathe * (1 + 0.06 * lift(0))).toFixed(4)})`, opacity: prog(f, enter, 3, ease.linear) }}>
        <Logo name="chrome" size={size} />
      </div>
      {f < browser + 8 && (
        <div style={{ position: "absolute", left: 0, width: 1080, top: BIG.y + BIG.size / 2 + 40, textAlign: "center", fontFamily: theme.font.ui, fontSize: 52, fontWeight: 700, color: ground.ink, ...(f >= browser ? blurOut(f, browser, { dur: 7 }) : {}) }}>
          {name.text}
          {f >= cue("only") && f < browser && <span style={{ display: "inline-block", width: 4, height: 50, marginLeft: 4, verticalAlign: "middle", background: Math.floor(f / 20) % 2 ? "transparent" : ground.ink }} />}
        </div>
      )}

      {/* Safari, Firefox, Brave rise into their slots: starts staggered, landings together */}
      {(["safari", "firefox", "brave"] as const).map((n, j) => {
        const i = j + 1;
        const at = browser + 4 * i;
        return (
          <Travel key={n} curve="measured" at={at} from="bottom" dist={380} dur={MOVE - 4 * i} style={{ position: "absolute", left: rowX(i) - ROW.size / 2, top: markY(i) - ROW.size / 2 }}>
            <div style={{ transform: `scale(${(1 + 0.06 * lift(i)).toFixed(4)})` }}>
              <Logo name={n} size={ROW.size} />
            </div>
          </Travel>
        );
      })}

      <Cursor
        path={[
          { f: hover[0] - 10, x: 560, y: 1060 },
          ...[0, 1, 2, 3].map((i) => ({ f: hover[i], x: rowX(i) - 4, y: ROW.y + 20 })),
          { f: matters, x: rowX(3) + 40, y: ROW.y + 60 },
        ]}
        until={matters}
      />

      {/* L1 travel with a velocity-linked horizontal smear, so it is sharp on "it." (a held blur would still be on) */}
      {f >= hashAt && <HashLine style={{ transform: `translateX(${(-260 * (1 - hashP)).toFixed(2)}px)`, opacity: prog(f, hashAt, 2, ease.linear), filter: hashBlur > 0.3 ? `blur(${hashBlur.toFixed(2)}px)` : undefined }} />}
    </div>
  );
};
