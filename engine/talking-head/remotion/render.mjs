// Render Creator Format 1 captions over a project's mastered spine.
// Usage: node render.mjs <project_dir> [--still --frame=N] [--out path]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, getCompositions } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(process.argv[2] ?? "");
if (!projectDir || !fs.existsSync(path.join(projectDir, "captions.json"))) {
  console.error("usage: node render.mjs <project_dir> (needs captions.json)");
  process.exit(1);
}
const slug = path.basename(projectDir);
const captions = JSON.parse(fs.readFileSync(path.join(projectDir, "captions.json"), "utf-8"));

// expose the project's mastered video via public/ (bundler copies public files)
const videoName = `${slug}-master.mp4`;
const pubDir = path.join(__dirname, "public");
fs.mkdirSync(pubDir, { recursive: true });
const src = path.join(projectDir, "master.mp4");
const dst = path.join(pubDir, videoName);
const stale =
  !fs.existsSync(dst) ||
  fs.lstatSync(dst).isSymbolicLink() ||
  fs.statSync(dst).size !== fs.statSync(src).size ||
  fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs;
if (stale) {
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.copyFileSync(src, dst); // bundler won't follow symlinks in public/
}

// optional overlay layer: visuals.json + assets/ (shot by scripts/shoot_assets.mjs)
let visuals = null;
// KEYFRAMES_VISUALS=<file>: render another events file (hook variants share one body, keyframes-v1)
const visualsPath = process.env.KEYFRAMES_VISUALS ? path.resolve(process.env.KEYFRAMES_VISUALS) : path.join(projectDir, "visuals.json");
if (fs.existsSync(visualsPath)) {
  visuals = JSON.parse(fs.readFileSync(visualsPath, "utf-8"));
  const meta = JSON.parse(
    fs.readFileSync(path.join(projectDir, "assets", "meta.json"), "utf-8")
  );
  const assetDir = path.join(pubDir, `${slug}-assets`);
  fs.mkdirSync(assetDir, { recursive: true });
  for (const f of fs.readdirSync(path.join(projectDir, "assets"))) {
    if (/\.(png|jpg|mp4)$/.test(f))
      fs.copyFileSync(path.join(projectDir, "assets", f), path.join(assetDir, f));
  }
  for (const ev of visuals.events) {
    for (const pg of ev.pages ?? []) pg.src = `${slug}-assets/${pg.src}`;
    if (Array.isArray(ev.data?.assets)) ev.data.assets = ev.data.assets.map((a) => `${slug}-assets/${a}`);
    for (const c of ev.data?.timeline?.clips ?? []) c.thumb = `${slug}-assets/${c.thumb}`;
    if (ev.data?.frames) ev.data.frames = ev.data.frames.map((f) => `${slug}-assets/${f}`);
    if (ev.data?.frame) ev.data.frame = `${slug}-assets/${ev.data.frame}`;
    for (const pk of ev.data?.packs ?? []) pk.imgs = (pk.imgs ?? []).map((x) => `${slug}-assets/${x}`);
    for (const it of ev.items ?? []) it.src = `${slug}-assets/${it.src}`;
    if (!ev.asset) continue;
    const name = ev.asset.replace(/\.(png|jpg|mp4)$/, "");
    const m = meta[name];
    if (!m && !ev.assetW && (ev.kind === "shot" || ev.kind === "float"))
      throw new Error(`no meta for asset ${ev.asset}`);
    if (m) {
      ev.assetW = m.w;
      ev.assetH = m.h;
    }
    ev.asset = `${slug}-assets/${ev.asset}`;
    if (ev.asset2) {
      const m2 = meta[ev.asset2.replace(/\.(png|jpg|mp4)$/, "")];
      if (!m2 && !ev.asset2W) throw new Error(`no meta for asset2 ${ev.asset2}`);
      if (m2) {
        ev.asset2W = m2.w;
        ev.asset2H = m2.h;
      }
      ev.asset2 = `${slug}-assets/${ev.asset2}`;
    }
    for (const sw of ev.sweeps ?? []) {
      if (sw.mark) {
        const mk = m?.marks[sw.mark];
        if (!mk) throw new Error(`no mark ${sw.mark} in ${name}`);
        sw.y = mk.y;
        sw.h = mk.h;
      }
    }
  }
}

