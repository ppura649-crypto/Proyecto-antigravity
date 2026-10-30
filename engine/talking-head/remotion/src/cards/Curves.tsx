import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Head } from "./Head";

// V10 `curves` (edit-c-chip): "And on par against Vera Rubin, Nvidia's newest chip."
// OUR chart, on the black card, in Creator Format 1's chart language: thin white axes, a dashed
// grid, two curves read point by point off SemiAnalysis's own InferenceX figure and
// drawn left to right on the sentence. Vera Rubin white, Jalapeno in the accent. The
// argument is geometric: from ~230 tokens/s per user the two lines lie on each other.
// Both axes are named (their rule: "what's Y and X"), the source sits bottom-right.
export type CurvesData = {
  title: string; xlabel: string; ylabel: string;
  series: { name: string; accent?: boolean; points: [number, number][] }[]; par: string; source: string;
};

const FIG_FONT = "'DejaVu Sans', Verdana, Arial, sans-serif";
const XMAX = 700;
const YMAX = 5;
const PER = 14; // samples per segment of the monotone cubic

// Fritsch-Carlson monotone cubic: a smooth curve through the real points that never
// overshoots them (a spline that dips below a measured value would be a fake number).
const slopes = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array<number>(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
};

const sample = (pix: [number, number][]) => {
  const xs = pix.map((p) => p[0]);
  const ys = pix.map((p) => p[1]);
  const m = slopes(xs, ys);
  const out: [number, number][] = [];
  for (let i = 0; i < pix.length - 1; i++) {
    const hx = xs[i + 1] - xs[i];
    for (let k = 0; k < PER; k++) {
      const t = k / PER;
      const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
      const h10 = t ** 3 - 2 * t ** 2 + t;
      const h01 = -2 * t ** 3 + 3 * t ** 2;
      const h11 = t ** 3 - t ** 2;
      out.push([xs[i] + t * hx, h00 * ys[i] + h10 * hx * m[i] + h01 * ys[i + 1] + h11 * hx * m[i + 1]]);
    }
  }
  out.push(pix[pix.length - 1]);
  return out;
};

// The reveal is ONE vertical front sweeping left to right across the figure, so both
// curves are always drawn to the same x and the eye compares them the whole way (an
// arc-length draw would race the flatter curve ahead and hide the overlap until the end).
const cut = (pts: [number, number][], xF: number) => {
  if (xF <= pts[0][0]) return { d: "", head: [pts[0][0] - 1, pts[0][1]] as [number, number] };
  let i = 1;
  while (i < pts.length - 1 && pts[i][0] < xF) i++;
  const dx = pts[i][0] - pts[i - 1][0] || 1;
  const t = Math.max(0, Math.min(1, (xF - pts[i - 1][0]) / dx));
  const head: [number, number] = [
    pts[i - 1][0] + t * dx,
    pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]),
  ];
  const d = pts.slice(0, i).map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  return { d: `${d} ${head[0].toFixed(1)},${head[1].toFixed(1)}`, head };
};

const SHIFT = { start: "0", center: "-50%", end: "-100%" };
const Name: React.FC<{
  x: number; y: number; px: number; color: string; text: string; pop: number;
  align?: "start" | "center" | "end";
}> = ({ x, y, px, color, text, pop, align = "start" }) => (
  <div style={{
    position: "absolute", left: x, top: y, whiteSpace: "nowrap",
    transform: `translate(${SHIFT[align]}, 0) scale(${0.92 + 0.08 * pop})`,
    transformOrigin: `${align === "start" ? "left" : align === "end" ? "right" : "center"} top`,
    opacity: Math.min(1, pop * 2.5),
    ...label(px, color),
  }}>{text}</div>
);

const XT = [0, 100, 200, 300, 400, 500, 600, 700];
const YT = [0, 1, 2, 3, 4, 5];

// thin white axes with a dashed grid: a real figure, drawn in Creator Format 1's line weight
const Axes: React.FC<{
  axL: number; axR: number; axT: number; axB: number; fs: number;
  px: (x: number) => number; py: (v: number) => number;
}> = ({ axL, axR, axT, axB, fs, px, py }) => (
  <g>
    {YT.slice(1).map((v) => (
      <line key={`gy${v}`} x1={axL} y1={py(v)} x2={axR} y2={py(v)} stroke="#ffffff" strokeOpacity={0.2}
        strokeWidth={1} strokeDasharray="4 6" />
    ))}
    {XT.slice(1).map((x) => (
      <line key={`gx${x}`} x1={px(x)} y1={axT} x2={px(x)} y2={axB} stroke="#ffffff" strokeOpacity={0.2}
        strokeWidth={1} strokeDasharray="4 6" />
    ))}
    <line x1={axL} y1={axT} x2={axL} y2={axB} stroke="#ffffff" strokeWidth={1.6} />
    <line x1={axL} y1={axB} x2={axR} y2={axB} stroke="#ffffff" strokeWidth={1.6} />
    {XT.map((x) => (
      <g key={`tx${x}`}>
        <line x1={px(x)} y1={axB} x2={px(x)} y2={axB + 7} stroke="#ffffff" strokeWidth={1.4} />
        <text x={px(x)} y={axB + 7 + fs} textAnchor="middle" fontSize={fs} fill="#ffffff">{x}</text>
      </g>
    ))}
    {YT.map((v) => (
      <g key={`ty${v}`}>
        <line x1={axL - 7} y1={py(v)} x2={axL} y2={py(v)} stroke="#ffffff" strokeWidth={1.4} />
        <text x={axL - 12} y={py(v) + fs * 0.36} textAnchor="end" fontSize={fs} fill="#ffffff">{v}</text>
      </g>
    ))}
  </g>
);

