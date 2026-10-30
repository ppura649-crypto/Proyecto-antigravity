// `logs`: covering their tracks. A trail of small glowing agent footprints walks out of the logbook, off its page and
// across the dark desk to the edge of frame. On "covering" an agent with a broom sweeps back along the trail from
// the far end, each print dying in a puff of dust as the bristles pass; the book has shut over the prints on its
// page. On "tracks" a brass hasp and padlock snap onto the closed book. Metaphor only (METR: agents "tried
// extensively to retroactively edit their transcripts").
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { Agent, RED } from "./parts";

type Pt = { x: number; y: number };
/** the trail, column coordinates: from the left page, down off the book, across the desk and out of frame */
const TRAIL: Pt[] = [
  { x: 170, y: 1120 }, { x: 215, y: 1200 }, { x: 270, y: 1300 }, { x: 350, y: 1362 }, { x: 470, y: 1392 },
  { x: 610, y: 1384 }, { x: 740, y: 1398 }, { x: 880, y: 1388 },
];
const STEP = 52;
/** the book's lower edge: prints above it are on the page and are hidden by the closing cover */
const BOOK_EDGE = 1276;

const SEGS = TRAIL.slice(1).map((b, i) => {
  const a = TRAIL[i];
  return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) };
});
const LEN = SEGS.reduce((s, g) => s + g.len, 0);

const along = (s: number): Pt & { ang: number } => {
  let rest = Math.max(0, Math.min(LEN, s));
  for (const g of SEGS) {
    if (rest <= g.len) {
      const t = rest / g.len;
      return { x: g.a.x + (g.b.x - g.a.x) * t, y: g.a.y + (g.b.y - g.a.y) * t, ang: Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x) };
    }
    rest -= g.len;
  }
  const g = SEGS[SEGS.length - 1];
  return { ...g.b, ang: Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x) };
};

const PRINTS = Array.from({ length: Math.floor(LEN / STEP) }, (_, i) => {
  const s = 20 + i * STEP;
  const p = along(s);
  const side = i % 2 === 0 ? 1 : -1;
  return { s, x: p.x - Math.sin(p.ang) * 11 * side * 1.5, y: p.y + Math.cos(p.ang) * 11 * side * 1.5, ang: p.ang, onPage: p.y < BOOK_EDGE - 10 };
});
/** the arc length the sweeper stops at: the book's edge */
const EDGE_S = PRINTS.find((p) => !p.onPage)?.s ?? 0;

export type TrackCues = { walk: number; sweep: number; sweepEnd: number; lock: number };

/** where the broom's bristles are along the trail at frame f: from past the far end back to the book's edge */
const sweepS = (f: number, c: TrackCues) => LEN + 60 - (LEN + 60 - (EDGE_S - 30)) * prog(f, c.sweep, c.sweepEnd - c.sweep, ease.inOut);

const Print: React.FC<{ x: number; y: number; ang: number; o: number; pop: number }> = ({ x, y, ang, o, pop }) => (
  <div style={{ position: "absolute", left: x - 14, top: y - 9, width: 28, height: 18, opacity: o, transform: `rotate(${ang.toFixed(3)}rad) scale(${(1.6 + 0.6 * pop).toFixed(3)})` }}>
    <div style={{ position: "absolute", left: 10, top: 1, width: 18, height: 16, borderRadius: "50% 60% 60% 50%", background: RED, boxShadow: `0 0 10px ${RED}` }} />
    <div style={{ position: "absolute", left: 0, top: 4, width: 9, height: 10, borderRadius: 4, background: RED, boxShadow: `0 0 8px ${RED}` }} />
  </div>
);

