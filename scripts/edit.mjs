#!/usr/bin/env node
// edit.mjs read <project> [--fresh] | export <project> [--still-only] [--out <file.mp4>] [--keep] | check <project> [--out <file.mp4>] | status
//          | resolve <project> <item> [--src <file> [--on <item>]]
// Contract: the agent's side of the video editor. Run from the folder holding runtime.json.
//   read     opens a project's edit (workspace/projects/<id>/edit/timeline.json), making it through the format's reader
//            when there is none; --fresh reads it again from the format's files, keeping the old one in edit/versions/
//            and raising the revision. Prints { ok, project, revision, reader, fps, width, height, frames, tracks, items, file }.
//   export   renders the edit: checkDoc first (refuses on any problem); untouched full-frame clips and every sound go
//            through ffmpeg; everything drawn is rendered by the Edit composition on a transparent track and laid over in
//            the same ffmpeg pass (H.264 crf 18, yuv420p, bt709, faststart, AAC 192k). A still of the busiest frame is
//            written first beside the video (.jpg); --still-only stops there. Then the checks: length within one frame,
//            size, rate, sound, peak, and three frames compared with the Edit composition (edit/checks/r<revision>/ holds
//            each pair side by side as f<frame>.jpg). Writes workspace/output/<project>/edit-r<revision>.mp4 (or --out),
//            appends { revision, path, still, at, frames, ok, checks } to edit/exports.json and marks
//            edit/export-request.json done, or failed with the reason. A failed video is moved to the checks folder.
//            Prints { ok, project, revision, video, still, checks, looks, plan }. Exits 1 when a check fails.
//   check    re-runs the checks on an existing export of the current revision (renders the Edit stills again).
//   status   prints { pending: [{ project, revision, requestedAt, agent? }] }: export requests the buyer made in the
//            editor, each with the items that need the agent first (agent: [{ id, label, task, note, guide }]).
//   resolve  after the agent did an item's task (item.agent), clears it: applies the item's agent.done (fields the look
//            said the item holds once done, data merged), and with --src makes <file> the src of the item named by --on
//            (default the item itself), refusing a file of another length. Keeps the old edit in edit/versions/ and
//            raises the revision. Prints { ok, project, item, revision, left }.
//   <project> is a project folder name, or <project>@<version> for one version of a Trial Reels project (its edit in
//   edit/<version>/, its video <version>-edit-r<revision>.mp4 with the version's caption beside it).
//   Exits 1 with { ok: false, error, tasks? } on any refusal; export refuses while an item carries agent.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { agentTasks, exportEdit, pendingExports, probeFile, projectPaths } from './edit-export.mjs';
import { checkDoc } from './edit-doc.mjs';

const args = process.argv.slice(2);
const [command, project] = args;
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const root = resolve(opt('--root') ?? process.cwd());
const print = (value) => console.log(JSON.stringify(value));
const fail = (error) => { print({ ok: false, error: String(error?.message ?? error), ...(error?.tasks ? { tasks: error.tasks } : {}) }); process.exit(1); };
const readJson = (path, fallback = null) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };

async function read() {
  const paths = projectPaths(root, project);
  const before = readJson(paths.file);
  const { readEdit } = await import('./workspace-edit.mjs');
  const fresh = args.includes('--fresh');
  const { doc } = await readEdit(root, project, { fresh });
  // A fresh read never loses the buyer's edit: the old one is kept and the new one takes the next revision, so an
  // export of the old revision keeps its own file name.
  if (fresh && before) {
    const versions = join(paths.edit, 'versions');
    mkdirSync(versions, { recursive: true });
    writeFileSync(join(versions, `${String(before.revision ?? 1).padStart(5, '0')}.json`), JSON.stringify(before, null, 1) + '\n');
    doc.revision = (before.revision ?? 1) + 1;
    const temporary = `${paths.file}.tmp`;
    writeFileSync(temporary, JSON.stringify(doc, null, 1) + '\n');
    renameSync(temporary, paths.file);
  }
  const items = {};
  for (const item of doc.items) items[item.type] = (items[item.type] ?? 0) + 1;
  print({ ok: true, project, revision: doc.revision, reader: doc.source?.reader ?? null, fps: doc.fps, width: doc.width, height: doc.height, frames: doc.durationInFrames, tracks: doc.tracks.length, items, file: `workspace/projects/${project}/edit/timeline.json` });
}

