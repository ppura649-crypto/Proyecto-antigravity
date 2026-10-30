import React from "react";
import type { CardProps } from "../props";
import {
  A1Prompt, A1Welcome, A1Window, Check, Dot, Spinner, T, Tri,
  after, clamp01, eOut, lerp, mix, mono,
} from "./A1Window";

// reference edit J famA1, the story half: the window where the creator types `claude`.
//
// V3 (cchook)     the hook runs BEFORE Claude opens. The order is the whole teaching, so the
//                 welcome box is the LAST thing on the card, dim and late, under a line that
//                 has already finished running.
// V4 (ccharmless) the same window, one word changed: the command everybody actually has.
// V1c (ccempty)   hook 3's first object: the session opens, the prompt is never touched.

const PREFIX = "SessionStart · ";
const TRI = 15;      // the disclosure triangle
const GAP = 6;
const BOXP = 7;      // the tag's padding around the line
const FS = 17;       // the hook line, remocn's prompt size
const ROW = Math.round(FS * 1.35);

const w17 = (s: string): number => s.length * FS * 0.6;

/* ------------------------------------------------------- the hook line */
// One object drawn by both V3 and V4: a dim little line under the prompt, a tag drawn round
// it, a spinner that becomes a dot, a byte counter. `lit` / `tagged` / `boxed` are 0..1 so
// the callback can hand it over in its finished state without re-running a single beat.

const HookLine: React.FC<{
  tMs: number;
  cmd: string;          // the command that runs
  was?: string;         // the command it swapped away from (V4 crossfade)
  swap: number;         // 0..1 was -> cmd
  boxed: number;        // 0..1 the tag draws around the line
  tagged: number;       // 0..1 the tag reads `hook`
  lit: number;          // 0..1 dim -> white
  grow: number;         // 0..1 the line's own scale, 0.90 -> 1
  spin: number;         // 0..1 spinner -> filled dot
  bytes: number;        // 0..1 the counter climbs
  run: number;          // 0..1 the spinner / dot / counter group is there at all
  ok: number;           // 0..1 the green check at the end of the line
}> = ({ tMs, cmd, was, swap, boxed, tagged, lit, grow, spin, bytes, run, ok }) => {
  const text = PREFIX + cmd;
  const textW = lerp(was ? w17(PREFIX + was) : w17(text), w17(text), clamp01(swap));
  const bw = TRI + GAP + textW + 2 * BOXP;
  const bh = ROW + 2 * BOXP;
  const per = 2 * (bw + bh);
  const ink = mix(T.dim, T.fg, lit);
  const kb = Math.round(lerp(12, 480, clamp01(bytes)));
  return (
    <div style={{ position: "relative", height: bh, transform: `scale(${lerp(0.9, 1, grow)})`, transformOrigin: "0% 50%" }}>
      {/* the tag: a thin rule drawn round the line, muted while it is still nothing */}
      {boxed > 0 && (
        <svg width={bw + 2} height={bh + 2} style={{ position: "absolute", left: -1, top: -1, display: "block" }}>
          <title>hook</title>
          <rect
            x={1} y={1} width={bw} height={bh} rx={3} fill="none"
            stroke={mix(T.rule, T.accent, tagged)} strokeWidth={1}
            strokeDasharray={per} strokeDashoffset={per * (1 - eOut(boxed))}
          />
        </svg>
      )}
      {tagged > 0 && (
        <span
          style={{
            position: "absolute", left: 14, top: -9, padding: "0 7px", background: T.body,
            ...mono(15, T.accent), opacity: clamp01(tagged * 1.8),
          }}
        >
          hook
        </span>
      )}
      <div style={{ position: "absolute", left: BOXP, top: BOXP, display: "flex", flexDirection: "row", alignItems: "center", height: ROW }}>
        <div style={{ width: TRI, marginRight: GAP }}><Tri size={TRI} color={ink} /></div>
        <span style={mono(FS, ink)}>{PREFIX}</span>
        {/* the command ROLLS over: crossfading two strings in place ghosted them into each
            other for five frames (checked on f0386), a slot roll reads as one value changing */}
        <span style={{ position: "relative", display: "inline-block", height: ROW, width: Math.max(w17(was ?? cmd), w17(cmd)), overflow: "hidden", verticalAlign: "top" }}>
          {was && swap < 1 && (
            <span style={{ ...mono(FS, ink), position: "absolute", left: 0, top: 0, opacity: 1 - clamp01(swap * 1.6), transform: `translateY(${-ROW * eOut(swap)}px)` }}>{was}</span>
          )}
          <span
            style={{
              ...mono(FS, was ? T.muted : ink), display: "inline-block",
              opacity: was ? clamp01(swap * 1.6 - 0.2) : 1,
              transform: was ? `translateY(${ROW * (1 - eOut(swap))}px)` : undefined,
            }}
          >
            {cmd}
          </span>
        </span>
      </div>
      {/* what the run is doing, beside the line: a spinner, then a filled dot and the bytes */}
      <div style={{ position: "absolute", left: bw + 14, top: 0, height: bh, display: "flex", flexDirection: "row", alignItems: "center", gap: 7 }}>
        {run > 0.01 && (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7, opacity: clamp01(run) }}>
            <div style={{ position: "relative", width: 16, height: 16 }}>
              <div style={{ position: "absolute", inset: 0, opacity: 1 - clamp01(spin * 2) }}><Spinner size={16} color={T.accent} tMs={tMs} /></div>
              <div style={{ position: "absolute", inset: 0, opacity: clamp01(spin * 2 - 1) }}><Dot size={16} color={T.accent} /></div>
            </div>
            <span style={{ ...mono(15, T.muted), opacity: clamp01(spin * 3) }}>{`${kb} KB`}</span>
          </div>
        )}
        {ok > 0 && <div style={{ transform: `scale(${lerp(1.5, 1, eOut(ok))})` }}><Check size={17} color={T.green} p={clamp01(ok * 1.6)} /></div>}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- V3 cchook */

