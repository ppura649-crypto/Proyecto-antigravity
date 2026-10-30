#!/usr/bin/env node
// textsystem.mjs [--format f2] [--top 12]
// Contract: turns the on-screen text readings (context/text/<id>.json, from text.mjs) into the text system of each
//   format in context/formats.json: how a line is built on this account, measured, so new lines are written to fit
//   and never asked for. Writes context/text-system.json:
//   { formats: [ { id, name, posts_read, set_in: "one size" | "two sizes", big: { rows: { median, min, max }, chars_per_row: { median, min, max, p90 },
//       chars_total: { median, min, max }, words: { median }, case: { sentence, lower, title, upper }, starts: [ { word, count } ],
//       has_number: share, has_name: share, has_you: share, punctuation: { comma, colon, question, quote } },
//       small: { rows: { median, min, max }, chars_per_row: { median, max }, fixed_rows: [ { text, count } ], numbered: share },
//       shapes: [ { shape, count, median_reach, example } ], by_length: [ { bucket, count, median_reach } ],
//       by_number: { with: { count, median_reach }, without: { ... } }, by_name: { ... },
//       top: [ { id, reach, big: [rows], small: [rows] } ] } ], read_at }
//   A shape is a coarse pattern read off the big rows: contrast (two sides set against each other: "X vs Y",
//   "Everyone X, Nobody Y", "charges millions, open-sourced"), number on number (two figures), superlative (first,
//   fastest, -est, only), owned ("your ..."), equals (a stack headline starting with "="), plain (none of these).
//   Reach is the account's total reach per post. The JSON is for the scripts: checks/textbudget.mjs compares every new
//   line against it, so it is never deleted. The agent reads it and writes context/text-system.md, its own file and not a
//   section of formats.md, shape in .agents/skills/start/references/text-system.md: what the line is, the budget per row,
//   the shapes with their reach, the lines that worked and lines written to the system, counter-examples, and what is
//   fixed and what is free. Numbers live in the JSON; what a line is written from lives in the markdown.
import { P, readJson, writeJson, now, fail } from "./_lib.mjs";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const only = args.includes("--format") ? args[args.indexOf("--format") + 1] : null;
// A reading under either of these is measured but never quoted, and never sets the budget: a line with holes in it,
// copied as a model, becomes a line the buyer never wrote, and a block read three rows out of five reports a budget
// a third short. Sure of its characters (confidence) and whole (completeness) are two different things and a reading
// needs both. Marked `quotable: false` and shown with a tilde, so the agent writes from the clean ones.
const QUOTE = 82, WHOLE = 0.7;
const readWell = (t) => (t?.confidence ?? 0) >= QUOTE && (t?.completeness ?? 0) >= WHOLE;
const TOP = args.includes("--top") ? Number(args[args.indexOf("--top") + 1]) || 12 : 12;
const formats = readJson(P("context", "formats.json"), { formats: [] }).formats ?? [];
const posts = Object.fromEntries((readJson(P("context", "posts.json"), []) ?? []).map((p) => [p.id, p]));
if (!formats.length) fail("context/formats.json missing; run: node scripts/formats.mjs");

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const stat = (a) => ({ median: median(a), min: a.length ? Math.min(...a) : 0, max: a.length ? Math.max(...a) : 0, p90: q(a, 0.9) });
const reachOf = (id) => posts[id]?.metrics?.reach ?? 0;
const share = (n, d) => (d ? Math.round((n / d) * 100) / 100 : 0);

const caseOf = (t) => { const w = t.replace(/^[=\s]+/, "").split(/\s+/).filter((x) => /[A-Za-z]/.test(x)); if (!w.length) return "none"; const caps = w.filter((x) => /^[A-Z]/.test(x)).length; if (w.every((x) => x === x.toUpperCase() && /[A-Z]/.test(x))) return "upper"; if (caps === 0) return "lower"; if (caps >= Math.ceil(w.length * 0.7)) return "title"; return "sentence"; };
const hasNumber = (t) => /\d/.test(t);
const hasName = (t) => t.replace(/^[=\s]+/, "").split(/\s+/).slice(1).some((x) => /^[A-Z][a-zA-Z0-9.-]{2,}/.test(x) && !/^(AI|GPU|CPU|RAM|PDF|OCR|API|CLI|No|The|And|Or|But|It|Is|In|On|Of|For|To|With|Your|You|Here|What|Now|Free|Open|New)$/.test(x));
const shapeOf = (rows) => {
  const t = rows.join(" ");
  if (/^=\s/.test(t)) return "equals";
  if (/\bvs\.?\b|\bversus\b|\b(everyone|everybody|anyone)\b.*\b(nobody|no one|none)\b|\bcharges?\b.*\b(free|open)|\bbut\b|\binstead of\b|\bnot\b.*\bbut\b|,\s*(no|not|nobody|zero)\b/i.test(t)) return "contrast";
  if ((t.match(/\d[\d.,]*\s*(%|[kKmMbB]\b|GB|MB|TB|B\b|x\b)?/g) ?? []).length >= 2) return "number on number";
  if (/\b(first|fastest|smartest|laziest|best|biggest|smallest|only|most|strongest|cheapest|hardest|easiest|never|ever)\b|\w+est\b/i.test(t)) return "superlative";
  if (/\byour\b|\byou\b/i.test(t)) return "owned";
  return "plain";
};

