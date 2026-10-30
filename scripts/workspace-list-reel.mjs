// Read List Reel ideas, research and previews. HTTP changes only the buyer's idea bucket.
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { safeFile } from './workspace-state.mjs';
import { InputError } from './workspace-inputs.mjs';
import { LIST_INPUTS, listDirectory, readListJson, requireListReel, listInputState } from './workspace-list-inputs.mjs';
import { readListSteps, readListResearch, listArtifacts } from './list-reel-progress.mjs';

export const LIST_IDEAS = 'workspace/library/scroll-reel.ideas.json';
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const revisionOf = bytes => createHash('sha256').update(bytes).digest('hex');
const states = ['saved', 'suggested', 'shortlisted', 'used'];
const safeLink = value => {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
};

const ideaPath = format => format === 'phone' ? 'workspace/library/phone.ideas.json' : LIST_IDEAS;
function ideaLibrary(root, format = 'scroll-reel') {
  const path = ideaPath(format);
  const data = readListJson(root, path, { version: 1, ideas: [] });
  if (data?.version !== 1 || !Array.isArray(data.ideas) || data.ideas.length > 5000 || data.ideas.some(idea => !idea || typeof idea.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(idea.id) || typeof idea.title !== 'string' || !idea.title.trim() || !states.includes(idea.status)) || new Set(data.ideas.map(idea => idea.id)).size !== data.ideas.length) throw new InputError(409, 'Your ideas are updating. Try again.');
  const file = safeFile(root, path);
  return { data, revision: file ? revisionOf(readFileSync(file.path)) : null };
}
function visibleIdeas(library, projects = []) {
  return { items: library.data.ideas.filter(idea => !idea.archivedAt).map(idea => {
    const project = projects.find(project => project.id === idea.project || project.data?.ideaId === idea.id);
    const research = project?.listReel?.research ?? project?.oneShot?.research;
    const researchStatus = project?.steps?.find(step => step.id === 'research')?.status === 'done' ? 'ready' : research?.packPath ? 'needs-review' : 'not-started';
    return { ...idea, why: typeof idea.why === 'string' ? idea.why : idea.rationale ?? '', links: array(idea.links).map(link => safeLink(typeof link === 'string' ? link : link?.url)).filter(Boolean), researchStatus, ...(project ? { project: project.id } : {}) };
  }), revision: library.revision };
}
export function readListIdeas(root, projects = [], format = 'scroll-reel') {
  try { return visibleIdeas(ideaLibrary(root, format), projects); }
  catch (error) { return { items: [], revision: null, error: error.message }; }
}

function ideaFields(value, previous = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError(400, 'Write the idea to save.');
  const fields = { ...previous };
  for (const [key, limit] of [['title', 300], ['benefit', 1000], ['why', 2000], ['notes', 5000]]) {
    if (value[key] === undefined) continue;
    if (typeof value[key] !== 'string' || value[key].length > limit || value[key].includes('\0')) throw new InputError(400, `Keep the ${key} under ${limit} characters.`);
    if (key === 'why') { fields.rationale = value[key].trim(); delete fields.why; }
    else fields[key] = value[key].trim();
  }
  if (!fields.title?.trim()) throw new InputError(400, 'Give this idea a title.');
  if (value.links !== undefined) {
    if (!Array.isArray(value.links) || value.links.length > 20 || value.links.some(link => !safeLink(link))) throw new InputError(400, 'Add up to 20 source links.');
    fields.links = [...new Set(value.links.map(safeLink))];
  }
  return fields;
}

