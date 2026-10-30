// "And this is what's called fingerprinting. Every computer processes that audio signal a little differently,
// depending on the processor, sound card, drivers, and operating system. We're talking about tiny differences.
// Nothing you'd ever notice, but enough to create a fingerprint for your computer."
// The laptop card `sound` left under the AliExpress window takes the word as its title; the word is named big; the
// window lifts away and the laptop becomes three, the same sawtooth on each screen; their analysers draw spectra; the
// four causes light one per word; a loupe reads the real published values; then the reel's one big move: everything
// folds into one line, the real hash, stamped into the middle laptop's device ID.
import React from "react";
import { blurIn, blurOut, ease, leave, prog, typeOn, useScene } from "../../../src/engine";
import { ChromeWindow, DeviceCard, HANDOFF, Logo } from "./parts";
import { AliPage as SoundAliPage } from "./SoundPage";
import { AliTab, FingerprintIcon, LAP, Laptop, Loupe, Saw, SpecStrip, Spectrum } from "./FingerprintBits";
import { Beats, CARD_LAP, FingerprintFinale, jolt, useBeats } from "./FingerprintFinale";

const WIN = HANDOFF.soundWindow;
const DEV = HANDOFF.device;
const S = 280 / LAP.w; // a laptop in the row
const ROW_TOP = 700;
const slot = (i: number) => ({ left: 540 + (i - 1) * 300 - 140, top: ROW_TOP });
const NAME = { top: 894, header: 590 };
const lerp = (k: number, a: number, b: number) => a + (b - a) * k;

/** the card as `sound` hands it over: its title backspaces on "called" and the word types in */
export const cardTitle = (f: number, b: Beats, fps: number) => {
  const old = "This computer";
  if (f < b.called) return { text: old, typing: false };
  const typed = typeOn("Fingerprinting", f, b.fp - 4, fps);
  if (f < b.fp - 4) return { text: old.slice(0, Math.max(0, old.length - Math.floor((f - b.called) / 2))), typing: true };
  return typed;
};

/** 24.0 s to "Every": the window, the signal running down into the card, the card taking the name */
const Opening: React.FC<{ b: Beats }> = ({ b }) => {
  const { f, fps } = useScene();
  const up = leave(f, b.every, 11);
  const t = cardTitle(f, b, fps);
  return (
    <>
      {f < b.every + 12 && (
        <div style={{ position: "absolute", left: WIN.left, top: WIN.top, transform: `translateY(${(-1150 * up).toFixed(1)}px) scale(${WIN.scale})`, transformOrigin: "top left", opacity: 1 - prog(f, b.every + 8, 3) }}>
          <ChromeWindow favicon={<Logo name="aliexpress" size={32} />} tabTitle={<AliTab />} url="aliexpress.com">
            <SoundAliPage at={-10000} scrollAt={-10000} />
          </ChromeWindow>
        </div>
      )}
      {/* the signal running from the tab down into the laptop, until the name takes the gap */}
      {f < b.fpEnd && (
        <div style={{ position: "absolute", left: 540 - 70, top: 860 + 70 - 12, width: 140, height: 24, transform: "rotate(90deg)", ...(f < b.fp ? { opacity: 1 } : blurOut(f, b.fp, { dur: 8 })) }}>
          <Saw w={140} h={24} phase={f * 1.4} period={18} stroke={3} />
        </div>
      )}
      {f < b.every + 8 && (
        <div style={{ position: "absolute", left: DEV.left, top: DEV.top, ...(f < b.every ? {} : blurOut(f, b.every, { dur: 6 })) }}>
          <DeviceCard
            title={
              <span>
                {t.text}
                {t.typing && <span style={{ display: "inline-block", width: 3, height: 40, marginLeft: 2, verticalAlign: "middle", background: "#F2F2F2" }} />}
              </span>
            }
            value=""
            caret
          />
        </div>
      )}
    </>
  );
};

/** the name, big: rises out of the card when it has been typed, then rides up to be the scene's header */
const Name: React.FC<{ b: Beats }> = ({ b }) => {
  const { f, theme, ground } = useScene();
  const at = b.fp + 22;
  const up = prog(f, b.every, 14, ease.inOut); // clears the way before the laptop rises through
  const squeeze = prog(f, b.big - 16, 6, ease.in);
  if (f < at || f >= b.big - 10) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: lerp(up, NAME.top, NAME.header), display: "flex", justifyContent: "center", ...blurIn(f, at, { dur: 10, rise: 60, scaleFrom: 0.85 }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, transform: `scale(${lerp(up, 1, 0.9)}, ${lerp(up, 1, 0.9) * (1 - 0.95 * squeeze)})` }}>
        <FingerprintIcon size={72} at={at} />
        <div style={{ fontFamily: theme.font.ui, fontSize: 68, lineHeight: "72px", fontWeight: 800, color: ground.ink, letterSpacing: -1 }}>Fingerprinting</div>
      </div>
    </div>
  );
};

