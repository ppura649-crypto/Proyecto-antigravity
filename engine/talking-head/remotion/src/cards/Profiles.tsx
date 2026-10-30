import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";

// V8 (edit-g-b): "FOR BOTH OURSELVES AND FOR THE CREATORS WE KNOW."
// The two of them as their real Instagram profiles, side by side in the app's own row
// grammar: the real photo, the real handle, the real follower count under it. On "and" a
// thin ellipse draws clockwise around the pair, and on "creators" eight anonymous grey
// avatars land on it one per 90 ms, each with the play badge that says they post video,
// because naming them would be inventing them. ProfilesLit reuses this exact drawing
// (ProfilesScene) twelve seconds later, so the callback is the same picture, changed.

const GREY = "#BFC3C8";
const DARK = "#1F1E1D";
const WHITE = "#FFFFFF";
const ALWAYS = -1e9;
const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const HALO = "drop-shadow(0px 2px 6px rgba(0,0,0,0.9)) drop-shadow(0px 8px 28px rgba(0,0,0,0.55))";
const RAD = Math.PI / 180;
// the two real photos are framed on the face, not centred on the file
const CROP = [{ z: 1.56, x: 0.545, y: 0.43 }, { z: 1.12, x: 0.50, y: 0.50 }];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export type ProfileSide = { handle: string; followers: string };
export type ProfilesData = { left: ProfileSide; right: ProfileSide; outer: number };

// one anonymous creator: the head-and-shoulders glyph every app draws when there is no
// photo, in a circle, with a play badge on the rim
const Person: React.FC<{
  id: string; x: number; y: number; r: number; fill: string; pop: number;
}> = ({ id, x, y, r, fill, pop }) => {
  const s = 0.55 + 0.45 * Math.min(1.06, pop);
  const b = 0.34 * r;
  return (
    <g opacity={clamp01(pop * 3)} transform={`translate(${x} ${y}) scale(${s})`}>
      <clipPath id={`c${id}`}><circle cx={0} cy={0} r={r} /></clipPath>
      <circle cx={0} cy={0} r={r} fill={fill} stroke={WHITE} strokeWidth={0.085 * r} />
      <g clipPath={`url(#c${id})`} fill={WHITE} opacity={0.94}>
        <circle cx={0} cy={-0.20 * r} r={0.29 * r} />
        <path d={`M ${-0.56 * r} ${1.1 * r} L ${-0.56 * r} ${0.56 * r}`
          + ` C ${-0.56 * r} ${0.18 * r}, ${-0.30 * r} ${0.08 * r}, 0 ${0.08 * r}`
          + ` C ${0.30 * r} ${0.08 * r}, ${0.56 * r} ${0.18 * r}, ${0.56 * r} ${0.56 * r}`
          + ` L ${0.56 * r} ${1.1 * r} Z`} />
      </g>
      <circle cx={0.66 * r} cy={0.66 * r} r={b} fill={DARK} stroke={WHITE} strokeWidth={0.095 * r} />
      <path
        d={`M ${0.66 * r - 0.30 * b} ${0.66 * r - 0.44 * b} L ${0.66 * r + 0.42 * b} ${0.66 * r}`
          + ` L ${0.66 * r - 0.30 * b} ${0.66 * r + 0.44 * b} Z`}
        fill={WHITE}
      />
    </g>
  );
};

// a real photo, framed on the face inside a circle. Explicit device px on the image: a
// percentage size on <Img> does not resolve here and the photo renders at its own size.
const Face: React.FC<{ d: number; src: string; crop: { z: number; x: number; y: number } }> = ({ d, src, crop }) => (
  <div style={{
    position: "relative", width: d, height: d, borderRadius: "50%", overflow: "hidden", flex: "none",
    boxShadow: `0 0 0 ${0.042 * d}px ${WHITE}, 0px 6px 22px rgba(0,0,0,0.55)`,
  }}>
    <Img src={staticFile(src)} style={{
      position: "absolute", display: "block", maxWidth: "none",
      width: d * crop.z, height: d * crop.z,
      left: d / 2 - d * crop.z * crop.x, top: d / 2 - d * crop.z * crop.y,
    }} />
  </div>
);

// one real Instagram profile, in the app's row grammar: photo, handle, the count under it
const Row: React.FC<{
  x: number; y: number; wRow: number; hRow: number; av: number;
  src: string; crop: { z: number; x: number; y: number }; side: ProfileSide; pop: number;
}> = ({ x, y, wRow, hRow, av, src, crop, side, pop }) => (
  <div style={{
    position: "absolute", left: x, top: y, width: wRow, height: hRow,
    display: "flex", alignItems: "center", gap: 0.048 * wRow,
    opacity: clamp01(pop * 3),
    transform: `scale(${0.90 + 0.10 * Math.min(1.04, pop)})`, transformOrigin: "50% 50%",
  }}>
    <Face d={av} src={src} crop={crop} />
    <div style={{ textShadow: SHADOW, lineHeight: 1 }}>
      <div style={{
        fontFamily: LABEL_FONT, fontSize: 0.092 * wRow, fontWeight: 700, color: WHITE, letterSpacing: "0.01em",
      }}>{side.handle}</div>
      <div style={{
        fontFamily: LABEL_FONT, fontSize: 0.122 * wRow, fontWeight: 700, color: WHITE,
        marginTop: 0.038 * wRow, letterSpacing: "0.01em",
      }}>{side.followers}</div>
      <div style={{
        fontFamily: LABEL_FONT, fontSize: 0.086 * wRow, fontWeight: 600, color: WHITE,
        opacity: 0.88, letterSpacing: "0.08em", marginTop: 0.016 * wRow,
      }}>FOLLOWERS</div>
    </div>
  </div>
);

