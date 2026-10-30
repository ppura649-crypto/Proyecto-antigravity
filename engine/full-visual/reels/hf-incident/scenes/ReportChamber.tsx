// The sandbox as a machine: a sealed steel-and-glass containment cell seen from above and to the right, with real
// depth. Brushed-steel front frame with rivets, a header housing that holds a padlock and a status lamp, a glass lid
// and a vented steel side, a dark lit interior (panelled back wall, gridded floor, an LED strip) where the agent lives.
// The front is a glass shutter that drops out of the header (`door` 0 open .. 1 shut), four steel bolts slide into it
// (`bolts`), the lamp goes green to red and the padlock's shackle drops (`red`). Local coordinates: the front face's
// top-left is (0,0); <Chamber> places the cell by the centre of its footprint (FOOT) and scales it.
import React, { useId } from "react";
import { interpolateColors } from "remotion";
import { GOOD, RED } from "./parts";

export const CELL = { W: 440, H: 400, T: 24, HD: 54, dx: 84, dy: -64 };
const { W, H, T, HD, dx, dy } = CELL;
/** the front opening, where the glass shutter runs */
export const OPEN = { x: T, y: HD, w: W - 2 * T, h: H - T - HD };
/** centre of the drawn footprint (front face plus depth), what <Chamber> positions */
export const FOOT = { x: (W + dx) / 2, y: (H + dy) / 2 };
/** where the agent floats: the middle of the room, halfway back */
export const ROOM = { x: OPEN.x + OPEN.w / 2 + dx * 0.45, y: OPEN.y + OPEN.h / 2 + dy * 0.45 + 18 };

const pts = (p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(" ");
const O = OPEN;

/** the room behind the glass: clipped to the opening, so only what you would see through it shows */
const Interior: React.FC<{ id: string; glow: number }> = ({ id, glow }) => {
  const floorY = O.y + O.h;
  const rows = [0.2, 0.45, 0.72];
  const cols = [1, 2, 3, 4, 5];
  return (
    <>
      <defs>
        <clipPath id={`o${id}`}><rect x={O.x} y={O.y} width={O.w} height={O.h} /></clipPath>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A141C" /><stop offset="1" stopColor="#132432" /></linearGradient>
        <linearGradient id={`fl${id}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#1C3244" /><stop offset="1" stopColor="#0E1B26" /></linearGradient>
        <radialGradient id={`g${id}`}><stop offset="0" stopColor="#5AC8FA" stopOpacity={0.55 * glow} /><stop offset="1" stopColor="#5AC8FA" stopOpacity={0} /></radialGradient>
      </defs>
      <g clipPath={`url(#o${id})`}>
        <rect x={O.x} y={O.y + dy} width={O.w + dx} height={O.h - dy} fill={`url(#b${id})`} />
        {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={O.x + dx + O.w * k} y1={O.y + dy} x2={O.x + dx + O.w * k} y2={floorY + dy} stroke="#1E3242" strokeWidth={2} />)}
        <polygon points={pts([[O.x, O.y], [O.x, floorY], [O.x + dx, floorY + dy], [O.x + dx, O.y + dy]])} fill="#08121A" />
        <polygon points={pts([[O.x, floorY], [O.x + O.w, floorY], [O.x + O.w + dx, floorY + dy], [O.x + dx, floorY + dy]])} fill={`url(#fl${id})`} />
        {rows.map((k) => <line key={k} x1={O.x + dx * k} y1={floorY + dy * k} x2={O.x + O.w + dx * k} y2={floorY + dy * k} stroke="#5AC8FA" strokeOpacity={0.16} strokeWidth={1.5} />)}
        {cols.map((k) => <line key={k} x1={O.x + (O.w * k) / 6} y1={floorY} x2={O.x + (O.w * k) / 6 + dx} y2={floorY + dy} stroke="#5AC8FA" strokeOpacity={0.16} strokeWidth={1.5} />)}
        <ellipse cx={ROOM.x} cy={ROOM.y} rx={O.w * 0.55} ry={O.h * 0.5} fill={`url(#g${id})`} />
        {/* the LED strip under the header, lighting the cell */}
        <rect x={O.x} y={O.y} width={O.w} height={5} fill="#DDF4FF" opacity={0.9} />
        <rect x={O.x} y={O.y + 5} width={O.w} height={26} fill="#BFEAFF" opacity={0.1} />
      </g>
    </>
  );
};

const Rivet: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 4.6 }) => (
  <g>
    <circle cx={x} cy={y + 1} r={r} fill="#000" opacity={0.25} />
    <circle cx={x} cy={y} r={r} fill="url(#rivet)" stroke="#59616A" strokeWidth={0.8} />
  </g>
);

