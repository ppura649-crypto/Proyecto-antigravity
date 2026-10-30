#!/usr/bin/env node
// see.mjs <video or image> [--at <s>] [--out <f.jpg>] [--from <measure.json>] [--read] [--panel]
//         [--rule <y:label,y:label>] [--vrule <x:label>] [--box <y0,y1,x0,x1:label>]
//         [--band <y0,y1>] [--zoom <n>] [--against <file> [--against-at <s>]] [--no-grid]
// Contract: writes one picture and prints its path. The frame, a faint grid every twentieth of it with the share
//   written down the left, and on top of that every number a reading claims, drawn as a line where it says the thing
//   is, with its name next to it. Colours: red the panel edge, cyan a box, yellow a row of words, magenta a sticker,
//   green a region boundary. With --against the two frames sit side by side, each with its own lines, at the same
//   moment, so a difference of half a point is a visible step between two rules.
//   This is the other half of the instrument. `measure.mjs` says a number; this says where that number lands on the
//   picture, and a number whose line does not sit on the edge it names is wrong however precise it looks. Nothing goes
//   in a study, in props or in a check before its line has been drawn and looked at.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { tmpdir } from "node:os";
import { fail, ffbin, run } from "./_lib.mjs";

const args = process.argv.slice(2);
const file = args[0];
if (!file || !existsSync(file)) fail("usage: see.mjs <video or image> [--at s] [--from measure.json] [--rule 0.6:edge]");
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const has = (k) => args.includes(k);
const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg || !ffprobe) fail("ffmpeg not found; run doctor");

// a 5x7 bitmap, one byte a column, so a label can be written on the picture without a font file on the machine
const FONT = {
  "0": "3E5149453E", "1": "00427F4000", "2": "4261514946", "3": "2141454B31", "4": "1814127F10",
  "5": "2745454539", "6": "3C4A494930", "7": "0171090503", "8": "3649494936", "9": "064949291E",
  A: "7E1111117E", B: "7F49494936", C: "3E41414122", D: "7F4141221C", E: "7F49494941", F: "7F09090901",
  G: "3E4149497A", H: "7F0808087F", I: "00417F4100", J: "2040413F01", K: "7F08142241", L: "7F40404040",
  M: "7F020C027F", N: "7F0408107F", O: "3E4141413E", P: "7F09090906", Q: "3E4151215E", R: "7F09192946",
  S: "4649494931", T: "01017F0101", U: "3F4040403F", V: "1F2040201F", W: "3F4038403F", X: "6314081463",
  Y: "0708700807", Z: "6151494543", " ": "0000000000", ".": "0060600000", ":": "0036360000",
  "-": "0808080808", "/": "2010080402", "%": "2313086462", ",": "0050300000", "(": "001C224100",
  ")": "0041221C00", "+": "08083E0808", "=": "1414141414", "_": "4040404040",
};
const glyph = (c) => {
  const s = FONT[c.toUpperCase()] ?? FONT[" "];
  const t = s.replace(/ /g, "0");
  return [0, 1, 2, 3, 4].map((i) => parseInt(t.slice(i * 2, i * 2 + 2), 16));
};

