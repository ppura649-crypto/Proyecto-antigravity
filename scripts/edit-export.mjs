// edit-export.mjs: renders an edit document (projects/<id>/edit/timeline.json) to a checked video. Imported by
//   scripts/edit.mjs, its tests and the session hook; the contract is in edit.mjs.
//
// Goal
//   What the buyer arranged in the editor is what comes out, frame for frame, with their footage never redrawn.
//
// Reasoning
//   The editor plays the `Edit` composition, so the export could simply render it. It does not, because of the runtime
//   guarantee: a clip of a person goes through ffmpeg untouched and everything drawn goes on a transparent track laid
//   over it. So the document is split in two by one rule, the plan: a video item that fills the frame exactly as its file
//   is (no box, no move, no fade, nothing drawn under it) is the base, cut and timed by ffmpeg; every other visual thing
//   (words, captions, pictures, graphics, clips in a box or turned) is drawn by the same `Edit` the editor plays, on a
//   transparent PNG track, with the base items skipped. Every sound is mixed by ffmpeg from the files, so the renderer
//   never touches a voice either. One ffmpeg pass then builds the base, lays the drawn track over it in RGB and muxes the
//   sound, so the buyer's clip is decoded once and encoded once. composite.mjs is not used: it takes one clip and one
//   track, and an edit is many cuts of many files with gaps.
//   The plan never looks at the format. A talking head, a montage and a blank project are the same few item types.
//
// Checks, all of them run, a check that cannot run is a fail: the length within one frame, the size, the frame rate,
//   sound present exactly when the edit has sound and never clipped, and three frames of the export compared with the
//   same frames of `Edit` drawn whole (a still of the composition): the whole frame, then the drawn pixels alone, and at
//   a caption moment the words must be on the drawn track at all. A failed export is moved out of the output folder.
import { copyFileSync, existsSync, linkSync, realpathSync, statfsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { checkDoc } from './edit-doc.mjs';
import * as build from './edit-build.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = /^[a-z0-9][a-z0-9._-]{0,120}$/i;
export const THRESHOLDS = { psnr: 30, drawn: 16, drawnPixels: 150, peak: -0.05 };

// ---------------------------------------------------------------------------------------------------------------
// Files and tools.

const readJson = (path, fallback = null) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };
function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomBytes(6).toString('hex')}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 1) + '\n');
  renameSync(temporary, path);
}

// A project with several versions of one video (Trial Reels) exports each as `<project>@<version>`: the version's own
// edit lives in edit/<version>/ and its video is named after it, as the workspace server keeps it.
const VERSION = /^(?!versions$|checks$)[a-z0-9][a-z0-9_-]{0,60}$/i;
export function projectPaths(root, key) {
  const [id, version = null, ...rest] = typeof key === 'string' ? key.split('@') : [];
  if (typeof id !== 'string' || !PROJECT.test(id) || rest.length || (version !== null && !VERSION.test(version))) throw new Error(`Not a project name: ${key}`);
  const rel = `workspace/projects/${id}`;
  const dir = join(root, rel);
  if (!existsSync(dir)) throw new Error(`No project folder: ${rel}`);
  const edit = version ? join(dir, 'edit', version) : join(dir, 'edit');
  return { id, version, key: version ? `${id}@${version}` : id, rel, dir, edit, file: join(edit, 'timeline.json'), request: join(edit, 'export-request.json'), exports: join(edit, 'exports.json') };
}

// The file an export of this revision is written to: edit-r<n>.mp4, or <version>-edit-r<n>.mp4 for a version.
export const exportName = (paths, revision) => `${paths.version ? `${paths.version}-` : ''}edit-r${revision}.mp4`;

// Items that need the agent before the export (item.agent: { task, note, ref? }): a pack's look or reader sets it when
// the buyer changed something only the agent can make, for example words set in the creator's own letters. The export
// refuses while any is left and names the pack's instructions; `edit.mjs resolve` clears one once it is done.
export function agentTasks(root, doc) {
  const out = [];
  for (const item of doc.items ?? []) {
    const a = item.agent;
    if (!a || typeof a !== 'object') continue;
    const pack = String(item.style?.look ?? item.renderer ?? doc.source?.reader ?? '').split('/')[0];
    const guide = typeof a.ref === 'string' && a.ref ? a.ref : pack && existsSync(join(root, 'editor', pack, 'README.md')) ? `editor/${pack}/README.md` : null;
    out.push({ id: item.id, label: item.label || item.id, task: String(a.task ?? 'needs the agent'), note: a.note ?? null, guide, ...(a.request ? { request: a.request } : {}) });
  }
  return out;
}

// Items a format cannot draw here (item.missing: '<reason>'): the export leaves them out and says so.
export const leftOut = (doc) => (doc.items ?? []).filter((i) => typeof i.missing === 'string' && i.missing).map((i) => ({ id: i.id, label: i.label || i.id, reason: i.missing }));

// The folder a project's finished files go to: the one project.json names, else workspace/output/<project>.
export function outputDir(root, paths) {
  const data = readJson(join(paths.dir, 'project.json'), {}) ?? {};
  const named = typeof data.output === 'string' && /^workspace\/output\/[^/]+\/?$/.test(data.output) ? data.output.replace(/\/$/, '') : null;
  return named ?? `workspace/output/${paths.id}`;
}

// ffmpeg: the full static build installed with the packages, then the PATH, then the renderer's copy (few filters).
// ffprobe: the renderer's copy, then the PATH.
function onPath(name) {
  const found = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  return found.status === 0 ? String(found.stdout).split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? null : null;
}
const bins = new Map();
export function ffbin(root, name) {
  const key = `${root}:${name}`;
  if (bins.has(key)) return bins.get(key);
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const shipped = join(root, 'node_modules', '@remotion', `compositor-${process.platform}-${process.arch}`, exe);
  const cands = name === 'ffmpeg' ? [join(root, 'node_modules', 'ffmpeg-static', exe), onPath(name), shipped] : [shipped, onPath(name), join(root, 'node_modules', 'ffmpeg-static', exe)];
  const found = cands.find((c) => c && existsSync(c));
  if (!found) throw new Error(`${name} is missing; run node scripts/doctor.mjs`);
  bins.set(key, found);
  return found;
}
const ffenv = (bin) => (String(bin).includes('compositor-') ? { ...process.env, DYLD_LIBRARY_PATH: dirname(bin), LD_LIBRARY_PATH: dirname(bin) } : process.env);
function ff(root, name, args, options = {}) {
  const bin = ffbin(root, name);
  const r = spawnSync(bin, args, { env: ffenv(bin), maxBuffer: 1 << 30, ...options });
  if (r.status !== 0) throw new Error(`${name} failed: ${String(r.stderr ?? '').trim().split('\n').slice(-4).join(' ').slice(0, 600)}`);
  return r;
}