/** the outside of the cell: glass lid, vented steel side, the edge beams */
const Shell: React.FC<{ id: string; f: number }> = ({ id, f }) => {
  const sweep = ((f * 0.6) % 260) / 260;
  const beam = (a: number[], b: number[], k: number) => (
    <g key={k}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#5C646D" strokeWidth={12} strokeLinecap="round" />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#C8CED5" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      <polygon points={pts([[W, 0], [W + dx, dy], [W + dx, H + dy], [W, H]])} fill={`url(#side${id})`} />
      {[0.3, 0.4, 0.5, 0.6, 0.7].map((k) => (
        <line key={k} x1={W + dx * 0.25} y1={H * k + dy * 0.25} x2={W + dx * 0.75} y2={H * k + dy * 0.75} stroke="#3E454D" strokeWidth={6} strokeLinecap="round" />
      ))}
      <polygon points={pts([[0, 0], [W, 0], [W + dx, dy], [dx, dy]])} fill="#10202C" opacity={0.92} />
      <polygon points={pts([[0, 0], [W, 0], [W + dx, dy], [dx, dy]])} fill={`url(#lid${id})`} />
      <polygon points={pts([[W * (0.1 + sweep), 0], [W * (0.1 + sweep) + 40, 0], [W * (0.1 + sweep) + 40 + dx, dy], [W * (0.1 + sweep) + dx, dy]])} fill="#FFFFFF" opacity={0.28} />
      {beam([0, 0], [dx, dy], 1)}
      {beam([dx, dy], [W + dx, dy], 2)}
      {beam([W + dx, dy], [W + dx, H + dy], 3)}
      {beam([W, 0], [W + dx, dy], 4)}
      {beam([W, H], [W + dx, H + dy], 5)}
      <Rivet x={dx} y={dy} />
      <Rivet x={W + dx} y={dy} />
      <Rivet x={W + dx} y={H + dy} />
    </>
  );
};

/** the brushed-steel front frame with its header, padlock and status lamp */
const Frame: React.FC<{ id: string; red: number }> = ({ id, red }) => {
  const lamp = interpolateColors(red, [0, 1], [GOOD, RED]);
  const shackle = 7 * (1 - red);
  const rivetsX = [16, 70, 130, W - 130, W - 70, W - 16];
  return (
    <>
      <path d={`M0 0 H${W} V${H} H0 Z M${O.x} ${O.y} V${O.y + O.h} H${O.x + O.w} V${O.y} Z`} fillRule="evenodd" fill={`url(#steel${id})`} stroke="#48505A" strokeWidth={2} />
      <rect x={O.x - 2} y={O.y - 2} width={O.w + 4} height={O.h + 4} fill="none" stroke="#343B43" strokeWidth={4} />
      <line x1={6} y1={HD - 12} x2={W - 6} y2={HD - 12} stroke="#8D959E" strokeWidth={1.5} />
      <rect x={O.x} y={O.y - 6} width={O.w} height={6} fill="#1D2329" />
      {rivetsX.map((x) => <Rivet key={x} x={x} y={14} />)}
      {[O.y + 20, O.y + O.h / 2, O.y + O.h - 12].map((y) => [<Rivet key={`l${y}`} x={T / 2} y={y} />, <Rivet key={`r${y}`} x={W - T / 2} y={y} />])}
      {[T / 2, W / 2, W - T / 2].map((x) => <Rivet key={`b${x}`} x={x} y={H - T / 2} />)}
      {/* padlock: its shackle drops shut with the lamp */}
      <g transform={`translate(${W / 2 - 60} 8)`}>
        <path d={`M5 ${14 - shackle} V${8 - shackle} a8 8 0 0 1 16 0 V${14 - shackle}`} fill="none" stroke="#2A3037" strokeWidth={4} />
        <rect x={0} y={13} width={26} height={19} rx={4} fill="#2A3037" />
        <circle cx={13} cy={22} r={3} fill="#C8CED5" />
      </g>
      {/* the status lamp in its bezel */}
      <circle cx={W / 2 + 20} cy={27} r={17} fill="#23292F" />
      <circle cx={W / 2 + 20} cy={27} r={26} fill={lamp} opacity={0.28} />
      <circle cx={W / 2 + 20} cy={27} r={11.5} fill={lamp} />
      <circle cx={W / 2 + 16.5} cy={23} r={4} fill="#FFFFFF" opacity={0.8} />
    </>
  );
};

