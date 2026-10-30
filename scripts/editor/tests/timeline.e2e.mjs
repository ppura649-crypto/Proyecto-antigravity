#!/usr/bin/env node
// timeline.e2e.mjs --port <n> --project <id> [--shots <folder>] [--only <name,...>] [--headed] [--no-seed]
// Contract: drives the editor's timeline the way a person does, in the Chromium that ships with Playwright (never a
//   browser anyone browses with), against a running workspace. It first saves a dense test edit into the project
//   (12 tracks, 305 items, beats), then clicks, drags, trims, cuts, deletes, undoes, zooms, scrubs and plays, and after
//   every change reads the saved edit back from the server and checks what changed, and that checkDoc still passes.
//   Screenshots of each state go to --shots. Prints one JSON line per step and a summary; exits 1 when a step fails.
//   Run from an install after `node scripts/editor-sync.mjs --install <install>`:
//     node scripts/editor/tests/timeline.e2e.mjs --port 58621 --project <a talking head project> --shots /tmp/shots
//   The project's edit is left as the test made it; its earlier versions stay in edit/versions/.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkDoc, end } from '../../edit-doc.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback = null) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : fallback; };
const port = Number(arg('port'));
const project = arg('project');
const shots = arg('shots');
const only = arg('only')?.split(',');
if (!port || !project) { console.error('usage: timeline.e2e.mjs --port <n> --project <id> [--shots <folder>]'); process.exit(2); }
if (shots) mkdirSync(shots, { recursive: true });
const base = `http://127.0.0.1:${port}`;
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';
const HEAD = 168;

// ---------------------------------------------------------------------------------------------------------------
// The server.

