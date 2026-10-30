import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, label } from "./theme";
import { GLOW, SHADOW } from "./Mascot";

// "AI models helped design the chip, wrote its own software. And will now run on
// it next year. And each loop makes the next one faster."
// The flywheel itself, frameless: a heavy ring with three arrows drawn clockwise
// on it, three plates hung on it, and OpenAI's own mark in the hub. Each plate
// is empty until its own word lands, then it flashes terracotta and settles
// white. Once the third one is lit the loop is closed, and a packet starts
// running the ring, closing its first full lap exactly on `year.`
// v8 (their ask 2026-09-06, "start slow, and the animation should then increase and
// increase and increase"): from `accel` every lap is `ratio` of the one before,
// down to `minLapMs`, so the packet, its station flashes and its trail all speed
// up through "each loop makes the next one faster" and hold at full speed.
export type FlywheelData = { nodes: string[]; ratio?: number; minLapMs?: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const RAD = Math.PI / 180;
const circDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
};

// laps run at lapMs until `accel`, then each lap is ratio x the previous (floored)
const lapsAt = (tMs: number, start: number, lapMs: number, accel: number, ratio: number, minLap: number) => {
  let t0 = start, dur = lapMs, laps = 0;
  for (let i = 0; i < 200; i++) {
    if (tMs < t0 + dur) return { laps: laps + (tMs - t0) / dur, dur };
    laps += 1; t0 += dur;
    if (t0 >= accel) dur = Math.max(minLap, dur * ratio);
  }
  return { laps, dur };
};

