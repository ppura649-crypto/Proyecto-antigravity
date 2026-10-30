#!/usr/bin/env node
import { referencePosts } from './reading-policy.mjs';
// captions.mjs [--format f2] [--top 10]
// Contract: turns the captions of the account's posts into the caption system, measured, so a caption we write is
//   written to the buyer's own shape and never to a house style. Reads context/posts.json and context/formats.json,
//   measures every caption with lib/caption.mjs (the same function checks/captionfit.mjs runs on every caption we
//   write) and writes context/captions.json:
//   { account: <group>, formats: [ <group> ], read_at }
//   where a group is { id, name, posts_read, chars, first_line, blocks, facts: { median, share, mark },
//     link: share, keyword: share, opens: [ { words, count, median_reach } ], closes: [ ... ],
//     marks: { hashtag, emoji, exclamation, question, em_dash } as the share of posts using each,
//     by_length: [ { bucket, count, median_reach } ], by_link: { with, without }, by_keyword: { with, without },
//     top: [ { id, reach, chars, first_line, facts, link, keyword, opens, closes, caption } ] }
//   `account` is every post with a caption; the formats are the same reading per format of context/formats.json, so a
//   format that writes differently is visible. A share is 0 to 1. Reach is the account's reach per post.
//   The JSON is for the scripts and the checks; the agent reads it and writes context/voice.md beside it, which is
//   what a caption is written from. Numbers in the JSON, what to write in the markdown, the pair rule.
//   Nothing here judges a caption. It says what the account does, and the check compares against it.
//   Exits 1 when context/posts.json is missing.
import { P, readJson, writeJson, now, fail } from "./_lib.mjs";
import { measure } from "./lib/caption.mjs";

const args = process.argv.slice(2);
const only = args.includes("--format") ? args[args.indexOf("--format") + 1] : null;
const TOP = args.includes("--top") ? Number(args[args.indexOf("--top") + 1]) || 10 : 10;
const posts = referencePosts();
if (!posts) fail("context/posts.json missing; run: node scripts/profile.mjs");
const formats = process.env.KEYFRAMES_READING_SCOPE === 'account' ? [] : readJson(P("context", "formats.json"), { formats: [] }).formats ?? [];

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const stat = (a) => ({ median: median(a), p25: q(a, 0.25), p75: q(a, 0.75), min: a.length ? Math.min(...a) : 0, max: a.length ? Math.max(...a) : 0 });
const share = (n, d) => (d ? Math.round((n / d) * 100) / 100 : 0);
const reachOf = (p) => p?.metrics?.reach ?? 0;

const read = posts.filter((p) => String(p.caption ?? "").trim()).map((p) => ({ id: p.id, reach: reachOf(p), caption: p.caption.trim(), m: measure(p.caption) }));