const out = [];
for (const f of formats) {
  if (only && f.id !== only) continue;
  const raw = (f.posts ?? []).map((p) => ({ id: p.id, reach: p.reach ?? reachOf(p.id), t: readJson(P("context", "text", `${p.id}.json`), null) })).filter((r) => r.t && r.t.rows?.some((x) => x.size === "big"));
  if (!raw.length) { out.push({ id: f.id, name: f.name, posts_read: 0 }); continue; }
  // The band: where the format keeps its big rows (the tallest row of each post), as a share of the panel height.
  // Big rows outside the band by more than a fifth of the panel are a card's own title, not the line.
  const tallestRel = raw.map((r) => { const big = r.t.rows.filter((x) => x.size === "big"); return big.sort((a, b) => (b.y_rel ?? 0) - (a.y_rel ?? 0))[0]?.y_rel ?? 0; });
  const band = median(tallestRel);
  // The band drops a card's own title, which sits above the line on a panel format. A post read as one size has no
  // card title to drop: its whole block is the line, and cutting it to a band beheads the hook and reports a budget
  // a quarter of the real one. So the band applies only where the reader actually saw two sizes.
  const reads = raw.map((r) => { const one = (r.t.sizes ?? 2) === 1; const big = r.t.rows.filter((x) => x.size === "big" && (one || Math.abs((x.y_rel ?? band) - band) <= 0.22)).map((x) => x.text); const small = r.t.rows.filter((x) => x.size === "small").map((x) => x.text); return { ...r, one, t: { ...r.t, big, small } }; }).filter((r) => r.t.big.length);
  if (!reads.length) { out.push({ id: f.id, name: f.name, posts_read: 0 }); continue; }
  // The budget is measured on the readings clean enough to be a budget. A post read with holes in it comes back with
  // three of its five rows, and averaged in with the rest it reports a block a third shorter than the one on the
  // frame. The buyer then sees a row count on the page that disagrees with the lines printed under it. So when there
  // are enough clean reads, they alone set the rows, the characters and the shapes; otherwise all of them do and the
  // count says so.
  const clean = reads.filter((r) => readWell(r.t));
  const base = clean.length >= 4 ? clean : reads;
  const bigRows = base.flatMap((r) => r.t.big), smallRows = base.flatMap((r) => r.t.small);
  const rowCounts = base.map((r) => r.t.big.length), smallCounts = base.map((r) => r.t.small.length);
  const perRow = bigRows.map((x) => x.length), total = base.map((r) => r.t.big.join(" ").length), words = base.map((r) => r.t.big.join(" ").split(/\s+/).filter(Boolean).length);
  const cases = base.map((r) => caseOf(r.t.big.join(" "))); const caseCount = {}; for (const c of cases) caseCount[c] = (caseCount[c] || 0) + 1;
  const starts = {}; for (const r of base) { const w = r.t.big.join(" ").replace(/^=\s*/, "").split(/\s+/)[0]?.toLowerCase(); if (w) starts[w] = (starts[w] || 0) + 1; }
  const punct = { comma: share(base.filter((r) => /,/.test(r.t.big.join(" "))).length, base.length), colon: share(base.filter((r) => /:/.test(r.t.big.join(" "))).length, base.length), question: share(base.filter((r) => /\?/.test(r.t.big.join(" "))).length, base.length), quote: share(base.filter((r) => /["'“”]/.test(r.t.big.join(" "))).length, base.length) };
  const groups = (key) => { const g = {}; for (const r of base) { const k = key(r); (g[k] ??= []).push(r); } return Object.entries(g).map(([k, rs]) => ({ key: k, count: rs.length, median_reach: median(rs.map((x) => x.reach)), example: rs.sort((a, b) => b.reach - a.reach)[0].t.big.join(" / ") })).sort((a, b) => b.count - a.count); };
  const shapes = groups((r) => shapeOf(r.t.big)).map((g) => ({ shape: g.key, count: g.count, median_reach: g.median_reach, example: g.example }));
  const byLength = groups((r) => { const n = r.t.big.join(" ").length; return n <= 35 ? "up to 35 chars" : n <= 50 ? "36 to 50" : n <= 65 ? "51 to 65" : "over 65"; }).map((g) => ({ bucket: g.key, count: g.count, median_reach: g.median_reach }));
  const split2 = (pred) => { const w = base.filter(pred), wo = base.filter((r) => !pred(r)); return { with: { count: w.length, median_reach: median(w.map((r) => r.reach)) }, without: { count: wo.length, median_reach: median(wo.map((r) => r.reach)) } }; };
  const fixed = {}; for (const r of reads) for (const s of r.t.small) { const k = s.toLowerCase().replace(/[^a-z]/g, ""); if (k.length >= 12) fixed[k] = fixed[k] ? { ...fixed[k], count: fixed[k].count + 1 } : { text: s, count: 1 }; }
  out.push({
    id: f.id, name: f.name, posts_read: reads.length, band: Math.round(band * 100) / 100,
    set_in: reads.filter((r) => r.one).length > reads.length / 2 ? "one size" : "two sizes",
    big: { rows: stat(rowCounts), chars_per_row: stat(perRow), chars_total: stat(total), words: { median: median(words) }, case: caseCount, starts: Object.entries(starts).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 8), has_number: share(base.filter((r) => hasNumber(r.t.big.join(" "))).length, base.length), has_name: share(base.filter((r) => hasName(r.t.big.join(" "))).length, base.length), has_you: share(base.filter((r) => /\byou(r)?\b/i.test(r.t.big.join(" "))).length, base.length), punctuation: punct },
    small: { rows: stat(smallCounts), chars_per_row: stat(smallRows.map((x) => x.length)), fixed_rows: Object.values(fixed).filter((x) => x.count >= 3).sort((a, b) => b.count - a.count).slice(0, 5), numbered: share(smallRows.filter((x) => /^\d+[.)]/.test(x)).length, Math.max(1, smallRows.length)) },
    shapes, by_length: byLength, by_number: split2((r) => hasNumber(r.t.big.join(" "))), by_name: split2((r) => hasName(r.t.big.join(" "))),
    read_well: clean.length, measured_on: base.length === clean.length ? "the clean readings" : "every reading, too few clean ones",
    top: reads.sort((a, b) => b.reach - a.reach).slice(0, TOP).map((r) => ({ id: r.id, reach: r.reach, confidence: r.t.confidence ?? null, quotable: readWell(r.t), big: r.t.big, chars: r.t.big.map((x) => x.length), small: r.t.small })),
  });
}
writeJson(P("context", "text-system.json"), { formats: out, read_at: now() });
for (const f of out) {
  if (!f.posts_read) { console.log(`${f.id} ${f.name}: no text read`); continue; }
  console.log(`\n${f.id} ${f.name}: ${f.posts_read} posts read, set in ${f.set_in}`);
  console.log(`  ${f.set_in === "one size" ? "the block" : "big"}: ${f.big.rows.median} row(s), ${f.big.chars_per_row.median} chars a row (${f.big.chars_per_row.min} to ${f.big.chars_per_row.max}, p90 ${f.big.chars_per_row.p90}), ${f.big.chars_total.median} in all, ${f.big.words.median} words; case ${Object.entries(f.big.case).map(([k, v]) => `${k} ${v}`).join(", ")}; a number in ${Math.round(f.big.has_number * 100)}%, a name in ${Math.round(f.big.has_name * 100)}%, you in ${Math.round(f.big.has_you * 100)}%`);
  if (f.set_in === "two sizes") console.log(`  small: ${f.small.rows.median} rows of ${f.small.chars_per_row.median} chars (max ${f.small.chars_per_row.max}); numbered ${Math.round(f.small.numbered * 100)}%${f.small.fixed_rows.length ? `; fixed: ${f.small.fixed_rows.map((x) => `"${x.text}" x${x.count}`).join(", ")}` : ""}`);
  console.log(`  shapes: ${f.shapes.map((s) => `${s.shape} ${s.count} (median ${s.median_reach})`).join(" | ")}`);
  console.log(`  length: ${f.by_length.map((b) => `${b.bucket} ${b.count} (median ${b.median_reach})`).join(" | ")}`);
  console.log(`  number: with ${f.by_number.with.count} median ${f.by_number.with.median_reach}, without ${f.by_number.without.count} median ${f.by_number.without.median_reach}; name: with ${f.by_name.with.count} median ${f.by_name.with.median_reach}, without ${f.by_name.without.count} median ${f.by_name.without.median_reach}`);
  console.log(`  read well enough to quote: ${f.read_well} of ${f.posts_read}${f.read_well < f.posts_read ? "; the rest are measured but never copied as a line" : ""}`);
  for (const t of f.top.slice(0, 6)) console.log(`  ${String(t.reach).padStart(7)}  ${t.quotable ? "  " : "~ "}${t.big.join(" / ")}  [${t.chars.join("+")}]`);
}
