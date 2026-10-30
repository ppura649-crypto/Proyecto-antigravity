import React from "react";
import type { CardProps } from "../props";
import { MONO, SANS, beat, box, clamp, hash, life, mix, settle } from "./S-util";
// V13 "invoice" (builder S, 2026-09-25), You 29623 -> 31267. An editor's invoice on real paper (no amount, no
// price anywhere). It slides in on "You" and rests at an angle; on "pay" it is pushed across to the centre and
// settles square to us; on "editor." it crumples: the sheet buckles into facets that fold in on each other into a
// paper ball, which drops out of the band with gravity, spinning. The band is clean by 31267.

const SW = 430, SH = 556;
const SX = (1080 - SW) / 2, SY = (614 - SH) / 2;
const INK = "#18181c", GREY = "#77777f", RULE = "#d9d6cf";

const Face: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, background: "#FCFBF7", fontFamily: SANS, color: INK, overflow: "hidden" }}>
    <svg width={SW} height={SH} style={{ position: "absolute", inset: 0, opacity: 0.07 }}>
      <filter id="s-paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={SW} height={SH} filter="url(#s-paper)" />
    </svg>
    {/* tri-fold creases: it came in an envelope */}
    {[SH / 3, (2 * SH) / 3].map((y) => (
      <div key={y} style={{ position: "absolute", left: 0, top: y - 3, width: SW, height: 6,
        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 45%, rgba(255,255,255,0.8) 55%, rgba(0,0,0,0) 100%)" }} />
    ))}
    <div style={{ position: "absolute", left: 32, top: 30, fontSize: 30, fontWeight: 800, letterSpacing: 3 }}>INVOICE</div>
    <div style={{ position: "absolute", right: 32, top: 32, textAlign: "right", fontFamily: MONO, fontSize: 9.5, lineHeight: "15px", color: GREY }}>
      <div>Invoice no. <span style={{ color: INK }}>0142</span></div>
      <div>Issued <span style={{ color: INK }}>18 Sep 2026</span></div>
      <div>Due <span style={{ color: INK }}>on receipt</span></div>
    </div>
    <div style={{ position: "absolute", left: 32, top: 92, width: SW - 64, height: 1.5, background: INK }} />
    <div style={{ position: "absolute", left: 32, top: 106, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: GREY }}>FROM</div>
    <div style={{ position: "absolute", left: 32, top: 121, fontSize: 12, fontWeight: 700 }}>Your video editor</div>
    <div style={{ position: "absolute", left: 32, top: 138, fontSize: 10.5, color: GREY }}>Freelance</div>
    <div style={{ position: "absolute", left: 230, top: 106, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: GREY }}>BILL TO</div>
    <div style={{ position: "absolute", left: 230, top: 121, fontSize: 12, fontWeight: 700 }}>Creator account</div>
    <div style={{ position: "absolute", left: 230, top: 138, fontSize: 10.5, color: GREY }}>Short-form, 4 videos a week</div>
    {/* the line items: description, quantity, unit. No amounts. */}
    <div style={{ position: "absolute", left: 32, top: 178, width: SW - 64, height: 24, background: "#EFEDE7",
      display: "flex", alignItems: "center", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: GREY }}>
      <span style={{ marginLeft: 10, flex: 1 }}>DESCRIPTION</span><span style={{ width: 40 }}>QTY</span><span style={{ width: 78 }}>UNIT</span>
    </div>
    {[
      ["Video editing · cut, captions, graphics", "1", "per video", true],
      ["Hook text and cover frame", "1", "per video", false],
      ["Revisions, 2 rounds", "1", "per video", false],
      ["Export and delivery, 48 h", "1", "per video", false],
    ].map(([d, q, u, main], i) => (
      <div key={i} style={{ position: "absolute", left: 32, top: 206 + i * 34, width: SW - 64, height: 34, borderBottom: `1px solid ${RULE}`,
        display: "flex", alignItems: "center", fontSize: main ? 11.5 : 10.5, fontWeight: main ? 700 : 500 }}>
        <span style={{ marginLeft: 10, flex: 1 }}>{d as string}</span>
        <span style={{ width: 40, fontFamily: MONO, fontSize: 10 }}>{q as string}</span>
        <span style={{ width: 78, fontSize: 10.5, color: main ? INK : GREY }}>{u as string}</span>
      </div>
    ))}
    <div style={{ position: "absolute", left: 32, top: 362, width: SW - 64, fontSize: 10.5, lineHeight: "16px", color: GREY }}>
      Billed for every video delivered. Invoiced weekly.
    </div>
    <div style={{ position: "absolute", right: 32, top: 400, width: 190, height: 58, border: `1.5px solid ${INK}`, padding: "8px 12px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: GREY }}>PAYMENT</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 5 }}>Due on receipt</div>
    </div>
    <div style={{ position: "absolute", left: 32, top: 406, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: GREY }}>PAY BY</div>
    <div style={{ position: "absolute", left: 32, top: 421, fontSize: 10.5, lineHeight: "15px" }}>Bank transfer<br />Reference 0142</div>
    <div style={{ position: "absolute", left: 32, bottom: 30, width: SW - 64, height: 1, background: RULE }} />
    <div style={{ position: "absolute", left: 32, bottom: 12, fontSize: 9.5, color: GREY }}>Thank you for your business.</div>
    <div style={{ position: "absolute", right: 32, bottom: 12, fontFamily: MONO, fontSize: 9, color: GREY }}>Page 1 of 1</div>
  </div>
);

// the crumple, in the sheet's own coordinates: a jittered facet mesh that shades in (paper creases catch light and
// shadow), a displacement warp that grows, and an outline that pulls in from the rectangle to a jagged ball
const GX = 7, GY = 9;
const PTS = Array.from({ length: (GX + 1) * (GY + 1) }, (_, k) => {
  const i = k % (GX + 1), j = Math.floor(k / (GX + 1));
  const edgeX = i === 0 || i === GX, edgeY = j === 0 || j === GY;
  return [(i / GX) * SW + (edgeX ? 0 : (hash(k + 11) - 0.5) * (SW / GX) * 0.8),
    (j / GY) * SH + (edgeY ? 0 : (hash(k + 17) - 0.5) * (SH / GY) * 0.8)] as const;
});
const TRIS: { p: string; s: number }[] = [];
for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
  const a = j * (GX + 1) + i, b = a + 1, c = a + GX + 1, d = c + 1;
  const pp = (n: number) => `${PTS[n]![0].toFixed(1)},${PTS[n]![1].toFixed(1)}`;
  const flip = hash(a * 3 + 1) > 0.5;
  const tris = flip ? [[a, b, d], [a, d, c]] : [[a, b, c], [b, d, c]];
  tris.forEach((t, q) => TRIS.push({ p: t.map(pp).join(" "), s: hash(a * 7 + q * 13 + 2) * 2 - 1 }));
}
const M = 48; // outline points round the sheet
const OUT = Array.from({ length: M }, (_, j) => {
  const u = j / M, per = 2 * (SW + SH), d = u * per;
  const [x, y] = d < SW ? [d, 0] : d < SW + SH ? [SW, d - SW] : d < 2 * SW + SH ? [SW - (d - SW - SH), SH] : [0, SH - (d - 2 * SW - SH)];
  const th = Math.atan2(y - SH / 2, x - SW / 2);
  const r = 205 * (0.8 + 0.34 * hash(j + 40)) * (j % 2 ? 0.94 : 1.02);
  return { x, y, tx: SW / 2 + r * Math.cos(th), ty: SH / 2 + r * Math.sin(th) };
});

const Crumple: React.FC<{ c: number }> = ({ c }) => {
  const e = 1 - Math.pow(1 - c, 2);
  const poly = OUT.map((o) => `${mix(o.x, o.tx, e).toFixed(1)}px ${mix(o.y, o.ty, e).toFixed(1)}px`).join(", ");
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, clipPath: `polygon(${poly})` }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="s-crumple" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={110 * e} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: "url(#s-crumple)" }}>
        <Face />
        <svg width={SW} height={SH} style={{ position: "absolute", inset: 0 }}>
          {TRIS.map((t, k) => (
            <polygon key={k} points={t.p} fill={t.s > 0 ? "#ffffff" : "#1e1a14"} fillOpacity={Math.abs(t.s) * (t.s > 0 ? 0.55 : 0.5) * clamp(c * 1.6)}
              stroke="#2a251c" strokeOpacity={0.3 * clamp(c * 2.5)} strokeWidth={2} />
          ))}
        </svg>
      </div>
      {/* the ball's roundness: lit from the top left */}
      <div style={{ position: "absolute", inset: 0, opacity: e,
        background: "radial-gradient(circle at 40% 36%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.45) 78%)" }} />
    </div>
  );
};

