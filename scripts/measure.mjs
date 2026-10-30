#!/usr/bin/env node
// measure.mjs read  <video or image> [--at <s>] [--out <f.json>]
// measure.mjs band  <video or image> --band <y0,y1> [--x <x0,x1>] [--at <s>] [--out <f.json>]
// measure.mjs panel <video or image> [--at <s, or several: 1.5,3,5.5>] [--out <f.json>] [--against <file> [--against-at <s>]] [--quiet]
// Contract: reads one frame and says what is in it, in shares of the frame, so two videos of different sizes can be
//   compared number by number. Every number is a share: y over the height, x over the width, so 0.59 is fifty nine
//   hundredths down the frame. A point is a hundredth of the frame.
//
//   read: what this frame holds, with nothing assumed about the format. Walks the frame in rows, calls a row ground
//     when its own margins are one flat colour and picture when they hold a photograph, groups the runs into regions,
//     and names the shape only when the evidence is there:
//       panel   a flat region of at least an eighth of the height against one edge, a picture against the other
//       letterbox  flat bars at both ends with nothing drawn on them, a picture between
//       full    one picture, edge to edge, whatever is written over it
//       flat    no picture at all (a card, a still, a slate)
//       unsure  none of those, with the reason
//     Then it reads the words in every region: on a flat ground by their distance from that ground, over a picture by
//     the white-with-a-dark-edge test that finds an outlined caption on footage. Output:
//       { ok, file, t, width, height, shape: { name, why, edge, side }, regions: [ { kind, top, bottom, ground, flat } ],
//         text: [ { region, top, bottom, left, right, width, cap, leading, rows: [ ... ] } ], boxes: [ { kind, ... } ] }
//     `ok` is false only when the frame cannot be decoded. `shape.name` is "unsure" when the frame is not one of the
//     four, and nothing downstream may guess past that.
//
//   band: measure exactly the rows (and columns) you name, after you have looked at the frame. Finds the ground of that
//     band, decides whether the ink is lighter or darker than it, and reports every row of words with its cap height,
//     its baseline and its extent, plus the box of all the ink in the band. This is the honest way to measure a thing
//     the eye has already identified, and it works on white words on black, black words on white, and a caption over
//     footage, because nothing about the layout is assumed.
//
//   panel: the three-zone reading, kept as it was: the panel edge, the card box above the line, the rows of the line at
//     the panel's foot, and the sticker over the clip. It runs `read` first and REFUSES a frame whose shape is not a
//     panel, with { ok: false, shape, why } and exit code 2, because a reading of a frame this was not built for is
//     noise wearing a number, and a check that compares two of those passes while measuring nothing.
//     With several moments the median of each number is reported, so one bad frame does not move the reading.
//     With --against, the same moments are measured on a second file and the two are printed side by side with the
//     difference, in shares and in points.
//
//   Nothing here replaces looking at the frame. `see.mjs` draws every number this prints as a line on the frame itself;
//   a number that has not been drawn and looked at is not yet a reading.
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { writeJson, fail, ffbin, run } from "./_lib.mjs";

const VERBS = ["read", "band", "panel"];
const argv = process.argv.slice(2);
const verb = VERBS.includes(argv[0]) ? argv[0] : "panel";
const args = VERBS.includes(argv[0]) ? argv.slice(1) : argv;
const file = args[0];
if (!file || !existsSync(file)) fail("usage: measure.mjs [read|band|panel] <video or image> [--at seconds]");
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg || !ffprobe) fail("ffmpeg not found; run doctor");

const DARK = 12;   // anything above this is not the flat black of a panel
const INK = 90;    // white words on black
const LIT = 40;    // the floor of the pill test
const PURE = 0.85; // a margin this much of one colour is a ground the frame draws on, not a picture

function probe(f) {
  const p = JSON.parse(run(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", f]));
  const s = p.streams?.[0] ?? {};
  return { w: Number(s.width), h: Number(s.height), duration: Number(p.format?.duration ?? 0) };
}
function grey(f, t, w, h) {
  const still = !(t > 0);
  const raw = run(ffmpeg, ["-v", "error", ...(still ? [] : ["-ss", t.toFixed(3)]), "-i", f, "-frames:v", "1", "-vf", "format=gray", "-f", "rawvideo", "-"], { encoding: "buffer", maxBuffer: 1 << 26 });
  if (raw.length < w * h) fail(`could not read a frame at ${t.toFixed(2)}s from ${f}`);
  return raw;
}
const pick = (arr, q) => arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * q)))];

// ---------------------------------------------------------------- what is in this frame, nothing assumed

