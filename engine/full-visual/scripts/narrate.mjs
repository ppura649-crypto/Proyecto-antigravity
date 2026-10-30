#!/usr/bin/env node
// Dedicated Product Demo narration. Node 22+, ffmpeg and ffprobe; no SDK dependencies.
import {readFile, writeFile, mkdir, lstat, rename, unlink, open} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {parseEnv} from 'node:util';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec = promisify(execFile);
const VERSION = 1;
const PROVIDERS = ['openai', 'elevenlabs', 'fish', 'other', 'none'];
const KEYS = {openai: ['OPENAI_API_KEY'], elevenlabs: ['ELEVENLABS_API_KEY'], fish: ['FISH_API_KEY', 'FISH_AUDIO_API_KEY'], other: ['PRODUCT_DEMO_VOICE_API_KEY']};
const MODELS = {openai: 'gpt-4o-mini-tts', elevenlabs: 'eleven_multilingual_v2', fish: 's2.1-pro-free'};
const OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
// Fish silently falls back to a paid model for unknown names. Reject typos before sending.
const FISH_MODELS = ['s1', 's2-pro', 's2.1-pro', 's2.1-pro-free', 'drama-3-preview'];
const SETTINGS = {
  openai: ['instructions', 'speed'],
  elevenlabs: ['voice_settings', 'language_code', 'seed', 'previous_text', 'next_text', 'previous_request_ids', 'next_request_ids', 'apply_text_normalization'],
  fish: ['temperature', 'top_p', 'prosody', 'chunk_length', 'normalize', 'sample_rate', 'mp3_bitrate', 'latency', 'max_new_tokens', 'repetition_penalty', 'min_chunk_length', 'condition_on_previous_chunks', 'early_stop_threshold', 'features'],
};
const fail = (code, message) => {const error = new Error(message); error.code = code; error.narrationError = true; throw error;};
const sha = value => createHash('sha256').update(value).digest('hex');
const stable = value => JSON.stringify(value, function (key, item) {return item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item;});
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
async function exists(path) {try {await lstat(path); return true;} catch (e) {if (e.code === 'ENOENT') return false; throw e;}}
async function readRegular(path, limit = 1048576) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > limit) fail('INVALID_FILE', 'Use a regular local file within the supported size.');
  return readFile(path, 'utf8');
}
async function readJSON(path) {try {return JSON.parse(await readRegular(path));} catch (error) {if (error.code === 'ENOENT') return null; fail('INVALID_JSON', 'A narration settings or metadata file cannot be read. Repair it before continuing.');}}

