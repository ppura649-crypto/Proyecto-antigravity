#!/usr/bin/env node
import { referencePosts } from './reading-policy.mjs';
// formats.mjs [--min 5]
// Contract: groups the account's posts into formats from their structure readings (context/structure/<id>.json, written
//   by structure.mjs) and writes context/formats.json:
//   { formats: [ { id: "f1", name, layout, panel, panel_changes, split: { low, high, typical }, count, with_file,
//       total_reach, median_reach, average_reach, clips: { shot, timelapse, cuts, unknown }, panels: { cards, still, unknown },
//       posts: [ { id, reach, split_at, take, sound, first_line } ], takes: [ { id, count, posts, median_reach, motion, flow } ],
//       sounds: [ { id, count, median_reach } ], library_sound_posts, sheets: [ the sheets of the five top posts ] } ],
//     unplaced: [ { id, reason } ], read_at }
//   A format is where the panel sits, whether the panel changes during the clip (cards swapping) or holds still (one
//   text block), and where the split sits. Nothing else: what the clip does in its zone (one shot, a timelapse, cuts)
//   and how many cards the panel showed are details of a post, reported as counts, never a reason to split a format.
//   A full frame is one zone: every one-clip post (a shot or a timelapse, letterboxed or not, with text over it or not)
//   is one format, and a cut sequence is another, because the triage treats them differently. Takes are read there too.
//   Split points cluster around their densest value (a window of 0.05 each side); a group under --min posts folds into
//   the nearest group on the same side within 0.1 whose panel behaves the same, else into any group within 0.06, else
//   it stands alone and is named "small"; two groups on the same side with the same panel behaviour and centres within
//   0.08 are one format read at two split points. A post read from a thumbnail only (no file) joins the group on the same side
//   whose split range covers it, the nearest centre when two do. A take is a group of posts whose clip zone shows the same
//   flow numbers (structure.mjs): the same file, reused. Sounds come from context/sounds.json when it exists. Names are
//   built from the parts ("cards over a clip, split near 0.56"); the agent renames them in context/formats.md after
//   looking at the sheets. Measured 2026-09-04 on an account with two formats in 148 posts: both found, one small group
//   of four posts at a split of 0.27 left standing. Exits 1 when no structure reading exists.
import { P, readJson, writeJson, now, fail } from "./_lib.mjs";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const MINP = args.includes("--min") ? Number(args[args.indexOf("--min") + 1]) || 5 : 5;
const posts = referencePosts();
if (!posts) fail("context/posts.json missing; run: node scripts/profile.mjs");
const soundsFile = readJson(P("context", "sounds.json"), { posts: {} });
const readings = posts.map((p) => ({ post: p, s: readJson(P("context", "structure", `${p.id}.json`), null) })).filter((r) => r.s);
if (!readings.length) fail("no structure readings; run: node scripts/structure.mjs on every post");

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const reachOf = (p) => p.metrics?.reach ?? 0;
const firstLine = (p) => (p.caption ?? "").split("\n")[0].trim().slice(0, 80);

// What each reading says: the panel side, whether the panel changes, what the clip zone does.
function readOf(s) {
  if (s.layout !== "split") return { layout: "full", panel: null, changes: null, clip: s.source === "image" ? "unknown" : s.kind === "cut" ? "cuts" : s.flow && s.flow.max >= 20 && s.flow.p90 >= 3 ? "timelapse" : "shot", panelKind: null, bands: s.bands ?? {} };
  const panel = s.panel ?? (s.regions.top.dark ? "top" : "bottom"), clipSide = panel === "top" ? "bottom" : "top";
  const pr = s.regions[panel], cr = s.regions[clipSide];
  const changes = s.source === "image" ? null : pr.kind === "cut" || (pr.flow && pr.flow.max >= 15);
  const clip = s.source === "image" ? "unknown" : cr.kind === "cut" ? "cuts" : cr.motion === "timelapse" ? "timelapse" : "shot";
  return { layout: "split", panel, clipSide, changes, clip, panelKind: changes === null ? "unknown" : changes ? "cards" : "still" };
}
for (const r of readings) r.read = readOf(r.s);