// One pass per row: the colour of its own margins, how much they spread, how much the whole row spreads, its median.
// The margins are the honest test for ground against picture: a card can fill the middle of a flat panel and a caption
// can sit over footage, and in both cases it is the outer sixteenth of the row that says what the row is lying on.
function rowsOf(F) {
  const { w, h, g } = F;
  // A narrow margin, and the test is how much of it is ONE colour, not how much it spreads. A card fills nearly the
  // whole width of a panel and reaches into a wide margin, which made the panel break in two at every card; and a dark
  // shirt at the foot of a clip spreads little and was called flat. The share of the margin that sits on its own median
  // answers both: a panel's margin is one exact colour under a card, a shirt's is not.
  const m = Math.max(8, Math.round(w * 0.03));
  const med = new Float64Array(h), pure = new Float64Array(h), fvar = new Float64Array(h), emean = new Float64Array(h);
  const eh = new Int32Array(256), fh = new Int32Array(256);
  for (let y = 0; y < h; y++) {
    eh.fill(0);
    let s = 0, n = 0;
    for (let x = 0; x < m; x++) { const v = g[y * w + x]; eh[v]++; s += v; n++; }
    for (let x = w - m; x < w; x++) { const v = g[y * w + x]; eh[v]++; s += v; n++; }
    emean[y] = s / n;
    let acc = 0, em = 0;
    for (let v = 0; v < 256; v++) { acc += eh[v]; if (acc * 2 >= n) { em = v; break; } }
    let near = 0;
    for (let v = Math.max(0, em - 10); v <= Math.min(255, em + 10); v++) near += eh[v];
    pure[y] = near / n;
    med[y] = em;
    fh.fill(0);
    let fs = 0, fss = 0;
    for (let x = 0; x < w; x++) { const v = g[y * w + x]; fh[v]++; fs += v; fss += v * v; }
    fvar[y] = Math.sqrt(Math.max(0, fss / w - (fs / w) ** 2));
  }
  return { med, pure, fvar, emean, margin: m };
}

// The runs of ground and picture, in order down the frame.
function regionsOf(F, st) {
  const { h } = F;
  const kind = (y) => (st.pure[y] >= PURE ? "ground" : "picture");
  const runs = [];
  let start = 0;
  for (let y = 1; y <= h; y++) {
    if (y === h || kind(y) !== kind(y - 1)) {
      runs.push({ kind: kind(y - 1), y0: start, y1: y - 1 });
      start = y;
    }
  }
  // a run thinner than a fiftieth of the height is a seam, not a region: give it to the run beside it. The first run
  // has nothing before it, so a seam at the very top goes forward instead, or the frame's first region is two rows of
  // compression noise and every question about which end holds what is answered wrongly.
  const thin = Math.round(h * 0.02);
  const kept = [];
  for (const r of runs) {
    const last = kept[kept.length - 1];
    if (last && r.y1 - r.y0 + 1 < thin) last.y1 = r.y1;
    else kept.push({ ...r });
  }
  while (kept.length > 1 && kept[0].y1 - kept[0].y0 + 1 < thin) { kept[1].y0 = kept[0].y0; kept.shift(); }
  return kept.map((r) => {
    let g0 = 0, f0 = 0;
    for (let y = r.y0; y <= r.y1; y++) { g0 += st.emean[y]; f0 += st.fvar[y]; }
    const n = r.y1 - r.y0 + 1;
    return { kind: r.kind, y0: r.y0, y1: r.y1, top: r.y0 / h, bottom: (r.y1 + 1) / h, height: n / h, ground: Math.round(g0 / n), drawn: +(f0 / n).toFixed(1) };
  });
}

// The shape, named only when the evidence is there.
function shapeOf(F, regions) {
  const h = F.h;
  const big = regions.filter((r) => r.height >= 0.05);
  const pic = big.filter((r) => r.kind === "picture");
  const gnd = big.filter((r) => r.kind === "ground");
  const first = regions[0], last = regions[regions.length - 1];
  if (!pic.length) return { name: "flat", why: "no row of this frame holds a picture in its margins", edge: null, side: null };
  if (!gnd.length) return { name: "full", why: "every row holds a picture edge to edge", edge: null, side: null };
  const topGround = first?.kind === "ground" ? first : null;
  const botGround = last?.kind === "ground" ? last : null;
  // A bar is a flat end with NOTHING drawn on it. Both ends bare is a letterbox however tall the bars are: a 4:5 video
  // in a 9:16 frame carries bars of a third each, and calling one of those a panel invents a zone that holds nothing.
  // A panel is the other case, one flat end that something is drawn on, a picture against the other.
  const bars = [topGround, botGround].filter((r) => r && r.height < 0.45 && r.drawn < 3);
  // The order of the questions matters. A flat end that something is drawn on is a panel, even when the other end
  // carries a bare bar as well; only two BARE ends are a letterbox.
  const panel = [topGround, botGround].filter((r) => r && r.height >= 0.12 && r.drawn >= 3).sort((a, b) => b.height - a.height)[0];
  if (panel && pic.some((r) => r.height >= 0.15)) {
    const side = panel === topGround ? "top" : "bottom";
    return { name: "panel", why: `a flat region of ${(panel.height * 100).toFixed(1)} points against the ${side} with something drawn on it and a picture on the other side`, edge: side === "top" ? panel.bottom : panel.top, side };
  }
  if (bars.length === 2) return { name: "letterbox", why: `flat bars of ${(bars[0].height * 100).toFixed(1)} and ${(bars[1].height * 100).toFixed(1)} points with nothing drawn on them`, edge: bars[0].bottom, side: "top" };
  if (bars.length === 1 && pic.some((r) => r.height >= 0.5)) return { name: "letterbox", why: `one flat bar of ${(bars[0].height * 100).toFixed(1)} points, a picture over the rest`, edge: bars[0] === topGround ? bars[0].bottom : bars[0].top, side: bars[0] === topGround ? "top" : "bottom" };
  return { name: "unsure", why: `${gnd.length} flat region(s) and ${pic.length} picture region(s), none of them big enough against an edge to be a panel`, edge: null, side: null };
}