export const Invoice: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats }) => {
  const pay = beat(beats, "pay", 30503), editor = beat(beats, "editor", 30983);
  // A: slides in from the right, rests at an angle. B: pushed across to the centre on "pay", square to us.
  const a = settle(t, fromMs - 80, 420);
  const b = settle(t, pay - 60, 400);
  const ax = mix(560, 150, a), ay = mix(30, 22, a), ar = mix(10, 6, a), as = 0.84;
  const x = mix(ax, 0, b), y = mix(ay, 0, b), r = mix(ar, -0.6, b), sc = mix(as, 1, b);
  const moving = Math.abs(a - 1) > 0.02 && a < 0.7 ? 1 : 0;
  // C: crumple, then gravity
  const CR = 200, drop0 = editor + 20, G = 16000;
  const c = clamp((t - editor) / CR);
  const ce = c < 1 ? 1 - Math.pow(1 - c, 2.2) : 1;
  const dt = Math.max(0, t - drop0) / 1000;
  const fall = 0.5 * G * dt * dt;
  const spin = dt * 420, tumble = dt * 380;
  const crumpling = t >= editor;
  const lift = 1 + 0.05 * Math.sin(Math.PI * clamp(c * 1.3));
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0.02, "50% 50%")}>
        {!crumpling && (
          <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH,
            transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sc})`,
            filter: moving ? "blur(1.2px)" : undefined,
            boxShadow: `0 ${mix(12, 24, b)}px ${mix(26, 48, b)}px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.3)` }}>
            <Face />
          </div>
        )}
        {crumpling && (
          <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, perspective: 1200,
            transform: `translateY(${fall}px)`, filter: `drop-shadow(0 ${mix(20, 10, ce)}px ${mix(30, 12, ce)}px rgba(0,0,0,0.45))${dt > 0.08 ? ` blur(${Math.min(2.5, dt * 11).toFixed(2)}px)` : ""}` }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%",
              transform: `rotate(${-0.6 + 28 * ce + spin}deg) rotateX(${14 * Math.sin(Math.PI * ce) + tumble * 0.2}deg) rotateY(${-18 * Math.sin(Math.PI * ce)}deg) scale(${mix(1, 0.3, ce) * lift}, ${mix(1, 0.29, ce) * lift})` }}>
              <Crumple c={c} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