// A path in the document is relative to the folder and must stay inside it.
export function inside(root, rel) {
  if (typeof rel !== 'string' || !rel || rel.startsWith('/') || /^[a-z]:/i.test(rel) || rel.includes('\0')) return null;
  const abs = resolve(root, rel);
  return abs.startsWith(resolve(root) + sep) ? abs : null;
}

export function probeFile(root, rel) {
  const abs = inside(root, rel);
  if (!abs || !existsSync(abs) || !statSync(abs).isFile()) throw new Error(`${rel} is not in the folder`);
  const r = ff(root, 'ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,avg_frame_rate,duration,color_space,color_range:stream_side_data=rotation:stream_tags=rotate:format=duration', '-of', 'json', abs], { encoding: 'utf8' });
  const info = JSON.parse(r.stdout);
  const video = info.streams?.find((s) => s.codec_type === 'video');
  const rate = (text) => { const [n, d] = String(text ?? '0/1').split('/').map(Number); return d ? n / d : 0; };
  const rotation = Number(video?.side_data_list?.find((s) => 'rotation' in s)?.rotation ?? video?.tags?.rotate ?? 0);
  const turned = Math.abs(rotation) % 180 === 90;
  return {
    width: (turned ? video?.height : video?.width) ?? null,
    height: (turned ? video?.width : video?.height) ?? null,
    fps: rate(video?.avg_frame_rate) || rate(video?.r_frame_rate) || null,
    duration: Number(info.format?.duration ?? video?.duration ?? 0) || 0,
    video: Boolean(video) && !/\.(wav|mp3|m4a|aac|ogg|flac|opus|aif|aiff)$/i.test(rel),
    audio: Boolean(info.streams?.some((s) => s.codec_type === 'audio')),
    // A file that does not say how its colours are stored is read the way the browser reads it, as bt709.
    tagged: Boolean(video?.color_space && video.color_space !== 'unknown'),
  };
}

export function probeDoc(root, doc) {
  const probes = new Map();
  const tracks = new Map(doc.tracks.map((track) => [track.id, track]));
  for (const item of doc.items) {
    const track = tracks.get(item.track);
    if (item.missing || (item.type === 'audio' ? track?.muted || (item.volume ?? 1) === 0 : track?.hidden)) continue;
    if (!['video', 'audio', 'image'].includes(item.type)) continue;
    const file = inside(root, item.src);
    if (!file || !existsSync(file) || !statSync(file).isFile()) throw new Error(`${item.label || item.id}: ${item.src} is not in the folder`);
    if (item.type !== 'image' && !probes.has(item.src)) probes.set(item.src, probeFile(root, item.src));
    const info = probes.get(item.src);
    if (item.type === 'video' && !info.video) throw new Error(`${item.label || item.id}: the file has no picture`);
    if (item.type === 'audio' && !info.audio) throw new Error(`${item.label || item.id}: the file has no sound`);
  }
  return probes;
}

// ---------------------------------------------------------------------------------------------------------------
// The plan. Pure: a document and what its files measured in, what ffmpeg draws, what Edit draws, and what sounds.

const end = (item) => item.from + item.durationInFrames;
const overlaps = (a, b) => a.from < end(b) && b.from < end(a);
export const docFrames = (doc) => Math.max(1, Number.isInteger(doc.durationInFrames) ? doc.durationInFrames : 1, ...doc.items.map(end));

// Why a video item cannot be the base, or null when it fills the frame exactly as its file is.
export function whyDrawn(item, doc, probe) {
  if (item.type !== 'video') return item.type;
  if (!probe?.video) return 'the file has no picture';
  const t = item.transform ?? {};
  if ((t.x ?? 0) !== 0 || (t.y ?? 0) !== 0 || (t.scale ?? 1) !== 1 || ((t.rotation ?? 0) % 360) !== 0) return 'moved, scaled or turned';
  if ((t.opacity ?? 1) !== 1) return 'see-through';
  if ((item.fadeIn ?? 0) > 0 || (item.fadeOut ?? 0) > 0) return 'fades';
  if (item.motion) return 'moves into view';
  if (item.size && (item.size.w !== doc.width || item.size.h !== doc.height)) return 'placed in a box';
  const crop = item.crop ?? {};
  if (crop.l || crop.t || crop.r || crop.b) return 'cropped';
  if ((item.radius ?? 0) > 0) return 'rounded corners';
  const aspect = probe.width && probe.height ? probe.width / probe.height : null;
  const same = aspect && Math.abs(aspect - doc.width / doc.height) < 0.002 * (doc.width / doc.height);
  if ((item.fit ?? 'cover') !== 'cover' && !same) return 'fit inside the frame';
  if (!aspect) return 'the file has no size';
  return null;
}

