#!/usr/bin/env node
// edit-build.mjs [--force] [--root <folder>]
// Contract: bundles the video editor page (scripts/editor/) with every installed format's layers (editor/<pack>/layers.tsx)
//   into .keyframes/editor/editor.js and editor.css. Rebuilds only when a source is newer than the bundle, so the
//   workspace server can call it on every page open. Prints {"built": true|false, "ms": n, "layers": [...]} as JSON.
//   Exits 1 with the first compile error. Also exports layerRegistry() for the export's render bundle.
//   With --project <id>: when that project brings its own graphics (workspace/projects/<id>/edit/layers.tsx, or a
//   module an installed pack writes for it through editor/<pack>/project.mjs), the page is built for that project into
//   .keyframes/editor/<id>/ with its graphics added to every pack's. The export renders with the same registry:
//   `await projectRegistry(root, id)` (null when the project has none; then use layerRegistry(root)).
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function layerFiles(root) {
  const base = join(root, 'editor');
  if (!existsSync(base)) return [];
  return readdirSync(base).sort().map((pack) => join(base, pack, 'layers.tsx')).filter((file) => existsSync(file));
}

// One module that merges every installed format's layer kinds. Written into .keyframes/editor so both the page bundle
// and the export's render bundle import the same list.
export function layerRegistry(root, project = null) {
  const out = project ? projectOut(root, project) : join(root, '.keyframes', 'editor');
  mkdirSync(out, { recursive: true });
  // A project's own graphics come last, so they draw its kinds over any pack's stand-in for them.
  const files = [...layerFiles(root), ...(project ? projectModules(root, project) : [])];
  // A pack may export any of layers (graphics), captionLooks and textLooks; a missing one merges as nothing.
  const lines = files.map((file, i) => `import * as l${i} from ${JSON.stringify(file.split('\\').join('/'))};`);
  for (const name of ['layers', 'captionLooks', 'textLooks']) lines.push(`export const ${name} = { ${files.map((_, i) => `...((l${i} as any).${name} ?? {})`).join(', ')} };`);
  const target = join(out, 'layers.generated.tsx');
  const text = lines.join('\n') + '\n';
  if (!existsSync(target) || readFileSync(target, 'utf8') !== text) writeFileSync(target, text);
  return { target, files };
}

// ---------------------------------------------------------------------------------------------------------------
// Graphics a project brings itself. Some formats write code per video (a Product Demo scene is a component written for
// that one film), so no pack can ship it: the project folder holds it, and the page for that project bundles it.

const PROJECT = /^[a-z0-9][a-z0-9._-]{0,120}$/i;
const projectOut = (root, project) => join(root, '.keyframes', 'editor', project);
const projectDir = (root, project) => join(root, 'workspace', 'projects', project);

// The project's modules as they stand on disk: its hand-written edit/layers.tsx, else the module a pack generated.
function projectModules(root, project) {
  const own = join(projectDir(root, project), 'edit', 'layers.tsx');
  if (existsSync(own)) return [own];
  const generated = join(projectOut(root, project), 'project-layers.tsx');
  return existsSync(generated) ? [generated] : [];
}

// Asks for the project's graphics: its own edit/layers.tsx first, then each installed pack's editor/<pack>/project.mjs
// (`projectLayers({ root, project, dir, out })` returning { module, sources, scenes } or null). Null when none speaks.
export async function projectLayers(root, project) {
  root = resolve(root);
  if (typeof project !== 'string' || !PROJECT.test(project)) return null;
  const dir = projectDir(root, project);
  if (!existsSync(dir)) return null;
  const own = join(dir, 'edit', 'layers.tsx');
  if (existsSync(own)) return { module: own, sources: [own], pack: 'project' };
  const base = join(root, 'editor');
  if (!existsSync(base)) return null;
  for (const pack of readdirSync(base).sort()) {
    const file = join(base, pack, 'project.mjs');
    if (!existsSync(file)) continue;
    const module = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
    if (typeof module.projectLayers !== 'function') continue;
    const found = await module.projectLayers({ root, project, dir, out: projectOut(root, project) });
    if (found?.module) return { ...found, pack };
  }
  return null;
}