const ellipse = (rx: number, ry: number): { d: string; len: number } => {
  const n = 180;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push([rx * Math.cos(a), ry * Math.sin(a)]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { d: `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L ")}`, len };
};

export type ProfilesSceneProps = {
  tMs: number; w: number; h: number; fps: number;
  left: ProfileSide; right: ProfileSide; assets: string[];
  cardsAt: number; ringAt: number; innerAt: number; innerStep: number; innerN: number;
  litAt?: number; litStep?: number;
  widerAt?: number; widerStep?: number; widerN?: number;
};

// One drawing, two cards. Every position is device px on the 994 x 518 card at one scale
// throughout, so the callback is literally the same picture and nobody shrinks when the
// crowd grows. The two ellipses and the two phases are solved so that no two avatars come
// within 32 px of each other and none of them touches the profile rows in the middle.
export const ProfilesScene: React.FC<ProfilesSceneProps> = (p) => {
  const { tMs, w, h, fps } = p;
  const cx = w / 2;
  const cy = 0.4903 * h;
  const rxI = 0.3723 * w;
  const ryI = 0.2703 * h;
  const rxO = 0.4648 * w;
  const ryO = 0.4151 * h;
  const RA = 0.0302 * w;            // one anonymous avatar
  const ROW_W = 0.3048 * w;
  const ROW_H = 0.2162 * h;
  const ROW_GAP = 0.0360 * w;
  const AVB = 0.0886 * w;           // the founders' own photos

  const sp = (ms: number) =>
    ms <= ALWAYS / 2 ? 1
      : spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 330, mass: 0.6 } });
  const ring = p.ringAt <= ALWAYS / 2 ? 1
    : easeOut(clamp01(interpolate(tMs, [p.ringAt, p.ringAt + 300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  const inner = ellipse(rxI, ryI);
  type Q = { key: string; x: number; y: number; fill: string; pop: number };
  const people: Q[] = [];
  for (let i = 0; i < p.innerN; i++) {
    const a = (-45 + i * (360 / p.innerN)) * RAD;
    // the light is a change of state AND a movement: each one swells as it takes the accent
    const lit = p.litAt == null ? 0 : clamp01((tMs - (p.litAt + i * (p.litStep ?? 100))) / 150);
    people.push({
      key: `i${i}`, x: cx + rxI * Math.cos(a), y: cy + ryI * Math.sin(a),
      fill: lit > 0.01 ? ACCENT : GREY,
      pop: sp(p.innerAt + i * p.innerStep) * (lit > 0 && lit < 1 ? 1 + 0.16 * Math.sin(lit * Math.PI) : 1),
    });
  }
  for (let j = 0; j < (p.widerN ?? 0); j++) {
    const a = (-66 + j * (360 / (p.widerN ?? 1))) * RAD;
    people.push({
      key: `o${j}`, x: cx + rxO * Math.cos(a), y: cy + ryO * Math.sin(a),
      fill: ACCENT, pop: sp((p.widerAt ?? 0) + j * (p.widerStep ?? 60)),
    });
  }
  people.sort((a, b) => a.y - b.y);

  const cards = sp(p.cardsAt);
  const rowY = cy - ROW_H / 2;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: HALO }}>
        <title>the two of them, and the creators around them</title>
        {ring > 0.002 && (
          <path
            d={inner.d} fill="none" stroke={WHITE} strokeWidth={0.0045 * w} opacity={0.85}
            strokeDasharray={inner.len} strokeDashoffset={inner.len * (1 - ring)}
            transform={`translate(${cx} ${cy})`}
          />
        )}
        {people.map((q) => (q.pop <= 0.001 ? null : (
          <Person key={q.key} id={q.key} x={q.x} y={q.y} r={RA} fill={q.fill} pop={q.pop} />
        )))}
      </svg>

      {cards > 0.001 && (
        <>
          <Row x={cx - ROW_W - ROW_GAP / 2} y={rowY} wRow={ROW_W} hRow={ROW_H} av={AVB}
            src={p.assets[0]} crop={CROP[0]} side={p.left} pop={cards} />
          <Row x={cx + ROW_GAP / 2} y={rowY} wRow={ROW_W} hRow={ROW_H} av={AVB}
            src={p.assets[1]} crop={CROP[1]} side={p.right} pop={cards} />
        </>
      )}
    </div>
  );
};

export const Profiles: React.FC<CardProps & { data: ProfilesData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => (
  <ProfilesScene
    tMs={tMs} w={w} h={h} fps={fps}
    left={data.left} right={data.right} assets={assets}
    cardsAt={beats.ourselves ?? fromMs}
    ringAt={beats.and ?? fromMs + 360}
    innerAt={beats.creators ?? fromMs + 1080} innerStep={90} innerN={data.outer ?? 8}
  />
);