async function load() {
  const r = await fetch(`${base}/api/edit?project=${encodeURIComponent(project)}`);
  if (!r.ok) throw new Error(`load ${r.status}`);
  return (await r.json()).doc;
}
async function save(doc) {
  const current = await load();
  const r = await fetch(`${base}/api/edit`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-keyframes-write': 'edit', origin: base }, body: JSON.stringify({ project, doc, revision: current.revision }) });
  const body = await r.json();
  if (!r.ok) throw new Error(`save ${r.status}: ${body.error}`);
  return body;
}
async function probe(path) {
  const r = await fetch(`${base}/api/edit/probe?path=${encodeURIComponent(path)}`);
  return r.ok ? r.json() : null;
}

// A dense edit: what a talking head with captions, cards, pictures, overlays and three sound tracks looks like.
async function denseDoc() {
  const fps = 30;
  const video = `workspace/output/${project}/final.mp4`;
  const info = await probe(video);
  const total = Math.floor((info?.duration ?? 55) * fps);
  const words = 'if your marketing screams slop watch this still making every ad by hand costs you the week here is what changed for us'.split(' ');
  const sfxFiles = ['whoosh.wav', 'whoosh-tight.wav', 'pop.wav', 'landing.wav', 'typing.wav', 'bell.wav', 'confirm.wav', 'thud.wav', 'snap.wav', 'wood.wav'];
  const sfx = [];
  for (const name of sfxFiles) {
    const path = `assets/talking-head/sfx/${name}`;
    const p = await probe(path);
    const frames = Math.floor((p?.duration ?? 0) * fps);
    if (frames >= 4) sfx.push({ path, frames, name: name.replace(/\.wav$/, '') });
  }
  if (!sfx.length) throw new Error('no sound effects long enough to test with');
  const tracks = [
    { id: 'captions', name: 'Captions', kind: 'visual' },
    { id: 'words', name: 'Text', kind: 'visual' },
    { id: 'titles', name: 'Titles', kind: 'visual' },
    { id: 'notes', name: 'Notes', kind: 'visual' },
    { id: 'graphics', name: 'Graphics', kind: 'visual' },
    { id: 'pictures', name: 'Pictures', kind: 'visual' },
    { id: 'overlays', name: 'Overlays', kind: 'visual' },
    { id: 'video', name: 'Video', kind: 'visual', keep: true },
    { id: 'voice', name: 'Voice', kind: 'audio', keep: true },
    { id: 'sfx', name: 'Sounds', kind: 'audio' },
    { id: 'sfx2', name: 'Sounds 2', kind: 'audio' },
    { id: 'music', name: 'Music', kind: 'audio' },
  ];
  const items = [];
  const T = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
  for (let i = 0; i < 20; i++) {
    const from = Math.floor((i * total) / 20);
    const to = Math.floor(((i + 1) * total) / 20);
    items.push({ id: `v${i}`, track: 'video', type: 'video', label: `Take ${i + 1}`, from, durationInFrames: to - from, trimStart: from, src: video, sourceDurationInFrames: total, volume: 1, transform: T });
  }
  for (let i = 0; i < 200; i++) items.push({ id: `w${i}`, track: 'words', type: 'text', text: words[i % words.length], from: i * 8, durationInFrames: 6, trimStart: 0, style: { size: 64 }, transform: T });
  for (let i = 0; i < 6; i++) {
    const list = Array.from({ length: 10 }, (_, k) => ({ text: words[(i * 10 + k) % words.length], from: k * 24, to: k * 24 + 20 }));
    items.push({ id: `c${i}`, track: 'captions', type: 'caption', from: i * 270, durationInFrames: 240, trimStart: 0, words: list, pages: [{ from: 0, to: 120, lines: [[0, 1, 2, 3, 4]] }, { from: 120, to: 240, lines: [[5, 6, 7, 8, 9]] }], style: { size: 60 }, transform: T });
  }
  ['Still making every ad', 'By hand', 'Every week', 'Here is what changed'].forEach((text, i) => items.push({ id: `t${i}`, track: 'titles', type: 'text', text, from: [60, 400, 800, 1200][i], durationInFrames: 90, trimStart: 0, style: { size: 72 }, transform: T, ...(i === 0 ? { fadeIn: 10, fadeOut: 10 } : {}) }));
  items.push({ id: 'n0', track: 'notes', type: 'text', text: 'Side note', from: 300, durationInFrames: 60, trimStart: 0, transform: T });
  items.push({ id: 'n1', track: 'notes', type: 'text', text: 'Another note', from: 1000, durationInFrames: 60, trimStart: 0, transform: T });
  for (let i = 0; i < 5; i++) items.push({ id: `g${i}`, track: 'graphics', type: 'layer', renderer: 'test/card', label: `Card ${i + 1}`, data: {}, from: i * 330 + 30, durationInFrames: 150, trimStart: 0, transform: T, ...(i === 0 ? { link: 'card-and-sound' } : {}) });
  for (let i = 0; i < 3; i++) items.push({ id: `p${i}`, track: 'pictures', type: 'image', label: `Picture ${i + 1}`, src: `workspace/projects/${project}/geometry.png`, from: [100, 700, 1300][i], durationInFrames: 120, trimStart: 0, transform: T });
  for (let i = 0; i < 3; i++) items.push({ id: `o${i}`, track: 'overlays', type: 'video', label: `Overlay ${i + 1}`, src: video, sourceDurationInFrames: total, from: [200, 900, 1400][i], durationInFrames: 100, trimStart: 500, volume: 0, transform: T, ...(i === 1 ? { speed: 1.5 } : {}) });
  items.push({ id: 'voice1', track: 'voice', type: 'audio', label: 'Voice', src: video, sourceDurationInFrames: total, from: 0, durationInFrames: total, trimStart: 0, volume: 1 });
  for (let i = 0; i < 40; i++) { const s = sfx[i % sfx.length]; items.push({ id: `s${i}`, track: 'sfx', type: 'audio', label: s.name, src: s.path, sourceDurationInFrames: s.frames, from: i * 40, durationInFrames: Math.min(s.frames, 36), trimStart: 0, volume: 1 }); }
  for (let i = 0; i < 20; i++) { const s = sfx[(i + 3) % sfx.length]; items.push({ id: `x${i}`, track: 'sfx2', type: 'audio', label: s.name, src: s.path, sourceDurationInFrames: s.frames, from: 20 + i * 80, durationInFrames: Math.min(s.frames, 36), trimStart: 0, volume: 0.8, ...(i === 0 ? { link: 'card-and-sound' } : {}) }); }
  items.push({ id: 'music1', track: 'music', type: 'audio', label: 'Music', src: video, sourceDurationInFrames: total, from: 0, durationInFrames: total, trimStart: 0, volume: 0.3 });
  const markers = [];
  for (let f = 0; f < total; f += 20) markers.push({ frame: f, kind: 'beat' });
  markers.push({ frame: 450, kind: 'cue', label: 'Hook ends' }, { frame: 1100, kind: 'cue', label: 'Proof' });
  const current = await load();
  const doc = { ...current, tracks, items, markers, durationInFrames: total };
  const problems = checkDoc(doc);
  if (problems.length) throw new Error(`test edit fails its own check: ${problems[0]}`);
  return doc;
}

// ---------------------------------------------------------------------------------------------------------------
// The page.

const browser = await chromium.launch({ headless: !args.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));

const clip = (id) => page.locator(`.clip[data-clip="${id}"]`);
const ppf = async () => Number(await page.getAttribute('.tl-sheet', 'data-ppf'));
const settle = (ms = 80) => page.waitForTimeout(ms);
const scroller = () => page.locator('.tl-scroll');

async function open() {
  await page.goto(`${base}/edit/${project}`);
  await page.waitForSelector('.tl-sheet .clip', { timeout: 30000 });
  await settle(600);
}

// Bring a frame into view, a little right of the track names, and a row into view vertically.
async function reveal(frame, rowId = null) {
  await page.evaluate(([frame, rowId, HEAD]) => {
    const s = document.querySelector('.tl-scroll');
    const z = Number(document.querySelector('.tl-sheet').dataset.ppf);
    s.scrollLeft = Math.max(0, HEAD + frame * z - HEAD - 260);
    if (rowId) {
      const row = document.querySelector(`[data-row="${rowId}"]`);
      const top = row.offsetTop;
      if (top < s.scrollTop + 30 || top + row.offsetHeight > s.scrollTop + s.clientHeight) s.scrollTop = Math.max(0, top - 60);
    }
  }, [frame, rowId, HEAD]);
  await settle(120);
}
async function boxOf(id) {
  const doc = await load();
  const item = doc.items.find((i) => i.id === id);
  if (item) await reveal(item.from, item.track);
  const b = await clip(id).boundingBox();
  if (!b) throw new Error(`clip ${id} is not on screen`);
  return b;
}
async function rowBox(id) { await page.locator(`[data-row="${id}"]`).scrollIntoViewIfNeeded(); return page.locator(`[data-row="${id}"]`).boundingBox(); }
async function frameX(frame) {
  const sheet = await page.locator('.tl-sheet').boundingBox();
  return sheet.x + HEAD + frame * (await ppf());
}
async function drag(from, to, { steps = 14, keys = [], hold = 60, mid = null, lateKeys = [] } = {}) {
  for (const k of keys) await page.keyboard.down(k);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // Keys pressed once the drag is under way, the way a person reaches for Cmd mid drag.
  if (lateKeys.length) { await page.mouse.move(from.x + Math.sign(to.x - from.x || 1) * 8, from.y, { steps: 3 }); for (const k of lateKeys) await page.keyboard.down(k); }
  await page.mouse.move(to.x, to.y, { steps });
  await page.waitForTimeout(hold);
  if (mid) await mid();
  await page.mouse.up();
  for (const k of [...keys, ...lateKeys]) await page.keyboard.up(k);
}
async function zoomTo(target) {
  for (let i = 0; i < 30; i++) {
    const z = await ppf();
    if (z < target / 1.25) await page.keyboard.press('Equal');
    else if (z > target * 1.25) await page.keyboard.press('Minus');
    else return z;
    await settle(40);
  }
  return ppf();
}
async function playheadFrame() {
  const text = await page.textContent('.timecode b');
  const [m, rest] = text.split(':');
  const [s, f] = rest.split('.');
  return (Number(m) * 60 + Number(s)) * 30 + Number(f);
}
// Shift on the ruler scrubs without snapping, so the playhead lands on the exact frame.
async function seekTo(frame, { reveal: show = true } = {}) {
  if (show) await reveal(frame);
  const r = await page.locator('.tl-ruler').boundingBox();
  await page.keyboard.down('Shift');
  await page.mouse.click(await frameX(frame), r.y + 14);
  await page.keyboard.up('Shift');
  await settle(60);
}
// The selection, including clips scrolled out of view (only what is near the view is drawn).
async function selectedIds() { return ((await page.getAttribute('.tl-sheet', 'data-selection')) || '').split(' ').filter(Boolean); }
async function snapping(on) {
  const pressed = (await page.getAttribute('button[aria-label="Snapping"]', 'aria-pressed')) === 'true';
  if (pressed !== on) { await page.keyboard.press('n'); await settle(); }
}

// Every change saves itself a moment later; wait for the server to hold a newer revision than before.
async function saved(before, timeout = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const doc = await load();
    if (doc.revision > before) { await settle(250); return load(); }
    await page.waitForTimeout(150);
  }
  throw new Error('the change was not saved');
}
const find = (doc, id) => doc.items.find((i) => i.id === id);

