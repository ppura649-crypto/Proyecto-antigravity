// Render a reel, or look at it first.
//   node render.mjs <slug>                          -> output/YYYY-MM-DD/NN-<slug>.mp4
//   node render.mjs <slug> --stills 1.2,3.45,9      -> reels/<slug>/stills/t_001.20.png ... (seconds)
//   node render.mjs <slug> --guides --stills 3      -> with the bands and Instagram's zones drawn on
//   node render.mjs <slug> --from 4 --to 9          -> only that stretch
//   node render.mjs <slug> --no-caption             -> without the top word caption (format 1 only; default keeps it)
// A reel whose reel.json says "format": 2 renders on the format-2 engine (src/v2, composition FullVisual2).
// Run with the sandbox disabled (Remotion's Chrome).
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const slug = args[0];
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const reelDir = path.join(dir, "reels", slug ?? "");
if (!slug || !fs.existsSync(path.join(reelDir, "words.json"))) {
  console.error("usage: node render.mjs <slug> [--stills s,s,s] [--guides] [--from s --to s] [--out path]\n(needs reels/<slug>/words.json: run scripts/align.py <slug> first)");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.join(reelDir, "words.json"), "utf-8"));
const configPath = path.join(reelDir, "reel.json");
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf-8")) : {};

// the bundler copies public/ and does not follow symlinks: copy the voice in
const voice = fs.readdirSync(reelDir).find((f) => /^voice\.(mp3|wav|m4a)$/.test(f));
const pub = path.join(dir, "public", slug);
fs.mkdirSync(pub, { recursive: true });
if (voice) fs.copyFileSync(path.join(reelDir, voice), path.join(pub, voice));
for (const f of fs.existsSync(path.join(reelDir, "assets")) ? fs.readdirSync(path.join(reelDir, "assets")) : [])
  fs.copyFileSync(path.join(reelDir, "assets", f), path.join(pub, f));

// format 2 (reel.json "format": 2) renders on src/v2 (FullVisual2) with its character and the voice's loudness
const v2 = false;   // format 2 does not ship in this folder
const inputProps = { slug, data, config, audio: voice ? `${slug}/${voice}` : null, guides: args.includes("--guides"), noCaption: args.includes("--no-caption"), };
const browserExecutable = process.env.CHROME || undefined;   // Remotion fetches its own browser for this system

function outputPath() {
  if (opt("--out")) return path.resolve(opt("--out"));
  const day = new Date().toLocaleDateString("en-CA");
  const outDir = path.join(dir, "output", day);
  fs.mkdirSync(outDir, { recursive: true });
  const mine = fs.readdirSync(outDir).find((f) => f.replace(/^\d+-/, "") === `${slug}.mp4`);
  if (mine) return path.join(outDir, mine);
  const n = new Set(fs.readdirSync(outDir).map((f) => f.slice(0, 2))).size + 1;
  return path.join(outDir, `${String(n).padStart(2, "0")}-${slug}.mp4`);
}

const serveUrl = await bundle({ entryPoint: path.join(dir, "src/index.ts"), publicDir: path.join(dir, "public") });
const composition = await selectComposition({ serveUrl, id: v2 ? "FullVisual2" : "FullVisual", inputProps, browserExecutable });
const fps = composition.fps;

if (opt("--stills")) {
  const out = path.join(reelDir, "stills");
  fs.mkdirSync(out, { recursive: true });
  for (const s of opt("--stills").split(",").map(Number)) {
    const output = path.join(out, `t_${s.toFixed(2).padStart(6, "0")}${inputProps.guides ? "_guides" : ""}.png`);
    await renderStill({ serveUrl, composition, inputProps, browserExecutable, frame: Math.min(composition.durationInFrames - 1, Math.round(s * fps)), output });
    console.log(output);
  }
} else {
  const outputLocation = outputPath();
  const frameRange = opt("--from") || opt("--to")
    ? [Math.round(Number(opt("--from") ?? 0) * fps), Math.min(composition.durationInFrames - 1, Math.round(Number(opt("--to") ?? 1e9) * fps))]
    : undefined;
  await renderMedia({
    serveUrl, composition, inputProps, browserExecutable, outputLocation, frameRange,
    codec: "h264", crf: 16, pixelFormat: "yuv420p", x264Preset: "slow",
    ...(opt("--concurrency") ? { concurrency: Number(opt("--concurrency")) } : {}),
    onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%`),
  });
  console.log(`\n${outputLocation}`);
}
