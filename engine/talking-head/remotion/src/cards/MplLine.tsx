import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";

// V15 `mplline` (edit-c-chip): "But now OpenAI built their own, almost entirely with
// AI models." The kernel curve off OpenAI's own Hot Chips slide, redrawn as a matplotlib
// figure in SVG on the white card (Chart.tsx's idiom: DejaVu, four spines, ticks, a
// dashed grid, a legend box, annotated markers, an annotate() arrow). The line draws on
// "built their own", the five markers and what the model changed pop on "almost
// entirely", and 88.9% of roofline lands in the accent on "AI models.". Real numbers only.
export type MplLineData = {
  title: string; xlabel: string; ylabel: string; x: number[]; y: number[]; notes: string[];
  land: string; note: string; source: string;
};

const FIG_FONT = "'DejaVu Sans', Verdana, Arial, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";
const ANN = "#5a5a5a";
const LINE = "#1f77b4";
const XT = [0, 10, 20, 30, 40];
const YT = [0, 25, 50, 75, 100];

// where each point's note sits, as a fraction of the axes rect (x from left, y from
// bottom): the empty wedge under the rising line, one rung per point, so no label
// crosses the curve and none leaves the axes.
const SPOTS: { fx: number; fy: number; end?: boolean }[] = [
  { fx: 0.075, fy: 0.075 },
  { fx: 0.115, fy: 0.225 },
  { fx: 0.225, fy: 0.435 },
  { fx: 0.615, fy: 0.545 },
  { fx: 0.985, fy: 0.675, end: true },
];

type Rect = { axL: number; axR: number; axT: number; axB: number; fs: number };
type Scale = { px: (v: number) => number; py: (v: number) => number };

const Axes: React.FC<Rect & Scale> = ({ axL, axR, axT, axB, fs, px, py }) => (
  <g>
    {YT.map((v) => (
      <line key={`gy${v}`} x1={axL} y1={py(v)} x2={axR} y2={py(v)} stroke="#dddddd" strokeWidth={1} strokeDasharray="4 5" />
    ))}
    {XT.slice(1).map((v) => (
      <line key={`gx${v}`} x1={px(v)} y1={axT} x2={px(v)} y2={axB} stroke="#e6e6e6" strokeWidth={1} strokeDasharray="4 5" />
    ))}
    <rect x={axL} y={axT} width={axR - axL} height={axB - axT} fill="none" stroke={SPINE} strokeWidth={1.6} />
    {XT.map((v) => (
      <g key={`tx${v}`}>
        <line x1={px(v)} y1={axB} x2={px(v)} y2={axB + 6} stroke={SPINE} strokeWidth={1.4} />
        <text x={px(v)} y={axB + 10 + fs * 0.8} textAnchor="middle" fontSize={fs} fill={TXT}>{v}</text>
      </g>
    ))}
    {YT.map((v) => (
      <g key={`ty${v}`}>
        <line x1={axL - 6} y1={py(v)} x2={axL} y2={py(v)} stroke={SPINE} strokeWidth={1.4} />
        <text x={axL - 11} y={py(v) + fs * 0.36} textAnchor="end" fontSize={fs} fill={TXT}>{v}</text>
      </g>
    ))}
  </g>
);

// one measured point: the marker, the thin leader matplotlib's annotate() draws, and
// what the model changed at that hour
const Marker: React.FC<{
  q: [number, number]; ax: number; ay: number; end?: boolean;
  note: string; fs: number; pop: number; last: boolean;
}> = ({ q, ax, ay, end, note, fs, pop, last }) => (
  <g opacity={Math.min(1, pop * 2.4)}>
    <line x1={q[0]} y1={q[1]} x2={ax + (end ? 6 : -6)} y2={ay - fs * 0.4} stroke="#b5b5b5" strokeWidth={1} />
    <circle cx={q[0]} cy={q[1]} r={(last ? 7.5 : 6) * (0.5 + 0.5 * pop)} style={{ fill: last ? ACCENT : LINE }} />
    <text x={ax} y={ay} textAnchor={end ? "end" : "start"} fontSize={fs} fontStyle="italic" fill={ANN}>{note}</text>
  </g>
);

// matplotlib annotate(): the comparison, a curved arrow to the final point, the number
const arrowTo = (sx: number, sy: number, last: [number, number]) => {
  const ex = last[0] - 19;
  const ey = last[1] - 11;
  const cx = (sx + ex) / 2;
  const cy = Math.min(sy, ey) - 22;
  const a = Math.atan2(ey - cy, ex - cx);
  return { d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
    head: `M ${ex - 14 * Math.cos(a - 0.42)} ${ey - 14 * Math.sin(a - 0.42)} L ${ex} ${ey}`
      + ` L ${ex - 14 * Math.cos(a + 0.42)} ${ey - 14 * Math.sin(a + 0.42)}` };
};