// ---------------------------------------------------------------------------------------------------------------

const results = [];
let shotIndex = 0;
async function shot(name) { if (shots) await page.screenshot({ path: join(shots, `${String(++shotIndex).padStart(2, '0')}-${name}.png`) }); }
// Before a step reads the edit, the saves of the step before it must have landed.
async function quiet() {
  let last = await rev();
  let still = 0;
  for (let i = 0; i < 40 && still < 2; i++) {
    await page.waitForTimeout(450);
    const now = await rev();
    const idle = await page.locator('.ed-save.saved').count().catch(() => 1);
    still = now === last && idle ? still + 1 : 0;
    last = now;
  }
}
async function step(name, fn) {
  if (only && !only.includes(name)) return;
  await quiet();
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ step: name, ok: true, ms: Date.now() - t0, ...(detail ? { detail } : {}) });
  } catch (error) {
    results.push({ step: name, ok: false, ms: Date.now() - t0, error: error.message.split('\n')[0] + ('actual' in error ? ` (got ${JSON.stringify(error.actual)}, wanted ${JSON.stringify(error.expected)})` : '') });
    await shot(`FAIL-${name}`);
    await page.mouse.up().catch(() => {});
    for (const k of ['Alt', 'Shift', MOD]) await page.keyboard.up(k).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
  }
  console.log(JSON.stringify(results.at(-1)));
}
const rev = async () => (await load()).revision;

if (!args.includes('--no-seed')) await save(await denseDoc());
await open();
// Start from the default panel height; the resize step sets and checks its own.
await page.evaluate(() => { try { localStorage.removeItem('keyframes.editor.timelineHeight'); } catch {} });
await open();

await step('loads-dense', async () => {
  const doc = await load();
  assert.equal(doc.items.length, 305);
  assert.equal(doc.tracks.length, 12);
  await shot('dense-fit');
  // Zoomed in, only what is near the view is drawn.
  await zoomTo(12);
  await reveal(600);
  const drawn = await page.locator('.clip').count();
  assert.ok(drawn > 5 && drawn < 120, `drew ${drawn} of 305`);
  await page.keyboard.press('Shift+Z');
  await settle(200);
  return { drawnZoomed: drawn, tracks: doc.tracks.length };
});

await step('zoom', async () => {
  const z0 = await ppf();
  const s = await scroller().boundingBox();
  await page.mouse.move(s.x + 600, s.y + 120);
  await page.keyboard.down(MOD);
  await page.mouse.wheel(0, -400);
  await page.keyboard.up(MOD);
  await settle(200);
  const z1 = await ppf();
  assert.ok(z1 > z0 * 1.5, `wheel zoom ${z0} -> ${z1}`);
  // A trackpad pinch arrives as the wheel with Ctrl held.
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 200);
  await page.keyboard.up('Control');
  await settle(200);
  assert.ok((await ppf()) < z1, 'pinch out zooms out');
  await page.keyboard.press('Minus');
  await settle();
  const z2 = await ppf();
  assert.ok(z2 < z1, 'minus zooms out');
  await page.keyboard.press('Equal');
  await settle();
  assert.ok((await ppf()) > z2, 'plus zooms in');
  await page.keyboard.press('Shift+Z');
  await settle(150);
  const z3 = await ppf();
  assert.ok(Math.abs(z3 - z0) / z0 < 0.05, `fit returns to the whole video ${z0} vs ${z3}`);
  await zoomTo(40 / 30 * 6);
  await reveal(0);
  await shot('zoomed-frames');
  return { fit: z0, wheel: z1 };
});

await step('frame-ticks-at-high-zoom', async () => {
  await zoomTo(20);
  await reveal(300, 'captions');
  const labels = await page.$$eval('.tl-ruler i.major span', (els) => els.map((e) => e.textContent));
  assert.ok(labels.some((l) => /\.\d\d$/.test(l)), `labels show frames: ${labels.slice(0, 4)}`);
  const minors = await page.locator('.tl-ruler i:not(.major)').count();
  assert.ok(minors > 20, 'frame ticks drawn');
  await shot('frame-ticks-captions');
  await zoomTo(2);
  return { labels: labels.slice(0, 3) };
});

await step('scrub-ruler', async () => {
  await zoomTo(2);
  await reveal(0);
  const r = await page.locator('.tl-ruler').boundingBox();
  await drag({ x: await frameX(100), y: r.y + 12 }, { x: await frameX(250), y: r.y + 12 });
  await settle();
  const f = await playheadFrame();
  assert.ok(Math.abs(f - 250) <= 3, `playhead at ${f}`);
  return { frame: f };
});

await step('click-select-and-empty-click', async () => {
  await snapping(false);
  const b = await boxOf('t1');
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  assert.deepEqual(await selectedIds(), ['t1']);
  const b2 = await boxOf('n0');
  await page.keyboard.down('Shift');
  await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.keyboard.up('Shift');
  assert.deepEqual((await selectedIds()).sort(), ['n0', 't1']);
  await shot('two-selected');
  await page.keyboard.press('Escape');
  await settle();
  assert.deepEqual(await selectedIds(), []);
  // A click on empty space moves the playhead there.
  const row = await rowBox('notes');
  await page.mouse.click(await frameX(700), row.y + row.height / 2);
  await settle();
  const f = await playheadFrame();
  assert.ok(Math.abs(f - 700) <= 2, `playhead at ${f}`);
});