export function normalizeConfig(raw) {
  if (!object(raw) || !PROVIDERS.includes(raw.provider)) fail('NO_VOICE_CONFIG', 'Choose a narration provider in Product Demo setup, or supply --config with a provider.');
  const allowed = ['provider', 'voice', 'service', 'model', 'settings', 'timeoutMs'];
  if (Object.keys(raw).some(k => !allowed.includes(k))) fail('INVALID_CONFIG', 'Narration config accepts provider, voice, service, model, settings and timeoutMs. Keep API keys in the environment or .env.local.');
  if (raw.voice !== undefined && typeof raw.voice !== 'string') fail('INVALID_VOICE', 'Use a voice name, ID or provider link as a string.');
  const voice = (raw.voice || '').trim();
  if (voice.length > 2048 || /[\r\n\0]/.test(voice)) fail('INVALID_VOICE', 'Use a single voice name, ID or provider link.');
  const settings = raw.settings ?? {};
  if (!object(settings) || Object.keys(settings).some(k => !(SETTINGS[raw.provider] || []).includes(k))) fail('INVALID_SETTINGS', 'An unsupported narration setting was supplied. Use the provider settings listed in references/narration.md.');
  const model = raw.model ?? MODELS[raw.provider] ?? null;
  if (model !== null && (typeof model !== 'string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(model))) fail('INVALID_MODEL', 'Use an official model identifier.');
  if (raw.provider === 'fish' && !FISH_MODELS.includes(model)) fail('INVALID_MODEL', 'Unknown Fish model. Use s2.1-pro-free, s2.1-pro, s2-pro, s1 or drama-3-preview. Unknown model names can incur paid fallback at Fish.');
  if (raw.provider === 'openai' && settings.instructions !== undefined && !model.startsWith('gpt-4o-mini-tts')) fail('INVALID_SETTINGS', 'OpenAI delivery instructions require a gpt-4o-mini-tts model.');
  if (settings.instructions !== undefined && typeof settings.instructions !== 'string') fail('INVALID_SETTINGS', 'Narration instructions must be text.');
  if (raw.provider === 'openai' && settings.speed !== undefined && !(typeof settings.speed === 'number' && settings.speed >= 0.25 && settings.speed <= 4)) fail('INVALID_SETTINGS', 'OpenAI speed must be a number from 0.25 to 4.');
  const timeoutMs = raw.timeoutMs ?? 120000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) fail('INVALID_CONFIG', 'timeoutMs must be from 1000 to 300000.');
  return {provider: raw.provider, voice, service: typeof raw.service === 'string' ? raw.service.trim() : '', model, settings, timeoutMs};
}

export async function resolveConfig(options = {}) {
  const root = resolve(options.root || process.cwd());
  if (options.config) {
    const raw = await readJSON(resolve(options.config));
    if (!raw) fail('NO_VOICE_CONFIG', 'The explicit narration config does not exist.');
    return {root, config: normalizeConfig(raw), source: 'explicit'};
  }
  if (options.project) {
    const project = await readJSON(resolve(options.project, 'project.json'));
    if (!project) fail('NO_PROJECT', 'The selected project needs its project.json.');
    if (Object.hasOwn(project, 'voice')) return {root, config: normalizeConfig(project.voice), source: 'project'};
  }
  const saved = await readJSON(resolve(root, 'workspace/library/product-demo.json'));
  if (saved?.setup?.done === true) return {root, config: normalizeConfig(saved.answers?.voice), source: 'workspace'};
  fail('NO_VOICE_CONFIG', 'Complete Product Demo voice setup, or supply an explicit --config. Unfinished setup is never used for generation.');
}

async function readKeys(root, env) {
  const file = resolve(root, '.env.local');
  const local = await exists(file) ? parseEnv(await readRegular(file)) : {};
  // The workspace UI saves here; current shell values fill missing workspace keys.
  return Object.fromEntries([...new Set(Object.values(KEYS).flat())].map(name => [name, String(local[name] || env[name] || '').trim()]));
}
function apiKey(config, keys) {return (KEYS[config.provider] || []).map(k => keys[k]).find(Boolean) || '';}
function safeRequestId(response) {
  const value = response.headers.get('x-request-id') || response.headers.get('request-id') || response.headers.get('x-trace-id') || '';
  return /^[a-zA-Z0-9_.:-]{1,150}$/.test(value) ? value : null;
}
async function request(url, init, {fetchImpl, timeoutMs, provider}, read) {
  const signal = AbortSignal.timeout(timeoutMs);
  let response;
  try {
    response = await fetchImpl(url, {...init, redirect: 'error', signal});
    if (!response.ok) {
      await response.body?.cancel();
      const reason = {401: 'API key was rejected', 402: 'account balance or model access is insufficient', 403: 'account cannot access this voice or model', 404: 'voice or model was not found', 422: 'voice, model or settings were rejected', 429: 'rate limit or quota was reached', 503: 'service is unavailable'}[response.status] || 'provider rejected the request';
      fail('PROVIDER_HTTP', `${provider}: ${reason} (HTTP ${response.status}). No automatic retry was made. Check access and settings before trying again.`);
    }
    return await read(response);
  } catch (error) {
    if (['PROVIDER_HTTP', 'INVALID_RESPONSE', 'RESPONSE_TOO_LARGE'].includes(error.code)) throw error;
    fail('PROVIDER_NETWORK', `${provider}: the request or response could not complete. No automatic retry was made; generation may have been charged. Check provider history before trying again.`);
  }
}
async function bytes(response, limit) {
  if (!response.body) fail('INVALID_RESPONSE', 'The provider returned no response body.');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      size += value.length;
      if (size > limit) fail('RESPONSE_TOO_LARGE', 'The provider response exceeded the size limit. No automatic retry was made.');
      chunks.push(value);
    }
  } finally {await reader.cancel().catch(() => {});}
  return Buffer.concat(chunks);
}
async function getJSON(url, headers, context) {
  return request(url, {method: 'GET', headers}, context, async response => {
    try {return JSON.parse((await bytes(response, 4194304)).toString('utf8'));}
    catch (error) {if (error.code === 'RESPONSE_TOO_LARGE') throw error; fail('INVALID_RESPONSE', 'The voice catalog returned invalid JSON. No narration was requested.');}
  });
}

