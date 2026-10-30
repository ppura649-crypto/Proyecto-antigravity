#!/usr/bin/env node
import { partitionTranscript } from './transcript-events.mjs';
// transcribe.mjs <media> --out <words.json> [--model <path>] [--threads N] [--lang en] [--local | --cloud] [--no-apple]
// Contract: media -> words.json, one JSON object a line, { start, end, text }, milliseconds on the
//   source. Prints how many words over how long. Gets the speech model and the speech engine itself
//   the first time, because both are a command and every command here is ours. Runs the same on
//   macOS and Windows.
//
// The cloud, optional. On a machine with no GPU a long take transcribes in minutes. When the buyer
// has put OPENAI_API_KEY in .env.local (the keys page, `--keys OPENAI_API_KEY`), the words come from
// OpenAI's whisper-1 with word timestamps in seconds instead, about a cent per minute of clip, and the
// audio leaves the machine for that call and nothing else. Nobody is asked up front: a buyer with a fast
// machine never hears of it. When the local engine measures itself slow on a long clip it prints the
// offer once and carries on locally; the agent relays it and the buyer decides. `--local` keeps a key
// unused; `--cloud` insists and fails plainly without a key. A cloud call that fails falls back to
// the local engine, so a bad network never blocks a video.
//
// Why Apple speech first. It is what the measured reels were made on, through auto-editor: exact
// word endings, about three seconds of work for five minutes of take, no model to fetch, macOS only.
//
// Why the transcript has to be COMPLETE. A word that was never heard can never be selected, cut on,
// captioned or landed on, so a missed sentence is a sentence the video can no longer contain.
// ggml-base.en dropped 69 of 323 words on the first real take, the closing ask among them, and the
// cut then took three rounds: the local model is small.en now, base.en runs only when it is named,
// and take.py measures how much of the speech the words cover before anything is built on them.
// whisper.cpp stays because half the buyers are on Windows, where there is no Apple speech: one
// binary and one file, the same on both, in the folder rather than a download they have to arrange.
//
// Why one word a segment. Everything downstream is word timed: the captions, the trigger a picture
// lands on, the sentence gaps a weight is allowed to sit in. `-ml 1 -sow` asks for exactly that,
// and `-dtw` aligns the tokens to the audio instead of estimating them, which is measurably closer.
// The numbers are still only good to roughly a tenth of a second, so nothing cuts on them: they
// pick a window and the audio chooses the millisecond inside it.
import { execFileSync, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { cpus, homedir } from "node:os";
import { ffbin, fail, which, loadEnv } from "./_lib.mjs";

// The model ships with the runtime, not with the buyer's workspace, so it is found relative to
// this file rather than to whatever folder the command was run in.
const RUNTIME = resolve(import.meta.dirname, "..");

const args = process.argv.slice(2);
const flag = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const BARE = new Set(["--local", "--cloud", "--no-apple"]);   // flags with no value after them
const media = args.find((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--") || BARE.has(args[i - 1])));
const out = flag("--out");
if (!media || !out) fail("usage: transcribe.mjs <media> --out <words.json> [--model <path>] [--threads N] [--no-apple]");

// small.en, because base.en is the model that dropped a sentence of a real take. base.en is still
// allowed by name, with --model.
const MODEL = "ggml-small.en.bin";
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL}`;

// The model lives in the runtime. It is also looked for beside any engine already installed here, and in the build
// layout beside any pack, so a folder that already carries one never pays for the download.
export function findModel(explicit) {
  if (explicit) return resolve(explicit);
  const here = join(RUNTIME, "models", MODEL);
  if (existsSync(here)) return here;
  for (const dir of [join(RUNTIME, "engine"), join(RUNTIME, "..", "packs")]) {
    if (!existsSync(dir)) continue;
    for (const p of readdirSync(dir)) {
      for (const m of [join(dir, p, "models", MODEL), join(dir, p, "engine", "models", MODEL)]) {
        if (existsSync(m)) return m;
      }
    }
  }
  return null;
}

// Nothing on this page is the buyer's to do. A missing model is a download and a missing engine is an install, and
// an agent with a shell is already running on their machine: printing curl and brew for somebody to paste is a bill
// for the one part they bought their way out of. Both happen once, out loud, and are never asked about.
async function getModel(explicit) {
  const found = findModel(explicit);
  if (found) return found;
  const dir = join(RUNTIME, "models");
  const want = join(dir, MODEL), part = `${want}.part`;
  mkdirSync(dir, { recursive: true });
  console.log("speech model: getting it once, about 466 MB. It stays in the folder and is never fetched again.");
  let res;
  try { res = await fetch(MODEL_URL, { redirect: "follow" }); }
  catch (e) { fail(`the speech model could not be downloaded: ${String(e.message).slice(0, 120)}. Check the connection and run this again.`); }
  if (!res.ok || !res.body) fail(`the speech model could not be downloaded (${res.status}). Run this again.`);
  try { await pipeline(Readable.fromWeb(res.body), createWriteStream(part)); }
  catch (e) { rmSync(part, { force: true }); fail(`the speech model download broke: ${String(e.message).slice(0, 120)}. Run this again.`); }
  const mb = statSync(part).size / 1e6;
  if (mb < 300) { rmSync(part, { force: true }); fail(`the speech model came back short (${mb.toFixed(0)} MB). Run this again.`); }
  renameSync(part, want);
  console.log(`speech model: ready (${mb.toFixed(0)} MB)`);
  return want;
}

// 1.7.6 because it is the most recent whisper.cpp release that still publishes a Windows binary. Checked against the
// release assets on 2026-09-06: 1.5.4 and 1.7.6 have whisper-bin-x64.zip, every version between them 404s, and the
// installer's Windows path is a download of exactly that file.
const WHISPER_VERSION = "1.7.6";
const WHISPER_DIR = join(RUNTIME, "whisper.cpp");

// The engine, in the order that costs the buyer least: one already on the PATH, then one we put in the folder
// before, then a bottle on macOS, then on Windows a download we unpack ourselves, then a build. Only the build needs
// tools we cannot install (git, make, cmake and a compiler), which is why it is last and says plainly what is missing.
// The program is looked for wherever it landed, because the layout moved between releases: a build leaves it in
// build/bin, the Windows zip in Release. The installer package's own path helper is not exported and names the first.
function findCli(dir) {
  if (!existsSync(dir)) return null;
  const want = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
  for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name === want) return join(e.parentPath ?? e.path, e.name);
  }
  return null;
}
async function getWindowsEngine() {
  const url = `https://github.com/ggml-org/whisper.cpp/releases/download/v${WHISPER_VERSION}/whisper-bin-x64.zip`;
  const zip = join(RUNTIME, "whisper-bin-x64.zip");
  console.log(`speech engine: getting whisper.cpp ${WHISPER_VERSION} once into ${WHISPER_DIR}. It is a download, nothing is built.`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) fail(`whisper.cpp could not be downloaded (${res.status}). Run this again.`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  mkdirSync(WHISPER_DIR, { recursive: true });
  try {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -Force -LiteralPath $env:KF_ZIP -DestinationPath $env:KF_TO -ErrorAction Stop"],
      { stdio: "inherit", env: { ...process.env, KF_ZIP: zip, KF_TO: WHISPER_DIR } });
  } finally { rmSync(zip, { force: true }); }
}
async function getEngine() {
  if (which("whisper-cli")) return "whisper-cli";
  const kept = findCli(WHISPER_DIR);
  if (kept) return kept;
  if (process.platform === "darwin" && which("brew")) {
    console.log("speech engine: installing whisper.cpp once with brew. It takes a minute.");
    try { execFileSync("brew", ["install", "whisper-cpp"], { stdio: "inherit" }); } catch { /* the build below is the fallback */ }
    if (which("whisper-cli")) return "whisper-cli";
  }
  if (process.platform === "win32") {
    try { await getWindowsEngine(); } catch (e) { fail(`whisper.cpp could not be installed: ${String(e.message).slice(0, 200)}`); }
  } else {
    let installer = null;
    try { installer = await import("@remotion/install-whisper-cpp"); }
    catch { fail("the speech engine is missing and the packages are not installed. Run: npm install"); }
    console.log(`speech engine: getting whisper.cpp ${WHISPER_VERSION} once into ${WHISPER_DIR}. It is built here, which needs git, make, cmake and a compiler.`);
    try { await installer.installWhisperCpp({ version: WHISPER_VERSION, to: WHISPER_DIR, printOutput: true }); }
    catch (e) { fail(`whisper.cpp could not be installed: ${String(e.message).slice(0, 200)}`); }
  }
  const exe = findCli(WHISPER_DIR);
  if (!exe) fail(`whisper.cpp installed but whisper-cli is not inside ${WHISPER_DIR}. Delete that folder and run this again.`);
  return exe;
}

loadEnv();
const wantCloud = args.includes("--cloud"), wantLocal = args.includes("--local");
if (wantCloud && wantLocal) fail("choose --cloud or --local, not both");
if (wantCloud && !process.env.OPENAI_API_KEY) fail("no OPENAI_API_KEY in .env.local: node scripts/keys/server.mjs --keys OPENAI_API_KEY, then run this again");
const useCloud = !wantLocal && Boolean(process.env.OPENAI_API_KEY);
// Apple leads on macOS. --no-apple steps over it, and --cloud is somebody insisting, so it does too.
const wantApple = process.platform === "darwin" && !args.includes("--no-apple") && !wantCloud;

const work = dirname(resolve(out));
mkdirSync(work, { recursive: true });
// whisper.cpp wants 16 kHz mono. Anything measured off the loudness of the voice is read from the
// original instead, because the band it needs does not survive a 16 kHz decode.
const wav = join(work, "_asr16.wav");
const stem = join(work, "_asr");
execFileSync(ffbin("ffmpeg"), ["-v", "error", "-y", "-i", resolve(media),
  "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], { stdio: "inherit" });
const clipSeconds = (statSync(wav).size - 44) / (16000 * 2);
const threads = flag("--threads", String(Math.min(8, Math.max(1, cpus().length))));

// auto-editor on the PATH, then uv, the runner py.mjs installs, which fetches it for the one call.
function appleEngine() {
  const at = (n) => which(n) ?? [join(homedir(), ".local", "bin", n)].find(existsSync) ?? null;
  const direct = at("auto-editor"), uvx = direct ? null : at("uvx"), uv = direct || uvx ? null : at("uv");
  return direct ? [direct, []] : uvx ? [uvx, ["--from", "auto-editor", "auto-editor"]]
    : uv ? [uv, ["tool", "run", "--from", "auto-editor", "auto-editor"]] : null;
}

// Apple's speech, borrowed through auto-editor, which is how the measured reels were transcribed:
// `auto-editor whisper <audio> apple -sw -f json -l en -o <file>` is one JSON object a line already.
// The 16 kHz wav first, because it is already made and its times are the times everything else
// measures on; the file itself second, for a build of auto-editor that will not read the wav. Only
// real lines count: { start, end, text } in milliseconds, with something actually said.
function appleWords(input) {
  const found = appleEngine();
  if (!found) return [];
  const [bin, pre] = found, file = join(work, "_apple.json");
  const read = () => {
    const lines = [];
    for (const raw of (existsSync(file) ? readFileSync(file, "utf8") : "").split("\n")) {
      let w; if (!raw.trim()) continue;
      try { w = JSON.parse(raw); } catch { return []; }
      const text = String(w?.text ?? "").trim(), start = Math.round(Number(w?.start)), end = Math.round(Number(w?.end));
      if (text && end > start) lines.push({ start, end, text });
    }
    return lines;
  };
  for (const src of [input, resolve(media)]) {
    rmSync(file, { force: true });
    try { execFileSync(bin, [...pre, "whisper", src, "apple", "-sw", "-f", "json", "-l", flag("--lang", "en"), "-o", file], { stdio: ["ignore", "ignore", "inherit"] }); }
    catch { continue; }
    const lines = read();
    if (partitionTranscript(lines).words.length) { rmSync(file, { force: true }); return lines; }
  }
  rmSync(file, { force: true });
  return [];
}

// -dtw aligns the tokens to the audio instead of estimating them, and its preset has to name the
// model loaded: base.en alignment on a small.en model is refused. So the name is read off the file,
// and a model we cannot name that way runs without the alignment rather than failing.
const DTW = new Set(["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large.v1", "large.v2", "large.v3"]);
function dtwOf(model) {
  const name = basename(model).replace(/^ggml-/, "").replace(/\.bin$/, "");
  return DTW.has(name) ? name : null;
}

// Whisper hears the words and guesses their times, and across a pause the guess is wrong by seconds: a raw take that
// opened on 23 s of silence came back with its first nine words spread over that silence. Two things put the times
// back on the voice. Voice detection (--vad, a second model under 1 MB) lets whisper hear only the speech, and then
// trimToVoice below holds each word to where the voice is. Measured on that take against Apple speech: a median gap
// of 405 ms before, 126 ms after, and no word left hanging across a pause. An engine too old for --vad, or a model
// that will not download, runs without it and says so; the trim still runs.
const VAD = "ggml-silero-v6.2.0.bin";
const VAD_URL = `https://huggingface.co/ggml-org/whisper-vad/resolve/main/${VAD}`;
async function getVad(engine) {
  const asked = spawnSync(engine, ["--help"], { encoding: "utf8" });   // the help goes to stderr on some builds
  if (!`${asked.stdout ?? ""}${asked.stderr ?? ""}`.includes("--vad")) { console.log("note  this whisper.cpp has no voice detection; word times near pauses are held by the trim alone"); return null; }
  const want = join(RUNTIME, "models", VAD);
  if (existsSync(want)) return want;
  try {
    const res = await fetch(VAD_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500000) throw new Error("short file");
    mkdirSync(dirname(want), { recursive: true }); writeFileSync(want, buf);
    return want;
  } catch (e) { console.log(`note  the voice detection model could not be fetched (${String(e.message).slice(0, 80)}); carrying on without it`); return null; }
}

// One level a millisecond off the 16 kHz wav (its loudest sample), then each word starts at the first sound inside
// its own window and ends before the first silence longer than a breath. A word whose window holds no sound at all
// is left as it came. The line between sound and room is an eighth of the way from the quiet of this recording to
// its loud, so it follows the room instead of assuming one.
// Whisper hands a word that sits beside a pause the whole pause: "it." came back as a 4150 ms word, stamped just after
// the real word was spoken, with the next take at the far end of it. Walking that window for the voice is what the
// two machines disagreed about, because a pause is breath hovering on the threshold: the same clip on a Mac and on
// Windows put that word 4.2 s apart. Two rules settle it.
//   The onset is the first place where the voice STAYS up, not the first sample that crosses the line, so one sample
//   decides nothing and the line can sit low.
//   A word that ends a sentence closes the take BEFORE the pause, so it never walks across one; its own full stop says
//   so. Every other word, a sentence opener among them, may walk the whole window, because whisper stamps the opener
//   at the start of the silence and its voice is seconds further on.
// A window with no voice in it leaves the word where whisper put it and gives it a word's length, never a pause's.
const ENDS_SENTENCE = /[.!?]["'`)\]]*$/;
export function trimToVoice(words, wavPath, gapMs = 140, holdMs = 40, closeReachMs = 300, maxWordMs = 1200) {
  const pcm = readFileSync(wavPath).subarray(44), per = 16, n = Math.floor(pcm.length / 2 / per);
  if (!n || !words.length) return words;
  const lev = new Float32Array(n);
  for (let i = 0; i < n; i++) { let m = 0; for (let k = 0; k < per; k++) { const v = Math.abs(pcm.readInt16LE((i * per + k) * 2)); if (v > m) m = v; } lev[i] = m / 32768; }
  const sorted = Float32Array.from(lev).sort(), floor = sorted[Math.floor(0.2 * (n - 1))], loud = sorted[Math.floor(0.9 * (n - 1))];
  const line = floor + (loud - floor) * 0.05;
  // voice that holds: at least two thirds of the next holdMs milliseconds above the line
  const holds = (i, to) => {
    const end = Math.min(to, i + holdMs); let up = 0;
    for (let j = i; j < end; j++) if (lev[j] > line) up++;
    return end > i && up * 3 >= (end - i) * 2;
  };
  const trimmed = words.map((w) => {
    const from = Math.max(0, w.start), to = Math.min(w.end, n - 1);
    const reach = ENDS_SENTENCE.test(w.text) ? Math.min(to, from + closeReachMs) : to;
    let i = from; while (i < reach && !(lev[i] > line && holds(i, reach))) i++;
    if (i >= reach) return { ...w, end: Math.min(w.end, from + 250) };
    let last = i;
    for (let j = i; j < to; j++) { if (lev[j] > line) last = j; else if (j - last > gapMs) break; }
    const start = Math.max(from, i - 15);
    const end = Math.max(start + 40, Math.min(w.end, last + 30, start + maxWordMs));
    return { ...w, start, end };
  });
  // every layer downstream reads the words in order: none starts before the one before it has ended
  for (let i = 1; i < trimmed.length; i++) {
    if (trimmed[i].start < trimmed[i - 1].end) trimmed[i].start = trimmed[i - 1].end;
    if (trimmed[i].end < trimmed[i].start + 40) trimmed[i].end = trimmed[i].start + 40;
  }
  return trimmed;
}

function localWordsWith(engine, model, input, outStem, threads, vad = null) {
  const dtw = dtwOf(model);
  execFileSync(engine, [
    "-m", model, "-f", input,
    "-ml", "1", "-sow", ...(dtw ? ["-dtw", dtw] : []),
    ...(vad ? ["--vad", "-vm", vad] : []),
    "-oj", "-of", outStem,
    // as many threads as the machine has cores, eight at most: eight threads on a four core laptop
    // oversubscribe it and run slower than four
    "-t", threads, "-np", "-l", flag("--lang", "en"),
  ], { stdio: ["ignore", "ignore", "inherit"] });
  const raw = JSON.parse(readFileSync(`${outStem}.json`, "utf8"));
  const lines = [];
  for (const s of raw.transcription ?? []) {
    const text = (s.text ?? "").trim();
    if (!text) continue;   // annotations stay as evidence and are separated before saving words
    const o = s.offsets ?? {};
    const start = Math.round(o.from ?? 0), end = Math.round(o.to ?? 0);
    if (end <= start) continue;
    lines.push({ start, end, text });
  }
  return lines;
}

// whisper-1 returns the sentences with their punctuation and, separately, a list of bare words with
// times that is not always complete (the same minute came back once with 193 words and once with
// 207). The sentences are the truth about the words, so their tokens are kept verbatim and aligned to
// the timed list; a token the list skipped takes its time from the gap between its neighbours.
export function wordsFromVerbose(data) {
  const timed = (data.words ?? []).map((w) => ({ start: Math.round(w.start * 1000), end: Math.round(w.end * 1000), text: String(w.word ?? "").trim() })).filter((w) => w.text && w.end >= w.start);
  const tokens = (data.segments ?? []).filter(s => !/^\[[\s\S]*\]$/.test(String(s.text ?? '').trim())).flatMap((s) => String(s.text ?? "").trim().split(/\s+/).filter(Boolean));
  if (!tokens.length) return timed;
  const norm = (t) => t.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  // longest common subsequence between the tokens and the timed words, on the bare form
  const n = tokens.length, m = timed.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = norm(tokens[i]) === norm(timed[j].text) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const at = new Array(n).fill(null);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (norm(tokens[i]) === norm(timed[j].text)) { at[i] = timed[j]; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  // unmatched tokens share the gap between the matched neighbours, by their length
  const out = tokens.map((text, i) => ({ start: at[i]?.start ?? null, end: at[i]?.end ?? null, text }));
  const lastEnd = timed.length ? timed[timed.length - 1].end : 0;
  for (let i = 0; i < n;) {
    if (out[i].start !== null) { i++; continue; }
    let k = i; while (k < n && out[k].start === null) k++;
    const from = i ? out[i - 1].end : 0, to = k < n ? out[k].start : Math.max(from + 250 * (k - i), lastEnd);
    const weights = out.slice(i, k).map((w) => Math.max(1, norm(w.text).length)), total = weights.reduce((a, b) => a + b, 0);
    let t = from;
    for (let x = i; x < k; x++) { const d = Math.max(40, Math.round(((to - from) * weights[x - i]) / total)); out[x].start = t; out[x].end = Math.min(to, t + d); t = out[x].end; }
    i = k;
  }
  // the timed list overlaps itself by tens of milliseconds and holds words of no length; every layer
  // downstream reads the words in order, so each word starts where the previous ended at the earliest
  // and lasts at least 40 ms
  for (let i = 0; i < out.length; i++) {
    if (i && out[i].start < out[i - 1].end) out[i].start = out[i - 1].end;
    if (out[i].end <= out[i].start) out[i].end = Math.min(i + 1 < out.length && out[i + 1].start > out[i].start + 40 ? out[i + 1].start : out[i].start + 120, out[i].start + 120);
    if (out[i].end < out[i].start + 40) out[i].end = out[i].start + 40;
  }
  return out;
}
async function cloudWords() {
  const mp3 = join(work, "_asr.mp3");
  execFileSync(ffbin("ffmpeg"), ["-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "64k", mp3], { stdio: "inherit" });
  const form = new FormData();
  form.append("file", new Blob([readFileSync(mp3)], { type: "audio/mpeg" }), "audio.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  form.append("language", flag("--lang", "en"));
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  rmSync(mp3, { force: true });
  if (!res.ok) throw new Error(`OpenAI answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  recognizedEvents = partitionTranscript((data.segments ?? []).map(s => ({start:Math.round(s.start*1000),end:Math.round(s.end*1000),text:s.text}))).events;
  return wordsFromVerbose(data);
}

let lines = [], how = "", recognizedEvents = [];
if (wantApple) { lines = appleWords(wav); if (lines.length) how = "Apple speech, through auto-editor"; }
if (!lines.length && useCloud) {
  try { lines = trimToVoice(await cloudWords(), wav); how = "whisper-1 (OpenAI), trimmed to the voice"; }
  catch (e) { console.log(`warn  the cloud transcription failed (${String(e.message).slice(0, 160)}); transcribing here instead`); }
}
if (!lines.length) {
  const engine = await getEngine();
  const model = await getModel(flag("--model"));
  // A long clip on a slow machine: time the first thirty seconds, say what the whole will cost and the
  // way out, then do it anyway. Nothing waits on an answer.
  if (!wantLocal && !process.env.OPENAI_API_KEY && clipSeconds > 180) {
    const probe = join(work, "_asr_probe.wav"), probeStem = join(work, "_asr_probe");
    execFileSync(ffbin("ffmpeg"), ["-v", "error", "-y", "-i", wav, "-t", "30", "-c:a", "copy", probe], { stdio: "inherit" });
    const t0 = Date.now();
    try { localWordsWith(engine, model, probe, probeStem, threads); } catch { /* the probe is only a measurement */ }
    const estimate = ((Date.now() - t0) / 1000) * (clipSeconds / 30);
    for (const f of [probe, `${probeStem}.json`]) rmSync(f, { force: true });
    if (estimate > 120) console.log(`note  transcribing this ${Math.round(clipSeconds / 60)} min clip here takes about ${Math.round(estimate / 60)} min on this machine. Optional: with an OpenAI key it takes seconds (about a cent per minute of clip; the audio leaves the machine for that call only). To offer it: node scripts/keys/server.mjs --keys OPENAI_API_KEY, then run this again. Carrying on here.`);
  }
  const vad = await getVad(engine);
  lines = trimToVoice(localWordsWith(engine, model, wav, stem, threads, vad), wav);
  how = `whisper.cpp ${basename(model)}${vad ? ", voice detection" : ""}, trimmed to the voice`;
}
const partitioned = partitionTranscript(lines);
lines = partitioned.words;
recognizedEvents.push(...partitioned.events);
writeFileSync(resolve(out) + '.events.json', JSON.stringify({version:1, events:recognizedEvents}, null, 2) + '\n');
if (!lines.length) fail("no speech found in that file");
writeFileSync(resolve(out), lines.map((w) => JSON.stringify(w)).join("\n") + "\n");
for (const f of [wav, `${stem}.json`]) if (existsSync(f)) rmSync(f);
const dur = lines.at(-1).end / 1000;
console.log(`words   ${lines.length} words over ${dur.toFixed(1)}s -> ${out} (${how})`);
console.log("next: read it. The fixes go in before anything is built from it, because a caption can be more correct than the audio and a wrong word is repeated on every layer after this one.");