await step('move-in-time', async () => {
  await snapping(false);
  const before = await rev();
  const z = await ppf();
  const b = await boxOf('t1');
  await drag({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, { x: b.x + b.width / 2 + 60, y: b.y + b.height / 2 }, { mid: () => shot('move-drag') });
  const doc = await saved(before);
  const t1 = find(doc, 't1');
  assert.equal(t1.track, 'titles');
  assert.ok(Math.abs(t1.from - (400 + 60 / z)) <= 1.5, `t1 from ${t1.from}, expected about ${400 + 60 / z}`);
  assert.deepEqual(checkDoc(doc), []);
  return { from: t1.from };
});

await step('move-across-tracks', async () => {
  const before = await rev();
  const b = await boxOf('n0');
  const titles = await rowBox('titles');
  await drag({ x: b.x + 10, y: b.y + b.height / 2 }, { x: b.x + 10, y: titles.y + titles.height / 2 });
  const doc = await saved(before);
  const n0 = find(doc, 'n0');
  assert.equal(n0.track, 'titles');
  assert.equal(n0.from, 300);
  assert.ok(doc.tracks.some((t) => t.id === 'notes'), 'notes keeps its other note');
  return { track: n0.track };
});

await step('drag-above-makes-track', async () => {
  const before = await rev();
  await page.evaluate(() => { document.querySelector('.tl-scroll').scrollTop = 0; });
  const b = await boxOf('t3');
  await page.evaluate(() => { document.querySelector('.tl-scroll').scrollTop = 0; });
  await settle();
  const b2 = await clip('t3').boundingBox();
  const ruler = await page.locator('.tl-ruler').boundingBox();
  await drag({ x: b2.x + 10, y: b2.y + b2.height / 2 }, { x: b2.x + 10, y: ruler.y + 8 }, { mid: () => shot('new-track-on-top') });
  const doc = await saved(before);
  assert.equal(doc.tracks.length, 13);
  assert.equal(find(doc, 't3').track, doc.tracks[0].id);
  assert.equal(doc.tracks[0].kind, 'visual');
  return { name: doc.tracks[0].name };
});

await step('drag-below-makes-sound-track', async () => {
  const before = await rev();
  const b = await boxOf('s5');
  const last = await rowBox('music');
  await drag({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, { x: b.x + b.width / 2, y: last.y + last.height + 12 });
  const doc = await saved(before);
  const s5 = find(doc, 's5');
  const track = doc.tracks.find((t) => t.id === s5.track);
  assert.equal(doc.tracks.at(-1).id, track.id, 'lands on a new last track');
  assert.equal(track.kind, 'audio');
  assert.equal(doc.tracks.at(-2).id, 'music');
  return { name: track.name };
});

await step('alt-drag-copies', async () => {
  const before = await rev();
  const count = (await load()).items.length;
  const b = await boxOf('t2');
  await drag({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, { x: b.x + b.width / 2 + 220, y: b.y + b.height / 2 }, { keys: ['Alt'] });
  const doc = await saved(before);
  assert.equal(doc.items.length, count + 1);
  assert.equal(find(doc, 't2').from, 800);
  const copy = doc.items.find((i) => i.text === 'Every week' && i.id !== 't2');
  assert.ok(copy && copy.from > 800, 'the copy sits later');
  return { copyFrom: copy.from };
});

await step('linked-clips', async () => {
  await zoomTo(2);
  const b = await boxOf('g0');
  assert.equal(await page.locator('.clip[data-clip="g0"] .clip-link').count(), 1, 'link mark drawn');
  await page.mouse.click(b.x + b.width / 2, b.y + 10);
  assert.deepEqual((await selectedIds()).sort(), ['g0', 'x0'], 'a click takes the group');
  let before = await rev();
  const z = await ppf();
  const doc0 = await load();
  await drag({ x: b.x + b.width / 2, y: b.y + 10 }, { x: b.x + b.width / 2 + 40, y: b.y + 10 });
  let doc = await saved(before);
  const d = find(doc, 'g0').from - find(doc0, 'g0').from;
  assert.ok(Math.abs(d - 40 / z) <= 1.5, `moved ${d}`);
  assert.equal(find(doc, 'x0').from - find(doc0, 'x0').from, d, 'the sound moved with its card');
  assert.equal(find(doc, 'x0').track, 'sfx2');
  const b2 = await clip('g0').boundingBox();
  await page.keyboard.down('Alt');
  await page.mouse.click(b2.x + b2.width / 2, b2.y + 10);
  await page.keyboard.up('Alt');
  assert.deepEqual(await selectedIds(), ['g0'], 'Alt takes just the one');
  before = doc.revision;
  await page.mouse.click(b2.x + b2.width / 2, b2.y + 10, { button: 'right' });
  await page.click('.tl-menu button:has-text("Unlink")');
  doc = await saved(before);
  assert.equal(find(doc, 'g0').link, undefined);
  assert.equal(find(doc, 'x0').link, undefined);
  // Link them again: select both, then Link.
  await page.mouse.click(b2.x + b2.width / 2, b2.y + 10);
  const bx = await boxOf('x0');
  await page.keyboard.down('Shift');
  await page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2);
  await page.keyboard.up('Shift');
  assert.deepEqual((await selectedIds()).sort(), ['g0', 'x0']);
  before = doc.revision;
  await page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2, { button: 'right' });
  await shot('menu-link');
  await page.click('.tl-menu button:has-text("Link")');
  doc = await saved(before);
  assert.ok(find(doc, 'g0').link && find(doc, 'g0').link === find(doc, 'x0').link, 'linked again');
  await page.keyboard.press('Escape');
  return { moved: d };
});

await step('drag-to-swap', async () => {
  await zoomTo(2);
  await page.keyboard.press('Escape');
  const doc0 = await load();
  const [a, mid, b] = ['v14', 'v15', 'v16'].map((id) => find(doc0, id));
  const ba = await boxOf('v14');
  const bb = await clip('v16').boundingBox();
  const before = doc0.revision;
  await drag({ x: ba.x + ba.width / 2, y: ba.y + ba.height / 2 }, { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }, { mid: () => shot('swap') });
  const doc = await saved(before);
  const shift = b.durationInFrames - a.durationInFrames;
  assert.equal(find(doc, 'v16').from, a.from, 'the later shot takes the first slot');
  assert.equal(find(doc, 'v14').from, b.from + shift);
  assert.equal(find(doc, 'v15').from, mid.from + shift);
  assert.equal(end(find(doc, 'v14')), end(b), 'the stretch keeps its length');
  assert.deepEqual(checkDoc(doc), []);
  return { shift };
});

await step('cmd-drag-inserts', async () => {
  await snapping(true);
  await page.keyboard.press('Escape');
  const doc0 = await load();
  const v13 = find(doc0, 'v13');
  const video = doc0.items.filter((i) => i.track === 'video').sort((x, y) => x.from - y.from);
  // Insert v13 after the next two shots: its start goes to the end of the second one after it.
  const i = video.findIndex((x) => x.id === 'v13');
  const boundary = end(video[i + 2]);
  const nextId = video[i + 3].id;
  const z = await ppf();
  const bx = await boxOf('v13');
  const before = doc0.revision;
  await drag({ x: bx.x + 12, y: bx.y + bx.height / 2 }, { x: bx.x + 12 + (boundary - v13.from) * z, y: bx.y + bx.height / 2 }, { lateKeys: [MOD], mid: () => shot('insert') });
  const doc = await saved(before);
  const now = find(doc, 'v13');
  assert.equal(now.from, boundary - v13.durationInFrames, 'lands after the two shots, the hole closed');
  assert.equal(find(doc, nextId).from, find(doc0, nextId).from, 'what follows is pushed back to where it was');
  assert.equal(now.track, 'video');
  assert.deepEqual(checkDoc(doc), []);
  await snapping(false);
  return { at: now.from };
});

await step('trim-end', async () => {
  const before = await rev();
  const z = await ppf();
  const b = await boxOf('v5');
  const v5 = find(await load(), 'v5');
  await drag({ x: b.x + b.width - 3, y: b.y + 20 }, { x: b.x + b.width - 3 - 40, y: b.y + 20 }, { mid: () => shot('trim-extent') });
  const doc = await saved(before);
  const now = find(doc, 'v5');
  assert.ok(Math.abs(now.durationInFrames - (v5.durationInFrames - 40 / z)) <= 1.5, `v5 ${v5.durationInFrames} -> ${now.durationInFrames}`);
  assert.equal(now.trimStart, v5.trimStart);
  return { from: v5.durationInFrames, to: now.durationInFrames };
});

await step('trim-stops-at-file-and-neighbour', async () => {
  // v0 reads its file from frame 0: its start cannot go earlier.
  let before = await rev();
  const b = await boxOf('v0');
  const v0 = find(await load(), 'v0');
  await drag({ x: b.x + 3, y: b.y + 20 }, { x: b.x + 3 + 30, y: b.y + 20 });
  let doc = await saved(before);
  const trimmed = find(doc, 'v0');
  assert.ok(trimmed.from > 0 && trimmed.trimStart === trimmed.from, 'start trimmed with the picture held');
  before = doc.revision;
  const b2 = await clip('v0').boundingBox();
  // Pulled far past the start, over the track names: it stops where the file starts.
  await drag({ x: b2.x + 3, y: b2.y + 20 }, { x: 60, y: b2.y + 20 });
  doc = await saved(before);
  assert.equal(find(doc, 'v0').from, 0);
  assert.equal(find(doc, 'v0').trimStart, 0);
  // v6 touches v7: its end cannot grow into it.
  before = doc.revision;
  const v6 = find(doc, 'v6');
  const b3 = await boxOf('v6');
  await drag({ x: b3.x + b3.width - 3, y: b3.y + 20 }, { x: b3.x + b3.width + 60, y: b3.y + 20 });
  await settle(900);
  doc = await load();
  assert.equal(end(find(doc, 'v6')), end(v6));
  return { v0: find(doc, 'v0').from };
});

await step('rolling-edit', async () => {
  const before = await rev();
  const z = await ppf();
  const doc0 = await load();
  const [v7, v8] = [find(doc0, 'v7'), find(doc0, 'v8')];
  const b = await boxOf('v7');
  await drag({ x: b.x + b.width - 2, y: b.y + 20 }, { x: b.x + b.width - 2 + 30, y: b.y + 20 }, { keys: ['Alt'], mid: () => shot('rolling-edit') });
  const doc = await saved(before);
  const [a, c] = [find(doc, 'v7'), find(doc, 'v8')];
  const d = a.durationInFrames - v7.durationInFrames;
  assert.ok(Math.abs(d - 30 / z) <= 1.5, `rolled ${d}`);
  assert.equal(c.from, v8.from + d);
  assert.equal(c.trimStart, v8.trimStart + d);
  assert.equal(end(c), end(v8));
  return { rolled: d };
});

await step('split-selected-with-s', async () => {
  const doc0 = await load();
  const v10 = find(doc0, 'v10');
  const mid = v10.from + Math.round(v10.durationInFrames / 2);
  await seekTo(mid);
  const b = await boxOf('v10');
  await page.mouse.click(b.x + 10, b.y + 20);
  // A clip click now seeks as well as selecting. Place the cut after selecting.
  assert.notEqual(await playheadFrame(), mid);
  await seekTo(mid);
  const before = await rev();
  await page.keyboard.press('s');
  const doc = await saved(before);
  assert.equal(doc.items.length, doc0.items.length + 1);
  assert.equal(end(find(doc, 'v10')), mid);
  return { at: mid };
});

await step('split-everything-with-cmd-b', async () => {
  await page.keyboard.press('Escape');
  const doc0 = await load();
  const at = 1010;
  await seekTo(at);
  const under = doc0.items.filter((i) => at > i.from && at < end(i) && !doc0.tracks.find((t) => t.id === i.track)?.locked).length;
  const before = await rev();
  await page.keyboard.press(`${MOD}+b`);
  const doc = await saved(before);
  assert.equal(doc.items.length, doc0.items.length + under);
  assert.deepEqual(checkDoc(doc), []);
  return { cut: under };
});

await step('razor', async () => {
  await page.keyboard.press('Escape');
  await page.keyboard.press('b');
  assert.equal(await page.getAttribute('.tl-sheet', 'data-tool'), 'razor');
  const doc0 = await load();
  const c2 = find(doc0, 'c2');
  const b = await boxOf('c2');
  const x = b.x + 100;
  await page.mouse.move(x, b.y + 10);
  await settle();
  await shot('razor-hover');
  let before = await rev();
  await page.mouse.click(x, b.y + 10);
  let doc = await saved(before);
  assert.equal(doc.items.length, doc0.items.length + 1);
  const left = find(doc, 'c2');
  assert.ok(left.durationInFrames < c2.durationInFrames);
  const right = doc.items.find((i) => i.type === 'caption' && i.from === end(left));
  assert.ok(right && right.trimStart === 0 && right.words.length > 0, 'the second half has its own words');
  assert.deepEqual(checkDoc(doc), []);
  // Shift cuts every track at that point.
  before = doc.revision;
  const frame = 1500;
  await reveal(frame, 'video');
  const row = await rowBox('video');
  const under = doc.items.filter((i) => frame > i.from && frame < end(i)).length;
  await page.keyboard.down('Shift');
  await page.mouse.click(await frameX(frame), row.y + 10);
  await page.keyboard.up('Shift');
  const doc2 = await saved(before);
  assert.equal(doc2.items.length, doc.items.length + under);
  await page.keyboard.press('v');
  assert.equal(await page.getAttribute('.tl-sheet', 'data-tool'), 'select');
  return { shiftCut: under };
});

await step('delete-and-ripple', async () => {
  let before = await rev();
  let b = await boxOf('g1');
  await page.mouse.click(b.x + 10, b.y + 10);
  await page.keyboard.press('Delete');
  let doc = await saved(before);
  assert.equal(find(doc, 'g1'), undefined);
  assert.equal(find(doc, 'g2').from, 690);
  before = doc.revision;
  await zoomTo(6);
  b = await boxOf('w10');
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  const w11 = find(doc, 'w11').from;
  await page.keyboard.press('Shift+Delete');
  doc = await saved(before);
  assert.equal(find(doc, 'w10'), undefined);
  assert.equal(find(doc, 'w11').from, w11 - 6);
  return { w11: find(doc, 'w11').from };
});

await step('undo-redo', async () => {
  let before = await rev();
  await page.keyboard.press(`${MOD}+z`);
  let doc = await saved(before);
  assert.ok(find(doc, 'w10'), 'undo brings w10 back');
  before = doc.revision;
  await page.keyboard.press(`${MOD}+Shift+z`);
  doc = await saved(before);
  assert.equal(find(doc, 'w10'), undefined);
});

await step('marquee', async () => {
  await zoomTo(2);
  await reveal(560, 'titles');
  const notes = await rowBox('notes');
  const graphics = await rowBox('graphics');
  await drag({ x: await frameX(560), y: notes.y + 6 }, { x: await frameX(1150), y: graphics.y + graphics.height - 4 }, { mid: () => shot('marquee') });
  const sel = await selectedIds();
  assert.ok(sel.includes('n1') && sel.some((id) => id.startsWith('g')), `selected ${sel}`);
  await page.keyboard.press('Escape');
  await settle();
  assert.equal((await selectedIds()).length, 0);
  // A double click on empty space in a row takes everything on that track.
  const doc = await load();
  const onNotes = doc.items.filter((i) => i.track === 'notes').map((i) => i.id).sort();
  const free = [...Array(1600).keys()].find((f) => f > 20 && doc.items.every((i) => i.track !== 'notes' || f < i.from - 5 || f > end(i) + 5));
  await reveal(free, 'notes');
  const row = await rowBox('notes');
  await page.mouse.dblclick(await frameX(free), row.y + row.height / 2);
  await settle();
  assert.deepEqual((await selectedIds()).sort(), onNotes.filter((id) => doc.items.find((i) => i.id === id)));
  await page.keyboard.press('Escape');
  return { selected: sel.length, track: onNotes.length };
});

await step('menu-duplicate', async () => {
  const before = await rev();
  const count = (await load()).items.length;
  const b = await boxOf('g3');
  await page.mouse.click(b.x + 10, b.y + 10, { button: 'right' });
  await page.waitForSelector('.tl-menu');
  await shot('menu-clip');
  await page.click('.tl-menu button:has-text("Duplicate")');
  const doc = await saved(before);
  assert.equal(doc.items.length, count + 1);
});

await step('menu-close-gap', async () => {
  const doc0 = await load();
  const titles = doc0.items.filter((i) => i.track === 'titles').sort((a, b) => a.from - b.from);
  // The first gap on the titles row after t0.
  const i = titles.findIndex((t) => t.id === 't0');
  const next = titles[i + 1];
  const gapFrame = Math.round((end(titles[i]) + next.from) / 2);
  await reveal(gapFrame, 'titles');
  const row = await rowBox('titles');
  const before = await rev();
  await page.mouse.click(await frameX(gapFrame), row.y + row.height / 2, { button: 'right' });
  await page.waitForSelector('.tl-menu');
  await shot('menu-gap');
  await page.click('.tl-menu button:has-text("Close gap")');
  const doc = await saved(before);
  assert.equal(find(doc, next.id).from, end(titles[i]));
  return { closed: next.from - end(titles[i]) };
});

await step('rename-track', async () => {
  const before = await rev();
  await page.locator('[data-head="notes"] .tl-name').scrollIntoViewIfNeeded();
  await page.dblclick('[data-head="notes"] .tl-name');
  await page.waitForSelector('.tl-rename');
  await page.fill('.tl-rename', 'Side notes');
  await page.keyboard.press('Enter');
  const doc = await saved(before);
  assert.equal(doc.tracks.find((t) => t.id === 'notes').name, 'Side notes');
});

await step('hide-mute-lock', async () => {
  let before = await rev();
  await page.click('[data-head="graphics"] button[title="Hide"]');
  let doc = await saved(before);
  before = doc.revision;
  await page.locator('[data-head="sfx"]').scrollIntoViewIfNeeded();
  await page.click('[data-head="sfx"] button[title="Mute"]');
  doc = await saved(before);
  before = doc.revision;
  await page.click('[data-head="pictures"] button[title="Lock"]');
  doc = await saved(before);
  const t = Object.fromEntries(doc.tracks.map((x) => [x.id, x]));
  assert.equal(t.graphics.hidden, true);
  assert.equal(t.sfx.muted, true);
  assert.equal(t.pictures.locked, true);
  // A locked clip does not move.
  const b = await boxOf('p1');
  await drag({ x: b.x + b.width / 2, y: b.y + 10 }, { x: b.x + b.width / 2 + 80, y: b.y + 10 });
  await settle(900);
  assert.equal(find(await load(), 'p1').from, 700);
  await shot('hidden-muted-locked');
  before = await rev();
  await page.click('[data-head="pictures"] button[title="Unlock"]');
  await saved(before);
});

await step('reorder-tracks', async () => {
  const before = await rev();
  await page.evaluate(() => { document.querySelector('.tl-scroll').scrollTop = 0; document.querySelector('.tl-scroll').scrollLeft = 0; });
  await settle();
  const head = await page.locator('[data-head="graphics"]').boundingBox();
  const first = await page.locator('.tl-row').first().boundingBox();
  await drag({ x: head.x + 40, y: head.y + head.height / 2 }, { x: head.x + 40, y: first.y + 3 }, { mid: () => shot('reorder') });
  const doc = await saved(before);
  assert.equal(doc.tracks[0].id, 'graphics');
  // A sound track cannot go above the pictures.
  const before2 = doc.revision;
  const sfx = await page.locator('[data-head="sfx2"]').boundingBox();
  await drag({ x: sfx.x + 40, y: sfx.y + sfx.height / 2 }, { x: sfx.x + 40, y: first.y + 3 });
  const doc2 = await saved(before2).catch(async () => load());
  const firstAudio = doc2.tracks.findIndex((t) => t.kind === 'audio');
  assert.ok(doc2.tracks.slice(firstAudio).every((t) => t.kind === 'audio'), 'sound tracks stay below');
  return { order: doc.tracks.slice(0, 3).map((t) => t.id) };
});

await step('menu-add-and-delete-track', async () => {
  let before = await rev();
  const count = (await load()).tracks.length;
  await page.click('[data-head="notes"]', { button: 'right' });
  await page.waitForSelector('.tl-menu');
  await shot('menu-track');
  await page.click('.tl-menu button:has-text("Add track")');
  let doc = await saved(before);
  assert.equal(doc.tracks.length, count + 1);
  const index = doc.tracks.findIndex((t) => t.id === 'notes');
  const added = doc.tracks[index + 1];
  assert.equal(added.kind, 'visual');
  before = doc.revision;
  await page.click(`[data-head="${added.id}"]`, { button: 'right' });
  await page.click('.tl-menu button:has-text("Delete track")');
  doc = await saved(before);
  assert.equal(doc.tracks.length, count);
  return { added: added.name };
});

await step('fade-handle', async () => {
  await zoomTo(4);
  const before = await rev();
  const b = await boxOf('t1');
  // The corner dots answer once the clip is selected.
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await settle();
  const handle = await page.locator('.clip[data-clip="t1"] .fade-handle.in').boundingBox();
  await drag({ x: handle.x + 4, y: handle.y + 4 }, { x: handle.x + 4 + 60, y: handle.y + 4 }, { mid: () => shot('fade') });
  const doc = await saved(before);
  const t1 = find(doc, 't1');
  assert.ok(t1.fadeIn >= 10, `fadeIn ${t1.fadeIn}`);
  return { fadeIn: t1.fadeIn };
});

await step('volume-line', async () => {
  const before = await rev();
  const b = await boxOf('v3');
  await page.mouse.click(b.x + 30, b.y + b.height - 6);
  await settle();
  const line = await page.locator('.clip[data-clip="v3"] .clip-volume').boundingBox();
  await drag({ x: line.x + 40, y: line.y + 4 }, { x: line.x + 40, y: line.y + 4 + 12 }, { mid: () => shot('volume') });
  const doc = await saved(before);
  const v3 = find(doc, 'v3');
  assert.ok(v3.volume < 1 && v3.volume > 0, `volume ${v3.volume}`);
  return { volume: v3.volume };
});

await step('nudge-with-alt-arrows', async () => {
  let before = await rev();
  const b = await boxOf('p2');
  await page.mouse.click(b.x + 10, b.y + 10);
  const from = find(await load(), 'p2').from;
  const head0 = await playheadFrame();
  await page.keyboard.press('Alt+ArrowRight');
  let doc = await saved(before);
  assert.equal(find(doc, 'p2').from, from + 1);
  before = doc.revision;
  await page.keyboard.press('Alt+Shift+ArrowRight');
  doc = await saved(before);
  assert.equal(find(doc, 'p2').from, from + 31);
  assert.equal(await playheadFrame(), head0, 'the playhead stays');
});

await step('keyboard-focus', async () => {
  await page.keyboard.press('Escape');
  await zoomTo(2);
  await reveal(0, 'captions');
  // Tab reaches a clip; reaching it selects it, and Alt with the arrows nudges it.
  let focused = null;
  for (let i = 0; i < 60 && !focused; i++) {
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.classList.contains('clip') ? document.activeElement.dataset.clip : null);
  }
  assert.ok(focused, 'a clip takes the focus');
  assert.ok((await selectedIds()).includes(focused), 'the focused clip is selected');
  const label = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
  assert.match(label, /\d:\d\d\.\d\d to \d:\d\d\.\d\d/);
  await page.keyboard.press('Escape');
  return { focused, label };
});

