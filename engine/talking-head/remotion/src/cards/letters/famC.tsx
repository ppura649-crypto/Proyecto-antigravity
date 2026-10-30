import React from "react";
import type { CardProps } from "../props";
import { ACCENT, Chip, INK, PAPER, chipFs, chipFsBig, clamp01, easeInOut, easeOut } from "./shared";
import {
  Bell, Bin, Bubble, EnvelopeC5, FountainPen, HandSide, HandUnderBack, Ink, LetterPageContent,
  MonitorBack, NAME_BOX, NAME_VB, PAPER_BACK, SKIN, ThumbOver, WoodSlab, lerp, nameAt, pulse, seg01,
} from "./Cparts";

// edit-i-oneshot, family C: the envelope's whole life.
// V6 the letter folded into it and the name written in one continuous stroke, V8 the handover at a
// reception seen from the visitor's own eyes, V9 the same scene walking out, V11 the sealed letter
// that nobody opens and nobody bins. One envelope, drawn once, coming back changed every time.

const ER = 1.414;

// ─────────────────────────────────────────────────────────────────────────────
// V6 envelope: fold, insert, seal, then Mr. Matthew written by the nib
// ─────────────────────────────────────────────────────────────────────────────

const FoldingPage: React.FC<{ pw: number; ph: number; f1: number; f2: number }> = ({ pw, ph, f1, f2 }) => {
  const bh = ph / 3;
  const a1 = -178 * easeInOut(f1);
  const a2 = 177 * easeInOut(f2);
  const band = (key: string, top: number, originY: string, angle: number, prog: number, edge: "top" | "bottom") => {
    const front = Math.abs(angle) < 90;
    const shade = Math.abs(Math.sin((angle * Math.PI) / 180));
    return (
      <div key={key} style={{
        position: "absolute", left: 0, top, width: pw, height: bh, overflow: "hidden",
        transformOrigin: `50% ${originY}`, transform: `rotateX(${angle}deg)`,
        backgroundColor: front ? PAPER : PAPER_BACK, backfaceVisibility: "visible",
      }}>
        {front && (
          <div style={{ position: "absolute", left: 0, top: -top, width: pw, height: ph }}>
            <LetterPageContent pw={pw} ph={ph} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(28,24,16,${0.16 * shade})` }} />
        {edge && (
          <div style={{
            position: "absolute", left: 0, [edge]: 0, width: pw, height: 2.5,
            backgroundColor: `rgba(20,22,31,${0.30 * prog})`,
          }} />
        )}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph, filter: "drop-shadow(0 9px 20px rgba(0,0,0,0.22)) drop-shadow(0 0 1.2px rgba(20,22,31,0.45))" }}>
      <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
        <div style={{ position: "absolute", left: 0, top: bh, width: pw, height: bh, backgroundColor: PAPER, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: -bh, width: pw, height: ph }}>
            <LetterPageContent pw={pw} ph={ph} />
          </div>
        </div>
        {band("bot", 2 * bh, "0%", a1, easeInOut(f1), "bottom")}
        {band("top", 0, "100%", a2, easeInOut(f2), "top")}
      </div>
    </div>
  );
};

export type EnvelopeData = { name: string };

const Envelope: React.FC<CardProps & { data: EnvelopeData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const b = beats;
  const f1 = seg01(tMs, b.put, b.put + 380);
  const f2 = seg01(tMs, b.letter, b.letter + 380);
  const ins = easeInOut(seg01(tMs, b.envelope, b.envelope + 380));
  const flap = 1 - easeInOut(seg01(tMs, b.envelope + 340, b.envelope + 660));
  const gl = easeInOut(seg01(tMs, b.envelope + 600, b.envelope + 1000));
  const written = seg01(tMs, b.wrote, b.person);
  const penIn = easeOut(seg01(tMs, b.hand, b.wrote));
  const penOut = easeInOut(seg01(tMs, b.person, b.person + 330));

  const pw = 0.37 * w, ph = pw * ER;
  const pcx = 0.20 * w, pcy = 0.50 * h;
  const envW = lerp(0.452 * w, 0.524 * w, gl);
  const envH = envW / ER;
  const ecx = lerp(0.72 * w, 0.50 * w, gl);
  const ecy = lerp(0.56 * h, 0.50 * h, gl);
  const eLeft = ecx - envW / 2, eTop = ecy - envH / 2;

  // the packet flies to the envelope's mouth and stays with it while the envelope settles centre
  const tx = (ecx - pcx) * ins, ty = (eTop + 0.31 * envH - pcy) * ins - 34 * Math.sin(Math.PI * ins);
  const ps = lerp(1, 0.82 * (envW / (0.452 * w)), ins);

  // where the nib is: the name box maps NAME_VB into the envelope's own box
  const k = (envW / 1000) * ((1000 * NAME_BOX.width) / NAME_VB.w);
  const nib = (f: number) => {
    const p = nameAt(f);
    return { x: eLeft + envW * NAME_BOX.left + (p.x - NAME_VB.x) * k, y: eTop + envH * NAME_BOX.top + (p.y - NAME_VB.y) * k };
  };
  const n0 = nib(0), nN = nib(written);
  const px = lerp(n0.x + 300, nN.x, penIn) + 250 * penOut;
  const py = lerp(n0.y - 270, nN.y, penIn) - 280 * penOut;
  const penOn = tMs >= b.hand && penOut < 0.98;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", left: pcx - pw / 2, top: pcy - ph / 2, width: pw, height: ph,
        transform: `translate(${tx}px, ${ty}px) rotate(${-5 * ins}deg) scale(${ps})`, transformOrigin: "50% 50%",
      }}>
        <FoldingPage pw={pw} ph={ph} f1={f1} f2={f2} />
      </div>
      <div style={{ position: "absolute", left: eLeft, top: eTop }}>
        <EnvelopeC5 w={envW} name={data.name} written01={written} flap01={flap} />
      </div>
      {penOn && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${px} ${py})`} opacity={1 - clamp01((penOut - 0.55) / 0.42)}>
            <FountainPen s={envW * 0.0034} />
          </g>
        </svg>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V8 / V9 reception: the handover, first person. One scene, two cards, no re-pop.
// ─────────────────────────────────────────────────────────────────────────────

type Rec = {
  rise: number; place: number; drop: number; withdraw: number; namePulse: number;
  second: number; taken: number; lit: number; ourB: number; b1: number; b2: number;
  arrow: number; glow: number; slide: number;
};

const ReceptionScene: React.FC<{ w: number; h: number; name: string; plate: string; s: Rec }> = ({ w, h, name, plate, s }) => {
  const fy = 0.42 * h, ny = 0.66 * h, edge = 0.072 * h;
  const envW = 0.33 * w, envH = envW / ER;
  // held in our hand, laid on the counter, then lifted away in theirs
  const cx = lerp(lerp(0.600 * w, 0.495 * w, s.place), 0.545 * w, s.taken);
  const cy = lerp(lerp(0.630 * h, 0.555 * h, s.place), 0.470 * h, s.taken);
  const sy = lerp(lerp(1, 0.58, s.place), 0.62, s.taken);
  const rot = lerp(lerp(-6, -3, s.place), -1, s.taken);
  const np = 1 + 0.10 * s.namePulse;
  const hs = 0.00096 * w;
  const hx = 0.40 * w, hy = 0.830 * h + 34 * s.drop + 300 * s.withdraw + 340 * (1 - s.rise);
  const tpx = lerp(1.26 * w, 0.845 * w, s.second) + 18 * s.taken;
  const tpy = 0.575 * h - 30 * s.taken;
  const fs = chipFs(w), chipH = 1.86 * fs;
  const plX = 0.20 * w, plTop = 0.355 * h;
  const bx = 0.025 * w, bw = 0.19 * w, by = 0.635 * h, bhh = 0.165 * h;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <WoodSlab id="recdesk" fx0={0.115 * w} fx1={0.885 * w} fy={fy} nx0={0.02 * w} nx1={0.98 * w} ny={ny} edge={edge} panelTo={h} />
      <MonitorBack x={0.655 * w} y={0.175 * h} w={0.20 * w} h={0.185 * h} />
      <Bell cx={0.305 * w} by={0.565 * h} r={0.031 * w} />
      <g>
        <rect x={plX - 4} y={plTop + chipH} width={8} height={0.05 * h} fill="#98A0AA" stroke={INK} strokeWidth={3} />
        <rect x={plX - 34} y={plTop + chipH + 0.05 * h} width={68} height={9} fill="#8A929C" stroke={INK} strokeWidth={3} />
      </g>
      <HandUnderBack x={hx} y={hy} s={hs} />
      <ellipse cx={cx + 16} cy={cy + (envH * sy) / 2 + 8} rx={envW * 0.44} ry={11}
        fill="rgba(0,0,0,0.22)" opacity={s.place * (1 - s.taken)} style={{ filter: "blur(9px)" }} />
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(1 ${sy}) translate(${-envW / 2} ${-envH / 2})`}>
        <g transform={`translate(${envW / 2} ${envH / 2}) scale(${np}) translate(${-envW / 2} ${-envH / 2})`}>
          <EnvelopeC5 w={envW} name={name} written01={1} />
        </g>
      </g>
      {s.glow > 0.01 && (
        <rect x={cx - envW / 2 - 14} y={cy - (envH * sy) / 2 - 14} width={envW + 28} height={envH * sy + 28}
          fill="none" style={{ stroke: ACCENT }} strokeWidth={10} opacity={0.9 * s.glow} filter="blur(7px)" />
      )}
      <ThumbOver x={hx} y={hy} s={hs} open={s.drop} />
      {s.second > 0.01 && <HandSide x={tpx} y={tpy} s={hs * 0.92} rot={5} pinch={s.taken} />}
      {s.ourB > 0.01 && <Bubble x={bx} y={by} w={bw} h={bhh} open01={s.ourB} tail="bl" />}
      {s.b1 > 0.01 && (
        <g transform={`translate(0 ${36 * (1 - easeOut(s.b1))})`}>
          <Bubble x={0.245 * w} y={0.045 * h} w={0.19 * w} h={0.20 * h} open01={s.b1} tail="br" glyph="?" fs={0.078 * h} />
        </g>
      )}
      {s.b2 > 0.01 && (
        <g transform={`translate(0 ${36 * (1 - easeOut(s.b2))})`}>
          <Bubble x={0.47 * w} y={0.012 * h} w={0.19 * w} h={0.19 * h} open01={s.b2} tail="br" glyph="?" fs={0.075 * h} />
        </g>
      )}
      {s.arrow > 0.01 && (() => {
        const ex = cx - envW / 2 - 12, ey = cy + (envH * sy) / 2 - 6;
        const dx = ex - (bx + bw + 10), dy = ey - (by + 0.05 * h);
        const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        return (
          <g opacity={Math.min(1, s.arrow * 1.8)}>
            <Ink d={`M ${bx + bw + 10} ${by + 0.05 * h} C ${bx + bw + 0.09 * w} ${by + 0.02 * h} ${ex - 0.11 * w} ${ey + 0.10 * h} ${ex - 26 * ux} ${ey - 26 * uy}`} sw={8} />
            <Ink d={`M ${ex} ${ey} L ${ex - 34 * ux + 16 * uy} ${ey - 34 * uy - 16 * ux} L ${ex - 34 * ux - 16 * uy} ${ey - 34 * uy + 16 * ux} Z`} fill={INK} sw={4} />
          </g>
        );
      })()}
      <foreignObject x={plX - 0.17 * w} y={plTop} width={0.34 * w} height={chipH + 6}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <Chip text={plate} fs={fs} />
            <div style={{ position: "absolute", inset: 0, opacity: s.lit }}><Chip text={plate} fs={fs} accent /></div>
          </div>
        </div>
      </foreignObject>
    </svg>
  );
};

export type ReceptionData = { plate: string; name: string };

const rec = (t: number, b: Record<string, number>): Rec => ({
  rise: easeOut(seg01(t, b.walk, b.walk + 420)),
  place: easeInOut(seg01(t, b.this, b.letter)),
  drop: easeOut(seg01(t, b.letter, b.letter + 320)),
  withdraw: 0, namePulse: pulse(t, b.matthew, 620),
  second: easeOut(seg01(t, b.could, b.could + 520)),
  taken: easeInOut(seg01(t, b.takes, b.takes + 420)),
  lit: seg01(t, b.reception, b.reception + 260),
  ourB: seg01(t, b.say, b.say + 300), b1: 0, b2: 0, arrow: 0, glow: 0, slide: 0,
});

const Reception: React.FC<CardProps & { data: ReceptionData }> = ({ tMs, w, h, beats, data }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <ReceptionScene w={w} h={h} name={data.name} plate={data.plate} s={rec(tMs, beats)} />
  </div>
);

export type HurryData = { name: string };

const Hurry: React.FC<CardProps & { data: HurryData }> = ({ tMs, w, h, beats, data }) => {
  const b = beats;
  const s: Rec = {
    rise: 1, place: 1, drop: 1, namePulse: 0, second: 1, taken: 1, lit: 1,
    withdraw: easeInOut(seg01(tMs, b.walk, b.walk + 220)),
    ourB: clamp01(1 - seg01(tMs, b.ask, b.ask + 240) + seg01(tMs, b.just, b.just + 260)),
    b1: seg01(tMs, b.ask, b.ask + 320), b2: seg01(tMs, b.information, b.information + 320),
    arrow: seg01(tMs, b.envelope, b.envelope + 280), glow: pulse(tMs, b.envelope, 760), slide: 0,
  };
  const g = seg01(tMs, b.away, b.away + 330);
  const dx = Math.pow(g, 1.35) * (w + 980);
  const streak = g > 0.001 && g < 1;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-dx}px)`, opacity: 1 - clamp01((g - 0.78) / 0.22) }}>
        <ReceptionScene w={w} h={h} name={data.name} plate="RECEPTION" s={s} />
      </div>
      {streak && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {[0.10, 0.24, 0.37, 0.49, 0.62, 0.75, 0.87].map((f, i) => {
            const len = 190 + 210 * (((i * 7) % 5) / 4);
            const x0 = w + 300 + ((i * 137) % 240) - dx;
            return (
              <g key={i} opacity={0.72 * Math.sin(Math.PI * Math.min(1, g * 1.15))}>
                <line x1={x0} y1={f * h} x2={x0 + len} y2={f * h} stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={0.75} />
                <line x1={x0} y1={f * h} x2={x0 + len} y2={f * h} stroke={INK} strokeWidth={5} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export type SealedData = { name: string };

const Sealed: React.FC<CardProps & { data: SealedData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const b = beats;
  const hover = easeOut(seg01(tMs, b.nobody, b.nobody + 420));
  const slide = easeOut(seg01(tMs, b.opens, b.opens + 300));
  const quest = seg01(tMs, b.opens + 210, b.opens + 500);
  const seal = seg01(tMs, b.sealed, b.sealed + 320);
  const np = 1 + 0.10 * pulse(tMs, b.name, 640);
  const up = easeOut(seg01(tMs, b.throw, b.throw + 175));
  const back = easeInOut(seg01(tMs, b.throw + 285, b.throw + 445));
  const t01 = up - back;
  const dim = seg01(tMs, b.throw + 285, b.throw + 445);

  const envW = 0.42 * w, envH = envW / ER, sy = 0.88;
  const thX = 205 * t01, thY = -76 * t01;
  const cx = 0.355 * w + thX, cy = 0.50 * h + thY;
  const rot = -3 + 10 * t01;
  const fs = chipFsBig(w);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <WoodSlab id="sealdesk" fx0={0.05 * w} fx1={0.645 * w} fy={0.185 * h} nx0={-0.01 * w} nx1={0.695 * w} ny={0.80 * h} edge={0.055 * h} />
        <Bin cx={0.845 * w} top={0.415 * h} bot={0.90 * h} w={0.205 * w} dim={dim} />
        <ellipse cx={0.355 * w + 24} cy={0.50 * h + (envH * sy) / 2 + 10 + 26 * t01} rx={envW * 0.44} ry={13 + 5 * t01}
          fill="rgba(0,0,0,0.20)" opacity={1 - 0.25 * t01} style={{ filter: "blur(10px)" }} />
        <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(1 ${sy}) translate(${-envW / 2} ${-envH / 2})`}>
          <g transform={`translate(${envW / 2} ${envH / 2}) scale(${np}) translate(${-envW / 2} ${-envH / 2})`}>
            <EnvelopeC5 w={envW} name={data.name} written01={1} sealedAccent accent01={seal} />
          </g>
        </g>
        {hover > 0.01 && (
          <g transform={`translate(${thX} ${-150 * (1 - hover) + thY})`} opacity={Math.min(1, hover * 2)}>
            <HandSide x={0.655 * w} y={0.325 * h} s={0.00074 * w} rot={-55} flipY thumbSlide={44 * slide} />
          </g>
        )}
      </svg>
      {quest > 0.01 && (
        <div style={{
          position: "absolute", left: 0.645 * w, top: 0.60 * h,
          opacity: Math.min(1, quest * 1.8), transform: `scale(${0.82 + 0.18 * easeOut(quest)})`, transformOrigin: "0% 50%",
        }}>
          <Chip text="?" fs={fs} />
        </div>
      )}
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  envelope: Envelope as React.FC<CardProps & { data: any }>,
  reception: Reception as React.FC<CardProps & { data: any }>,
  hurry: Hurry as React.FC<CardProps & { data: any }>,
  sealed: Sealed as React.FC<CardProps & { data: any }>,
};