// The words inside a band. Two ways of finding ink, because the ground decides which one is honest:
//   ground: everything far enough from the band's own colour, which reads white on black and black on white alike;
//   overlay: white pixels with a dark pixel within a few of them, which is the only thing that finds a caption on
//     footage without calling every bright cloud a letter.
// Every edge is read at half of the amplitude the words are written in, so a compressed 720 frame and a sharp 1080 one
// give the same numbers.
function wordsIn(F, y0, y1, x0, x1, mode) {
  const { w, h, g } = F;
  const at = (y, x) => g[y * w + x];
  y0 = Math.max(0, Math.round(y0)); y1 = Math.min(h - 1, Math.round(y1));
  x0 = Math.max(0, Math.round(x0)); x1 = Math.min(w - 1, Math.round(x1));
  const span = x1 - x0 + 1;
  if (y1 <= y0 || span < 8) return null;
  const hist = new Int32Array(256);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) hist[at(y, x)]++;
  const n = (y1 - y0 + 1) * span;
  let acc = 0, ground = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc * 2 >= n) { ground = v; break; } }
  let hi = [], lo = [];
  for (let v = 0; v < 256; v++) { if (!hist[v]) continue; if (v > ground) hi.push([v, hist[v]]); else if (v < ground) lo.push([v, hist[v]]); }
  const mass = (a) => a.reduce((s, [v, c]) => s + c * Math.abs(v - ground), 0);
  const lighter = mode === "overlay" ? true : mass(hi) >= mass(lo);
  const far = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = at(y, x); if (lighter ? v > ground : v < ground) far.push(v); }
  far.sort((a, b) => a - b);
  if (!far.length) return null;
  const peak = pick(far, lighter ? 0.999 : 0.001);
  if (Math.abs(peak - ground) < 25) return { ground, lighter, rows: [], why: "nothing in this band stands far enough off its own ground to be a word" };
  const half = ground + (peak - ground) * 0.5;
  const over = (v) => (lighter ? v > half : v < half);
  // Over a picture, the only thing that tells a letter from a lit screen, a white sleeve or a bright sky is the width
  // of the run it sits in: a stroke is narrow and has something dark within a few pixels of it, a lit object is wide.
  const stroke = new Uint8Array(mode === "overlay" ? w * h : 0);
  if (mode === "overlay") {
    const maxRun = Math.max(8, Math.round(w / 8));
    for (let y = y0; y <= y1; y++) {
      let s0 = -1;
      for (let x = x0; x <= x1 + 1; x++) {
        const on = x <= x1 && over(at(y, x));
        if (on && s0 < 0) s0 = x;
        if (!on && s0 >= 0) {
          if (x - s0 <= maxRun) for (let k = s0; k < x; k++) stroke[y * w + k] = 1;
          s0 = -1;
        }
      }
    }
  }
  const isInk = (y, x) => {
    if (!over(at(y, x))) return false;
    if (mode !== "overlay") return true;
    if (!stroke[y * w + x]) return false;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
      if (at(yy, xx) < 90) return true;                        // an outline, a shadow or the footage behind it
    }
    return false;
  };
  const inkRow = new Float64Array(h);
  for (let y = y0; y <= y1; y++) { let c = 0; for (let x = x0; x <= x1; x++) if (isInk(y, x)) c++; inkRow[y] = c / span; }
  const floor = mode === "overlay" ? 0.004 : 0.0015;
  const raw = [];
  { let s0 = -1; for (let y = y0; y <= y1 + 1; y++) { const on = y <= y1 && inkRow[y] > floor; if (on && s0 < 0) s0 = y; if (!on && s0 >= 0) { if (y - s0 >= 3) raw.push({ y0: s0, y1: y - 1 }); s0 = -1; } } }
  const rows = raw.map((r) => {
    const tops = [], bots = [];
    let left = x1, right = x0, runs = 0, inked = 0, was = false;
    for (let x = x0; x <= x1; x++) {
      let t0 = -1, b0 = -1;
      for (let y = r.y0; y <= r.y1; y++) if (isInk(y, x)) { if (t0 < 0) t0 = y; b0 = y; }
      const on = t0 >= 0;
      if (on && !was) runs++;
      was = on;
      if (on) { tops.push(t0); bots.push(b0); inked++; if (x < left) left = x; if (x > right) right = x; }
    }
    tops.sort((a, b) => a - b); bots.sort((a, b) => a - b);
    const capTop = pick(tops, 0.02), baseline = pick(bots, 0.5);
    const cover = right > left ? inked / (right - left + 1) : 1;
    // How much of this row is type: the share of its columns whose ink is within a little of the row's own cap. A row
    // of words is regular; a row that is a caption sitting across the lit edge of a screen is not, and a cap read off
    // that band belongs to the screen, not to the words. The number is reported so the reading can say so out loud.
    const capPx = Math.max(1, baseline + 1 - capTop);
    let regular = 0;
    for (let i = 0; i < tops.length; i++) { const hgt = bots[i] - tops[i] + 1; if (hgt >= capPx * 0.45) regular++; }
    return { regular: tops.length ? regular / tops.length : 0, top: capTop / h, bottom: (r.y1 + 1) / h, baseline: (baseline + 1) / h, cap: (baseline + 1 - capTop) / h, left: left / w, right: (right + 1) / w, width: (right + 1 - left) / w, runs, cover, px: { y0: r.y0, y1: r.y1, capTop, baseline, left, right } };
  }).filter((r) => {
    // The one thing that separates a row of words from the edge of a table, a chair back or a rule on a page: letters
    // stand apart, so the row breaks into runs and never fills its own width. An edge is one unbroken run.
    if (r.width <= 0.01 || (r.cap * h) < 4) return false;
    // A band explicitly identified as text may contain dense bold letters.
    // Keep separate ink runs, but do not discard a row solely for its weight.
    const wordish = r.runs >= (mode === "overlay" ? 4 : 3) && (argv.includes("--text") || r.cover < 0.92);
    return wordish;
  }).map(({ runs, cover, ...rest }) => rest);
  const steps = rows.slice(1).map((r, i) => r.baseline - rows[i].baseline);
  return {
    ground, lighter, rows,
    top: rows.length ? rows[0].top : null,
    bottom: rows.length ? rows[rows.length - 1].bottom : null,
    left: rows.length ? Math.min(...rows.map((r) => r.left)) : null,
    right: rows.length ? Math.max(...rows.map((r) => r.right)) : null,
    width: rows.length ? Math.max(...rows.map((r) => r.width)) : null,
    cap: rows.length ? Math.max(...rows.map((r) => r.cap)) : null,
    leading: steps.length ? steps.reduce((s, v) => s + v, 0) / steps.length : null,
  };
}

