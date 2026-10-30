// _lib.mjs: shared helpers for the runtime scripts. No contract; imported only.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync, exec } from "node:child_process";
import { createHash } from "node:crypto";

export const ROOT = process.cwd();
export const P = (...parts) => join(ROOT, ...parts);

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}
export function fail(message, code = 1) { console.error(`error: ${message}`); process.exit(code); }
export function today() { return new Date().toISOString().slice(0, 10); }
export function now() { return new Date().toISOString(); }
export function hashFile(path, chunk = 1024 * 1024) {
  const h = createHash("sha256"); const buf = readFileSync(path);
  if (buf.length <= 2 * chunk) h.update(buf); else { h.update(buf.subarray(0, chunk)); h.update(buf.subarray(buf.length - chunk)); h.update(String(buf.length)); }
  return h.digest("hex").slice(0, 16);
}
export function which(bin) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [bin], { encoding: "utf8" });
  // `where` ends every line with a carriage return and prints one line per copy on the PATH, which a
  // machine with two Pythons or two ffmpegs always has. Split the lines first, then trim the one taken,
  // or the path carries a stray character and the program it names looks missing.
  if (r.status !== 0) return null;
  const first = String(r.stdout ?? "").split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  return first ?? null;
}
export function ffbin(name) {
  // ffmpeg: the full static build installed with the packages (every filter the formats use), then the PATH, then the
  // copy the renderer ships, which decodes and encodes but has almost no filters (no overlay, eq, edgedetect, tile).
  // ffprobe: the renderer's copy first (it only reads), then the PATH. Null when nothing exists.
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const shipped = P("node_modules", "@remotion", "compositor-" + process.platform + "-" + process.arch, exe);
  const cands = name === "ffmpeg"
    ? [P("node_modules", "ffmpeg-static", exe), which(name), shipped]
    : [shipped, which(name), P("node_modules", "ffmpeg-static", exe)];
  for (const c of cands) if (c && existsSync(c)) return c;
  return null;
}
// True when this ffmpeg carries the filters the formats need. The renderer's copy does not.
export function ffFull(bin) {
  try { const f = run(bin, ["-hide_banner", "-filters"]); return ["overlay", "eq", "edgedetect", "tile", "select"].every((n) => new RegExp(`\\s${n}\\s`).test(f)); } catch { return false; }
}
// The shipped ffmpeg and ffprobe load libav*.dylib or .so from their own folder; the loader only finds them with this path set.
export function ffenv(bin) {
  const d = dirname(String(bin ?? ""));
  if (!d.includes("compositor-")) return process.env;
  return { ...process.env, DYLD_LIBRARY_PATH: d, LD_LIBRARY_PATH: d };
}
export function run(bin, args, opts = {}) {
  return execFileSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: ffenv(bin), ...opts });
}
export function loadEnvNames(path = P(".env.local")) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => l.split("=")[0]);
}
export function loadEnv(path = P(".env.local")) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line); if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
export function slug(s, n = 40) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n) || "untitled"; }
export function installedPacks() { return readJson(P("runtime.json"), { packs: [] }).packs ?? []; }