// The two word runs an account repeats at the head and the foot of its captions, with what they reached. "save this"
// on half the posts is the account's close, and a version that ends another way is not this account's caption.
function repeats(rs, key) {
  const g = {};
  for (const r of rs) { const k = r.m[key]; if (!k) continue; (g[k] ??= []).push(r); }
  return Object.entries(g).map(([words, xs]) => ({ words, count: xs.length, share: share(xs.length, rs.length), median_reach: median(xs.map((x) => x.reach)) }))
    .filter((x) => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 8);
}
function split(rs, pred) {
  const w = rs.filter(pred), wo = rs.filter((r) => !pred(r));
  return { with: { count: w.length, median_reach: median(w.map((r) => r.reach)) }, without: { count: wo.length, median_reach: median(wo.map((r) => r.reach)) } };
}
function group(id, name, rs) {
  if (!rs.length) return { id, name, posts_read: 0 };
  const marks = {};
  for (const [k, f] of [["hashtag", "hashtags"], ["emoji", "emoji"], ["exclamation", "exclamations"], ["question", "questions"], ["em_dash", "em_dashes"]]) marks[k] = share(rs.filter((r) => r.m[f] > 0).length, rs.length);
  const markCount = {}; for (const r of rs) if (r.m.fact_mark) markCount[r.m.fact_mark] = (markCount[r.m.fact_mark] ?? 0) + 1;
  const buckets = (n) => (n < 500 ? "under 500" : n < 800 ? "500 to 800" : n < 1200 ? "800 to 1200" : "over 1200");
  const byLen = {}; for (const r of rs) (byLen[buckets(r.m.chars)] ??= []).push(r);
  return {
    id, name, posts_read: rs.length,
    chars: stat(rs.map((r) => r.m.chars)),
    first_line: { ...stat(rs.map((r) => r.m.first_line)), under_125: share(rs.filter((r) => r.m.first_under_125).length, rs.length) },
    blocks: stat(rs.map((r) => r.m.blocks)),
    facts: { median: median(rs.map((r) => r.m.facts)), share: share(rs.filter((r) => r.m.facts >= 3).length, rs.length), mark: Object.entries(markCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null },
    link: share(rs.filter((r) => r.m.link).length, rs.length),
    keyword: share(rs.filter((r) => r.m.keyword).length, rs.length),
    opens: repeats(rs, "opens"), closes: repeats(rs, "closes"),
    marks,
    by_length: Object.entries(byLen).map(([bucket, xs]) => ({ bucket, count: xs.length, median_reach: median(xs.map((x) => x.reach)) })).sort((a, b) => b.count - a.count),
    by_link: split(rs, (r) => r.m.link), by_keyword: split(rs, (r) => !!r.m.keyword),
    top: [...rs].sort((a, b) => b.reach - a.reach).slice(0, TOP).map((r) => ({ id: r.id, reach: r.reach, chars: r.m.chars, first_line: r.m.first_line, facts: r.m.facts, fact_mark: r.m.fact_mark, link: r.m.link, keyword: r.m.keyword, opens: r.m.opens, closes: r.m.closes, caption: r.caption })),
  };
}

const byId = Object.fromEntries(read.map((r) => [r.id, r]));
const out = { account: group("account", "every post with a caption", read), formats: [], read_at: now() };
for (const f of formats) {
  if (only && f.id !== only) continue;
  out.formats.push(group(f.id, f.name, (f.posts ?? []).map((p) => byId[p.id]).filter(Boolean)));
}
const previous = readJson(P('context', 'captions.json'), {});
if (process.env.KEYFRAMES_READING_SCOPE === 'trial-reels' && previous.account) out.account = previous.account;
if (process.env.KEYFRAMES_READING_SCOPE === 'account') out.formats = previous.formats ?? [];
writeJson(P("context", "captions.json"), out);

const say = (g) => {
  if (!g.posts_read) { console.log(`${g.id} ${g.name}: no caption`); return; }
  console.log(`\n${g.id} ${g.name}: ${g.posts_read} captions`);
  console.log(`  ${g.chars.median} characters (${g.chars.p25} to ${g.chars.p75}), first line ${g.first_line.median}, ${Math.round(g.first_line.under_125 * 100)}% under 125, ${g.blocks.median} blocks`);
  console.log(`  ${g.facts.median} fact lines${g.facts.mark ? ` marked with ${g.facts.mark}` : ""}, three or more in ${Math.round(g.facts.share * 100)}%; a link in ${Math.round(g.link * 100)}%, a comment keyword in ${Math.round(g.keyword * 100)}%`);
  if (g.opens.length) console.log(`  opens: ${g.opens.slice(0, 4).map((x) => `"${x.words}" x${x.count}`).join(", ")}`);
  if (g.closes.length) console.log(`  closes: ${g.closes.slice(0, 4).map((x) => `"${x.words}" x${x.count} (median ${x.median_reach})`).join(", ")}`);
  console.log(`  marks: ${Object.entries(g.marks).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(", ")}`);
};
say(out.account);
for (const f of out.formats) say(f);
