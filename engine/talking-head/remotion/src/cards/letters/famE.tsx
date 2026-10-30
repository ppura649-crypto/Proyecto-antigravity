import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, Chip, clamp01, easeOut } from "./shared";
import { BinBody, BinBack, EnvelopeFace, FlickHand, FlyerFace, Ink, type BinGeom } from "./Eparts";

// edit-i-oneshot, family E: the two jokes and the plan.
// trojan (V10) is the real painting with our letter tucked under the horse. floorplan (V12) is an
// office drawn the way a building plan is drawn, and the envelope walking its corridor to the one
// desk that has a name on it. flyer (V13) is the thing that happens to everything else: a glossy
// colour-block A5 on the corner of a desk, flicked into the bin in one arc.

const sp = (tMs: number, at: number, fps: number, damping = 15): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping, stiffness: 300, mass: 0.7 } });

const smooth = (u: number): number => { const x = clamp01(u); return x * x * (3 - 2 * x); };

// ─────────────────────────────────────────────────────────────────────────────
// V10 trojan: "I call this the Trojan Horse strategy."
// Giovanni Domenico Tiepolo, The Procession of the Trojan Horse in Troy (public domain).
// Framed on the horse: the gate at the left, the crowd hauling at the right, the horse
// filling the middle. The camera pushes toward the belly, and on the name the envelope
// slides up from under the card and tucks in behind the horse's underside.
// ─────────────────────────────────────────────────────────────────────────────

export type TrojanData = { name: string; painting?: string };

// the region of the 3840x2238 canvas the card shows (picked by eye on the painting)
const CROP = { iw: 3840, ih: 2238, x: 0, y: 105, w: 2995, h: 1678 };

// the horse's underside, traced on that crop: everything above this line is horse, and the
// envelope slides in behind it
const BELLY = [
  "0% 0%", "100% 0%", "100% 51.2%",
  "60.4% 51.2%", "56.4% 54.2%", "53.3% 57.5%", "50.3% 60.0%", "47.3% 61.8%", "44.3% 62.7%",
  "41.3% 62.9%", "38.2% 62.5%", "35.2% 61.8%", "32.2% 60.7%", "29.2% 59.3%", "26.2% 57.5%",
  "23.1% 55.7%", "20.1% 53.9%", "17.1% 52.4%", "0% 52.4%",
].join(", ");

