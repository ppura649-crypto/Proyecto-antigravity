import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { MONO, clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, Title, yBeats } from "./Y-kit";
// keyframes-v1 hook Y4 "Trim" (builder Y, round 2, 2026-09-25). Title "88 seconds in. / 43 seconds out.". Then a heavy
// timeline bar of their real raw take (source.mov, 88.9 s, to scale: 16 real frames + the real audio level from
// levels.txt baked into Y-strip.jpg) with a mono readout 1:29. AND: the real Claude mark rides a steel carriage along
// a rail above it like a cutter, scoring orange cut lines at every dead gap (the real ones between the 28 kept clips
// of cuts.json). IT'S / EXACTLY: each gap drops out with gravity right after the cutter passes. HOW: the kept clips
// slam together, the bar is half as long (42.8 s) and the readout rolls to 0:43. GOT: the bar folds in half and the
// folded block opens into the phone playing the finished reel, landed ~2480, held.

// the 28 kept clips of cuts.json (source ms), sorted
const KEEP: [number, number][] = [[6191, 7633], [7804, 9374], [9476, 10019], [10107, 13340], [14461, 15172], [15637, 16745], [16860, 18039],
  [18141, 18423], [18892, 19858], [20102, 22292], [22615, 24203], [24584, 25732], [28211, 29253], [29479, 32499], [32738, 35398], [35575, 38158],
  [41861, 43941], [44534, 46767], [47085, 48735], [52502, 54320], [54786, 55616], [55769, 57612], [69459, 70059], [70154, 71728], [71830, 74189],
  [74651, 75170], [79961, 80770], [80932, 82118]];
const SRC_MS = 88882, X0 = 40, BW = 1000, PX = BW / SRC_MS, BY = 178, SH = 185, THK = 16;
const GAPS: [number, number][] = [];
KEEP.forEach(([a], i) => { const prev = i === 0 ? 0 : KEEP[i - 1]![1]; if (a > prev) GAPS.push([prev, a]); });
GAPS.push([KEEP[KEEP.length - 1]![1], SRC_MS]);
const KEPT_W = KEEP.reduce((s, [a, e]) => s + (e - a) * PX, 0);
const CX0 = 540 - KEPT_W / 2, HINGE = 540;
const compactX = KEEP.map((_, i) => CX0 + KEEP.slice(0, i).reduce((s, [a, e]) => s + (e - a) * PX, 0));
export const TRIM_ASSETS = ["Y-strip.jpg", "Y-claude.png", "kf-finished-reel.mp4"];
const RAIL_Y = 140;
const fmt = (s: number) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; };

const Seg: React.FC<{ strip: string; x: number; y: number; w: number; srcX: number; rot?: number; op?: number; cut?: [number, number] }> = ({ strip, x, y, w, srcX, rot = 0, op = 1, cut }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: SH, opacity: op, transformOrigin: "50% 0%", transform: rot ? `rotate(${rot}deg)` : undefined,
    backgroundImage: `url(${strip})`, backgroundSize: `${BW}px ${SH}px`, backgroundPosition: `${-srcX}px 0px`,
    boxShadow: `0 ${THK}px 0 #2a2d32, 0 ${THK + 1}px 0 #0e0f11, 0 ${THK + 18}px 26px rgba(0,0,0,0.45), inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.6)` }}>
    {cut && cut[0] > 0.01 && <div style={{ position: "absolute", left: -1, top: -4, width: 2, height: SH + THK + 4, background: `rgba(217,119,87,${cut[0]})` }} />}
    {cut && cut[1] > 0.01 && <div style={{ position: "absolute", right: -1, top: -4, width: 2, height: SH + THK + 4, background: `rgba(217,119,87,${cut[1]})` }} />}
  </div>
);

