#!/usr/bin/env node
// workspace.mjs [--ensure] [--no-open] [--port <number>] [--root <folder>]
// The agent starts this view. HTTP saves Markdown and inputs; studies and renders stay in chat.
import { createServer } from 'node:http';
import { createReadStream, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, openSync, closeSync, realpathSync, renameSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readWorkspace, workspaceId, safeFile, canServeMedia } from './workspace-state.mjs';
import { readMarkdown, saveMarkdown, MarkdownError, MAX_MARKDOWN_BYTES } from './workspace-markdown.mjs';
import { uploadInput, changeInput, InputError } from './workspace-inputs.mjs';
import { saveBeatReferences } from './beat-references.mjs';
import { uploadBeatInput, reuseBeatInputs } from './workspace-beat-inputs.mjs';
import { changeListIdeas } from './workspace-list-reel.mjs';
import { uploadListInput, changeListInputs } from './workspace-list-inputs.mjs';
import {updateBeatLibrary, uploadBeatLibraryInput, BeatLibraryError} from './workspace-beat-library.mjs';
import {changeOneShotBatches} from './workspace-one-shot.mjs';
import {saveOnboarding, OnboardingError} from './workspace-onboarding.mjs';
import {saveProductVoiceKey, ProductVoiceKeyError} from './product-demo-voice.mjs';
import {saveTalkingStyle, TalkingStyleError} from './talking-head-style.mjs';
import {readEdit, saveEdit, requestExport, newEdit, editProxy, uploadEditFile, filmstrip, poster, waveform, staticFor, editorPage, probe, EditError} from './workspace-edit.mjs';
import {buildEditor} from './edit-build.mjs';

const modulePath = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(modulePath), '..');
const SERVICE_VERSION = 19;
const MIME = { '.flac':'audio/flac', '.opus':'audio/ogg', '.aac':'audio/aac', '.aif':'audio/aiff', '.aiff':'audio/aiff', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8' };

function reply(res, code, content, type = 'text/plain; charset=utf-8', head = false) {
  res.writeHead(code, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(content), 'Cache-Control': 'no-store' });
  res.end(head ? undefined : content);
}

async function markdownBody(req, limit = MAX_MARKDOWN_BYTES * 6 + 65536) {
  // JSON escaping can expand one text byte into six request bytes.
  if (Number(req.headers['content-length']) > limit) throw new MarkdownError(413, 'This file is too large to edit here.');
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw new MarkdownError(413, 'This file is too large to edit here.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value;
  } catch { throw new MarkdownError(400, 'Send valid JSON with the file text.'); }
}

