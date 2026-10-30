import React from "react";
import { spring } from "remotion";
import type { CardProps } from "../props";
import { Chip, chipFs, clamp01, easeInOut, easeOut } from "./shared";
import {
  BundleStack, DocPage, EnvelopeFace, GROUND, InkHand, LetterPage, LY, PAGE_H, PAGE_W,
  PrinterMouth, SpeedLines, bundleSize,
} from "./Aparts";

// edit-i-oneshot, family A: the paper. One bundle, one letter, one envelope, each coming back
// changed. V1 the bundle is stolen off the wall on the punch word; V4 the letter is written and
// printed; V5 the camera settles on its three parts; V15 the same letter, unfolded, is read line by
// line; V20 the top letter of the bundle flips into the setup guide. Every word on screen is their.

const sp = (tMs: number, at: number, fps: number, damping = 14, stiffness = 320, mass = 0.7): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping, stiffness, mass } });

/** 0 before `a`, 1 after `a + ms`, eased */
const ramp = (tMs: number, a: number, ms: number): number => easeInOut(clamp01((tMs - a) / ms));

// ─────────────────────────────────────────────────────────────────────────────
// V1 bundle: "a method that actually worked for us, that you can steal."
// A hundred hand delivered letters land on the wall; on the punch word a hand comes in
// from the right and takes the whole stack; then it comes back holding one.
// ─────────────────────────────────────────────────────────────────────────────

export type BundleData = { name: string };

const FACE_W = 430;
const STEP = 3;
const HAND_W = 344;