// The one answer to "what happens now", for the whole folder. Every caller reads it here: scripts/next.mjs prints it,
// the board puts it at the top, and start runs it the moment it finishes. Two scripts answering this question is how a
// folder starts lying to itself, so there is one. Trial Reels needs the account reading. Other formats can use their
// own footage and brief while it runs. Then the format furthest through its own stages goes first; when
// nothing has started, the format whose pack.json ranks itself first and says why. It answers, it never fails.
export function whatNext() {
  const start = readJson(P("context", "start.json"));
  const packs = installedPacks();
  if (!packs.length) return { ready: false, say: "Say: add the format I bought.", run: null, why: "no format is installed in this folder", format: null, waiting: [] };
  const available = packs.filter((p) => start?.done || p.needs?.account === false || p.name === "talking-head" || p.name === "quick-cuts");
  const blocked = packs.filter((p) => !available.includes(p)).map((p) => ({ pack: p.name, command: p.command, why: "finish reading your account first" }));
  if (!available.length) return { ready: false, say: "Say: set me up. We read your account first.", run: "/start", why: "this format needs your account reading", format: null, waiting: blocked };
  const trialStatus = readJson(P('context', 'trial-reels', 'analysis.json'), {})?.status;
  const rows = available.filter(p => p.name !== 'trial-reels' || !['no-matches', 'empty'].includes(trialStatus)).map((p) => ({ p, lib: readJson(P("workspace", "library", `${p.name}.json`)) }));
  if (!rows.length) return {ready:false, say:trialStatus==='no-matches'?'Your best reels are talking heads. No Trial Reels study is needed.':'No recent reels to vary yet.',run:null,why:'no matching source formats',format:null,waiting:blocked};
  const started = rows.filter((r) => r.lib?.stage?.n).sort((a, b) => b.lib.stage.n - a.lib.stage.n);
  const live = started[0] ?? [...rows].sort((a, b) => (a.p.first_run?.rank ?? 99) - (b.p.first_run?.rank ?? 99))[0];
  const st = live.lib?.stage ?? null;
  const name = live.p.name.replace(/-/g, " ");
  const waiting = [...rows.filter((r) => r !== live).map((r) => ({ pack: r.p.name, command: r.p.command, why: r.p.first_run?.why ?? null })), ...blocked];
  if (st?.next) return { ready: true, say: st.say?.replace(/^Next: /, "") ?? st.next, run: live.p.command, why: `${st.format ?? name}, step ${st.n} of ${st.of}`, format: { pack: live.p.name, command: live.p.command, setup: Boolean(live.lib?.setup?.done), stage: { n: st.n, of: st.of, name: st.name, format: st.format ?? null } }, waiting };
  const why = live.p.first_run?.why ?? "it is the format installed here";
  return { ready: true, say: `Say ${live.p.command} to start${started.length ? "" : `: ${why}`}.`, run: live.p.command, why, format: { pack: live.p.name, command: live.p.command, setup: Boolean(live.lib?.setup?.done), stage: null }, waiting };
}

// Opens files and folders with what the machine already uses: a folder in Finder or Explorer, a video in the default
// player, a page in the browser. Every format presents a version this way: the page, then the folder, then the video,
// so the buyer sees the thing and never a path.
export function openPath(...paths) {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
  for (const p of paths.filter(Boolean)) exec(`${opener} "${resolve(p)}"`, () => {});
}

// Markdown to HTML, the subset the skills write: headings, paragraphs, lists, fenced code, tables, rules, images, links.
export function markdown(md) {
  const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (x) => esc(x)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const lines = md.split("\n"); const out = []; let i = 0; let para = [];
  const flush = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { flush(); const code = []; i++; while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]); i++; out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`); continue; }
    const h = l.match(/^(#{1,4})\s+(.*)/); if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(l)) { flush(); const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, "")); out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`); continue; }
    if (/^\s*\d+[.)]\s+/.test(l)) { flush(); const items = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, "")); out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`); continue; }
    if (/^\s*\|/.test(l)) { flush(); const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]); const cells = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()))); out.push(`<div class="tw"><table>${cells.map((r, n) => `<tr>${r.map((c) => (n === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table></div>`); continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(l)) { flush(); out.push("<hr>"); i++; continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim()); i++;
  }
  flush();
  return out.join("\n");
}


// Every page the folder opens in the buyer's browser is wrapped here: one stylesheet (scripts/page.css), the two faces
// from Google Fonts with system fallbacks, the title. body is the page's own markup: header.top, then .layout or main.plain.
export function pageShell(title, body) {
  const css = existsSync(P("scripts", "page.css")) ? readFileSync(P("scripts", "page.css"), "utf8") : "";
  const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Martian+Mono:wght@400;500;600&display=swap">
<style>${css}</style></head><body>${body}</body></html>`;
}