export function planExport(doc, probes = new Map()) {
  const frames = docFrames(doc);
  const order = new Map(doc.tracks.map((t, i) => [t.id, i]));
  const tracks = new Map(doc.tracks.map((t) => [t.id, t]));
  const visuals = doc.items.filter((i) => i.type !== 'audio' && !tracks.get(i.track)?.hidden && !i.missing);
  const hidden = doc.items.filter((i) => i.type !== 'audio' && tracks.get(i.track)?.hidden).map((i) => i.id);
  const drawn = [];
  const base = [];
  for (const item of visuals) {
    let why = whyDrawn(item, doc, probes.get(item.src));
    // Anything drawn under a base clip while it plays would end up over it once the track is laid on top.
    if (!why && visuals.some((other) => other !== item && order.get(other.track) > order.get(item.track) && overlaps(item, other))) why = 'something is drawn under it';
    if (why) drawn.push({ id: item.id, type: item.type, why });
    else base.push({ id: item.id, src: item.src, from: item.from, frames: item.durationInFrames, trimStart: item.trimStart ?? 0, speed: item.speed ?? 1, ...(probes.get(item.src)?.tagged === false ? { untagged: true } : {}) });
  }
  base.sort((a, b) => a.from - b.from);
  const sounds = [];
  for (const item of doc.items) {
    if (item.missing) continue;
    const track = tracks.get(item.track);
    if (item.type === 'audio' ? track?.muted : item.type !== 'video' || track?.hidden || track?.muted) continue;
    const volume = item.volume ?? 1;
    if (!(volume > 0) || !probes.get(item.src)?.audio) continue;
    sounds.push({ id: item.id, src: item.src, from: item.from, frames: item.durationInFrames, trimStart: item.trimStart ?? 0, speed: item.speed ?? 1, volume, fadeIn: item.fadeIn ?? 0, fadeOut: item.fadeOut ?? 0 });
  }
  return { fps: doc.fps, width: doc.width, height: doc.height, frames, background: doc.background ?? '#000000', base, skip: base.map((b) => b.id), drawn, hidden, overlay: drawn.length > 0, sounds };
}

// The frame with the most on it (what the still shows), a moment a caption word is on screen, and spread fill.
export function checkFrames(doc, plan) {
  const tracks = new Map(doc.tracks.map((t) => [t.id, t]));
  const visible = doc.items.filter((i) => i.type !== 'audio' && !tracks.get(i.track)?.hidden && !i.missing);
  const drawnIds = new Set(plan.drawn.map((d) => d.id));
  const at = (f) => visible.filter((i) => f >= i.from && f < end(i));
  let busy = Math.floor(plan.frames / 2);
  let best = -1;
  for (const item of visible) {
    const f = item.from + Math.floor(item.durationInFrames / 2);
    const here = at(f);
    const score = here.filter((i) => drawnIds.has(i.id)).length * 10 + here.length;
    if (score > best) { best = score; busy = f; }
  }
  const caption = captionMoment(doc);
  // Keep the caption's exact frame even when the busiest frame is only one or two frames away.
  const picks = [caption?.frame, busy, ...[0.25, 0.5, 0.75].map((p) => Math.round(p * (plan.frames - 1)))].filter((f) => Number.isInteger(f));
  const out = [];
  for (const f of picks) if (f >= 0 && f < plan.frames && out.every((o) => Math.abs(o - f) > 2) && out.length < 3) out.push(f);
  return { busy, caption: caption?.frame ?? null, captionId: caption?.id ?? null, frames: out };
}