// Groups from the video readings: side and panel behaviour first, then the split around its densest values.
const videos = readings.filter((r) => r.s.source === "video"), thumbs = readings.filter((r) => r.s.source !== "video");
const groups = [];
const byKey = new Map();
// A full frame is one zone: one clip (a shot or a timelapse, with or without a letterbox) is one format, a cut sequence another.
for (const v of videos) { const k = v.read.layout === "full" ? `full|${v.read.clip === "cuts" ? "cuts" : "clip"}` : `${v.read.panel}|${v.read.changes ? "cards" : "still"}`; (byKey.get(k) ?? byKey.set(k, []).get(k)).push(v); }
for (const [key, list] of byKey) {
  if (key.startsWith("full")) { groups.push({ key, layout: "full", panel: null, changes: null, clipKind: key.split("|")[1], members: list }); continue; }
  let pool = [...list];
  while (pool.length) {
    const dens = pool.map((a) => pool.filter((b) => Math.abs(b.s.split_at - a.s.split_at) <= 0.02).length);
    const seed = pool[dens.indexOf(Math.max(...dens))].s.split_at;
    const near = pool.filter((r) => Math.abs(r.s.split_at - seed) <= 0.05);
    pool = pool.filter((r) => !near.includes(r));
    groups.push({ key, layout: "split", panel: near[0].read.panel, changes: near[0].read.changes, members: near });
  }
}
const center = (g) => median(g.members.map((m) => m.s.split_at));
// Small groups fold into the nearest large one: same side and same panel behaviour within 0.1, else any same side within 0.06.
let merged = true;
while (merged) {
  merged = false;
  const small = groups.filter((g) => g.layout === "split" && g.members.length < MINP).sort((a, b) => a.members.length - b.members.length)[0];
  if (!small) break;
  const big = groups.filter((g) => g !== small && g.layout === "split" && g.panel === small.panel && g.members.length >= MINP);
  const c = center(small);
  const target = big.filter((g) => g.changes === small.changes && Math.abs(center(g) - c) <= 0.1).sort((a, b) => Math.abs(center(a) - c) - Math.abs(center(b) - c))[0]
    ?? big.filter((g) => Math.abs(center(g) - c) <= 0.06).sort((a, b) => Math.abs(center(a) - c) - Math.abs(center(b) - c))[0];
  if (target) { target.members.push(...small.members); groups.splice(groups.indexOf(small), 1); merged = true; }
  else { small.standalone = true; if (groups.filter((g) => g.layout === "split" && g.members.length < MINP && !g.standalone).length === 0) break; }
}
// Two groups on the same side with the same panel behaviour and centres within 0.08 are one format read at two split points.
for (let again = true; again;) {
  again = false;
  const split = groups.filter((g) => g.layout === "split").sort((a, b) => b.members.length - a.members.length);
  for (const a of split) { const b = split.find((o) => o !== a && o.panel === a.panel && o.changes === a.changes && Math.abs(center(o) - center(a)) <= 0.08); if (b) { a.members.push(...b.members); groups.splice(groups.indexOf(b), 1); again = true; break; } }
}
for (const g of groups) if (g.layout === "split") { const sp = g.members.map((m) => m.s.split_at); g.low = Math.min(...sp); g.high = Math.max(...sp); }
// Thumbnails join the group on the same side whose split range covers them, the nearest centre when two do.
const unplaced = [];
for (const g of groups) g.centre = g.layout === "split" ? center(g) : null;
for (const t of thumbs) {
  const fit = groups.filter((g) => g.layout === t.read.layout && (g.layout !== "split" || (g.panel === t.read.panel && t.s.split_at >= g.low - 0.03 && t.s.split_at <= g.high + 0.03)) && (g.layout !== "full" || g.clipKind === "clip")).sort((a, b) => (a.layout === "split" ? Math.abs(a.centre - t.s.split_at) - Math.abs(b.centre - t.s.split_at) : 0) || b.members.length - a.members.length)[0];
  if (fit) fit.members.push(t); else unplaced.push({ id: t.post.id, reason: `no format with ${t.read.layout}${t.read.layout === "split" ? ` split ${t.s.split_at} panel ${t.read.panel}` : ""} read from a video` });
}

function pearson(a, b) { const n = Math.min(a.length, b.length); let sa = 0, sb = 0; for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; } const ma = sa / n, mb = sb / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : 0; }
// Takes: posts whose clip zone shows the same flow (the same file, reused). A post joins the first take within tolerance.
function takesOf(g) {
  const takes = [];
  for (const m of g.members) {
    if (m.s.source !== "video") continue;
    const region = g.layout === "split" ? m.s.regions[m.read.clipSide] : { flow: m.s.flow, kind: m.s.kind, motion: m.read.clip === "timelapse" ? "timelapse" : m.s.motion }; const fl = region?.flow; if (!fl) continue;
    // The same file shows the same motion series (Pearson over 0.9 on the first six seconds); the summary numbers alone
    // can agree between two different takes, so the series decides when both readings carry one.
    const same = (t) => (t.flow.series?.length >= 40 && fl.series?.length >= 40) ? pearson(t.flow.series, fl.series) >= 0.9 : Math.abs(t.flow.mean - fl.mean) <= 0.15 && Math.abs(t.flow.p90 - fl.p90) <= 0.5 && Math.abs(t.flow.max - fl.max) <= 1.5;
    let take = takes.find(same);
    if (!take) { take = { flow: fl, motion: region.kind === "cut" ? "cuts" : region.motion, posts: [] }; takes.push(take); }
    take.posts.push(m);
  }
  takes.sort((a, b) => b.posts.length - a.posts.length);
  takes.forEach((t, i) => { t.id = `t${i + 1}`; for (const m of t.posts) m.takeId = t.id; });
  return takes.map((t) => ({ id: t.id, count: t.posts.length, motion: t.motion, flow: t.flow, median_reach: median(t.posts.map((m) => reachOf(m.post))), posts: t.posts.map((m) => m.post.id) }));
}
const count = (list, key) => list.reduce((a, m) => ((a[m.read[key] ?? "unknown"] = (a[m.read[key] ?? "unknown"] || 0) + 1), a), {});
const nameOf = (g) => {
  if (g.layout !== "split") return g.clipKind === "cuts" ? "cuts, full frame" : "one clip, full frame";
  return `${g.changes ? "cards" : "still panel"} ${g.panel === "top" ? "over" : "under"} a clip, split near ${center(g).toFixed(2)}`;
};

