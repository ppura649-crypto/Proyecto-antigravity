#!/usr/bin/env node
// fit.mjs <take> <post video> --zone top|bottom:<split> [--store-clip <hash>]
// Contract: how the post framed this take. Finds the scale and the offset that map the raw take onto the post's clip zone,
//   by normalised correlation over grey frames (the zone at 270 px wide, the take at the same scale): first the second of
//   the take that plays at the post's start, at scale 1, then the scale (0.7 to 1.3) and the offset around it. Prints
//   { ok, scale, dx, dy, offset, c } with dx and dy as shares of the take's width and height (the zone's top left corner
//   in the take), offset in seconds, c the correlation; under 0.45 the fit is reported as not trusted. --store-clip writes
//   `fit` into context/inputs/media.json under that hash. A format places a new take in the zone the way the post placed
//   its own: the same face height in the zone, the face's top edge at the same share of it.
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { P, readJson, writeJson, ffbin, ffenv, fail } from "./_lib.mjs";

const args = process.argv.slice(2);
const files = args.filter((a, i) => !a.startsWith("--") && !["--zone", "--store-clip"].includes(args[i - 1]));
const [take, post] = files;
const opt = (k, d = null) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
if (!take || !post || !existsSync(take) || !existsSync(post) || !opt("--zone")) fail("usage: fit.mjs <take> <post video> --zone top|bottom:<split> [--store-clip <hash>]");
const [side, splitS] = opt("--zone").split(":"); const split = Number(splitS);
if (!["top", "bottom"].includes(side) || !(split > 0.1 && split < 0.9)) fail("--zone wants top|bottom:<split>");
const ffprobe = ffbin("ffprobe"), ffmpeg = ffbin("ffmpeg");
const dims = (f) => { const j = JSON.parse(execFileSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", f], { encoding: "utf8", env: ffenv(ffprobe) })); const s = j.streams[0]; const rot = Math.abs(Number(s.side_data_list?.[0]?.rotation ?? 0)) % 180; return { w: rot === 90 ? s.height : s.width, h: rot === 90 ? s.width : s.height, d: Number(j.format?.duration ?? 0) }; };
const T = dims(take), Q = dims(post);
const ZW = Q.w, ZH = Math.round(Q.h * (side === "top" ? split : 1 - split)), ZY = side === "top" ? 0 : Q.h - ZH;
const RW = 270, RH = Math.round((T.h / T.w) * RW), ZRW = 270, ZRH = Math.round((ZH / ZW) * ZRW);
const grey = (f, t, vf, w, h) => { const raw = execFileSync(ffmpeg, ["-v", "error", "-ss", String(t), "-i", f, "-frames:v", "1", "-vf", `${vf}scale=${w}:${h}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 24, env: ffenv(ffmpeg) }); return raw.length >= w * h ? new Uint8Array(raw.buffer, raw.byteOffset, w * h) : null; };
const ncc = (raw, zone, sx, sy, dx, dy) => { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let v = 0; v < ZRH; v += 2) for (let u = 0; u < ZRW; u += 2) { const x = Math.round(u / sx + dx), y = Math.round(v / sy + dy); if (x < 0 || y < 0 || x >= RW || y >= RH) return -1; const a = raw[y * RW + x], b = zone[v * ZRW + u]; n++; sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; } const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2; return cov / Math.sqrt(va * vb + 1e-9); };
const postTimes = [Q.d * 0.15, Q.d * 0.4].map((t) => +t.toFixed(2));
const zones = postTimes.map((t) => grey(post, t, `crop=${ZW}:${ZH}:0:${ZY},`, ZRW, ZRH)); if (zones.some((z) => !z)) fail("could not read the post's frames");
const cache = new Map(); const takeAt = (t) => { const k = t.toFixed(2); if (!cache.has(k)) cache.set(k, grey(take, t, "", RW, RH)); return cache.get(k); };
const score = (off, sx, sy, dx, dy) => { let s = 0; for (let i = 0; i < postTimes.length; i++) { const r = takeAt(Math.min(Math.max(0, postTimes[i] + off), Math.max(0, T.d - 0.05))); if (!r) return -1; s += ncc(r, zones[i], sx, sy, dx, dy); } return s / postTimes.length; };
// 1. the time offset at scale 1 (dx 0, dy swept)
let best = { c: -2, off: 0, sx: 1, sy: 1, dx: 0, dy: 0 };
const maxOff = Math.max(0, T.d - Q.d);
for (let off = 0; off <= maxOff + 0.001; off += 0.5) for (let dy = 0; dy <= RH - ZRH; dy += 3) { const c = score(off, 1, 1, 0, dy); if (c > best.c) best = { c, off, sx: 1, sy: 1, dx: 0, dy }; }
for (let off = Math.max(0, best.off - 0.5); off <= Math.min(maxOff, best.off + 0.5) + 0.001; off += 0.1) for (let dy = Math.max(0, best.dy - 6); dy <= Math.min(RH - ZRH, best.dy + 6); dy++) { const c = score(off, 1, 1, 0, dy); if (c > best.c) best = { ...best, c, off: +off.toFixed(2), dy }; }
// 2. the scale and the offsets around it
for (let s = 0.7; s <= 1.301; s += 0.05) { const w = ZRW / s, h = ZRH / s; if (w > RW + 1 || h > RH + 1) continue; for (let dy = 0; dy <= RH - h + 0.5; dy += 3) for (let dx = 0; dx <= RW - w + 0.5; dx += 3) { const c = score(best.off, s, s, dx, dy); if (c > best.c) best = { ...best, c, sx: +s.toFixed(2), sy: +s.toFixed(2), dx, dy }; } }
for (let s = best.sx - 0.04; s <= best.sx + 0.041; s += 0.01) { const w = ZRW / s, h = ZRH / s; if (w > RW + 1 || h > RH + 1) continue; for (let dy = Math.max(0, best.dy - 4); dy <= Math.min(RH - h, best.dy + 4); dy++) for (let dx = Math.max(0, best.dx - 4); dx <= Math.min(RW - w, best.dx + 4); dx++) { const c = score(best.off, s, s, dx, dy); if (c > best.c) best = { ...best, c, sx: +s.toFixed(2), sy: +s.toFixed(2), dx, dy }; } }
const fit = { scale: best.sx, dx: +(best.dx / RW).toFixed(3), dy: +(best.dy / RH).toFixed(3), offset: best.off, c: +best.c.toFixed(3), trusted: best.c >= 0.45, zone: opt("--zone"), post_frames: postTimes };
if (opt("--store-clip")) { const m = readJson(P("context", "inputs", "media.json"), {}); if (!m[opt("--store-clip")]) fail(`${opt("--store-clip")} is not in context/inputs/media.json`); m[opt("--store-clip")].fit = fit; writeJson(P("context", "inputs", "media.json"), m); }
console.log(JSON.stringify({ ok: true, ...fit }, null, 2));