// The middle of the first caption word on screen, in document frames.
export function captionMoment(doc) {
  const tracks = new Map(doc.tracks.map((t) => [t.id, t]));
  for (const item of [...doc.items].sort((a, b) => a.from - b.from)) {
    if (item.type !== 'caption' || tracks.get(item.track)?.hidden || item.missing || !Array.isArray(item.words)) continue;
    const trim = item.trimStart ?? 0;
    for (const word of item.words) {
      if (!String(word.text ?? '').trim()) continue;
      const from = Math.max(trim, word.from);
      const to = Math.min(trim + item.durationInFrames, word.to);
      const frame = item.from + Math.floor((from + to) / 2) - trim;
      if (to > from && frame >= item.from && frame < end(item)) return { frame, id: item.id, word: word.text };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// ffmpeg. Pure argument building, tested without running anything.

export function ffColor(value) {
  const hex = String(value ?? '').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return /^[a-z]+$/i.test(String(value ?? '')) && value !== 'transparent' ? String(value).toLowerCase() : '0x000000';
  return `0x${hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex}`.toUpperCase().replace('0X', '0x');
}

// atempo takes 0.5 to 2 per step, so a larger change is a chain.
export function atempoChain(speed) {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('Playback speed must be positive and finite.');
  const steps = [];
  let s = speed;
  while (s > 2) { steps.push(2); s /= 2; }
  while (s < 0.5) { steps.push(0.5); s /= 0.5; }
  if (Math.abs(s - 1) > 1e-6) steps.push(+s.toFixed(6));
  return steps.map((v) => `atempo=${v}`);
}

const num = (v) => String(+v.toFixed(6));

export function buildFfmpeg(plan, { source, overlay = null, out }) {
  const { fps, width: W, height: H, frames } = plan;
  const sec = (f) => num(f / fps);
  const inputs = [];
  const graph = [];
  const byItem = new Map();
  let count = 0;
  const input = (item) => {
    if (byItem.has(item.id)) return byItem.get(item.id);
    const index = count++;
    inputs.push('-ss', sec(item.trimStart), '-t', num((item.frames * item.speed + 2) / fps), '-i', source(item.src));
    byItem.set(item.id, index);
    return index;
  };
  const colour = ffColor(plan.background);
  const parts = [];
  const gap = (length) => {
    const label = `p${parts.length}`;
    graph.push(`color=c=${colour}:s=${W}x${H}:r=${fps}:d=${num((length + 2) / fps)},format=gbrp,setsar=1,trim=end_frame=${length},setpts=PTS-STARTPTS[${label}]`);
    parts.push(label);
  };
  let cursor = 0;
  for (const seg of plan.base) {
    if (seg.from > cursor) gap(seg.from - cursor);
    const i = input(seg);
    const label = `p${parts.length}`;
    // Cover the frame the way the editor does (object-fit cover, centred), at the edit's rate. Each frame shows the
    // source frame on screen at that moment (the last one that started), as the renderer does: round=up, not nearest.
    graph.push(`[${i}:v]${seg.untagged ? 'setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709,' : ''}setpts=(PTS-STARTPTS)/${num(seg.speed)},fps=${fps}:round=up,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},format=gbrp,setsar=1,tpad=stop_mode=clone:stop=${seg.frames},trim=end_frame=${seg.frames},setpts=PTS-STARTPTS[${label}]`);
    parts.push(label);
    cursor = seg.from + seg.frames;
  }
  if (cursor < frames) gap(frames - cursor);
  graph.push(`${parts.map((p) => `[${p}]`).join('')}concat=n=${parts.length}:v=1:a=0[base]`);
  let video = 'base';
  if (overlay) {
    const index = count++;
    if (overlay.pipe) inputs.push('-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0');
    else inputs.push('-framerate', String(fps), '-start_number', String(overlay.start ?? 0), '-i', overlay.pattern);
    graph.push(`[${index}:v]format=rgba,setsar=1[drawn]`, `[base][drawn]overlay=0:0:format=gbrp:eof_action=pass[laid]`);
    video = 'laid';
  }
  graph.push(`[${video}]trim=end_frame=${frames},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1[v]`);
  const mixed = [];
  for (const s of plan.sounds) {
    const i = input(s);
    const label = `s${mixed.length}`;
    const chain = [
      'aresample=48000', 'aformat=sample_fmts=fltp:channel_layouts=stereo',
      `atrim=duration=${num((s.frames * s.speed) / fps)}`, 'asetpts=PTS-STARTPTS',
      ...atempoChain(s.speed),
      'apad', `atrim=duration=${sec(s.frames)}`,
      `volume=${num(s.volume)}`,
      ...(s.fadeIn > 0 ? [`afade=t=in:st=0:d=${sec(s.fadeIn)}`] : []),
      ...(s.fadeOut > 0 ? [`afade=t=out:st=${sec(s.frames - s.fadeOut)}:d=${sec(s.fadeOut)}`] : []),
      ...(s.from > 0 ? [`adelay=delays=${Math.round((s.from / fps) * 1000)}:all=1`] : []),
    ];
    graph.push(`[${i}:a]${chain.join(',')}[${label}]`);
    mixed.push(label);
  }
  if (mixed.length) {
    const mix = mixed.length === 1 ? `[${mixed[0]}]anull` : `${mixed.map((m) => `[${m}]`).join('')}amix=inputs=${mixed.length}:normalize=0:dropout_transition=0:duration=longest`;
    // Sounds add up as they are, never turned down to make room; a limiter keeps the sum under full scale.
    graph.push(`${mix},apad,atrim=duration=${sec(frames)},alimiter=limit=0.95:level=0:latency=1[a]`);
  }
  return [
    '-y', '-v', 'error', ...inputs,
    '-filter_complex', graph.join(';'),
    '-map', '[v]', ...(mixed.length ? ['-map', '[a]'] : []),
    // No -frames:v: it ends the whole file once the picture is done, cutting a sound that the graph still holds (a
    // song starting late over a silent clip came out half a second long). Both streams are trimmed in the graph.
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    ...(mixed.length ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : ['-an']),
    '-movflags', '+faststart', out,
  ];
}

// ---------------------------------------------------------------------------------------------------------------
// Remotion. The render bundle is the page's own composition behind render-root.tsx, with the same aliases the editor
// bundle uses, and a public folder that holds every file the document names (under media/) and every file a format's
// layers load with staticFile(): the project folder first, then each installed public folder, as the editor serves them.

function linkOrCopy(from, to) {
  if (existsSync(to)) return;
  mkdirSync(dirname(to), { recursive: true });
  try { linkSync(from, to); } catch { copyFileSync(from, to); }
}

const STATIC = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.ttf', '.otf', '.woff', '.woff2', '.mp4', '.mov', '.webm', '.wav', '.mp3', '.m4a', '.json']);
export function docFiles(root, doc) {
  const found = new Set();
  const visit = (value) => {
    if (typeof value === 'string') { const abs = value.length < 500 && inside(root, value); if (abs && existsSync(abs) && statSync(abs).isFile()) found.add(value); return; }
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(doc.items);
  return [...found];
}

export function stagePublic(root, doc, paths, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const rel of docFiles(root, doc)) linkOrCopy(join(root, rel), join(dir, 'media', rel));
  // As the editor serves them (workspace-edit.mjs staticFor): the project, then its own public folders (Product Demo keeps
  // its brand files in source/public), then each installed format's.
  const bases = [paths.dir, join(paths.dir, 'public'), join(paths.dir, 'source', 'public')];
  for (const top of ['engine', 'remotion']) {
    const d = join(root, top);
    if (existsSync(d)) for (const pack of readdirSync(d).sort()) bases.push(join(d, pack, 'public'), join(d, pack, 'remotion', 'public'));
  }
  const walk = (base, at, depth) => {
    if (depth > 6 || !existsSync(at)) return;
    for (const name of readdirSync(at)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const abs = join(at, name);
      const stat = statSync(abs);
      if (stat.isDirectory()) walk(base, abs, depth + 1);
      else if (STATIC.has(extname(name).toLowerCase())) linkOrCopy(abs, join(dir, relative(base, abs)));
    }
  };
  for (const base of bases) walk(base, base, 0);
}

async function remotion(root) {
  const require = createRequire(join(root, 'package.json'));
  const load = async (name) => { const m = await import(pathToFileURL(require.resolve(name)).href); return m.default && !m.bundle && !m.renderStill ? m.default : m; };
  return { bundler: await load('@remotion/bundler'), renderer: await load('@remotion/renderer') };
}

// Remotion must never discover a browser the buyer uses. A second instance of that browser can disturb its shared
// cookie key even with a fresh profile. Resolve Playwright's bundled Chromium explicitly for every render.
export function editorBrowser(root, requested = process.env.KEYFRAMES_EDITOR_BROWSER) {
  const require = createRequire(join(resolve(root), 'package.json'));
  let bundled;
  try { bundled = require('playwright').chromium.executablePath(); }
  catch { throw new Error('The editor needs Playwright. Install playwright and its bundled Chromium before exporting.'); }
  if (!existsSync(bundled)) throw new Error('The editor needs its bundled browser. Run npx playwright install chromium before exporting.');
  if (requested && (!existsSync(requested) || realpathSync(requested) !== realpathSync(bundled))) throw new Error('The editor only uses the Chromium bundled with Playwright.');
  return bundled;
}

// Some Remotion calls resolve before their page cleanup finishes. Closing the browser immediately can overtake a
// pending Target.closeTarget. Own each page's one close promise and drain those promises before closing this browser.
// This is scoped to the browser created for this export; no process-wide error handlers or browser changes are used.
export function manageRenderBrowser(browser) {
  const pages = new Set();
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (...args) => {
    const page = await newPage(...args);
    const close = page.close.bind(page);
    let closing;
    page.close = (...options) => {
      if (!closing) closing = Promise.resolve().then(() => page.closed ? undefined : close(...options));
      return closing;
    };
    pages.add(page);
    return page;
  };
  let closed;
  return () => {
    if (!closed) closed = (async () => {
      const results = await Promise.allSettled([...pages].map((page) => page.close()));
      await browser.close({ silent: true });
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) throw failed.reason;
    })();
    return closed;
  };
}

// The render uses the registry the editor page was built with: the project's own graphics when it brings some.
export async function bundleEdit(root, publicDir, { project = null, log = () => {} } = {}) {
  const { bundler } = await remotion(root);
  const own = project && build.projectRegistry ? await build.projectRegistry(root, project) : null;
  const registry = own?.target ?? build.layerRegistry(root).target;
  const started = Date.now();
  const serveUrl = await bundler.bundle({
    entryPoint: join(here, 'editor', 'render-root.tsx'),
    publicDir,
    symlinkPublicDir: process.platform !== 'win32',
    onSymlinkDetected: () => {},
    enableCaching: true,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: { ...(config.resolve?.alias ?? {}), ...(own?.aliases ?? {}), 'keyframes-layers': registry, 'keyframes-editable': join(root, 'scripts/editor/Editable.tsx'), 'keyframes-engine': join(root, 'engine'), 'keyframes-remotion': join(root, 'remotion') },
        modules: [...(own?.nodePaths ?? [join(root, 'node_modules')]), 'node_modules'],
      },
    }),
  });
  log(`bundled in ${Math.round((Date.now() - started) / 1000)}s`);
  return serveUrl;
}

