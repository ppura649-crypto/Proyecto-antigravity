// The end of `fingerprint`, the reel's one big move. The row has folded back into one laptop and the card has formed
// around it; on "fingerprint" the spectrum and the name, already squeezed flat, shoot into the device ID as two lines
// and the real hash stamps there: 14 frames up to 121 %, 16 back, the card taking the hit. Then the card is named
// for whose it is: "your computer".
import React from "react";
import { blurIn, ease, prog, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { DeviceCard, HANDOFF, HASH, MINT, WAVE, mixHex, shortHash } from "./parts";
import { LAP } from "./FingerprintBits";

const DEV = HANDOFF.device;
/** where DeviceCard draws its laptop: padding 40, vertically centred */
export const CARD_LAP = { left: DEV.left + 40, top: DEV.top + (DEV.height - LAP.h) / 2 };
/** DeviceCard's value field, measured on the render */
export const FIELD = { left: DEV.left + 40 + LAP.w + 34, top: 1188, width: DEV.width - 80 - LAP.w - 34, height: 64 };

export function useBeats() {
  const { cue, cueEnd, scene } = useScene();
  return {
    start: scene.from - LEAD,
    called: cue("called"),
    fp: cue("fingerprinting."),
    fpEnd: cueEnd("fingerprinting."),
    every: cue("every"),
    computer: cue("computer"),
    diff: cue("differently,"),
    depending: cue("depending"),
    lit: [cue("processor,"), cue("sound"), cue("drivers,"), cue("operating")],
    tiny: cue("tiny"),
    notice: cue("notice,"),
    but: cue("but"),
    big: cue("fingerprint"),
    your: cue("your"),
  };
}
export type Beats = ReturnType<typeof useBeats>;

/** the card taking the stamp: pushed down on impact, springing back */
export const jolt = (f: number, big: number) => (f < big + 2 ? 0 : 12 * Math.exp(-(f - big - 2) / 4) * Math.cos((f - big - 2) / 3));

/** the stamp's scale: the reel's only large overshoot */
const stamp = (f: number, big: number) =>
  f < big + 14 ? 0.3 + 0.91 * prog(f, big, 14, ease.out) : 1.21 - 0.21 * prog(f, big + 14, 16, ease.out);

/** a flat bright line travelling from (x0,y0,w0) to the field between a and b */
const Streak: React.FC<{ a: number; b: number; x0: number; y0: number; w0: number }> = ({ a, b, x0, y0, w0 }) => {
  const { f } = useScene();
  if (f < a || f >= b + 2) return null;
  const k = prog(f, a, b - a, ease.in);
  const x = x0 + (FIELD.left + 18 - x0) * k;
  const y = y0 + (FIELD.top + FIELD.height / 2 - y0) * k;
  const w = w0 + (FIELD.width - 36 - w0) * k;
  const v = Math.abs(prog(f, a, b - a, ease.in) - prog(f - 1, a, b - a, ease.in));
  return (
    <div style={{ position: "absolute", left: x, top: y - 3, width: w, height: 6, borderRadius: 3, background: mixHex(WAVE, MINT, k), boxShadow: `0 0 18px ${MINT}`, filter: `blur(${Math.min(6, v * 30).toFixed(1)}px)`, opacity: 1 - prog(f, b, 2) }} />
  );
};

export const FingerprintFinale: React.FC<{ b: Beats }> = ({ b }) => {
  const { f, fps, theme } = useScene();
  const cardAt = b.but + 24;
  const settled = b.big + 30;
  const title = f < b.your - 2 ? { text: "Fingerprinting", typing: false } : typeOn("Your computer", f, b.your - 2, fps);
  const y = jolt(f, b.big);
  const s = stamp(f, b.big);
  const flash = f < b.big ? 0 : 1 - prog(f, b.big, 26, ease.out);
  if (f < cardAt) return null;
  return (
    <>
      <div style={{ position: "absolute", left: DEV.left, top: DEV.top, transform: `translateY(${y.toFixed(2)}px)`, ...blurIn(f, cardAt, { dur: 10, scaleFrom: 0.97 }) }}>
        <DeviceCard
          title={
            <span>
              {title.text}
              {title.typing && <span style={{ display: "inline-block", width: 3, height: 40, marginLeft: 2, verticalAlign: "middle", background: "#F2F2F2" }} />}
            </span>
          }
          value={f >= settled ? shortHash(HASH) : ""}
          caret={f < b.big - 10}
        />
      </div>
      {/* the spectrum's line from the screen, the name's line from the header */}
      <Streak a={b.big - 10} b={b.big} x0={CARD_LAP.left + LAP.sx} y0={CARD_LAP.top + LAP.sy + LAP.sh / 2} w0={LAP.sw} />
      <Streak a={b.big - 10} b={b.big} x0={250} y0={626} w0={580} />
      {/* the field takes the hit: a mint rim that fades */}
      {flash > 0 && (
        <div style={{ position: "absolute", left: FIELD.left - 4, top: FIELD.top - 4 + y, width: FIELD.width + 8, height: FIELD.height + 8, borderRadius: 18, border: `4px solid ${MINT}`, boxShadow: `0 0 ${(40 * flash).toFixed(0)}px ${MINT}`, opacity: flash, boxSizing: "border-box" }} />
      )}
      {f >= b.big && f < settled && (
        <div style={{ position: "absolute", left: FIELD.left + 18, top: FIELD.top + y, height: FIELD.height, display: "flex", alignItems: "center", fontFamily: theme.font.mono, fontSize: 32, color: mixHex(MINT, "#F2F2F2", prog(f, b.big + 10, 20)), whiteSpace: "nowrap", transform: `scale(${s.toFixed(4)})`, transformOrigin: "50% 50%", opacity: prog(f, b.big, 3), filter: f < b.big + 4 ? `blur(${(8 * (1 - prog(f, b.big, 4))).toFixed(1)}px)` : undefined }}>
          {shortHash(HASH)}
        </div>
      )}
      {f >= b.big + 22 && (
        <div style={{ position: "absolute", left: 0, width: 1080, top: DEV.top + DEV.height + 24, textAlign: "center", fontFamily: theme.font.mono, fontSize: 26, color: "#8C8C8C", ...blurIn(f, b.big + 22, { dur: 9, rise: 12 }) }}>
          value measured on Alibaba&apos;s audio code · ritter.vg {/* texture: source line */}
        </div>
      )}
    </>
  );
};
