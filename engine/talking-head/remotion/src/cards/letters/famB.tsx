import React from "react";
import { Img, OffthreadVideo, Sequence, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Chip, chipFs, clamp01 } from "./shared";
import {
  Avatar, Bar, CheckSquare, Connect, GM, Hamburger, InboxTray, LI, Magnifier,
  People, Pencil, Phone, Pill, Plane, SANS, Star, Tag, textW,
} from "./BSurfaces";

// edit-i-oneshot, family B: the three real surfaces of the reel.
// startup (V2) is their own building footage PLAYING at 1x, the square clip shown WHOLE inside a
// white photo print, nothing written on it. linkedin (V3) is LinkedIn's people search filling with
// founders while a dark counter runs past a hundred. inbox (V14) is Gmail drowning our one honest
// email under AI cold outreach. Both surfaces keep their own colours, layout and system type; on
// LinkedIn every name is a soft grey bar, because no person is invented.

// a pour step: zero velocity at both ends, so no frame of the pour moves more than a
// quarter of a row and the whole list reads as one translation
const pour = (u: number): number => { const x = clamp01(u); return x * x * (3 - 2 * x); };

const sp = (tMs: number, at: number, fps: number, damping = 14): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping, stiffness: 320, mass: 0.7 } });

// ─────────────────────────────────────────────────────────────────────────────
// V2 startup: "During the first startup we built" - their own frame, nothing written on it
// ─────────────────────────────────────────────────────────────────────────────

export type StartupData = { clip?: string };