function readFrame(f, t) {
  const { w, h } = probe(f);
  const g = grey(f, t, w, h);
  const F = { w, h, g };
  const st = rowsOf(F);
  const regions = regionsOf(F, st);
  const shape = shapeOf(F, regions);
  const text = [];
  for (const r of regions) {
    if (r.y1 - r.y0 < Math.round(h * 0.01)) continue;
    const mode = r.kind === "ground" ? "ground" : "overlay";
    const words = wordsIn(F, r.y0, r.y1, 0, w - 1, mode);
    if (!words || !words.rows.length) continue;
    const regular = words.rows.reduce((s2, r2) => s2 + r2.regular, 0) / words.rows.length;
    text.push({ region: `${r.kind} ${r.top.toFixed(3)}-${r.bottom.toFixed(3)}`, mode, ground: words.ground, lighter: words.lighter, top: words.top, bottom: words.bottom, left: words.left, right: words.right, width: words.width, cap: words.cap, leading: words.leading, rows: words.rows.length, regular: +regular.toFixed(2), ...(regular < 0.35 ? { mixed: "this band holds something that is not type; name its rows yourself with `band` after looking" } : {}) });
  }
  // biggest type first: the block that carries the post is the one to look at, and a page of small print behind it is
  // still on file in the regions
  text.sort((a, b) => (b.cap ?? 0) - (a.cap ?? 0));
  const more = Math.max(0, text.length - 6);
  text.splice(6);
  return {
    ok: true, file: f, t, width: w, height: h,
    shape,
    regions: regions.map(({ kind, top, bottom, height, ground, drawn }) => ({ kind, top, bottom, height, ground, drawn })),
    text, ...(more ? { text_more: more } : {}),
  };
}

// ---------------------------------------------------------------- the three-zone reading, unchanged, but it refuses a frame it was not built for

