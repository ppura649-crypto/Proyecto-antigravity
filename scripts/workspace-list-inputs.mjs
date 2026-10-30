// Keep reusable original takes local. Uploading never means the take is prepared.
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync, createReadStream, createWriteStream, lstatSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { safeFile } from './workspace-state.mjs';
import { InputError } from './workspace-inputs.mjs';
import { readListTake } from './list-reel-progress.mjs';

export const LIST_INPUTS = 'workspace/library/scroll-reel.inputs.json';
export const listInputMember = path => /^workspace\/input\/(?:list-reel|scroll-reel)\//.test(path);
const legacyListInput = path => /^workspace\/input\/quick-cuts\/broll\//.test(path);
export const phoneInputMember = path => /^workspace\/input\/(?:one-shot|phone|quick-cuts\/phone)\//.test(path);
const inputPath = format => format === 'phone' ? 'workspace/library/phone.inputs.json' : LIST_INPUTS;
const inputMember = format => format === 'phone' ? phoneInputMember : listInputMember;
const video = path => typeof path === 'string' && ['.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi'].includes(extname(path).toLowerCase());
const array = value => Array.isArray(value) ? value : [];

export function listDirectory(root, path) {
  let current = '';
  for (const part of path.split('/')) {
    current += (current ? '/' : '') + part;
    try { mkdirSync(join(root, current)); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    if (!safeFile(root, current)?.stat.isDirectory()) throw new InputError(403, 'Keep inputs inside this workspace.');
  }
}
export function readListJson(root, path, fallback) {
  const file = safeFile(root, path);
  if (!file) {
    try { lstatSync(join(root, path)); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
    throw new InputError(403, 'Use a regular file inside this workspace.');
  }
  if (!file.stat.isFile() || file.stat.size > 2 * 1024 ** 2) throw new InputError(409, 'This file cannot be read yet.');
  try { return JSON.parse(readFileSync(file.path, 'utf8')); } catch { throw new InputError(409, 'Your folder is updating. Try again.'); }
}
export function requireListReel(root) {
  if (!array(readListJson(root, 'runtime.json', {})?.packs).some(pack => pack?.name === 'quick-cuts')) throw new InputError(404, 'List Reel is not installed.');
}
function inputLibrary(root, format = 'scroll-reel') {
  const path = inputPath(format);
  const value = readListJson(root, path, { version: 1, items: [], selected: null });
  if (value?.version !== 1 || !Array.isArray(value.items)) throw new InputError(409, 'Your input library is updating. Try again.');
  return value;
}
function writeLibrary(root, value, format = 'scroll-reel') {
  const path = inputPath(format);
  listDirectory(root, dirname(path));
  readListJson(root, path, null);
  const temporary = join(root, `${path}.${randomUUID()}.tmp`);
  try { writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); renameSync(temporary, join(root, path)); }
  finally { rmSync(temporary, { force: true }); }
}

export async function uploadListInput(root, request, params, format = 'scroll-reel') {
  requireListReel(root);
  const name = params.get('name');
  if (!name || name.length > 800 || name.includes('\\') || /[\x00-\x1f]/.test(name) || name.split('/').some(part => !part || part.startsWith('.') || part.includes(':') || part.length > 200)) throw new InputError(400, 'Choose a clip with a plain name.');
  if (!video(name)) throw new InputError(415, 'Add an original video clip.');
  const limit = 20 * 1024 ** 3;
  if (Number(request.headers['content-length']) > limit) throw new InputError(413, 'Add files under 20 GB here.');
  const id = randomUUID(), path = `workspace/input/${format === 'phone' ? 'one-shot' : 'list-reel'}/${id}/${name}`;
  listDirectory(root, dirname(path));
  const temporary = join(root, dirname(path), '.upload'), hash = createHash('sha256');
  let bytes = 0;
  try {
    await pipeline(request, new Transform({ transform(chunk, encoding, done) { bytes += chunk.length; hash.update(chunk); done(bytes > limit ? new InputError(413, 'Add files under 20 GB here.') : null, chunk); } }), createWriteStream(temporary, { flags: 'wx', mode: 0o600 }));
    if (!bytes) throw new InputError(400, 'This clip is empty.');
    const sha256 = hash.digest('hex'), library = inputLibrary(root, format);
    const previous = library.items.find(item => item?.sha256 === sha256 && inputMember(format)(item.path) && safeFile(root, item.path)?.stat.isFile());
    if (previous) return { ...previous, existing: true };
    const item = { id, path, name: basename(name), bytes, sha256, at: new Date().toISOString(), ...(params.get('source') ? { source: params.get('source') } : {}) };
    renameSync(temporary, join(root, path));
    try { writeLibrary(root, { ...library, items: [...library.items, item], selected: library.selected ?? path }, format); }
    catch (error) { rmSync(join(root, path), { force: true }); throw error; }
    return item;
  } finally { rmSync(temporary, { force: true }); }
}

export async function changeListInputs(root, body, format = 'scroll-reel') {
  requireListReel(root);
  if (body?.action === 'select') {
    const path = body.path;
    if (typeof path !== 'string' || !(inputMember(format)(path) || format === 'scroll-reel' && legacyListInput(path)) || !video(path) || !safeFile(root, path)?.stat.isFile()) throw new InputError(400, 'Choose one of your original takes.');
    const library = inputLibrary(root, format);
    writeLibrary(root, { ...library, selected: path }, format);
    return { selected: path };
  }
  if (body?.action && body.action !== 'reuse') throw new InputError(400, 'Choose clips to reuse or select a take.');
  if (!Array.isArray(body?.paths) || !body.paths.length || body.paths.length > 20) throw new InputError(400, 'Choose the takes to add.');
  const sources = [...new Set(body.paths)].map(path => {
    const source = typeof path === 'string' && path.startsWith('workspace/input/') && !inputMember(format)(path) && video(path) && safeFile(root, path);
    if (!source?.stat?.isFile() || source.stat.size <= 0) throw new InputError(400, 'Choose an original from your input folder.');
    return { source, path };
  });
  const items = [];
  for (const { source, path } of sources) {
    const stream = createReadStream(source.path);
    stream.headers = { 'content-length': source.stat.size };
    items.push(await uploadListInput(root, stream, new URLSearchParams({ name: basename(path), source: path }), format));
  }
  return { items };
}

export function listInputState({ root, files, media = {}, library = {}, legacyPaths = [], localPath = value => value, file = () => null }) {
  const selectedLegacy = new Set([library.selected, ...legacyPaths].filter(Boolean).map(localPath).filter(legacyListInput));
  const belongs = path => listInputMember(path) || selectedLegacy.has(path);
  const catalog = Array.isArray(media.clips) ? media.clips.map((clip, index) => [clip?.hash ?? String(index), clip]) : Object.entries(media.clips ?? media);
  const byPath = new Map();
  for (const [hash, clip] of catalog) if (clip?.path) for (const key of new Set([clip.path, ...array(clip.aliases)].map(localPath))) {
    const matches = byPath.get(key) ?? [];
    matches.push({ ...clip, hash }); byPath.set(key, matches);
  }
  const sourceDescriptor = source => {
    const matches = byPath.get(source.path) ?? [], reading = matches.length === 1 ? matches[0] : null;
    const duration = typeof reading?.duration === 'number' && Number.isFinite(reading.duration) && reading.duration > 0 ? reading.duration : null;
    const thumbnail = array(reading?.thumbnails).map(path => file(localPath(path))).find(value => value?.kind === 'image');
    return { path: source.path, name: source.name, url: source.url, duration, ...(thumbnail ? { thumbnail } : {}), reading };
  };
  const clips = files.filter(source => source.kind === 'video' && source.size > 0 && belongs(source.path)).map(source => {
    const { reading, ...descriptor } = sourceDescriptor(source);
    const intake = reading && descriptor.duration && file(localPath(reading.mezzanine))?.kind === 'video';
    const take = intake ? readListTake(source.path, { root, mezzanine: localPath(reading.mezzanine) }) : null;
    const prepared = Boolean(intake && take?.ready);
    const rejected = Boolean(take?.readingPath && !prepared);
    const reason = prepared ? '' : !intake ? 'Prepare this take in chat.' : take?.reason || 'Check where the reel fits on this take.';
    return { ...descriptor, ...(reading?.hash ? { hash: reading.hash } : {}), prepared, status: prepared ? 'ready' : rejected ? 'needs-attention' : 'needs-preparation', reason };
  });
  const available = files.filter(source => source.kind === 'video' && source.size > 0 && source.path.startsWith('workspace/input/') && !belongs(source.path)).map(source => { const { reading, ...descriptor } = sourceDescriptor(source); return { ...descriptor, status: 'available', reason: '' }; });
  const selected = clips.find(clip => clip.path === localPath(library.selected))?.path ?? clips.find(clip => clip.prepared)?.path ?? clips[0]?.path ?? null;
  return { clips, available, total: clips.length, selected, ready: clips.some(clip => clip.path === selected && clip.prepared) };
}
