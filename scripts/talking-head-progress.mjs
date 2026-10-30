#!/usr/bin/env node
// The workspace follows a Talking Head video by reading the engine's own files: its layer locks
// (locks.json, written by lock_layer.py), the approved: line of visual-plan.md, and the delivered file.
// The editor is never asked for a receipt: readVideoSteps and readVideoPreview only read.
// Stages are in the engine's order: cut and captions, hook, visual plan, visuals, sound and delivery.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VIDEO_STEPS = [
  ['captions', 'Captions'], ['hook', 'Hook'], ['visual-plan', 'Visual plan'],
  ['visuals', 'Visuals'], ['sound', 'Sound & delivery'],
];
const VIDEO_CHECKS = [
  ['footage', 'Footage'], ['transcript', 'Transcript'], ['cut', 'Cut'], ['captions', 'Captions'],
  ['opening', 'Hook'], ['visual-plan', 'Visual plan'], ['pictures', 'Visuals'], ['export', 'Finished video'],
];
const STAGE_CHECKS = [[0, 1, 2, 3], [4], [5], [6], [7]];
const read = (path, fallback = null) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };
const file = (path) => { try { return statSync(path).isFile() && statSync(path).size > 0; } catch { return false; } };
const text = (path) => { try { return readFileSync(path, 'utf8'); } catch { return ''; } };
const canonical = (path) => { try { return realpathSync(path); } catch { return resolve(path); } };
const inside = (parent, path) => { const rel = relative(parent, path); return Boolean(rel && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !isAbsolute(rel)); };
const atomic = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n'); renameSync(tmp, path);
};
// Existing videos may still use plan.md. A new plan always takes precedence, including a draft.
export const planPath = (dir) => existsSync(join(dir, 'visual-plan.md')) || !existsSync(join(dir, 'plan.md')) ? join(dir, 'visual-plan.md') : join(dir, 'plan.md');
const planApproved = (dir) => /^approved:[ \t]*\S[^\r\n]+$/im.test(text(planPath(dir)));
function rootOf(dir) {
  let at = resolve(dir);
  while (dirname(at) !== at) { if (existsSync(join(at, 'runtime.json'))) return at; at = dirname(at); }
  throw new Error('This video must live in a Keyframes folder with runtime.json.');
}
function validTranscript(path) {
  if (!file(path)) return false;
  // auto-editor writes one word per line; older transcripts are one JSON document.
  const content = text(path).trim();
  try {
    let data;
    try { data = JSON.parse(content); } catch { data = content.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line)); }
    const words = Array.isArray(data) ? data : data.words ?? data.segments ?? [data];
    return words.length > 0 && words.every((word) => word && typeof word === 'object');
  } catch { return false; }
}
// A lock is the engine's record of an approval: the words that gave it and a hash of each locked file.
// 'ok' the layer is approved and unchanged; 'changed' a locked file moved after the approval; 'none' not approved yet.
function lockState(dir, locks, id) {
  const entry = locks?.[id];
  if (!entry || !String(entry.note ?? entry.said ?? '').trim()) return 'none';
  const files = entry.files ?? {};
  if (!Object.keys(files).length) return 'none';
  for (const [name, hash] of Object.entries(files)) {
    const path = resolve(dir, name);
    if (!inside(dir, path) || !file(path)) return 'changed';
    if (!createHash('sha256').update(readFileSync(path)).digest('hex').startsWith(String(hash))) return 'changed';
  }
  return 'ok';
}
const videosIn = (dir) => { try { return readdirSync(dir).filter((name) => /\.mp4$/i.test(name) && file(join(dir, name))).sort().map((name) => join(dir, name)); } catch { return []; } };
// The finished video is the copy the talking-head skill puts in workspace/output/<project folder name>/.
function delivered(dir, root, project) {
  const places = [join(root, 'workspace/output', basename(dir))];
  if (typeof project.output === 'string' && project.output) places.push(resolve(root, project.output));
  for (const place of places) if (inside(resolve(root, 'workspace/output'), place)) { const found = videosIn(place); if (found.length) return found; }
  return [];
}