const Bundle: React.FC<CardProps & { data: BundleData }> = ({ tMs, w, h, fps, beats, data }) => {
  const b = beats;
  const bs = bundleSize(FACE_W, STEP);
  const bx = (w - FACE_W) / 2;
  const by = (h - bs.h) / 2;

  // it drops in and lands with one bounce
  const drop = sp(tMs, b.pop, fps, 9, 420, 0.8);
  const dropY = (1 - drop) * -210;
  // a frameless card draws outside itself: fade the fall in so nothing streaks across
  // the top tenth of the frame, where the platforms put their own chrome
  const dropIn = clamp01((tMs - b.pop) / 150);

  // the hand arrives, then takes it: one accelerating movement off the right edge
  const GRAB = b.steal + 200;          // 3625: the fingers are on the stack
  const GONE = b.steal + 437;          // 3862: off the frame, five frames before `part`
  const handIn = easeOut(clamp01((tMs - b.steal) / 200));
  const yp = clamp01((tMs - GRAB) / (GONE - GRAB));
  const yank = Math.pow(yp, 1.9) * 1000;
  const stealing = tMs >= b.steal && tMs < GONE;
  const bare = tMs >= GONE && tMs < b.hand;

  // it comes back with one envelope held out
  const ENV_W = 470;
  const envH = Math.round(ENV_W / 1.414);
  const envX = 150;
  const envY = (h - envH) / 2;
  const back = easeOut(clamp01((tMs - b.hand) / 330));
  const backX = (1 - back) * 780;

  if (bare) return <div style={{ position: "absolute", inset: 0 }} />;

  if (tMs >= b.hand) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `translateX(${backX}px)` }}>
          <div style={{ position: "absolute", left: envX, top: envY, width: ENV_W, height: envH, transform: "rotate(-2.2deg)" }}>
            <EnvelopeFace w={ENV_W} name={data.name} />
          </div>
          {/* the fingers lie across the envelope below the name: it is held out, not laid down */}
          <div
            style={{
              position: "absolute", left: 376, top: 176, transform: "rotate(-5deg)", transformOrigin: "100% 50%",
              filter: "drop-shadow(0 6px 11px rgba(0,0,0,0.24))",
            }}
          >
            <InkHand w={HAND_W} />
          </div>
        </div>
      </div>
    );
  }

  const handX = w + 300 - (w + 300 - 424) * handIn + yank;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: bx, top: by + dropY, width: FACE_W, height: bs.h, opacity: dropIn, transform: `translateX(${yank}px)` }}>
        {stealing && yank > 14 && (
          <div style={{ position: "absolute", left: 0, top: 6, width: 1, height: bs.h - 12 }}>
            <SpeedLines h={bs.h - 12} travel={yank} />
          </div>
        )}
        <BundleStack faceW={FACE_W} step={STEP} name={data.name} />
      </div>
      {tMs >= b.steal && (
        <div style={{ position: "absolute", left: handX, top: 148, transform: "rotate(-11deg)", transformOrigin: "100% 50%" }}>
          <InkHand w={HAND_W} />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V4 letter + V5 letterbody: the same document, one camera. The scene is the printer's
// mouth across the card top, the letter under it and two more pages behind; the camera
// sits where the beats need it and the page is the only thing that is ever new.
// ─────────────────────────────────────────────────────────────────────────────

export type LetterData = { name: string; from: string; greeting: string; counter: string };
export type LetterbodyData = { chips: string[] };

const MOUTH_H = 46;
const PAGE_TOP_OUT = -112;   // `then`: the page is out as far as the greeting, blank
const PAGE_TOP_FED = 60;     // `printed`: fed the rest of the way down
const PAGE_TOP_BODY = -238;  // V5: the camera settled on the three paragraphs
const CAM_X_BODY = 158;
const FEED_MS = 620;
const PRINT_FRONT_0 = 240;
const PRINT_FRONT_1 = 790;

const LetterScene: React.FC<{
  w: number; h: number; pageY: number; camX: number; camY: number; printFrontY: number;
  greetChars: number; accentName: boolean; fan: number; extra: number;
  copy: LetterData; highlights?: number[]; counter?: React.ReactNode;
}> = ({ w, h, pageY, camX, camY, printFrontY, greetChars, accentName, fan, extra, copy, highlights, counter }) => {
  const x0 = (w - PAGE_W) / 2 + camX;
  const y0 = pageY + camY;
  const backs = [
    { dx: 13, dy: 9, rot: 2.6 },
    { dx: 26, dy: 18, rot: 5.4 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: GROUND, overflow: "hidden" }}>
      {backs.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: x0 + p.dx, top: y0 + p.dy, width: PAGE_W, height: PAGE_H,
            backgroundColor: "#FBFAF6", border: "1px solid rgba(20,22,31,0.14)", boxSizing: "border-box",
            boxShadow: "0 6px 16px rgba(0,0,0,0.14)", opacity: extra,
            transform: `rotate(${p.rot * fan}deg)`, transformOrigin: "50% 100%",
          }}
        />
      ))}
      <div style={{ position: "absolute", left: x0, top: y0, width: PAGE_W, height: PAGE_H }}>
        <LetterPage
          from={copy.from}
          greeting={copy.greeting}
          nameInGreeting={copy.name}
          greetChars={greetChars}
          accentName={accentName}
          printFrontY={printFrontY}
          highlights={highlights}
        />
      </div>
      <div style={{ position: "absolute", left: -220 + camX, top: camY, width: w + 440, height: MOUTH_H }}>
        <PrinterMouth w={w + 440} h={MOUTH_H} />
      </div>
      {counter}
    </div>
  );
};

const CPS = 40;

const Letter: React.FC<CardProps & { data: LetterData }> = ({ tMs, w, h, fps, beats, data }) => {
  const b = beats;
  const feed = ramp(tMs, b.printed, FEED_MS);
  const pageY = PAGE_TOP_OUT + (PAGE_TOP_FED - PAGE_TOP_OUT) * feed;
  const printFrontY = PRINT_FRONT_0 + (PRINT_FRONT_1 - PRINT_FRONT_0) * feed;
  const greetChars = Math.max(0, ((tMs - b.wrote) / 1000) * CPS);
  const fan = ramp(tMs, b.letters, 400);
  const extra = clamp01((tMs - b.printed) / 260);

  const cu = clamp01((tMs - b.each) / 380);
  const count = Math.round(1 + 99 * (1 - Math.pow(1 - cu, 2)));
  const cs = sp(tMs, b.each, fps, 15, 340, 0.7);
  const counter = tMs >= b.each ? (
    <div style={{ position: "absolute", right: 38, bottom: 34, opacity: Math.min(1, cs * 1.6), transform: `scale(${0.85 + 0.15 * cs})`, transformOrigin: "100% 100%" }}>
      <Chip text={cu >= 1 ? data.counter : String(count)} fs={chipFs(w)} />
    </div>
  ) : null;

  return (
    <LetterScene
      w={w} h={h} pageY={pageY} camX={0} camY={0} printFrontY={printFrontY}
      greetChars={greetChars} accentName={tMs >= b.personalised} fan={fan} extra={extra}
      copy={data} counter={counter}
    />
  );
};