const Trim: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = yBeats(beats);
  const d = data ?? {};
  if (t < b.now) return <Title {...props} now={b.now} />;
  const src = (n: string) => staticFile(pick(assets, n));
  const strip = src("Y-strip.jpg");
  const k = w / 1080;

  const enter = easeOut3(win(t, b.now, b.now + 320));
  const drop0 = mix(-50, 0, enter) + 4 * Math.sin(Math.PI * win(t, b.now + 280, b.now + 420));
  // the cutter: along the rail from AND, past the right end by ~1960
  const cS = b.and, cE = b.exactly + 90;
  const carX = (x: number) => mix(X0 - 34, X0 + BW + 30, easeInOut(win(x, cS, cE)));
  const passAt = (xp: number) => { let lo = cS, hi = cE; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (carX(m) < xp) lo = m; else hi = m; } return lo; };
  const cx = carX(t);
  const carLift = easeIn2(win(t, cE + 20, cE + 170));
  // HOW: the kept clips slam together; the impact
  const slam = easeIn2(win(t, b.how - 30, b.how + 100));
  const hit = b.how + 100;
  const shake = 5 * Math.sin(Math.PI * win(t, hit, hit + 70)) - 2 * Math.sin(Math.PI * win(t, hit + 70, hit + 150));
  const secs = mix(SRC_MS / 1000, 42.9, easeInOut(win(t, b.how - 10, b.how + 170)));
  const rollBlur = 3 * Math.sin(Math.PI * win(t, b.how - 10, b.how + 170));
  // GOT: fold in half at the hinge, the folded block moves onto the phone's screen and opens into the phone
  const fold = easeIn2(win(t, b.got - 40, b.got + 40));
  const mv = easeInOut(win(t, b.got + 0, b.got + 70));
  const reveal = easeOut3(win(t, b.got + 50, b.got + 120));
  const blockOp = 1 - win(t, b.got + 70, b.got + 115);
  const out = easeIn2(win(t, toMs - 140, toMs));
  const push = 1 + 0.025 * easeInOut(win(t, b.got + 125, toMs));
  const uiOp = win(t, b.now, b.now + 70) * (1 - win(t, b.got - 60, b.got + 20));
  const bx = mix(0, 540 - (CX0 + (HINGE - CX0) / 2), mv), byy = mix(0, 283 - (BY + SH / 2), mv);

  const kept = KEEP.map(([a, e], i) => {
    const x0 = X0 + a * PX, wpx = (e - a) * PX;
    const gl = (a - (i === 0 ? 0 : KEEP[i - 1]![1])) * PX >= 3, gr = ((i === KEEP.length - 1 ? SRC_MS : KEEP[i + 1]![0]) - e) * PX >= 3;
    const cutL = gl ? win(t, passAt(x0) - 10, passAt(x0) + 30) * (1 - win(t, hit, hit + 160)) : 0;
    const cutR = gr ? win(t, passAt(x0 + wpx) - 10, passAt(x0 + wpx) + 30) * (1 - win(t, hit, hit + 160)) : 0;
    return { i, x: mix(x0, compactX[i]!, slam), w: wpx, srcX: a * PX, cut: [cutL, cutR] as [number, number] };
  });
  const gaps = GAPS.map(([a, e], gi) => {
    const x0 = X0 + a * PX, wpx = (e - a) * PX;
    if (wpx < 2) return null;
    const dropT = Math.max(b.its - 60, passAt(x0 + wpx)) + 50;
    const dt = Math.max(0, t - dropT) / 1000;
    const dy = 0.5 * 3600 * dt * dt, rot = (gi % 2 ? 1 : -1) * (30 * dt + 160 * dt * dt);
    const op = 1 - win(dy, 60, 150);
    if (op <= 0) return null;
    return <Seg key={`g${gi}`} strip={strip} x={x0} y={BY + dy} w={wpx} srcX={a * PX} rot={rot} op={op} />;
  });
  const folded = t >= b.got - 40;
  const segs = (half: "L" | "R" | "all") => kept.map((s) => {
    if (half === "L" && s.x >= HINGE) return null;
    if (half === "R" && s.x + s.w <= HINGE) return null;
    const ox = half === "R" ? HINGE : 0;
    return <Seg key={s.i} strip={strip} x={s.x - ox} y={half === "all" ? BY : 0} w={s.w} srcX={s.srcX} cut={s.cut} />;
  });
  const endL = mix(X0, CX0, slam) - 12, endR = mix(X0 + BW, CX0 + KEPT_W, slam);
  const cap = (x: number) => <div style={{ position: "absolute", left: x, top: BY - 3, width: 12, height: SH + THK + 3,
    background: "linear-gradient(90deg, #5d6268, #d9dde1 40%, #7a8086 70%, #33363b)", boxShadow: "0 18px 24px rgba(0,0,0,0.35)" }} />;
  // phone reveal: from the block rect to the whole device
  const rb = { l: 540 - (HINGE - CX0) / 2, r: 540 + (HINGE - CX0) / 2, t: 283 - SH / 2, b: 283 + SH / 2 + THK };
  const inset = `inset(${mix(rb.t, -30, reveal).toFixed(1)}px ${mix(1080 - rb.r, 0, reveal).toFixed(1)}px ${mix(614 - rb.b, -60, reveal).toFixed(1)}px ${mix(rb.l, 0, reveal).toFixed(1)}px)`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: out > 0 ? 1 - out : undefined }}>
      {/* the readout */}
      <div style={{ position: "absolute", left: 540 - 118, top: -14 + drop0, width: 236, height: 82, background: "linear-gradient(180deg, #2b2e33, #16181b)", opacity: uiOp,
        boxShadow: "0 0 0 2px #6d737a, 0 0 0 3px #1a1c1f, 0 16px 30px rgba(0,0,0,0.5), inset 0 2px 8px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 60, color: "#EDEFF2", letterSpacing: 2, filter: rollBlur > 0.3 ? `blur(${rollBlur.toFixed(2)}px)` : undefined }}>{fmt(secs)}</div>
      </div>
      {/* the rail and the Claude carriage */}
      <div style={{ position: "absolute", inset: 0, opacity: uiOp, transform: `translateY(${drop0}px)` }}>
        <div style={{ position: "absolute", left: X0 - 40, top: RAIL_Y - 5, width: BW + 80, height: 10, borderRadius: 5,
          background: "linear-gradient(180deg, #f0f2f4, #9aa0a6 45%, #4a4e53 80%, #2a2c30)", boxShadow: "0 8px 14px rgba(0,0,0,0.35)" }} />
        <div style={{ position: "absolute", left: cx - 56, top: RAIL_Y - 58 - 160 * carLift, width: 112, height: 90, opacity: 1 - win(carLift, 0.4, 1),
          background: "linear-gradient(180deg, #e7eaed, #a5abb1 40%, #6b7177 80%, #3a3d42)", borderRadius: 6, boxShadow: "0 14px 22px rgba(0,0,0,0.45), inset 0 1.5px 0 #fff" }}>
          <Img src={src("Y-claude.png")} style={{ position: "absolute", left: 16, top: 6, width: 80, height: 80, transform: `rotate(${(cx - X0) * 1.1}deg)` }} />
          <div style={{ position: "absolute", left: 54, top: 90, width: 4, height: BY - RAIL_Y + SH - 32 + 4,
            background: "linear-gradient(90deg, #8d9399, #f4f6f8, #6d7379)", opacity: 1 - carLift }} />
          <div style={{ position: "absolute", left: 52, top: BY - RAIL_Y + 58, width: 8, height: SH, background: "rgba(217,119,87,0.9)", filter: "blur(3px)",
            opacity: (1 - carLift) * win(t, cS, cS + 60) }} />
        </div>
      </div>
      {/* the bar */}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${bx + (folded ? 0 : shake)}px, ${drop0 + byy}px)`, opacity: t < b.now + 70 ? win(t, b.now, b.now + 70) : blockOp, perspective: 1400 }}>
        {gaps}
        {!folded && cap(endL)}{!folded && cap(endR)}
        {!folded ? segs("all") : (
          <>
            <div style={{ position: "absolute", left: HINGE, top: BY, width: 540, height: SH + THK + 40, transformOrigin: "0 50%",
              transform: `rotateY(${180 * fold}deg)`, filter: `brightness(${(1 - 0.5 * fold).toFixed(3)})` }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{segs("R")}</div>
            </div>
            <div style={{ position: "absolute", left: 0, top: BY, width: HINGE, height: SH + THK + 40, overflow: "hidden" }}>{segs("L")}</div>
          </>
        )}
      </div>
      {t >= b.got + 60 && (
        <div style={{ position: "absolute", inset: 0, clipPath: inset }}>
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={b.got + 60} startSec={d.startSec ?? 0.95}
            style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PH.s * push})` }} />
        </div>
      )}
    </div>
  );
};

export const TRIM_KINDS = { "kf-y-trim": Trim };
