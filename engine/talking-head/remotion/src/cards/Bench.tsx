import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, MONO_FONT, label } from "./theme";

// V7, "Measured on site, the real performance of this chip compared to Nvidia Blackwell."
// A lab bench: two chip packages standing on it, Jalapeño and Blackwell (the real Nvidia
// eye printed on its lid, nothing drawn behind it), two probes that come down and TOUCH
// the lids on "site,", and a meter between them whose needle swings on "performance" and
// settles pointing at Jalapeño on "chip". The needle is the payload, so it is the accent.
export type BenchData = { left: string; right: string; meter: string; source?: string };

const D2R = Math.PI / 180;
const A0 = 155;   // the Jalapeño end of the dial
const A1 = 25;    // the Blackwell end
const REST = 90;  // straight up, before the measurement
const SETTLE = 147;
// hand-authored so every excursion stays inside the dial: out to Blackwell, back past
// Jalapeño, and damping down onto the winner
const SW_T = [0, 140, 330, 480, 620, 740, 860, 900];
const SW_A = [REST, 36, 150, 62, 138, 96, 144, SETTLE];

const DieMark: React.FC<{ cx: number; cy: number; s: number; sw: number }> = ({ cx, cy, s, sw }) => {
  const c = s / 3;
  return (
    <g stroke={INK} strokeWidth={sw} fill="none">
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} />
      <line x1={cx - s / 2 + c} y1={cy - s / 2} x2={cx - s / 2 + c} y2={cy + s / 2} strokeOpacity={0.55} />
      <line x1={cx - s / 2 + 2 * c} y1={cy - s / 2} x2={cx - s / 2 + 2 * c} y2={cy + s / 2} strokeOpacity={0.55} />
      <line x1={cx - s / 2} y1={cy - s / 2 + c} x2={cx + s / 2} y2={cy - s / 2 + c} strokeOpacity={0.55} />
      <line x1={cx - s / 2} y1={cy - s / 2 + 2 * c} x2={cx + s / 2} y2={cy - s / 2 + 2 * c} strokeOpacity={0.55} />
    </g>
  );
};