export function changeListIdeas(root, body, format = 'scroll-reel') {
  const path = ideaPath(format);
  requireListReel(root);
  if (!['add', 'update', 'save', 'archive'].includes(body?.action)) throw new InputError(400, 'Choose an idea action.');
  if (!(body.revision === null || typeof body.revision === 'string')) throw new InputError(400, 'Send the current idea revision.');
  const library = ideaLibrary(root, format);
  if (body.revision !== library.revision) throw new InputError(409, 'Your ideas changed. Refresh them before saving.');
  const now = new Date().toISOString(), ideas = library.data.ideas.map(idea => ({ ...idea }));
  if (body.action === 'add') {
    if (ideas.length >= 5000) throw new InputError(413, 'Your idea bucket is full.');
    const fields = ideaFields(body.idea);
    ideas.unshift({ ...fields, id: randomUUID(), status: 'saved', provenance: { kind: 'buyer', at: now }, createdAt: now, updatedAt: now });
  } else {
    const index = ideas.findIndex(idea => idea.id === body.id && !idea.archivedAt);
    if (index < 0) throw new InputError(404, 'This idea is no longer here.');
    const previous = ideas[index];
    if (body.action === 'update') ideas[index] = { ...ideaFields(body.idea, previous), updatedAt: now };
    if (body.action === 'save') ideas[index] = { ...previous, status: previous.status === 'used' ? 'used' : 'saved', updatedAt: now };
    if (body.action === 'archive') ideas[index] = { ...previous, archivedAt: now, updatedAt: now };
  }
  listDirectory(root, dirname(path));
  const bytes = JSON.stringify({ ...library.data, ideas }, null, 2) + '\n';
  if (Buffer.byteLength(bytes) > 2 * 1024 ** 2) throw new InputError(413, 'Your idea bucket is too large.');
  const temporary = join(root, `${path}.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 });
    if (ideaLibrary(root, format).revision !== library.revision) throw new InputError(409, 'Your ideas changed. Refresh them before saving.');
    renameSync(temporary, join(root, path));
  } finally { rmSync(temporary, { force: true }); }
  return readListIdeas(root, [], format);
}

export function listProjectState(root, path) {
  const record = readListSteps(join(root, path), { root });
  const research = readListResearch(join(root, path), { root });
  const reading = safeFile(root, `${path}/research.md`);
  return { steps: array(record.steps), progress: { path: `${path}/steps.json`, version: record.version, status: record.status, current: record.current, completed: record.completed, total: record.total, revision: record.revision, reviewRevision: record.reviewRevision, updatedAt: record.updatedAt ?? null },
    listReel: { research, checked: record.completed>=3&&record.checks.some(c=>c.id==='checks'&&c.ready)&&record.checks.some(c=>c.id==='video'&&c.ready), ...(reading?.stat.isFile() ? { researchFile: `${path}/research.md` } : {}), stage: record.current, revision: record.revision, reviewRevision: record.reviewRevision },
  };
}

export function listReelWorkspace({ root, format, files, projects, media, read, file, localPath }) {
  const textFile = path => {
    const descriptor = file(path), local = safeFile(root, path);
    if (!descriptor || !local?.stat.isFile() || local.stat.size <= 0 || local.stat.size > 65536) return null;
    try { return { ...descriptor, text: readFileSync(local.path, 'utf8') }; } catch { return null; }
  };
  for (const project of projects.filter(project => project.format === 'scroll-reel')) {
    const artifacts = listArtifacts(join(root, project.path), { root });
    const localMedia = path => { const relative = path && localPath(path); return relative ? file(relative) : null; };
    const background = localMedia(artifacts.source) ?? localMedia(artifacts.mezzanine);
    const style = artifacts.style ? object(read(localPath(artifacts.style), {})) : {};
    const layout = style.frame?.w === 1080 && style.frame?.h === 1920 ? { frame: style.frame, window: style.window, title: style.card?.title, line: style.card?.line, hook: style.openings?.[style.opening], cta: style.cta } : null;
    const recordings = artifacts.clips.map(clip => localMedia(clip.path));
    if (project.listReel.research) project.listReel.research.cards = project.listReel.research.cards.map((card, index) => ({ ...card, ...(recordings[index]?.kind === 'video' ? { recording: recordings[index] } : {}) }));
    const caption = project.completed ? textFile(`${project.outputPath}/caption.txt`) ?? textFile(`${project.path}/caption.txt`) : textFile(`${project.path}/caption.txt`) ?? textFile(`${project.outputPath}/caption.txt`);
    const links = project.completed ? textFile(`${project.outputPath}/links.txt`) ?? textFile(`${project.path}/links.txt`) : textFile(`${project.path}/links.txt`) ?? textFile(`${project.outputPath}/links.txt`);
    const sound = project.completed ? textFile(`${project.outputPath}/sound-card.md`) ?? textFile(`${project.path}/sound-card.md`) : textFile(`${project.path}/sound-card.md`) ?? textFile(`${project.outputPath}/sound-card.md`);
    const output = file(`${project.outputPath}/${basename(artifacts.final)}`);
    const currentVideo = project.listReel.checked ? project.completed ? output : localMedia(artifacts.final) : null;
    const previousRenders = project.files.filter(f=>f.kind==='video'&&(f.path.startsWith(project.path+'/renders/')||f.path.startsWith(project.outputPath+'/'))&&f.path!==currentVideo?.path);
    const cover = file(`${project.outputPath}/cover.jpg`);
    Object.assign(project.listReel, { preview:{video:currentVideo,previousRenders},look: artifacts.look, ...(layout ? { layout } : {}), ...(background ? { background } : {}), ...(caption ? { caption } : {}), ...(links ? { links } : {}), ...(sound ? { sound } : {}), outputs: { ...(output ? { video: output } : {}), ...(caption ? { caption } : {}), ...(links ? { links } : {}), ...(sound ? { sound } : {}), ...(cover?.kind === 'image' ? { cover } : {}) } });
  }
  const library = object(read(LIST_INPUTS, {}));
  const legacyPaths = [...(format.setup?.savedDone && format.answers?.shot ? [format.answers.shot] : []), ...projects.filter(project => project.format === 'scroll-reel').map(project => project.sourcePath).filter(Boolean)];
  const inputs = listInputState({ root, files, media, library, legacyPaths, localPath, file });
  if (!library.selected && format.answers?.shot) {
    const saved = inputs.clips.find(clip => clip.path === localPath(format.answers.shot));
    if (saved) { inputs.selected = saved.path; inputs.ready = saved.prepared; }
  }
  const owned = inputs.clips.find(clip => clip.path === inputs.selected);
  const background = owned ?? file('assets/quick-cuts/list-preview/background.mp4');
  const poster = owned?.thumbnail ?? file('assets/quick-cuts/list-preview/background.jpg');
  const resources = [1, 2, 3, 4].map(number => file(`assets/quick-cuts/list-preview/resource-${number}.mp4`)).filter(value => value?.kind === 'video');
  const fonts = array(read('assets/quick-cuts/fonts/fonts.json', {})?.fonts).flatMap(font => {
    if (!font || typeof font.file !== 'string') return [];
    const installed = file(`assets/quick-cuts/fonts/${font.file}`);
    return installed?.kind === 'font' && installed.size > 0 ? [{ ...font, url: installed.url }] : [];
  });
  const custom = [...array(format.answers?.customFonts),...projects.filter(p=>p.format==='scroll-reel').flatMap(p=>array(p.listReel?.look?.customFonts))].filter((font,i,all)=>all.findIndex(f=>f?.id===font?.id&&f?.family===font?.family)===i), registry = array(read('workspace/library/fonts/fonts.json', {})?.fonts);
  for (const entry of registry) {
    if (!entry || typeof entry.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || typeof entry.family !== 'string' || !entry.family.trim() || typeof entry.file !== 'string' || /^([a-z]:|\/)/i.test(entry.file)) continue;
    const matching = custom.filter(font => font?.id === entry.id);
    if (matching.length !== 1 || matching[0].family !== entry.family || registry.filter(font => font?.id === entry.id).length !== 1 || fonts.some(font => font.id === entry.id)) continue;
    const installed = file(`workspace/library/fonts/${entry.file}`);
    if (installed?.kind === 'font' && installed.size > 0) fonts.push({ id: entry.id, name: entry.family, family: entry.family, url: installed.url, captionSafe: true });
  }
  const research = projects.filter(project => project.format === 'scroll-reel').map(project => ({ project: project.id, name: project.name, ...object(project.listReel?.research), ...(project.listReel?.researchFile ? { researchFile: project.listReel.researchFile } : {}), stage: project.progress?.current ?? null }));
  const guide = object(read('assets/quick-cuts/list-preview/filming.json', {}));
  const filming = { video: file('assets/quick-cuts/list-preview/filming.mp4'), poster: file('assets/quick-cuts/list-preview/filming-2.jpg'), frames: [1,2,3].map(i => file(`assets/quick-cuts/list-preview/filming-${i}.jpg`)).filter(Boolean), credit: typeof guide.credit === 'string' ? guide.credit : '', link: safeLink(guide.link) };
  return { ideas: readListIdeas(root, projects), inputs, research, filming, preview: { ...(background?.url ? { background } : {}), ...(poster?.kind === 'image' ? { poster } : {}), resources }, fonts };
}
