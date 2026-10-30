#!/usr/bin/env node
// type.mjs --font <file.ttf> --text "<one row>" [--weights 600,700,800,900] [--json]
// Contract: says what one row of words measures in the pack's own font, so a line can be set to the size a post used
//   instead of guessed from a character count. The browser that renders the layer is the one asked, with the same font
//   file, so the numbers are the ones the render will produce.
//   { font, text, faces: [ { weight, width, cap, ascent, descent, line } ] }
//   Every number is per em: width is the row's advance width, cap the height of a capital, ascent and descent the box
//   the browser gives a line, line their sum. A row set at size S is then S * width wide and S * cap tall, which is what
//   a frame of the post can be compared with.
//   Exits 1 when no browser is found or the font cannot be read.
import { existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fail, run } from "./_lib.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const font = resolve(opt("--font", ""));
const text = opt("--text", "");
if (!font || !existsSync(font) || !text) fail('usage: type.mjs --font <file.ttf> --text "<row>" [--weights 600,700]');
const weights = String(opt("--weights", "600,700,800,900")).split(",").map(Number);

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
// Measuring a font needs a browser, not the buyer's browser. Playwright's bundled Chromium lives in
// its own cache and nobody signs into it, so starting it can cost nothing.
let chrome;
try {
  const { chromium } = await import("playwright");
  chrome = chromium.executablePath();
  if (!chrome || !existsSync(chrome)) throw new Error("not downloaded");
} catch {
  fail("the bundled browser is not installed. Run: npm install, then npx playwright install chromium");
}

const dir = mkdtempSync(join(tmpdir(), "kf-type-"));
const page = join(dir, "type.html");
writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: F; src: url("file://${font}"); font-weight: 100 900; }
body { margin: 0; background: #000; }
</style><pre id="out"></pre><script>
const TEXT = ${JSON.stringify(text)}, WEIGHTS = ${JSON.stringify(weights)};
const c = document.createElement("canvas").getContext("2d");
document.fonts.ready.then(async () => {
  const faces = [];
  for (const w of WEIGHTS) {
    await document.fonts.load(w + " 100px F");
    c.font = w + " 100px F";
    const m = c.measureText(TEXT), cap = c.measureText("H");
    faces.push({ weight: w, width: m.width / 100, cap: cap.actualBoundingBoxAscent / 100,
      ascent: m.fontBoundingBoxAscent / 100, descent: m.fontBoundingBoxDescent / 100,
      line: (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 100 });
  }
  document.getElementById("out").textContent = "KFTYPE" + JSON.stringify(faces);
});
</script>`);
const dom = run(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--dump-dom", `file://${page}`], { encoding: "utf8", maxBuffer: 1 << 24 });
const m = dom.match(/KFTYPE(\[.*?\])</s);
if (!m) fail("the browser did not measure the font; check that the file is a ttf and the browser can read it");
const faces = JSON.parse(m[1]);
console.log(JSON.stringify({ font, text, faces }, null, 1));
