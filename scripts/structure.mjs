#!/usr/bin/env node
// structure.mjs <video or image> [--out <dir>] [--id <name>] [--debug]
// Contract: reads one video and writes <out>/<id>.json and <out>/<id>.jpg (a contact sheet of five frames: the first
//   second, a quarter, the middle, three quarters, the last second) so the agent can look at the structure in one image.
//   The JSON says what the pixels say, nothing more:
//   { file, id, duration, width, height, fps, frames: [ { t, hash, edges, text_band: { mean, ratio, at } } ],
//     cuts: [ t ], shots, kind: "single" | "cut", motion: "static" | "moving", text: { likely, position },
//     layout: "full" | "split", split_at, regions: { top: { cuts, shots, kind, motion, dark, flow }, bottom: { ... } }, sheet }
//   panel: "top" | "bottom", the side that holds the text or cards (dark is true on that side's region).
//   flow (full frame, only when the frame is not split) and regions.<r>.flow carry { mean, p90, max, spikes, frames,
//   series }: series is the change per tenth of a second over the first six seconds; sort.mjs slides it along a longer
//   file to find the same take. Per region, motion is "static" | "moving" | "timelapse" and flow is the frame to
//   frame change at the file's own rate over the first six seconds (see flowOf). Two posts that reuse one take file show
//   the same flow numbers, so flow is also the take's signature; formats.mjs groups takes with it.
//   layout: "split" when a band at the top or the bottom has flat black or white margins for its whole height, holds
//   something in its middle and holds still between changes (a text panel, a card stack); the regions are then read on
//   their own, because a card that cuts on top of a still shot is one format and a clip that cuts under a still line is
//   another. split_at is the boundary as a share of the height, panel_colour the band's colour. A flat band with nothing
//   in it is a letterbox: the frame stays "full" and `bands: { top, bottom }` carries its share of the height.
//   kind: "single" when no quarter second jumps 12 or more bits (see readCuts), "cut" otherwise; on a full frame of
//   handheld or dark footage, where the hash floor hides cuts, the cuts come from spikes of the frame difference over the
//   first six seconds instead (cuts_from says so).
//   motion: "static" when the five sampled frames stay within 12 bits of each other, "moving" otherwise; per region,
//   "timelapse" when one shot jumps the way a timelapse does (see flowOf).
//   text: the caption-band rule measured on 2026-09-03 (window mean at least 16 and 1.4 times the frame mean), with
//   the band's position as a share of the height, so the skill knows where the line sits.
//   A still image (a post thumbnail when Instagram gave no video file) is read the same way from its one frame: layout,
//   panel side and text position are real, cuts and motion are reported as unknown. Exits 1 with the reason on a file it
//   cannot read. Default out: context/structure/.
import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { P, writeJson, fail, ffbin, run } from "./_lib.mjs";

const args = process.argv.slice(2);
const file = args[0];
if (!file || !existsSync(file)) fail("usage: structure.mjs <video> [--out dir] [--id name]");
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const outDir = opt("--out", P("context", "structure"));
const id = opt("--id", basename(file).replace(/\.[^.]+$/, ""));
const ffmpeg = ffbin("ffmpeg"), ffprobe = ffbin("ffprobe");
if (!ffmpeg || !ffprobe) fail("ffmpeg not found; run doctor");
mkdirSync(outDir, { recursive: true });

const probe = JSON.parse(run(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file]));
const s = probe.streams?.[0] ?? {};
const isImage = /\.(jpe?g|png|webp)$/i.test(file) || !(Number(probe.format?.duration) > 0.2);
const duration = isImage ? 0 : Number(probe.format?.duration ?? 0);
if (!isImage && !duration) fail(`no duration read from ${file}`);
const [fn, fd] = String(s.r_frame_rate ?? "30/1").split("/").map(Number);

