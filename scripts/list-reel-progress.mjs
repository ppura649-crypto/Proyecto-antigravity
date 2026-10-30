// List Reel progress is read from this project's files. The workspace and the agent share it.
import { existsSync, readFileSync, statSync, readdirSync, openSync, readSync, closeSync, realpathSync, lstatSync } from 'node:fs';
import { resolve, join, dirname, basename, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

export const LIST_STAGES = [['research', 'Research'], ['list', 'List & words'], ['captures', 'Captures'], ['review', 'Review'], ['delivery', 'Delivery']];
export const LIST_REQUIRED_CHECKS = ['research', 'caption', 'duration', 'still-exists'];
export const listRequiredChecks = wanted => Array.isArray(wanted) && LIST_REQUIRED_CHECKS.every(name => wanted.some(check => check?.name === name));
export const listClockReady = clock => Array.isArray(clock?.cards) && clock.cards.length === 4 && Number.isFinite(clock.total ?? clock.cta?.out) && (clock.total ?? clock.cta.out) > 0 && clock.cards.every(card => card && Number.isFinite(card.in) && Number.isFinite(card.out) && card.out > card.in && card.out <= (clock.total ?? clock.cta.out));
export const listJson = (path, fallback = null) => { try { return safeListPath(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback; } catch { return fallback; } };
export const listText = path => { try { return safeListPath(path) ? readFileSync(path, 'utf8') : ''; } catch { return ''; } };
export const listFile = path => { try { return safeListPath(path) && statSync(path).isFile() && statSync(path).size > 0; } catch { return false; } };
export const listHash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const canonical = path => { try { return realpathSync(path); } catch { return resolve(path); } };
const inside = (root, path) => { const rel = relative(canonical(root), canonical(path)); return rel && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !isAbsolute(rel); };
export function listRoot(dir) {
  let root = resolve(dir);
  while (!existsSync(join(root, 'runtime.json')) && dirname(root) !== root) root = dirname(root);
  return root;
}
export function safeListPath(path, root = path ? listRoot(dirname(path)) : null) {
  if (!path || !root || !inside(root, path)) return false;
  let at = resolve(path), floor = resolve(root);
  try { while (at !== floor) { if (lstatSync(at).isSymbolicLink()) return false; const up = dirname(at); if (up === at) return false; at = up; } } catch { return false; }
  return true;
}
export const listSignature = path => {
  if (!listFile(path)) return null;
  const stat = statSync(path);
  return { size: stat.size, mtime: stat.mtimeMs, ctime: stat.ctimeMs, ...(stat.size < 2 * 1024 * 1024 ? { hash: listHash(readFileSync(path)) } : {}) };
};
export const listRelative = (root, path) => path ? relative(root, path).replaceAll('\\', '/') : null;
const locate = (root, dir, path) => {
  if (typeof path !== 'string' || !path) return null;
  const target = isAbsolute(path) ? resolve(path) : /^(workspace|context|engine|assets|packs)\//.test(path) ? resolve(root, path) : [resolve(dir, path), resolve(root, path)].find(listFile) ?? resolve(dir, path);
  return inside(root, target) ? target : null;
};
const cleanProof = proof => proof && Object.fromEntries(Object.entries(proof).filter(([key]) => !['checked_at', 'verified_at'].includes(key)));
export const listLook = root => { const formats = listJson(join(root, 'workspace/library/quick-cuts.json'), {})?.formats; return listJson(join(root, 'workspace/library/scroll-reel.json')) ?? formats?.['scroll-reel'] ?? formats?.['research-reel'] ?? {}; };
export function listCards(pack) {
  return (Array.isArray(pack?.cards) ? pack.cards : []).filter(card => card && typeof card === 'object' && !Array.isArray(card)).map(card => ({ ...card,
    url: card.url ?? (card.repo ? `https://github.com/${card.repo}` : ''), shape: card.shape ?? 'scroll', session: card.session ?? 'public',
    proof: card.proof ?? (card.repo && card.stars != null ? { kind: 'github-stars', label: 'stars', value: card.stars, ref: card.repo, checked_at: card.verified_at } : null),
  }));
}
export const listProofRevision = pack => listHash({ cards: listCards(pack).map(card => ({ name: card.name, url: card.url, session: card.session, proof: cleanProof(card.proof) })), avoid: pack?.avoid ?? [] });
export const listContentRevision = pack => listHash({ hook: pack?.hook, cta: pack?.cta, theme: pack?.theme, cards: listCards(pack).map(({ name, url, line, shape, session, proof, moment }) => ({ name, url, line, shape, session, proof: cleanProof(proof), moment })) });
export function listProject(projectDir, { root = listRoot(projectDir) } = {}) {
  const dir = resolve(projectDir), project = listJson(join(dir, 'project.json'), {}) ?? {};
  const ref = project.pack ?? project.researchPack ?? listJson(join(dir, 'research.json'), {})?.pack;
  let packPath = typeof ref === 'string' ? (/^[a-z0-9][a-z0-9-]*$/i.test(ref) ? join(root, 'engine/quick-cuts/research/packs', ref + '.json') : locate(root, dir, ref)) : null;
  if (packPath && !inside(root, packPath)) packPath = null;
  const pack = packPath ? listJson(packPath) : null;
  const engine = packPath ? dirname(dirname(packPath)) : join(root, 'engine/quick-cuts/research');
  return { root, dir, project, packPath, pack, engine, slug: packPath ? basename(packPath, '.json') : basename(dir), cards: listCards(pack) };
}

export function readListResearch(projectDir, options = {}) {
  const { root, dir, pack, packPath, cards } = listProject(projectDir, options);
  if (!pack) return null;
  const metadata = listJson(join(dir, 'research.json'), {}) ?? {};
  const revision = listContentRevision(pack);
  return { ...metadata, version: 1, packPath: listRelative(root, packPath), revision, proofRevision: listProofRevision(pack),
    current: metadata.packRevision === revision, researchFile: listFile(join(dir, 'research.md')) ? listRelative(root, join(dir, 'research.md')) : null,
    hook: pack.hook ?? null, cta: pack.cta ?? null,
    cards: cards.map(card => ({ ...(Array.isArray(metadata.cards) ? metadata.cards : []).find(item => item?.name === card.name), ...card })),
  };
}
export function listTakeHash(source) {
  const size = statSync(source).size, buffer = Buffer.alloc(Math.min(1 << 20, size)), hash = createHash('sha256');
  const descriptor = openSync(source, 'r');
  try { readSync(descriptor, buffer, 0, buffer.length, 0); hash.update(buffer); readSync(descriptor, buffer, 0, buffer.length, Math.max(0, size - buffer.length)); hash.update(buffer); }
  finally { closeSync(descriptor); }
  return hash.update(String(size)).digest('hex').slice(0, 16);
}
export function readListTake(sourcePath, { root = process.cwd(), mezzanine, duration = 0, readingPath, stylePath } = {}) {
  const source = sourcePath ? resolve(root, sourcePath) : null, prepared = mezzanine ? resolve(root, mezzanine) : null;
  const result = { ready: false, reason: 'Add an original take.', source, mezzanine: prepared, duration: null, readingPath: null };
  if (!source || !safeListPath(source, root) || !listFile(source)) return result;
  const hash = listTakeHash(source);
  const path = readingPath ? resolve(root, readingPath) : join(dirname(source), '.takes', hash + '.json');
  const reading = safeListPath(path, root) ? listJson(path) : null;
  result.readingPath = safeListPath(path, root) && listFile(path) ? listRelative(root, path) : null;
  result.duration = Number.isFinite(reading?.seconds) ? reading.seconds : null;
  if (!prepared || !safeListPath(prepared, root) || !listFile(prepared)) return { ...result, reason: 'Your agent prepares this take.' };
  if (reading?.ok !== true || reading.hash !== hash || !Number.isFinite(reading.seconds) || typeof reading.window?.buries_head !== 'boolean') return { ...result, reason: 'Your agent reads this take.' };
  if (stylePath != null) {
    const style = typeof stylePath === 'string' && stylePath ? resolve(root, stylePath) : null;
    let revision = null;
    try { if (safeListPath(style, root) && listFile(style)) revision = listHash(readFileSync(style)); } catch {}
    if (!revision || reading.styleRevision !== revision) return { ...result, reason: 'Your agent checks this take against the current look.' };
  }
  if (reading.take_verdict?.verdict !== 'reads') return { ...result, reason: 'Your agent adjusts the take so the words read clearly.' };
  if (stylePath != null && reading.window.buries_head) return { ...result, reason: 'Apply the suggested window placement and check this take again.' };
  if (reading.window?.buries_head && !reading.window.moved) return { ...result, reason: 'This take needs more room for the window.' };
  if (!(reading.seconds >= duration && reading.seconds > 0)) return { ...result, reason: 'Use a take long enough for this reel.' };
  return { ...result, ready: true, reason: '' };
}

export function listArtifacts(projectDir, options = {}) {
  const ctx = listProject(projectDir, options), { root, dir, project, pack, engine, slug, cards } = ctx;
  const clockPath = locate(root, dir, project.clock) ?? [join(dir, 'clock.json'), join(engine, '.work/preview', slug, 'clock.json')].find(listFile) ?? join(dir, 'clock.json');
  const clock = listJson(clockPath);
  const total = Number(clock?.total ?? clock?.cta?.out);
  const source = locate(root, dir, project.source);
  const mezzanine = locate(root, dir, project.mezzanine) ?? locate(root, engine, pack?.broll?.a);
  const style = typeof pack?.style === 'string' && /^[a-z0-9-]+$/i.test(pack.style) ? [join(root, 'packs/quick-cuts/styles', pack.style + '.json'), join(engine, '../../styles', pack.style + '.json')].find(listFile) ?? join(dir, 'list-reel.style.json') : locate(root, engine, pack?.style) ?? join(dir, 'list-reel.style.json');
  const reading = readListTake(source, { root, mezzanine, duration: total, readingPath: locate(root, dir, project.takeReading), ...(pack?.style != null || listFile(style) ? { stylePath: style } : {}) });
  const captureDir = locate(root, dir, project.layers) ?? join(engine, '.work/layers', slug);
  const clips = cards.map((card, index) => ({ name: card.name, path: locate(root, dir, project.captures?.[card.name]) ?? join(engine, 'output', `${pack?.prefix ?? slug}-0${index + 1}-${card.name}.mp4`) }));
  const layers = ['hook.png', ...cards.map((_, index) => `card${index + 1}.png`), 'cta.png', 'winmask.png'].map(name => join(captureDir, name));
  const final = locate(root, dir, project.video) ?? [join(dir, 'renders/final.mp4'), ...(() => { try { if (!safeListPath(join(dir, 'renders'), root)) return []; return readdirSync(join(dir, 'renders')).filter(name => name.endsWith('.mp4')).map(name => join(dir, 'renders', name)); } catch { return []; } })()].find(listFile) ?? join(dir, 'renders/final.mp4');
  const look = listJson(style, {})?.look ?? pack?.look ?? project.look ?? {};
  return { ...ctx, clockPath, clock, total, reading, source, mezzanine, clips, layers, style, final, look };
}
export function listBuildRevision(projectDir, options = {}) {
  const a = listArtifacts(projectDir, options);
  return listHash({ content: listContentRevision(a.pack), timing: a.pack?.timing, broll: a.pack?.broll,
    look: a.look, feel: a.pack?.feel, style: listSignature(a.style), fonts: listFontInputs(a), clock: listSignature(a.clockPath),
    recording: a.cards.map(({ name, at, from, seconds, mark, markFile, markSource }) => ({ name, at, from, seconds, mark, markFile, markSource })),
    source: listSignature(a.source), mezzanine: listSignature(a.mezzanine), reading: a.reading.readingPath ? listSignature(join(a.root, a.reading.readingPath)) : null,
    captures: a.clips.map(clip => [clip.name, listSignature(clip.path)]), layers: a.layers.map(path => [basename(path), listSignature(path)]),
    props: listSignature(join(a.dir, 'props/props.json')), brief: listSignature(join(a.dir, 'brief.md')),
  });
}
function listFontInputs(a) {
  const look = a.look;
  const selected = Array.isArray(look.fonts) ? look.fonts : look.font ? [look.font] : [];
  const directory = [join(a.root, 'assets/quick-cuts/fonts'), join(a.root, 'packs/quick-cuts/assets/fonts')].find(path => listFile(join(path, 'fonts.json')));
  const shipped = directory ? listJson(join(directory, 'fonts.json'), {})?.fonts : [];
  const customDir = join(a.root, 'workspace/library/fonts'), custom = listJson(join(customDir, 'fonts.json'), {})?.fonts;
  return selected.map(id => {
    const own = (Array.isArray(custom) ? custom : []).find(face => face?.id === id), built = (Array.isArray(shipped) ? shipped : []).find(face => face?.id === id);
    const face = own ?? built, folder = own ? customDir : directory;
    const files = face && folder ? [...new Set([face.file, face.displayFile].filter(value => typeof value === 'string'))].map(file => locate(a.root, folder, file)) : [];
    return { id, files: files.map(path => [path ? listRelative(a.root, path) : null, listSignature(path)]) };
  });
}
export function listReviewRevision(projectDir, options = {}) {
  const a = listArtifacts(projectDir, options);
  return listHash({ build: listBuildRevision(projectDir, options), video: listSignature(a.final), caption: listSignature(join(a.dir, 'caption.txt')), cover: listSignature(join(a.dir, 'cover.jpg')), sound: listSignature(join(a.dir, 'sound-card.md')), links: listSignature(join(a.dir, 'links.txt')), required: listSignature(join(a.dir, 'props/checks.json')), checks: listSignature(join(a.dir, 'check.json')), delivery: listSignature(join(a.dir, 'props/export.json')) });
}
export function listOutputRevision(projectDir, options = {}) {
  const a = listArtifacts(projectDir, options), out = locate(a.root, a.dir, a.project.output);
  if (!out || !inside(join(a.root, 'workspace/output'), out)) return null;
  const needed = [basename(a.final), 'caption.txt', 'cover.jpg', 'links.txt', ...(a.project.silent === false ? [] : ['sound-card.md'])];
  if (!needed.every(name => listFile(join(out, name)))) return null;
  return listHash(needed.map(name => [name, listSignature(join(out, name))]));
}
const validReceipt = (path, revision) => { const data = listJson(path); return data?.version === 1 && data.revision === revision; };
const approved = (path, revision) => validReceipt(path, revision) && Boolean(String(listJson(path)?.said ?? '').trim());
export function readListSteps(projectDir, options = {}) {
  const a = listArtifacts(projectDir, options), { root, dir, pack, packPath, cards } = a;
  const research = readListResearch(dir, { root }), revision = listContentRevision(pack), build = listBuildRevision(dir, { root }), reviewRevision = listReviewRevision(dir, { root });
  const proofs = packPath ? listJson(packPath.replace(/\.json$/, '.verify.json')) : null;
  const proofAge = proofs?.at ? (Date.now() - Date.parse(proofs.at)) / 36e5 : Infinity;
  const output = listOutputRevision(dir, { root }), exported = listJson(join(dir, 'steps.export.json'));
  // An unchanged delivered revision keeps its historical verification. Output files still
  // have to match below; changing the reel or its sources requires fresh verification.
  const deliveredRevision = a.project.state === 'exported' && exported?.version === 1 && exported.revision === reviewRevision && typeof exported.output === 'string';
  const validCards = cards.length === 4 && new Set(cards.map(card => card.name)).size === 4 && cards.every(card => card.name && /^https?:\/\//.test(card.url) && card.line && ['scroll', 'play', 'walk'].includes(card.shape) && ['github-stars', 'page-number', 'page-text', 'stated'].includes(card.proof?.kind) && card.proof.value !== undefined);
  const metadataReady = research?.current && research.title && research.audience && cards.every(card => { const note = (research.cards ?? []).find(item => item.name === card.name); return note?.why && note?.moment && Array.isArray(note.sources) && note.sources.length > 0; });
  const proofReady = proofs?.version === 1 && proofs.proofRevision === listProofRevision(pack) && proofs.pass === true && Array.isArray(proofs.checks) && proofs.checks.length > 0 && proofs.checks.every(check => check?.pass === true) && Number.isFinite(proofAge) && proofAge >= 0 && (proofAge <= 24 || deliveredRevision);
  const library = listLook(root);
  const listReady = approved(join(dir, 'steps.list.json'), revision);
  const captureReceipt = listJson(join(dir, 'steps.captures.json'));
  const clipsReady = cards.length === 4 && a.clips.every(clip => listFile(clip.path));
  const captureChecks = captureReceipt?.checks;
  const capturesReady = validReceipt(join(dir, 'steps.captures.json'), build) && Array.isArray(captureChecks) && captureChecks.length === cards.length && cards.every(card => captureChecks.some(check => check?.name === card.name && check.pass === true && check.duration > 0));
  const wanted = listJson(join(dir, 'props/checks.json')), results = listJson(join(dir, 'check.json'));
  const checksReady = listRequiredChecks(wanted) && Array.isArray(results) && results.length === wanted.length && results.every((check, index) => check?.pass === true && check.name === wanted[index]?.name) && validReceipt(join(dir, 'steps.check.json'), reviewRevision);
  const still = listJson(join(dir, 'steps.still.json'));
  const stillReady = validReceipt(join(dir, 'steps.still.json'), build) && still.path && JSON.stringify(still.signature) === JSON.stringify(listSignature(locate(root, dir, still.path)));
  const videoReady = listFile(a.final) && listFile(join(dir, 'caption.txt')) && stillReady && listSignature(a.final).mtime >= listSignature(locate(root, dir, still.path)).mtime;
  const groups = [
    [['research-record', Boolean(validCards && metadataReady && listFile(join(dir, 'research.md'))), 'Your agent researches four useful resources.', [packPath, join(dir, 'research.json'), join(dir, 'research.md')]], ['proofs', Boolean(proofReady), 'Your agent verifies each source.', [packPath?.replace(/\.json$/, '.verify.json')]]],
    [['list-approval', Boolean(pack?.hook?.l1 && pack?.hook?.l2 && pack?.cta && listReady), 'You review the hook, resources and CTA in chat.', [join(dir, 'steps.list.json')]]],
    [['look', Boolean(Object.keys(a.look).length || library.setup?.done), 'Choose your saved look once.', [join(root, 'workspace/library/scroll-reel.json')]], ['take', a.reading.ready, a.reading.reason, [a.source, a.mezzanine, a.reading.readingPath && join(root, a.reading.readingPath)]], ['clock', listClockReady(a.clock), 'Your agent fits the reel to its sound.', [a.clockPath]], ['captures', clipsReady, 'Your agent records the useful moment of each resource.', a.clips.map(clip => clip.path)], ['layers', a.layers.every(listFile), 'Your agent prepares the hook, windows and CTA.', a.layers], ['capture-checks', Boolean(capturesReady), 'Your agent checks every recording.', [join(dir, 'steps.captures.json')]]],
    [['still', Boolean(stillReady), 'Your agent checks a still before the video.', [join(dir, 'steps.still.json')]], ['video', Boolean(videoReady), 'Your agent assembles the reel and caption after its still.', [a.final, join(dir, 'caption.txt')]], ['checks', Boolean(checksReady), 'Your agent verifies the finished reel.', [join(dir, 'check.json')]], ['review-approval', approved(join(dir, 'steps.review.json'), reviewRevision), 'You review the reel and caption in chat.', [join(dir, 'steps.review.json')]]],
    [['output', Boolean(output && a.project.state === 'exported' && exported?.version === 1 && exported.revision === reviewRevision && exported.output === output), 'Your agent saves the complete output.', [locate(root, dir, a.project.output)]]],
  ];
  const checks = groups.flat().map(([id, ready, reason, evidence]) => ({ id, ready, reason: ready ? '' : reason, evidence: evidence.filter(Boolean).map(path => listRelative(root, path)) }));
  let completed = 0; for (const group of groups) { if (!group.every(check => check[1])) break; completed++; }
  const steps = LIST_STAGES.map(([id, label], index) => ({ id, label, status: index < completed ? 'done' : index === completed ? 'current' : 'pending', ready: groups[index].every(check => check[1]), owner: index === completed && (id === 'list' || id === 'review' && checksReady) ? 'you' : 'agent', reason: groups[index].find(check => !check[1])?.[2] ?? '', evidence: [...new Set(groups[index].flatMap(check => check[3]).filter(Boolean).map(path => listRelative(root, path)))] }));
  return { version: 1, format: 'scroll-reel', project: basename(dir), status: completed === 5 ? 'complete' : 'active', current: steps[completed]?.id ?? null, completed, total: 5, revision, reviewRevision, steps, checks };
}
