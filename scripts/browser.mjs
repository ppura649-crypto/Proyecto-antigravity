#!/usr/bin/env node
// browser.mjs open <url> | capture <url> --out <png> [--full] [--rects <css selector>] [--width 780] [--dpr 2] | text <url> [--find <regex>] [--wait ms] | record <url> --out <mp4> --scroll <px> --seconds <n> [--width 1200]
// Contract: drives a dedicated browser profile in workspace/library/browser-profile/ (the buyer logs in once, cookies stay).
//   open: shows the window so the buyer can log in. capture: full-page or viewport PNG plus, with --rects, a JSON file next to
//   it with the bounding boxes of matching elements in device pixels. record: a smooth scroll recorded to mp4 through ffmpeg.
//   Same code on macOS, Windows and Linux. Uses the BUNDLED browser only, never the buyer's own Chrome or Edge: see the note on
//   launch(). Exits 1 with a plain message when playwright is not installed (npm install playwright, then npx playwright install chromium).
import { existsSync, mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { P, ffbin, run, fail } from "./_lib.mjs";

const [cmd, url, ...rest] = process.argv.slice(2);
const opt = (k, d = null) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const flag = (k) => rest.includes(k);
if (!cmd || !url) fail("usage: browser.mjs open|capture|record|text <url> [options]");
let chromium; try { ({ chromium } = await import("playwright")); } catch { fail("playwright is not installed. Run: npm install playwright && npx playwright install chromium"); }

const profile = P("workspace", "library", "browser-profile"); mkdirSync(profile, { recursive: true });
const width = Number(opt("--width", cmd === "record" ? 1200 : 780)); const dpr = Number(opt("--dpr", 2));
// HARD RULE: never launch a browser the buyer browses with.
//
// On macOS every instance of the same Chrome binary shares one login-Keychain item ("Chrome Safe
// Storage") holding the key that decrypts its cookies. A second instance, even pointed at a totally
// separate profile directory, touches that item; if that access fails or is refused, Chrome
// regenerates the key and every cookie in the buyer's REAL profile becomes undecryptable. They are
// signed out of everything at once and signing back in does not restore what was lost. Windows
// (DPAPI) and Linux (kwallet, gnome-keyring) have the same shape of shared secret.
//
// So: only the bundled browser, which is not one anybody browses with, and which therefore has no
// session of the buyer's to destroy. The cost is that a page sniffing for Chrome sees Chromium.
async function launch(headless, extra = {}) {
  try {
    return await chromium.launchPersistentContext(profile, { headless, viewport: { width, height: cmd === "record" ? 1400 : 1200 }, deviceScaleFactor: dpr, ...extra });
  } catch (e) {
    fail(`the bundled browser could not start (${String(e?.message ?? e).split("\n")[0]}). Run: npx playwright install chromium`);
  }
}

if (cmd === "open") {
  const ctx = await launch(false); const page = ctx.pages()[0] ?? (await ctx.newPage()); await page.goto(url);
  console.log("browser open. Log in if the page asks, then close the window."); await new Promise((r) => ctx.on("close", r));
} else if (cmd === "capture") {
  const out = opt("--out"); if (!out) fail("--out <png> required");
  const ctx = await launch(true); const page = await ctx.newPage(); await page.goto(url, { waitUntil: "networkidle" });
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: flag("--full") });
  const sel = opt("--rects");
  if (sel) { const rects = await page.$$eval(sel, (els, d) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x * d, y: (r.y + window.scrollY) * d, w: r.width * d, h: r.height * d, text: (e.textContent || "").trim().slice(0, 80) }; }), dpr); writeFileSync(out.replace(/\.png$/, "") + ".rects.json", JSON.stringify(rects, null, 2)); console.log(`rects: ${rects.length}`); }
  await ctx.close(); console.log(`captured -> ${out}`);
} else if (cmd === "text") {
  // The page's visible text, for reading one of the buyer's own posts in their own session (the sound name, the caption).
  const ctx = await launch(true); const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(Number(opt("--wait", 4000)));
  const text = await page.evaluate(() => document.body.innerText);
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href*='/reels/audio/'], a[href*='/audio/']")].map((a) => ({ text: a.innerText.trim(), href: a.getAttribute("href") })));
  await ctx.close();
  const find = opt("--find"); if (find) { const re = new RegExp(find, "i"); const lines = text.split("\n").filter((l) => re.test(l)); console.log(JSON.stringify({ lines, links })); } else console.log(JSON.stringify({ text: text.slice(0, 4000), links }));
} else if (cmd === "record") {
  const out = opt("--out"); const scroll = Number(opt("--scroll", 1200)); const seconds = Number(opt("--seconds", 3));
  if (!out) fail("--out <mp4> required");
  const tmp = P("workspace", "library", "browser-recordings"); mkdirSync(tmp, { recursive: true });
  const ctx = await launch(true, { recordVideo: { dir: tmp, size: { width, height: 1400 } } }); const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  const steps = Math.round(seconds * 60);
  for (let i = 1; i <= steps; i++) { const t = i / steps; const eased = 1 - Math.pow(1 - t, 3); await page.evaluate((y) => window.scrollTo(0, y), Math.round(scroll * eased)); await page.waitForTimeout(1000 / 60); }
  await page.waitForTimeout(400); const video = page.video(); await ctx.close();
  const webm = await video.path(); const ffmpeg = ffbin("ffmpeg"); if (!ffmpeg) fail("ffmpeg not found; run doctor");
  mkdirSync(dirname(out), { recursive: true }); run(ffmpeg, ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "60", "-an", out]); rmSync(webm, { force: true });
  console.log(`recorded -> ${out}`);
} else fail(`unknown command ${cmd}`);