export type CcHookData = { cmd?: string; hook?: string; cwd?: string };

export const CcHook: React.FC<CardProps & { data: CcHookData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const cmd = data.cmd ?? "claude";
  const hook = data.hook ?? "node .vscode/setup.mjs";
  const cwd = data.cwd ?? "~/awesome-project";
  const b = {
    typed: beats.typed ?? fromMs,
    claude: beats.claude ?? fromMs + 300,
    tiny: beats.tiny ?? fromMs + 1060,
    called: beats.called ?? fromMs + 2390,
    hook: beats.hook ?? fromMs + 2690,
    launched: beats.launched ?? fromMs + 3220,
    opened: beats.opened ?? fromMs + 4600,
  };
  const chars = Math.ceil(cmd.length * clamp01((tMs - b.typed) / 520));
  const sent = tMs >= b.claude;
  const appear = clamp01((tMs - b.tiny) / 260);
  const open = after(tMs, b.opened, 420);
  return (
    <A1Window w={w} h={h}>
      {({ W }) => (
        <>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <A1Prompt text={cmd.slice(0, chars)} caret={!sent} tMs={tMs} />
          </div>
          {tMs >= b.tiny && (
            <div style={{ position: "absolute", left: 16, top: 38, opacity: eOut(appear), transform: `translateY(${(1 - eOut(appear)) * 5}px)` }}>
              <HookLine
                tMs={tMs} cmd={hook} swap={1}
                boxed={after(tMs, b.called, 320)}
                tagged={after(tMs, b.hook, 200)}
                lit={after(tMs, b.hook, 220)}
                grow={after(tMs, b.called, 280)}
                spin={clamp01((tMs - b.launched) / 240)}
                bytes={(tMs - b.launched) / 1200}
                run={1}
                ok={0}
              />
            </div>
          )}
          {tMs >= b.opened && (
            <div style={{ position: "absolute", left: 0, top: 89, width: W, transform: `translateY(${(1 - open) * 6}px)` }}>
              <A1Welcome w={W} cwd={cwd} box={open} left={open} right={open} fade={0.72} />
            </div>
          )}
        </>
      )}
    </A1Window>
  );
};

/* --------------------------------------------------------- V4 ccharmless */

export type CcHarmlessData = { cmd?: string; hook?: string; was?: string; cwd?: string };