// The registry the export renders a project with: the same one its page was built with.
export async function projectRegistry(root, project) {
  const found = await projectLayers(root, project);
  if (!found) return null;
  return { ...layerRegistry(resolve(root), project), project, scenes: found.scenes ?? [], aliases: sharedAliases(resolve(root)), nodePaths: projectNodePaths(resolve(root), project) };
}

// A project folder may carry its own node_modules (with its own copy of React or Remotion). One copy of each must
// serve the whole page, or the project's components would not see the player's clock.
function sharedAliases(root) {
  const alias = {};
  for (const name of ['react', 'react-dom', 'remotion']) if (existsSync(join(root, 'node_modules', name))) alias[name] = join(root, 'node_modules', name);
  return alias;
}
const projectNodePaths = (root, project) => [join(root, 'node_modules'), join(projectDir(root, project), 'node_modules')].filter((p) => existsSync(p));

function newest(paths) {
  let time = 0;
  const visit = (path) => {
    if (!existsSync(path)) return;
    const stat = statSync(path);
    if (stat.isDirectory()) { for (const name of readdirSync(path)) if (name !== 'node_modules' && !name.startsWith('.')) visit(join(path, name)); }
    else if (/\.(tsx?|mjs|js|css)$/.test(path)) time = Math.max(time, stat.mtimeMs);
  };
  paths.forEach(visit);
  return time;
}

const building = new Map();
export async function buildEditor(root, { force = false, project = null } = {}) {
  root = resolve(root);
  // A project with its own graphics gets its own page bundle; any other project uses the shared one.
  const own = project ? await projectLayers(root, project) : null;
  if (project && !own) project = null;
  const out = project ? projectOut(root, project) : join(root, '.keyframes', 'editor');
  if (building.has(out)) return building.get(out);
  const work = build(root, { force, project, own, out }).finally(() => building.delete(out));
  building.set(out, work);
  return work;
}

async function build(root, { force, project, own, out }) {
  const target = join(out, 'editor.js');
  const { target: registry, files } = layerRegistry(root, project);
  const sources = [join(here, 'editor'), join(here, 'edit-doc.mjs'), join(root, 'editor'), registry, ...(own?.sources ?? [])];
  // A format's layers import its own engine, so the engine counts as a source too.
  if (existsSync(join(root, 'remotion'))) sources.push(join(root, 'remotion'));
  if (existsSync(join(root, 'engine'))) for (const pack of readdirSync(join(root, 'engine'))) sources.push(join(root, 'engine', pack, 'remotion', 'src'), join(root, 'engine', pack, 'src'));
  const started = Date.now();
  const layers = files.map((f) => relative(root, f));
  const extra = project ? { project, scenes: own.scenes ?? [], dir: out } : { project: null, dir: out };
  if (!force && existsSync(target) && statSync(target).mtimeMs >= newest(sources)) return { built: false, ms: Date.now() - started, layers, ...extra };
  const esbuild = await import('esbuild');
  await esbuild.build({
    entryPoints: [join(here, 'editor', 'main.tsx')],
    bundle: true,
    format: 'esm',
    outfile: target,
    minify: true,
    sourcemap: false,
    target: ['es2022'],
    jsx: 'automatic',
    loader: { '.png': 'dataurl', '.svg': 'text' },
    define: { 'process.env.NODE_ENV': '"production"' },
    // A format's layers import its own engine through these names, so the same file works in the pack source and in
    // an installed folder, where the engine sits at engine/<pack>/ and compositions at remotion/<pack>/.
    alias: { 'keyframes-layers': registry, 'keyframes-editable': join(root, 'scripts/editor/Editable.tsx'), 'keyframes-engine': join(root, 'engine'), 'keyframes-remotion': join(root, 'remotion'), ...(project ? sharedAliases(root) : {}) },
    nodePaths: project ? projectNodePaths(root, project) : [join(root, 'node_modules')],
    logLevel: 'silent',
  });
  return { built: true, ms: Date.now() - started, layers, ...extra };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--root');
  const root = i > -1 ? args[i + 1] : process.cwd();
  const p = args.indexOf('--project');
  buildEditor(root, { force: args.includes('--force'), project: p > -1 ? args[p + 1] : null })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => { console.error((error.errors?.[0]?.text ? `${error.errors[0].location?.file}:${error.errors[0].location?.line} ${error.errors[0].text}` : error.message)); process.exitCode = 1; });
}