function frame(t, vf, w, h) {
  const seek = isImage ? [] : ["-ss", t.toFixed(3)];
  const raw = run(ffmpeg, ["-v", "error", ...seek, "-i", file, "-frames:v", "1", "-vf", vf, "-f", "image2pipe", "-c:v", "rawvideo", "-"], { encoding: "buffer", maxBuffer: 1 << 22 });
  if (raw.length < w * h) fail(`could not read a frame at ${t.toFixed(2)}s from ${file}`);
  return raw;
}
function dhash(t) {
  const raw = frame(t, "scale=9:8:flags=area,format=gray", 9, 8);
  const bits = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) bits.push(raw[r * 9 + c] > raw[r * 9 + c + 1] ? 1 : 0);
  return bits;
}
const hamming = (a, b) => a.reduce((n, bit, i) => n + (bit !== b[i] ? 1 : 0), 0);
function textBand(t) {
  const w = 90, h = 160, win = Math.round(h * 0.15);
  const raw = frame(t, `format=gray,edgedetect=low=0.1:high=0.3,scale=${w}:${h}:flags=area`, w, h);
  const rows = []; for (let y = 0; y < h; y++) { let sum = 0; for (let x = 0; x < w; x++) sum += raw[y * w + x]; rows.push(sum / w); }
  const frameMean = rows.reduce((a, b) => a + b, 0) / h;
  let best = 0, at = 0;
  for (let y = 0; y + win <= h; y++) { const m = rows.slice(y, y + win).reduce((a, b) => a + b, 0) / win; if (m > best) { best = m; at = y; } }
  return { mean: Math.round(best * 10) / 10, ratio: frameMean ? Math.round((best / frameMean) * 100) / 100 : 0, at: Math.round(((at + win / 2) / h) * 100) / 100, edges: Math.round(frameMean * 10) / 10 };
}

// Five sampled frames for the sheet and the motion reading.
const stops = isImage ? [0, 0, 0, 0, 0] : [Math.min(0.5, duration / 2), duration * 0.25, duration * 0.5, duration * 0.75, Math.max(duration - 0.5, duration / 2)];
const frames = stops.map((t) => { const band = textBand(t); return { t: Math.round(t * 100) / 100, hash: dhash(t).join(""), edges: band.edges, text_band: { mean: band.mean, ratio: band.ratio, at: band.at } }; });
const hashes = frames.map((f) => f.hash.split("").map(Number));
let maxPair = 0; for (let i = 0; i < hashes.length; i++) for (let j = i + 1; j < hashes.length; j++) maxPair = Math.max(maxPair, hamming(hashes[i], hashes[j]));