// the real measured points, popping as the front passes them
const Dots: React.FC<{ pix: [number, number][]; head: [number, number]; accent?: boolean }> =
  ({ pix, head, accent }) => (
    <>
      {pix.map(([cx, cy], i) => {
        const s = cx <= head[0] ? Math.min(1, (head[0] - cx) / 12) : 0;
        return s <= 0 ? null : (
          <circle key={i} cx={cx} cy={cy} r={3.6 * (0.6 + 0.4 * s)}
            style={{ fill: accent ? ACCENT : "#ffffff" }} opacity={s} />
        );
      })}
    </>
  );

// "on par" points at the stretch where the two curves lie on each other
const ParArrow: React.FC<{ x: number; from: number; to: number; o: number }> = ({ x, from, to, o }) => (
  <g opacity={o}>
    <line x1={x} y1={from} x2={x} y2={to} style={{ stroke: ACCENT }} strokeWidth={1.6} />
    <path d={`M ${x - 5} ${to - 8} L ${x} ${to} L ${x + 5} ${to - 8}`} fill="none"
      style={{ stroke: ACCENT }} strokeWidth={1.6} />
  </g>
);

export const Curves: React.FC<CardProps & { data: CurvesData }> = ({ tMs, w, h, fps, beats, data }) => {
  const pad = 0.045 * w;
  const fsSmall = 0.02 * w;
  const fsName = 0.026 * w;
  const axL = 0.076 * w;
  const axR = w - pad;
  const axT = pad + 0.023 * w * 1.45 + 0.028 * h;
  const axB = h - 0.04 * h - fsSmall * 1.35 - fsSmall * 1.5 - fsSmall * 1.5 - 6;
  const axW = axR - axL;
  const axH = axB - axT;
  const px = (x: number) => axL + (x / XMAX) * axW;
  const py = (v: number) => axB - (v / YMAX) * axH;

  const p = interpolate(tMs, [beats.draw, beats.drawEnd], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const spr = (at: number) => spring({
    frame: Math.max(0, ((tMs - at) / 1000) * fps), fps,
    config: { damping: 15, stiffness: 320, mass: 0.7 },
  });
  const pop1 = tMs >= beats.name1 ? spr(beats.name1) : 0;
  const pop2 = tMs >= beats.name2 ? spr(beats.name2) : 0;

  const curves = data.series.map((s) => ({
    s, pix: s.points.map(([x, v]) => [px(x), py(v)] as [number, number]),
  }));
  const xFrom = Math.min(...curves.map((c) => c.pix[0][0]));
  const xF = xFrom + p * (px(XMAX) - xFrom);
  const drawn = curves.map((c) => ({ ...c, ...cut(sample(c.pix), xF) }));
  const rubin = drawn[0];
  const jal = drawn[1] ?? drawn[0];
  // the white curve is named where the two are still apart, on a real point of it
  const anchor = rubin.pix[Math.min(3, rubin.pix.length - 1)];

  const nX = anchor[0] + 0.018 * w;
  const nY = anchor[1] - 0.11 * h;
  const tailY = jal.pix[jal.pix.length - 1][1];
  const parX = px(300);
  const parY = axB - 0.29 * axH;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: pad, right: pad, top: pad }}>
        <Head w={w} left={data.title} />
      </div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={FIG_FONT}>
        <Axes axL={axL} axR={axR} axT={axT} axB={axB} fs={fsSmall} px={px} py={py} />
        {drawn.map((c) => (
          <polyline key={c.s.name} points={c.d} fill="none" strokeWidth={4} strokeLinecap="round"
            strokeLinejoin="round" style={{ stroke: c.s.accent ? ACCENT : "#ffffff" }} />
        ))}
        {drawn.map((c) => <Dots key={`d${c.s.name}`} pix={c.pix} head={c.head} accent={c.s.accent} />)}
        {/* leader from the Vera Rubin name to the point the draw is on when it lands */}
        {pop1 > 0 && (
          <line x1={anchor[0] + 5} y1={anchor[1] - 5} x2={nX + 6} y2={nY + fsName * 1.3}
            stroke="#ffffff" strokeWidth={1.4} opacity={Math.min(1, pop1 * 2.5)} />
        )}
        {pop2 > 0 && <ParArrow x={parX} from={parY + fsName * 0.55} to={py(0.42)} o={Math.min(1, pop2 * 2.5)} />}
        <text x={axL - 0.052 * w} y={axT + axH / 2} transform={`rotate(-90 ${axL - 0.052 * w} ${axT + axH / 2})`}
          textAnchor="middle" fontSize={fsSmall} fill="#ffffff" style={{ ...label(fsSmall), fill: INK }}>
          {data.ylabel.toUpperCase()}
        </text>
        <text x={axL + axW / 2} y={axB + fsSmall * 1.5 + fsSmall * 1.15} textAnchor="middle"
          style={{ ...label(fsSmall), fill: INK }}>{data.xlabel.toUpperCase()}</text>
        <text x={axR} y={h - 0.038 * h} textAnchor="end" fontFamily={MONO_FONT} fontSize={fsSmall * 0.92} fill={MUTED}>
          {data.source}
        </text>
      </svg>
      <Name x={nX} y={nY} px={fsName} color={INK} text={data.series[0].name} pop={pop1} />
      <Name x={px(690)} y={tailY - 0.115 * h} px={fsName} color={ACCENT} text={data.series[1].name} pop={pop2} align="end" />
      <Name x={parX} y={parY - fsName * 0.95} px={fsName} color={ACCENT} text={data.par} pop={pop2} align="center" />
    </div>
  );
};
