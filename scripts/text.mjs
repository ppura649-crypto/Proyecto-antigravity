#!/usr/bin/env node
import { readingPosts } from './reading-policy.mjs';
// text.mjs <post id> | all [--out context/text] [--force] [--min 70]
// Contract: reads the on-screen text of a post, so the words inside the video are known row by row without asking
//   anyone. Takes the panel zone from context/structure/<id>.json (the video at one second and at the middle, or the
//   thumbnail when Instagram kept the file), upscales it twice and runs tesseract.js (English, cached under
//   node_modules/.cache/tesseract, downloaded once). Keeps the rows tesseract is at least 70 percent sure of, in
//   reading order, and writes context/text/<id>.json:
//   { post, source: "video" | "image", panel, sizes: 1 | 2, confidence, completeness, rows: [ { text, chars, words, size: "big" | "small" | "passing", y, y_rel, confidence, frames } ],
//     big: [texts], small: [texts], passing: [texts], read_at }
//   Three frames are read (0.6 s, 2 s, the middle); a row on two of them is the post's text, a row on one is "passing"
//   (a caption word, a card title, a scene) and stays out of big and small. A full frame is read in its text band only.
//   y_rel is the row's top as a share of the panel's height, so textsystem.mjs can keep the rows of the band a format
//   uses (the foot of the panel for a line under cards, the head for a stack headline) and drop a card's own title.
//   A post with no frame to read (no video file and no usable thumbnail) still gets a file, with `unread` saying why,
//   no rows and confidence 0. It is excluded from every quote and every budget, and it stops the post looking unread
//   forever to anything that compares a reading against what it was read from.
//   size is read from the heights themselves: they are split only where two groups stand apart (a ratio of 1.3 or more
//   between neighbours), so a format set in one size comes back sizes: 1 with every row big, and one set in two sizes
//   comes back sizes: 2 with the line of a three-zone reel or the headline of a stack reel big and the facts small. "Al" is corrected to "AI", the one slip
//   the face makes on these panels. `all` reads every post in context/posts.json that has no reading yet (--force to
//   redo them). Prints one line per post. A full frame (no panel) is read whole. Exits 1 when tesseract.js is missing.
import { P, readJson, writeJson, now, fail, ffbin, run } from "./_lib.mjs";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--out");
if (!target) fail("usage: text.mjs <post id> | all [--out context/text] [--force]");
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : P("context", "text");
mkdirSync(outDir, { recursive: true });
const ffmpeg = ffbin("ffmpeg");
if (!ffmpeg) fail("ffmpeg not found; run: node scripts/doctor.mjs");
let createWorker;
try { ({ createWorker } = await import("tesseract.js")); } catch { fail("tesseract.js not installed; run: npm install"); }
const posts = (readingPosts() ?? [])
  // Best first. The reading of an account is always its top posts, so a run that is stopped halfway has still
  // read the ones anything downstream cares about.
  .slice().sort((a, b) => (b?.metrics?.reach ?? 0) - (a?.metrics?.reach ?? 0));
const ids = target === "all" ? posts.filter((p) => args.includes("--force") || !existsSync(join(outDir, `${p.id}.json`))).map((p) => p.id) : [target];
if (!ids.length) { console.log("text: nothing to read"); process.exit(0); }