function probe(f) {
  const p = JSON.parse(run(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", f]));
  const s = p.streams?.[0] ?? {};
  return { w: Number(s.width), h: Number(s.height) };
}
function rgb(f, t, w, h) {
  const still = !(t > 0);
  const raw = run(ffmpeg, ["-v", "error", ...(still ? [] : ["-ss", t.toFixed(3)]), "-i", f, "-frames:v", "1", "-vf", "format=rgb24", "-f", "rawvideo", "-"], { encoding: "buffer", maxBuffer: 1 << 28 });
  if (raw.length < w * h * 3) fail(`could not read a frame at ${t.toFixed(2)}s from ${f}`);
  return Buffer.from(raw.subarray(0, w * h * 3));
}

class Canvas {
  constructor(w, h, buf) { this.w = w; this.h = h; this.b = buf ?? Buffer.alloc(w * h * 3, 16); }
  px(x, y, c, a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    for (let k = 0; k < 3; k++) this.b[i + k] = Math.round(this.b[i + k] * (1 - a) + c[k] * a);
  }
  hline(y, c, { a = 1, from = 0, to = 1, dash = 0, weight = 1 } = {}) {
    for (let dy = 0; dy < weight; dy++) for (let x = Math.round(from * this.w); x < Math.round(to * this.w); x++) {
      if (dash && Math.floor(x / dash) % 2) continue;
      this.px(x, Math.round(y) + dy, c, a);
    }
  }
  vline(x, c, { a = 1, from = 0, to = 1, dash = 0, weight = 1 } = {}) {
    for (let dx = 0; dx < weight; dx++) for (let y = Math.round(from * this.h); y < Math.round(to * this.h); y++) {
      if (dash && Math.floor(y / dash) % 2) continue;
      this.px(Math.round(x) + dx, y, c, a);
    }
  }
  box(x0, y0, x1, y1, c, { a = 1, dash = 0, weight = 1 } = {}) {
    this.hline(y0, c, { a, from: x0 / this.w, to: x1 / this.w, dash, weight });
    this.hline(y1, c, { a, from: x0 / this.w, to: x1 / this.w, dash, weight });
    this.vline(x0, c, { a, from: y0 / this.h, to: y1 / this.h, dash, weight });
    this.vline(x1, c, { a, from: y0 / this.h, to: y1 / this.h, dash, weight });
  }
  text(x, y, s, c, scale = 2) {
    const wpx = s.length * 6 * scale;
    for (let dy = -2; dy < 9 * scale + 2; dy++) for (let dx = -3; dx < wpx + 3; dx++) this.px(x + dx, y + dy, [0, 0, 0], 0.62);
    let cx = x;
    for (const ch of s) {
      const cols = glyph(ch);
      for (let i = 0; i < 5; i++) for (let bit = 0; bit < 7; bit++) {
        if (!(cols[i] & (1 << bit))) continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) this.px(cx + i * scale + sx, y + bit * scale + sy, c, 1);
      }
      cx += 6 * scale;
    }
    return wpx;
  }
}

const C = { edge: [255, 60, 60], box: [40, 220, 255], row: [255, 220, 40], sticker: [255, 70, 255], region: [70, 255, 120], grid: [255, 255, 255] };

// every number a reading claims, as a line to draw
function linesFrom(j) {
  const out = [];
  const y = (v, label, c) => { if (typeof v === "number" && Number.isFinite(v)) out.push({ kind: "y", v, label, c }); };
  const x = (v, label, c) => { if (typeof v === "number" && Number.isFinite(v)) out.push({ kind: "x", v, label, c }); };
  // a summary keeps left and width but not always right, and a box drawn to the frame edge would read as a wrong
  // measurement when the measurement is fine, so the right edge comes from the width when it is missing
  const b = (o, label, c) => {
    if (!o || typeof o.top !== "number") return;
    const left = o.left ?? 0;
    const right = o.right ?? (typeof o.width === "number" ? left + o.width : 1);
    out.push({ kind: "box", top: o.top, bottom: o.bottom ?? (typeof o.height === "number" ? o.top + o.height : o.top), left, right, label, c });
  };
  if (j.shape) {                                        // read
    y(j.shape.edge, `${j.shape.name} edge ${j.shape.edge?.toFixed(3)}`, C.edge);
    for (const r of j.regions ?? []) y(r.bottom, `${r.kind} ends ${r.bottom.toFixed(3)}`, C.region);
    for (const t of j.text ?? []) b(t, `text ${t.rows} rows cap ${t.cap?.toFixed(4)}`, C.row);
  }
  if (j.band) {                                         // band
    for (const r of j.rows ?? []) b(r, `row cap ${r.cap.toFixed(4)} base ${r.baseline.toFixed(3)}`, C.row);
    y(j.band[0], `band ${j.band[0]}`, C.region);
    y(j.band[1], `band ${j.band[1]}`, C.region);
  }
  if (j.edge !== undefined && j.card !== undefined) {    // panel
    y(j.edge, `clip starts ${j.edge?.toFixed(4)}`, C.edge);
    b(j.card, `card ${j.card?.width?.toFixed(3)} wide`, C.box);
    b(j.line, `line cap ${j.line?.cap?.toFixed(4)} lead ${j.line?.leading?.toFixed(4)}`, C.row);
    if (j.sticker) b({ ...j.sticker, bottom: j.sticker.top + j.sticker.height }, `sticker ${j.sticker.height?.toFixed(4)} tall`, C.sticker);
    x(j.card?.left, "", C.box); x(j.card?.right, "", C.box);
  }
  return out;
}

function parseRules(s, c) {
  if (!s) return [];
  return s.split(",").map((p) => {
    const [v, ...rest] = p.split(":");
    return { v: Number(v), label: rest.join(":") || v, c };
  }).filter((r) => Number.isFinite(r.v));
}

function draw(f, t, extra) {
  const { w, h } = probe(f);
  const cv = new Canvas(w, h, rgb(f, t, w, h));
  const scale = Math.max(1, Math.round(w / 540));
  if (!has("--no-grid")) {
    for (let i = 1; i < 20; i++) {
      const yy = (i / 20) * h;
      cv.hline(yy, C.grid, { a: i % 2 ? 0.14 : 0.28, dash: i % 2 ? 6 : 0 });
      if (i % 2 === 0) cv.text(4, Math.round(yy) + 3, (i / 20).toFixed(2), [230, 230, 230], scale);
    }
    for (let i = 1; i < 10; i++) cv.vline((i / 10) * w, C.grid, { a: 0.12, dash: 8 });
  }
  const lines = [...extra];
  let side = 0;
  for (const L of lines) {
    if (L.kind === "y") {
      cv.hline(L.v * h, L.c, { a: 0.95, weight: Math.max(1, scale - 1) });
      if (L.label) cv.text(Math.round(w * (side++ % 2 ? 0.42 : 0.10)), Math.round(L.v * h) + 4, L.label, L.c, scale);
    } else if (L.kind === "x") {
      cv.vline(L.v * w, L.c, { a: 0.8, dash: 10 });
      if (L.label) cv.text(Math.round(L.v * w) + 3, Math.round(h * 0.02), L.label, L.c, scale);
    } else if (L.kind === "box") {
      const ty = Math.round(L.top * h);
      cv.box(Math.round(L.left * w), ty, Math.round(L.right * w) - 1, Math.round(L.bottom * h) - 1, L.c, { a: 0.95, weight: Math.max(1, scale - 1) });
      // the label sits above the box when there is room: written inside it, it covers the thing being measured
      if (L.label) cv.text(Math.round(L.left * w) + 4, ty > 11 * scale ? ty - 10 * scale : ty + 4, L.label, L.c, scale);
    }
  }
  return cv;
}

function crop(cv, y0, y1, zoom) {
  const a = Math.max(0, Math.round(y0 * cv.h)), b = Math.min(cv.h, Math.round(y1 * cv.h));
  const w = cv.w, h = b - a;
  const out = new Canvas(w * zoom, h * zoom);
  for (let y = 0; y < h * zoom; y++) for (let x = 0; x < w * zoom; x++) {
    const i = (((a + Math.floor(y / zoom)) * w) + Math.floor(x / zoom)) * 3, o = (y * out.w + x) * 3;
    out.b[o] = cv.b[i]; out.b[o + 1] = cv.b[i + 1]; out.b[o + 2] = cv.b[i + 2];
  }
  return out;
}

// Two frames of different sizes cannot be compared by eye at their own sizes, and a version of a 720 post renders at
// 1080: put both on the same width before they sit next to each other.
function toWidth(cv, W) {
  if (cv.w === W) return cv;
  const H = Math.round((cv.h * W) / cv.w);
  const out = new Canvas(W, H);
  for (let y = 0; y < H; y++) {
    const sy = Math.min(cv.h - 1, Math.floor((y * cv.h) / H));
    for (let x = 0; x < W; x++) {
      const sx = Math.min(cv.w - 1, Math.floor((x * cv.w) / W));
      const i = (sy * cv.w + sx) * 3, o = (y * W + x) * 3;
      out.b[o] = cv.b[i]; out.b[o + 1] = cv.b[i + 1]; out.b[o + 2] = cv.b[i + 2];
    }
  }
  return out;
}

function beside(a0, b0) {
  const W = Math.max(a0.w, b0.w);
  const a = toWidth(a0, W), b = toWidth(b0, W);
  const gap = 12;
  const out = new Canvas(a.w + b.w + gap, Math.max(a.h, b.h));
  for (const [cv, ox] of [[a, 0], [b, a.w + gap]]) {
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
      const i = (y * cv.w + x) * 3, o = (y * out.w + x + ox) * 3;
      out.b[o] = cv.b[i]; out.b[o + 1] = cv.b[i + 1]; out.b[o + 2] = cv.b[i + 2];
    }
  }
  return out;
}

