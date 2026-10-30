// workspace-edit.mjs: what the workspace server does for the video editor. Imported by workspace.mjs; no contract.
//
// The editor opens a project's edit (projects/<id>/edit/timeline.json), making it first from the format's own files
// through the pack's reader when there is none. It saves every change with the previous one kept, measures the pictures
// and sounds the timeline draws (filmstrips and waveforms, cached), takes files dropped onto it, and records an export
// request. It never renders: the export is the agent's, in chat, like every other render.
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { safeFile, canServeMedia, mediaUrl, editExportPrompt } from './workspace-state.mjs';
import { checkDoc, EDIT_VERSION } from './edit-doc.mjs';

const run = promisify(execFile);
export class EditError extends Error { constructor(status, message) { super(message); this.status = status; } }

const PROJECT = /^[a-z0-9][a-z0-9._-]{0,120}$/i;
const KEEP_VERSIONS = 40;
const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.webm']);
const AUDIO = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.opus', '.aif', '.aiff']);
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']);
export const kindOf = (path) => { const e = extname(path).toLowerCase(); return VIDEO.has(e) ? 'video' : AUDIO.has(e) ? 'audio' : IMAGE.has(e) ? 'image' : null; };

// A project with several versions of one video (Trial Reels) opens each as `<project>@<version>`: the same project
// folder, the version's own edit in edit/<version>/, so every version is edited, saved and exported on its own.
const VERSION_ID = /^(?!versions$)[a-z0-9][a-z0-9_-]{0,60}$/i;
function projectPaths(root, key) {
  const parts = typeof key === 'string' ? key.split('@') : [];
  const [id, version = null] = parts;
  if (parts.length < 1 || parts.length > 2 || !PROJECT.test(id) || (version !== null && !VERSION_ID.test(version))) throw new EditError(400, 'Choose a video from your workspace.');
  const rel = `workspace/projects/${id}`;
  const dir = safeFile(root, rel);
  if (!dir?.stat.isDirectory()) throw new EditError(404, 'This video has no project folder.');
  const edit = version ? join(dir.path, 'edit', version) : join(dir.path, 'edit');
  return { id, version, key: version ? `${id}@${version}` : id, rel, dir: dir.path, edit, file: join(edit, 'timeline.json') };
}