const worker = await createWorker("eng", 1, { cachePath: P("node_modules", ".cache", "tesseract"), logger: () => {} });
const tmp = join(outDir, ".frames"); mkdirSync(tmp, { recursive: true });
// Trailing junk is the sticker or a stray mark read as a short token: drop trailing tokens of up to two letters
// wrapped in symbols ("«a.", "cs.", "«x"); a number or a real short word ("5", "go", "AI") stays.
const clean = (t) => { let x = t.replace(/\s+/g, " ").replace(/\bAl\b/g, "AI").trim(); for (;;) { const y = x.replace(/\s+[^A-Za-z0-9]*(?:[a-z]{1,2})?[^A-Za-z0-9]*$/, ""); if (y === x || !/\s/.test(x) || /\b(AI|go|to|on|of|in|is|it|up|no|vs)$/i.test(x)) break; x = y; } return x; };
const MIN = args.includes("--min") ? Number(args[args.indexOf("--min") + 1]) || 70 : 70;
// A row made of real words (two letters or more, or a number) is trusted a little lower than the floor: a two-row
// headline sometimes reads at 60 where the icon overlaps it, while the noise from a card area is symbols and fragments.
const wordy = (t) => { const toks = t.split(/\s+/).filter(Boolean); return toks.length ? toks.filter((x) => /^[A-Za-z][A-Za-z'-]+[.,:;!?]?$|^[$#]?\d[\d.,%kKmMxX+-]*[.,:;!?]?$|^(a|I|=)$/.test(x)).length / toks.length : 0; };

const ffprobe = ffbin("ffprobe");
const heightOf = (file) => { try { return Number(run(ffprobe ?? ffmpeg, ffprobe ? ["-v", "error", "-show_entries", "stream=height", "-of", "csv=p=0", file] : ["-i", file]).trim().split("\n")[0]) || 0; } catch { return 0; } };
async function readImage(file) {
  const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
  const H = heightOf(file) || 1;
  const lines = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
  const rows = lines.map((l) => ({ text: clean(l.text), confidence: Math.round(l.confidence), y: l.bbox.y0, h: l.bbox.y1 - l.bbox.y0, y_rel: Math.round((l.bbox.y0 / H) * 100) / 100 })).filter((r) => (r.confidence >= MIN || (r.confidence >= MIN - 15 && wordy(r.text) >= 0.8)) && r.text.replace(/[^A-Za-z0-9]/g, "").length >= 3);
  return rows;
}
// Two readings of one row differ by a slipped letter, so a row is the same when the shorter normalised text sits
// inside the longer one or the two differ in fewer than a fifth of their characters.
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
function editDistance(a, b) { const m = a.length, n = b.length; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
const same = (a, b) => { const x = norm(a), y = norm(b); if (!x || !y) return false; if (x.includes(y) || y.includes(x)) return true; return editDistance(x, y) <= Math.max(x.length, y.length) * 0.2; };
// The same row read on two frames, when the reader read it differently on each. On a black panel the two readings
// match; over a photograph they often do not ("Every strategy consultant learns" came back as "Every stra It"), and
// treating those as two rows seen once each throws the real hook away as a passing caption and keeps the worst
// reading. So across frames a row is matched by where it sits, with a loose gate on the words: the longest stretch
// of characters the two share has to be a third of the shorter reading. Two different lines at one height share far
// less than that, so a card that swaps between frames still reads as two rows.
function overlap(a, b) {
  const x = norm(a), y = norm(b); if (!x || !y) return 0;
  let best = 0, prev = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) { const cur = new Array(y.length + 1).fill(0); for (let j = 1; j <= y.length; j++) if (x[i - 1] === y[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) best = cur[j]; } prev = cur; }
  return best / Math.min(x.length, y.length);
}
const sameRow = (a, b) => Math.abs(a.y_rel - b.y_rel) < 0.045 && (same(a.text, b.text) || overlap(a.text, b.text) >= 0.34);
function frameOf(id, t, structure) {
  const video = P("context", "posts", `${id}.mp4`), image = P("context", "posts", `${id}.jpg`);
  const src = existsSync(video) ? video : existsSync(image) ? image : null; if (!src) return null;
  const out = join(tmp, `${id}-${String(t).replace(".", "_")}.png`), bright = out.replace(/\.png$/, "-bright.png");
  const split = structure?.split_at, panel = structure?.panel ?? (structure?.regions?.top?.dark ? "top" : "bottom");
  // A full frame is read in the band where its text sits (the strongest text band of the five sampled frames, plus
  // and minus a quarter of the height), so the footage behind it (a whiteboard, a page, code) is not read as lines.
  const textAt = (structure?.frames ?? []).map((f) => f.text_band).filter(Boolean).sort((a, b) => b.mean - a.mean)[0]?.at;
  const crop = structure?.layout === "split" && split ? (panel === "top" ? `crop=iw:ih*${split.toFixed(3)}:0:0,` : `crop=iw:ih*${split.toFixed(3)}:0:ih*${(1 - split).toFixed(3)},`)
    : structure?.text?.likely && textAt !== undefined ? `crop=iw:ih*0.5:0:ih*${Math.max(0, Math.min(0.5, textAt - 0.25)).toFixed(3)},` : "";
  // Two readings of the same frame: the plain grey frame (dark text on a light card, anything ordinary) and a bright
  // mask where only near-white pixels stay, as black on white (white text with a dark outline over footage or a black
  // panel, the Instagram look, which the plain reading misspells). Rows from both are merged.
  try { run(ffmpeg, ["-nostdin", "-y", "-v", "error", ...(src === video ? ["-ss", String(t)] : []), "-i", src, "-frames:v", "1", "-vf", `${crop}scale=iw*2:-2`, out]); } catch { return null; }
  try { run(ffmpeg, ["-nostdin", "-y", "-v", "error", ...(src === video ? ["-ss", String(t)] : []), "-i", src, "-frames:v", "1", "-vf", `${crop}format=gray,lutyuv=y='if(gt(val\\,190)\\,0\\,255)',scale=iw*2:-2`, bright]); } catch {}
  return { file: out, bright: existsSync(bright) ? bright : null, source: src === video ? "video" : "image", panel: crop ? panel : null };
}

// One size on the frame, or two. A read row's height moves by about a fifth with ascenders and descenders alone, so a
// row is not small because it measured shorter than its neighbour: it is small only when the heights fall into two
// groups with a real gap between them. A block set in one size, a hook block in the Instagram text look, is all line,
// and calling its shorter rows small invents a headline that was never on the frame and shrinks the budget a version
// is written to. Returns the cut and how many sizes were seen, which textsystem.mjs reads before it names a line.
function sizeSplit(heights) {
  const h = heights.filter((x) => x > 0).sort((a, b) => a - b);
  if (h.length < 3) return { cut: 0, sizes: 1 };
  let best = 1, at = -1;
  for (let i = 1; i < h.length; i++) { const r = h[i] / h[i - 1]; if (r > best) { best = r; at = i; } }
  return best >= 1.3 ? { cut: h[at], sizes: 2 } : { cut: 0, sizes: 1 };
}

for (const id of ids) {
  const s = readJson(P("context", "structure", `${id}.json`), null);
  const mid = Math.max(2.5, (s?.duration ?? 8) / 2);
  // Three frames of a video: inside the first seconds twice (a hook shown for three seconds is on both) and the middle.
  // A row is the post's text when it is on at least two of them; a row on one frame only (a word of the captions, a
  // card's own title, a passing scene) is kept in rows with frames: 1 and left out of big and small.
  const frames = [frameOf(id, 0.6, s), ...(s?.source === "video" ? [frameOf(id, 2.0, s), frameOf(id, mid, s)] : [])].filter(Boolean);
  // A reading that could not be made is still a reading, and it is written down. Saying nothing means the post looks
  // unread forever: the next run reads it again, and anything that compares a reading against the frame it came from
  // reports it as behind on every check, which turns the whole signal into noise nobody looks at.
  if (!frames.length) {
    console.log(`  ${id}: no frame to read`);
    writeJson(join(outDir, `${id}.json`), { post: id, source: s?.source ?? null, unread: "no frame to read", panel: null, sizes: 0, confidence: 0, completeness: 0, rows: [], big: [], small: [], passing: [], read_at: now() });
    continue;
  }
  const merged = [];
  for (const f of frames) {
    const seen = [];
    for (const file of [f.file, f.bright].filter(Boolean)) for (const r of await readImage(file)) { const j = seen.findIndex((m) => same(m.text, r.text) && Math.abs(m.y_rel - r.y_rel) < 0.08); if (j < 0) seen.push(r); else if (r.confidence > seen[j].confidence) seen[j] = r; }
    for (const r of seen) { const i = merged.findIndex((m) => sameRow(m, r)); if (i < 0) merged.push({ ...r, frames: 1 }); else { merged[i].frames++; if (r.confidence > merged[i].confidence || (r.confidence === merged[i].confidence && r.text.length > merged[i].text.length)) merged[i] = { ...r, frames: merged[i].frames }; } }
  }
  const need = Math.min(2, frames.length);
  const rows = merged.sort((a, b) => a.y - b.y);
  const kept = rows.filter((r) => r.frames >= need);
  const split = sizeSplit(kept.map((r) => r.h));
  const out = rows.map((r) => ({ text: r.text, chars: r.text.length, words: r.text.split(/\s+/).filter(Boolean).length, size: r.frames < need ? "passing" : split.sizes === 1 || r.h >= split.cut ? "big" : "small", y: Math.round(r.y), y_rel: r.y_rel, confidence: r.confidence, frames: r.frames }));
  // How well this post read. A row over a photograph comes back with holes in it, and a holed row counted as a clean
  // one puts a line nobody wrote in front of the buyer. The confidence travels with the reading so textsystem.mjs can
  // measure a budget from a rough read and still refuse to quote it as a line that worked.
  const solid = out.filter((r) => r.size !== "passing"), dropped = out.filter((r) => r.size === "passing");
  const confidence = solid.length ? Math.round(solid.reduce((a, r) => a + r.confidence, 0) / solid.length) : 0;
  // Confidence says how sure the reader is of the characters it kept. It says nothing about the rows it threw away,
  // and a post whose block was read once out of five comes back sure of that one row. Completeness is the other half:
  // the share of rows that survived the two-frames rule. A block read whole is near 1; a shredded one is near a half,
  // and its row count is not a budget however certain its surviving row looks.
  const completeness = out.length ? Math.round((solid.length / (solid.length + dropped.length)) * 100) / 100 : 0;
  writeJson(join(outDir, `${id}.json`), { post: id, source: frames[0].source, panel: frames[0].panel, sizes: split.sizes, confidence, completeness, rows: out, big: out.filter((r) => r.size === "big").map((r) => r.text), small: out.filter((r) => r.size === "small").map((r) => r.text), passing: out.filter((r) => r.size === "passing").map((r) => r.text), read_at: now() });
  for (const f of frames) { rmSync(f.file, { force: true }); if (f.bright) rmSync(f.bright, { force: true }); } // the upscaled frames are big; keeping them for a whole run filled a disk
  console.log(`  ${id}: ${out.filter((r) => r.size === "big").map((r) => r.text).join(" / ") || "(no big row)"}${out.some((r) => r.size === "small") ? ` + ${out.filter((r) => r.size === "small").length} small` : ""}`);
}
await worker.terminate();
rmSync(tmp, { recursive: true, force: true });
console.log(`text: ${ids.length} post${ids.length === 1 ? "" : "s"} read -> ${outDir.replace(P() + "/", "")}/`);