const Trojan: React.FC<CardProps & { data: TrojanData }> = ({ tMs, w, h, toMs, beats, assets, data }) => {
  const b = beats;
  const s = Math.max(w / CROP.w, h / CROP.h);
  const img: React.CSSProperties = {
    position: "absolute",
    left: -(CROP.x * s) - (CROP.w * s - w) / 2,
    top: -(CROP.y * s) - (CROP.h * s - h) / 2,
    width: CROP.iw * s, height: CROP.ih * s, display: "block",
  };

  // one continuous push toward the belly, 8.5 % over what is left of the card
  const push = 1 + 0.085 * smooth(clamp01((tMs - b.push) / (toMs - b.push)));

  // the envelope: up from below the card's edge, tucking under the belly, then still
  // it comes to rest tilted with the belly line, its top third behind the horse's underside
  const envW = 0.245 * w;
  const restTop = 0.486 * h;
  const slide = easeOut(clamp01((tMs - b.trojan) / 540));
  const envTop = restTop + (1 - slide) * (h + 40 - restTop);
  const rot = 11 - 7 * slide;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#E9E3D7" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "34% 56%" }}>
        <Img src={staticFile(assets[0])} style={img} />

        {slide > 0.001 && (
          <div
            style={{
              position: "absolute", left: 0.337 * w - envW / 2, top: envTop,
              transform: `rotate(${rot}deg)`, transformOrigin: "50% 22%",
            }}
          >
            <EnvelopeFace w={envW} name={data.name} shade={0.95 * slide * slide} shadow="0 14px 30px rgba(0,0,0,0.42)" />
          </div>
        )}

        {/* the horse again, cut to its own underside, so the envelope goes BEHIND it */}
        <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${BELLY})` }}>
          <Img src={staticFile(assets[0])} style={img} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V12 floorplan: "And most likely it gets to the dedicated person."
// An office seen from above in a building plan's own grammar: thin walls, door swings as
// quarter arcs, desks with a chair each, a reception counter at the entrance. The plan draws
// itself, then the envelope walks the corridor and turns into the one room with a name on it.
// ─────────────────────────────────────────────────────────────────────────────

export type FloorplanData = { plate: string };

type Seg = { d: string; sw: number };

const Floorplan: React.FC<CardProps & { data: FloorplanData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const b = beats;
  const X = (f: number): number => f * w;
  const Y = (f: number): number => f * h;

  const OX = X(0.022), OY = Y(0.055), OR = X(0.978), OB = Y(0.945);
  const CT = Y(0.455), CB = Y(0.605);       // the corridor's two walls
  const LOB = X(0.185), MID = X(0.47), OFX = X(0.70);
  const E1 = Y(0.66), E2 = Y(0.80);          // the way in, a gap in the left wall
  const DOOR = { a1: X(0.296), a2: X(0.487), off: X(0.715), b1: X(0.296), b2: X(0.487) };
  const DW = X(0.062);                        // a door's width
  const DWO = X(0.055);                       // the corner office's door

  // ── the walls
  const walls: Seg[] = [
    { d: `M${OX},${E1} L${OX},${OY} L${OR},${OY} L${OR},${OB} L${OX},${OB} L${OX},${E2}`, sw: 4.2 },
    { d: `M${LOB},${CT} L${DOOR.a1},${CT} M${DOOR.a1 + DW},${CT} L${DOOR.a2},${CT}`
       + ` M${DOOR.a2 + DW},${CT} L${DOOR.off},${CT} M${DOOR.off + DWO},${CT} L${OR},${CT}`, sw: 3 },
    { d: `M${LOB},${CB} L${DOOR.b1},${CB} M${DOOR.b1 + DW},${CB} L${DOOR.b2},${CB} M${DOOR.b2 + DW},${CB} L${OR},${CB}`, sw: 3 },
    { d: `M${LOB},${OY} L${LOB},${CT} M${LOB},${CB} L${LOB},${OB}`, sw: 3 },
    { d: `M${MID},${OY} L${MID},${CT} M${MID},${CB} L${MID},${OB}`, sw: 3 },
    { d: `M${OFX},${OY} L${OFX},${CT}`, sw: 3 },
  ];

  // ── the door swings
  const swingUp = (x: number, r: number): string =>
    `M${x},${CT} L${x},${CT - r} M${x + r},${CT} A${r},${r} 0 0 0 ${x},${CT - r}`;
  const swingDown = (x: number, r: number): string =>
    `M${x},${CB} L${x},${CB + r} M${x + r},${CB} A${r},${r} 0 0 1 ${x},${CB + r}`;
  const doors: string[] = [
    `M${OX},${E1} L${OX + (E2 - E1)},${E1} M${OX + (E2 - E1)},${E1} A${E2 - E1},${E2 - E1} 0 0 1 ${OX},${E2}`,
    swingUp(DOOR.a1, DW), swingUp(DOOR.a2, DW), swingUp(DOOR.off, DWO),
    swingDown(DOOR.b1, DW), swingDown(DOOR.b2, DW),
  ];

  // ── the furniture: a desk is a top and a chair, a chair is a seat and a back
  const chair = (cx: number, cy: number, dir: 1 | -1): string => {
    const r = X(0.0125), br = X(0.0165);
    return `M${cx - r},${cy} A${r},${r} 0 0 ${dir === 1 ? 0 : 1} ${cx + r},${cy}`
      + ` M${cx - r},${cy} L${cx + r},${cy}`
      + ` M${cx - br},${cy + dir * 0.35 * br} A${br},${br} 0 0 ${dir === 1 ? 1 : 0} ${cx + br},${cy + dir * 0.35 * br}`;
  };
  const desk = (x: number, y: number, dw: number, dh: number, dir: 1 | -1): string[] => [
    `M${x},${y} L${x + dw},${y} L${x + dw},${y + dh} L${x},${y + dh} Z`,
    chair(x + dw / 2, dir === 1 ? y + dh + X(0.019) : y - X(0.019), dir),
  ];

  const DW2 = X(0.078), DH2 = Y(0.089);
  const rect = (x1: number, y1: number, x2: number, y2: number): string =>
    `M${x1},${y1} L${x2},${y1} L${x2},${y2} L${x1},${y2} Z`;
  const furniture: string[] = [
    // the reception counter along the lobby's inner edge, and the seat behind it
    `M${X(0.045)},${Y(0.300)} L${X(0.075)},${Y(0.300)} L${X(0.075)},${Y(0.385)} L${X(0.165)},${Y(0.385)}`
      + ` L${X(0.165)},${Y(0.445)} L${X(0.045)},${Y(0.445)} Z`,
    chair(X(0.112), Y(0.352), -1),
    // the waiting bench by the way in
    rect(X(0.050), Y(0.855), X(0.160), Y(0.900)),
    // the open plan above the corridor
    ...desk(X(0.200), Y(0.100), DW2, DH2, 1), ...desk(X(0.372), Y(0.100), DW2, DH2, 1),
    ...desk(X(0.200), Y(0.285), DW2, DH2, 1), ...desk(X(0.372), Y(0.285), DW2, DH2, 1),
    ...desk(X(0.575), Y(0.100), DW2, DH2, 1), ...desk(X(0.575), Y(0.285), DW2, DH2, 1),
    // the open plan below it
    ...desk(X(0.200), Y(0.680), DW2, DH2, 1), ...desk(X(0.372), Y(0.680), DW2, DH2, 1),
    // the meeting room
    rect(X(0.600), Y(0.685), X(0.925), Y(0.845)),
    chair(X(0.645), Y(0.655), -1), chair(X(0.720), Y(0.655), -1), chair(X(0.795), Y(0.655), -1), chair(X(0.870), Y(0.655), -1),
    chair(X(0.645), Y(0.877), 1), chair(X(0.720), Y(0.877), 1), chair(X(0.795), Y(0.877), 1), chair(X(0.870), Y(0.877), 1),
    // the corner office: one desk, one chair
    rect(X(0.790), Y(0.240), X(0.930), Y(0.355)),
    chair(X(0.860), Y(0.405), 1),
  ];

  // ── the plan drawing itself: walls, then the doors, then everything you sit at
  const drawn = (from: number, span: number, i: number, n: number): number => {
    const st = from + (span * 0.45 * i) / Math.max(1, n);
    return clamp01((tMs - st) / (span * 0.55));
  };
  const W0 = fromMs, WD = 440, D0 = fromMs + 450, DD = 280, F0 = fromMs + 710, FD = 540;

  // ── the envelope's walk: off the counter, down the corridor, the turn, the desk
  const P = [
    [X(0.115), Y(0.415)], [X(0.215), Y(0.545)], [X(0.7425), Y(0.545)], [X(0.7425), Y(0.370)], [X(0.860), Y(0.297)],
  ];
  const seg = (i: number): number => Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
  const L01 = seg(0) + seg(1), L23 = seg(2) + seg(3);
  // it leaves on `sure`, runs the corridor to `gets`, then turns and slows onto the desk by `dedicated`
  const walked = tMs < b.sure ? 0
    : tMs < b.gets ? L01 * Math.pow(clamp01((tMs - b.sure) / (b.gets - b.sure)), 1.22)
      : L01 + L23 * (1 - Math.pow(1 - clamp01((tMs - b.gets) / (b.dedicated - b.gets)), 1.9));

  const trail: string[] = [`M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`];
  let ex = P[0][0], ey = P[0][1], rest = walked;
  for (let i = 0; i < 4; i++) {
    const l = seg(i);
    if (rest >= l) {
      ex = P[i + 1][0]; ey = P[i + 1][1]; rest -= l;
      trail.push(`L${ex.toFixed(1)},${ey.toFixed(1)}`);
    } else {
      if (rest > 0) {
        const u = rest / l;
        ex = P[i][0] + (P[i + 1][0] - P[i][0]) * u;
        ey = P[i][1] + (P[i + 1][1] - P[i][1]) * u;
        trail.push(`L${ex.toFixed(1)},${ey.toFixed(1)}`);
      }
      break;
    }
  }

  const envW = X(0.053);
  const envPop = sp(tMs, fromMs + 1000, fps, 13);
  const land = sp(tMs, b.dedicated, fps, 11);
  const tick = sp(tMs, b.dedicated + 170, fps, 12);
  const plate = sp(tMs, fromMs + 1060, fps, 14);
  const tickR = X(0.026);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, display: "block", overflow: "visible" }}>
        {walls.map((s2, i) => <Ink key={`w${i}`} d={s2.d} sw={s2.sw} halo={6} cap="square" p={drawn(W0, WD, i, walls.length)} />)}
        {doors.map((d, i) => <Ink key={`d${i}`} d={d} sw={2.1} halo={4.4} p={drawn(D0, DD, i, doors.length)} />)}
        {furniture.map((d, i) => <Ink key={`f${i}`} d={d} sw={2.1} halo={4.4} p={drawn(F0, FD, i, furniture.length)} />)}

        {/* where it has been */}
        {tMs > b.sure && (
          <>
            <path d={trail.join(" ")} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={7}
              strokeDasharray="5 13" strokeLinecap="round" />
            <path d={trail.join(" ")} fill="none" stroke={ACCENT} strokeWidth={3.2}
              strokeDasharray="5 13" strokeLinecap="round" />
          </>
        )}

        {/* it arrived */}
        {tick > 0.01 && (
          <g
            transform={`translate(${X(0.908)},${Y(0.262)}) scale(${0.4 + 0.6 * Math.min(1.08, tick)})`}
            opacity={Math.min(1, tick * 1.8)}
          >
            <path d={`M${-tickR * 0.52},0 L${-tickR * 0.12},${tickR * 0.42} L${tickR * 0.6},${-tickR * 0.52}`}
              fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${-tickR * 0.52},0 L${-tickR * 0.12},${tickR * 0.42} L${tickR * 0.6},${-tickR * 0.52}`}
              fill="none" stroke={ACCENT} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>

      {/* the name on the one door it is going to */}
      {plate > 0.01 && (
        <div
          style={{
            position: "absolute", left: X(0.855), top: Y(0.128), transform: `translate(-50%,-50%) scale(${0.86 + 0.14 * plate})`,
            opacity: Math.min(1, plate * 1.8),
          }}
        >
          <Chip text={data.plate} fs={28} />
        </div>
      )}

      {/* the envelope itself */}
      {envPop > 0.01 && (
        <div
          style={{
            position: "absolute", left: ex, top: ey,
            transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * Math.min(1, envPop)) * (1 + 0.10 * Math.min(1, land) * (1 - Math.min(1, land)) * 4)})`,
            opacity: Math.min(1, envPop * 2),
          }}
        >
          <EnvelopeFace w={envW} shadow="0 4px 10px rgba(0,0,0,0.26)" />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V13 flyer: "Whereas a flyer just gets binned at the desk."
// The corner of a desk, a wire bin at its foot, and a glossy A5 with nothing written on it.
// A hand comes in, flicks it, and it goes in one arc into the bin and stays there.
// ─────────────────────────────────────────────────────────────────────────────

const Flyer: React.FC<CardProps & { data: Record<string, unknown> }> = ({ tMs, w, h, fps, fromMs, beats }) => {
  const b = beats;
  const k = w / 864;                    // the scene was drawn for a 864 px card
  const S = (v: number): number => v * k;

  // the desk: a top seen from above and in front, a front edge with thickness, one solid leg
  const FL = [S(-90), S(148)], FR = [S(400), S(103)], NR = [S(495), S(272)], NL = [S(5), S(317)];
  const TH = S(26);
  const deskTop = `M${FL[0]},${FL[1]} L${FR[0]},${FR[1]} L${NR[0]},${NR[1]} L${NL[0]},${NL[1]} Z`;
  const deskFront = `M${NL[0]},${NL[1]} L${NL[0]},${NL[1] + TH} L${NR[0]},${NR[1] + TH} L${NR[0]},${NR[1]}`
    + ` M${NR[0]},${NR[1] + TH} L${FR[0]},${FR[1] + TH} L${FR[0]},${FR[1]}`;
  const leg = `M${S(460)},${S(301)} L${S(495)},${S(298)} L${S(495)},${S(486)} L${S(460)},${S(489)} Z`
    + ` M${S(477)},${S(300)} L${S(477)},${S(488)}`;

  const bin: BinGeom = { cx: S(596), rx: S(102), ry: S(30), topY: S(324), botY: S(486), brx: S(76), bry: S(22) };

  // the flyer lying in the desk's plane
  const FW = S(140), FH = S(198), FORE = 0.60;
  const ux = 0.9951, uy = -0.0995, vx = 0.4900 * FORE, vy = 0.8716 * FORE;
  const ox = S(230), oy = S(175);
  const restCx = ox + 0.5 * FW * ux + 0.5 * FH * vx;
  const restCy = oy + 0.5 * FW * uy + 0.5 * FH * vy;
  const lay = `matrix(${ux},${uy},${vx},${vy},${ox - restCx},${oy - restCy})`;

  // the ink of the scene draws in with the card, then nothing moves until the flyer lands
  const sceneP = clamp01((tMs - fromMs) / 340);
  // it lands ON the word: already at 0.55 on the beat's own frame, settled 150 ms later
  const pop = tMs >= b.flyer ? 0.55 + 0.45 * sp(tMs, b.flyer, fps, 12) : 0;

  // the flick, and then one arc into the bin
  const HAND0 = b.binned, HAND_IN = 150, FLY0 = b.binned + 150, FLY_MS = 380, SET_MS = 90;
  const hIn = easeOut(clamp01((tMs - HAND0) / HAND_IN));
  const hOut = easeOut(clamp01((tMs - (b.binned + 200)) / 260));
  const hFrom = S(-330), hTo = S(-16);
  const hx = hFrom + (hTo - hFrom) * hIn - (hTo - hFrom) * hOut;
  const handOn = tMs >= HAND0 && hOut < 0.995;

  const f = clamp01((tMs - FLY0) / FLY_MS);
  const settle = clamp01((tMs - (FLY0 + FLY_MS)) / SET_MS);
  const tgtX = bin.cx - S(6), tgtY = S(396);
  const flyX = f < 1 ? restCx + (tgtX - restCx) * f : tgtX;
  const flyY = f < 1 ? restCy + (tgtY - restCy) * f - 4 * S(122) * f * (1 - f) : tgtY + S(24) * easeOut(settle);
  const flyRot = 235 * (f < 1 ? f : 1) - 38 * easeOut(settle);
  const flyScale = 1 - 0.22 * (f < 1 ? f : 1);
  // it is only cut to the bin's inside once it has settled there (by then it is fully
  // inside the silhouette, so the cut changes nothing and nothing jumps on the frame)
  const inBin = f >= 1;
  const drop = S(18) * (1 - Math.min(1, pop));   // it lands on the desk, it does not fade on

  const theFlyer = (
    <g transform={`translate(${flyX},${flyY}) rotate(${flyRot}) scale(${flyScale})`}>
      <g transform={lay}>
        <FlyerFace w={FW} h={FH} accent="#E07850" />
      </g>
    </g>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, display: "block", overflow: "visible" }}>
        <defs>
          <clipPath id="e-bin">
            <path d={`M${bin.cx - bin.rx},${bin.topY} A${bin.rx},${bin.ry} 0 0 0 ${bin.cx + bin.rx},${bin.topY}`
              + ` L${bin.cx + bin.brx},${bin.botY} A${bin.brx},${bin.bry} 0 0 1 ${bin.cx - bin.brx},${bin.botY} Z`} />
          </clipPath>
        </defs>

        {/* the far wall of the bin, then the desk, then whatever is on top of them */}
        <BinBack g={bin} p={sceneP} />

        <Ink d={deskTop} sw={3} halo={6} p={sceneP} fill="rgba(255,255,255,0.30)" cap="square" />
        <Ink d={deskFront} sw={3} halo={6} p={sceneP} cap="square" />
        <Ink d={leg} sw={2.6} halo={5} p={sceneP} cap="square" />

        {pop > 0.01 && (
          f < 0.001
            ? (
              <g
                transform={`translate(0,${-drop}) translate(${restCx},${restCy})`
                  + ` scale(${0.72 + 0.28 * Math.min(1.04, pop)}) translate(${-restCx},${-restCy})`}
                opacity={Math.min(1, pop * 2.2)}
              >
                {theFlyer}
              </g>
            )
            : inBin ? <g clipPath="url(#e-bin)">{theFlyer}</g> : theFlyer
        )}

        {handOn && (
          <g transform={`translate(${hx},${S(155)}) scale(${1.15 * k})`}>
            <FlickHand />
          </g>
        )}

        {/* the wire you look at it through */}
        <BinBody g={bin} p={sceneP} />
      </svg>
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  trojan: Trojan as React.FC<CardProps & { data: any }>,
  floorplan: Floorplan as React.FC<CardProps & { data: any }>,
  flyer: Flyer as React.FC<CardProps & { data: any }>,
};
