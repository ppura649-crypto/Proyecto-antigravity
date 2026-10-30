#!/usr/bin/env node
// check-caption.mjs <caption.txt> [--answers context/answers.json] [--previous workspace/output] [--self <this video's own output folder>] [--screen-keyword WORD]
// Contract: prints one line per failed check, exits 1 when any fails, exits 0 and prints "ok" when none fail.
// Checks: em or en dash; hashtag; first line over 125 chars; comment line rules by automation; keyword rules;
//         length 600 to 2200; a close line; the follow line with a DM promise; keyword reuse across output/.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
if (!file) { console.error("usage: check-caption.mjs <caption.txt> [--answers context/answers.json] [--previous workspace/output] [--self <this video's own output folder>] [--screen-keyword WORD]"); process.exit(2); }

const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
const answersPath = opt("--answers", "context/answers.json");
const previousDir = opt("--previous", "workspace/output");
const screenKeyword = opt("--screen-keyword", null);
const selfDir = opt("--self", null); // a re-delivery of the same video is not a reuse of its keyword
let automation = null;
if (existsSync(answersPath)) {
  try { automation = Boolean(JSON.parse(readFileSync(answersPath, "utf8"))?.funnel?.dm_automation?.enabled); } catch { automation = null; }
}

const fails = [];
const lines = text.split("\n");
const first = lines[0] ?? "";
const nonEmpty = lines.filter((l) => l.trim());
const last = nonEmpty[nonEmpty.length - 1] ?? "";
const commentLine = /^comment\s+["\u201c\u2018']?([A-Z][A-Z0-9]{2,})["\u201d\u2019']?(?=[\s,.!:]|$)/i.exec(first); // the keyword may sit in straight or curly quotes
const keyword = commentLine ? commentLine[1] : null;

if (/[\u2014\u2013]/.test(text)) fails.push("em or en dash found; use a comma, a colon or a full stop");
if (/(^|\s)#\w+/.test(text)) fails.push("hashtag found; keywords go in the sentences");
if (first.length > 125) fails.push(`first line is ${first.length} characters; keep it under 125 so it shows before "more"`);
if (text.length < 600) fails.push(`caption is ${text.length} characters; the value is not complete under 600`);
if (text.length > 2200) fails.push(`caption is ${text.length} characters; over 2,200 gets cut`);

if (automation === true) {
  if (!commentLine) fails.push("automation is on but the first line is not a comment line (Comment WORD and ...)");
  if (keyword && keyword !== keyword.toUpperCase()) fails.push("keyword must be capitals");
  if (!/follow first/i.test(text)) fails.push("a DM is promised but the follow line is missing: (follow first so my DM reaches you)");
} else if (automation === false) {
  if (commentLine) fails.push("no automation in answers.json, so the caption must not ask for a comment; open with the promise");
  if (/follow first/i.test(text)) fails.push("no automation, so drop the follow line");
} else if (commentLine && !/follow first/i.test(text)) {
  fails.push("comment line without the follow line; add it or remove the comment line");
}

if (keyword && screenKeyword && keyword !== screenKeyword.toUpperCase()) fails.push(`keyword ${keyword} differs from the on-screen keyword ${screenKeyword.toUpperCase()}`);
if (keyword && existsSync(previousDir)) {
  for (const dir of readdirSync(previousDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    if (selfDir && (dir.name === selfDir || selfDir.endsWith("/" + dir.name))) continue;
    const p = join(previousDir, dir.name, "caption.txt");
    if (!existsSync(p) || p === file) continue;
    const prevFirst = readFileSync(p, "utf8").split("\n")[0] ?? "";
    const m = /^comment\s+([A-Z][A-Z0-9]{2,})\b/i.exec(prevFirst);
    if (m && m[1].toUpperCase() === keyword.toUpperCase()) { fails.push(`keyword ${keyword} was already used in ${dir.name}`); break; }
  }
}

const closeWords = /\b(save|send|share|run|try|screenshot|keep|use|start|steal)\b/i;
const closeCandidates = nonEmpty.slice(-3).filter((l) => !/follow first/i.test(l));
if (!closeCandidates.some((l) => closeWords.test(l) && l.length <= 160)) fails.push("no close line; end with what to do with it (save, send, run prompt 2)");

const emoji = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
if (emoji > 1) fails.push(`${emoji} emoji; at most one, at the end of the first line`);
if (/[A-Z]{6,}\s+[A-Z]{4,}\s+[A-Z]{4,}/.test(text.replace(commentLine?.[0] ?? "", ""))) fails.push("an all-caps sentence; sentence case");

if (fails.length) { for (const f of fails) console.log(`fail: ${f}`); process.exit(1); }
console.log("ok");