function measure(f, t) {
  const { w, h } = probe(f);
  const g = grey(f, t, w, h);
  const at = (y, x) => g[y * w + x];

  // one pass per row: how much of it is above the black floor, how much is white ink, and the mean
  const lit = new Float64Array(h), ink = new Float64Array(h), mean = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let l = 0, i = 0, s = 0;
    for (let x = 0; x < w; x++) { const v = g[y * w + x]; s += v; if (v > DARK) l++; if (v > INK) i++; }
    lit[y] = l / w; ink[y] = i / w; mean[y] = s / w;
  }
  const band = (a, b, arr) => { let s = 0; for (let y = Math.max(0, a); y < Math.min(h, b); y++) s += arr[y]; return s / Math.max(1, Math.min(h, b) - Math.max(0, a)); };

  // the panel edge: walk up from the last row while the rows still hold a picture, and stop on the flat black band
  let edge = -1, side = "top";
  let y = h - 1;
  while (y > Math.round(h * 0.1) && lit[y] > 0.02) y--;
  if (y > Math.round(h * 0.1) && y < h - Math.round(h * 0.1) && band(y - 14, y, lit) < 0.02 && band(y + 2, h, lit) > 0.3) edge = y + 1;
  if (edge < 0) {
    let best = 0;
    for (let z = Math.round(h * 0.15); z < Math.round(h * 0.9); z++) {
      const above = band(z - 14, z - 1, lit), below = band(z + 2, z + 15, lit);
      if (above < 0.02 && below - above > best) { best = below - above; edge = z; }
    }
    if (best < 0.2) edge = -1;
  }
  if (edge > 0 && band(0, edge, lit) > band(edge, h, lit)) side = "bottom";

  const panelTop = 0, panelBottom = edge < 0 ? h : edge;

  // The words in the panel, band by band. Every edge is read at half of the white they are written in, so a compressed
  // frame and a sharp one give the same numbers.
  const vals = [];
  for (let y = panelTop; y < panelBottom; y++) for (let x = 0; x < w; x++) { const v = at(y, x); if (v > INK) vals.push(v); }
  vals.sort((x, y) => x - y);
  const peak = vals.length ? vals[Math.round((vals.length - 1) * 0.98)] : 255;
  const half = Math.max(40, Math.round(peak * 0.5));
  const inkRow = new Float64Array(h);
  for (let y = panelTop; y < panelBottom; y++) { let c = 0; for (let x = 0; x < w; x++) if (at(y, x) > half) c++; inkRow[y] = c / w; }
  const raw = [];
  { let s0 = -1; for (let y = panelTop; y <= panelBottom; y++) { const on = y < panelBottom && inkRow[y] > 0.0015; if (on && s0 < 0) s0 = y; if (!on && s0 >= 0) { if (y - s0 >= 3) raw.push({ y0: s0, y1: y - 1 }); s0 = -1; } } }
  const bands = raw.map((r) => {
    const tops = [], bots = [];
    let left = w, right = 0;
    for (let x = 0; x < w; x++) {
      let t0 = -1, b0 = -1;
      for (let y = r.y0; y <= r.y1; y++) if (at(y, x) > half) { if (t0 < 0) t0 = y; b0 = y; }
      if (t0 >= 0) { tops.push(t0); bots.push(b0); if (x < left) left = x; if (x > right) right = x; }
    }
    tops.sort((x, y) => x - y); bots.sort((x, y) => x - y);
    const capTop = pick(tops, 0.02), baseline = pick(bots, 0.5);
    return { y0: r.y0, y1: r.y1, capTop, baseline, cap: baseline + 1 - capTop, left, right, width: right + 1 - left };
  });

  // The line is the last band before the clip plus the bands above it that carry the same size at a steady step. A row
  // of a card sits at another size or another step, so it stays a card. This is the only reading that separates a line
  // of two rows from the foot of a screenshot without knowing what either says.
  const rowsLine = [];
  if (bands.length) {
    rowsLine.push(bands[bands.length - 1]);
    let lead = null;
    for (let i = bands.length - 2; i >= 0; i--) {
      const b2 = bands[i], first = rowsLine[0];
      const step = first.baseline - b2.baseline;
      const sameSize = Math.abs(b2.cap - first.cap) <= first.cap * 0.25;
      const steady = lead === null ? step <= first.cap * 1.75 : Math.abs(step - lead) <= lead * 0.15;
      if (!sameSize || !steady || step <= 0) break;
      lead = lead ?? step;
      rowsLine.unshift(b2);
    }
  }
  const lineTopRow = rowsLine.length ? rowsLine[0].y0 : panelBottom;
  // The soft edge of the line's own capitals reaches a little above the band, further on a compressed file than on a
  // sharp one; the card stops a third of a capital short of the line, so a card's foot is a card's foot and not the
  // halo of a letter, and the same rule holds on both files.
  const halo = rowsLine.length ? Math.round(rowsLine[0].cap * 0.35) : 0;
  const cardEnd = Math.max(panelTop, lineTopRow - halo);

  // The cards: what the panel draws above the line, measured by its ink, whatever ground it sits on.
  let cTop = -1, cBot = -1, cLeft = w, cRight = 0;
  for (let y = panelTop; y < cardEnd; y++) {
    let any = false;
    for (let x = 0; x < w; x++) if (at(y, x) > DARK) { any = true; if (x < cLeft) cLeft = x; if (x > cRight) cRight = x; }
    if (any) { if (cTop < 0) cTop = y; cBot = y; }
  }
  const card = cTop >= 0 ? { top: cTop / h, bottom: (cBot + 1) / h, left: cLeft / w, right: (cRight + 1) / w, width: (cRight + 1 - cLeft) / w, height: (cBot + 1 - cTop) / h } : null;
  const rows = rowsLine.map((r) => ({ top: r.capTop / h, bottom: (r.y1 + 1) / h, baseline: (r.baseline + 1) / h, cap: r.cap / h, left: r.left / w, right: (r.right + 1) / w, width: r.width / w }));
  const line = rowsLine.length ? {
    top: rowsLine[0].capTop / h, bottom: (rowsLine[rowsLine.length - 1].y1 + 1) / h,
    left: Math.min(...rows.map((r) => r.left)), right: Math.max(...rows.map((r) => r.right)),
    width: Math.max(...rows.map((r) => r.width)),
    cap: Math.max(...rows.map((r) => r.cap)),
    leading: rowsLine.length > 1 ? (rowsLine[rowsLine.length - 1].baseline - rowsLine[0].baseline) / (rowsLine.length - 1) / h : null,
    rows,
  } : null;

  // the sticker: a band over the clip that is only flat dark and white words, with straight edges
  let sticker = null;
  if (edge > 0) {
    const WHITE = 185;
    const pillRows = [];
    const bridge = Math.round(w * 0.05); // a letter of white words never breaks the dark ground of a pill
    for (let y = edge + 2; y < h; y++) {
      const runs = [];
      let x0 = -1;
      for (let x = 0; x <= w; x++) {
        const dark = x < w && at(y, x) < LIT;
        if (dark && x0 < 0) x0 = x;
        if (!dark && x0 >= 0) { runs.push([x0, x - 1]); x0 = -1; }
      }
      const merged = [];
      for (const r of runs) {
        const last = merged[merged.length - 1];
        if (last && r[0] - last[1] - 1 <= bridge) last[1] = r[1]; else merged.push([...r]);
      }
      let bestRun = 0, bx0 = 0;
      for (const m of merged) { const len = m[1] - m[0] + 1; if (len > bestRun && len < w * 0.9) { bestRun = len; bx0 = m[0]; } }
      if (bestRun < w * 0.1) continue;
      let dark = 0, white = 0;
      for (let x = bx0; x < bx0 + bestRun; x++) { const v = at(y, x); if (v < LIT) dark++; else if (v > WHITE) white++; }
      if (dark / bestRun < 0.45) continue;
      pillRows.push({ y, left: bx0, right: bx0 + bestRun - 1, white });
    }
    const groups = [];
    for (const r of pillRows) {
      const last = groups[groups.length - 1];
      const over = last ? (Math.min(r.right, last.right) - Math.max(r.left, last.left)) / Math.max(r.right - r.left, last.right - last.left) : 0;
      if (last && r.y - last.y1 <= 8 && over > 0.6) { last.y1 = r.y; last.rows.push(r); last.left = Math.min(last.left, r.left); last.right = Math.max(last.right, r.right); }
      else groups.push({ y0: r.y, y1: r.y, rows: [r], left: r.left, right: r.right });
    }
    // one pill can break into bands where its words fill a row; put the bands of one box back together
    for (let i = groups.length - 1; i > 0; i--) {
      const a2 = groups[i - 1], b2 = groups[i];
      const over = (Math.min(a2.right, b2.right) - Math.max(a2.left, b2.left)) / Math.max(a2.right - a2.left, b2.right - b2.left);
      if (b2.y0 - a2.y1 <= Math.round(h * 0.02) && over > 0.8) {
        a2.y1 = b2.y1; a2.rows = a2.rows.concat(b2.rows); a2.left = Math.min(a2.left, b2.left); a2.right = Math.max(a2.right, b2.right);
        groups.splice(i, 1);
      }
    }
    const scored = groups.map((gp) => {
      const lefts = gp.rows.map((r) => r.left).sort((a2, b2) => a2 - b2);
      const rights = gp.rows.map((r) => r.right).sort((a2, b2) => a2 - b2);
      const at2 = (arr, q) => arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * q)))];
      const left = at2(lefts, 0.15), right = at2(rights, 0.85);
      const spread = Math.max(at2(lefts, 0.85) - left, right - at2(rights, 0.15));
      const tops = [], bots = [];
      let white = 0, wr = 0;
      const vals = [];
      for (let y = gp.y0; y <= gp.y1; y++) for (let x = left; x <= right; x++) { const v = at(y, x); if (v > WHITE) vals.push(v); }
      vals.sort((a2, b2) => a2 - b2);
      const half = Math.max(60, Math.round((vals.length ? vals[Math.round((vals.length - 1) * 0.98)] : 255) * 0.5));
      for (let y = gp.y0; y <= gp.y1; y++) { let c = 0; for (let x = left; x <= right; x++) if (at(y, x) > half) c++; if (c > 0) { white += c; wr++; } }
      for (let x = left; x <= right; x++) { let t0 = -1, b0 = -1; for (let y = gp.y0; y <= gp.y1; y++) if (at(y, x) > half) { if (t0 < 0) t0 = y; b0 = y; } if (t0 >= 0) { tops.push(t0); bots.push(b0); } }
      return { gp, left, right, spread, white, wr, tops, bots, height: gp.y1 - gp.y0 + 1 };
    }).filter((sc) => sc.wr >= 3 && sc.height > h * 0.008 && sc.height < h * 0.12 && sc.spread < w * 0.06);
    scored.sort((a2, b2) => b2.white - a2.white);
    const sc = scored[0];
    if (sc) {
      sc.tops.sort((a2, b2) => a2 - b2); sc.bots.sort((a2, b2) => a2 - b2);
      const capTop = pick(sc.tops, 0.02), baseline = pick(sc.bots, 0.5);
      sticker = { top: sc.gp.y0 / h, bottom: (sc.gp.y1 + 1) / h, left: sc.left / w, right: (sc.right + 1) / w, width: (sc.right + 1 - sc.left) / w, height: (sc.gp.y1 + 1 - sc.gp.y0) / h, cap: (baseline + 1 - capTop) / h, from_edge: (sc.gp.y0 - edge) / h };
    }
  }

  const gaps = {
    frame_to_card: card ? card.top : null,
    card_to_line: card && line ? line.top - card.bottom : null,
    line_to_edge: line ? (edge < 0 ? null : edge / h - line.bottom) : null,
    baseline_to_edge: line && rows.length ? (edge < 0 ? null : edge / h - rows[rows.length - 1].baseline) : null,
  };
  return { file: f, t, width: w, height: h, panel: { side, edge: edge < 0 ? null : edge / h }, card, line, gaps, sticker };
}

