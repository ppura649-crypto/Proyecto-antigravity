// Buyer-owned Markdown is editable. Other files and command execution stay outside HTTP.
import { lstatSync, realpathSync, readdirSync, readFileSync, mkdirSync, openSync, closeSync, writeFileSync, fsyncSync, fchmodSync, renameSync, rmSync } from 'node:fs';
import { resolve, join, dirname, basename, extname, sep } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

export const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;
const excluded = new Set(['node_modules', '.git', '.keyframes', '.cache', 'cache', 'caches', '__pycache__', '.venv', 'venv', '.next', '.turbo', '.pytest_cache', '.mypy_cache', '.npm', '.pnpm-store', '.yarn']);
const revisionOf = (bytes) => createHash('sha256').update(bytes).digest('hex');

export class MarkdownError extends Error {
  constructor(status, message, document) { super(message); this.status = status; this.document = document; }
}

function partsFor(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0') || path.startsWith('/') || /^[a-z]:/i.test(path) || extname(path).toLowerCase() !== '.md') throw new MarkdownError(400, 'Choose a Markdown file in this folder.');
  const parts = path.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..' || excluded.has(part.toLowerCase()))) throw new MarkdownError(400, 'Choose a Markdown file in this folder.');
  return parts;
}

function targetAt(root, path, { missing = false } = {}) {
  const base = realpathSync(resolve(root));
  const parts = partsFor(path);
  let target = base;
  let absent = false;
  for (let index = 0; index < parts.length; index++) {
    target = join(target, parts[index]);
    if (absent) continue;
    let stat;
    try { stat = lstatSync(target); } catch (error) {
      if (error.code === 'ENOENT' && missing) { absent = true; continue; }
      if (error.code === 'ENOENT') throw new MarkdownError(404, 'This file is no longer here.');
      throw error;
    }
    if (stat.isSymbolicLink() || (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new MarkdownError(403, 'Choose a local Markdown file.');
  }
  if (!target.startsWith(base + sep)) throw new MarkdownError(403, 'Choose a file in this folder.');
  return { path: target, exists: !absent, stat: absent ? null : lstatSync(target) };
}

function canCreate(root, path) {
  if (path === 'context/preferences.md') return true;
  let manifest;
  try {
    const file = join(realpathSync(resolve(root)), 'runtime.json');
    if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) return false;
    manifest = JSON.parse(readFileSync(file, 'utf8'));
  } catch { return false; }
  const packs = Array.isArray(manifest.packs) ? manifest.packs.map((pack) => pack.name) : [];
  const formats = packs.flatMap((pack) => pack === 'quick-cuts' ? ['quick-cuts', 'beat-montage', 'scroll-reel', 'phone'] : ['talking-head', 'trial-reels'].includes(pack) ? [pack] : []);
  const template = path.match(/^workspace\/library\/beat-montage\/([a-z0-9-]+)\/preferences\.md$/)?.[1];
  if (packs.includes('quick-cuts') && template) {
    const ids = new Set(['square', 'above']);
    for (const source of ['assets/quick-cuts/beat-montage/catalog.json', 'workspace/library/beat-montage.catalog.local.json', 'workspace/library/beat-montage.library.json']) {
      try {
        let file = realpathSync(resolve(root));
        for (const part of source.split('/')) { file = join(file, part); if (lstatSync(file).isSymbolicLink()) throw Error('Not local.'); }
        const value = JSON.parse(readFileSync(file, 'utf8'));
        for (const id of Array.isArray(value.templates) ? value.templates.map(t => t.id) : Object.keys(value.templates || {})) ids.add(id);
      } catch {}
    }
    return ids.has(template);
  }
  return formats.some((format) => path === `workspace/library/${format}.preferences.md`);
}

export function readMarkdown(root, path) {
  const file = targetAt(root, path, { missing: true });
  if (!file.exists) {
    if (!canCreate(root, path)) throw new MarkdownError(404, 'This file is no longer here.');
    return { path, name: basename(path), text: '', revision: null, exists: false };
  }
  if (file.stat.size > MAX_MARKDOWN_BYTES) throw new MarkdownError(413, 'This file is too large to edit here.');
  const bytes = readFileSync(file.path);
  if (bytes.length > MAX_MARKDOWN_BYTES) throw new MarkdownError(413, 'This file is too large to edit here.');
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes)) throw new MarkdownError(422, 'This file must use UTF-8 text.');
  return { path, name: basename(path), text, revision: revisionOf(bytes), exists: true };
}

export function scanMarkdown(root) {
  const base = realpathSync(resolve(root));
  const files = [];
  const folders = [''];
  while (folders.length) {
    const folder = folders.pop();
    let entries;
    try {
      // Recheck each parent before walking so a changed directory cannot become a link.
      let checked = base;
      for (const part of folder.split('/').filter(Boolean)) {
        checked = join(checked, part);
        const stat = lstatSync(checked);
        if (stat.isSymbolicLink() || !stat.isDirectory()) throw Error('Not a local directory.');
      }
      entries = readdirSync(checked, { withFileTypes: true });
    } catch { continue; }
    for (const entry of entries) {
      if (entry.isSymbolicLink() || excluded.has(entry.name.toLowerCase())) continue;
      const path = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { folders.push(path); continue; }
      if (!entry.isFile() || extname(entry.name).toLowerCase() !== '.md') continue;
      try {
        const file = targetAt(base, path);
        files.push({ path, name: entry.name, kind: 'markdown', size: file.stat.size, updatedAt: file.stat.mtime.toISOString(), exists: true });
      } catch {}
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function saveMarkdown(root, { path, text, revision } = {}) {
  if (typeof text !== 'string' || !(revision === null || typeof revision === 'string')) throw new MarkdownError(400, 'Send the file text and its current revision.');
  if (Buffer.byteLength(text, 'utf8') > MAX_MARKDOWN_BYTES) throw new MarkdownError(413, 'This file is too large to edit here.');
  const current = readMarkdown(root, path);
  if (current.revision !== revision) throw new MarkdownError(409, 'This file changed in your folder. Review the latest version before saving.', current);
  let file = targetAt(root, path, { missing: true });
  if (!file.exists) {
    let parent = realpathSync(resolve(root));
    for (const part of partsFor(path).slice(0, -1)) {
      parent = join(parent, part);
      try { mkdirSync(parent); } catch (error) { if (error.code !== 'EEXIST') throw error; }
      const stat = lstatSync(parent);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new MarkdownError(403, 'Choose a local Markdown file.');
    }
    file = targetAt(root, path, { missing: true });
  }
  const temporary = join(dirname(file.path), `.keyframes-save-${randomBytes(12).toString('hex')}.tmp`);
  const mode = file.stat ? file.stat.mode & 0o777 : 0o600;
  let fd;
  try {
    fd = openSync(temporary, 'wx', mode);
    writeFileSync(fd, text, 'utf8');
    fchmodSync(fd, mode);
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    const latest = readMarkdown(root, path);
    if (latest.revision !== revision) throw new MarkdownError(409, 'This file changed in your folder. Review the latest version before saving.', latest);
    targetAt(root, path, { missing: true });
    renameSync(temporary, file.path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(temporary, { force: true });
  }
  return { path, name: basename(path), text, revision: revisionOf(Buffer.from(text, 'utf8')), exists: true };
}
