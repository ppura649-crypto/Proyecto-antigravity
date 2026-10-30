#!/usr/bin/env node
// reach.mjs [--json] [--format <group id>]
//
// Goal
//   Before anything is picked, say what this account's own numbers are: which shapes of post reach
//   people, by how much against the account's own middle, and what this folder has shipped since.
//
// Reasoning
//   A pick made without this is a pick made about the internet rather than about the buyer. Reach is
//   only ever read against the account's own median, never against a number from somewhere else: an
//   account whose middle post reaches 1,600 and one whose middle post reaches 120,000 are both
//   healthy, and the only useful question is which of THEIR posts beat THEIR middle.
//
//   The second half is the loop, and it is the half that makes the next pick different from the last.
//   A folder that never looks at what it shipped proposes the same three lanes forever while the
//   numbers say something else. That half is empty until a shipped reel is matched to a posted code,
//   and this says so plainly rather than printing zero and letting it read as a result.
//
// Counter-examples
//   Comparing a buyer's reach to another account's. Reporting an average, which one viral post owns.
//   Calling a format weak when the weak posts in it were sponsored. Printing an empty shipped half as
//   though it were a measurement. Reading the buyer's own written notes: this reads the numbers, and
//   what the groups MEAN is in context/formats.md, which a script never opens.
//
// Contract: reads context/formats.json and context/posts.json, writes nothing. Prints one line per
//   group, biggest median first, then the folder's own shipped posts. --json gives
//   { ok, account: { posts, median }, groups: [...], shipped: [...], matched, note }.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { P, readJson } from "./_lib.mjs";

const argv = process.argv.slice(2);
const formats = readJson(P("context", "formats.json"), null);
const posts = readJson(P("context", "posts.json"), []);
if (!formats) { console.error("no context/formats.json; run /start first"); process.exit(1); }

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : 0; };
const reachOf = (p) => (typeof p?.metrics?.reach === "number" ? p.metrics.reach : null);
const all = posts.map(reachOf).filter((r) => typeof r === "number");
const accountMedian = median(all);

const groups = (formats.formats ?? [])
  .map((g) => ({
    id: g.id,
    shape: g.name,
    posts: g.count ?? (g.posts?.length ?? 0),
    median: g.median_reach ?? null,
    average: g.average_reach ?? null,
    // Against the account's own middle, which is the only comparison that means anything.
    times: g.median_reach && accountMedian ? Number((g.median_reach / accountMedian).toFixed(2)) : null,
  }))
  .filter((g) => g.posts > 0)
  .sort((a, b) => (b.median ?? 0) - (a.median ?? 0));

// What this folder has shipped. A shipped reel counts as measured only once someone has written the
// posted code beside it; until then it is shipped and unmeasured, and saying so is the point.
const outDir = P("workspace", "output");
const shipped = (existsSync(outDir) ? readdirSync(outDir, { withFileTypes: true }).filter((e) => e.isDirectory()) : []).map((e) => {
  const t = readJson(join(outDir, e.name, "tracker.json"), null);
  const rows = Array.isArray(t) ? t : (t?.posts ?? []);
  const codes = rows.map((r) => r.code ?? r.posted_code ?? null).filter(Boolean);
  const found = codes.map((c) => posts.find((p) => p.code === c)).filter(Boolean);
  return {
    folder: e.name,
    format: e.name.split("-").slice(3, -1).join("-") || null,
    versions: rows.length,
    codes,
    reach: found.map(reachOf).filter((r) => typeof r === "number"),
  };
});
const matched = shipped.filter((s) => s.reach.length);

const out = {
  ok: true,
  account: { posts: all.length, median: accountMedian },
  groups,
  shipped,
  matched: matched.length,
  note: matched.length
    ? null
    : "Nothing this folder shipped has a posted code beside it yet, so no reel of ours has been measured. Add the code to the post's tracker.json once it is up, and the next run compares it to the account's own middle.",
};

if (argv.includes("--json")) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`${all.length} posts read, the account's middle post reaches ${accountMedian.toLocaleString("en-US")}.\n`);
console.log("group  posts   median  vs middle  shape");
for (const g of groups) {
  console.log(`${String(g.id).padEnd(6)} ${String(g.posts).padStart(5)}  ${String(g.median ?? "?").padStart(7)}  ${(g.times ? `${g.times}x` : "?").padStart(9)}  ${g.shape}`);
}
console.log(`\nWhat the group MEANS is in context/formats.md, beside this file. Read it before proposing a lane.`);
console.log(`\n${shipped.length} post${shipped.length === 1 ? "" : "s"} shipped from this folder.`);
for (const s of shipped) console.log(`  ${s.folder}  ${s.versions} version${s.versions === 1 ? "" : "s"}  ${s.reach.length ? `reached ${s.reach.join(", ")}` : "not measured yet"}`);
if (out.note) console.log(`\n${out.note}`);