function write(cv, out) {
  mkdirSync(dirname(out), { recursive: true });
  // through a file, not a pipe: a full frame is ten megabytes and the pipe truncates its first packet
  const raw = join(tmpdir(), `see-${process.pid}.rgb`);
  writeFileSync(raw, cv.b);
  try {
    run(ffmpeg, ["-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${cv.w}x${cv.h}`, "-i", raw, "-frames:v", "1", "-q:v", "2", out], { maxBuffer: 1 << 28 });
  } finally { rmSync(raw, { force: true }); }
  return out;
}

const t = Number(opt("--at", "1.5"));
const here = new URL("./measure.mjs", import.meta.url).pathname;
function readingOf(f, at) {
  const from = opt("--from", null);
  if (from) return JSON.parse(readFileSync(from, "utf8"));
  const verb = has("--panel") ? "panel" : "read";
  const r = run(process.execPath, [here, verb, f, "--at", String(at), "--quiet", "--out", join(tmpdir(), "see-reading.json")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(readFileSync(join(tmpdir(), "see-reading.json"), "utf8"));
}

const extraRules = [
  ...parseRules(opt("--rule", null), C.edge).map((r) => ({ kind: "y", v: r.v, label: r.label, c: r.c })),
  ...parseRules(opt("--vrule", null), C.box).map((r) => ({ kind: "x", v: r.v, label: r.label, c: r.c })),
];
const boxes = (opt("--box", null) ?? "").split(";").filter(Boolean).map((s) => {
  const [nums, label] = s.split(":");
  const [y0, y1, x0 = 0, x1 = 1] = nums.split(",").map(Number);
  return { kind: "box", top: y0, bottom: y1, left: x0, right: x1, label: label ?? "", c: C.box };
});

let lines = [...extraRules, ...boxes];
if (!has("--bare")) { try { lines = [...linesFrom(readingOf(file, t)), ...lines]; } catch { /* the picture is still worth drawing */ } }

let cv = draw(file, t, lines);
const bandOpt = opt("--band", null);
const zoom = Number(opt("--zoom", "1"));
if (bandOpt) { const [y0, y1] = bandOpt.split(",").map(Number); cv = crop(cv, y0, y1, Math.max(1, zoom)); }
else if (zoom > 1) cv = crop(cv, 0, 1, zoom);

const against = opt("--against", null);
if (against) {
  const at2 = Number(opt("--against-at", String(t)));
  let other = draw(against, at2, has("--bare") ? [...extraRules, ...boxes] : [...(() => { try { return linesFrom(readingOf(against, at2)); } catch { return []; } })(), ...extraRules, ...boxes]);
  if (bandOpt) { const [y0, y1] = bandOpt.split(",").map(Number); other = crop(other, y0, y1, Math.max(1, zoom)); }
  else if (zoom > 1) other = crop(other, 0, 1, zoom);
  cv = beside(other, cv);
}

const out = opt("--out", join(tmpdir(), `see-${basename(file).replace(/\.[^.]+$/, "")}-${String(t).replace(".", "_")}.jpg`));
write(cv, out);
console.log(JSON.stringify({ ok: true, picture: out, at: t, drawn: lines.length, look: "every line is a number a reading claims; a line that does not sit on the edge it names is a wrong reading, whatever its decimals" }, null, 1));