const Startup: React.FC<CardProps & { data: StartupData }> = ({ w, h, fps, fromMs, assets }) => {
  // the print: the square clip WHOLE (never cropped), a thin white border at the sides and the
  // deeper white mount above and below a square photo sitting in a taller card
  const b = Math.max(10, Math.round(0.026 * w));
  const side = Math.round(w - 2 * b);
  const top = Math.round((h - side) / 2);
  // the clip starts on the card's FIRST visible frame and runs at 1x from there (Overlay shows the
  // card from the frame whose tMs >= fromMs, so the sequence starts on that same frame)
  const from = Math.ceil((fromMs / 1000) * fps);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      <div style={{ position: "absolute", left: b, top, width: side, height: side, overflow: "hidden", backgroundColor: "#15161A" }}>
        <Sequence from={from} layout="none">
          <OffthreadVideo
            src={staticFile(assets[0])}
            muted
            style={{ position: "absolute", left: 0, top: 0, width: side, height: side, objectFit: "cover", display: "block" }}
          />
        </Sequence>
        {/* the edge a real print has where the paper meets the image */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.16)" }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V3 linkedin: "First, we looked on LinkedIn for over a hundred ideal customers
// we wanted to get on a call with." The page fills upward, every row it passes is
// ticked, the counter runs to 100+, and the call lands on the row at the top.
// ─────────────────────────────────────────────────────────────────────────────

export type LinkedinData = { query: string; counter: string; headlines: string[] };

const CPS = 16;

const Linkedin: React.FC<CardProps & { data: LinkedinData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const b = beats;
  const navH = Math.round(0.132 * h);
  const filtH = Math.round(0.104 * h);
  const listTop = navH + filtH;
  const listH = h - listTop;
  const rowH = Math.round(listH / 4);
  const padX = Math.round(0.014 * w);
  const cardW = w - 2 * padX;

  // the query types into the search field, then the mark pulses on its own name
  const n = Math.max(0, Math.min(data.query.length, Math.floor(((tMs - b.looked) / 1000) * CPS)));
  const typed = data.query.slice(0, n);
  const caret = tMs >= b.looked && (n < data.query.length || Math.floor(tMs / 470) % 2 === 0);
  const pulseP = clamp01((tMs - b.linkedin) / 420);
  const mark = 1 + (tMs >= b.linkedin ? 0.22 * Math.sin(Math.PI * pulseP) : 0);

  // the pour: a steady rate on `over`, easing to a stop on `customers`, landing on a row line
  const V = rowH / 130; // px per ms
  const s1 = V * (b.ideal - b.over);
  const total = Math.max(rowH, Math.round((s1 + (V * (b.customers - b.ideal)) / 3) / rowH) * rowH);
  const s2 = total - s1;
  const scroll = (t: number): number => {
    if (t <= b.over) return 0;
    if (t <= b.ideal) return V * (t - b.over);
    const u = clamp01((t - b.ideal) / (b.customers - b.ideal));
    return s1 + s2 * (1 - Math.pow(1 - u, 3));
  };
  const S = scroll(tMs);
  const rows = Math.ceil(total / rowH) + 5;
  const topIdx = Math.round(total / rowH);

  // a row ticks as the pour passes it; the rows the pour never reaches (the ones still on screen when
  // it stops) tick one after the other right after it, so the picture that HOLDS is a finished list
  const thrOf = (i: number): number => Math.max(i * rowH - 0.42 * listH, i * 60);
  let firstLeft = 0;
  while (thrOf(firstLeft) <= total && firstLeft < 40) firstLeft++;
  const tickOf = (i: number): number =>
    thrOf(i) <= total
      ? clamp01((S - thrOf(i)) / 70)
      : clamp01((tMs - (b.customers + 130 * (i - firstLeft + 1))) / 90);

  // the counter lands on `hundred` and runs with the rows
  const cu = clamp01((tMs - b.hundred) / (b.customers - b.hundred));
  const count = Math.round(6 + 94 * (1 - Math.pow(1 - cu, 2)));
  const cs = sp(tMs, b.hundred, fps);
  const lift = 6 * sp(tMs, b.wanted, fps, 16);
  // the handset lands ON the beat: already readable on the beat's own frame, settled 150 ms later
  const ph = 0.66 + 0.34 * sp(tMs, b.call, fps, 12);

  const nameFs = Math.round(0.030 * w);   // 30 px: the headline and the degree
  const btnH = Math.round(0.47 * rowH);
  const btnW = Math.round(0.205 * cardW);
  const avD = Math.round(0.58 * rowH);
  const textX = Math.round(0.062 * cardW) + avD + Math.round(0.022 * cardW);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: LI.page, overflow: "hidden" }}>
      {/* the top bar: the mark, then the search field */}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: navH, backgroundColor: "#FFFFFF", borderBottom: `1px solid ${LI.hair}` }}>
        <Img
          src={staticFile(assets[0])}
          style={{
            position: "absolute", left: Math.round(0.018 * w), top: (navH - 44) / 2, width: 44, height: 44,
            borderRadius: 4, display: "block", transform: `scale(${mark})`,
          }}
        />
        <div
          style={{
            position: "absolute", left: Math.round(0.078 * w), top: (navH - 46) / 2, width: Math.round(0.44 * w), height: 46,
            backgroundColor: LI.field, borderRadius: 4, display: "flex", alignItems: "center", gap: 12, paddingLeft: 14, boxSizing: "border-box",
          }}
        >
          <Magnifier s={28} color="rgba(0,0,0,0.75)" />
          <span style={{ fontFamily: SANS, fontSize: 30, color: typed ? LI.ink : LI.muted, lineHeight: 1 }}>
            {typed || "Search"}
          </span>
          {caret && <div style={{ width: 2, height: 30, backgroundColor: LI.ink }} />}
        </div>
      </div>

      {/* the filters: we are on People */}
      <div style={{ position: "absolute", left: padX, top: navH, width: cardW, height: filtH, display: "flex", alignItems: "center", gap: 12 }}>
        <Pill text="People" on fs={28} />
        <Pill text="Jobs" on={false} fs={28} />
        <Pill text="Companies" on={false} fs={28} />
        <Pill text="Posts" on={false} fs={28} />
      </div>

      {/* the results, pouring upward */}
      <div
        style={{
          position: "absolute", left: padX, top: listTop, width: cardW, height: listH - Math.round(0.02 * h),
          backgroundColor: "#FFFFFF", border: `1px solid ${LI.hair}`, borderRadius: 8, overflow: "hidden",
        }}
      >
        {Array.from({ length: rows }, (_, i) => i).map((i) => {
          const y = i * rowH - S;
          if (y < -rowH - 2 || y > listH) return null;
          const tick = tickOf(i);
          const isTop = tMs >= b.wanted && i === topIdx;
          const nameW = 156 + ((i * 37) % 92);
          const locW = 118 + ((i * 29) % 74);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 0, top: y - (isTop ? lift : 0), width: cardW - 2, height: rowH,
                borderBottom: `1px solid ${LI.hair}`, backgroundColor: isTop ? LI.hover : "#FFFFFF",
                boxShadow: isTop ? "0 6px 16px rgba(0,0,0,0.16)" : "none", boxSizing: "border-box",
              }}
            >
              <div style={{ position: "absolute", left: Math.round(0.017 * cardW), top: (rowH - 30) / 2 }}>
                <CheckSquare s={30} p={tick} color={LI.blue} />
              </div>
              <div style={{ position: "absolute", left: Math.round(0.062 * cardW), top: (rowH - avD) / 2 }}>
                <Avatar d={avD} />
              </div>
              <div style={{ position: "absolute", left: textX, top: Math.round(0.14 * rowH), display: "flex", alignItems: "center", gap: 12 }}>
                <Bar w={nameW} h={22} color={LI.bar} />
                <span style={{ fontFamily: SANS, fontSize: 28, color: LI.muted, lineHeight: 1 }}>· 2nd</span>
              </div>
              <div style={{ position: "absolute", left: textX, top: Math.round(0.40 * rowH), fontFamily: SANS, fontSize: nameFs, color: LI.ink, lineHeight: 1.15, whiteSpace: "nowrap" }}>
                {data.headlines[i % data.headlines.length]}
              </div>
              <div style={{ position: "absolute", left: textX, top: Math.round(0.795 * rowH) }}>
                <Bar w={locW} h={15} color={LI.barSoft} />
              </div>
              <div style={{ position: "absolute", left: cardW - 24 - btnW, top: (rowH - btnH) / 2 }}>
                <Connect w={btnW} h={btnH} fs={28} />
                {isTop && tMs >= b.call && (
                  <div
                    style={{
                      position: "absolute", left: -Math.round(0.24 * btnW), top: Math.round(-0.11 * btnH),
                      width: Math.round(1.22 * btnH), height: Math.round(1.22 * btnH), borderRadius: "50%",
                      backgroundColor: LI.blue, border: "4px solid #FFFFFF", boxSizing: "border-box",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 5px 14px rgba(0,0,0,0.30)", transform: `scale(${Math.min(1.06, ph)})`,
                    }}
                  >
                    <Phone s={Math.round(0.66 * btnH)} color="#FFFFFF" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* how many of them there are, in the reel's own hand */}
      {tMs >= b.hundred && (
        <div style={{ position: "absolute", right: Math.round(0.018 * w), top: Math.round(0.030 * h), opacity: Math.min(1, cs * 1.6), transform: `scale(${0.85 + 0.15 * cs})`, transformOrigin: "100% 50%" }}>
          <Chip text={tMs >= b.customers ? data.counter : String(count)} fs={chipFs(w)} />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V14 inbox: "Or an email that gets lost in an inbox full of AI inbound."
// Our one honest email lands at the top and then the cold outreach pours in over it,
// twice as fast from `inbox`, until it is gone off the bottom. The pour never stops.
// ─────────────────────────────────────────────────────────────────────────────

export type Mail = { from: string; subject: string };
export type InboxData = { ours: Mail; inbound: Mail[] };

const PUSH_MS = 200;   // one row-step, so the list translates by a fraction of a row every frame
const R1 = 400;        // one cold email every 400 ms from `lost`
const R2 = 200;        // twice that rate from `inbox`, so ours is gone by `AI`

const Inbox: React.FC<CardProps & { data: InboxData }> = ({ tMs, w, h, toMs, beats, data }) => {
  const b = beats;
  const hdrH = Math.round(0.118 * h);
  const tabsH = Math.round(0.105 * h);
  const rail = Math.round(0.21 * w);
  const listX = rail;
  const listW = w - rail;
  const listTop = hdrH + tabsH;
  const listH = h - listTop;
  const rowH = Math.round(listH / 6);

  // when each cold email arrives, and how far it has pushed everything under it
  const times: number[] = [];
  for (let t = b.lost, i = 0; t < toMs + 600 && i < 64; i++) { times.push(t); t += t < b.inbox ? R1 : R2; }
  const arr = times.map((t) => pour((tMs - t) / PUSH_MS));
  const above = arr.map((_, j) => arr.slice(j + 1).reduce((s, v) => s + v, 0));
  const A = arr.reduce((s, v) => s + v, 0);
  const ours = pour((tMs - b.email) / PUSH_MS);

  // the row: Gmail's own columns, nothing under 28 device px
  const fs = 28;
  const starX = 16, starS = 26;
  const senderX = starX + starS + 16;
  const senderW = Math.round(0.25 * listW);
  const midX = senderX + senderW + 18;
  const timeW = 84, rightPad = 14;
  const midW = Math.round(listW - rightPad - timeW - 14 - midX);

  const row = (key: string, y: number, m: Mail, unread: boolean, mine: boolean, clock: string) => {
    if (y < -rowH - 2 || y > listH + 2) return null;
    const subW = Math.min(midW, textW(m.subject, fs, unread));
    const barW = midW - subW - 16;
    return (
      <div
        key={key}
        style={{
          position: "absolute", left: 0, top: y, width: listW, height: rowH,
          backgroundColor: unread ? "#FFFFFF" : GM.read, borderBottom: `1px solid ${GM.hair}`, boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", left: starX, top: (rowH - starS) / 2 }}>
          <Star s={starS} filled={mine} />
        </div>
        <div style={{
          position: "absolute", left: senderX, top: (rowH - fs * 1.2) / 2, width: senderW,
          fontFamily: SANS, fontSize: fs, fontWeight: unread ? 700 : 400, color: unread ? GM.ink : GM.muted,
          lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{m.from}</div>
        <div style={{
          position: "absolute", left: midX, top: (rowH - fs * 1.2) / 2, width: midW,
          fontFamily: SANS, fontSize: fs, fontWeight: unread ? 700 : 400, color: unread ? GM.ink : GM.muted,
          lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{m.subject}</div>
        {barW > 56 && (
          <div style={{ position: "absolute", left: midX + subW + 16, top: (rowH - 13) / 2 }}>
            <Bar w={barW} h={13} color={unread ? GM.bar : GM.barSoft} />
          </div>
        )}
        <div style={{
          position: "absolute", right: rightPad, top: (rowH - fs * 1.2) / 2, width: timeW, textAlign: "right",
          fontFamily: SANS, fontSize: fs, fontWeight: unread ? 700 : 400, color: unread ? GM.ink : GM.muted, lineHeight: 1.2,
        }}>{clock}</div>
      </div>
    );
  };

  // the times climb going up the list, the way a real inbox reads
  const clockOf = (j: number): string => {
    const mins = 9 * 60 + 44 + j * 3 + ((j * 7) % 4);
    return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
  };
  const older = (i: number): Mail => data.inbound[(data.inbound.length - 1 - i + 2 * data.inbound.length) % data.inbound.length];

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      {/* the search bar across the top */}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: hdrH }}>
        <div style={{ position: "absolute", left: 18, top: (hdrH - 30) / 2 }}><Hamburger s={30} color={GM.muted} /></div>
        <div style={{
          position: "absolute", left: 76, top: (hdrH - 48) / 2, width: Math.round(0.52 * w), height: 48,
          backgroundColor: GM.field, borderRadius: 24, display: "flex", alignItems: "center", gap: 14, paddingLeft: 18, boxSizing: "border-box",
        }}>
          <Magnifier s={26} color={GM.muted} />
          <span style={{ fontFamily: SANS, fontSize: 28, color: GM.muted, lineHeight: 1 }}>Search mail</span>
        </div>
      </div>

      {/* the rail: Compose, and where we are */}
      <div style={{ position: "absolute", left: 0, top: hdrH, width: rail, height: h - hdrH }}>
        <div style={{
          position: "absolute", left: 14, top: 8, height: 58, paddingLeft: 16, paddingRight: 20, borderRadius: 29,
          backgroundColor: GM.compose, display: "flex", alignItems: "center", gap: 10, boxSizing: "border-box",
        }}>
          <Pencil s={26} />
          <span style={{ fontFamily: SANS, fontSize: 28, color: GM.composeInk, lineHeight: 1 }}>Compose</span>
        </div>
        {[
          { name: "Inbox", icon: <InboxTray s={24} color={GM.composeInk} />, on: true },
          { name: "Starred", icon: <Star s={24} filled={false} />, on: false },
          { name: "Sent", icon: <Plane s={24} color={GM.muted} />, on: false },
        ].map((r, i) => (
          <div key={r.name} style={{
            position: "absolute", left: 0, top: 94 + i * 54, width: rail - 14, height: 46,
            borderRadius: "0 23px 23px 0", backgroundColor: r.on ? GM.active : "transparent",
            display: "flex", alignItems: "center", gap: 14, paddingLeft: 22, boxSizing: "border-box",
          }}>
            {r.icon}
            <span style={{ fontFamily: SANS, fontSize: 28, fontWeight: r.on ? 700 : 400, color: r.on ? GM.composeInk : GM.muted, lineHeight: 1 }}>{r.name}</span>
          </div>
        ))}
      </div>

      {/* the tabs: we are in Primary, underlined in Gmail red */}
      <div style={{ position: "absolute", left: listX, top: hdrH, width: listW, height: tabsH, borderBottom: `1px solid ${GM.hair}` }}>
        {[
          { name: "Primary", icon: <InboxTray s={26} color={GM.red} />, on: true },
          { name: "Promotions", icon: <Tag s={26} color={GM.muted} />, on: false },
          { name: "Social", icon: <People s={26} color={GM.muted} />, on: false },
        ].map((t, i) => (
          <div key={t.name} style={{
            position: "absolute", left: 18 + i * Math.round(0.31 * listW), top: 0, height: tabsH,
            display: "flex", alignItems: "center", gap: 12,
            borderBottom: t.on ? `4px solid ${GM.red}` : "none", boxSizing: "border-box",
          }}>
            {t.icon}
            <span style={{ fontFamily: SANS, fontSize: 28, fontWeight: t.on ? 700 : 400, color: t.on ? GM.red : GM.muted, lineHeight: 1 }}>{t.name}</span>
          </div>
        ))}
      </div>

      {/* the list itself: what was already there, our one email, and the pour over it */}
      <div style={{ position: "absolute", left: listX, top: listTop, width: listW, height: listH, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => row(`old${i}`, rowH * (i + ours + A), older(i), false, false, clockOf(-3 - i)))}
        {row("ours", rowH * A - rowH * (1 - ours), data.ours, true, true, "9:41")}
        {times.map((_, j) => row(
          `in${j}`, rowH * above[j] - rowH * (1 - arr[j]),
          data.inbound[j % data.inbound.length], true, false, clockOf(j),
        ))}
      </div>
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  startup: Startup as React.FC<CardProps & { data: any }>,
  linkedin: Linkedin as React.FC<CardProps & { data: any }>,
  inbox: Inbox as React.FC<CardProps & { data: any }>,
};
