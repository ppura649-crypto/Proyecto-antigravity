// Shoot the project's HTML artifact replicas into tall PNGs for the overlay layer.
// Usage: node scripts/shoot_assets.mjs <project_dir>
// Reads  <project_dir>/assets/src/*.html   (body[data-vw] sets the CSS viewport width)
// Writes <project_dir>/assets/<name>.png   (full page, DPR 2)
//        <project_dir>/assets/meta.json    {name: {w,h, marks:{id:{y,h}}}}  device px
import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../../../package.json", import.meta.url)
);
const puppeteer = require("puppeteer-core");

const __dir = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ||
  resolve(__dir, `../../../node_modules/.remotion/chrome-headless-shell/${(process.platform === "darwin" ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64") : process.platform === "win32" ? "win64" : process.arch === "arm64" ? "linux-arm64" : "linux64")}/chrome-headless-shell-${(process.platform === "darwin" ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64") : process.platform === "win32" ? "win64" : process.arch === "arm64" ? "linux-arm64" : "linux64")}/${process.platform === "win32" ? "chrome-headless-shell.exe" : process.platform === "linux" && process.arch === "arm64" ? "headless_shell" : "chrome-headless-shell"}`);
if (!existsSync(CHROME)) {
  console.error(`chrome-headless-shell not found at ${CHROME}`);
  process.exit(1);
}

const projectDir = resolve(process.argv[2] ?? "");
const srcDir = join(projectDir, "assets", "src");
if (!existsSync(srcDir)) {
  console.error(`usage: node shoot_assets.mjs <project_dir> (needs assets/src/)`);
  process.exit(1);
}
const DPR = 2;
const files = readdirSync(srcDir).filter((f) => f.endsWith(".html"));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--disable-gpu"],
});
const meta = {};
for (const f of files) {
  const name = basename(f, ".html");
  const html = readFileSync(join(srcDir, f), "utf-8");
  const vw = parseInt(html.match(/data-vw="(\d+)"/)?.[1] ?? "780", 10);
  const page = await browser.newPage();
  await page.setViewport({ width: vw, height: 1200, deviceScaleFactor: DPR });
  await page.goto("file://" + join(srcDir, f), { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 150));
  const m = await page.evaluate(() => {
    const marks = {};
    for (const el of document.querySelectorAll("[data-mark]")) {
      const r = el.getBoundingClientRect();
      marks[el.dataset.mark] = { y: r.top + window.scrollY, h: r.height };
    }
    return { marks, hCss: document.documentElement.scrollHeight };
  });
  const out = join(projectDir, "assets", `${name}.png`);
  const transparent = /data-transparent/.test(html);
  await page.screenshot({ path: out, fullPage: true, omitBackground: transparent });
  meta[name] = {
    w: vw * DPR,
    h: m.hCss * DPR,
    marks: Object.fromEntries(
      Object.entries(m.marks).map(([k, v]) => [k, { y: v.y * DPR, h: v.h * DPR }])
    ),
  };
  console.log(`${name}.png  ${vw * DPR}x${m.hCss * DPR}  marks: ${Object.keys(m.marks).join(",") || "-"}`);
  await page.close();
}
await browser.close();
writeFileSync(join(projectDir, "assets", "meta.json"), JSON.stringify(meta, null, 2));
console.log("meta.json written");