await step('autoscroll-while-dragging', async () => {
  await page.keyboard.press('Escape');
  await zoomTo(6);
  const b = await boxOf('n0');
  const s = await scroller().boundingBox();
  const left0 = await page.evaluate(() => document.querySelector('.tl-scroll').scrollLeft);
  const from0 = find(await load(), 'n0').from;
  const before = await rev();
  await page.mouse.move(b.x + 10, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width - 6, b.y + 10, { steps: 10 });
  await page.waitForTimeout(700);
  const left1 = await page.evaluate(() => document.querySelector('.tl-scroll').scrollLeft);
  await shot('autoscroll');
  await page.mouse.up();
  const doc = await saved(before);
  assert.ok(left1 > left0 + 100, `view scrolled ${left1 - left0}px`);
  assert.ok(find(doc, 'n0').from > from0 + (s.width - (b.x - s.x)) / (await ppf()), 'the clip travelled with the view');
  await page.keyboard.press(`${MOD}+z`);
  return { scrolled: left1 - left0 };
});

await step('snap-to-playhead', async () => {
  await snapping(true);
  await zoomTo(8);
  await page.keyboard.press('Escape');
  const doc0 = await load();
  // Find a clip and a frame before it where nothing but the playhead is within reach of the clip's start or end, so
  // the snap can only be the playhead's. At this zoom the reach is one frame.
  const edges = (skip) => [...doc0.items.filter((i) => i.id !== skip).flatMap((i) => [i.from, end(i)]), ...doc0.markers.map((m) => m.frame), 0];
  let pick = null;
  for (const c of doc0.items.filter((i) => i.durationInFrames <= 150 && i.durationInFrames >= 20 && !doc0.tracks.find((t) => t.id === i.track)?.locked)) {
    const others = edges(c.id);
    for (let f = c.from - 20; f > c.from - 100 && f > 0 && !pick; f--) {
      if (others.every((x) => Math.abs(x - f) >= 2 && Math.abs(x - f - c.durationInFrames) >= 2)) pick = { c, at: f };
    }
    if (pick) break;
  }
  assert.ok(pick, 'a quiet spot exists');
  const { c, at } = pick;
  await reveal(at, c.track);
  await seekTo(at, { reveal: false });
  assert.equal(await playheadFrame(), at);
  const b = await clip(c.id).boundingBox();
  const z = await ppf();
  const before = doc0.revision;
  // Aim 6 px (under a frame) short of the playhead: close enough to snap.
  const dx = (at - c.from) * z - 6;
  await drag({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 }, { mid: () => shot('snap') });
  const doc = await saved(before);
  assert.equal(find(doc, c.id).from, at);
  return { clip: c.id, at };
});

