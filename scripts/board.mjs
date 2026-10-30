#!/usr/bin/env node
// board.mjs
// Contract: writes workspace/board.html, a static snapshot and fallback for the live workspace. It answers three questions
//   and shows nothing else: what can I post now, what is being made, what do you need from me.
//   in : workspace/output/*/ (the videos, their captions, tracker.json), workspace/library/<pack>.json (setup, the
//        workspace/library/<pack>.json per installed pack, context/profile.json, context/start.json, runtime.json
//   out: workspace/board.html through pageShell. What is ready to post comes first, because it is the only thing on the
//        page the buyer can act on today; then one line and one meter per format of their account; then what is needed
//        from them, and only when something is. Folder names, project states, stage numbers, script names and the input
//        queue are the folder showing its working: none of it belongs here. A video with no cover gets one poster frame
//        written beside it, once, so the page never shows a black rectangle.
//   Static page, no server. Exits 0.
import { readdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { P, readJson, installedPacks, pageShell, ffbin, whatNext } from "./_lib.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const list = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => !d.name.startsWith(".")) : []);
const rel = (p) => relative(P("workspace"), p).split("\\").join("/");
const num = (n) => Number(n).toLocaleString("en-US");
const two = (n) => String(n).padStart(2, "0");
const count = (n, one, many) => `${n === 0 ? "no" : num(n)} ${n === 1 ? one : many}`;

const start = readJson(P("context", "start.json"));
const profile = readJson(P("context", "profile.json"), {});
const packs = installedPacks();
let workspaceUrl = null;
try { workspaceUrl = execFileSync(process.execPath, [P("scripts", "workspace.mjs"), "--ensure", "--no-open"], { encoding: "utf8", timeout: 15000 }).trim(); } catch {}

// ── What you can post ────────────────────────────────────────────────────────────────────────
// One tile per finished video: the video itself, what was changed in it, and its caption with a button that copies it.
const CHANGED = { line: "different words", cards: "different cards", song: "a different sound", caption: "a different caption", text: "a different text style", colour: "a different colour", opening: "a different opening", rhythm: "a different rhythm", end_card: "a different end card" };
const changedWords = (axis) => (!axis ? "" : axis.startsWith("shot") ? "a different clip of you" : CHANGED[axis] ?? `a different ${axis.replace(/[:_]/g, " ")}`);

function posterFor(dir, mp4) {
  const cover = join(dir, "cover.jpg");
  if (existsSync(cover)) return cover;
  const own = join(dir, `${basename(mp4, ".mp4")}.poster.jpg`);
  if (existsSync(own)) return own;
  const ff = ffbin("ffmpeg");
  if (!ff) return null;
  try { execFileSync(ff, ["-nostdin", "-y", "-v", "error", "-ss", "0.2", "-i", mp4, "-frames:v", "1", "-vf", "scale=-2:640", "-q:v", "4", own]); return own; } catch { return null; }
}

const ready = list(P("workspace", "output")).filter((d) => d.isDirectory()).sort((a, b) => (a.name < b.name ? 1 : -1)).flatMap((d) => {
  const dir = P("workspace", "output", d.name);
  const files = list(dir).map((x) => x.name);
  const tracker = readJson(join(dir, "tracker.json"), []) ?? [];
  const silent = files.includes("sound-card.md");
  return files.filter((f) => f.endsWith(".mp4")).sort().map((f) => {
    const mp4 = join(dir, f);
    const capFile = [join(dir, `${basename(f, ".mp4")}.caption.txt`), join(dir, "caption.txt")].find(existsSync);
    const t = tracker.find((x) => x.file === f) ?? {};
    return { mp4, poster: posterFor(dir, mp4), silent, caption: capFile ? readFileSync(capFile, "utf8").trim() : "",
      changed: changedWords(t.axis), posted: t.posted_on ?? null, plays: t.plays ?? null };
  });
});

const readyHtml = ready.map((v) => `<div class="card">
<div class="media"><video controls preload="none"${v.poster ? ` poster="${esc(rel(v.poster))}"` : ""} src="${esc(rel(v.mp4))}"></video></div>
<div class="body">${v.posted ? `<p class="muted">Posted ${esc(String(v.posted).slice(0, 10))}${v.plays ? `, ${num(v.plays)} plays` : ""}</p>` : ""}
${v.changed ? `<p>Same format as the post it came from, with ${esc(v.changed)}.</p>` : ""}
${v.silent ? `<p class="muted">Silent. The sound is named on the card in its folder.</p>` : ""}
${v.caption ? `<pre class="caption">${esc(v.caption)}</pre><button class="copy" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy the caption</button>` : ""}
</div></div>`).join("");

// ── What is being made ───────────────────────────────────────────────────────────────────────
// One line per format of the buyer's own account, from the pack's plan file, in the words the plan already uses.
// One file a format, and one answer in it. The plan used to be written twice, to context/<pack>/plan.json and to
// workspace/library/<pack>.json, with this page reading one and the handoff reading the other; the day one was
// written and the other was not, the folder said two different things about where the buyer was.
const plans = packs.map((pk) => ({ pack: pk, plan: readJson(P("workspace", "library", `${pk.name}.json`))?.plan })).filter((x) => x.plan?.formats?.length);
const where = (f) => f.line ? f.line
  : !f.studied ? "we have not looked at this one yet"
  : !f.first?.project ? "we are making the first version"
  : f.first.presented && !f.first.agreed_at ? "one version is on your desk, waiting on your word"
  : (f.ready ?? []).length ? "making the rest now" : "done for now";
// What this format works on, in the buyer's word for it. A pack says so or the board says post.
const unit = (f) => f.unit ?? "post";
const meter = (done, readyN, waiting) => {
  const total = Math.max(1, done + readyN + waiting);
  const w = (n) => `${(n / total) * 100}%`;
  return `<div class="meter" role="img" aria-label="${done} made, ${readyN} ready, ${waiting} waiting">${done ? `<i class="done" style="width:${w(done)}"></i>` : ""}${readyN ? `<i class="ready" style="width:${w(readyN)}"></i>` : ""}${waiting ? `<i class="waiting" style="width:${w(waiting)}"></i>` : ""}</div>`;
};
const madeHtml = plans.map(({ plan }) => plan.formats.map((f) => {
  const done = (f.done ?? []).length, readyN = (f.ready ?? []).length, waiting = (f.waiting ?? []).length;
  const u = unit(f);
  const parts = [done ? `${count(done, `${u} made`, `${u}s made`)}` : null, readyN ? `${num(readyN)} ready when you say go` : null, waiting ? `${num(waiting)} waiting on you` : null].filter(Boolean);
  const line = where(f);
  const tail = parts.join(", ") || (Number.isFinite(f.posts) ? `${count(f.posts, u, `${u}s`)} of yours in this format` : "");
  return `<h3>${esc(f.name)}</h3><p>${esc(line[0].toUpperCase() + line.slice(1))}.</p>${meter(done, readyN, waiting)}${tail ? `<p class="muted">${esc(tail)}</p>` : ""}`;
}).join("")).join("");

// ── What we need from you ────────────────────────────────────────────────────────────────────
// One entry per thing the buyer has to do: the thing itself as the headline, one line under it, where it goes, and the
// page that draws it beside crops of their own posts. A need said as a bare sentence in a bullet list is the version of
// this page that could not be read.
const needs = [];
if (!start?.done && packs.some(pack => pack.needs?.account !== false)) needs.push({ what: "Say: set me up", line: "Two minutes, and it asks you almost nothing." });
else if (!packs.length) needs.push({ what: "Add the format you bought", line: "Say: add the format I bought." });
for (const { plan } of plans) {
  for (const f of plan.formats) {
    if (f.first?.presented && !f.first.agreed_at) needs.push({ what: `${f.name}: say go, or say what to change`, line: "It is on your desk. Nothing else is made until you look.", page: plan.page });
    for (const n of f.needs ?? []) needs.push({ what: n.what, line: n.line, where: n.where, count: f.waiting?.length ?? 0, unit: f.unit, format: f.name, page: n.page ?? plan.page ?? null });
  }
}
// The same answer the agent acts on, from the same function, so the page and the chat never say two different things.
const now = whatNext();
const nextLine = now.say;

// The steps of the format that is live, drawn: where the buyer is, what is behind them, what is still to come.
const liveLib = now.format ? readJson(P("workspace", "library", `${now.format.pack}.json`)) : null;
// The ladder repeats, so the foot says which pass and which format, from what the format's own plan worked out.
// Counting either of them here would make the board the second answer to a question the plan already answers.
const foot = (() => {
  const st = liveLib?.stage; if (!st) return "";
  const bits = [], r = st.round;
  if (r?.line && (r.n > 1 || r.more)) bits.push(r.line);
  if (st.formats_of > 1 && ["study", "first", "all"].includes(st.id)) bits.push(`Format ${Math.min((st.formats_done ?? 0) + 1, st.formats_of)} of ${st.formats_of}`);
  return bits.length ? `<p class="strip-foot">${esc(bits.join(". "))}.</p>` : "";
})();
const steps = liveLib?.stages?.length && liveLib?.stage
  ? `<p class="dek">${esc(now.format.stage?.format ? `${now.format.stage.format}, step ${liveLib.stage.n} of ${liveLib.stage.of}.` : `Step ${liveLib.stage.n} of ${liveLib.stage.of}.`)}</p>
<ol class="stages">${liveLib.stages.map((st) => {
      const cls = st.n < liveLib.stage.n ? "done" : st.n === liveLib.stage.n ? "on" : "";
      return `<li class="${cls}"><span class="mk" aria-hidden="true"></span><span class="sn">${String(st.n).padStart(2, "0")}</span><span class="nm">${esc(st.name)}</span><span class="ds">${esc(st.does ?? "")}</span><span class="st">${cls === "done" ? "done" : cls === "on" ? "here" : ""}</span></li>`;
    }).join("")}</ol>${foot}`
  : "";

// Everything needed is listed here, the one at the top included: a section that hides its only item because the line
// above said it leaves the buyer with a heading and nothing under it, which is what made this page unreadable.
const needsHtml = needs.length
  ? `<ol class="asks">${needs.map((n, i) => `<li class="ask${i === 0 ? " first" : ""}"><div class="n">${two(i + 1)}</div><div class="about">
${i === 0 ? '<div class="head"><span class="chip accent">start here</span></div>' : ""}<h3>${esc(n.what)}</h3>${n.line ? `<p>${esc(n.line)}</p>` : ""}
${n.format && n.count ? `<p class="for">${esc(n.format)} &middot; ${num(n.count)} ${esc(n.unit ?? "post")}${n.count === 1 ? "" : "s"} waiting</p>` : ""}
${n.where ? `<p class="drop">Drop them in <code>${esc(n.where)}</code>. Any names.</p>` : ""}
${n.page ? `<p class="drop"><a href="${esc(n.page)}">The same ask with crops of your own posts</a></p>` : ""}</div></li>`).join("")}</ol>`
  : `<p class="dek">${ready.length ? "Nothing. Post what is above." : "Nothing right now."}</p>`;

// ── The page ─────────────────────────────────────────────────────────────────────────────────
const chips = packs.map((p) => {
  const s = readJson(P("workspace", "library", `${p.name}.json`));
  const state = !s?.setup?.done ? "not set up yet" : "ready";
  return `<span class="chip ${state === "ready" ? "ok" : "warn"}">${esc(p.name.replace(/-/g, " "))}: ${esc(state)}</span>`;
}).join(" ");

const body = `<header class="top">
<h1>${profile.handle ? `Keyframes for @${esc(profile.handle)}` : "Keyframes"}</h1>
<p class="dek">Saved ${esc(new Date().toLocaleDateString())}. ${workspaceUrl ? `<a href="${esc(workspaceUrl)}">Open your workspace</a> for current steps.` : "Ask your agent to open your workspace for current steps."}</p>
<div class="next"><span class="lbl">What to do now</span><p>${esc(nextLine)}</p></div>
</header>
<main class="plain">
${ready.length ? `<h2>Ready to post</h2><p class="dek">${count(ready.length, "video", "videos")}, ${ready.length === 1 ? "with its caption" : "each with its caption"}. Post one a day.</p><div class="grid">${readyHtml}</div>` : ""}
${steps ? `<h2>Where we are</h2>${steps}` : ""}
<h2>What we need from you</h2>
${needsHtml}
${madeHtml ? `<h2>What we are making</h2>${madeHtml}` : ""}
<p class="footnote">What you post is in <code>output</code>, one folder per video. ${chips}</p>
</main>`;

writeFileSync(P("workspace", "board.html"), pageShell("Keyframes", body));
console.log(`board: ${ready.length} ready to post, ${plans.reduce((n, x) => n + x.plan.formats.length, 0)} formats -> workspace/board.html`);