// ---------------------------------------------------------------- the verbs

const out = opt("--out", null);

if (verb === "read") {
  const t = Number(opt("--at", "1.5"));
  const r = readFrame(file, t);
  if (out) writeJson(out, r);
  if (!args.includes("--quiet")) console.log(JSON.stringify(r, null, 1));
  process.exit(0);
}

if (verb === "band") {
  const t = Number(opt("--at", "1.5"));
  const [by0, by1] = String(opt("--band", "0,1")).split(",").map(Number);
  const [bx0, bx1] = String(opt("--x", "0,1")).split(",").map(Number);
  const { w, h } = probe(file);
  const F = { w, h, g: grey(file, t, w, h) };
  const st = rowsOf(F);
  const mid = Math.round(((by0 + by1) / 2) * h);
  const auto = st.pure[Math.min(h - 1, Math.max(0, mid))] >= PURE ? "ground" : "overlay";
  const mode = opt("--mode", auto);
  const words = wordsIn(F, by0 * h, by1 * h, bx0 * w, bx1 * w, mode);
  const r = { ok: !!words, file, t, frame: { width: w, height: h }, band: [by0, by1], x: [bx0, bx1], mode, ...(words ?? { why: "band too small to read" }) };
  if (r.rows) r.rows = r.rows.map(({ px, ...rest }) => rest);
  if (out) writeJson(out, r);
  if (!args.includes("--quiet")) console.log(JSON.stringify(r, null, 1));
  process.exit(0);
}