// ---------------------------------------------------------------------------------------------------------------
// Frames, for the checks.

// A frame is picked by its number, never by a time: a seek lands on the next frame when the timestamps are rounded.
const pickFrame = (n) => [`select=eq(n\\,${n})`];
function rawFrame(root, file, { frame = null, rgba = false, bt709 = false } = {}) {
  const filters = [...(frame != null ? pickFrame(frame) : []), ...(bt709 ? ['scale=in_color_matrix=bt709:in_range=tv'] : [])];
  const args = ['-v', 'error', '-i', file, ...(filters.length ? ['-vf', filters.join(',')] : []), '-frames:v', '1', '-fps_mode', 'passthrough'];
  args.push('-f', 'rawvideo', '-pix_fmt', rgba ? 'rgba' : 'rgb24', '-');
  return ff(root, 'ffmpeg', args).stdout;
}

export function psnr(a, b) {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - b[i]; sum += d * d; }
  const mse = sum / n;
  return mse === 0 ? 99 : +(10 * Math.log10((255 * 255) / mse)).toFixed(2);
}

// Mean difference (0 to 255) where the drawn track covers the frame, and how many pixels it covers.
export function drawnDiff(still, exported, overlayRgba, minAlpha = 200) {
  let count = 0;
  let sum = 0;
  for (let p = 0, q = 0; q + 3 < overlayRgba.length; p += 3, q += 4) {
    if (overlayRgba[q + 3] < minAlpha) continue;
    count++;
    sum += (Math.abs(still[p] - exported[p]) + Math.abs(still[p + 1] - exported[p + 1]) + Math.abs(still[p + 2] - exported[p + 2])) / 3;
  }
  return { pixels: count, diff: count ? +(sum / count).toFixed(2) : 0 };
}