// One frame per second for the cuts, on the whole frame and on each half.
function dhashRegion(t, region) {
  const crop = region === "top" ? `crop=iw:ih*${SPLIT}:0:0,` : region === "bottom" ? `crop=iw:ih*${1 - SPLIT}:0:ih*${SPLIT},` : "";
  const raw = frame(t, `${crop}scale=9:8:flags=area,format=gray`, 9, 8);
  const bits = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) bits.push(raw[r * 9 + c] > raw[r * 9 + c + 1] ? 1 : 0);
  return bits;
}
// The split: a panel is a band at the top or the bottom of the frame whose outer columns are one flat colour, black or
// white, for the band's whole height in every sampled frame, that holds something in its middle (text, cards, an icon)
// and holds still between changes. A band with nothing in it is a letterbox, reported under `bands`, and the frame stays
// "full". A text block over a video is not a band: the video shows in its margins. A wall behind a person is not a band:
// the person moves. Calibrated 2026-09-04 on four accounts: posted split reels (panels from 0.22 to 0.59 of the height),
// full-frame shots with a text block, letterboxed timelapses, a panel over a timelapse that turns dark at night.
// The margins are the outermost column on each side of a 96-wide frame, one percent of the width: cards on a panel
// start two to four percent in, so a wider margin would cut a card panel short (measured 2026-09-04 on the three-zone reel).
const BW = 96, BH = 64;
const greys = stops.map((t) => frame(t, `scale=${BW}:${BH}:flags=area,format=gray`, BW, BH));
const medianOf = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const margins = (g, y) => [g[y * BW], g[y * BW + BW - 1]];
function bandOf(side) {
  const order = side === "top" ? [...Array(BH).keys()] : [...Array(BH).keys()].reverse();
  const colour = medianOf(greys.flatMap((g) => order.slice(0, 3).flatMap((y) => margins(g, y))));
  if (colour > 16 && colour < 240) return null;
  // A row belongs to the band when its margins are flat in four of the five frames: one full-bleed card in one frame
  // (a white page screenshot edge to edge) must not cut the panel short.
  const need = Math.ceil(greys.length * 0.8);
  let n = 0;
  for (const y of order) { if (greys.filter((g) => margins(g, y).every((v) => Math.abs(v - colour) <= 12)).length >= need) n++; else break; }
  const share = Math.round((n / BH) * 100) / 100;
  if (share < 0.12 || share > 0.8) return null;
  let content = 0, total = 0;
  for (const g of greys) for (const y of order.slice(0, n)) for (let x = 12; x < BW - 12; x++) { total++; if (Math.abs(g[y * BW + x] - colour) > 40) content++; }
  const crop = side === "top" ? `crop=iw:ih*${share}:0:0,` : `crop=iw:ih*${share}:0:ih*${(1 - share).toFixed(2)},`;
  const has = content / total >= 0.01;
  const fl = has && !isImage ? flowCrop(crop) : null;
  // A panel holds still between changes; a tall band with flat margins and content is a panel even when a card inside
  // it moves (a scrolling page capture), because no clip of a person or a place keeps one-percent black margins that high.
  const still = fl ? fl.p90 < 0.5 : null;
  return { side, share, colour: Math.round(colour), content: Math.round((content / total) * 1000) / 1000, still, panel: has && (isImage || still || share >= 0.3) };
}
const bandsRead = ["top", "bottom"].map(bandOf).filter(Boolean);
const panelBand = bandsRead.filter((b) => b.panel).sort((a, b) => b.share - a.share)[0] ?? null;
const layout = panelBand ? "split" : "full";
const SPLIT = panelBand ? (panelBand.side === "top" ? panelBand.share : Math.round((1 - panelBand.share) * 100) / 100) : 0.5;
const darkRegion = panelBand?.side ?? null;
const bands = Object.fromEntries(bandsRead.filter((b) => !b.panel).map((b) => [b.side, b.share]));