// matplotlib's legend box, the one series it has
const Legend: React.FC<{ x: number; y: number; fs: number; text: string }> = ({ x, y, fs, text }) => {
  const hgt = fs * 1.9;
  return (
    <g>
      <rect x={x} y={y} width={fs * 2.1 + text.length * fs * 0.56 + fs * 1.2} height={hgt}
        fill="#ffffff" stroke="#cccccc" strokeWidth={1} />
      <line x1={x + fs * 0.5} y1={y + hgt / 2} x2={x + fs * 1.85} y2={y + hgt / 2} stroke={LINE} strokeWidth={4} />
      <circle cx={x + fs * 1.17} cy={y + hgt / 2} r={4} fill={LINE} />
      <text x={x + fs * 2.4} y={y + hgt / 2 + fs * 0.36} fontSize={fs} fill={TXT}>{text}</text>
    </g>
  );
};

export const MplLine: React.FC<CardProps & { data: MplLineData }> = ({ tMs, w, h, fps, beats, data }) => {
  const pad = 0.045 * w;
  const fsTitle = 0.025 * w;
  const fs = 0.019 * w;
  const fsLand = 0.032 * w;
  const axL = 0.108 * w;
  const axR = w - pad;
  const axT = 0.05 * h + fsTitle * 1.35 + 0.03 * h;
  const axB = h - 0.04 * h - fs * 1.35 - fs * 1.6 - fs * 1.5;
  const axW = axR - axL;
  const axH = axB - axT;
  const px = (v: number) => axL + (v / 40) * axW;
  const py = (v: number) => axB - (v / 100) * axH;
  const fx = (f: number) => axL + f * axW;
  const fy = (f: number) => axB - f * axH;

  const pts = data.x.map((v, i) => [px(v), py(data.y[i])] as [number, number]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const p = interpolate(tMs, [beats.draw, beats.drawEnd], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }) * cum[cum.length - 1];
  let seg = 1;
  while (seg < pts.length - 1 && cum[seg] < p) seg++;
  const t = Math.max(0, Math.min(1, (p - cum[seg - 1]) / (cum[seg] - cum[seg - 1] || 1)));
  const head = [pts[seg - 1][0] + t * (pts[seg][0] - pts[seg - 1][0]),
    pts[seg - 1][1] + t * (pts[seg][1] - pts[seg - 1][1])];
  const poly = [...pts.slice(0, seg).map((q) => `${q[0]},${q[1]}`), `${head[0]},${head[1]}`].join(" ");

  const spr = (at: number) => spring({
    frame: Math.max(0, ((tMs - at) / 1000) * fps), fps,
    config: { damping: 15, stiffness: 330, mass: 0.7 },
  });
  const step = (beats.pointsEnd - beats.points) / Math.max(1, pts.length - 1);
  const land = tMs >= beats.land ? spr(beats.land) : 0;
  const last = pts[pts.length - 1];
  const legX = fx(0.02);
  const legY = fy(0.99);
  const noteX = fx(0.26);
  const noteY = fy(0.9);
  const arw = arrowTo(noteX + data.note.length * fs * 0.53 + 14, noteY - fs * 0.3, last);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FIG_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={FIG_FONT}>
        <text x={pad} y={0.05 * h + fsTitle} fontSize={fsTitle} fill={TXT}>{data.title}</text>
        <Axes axL={axL} axR={axR} axT={axT} axB={axB} fs={fs} px={px} py={py} />
        <polyline points={poly} fill="none" stroke={LINE} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((q, i) => {
          const at = beats.points + i * step;
          const s = SPOTS[i] ?? SPOTS[SPOTS.length - 1];
          return tMs < at ? null : (
            <Marker key={`p${i}`} q={q} ax={fx(s.fx)} ay={fy(s.fy)} end={s.end} note={data.notes[i]}
              fs={fs} pop={spr(at)} last={i === pts.length - 1} />
          );
        })}
        <Legend x={legX} y={legY} fs={fs} text={data.ylabel} />
        {land > 0 && (
          <g opacity={Math.min(1, land * 2.4)}>
            <text x={noteX} y={noteY} fontSize={fs} fontStyle="italic" fill={TXT}>{data.note}</text>
            <path d={arw.d} fill="none" stroke={TXT} strokeWidth={1.6} />
            <path d={arw.head} fill="none" stroke={TXT} strokeWidth={1.6} strokeLinecap="round" />
            <text x={fx(0.985)} y={fy(0.775)} textAnchor="end" fontSize={fsLand} fontWeight={700}
              style={{ fill: ACCENT }} transform={`translate(0 ${(1 - land) * fsLand * 0.45})`}>{data.land}</text>
          </g>
        )}
        <text x={axL - 0.062 * w} y={axT + axH / 2} transform={`rotate(-90 ${axL - 0.062 * w} ${axT + axH / 2})`}
          textAnchor="middle" fontSize={fs} fill={TXT}>{data.ylabel}</text>
        <text x={axL + axW / 2} y={axB + fs * 2.7} textAnchor="middle" fontSize={fs} fill={TXT}>{data.xlabel}</text>
        <text x={axR} y={h - 0.035 * h} textAnchor="end" fontSize={fs} fill="#7f7f7f">{data.source}</text>
      </svg>
    </div>
  );
};
