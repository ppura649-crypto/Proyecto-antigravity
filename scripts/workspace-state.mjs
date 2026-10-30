// Pure workspace reading. No plan scripts, rendering, imports or preference writes run here.
import { readFileSync, readdirSync, lstatSync, realpathSync, existsSync } from 'node:fs';
import { resolve, join, extname, basename, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { readMarkdown, scanMarkdown } from './workspace-markdown.mjs';
import { trialWorkspace } from './workspace-trial.mjs';
import { sharedContext, unresolvedQuestions } from './shared-context.mjs';
import { beatInputState } from './beat-workspace.mjs';
import { listReelWorkspace, listProjectState } from './workspace-list-reel.mjs';
import { LIST_STAGES } from './list-reel-progress.mjs';
import { oneShotWorkspace, readOneShotProgress } from './workspace-one-shot.mjs';
import { readBeatLibrary, readBeatProject, reviewedBeatOutput } from './workspace-beat-library.mjs';
import { accountHandle } from './workspace-ui/account-identity.js';
import { readOnboarding } from './workspace-onboarding.mjs';
import { readVideoSteps, readVideoPreview } from './talking-head-progress.mjs';
import { checkLookPreferences } from './look-preferences.mjs';
import { productVoiceStatus } from './product-demo-voice.mjs';

const cache = new Map();
let readingIssues = new Map();
const definitions = [
  // First, so a Full Visual folder whose subject contains another format's name ("...-iphone-...") still reads as Full Visual.
  ['full-visual', 'Full Visual', 'full-visual', '/full-visual'],
  ['product-demo', 'Product Demo', 'product-demo', '/product-demo'],
  ['talking-head', 'Talking Head', 'talking-head', '/talking-head'],
  ['trial-reels', 'Trial Reels', 'trial-reels', '/trial-reels'],
  ['beat-montage', 'Beat Montage', 'quick-cuts', '/quick-cuts beat-montage'],
  ['scroll-reel', 'List Reel', 'quick-cuts', '/quick-cuts scroll-reel'],
  ['phone', 'One-shot Reel', 'quick-cuts', '/quick-cuts phone'],
];
const kinds = { '.svg':'image', '.opus':'audio', '.aif':'audio', '.md':'markdown', '.mkv':'video', '.avi':'video', '.aac':'audio', '.flac':'audio', '.aiff':'audio', '.heic':'image', '.heif':'image', '.zip':'download', '.pdf':'download', '.rtf':'download', '.csv':'text', '.mp4': 'video', '.mov': 'video', '.m4v': 'video', '.webm': 'video', '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image', '.avif': 'image', '.mp3': 'audio', '.m4a': 'audio', '.wav': 'audio', '.ogg': 'audio', '.ttf': 'font', '.otf': 'font', '.woff': 'font', '.woff2': 'font', '.txt': 'text', '.srt': 'text', '.vtt': 'text', '.html': 'page', '.css': 'resource', '.js': 'resource' };
const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 20);
export const workspaceId = (root) => digest(realpathSync(resolve(root)));
// The chat line that hands an edit's export to the agent. The editor and the project page copy the same words.
export const editExportPrompt = (name, id, revision) => `Export my edit of "${name}" (workspace/projects/${id}/edit/timeline.json, revision ${revision}).`;
export const mediaUrl = (path, version) => '/media/' + path.split('/').map(encodeURIComponent).join('/') + (version ? `?v=${encodeURIComponent(version)}` : '');

// Reject symlinks even when they currently point inside the folder. All readers and HTTP
// file responses use this boundary, including parent directories and hidden file names.
export function safeFile(root, path, { hidden = false } = {}) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0') || path.startsWith('/') || /^[a-z]:/i.test(path)) return null;
  const parts = path.split('/');
  if (parts.some((p) => !p || p === '.' || p === '..' || (!hidden && p.startsWith('.')))) return null;
  try {
    const base = realpathSync(resolve(root));
    let file = base;
    for (const part of parts) {
      file = join(file, part);
      if (lstatSync(file).isSymbolicLink()) return null;
    }
    if (!file.startsWith(base + sep)) return null;
    const stat = lstatSync(file);
    return { path: file, stat };
  } catch { return null; }
}

function json(root, path, fallback = null, hidden = false) {
  const f = safeFile(root, path, { hidden });
  const key = resolve(root, path);
  if (!f?.stat.isFile() || f.stat.size > 32 * 1024 * 1024) { cache.delete(key); return fallback; }
  try {
    const value = JSON.parse(readFileSync(f.path, 'utf8'));
    cache.set(key, value);
    return value;
  } catch {
    // Keep the last complete reading, but expose the failed source so it is never called current.
    readingIssues.set(path, { path, kind: 'invalid-json', cached: cache.has(key) });
    return cache.get(key) ?? fallback;
  }
}
function list(root, path, hidden = false) {
  const f = safeFile(root, path, { hidden });
  if (!f?.stat.isDirectory()) return [];
  try { return readdirSync(f.path, { withFileTypes: true }).filter((d) => !d.isSymbolicLink() && !d.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name)); } catch { return []; }
}
function modified(root, path) { return safeFile(root, path)?.stat.mtime.toISOString() ?? null; }
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const array = (value) => Array.isArray(value) ? value : [];
const finite = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const formatFromPath = (path) => definitions.find(([id]) => path.includes(id))?.[0] ?? (path.includes('research-reel') ? 'scroll-reel' : /(?:^|\/)(?:your-look|word-options|opening-review)\.html$/.test(path) ? 'talking-head' : /(?:^|\/)beat[-/]/.test(path) ? 'beat-montage' : path.includes('/quick-cuts/') ? 'quick-cuts' : null);