await step('play-follows', async () => {
  await zoomTo(20);
  await seekTo(100);
  const f0 = await playheadFrame();
  const left0 = await page.evaluate(() => document.querySelector('.tl-scroll').scrollLeft);
  // Known player issue (not the timeline's): play pressed right after a seek can stall on the seeked frame. Give the
  // player a moment to settle, the way a person would.
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  await settle(150);
  const label = await page.getAttribute('button.play', 'aria-label');
  // The player may buffer a moment after a seek with this many clips; give it time to start.
  let f1 = f0;
  for (let i = 0; i < 20 && f1 < f0 + 60; i++) { await page.waitForTimeout(300); f1 = await playheadFrame(); }
  await page.keyboard.press('Space');
  await settle(200);
  f1 = await playheadFrame();
  const left1 = await page.evaluate(() => document.querySelector('.tl-scroll').scrollLeft);
  assert.ok(f1 > f0 + 30, `played ${f0} -> ${f1}, button said ${label} after Space`);
  // The playhead stays in view: the view turned the page while it played.
  const x = await page.locator('.tl-playhead').boundingBox();
  const s = await scroller().boundingBox();
  assert.ok(x.x > s.x + HEAD - 2 && x.x < s.x + s.width, 'playhead in view');
  await shot('after-play');
  await zoomTo(2);
  return { played: f1 - f0, scrolled: left1 - left0 };
});