// panel
const moments = String(opt("--at", "1.5")).split(",").map(Number).filter((n) => Number.isFinite(n));
const against = opt("--against", null);
const againstMoments = String(opt("--against-at", opt("--at", "1.5"))).split(",").map(Number).filter((n) => Number.isFinite(n));

// A frame that is not a panel frame is not measured. The reading it would produce (a capital three pixels tall, a card
// box one row high, a panel edge in the middle of a photograph) looks exactly like a real one, and two of them compare
// to nothing, so a check built on it passes while measuring noise.
function gate(f, ts) {
  const seen = ts.map((t) => readFrame(f, t));
  const names = seen.map((s) => s.shape.name);
  const panelAt = names.filter((n) => n === "panel").length;
  if (panelAt >= Math.ceil(names.length / 2)) return null;
  const s = seen[0];
  return { ok: false, file: f, shape: s.shape.name, why: `this frame is not a panel frame: ${s.shape.why}`, at: ts, shapes: names, regions: s.regions, hint: "measure it with `measure.mjs read` and then `measure.mjs band` on the rows you name after looking at `see.mjs`" };
}
for (const [f, ts] of [[file, moments], ...(against ? [[against, againstMoments]] : [])]) {
  const refused = gate(f, ts);
  if (refused) {
    console.log(JSON.stringify(refused, null, 1));
    if (out) writeJson(out, refused);
    process.exit(2);
  }
}

