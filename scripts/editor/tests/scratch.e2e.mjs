#!/usr/bin/env node
// scratch.e2e.mjs <port> [screens folder]
// Contract: makes a video from nothing the way a person would, in Playwright's own bundled Chromium (never a browser
//   anyone browses with): New video, drop three clips on the empty stage (they line up in drop order), trim one,
//   split one, move one on the timeline, add music, captions and a title, then checks the saved edit/timeline.json.
//   Run from the install folder that serves <port>; needs ffmpeg (the install's ffmpeg-static or one on PATH) to make
//   three tiny clips. Deletes the project and its uploads at the end. Prints {"ok": true, "steps": [...]} or exits 1.
import { chromium } from 'playwright';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [port = '58622', shots = null] = process.argv.slice(2);
const base = `http://127.0.0.1:${port}`;
if (!existsSync('workspace/projects')) { console.error('run from the install folder'); process.exit(1); }

// Three one-and-a-half second clips in three colours, each with a tone, and four seconds of music.
const ffmpeg = existsSync('node_modules/ffmpeg-static/ffmpeg') ? 'node_modules/ffmpeg-static/ffmpeg' : 'ffmpeg';
const tmp = mkdtempSync(join(tmpdir(), 'kf-e2e-'));
const clips = ['EE4A26', '36B38A', '4D8DFF'].map((colour, i) => {
  const out = join(tmp, `e2e-clip-${i + 1}.mp4`);
  const run = spawnSync(ffmpeg, ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=0x${colour}:s=360x640:d=1.5:r=30`, '-f', 'lavfi', '-i', `sine=frequency=${300 * (i + 1)}:duration=1.5`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', out]);
  if (run.status !== 0) { console.error(`ffmpeg could not make a test clip: ${run.stderr}`); process.exit(1); }
  return out;
});
const music = join(tmp, 'e2e-music.wav');
spawnSync(ffmpeg, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=220:duration=4', '-c:a', 'pcm_s16le', music]);

const steps = [];
const step = (name, detail = '') => { steps.push(name); console.error(`ok  ${name}${detail ? `  ${detail}` : ''}`); };
const assert = (cond, message) => { if (!cond) throw new Error(message); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
const shot = async (name) => { if (shots) await page.screenshot({ path: join(shots, `scratch-${String(steps.length).padStart(2, '0')}-${name}.png`) }); };
const doc = () => page.evaluate(() => window.__keyframesEditor.doc());
const seek = (f) => page.evaluate((f) => window.__keyframesEditor.seek(f), f);
const settle = (ms = 350) => page.waitForTimeout(ms);
// Open a tab of the add panel; clicking the open one would close it.
const openTab = async (tab) => { if ((await page.locator(`.rail-btn[data-tab="${tab}"]`).getAttribute('aria-pressed')) !== 'true') await page.locator(`.rail-btn[data-tab="${tab}"]`).click(); };
const itemsOf = async (type) => (await doc()).items.filter((i) => i.type === type).sort((a, b) => a.from - b.from);
let project = null;

try {
  // New video: a name and a shape.
  await page.goto(`${base}/edit/new`);
  await page.locator('input[data-new-video="name"]').fill('E2E from scratch');
  await page.locator('.shape-option:has-text("9:16")').click();
  await shot('new');
  await page.locator('button:has-text("Open the editor")').click();
  await page.waitForURL(/\/edit\/\d{4}-\d{2}-\d{2}-edit-e2e-from-scratch/);
  project = decodeURIComponent(new URL(page.url()).pathname.split('/').pop());
  await page.waitForSelector('.stage-empty');
  assert(await page.locator('.add[aria-label="Media"]').count() === 1, 'the add panel is not open on Media for an empty video');
  assert(await page.locator('.tl-empty').count() === 1, 'the timeline does not say to drop clips');
  step('New video opens empty, asking for clips', project);
  await shot('empty');

  // Drop three clips on the empty stage: they line up on the Video track in the order dropped.
  const frame = await page.locator('.stage-frame').boundingBox();
  await page.evaluate(async ({ files, x, y }) => {
    const data = new DataTransfer();
    for (const f of files) data.items.add(new File([Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0))], f.name, { type: 'video/mp4' }));
    const target = document.elementFromPoint(x, y);
    for (const type of ['dragenter', 'dragover', 'drop']) target.dispatchEvent(new DragEvent(type, { dataTransfer: data, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  }, { files: clips.map((path) => ({ name: path.split('/').pop(), b64: readFileSync(path).toString('base64') })), x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 });
  await page.waitForFunction(() => window.__keyframesEditor.doc().items.filter((i) => i.type === 'video').length === 3, null, { timeout: 30000 });
  let videos = await itemsOf('video');
  assert(videos.map((v) => v.label).join(',') === 'e2e-clip-1,e2e-clip-2,e2e-clip-3', `clips are not in drop order: ${videos.map((v) => v.label)}`);
  assert(new Set(videos.map((v) => v.track)).size === 1 && videos[0].from === 0 && videos[1].from === videos[0].durationInFrames && videos[2].from === videos[1].from + videos[1].durationInFrames, `clips are not end to end on one track: ${videos.map((v) => `${v.track}@${v.from}`)}`);
  assert(!videos[0].size, 'a 9:16 clip on a 9:16 video should fill the frame');
  step('three dropped clips line up end to end', videos.map((v) => v.from).join(' '));
  await shot('three-clips');

  // Trim the second clip to one second, from the inspector.
  await seek(videos[1].from + 5);
  await settle(500);
  await page.mouse.click(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await settle();
  assert(JSON.stringify(await page.evaluate(() => window.__keyframesEditor.selection())) === JSON.stringify([videos[1].id]), 'clicking the video did not select the second clip');
  const length = page.locator('.inspector input[name="Length"]');
  await length.click();
  await length.fill('1s');
  await length.press('Enter');
  await settle();
  videos = await itemsOf('video');
  assert(videos[1].durationInFrames === 30, `the trim did not take: ${videos[1].durationInFrames}`);
  step('the second clip trims to one second');

  // Split the first clip at half a second.
  await page.locator('.stage').click({ position: { x: 10, y: 10 } });
  await seek(15);
  await settle(300);
  await page.mouse.click(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await page.keyboard.press('s');
  await settle();
  videos = await itemsOf('video');
  assert(videos.length === 4 && videos[0].durationInFrames === 15 && videos[1].from === 15 && videos[1].trimStart === 15, `the split did not cut the first clip in two: ${videos.map((v) => `${v.from}+${v.durationInFrames}`)}`);
  step('S splits the clip at the playhead');
  await shot('split');

  // Move the last clip on the timeline, later by a second.
  const last = videos.at(-1);
  await page.locator('.tl button[aria-label="Fit"]').click();
  await settle();
  const block = await page.locator(`div.clip[data-clip="${last.id}"]`).boundingBox();
  await page.mouse.move(block.x + block.width / 2, block.y + block.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(block.x + block.width / 2 + i * 8, block.y + block.height / 2);
  await page.mouse.up();
  await settle();
  const moved = (await doc()).items.find((i) => i.id === last.id);
  assert(moved.from > last.from, `the clip did not move on the timeline: ${last.from} to ${moved.from}`);
  step('a clip moves on the timeline', `${last.from} to ${moved.from}`);

  // Music from the computer, at the start.
  await seek(0);
  await openTab('upload');
  await page.locator('input[type="file"][name="Upload"]').setInputFiles(music);
  await page.waitForFunction(() => window.__keyframesEditor.doc().items.some((i) => i.type === 'audio'), null, { timeout: 20000 });
  const song = (await itemsOf('audio'))[0];
  assert(song.from === 0 && song.durationInFrames === 120, `the music is not at the start for its full length: ${song.from}+${song.durationInFrames}`);
  step('music uploads and lands at the start');

  // Captions and a title.
  await openTab('captions');
  await page.locator('.preset[data-preset="clean"]').click();
  await page.locator('.inspector button:has-text("Edit as text")').click();
  const words = page.locator('.inspector textarea[name="Caption words"]');
  await words.fill('Three clips from scratch');
  await words.blur();
  await openTab('text');
  await page.locator('.preset[data-preset="title"]').click();
  await page.locator('.inspector textarea[name="Words"]').fill('Made by hand');
  await page.locator('.inspector textarea[name="Words"]').blur();
  await settle(600);
  await shot('finished');
  step('captions and a title added');

  // What is saved on disk.
  await page.waitForSelector('[data-save="saved"]', { timeout: 15000 });
  const disk = JSON.parse(readFileSync(join('workspace', 'projects', project, 'edit', 'timeline.json'), 'utf8'));
  const project_ = JSON.parse(readFileSync(join('workspace', 'projects', project, 'project.json'), 'utf8'));
  assert(project_.format === 'edit' && disk.width === 1080 && disk.height === 1920 && disk.fps === 30, 'the video is not a 1080 by 1920 edit at 30 fps');
  assert(disk.items.filter((i) => i.type === 'video').length === 4, 'four clip pieces should be saved');
  assert(disk.items.some((i) => i.type === 'caption' && i.words.map((w) => w.text).join(' ') === 'Three clips from scratch'), 'the captions are not saved');
  assert(disk.items.some((i) => i.type === 'text' && i.text === 'Made by hand'), 'the title is not saved');
  assert(disk.items.some((i) => i.type === 'audio' && i.src.endsWith('e2e-music.wav')), 'the music is not saved');
  step('the saved edit holds it all', `${disk.items.length} items, revision ${disk.revision}`);
  assert(!problems.length, `the page threw: ${problems[0]}`);
  console.log(JSON.stringify({ ok: true, project, steps }));
} catch (error) {
  await shot('failed').catch(() => {});
  console.error(`FAIL ${error.message}`);
  console.log(JSON.stringify({ ok: false, project, steps, error: error.message, problems }));
  process.exitCode = 1;
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
  if (project) rmSync(join('workspace', 'projects', project), { recursive: true, force: true });
  for (const name of ['e2e-clip-1.mp4', 'e2e-clip-2.mp4', 'e2e-clip-3.mp4', 'e2e-music.wav']) rmSync(join('workspace', 'input', 'editor', name), { force: true });
}
