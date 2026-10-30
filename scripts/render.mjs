#!/usr/bin/env node
// render.mjs <composition id> --props <json | @file> --out <mp4|mov> [--alpha] [--entry <index.ts>] [--concurrency n] [--crf n]
//
// Contract: renders a whole composition to an mp4, the way still.mjs renders one frame of it. Finds the
//   compositions entry of the installed packs (remotion/<pack>/src/index.ts) unless --entry is given, by looking for
//   the Root that registers this id; the pack's public folder sits next to src. Prints
//   { ok, video, composition, frames, seconds, alpha }. Exits 1 with the reason when the composition or the entry is missing.
//
//   --alpha renders a transparent track (ProRes 4444) instead of h264, which is what the second runtime guarantee
//   needs: for any format with a human in it, the overlay renders on its own track and ffmpeg composites it onto the
//   untouched clip, so the buyer's footage is never decoded and re-drawn by a renderer. composite.mjs takes the .mov
//   this writes. Without it the phone format and the talking head have no way to obey that rule from a script, which
//   is the whole reason the rule is a script and not a paragraph.
//
// Goal
//   A format that can show a still but not a video is a format that cannot ship. This is the other half of still.mjs.
//
// Reasoning
//   Every format in this runtime declares a composition and every one of them was rendering nothing, because the
//   runtime had renderStill and not renderMedia. The gap was invisible from the outside: `npm run studio` shows the
//   composition moving, a still comes out correct, and the missing piece only appears when someone asks for the file.
//   So this exists, it is one script for every pack, and it takes the same arguments as still.mjs so the two are
//   learned once.
//
//   The still stays the thing shown FIRST. A still costs a second and a video costs a minute, and the house rule that
//   a still comes before every video is a rule about the buyer's time, not about what is technically possible.
//
// Counter-examples
//   A renderer per pack. Rendering a video before a still was looked at. Silently rendering the wrong composition when
//   two packs register the same id. Muxing audio the buyer does not own.
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { P, readJson, fail } from "./_lib.mjs";

const args = process.argv.slice(2);
const id = args[0];
if (!id || id.startsWith("--")) fail("usage: render.mjs <composition id> --props <json|@file> --out <mp4> [--entry index.ts]");
// This composition has per-video approval and still gates, owned by its format renderer.
if (id === 'CaptionReel') fail('Use node engine/talking-head/remotion/render.mjs <project> so this video keeps its approvals and steps.');
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const out = opt("--out", null); if (!out) fail("--out <mp4|mov> is required");
const alpha = args.includes("--alpha");
if (alpha && !out.endsWith(".mov")) fail("--alpha writes ProRes 4444, so --out must end in .mov");
const rawProps = opt("--props", "{}");
const props = JSON.parse(rawProps.startsWith("@") ? readFileSync(rawProps.slice(1), "utf8") : rawProps);

let entry = opt("--entry", null);
if (!entry) {
  const packs = existsSync(P("remotion")) ? readdirSync(P("remotion")) : [];
  // Both shapes a pack may install its compositions in. trial-reels puts them under <pack>/src/, quick-cuts
  // puts them directly under <pack>/. Looking for only one of those is how a pack ends up with a composition
  // that renders in the studio and cannot be found by any script: the id simply is not in the list, and the
  // error names the OTHER pack's compositions, which reads like the wrong pack is installed.
  // A third place a format can keep its compositions: inside its own engine, where only runtime.json names them. Looking
  // in remotion/ alone is why a talking head buyer got "is the pack installed" for the pack they had just installed.
  const registered = readJson(P("runtime.json"), { compositions: [] }).compositions ?? [];
  const cands = [...new Set([
    ...packs.flatMap((p) => [P("remotion", p, "src", "index.ts"), P("remotion", p, "index.ts")]),
    P("remotion", "src", "index.ts"), P("remotion", "index.ts"),
    ...registered.map((c) => dirname(P(c))).flatMap((d) => [join(d, "index.ts"), join(dirname(d), "index.ts")]),
  ])].filter(existsSync);
  // Pick the entry whose Root registers this composition id, never just the first pack installed.
  entry = cands.find((c) => { try { return new RegExp(`id=["']${id}["']`).test(readFileSync(join(dirname(c), "Root.tsx"), "utf8")); } catch { return false; } }) ?? cands[0] ?? null;
}
if (!entry || !existsSync(entry)) fail(`no compositions entry found for ${id}; is the pack installed?`);
// The pack's public folder (fonts, assets) sits beside the entry in one shape and one level up in the other.
const publicDir = [join(dirname(entry), "public"), join(dirname(dirname(entry)), "public")].find(existsSync) ?? null;

const t0 = Date.now();
const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");
const serveUrl = await bundle({ entryPoint: entry, publicDir: publicDir ?? undefined });
let composition;
try { composition = await selectComposition({ serveUrl, id, inputProps: props }); }
catch (e) { fail(`composition ${id} not found or its props were refused: ${String(e?.message ?? e).slice(0, 300)}`); }
mkdirSync(dirname(out), { recursive: true });

let lastPct = -1;
await renderMedia({
  composition, serveUrl, outputLocation: out, inputProps: props,
  // ProRes 4444 is the only codec here that carries alpha the compositor can read. yuva444p10le is
  // the pixel format that keeps it: prores without it writes an opaque track that looks correct in a
  // player and silently paints black over the buyer's clip.
  ...(alpha
    // imageFormat png as well: the frames are handed to the encoder as images, and a jpeg one has
    // no alpha channel to carry, so the renderer refuses the pixel format rather than quietly
    // flattening it. Three settings, all three required, or the track comes out opaque.
    ? { codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", imageFormat: "png" }
    : { codec: "h264", crf: Number(opt("--crf", 18)) }),
  concurrency: opt("--concurrency", null) ? Number(opt("--concurrency")) : undefined,
  // The overlay track discipline is a rule about compositing a human's clip, not about this: a composition that
  // already holds the footage renders whole. Formats that composite an overlay use composite.mjs after this.
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct >= lastPct + 10) { lastPct = pct; process.stderr.write(`  ${pct}%\n`); }
  },
});
console.log(JSON.stringify({ ok: true, video: out, composition: id, alpha, frames: composition.durationInFrames, seconds: Math.round((Date.now() - t0) / 100) / 10 }));
