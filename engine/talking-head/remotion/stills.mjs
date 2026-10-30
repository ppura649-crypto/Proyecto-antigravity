// Many stills from ONE bundle. Usage: node remotion/stills.mjs <project> f1,f2,f3 <outdir>
import { bundle } from "@remotion/bundler";
import { renderStill, getCompositions } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(process.argv[2]);
const frames = process.argv[3].split(",").map((n) => parseInt(n, 10));
const outDir = path.resolve(process.argv[4] ?? path.join(projectDir, "checks"));
fs.mkdirSync(outDir, { recursive: true });
const slug = path.basename(projectDir);
const captions = JSON.parse(fs.readFileSync(path.join(projectDir, "captions.json"), "utf-8"));
const videoName = `${slug}-master.mp4`;
const pubDir = path.join(__dirname, "public");
fs.mkdirSync(pubDir, { recursive: true });
const proxy = path.join(projectDir, "master-proxy.mp4");
// KEYFRAMES_PROXY=1: builders check cards against a 360 px proxy so six parallel bundles stay small (2026-09-10)
const src = (process.env.KEYFRAMES_PROXY || process.env.CUTROOM_PROXY) && fs.existsSync(proxy) ? proxy : path.join(projectDir, "master.mp4"); // the second name: legacy alias
const dst = path.join(pubDir, videoName);
if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) {
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.copyFileSync(src, dst);
}
let visuals = null;
// KEYFRAMES_VISUALS=<file>: a builder checks its own events file before the merge (reference edit J)
const vp = (process.env.CUTROOM_VISUALS || process.env.KEYFRAMES_VISUALS) ? path.resolve(process.env.CUTROOM_VISUALS || process.env.KEYFRAMES_VISUALS) : path.join(projectDir, "visuals.json"); // CUTROOM_VISUALS is the legacy alias of KEYFRAMES_VISUALS
if (fs.existsSync(vp)) {
  visuals = JSON.parse(fs.readFileSync(vp, "utf-8"));
  const meta = JSON.parse(fs.readFileSync(path.join(projectDir, "assets", "meta.json"), "utf-8"));
  const assetDir = path.join(pubDir, `${slug}-assets`);
  fs.mkdirSync(assetDir, { recursive: true });
  for (const f of fs.readdirSync(path.join(projectDir, "assets")))
    if (/\.(png|jpg|mp4)$/.test(f)) fs.copyFileSync(path.join(projectDir, "assets", f), path.join(assetDir, f));
  for (const ev of visuals.events) {
    for (const pg of ev.pages ?? []) pg.src = `${slug}-assets/${pg.src}`;
    if (Array.isArray(ev.data?.assets)) ev.data.assets = ev.data.assets.map((a) => `${slug}-assets/${a}`);
    for (const c of ev.data?.timeline?.clips ?? []) c.thumb = `${slug}-assets/${c.thumb}`;
    if (ev.data?.frames) ev.data.frames = ev.data.frames.map((f) => `${slug}-assets/${f}`);
    if (ev.data?.frame) ev.data.frame = `${slug}-assets/${ev.data.frame}`;
    for (const pk of ev.data?.packs ?? []) pk.imgs = (pk.imgs ?? []).map((x) => `${slug}-assets/${x}`);
    if (!ev.asset) continue;
    const name = ev.asset.replace(/\.(png|jpg|mp4)$/, "");
    const m = meta[name];
    if (m) { ev.assetW = m.w; ev.assetH = m.h; }
    ev.asset = `${slug}-assets/${ev.asset}`;
    for (const sw of ev.sweeps ?? []) {   // same as render.mjs (2026-09-05: stills never showed a mark sweep)
      if (sw.mark) { const mk = m?.marks[sw.mark]; if (!mk) throw new Error(`no mark ${sw.mark} in ${name}`); sw.y = mk.y; sw.h = mk.h; }
    }
  }
}
for (const pg of captions.pages) for (const lg of pg.logos ?? []) if (!lg.src.includes("/")) lg.src = `${slug}-assets/${lg.src}`;
const props = { video: videoName, pages: captions.pages, style: captions.style, durationMs: captions.durationMs, visuals };
const localChrome = path.join(__dirname, "../../stack-reels/.chrome/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const browserExecutable = fs.existsSync(localChrome) ? localChrome : undefined;
async function main() {
  const serveUrl = await bundle({ entryPoint: path.join(__dirname, "src/index.ts"), webpackOverride: (c) => c, enableCaching: !process.env.REMOTION_NO_CACHE });
  const comps = await getCompositions(serveUrl, { inputProps: props, browserExecutable });
  const composition = comps.find((c) => c.id === "CaptionReel");
  for (const f of frames) {
    const out = path.join(outDir, `f${String(f).padStart(4, "0")}.png`);
    await renderStill({ composition, serveUrl, output: out, inputProps: props, frame: f, browserExecutable });
    console.log("still", out);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
