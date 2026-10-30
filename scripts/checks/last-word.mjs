#!/usr/bin/env node
// checks/last-word.mjs <project-dir> <args-json>
// args: { final = "renders/final.mp4", words = "words.json", margin = 150, wordsTimeline = "source" }
// Paths relative to the project. Source words map through spine-map.json when a cut exists.
// Contract: proves the last word the transcript measured is inside the finished file, with room after it.
//   A file that ends a few frames early takes the last word with it, and the one thing a viewer remembers
//   is a sentence that stops before its end. The transcript is the only place that knows when the talking
//   stops, so it is read rather than judged. Prints one JSON line:
//   { name, value: <the milliseconds left after the last word>, threshold, pass, reason }.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffbin, run } from "../_lib.mjs";

const dir = resolve(process.argv[2] || "");
const args = JSON.parse(process.argv[3] || "{}");
const margin = args.margin ?? 150;
const say = (o) => { console.log(JSON.stringify({ name: "last-word", threshold: `${margin} ms`, ...o })); process.exit(0); };
const at = (p) => (p.startsWith("/") ? p : join(dir, p));
const final = at(args.final ?? "renders/final.mp4");
const wordsPath = at(args.words ?? "words.json");

for (const [what, p] of [["the finished file", final], ["the words", wordsPath]])
  if (!existsSync(p)) say({ value: null, pass: false, reason: `${what} is missing: ${p}` });

// words.json is one measured word per line, and older clips carry the same words as a single array.
function readWords(path) {
  const content = readFileSync(path, "utf8").trim();
  if (!content) return [];
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : data.words ?? data.segments ?? [data];
  } catch {
    return content.split("\n").filter((line) => line.trim()).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  }
}
const words = readWords(wordsPath).map(word => ({
  start:Number(word.start ?? word.fromMs ?? word.atMs), end:Number(word.end ?? word.toMs ?? word.atMs),
})).filter(word => Number.isFinite(word.start) && Number.isFinite(word.end) && word.end > word.start);
let measured = words.map(word => ({end:word.end})), map = null;
// Source milliseconds and edited-video milliseconds are different clocks. A removed take
// has no place in the finished video and cannot determine its last word.
if (args.wordsTimeline !== 'output' && existsSync(join(dir,'spine-map.json'))) {
  try { map = JSON.parse(readFileSync(join(dir,'spine-map.json'),'utf8')); }
  catch { say({value:null,pass:false,reason:'the cut time map cannot be read'}); }
  if (!map.segments?.length || map.segments.some(s => ![s.srcInMs,s.srcOutMs,s.spineInMs,s.spineOutMs].every(Number.isFinite) || s.srcOutMs <= s.srcInMs || s.spineOutMs <= s.spineInMs))
    say({value:null,pass:false,reason:'the cut time map has invalid intervals'});
  measured = words.flatMap(word => {
    const held = map.segments.map(segment => ({segment,share:Math.max(0,Math.min(word.end,segment.srcOutMs)-Math.max(word.start,segment.srcInMs))})).sort((a,b)=>b.share-a.share)[0];
    if (!held?.share) return [];
    const s=held.segment, rate=(s.spineOutMs-s.spineInMs)/(s.srcOutMs-s.srcInMs);
    // Do not clamp a shaved word to the cut edge: its missing ending must still fail.
    return [{end:s.spineInMs+(word.end-s.srcInMs)*rate,segment:s}];
  });
} else if (args.wordsTimeline !== 'output' && existsSync(join(dir,'cuts.json'))) {
  say({value:null,pass:false,reason:'a cut video needs its source-to-output time map'});
}
if (!measured.length) say({ value: null, pass: false, reason: "no measured word ends inside the kept video" });
const lastWord=measured.sort((a,b)=>b.end-a.end)[0], last=lastWord.end;

const ffprobe = ffbin("ffprobe");
if (!ffprobe) say({ value: null, pass: false, reason: "ffprobe is missing; run doctor" });
// The word is either in the sound or it is not, so the sound track is what is measured. Some files carry
// no length on the track itself, and then the container's own length is the only number there is.
const length = (entries, stream) => {
  try { return Number(run(ffprobe, ["-v", "error", ...(stream ? ["-select_streams", "a:0"] : []), "-show_entries", entries, "-of", "csv=p=0", final]).trim()) || 0; } catch { return 0; }
};
const seconds = length("stream=duration", true) || length("format=duration", false);
if (!seconds) say({ value: null, pass: false, reason: "the finished file has no length anything can read" });

const value = Math.round(seconds * 1000 - last);
let tailNote='';
if (map && lastWord.segment?.id === map.segments.at(-1)?.id && existsSync(join(dir,'cuts.json'))) {
  try { tailNote=JSON.parse(readFileSync(join(dir,'cuts.json'),'utf8')).clips?.find(c=>c.keep && c.id===lastWord.segment.id)?.tailNote ?? ''; } catch { /* no cut decision to apply */ }
}
const capped = value > 0 && value < margin && typeof tailNote === 'string' && tailNote.trim().length > 0;
const pass = value >= margin || capped;
say({
  value, pass,
  reason: capped ? `the complete last word has ${value} ms after it; the reviewed cut caps the tail: ${tailNote}` : pass
    ? `the last word ends at ${last} ms and the file runs ${value} ms past it`
    : `the last word ends at ${last} ms and the file ends ${Math.abs(value)} ms ${value < 0 ? "before that" : "later"}; the end of the sentence is cut off`,
});
