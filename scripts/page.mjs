#!/usr/bin/env node
// page.mjs <file.html | file.md> [--out <path.html>] [--title <text>] [--no-open]
// Contract: shows the buyer a page in the browser they already use. Takes a finished HTML file, or a Markdown file, or an
//   HTML fragment (no <html> tag): Markdown is converted (headings, paragraphs, lists, bold, code, links, images, tables),
//   a fragment or a converted file is wrapped in the Keyframes shell (scripts/page.css through pageShell in _lib.mjs), and
//   the result is written to --out, else next to a fragment (same path) or to workspace/pages/<name>.html for Markdown.
//   Then it opens the page with the system opener (open, start, xdg-open) unless --no-open, and prints the path.
//   Refuses a file holding an em or en dash outside an element marked verbatim (the buyer's own words, quoted back). Every ask, every read-back, every example goes through here: the buyer
//   sees a page, never a wall of chat. The pieces a page may use are shown once in docs/design.html of the build folder.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { P, fail, pageShell, markdown, openPath } from "./_lib.mjs";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out" && args[i - 1] !== "--title");
if (!file) fail("usage: page.mjs <file.html | file.md> [--out <path>] [--title <text>] [--no-open]");
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!existsSync(file)) fail(`${file} does not exist`);
const src = readFileSync(file, "utf8");
// The no-dash rule is about the words we write. A buyer's own caption, and a line read off their own frame, are quoted
// back exactly as they wrote them: they are marked verbatim in the markup and are not ours to rewrite. Checking them
// meant a page refused to open for any buyer who writes with em dashes, which is most of them. Everything else, every
// word the folder wrote itself, is still checked.
const authored = src.replace(/<(\w+)\b[^>]*\bclass="[^"]*\bverbatim\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, "");
if (/[\u2014\u2013]/.test(authored)) fail(`${file} holds an em or en dash; rewrite it`);

const ext = extname(file).toLowerCase();
const title = opt("--title") ?? basename(file, ext).replace(/[-_]+/g, " ");
let html, out;
if (ext === ".md") {
  const body = markdown(src);
  const first = body.match(/^<h1>(.*?)<\/h1>/);
  const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = pageShell(first ? first[1].replace(/<[^>]+>/g, "") : title, `<header class="top"><h1>${first ? first[1] : esc(title)}</h1></header><main class="plain">${first ? body.replace(first[0], "") : body}</main>`);
  out = opt("--out") ?? P("workspace", "pages", `${basename(file, ext)}.html`);
} else if (/<html[\s>]/i.test(src)) {
  html = src; out = opt("--out") ?? file;
} else {
  html = pageShell(title, src); out = opt("--out") ?? file;
}
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(out, html);
if (!args.includes("--no-open")) openPath(out);
console.log(`page: ${out}${args.includes("--no-open") ? "" : " (opened)"}`);