// Cuts: four frames per second, read in one pass per region. A cut is a jump well above the region's floor between two
// frames a quarter second apart; a moving human changes a few bits in that time, a card swap or a shot change changes many.
// One frame per second was not enough: a head turn at one second looks like a cut. Calibrated 2026-09-04.
const FPS = 4, CUT = 12;
// A letterboxed full frame is read on its picture only: the black bands would hide a cut between two dark clips.
const pictureCrop = bands.top || bands.bottom ? `crop=iw:ih*${(1 - (bands.top ?? 0) - (bands.bottom ?? 0)).toFixed(2)}:0:ih*${(bands.top ?? 0).toFixed(2)},` : "";
function hashSeries(region) {
  const crop = region === "top" ? `crop=iw:ih*${SPLIT}:0:0,` : region === "bottom" ? `crop=iw:ih*${1 - SPLIT}:0:ih*${SPLIT},` : pictureCrop;
  const raw = run(ffmpeg, ["-v", "error", "-i", file, ...(isImage ? ["-frames:v", "1"] : []), "-vf", `${crop}${isImage ? "" : `fps=${FPS},`}scale=9:8:flags=area,format=gray`, "-f", "image2pipe", "-c:v", "rawvideo", "-"], { encoding: "buffer", maxBuffer: 1 << 26 });
  const out = [];
  for (let f = 0; f + 72 <= raw.length; f += 72) { const bits = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) bits.push(raw[f + r * 9 + c] > raw[f + r * 9 + c + 1] ? 1 : 0); out.push(bits); }
  return out;
}
const series = { full: hashSeries("full"), top: hashSeries("top"), bottom: hashSeries("bottom") };
function readCuts(hs) {
  const d = hs.slice(1).map((h, i) => hamming(hs[i], h));
  const sorted = [...d].sort((a, b) => a - b); const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  // The floor is what the region does between cuts: zero for a still panel, 4 to 9 bits for a moving human. A cut stands
  // well above it: at least 12 bits and three times the median plus 6, so a continuous take never reads as cuts.
  const thr = Math.max(CUT, 3 * median + 6);
  const cuts = []; let last = -1;
  d.forEach((x, i) => { const t = Math.round(((i + 1) / FPS) * 100) / 100; if (x >= thr && t - last > 0.6) { cuts.push(t); last = t; } });
  let m = 0; const step = Math.max(1, Math.floor(hs.length / 5)); const sample = hs.filter((_, i) => i % step === 0).slice(0, 6);
  for (let i = 0; i < sample.length; i++) for (let j = i + 1; j < sample.length; j++) m = Math.max(m, hamming(sample[i], sample[j]));
  if (isImage) return { cuts: [], shots: null, kind: "unknown", motion: "unknown", median: null, threshold: null };
  return { cuts, shots: cuts.length + 1, kind: cuts.length ? "cut" : "single", motion: m <= 12 ? "static" : "moving", median, threshold: thr };
}
let whole = readCuts(series.full);
// Handheld or dark footage flips 20 to 35 hash bits every quarter second, so the hash reader cannot see a cut in it (its
// floor climbs past any cut). The frame difference series can: a cut is a spike at least 20 and two and a half times
// the difference around it. Used for a full frame only, and only when the hash floor is that high; a tripod timelapse
// keeps a low hash floor, so its jumps (someone enters) are never read as cuts here. Measured 2026-09-04 on study montages.
const fullFlow = layout === "split" || isImage ? null : flowOf("full");
if (!isImage && layout !== "split" && whole.median >= 16 && fullFlow?.series?.length >= 20) {
  const sr = fullFlow.series, cuts = []; let last = -1;
  for (let i = 1; i < sr.length; i++) {
    const around = sr.slice(Math.max(0, i - 5), i).concat(sr.slice(i + 1, i + 6)).sort((a, b) => a - b); const base = around[Math.floor(around.length / 2)] ?? 0;
    const t = Math.round((i / 10) * 100) / 100;
    if (sr[i] >= 20 && sr[i] >= 2.5 * Math.max(base, 1) && t - last >= 0.4) { cuts.push(t); last = t; }
  }
  whole = { ...whole, cuts, shots: cuts.length + 1, kind: cuts.length ? "cut" : "single", cuts_from: "flow, first six seconds" };
}
const cuts = whole.cuts;
const regions = Object.fromEntries(["top", "bottom"].map((r) => [r, { ...readCuts(series[r]), dark: r === darkRegion }]));

// Flow: the change between consecutive frames at the file's own rate, over the first six seconds, on a 90 by 80 grey
// frame, per region (mean of the absolute difference, 0 to 255). A live take moves smoothly: the largest change stays
// under 10. A timelapse jumps when someone enters or leaves, or the light changes (spikes over 20) and keeps moving between
// the jumps (ninetieth percentile over 3). A card swap over a still panel is a spike over stillness, and it is already a cut.
// A slow timelapse (a ship crossing a calm sea) reads as "moving", the same as a live take; the sheet settles it.
// Calibrated 2026-09-04 on 75 posted split reels: office timelapses 23 to 37, live takes 3 to 9.
function flowOf(region) {
  if (isImage) return null;
  const crop = region === "top" ? `crop=iw:ih*${SPLIT}:0:0,` : region === "bottom" ? `crop=iw:ih*${1 - SPLIT}:0:ih*${SPLIT},` : pictureCrop;
  return flowCrop(crop);
}
function flowCrop(crop) {
  let text = "";
  try { text = run(ffmpeg, ["-nostdin", "-v", "error", "-i", file, "-t", "6", "-vf", `${crop}scale=90:80,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`, "-f", "null", "-"]); } catch { return null; }
  const d = [...text.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1])).slice(1);
  if (!d.length) return null;
  const sorted = [...d].sort((a, b) => a - b); const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const r2 = (x) => Math.round(x * 100) / 100;
  // The series: the same measure at ten frames a second (frames a tenth of a second apart), the way sort.mjs reads a
  // file the buyer hands over, so one take gives the same shape in both places whatever the file's own rate.
  let series = [];
  try { const t10 = run(ffmpeg, ["-nostdin", "-v", "error", "-i", file, "-t", "6", "-vf", `${crop}fps=10,scale=90:80,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`, "-f", "null", "-"]); series = [...t10.matchAll(/YAVG=([\d.]+)/g)].map((m) => r2(Number(m[1]))).slice(1, 61); } catch {}
  return { mean: r2(d.reduce((a, b) => a + b, 0) / d.length), p90: r2(q(0.9)), max: r2(sorted[sorted.length - 1]), spikes: d.filter((x) => x > 15).length, frames: d.length, series };
}
let panel = darkRegion;
if (layout === "split") {
  for (const r of ["top", "bottom"]) {
    const fl = flowOf(r); regions[r].flow = fl;
    if (fl && regions[r].kind === "single" && fl.max >= 20 && fl.p90 >= 3) regions[r].motion = "timelapse";
  }
}

