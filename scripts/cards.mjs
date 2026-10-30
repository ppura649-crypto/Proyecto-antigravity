#!/usr/bin/env node
// cards.mjs <post id> [--out context/cards]
// Contract: lifts the cards out of one of the buyer's own posted videos, so nobody is asked for images that are already
//   on screen. Reads context/structure/<id>.json for the panel side, the split and the cuts of the panel zone, takes one
//   frame every half second and a third of a second after each cut, crops the card area (the panel minus the line band at
//   its foot), drops frames that are black or that repeat a card already lifted, and writes context/cards/<id>/<n>.jpg plus
//   context/cards/<id>/cards.json ({ post, count, panel, split, edge, area: { x, y, w, h }, cards: [ { n, file,
//   at_seconds, width, height } ] }). area is the card box as shares of the frame, measured on the post: a version that
//   draws the crop back into the same box puts every card exactly where the post had it. The images are
//   the posted rendering of the cards (720 wide on most accounts), good enough for a version that keeps the line and
//   swaps the take or the sound; a version with new cards captures pages itself with browser.mjs. Exits 1 when the post
//   has no video file or no structure reading.
import { P, readJson, writeJson, fail, ffbin, run } from "./_lib.mjs";
import { mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
if (!id) fail("usage: cards.mjs <post id> [--out context/cards]");
const outRoot = args.includes("--out") ? args[args.indexOf("--out") + 1] : P("context", "cards");
const file = P("context", "posts", `${id}.mp4`);
if (!existsSync(file)) fail(`no video file for ${id}; Instagram kept it (a library sound) or profile has not run`);
const s = readJson(P("context", "structure", `${id}.json`), null);
if (!s) fail(`no structure reading for ${id}; run: node scripts/structure.mjs context/posts/${id}.mp4`);
if (s.layout !== "split") fail(`${id} is not a split frame; there is no panel to lift cards from`);
const ffmpeg = ffbin("ffmpeg");
if (!ffmpeg) fail("ffmpeg not found; run: node scripts/doctor.mjs");

const panel = s.panel ?? (s.regions.top.dark ? "top" : "bottom"), split = s.split_at;
const region = s.regions[panel];
// The card area is measured, never guessed: measure.mjs reads where the panel ends and where the line begins on the
// post's own frames, and the crop runs from a small margin at the panel's outer edge down to a hair above the line.
// A guess cuts the foot off every card, and a card cut at the foot cannot be put back where the post had it.
const geo = (() => {
  const at = [0.8, 1.5, 3, 5].filter((t) => t < (s.duration ?? 8) - 0.3).join(",") || "1.5";
  let outp = "";
  try { outp = run(process.execPath, [new URL("./measure.mjs", import.meta.url).pathname, "panel", file, "--at", at], { encoding: "utf8", maxBuffer: 1 << 24 }); }
  catch (e) { outp = e.stdout?.toString() ?? ""; }
  let j = null; try { j = JSON.parse(outp); } catch { return null; }
  // The reader said this frame holds a panel and the instrument says it does not. One of the two is wrong, and lifting
  // a card out of a guessed rectangle would hide which, so the disagreement stops here.
  if (j && j.ok === false) fail(`the structure reader called this a panel format but the frame reads as ${j.shape}: ${j.why}. Look at it with see.mjs before lifting anything out of it.`);
  return j;
})();
const edge = geo?.edge ?? (panel === "top" ? split : 1 - split);
const lineTop = geo?.line?.top ?? null;
const outer = panel === "top" ? split * 0.04 : 1 - split + split * 0.04;
const area = panel === "top"
  ? { x: 0.04, w: 0.92, y: outer, h: (lineTop ? lineTop - 0.006 : split * 0.82) - outer }
  : { x: 0.04, w: 0.92, y: lineTop ? lineTop + 0.03 : 1 - split + split * 0.18, h: 0 };
if (panel === "bottom") area.h = 1 - 0.02 - area.y;
const crop = `crop=iw*${area.w.toFixed(4)}:ih*${area.h.toFixed(4)}:iw*${area.x.toFixed(4)}:ih*${area.y.toFixed(4)}`;
// Every half second, plus a third of a second after each detected cut: a card that appears between two cuts the
// reader missed is still caught, and the hash rule below drops the repeats.
const times = [...new Set([...Array.from({ length: Math.floor(((s.duration ?? 10) - 0.5) / 0.5) }, (_, i) => 0.4 + i * 0.5), ...(region.cuts ?? []).map((t) => Math.round((t + 0.35) * 100) / 100)])].sort((a, b) => a - b).filter((t) => t < (s.duration ?? 1e9) - 0.1);

const dir = join(outRoot, id); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const dhash = (t) => { const raw = run(ffmpeg, ["-nostdin", "-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", `${crop},scale=9:8:flags=area,format=gray`, "-f", "image2pipe", "-c:v", "rawvideo", "-"], { encoding: "buffer" }); const bits = []; let lo = 255, hi = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) { const v = raw[r * 9 + c]; if (v < lo) lo = v; if (v > hi) hi = v; if (c < 8) bits.push(v > raw[r * 9 + c + 1] ? 1 : 0); } return { bits, range: hi - lo }; };
const hamming = (a, b) => a.reduce((n, x, i) => n + (x !== b[i] ? 1 : 0), 0);
const cards = []; const kept = [];
for (const t of times) {
  let hsh; try { hsh = dhash(t); } catch { continue; }
  if (hsh.range < 12) continue;                      // flat black: no card on screen yet (a dark card still has contrast)
  if (kept.some((k) => hamming(k, hsh.bits) <= 8)) continue; // a card already lifted
  const n = cards.length + 1, out = join(dir, `${n}.jpg`);
  try { run(ffmpeg, ["-nostdin", "-y", "-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", crop, "-q:v", "2", out]); } catch { continue; }
  const probe = run(ffbin("ffprobe") ?? ffmpeg, ffbin("ffprobe") ? ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out] : ["-i", out]).trim().split(",");
  cards.push({ n, file: `${dir.replace(P() + "/", "")}/${n}.jpg`, at_seconds: Math.round(t * 100) / 100, width: Number(probe[0]) || null, height: Number(probe[1]) || null });
  kept.push(hsh.bits);
}
writeJson(join(dir, "cards.json"), { post: id, count: cards.length, panel, split, edge, area, cards });
console.log(`cards: ${cards.length} lifted from ${id} at ${cards.map((c) => c.at_seconds).join(", ")} s -> ${dir.replace(P() + "/", "")}/`);
if (!cards.length) process.exit(1);