function median(nums) { const a = nums.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((x, y) => x - y); return a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null; }
function summarise(list) {
  const g = (f) => median(list.map(f));
  return {
    ok: true,
    moments: list.map((m) => m.t),
    width: list[0]?.width, height: list[0]?.height,
    edge: g((m) => m.panel.edge),
    card: { top: g((m) => m.card?.top), bottom: g((m) => m.card?.bottom), left: g((m) => m.card?.left), right: g((m) => m.card?.right), width: g((m) => m.card?.width), height: g((m) => m.card?.height) },
    line: { top: g((m) => m.line?.top), bottom: g((m) => m.line?.bottom), left: g((m) => m.line?.left), width: g((m) => m.line?.width), cap: g((m) => m.line?.cap), leading: g((m) => m.line?.leading), rows: median(list.map((m) => m.line?.rows?.length ?? null)) },
    gaps: { card_to_line: g((m) => m.gaps.card_to_line), line_to_edge: g((m) => m.gaps.line_to_edge), baseline_to_edge: g((m) => m.gaps.baseline_to_edge) },
    sticker: list.some((m) => m.sticker) ? { top: g((m) => m.sticker?.top), height: g((m) => m.sticker?.height), width: g((m) => m.sticker?.width), left: g((m) => m.sticker?.left), cap: g((m) => m.sticker?.cap), from_edge: g((m) => m.sticker?.from_edge) } : null,
  };
}

// The second half of the gate. A frame can hold a panel and still not hold THIS format: another account puts a block
// of type in the middle of its panel and nothing at its foot, and the reading below would then call a two pixel
// artefact its line and a text block its card. A reading whose own parts are not the parts it names is refused, in the
// same words, for the same reason: numbers that name the wrong thing are worse than no numbers.
function implausible(sum) {
  if (!sum.line || !sum.line.cap) return "the panel holds no line of type at its foot";
  if (sum.line.cap < 0.008) return `the band at the panel's foot is ${(sum.line.cap * 100).toFixed(2)} points tall, which is a mark, not a line of type`;
  if ((sum.line.width ?? 0) < 0.1) return `the band at the panel's foot is ${((sum.line.width ?? 0) * 100).toFixed(1)} points wide, which is a mark, not a line of type`;
  if (!sum.card || !sum.card.height) return "nothing is drawn in the panel above the line";
  return null;
}
const mine = summarise(moments.map((t) => measure(file, t)));
const theirs = against ? summarise(againstMoments.map((t) => measure(against, t))) : null;
for (const [f, sum] of [[file, mine], ...(theirs ? [[against, theirs]] : [])]) {
  const why = implausible(sum);
  if (why) {
    const refused = { ok: false, file: f, shape: "panel", why: `this panel is not a three zone panel: ${why}`, at: sum.moments, hint: "look at it with see.mjs, name the band each thing sits in, and measure each with measure.mjs band" };
    console.log(JSON.stringify(refused, null, 1));
    if (out) writeJson(out, refused);
    process.exit(2);
  }
}
if (out) writeJson(out, theirs ? { post: theirs, version: mine, at: moments } : mine);

const s3 = (v) => (v === null || v === undefined ? "     -" : v.toFixed(4).padStart(6));
const pts = (a, b) => (a === null || b === null || a === undefined || b === undefined ? "    -" : ((a - b) * 100 >= 0 ? "+" : "") + ((a - b) * 100).toFixed(2));
if (!args.includes("--quiet")) {
  if (!theirs) console.log(JSON.stringify(mine, null, 1));
  else {
    const rows = [];
    const add = (name, a, b) => rows.push([name, s3(b), s3(a), pts(a, b)]);
    add("panel edge", mine.edge, theirs.edge);
    add("card top", mine.card.top, theirs.card.top);
    add("card bottom", mine.card.bottom, theirs.card.bottom);
    add("card left", mine.card.left, theirs.card.left);
    add("card width", mine.card.width, theirs.card.width);
    add("card height", mine.card.height, theirs.card.height);
    add("line top", mine.line.top, theirs.line.top);
    add("line left", mine.line.left, theirs.line.left);
    add("line width", mine.line.width, theirs.line.width);
    add("line cap", mine.line.cap, theirs.line.cap);
    add("line leading", mine.line.leading, theirs.line.leading);
    add("gap card to line", mine.gaps.card_to_line, theirs.gaps.card_to_line);
    add("gap line to clip", mine.gaps.line_to_edge, theirs.gaps.line_to_edge);
    add("sticker top", mine.sticker?.top, theirs.sticker?.top);
    add("sticker height", mine.sticker?.height, theirs.sticker?.height);
    add("sticker width", mine.sticker?.width, theirs.sticker?.width);
    add("sticker cap", mine.sticker?.cap, theirs.sticker?.cap);
    console.log(`${basename(against)} at ${againstMoments.join(", ")}s  vs  ${basename(file)} at ${moments.join(", ")}s`);
    console.log("what".padEnd(18) + "post".padStart(6) + "    ours" + "   off in points");
    for (const r of rows) console.log(r[0].padEnd(18) + r[1] + "  " + r[2] + "   " + r[3]);
  }
}
