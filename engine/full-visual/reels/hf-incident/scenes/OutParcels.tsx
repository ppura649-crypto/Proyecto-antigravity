// `out`: what comes down the cable into the window. Until "anything": brown parcels, one at a time ("just to download
// packages"). From "anything": every shape (globes, envelopes, pages, videos, photos), three times as fast.
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { outCableAt, outWide, type OutCues } from "./OutServer";

type Kind = "box" | "globe" | "mail" | "page" | "video" | "photo";
const MIX: Kind[] = ["globe", "mail", "page", "video", "photo", "mail", "globe", "page", "video", "photo"];

const Icon: React.FC<{ kind: Kind; s: number }> = ({ kind, s }) => {
  const v = "0 0 48 48";
  if (kind === "box")
    return (
      <svg width={s} height={s} viewBox={v}>
        <path d="M24 4 L44 14 L44 36 L24 46 L4 36 L4 14 Z" fill="#B7793F" />
        <path d="M24 4 L44 14 L24 24 L4 14 Z" fill="#D59A5C" />
        <path d="M24 24 L24 46" stroke="#8A5A2C" strokeWidth="2" />
        <path d="M14 9 L34 19 L34 27" stroke="#F3D9A8" strokeWidth="4" fill="none" />
      </svg>
    );
  if (kind === "globe")
    return (
      <svg width={s} height={s} viewBox={v}>
        <circle cx="24" cy="24" r="20" fill="#1E88E5" stroke="#BDE6FF" strokeWidth="2" />
        <ellipse cx="24" cy="24" rx="9" ry="20" fill="none" stroke="#BDE6FF" strokeWidth="2" />
        <path d="M4 24 H44 M8 14 H40 M8 34 H40" stroke="#BDE6FF" strokeWidth="2" />
      </svg>
    );
  if (kind === "mail")
    return (
      <svg width={s} height={s} viewBox={v}>
        <rect x="3" y="10" width="42" height="30" rx="4" fill="#FFFFFF" />
        <path d="M4 12 L24 28 L44 12" stroke="#E0463A" strokeWidth="3" fill="none" />
      </svg>
    );
  if (kind === "page")
    return (
      <svg width={s} height={s} viewBox={v}>
        <path d="M9 3 H31 L40 12 V45 H9 Z" fill="#FFFFFF" />
        <path d="M31 3 V12 H40" fill="#D6DAE0" />
        {[18, 25, 32, 39].map((y) => <rect key={y} x="14" y={y} width={y === 39 ? 14 : 21} height="3" rx="1.5" fill="#9AA1AC" />)}
      </svg>
    );
  if (kind === "video")
    return (
      <svg width={s} height={s} viewBox={v}>
        <rect x="2" y="9" width="44" height="30" rx="6" fill="#7C4DFF" />
        <path d="M19 16 L32 24 L19 32 Z" fill="#FFFFFF" />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox={v}>
      <rect x="3" y="7" width="42" height="34" rx="4" fill="#FFFFFF" />
      <rect x="6" y="10" width="36" height="28" rx="2" fill="#7EC8F2" />
      <path d="M6 38 L18 22 L27 32 L33 26 L42 38 Z" fill="#2E9E5B" />
      <circle cx="34" cy="17" r="4" fill="#FFE066" />
    </svg>
  );
};

/** spawn frames: slow parcels from "online" (after the cable lights), fast mixed ones from "anything" */
const spawns = (c: OutCues) => {
  const out: { at: number; kind: Kind; dur: number }[] = [];
  for (let t = c.online + 8; t < c.anything; t += 24) out.push({ at: t, kind: "box", dur: 40 });
  let i = 0;
  for (let t = c.anything; t < c.window - 14; t += 7) out.push({ at: t, kind: MIX[i++ % MIX.length], dur: 26 });
  return out;
};

export const OutParcels: React.FC<{ c: OutCues }> = ({ c }) => {
  const { f } = useScene();
  const wide = outWide(f, c);
  if (f < c.online || wide > 0.99) return null;
  return (
    <>
      {spawns(c).map((s, k) => {
        if (f < s.at || f > s.at + s.dur + 6) return null;
        const t = prog(f, s.at, s.dur, ease.inOut);
        const p = outCableAt(t);
        const into = prog(f, s.at + s.dur - 4, 8, ease.in);
        const kind: Kind = s.kind === "box" && f >= c.anything ? MIX[(k * 3) % MIX.length] : s.kind;
        const size = (kind === "box" ? 66 : 60) * (1 - 0.6 * into) * (f >= c.anything && f < c.anything + 8 && s.kind === "box" ? 1 + 0.3 * (1 - prog(f, c.anything, 8)) : 1);
        const spin = kind === "box" ? 0 : Math.sin((f - s.at) / 4 + k) * 14;
        return (
          <div key={k} style={{ position: "absolute", left: p.x - size / 2, top: p.y - size / 2 - 22, opacity: (1 - into) * prog(f, s.at, 3, ease.linear) * (1 - wide), transform: `rotate(${spin.toFixed(1)}deg)`, filter: "drop-shadow(0 0 10px rgba(127,219,255,0.55))" }}>
            <Icon kind={kind} s={size} />
          </div>
        );
      })}
    </>
  );
};