export function readVideoSteps(projectDir, options = {}) {
  const dir = canonical(projectDir), root = canonical(options.root ?? rootOf(dir));
  const project = read(join(dir, 'project.json'), {}) ?? {};
  const locks = read(join(dir, 'locks.json'), {}) ?? {};
  const paths = (...items) => items.filter(Boolean).map((p) => relative(root, p).replaceAll('\\', '/'));
  const source = [join(dir, 'source.mov'), join(dir, 'source.mp4'), typeof project.source === 'string' && project.source ? resolve(root, project.source) : null].find((p) => p && file(p));
  const footage = Boolean(source) || file(join(dir, 'source.txt')) || file(join(dir, 'master.mp4'));
  const hasPlan = Boolean(text(planPath(dir)).trim());
  const out = delivered(dir, root, project);
  const state = { cut: lockState(dir, locks, 'cut'), captions: lockState(dir, locks, 'captions'), hook: lockState(dir, locks, 'hook'), visuals: lockState(dir, locks, 'visuals') };
  const changed = (id, label) => state[id] === 'changed' ? `${label} changed after approval. Your agent unlocks that layer with your reason, then locks it again.` : '';
  const gates = [
    [footage, paths(source), 'Your agent copies the clip into this video.', false],
    [validTranscript(join(dir, 'words.json')), paths(join(dir, 'words.json')), 'Your agent transcribes the clip.', false],
    [state.cut === 'ok', paths(join(dir, 'cuts.json'), join(dir, 'locks.json')), changed('cut', 'The cut') || (file(join(dir, 'master.mp4')) ? 'Watch the cut with your agent. Your OK locks it.' : 'Your agent cuts the clip.'), file(join(dir, 'master.mp4'))],
    [state.captions === 'ok', paths(join(dir, 'captions.json'), join(dir, 'locks.json')), changed('captions', 'The captions') || (file(join(dir, 'captions.json')) ? 'Watch the captions with your agent. Your OK on the hook locks both.' : 'Your agent builds the captions.'), file(join(dir, 'captions.json'))],
    [state.hook === 'ok', paths(join(dir, 'hook.json'), join(dir, 'locks.json')), changed('hook', 'The hook') || (file(join(dir, 'hook.json')) ? 'Review the hook with your agent in chat. Your OK locks it.' : 'Your agent builds the hook.'), file(join(dir, 'hook.json'))],
    [planApproved(dir), paths(planPath(dir)), hasPlan ? 'Correct the visual plan in words with your agent. Your OK approves it.' : 'Your agent writes the visual plan for you to correct.', hasPlan],
    [state.visuals === 'ok', paths(planPath(dir), join(dir, 'visuals.json'), join(dir, 'locks.json')), changed('visuals', 'The visuals') || (file(join(dir, 'visuals.json')) ? 'Watch the visuals with your agent. Your OK locks them.' : 'Your agent builds the visuals from the approved plan.'), file(join(dir, 'visuals.json'))],
    [out.length > 0, paths(...out), 'Your agent delivers the finished video to output.', false],
  ];
  const checks = VIDEO_CHECKS.map(([id, label], index) => ({ id, label, ready: Boolean(gates[index][0]), evidence: gates[index][1], reason: gates[index][0] ? '' : gates[index][2] }));
  const groups = STAGE_CHECKS.map((indices) => indices.map((index) => checks[index]));
  let completed = 0;
  for (const group of groups) { if (!group.every((check) => check.ready)) break; completed++; }
  const steps = VIDEO_STEPS.map(([id, label], index) => {
    const waiting = STAGE_CHECKS[index].find((i) => !checks[i].ready);
    return {
      id, label, status: index < completed ? 'done' : index === completed ? 'current' : 'pending',
      ready: groups[index].every((check) => check.ready),
      evidence: [...new Set(groups[index].flatMap((check) => check.evidence))],
      reason: waiting === undefined ? '' : checks[waiting].reason,
      // A layer that exists and waits for its approval is the person's turn; everything else is the agent's.
      owner: index === completed && waiting !== undefined && gates[waiting][3] ? 'you' : 'agent',
    };
  });
  return { version: 4, format: 'talking-head', project: basename(dir), status: completed === steps.length ? 'complete' : 'active', current: steps[completed]?.id ?? null, completed, total: steps.length, steps, checks };
}