export const CcHarmless: React.FC<CardProps & { data: CcHarmlessData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const cmd = data.cmd ?? "claude";
  const hook = data.hook ?? "npm run lint";
  const was = data.was ?? "node .vscode/setup.mjs";
  const cwd = data.cwd ?? "~/awesome-project";
  // the swap is spoken on "Usually", one frame before this card takes over, so it runs from the
  // card's own first frame: frame 0 is still V3's picture and nothing jumps across the hand-over
  const swapAt = fromMs;
  const swap = clamp01((tMs - swapAt) / 180);
  const ok = after(tMs, beats.harmless ?? fromMs + 560, 260);
  return (
    <A1Window w={w} h={h}>
      {({ W }) => (
        <>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <A1Prompt text={cmd} caret={false} tMs={tMs} />
          </div>
          <div style={{ position: "absolute", left: 16, top: 38 }}>
            <HookLine
              tMs={tMs} cmd={hook} was={was} swap={swap}
              boxed={1} tagged={1} lit={1} grow={1} spin={1} bytes={1}
              run={1 - swap}
              ok={ok}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: 89, width: W }}>
            <A1Welcome w={W} cwd={cwd} box={1} left={1} right={1} fade={0.72} />
          </div>
        </>
      )}
    </A1Window>
  );
};

/* ------------------------------------------------------------ V1c ccempty */
// The hook-3 first object is a TAKEOVER STRIP, not the tall window: the hook title sits at
// 0.253H (486 px) and a 560 px card buried it. This card hangs from the band ceiling at 202 px
// and stops at 480, so the title reads under it. It is the same terminal dragged short and
// wide (600 px of window space, so mono still lands at 24-28 device px), and the welcome box
// cannot fit three rows, so the session announces itself with the box's own title line.

const W1C = 600;
const C_ROW1 = 0;
const C_ROW2 = 34;
const C_RULE = 82;
const C_ROW3 = 94;

export type CcEmptyData = { cmd?: string; banner?: string; hello?: string; counter?: string };

export const CcEmpty: React.FC<CardProps & { data: CcEmptyData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const cmd = data.cmd ?? "claude";
  const banner = data.banner ?? "Claude Code v2.0.0";
  const hello = data.hello ?? "Welcome back!";
  const counter = data.counter ?? "0 prompts";
  const b = {
    got: beats.got ?? fromMs,
    hacked: beats.hacked ?? fromMs + 180,
    opening: beats.opening ?? fromMs + 780,
    anew: beats.anew ?? fromMs + 1500,
    counter: beats.counter ?? fromMs + 2700,
  };
  const take = (s: string, at: number, ms: number): string =>
    s.slice(0, Math.ceil(s.length * clamp01((tMs - at) / ms)));
  const typed = take(cmd, b.got, 240);
  const cnt = after(tMs, b.counter, 240);
  return (
    <A1Window w={w} h={h} winW={W1C} stamp={after(tMs, b.hacked, 260)}>
      {({ W }) => (
        <>
          {/* the command, typed, and never answered by a prompt of their */}
          <div style={{ position: "absolute", left: 0, top: C_ROW1 }}>
            <A1Prompt text={typed} caret={typed.length < cmd.length} tMs={tMs} />
          </div>
          {/* the session announcing itself: the welcome box's own title line, its own colours */}
          <div style={{ position: "absolute", left: 0, top: C_ROW2, display: "flex", flexDirection: "row" }}>
            <span style={mono(16, T.accent)}>{take(banner, b.opening, 560)}</span>
            {tMs >= b.anew && <span style={mono(16, T.dim)}>{take(" · ", b.anew, 90)}</span>}
            {tMs >= b.anew + 90 && <span style={mono(16, T.fg)}>{take(hello, b.anew + 90, 330)}</span>}
          </div>
          <div style={{ position: "absolute", left: 0, top: C_RULE, width: W, height: 1, background: T.rule, opacity: 0.45 }} />
          {/* the prompt that never gets a character */}
          <div style={{ position: "absolute", left: 0, top: C_ROW3, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <A1Prompt sigil="> " text="" caret tMs={tMs} />
            {tMs >= b.counter && (
              <span style={{ ...mono(15, T.muted), marginLeft: 16, opacity: cnt, transform: `scale(${lerp(1.35, 1, cnt)})`, transformOrigin: "0% 50%", display: "inline-block" }}>
                {counter}
              </span>
            )}
          </div>
        </>
      )}
    </A1Window>
  );
};