function serveFile(req, res, file, { generatedPage = false } = {}) {
  if (!file?.stat.isFile()) return reply(res, 404, 'File not found.', undefined, req.method === 'HEAD');
  const size = file.stat.size;
  const type = MIME[extname(file.path).toLowerCase()] ?? 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes', 'Last-Modified': file.stat.mtime.toUTCString() };
  if (['.zip','.pdf','.rtf','.heic','.heif'].includes(extname(file.path).toLowerCase())) headers['Content-Disposition']='attachment';
  if (generatedPage) {
    // Old generated pages keep their own scripts, but cannot reach the app, submit a
    // save or inherit the workspace origin. The outer UI also uses a sandboxed frame.
    headers['Content-Security-Policy'] = "sandbox allow-scripts allow-downloads; connect-src 'none'; form-action 'none'; frame-src 'none'";
  }
  let start = 0, end = size - 1, status = 200;
  if (req.headers.range) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!range || (!range[1] && !range[2]) || size === 0) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }); res.end(); return; }
    if (!range[1]) start = Math.max(0, size - Number(range[2]));
    else { start = Number(range[1]); if (range[2]) end = Math.min(end, Number(range[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }); res.end(); return; }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = Math.max(0, end - start + 1);
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || size === 0) return res.end();
  const stream = createReadStream(file.path, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

export async function startWorkspace({ root = defaultRoot, port = 0, uiRoot } = {}) {
  root = realpathSync(resolve(root));
  uiRoot = resolve(uiRoot ?? join(root, 'scripts/workspace-ui'));
  const id = workspaceId(root);
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    const head = req.method === 'HEAD';
    const expectedHost = `127.0.0.1:${server.address().port}`;
    if (req.headers.host !== expectedHost) return reply(res, 403, 'This page belongs to your local workspace.', undefined, head);
    let path;
    try {
      path = decodeURIComponent(req.url.split('?')[0]);
      if (path.includes('\\') || path.includes('\0') || path.split('/').some((part) => part === '..' || part === '.')) throw Error();
    } catch { return reply(res, 400, 'Invalid path.', undefined, head); }
    const markdownWrite = path === '/api/markdown' && req.method === 'PUT';
    const onboardingWrite = path === '/api/onboarding' && req.method === 'POST';
    const voiceKeyWrite = path === '/api/product-demo/key' && req.method === 'POST';
    const styleWrite = path === '/api/talking-head/style' && req.method === 'POST';
    const beatInputWrite = path === '/api/beat-inputs' && ['PUT','POST'].includes(req.method);
    const beatReferenceWrite = path === '/api/beat-references' && req.method === 'POST';
    const beatLibraryWrite = path === '/api/beat-library' && req.method === 'POST';
    const beatLibraryUpload = path === '/api/beat-library/upload' && req.method === 'PUT';
    const listIdeaWrite = ['/api/list-reel','/api/one-shot-ideas'].includes(path) && req.method === 'POST';
    const listInputWrite = ['/api/list-inputs','/api/one-shot-inputs'].includes(path) && ['PUT', 'POST'].includes(req.method);
    const batchWrite = path === '/api/one-shot-batches' && req.method === 'POST';
    // The editor saves its timeline, takes dropped files and records an export request. It never renders.
    const editWrite = (path === '/api/edit' && req.method === 'PUT') || (path === '/api/edit/export' && req.method === 'POST') || (path === '/api/edit/new' && req.method === 'POST') || (path === '/api/edit/upload' && req.method === 'PUT');
    const inputWrite = batchWrite || beatLibraryWrite || beatLibraryUpload || listIdeaWrite || listInputWrite || beatReferenceWrite || beatInputWrite || path === '/api/trial-inputs' && ['POST','PUT'].includes(req.method);
    if (!['GET', 'HEAD'].includes(req.method) && !markdownWrite && !inputWrite && !onboardingWrite && !voiceKeyWrite && !styleWrite && !editWrite) { res.setHeader('Allow', ['/api/onboarding','/api/product-demo/key','/api/talking-head/style'].includes(path) ? 'POST' : path === '/api/markdown' ? 'GET, HEAD, PUT' : ['/api/trial-inputs', '/api/beat-inputs', '/api/list-inputs'].includes(path) ? 'POST, PUT' : ['/api/list-reel', '/api/beat-references'].includes(path) ? 'POST' : 'GET, HEAD'); return reply(res, 405, 'This action is not available.', undefined, head); }
    if (styleWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'talking-style' || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? ''))) return reply(res, 403, JSON.stringify({error:'Pick from your workspace page.'}), MIME['.json']);
    if (voiceKeyWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'voice-key')) return reply(res, 403, JSON.stringify({error:'Save from your workspace page.'}), MIME['.json']);
    if (voiceKeyWrite && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(res, 415, JSON.stringify({error:'Send your key from the setup form.'}), MIME['.json']);
    if (onboardingWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'onboarding')) return reply(res, 403, JSON.stringify({ error: 'Save from your workspace page.' }), MIME['.json']);
    if (onboardingWrite && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(res, 415, JSON.stringify({ error: 'Send your setup as JSON.' }), MIME['.json']);
    if (inputWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'inputs')) return reply(res, 403, JSON.stringify({ error: 'Add inputs from your workspace page.' }), MIME['.json']);
    if (inputWrite && req.method === 'POST' && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(res, 415, JSON.stringify({ error: 'Send the input details as JSON.' }), MIME['.json']);
    if (editWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'edit')) return reply(res, 403, JSON.stringify({ error: 'Save from your editor.' }), MIME['.json']);
    if (editWrite && path !== '/api/edit/upload' && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(res, 415, JSON.stringify({ error: 'Send the edit as JSON.' }), MIME['.json']);
    if (markdownWrite && (req.headers.origin !== `http://${expectedHost}` || req.headers['x-keyframes-write'] !== 'markdown')) return reply(res, 403, JSON.stringify({ error: 'Save from your workspace page.' }), MIME['.json']);
    if (markdownWrite && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(res, 415, JSON.stringify({ error: 'Send the file as JSON.' }), MIME['.json']);
    const publicFont = /^\/media\/assets\/(talking-head|trial-reels|quick-cuts)\/.+\.(ttf|otf|woff2?)$/i.test(path);
    const isolatedFont = publicFont && req.headers.origin === 'null';
    if (req.headers.origin && req.headers.origin !== `http://${expectedHost}` && !isolatedFont) return reply(res, 403, 'This page belongs to your local workspace.', undefined, head);
    try {
      if (styleWrite) return reply(res, 200, JSON.stringify(saveTalkingStyle(root, await markdownBody(req, 4096))), MIME['.json']);
      if (voiceKeyWrite) return reply(res, 200, JSON.stringify(saveProductVoiceKey(root, await markdownBody(req, 16384))), MIME['.json']);
      if (onboardingWrite) return reply(res, 200, JSON.stringify(saveOnboarding(root, await markdownBody(req, 16384))), MIME['.json']);
      if (path === '/api/health') return reply(res, 200, JSON.stringify({ workspaceId: id, pid: process.pid, version: SERVICE_VERSION, uiRoot, capabilities: ['editor','onboarding','markdown-write','trial-inputs','trial-rounds','beat-inputs','beat-references','beat-library','list-reel','list-inputs','one-shot','one-shot-batches','current-project-previews','source-diagnostics'] }), MIME['.json'], head);
      if (path.startsWith('/api/edit')) {
        const params = new URL(req.url, `http://${expectedHost}`).searchParams;
        if (path === '/api/edit' && req.method === 'PUT') return reply(res, 200, JSON.stringify(saveEdit(root, await markdownBody(req, 32 * 1024 * 1024))), MIME['.json']);
        if (path === '/api/edit/export') return reply(res, 200, JSON.stringify(requestExport(root, await markdownBody(req, 65536))), MIME['.json']);
        if (path === '/api/edit/new') return reply(res, 200, JSON.stringify(await newEdit(root, await markdownBody(req, 65536))), MIME['.json']);
        if (path === '/api/edit/upload') return reply(res, 200, JSON.stringify(await uploadEditFile(root, req, params)), MIME['.json']);
        if (path === '/api/edit') return reply(res, 200, JSON.stringify(await readEdit(root, params.get('project'), { fresh: params.get('fresh') === '1' })), MIME['.json'], head);
        if (path === '/api/edit/strip') { const strip = await filmstrip(root, params.get('path'), params.has('step') ? { start: params.get('start'), step: params.get('step') } : null); return serveFile(req, res, { path: strip, stat: statSync(strip) }); }
        if (path === '/api/edit/poster') { const image = await poster(root, params.get('path')); return serveFile(req, res, { path: image, stat: statSync(image) }); }
        if (path === '/api/edit/probe') return canServeMedia(params.get('path')) ? reply(res, 200, JSON.stringify(await probe(root, params.get('path'))), MIME['.json'], head) : reply(res, 404, JSON.stringify({ error: 'File not found.' }), MIME['.json'], head);
        if (path === '/api/edit/wave') return reply(res, 200, await waveform(root, params.get('path')), MIME['.json'], head);
        if (path === '/api/edit/proxy') { const proxy = editProxy(root, params.get('path')); if (params.get('check') === '1' || !proxy.ready) return reply(res, 200, JSON.stringify({ ready: proxy.ready, failed: Boolean(proxy.failed) }), MIME['.json'], head); return serveFile(req, res, { path: proxy.file, stat: statSync(proxy.file) }); }
        return reply(res, 404, 'Page not found.', undefined, head);
      }
      if (path === '/api/workspace') return reply(res, 200, JSON.stringify(readWorkspace(root)), MIME['.json'], head);
      if (path === '/api/markdown') {
        const document = markdownWrite ? saveMarkdown(root, await markdownBody(req)) : readMarkdown(root, new URL(req.url, `http://${expectedHost}`).searchParams.get('path'));
        return reply(res, 200, JSON.stringify(document), MIME['.json'], head);
      }
      if (inputWrite) {
        if(batchWrite) return reply(res,200,JSON.stringify(changeOneShotBatches(root,await markdownBody(req))),MIME['.json']);
        const params=new URL(req.url,`http://${expectedHost}`).searchParams;
        if (beatLibraryWrite || beatLibraryUpload) return reply(res, 200, JSON.stringify(beatLibraryUpload ? await uploadBeatLibraryInput(root, req, params) : await updateBeatLibrary(root, await markdownBody(req))), MIME['.json']);
        if (listIdeaWrite) return reply(res, 200, JSON.stringify(changeListIdeas(root, await markdownBody(req), path === '/api/one-shot-ideas' ? 'phone' : 'scroll-reel')), MIME['.json']);
        if (listInputWrite) return reply(res, 200, JSON.stringify(req.method === 'PUT' ? await uploadListInput(root, req, params, path === '/api/one-shot-inputs' ? 'phone' : 'scroll-reel') : await changeListInputs(root, await markdownBody(req), path === '/api/one-shot-inputs' ? 'phone' : 'scroll-reel')), MIME['.json']);
        const item = beatReferenceWrite ? saveBeatReferences(root,await markdownBody(req)) : beatInputWrite ? req.method==='PUT'?await uploadBeatInput(root,req,params):await reuseBeatInputs(root,await markdownBody(req)) : req.method === 'PUT' ? await uploadInput(root,req,params) : changeInput(root,await markdownBody(req));
        return reply(res,200,JSON.stringify(item),MIME['.json']);
      }
      if (path.startsWith('/api/')) return reply(res, 404, 'Page not found.', undefined, head);
      if (path === '/editor/editor.js' || path === '/editor/editor.css') {
        // A project that brings its own graphics gets a page built for it; if that build fails, the shared page opens.
        const project = new URL(req.url, `http://${expectedHost}`).searchParams.get('project');
        const built = project ? await buildEditor(root, { project }).catch((error) => { console.error(`editor build for ${project}: ${error.errors?.[0]?.text ?? String(error.message || error).split('\n')[0]}`); return null; }) : null;
        if (built?.project) return serveFile(req, res, safeFile(root, `.keyframes/editor/${built.project}/${path.slice(8)}`, { hidden: true }));
        await buildEditor(root);
        return serveFile(req, res, safeFile(root, `.keyframes${path}`, { hidden: true }));
      }
      if (path.startsWith('/edit-static/')) {
        const [, , id, ...rest] = path.split('/');
        return serveFile(req, res, rest.length ? staticFor(root, id, rest.join('/')) : null);
      }
      if (/^\/edit\/[a-z0-9][a-z0-9._-]{0,120}(?:@[a-z0-9][a-z0-9_-]{0,60})?$/i.test(path)) return reply(res, 200, editorPage(path.slice(6)), MIME['.html'], head);
      if (path === '/assets/page.css') return serveFile(req, res, safeFile(root, 'scripts/page.css'));
      if (path.startsWith('/assets/')) {
        const asset = path.slice('/assets/'.length);
        if (!['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ttf', '.woff', '.woff2'].includes(extname(asset).toLowerCase())) return reply(res, 404, 'File not found.', undefined, head);
        return serveFile(req, res, safeFile(uiRoot, asset));
      }
      if (path.startsWith('/media/')) {
        const media = path.slice('/media/'.length);
        if (!canServeMedia(media)) return reply(res, 404, 'File not found.', undefined, head);
        // A sandboxed review has an opaque origin. Its pictures, styles and videos
        // remain embeddable; scripts elsewhere still cannot read their bytes with
        // fetch or canvas. Only shipped fonts allow its explicit CORS request.
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (isolatedFont) { res.setHeader('Access-Control-Allow-Origin', 'null'); res.setHeader('Vary', 'Origin'); }
        return serveFile(req, res, safeFile(root, media), { generatedPage: ['.html','.svg'].includes(extname(media).toLowerCase()) });
      }
      return serveFile(req, res, safeFile(uiRoot, 'index.html'));
    } catch (error) {
      if (error instanceof EditError || path.startsWith('/api/edit') || path.startsWith('/editor/')) {
        const status = error instanceof EditError ? error.status : 500;
        if (status >= 500) console.error(error);
        return reply(res, status, JSON.stringify({ error: error instanceof EditError ? error.message : `The editor hit a problem: ${String(error.message || error).split('\n')[0]}`, ...(error.current ? { current: error.current } : {}) }), MIME['.json'], head);
      }
      if (styleWrite) return reply(res, error instanceof TalkingStyleError || error instanceof MarkdownError ? error.status : 503, JSON.stringify({error:error instanceof TalkingStyleError ? error.message : 'Your choice could not be saved. Try again.'}), MIME['.json']);
      if (voiceKeyWrite) return reply(res, error instanceof ProductVoiceKeyError || error instanceof MarkdownError ? error.status : 503, JSON.stringify({error:error instanceof ProductVoiceKeyError ? error.message : 'Your key could not be saved. Try again.'}), MIME['.json']);
      if (onboardingWrite) return reply(res, error instanceof OnboardingError || error instanceof MarkdownError ? error.status : 503, JSON.stringify({ error: error instanceof OnboardingError ? error.message : 'Your setup could not be saved. Try again.' }), MIME['.json']);
      if (inputWrite) return reply(res, error instanceof InputError || error instanceof MarkdownError || error instanceof BeatLibraryError ? error.status : 503, JSON.stringify({ error: error instanceof InputError || error instanceof MarkdownError || error instanceof BeatLibraryError ? error.message : error.code === 'ENOSPC' ? 'Your disk is full. Free some space, then retry this upload.' : 'This input could not be saved. Try again.' }), MIME['.json']);
      if (path === '/api/markdown') return reply(res, error instanceof MarkdownError ? error.status : 503, JSON.stringify({ error: error instanceof MarkdownError ? error.message : 'This file could not be saved or opened. Try again.', ...(error.document ? { document: error.document } : {}) }), MIME['.json'], head);
      return reply(res, 503, 'Your folder is updating. Try again in a moment.', undefined, head);
    }
  });
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', accept); });
  return { server, root, workspaceId: id, port: server.address().port, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept())) };
}