// GATES (2026-09-05). Ideas before pixels: a visual layer renders only from an approved plan.
// Approved layers are locked: a render that would silently carry a changed hook or captions
// stops here instead of reaching them. Both are skipped for a single diagnostic still.
import { python } from "../scripts/_run.mjs";   // the folder's Python runner: no python3 needed on the PATH
const isStillEarly = process.argv.includes("--still");
if (!isStillEarly && !(process.env.KEYFRAMES_SKIP_GATES || process.env.CUTROOM_SKIP_GATES)) { // the second name: legacy alias
  const scripts = path.join(__dirname, "../scripts");
  if (visuals) {
    const planPath = path.join(projectDir, "visual-plan.md");
    const plan = fs.existsSync(planPath) ? fs.readFileSync(planPath, "utf-8") : "";
    if (!/^approved:/m.test(plan)) {
      console.error(`GATE: ${planPath} has no "approved:" line.\n` +
        `Write the ideas (references/03-visual-plan.md), show him the plan, then add\n` +
        `"approved: <date> <his words>" and render. KEYFRAMES_SKIP_GATES=1 only for a diagnostic.`);
      process.exit(1);
    }
  }
  for (const [script, args] of [["lock_layer.py", ["check", projectDir]],
                                ["hook_build.py", ["check", projectDir]]]) {
    if (script === "hook_build.py" && !fs.existsSync(path.join(projectDir, "hook.json"))) continue;
    const r = python(path.join(scripts, script), args, { encoding: "utf-8" });
    process.stdout.write(r.stdout ?? "");
    if (r.status !== 0) { console.error(`GATE: ${script} failed, not rendering.`); process.exit(1); }
  }
}

// title pages may carry real marks from the project's assets/
for (const pg of captions.pages) {
  for (const lg of pg.logos ?? []) if (!lg.src.includes("/")) lg.src = `${slug}-assets/${lg.src}`;
}

const props = {
  video: videoName,
  pages: captions.pages,
  style: captions.style,
  durationMs: captions.durationMs,
  visuals,
};

const localChrome = path.join(
  __dirname,
  "../../stack-reels/.chrome/chrome-headless-shell-mac-arm64/chrome-headless-shell"
);
const browserExecutable = fs.existsSync(localChrome) ? localChrome : undefined;
const isStill = process.argv.includes("--still");
const frameArg = process.argv.find((a) => a.startsWith("--frame="));
const stillFrame = frameArg ? parseInt(frameArg.split("=")[1], 10) : 30;
const outArg = process.argv.indexOf("--out");
const outputLocation =
  outArg > -1
    ? path.resolve(process.argv[outArg + 1])
    : path.join(projectDir, isStill ? `caption-still-${stillFrame}.png` : "captioned.mp4");

async function main() {
  const serveUrl = await bundle({
    entryPoint: path.join(__dirname, "src/index.ts"),
    webpackOverride: (c) => c,
    enableCaching: !process.env.REMOTION_NO_CACHE, // REMOTION_NO_CACHE=1 when the disk is tight (no node_modules/.cache/webpack)
  });
  const comps = await getCompositions(serveUrl, { inputProps: props, browserExecutable });
  const composition = comps.find((c) => c.id === "CaptionReel");
  if (!composition) throw new Error("CaptionReel composition not found");

  if (isStill) {
    await renderStill({
      composition, serveUrl, output: outputLocation,
      inputProps: props, frame: stillFrame, browserExecutable,
    });
  } else {
    const rangeArg = process.argv.find((a) => a.startsWith("--range="));
    const frameRange = rangeArg
      ? rangeArg.split("=")[1].split(":").map((n) => parseInt(n, 10))
      : undefined;
    // --muted: video only (audio is the master's, muxed back after a ranged render on a full disk)
    await renderMedia({
      composition, serveUrl, codec: "h264", crf: 18, frameRange,
      muted: process.argv.includes("--muted"),
      browserExecutable, outputLocation, inputProps: props,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 10 === 0)
          process.stdout.write(`\r${Math.round(progress * 100)}%`);
      },
    });
    process.stdout.write("\n");
  }
  console.log("Done:", outputLocation);
}

main().catch((e) => { console.error(e); process.exit(1); });
