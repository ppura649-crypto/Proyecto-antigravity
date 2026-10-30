#!/usr/bin/env node
// stage.e2e.mjs <port> <project> [screens folder]
// Contract: drives the editor page in Playwright's own bundled Chromium (never a browser anyone browses with) the way a
//   person uses it: selects on the video, moves with snapping, sizes, turns, types in the inspector and on the video,
//   nudges, crops, adds words, captions, a picture, a sound and an uploaded file, undoes, zooms, exports, meets a
//   conflict, and checks the saved edit/timeline.json on disk. Run from the install folder that serves <port>. Seeds a
//   richer edit first and puts the original edit back at the end. Prints {"ok": true, "steps": [...]} or exits 1.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [port = '58622', project, shots = null] = process.argv.slice(2);
if (!project) { console.error('usage: stage.e2e.mjs <port> <project> [screens folder]'); process.exit(2); }
const base = `http://127.0.0.1:${port}`;
const editFile = join('workspace', 'projects', project, 'edit', 'timeline.json');
if (!existsSync(editFile)) { console.error(`run from the install folder: ${editFile} not found`); process.exit(1); }
if (shots) mkdirSync(shots, { recursive: true });

const steps = [];
const step = (name, detail = '') => { steps.push(name); console.error(`ok  ${name}${detail ? `  ${detail}` : ''}`); };
const fail = (message) => { throw new Error(message); };
const assert = (cond, message) => { if (!cond) fail(message); };
const near = (a, b, e, message) => assert(Math.abs(a - b) <= e, `${message}: ${a} is not near ${b}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
const shot = async (name) => { if (shots) await page.screenshot({ path: join(shots, `${String(steps.length).padStart(2, '0')}-${name}.png`) }); };
const doc = () => page.evaluate(() => window.__keyframesEditor.doc());
const item = async (id) => (await doc()).items.find((i) => i.id === id);
const selection = () => page.evaluate(() => window.__keyframesEditor.selection());
const seek = (f) => page.evaluate((f) => window.__keyframesEditor.seek(f), f);
const settle = (ms = 350) => page.waitForTimeout(ms);
// Open a tab of the add panel; clicking the open one would close it.
const openTab = async (tab) => { if ((await page.locator(`.rail-btn[data-tab="${tab}"]`).getAttribute('aria-pressed')) !== 'true') await page.locator(`.rail-btn[data-tab="${tab}"]`).click(); };
const saved = async () => { await page.waitForSelector('[data-save="saved"]', { timeout: 15000 }); };
const center = async (selector) => { const b = await page.locator(selector).first().boundingBox(); assert(b, `${selector} is not on the page`); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
// The middle of what an item draws on the video, measured from its words when it has them.
const drawn = async (id) => page.evaluate((id) => {
  const el = document.querySelector(`[data-item="${id}"]`);
  if (!el) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let r = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) { const range = document.createRange(); range.selectNodeContents(n); r = range.getBoundingClientRect(); break; }
  if (!r) { const img = el.querySelector('img, video'); r = img?.getBoundingClientRect(); }
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } : null;
}, id);
const drag = async (from, to, { steps: n = 12, shift = false, alt = false, midShot = null } = {}) => {
  await page.mouse.move(from.x, from.y);
  if (shift) await page.keyboard.down('Shift');
  if (alt) await page.keyboard.down('Alt');
  await page.mouse.down();
  for (let i = 1; i <= n; i++) await page.mouse.move(from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n);
  if (midShot) await shot(midShot);
  await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
  if (alt) await page.keyboard.up('Alt');
  await settle(150);
};
const api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json', 'x-keyframes-write': 'edit' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });

let original = null;
try {
  // ------------------------------------------------------------------------------------------------------------
  // Seed: the video with a clip over it, a picture, words, captions and a sound, each with a known id.
  await page.goto(`${base}/edit/${project}`);
  await page.waitForSelector('.stage-frame');
  const first = (await api('GET', `/api/edit?project=${project}`)).body;
  original = first.doc;
  const media = first.media;
  const find = (name) => media.find((m) => m.name === name)?.path;
  const pic = find('crocs-5139281.jpg'), clip = find('anim-builds.mp4'), pop = find('pop.wav');
  assert(pic && clip && pop, 'the test files are not in the catalog (project assets and shipped sounds)');
  const main = original.items.find((i) => i.type === 'video');
  const fps = original.fps;
  const seeded = {
    ...original,
    tracks: [
      { id: 'text', name: 'Text', kind: 'visual' }, { id: 'captions', name: 'Captions', kind: 'visual' }, { id: 'pictures', name: 'Overlays', kind: 'visual' },
      { id: 'overlays', name: 'Overlays 2', kind: 'visual' }, { id: main.track, name: 'Video', kind: 'visual', keep: true },
      ...original.tracks.filter((t) => t.kind === 'audio'),
    ],
    items: [
      { ...main, id: 'main', durationInFrames: Math.floor(((main.sourceDurationInFrames ?? main.durationInFrames) - (main.trimStart ?? 0)) / (main.speed ?? 1)) },
      { id: 'ov', track: 'overlays', type: 'video', label: 'Overlay', from: 150, durationInFrames: 150, trimStart: 0, src: clip, sourceDurationInFrames: 196, volume: 0, link: 'e2e-link', size: { w: 1080, h: 923 }, transform: { x: 0, y: -420, scale: 0.6, rotation: 0, opacity: 1 } },
      { id: 'pic', track: 'pictures', type: 'image', label: 'Crocs', from: 0, durationInFrames: 140, trimStart: 0, src: pic, size: { w: 540, h: 675 }, fit: 'contain', transform: { x: 230, y: 420, scale: 1, rotation: 0, opacity: 1 } },
      { id: 'txt', track: 'text', type: 'text', from: 0, durationInFrames: 240, trimStart: 0, text: 'Hello there', style: { font: 'montserrat', size: 96, weight: 900, color: '#FFFFFF', caps: true, shadow: true }, transform: { x: 0, y: -160, scale: 1, rotation: 0, opacity: 1 } },
      { id: 'cap', track: 'captions', type: 'caption', from: 0, durationInFrames: 240, trimStart: 0, words: [['This', 0, 12], ['is', 12, 20], ['how', 20, 32], ['captions', 32, 50], ['look', 50, 64], ['here', 64, 80]].map(([text, from, to]) => ({ text, from, to })), style: { font: 'inter', size: 64, weight: 800, color: '#FFFFFF', activeColor: '#FFE14D', animation: 'pop', wordsPerPage: 3, y: 0.82 } },
      { id: 'snd', track: original.tracks.find((t) => t.kind === 'audio').id, type: 'audio', label: 'Pop', from: 20, durationInFrames: 10, trimStart: 0, src: pop, sourceDurationInFrames: 12, volume: 1, link: 'e2e-link' },
    ],
  };
  const put = await api('PUT', '/api/edit', { project, doc: seeded, revision: original.revision });
  assert(put.status === 200, `seeding failed: ${JSON.stringify(put.body)}`);
  await page.reload();
  await page.waitForSelector('.stage-frame');
  await settle(1500);
  assert((await doc()).items.length === 6, 'the seeded edit did not load');
  step('seeded a richer edit');

  // ------------------------------------------------------------------------------------------------------------
  // Play right after a seek, twenty times, by the editor's seek and by the arrow keys: the frame moves every time.
  await page.locator('.stage').click({ position: { x: 8, y: 8 } });
  await page.keyboard.press('Escape');
  for (let i = 0; i < 20; i++) {
    if (i % 2) { await page.locator('.stage').focus(); await page.keyboard.press('Shift+ArrowRight'); }
    else await seek(30 + ((i * 397) % 1200));
    const at = await page.evaluate(() => window.__keyframesEditor.frame());
    await page.keyboard.press('Space');
    const moved = await page.waitForFunction((at) => window.__keyframesEditor.frame() > at, at, { timeout: 500 }).then(() => true, () => false);
    const label = await page.locator('.tl button[aria-label="Pause"]').count();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => !window.__keyframesEditor.player().isPlaying(), null, { timeout: 2000 });
    assert(moved, `play after seek ${i + 1} did not move the frame within 500 ms (from ${at}, pause button shown: ${label > 0})`);
  }
  step('play after a seek moves the frame, 20 times in a row');
  await shot('nothing-selected');

  // ------------------------------------------------------------------------------------------------------------
  // Select on the video: the topmost drawn item under the pointer.
  await seek(40);
  await settle(600);
  const t0 = await drawn('txt');
  assert(t0, 'the words are not drawn at frame 40');
  await page.mouse.move(t0.x, t0.y);
  await settle(200);
  assert(await page.locator('.hover-box').count() === 1, 'no hover outline over the words');
  await page.mouse.click(t0.x, t0.y);
  await settle();
  assert(JSON.stringify(await selection()) === '["txt"]', `clicking the words selected ${await selection()}`);
  assert((await page.locator('.ins-top h2').textContent()) === 'Text', 'the inspector does not show Text');
  assert(await page.locator('[data-sel="txt"] .sel-handle').count() === 4, 'no handles on the selection');
  step('click selects the words', `inspector: Text`);
  await shot('text-selected');

  // A click on the picture selects the picture, over the clip under it.
  const p0 = await center('[data-item="pic"] img');
  await page.mouse.click(p0.x, p0.y);
  await settle();
  assert(JSON.stringify(await selection()) === '["pic"]', 'clicking the picture did not select it');
  step('click selects the picture over the clip');

  // Linked partners come with a click on the video; Alt takes just the one.
  await seek(170);
  await settle(600);
  const ov = await center('[data-item="ov"] video');
  await page.mouse.click(ov.x, ov.y);
  await settle();
  assert(JSON.stringify((await selection()).sort()) === '["ov","snd"]', `a click on a linked clip selected ${await selection()}`);
  await page.keyboard.down('Alt');
  await page.mouse.click(ov.x, ov.y);
  await page.keyboard.up('Alt');
  await settle();
  assert(JSON.stringify(await selection()) === '["ov"]', `Alt click did not take just the clip: ${await selection()}`);
  step('a linked clip brings its partner, Alt takes one');

  // A box drawn over the video selects what it touches, but not the footage behind.
  await seek(40);
  await settle(600);
  const fb = (await center('.stage-frame')).b;
  await page.keyboard.press('Escape');
  await drag({ x: fb.x + 4, y: fb.y + fb.height * 0.25 }, { x: fb.x + fb.width - 4, y: fb.y + fb.height * 0.92 }, { midShot: 'box-select' });
  const boxed = await selection();
  assert(boxed.includes('txt') && boxed.includes('pic') && !boxed.includes('main'), `the box selected ${boxed}`);
  await page.mouse.click(fb.x + 6, fb.y + 6);
  await settle();
  assert(JSON.stringify(await selection()) === '["main"]', `a click on the footage did not select it: ${await selection()}`);
  step('a box selects what it touches, a click still selects the footage', boxed.join(' '));

  // ------------------------------------------------------------------------------------------------------------
  // Move, with the snap onto the frame's middle, then Shift for one direction.
  const k = (await center('.stage-frame')).b.width / seeded.width;
  await page.mouse.click(t0.x, t0.y);
  await settle();
  await drag({ x: t0.x, y: t0.y }, { x: t0.x + 120, y: t0.y + 60 });
  let txt = await item('txt');
  // Within the snap radius: the move may land on a line nearby.
  near(txt.transform.x, 120 / k, 6 / k + 1, 'moving the words right');
  near(txt.transform.y, -160 + 60 / k, 6 / k + 1, 'moving the words down');
  step('drag moves the words', `x ${txt.transform.x}`);
  const t1 = await drawn('txt');
  await drag({ x: t1.x, y: t1.y }, { x: t1.x - 120 + 3, y: t1.y }, { midShot: 'snap-guide' });
  txt = await item('txt');
  assert(txt.transform.x === 0, `the words did not snap to the middle: x ${txt.transform.x}`);
  step('move snaps to the middle of the frame');
  const t2 = await drawn('txt');
  await drag({ x: t2.x, y: t2.y }, { x: t2.x + 20, y: t2.y + 90 }, { shift: true });
  const after = await item('txt');
  assert(after.transform.x === 0 && after.transform.y > txt.transform.y + 50 / k, `Shift did not hold the move to one direction: ${JSON.stringify(after.transform)}`);
  step('Shift holds a move to one direction');

  // ------------------------------------------------------------------------------------------------------------
  // Size from a corner and turn with the knob.
  const se = await center('[data-sel="txt"] .sel-handle.se');
  await drag(se, { x: se.x + 60, y: se.y + 20 }, { midShot: 'scaling' });
  txt = await item('txt');
  assert(txt.transform.scale > 1.1, `the corner did not size the words: ${txt.transform.scale}`);
  step('a corner sizes the words', `scale ${txt.transform.scale}`);
  const knob = await center('[data-sel="txt"] .sel-rotate');
  const mid = await center('[data-sel="txt"]');
  await drag(knob, { x: mid.x + 160, y: mid.y - 10 }, { midShot: 'turning' });
  txt = await item('txt');
  assert(txt.transform.rotation === 90, `the knob did not snap to a quarter turn: ${txt.transform.rotation}`);
  step('the knob turns and snaps to 90');
  await shot('turned');
  await page.keyboard.press('Meta+z');
  await settle();
  txt = await item('txt');
  assert(txt.transform.rotation === 0, 'undo did not take back the turn');
  step('undo takes back the turn');

  // ------------------------------------------------------------------------------------------------------------
  // Arrow keys nudge on the focused video, as one undo step.
  const x0 = (await item('txt')).transform.x;
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  txt = await item('txt');
  assert(txt.transform.x === x0 + 3, `arrows did not nudge by 1 px: ${txt.transform.x} from ${x0}`);
  await page.keyboard.press('Meta+z');
  await settle();
  assert((await item('txt')).transform.x === x0, 'one undo did not take back the whole nudge');
  step('arrows nudge, one undo takes them back');

  // ------------------------------------------------------------------------------------------------------------
  // The inspector: words, size, colour, capitals.
  const area = page.locator('.inspector textarea[name="Words"]');
  await area.fill('Edited words');
  await area.blur();
  await settle();
  assert((await item('txt')).text === 'Edited words', 'typing in the inspector did not change the words');
  const sizeField = page.locator('.inspector input[name="Size"]').first();
  await sizeField.click();
  await sizeField.fill('120');
  await sizeField.press('Enter');
  await page.locator('.inspector [aria-label="Colour"] .swatch[title="#FFE14D"]').click();
  await page.locator('.inspector button[name="Capitals"]').click();
  await settle();
  txt = await item('txt');
  assert(txt.style.size === 120 && txt.style.color === '#FFE14D' && txt.style.caps === false, `the style did not change: ${JSON.stringify(txt.style)}`);
  step('inspector changes words, size, colour and capitals');
  await page.locator('.inspector .look[data-look="label"]').click();
  await settle();
  txt = await item('txt');
  assert(txt.style.background === '#FFFFFF' && txt.style.font === 'inter', 'picking a look did not apply it');
  step('the look picker applies a look');
  await shot('inspector-text');

  // Type on the video: double click, type, click away.
  const t3 = await drawn('txt');
  await page.mouse.dblclick(t3.x, t3.y);
  await page.waitForSelector('[data-inline-edit="txt"]');
  await shot('typing-on-video');
  await page.keyboard.press('Meta+a');
  await page.keyboard.type('Typed on the video');
  await page.mouse.click(40, 450 + 0);
  await settle();
  assert((await item('txt')).text === 'Typed on the video', `typing on the video did not keep the words: ${(await item('txt')).text}`);
  step('double click types on the video');

  // ------------------------------------------------------------------------------------------------------------
  // Crop the picture from its left edge.
  const p1 = await center('[data-item="pic"] img');
  await page.mouse.click(p1.x, p1.y);
  await settle();
  await page.locator('.inspector button:has-text("Crop")').click();
  await page.waitForSelector('.crop-box');
  const west = await center('.crop-handle.w');
  await drag(west, { x: west.x + 40, y: west.y }, { midShot: 'cropping' });
  const crop = (await item('pic')).crop;
  assert(crop && crop.l > 0.1 && crop.r === 0, `the crop did not move its left edge: ${JSON.stringify(crop)}`);
  await page.locator('.inspector button:has-text("Done")').click();
  step('crop moves one edge', `left ${crop.l}`);

  // Multi-selection: Shift click adds the words.
  const t4 = await drawn('txt');
  await page.keyboard.down('Shift');
  await page.mouse.click(t4.x, t4.y);
  await page.keyboard.up('Shift');
  await settle();
  assert((await selection()).length === 2 && (await page.locator('.ins-top h2').textContent()) === '2 selected', 'Shift click did not add to the selection');
  step('Shift click selects two');
  await shot('two-selected');

  // ------------------------------------------------------------------------------------------------------------
  // Add: words, captions, a picture, a sound.
  await page.keyboard.press('Escape');
  const count = async () => (await doc()).items.length;
  const n0 = await count();
  await openTab('text');
  await shot('add-text');
  await page.locator('.preset[data-preset="title"]').click();
  await settle();
  const added = (await doc()).items.at(-1);
  assert(added.type === 'text' && added.text === 'Big title' && JSON.stringify(await selection()) === JSON.stringify([added.id]), 'the title preset was not added and selected');
  step('Text preset adds at the playhead');

  await openTab('captions');
  await shot('add-captions');
  await page.locator('.preset[data-preset="karaoke"]').click();
  await settle();
  const cap = (await doc()).items.at(-1);
  assert(cap.type === 'caption' && cap.style.animation === 'karaoke', 'the caption preset was not added');
  await page.locator('.inspector button:has-text("Edit as text")').click();
  const words = page.locator('.inspector textarea[name="Caption words"]');
  await words.fill('Hello world from here');
  await words.blur();
  await settle();
  const capAfter = (await doc()).items.find((i) => i.id === cap.id);
  assert(capAfter.words.map((w) => w.text).join(' ') === 'Hello world from here', `caption words did not change: ${capAfter.words.map((w) => w.text)}`);
  await page.locator('.inspector button:has-text("Show pages")').click();
  await page.locator('.inspector .chip[data-word="1"]').click();
  await page.locator('.inspector button:has-text("New page here")').click();
  await settle();
  const paged = (await doc()).items.find((i) => i.id === cap.id);
  assert(paged.pages?.length >= 2 && paged.pages[1].lines[0][0] === 1, `a new page did not start at the word: ${JSON.stringify(paged.pages)}`);
  step('Captions preset adds, words edit as text, a page splits');
  await shot('captions-inspector');

  await openTab('media');
  await page.waitForSelector('.tile[data-media$="crocs-5139667.jpg"]');
  await shot('add-media');
  await page.locator('.tile[data-media$="crocs-5139667.jpg"]').click();
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 3);
  const picAdded = (await doc()).items.at(-1);
  near(picAdded.size.w, seeded.width * 0.7, 1, 'a new picture should take 70 percent of the width');
  step('a picture adds at 70 percent of the width');

  await openTab('sounds');
  await page.locator('[data-sound$="pop.wav"] button[aria-label="Listen"]').click();
  await shot('add-sounds');
  await page.locator('[data-sound$="pop.wav"] button[aria-label^="Add"]').click();
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 4);
  assert((await doc()).items.at(-1).type === 'audio', 'the sound was not added');
  step('a sound adds, with a preview');

  // A library picture dragged onto the timeline lands at the time under the pointer.
  const entry = media.find((m) => m.name === 'crocs-5139682.jpg');
  const lane = await page.locator('.tl-scroll').boundingBox();
  const at = await page.evaluate(({ entry, y }) => {
    const scroller = document.querySelector('.tl-scroll');
    const r = scroller.getBoundingClientRect();
    const x = r.left + r.width * 0.6;
    const data = new DataTransfer();
    data.setData('application/x-keyframes-media', JSON.stringify([entry]));
    const target = document.elementFromPoint(x, y);
    for (const type of ['dragenter', 'dragover', 'drop']) target.dispatchEvent(new DragEvent(type, { dataTransfer: data, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    return x;
  }, { entry, y: lane.y + lane.height - 12 });
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 5);
  const onTimeline = (await doc()).items.at(-1);
  assert(onTimeline.src === entry.path && onTimeline.from > 60, `the picture dropped on the timeline landed at ${onTimeline.from}`);
  step('a picture dragged onto the timeline lands under the pointer', `frame ${onTimeline.from}`);
  await page.keyboard.press('Meta+z');
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 4);
  void at;

  // Upload: a file chosen, then a file dropped on the video.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64');
  await openTab('upload');
  await page.locator('input[type="file"][name="Upload"]').setInputFiles({ name: 'e2e-square.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('.uploads li.done');
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 5);
  assert((await doc()).items.at(-1).src.startsWith('workspace/input/editor/e2e-square'), 'the uploaded file was not added');
  await shot('uploaded');
  const frameBox = (await center('.stage-frame')).b;
  await page.evaluate(async ({ b64, x, y }) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], 'e2e-dropped.png', { type: 'image/png' }));
    const target = document.elementFromPoint(x, y);
    for (const type of ['dragenter', 'dragover', 'drop']) target.dispatchEvent(new DragEvent(type, { dataTransfer: data, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  }, { b64: png.toString('base64'), x: frameBox.x + frameBox.width * 0.25, y: frameBox.y + frameBox.height * 0.3 });
  await page.waitForFunction((n) => window.__keyframesEditor.doc().items.length === n, n0 + 6, { timeout: 15000 });
  const droppedItem = (await doc()).items.at(-1);
  assert(droppedItem.src.includes('e2e-dropped') && droppedItem.transform.x < 0 && droppedItem.transform.y < 0, `the dropped file did not land where it was dropped: ${JSON.stringify(droppedItem.transform)}`);
  step('upload by choosing and by dropping on the video');

  await page.keyboard.press('Meta+z');
  await settle();
  assert((await count()) === n0 + 5, 'undo did not take back the last add');
  await page.keyboard.press('Shift+Meta+z');
  await settle();
  assert((await count()) === n0 + 6, 'redo did not bring it back');
  step('undo and redo cover adds');

  // ------------------------------------------------------------------------------------------------------------
  // Zoom, safe zone, keys sheet.
  await page.locator('.zoom-value').click();
  await page.locator('.menu button:has-text("100%")').click();
  await settle(500);
  assert((await center('.stage-frame')).b.width > 1000, 'zoom 100 percent did not zoom');
  await shot('zoom-100');
  await page.locator('.stage').focus();
  await page.keyboard.press('Meta+0');
  await settle(300);
  await page.locator('.stage-tools button:has-text("Safe zone")').click();
  await shot('safe-zone');
  await page.locator('.stage-tools button:has-text("Safe zone")').click();
  await page.keyboard.press('?');
  await page.waitForSelector('.sheet');
  await shot('keys');
  await page.keyboard.press('Escape');
  step('zoom, safe zone and the keys sheet');

  // ------------------------------------------------------------------------------------------------------------
  // Export: saves first, records the request, gives the words to paste.
  await page.locator('[data-export]').click();
  await page.waitForSelector('[data-prompt]');
  const prompt = await page.locator('[data-prompt]').textContent();
  assert(prompt.includes(project), 'the export prompt does not name the video');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await page.locator('[data-copy]').click();
  await page.waitForSelector('[data-copy]:has-text("Copied")');
  await shot('export');
  await page.keyboard.press('Escape');
  assert(existsSync(join('workspace', 'projects', project, 'edit', 'export-request.json')), 'no export request on disk');
  step('export saves, records and copies');

  // ------------------------------------------------------------------------------------------------------------
  // The saved edit on disk holds every change.
  await saved();
  const disk = JSON.parse(readFileSync(editFile, 'utf8'));
  const dtxt = disk.items.find((i) => i.id === 'txt');
  assert(dtxt.text === 'Typed on the video' && dtxt.style.background === '#FFFFFF' && dtxt.transform.scale > 1.1, 'the words on disk are not the edited words');
  assert(disk.items.find((i) => i.id === 'pic').crop.l > 0.1, 'the crop is not on disk');
  assert(disk.items.some((i) => i.type === 'caption' && i.words.map((w) => w.text).join(' ') === 'Hello world from here'), 'the caption is not on disk');
  assert(disk.items.filter((i) => i.src?.startsWith('workspace/input/editor/e2e-')).length === 2, 'the uploads are not on disk');
  assert(disk.items.length === 12, `expected 12 items on disk, found ${disk.items.length}`);
  step('the saved edit on disk holds every change', `revision ${disk.revision}`);

  // ------------------------------------------------------------------------------------------------------------
  // A conflict: the edit changes on disk, the page says so and can keep its own.
  writeFileSync(editFile, JSON.stringify({ ...disk, revision: disk.revision + 5 }, null, 1));
  await page.locator('.stage').focus();
  await openTab('text');
  await page.locator('.preset[data-preset="cta"]').click();
  await page.waitForSelector('.banner.warn', { timeout: 10000 });
  await shot('conflict');
  await page.locator('.banner.warn button:has-text("Keep mine")').click();
  await saved();
  assert(JSON.parse(readFileSync(editFile, 'utf8')).items.length === 13, 'Keep mine did not save this page\'s edit');
  step('a conflict shows, Keep mine saves');

  // Copy, cut and paste at the playhead, and paste a look.
  const before = (await doc()).items.length;
  await seek(40);
  await settle(500);
  const tc = await drawn('txt');
  await page.mouse.click(tc.x, tc.y);
  await settle();
  await page.keyboard.press('Meta+c');
  await seek(400);
  await settle(300);
  await page.keyboard.press('Meta+v');
  await settle();
  let pasted = (await doc()).items.at(-1);
  assert((await doc()).items.length === before + 1 && pasted.type === 'text' && pasted.text === 'Typed on the video' && pasted.from === 400, `paste did not land a copy at the playhead: ${JSON.stringify({ from: pasted.from, text: pasted.text })}`);
  assert(await page.evaluate(() => { try { return Boolean(localStorage.getItem('keyframes.editor.clipboard')); } catch { return false; } }), 'the copy is not kept for other videos');
  await page.keyboard.press('Meta+x');
  await settle();
  assert((await doc()).items.length === before, 'cut did not remove the pasted copy');
  await page.keyboard.press('Meta+v');
  await settle();
  pasted = (await doc()).items.at(-1);
  assert((await doc()).items.length === before + 1 && pasted.from === 400, 'paste after cut did not put it back');
  step('copy, cut and paste at the playhead');
  const title = (await doc()).items.find((i) => i.type === 'text' && i.text === 'Big title');
  await seek(40); await settle(400);
  const tc2 = await drawn('txt');
  await page.mouse.click(tc2.x, tc2.y);
  await page.keyboard.press('Meta+c');
  await seek(title.from + 5); await settle(400);
  const tt2 = await drawn(title.id);
  await page.mouse.click(tt2.x, tt2.y);
  await settle();
  await page.keyboard.press('Meta+Alt+v');
  await settle();
  const restyled = (await doc()).items.find((i) => i.id === title.id);
  const source = (await doc()).items.find((i) => i.id === 'txt');
  assert(restyled.style.background === source.style.background && restyled.style.font === source.style.font && restyled.text === 'Big title', `paste style did not copy the look: ${JSON.stringify(restyled.style)}`);
  step('Cmd Alt V pastes the look');
  await shot('pasted-look');

  // A phone is told to use a computer.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(`${base}/edit/${project}`);
  await phone.waitForSelector('.phone-note h1', { state: 'visible' });
  if (shots) await phone.screenshot({ path: join(shots, 'phone.png') });
  await phone.close();
  step('a phone is told to open it on a computer');

  assert(!problems.length, `the page threw: ${problems[0]}`);
  console.log(JSON.stringify({ ok: true, steps }));
} catch (error) {
  await shot('failed').catch(() => {});
  console.error(`FAIL ${error.message}`);
  console.log(JSON.stringify({ ok: false, steps, error: error.message, problems }));
  process.exitCode = 1;
} finally {
  // Put the original edit back, on top of whatever revision is there now.
  if (original) {
    const now = JSON.parse(readFileSync(editFile, 'utf8'));
    await api('PUT', '/api/edit', { project, doc: original, revision: now.revision }).catch(() => {});
  }
  await browser.close();
  // The files this test uploaded.
  const { readdirSync, rmSync } = await import('node:fs');
  const uploads = join('workspace', 'input', 'editor');
  if (existsSync(uploads)) for (const name of readdirSync(uploads)) if (/^e2e-(square|dropped)(-\d+)?\.png$/.test(name)) rmSync(join(uploads, name), { force: true });
}
