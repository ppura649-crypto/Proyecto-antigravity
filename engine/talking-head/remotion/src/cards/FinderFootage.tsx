import React from "react";
import { Img, interpolate, spring, staticFile, Easing } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";
import { Arrow, C, FAVORITES, FinderWindow, MovIcon, SANS } from "./FinderParts";

// V4, "Second, gather all the relevant footage": a FOOTAGE folder in icon view.
// Six camera exports fly in from the window's four edges, the search field types
// their word, three files leave, and the three that survive resolve into THEIR OWN
// reels - the real frames, under the names the creator says. The folder ends selected, three
// items, ready to be dropped somewhere. Every size is set for this card.

export type FinderFootageData = {
  step: string; title: string; filter: string; files: string[]; status: string;
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const eo = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const p01 = (t: number) => Math.min(1, Math.max(0, t));

const KEEP = [0, 1, 4];       // the three the filter leaves standing: their paths never cross
const EDGE = [0, 1, 2, 3, 0, 1]; // top, right, bottom, left: where each export comes from

export const FinderFootage: React.FC<CardProps & { data: FinderFootageData }> = ({
  tMs, w, h, fps, beats, assets, data,
}) => {
  const toolbarH = Math.round(h * 0.142);
  const statusH = Math.round(h * 0.066);
  const sidebarW = Math.round(w * 0.212);
  const cw = w - sidebarW;
  const ch = h - toolbarH - statusH;

  const smallW = Math.round(cw * 0.118);
  const smallH = Math.round(smallW * 16 / 9);
  const bigW = Math.round(cw * 0.182);
  const bigH = Math.round(bigW * 16 / 9);
  const gap = Math.round(h * 0.020);
  const padX = Math.round(cw * 0.014);
  const cellW = (cw - 2 * padX) / 3;
  // the name is set from the CELL, so the longest real filename never truncates
  const longest = Math.max(11, ...data.files.map((n) => n.length));
  const smallFs = Math.round(h * 0.045);
  const bigFs = Math.min(Math.round(h * 0.047), Math.floor((cellW - 16) / (longest * 0.545)));
  const cellH = ch / 2;

  const { second, gather, relevant, business, videos, work, demo, done } = beats;
  const resolveAt = [videos, work, demo];

  // the search field types their word, then the folder filters
  const typed = data.filter.slice(0, Math.floor(p01((tMs - relevant) / 620) * data.filter.length));
  const typing = tMs >= relevant && tMs < relevant + 620;
  // the survivors re-flow sideways first and rise second, so none of them crosses a
  // neighbour's name on the way to its slot
  const reflowX = eo(p01((tMs - business) / 400));
  const reflow = eo(p01((tMs - business - 160) / 620));

  // slots: the 3 x 2 grid the exports land on, and the single row they end as
  const smallSlot = (i: number) => ({
    x: padX + (i % 3) * cellW + (cellW - smallW) / 2,
    y: Math.floor(i / 3) * cellH + (cellH - (smallH + gap + smallFs * 1.3)) / 2,
  });
  const bigSlot = (j: number) => ({
    x: padX + j * cellW + (cellW - bigW) / 2,
    y: (ch - (bigH + gap + bigFs * 1.3)) / 2,
  });

  const landed = [0, 1, 2, 3, 4, 5].filter((i) => tMs >= gather + i * 70 + 300).length;
  const count = tMs < gather ? 0 : reflow > 0.5 ? 3 : landed;
  const statusText = tMs >= done ? data.status : `${count} ${count === 1 ? "item" : "items"}`;

  const sliderP = interpolate(tMs, [business, business + 700], [0.28, 0.74], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) });
  const trackW = Math.round(cw * 0.16);

  const icons = [0, 1, 2, 3, 4, 5].map((i) => {
    const j = KEEP.indexOf(i);
    const keep = j >= 0;
    const t0 = gather + i * 70;
    const fly = eo(p01((tMs - t0) / 430));
    const s = smallSlot(i);
    const e = EDGE[i];
    const from = e === 0 ? { x: s.x, y: -smallH * 1.7 }
      : e === 1 ? { x: cw + smallW * 0.9, y: s.y }
      : e === 2 ? { x: s.x, y: ch + smallH * 0.7 }
      : { x: -smallW * 1.9, y: s.y };
    let x = from.x + (s.x - from.x) * fly;
    let y = from.y + (s.y - from.y) * fly;
    let tw = smallW, fs = smallFs, op = Math.min(1, fly * 4);

    if (keep) {
      const b = bigSlot(j);
      x += (b.x - s.x) * reflowX;
      y += (b.y - s.y) * reflow;
      tw = smallW + (bigW - smallW) * reflow;
      fs = smallFs + (bigFs - smallFs) * reflow;
    } else {
      // the three that do not match slide out the way they came in
      const out = eo(p01((tMs - business) / 380));
      const fade = p01((tMs - business) / 190);
      const dx = e === 1 ? cw * 0.5 : e === 3 ? -cw * 0.5 : 0;
      const dy = e === 0 ? -ch * 0.7 : e === 2 ? ch * 0.7 : 0;
      x += dx * out; y += dy * out;
      op *= 1 - fade;
    }
    const th = Math.round(tw * 16 / 9);

    const rAt = keep ? resolveAt[j] : 0;
    const real = keep ? interpolate(tMs, [rAt, rAt + 230], [0, 1], clamp) : 0;
    const pop = keep ? spring({ frame: Math.max(0, ((tMs - rAt) / 1000) * fps), fps, config: { damping: 11, stiffness: 340, mass: 0.6 } }) : 0;
    const scale = 1 + 0.075 * Math.sin(Math.PI * Math.min(1, pop));
    const name = keep && tMs >= rAt ? data.files[j] : `clip-0${i + 1}.mov`;
    const sel = keep && tMs >= done;

    return { i, j, keep, x, y, tw, th, fs, op, real, scale, name, sel, cellW };
  });

  // the clock on "the work you've been putting in": time going in, spun fast
  const clockOn = interpolate(tMs, [work + 240, work + 340, work + 1040, work + 1180], [0, 1, 1, 0], clamp);
  const spin = p01((tMs - work - 240) / 940);

  // one tap on the product demo
  const cur = icons[KEEP[2]];
  const curIn = p01((tMs - demo - 100) / 300);
  const press = interpolate(tMs, [demo + 470, demo + 520, demo + 620, demo + 670], [0, 1, 1, 0], clamp);
  const curOp = interpolate(tMs, [demo + 100, demo + 200, demo + 1150, demo + 1300], [0, 1, 1, 0], clamp);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FinderWindow
        w={w} h={h} toolbarH={toolbarH} statusH={statusH} sidebarW={sidebarW}
        title={data.title} rows={[...FAVORITES, { name: data.title, icon: "folder" }]}
        selected={data.title} view={0} lightsX={Math.round(h * 0.13)}
        search={{ text: typed, focused: tMs >= relevant, caret: typing }}
        status={
          <>
            <span style={{ fontFamily: SANS, fontSize: Math.round(h * 0.046), color: C.muted }}>{statusText}</span>
            <div style={{ position: "absolute", right: Math.round(cw * 0.035), top: "50%", width: trackW, height: 4, marginTop: -2, borderRadius: 2, backgroundColor: "#CFCFCF" }}>
              <div style={{ position: "absolute", left: trackW * sliderP - 7, top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: "#FFFFFF", border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
            </div>
          </>
        }
      >
        {icons.map((ic) => (
          <div key={ic.i} style={{ position: "absolute", left: ic.x, top: ic.y, width: ic.tw, opacity: ic.op, transform: `scale(${ic.scale})`, transformOrigin: "50% 40%" }}>
            <MovIcon w={ic.tw} real={ic.real}>
              {ic.keep && assets[ic.j] && (
                <Img src={staticFile(assets[ic.j])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </MovIcon>
            <div style={{ width: ic.cellW, marginLeft: (ic.tw - ic.cellW) / 2, marginTop: gap, display: "flex", justifyContent: "center" }}>
              <span style={{
                fontFamily: SANS, fontSize: ic.fs, color: ic.sel ? "#FFFFFF" : C.ink,
                backgroundColor: ic.sel ? C.sel : "transparent", borderRadius: 6,
                padding: `${Math.round(ic.fs * 0.10)}px ${Math.round(ic.fs * 0.22)}px`,
                maxWidth: ic.cellW, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                boxSizing: "border-box",
              }}>{ic.name}</span>
            </div>
          </div>
        ))}

        {clockOn > 0.01 && (() => {
          const k = icons[KEEP[1]];
          const r = Math.round(k.tw * 0.21);
          return (
            <svg width={r * 2} height={r * 2} viewBox="0 0 40 40" style={{ position: "absolute", left: k.x + k.tw - r * 1.9, top: k.y + k.th - r * 1.9, opacity: clockOn, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.35))" }}>
              <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#2B2B2E" strokeWidth="2.8" />
              <line x1="20" y1="20" x2="20" y2="7.5" stroke="#2B2B2E" strokeWidth="3.4" strokeLinecap="round" transform={`rotate(${spin * 1440} 20 20)`} />
              <line x1="20" y1="20" x2="20" y2="12" stroke="#2B2B2E" strokeWidth="3.4" strokeLinecap="round" transform={`rotate(${spin * 120} 20 20)`} />
              <circle cx="20" cy="20" r="2.2" fill="#2B2B2E" />
            </svg>
          );
        })()}

        {curOp > 0.01 && (
          <div style={{
            position: "absolute",
            left: cur.x + cur.tw * 0.52 + (1 - curIn) * cw * 0.14,
            top: cur.y + cur.th * 0.55 + (1 - curIn) * ch * 0.16,
            opacity: curOp, transform: `scale(${1 - 0.10 * press})`, transformOrigin: "0 0",
          }}>
            <Arrow size={Math.round(h * 0.098)} />
          </div>
        )}
      </FinderWindow>

      {/* the step, stamped on the window's corner */}
      <div style={{
        position: "absolute", left: 0, top: 0, width: Math.round(h * 0.115), height: Math.round(h * 0.115),
        backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: interpolate(tMs, [second, second + 160], [0, 1], clamp),
      }}>
        <span style={{ fontFamily: LABEL_FONT, fontSize: Math.round(h * 0.074), fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>{data.step}</span>
      </div>
    </div>
  );
};