function voiceLink(value, provider) {
  if (!/^https?:\/\//i.test(value)) return null;
  let url; try {url = new URL(value);} catch {fail('INVALID_VOICE', 'The voice link is invalid.');}
  const hosts = provider === 'elevenlabs' ? ['elevenlabs.io', 'www.elevenlabs.io'] : ['fish.audio', 'www.fish.audio'];
  if (url.protocol !== 'https:' || !hosts.includes(url.hostname)) fail('INVALID_VOICE', 'Use a link from the selected voice provider, or the exact voice ID.');
  if (provider === 'elevenlabs') {
    const id = url.searchParams.get('voiceId') || url.searchParams.get('voice_id') || url.pathname.match(/\/(?:voice|voices)\/([a-zA-Z0-9]{20,})\/?$/)?.[1];
    if (id && /^[a-zA-Z0-9]{20,}$/.test(id)) return id;
  } else {
    const id = url.pathname.match(/\/m\/([a-f0-9]{32})\/?$/i)?.[1];
    if (id) return id.toLowerCase();
  }
  fail('INVALID_VOICE', 'The provider link does not expose an unambiguous voice ID. Copy the voice ID from the provider.');
}

export async function resolveVoice(config, key, dependencies = {}) {
  const context = {fetchImpl: dependencies.fetchImpl || fetch, timeoutMs: config.timeoutMs, provider: config.provider};
  const value = config.voice;
  if (config.provider === 'openai') {
    if (!value) return {id: 'cedar', name: 'cedar', selection: 'stock-default'};
    if (OPENAI_VOICES.includes(value.toLowerCase())) return {id: value.toLowerCase(), name: value.toLowerCase(), selection: 'specified'};
    if (/^voice_[a-zA-Z0-9_-]+$/.test(value)) return {id: value, name: null, custom: true, selection: 'specified'};
    fail('INVALID_VOICE', 'OpenAI needs a supported stock voice name or a custom voice_ ID. No replacement voice was chosen.');
  }
  if (config.provider === 'elevenlabs') {
    if (!value) return {id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', selection: 'stock-default'};
    const id = voiceLink(value, config.provider) || (/^[a-zA-Z0-9]{20,}$/.test(value) ? value : null);
    if (id) return {id, name: null, selection: 'specified'};
    const matches = new Map(); let pageToken;
    for (let page = 0; page < 20; page++) {
      const url = new URL('https://api.elevenlabs.io/v2/voices');
      url.searchParams.set('search', value); url.searchParams.set('page_size', '100');
      if (pageToken) url.searchParams.set('next_page_token', pageToken);
      const data = await getJSON(url.href, {'xi-api-key': key}, context);
      if (!Array.isArray(data.voices)) fail('INVALID_RESPONSE', 'ElevenLabs returned no usable voice catalog. Supply the exact voice ID.');
      for (const item of data.voices) if (item.name?.toLowerCase() === value.toLowerCase() && /^[a-zA-Z0-9]{20,}$/.test(item.voice_id)) matches.set(item.voice_id, item.name);
      if (!data.has_more) return uniqueVoice(matches, 'ElevenLabs');
      if (!data.next_page_token || data.next_page_token === pageToken) break;
      pageToken = data.next_page_token;
    }
    fail('AMBIGUOUS_VOICE', 'The ElevenLabs catalog search did not finish. Supply the exact voice ID.');
  }
  if (config.provider === 'fish') {
    // Fish's unspecified reference is a provider default, not a stable named identity.
    if (!value) fail('VOICE_REQUIRED', 'Choose a Fish voice ID or fish.audio/m/ link. Fish has no stable named stock default in this adapter.');
    const id = voiceLink(value, config.provider) || (/^[a-f0-9]{32}$/i.test(value) ? value.toLowerCase() : null);
    if (id) return {id, name: null, selection: 'specified'};
    const matches = new Map();
    for (let page = 1; page <= 20; page++) {
      const url = new URL('https://api.fish.audio/model');
      url.searchParams.set('title', value); url.searchParams.set('page_size', '100'); url.searchParams.set('page_number', String(page));
      const data = await getJSON(url.href, {Authorization: `Bearer ${key}`}, context);
      if (!Array.isArray(data.items)) fail('INVALID_RESPONSE', 'Fish returned no usable voice catalog. Supply the exact voice ID.');
      for (const item of data.items) if (item.title?.toLowerCase() === value.toLowerCase() && /^[a-f0-9]{32}$/i.test(item._id)) matches.set(item._id, item.title);
      if (!data.has_more) return uniqueVoice(matches, 'Fish');
    }
    fail('AMBIGUOUS_VOICE', 'The Fish catalog search did not finish. Supply the exact voice ID.');
  }
  fail('UNSUPPORTED_PROVIDER', 'This provider has no narration adapter.');
}
function uniqueVoice(matches, provider) {
  if (matches.size !== 1) fail('AMBIGUOUS_VOICE', `${provider}: the exact voice name matched ${matches.size} voices. Supply the intended voice ID; no substitute was chosen.`);
  const [[id, name]] = matches; return {id, name, selection: 'name-match'};
}

export function buildRequest(config, voice, text, key) {
  if (config.provider === 'openai') {
    if ([...text].length > 4096) fail('TEXT_TOO_LONG', 'OpenAI accepts at most 4096 characters per request. Split the narration at a natural passage and use separate output files.');
    return {url: 'https://api.openai.com/v1/audio/speech', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'audio/mpeg'}, body: {model: config.model, input: text, voice: voice.custom ? {id: voice.id} : voice.id, response_format: 'mp3', ...config.settings}};
  }
  if (config.provider === 'elevenlabs') return {url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.id)}?output_format=mp3_44100_128`, headers: {'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg'}, body: {text, model_id: config.model, ...config.settings}};
  if (config.provider === 'fish') return {url: 'https://api.fish.audio/v1/tts', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'audio/mpeg', model: config.model}, body: {text, reference_id: voice.id, format: 'mp3', ...config.settings}};
  fail('UNSUPPORTED_PROVIDER', 'This provider has no narration adapter.');
}

export async function inspectAudio(path, dependencies = {}) {
  const run = dependencies.execImpl || exec;
  let probe;
  try {
    const result = await run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], {timeout: 60000, maxBuffer: 2097152});
    probe = JSON.parse(result.stdout);
    const audio = probe.streams?.filter(s => s.codec_type === 'audio') || [];
    const duration = Number(probe.format?.duration);
    if (audio.length !== 1 || probe.streams.length !== 1 || audio[0].codec_name !== 'mp3' || !Number.isFinite(duration) || duration <= 0) throw new Error('Invalid audio');
    await run('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-i', path, '-map', '0:a:0', '-f', 'null', '-'], {timeout: 60000, maxBuffer: 2097152});
    return {durationSeconds: duration, codec: audio[0].codec_name, sampleRate: Number(audio[0].sample_rate), channels: audio[0].channels, fullDecode: true};
  } catch {fail('INVALID_AUDIO', 'The MP3 failed duration, format or full decode validation. No previous audio was replaced. Check the provider response before requesting another generation.');}
}
async function checkTools(dependencies) {
  try {for (const tool of ['ffprobe', 'ffmpeg']) await (dependencies.execImpl || exec)(tool, ['-version'], {timeout: 10000, maxBuffer: 1048576});}
  catch {fail('MISSING_AUDIO_TOOLS', 'Install ffmpeg and ffprobe before narration generation. No provider request was made.');}
}
async function validateCache(out, fingerprint, dependencies) {
  const metaPath = `${out}.narration.json`;
  if (!await exists(out) && !await exists(metaPath)) return null;
  const meta = await readJSON(metaPath);
  if (!meta || meta.inputFingerprint !== fingerprint || !await exists(out)) fail('OUTPUT_EXISTS', 'This output already belongs to another or incomplete narration. Keep it and choose a new --out filename.');
  const stat = await lstat(out);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 52428800 || sha(await readFile(out)) !== meta.audioSha256) fail('INVALID_CACHE', 'The existing audio does not match its metadata. Choose a new output after inspecting the files. No regeneration was requested.');
  const measured = await inspectAudio(out, dependencies);
  if (Math.abs(measured.durationSeconds - meta.durationSeconds) > 0.001) fail('INVALID_CACHE', 'The cached audio duration does not match its metadata. No regeneration was requested.');
  return {ok: true, cached: true, out, metadata: metaPath, provider: meta.provider, model: meta.model, voice: meta.resolvedVoice, ...measured};
}

export async function runNarration(options = {}, dependencies = {}) {
  const {root, config, source} = await resolveConfig(options);
  const keys = config.provider === 'none' ? {} : await readKeys(root, dependencies.env || process.env);
  const key = apiKey(config, keys);
  if (options.check) return {ok: true, mode: 'check', provider: config.provider, model: config.model, requestedVoice: config.voice || null, source, keyPresent: Boolean(key), adapterSupported: !['other', 'none'].includes(config.provider), narrationEnabled: config.provider !== 'none', accessVerified: false, voiceVerified: false, networkRequests: 0};
  if (config.provider === 'none') return {ok: true, skipped: true, provider: 'none', reason: 'Saved choice uses no narration.', networkRequests: 0};
  if (config.provider === 'other') fail('UNSUPPORTED_PROVIDER', 'The saved custom service needs its own reviewed adapter. Add its official request contract and credential mapping in narrate.mjs, or supply a recorded narration file. No key or text was sent.');
  if (!options.textFile || !options.out) fail('MISSING_ARGUMENT', 'Supply --text-file and a new --out path ending in .mp3.');
  const out = resolve(options.out);
  if (extname(out).toLowerCase() !== '.mp3') fail('INVALID_OUTPUT', 'Narration output must end in .mp3.');
  const text = (await readRegular(resolve(options.textFile), 262144)).replace(/^\uFEFF/, '').trim();
  if (!text) fail('EMPTY_TEXT', 'The narration text file is empty.');
  const textSha256 = sha(text);
  const inputFingerprint = sha(stable({version: VERSION, provider: config.provider, voice: config.voice, model: config.model, settings: config.settings, textSha256}));
  await checkTools(dependencies);
  const existing = await validateCache(out, inputFingerprint, dependencies); if (existing) return existing;
  if (!key) fail('MISSING_KEY', `Save ${KEYS[config.provider][0]} in the workspace .env.local or shell environment. No provider request was made.`);
  await mkdir(dirname(out), {recursive: true});
  const lockPath = `${out}.narration.lock`;
  let lock;
  try {lock = await open(lockPath, 'wx', 0o600); await lock.writeFile(JSON.stringify({pid: process.pid, at: new Date().toISOString()}));}
  catch {if (lock) {await lock.close(); await unlink(lockPath).catch(() => {});} fail('OUTPUT_LOCKED', 'Another narration owns this output lock. Check its process and files before removing a stale lock or choosing a new output.');}
  const temporary = `${out}.${randomUUID()}.tmp.mp3`;
  const stagedMeta = `${temporary}.json`;
  try {
    const cached = await validateCache(out, inputFingerprint, dependencies); if (cached) return cached;
    const voice = await resolveVoice(config, key, dependencies);
    const spec = buildRequest(config, voice, text, key);
    const fetched = await request(spec.url, {method: 'POST', headers: spec.headers, body: JSON.stringify(spec.body)}, {fetchImpl: dependencies.fetchImpl || fetch, timeoutMs: config.timeoutMs, provider: config.provider}, async response => {
      const contentType = response.headers.get('content-type') || '';
      if (/json|text\/|html/i.test(contentType)) fail('INVALID_RESPONSE', 'The provider returned text instead of audio. No previous file was replaced and no retry was made.');
      return {audio: await bytes(response, 52428800), requestId: safeRequestId(response)};
    });
    await writeFile(temporary, fetched.audio, {flag: 'wx', mode: 0o600});
    const measured = await inspectAudio(temporary, dependencies);
    const metadata = {schemaVersion: VERSION, generatedAt: new Date().toISOString(), provider: config.provider, model: config.model, configSource: source, requestedVoice: config.voice || null, resolvedVoice: voice, inputFingerprint, requestFingerprint: sha(stable({url: spec.url, body: spec.body, model: config.model})), settingsSha256: sha(stable(config.settings)), textSha256, textCharacters: [...text].length, audioSha256: sha(fetched.audio), bytes: fetched.audio.length, providerRequestId: fetched.requestId, ...measured};
    await writeFile(stagedMeta, JSON.stringify(metadata, null, 2) + '\n', {flag: 'wx', mode: 0o600});
    // The lock plus a second existence check protects prior valid takes.
    if (await exists(out) || await exists(`${out}.narration.json`)) fail('OUTPUT_EXISTS', 'An output appeared during generation. Existing files were preserved.');
    await rename(stagedMeta, `${out}.narration.json`);
    await rename(temporary, out);
    return {ok: true, cached: false, out, metadata: `${out}.narration.json`, provider: config.provider, model: config.model, voice, ...measured};
  } finally {
    await unlink(temporary).catch(() => {}); await unlink(stagedMeta).catch(() => {});
    await lock.close(); await unlink(lockPath).catch(() => {});
  }
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const options = {}; const names = {'--root': 'root', '--project': 'project', '--text-file': 'textFile', '--out': 'out', '--config': 'config'};
  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--check') {options.check = true; continue;}
      if (args[i] === '--help') {console.log('narrate.mjs --root <workspace> [--project <project-dir>] [--config <voice.json>] --text-file <narration.txt> --out <new.mp3>\nUse --check to inspect config and key presence without network calls.'); return;}
      const name = names[args[i]]; if (!name || !args[i + 1] || args[i + 1].startsWith('--')) fail('INVALID_ARGUMENT', 'Use --help for narration arguments.');
      options[name] = args[++i];
    }
    console.log(JSON.stringify(await runNarration(options, dependencies), null, 2));
  } catch (error) {
    const known = error.narrationError === true;
    console.error(JSON.stringify({ok: false, code: known ? error.code : 'NARRATION_FAILED', error: known ? error.message : 'A local narration operation failed. Check file access and available disk space. Credentials and source text were omitted.'}));
    process.exitCode = 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