const SETTLE_MS = 540;

const Letterbody: React.FC<CardProps & { data: LetterbodyData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const b = beats;
  const s = ramp(tMs, fromMs, SETTLE_MS);
  const camY = (PAGE_TOP_BODY - PAGE_TOP_FED) * s;
  const camX = CAM_X_BODY * s;
  const pageCardY = PAGE_TOP_FED + camY;

  // the three parts of the letter, each swept then named, in the order the creator says them
  const at = [b.story, b.results, b.built];
  const highlights: number[] = [];
  for (let i = 0; i < 6; i++) highlights.push(clamp01((tMs - at[Math.floor(i / 2)] - (i % 2) * 200) / 210));

  const x0 = (w - PAGE_W) / 2 + camX;
  const copy: LetterData = { name: "Matthew", from: "the guest", greeting: "Dear Matthew,", counter: "" };

  // the count from V4 hands over at full opacity and leaves while the camera settles
  const counter = (
    <div style={{ position: "absolute", right: 38, bottom: 34, opacity: 1 - clamp01((tMs - fromMs) / 420) }}>
      <Chip text="100" fs={chipFs(w)} />
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <LetterScene
        w={w} h={h} pageY={PAGE_TOP_FED} camX={camX} camY={camY} printFrontY={PRINT_FRONT_1}
        greetChars={99} accentName fan={1} extra={1}
        copy={copy} highlights={highlights} counter={counter}
      />
      {data.chips.map((text, i) => {
        const s2 = sp(tMs, at[i], fps, 15, 340, 0.7);
        if (tMs < at[i]) return null;
        return (
          <div
            key={text}
            style={{
              position: "absolute", right: w - (x0 - 20), top: pageCardY + LY.para[i] + 40,
              transform: `translateY(-50%) scale(${0.85 + 0.15 * s2})`, transformOrigin: "100% 50%",
              opacity: Math.min(1, s2 * 1.6),
            }}
          >
            <Chip text={text} fs={25} />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V15 read: "But a genuine letter usually gets read." The same letter, taken out of the
// envelope and flattened, its two creases still in it, read one line at a time.
// ─────────────────────────────────────────────────────────────────────────────

export type ReadData = { lineEveryMs: number };

const READ_CAM_Y = -190;
const THIRD = PAGE_H / 3;

const Read: React.FC<CardProps & { data: ReadData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const b = beats;
  // it comes out of the envelope: the two folded thirds flatten onto the middle one,
  // finished on `genuine`, and the creases stay in the paper
  const open = easeOut(clamp01((tMs - fromMs) / Math.max(1, b.genuine - fromMs)));
  const sy = 0.42 + 0.58 * open;
  const every = data.lineEveryMs || 150;

  const highlights: number[] = [];
  for (let i = 0; i < 6; i++) highlights.push(clamp01((tMs - (b.usually + i * every)) / 120));

  const x0 = (w - PAGE_W) / 2;
  const page = (
    <LetterPage
      from="the guest" greeting="Dear Matthew," nameInGreeting="Matthew"
      accentName printFrontY={PAGE_H} creases={1} highlights={highlights} shadow={false} mark="read"
    />
  );

  const third = (i: number, origin: string, scaleY: number) => (
    <div
      key={i}
      style={{
        position: "absolute", left: 0, top: i * THIRD, width: PAGE_W, height: THIRD + (i === 1 ? 1 : 0),
        overflow: "hidden", transform: `scaleY(${scaleY})`, transformOrigin: origin,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: -i * THIRD, width: PAGE_W, height: PAGE_H }}>{page}</div>
      {scaleY < 1 && <div style={{ position: "absolute", inset: 0, backgroundColor: "#000000", opacity: (1 - scaleY) * 0.22 }} />}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: GROUND, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x0, top: READ_CAM_Y, width: PAGE_W, height: PAGE_H, boxShadow: "0 8px 22px rgba(0,0,0,0.20)" }} />
      <div style={{ position: "absolute", left: x0, top: READ_CAM_Y, width: PAGE_W, height: PAGE_H }}>
        {sy > 0.997 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: PAGE_H }}>{page}</div>
        ) : (
          <>
            {third(0, "50% 100%", sy)}
            {third(1, "50% 50%", 1)}
            {third(2, "50% 0%", sy)}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V20 guides: "I've still got the letters we sent, and I turned them into setup guides."
// The bundle comes back, and its top letter flips over into the page the creator will send.
// ─────────────────────────────────────────────────────────────────────────────

export type GuidesData = { title: string; headings: string[] };

const G_FACE_W = 300;
const G_STEP = 2.7;
const G_LAYERS = 26;
const DOC = { x: 400, y: 44, w: 552, h: 470 };

const Guides: React.FC<CardProps & { data: GuidesData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const b = beats;
  const bs = bundleSize(G_FACE_W, G_STEP, G_LAYERS);
  const bx = 74;
  const byy = (h - bs.h) / 2;
  const land = sp(tMs, fromMs, fps, 11, 260, 0.9);
  const dropY = (1 - land) * -340;

  const FLIP_MS = 480;
  const f = clamp01((tMs - b.turned) / FLIP_MS);
  const fe = easeInOut(f);
  const flipping = tMs >= b.turned;
  const ang = 180 * fe;
  const faceH = Math.round(G_FACE_W / 1.414);

  const curX = bx + (DOC.x - bx) * fe;
  const curY = byy + (DOC.y - byy) * fe - Math.sin(Math.PI * fe) * 64;
  const curW = G_FACE_W + (DOC.w - G_FACE_W) * fe;
  const curH = faceH + (DOC.h - faceH) * fe;

  const tp = (a: number, ms: number) => clamp01((tMs - a) / ms);
  const typed = [tp(b.guides, 200), tp(b.guides + 120, 180), tp(b.guides + 240, 180), tp(b.guides + 360, 180)];

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: GROUND, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: bx, top: byy + dropY, width: G_FACE_W, height: bs.h }}>
        <BundleStack faceW={G_FACE_W} step={G_STEP} layers={G_LAYERS} name="Mr. Matthew" />
      </div>
      {flipping && (
        <div
          style={{
            position: "absolute", left: curX, top: curY, width: curW, height: curH,
            transform: `perspective(1500px) rotateY(${ang}deg)`, transformStyle: "preserve-3d",
          }}
        >
          {ang < 90 ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: G_FACE_W, height: faceH, transform: `scale(${curW / G_FACE_W}, ${curH / faceH})`, transformOrigin: "0 0" }}>
              <EnvelopeFace w={G_FACE_W} name="Mr. Matthew" />
            </div>
          ) : (
            <div style={{ position: "absolute", left: 0, top: 0, width: curW, height: curH, transform: "rotateY(180deg)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: DOC.w, height: DOC.h, transform: `scale(${curW / DOC.w}, ${curH / DOC.h})`, transformOrigin: "0 0" }}>
                <DocPage w={DOC.w} h={DOC.h} title={data.title} headings={data.headings} typed={typed} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  bundle: Bundle as React.FC<CardProps & { data: any }>,
  letter: Letter as React.FC<CardProps & { data: any }>,
  letterbody: Letterbody as React.FC<CardProps & { data: any }>,
  read: Read as React.FC<CardProps & { data: any }>,
  guides: Guides as React.FC<CardProps & { data: any }>,
};