/** the prints: stamped one by one from the page outward, then each one dies as the broom passes it */
export const LogsTrail: React.FC<{ c: TrackCues; part: "page" | "desk" }> = ({ c, part }) => {
  const { f } = useScene();
  if (f < c.walk) return null;
  const every = Math.max(2, (c.sweep - c.walk) / PRINTS.length);
  const sw = f >= c.sweep ? sweepS(f, c) : Infinity;
  return (
    <>
      {PRINTS.map((p, i) => {
        const at = c.walk + i * every;
        if (f < at || p.onPage !== (part === "page")) return null;
        const o0 = 0.55 + 0.25 * Math.sin(f / 5 + i) + 0.2 * (1 - prog(f, at, 10));
        const o = !p.onPage && sw < p.s + 10 ? o0 * Math.max(0, (sw - (p.s - 14)) / 24) : o0;
        const gone = !p.onPage && sw <= p.s - 14;
        return (
          <React.Fragment key={i}>
            {!gone && <Print x={p.x} y={p.y} ang={p.ang} o={Math.max(0, o)} pop={1 - prog(f, at, 6)} />}
            {!p.onPage && sw < p.s + 10 && sw > p.s - 90 && <Dust x={p.x} y={p.y} k={(p.s + 10 - sw) / 100} seed={i} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

const Dust: React.FC<{ x: number; y: number; k: number; seed: number }> = ({ x, y, k, seed }) => (
  <>
    {[0, 1, 2].map((j) => {
      const a = -Math.PI / 2 + (j - 1) * 0.9 + seed;
      return <div key={j} style={{ position: "absolute", left: x + Math.cos(a) * 40 * k - 10, top: y + Math.sin(a) * 34 * k - 10 - 20 * k, width: 20 + 26 * k, height: 20 + 26 * k, borderRadius: "50%", background: "rgba(170,160,150,0.5)", opacity: Math.max(0, 0.7 * (1 - k)), filter: "blur(4px)" }} />;
    })}
  </>
);

/** the sweeper: an agent pushing a broom back along its own trail, bristles on the trail */
export const LogsSweeper: React.FC<{ c: TrackCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.sweep - 2 || f > c.sweepEnd + 30) return null;
  const s = sweepS(f, c);
  const p = along(s);
  const swish = Math.sin(f / 2.2) * 10;
  const ax = p.x + 96;
  const ay = p.y - 86;
  const o = prog(f, c.sweep - 2, 4) * (1 - prog(f, c.sweepEnd + 14, 14));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`rotate(${swish.toFixed(2)} ${ax} ${ay})`}>
          <line x1={ax} y1={ay} x2={p.x} y2={p.y - 6} stroke="#8A5A2B" strokeWidth={8} strokeLinecap="round" />
          <path d={`M${p.x - 8} ${p.y - 14} L${p.x + 10} ${p.y - 2} L${p.x - 10} ${p.y + 26} L${p.x - 44} ${p.y + 4} Z`} fill="#C9A45C" stroke="#8C6A2E" strokeWidth={3} />
          {[0, 1, 2, 3].map((j) => <line key={j} x1={p.x - 6 - j * 8} y1={p.y - 8 + j * 3} x2={p.x - 14 - j * 9} y2={p.y + 20 - j * 2} stroke="#8C6A2E" strokeWidth={2} />)}
        </g>
      </svg>
      <Agent x={ax + 10} y={ay - 8} r={20} color={RED} glow={1.3 + 0.3 * Math.sin(f / 4)} />
    </div>
  );
};

/** the hasp and padlock on the closed book's open edge (x 64), snapping shut on "tracks" */
export const LogsLock: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const { f } = useScene();
  if (f < at) return null;
  const drop = prog(f, at, 7, ease.back);
  const shut = prog(f, at + 5, 5, ease.in);
  const glint = Math.max(0, Math.sin((f - at) / 7));
  return (
    <svg width={200} height={240} viewBox="-100 -120 200 240" style={{ position: "absolute", left: x - 100, top: y - 120, overflow: "visible", opacity: prog(f, at, 3), filter: "drop-shadow(0 10px 8px rgba(0,0,0,0.6))" }}>
      <rect x={-60} y={-86} width={120} height={34} rx={8} fill="#8C6A2E" />
      <rect x={-60} y={-86} width={120} height={12} rx={6} fill="#C9A45C" />
      <g transform={`translate(0 ${((1 - drop) * -120).toFixed(1)})`}>
        <path d={`M-22 0 L-22 ${(-40 + 16 * shut).toFixed(1)} A22 22 0 0 1 22 ${(-40 + 16 * shut).toFixed(1)} L22 0`} fill="none" stroke="#B8BEC7" strokeWidth={11} />
        <rect x={-40} y={-4} width={80} height={66} rx={12} fill="#B8892C" />
        <rect x={-40} y={-4} width={80} height={18} rx={9} fill="#E0B24C" opacity={0.6 + 0.4 * glint} />
        <circle cx={0} cy={26} r={8} fill="#2A1C06" /><rect x={-3.5} y={28} width={7} height={18} rx={3} fill="#2A1C06" />
      </g>
    </svg>
  );
};