export function measureOutput(root, file) {
  const r = ff(root, 'ffprobe', ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,duration,nb_read_packets:format=duration', '-of', 'json', file], { encoding: 'utf8' });
  const info = JSON.parse(r.stdout);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  const [n, d] = String(v?.r_frame_rate ?? '0/1').split('/').map(Number);
  let loud = null;
  if (a) {
    const e = ff(root, 'ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'volumedetect,ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
    const pick = (re) => { const m = e.match(re); return m ? Number(m[1]) : null; };
    const summary = e.slice(e.lastIndexOf('Summary:'));
    loud = { max: pick(/max_volume:\s*(-?[\d.]+|-inf) dB/), mean: pick(/mean_volume:\s*(-?[\d.]+) dB/), lufs: Number(summary.match(/I:\s*(-?[\d.]+) LUFS/)?.[1] ?? NaN), truePeak: Number(summary.match(/Peak:\s*(-?[\d.]+) dBFS/)?.[1] ?? NaN) };
  }
  return { width: v?.width, height: v?.height, fps: d ? n / d : 0, frames: Number(v?.nb_read_packets ?? 0), duration: Number(v?.duration ?? info.format?.duration ?? 0), audio: Boolean(a), audioDuration: a ? Number(a.duration ?? 0) : 0, loud };
}

// ---------------------------------------------------------------------------------------------------------------
// The export.

export function pendingExports(root) {
  const base = join(root, 'workspace', 'projects');
  if (!existsSync(base)) return [];
  const out = [];
  for (const id of readdirSync(base).sort()) {
    const edit = join(base, id, 'edit');
    if (!existsSync(edit)) continue;
    // The project's own edit, then each version's (edit/<version>/export-request.json).
    const keys = [[null, edit], ...readdirSync(edit).filter((v) => VERSION.test(v) && existsSync(join(edit, v, 'export-request.json'))).sort().map((v) => [v, join(edit, v)])];
    for (const [version, dir] of keys) {
      const request = readJson(join(dir, 'export-request.json'));
      if (request?.status === 'requested') out.push({ project: version ? `${id}@${version}` : id, revision: request.revision ?? null, requestedAt: request.requestedAt ?? null });
    }
  }
  return out;
}

const say = (line) => process.stderr.write(`  ${line}\n`);

// Room on the disk before anything is made: the video (about 2 MB a second at this quality), the render bundle, and
// a margin, never less than 2 GB. The drawn track never lands on disk (it streams into ffmpeg), so this is enough.
export function roomNeeded(frames, fps) { return Math.max(2 * 1024 ** 3, (frames / fps) * 2 * 1024 ** 2 + 1024 ** 3); }
export function checkRoom(root, frames, fps) {
  let free = Infinity;
  try { const s = statfsSync(root); free = s.bavail * s.bsize; } catch {}
  const need = roomNeeded(frames, fps);
  if (free < need) throw new Error(`Not enough room on the disk: ${(free / 1024 ** 3).toFixed(1)} GB free, the export needs ${(need / 1024 ** 3).toFixed(1)} GB. Free some space and export again.`);
  return free;
}

// Everything an export and a re-check share: the checked document, its plan, the render bundle and one browser.
async function prepare(root, id, log, browserExecutable) {
  root = resolve(root);
  const paths = projectPaths(root, id);
  const doc = readJson(paths.file);
  if (!doc) throw new Error(`No edit for ${id}. Open it in the editor first, or run: node scripts/edit.mjs read ${id}`);
  const problems = checkDoc(doc);
  if (problems.length) throw new Error(`The edit does not pass its check: ${problems.join(' ')}`);
  const tasks = agentTasks(root, doc);
  if (tasks.length) {
    const lines = tasks.map((t) => `${t.label}: ${t.task}${t.note ? ` (${t.note})` : ''}${t.guide ? `. How: ${t.guide}` : ''}.`);
    throw Object.assign(new Error(`${tasks.length === 1 ? 'One thing needs' : `${tasks.length} things need`} you before this export. ${lines.join(' ')} Then run: node scripts/edit.mjs resolve ${paths.key} <item>`), { tasks });
  }
  const revision = doc.revision ?? 1;
  const plan = planExport(doc, probeDoc(root, doc));
  checkRoom(root, plan.frames, plan.fps);
  const full = { ...doc, durationInFrames: plan.frames };
  const work = join(root, '.keyframes', 'editor', 'render', `${paths.key.replace('@', '--')}-r${revision}`);
  const picks = checkFrames(full, plan);
  for (const gone of leftOut(doc)) log(`left out: ${gone.label} (${gone.reason})`);
  log(`plan: ${plan.base.length} clip${plan.base.length === 1 ? '' : 's'} untouched, ${plan.drawn.length} drawn, ${plan.sounds.length} sound${plan.sounds.length === 1 ? '' : 's'}, ${plan.frames} frames`);
  let serveUrl = null;
  let browser = null;
  let closeBrowser = null;
  try {
    stagePublic(root, full, paths, join(work, 'public'));
    serveUrl = await bundleEdit(root, join(work, 'public'), { project: paths.id, log });
    const { renderer } = await remotion(root);
    const executable = editorBrowser(root, browserExecutable);
    // WebGL on, as the formats' own renders have it: a Product Demo scene drawn with three.js gets no context otherwise.
    browser = await renderer.openBrowser('chrome', { browserExecutable: executable, chromiumOptions: { gl: process.platform === 'linux' ? 'swangle' : 'angle' }, logLevel: 'error' });
    closeBrowser = manageRenderBrowser(browser);
    const wholeProps = { doc: full, silent: true };
    const drawnProps = { doc: full, skip: plan.skip, silent: true, transparent: true };
    const composition = await renderer.selectComposition({ serveUrl, id: 'Edit', inputProps: wholeProps, puppeteerInstance: browser, browserExecutable: executable, logLevel: 'error', onBrowserLog: () => {} });
    const compositions = new Map([[wholeProps, composition]]);
    const still = async (frame, output, props = wholeProps, format = 'png') => {
      // Remotion renders the composition's resolved props. Changing inputProps alone retains the whole-frame props,
      // which made transparent recheck stills draw the base clip and hid a missing caption behind unrelated pixels.
      if (!compositions.has(props)) compositions.set(props, await renderer.selectComposition({ serveUrl, id: 'Edit', inputProps: props, puppeteerInstance: browser, browserExecutable: executable, logLevel: 'error', onBrowserLog: () => {} }));
      return renderer.renderStill({ composition: compositions.get(props), serveUrl, output, frame, inputProps: props, imageFormat: format, ...(format === 'jpeg' ? { jpegQuality: 90 } : {}), puppeteerInstance: browser, browserExecutable: executable, overwrite: true, logLevel: 'error', onBrowserLog: () => {} });
    };
    return { root, paths, doc: full, revision, plan, picks, work, serveUrl, renderer, browser, closeBrowser, browserExecutable: executable, wholeProps, drawnProps, still, checksDir: join(paths.edit, 'checks', `r${revision}`) };
  } catch (error) {
    await cleanup({ browser, closeBrowser, serveUrl, work });
    throw error;
  }
}

// Nothing made on the way is left behind, whether the export passed or not: the render bundle, the staged files.
async function cleanup({ browser, closeBrowser, serveUrl, work, encoder, encoderDone, cancelRender }, keep = false) {
  cancelRender?.();
  // If drawing failed midway, close the encoder we started instead of leaving it waiting forever for more PNGs.
  if (encoder && encoder.exitCode == null && encoder.signalCode == null) { encoder.stdin.destroy(); encoder.kill(); }
  if (encoderDone) await encoderDone.catch(() => {});
  try {
    if (closeBrowser) await closeBrowser();
    else if (browser) await browser.close({ silent: true });
  } finally {
    if (serveUrl && /remotion-webpack-bundle-/.test(String(serveUrl))) rmSync(serveUrl, { recursive: true, force: true });
    if (work && !keep) rmSync(work, { recursive: true, force: true });
  }
}

async function compareStills(s) {
  rmSync(s.checksDir, { recursive: true, force: true });
  mkdirSync(s.checksDir, { recursive: true });
  for (const f of s.picks.frames) await s.still(f, join(s.checksDir, `f${f}.edit.png`));
  if (s.picks.captionId) {
    // A logo or a full-frame graphic is not evidence that the caption drew. Keep a mask of the words alone.
    const skip = s.doc.items.filter((item) => item.id !== s.picks.captionId).map((item) => item.id);
    await s.still(s.picks.caption, join(s.checksDir, 'caption.png'), { ...s.drawnProps, skip });
  }
}

export async function exportEdit(root, id, { stillOnly = false, out = null, log = say, keep = false, browserExecutable } = {}) {
  const s = await prepare(root, id, log, browserExecutable);
  root = s.root;
  const { plan, picks, revision } = s;
  // The version a document is of (`variant`, written by the reader) names the video even when the project opened
  // without one, since that edit is the first version's.
  const paths = !s.paths.version && typeof s.doc.variant === 'string' && VERSION.test(s.doc.variant) ? { ...s.paths, version: s.doc.variant } : s.paths;
  const outRel = out ? relative(root, resolve(root, out)) : `${outputDir(root, paths)}/${exportName(paths, revision)}`;
  const outAbs = resolve(root, outRel);
  const stillAbs = outAbs.replace(/\.mp4$/, '.jpg');
  // Only a checked video reaches output. A failed render must not leave a partial file beside finished videos.
  const renderAbs = join(s.work, 'export.mp4');
  try {
    if (!outAbs.endsWith('.mp4')) throw new Error('--out must end in .mp4');
    // A still first: the busiest frame, the whole composition, written beside the video before the video is made.
    mkdirSync(dirname(stillAbs), { recursive: true });
    await s.still(picks.busy, stillAbs, s.wholeProps, 'jpeg');
    log(`still: ${relative(root, stillAbs)} (frame ${picks.busy})`);
    if (stillOnly) return { ok: true, stillOnly: true, project: id, revision, still: relative(root, stillAbs), frame: picks.busy, plan: summary(plan), leftOut: leftOut(s.doc) };
    await compareStills(s);

    // The drawn track goes straight from the renderer into ffmpeg, frame by frame in order, so a long video never
    // needs gigabytes of pictures on disk. The compared frames are kept for the checks.
    let overlay = null;
    const started = Date.now();
    if (plan.overlay) {
      overlay = { pipe: true, file: (f) => join(s.checksDir, `f${f}.drawn.png`) };
      const args = buildFfmpeg(plan, { source: (src) => resolve(root, src), overlay, out: renderAbs });
      const bin = ffbin(root, 'ffmpeg');
      const child = spawn(bin, args, { env: ffenv(bin), stdio: ['pipe', 'ignore', 'pipe'] });
      let errors = '';
      child.stderr.on('data', (d) => { errors = (errors + d).slice(-4000); });
      const done = new Promise((accept, reject) => { child.on('error', reject); child.on('close', (code) => (code === 0 ? accept() : reject(new Error(`ffmpeg failed: ${errors.trim().split('\n').slice(-4).join(' ')}`)))); });
      // Handle a process error even when the renderer fails before the await below.
      done.catch(() => {});
      s.encoder = child;
      s.encoderDone = done;
      child.stdin.on('error', () => {});
      const keepFrames = new Set(picks.frames);
      const waiting = new Map();
      let next = 0;
      let shown = -1;
      const flush = () => {
        while (waiting.has(next)) {
          const buffer = waiting.get(next);
          waiting.delete(next);
          if (keepFrames.has(next)) writeFileSync(overlay.file(next), buffer);
          next++;
          // Written in order; what ffmpeg has not read yet waits in memory and is flushed by end().
          child.stdin.write(buffer);
        }
      };
      const drawnComposition = await s.renderer.selectComposition({ serveUrl: s.serveUrl, id: 'Edit', inputProps: s.drawnProps, puppeteerInstance: s.browser, browserExecutable: s.browserExecutable, logLevel: 'error', onBrowserLog: () => {} });
      const cancellation = s.renderer.makeCancelSignal();
      s.cancelRender = cancellation.cancel;
      await s.renderer.renderFrames({
        composition: drawnComposition, serveUrl: s.serveUrl, inputProps: s.drawnProps, outputDir: null, imageFormat: 'png', muted: true, puppeteerInstance: s.browser, browserExecutable: s.browserExecutable, cancelSignal: cancellation.cancelSignal, logLevel: 'error', onBrowserLog: () => {},
        onFrameBuffer: (buffer, frame) => { waiting.set(frame, buffer); flush(); },
        onStart: () => {}, onFrameUpdate: (count) => { const pct = Math.floor((count / plan.frames) * 10) * 10; if (pct > shown) { shown = pct; log(`drawn track ${pct}%`); } },
      });
      if (next !== plan.frames) { child.kill(); throw new Error(`the drawn track has ${next} frames, the edit ${plan.frames}`); }
      child.stdin.end();
      await done;
    } else ff(root, 'ffmpeg', buildFfmpeg(plan, { source: (src) => resolve(root, src), overlay: null, out: renderAbs }));
    log(`video in ${Math.round((Date.now() - started) / 1000)}s: ${relative(root, outAbs)}`);

    const result = runChecks(root, { plan, file: renderAbs, checksDir: s.checksDir, frames: picks, overlay });
    const record = { revision, path: relative(root, outAbs), still: relative(root, stillAbs), at: new Date().toISOString(), frames: plan.frames, ok: result.ok, checks: result.checks };
    if (!result.ok) {
      const failed = join(s.checksDir, 'failed.mp4');
      renameSync(renderAbs, failed);
      record.path = relative(root, failed);
    } else renameSync(renderAbs, outAbs);
    // A version ships with its own caption, as the format delivered it.
    if (result.ok && paths.version) {
      const caption = [join(root, outputDir(root, paths), `${paths.version}.caption.txt`), join(paths.dir, 'renders', `${paths.version}.caption.txt`)].find((f) => existsSync(f));
      if (caption) { record.caption = relative(root, outAbs.replace(/\.mp4$/, '.caption.txt')); copyFileSync(caption, outAbs.replace(/\.mp4$/, '.caption.txt')); }
    }
    finish(paths, record);
    return { ok: result.ok, project: id, revision, video: record.path, still: record.still, ...(record.caption ? { caption: record.caption } : {}), checks: result.checks, looks: relative(root, s.checksDir), plan: summary(plan), leftOut: leftOut(s.doc) };
  } finally {
    await cleanup(s, keep);
  }
}

// The checks again on a video already made, for the current revision. The drawn track is drawn again at the compared
// frames only.
export async function recheck(root, id, file, { log = say, browserExecutable } = {}) {
  const s = await prepare(root, id, log, browserExecutable);
  try {
    await compareStills(s);
    let overlay = null;
    if (s.plan.overlay) {
      for (const f of s.picks.frames) await s.still(f, join(s.checksDir, `f${f}.drawn.png`), s.drawnProps);
      overlay = { file: (f) => join(s.checksDir, `f${f}.drawn.png`) };
    }
    const result = runChecks(s.root, { plan: s.plan, file: resolve(s.root, file), checksDir: s.checksDir, frames: s.picks, overlay });
    return { ok: result.ok, project: id, revision: s.revision, video: file, checks: result.checks, looks: relative(s.root, s.checksDir) };
  } finally {
    await cleanup(s);
  }
}

const summary = (plan) => ({ untouched: plan.base.map((b) => b.id), drawn: plan.drawn, sounds: plan.sounds.map((s) => s.id), hidden: plan.hidden, frames: plan.frames });

export function finish(paths, record) {
  const list = readJson(paths.exports, []);
  writeJson(paths.exports, [...(Array.isArray(list) ? list : []), record]);
  const request = readJson(paths.request);
  if (request && request.revision === record.revision) writeJson(paths.request, { ...request, status: record.ok ? 'done' : 'failed', exportedRevision: record.revision, output: record.ok ? record.path : null, doneAt: record.at, ...(record.ok ? {} : { reason: record.checks.filter((c) => !c.pass).map((c) => c.reason).join(' ') }) });
}

// Every check runs; a check that throws is a fail with its reason.
export function runChecks(root, { plan, file, checksDir, frames, overlay }) {
  const checks = [];
  const add = (name, pass, value, threshold, reason) => checks.push({ name, pass: Boolean(pass), value, threshold, reason });
  const guard = (name, work) => { try { work(); } catch (error) { add(name, false, null, null, `could not run: ${error.message}`); } };
  let m = null;
  guard('measure', () => { m = measureOutput(root, file); });
  if (m) {
    const want = plan.frames / plan.fps;
    add('length', Math.abs(m.duration - want) <= 1 / plan.fps + 1e-6 && Math.abs(m.frames - plan.frames) <= 1, `${m.frames} frames, ${m.duration.toFixed(3)}s`, `${plan.frames} frames, ${want.toFixed(3)}s`, 'the video runs as long as the edit');
    add('size', m.width === plan.width && m.height === plan.height, `${m.width}x${m.height}`, `${plan.width}x${plan.height}`, 'the frame is the edit\'s size');
    add('rate', Math.abs(m.fps - plan.fps) < 0.01, m.fps, plan.fps, 'the frame rate is the edit\'s');
    const wantSound = plan.sounds.length > 0;
    add('sound', m.audio === wantSound && (!wantSound || (m.loud?.max ?? -99) > -60), m.audio ? `${m.loud?.lufs} LUFS, peak ${m.loud?.max} dB` : 'none', wantSound ? 'audible' : 'none', wantSound ? 'the edit has sound and the video carries it' : 'the edit has no sound and the video carries none');
    // The sound runs the whole video (AAC may add up to a frame of padding at either end).
    if (wantSound) add('sound length', Math.abs(m.audioDuration - want) <= 1 / plan.fps + 0.05, `${m.audioDuration.toFixed(3)}s`, `${want.toFixed(3)}s`, 'the sound runs as long as the video');
    if (wantSound) add('peak', (m.loud?.max ?? 0) <= THRESHOLDS.peak, m.loud?.max, THRESHOLDS.peak, 'the mix never reaches full scale');
  }
  for (const f of frames.frames) guard(`frame ${f}`, () => {
    const stillPng = join(checksDir, `f${f}.edit.png`);
    const still = rawFrame(root, stillPng);
    const exported = rawFrame(root, file, { frame: f, bt709: true });
    const exportPng = join(checksDir, `f${f}.export.png`);
    ff(root, 'ffmpeg', ['-y', '-v', 'error', '-i', file, '-vf', [...pickFrame(f), 'scale=in_color_matrix=bt709:in_range=tv'].join(','), '-frames:v', '1', '-fps_mode', 'passthrough', exportPng]);
    // Side by side for the eye: the editor's frame on the left, the export on the right.
    ff(root, 'ffmpeg', ['-y', '-v', 'error', '-i', stillPng, '-i', exportPng, '-filter_complex', '[0:v]scale=-2:960[a];[1:v]scale=-2:960[b];[a][b]hstack', '-frames:v', '1', '-q:v', '3', join(checksDir, `f${f}.jpg`)]);
    const p = psnr(still, exported);
    add(`frame ${f}`, p >= THRESHOLDS.psnr, p, THRESHOLDS.psnr, 'the exported frame matches the editor (dB)');
    if (overlay) {
      const drawn = rawFrame(root, overlay.file(f), { rgba: true });
      const d = drawnDiff(still, exported, drawn);
      if (d.pixels) add(`drawn ${f}`, d.diff <= THRESHOLDS.drawn, d.diff, THRESHOLDS.drawn, `the drawn things match the editor over ${d.pixels} pixels`);
    }
  });
  if (frames.caption != null) guard('caption', () => {
    const mask = rawFrame(root, join(checksDir, 'caption.png'), { rgba: true });
    const still = rawFrame(root, join(checksDir, `f${frames.caption}.edit.png`));
    const exported = rawFrame(root, file, { frame: frames.caption, bt709: true });
    const words = drawnDiff(still, exported, mask, 16);
    add('caption', Boolean(overlay) && words.pixels >= THRESHOLDS.drawnPixels && words.diff <= THRESHOLDS.drawn, words, { pixels: THRESHOLDS.drawnPixels, diff: THRESHOLDS.drawn }, 'the caption words draw and match the editor');
  });
  if (!frames.frames.length) add('frames', false, 0, 1, 'no frame could be compared');
  writeJson(join(checksDir, 'checks.json'), checks);
  return { ok: checks.every((c) => c.pass), checks };
}