async function managedHealth(record, root) {
  if (!Number.isInteger(record?.port) || record.port < 1 || record.port > 65535 || !Number.isInteger(record.pid) || record.pid < 1 || record.workspaceId !== workspaceId(root)) return null;
  try { const response = await fetch(`http://127.0.0.1:${record.port}/api/health`, { signal: AbortSignal.timeout(700) }); const value = await response.json(); return response.ok && value.workspaceId === record.workspaceId && value.pid === record.pid ? value : null; } catch { return null; }
}
async function healthy(record, root, uiRoot) {
  const value=await managedHealth(record,root);
  return Boolean(value && value.version === SERVICE_VERSION && (!uiRoot || value.uiRoot === resolve(uiRoot)) && value.capabilities?.includes('markdown-write'));
}
function recordAt(root) {
  const file = safeFile(root, '.keyframes/workspace-server.json', { hidden: true });
  try { return file ? JSON.parse(readFileSync(file.path, 'utf8')) : null; } catch { return null; }
}
function prepareInternal(root) {
  mkdirSync(join(root, '.keyframes'), { recursive: true, mode: 0o700 });
  if (!safeFile(root, '.keyframes', { hidden: true })?.stat.isDirectory()) throw Error('The workspace service folder must be a local directory.');
}

export async function ensureWorkspace({ root = defaultRoot, port = 0, uiRoot } = {}) {
  root = realpathSync(resolve(root));
  const current = recordAt(root);
  if (await healthy(current, root, uiRoot)) return { ...current, url: `http://127.0.0.1:${current.port}`, reused: true };
  prepareInternal(root);
  const lockPath = join(root, '.keyframes/workspace-server.lock');
  let ownsLock = false;
  try { const fd = openSync(lockPath, 'wx', 0o600); closeSync(fd); ownsLock = true; } catch {
    const lock = safeFile(root, '.keyframes/workspace-server.lock', { hidden: true });
    if (lock && Date.now() - lock.stat.mtimeMs > 30000) { rmSync(lockPath); return ensureWorkspace({ root, port, uiRoot }); }
  }
  try {
    if (ownsLock) {
      const another = recordAt(root);
      if (await healthy(another, root, uiRoot)) return { ...another, url: `http://127.0.0.1:${another.port}`, reused: true };
      let nextPort=port;
      if(await managedHealth(another,root)){
        // Replace only the verified workspace server. Keep its URL so open forms still save.
        if(another.pid===process.pid)throw Error('Reopen this workspace from a separate agent command.');
        try{process.kill(another.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')throw error;}
        let stopped=false;
        for(let i=0;i<40;i++){
          if(!await managedHealth(another,root)){stopped=true;break;}
          await new Promise(accept=>setTimeout(accept,100));
        }
        if(!stopped)throw Error('The workspace is still updating. Try again in a moment.');
        nextPort ||= another.port;
      }
      const child = spawn(process.execPath, [modulePath, '--serve', '--no-open', '--root', root, '--port', String(nextPort), ...(uiRoot ? ['--ui-root', resolve(uiRoot)] : [])], { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
    }
    for (let i = 0; i < 60; i++) {
      await new Promise((accept) => setTimeout(accept, 100));
      const record = recordAt(root);
      if (await healthy(record, root, uiRoot)) return { ...record, url: `http://127.0.0.1:${record.port}`, reused: !ownsLock };
    }
    throw Error('The workspace could not open. Run its startup again from chat.');
  } finally { if (ownsLock) rmSync(lockPath, { force: true }); }
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
  const root = realpathSync(resolve(option('--root') ?? defaultRoot));
  const port = Number(option('--port') ?? 0);
  const uiRoot = option('--ui-root') || undefined;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Choose a valid local port.');
  if (args.includes('--ensure')) {
    const service = await ensureWorkspace({ root, port, uiRoot });
    console.log(service.url);
    return;
  }
  const service = await startWorkspace({ root, port, uiRoot });
  if (args.includes('--serve')) {
    prepareInternal(root);
    const token = randomBytes(12).toString('hex');
    const temporary = join(root, `.keyframes/workspace-server.${token}.tmp`);
    writeFileSync(temporary, JSON.stringify({ workspaceId: service.workspaceId, pid: process.pid, port: service.port, token, startedAt: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
    renameSync(temporary, join(root, '.keyframes/workspace-server.json'));
    const cleanup = () => { if (recordAt(root)?.token === token) rmSync(join(root, '.keyframes/workspace-server.json'), { force: true }); service.server.close(() => process.exit(0)); };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
  // Starting a view never launches or stops a browser. The agent receives its URL.
  console.log(service.url);
}
if (process.argv[1] && resolve(process.argv[1]) === modulePath) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