// The agent identifies formats from previews first. Preserve those IDs and memberships;
// repeated clips and small framing shifts do not create a new format.
const review = process.env.KEYFRAMES_READING_SCOPE === 'trial-reels' ? readJson(P('context', 'trial-reels', 'review.json'), {}) : {};
if (review.formats?.length) {
  const known = review.formats.filter(f => f.id !== 'other').flatMap(f => {
    const members = readings.filter(m => (f.posts ?? []).includes(m.post.id) || review.posts?.[m.post.id]?.format === f.id);
    if (!members.length) return [];
    const m = members[0];
    return [{ id: f.id, name: f.name, layout: m.read.layout, panel: m.read.panel, changes: m.read.changes, clipKind: m.read.clip === 'cuts' ? 'cuts' : 'clip', members,
      low: Math.min(...members.map(m => m.s.split_at ?? 0)), high: Math.max(...members.map(m => m.s.split_at ?? 0)) }];
  });
  groups.splice(0, groups.length, ...known);
}
const out = groups.sort((a, b) => b.members.length - a.members.length).map((g, i) => {
  const takes = takesOf(g);
  const reach = g.members.map((m) => reachOf(m.post));
  const soundCount = new Map();
  for (const m of g.members) { const s = soundsFile.posts?.[m.post.id]?.sound; if (s && !["library", "silent", "none"].includes(s)) (soundCount.get(s) ?? soundCount.set(s, []).get(s)).push(reachOf(m.post)); }
  const members = [...g.members].sort((a, b) => reachOf(b.post) - reachOf(a.post));
  const small = g.members.length < MINP;
  return {
    id: g.id ?? `f${i + 1}`, name: g.name ?? (small ? `small: ${nameOf(g)}` : nameOf(g)), layout: g.layout, panel: g.panel, panel_changes: g.changes,
    split: g.layout === "split" ? { low: g.low, high: g.high, typical: center(g) } : null,
    count: g.members.length, with_file: g.members.filter((m) => m.s.source === "video").length,
    total_reach: reach.reduce((a, b) => a + b, 0), median_reach: median(reach), average_reach: Math.round(reach.reduce((a, b) => a + b, 0) / Math.max(1, reach.length)),
    clips: count(g.members, "clip"), panels: count(g.members, "panelKind"),
    posts: members.map((m) => ({ id: m.post.id, reach: reachOf(m.post), split_at: m.s.split_at, take: m.takeId ?? null, sound: soundsFile.posts?.[m.post.id]?.sound ?? null, first_line: firstLine(m.post) })),
    takes, sounds: [...soundCount.entries()].map(([id, r]) => ({ id, count: r.length, median_reach: median(r) })).sort((a, b) => b.count - a.count),
    library_sound_posts: g.members.filter((m) => soundsFile.posts?.[m.post.id]?.sound === "library").length,
    sheets: members.slice(0, 5).map((m) => m.s.sheet).filter((s) => s && existsSync(P(s))),
  };
});
const previous = readJson(P('context', 'formats.json'), {formats: []});
const retained = process.env.KEYFRAMES_READING_SCOPE === 'trial-reels' ? (previous.formats ?? []).filter(f => !out.some(next => next.id === f.id) && review.formats?.some(r => r.id === f.id)) : [];
writeJson(P("context", "formats.json"), { formats: [...retained, ...out], unplaced, read_at: now() });
console.log(`formats: ${out.length} found in ${readings.length} posts, ${unplaced.length} unplaced`);
for (const f of out) console.log(`  ${f.id}: ${f.name}; ${f.count} posts (${f.with_file} with a file), reach total ${f.total_reach}, median ${f.median_reach}; clips ${Object.entries(f.clips).map(([k, v]) => `${v} ${k}`).join(", ")}; ${f.takes.length} take${f.takes.length === 1 ? "" : "s"}${f.takes.length ? ` (${f.takes.slice(0, 6).map((t) => `${t.id} ${t.count} ${t.motion} median ${t.median_reach}`).join(", ")}${f.takes.length > 6 ? ", ..." : ""})` : ""}; sounds ${f.sounds.length ? f.sounds.slice(0, 6).map((s) => `${s.id} ${s.count} median ${s.median_reach}`).join(", ") : "none read"}${f.library_sound_posts ? `, ${f.library_sound_posts} on a library sound` : ""}`);