export function canServeMedia(path) {
  if (typeof path !== 'string' || path.split('/').some((p) => p.startsWith('.') || /^(?:secrets?|credentials?|tokens?)(?:\.|$)/i.test(p))) return false;
  const kind = kinds[extname(path).toLowerCase()];
  if (!kind) return false;
  if (/^workspace\/(input|projects|output|library|pages)\//.test(path)) return true;
  if (/^workspace\/[a-z0-9_-]+\.html$/i.test(path)) return true;
  if (/^context\/(posts|inputs|study|trial-reels)\//.test(path)) return ['video', 'image', 'page', 'resource'].includes(kind);
  if (/^context\/profile\/avatar-[a-f0-9]+\.(png|jpg|webp)$/.test(path)) return kind === 'image';
  if (/^context\/[a-z0-9_-]+\.html$/i.test(path)) return true;
  if (/^assets\/(talking-head|trial-reels|quick-cuts|product-demo)\//.test(path)) return ['video', 'image', 'audio', 'font'].includes(kind);
  if (/^engine\/quick-cuts\/research\/output\/[^/]+$/.test(path)) return ['video', 'image'].includes(kind);
  return false;
}

function fileInfo(root, path) {
  if (!canServeMedia(path)) return null;
  const f = safeFile(root, path);
  if (!f?.stat.isFile()) return null;
  return { path, name: basename(path), url: mediaUrl(path, `${f.stat.mtimeMs.toString(36)}-${f.stat.size.toString(36)}`), kind: kinds[extname(path).toLowerCase()], format: formatFromPath(path), size: f.stat.size, updatedAt: f.stat.mtime.toISOString() };
}

function scan(root, path, out, depth = 0) {
  if (depth > 8 || out.length >= 5000) return;
  for (const item of list(root, path)) {
    if (out.length >= 5000) break;
    const child = `${path}/${item.name}`;
    if (item.isDirectory()) scan(root, child, out, depth + 1);
    else { const entry = fileInfo(root, child); if (entry && entry.kind !== 'resource') out.push(entry); }
  }
}

function preference(root, path, name) {
  try { return { ...readMarkdown(root, path), name }; }
  catch { return { path, name, text: '', revision: null, exists: false }; }
}

// A Full Visual video is three files: research.md, transcript.md, then the video in its output folder. Each step is done
// when its file is there and not empty, so the page follows the agent without any record of its own.
function fullVisualSteps(root, path, id) {
  const filled = (file) => (safeFile(root, file)?.stat.size ?? 0) > 0;
  const video = list(root, `workspace/output/${id}`).some((f) => f.isFile() && kinds[extname(f.name).toLowerCase()] === 'video' && filled(`workspace/output/${id}/${f.name}`));
  const done = [filled(`${path}/research.md`), filled(`${path}/transcript.md`), video];
  const current = done.indexOf(false);
  const steps = [['research', 'Research'], ['transcript', 'Transcript'], ['video', 'Video']].map(([sid, label], i) => ({ id: sid, label, status: done[i] ? 'done' : i === current ? 'current' : 'later' }));
  return { steps, progress: { status: current < 0 ? 'complete' : 'active', current: current < 0 ? 'video' : steps[current].id, completed: done.filter(Boolean).length, total: 3 } };
}

// A Split explainer video (the other Talking Head style) records its own steps in steps.json through its skill.
function splitSteps(root, path) {
  const saved = object(json(root, `${path}/steps.json`, {}));
  const rows = [['prepare', 'Cut'], ['plan', 'Visual plan'], ['build', 'Visuals and captions'], ['render', 'Render'], ['deliver', 'Delivery']];
  const done = rows.map(([sid]) => array(saved.steps).some((s) => s?.id === sid && s.state === 'done'));
  const completed = done.indexOf(false) < 0 ? rows.length : done.indexOf(false);
  const steps = rows.map(([sid, label], i) => ({ id: sid, label, status: i < completed ? 'done' : i === completed ? 'current' : 'pending', owner: 'agent' }));
  return { steps, progress: { version: 4, format: 'talking-head', status: completed === rows.length ? 'complete' : 'active', current: steps[completed]?.id ?? null, completed, total: rows.length, path: path + '/steps.json', updatedAt: modified(root, path + '/steps.json') } };
}

function projectSteps(root, path, id, format, data = {}) {
  if (format === 'talking-head' && data.format === 'split-explainer') return splitSteps(root, path);
  if (format === 'full-visual') return fullVisualSteps(root, path, id);
  if (format !== 'talking-head') return { steps: [], progress: null };
  const { steps, checks, ...progress } = readVideoSteps(resolve(root, path), { root });
  return { steps, checks, progress: { ...progress, path: path + '/steps.json', updatedAt: modified(root, path + '/steps.json') } };
}

// Talking Head styles the person created with the create-my-own skill, each a skill of its own.
export function talkingStyles(root) {
  return list(root, 'workspace/library/talking-head-formats').filter((d) => d.isDirectory() && /^[a-z0-9][a-z0-9-]{0,48}$/.test(d.name)).flatMap((d) => {
    const at = `workspace/library/talking-head-formats/${d.name}`;
    const f = object(json(root, `${at}/format.json`, {}));
    if (typeof f.name !== 'string' || !f.name.trim() || !/^[a-z0-9][a-z0-9-]{0,48}$/.test(String(f.skill ?? ''))) return [];
    if (!existsSync(join(root, '.agents', 'skills', f.skill, 'SKILL.md'))) return [];
    const example = typeof f.example === 'string' && /^[\w.-]+\.mp4$/.test(f.example) ? fileInfo(root, `${at}/${f.example}`) : null;
    return [{ id: d.name, name: f.name.trim().slice(0, 40), skill: f.skill, what: String(f.what ?? '').slice(0, 200), example: example?.url ?? null }];
  });
}

export function readWorkspace(root, { now = Date.now() } = {}) {
  readingIssues = new Map();
  root = realpathSync(resolve(root));
  const manifest = object(json(root, 'runtime.json', {}));
  const installed = array(manifest.packs).filter((p) => p && definitions.some((d) => d[2] === p.name));
  const packs = installed.map((p) => ({ id: p.name, name: p.name, version: p.version ?? null }));
  const start = object(json(root, 'context/start.json', {}));
  const rawProfile = object(json(root, 'context/profile.json', {}));
  const profile = Object.fromEntries(['handle', 'name', 'platform', 'followers', 'bio', 'link', 'language', 'pulled_at', 'identity_at', 'account_type', 'cadence_per_week', 'toolkits'].filter((key) => rawProfile[key] !== undefined).map((key) => [key, rawProfile[key]]));
  profile.handle = accountHandle(profile.handle,profile.platform ?? 'instagram');
  const avatar = fileInfo(root,rawProfile.avatar?.path);
  profile.avatar = avatar?.kind === 'image' && avatar.path.startsWith('context/profile/') ? avatar.url : null;
  const posts = array(json(root, 'context/posts.json', [])).filter((p) => p && typeof p === 'object');
  const doctor = object(json(root, 'context/doctor.json', {}));
  const machineChecks = array(doctor.checks).filter((check) => ['node', 'packages', 'ffmpeg', 'browser', 'transcription', 'disk', 'python'].includes(check?.name));
  const account = { enabled: !installed.length || installed.some(pack => pack.needs?.account !== false), scope: json(root,'context/account-scope.json',null), done: start.done === true && Number(start.version ?? 0) >= Number(manifest.setup_version ?? 1), version: Number(start.version ?? 0), requiredVersion: Number(manifest.setup_version ?? 1), profile, postsCount: posts.length, updatedAt: rawProfile.pulled_at ?? modified(root, 'context/posts.json'), machine: { checked: machineChecks.length > 0, done: machineChecks.length > 0 && machineChecks.every((check) => check.status !== 'fix'), updatedAt: doctor.at ?? null } };
  const recordedQuestions = object(json(root, 'context/questions.json', {}));
  const answers = object(json(root, 'context/answers.json', {}));
  account.context = sharedContext(answers, account.done);
  account.questions = unresolvedQuestions(array(recordedQuestions.questions), answers).filter((q) => q && typeof q.id === 'string' && typeof q.ask === 'string' && q.ask.trim()).slice(0, 3).map((q) => ({ id: q.id.slice(0, 100), ask: q.ask.slice(0, 1000), ...(Array.isArray(q.options) ? { options: q.options.filter((option) => typeof option === 'string').slice(0, 20).map((option) => option.slice(0, 300)) } : {}) }));
  account.readback = array(recordedQuestions.readback).filter((line) => typeof line === 'string').slice(0, 5).map((line) => line.slice(0, 1000));
  // Only saved post evidence goes to the account screen. No signed download URLs or credentials.
  account.posts = posts.map((post) => {
    const number = (...keys) => keys.map(key => finite(post.metrics?.[key] ?? post[key])).find(value => value !== null) ?? null;
    const thumbnail = typeof post.local?.thumbnail === 'string' ? fileInfo(root, post.local.thumbnail)?.url : null;
    return { id: String(post.id ?? ''), caption: String(post.caption ?? ''), timestamp: post.timestamp ?? post.published_at ?? null, type: post.media_product_type ?? post.media_type ?? null,
      permalink: /^https:\/\/(www\.)?instagram\.com\//i.test(post.permalink ?? '') ? post.permalink : null, thumbnail,
      metrics: { views: number('views', 'plays'), reach: number('reach'), saves: number('saves', 'saved'), shares: number('shares'), likes: number('likes', 'like_count'), comments: number('comments', 'comments_count'), avg_watch_ms: number('avg_watch_ms') } };
  });
  const contextDocuments = [['profile', 'About you'], ['formats', 'Your formats'], ['text-system', 'Your on-screen words'], ['voice', 'Your voice']].map(([id, name]) => ({ id, ...preference(root, `context/${id}.md`, name) })).filter((document) => document.exists);
  const quickCatalog = object(json(root, 'scripts/quick-cuts/formats.json', {}));
  const mediaCatalog = object(json(root, 'context/inputs/media.json', {}));
  const catalogClips = array(mediaCatalog.clips).length ? mediaCatalog.clips : Object.values(object(mediaCatalog.clips ?? mediaCatalog));
  const localPath = (path) => {
    if (typeof path !== 'string') return '';
    const normalized = path.replace(/\\/g, '/');
    if (normalized.startsWith(root.replace(/\\/g, '/') + '/')) return relative(root, path).split(sep).join('/');
    if (normalized.startsWith('/') || /^[a-z]:/i.test(normalized)) {
      // macOS may record /var while the same folder resolves to /private/var.
      try { const canonical = realpathSync(path); if (canonical.startsWith(root + sep)) return relative(root, canonical).split(sep).join('/'); } catch {}
    }
    return normalized;
  };
  const usable = (path) => ['video', 'image'].includes(fileInfo(root, localPath(path))?.kind);
  const sounds = array(json(root, 'assets/quick-cuts/songs/cards.json', {})?.tracks).map((track) => {
    const entry = { id: track.id, title: track.title, owner: track.owner, bpm: track.bpm, duration_s: track.duration_s, page: track.page, formats: array(track.formats), grid: track.grid, ship_audio: track.ship_audio === true };
    const file = [track.file, track.audio, track.audio_file].find((p) => typeof p === 'string' && fileInfo(root, `assets/quick-cuts/songs/${p}`));
    if (file) entry.url = fileInfo(root, `assets/quick-cuts/songs/${file}`).url;
    return entry;
  });
  const formats = definitions.filter((d) => installed.some((p) => p.name === d[2])).map(([id, name, pack, command]) => {
    const pk = installed.find((p) => p.name === pack);
    const library = object(json(root, `workspace/library/${pack}.json`, {}));
    const specification = object(json(root, `packs/${pack}/setup.json`, {}));
    const own = ['scroll-reel','phone'].includes(id) && safeFile(root, `workspace/library/${id}.json`) ? object(json(root, `workspace/library/${id}.json`, {})) : pack === 'quick-cuts' ? object(library.formats?.[id] ?? (id === 'scroll-reel' ? library.formats?.['research-reel'] : null)) : library;
    const saved = object(own.setup);
    const requiredVersion = Number(specification.formats?.[id]?.version ?? specification.version ?? pk.setup_version ?? 1);
    const active = pack !== 'quick-cuts' || (library.format ?? library.plan?.format?.id) === id;
    const ownPreferences = `workspace/library/${id}.preferences.md`;
    const preferencesPath = pack === 'quick-cuts' && id !== 'scroll-reel' && !safeFile(root, ownPreferences) ? 'workspace/library/quick-cuts.preferences.md' : ownPreferences;
    const catalog = array(quickCatalog.formats).find((f) => f.id === id);
    const example = catalog?.example?.still ? fileInfo(root, `assets/quick-cuts/${catalog.example.still}`) : fileInfo(root, `assets/quick-cuts/examples/${id}.jpg`);
    const exampleVideo = catalog?.example?.video ? fileInfo(root, `assets/quick-cuts/${catalog.example.video}`) : null;
    const exampleCredit = typeof catalog?.example?.credit === 'string' ? catalog.example.credit : '';
    const exampleLink = /^https:\/\//.test(catalog?.example?.link || '') ? catalog.example.link : '';
    let materialReady = false, materialKnown = pack === 'quick-cuts';
    if (id === 'phone') {
      const shots = list(root, 'workspace/input/quick-cuts/phone').filter((f) => f.isFile() && ['.mp4', '.mov', '.m4v'].includes(extname(f.name).toLowerCase()));
      materialReady = shots.length > 0 && shots.every((shot) => {
        const path = `workspace/input/quick-cuts/phone/${shot.name}`;
        const size = safeFile(root, path)?.stat.size;
        const key = createHash('sha1').update(`${shot.name}:${size}`).digest('hex').slice(0, 16);
        const placement = json(root, `workspace/input/quick-cuts/phone/.places/${key}.json`, null, true);
        return placement?.ok === true && Array.isArray(placement.band) && localPath(placement.clip) === path;
      });
    } else if (id === 'scroll-reel') {
      const clips = [];
      scan(root, 'workspace/input/quick-cuts/broll', clips);
      const providedShot = ['assets/quick-cuts/broll', 'engine/quick-cuts/research/assets/broll'].some((dir) => list(root, dir).some((file) => file.isFile() && kinds[extname(file.name).toLowerCase()] === 'video'));
      materialReady = clips.some((clip) => clip.kind === 'video') || usable(own.answers?.shot) || (own.answers?.shot === 'ours' && providedShot);
    }
    const hasWork = Boolean(library.first?.project || (pack === 'trial-reels' && Object.values(object(library.formats)).some((f) => f?.first?.project)) || list(root, 'workspace/projects').some((p) => p.isDirectory() && p.name.includes(`-${id}-`)));
    const reviewPath = typeof library.shown === 'string' ? localPath(library.shown) : 'workspace/trial-reels-review.html';
    return { id, name, pack, command, setup: { done: saved.done === true && Number(saved.version ?? 0) >= requiredVersion, savedDone: saved.done === true, version: Number(saved.version ?? 0), requiredVersion }, answers: object(own.answers), ...(id === 'talking-head' ? (() => { const styles = talkingStyles(root); return { styles, style: ['classic', 'split', ...styles.map((t) => t.id)].includes(library.style) ? library.style : null }; })() : {}), preferencesPath, preferencesSync: checkLookPreferences({text:preference(root,preferencesPath,name).text,sync:own.preferencesSync,path:preferencesPath}), stages: array(own.stages ?? (active ? library.stages : null) ?? catalog?.stages ?? quickCatalog.stages), stage: own.stage ?? (active ? library.stage : null) ?? null, setupQuestions: array(specification.formats?.[id]?.questions ?? specification.questions), sounds: sounds.filter((s) => s.formats.includes(id)), example, exampleVideo, exampleCredit, exampleLink, materialReady, materialKnown, hasWork, reviewAvailable: id === 'trial-reels' && fileInfo(root, reviewPath)?.kind === 'page' };
  });
  const files = [];
  for (const dir of ['workspace/input', 'workspace/projects', 'workspace/output', 'workspace/library', 'workspace/pages', 'context/posts', 'context/inputs', 'context/study', 'context/trial-reels']) scan(root, dir, files);
  for (const p of list(root, 'workspace')) { const entry = fileInfo(root, `workspace/${p.name}`); if (entry) files.push(entry); }
  for (const p of list(root, 'context')) { const entry = fileInfo(root, `context/${p.name}`); if (entry) files.push(entry); }
  const montage=formats.find(f=>f.id==='beat-montage');
  const productDemo=formats.find(f=>f.id==='product-demo');
  if(productDemo)productDemo.productVoice=productVoiceStatus(root);
  // Full Visual only needs to know which voice keys exist, never their values.
  const fullVisual=formats.find(f=>f.id==='full-visual');
  if(fullVisual)fullVisual.voiceKeys=productVoiceStatus(root).keys;
  if(montage){
    montage.beatInputs=beatInputState({files,media:mediaCatalog,footage:json(root,'context/inputs/footage.json',{}),preparation:json(root,'workspace/library/beat-montage.preparation.json',{}),localPath,file:p=>fileInfo(root,p)});
    montage.availableClips=files.filter(f=>f.kind==='video'&&f.path.startsWith('workspace/input/')&&!f.path.startsWith('workspace/input/beat-montage/'));
    montage.materialReady=montage.beatInputs.ready;
    montage.shootGuide=json(root,'workspace/library/beat-shoot.json',null)||json(root,'scripts/quick-cuts/beat/shoot.json',{});
    const gallery=json(root,'assets/quick-cuts/examples/beat-montage.json',{});
    montage.featuredBeat=gallery.featured;
    montage.captionFont=fileInfo(root,'assets/quick-cuts/fonts/PlayfairDisplay-Variable.ttf');
    montage.beatReferences=array(json(root,'workspace/library/beat-montage.references.json',{}).items).map(r=>{
      const source=r.source?fileInfo(root,r.source):null,demo=r.demo?fileInfo(root,r.demo):null,reading=r.reading?fileInfo(root,r.reading):null,grid=r.grid?json(root,r.grid,null):null;
      const ready=!!(source&&demo&&reading&&grid?.edit?.source==='confirmed'&&Array.isArray(grid.edit.cutFrames));
      return {id:r.id,url:r.url,platform:r.platform,title:r.title,source,demo,status:['studying','downloading'].includes(r.status)&&Date.now()-Date.parse(r.updatedAt||r.at)>180000?'error':r.status==='ready'&&!ready?'review':r.status,message:r.message,edit:ready?grid.edit:null};
    });
    montage.beatExamples=array(gallery.entries).flatMap(e=>{
      const asset=p=>typeof p==='string'?fileInfo(root,'assets/quick-cuts/'+p):null;
      const video=asset(e.video),demo=asset(e.demo);
      return demo&&Array.isArray(e.edit?.cutFrames)?[{id:e.id,title:e.title,artist:e.artist,credit:e.credit,edit:e.edit,video,demo,poster:asset(e.poster),demoPoster:asset(e.demoPoster)}]:[];
    });
  }
  const projects = list(root, 'workspace/projects').filter((p) => p.isDirectory()).map((p) => {
    const path = `workspace/projects/${p.name}`;
    const data = object(json(root, `${path}/project.json`, {}));
    let format = data.format?.id ?? data.format ?? formatFromPath(path);
    if (format === 'research-reel') format = 'scroll-reel';
    // Split explainer is a Talking Head style: its videos are Talking Head videos.
    const split = format === 'split-explainer';
    if (split) format = 'talking-head';
    const own = split && typeof data.style === 'string' ? talkingStyles(root).find((t) => t.id === data.style) : null;
    const locks = object(json(root, `${path}/locks.json`, {}));
    const check = json(root, `${path}/check.json`);
    const reading = json(root, `${path}/read.json`);
    const savedOutput = localPath(data.output).replace(/\/$/, '');
    const output = /^workspace\/output\/[^/]+$/.test(savedOutput) ? savedOutput : `workspace/output/${p.name}`;
    const projectFiles = files.filter((f) => f.path.startsWith(path + '/') || f.path.startsWith(output + '/') || (f.kind === 'page' && f.path.startsWith(`workspace/pages/${p.name}`)));
    const tracker = json(root, `${output}/tracker.json`, []);
    const posted = array(tracker).some((v) => v?.posted_on || v?.posted) || object(tracker).posted > 0;
    const outputFiles = projectFiles.filter((f) => f.kind === 'video' && f.size > 0 && f.path.slice(0, f.path.lastIndexOf('/')) === output);
    const exported = outputFiles.length > 0;
    let stage = posted ? 'posted' : exported ? 'exported' : data.stage ?? data.state ?? null;
    const updatedAt = [modified(root, path), ...projectFiles.map((f) => f.updatedAt)].filter(Boolean).sort().at(-1) ?? null;
    const explicitSource = localPath(data.source);
    const exactSource = explicitSource && usable(explicitSource) ? explicitSource : null;
    const sourceRecords = catalogClips.filter((clip) => clip && ((exactSource && [localPath(clip.path), localPath(clip.mezzanine)].includes(exactSource)) || (!exactSource && typeof reading?.video === 'string' && basename(localPath(clip.mezzanine)) === basename(reading.video))));
    const sourceRecord = sourceRecords.length === 1 ? sourceRecords[0] : null;
    const sourcePath = sourceRecord ? localPath(sourceRecord.path) : exactSource;
    const mezzaninePath = sourceRecord && usable(sourceRecord.mezzanine) ? localPath(sourceRecord.mezzanine) : null;
    const tracking = format === 'phone' ? readOneShotProgress(path,{root}) : format === 'scroll-reel' ? listProjectState(root, path) : projectSteps(root, path, p.name, format, data);
    const { steps, progress } = tracking;
    const beatMontage = format === 'beat-montage' ? readBeatProject(root,{id:p.name,path,data}) : null;
    if(beatMontage)stage=beatMontage.label;
    if (['phone','scroll-reel'].includes(format) && progress?.current) stage = progress.current;
    if (progress?.status === 'complete' && !exported) {
      Object.assign(steps.at(-1), { status: 'current', ready: false, reason: 'The finished video is missing from output.' });
      const deliveryStage = format === 'talking-head' ? 'sound' : 'delivery';
      Object.assign(progress, { status: 'active', current: deliveryStage, completed: steps.length - 1 });
      stage = deliveryStage;
    }
    const exportRecorded = !!data.exported_at || typeof data.output === 'string' || !data.state || ['exported', 'posted', 'complete', 'done'].includes(data.state);
    const completed = beatMontage ? beatMontage.completed : exported && (['talking-head', 'scroll-reel','phone','full-visual'].includes(format) ? progress.status === 'complete' : format==='trial-reels'?outputFiles.every(file=>{const caption=fileInfo(root,output+'/'+basename(file.name,extname(file.name))+'.caption.txt');return caption?.size>0&&caption.size<=32768&&readFileSync(safeFile(root,caption.path).path,'utf8').trim().length>0;}):exportRecorded);
    // The video editor's own record: edited once saved by hand, and an export waiting for the agent until it runs.
    const timeline = object(json(root, `${path}/edit/timeline.json`, {}));
    // A project with versions (Trial Reels) keeps each version's edit in edit/<version>/; the newest waiting request wins.
    const editRoot = safeFile(root, `${path}/edit`);
    const versionIds = editRoot?.stat.isDirectory() ? readdirSync(editRoot.path).filter((v) => /^(?!versions$|checks$)[a-z0-9][a-z0-9_-]{0,60}$/i.test(v) && safeFile(root, `${path}/edit/${v}/export-request.json`)) : [];
    const requests = [[null, object(json(root, `${path}/edit/export-request.json`, {})), timeline], ...versionIds.map((v) => [v, object(json(root, `${path}/edit/${v}/export-request.json`, {})), object(json(root, `${path}/edit/${v}/timeline.json`, {}))])]
      .filter(([, r]) => r.status === 'requested').sort((a, b) => String(b[1].requestedAt ?? '').localeCompare(String(a[1].requestedAt ?? '')));
    const waiting = requests[0];
    const edit = { editedAt: typeof timeline.editedAt === 'string' ? timeline.editedAt : null,
      exportRequest: waiting ? { requestedAt: waiting[1].requestedAt ?? null, revision: waiting[1].revision ?? null, ...(waiting[0] ? { version: waiting[0] } : {}), count: requests.length,
        prompt: waiting[0] ? `Export my edit of "${waiting[2].name || p.name}", version ${waiting[0]} (workspace/projects/${p.name}/edit/${waiting[0]}/timeline.json, revision ${waiting[1].revision ?? waiting[2].revision ?? 0}).` : editExportPrompt(timeline.name || p.name, p.name, waiting[1].revision ?? timeline.revision ?? 0) } : null };
    const verifiedPreview = format==='talking-head' && !split ? readVideoPreview(resolve(root,path),{root,progress}) : beatMontage?.preview;
    const preview = verifiedPreview?.path ? fileInfo(root,verifiedPreview.path) : null;
    return { id: p.name, name: data.title ?? data.name ?? p.name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '), format, path, ...(split ? { style: own ? own.id : 'split', styleSkill: own ? own.skill : 'split-explainer' } : {}), stage, updatedAt, files: projectFiles, data, locks, check, reading, sourcePath: sourcePath || null, mezzaninePath, steps, progress, preview, ...(beatMontage?{beatMontage}:{}), ...(tracking.listReel ? { listReel: tracking.listReel } : {}), ...(tracking.oneShot ? { oneShot: tracking.oneShot } : {}), completed, edit, outputPath: output, outputPaths: outputFiles.map((file) => file.path) };
  // A video made by hand in the editor belongs to no pack, so it is kept even though no format lists it.
  }).filter((p) => p.format === 'edit' || formats.some((f) => f.id === p.format)).sort((a, b) => String(b.id).localeCompare(String(a.id)));
  // Only the published output folder contributes previous outputs. Project
  // renders, uploaded footage and nested work files remain in Files.
  const outputs = files.filter((file) => file.kind === 'video' && file.size > 0 && /^workspace\/output\/[^/]+\/[^/]+$/.test(file.path)).flatMap((file) => {
    const directory = file.path.slice(0, file.path.lastIndexOf('/'));
    const owners = projects.filter((project) => project.outputPath === directory);
    const project = owners.length === 1 ? owners[0] : null;
    const format = project?.format ?? file.format;
    if (format !== 'edit' && !formats.some((entry) => entry.id === format)) return [];
    const cover = files.find((entry) => entry.kind === 'image' && entry.path === `${directory}/${basename(file.name, extname(file.name))}.poster.jpg`) ?? files.find((entry) => entry.kind === 'image' && entry.path === `${directory}/cover.jpg`) ?? files.find((entry) => entry.kind === 'image' && entry.path === `${directory}/${basename(file.name, extname(file.name))}.jpg`) ?? null;
    let caption=null;
    if(['trial-reels','scroll-reel','phone','talking-head','beat-montage','full-visual'].includes(format)){
      const entry=fileInfo(root,format!=='trial-reels'?`${directory}/caption.txt`:`${directory}/${basename(file.name,extname(file.name))}.caption.txt`);
      if(entry?.size>0&&entry.size<=32768)try{const text=readFileSync(safeFile(root,entry.path).path,'utf8').trim();if(text)caption={...entry,text};}catch{}
    }
    const verifiedBeat=format==='beat-montage'?reviewedBeatOutput(root,{...file,projectId:project?.id},projects):null;
    const ready=format==='beat-montage'?Boolean(verifiedBeat):format==='trial-reels'?Boolean(caption):Boolean(project?.completed);
    // A Trial Reels version (v2-line.mp4, or its edit v2-line-edit-r3.mp4) opens as that version in the editor.
    const stem=basename(file.name,extname(file.name)).replace(/-edit-r\d+$/,'');
    const editId=project&&format==='trial-reels'&&!/^edit-r\d+$/.test(stem)&&/^[a-z0-9][a-z0-9_-]{0,60}$/i.test(stem)&&object(json(root,`${project.path}/props/variants.json`,{})).variants?.some?.((v)=>v?.id===stem)?`${project.id}@${stem}`:project?.id ?? null;
    return [{ ...file, ...(verifiedBeat||{}), ready, status:ready?'ready':'saved', id: file.path, projectId: project?.id ?? null, editId, format, name: project?.name ?? basename(directory).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '), filename: file.name, cover, caption }];
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || b.path.localeCompare(a.path));
  // A measured frame belongs only to the clip it was read from. A second uploaded
  // clip never inherits the latest project's face positions merely by being new.
  for (const project of projects) if (project.format === 'talking-head' && project.sourcePath && project.reading?.fit) {
    for (const file of files) if ([project.sourcePath, project.mezzaninePath].includes(file.path) && !file.fit) file.fit = project.reading.fit;
  }
  if (montage) {
    try {
    montage.beat = readBeatLibrary(root, {files, projects, outputs, fileInfo: path => fileInfo(root, path), media: mediaCatalog, footage: json(root, 'context/inputs/footage.json', {}), localPath});
    } catch {
      const path='workspace/library/beat-montage.library.json';
      readingIssues.set(path,{path,kind:'invalid-data',cached:false});
      montage.beat={version:1,templates:[],references:[],unassignedReferences:[],requests:[],error:'Your montage library needs a check in chat.'};
    }
    montage.materialReady = montage.beat.templates.some(template => template.generation.ready);
  }
  const preferences = [preference(root, 'context/preferences.md', 'Your preferences')];
  for (const format of formats) if (!preferences.some((p) => p.path === format.preferencesPath)) preferences.push(preference(root, format.preferencesPath, format.pack === 'quick-cuts' && format.preferencesPath.endsWith('/quick-cuts.preferences.md') ? 'Quick Cuts preferences' : `${format.name} preferences`));
  for(const template of montage?.beat?.templates||[])if(template.preferencesPath&&!preferences.some(p=>p.path===template.preferencesPath))preferences.push(preference(root,template.preferencesPath,template.name+' preferences'));
  const talkingFormat = formats.find((format) => format.id === 'talking-head');
  const fonts = talkingFormat ? array(json(root, 'assets/talking-head/fonts/fonts.json', {})?.fonts).flatMap((font) => {
    if (typeof font?.file !== 'string') return [];
    const path = `assets/talking-head/fonts/${font.file}`;
    const installed = fileInfo(root, path);
    return installed?.kind === 'font' && installed.size > 0 ? [{ ...font, url: installed.url, captionSafe: font.id !== 'instrument-serif' }] : [];
  }) : [];
  if (talkingFormat) {
    const wanted = array(talkingFormat.answers.customFonts);
    const registered = array(json(root, 'workspace/library/fonts/fonts.json', {})?.fonts);
    for (const font of registered) {
      if (!font || typeof font.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(font.id) || typeof font.family !== 'string' || !font.family.trim() || typeof font.file !== 'string' || /^([a-z]:|\/)/i.test(font.file)) continue;
      const matches = wanted.filter((face) => face?.id === font.id);
      if (matches.length !== 1 || matches[0].family !== font.family || registered.filter((face) => face?.id === font.id).length !== 1 || fonts.some((face) => face.id === font.id)) continue;
      // safeFile rejects traversal, hidden paths and symlinks at every segment.
      // Only a real font beneath this registry can replace the remote preview.
      const installed = fileInfo(root, `workspace/library/fonts/${font.file}`);
      if (installed?.kind !== 'font' || installed.size <= 0) continue;
      const weight = typeof font.weight === 'number' || typeof font.weight === 'string' ? String(font.weight) : '';
      fonts.push({ id: font.id, name: font.family, family: font.family, url: installed.url, captionSafe: true,
        ...(/^(?:normal|bold|[1-9]\d{0,2}|1000)(?: (?:[1-9]\d{0,2}|1000))?$/.test(weight) ? { weight } : {}),
        ...(['normal', 'italic', 'oblique'].includes(font.style) ? { style: font.style } : {}),
      });
    }
  }
  const listFormat = formats.find(format => format.id === 'scroll-reel');
  if (listFormat) {
    listFormat.stages = LIST_STAGES.map(([id, label]) => ({ id, label, name: label }));
    listFormat.listReel = listReelWorkspace({ root, format: listFormat, files, projects, media: mediaCatalog, read: (path, fallback) => json(root, path, fallback), file: path => fileInfo(root, path), localPath });
    listFormat.materialReady = listFormat.listReel.inputs.ready;
    if (listFormat.setup.savedDone) listFormat.setup.done = true;
  }
  const phoneFormat = formats.find(f => f.id === 'phone');
  if (phoneFormat) {
    phoneFormat.oneShot = oneShotWorkspace({root, format:phoneFormat,files,projects,media:mediaCatalog,read:(path,fallback,hidden)=>json(root,path,fallback,hidden),file:path=>fileInfo(root,path),localPath});
    phoneFormat.materialReady = phoneFormat.oneShot.inputs.ready;
    if (phoneFormat.setup.savedDone) phoneFormat.setup.done = true;
  }
  const tasks = list(root, 'workspace/.tasks', true).filter((f) => f.isFile() && f.name.endsWith('.json')).map((f) => {
    const task = object(json(root, `workspace/.tasks/${f.name}`, {}, true));
    const fields = ['id', 'name', 'title', 'label', 'format', 'pack', 'project', 'status', 'stage', 'message', 'completed', 'total', 'progress', 'startedAt', 'updatedAt', 'heartbeatAt', 'finishedAt', 'error', 'detail'];
    const value = Object.fromEntries(fields.filter((key) => task[key] !== undefined).map((key) => [key, task[key]]));
    const last = Date.parse(value.heartbeatAt ?? value.updatedAt ?? value.startedAt ?? '');
    return { ...value, id: value.id ?? basename(f.name, '.json'), stale: ['running', 'queued'].includes(value.status) && (!Number.isFinite(last) || now - last > 30000) };
  });
  const sum = (...keys) => { const values = posts.map((p) => keys.map((key) => finite(p[key] ?? p.metrics?.[key])).find((v) => v !== null)).filter((v) => v !== undefined); return values.length ? values.reduce((a, b) => a + b, 0) : null; };
  const dates = posts.map((p) => p.timestamp ?? p.published_at).filter((value) => value && Number.isFinite(Date.parse(value))).sort((a, b) => Date.parse(a) - Date.parse(b));
  const metrics = { posts: posts.length, views: sum('views'), plays: sum('plays'), reach: sum('reach'), saves: sum('saves', 'saved'), shares: sum('shares'), likes: sum('likes', 'like_count'), comments: sum('comments', 'comments_count'), period: { from: dates[0] ?? null, to: dates.at(-1) ?? null }, updatedAt: account.updatedAt };
  const trial = formats.some(f => f.id === 'trial-reels') ? trialWorkspace({root,previews:files.filter(f=>f.kind==='image'&&f.path.startsWith('workspace/pages/crops/')),outputs:outputs.filter(o=>o.format==='trial-reels'),read:(path,fallback)=>json(root,path,fallback),file:path=>typeof path === 'string' ? fileInfo(root, localPath(path)) : null,document:path=>Boolean(safeFile(root,path)?.stat.isFile()),posts,projects:projects.filter(p=>p.format==='trial-reels')}) : null;
  const onboarding = readOnboarding(root, { profile, returning: projects.length > 0 || outputs.length > 0 || formats.some(f => f.setup?.savedDone || f.setup?.done) });
  const sourceIssues = [...readingIssues.values()];
  const result = { sourceIssues, onboarding, trial, workspaceId: workspaceId(root), packs, account, formats, projects, outputs, files, preferences, fonts, tasks, metrics, sounds, contextDocuments, markdownFiles: scanMarkdown(root) };
  return { revision: digest(JSON.stringify(result)), ...result };
}