/** one laptop of the row; i = 1 is the one that was the card and becomes the card again */
const RowLaptop: React.FC<{ i: number; b: Beats }> = ({ i, b }) => {
  const { f } = useScene();
  const home = slot(i);
  const mid = slot(1);
  let pos = { left: home.left, top: home.top, s: S };
  let op = 1;
  if (i === 1) {
    const k = prog(f, b.every + 6, 18, ease.inOut); // out of the card, up into the row
    const back = prog(f, b.but + 14, 22, ease.inOut); // back down into the card
    const inRow = { left: lerp(k, CARD_LAP.left, mid.left), top: lerp(k, CARD_LAP.top, mid.top), s: lerp(k, 1, S) };
    pos = { left: lerp(back, inRow.left, CARD_LAP.left), top: lerp(back, inRow.top, CARD_LAP.top), s: lerp(back, inRow.s, 1) };
  } else {
    const split = Math.max(b.computer + 4, b.every + 22);
    const out = prog(f, split, 16, ease.inOut); // copied from the middle one's own position
    const merge = prog(f, b.but, 22, ease.inOut); // and folded back into it
    const k = out * (1 - merge);
    pos = { left: lerp(k, mid.left, home.left), top: home.top, s: S };
    op = (f < split ? 0 : 1) * (1 - prog(f, b.but + 14, 8));
  }
  const dim = 1 - 0.62 * prog(f, b.tiny, 8) + 0.62 * prog(f, b.notice, 10);
  const drift = b.lit.reduce((n, at) => n + prog(f, at, 10), 0);
  const grow = prog(f, b.diff + i * 4, 22, ease.out);
  const squeeze = i === 1 ? prog(f, b.big - 16, 6, ease.in) : 0;
  const sawOn = 1 - prog(f, b.diff, 8) + (i === 1 ? prog(f, b.big + 8, 10) : 0);
  const screen = (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, sawOn) }}>
        <Saw w={LAP.sw} h={LAP.sh} phase={f * 1.2} period={26} stroke={3} />
      </div>
      {f < b.big - 10 && <Spectrum w={LAP.sw} h={LAP.sh} seed={i + 1} grow={grow} drift={drift} squeeze={squeeze} />}
    </>
  );
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", left: pos.left, top: pos.top + (i === 1 ? jolt(f, b.big) : 0), transform: `scale(${pos.s})`, transformOrigin: "top left", opacity: op * (i === 1 && f >= b.but ? 1 : dim) }}>
      <Laptop screen={screen} />
    </div>
  );
};

export const Fingerprint: React.FC = () => {
  const { f } = useScene();
  const b = useBeats();
  const R = 260;
  const loupeY = -80 * (1 - prog(f, b.tiny, 14, ease.out)) - 110 * prog(f, b.notice, 11, ease.in);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <Opening b={b} />
      <Name b={b} />
      {f >= b.depending && f < b.tiny + 8 && (
        <div style={{ position: "absolute", left: 190, top: 1010, ...(f < b.tiny ? {} : blurOut(f, b.tiny, { dur: 7 })) }}>
          <SpecStrip lit={b.lit.filter((at) => f >= at)} at={b.depending} />
        </div>
      )}
      {f >= b.big - 60 && <FingerprintFinale b={b} />}
      {f >= b.every && [0, 2, 1].map((i) => <RowLaptop key={i} i={i} b={b} />)}
      {f >= b.tiny && f < b.notice + 12 && (
        <div style={{ position: "absolute", left: 540 - R, top: 930, transform: `translateY(${loupeY.toFixed(1)}px) scale(${(1.06 - 0.06 * prog(f, b.tiny, 14, ease.out) + 0.04 * prog(f, b.notice, 11)).toFixed(4)})`, opacity: prog(f, b.tiny, 4) * (1 - prog(f, b.notice + 4, 8)), filter: f > b.notice + 2 ? `blur(${(prog(f, b.notice + 2, 8) * 10).toFixed(1)}px)` : undefined }}>
          <Loupe at={b.tiny} R={R} />
        </div>
      )}
    </div>
  );
};
