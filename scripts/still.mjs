#!/usr/bin/env node
// still.mjs <composition id> --props <json | @file> --out <png> [--frame <n>] [--entry <index.ts>]
// Contract: renders one frame of one composition with the given props to a png, the way every setup shows its example
//   and every format shows a still before a video. Finds the compositions entry of the installed packs
//   (remotion/<pack>/src/index.ts) unless --entry is given; the pack's public folder (fonts, assets) sits next to src.
//   Prints { ok, still, composition, frame, seconds }. Exits 1 with the reason when the composition or the entry is missing.
//   The first render downloads the render browser once.
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { P, readJson, fail } from "./_lib.mjs";

const args = process.argv.slice(2);
const id = args[0];
if (!id || id.startsWith("--")) fail("usage: still.mjs <composition id> --props <json|@file> --out <png> [--frame n] [--entry index.ts]");
if (id === 'CaptionReel') fail('Use node engine/talking-head/remotion/render.mjs <project> --still so the still belongs to this video\'s steps.');
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const out = opt("--out", null); if (!out) fail("--out <png> is required");
const rawProps = opt("--props", "{}");
const props = JSON.parse(rawProps.startsWith("@") ? readFileSync(rawProps.slice(1), "utf8") : rawProps);
const frame = Number(opt("--frame", 30));

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
  // Pick the entry whose Root registers this composition id.
  entry = cands.find((c) => { try { return new RegExp(`id=["']${id}["']`).test(readFileSync(join(dirname(c), "Root.tsx"), "utf8")); } catch { return false; } }) ?? cands[0] ?? null;
}
if (!entry || !existsSync(entry)) fail(`no compositions entry found for ${id}; is the pack installed?`);
// The pack's public folder (fonts, assets) sits beside the entry in one shape and one level up in the other.
const publicDir = [join(dirname(entry), "public"), join(dirname(dirname(entry)), "public")].find(existsSync) ?? null;

const t0 = Date.now();
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const serveUrl = await bundle({ entryPoint: entry, publicDir: publicDir ?? undefined });
let composition;
try { composition = await selectComposition({ serveUrl, id, inputProps: props }); } catch (e) { fail(`composition ${id} not found or its props were refused: ${String(e?.message ?? e).slice(0, 300)}`); }
mkdirSync(dirname(out), { recursive: true });
await renderStill({ composition, serveUrl, output: out, inputProps: props, frame: Math.min(frame, composition.durationInFrames - 1), imageFormat: "png" });
console.log(JSON.stringify({ ok: true, still: out, composition: id, frame, seconds: Math.round((Date.now() - t0) / 100) / 10 }));