const readJson = (path, fallback = null) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };
function writeAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomBytes(6).toString('hex')}.tmp`;
  writeFileSync(temporary, typeof value === 'string' ? value : JSON.stringify(value, null, 1) + '\n');
  renameSync(temporary, path);
}

// ---------------------------------------------------------------------------------------------------------------
// Measuring files. ffprobe and ffmpeg come from the packages first, like every other script.

const onPath = (name) => {
  const found = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  return found.status === 0 ? String(found.stdout).split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? null : null;
};
const tools = new Map();
export function tool(root, name) {
  if (tools.has(name)) return tools.get(name);
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const shipped = join(root, 'node_modules', '@remotion', `compositor-${process.platform}-${process.arch}`, exe);
  const candidates = name === 'ffmpeg' ? [join(root, 'node_modules', 'ffmpeg-static', exe), onPath(name), shipped] : [shipped, onPath(name)];
  const found = candidates.find((c) => c && existsSync(c)) ?? name;
  tools.set(name, found);
  return found;
}
const toolEnv = (bin) => (String(bin).includes('compositor-') ? { ...process.env, DYLD_LIBRARY_PATH: dirname(bin), LD_LIBRARY_PATH: dirname(bin) } : process.env);

const probes = new Map();
export async function probe(root, path) {
  const file = safeFile(root, path);
  if (!file?.stat.isFile()) throw new EditError(404, `${basename(path)} is not in your folder.`);
  const key = `${file.path}:${file.stat.mtimeMs}:${file.stat.size}`;
  if (probes.has(key)) return probes.get(key);
  const bin = tool(root, 'ffprobe');
  const { stdout } = await run(bin, ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,duration:format=duration', '-of', 'json', file.path], { env: toolEnv(bin), maxBuffer: 8 << 20 });
  const info = JSON.parse(stdout);
  const video = info.streams?.find((s) => s.codec_type === 'video');
  const [n, d] = String(video?.r_frame_rate ?? '0/1').split('/').map(Number);
  const result = {
    width: video?.width ?? null, height: video?.height ?? null, fps: d ? n / d : null,
    duration: Number(info.format?.duration ?? video?.duration ?? 0) || 0,
    audio: Boolean(info.streams?.some((s) => s.codec_type === 'audio')), video: Boolean(video) && kindOf(path) !== 'audio',
  };
  probes.set(key, result);
  return result;
}

function cacheFile(root, path, suffix) {
  const file = safeFile(root, path);
  if (!file?.stat.isFile()) throw new EditError(404, 'File not found.');
  const key = createHash('sha1').update(`${path}:${file.stat.mtimeMs}:${file.stat.size}:${suffix}`).digest('hex').slice(0, 20);
  const dir = join(root, '.keyframes', 'editor', 'cache');
  mkdirSync(dir, { recursive: true });
  return { source: file.path, target: join(dir, `${key}${suffix}`) };
}

const pending = new Map();
const once = (key, work) => { if (!pending.has(key)) pending.set(key, work().finally(() => pending.delete(key))); return pending.get(key); };

// A filmstrip: evenly spaced frames of the whole file in one row, 64 px high. The timeline picks the frame nearest each
// tile, so one strip serves every zoom and every trim.
export const STRIP_FRAMES = 48;
let stripWorkers = 0;
const stripQueue = [];
async function withStripWorker(work) {
  if (stripWorkers >= 2) await new Promise((resolve) => stripQueue.push(resolve));
  else stripWorkers++;
  try { return await work(); }
  finally { const next = stripQueue.shift(); if (next) next(); else stripWorkers--; }
}
export async function filmstrip(root, path, window = null) {
  if (!canServeMedia(path) || kindOf(path) !== 'video') throw new EditError(404, 'File not found.');
  const start = Number(window?.start ?? 0), step = Number(window?.step ?? 1);
  if (window && (!Number.isFinite(start) || start < 0 || !Number.isFinite(step) || step < 1 / 240 || step > 600)) throw new EditError(400, 'Invalid thumbnail range.');
  const { source, target } = cacheFile(root, path, window ? `.strip-v2-${start.toFixed(4)}-${step.toFixed(4)}.jpg` : '.strip.jpg');
  if (existsSync(target)) return target;
  return once(target, () => withStripWorker(async () => {
    const info = await probe(root, path);
    if (window && start >= info.duration) throw new EditError(400, 'Thumbnail range is past the video.');
    const rate = window ? 1 / step : Math.max(0.01, STRIP_FRAMES / Math.max(0.1, info.duration));
    const bin = tool(root, 'ffmpeg');
    const temporary = `${target}.${randomBytes(4).toString('hex')}.jpg`;
    try {
      await run(bin, ['-v', 'error', '-y', ...(window ? ['-ss', String(start)] : []), '-i', source, '-an', '-vf', `fps=${rate.toFixed(8)}:start_time=0,scale=-2:64,${window ? `tpad=stop_mode=clone:stop_duration=${step * STRIP_FRAMES},` : ''}tile=${STRIP_FRAMES}x1`, '-frames:v', '1', '-q:v', '4', temporary], { env: toolEnv(bin), timeout: 120000 });
      renameSync(temporary, target);
      return target;
    } finally { rmSync(temporary, { force: true }); }
  }));
}

// A small still for output shelves without a supplied cover. Read past the opening fade and cache by file version.
export async function poster(root, path) {
  if (!canServeMedia(path) || kindOf(path) !== 'video') throw new EditError(404, 'File not found.');
  const { source, target } = cacheFile(root, path, '.poster.jpg');
  if (existsSync(target)) return target;
  return once(target, async () => {
    const info = await probe(root, path);
    const at = Math.max(0, Math.min(1, info.duration / 3));
    const bin = tool(root, 'ffmpeg');
    const temporary = `${target}.${randomBytes(4).toString('hex')}.jpg`;
    try {
      await run(bin, ['-v', 'error', '-y', '-ss', String(at), '-i', source, '-frames:v', '1', '-vf', "scale='if(gt(iw,ih),480,-2)':'if(gt(iw,ih),-2,480)'", '-q:v', '3', temporary], { env: toolEnv(bin), timeout: 30000 });
      renameSync(temporary, target);
      return target;
    } finally { rmSync(temporary, { force: true }); }
  });
}

// An editing copy of a clip: at most 960 px on its long side, a keyframe every half second, sound kept. A finished
// render or a camera file keeps a keyframe every few seconds, so a seek decodes hundreds of frames and play after a
// seek shows a frozen picture; this copy seeks in a few frames. Made once, in the background, and cached. The export
// never reads it.
const proxyState = new Map();
export function editProxy(root, path) {
  if (!canServeMedia(path) || kindOf(path) !== 'video') throw new EditError(404, 'File not found.');
  const { source, target } = cacheFile(root, path, '.proxy.mp4');
  if (existsSync(target)) return { ready: true, file: target };
  if (proxyState.get(target) === 'failed') return { ready: false, failed: true };
  if (!pending.has(target)) {
    once(target, async () => {
      const bin = tool(root, 'ffmpeg');
      const temporary = `${target}.${randomBytes(4).toString('hex')}.mp4`;
      try {
        await run(bin, ['-v', 'error', '-y', '-i', source, '-vf', "scale='if(gt(iw,ih),min(960,iw),-2)':'if(gt(iw,ih),-2,min(960,ih))'", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-g', '15', '-keyint_min', '15', '-sc_threshold', '0', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', temporary], { env: toolEnv(bin), timeout: 15 * 60000 });
        renameSync(temporary, target);
      } catch { rmSync(temporary, { force: true }); proxyState.set(target, 'failed'); }
    }).catch(() => {});
  }
  return { ready: false };
}

// A waveform: the loudest sample in each sixtieth of a second, 0 to 255.
export const WAVE_RATE = 60;
export async function waveform(root, path) {
  if (!canServeMedia(path) || !['video', 'audio'].includes(kindOf(path))) throw new EditError(404, 'File not found.');
  const { source, target } = cacheFile(root, path, '.wave.json');
  if (existsSync(target)) return readFileSync(target, 'utf8');
  return once(target, async () => {
    const bin = tool(root, 'ffmpeg');
    const sampleRate = 6000;
    const { stdout } = await run(bin, ['-v', 'error', '-i', source, '-vn', '-ac', '1', '-ar', String(sampleRate), '-f', 's16le', '-'], { env: toolEnv(bin), encoding: 'buffer', maxBuffer: 1 << 30, timeout: 120000 }).catch(() => ({ stdout: Buffer.alloc(0) }));
    const step = sampleRate / WAVE_RATE;
    const count = Math.floor(stdout.length / 2 / step);
    const peaks = new Array(count);
    for (let i = 0; i < count; i++) {
      let max = 0;
      for (let j = 0; j < step; j++) { const v = Math.abs(stdout.readInt16LE((i * step + j) * 2)); if (v > max) max = v; }
      peaks[i] = Math.min(255, Math.round(Math.sqrt(max / 32768) * 255));
    }
    const text = JSON.stringify({ rate: WAVE_RATE, peaks });
    writeAtomic(target, text);
    return text;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Readers. Each pack may ship editor/<pack>/reader.mjs exporting `formats` and `read(context)`. Without one, the video
// opens as its finished file: one clip, ready to trim and to add words and sound over.

async function readers(root) {
  const base = join(root, 'editor');
  if (!existsSync(base)) return [];
  const found = [];
  for (const pack of readdirSync(base)) {
    const file = join(base, pack, 'reader.mjs');
    if (!existsSync(file)) continue;
    const module = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
    found.push({ pack, formats: module.formats ?? [], read: module.read });
  }
  return found;
}

function latestOutput(root, rel, id, data) {
  const out = typeof data.output === 'string' && /^workspace\/output\/[^/]+\/?$/.test(data.output) ? data.output.replace(/\/$/, '') : `workspace/output/${id}`;
  const dir = safeFile(root, out);
  if (!dir?.stat.isDirectory()) return null;
  // An export of the edit (edit-r<n>.mp4, <version>-edit-r<n>.mp4) is not the format's video: reading it back would stack an edit on its own export.
  const videos = readdirSync(dir.path).filter((f) => VIDEO.has(extname(f).toLowerCase()) && !f.startsWith('.') && !/(^|-)edit-r\d+\.mp4$/.test(f)).map((f) => ({ f, t: statSync(join(dir.path, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  return videos[0] ? `${out}/${videos[0].f}` : null;
}

export async function finishedVideoDoc(context, path) {
  const info = await context.probe(path);
  const fps = Math.round(info.fps || 30);
  const frames = Math.max(1, Math.round(info.duration * fps));
  return {
    fps, width: info.width || 1080, height: info.height || 1920,
    tracks: [{ id: 'video', name: 'Video', kind: 'visual', keep: true }, { id: 'sound', name: 'Sound', kind: 'audio', keep: true }],
    items: [{ id: 'finished', track: 'video', type: 'video', label: 'Your video', from: 0, durationInFrames: frames, trimStart: 0, src: path, sourceDurationInFrames: frames, volume: 1 }],
  };
}

async function readProject(root, paths) {
  const data = readJson(join(paths.dir, 'project.json'), {}) ?? {};
  const format = data.format?.id ?? data.format ?? (paths.id.match(/^\d{4}-\d{2}-\d{2}-(talking-head|trial-reels|beat-montage|product-demo|scroll-reel|phone)/)?.[1] ?? null);
  const context = {
    root, project: { id: paths.id, version: paths.version, path: paths.rel, dir: paths.dir, data, format },
    probe: (path) => probe(root, path),
    readJson: (path, fallback = null) => { const f = safeFile(root, path); return f?.stat.isFile() ? readJson(f.path, fallback) : fallback; },
    exists: (path) => Boolean(safeFile(root, path)),
    list: (path) => { const f = safeFile(root, path); return f?.stat.isDirectory() ? readdirSync(f.path).filter((n) => !n.startsWith('.')).sort() : []; },
    output: () => latestOutput(root, paths.rel, paths.id, data),
    finishedVideoDoc: (path) => finishedVideoDoc(context, path),
  };
  let doc = null;
  let reader = 'finished-video';
  const match = (await readers(root)).find((r) => r.formats.includes(format) && typeof r.read === 'function');
  if (match) {
    doc = await match.read(context);
    reader = `${match.pack}/${format}`;
  }
  if (!doc && format === 'edit') {
    doc = await blankDoc(context, data);
    reader = 'blank';
  }
  if (!doc) {
    const output = context.output();
    if (!output) throw new EditError(404, 'This video has nothing to edit yet.');
    doc = await finishedVideoDoc(context, output);
  }
  const full = { markers: [], background: '#000000', ...doc, version: EDIT_VERSION, project: paths.id, format, name: doc.name ?? data.title ?? data.name ?? paths.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '), revision: 1, source: { reader, readAt: new Date().toISOString(), ...(doc.source ?? {}) } };
  full.durationInFrames = Math.max(1, ...full.items.map((i) => i.from + i.durationInFrames));
  const problems = checkDoc(full);
  if (problems.length) throw new EditError(500, `This video could not be opened for editing: ${problems[0]}`);
  return full;
}

// A video started in the editor, not by a format: an empty Video track and a Sounds track at the size asked for, or
// the files it was started from laid end to end, the canvas taking the first clip's shape.
const even = (v) => Math.max(2, Math.round(v / 2) * 2);
async function blankDoc(context, data) {
  const fps = Number(data.fps) > 0 ? Math.round(Number(data.fps)) : 30;
  let width = Number(data.width) > 0 ? even(Number(data.width)) : null;
  let height = Number(data.height) > 0 ? even(Number(data.height)) : null;
  const from = Array.isArray(data.from) ? data.from : [];
  const clips = [];
  for (const path of from) {
    const kind = kindOf(path);
    const info = kind === 'image' ? null : await context.probe(path).catch(() => null);
    clips.push({ path, kind, info });
  }
  const first = clips.find((c) => c.kind === 'video' && c.info?.width);
  if (!width || !height) {
    if (first) { const k = 1080 / Math.min(first.info.width, first.info.height); width = even(first.info.width * k); height = even(first.info.height * k); }
    else { width = 1080; height = 1920; }
  }
  const items = [];
  let at = 0, sound = 0;
  for (const [n, clip] of clips.entries()) {
    const label = basename(clip.path, extname(clip.path));
    if (clip.kind === 'audio' && clip.info?.duration) {
      const frames = Math.max(1, Math.round(clip.info.duration * fps));
      items.push({ id: `a${n}`, track: 'sounds', type: 'audio', label, from: sound, durationInFrames: frames, trimStart: 0, src: clip.path, sourceDurationInFrames: frames, volume: 1 });
      sound += frames;
    } else if (clip.kind === 'video' && clip.info?.duration) {
      const frames = Math.max(1, Math.round(clip.info.duration * fps));
      const fit = clip.info.width ? Math.min(width / clip.info.width, height / clip.info.height) : 1;
      const size = clip.info.width && Math.abs(clip.info.width / clip.info.height - width / height) > 0.02 * (width / height) ? { w: Math.round(clip.info.width * fit), h: Math.round(clip.info.height * fit) } : null;
      items.push({ id: `v${n}`, track: 'video', type: 'video', label, from: at, durationInFrames: frames, trimStart: 0, src: clip.path, sourceDurationInFrames: frames, volume: clip.info.audio ? 1 : 0, transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }, ...(size ? { size } : {}) });
      at += frames;
    } else if (clip.kind === 'image') {
      items.push({ id: `i${n}`, track: 'video', type: 'image', label, from: at, durationInFrames: fps * 3, trimStart: 0, src: clip.path, fit: 'contain', size: { w: width, h: height }, transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 } });
      at += fps * 3;
    }
  }
  return {
    fps, width, height, background: '#000000',
    tracks: [{ id: 'video', name: 'Video', kind: 'visual', keep: true }, { id: 'sounds', name: 'Sounds', kind: 'audio', keep: true }],
    items,
  };
}

// POST /api/edit/new {name?, width?, height?, fps?, from?: [workspace paths], clip?: workspace path}: a new project folder,
// workspace/projects/<date>-edit-<slug>/, with project.json and its first edit. Returns { project }.
export async function newEdit(root, body) {
  // `from` names several files, `clip` one; both start the video with those files laid end to end.
  const from = (Array.isArray(body?.from) ? body.from : typeof body?.clip === 'string' ? [body.clip] : []).slice(0, 60);
  for (const path of from) {
    if (typeof path !== 'string' || !kindOf(path) || !canServeMedia(path) || !safeFile(root, path)?.stat.isFile()) throw new EditError(400, `${basename(String(path))} is not a clip, picture or sound in your folder.`);
  }
  const fromName = from.length ? basename(from[0], extname(from[0])) : '';
  const title = String(body?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) || fromName.replace(/[-_]+/g, ' ') || 'New video';
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'video';
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const base = `${date}-edit-${slug}`;
  mkdirSync(join(root, 'workspace', 'projects'), { recursive: true });
  let id = base;
  for (let n = 2; existsSync(join(root, 'workspace', 'projects', id)); n++) id = `${base}-${n}`;
  const size = (v) => (Number.isFinite(Number(v)) && Number(v) >= 16 && Number(v) <= 4096 ? Number(v) : undefined);
  const data = { format: 'edit', title, createdAt: now.toISOString(), ...(size(body?.width) ? { width: size(body.width) } : {}), ...(size(body?.height) ? { height: size(body.height) } : {}), ...(Number(body?.fps) > 0 && Number(body.fps) <= 120 ? { fps: Number(body.fps) } : {}), ...(from.length ? { from } : {}) };
  mkdirSync(join(root, 'workspace', 'projects', id), { recursive: true });
  writeAtomic(join(root, 'workspace', 'projects', id, 'project.json'), data);
  await readEdit(root, id);
  return { project: id, url: `/edit/${id}` };
}

// ---------------------------------------------------------------------------------------------------------------
// The HTTP side.

function mediaCatalog(root, paths = null) {
  const out = [];
  const walk = (rel, depth, group) => {
    const dir = safeFile(root, rel);
    if (!dir?.stat.isDirectory() || depth > 4) return;
    for (const name of readdirSync(dir.path).sort()) {
      if (name.startsWith('.') || out.length > 600) continue;
      const path = `${rel}/${name}`;
      const f = safeFile(root, path);
      if (!f) continue;
      if (f.stat.isDirectory()) { walk(path, depth + 1, group); continue; }
      const kind = kindOf(name);
      if (kind && canServeMedia(path)) out.push({ path, name, kind, group, url: mediaUrl(path, f.stat.mtimeMs.toString(36)), size: f.stat.size, updatedAt: f.stat.mtime.toISOString() });
    }
  };
  // The video's own files first (its assets and its finished renders), then everything the buyer brought.
  if (paths) { walk(`${paths.rel}/assets`, 0, 'project'); walk(`workspace/output/${paths.id}`, 0, 'output'); }
  walk('workspace/input', 0, 'yours');
  walk('workspace/library', 0, 'yours');
  for (const pack of ['talking-head', 'quick-cuts', 'trial-reels', 'product-demo']) walk(`assets/${pack}/sfx`, 0, 'sounds');
  return out;
}

export async function readEdit(root, id, { fresh = false } = {}) {
  const paths = projectPaths(root, id);
  let doc = fresh ? null : readJson(paths.file);
  if (!doc) {
    doc = await readProject(root, paths);
    writeAtomic(paths.file, doc);
  }
  const request = readJson(join(paths.edit, 'export-request.json'));
  const exports = existsSync(join(paths.edit, 'exports.json')) ? readJson(join(paths.edit, 'exports.json'), []) : [];
  return { doc, media: mediaCatalog(root, paths), request, exports };
}

export function saveEdit(root, body) {
  const paths = projectPaths(root, body?.project);
  const current = readJson(paths.file);
  if (!current) throw new EditError(404, 'Open this video again.');
  const doc = body.doc;
  if (!doc || typeof doc !== 'object') throw new EditError(400, 'Send the edit as JSON.');
  if (Number(body.revision) !== Number(current.revision)) throw Object.assign(new EditError(409, 'This edit changed somewhere else. Reload to see it.'), { current });
  const problems = checkDoc(doc);
  if (problems.length) throw new EditError(422, problems[0]);
  const versions = join(paths.edit, 'versions');
  mkdirSync(versions, { recursive: true });
  writeAtomic(join(versions, `${String(current.revision).padStart(5, '0')}.json`), current);
  const old = readdirSync(versions).filter((f) => f.endsWith('.json')).sort();
  for (const f of old.slice(0, Math.max(0, old.length - KEEP_VERSIONS))) rmSync(join(versions, f), { force: true });
  const next = { ...doc, project: current.project, format: current.format, version: EDIT_VERSION, revision: current.revision + 1, source: current.source, editedAt: new Date().toISOString() };
  writeAtomic(paths.file, next);
  return { revision: next.revision, editedAt: next.editedAt };
}

export function requestExport(root, body) {
  const paths = projectPaths(root, body?.project);
  const current = readJson(paths.file);
  if (!current) throw new EditError(404, 'Open this video again.');
  const request = { project: paths.id, ...(paths.version ? { version: paths.version } : {}), revision: current.revision, requestedAt: new Date().toISOString(), status: 'requested' };
  writeAtomic(join(paths.edit, 'export-request.json'), request);
  const name = current.name || paths.id;
  return { request, prompt: paths.version ? `Export my edit of "${name}", version ${paths.version} (workspace/projects/${paths.id}/edit/${paths.version}/timeline.json, revision ${current.revision}).` : editExportPrompt(name, paths.id, current.revision) };
}

// A file dropped onto the editor goes into workspace/input/editor/, under its own name, never over another file.
export async function uploadEditFile(root, req, params) {
  const raw = String(params.get('name') ?? '').normalize('NFC');
  const ext = extname(raw).toLowerCase();
  if (!kindOf(raw)) throw new EditError(415, 'Drop a video, a picture or a sound.');
  const stem = basename(raw, extname(raw)).replace(/[^\p{L}\p{N}._ -]+/gu, '').replace(/\s+/g, '-').slice(0, 80) || 'file';
  const size = Number(req.headers['content-length']);
  if (!Number.isFinite(size) || size <= 0) throw new EditError(411, 'This file is empty.');
  if (size > 4 * 1024 ** 3) throw new EditError(413, 'This file is over 4 GB.');
  const dirRel = 'workspace/input/editor';
  mkdirSync(join(root, dirRel), { recursive: true });
  let name = `${stem}${ext}`;
  for (let n = 2; existsSync(join(root, dirRel, name)); n++) name = `${stem}-${n}${ext}`;
  const target = join(root, dirRel, name);
  const temporary = `${target}.${randomBytes(6).toString('hex')}.part`;
  await new Promise((accept, reject) => {
    const out = createWriteStream(temporary, { flags: 'wx' });
    let written = 0;
    req.on('data', (chunk) => { written += chunk.length; if (written > size) { req.destroy(); reject(new EditError(400, 'The upload was larger than announced.')); } });
    req.pipe(out);
    out.on('finish', accept);
    out.on('error', reject);
    req.on('error', reject);
  }).catch((error) => { rmSync(temporary, { force: true }); throw error; });
  renameSync(temporary, target);
  const path = `${dirRel}/${name}`;
  const info = kindOf(name) === 'image' ? null : await probe(root, path).catch(() => null);
  return { path, name, kind: kindOf(name), group: 'yours', url: mediaUrl(path, Date.now().toString(36)), info };
}

// Files a format's own components load with staticFile(): the project first, then each installed format's public
// folder. Fonts, logos and pictures only.
const STATIC = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.ttf', '.otf', '.woff', '.woff2', '.mp4', '.mov', '.webm', '.wav', '.mp3', '.m4a', '.json']);
export function staticFor(root, id, path) {
  if (!STATIC.has(extname(path).toLowerCase())) return null;
  const paths = projectPaths(root, id);
  // A project that renders with its own public folder (Product Demo keeps it at source/public) is searched next.
  const bases = [paths.rel, `${paths.rel}/public`, `${paths.rel}/source/public`];
  for (const top of ['engine', 'remotion']) {
    const dir = safeFile(root, top);
    if (!dir?.stat.isDirectory()) continue;
    for (const pack of readdirSync(dir.path).sort()) {
      bases.push(`${top}/${pack}/public`, `${top}/${pack}/remotion/public`);
    }
  }
  for (const base of bases) {
    const file = safeFile(root, `${base}/${path}`);
    if (file?.stat.isFile()) return file;
  }
  return null;
}

export const editorPage = (id) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Keyframes / Edit</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Martian+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/editor/editor.css?project=${encodeURIComponent(String(id).split('@')[0].replace(/[^a-z0-9._-]/gi, ''))}"></head><body><div id="editor" data-project="${String(id).replace(/[^a-z0-9._@-]/gi, '')}"></div><script>window.remotion_staticBase=${JSON.stringify(`/edit-static/${id}`)};</script><script type="module" src="/editor/editor.js?project=${encodeURIComponent(String(id).split('@')[0].replace(/[^a-z0-9._-]/gi, ''))}"></script></body></html>`;