export const Flywheel: React.FC<CardProps & { data: FlywheelData }> = ({ tMs, w, h, fps, fromMs, beats, assets, data }) => {
  const cx = 0.500 * w, cy = 0.525 * h, r = 0.218 * w;
  const nodeW = 0.334 * w, nodeH = 0.190 * h;
  const fs = 0.027 * w;
  const markW = 0.160 * w;
  const ANG = [-90, 30, 150];

  const halo = `drop-shadow(0px 0px ${0.010 * w}px rgba(0,0,0,0.92)) ${GLOW}`;
  const textHalo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), ${SHADOW}`;
  const plateShadow = `0px 0px ${0.010 * w}px rgba(0,0,0,0.92), 0px 12px 34px rgba(0,0,0,0.55)`;

  const at = (deg: number, rad = r) => ({ x: cx + rad * Math.cos(deg * RAD), y: cy + rad * Math.sin(deg * RAD) });
  const beatOf = (i: number) => beats[`n${i + 1}`] ?? fromMs + i * 900;

  // the packet: it starts when the loop closes and its first lap ends on `year.`;
  // from `accel` ("each loop") every lap is shorter than the last
  const start = beatOf(2);
  const lapMs = Math.max(300, (beats.lap ?? start + 960) - start);
  const accel = beats.accel ?? Number.POSITIVE_INFINITY;
  const ratio = data.ratio ?? 0.62;
  const minLap = data.minLapMs ?? 110;
  const running = tMs >= start;
  const { laps, dur } = running ? lapsAt(tMs, start, lapMs, accel, ratio, minLap) : { laps: 0, dur: lapMs };
  const u = laps - Math.floor(laps);
  const pAng = -90 + 360 * laps;
  const pPos = at(pAng);
  const pk = 0.030 * w;
  // how fast it is going, 0 at the first lap's pace, 1 at the floor: the trail grows with it
  const speed = clamp01((lapMs - dur) / Math.max(1, lapMs - minLap));
  // the packet does not slide over a station's words: it goes INTO it, and the
  // station lights instead
  const passOf = (i: number) => (running ? clamp01((1 - circDist(u, i / 3) / 0.055) * 2.4) : 0);
  const inside = Math.max(passOf(0), passOf(1), passOf(2));
  // the trail: ghosts behind the packet, further back and more of them the faster it runs
  const ghosts = speed > 0.05 ? [1, 2, 3, 4].map((k) => {
    const back = k * (6 + 22 * speed); // degrees
    const g = at(pAng - back);
    return { x: g.x, y: g.y, op: (1 - k / 5) * 0.75 * speed, sz: pk * (1 - k * 0.12) };
  }) : [];

  // one arrow in the open middle of each arc, pointing the way round
  const arrow = (deg: number) => {
    const p = at(deg);
    const sz = 0.021 * w;
    const tx = -Math.sin(deg * RAD), ty = Math.cos(deg * RAD);
    const nx = Math.cos(deg * RAD), ny = Math.sin(deg * RAD);
    const tip = `${p.x + tx * sz},${p.y + ty * sz}`;
    const a = `${p.x - tx * sz * 0.55 + nx * sz * 0.66},${p.y - ty * sz * 0.55 + ny * sz * 0.66}`;
    const b = `${p.x - tx * sz * 0.55 - nx * sz * 0.66},${p.y - ty * sz * 0.55 - ny * sz * 0.66}`;
    return <polygon key={deg} points={`${tip} ${a} ${b}`} fill={INK} />;
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>a three step loop turning faster and faster, OpenAI in the hub</title>
        <g style={{ filter: halo }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={0.009 * w} />
          {[-30, 90, 210].map(arrow)}
          {/* the three stations, marked on the ring before their word lands:
              an empty black plate would read as a bar, a stud reads as a wheel */}
          {ANG.map((a, i) => {
            if (tMs >= beatOf(i)) return null;
            const p = at(a);
            const sz = 0.022 * w;
            return <rect key={a} x={p.x - sz / 2} y={p.y - sz / 2} width={sz} height={sz} fill={INK} />;
          })}
        </g>
      </svg>

      {/* the hub: the real mark, frameless, nothing behind it */}
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: cx - markW / 2, top: cy - markW / 2, width: markW,
          filter: `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) ${GLOW}`,
        }}
      />

      {data.nodes.slice(0, 3).map((n, i) => {
        const p = at(ANG[i]);
        const b = beatOf(i);
        const s = spring({ frame: Math.max(0, ((tMs - b) / 1000) * fps), fps, config: { damping: 15, stiffness: 320, mass: 0.7 } });
        const lit = tMs >= b;
        if (!lit) return null;
        // full terracotta while the word is landing, then it settles white on
        // black; and again for a beat each time the packet runs through it, so
        // the lap closing on `year.` lights the station it closes on
        const flash = Math.max(passOf(i), clamp01(1 - Math.max(0, tMs - b - 170) / 60)); // full accent, then a 60 ms edge: half terracotta on black reads brown
        const e = Math.min(1, s);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: p.x - nodeW / 2, top: p.y - nodeH / 2,
              width: nodeW, height: nodeH, backgroundColor: CARD_BG, borderRadius: 0,
              boxShadow: plateShadow, display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", opacity: Math.min(1, s * 3), transform: `scale(${0.90 + 0.10 * e})`,
            }}
          >
            {flash > 0 && <div style={{ position: "absolute", inset: 0, backgroundColor: ACCENT, opacity: flash }} />}
            <div
              style={{
                ...label(fs, INK), position: "relative", textAlign: "center", lineHeight: 1.18,
                padding: `0 ${0.022 * w}px`, textShadow: textHalo,
              }}
            >
              {n}
            </div>
          </div>
        );
      })}

      {/* the trail, then the packet, riding over the plates so the lap never disappears */}
      {running && ghosts.map((g, k) => (
        <div
          key={k}
          style={{
            position: "absolute", left: g.x - g.sz / 2, top: g.y - g.sz / 2, width: g.sz, height: g.sz,
            backgroundColor: ACCENT, borderRadius: 0, opacity: g.op * (1 - inside),
          }}
        />
      ))}
      {running && inside < 0.98 && (
        <div
          style={{
            position: "absolute", left: pPos.x - pk / 2, top: pPos.y - pk / 2, width: pk, height: pk,
            backgroundColor: ACCENT, borderRadius: 0, boxShadow: plateShadow, opacity: 1 - inside,
          }}
        />
      )}
    </div>
  );
};