/** the glass shutter, dropping out of the header, and the bolts that pin it */
const Door: React.FC<{ id: string; door: number; bolts: number; f: number }> = ({ id, door, bolts, f }) => {
  const bottom = O.y + O.h * door;
  const shift = Math.sin(f / 50) * 14;
  const boltYs = [O.y + O.h * 0.3, O.y + O.h * 0.76];
  return (
    <>
      <defs><clipPath id={`d${id}`}><rect x={O.x} y={O.y} width={O.w} height={Math.max(0, O.h * door)} /></clipPath></defs>
      {door > 0.01 && (
        <g clipPath={`url(#d${id})`}>
          <rect x={O.x} y={O.y} width={O.w} height={O.h} fill={`url(#glass${id})`} />
          <polygon points={pts([[O.x + 40 + shift, O.y + O.h], [O.x + 150 + shift, O.y + O.h], [O.x + 290 + shift, O.y], [O.x + 180 + shift, O.y]])} fill="#FFFFFF" opacity={0.2} />
          <polygon points={pts([[O.x + 200 + shift, O.y + O.h], [O.x + 225 + shift, O.y + O.h], [O.x + 365 + shift, O.y], [O.x + 340 + shift, O.y]])} fill="#FFFFFF" opacity={0.3} />
          <rect x={O.x} y={bottom - 10} width={O.w} height={10} fill="#262C32" />
          <rect x={O.x} y={bottom - 10} width={O.w} height={2} fill="#9AA3AC" />
        </g>
      )}
      {boltYs.map((y) => [
        <g key={`L${y}`}>
          <rect x={O.x - 4} y={y - 9} width={10 + 30 * bolts} height={18} rx={4} fill={`url(#bolt${id})`} stroke="#3B424A" strokeWidth={1.2} />
          <rect x={2} y={y - 15} width={T - 4} height={30} rx={4} fill="#6D757E" stroke="#3B424A" strokeWidth={1.2} />
        </g>,
        <g key={`R${y}`}>
          <rect x={O.x + O.w - 6 - 30 * bolts} y={y - 9} width={10 + 30 * bolts} height={18} rx={4} fill={`url(#bolt${id})`} stroke="#3B424A" strokeWidth={1.2} />
          <rect x={W - T + 2} y={y - 15} width={T - 4} height={30} rx={4} fill="#6D757E" stroke="#3B424A" strokeWidth={1.2} />
        </g>,
      ])}
    </>
  );
};

const Defs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`steel${id}`} x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#F1F4F7" /><stop offset="0.5" stopColor="#C3C9D0" /><stop offset="1" stopColor="#8F979F" /></linearGradient>
    <linearGradient id={`side${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A4ACB5" /><stop offset="1" stopColor="#6A727B" /></linearGradient>
    <linearGradient id={`lid${id}`} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#BFE9FF" stopOpacity={0.35} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.12} /></linearGradient>
    <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D8F3FF" stopOpacity={0.3} /><stop offset="0.5" stopColor="#9FDBF7" stopOpacity={0.1} /><stop offset="1" stopColor="#D8F3FF" stopOpacity={0.24} /></linearGradient>
    <linearGradient id={`bolt${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F4F6" /><stop offset="1" stopColor="#7C848D" /></linearGradient>
    <radialGradient id={`sh${id}`}><stop offset="0.35" stopColor="#0B1620" stopOpacity={0.24} /><stop offset="1" stopColor="#0B1620" stopOpacity={0} /></radialGradient>
    <radialGradient id="rivet" cx="0.35" cy="0.3"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#7A828B" /></radialGradient>
  </defs>
);

export type ChamberProps = {
  /** centre of the footprint, in column coordinates, and the cell's scale */
  x: number; y: number; scale: number;
  door: number; bolts: number; red: number; f: number;
  glow?: number; opacity?: number; blur?: number;
  /** what lives inside, in local coordinates (drawn between the room and the glass) */
  children?: React.ReactNode;
};

export const Chamber: React.FC<ChamberProps> = ({ x, y, scale, door, bolts, red, f, glow = 1, opacity = 1, blur = 0, children }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const box = { left: -30, top: dy - 30, width: W + dx + 60, height: H - dy + 90 };
  const svg = (inner: React.ReactNode) => (
    <svg width={box.width} height={box.height} viewBox={`${box.left} ${box.top} ${box.width} ${box.height}`} style={{ position: "absolute", left: box.left, top: box.top, overflow: "visible" }}>
      {inner}
    </svg>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity, transform: `scale(${scale.toFixed(4)})`, transformOrigin: "0 0", filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <div style={{ position: "absolute", left: -FOOT.x, top: -FOOT.y }}>
        {svg(
          <>
            <Defs id={id} />
            <ellipse cx={FOOT.x + 20} cy={H + dy / 2 + 22} rx={(W + dx) * 0.62} ry={62} fill={`url(#sh${id})`} />
            <Interior id={id} glow={glow} />
          </>,
        )}
        <div style={{ position: "absolute", left: 0, top: 0 }}>{children}</div>
        {svg(
          <>
            <Defs id={id} />
            <Shell id={id} f={f} />
            <Frame id={id} red={red} />
            <Door id={id} door={door} bolts={bolts} f={f} />
          </>,
        )}
      </div>
    </div>
  );
};