export const Bench: React.FC<CardProps & { data: BenchData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const pad = 0.045 * w;
  const benchY = 0.735 * h;
  const pkgW = 0.235 * w;
  const lidW = 0.205 * w;
  const pinH = 0.030 * h;
  const subH = 0.026 * h;
  const lidH = 0.320 * h;
  const subTop = benchY - pinH - subH;
  const lidTop = subTop - lidH;
  const leftCx = 0.200 * w;
  const rightCx = 0.800 * w;
  const cx = w / 2;
  const R = 0.135 * w;
  const pivotY = benchY - 0.020 * h;
  const sw = 0.0075 * w;
  const nameFs = 0.030 * w;
  const monoFs = 0.023 * w;

  const sp = (ms: number, d = 15) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: 320, mass: 0.7 } });
  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const benchIn = ramp(fromMs, fromMs + 200);
  const pkgL = sp(fromMs + 30);
  const pkgR = sp(fromMs + 130);
  const dial = ramp(fromMs + 200, fromMs + 440);
  const probeIn = ramp(fromMs + 200, fromMs + 360);
  const srcIn = ramp(fromMs + 420, fromMs + 660);

  const probesAt = beats.probes ?? fromMs + 650;
  const needleAt = beats.needle ?? probesAt + 720;
  const settleAt = beats.settle ?? needleAt + 900;
  const k = Math.max(1, settleAt - needleAt) / 900;

  const touch = sp(probesAt, 16);
  const hoverY = lidTop - 0.090 * h;
  const tipY = hoverY + (lidTop - 2 - hoverY) * Math.min(1, touch);

  let ang = REST;
  if (tMs >= settleAt) {
    const tau = (tMs - settleAt) / 1000;
    ang = SETTLE + 4.5 * Math.exp(-9 * tau) * Math.cos(22 * tau);
  } else if (tMs > needleAt) {
    ang = interpolate(tMs, SW_T.map((t) => needleAt + t * k), SW_A, {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
  }
  const settled = tMs >= settleAt;
  const nx = cx + R * 0.86 * Math.cos(ang * D2R);
  const ny = pivotY - R * 0.86 * Math.sin(ang * D2R);

  const arcPt = (deg: number, r: number) => [cx + r * Math.cos(deg * D2R), pivotY - r * Math.sin(deg * D2R)];
  const [ax0, ay0] = arcPt(A0, R);
  const [ax1, ay1] = arcPt(A1, R);
  const ticks = Array.from({ length: 9 }, (_, i) => A0 - (i * (A0 - A1)) / 8);

  const pkg = (pcx: number, s: number, eye: boolean) => {
    const sc = 0.90 + 0.10 * Math.min(1, s);
    return (
      <g opacity={Math.min(1, s * 2)} transform={`translate(${pcx} ${benchY}) scale(${sc}) translate(${-pcx} ${-benchY})`}>
        {Array.from({ length: 9 }, (_, i) => {
          const x = pcx - pkgW / 2 + (pkgW * (i + 1)) / 10;
          return <line key={i} x1={x} y1={subTop + subH} x2={x} y2={benchY} stroke={INK} strokeWidth={0.0045 * w} />;
        })}
        <rect x={pcx - pkgW / 2} y={subTop} width={pkgW} height={subH} fill="none" stroke={INK} strokeWidth={sw} />
        <rect x={pcx - lidW / 2} y={lidTop} width={lidW} height={lidH} fill="none" stroke={INK} strokeWidth={sw} />
        {!eye && <DieMark cx={pcx} cy={lidTop + lidH / 2} s={lidH * 0.58} sw={0.005 * w} />}
      </g>
    );
  };

  // a probe is an object: a cable, a knurled barrel you could hold, and a needle
  const probe = (pcx: number) => {
    const bw = 0.026 * w;
    const bh = 0.115 * h;
    const th = 0.026 * h;
    const bTop = tipY - th - bh;
    return (
      <g opacity={probeIn} transform={`translate(0 ${(1 - probeIn) * -0.06 * h})`}>
        <line x1={pcx} y1={0.008 * h} x2={pcx} y2={bTop + 0.01 * h} stroke={INK} strokeWidth={0.005 * w} />
        <rect x={pcx - bw / 2} y={bTop} width={bw} height={bh} fill={INK} />
        {[0.30, 0.46, 0.62].map((f) => (
          <line
            key={f} x1={pcx - bw / 2} y1={bTop + bh * f} x2={pcx + bw / 2} y2={bTop + bh * f}
            stroke={CARD_BG} strokeWidth={0.0055 * w}
          />
        ))}
        <polygon
          points={`${pcx - bw / 2},${bTop + bh} ${pcx + bw / 2},${bTop + bh} ${pcx},${tipY}`}
          fill={INK}
        />
      </g>
    );
  };

  const eyeH = lidH * 0.58;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>two chip packages on a lab bench, probed, with a meter between them</title>

        {probe(leftCx)}
        {probe(rightCx)}

        {pkg(leftCx, pkgL, false)}
        {pkg(rightCx, pkgR, true)}

        {/* the bench itself */}
        <line
          x1={cx - ((w - 2 * pad) / 2) * benchIn} y1={benchY}
          x2={cx + ((w - 2 * pad) / 2) * benchIn} y2={benchY}
          stroke={INK} strokeWidth={0.010 * w}
        />

        {/* the meter */}
        <g opacity={dial}>
          <path
            d={`M ${ax0} ${ay0} A ${R} ${R} 0 0 1 ${ax1} ${ay1}`}
            fill="none" stroke={INK} strokeWidth={0.006 * w} strokeOpacity={0.9}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dial}
          />
          {ticks.map((t, i) => {
            const [x1, y1] = arcPt(t, R);
            const [x2, y2] = arcPt(t, R + (i === 0 || i === 8 ? 0.022 : 0.013) * w);
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={0.005 * w} strokeOpacity={0.8} />;
          })}
        </g>
        <g opacity={dial}>
          <line x1={cx} y1={pivotY} x2={nx} y2={ny} stroke={settled ? ACCENT : INK} strokeWidth={0.009 * w} strokeLinecap="round" />
          <circle cx={cx} cy={pivotY} r={0.013 * w} fill={settled ? ACCENT : INK} />
        </g>
      </svg>

      {/* the real Nvidia mark, printed on the Blackwell lid, nothing behind it */}
      {assets[0] && (
        <Img
          src={staticFile(assets[0])}
          style={{
            position: "absolute", height: eyeH, width: "auto",
            left: rightCx - (eyeH * 595) / 409 / 2, top: lidTop + (lidH - eyeH) / 2,
            opacity: Math.min(1, pkgR * 2),
            filter: "drop-shadow(0px 3px 10px rgba(0,0,0,0.7))",
          }}
        />
      )}

      {[{ x: leftCx, t: data.left, o: pkgL }, { x: rightCx, t: data.right, o: pkgR }].map((n) => (
        <div
          key={n.t}
          style={{
            position: "absolute", left: n.x - 0.24 * w, top: benchY + 0.028 * h, width: 0.48 * w,
            textAlign: "center", whiteSpace: "nowrap", ...label(nameFs, INK), opacity: Math.min(1, n.o * 2),
          }}
        >
          {n.t}
        </div>
      ))}

      <div
        style={{
          position: "absolute", left: 0, top: benchY + 0.032 * h, width: w, textAlign: "center",
          fontFamily: MONO_FONT, fontSize: monoFs, color: INK, opacity: dial,
        }}
      >
        {data.meter}
      </div>

      {data.source && (
        <div
          style={{
            position: "absolute", right: pad, bottom: 0.048 * h,
            fontFamily: MONO_FONT, fontSize: monoFs, color: "rgba(255,255,255,0.46)", opacity: srcIn,
          }}
        >
          {data.source}
        </div>
      )}
    </div>
  );
};