// Keeps the document as it was in edit/versions/, then writes the next revision.
function writeNext(paths, before, doc) {
  const versions = join(paths.edit, 'versions');
  mkdirSync(versions, { recursive: true });
  writeFileSync(join(versions, `${String(before.revision ?? 1).padStart(5, '0')}.json`), JSON.stringify(before, null, 1) + '\n');
  const next = { ...doc, revision: (before.revision ?? 1) + 1, editedAt: new Date().toISOString() };
  const temporary = `${paths.file}.tmp`;
  writeFileSync(temporary, JSON.stringify(next, null, 1) + '\n');
  renameSync(temporary, paths.file);
  return next;
}

function resolveTask() {
  const itemId = args[2];
  const paths = projectPaths(root, project);
  const before = readJson(paths.file);
  if (!before) throw new Error('No edit for this video.');
  const item = before.items.find((i) => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId} in this edit.`);
  if (!item.agent) throw new Error(`${item.label || itemId} needs nothing from you.`);
  const src = opt('--src');
  const onId = opt('--on') ?? itemId;
  const done = item.agent.done && typeof item.agent.done === 'object' ? item.agent.done : {};
  let items = before.items.map((i) => {
    if (i.id !== itemId) return i;
    const { agent, ...rest } = i;
    return { ...rest, ...done, ...(done.data ? { data: { ...(i.data ?? {}), ...done.data } } : {}) };
  });
  if (src) {
    const target = items.find((i) => i.id === onId);
    if (!target || !['video', 'audio', 'image'].includes(target.type)) throw new Error(`--on ${onId} is not a clip, sound or picture in this edit.`);
    if (!existsSync(join(root, src))) throw new Error(`${src} is not in the folder.`);
    if (target.type !== 'image') {
      const info = probeFile(root, src);
      const frames = Math.round(info.duration * before.fps);
      if (target.sourceDurationInFrames && Math.abs(frames - target.sourceDurationInFrames) > 1) throw new Error(`${src} runs ${frames} frames, the clip it replaces ${target.sourceDurationInFrames}. Make it the same length.`);
    }
    items = items.map((i) => (i.id === onId ? { ...i, src, preview: undefined } : i));
  }
  const doc = { ...before, items };
  const problems = checkDoc(doc);
  if (problems.length) throw new Error(`The edit would not pass its check: ${problems.join(' ')}`);
  const next = writeNext(paths, before, doc);
  print({ ok: true, project: paths.key, item: itemId, revision: next.revision, left: agentTasks(root, next) });
}

async function check() {
  const paths = projectPaths(root, project);
  const doc = readJson(paths.file);
  if (!doc) throw new Error('No edit to check.');
  const out = opt('--out') ?? readJson(paths.exports, []).filter((e) => e.revision === doc.revision && e.ok).at(-1)?.path;
  if (!out || !existsSync(resolve(root, out))) throw new Error(`No export of revision ${doc.revision} to check. Run: node scripts/edit.mjs export ${project}`);
  const { recheck } = await import('./edit-export.mjs');
  print(await recheck(root, project, out));
}

try {
  if (command === 'read' && project) await read();
  else if (command === 'export' && project) {
    const result = await exportEdit(root, project, { stillOnly: args.includes('--still-only'), out: opt('--out'), keep: args.includes('--keep') });
    print(result);
    if (!result.ok) process.exitCode = 1;
  } else if (command === 'check' && project) await check();
  else if (command === 'status') {
    // Each waiting export with what needs the agent before it can run.
    print({ pending: pendingExports(root).map((p) => {
      const doc = readJson(projectPaths(root, p.project).file);
      const tasks = doc ? agentTasks(root, doc) : [];
      return tasks.length ? { ...p, agent: tasks } : p;
    }) });
  } else if (command === 'resolve' && project && args[2]) resolveTask();
  else fail('usage: edit.mjs read <project> [--fresh] | export <project> [--still-only] [--out file.mp4] | check <project> [--out file.mp4] | status | resolve <project> <item> [--src file [--on item]]');
} catch (error) { fail(error); }