await step('resize-panel', async () => {
  const tl0 = await page.locator('section.tl').boundingBox();
  const handle = await page.locator('.tl-resize').boundingBox();
  await drag({ x: handle.x + 400, y: handle.y + 3 }, { x: handle.x + 400, y: handle.y + 3 - 150 });
  await settle();
  const tl1 = await page.locator('section.tl').boundingBox();
  assert.ok(tl1.height > tl0.height + 120, `height ${tl0.height} -> ${tl1.height}`);
  await shot('resized');
  await open();
  const tl2 = await page.locator('section.tl').boundingBox();
  assert.ok(Math.abs(tl2.height - tl1.height) < 3, 'height remembered');
  return { from: tl0.height, to: tl2.height };
});

await step('performance', async () => {
  await zoomTo(3);
  await reveal(600, 'titles');
  const b = await boxOf('t2');
  await page.evaluate(() => {
    window.__frames = [];
    const tick = (t) => { window.__frames.push(t); if (window.__frames.length < 400) window.__rafId = requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.mouse.move(b.x + 20, b.y + 10);
  await page.mouse.down();
  for (let i = 1; i <= 60; i++) { await page.mouse.move(b.x + 20 + i * 4, b.y + 10); }
  await page.mouse.up();
  const s = await scroller().boundingBox();
  await page.mouse.move(s.x + 700, s.y + 200);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(120, 0);
  const frames = await page.evaluate(() => { cancelAnimationFrame(window.__rafId); return window.__frames; });
  const gaps = frames.slice(1).map((t, i) => t - frames[i]).sort((a, b) => a - b);
  const p95 = gaps[Math.floor(gaps.length * 0.95)];
  const drawn = await page.locator('.clip').count();
  await page.keyboard.press(`${MOD}+z`);
  assert.ok(p95 < 50, `p95 frame gap ${p95.toFixed(1)} ms`);
  return { p95ms: Number(p95.toFixed(1)), medianMs: Number(gaps[Math.floor(gaps.length / 2)].toFixed(1)), drawn };
});

await step('saved-edit-passes-check', async () => {
  await settle(1200);
  const doc = await load();
  assert.deepEqual(checkDoc(doc), []);
  assert.deepEqual(logs.filter((l) => !/favicon|Failed to load resource/.test(l)), []);
  await page.keyboard.press('Shift+Z');
  await settle(300);
  await shot('final');
  return { items: doc.items.length, tracks: doc.tracks.length };
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ steps: results.length, passed: results.length - failed.length, failed: failed.map((f) => f.step) }));
process.exit(failed.length ? 1 : 0);
