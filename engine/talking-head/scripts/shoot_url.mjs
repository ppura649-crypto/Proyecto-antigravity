// Shoot a REAL web page into a tall PNG for the overlay layer (never fabricate a source).
// Usage: node scripts/shoot_url.mjs <url> <out.png> [--vw 780] [--maxh 3200] [--from cssY] [--mark name=text ...] [--paras] [--hide css,selectors]
// Writes <out.png> (DPR 2, clipped to maxh CSS px) and <out>.json {w,h,marks:{name:[{y,h}...]},paras:[{y,h}]} device px
import { createRequire } from "node:module";
import { writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(new URL("../../../package.json", import.meta.url));
const puppeteer = require("puppeteer-core");
const __dir = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ||
  resolve(__dir, `../../../node_modules/.remotion/chrome-headless-shell/${(process.platform === "darwin" ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64") : process.platform === "win32" ? "win64" : process.arch === "arm64" ? "linux-arm64" : "linux64")}/chrome-headless-shell-${(process.platform === "darwin" ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64") : process.platform === "win32" ? "win64" : process.arch === "arm64" ? "linux-arm64" : "linux64")}/${process.platform === "win32" ? "chrome-headless-shell.exe" : process.platform === "linux" && process.arch === "arm64" ? "headless_shell" : "chrome-headless-shell"}`);
if (!existsSync(CHROME)) { console.error(`chrome not found at ${CHROME}`); process.exit(1); }
const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) { console.error("usage: shoot_url.mjs <url> <out.png> [--vw N] [--maxh N] [--mark name=text] [--paras] [--hide sel]"); process.exit(1); }
const opt = { vw: 780, maxh: 3200, from: 0, marks: [], paras: false, hide: "" };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === "--vw") opt.vw = parseInt(rest[++i], 10);
  else if (a === "--maxh") opt.maxh = parseInt(rest[++i], 10);
  else if (a === "--from") opt.from = parseInt(rest[++i], 10);
  else if (a === "--mark") opt.marks.push(rest[++i]);
  else if (a === "--paras") opt.paras = true;
  else if (a === "--hide") opt.hide = rest[++i];
}
const DPR = 2;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--disable-gpu"] });
const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36");
await page.setViewport({ width: opt.vw, height: 1200, deviceScaleFactor: DPR });
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 800));
if (opt.hide) await page.addStyleTag({ content: `${opt.hide}{display:none !important}` });
// lazy content: scroll through once so images load, then back to top
await page.evaluate(async (maxh) => {
  for (let y = 0; y < Math.min(document.documentElement.scrollHeight, maxh); y += 600) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
}, opt.maxh);
await new Promise((r) => setTimeout(r, 400));
const info = await page.evaluate((marks, paras) => {
  const res = { marks: {}, paras: [], hCss: document.documentElement.scrollHeight };
  const rect = (el) => { const r = el.getBoundingClientRect(); return { y: r.top + window.scrollY, h: r.height, x: r.left, w: r.width }; };
  for (const m of marks) {
    const [name, text] = [m.slice(0, m.indexOf("=")), m.slice(m.indexOf("=") + 1)];
    const hits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.includes(text)) {
        const el = n.parentElement; const r = rect(el);
        if (r.h > 0 && r.w > 0) hits.push(r);
      }
    }
    res.marks[name] = hits;
  }
  if (paras) for (const p of document.querySelectorAll("p")) { const r = rect(p); if (r.h > 20 && r.w > 200) res.paras.push(r); }
  return res;
}, opt.marks, opt.paras);
const hCss = Math.min(info.hCss - opt.from, opt.maxh);
await page.screenshot({ path: out, clip: { x: 0, y: opt.from, width: opt.vw, height: hCss }, captureBeyondViewport: true });
const dev = (r) => ({ y: Math.round((r.y - opt.from) * DPR), h: Math.round(r.h * DPR), x: Math.round(r.x * DPR), w: Math.round(r.w * DPR) });
const meta = { w: opt.vw * DPR, h: hCss * DPR, marks: Object.fromEntries(Object.entries(info.marks).map(([k, v]) => [k, v.map(dev)])), paras: info.paras.map(dev) };
writeFileSync(out.replace(/\.png$/, "") + ".json", JSON.stringify(meta, null, 1));
console.log(`${out} ${meta.w}x${meta.h}`, JSON.stringify(Object.fromEntries(Object.entries(meta.marks).map(([k, v]) => [k, v.length]))), "paras", meta.paras.length);
await browser.close();