// What to watch for the stage the video is on: the engine's own renders, never a separate preview file.
export function readVideoPreview(projectDir, options = {}) {
  const dir = canonical(projectDir), root = canonical(options.root ?? rootOf(dir));
  const progress = options.progress ?? readVideoSteps(dir, { root });
  const rel = (path) => relative(root, path).replaceAll('\\', '/');
  if (progress.status === 'complete') {
    const out = delivered(dir, root, read(join(dir, 'project.json'), {}) ?? {});
    return out.length ? { path: rel(out.at(-1)), stage: 'delivered', kind: 'video' } : null;
  }
  const order = { captions: ['captioned.mp4', 'master.mp4'], hook: ['hook-preview.mp4', 'captioned.mp4'] }[progress.current] ?? ['captioned.mp4'];
  const found = order.map((name) => join(dir, name)).find(file);
  return found ? { path: rel(found), stage: progress.current, kind: 'video', at: statSync(found).mtime.toISOString() } : null;
}

export function refreshVideoSteps(dir, options = {}) {
  dir = resolve(dir);
  const next = readVideoSteps(dir, options), previous = read(join(dir, 'steps.json'));
  const { updatedAt: _at, ...content } = previous ?? {};
  if (JSON.stringify(content) === JSON.stringify(next)) return previous;
  const value = { ...next, updatedAt: new Date().toISOString() };
  atomic(join(dir, 'steps.json'), value); return value;
}

export function initVideoProject(projectDir, options = {}) {
  const dir = resolve(projectDir), root = options.root ?? rootOf(dir);
  if (!inside(resolve(root, 'workspace/projects'), dir)) throw new Error('Create this video inside workspace/projects.');
  const path = join(dir, 'project.json'), previous = read(path);
  if (previous && previous.format !== 'talking-head') throw new Error('This folder belongs to another format.');
  const project = previous ?? { format: 'talking-head', created_at: new Date().toISOString() };
  if (options.source && !project.source) project.source = isAbsolute(options.source) ? options.source : relative(root, resolve(root, options.source)).replaceAll('\\', '/');
  atomic(path, project);
  return refreshVideoSteps(dir, { root });
}

// The shared finishing commands ask before they act. The engine's own gates (lock_layer.py check, deliver.sh) decide
// what may ship; this only says what is still missing, in the same words the workspace shows.
export function requireVideoStep(dir, target, options = {}) {
  dir = canonical(dir);
  const current = refreshVideoSteps(dir, options);
  target = { visuals: 'pictures', hook: 'opening', review: 'export', delivery: 'export', render: 'export', preview: 'captions' }[target] ?? target;
  const index = VIDEO_CHECKS.findIndex(([id]) => id === target);
  if (index < 0) throw new Error(`Unknown video step: ${target}`);
  const missing = current.checks.slice(0, index).find((check) => !check.ready);
  if (missing) throw new Error(`${missing.label} comes first. ${missing.reason}`);
  return current;
}
export const recordVideoCheck = (dir, options = {}) => refreshVideoSteps(dir, options);
export const recordVideoExport = (dir, options = {}) => refreshVideoSteps(dir, options);

export function runVideoStepsCli(args) {
  try {
    const dir = args[0];
    if (!dir || dir.startsWith('--')) throw new Error('usage: talking-head-progress.mjs <project> [--init --source <clip>] [--json]');
    const opt = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
    if (args.includes('--init')) initVideoProject(dir, { source: opt('--source') });
    const state = refreshVideoSteps(dir);
    if (args.includes('--json')) console.log(JSON.stringify(state, null, 2));
    else if (!args.includes('--quiet')) console.log(state.current ? `${state.completed}/${state.total}: ${state.steps.find((s) => s.id === state.current).label}` : 'Finished video');
  } catch (error) { console.error(`error: ${error.message}`); process.exitCode = 1; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runVideoStepsCli(process.argv.slice(2));