const textLikely = frames.filter((f) => f.text_band.mean >= 16 && f.text_band.ratio >= 1.4);
const position = textLikely.length ? (() => { const at = textLikely.reduce((a, f) => a + f.text_band.at, 0) / textLikely.length; return at < 0.38 ? "upper" : at < 0.62 ? "middle" : "lower"; })() : null;

const sheet = join(outDir, `${id}.jpg`);
const select = stops.map((t) => `eq(n\\,${Math.round(t * (fd ? fn / fd : fn))})`).join("+");
if (isImage) { try { run(ffmpeg, ["-y", "-v", "error", "-i", file, "-vf", "scale=270:-2", "-q:v", "4", sheet]); } catch {} }
else try { run(ffmpeg, ["-y", "-v", "error", "-i", file, "-vf", `select='${select}',scale=270:-2,tile=5x1:padding=4:color=black`, "-frames:v", "1", "-q:v", "4", sheet]); } catch { run(ffmpeg, ["-y", "-v", "error", "-i", file, "-vf", `fps=1/${Math.max(duration / 5, 0.2)},scale=270:-2,tile=5x1:padding=4:color=black`, "-frames:v", "1", "-q:v", "4", sheet]); }

const result = {
  file, id, duration: Math.round(duration * 100) / 100, width: s.width ?? null, height: s.height ?? null, fps: fd ? Math.round((fn / fd) * 100) / 100 : fn,
  source: isImage ? "image" : "video",
  frames, cuts, shots: whole.shots, kind: whole.kind, motion: isImage ? "unknown" : maxPair <= 12 ? "static" : "moving",
  text: { likely: textLikely.length >= 2, position, frames_with_text: textLikely.length },
  layout, split_at: layout === "split" ? SPLIT : null, panel: layout === "split" ? panel : null, panel_colour: panelBand?.colour ?? null, bands, regions, flow: fullFlow, sheet,
};
if (args.includes("--debug")) result.debug = { bands: bandsRead, distances: Object.fromEntries(Object.entries(series).map(([k, hs]) => [k, hs.slice(1).map((h, i) => hamming(hs[i], h))])), thresholds: { full: whole.threshold, top: regions.top.threshold, bottom: regions.bottom.threshold } };
writeJson(join(outDir, `${id}.json`), result);
console.log(JSON.stringify({ id, duration: result.duration, layout, split_at: result.split_at, kind: result.kind, shots: result.shots, motion: result.motion, top: `${regions.top.kind} ${regions.top.shots} ${regions.top.motion}${regions.top.dark ? " dark" : ""}`, bottom: `${regions.bottom.kind} ${regions.bottom.shots} ${regions.bottom.motion}${regions.bottom.dark ? " dark" : ""}`, text: result.text, sheet }));
