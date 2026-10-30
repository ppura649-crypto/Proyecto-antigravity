#!/usr/bin/env node
/**
 * Render Remotion V2 High-Energy (`49.25 s`, `1080x1920 @ 60 fps`):
 * 1. Renderiza los 9 stills (Beat A + Beat B de doble ilustración) en 1 solo bundle rápido (`--stills`)
 * 2. Renderiza 2 stills con `--guides` para verificación de zonas seguras de TikTok/Reels/Shorts
 * 3. Renderiza el video completo `battery-myth-es.mp4` (`1080x1920 @ 60 fps`)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FV_DIR = "/Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual";
const REEL_DIR = path.join(FV_DIR, "reels", "battery-myth");

function run(cmd, args, cwd = FV_DIR) {
  console.log(`\n>>> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

const wordsData = JSON.parse(fs.readFileSync(path.join(REEL_DIR, "words.json"), "utf8"));
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9$€%]/g, "");

function wordTime(token, sceneId, offset = 0.22) {
  const scIdx = wordsData.scenes.findIndex((s) => s.id === sceneId);
  const lo = wordsData.scenes[scIdx].firstWord;
  const hi =
    scIdx + 1 < wordsData.scenes.length
      ? wordsData.scenes[scIdx + 1].firstWord - 1
      : wordsData.words.length - 1;
  const key = norm(token);
  for (let i = lo; i <= hi; i++) {
    if (norm(wordsData.words[i].w) === key) {
      return Math.min(wordsData.duration - 0.15, Math.max(0.1, wordsData.words[i].t + offset)).toFixed(2);
    }
  }
  return (wordsData.words[lo].t + 0.45).toFixed(2);
}

// Limpiar stills antiguos
const stillsDir = path.join(REEL_DIR, "stills");
if (fs.existsSync(stillsDir)) {
  for (const f of fs.readdirSync(stillsDir)) fs.unlinkSync(path.join(stillsDir, f));
}

const tList = [
  wordTime("no", "hook", 0.22),          // Beat 1 Hook: tech-01 + MITO DESTRUIDO
  wordTime("sí", "hook", 0.08),          // Beat 2 Hook: tech-08 red-hot battery + PiP + 2 Asesinos
  wordTime("desconectabas", "origin", 0.08), // Beat 2 Origin: tech-02 | tech-09 50/50 split
  wordTime("80%", "chip", 0.18),         // Beat 1 Chip: tech-03 + rayos SVG + curva en vivo
  wordTime("automática", "chip", 0.05),  // Beat 2 Chip: tech-10 escudo esmeralda + 0.0 W CORTE
  wordTime("siempre", "heat", 0.05),     // Beat 2 Heat: tech-11 fuego gaming + brasas + tacómetro SVG
  wordTime("vida", "cycles", 0.05),      // Beat 2 Cycles: tech-05 | tech-12 50/50 split + 1,050 ciclos
  wordTime("tranquilo", "rule", 0.10),   // Beat 2 Rule: tech-13 noche tranquila + 3/3 checks
  wordTime("esto", "cta", 0.14),         // Beat 2 CTA: tech-07 | tech-14 50/50 split + 91% + Publicado
];

const guidesList = [
  wordTime("sí", "hook", 0.08),
  wordTime("esto", "cta", 0.14),
];

// 1. Renderizar los 9 stills en 1 solo bundle
run("node", ["render.mjs", "battery-myth", "--stills", tList.join(",")]);

// 2. Renderizar 2 stills con --guides
run("node", ["render.mjs", "battery-myth", "--guides", "--stills", guidesList.join(",")]);

// 3. Renderizar video completo 1080x1920 @ 60 fps
const mp4Path = path.join(REEL_DIR, "battery-myth-es.mp4");
run("node", ["render.mjs", "battery-myth", "--out", mp4Path]);

console.log("\n=== REMOTION V2 RENDER COMPLETE ===");
