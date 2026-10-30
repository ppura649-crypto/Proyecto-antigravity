// reader.mjs: a Talking Head project opened as the universal edit document.
//
// A talking head is five things, and each becomes the editor's own type so it is edited like any other format:
//   the cut (master.mp4)                     one `video` item, its voice kept           track Video
//   every caption page (captions.json)       one `caption` item per page               track Captions
//   every card and hook visual (visuals.json and visuals.hook*.json)
//                                            one `layer` (a Graphic) per event         track Graphics
//   title pages (captions.json type title)   one `text` item with the title look       track Text
//   every sound cue (sfx-hook/-bridge/-body) one `audio` item per cue                  track Sounds
// Word starts become cue markers for snapping.
//
// Time. A page or a card shows on frame f of the format's own render when f / fps * 1000 is inside [fromMs, toMs),
// so an item starts on the first frame at or after fromMs. Caption words are rewritten in frames on the item's own
// clock. A card is a designed animation whose data carries times in many shapes (beats, sweeps, maps, clip lists),
// so its data keeps the format's clock untouched and `clockFrame` says which frame of that clock the item's frame 0
// is: the card is drawn exactly as the format drew it, and moving the item moves the whole animation.
//
// Asset paths are rewritten the way engine/talking-head/remotion/render.mjs rewrites them, to `assets/<file>`, which
// staticFile() resolves from the project folder through /edit-static/<project>/. A reader never writes.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const formats = ['talking-head'];
export const CAPTION_LOOK = 'talking-head/captions';

const SFX_DIRS = ['assets/talking-head/sfx', 'workspace/library/talking-head-sfx'];
const AUDIO_EXT = ['.wav', '.ogg', '.mp3', '.m4a', '.flac'];
// The hook mixer's loudness targets by family (sfx_mix2.py): the sound's own 10 ms peak sits this far under the voice.
const FAMILY_TARGET = { mark: -11, move: -12, texture: -13, weight: -10, tone: -9 };
const SFX_LEVEL = 0.6;

// ---------------------------------------------------------------------------------------------------------------
// Time helpers.

export const frameAt = (ms, fps) => Math.ceil((ms * fps) / 1000 - 1e-6) + 0; // + 0 turns -0 into 0
const nearFrame = (ms, fps) => Math.round((ms * fps) / 1000);

// ---------------------------------------------------------------------------------------------------------------
// Captions. The format's page (block stack, hero with tail, one word, hero word) becomes universal words plus a page
// that keeps the format's line breaks; what only this look needs (line sizes, accents, grade) rides on page.th.

export function lookOf(style) {
  // The shipped engine names its styles by format; any other id is the first format.
  return `talking-head/${style?.style === 'creator-format-2' ? 'creator-format-2' : 'creator-format-1'}`;
}

const firstFamily = (css) => String(css ?? '').split(',')[0].trim().replace(/^["']|["']$/g, '');
// The editor's own faces go by an id; a face it lists is written as that id so its font picker shows it.
const EDITOR_FONTS = { inter: 'Inter', poppins: 'Poppins', sora: 'Sora', montserrat: 'Montserrat', anton: 'Anton', bebas: 'Bebas Neue', oswald: 'Oswald', playfair: 'Playfair Display', dmserif: 'DM Serif Display', marker: 'Permanent Marker' };
export const fontId = (css) => { const name = firstFamily(css); return Object.keys(EDITOR_FONTS).find((id) => EDITOR_FONTS[id].toLowerCase() === name.toLowerCase()) ?? name; };

export function captionStyle(st) {
  return {
    look: CAPTION_LOOK,
    font: fontId(st.fontFamily),
    size: st.fontSizePx,
    weight: st.fontWeight,
    color: st.fillColor,
    activeColor: st.emphasisColor,
    caps: Boolean(st.uppercase),
    shadow: Boolean(st.textShadow && st.textShadow !== 'none'),
    y: st.baselineYFrac,
    maxWidth: st.maxWidthFrac ?? st.heroWidthFrac,
    animation: 'word',
    // The format's own style, whole: the look draws from it and the universal fields above override it when changed.
    th: st,
  };
}

function pageWords(page) {
  if (page.type === 'block' && page.variant === 'heroTail') {
    const words = [{ text: page.hero ?? '', atMs: page.fromMs }];
    const lines = [[0]];
    const meta = [{ role: 'hero' }];
    for (const line of page.tail ?? []) {
      lines.push(line.words.map((w) => { words.push(w); return words.length - 1; }));
      meta.push({ role: 'tail' });
    }
    return { words, lines, meta };
  }
  if (page.type === 'block') {
    const words = [];
    const lines = (page.lines ?? []).map((line) => line.words.map((w) => { words.push(w); return words.length - 1; }));
    const meta = (page.lines ?? []).map((line) => ({ size: line.size, accent: line.accent, spread: line.spread }));
    return { words, lines, meta };
  }
  const parts = String(page.text ?? '').split(/\s+/).filter(Boolean);
  const words = (parts.length ? parts : ['']).map((text) => ({ text, atMs: page.fromMs }));
  return { words, lines: [words.map((_, i) => i)], meta: [{}] };
}

export function captionItem(page, index, fps, style) {
  const from = Math.max(0, frameAt(page.fromMs, fps));
  const to = frameAt(page.toMs, fps);
  if (to <= from) return null; // shorter than a frame: the render never showed it either
  const length = to - from;
  const { words: raw, lines, meta } = pageWords(page);
  const starts = [];
  for (const w of raw) starts.push(Math.max(starts.at(-1) ?? 0, Math.min(length - 1, Math.max(0, frameAt(w.atMs ?? page.fromMs, fps) - from))));
  const lineOf = new Map();
  lines.forEach((line, l) => line.forEach((i) => lineOf.set(i, l)));
  // Each word also carries its line's look, so the look survives when a person cuts the page or deletes a line.
  const words = raw.map((w, i) => {
    const next = i + 1 < raw.length ? starts[i + 1] : length;
    const word = { text: w.text, from: starts[i], to: Math.min(length, Math.max(starts[i] + 1, next)) };
    const line = meta[lineOf.get(i)];
    if (line && Object.values(line).some((v) => v !== undefined)) word.th = Object.fromEntries(Object.entries(line).filter(([, v]) => v !== undefined));
    return word;
  });
  const th = { type: page.type ?? 'word', variant: page.variant, grade: page.grade ?? 0, fancy: page.fancy, fontPx: page.fontPx, topFrac: page.topFrac, quote: page.quote, lines: meta };
  for (const key of Object.keys(th)) if (th[key] === undefined) delete th[key];
  return {
    id: `cap-${index}`,
    track: 'captions',
    type: 'caption',
    from,
    durationInFrames: length,
    trimStart: 0,
    label: words.map((w) => w.text).join(' ').trim() || 'Caption',
    words,
    pages: [{ from: 0, to: length, lines, th }],
    style,
  };
}

// A title page (the sentence on top during the first hook sentence) is words placed by hand: a text item in the
// format's title look. Its spans, reveal and logos ride on data, on the format's clock like a card.
function titleItem(page, index, fps, st, slugAssets) {
  const from = Math.max(0, frameAt(page.fromMs, fps));
  const to = frameAt(page.toMs, fps);
  if (to <= from) return null;
  const lines = (page.lines ?? []).map((line) => (Array.isArray(line) ? line : [line]));
  const text = lines.map((line) => line.map((span) => span.text).join('')).join('\n');
  const logos = (page.logos ?? []).map((logo) => ({ ...logo, src: logo.src.includes('/') ? logo.src : `${slugAssets}${logo.src}` }));
  return {
    id: `title-${index}`,
    track: 'text',
    type: 'text',
    from,
    durationInFrames: to - from,
    trimStart: 0,
    label: text.replace(/\n/g, ' '),
    text,
    style: { look: 'talking-head/title', font: fontId(st.titleFontFamily ?? st.fontFamily), size: page.fontPx ?? st.titleFontPx ?? 54, weight: st.titleWeight ?? st.fontWeight, color: st.titleColor ?? st.fillColor, align: 'center' },
    data: { page: { ...page, logos }, clockFrame: from, captionStyle: st },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Cards. Mirrors render.mjs's path rewriting with `assets/` in place of `<slug>-assets/`.

export function rewriteEvent(source, meta, prefix = 'assets/') {
  const ev = JSON.parse(JSON.stringify(source));
  for (const pg of ev.pages ?? []) if (pg.src) pg.src = `${prefix}${pg.src}`;
  if (Array.isArray(ev.data?.assets)) ev.data.assets = ev.data.assets.map((a) => `${prefix}${a}`);
  for (const c of ev.data?.timeline?.clips ?? []) if (c.thumb) c.thumb = `${prefix}${c.thumb}`;
  if (ev.data?.frames) ev.data.frames = ev.data.frames.map((f) => `${prefix}${f}`);
  if (ev.data?.frame) ev.data.frame = `${prefix}${ev.data.frame}`;
  for (const pk of ev.data?.packs ?? []) pk.imgs = (pk.imgs ?? []).map((x) => `${prefix}${x}`);
  for (const it of ev.items ?? []) if (it.src) it.src = `${prefix}${it.src}`;
  const problems = [];
  if (ev.asset) {
    const name = ev.asset.replace(/\.(png|jpg|mp4)$/, '');
    const m = meta?.[name];
    if (!m && !ev.assetW && (ev.kind === 'shot' || ev.kind === 'float')) problems.push(`no size for ${ev.asset}`);
    if (m) { ev.assetW = m.w; ev.assetH = m.h; }
    ev.asset = `${prefix}${ev.asset}`;
    if (ev.asset2) {
      const m2 = meta?.[ev.asset2.replace(/\.(png|jpg|mp4)$/, '')];
      if (m2) { ev.asset2W = m2.w; ev.asset2H = m2.h; }
      ev.asset2 = `${prefix}${ev.asset2}`;
    }
    for (const sw of ev.sweeps ?? []) {
      if (!sw.mark) continue;
      const mk = m?.marks?.[sw.mark];
      if (mk) { sw.y = mk.y; sw.h = mk.h; } else problems.push(`no mark ${sw.mark} in ${name}`);
    }
  }
  return { event: ev, problems };
}

// Words a person reads inside a card: every string in its data that is prose, never a file, a colour, an id or a
// note to the builder. Each becomes a field the inspector can change without knowing the card.
const NOT_WORDS = new Set(['id', 'kind', 'src', 'file', 'thumb', 'frame', 'frames', 'asset', 'asset2', 'assets', 'callback', 'clock', 'long', 'note', 'why', 'mode', 'glyph', 'font', 'fontFamily', 'accentFontFamily', 'color', 'colour', 'bg', 'fill', 'stroke', 'look', 'variant', 'align', 'vAlign', 'anchor', 'ease', 'easing', 'shape', 'icon', 'style', 'type', 'side', 'dir', 'direction', 'position', 'pos', 'fit', 'trigger', 'until', 'beats', 'card', 'sweeps', 'marks', 'imgs', 'img', 'image', 'logo', 'mark', 'url', 'href', 'cwd', 'chrome', 'model', 'userName', 'real', 'slop', 'objectPosition', 'transform', 'blend', 'family', 'hook']);
const FILEISH = /\.(png|jpe?g|webp|gif|svg|mp4|mov|webm|wav|mp3|ogg|json|ttf|otf|woff2?)$/i;
const isProse = (value) => typeof value === 'string' && /\p{L}/u.test(value) && !FILEISH.test(value) && !/^(#|rgba?\(|hsla?\(|https?:|var\(|\/|\.\/)/i.test(value.trim()) && value.length <= 400;

export function wordFields(event) {
  const out = [];
  const walk = (value, path, key) => {
    if (out.length >= 24) return;
    if (typeof value === 'string') {
      if (isProse(value)) out.push({ path, key: path.join('.'), label: labelFor(path), long: value.length > 60 || value.includes('\n') });
      return;
    }
    if (Array.isArray(value)) { value.forEach((v, i) => walk(v, [...path, i], key)); return; }
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (!NOT_WORDS.has(k) && !/(Ms|At|Frac|Px|W|H)$/.test(k)) walk(v, [...path, k], k);
  };
  for (const [k, v] of Object.entries(event)) {
    if (NOT_WORDS.has(k) || ['fromMs', 'toMs', 'tShift', 'data'].includes(k)) continue;
    walk(v, [k], k);
  }
  if (event.data && typeof event.data === 'object') for (const [k, v] of Object.entries(event.data)) if (!NOT_WORDS.has(k)) walk(v, k === event.kind ? ['data', k] : ['data', k], k);
  return out;
}

function labelFor(path) {
  const words = path.filter((p) => typeof p === 'string' && p !== 'data' && !p.startsWith('holo-') && !/^[a-z]+-[a-z-]+$/.test(p));
  const numbers = path.filter((p) => typeof p === 'number');
  const name = (words.at(-1) ?? 'Text').replace(/([a-z])([A-Z])/g, '$1 $2');
  const one = numbers.length && /[^s]s$/.test(name) ? name.slice(0, -1) : name; // lines 1 reads as Line 1
  const nice = one.charAt(0).toUpperCase() + one.slice(1);
  return numbers.length ? `${nice} ${numbers.map((n) => n + 1).join('.')}` : nice;
}

const kindName = (kind) => String(kind ?? 'card').replace(/^holo-(?:[a-z]-)?/, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

// The chain Overlay walks to keep a hand-over's entrance clock: the events a callback continues, newest first.
export function chainOf(ev, events) {
  const out = [];
  for (let cur = ev; cur?.callback;) {
    const prev = events.find((e) => e.toMs === cur.fromMs && e.id !== cur.id && (e.id === cur.callback || e.kind === cur.kind));
    if (!prev) break;
    out.push({ id: prev.id, kind: prev.kind, fromMs: prev.fromMs, toMs: prev.toMs, callback: prev.callback, card: prev.card });
    cur = prev;
  }
  return out;
}

export function cardItem(ev, events, { fps, meta, captionStyle: st, hook, soft }) {
  const from = Math.max(0, frameAt(ev.fromMs, fps));
  const to = frameAt(ev.toMs, fps);
  if (to <= from) return { item: null, problems: [] };
  const { event, problems } = rewriteEvent(ev, meta);
  const fields = wordFields(event);
  const first = fields.map((f) => getIn(event, f.path)).find(Boolean);
  const name = first ? String(first).replace(/\s+/g, ' ').slice(0, 48) : kindName(ev.kind);
  return {
    item: {
      id: `card-${ev.id}`,
      track: 'graphics',
      type: 'layer',
      renderer: soft ? 'talking-head/soft' : 'talking-head/card',
      from,
      durationInFrames: to - from,
      trimStart: 0,
      label: `${hook ? 'Hook: ' : ''}${name}`,
      data: { event, chain: chainOf(ev, events), clockFrame: from, captionStyle: st, fields, hook: Boolean(hook) },
    },
    problems,
  };
}

export function getIn(obj, path) { return path.reduce((o, k) => (o == null ? undefined : o[k]), obj); }
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  copy[head] = setIn(copy[head], rest, value);
  return copy;
}

// ---------------------------------------------------------------------------------------------------------------
// Which card kinds the installed engine draws. Overlay draws a kind it does not know as its default chart, which
// crashes on a card built for a newer engine and takes the whole render down with it. The engine's own source says
// what it knows: the kinds Overlay names, and the keys of every card registry it looks kinds up in. A card the
// engine lacks is marked, so the editor shows a placeholder and the export check can name it instead of crashing.

const ENGINE = 'engine/talking-head/remotion/src';

export function kindsFromSource({ overlay, soft, registries }) {
  if (!overlay) return null;
  const known = new Set(['growth', 'shot', 'float', 'cta']);
  for (const m of overlay.matchAll(/ev\.kind === "([^"]+)"/g)) known.add(m[1]);
  for (const m of String(soft ?? '').matchAll(/case "([^"]+)"/g)) known.add(m[1]);
  // The registries Overlay imports and actually looks kinds up in.
  const lookup = overlay.match(/const Lock = ([^;]+);/)?.[1] ?? '';
  const used = [...overlay.matchAll(/import \{ (\w+_KINDS) \} from "\.\/cards\/([\w-]+)"/g)].filter((m) => lookup.includes(`${m[1]}[`)).map((m) => m[2]);
  for (const dir of used) {
    for (const text of registries?.[dir] ?? []) {
      for (const block of text.matchAll(/KINDS[^=\n]*=\s*\{([\s\S]*?)\n?\};/g)) for (const k of block[1].matchAll(/"([^"]+)"\s*:/g)) known.add(k[1]);
    }
  }
  return known;
}

export function engineKinds(context) {
  const text = (path) => readText(context, path);
  const overlay = context.exists(`${ENGINE}/Overlay.tsx`) ? text(`${ENGINE}/Overlay.tsx`) : null;
  if (!overlay) return null;
  const registries = {};
  for (const m of overlay.matchAll(/from "\.\/cards\/([\w-]+)"/g)) {
    const dir = `${ENGINE}/cards/${m[1]}`;
    registries[m[1]] = context.list(dir).filter((f) => /\.tsx?$/.test(f)).map((f) => text(`${dir}/${f}`) ?? '');
  }
  return kindsFromSource({ overlay, soft: text(`${ENGINE}/soft/SoftOverlay.tsx`), registries });
}

// Cards in a document the installed engine cannot draw: for the export check.
export const cardsTheEngineLacks = (doc) => (doc.items ?? []).filter((i) => i.type === 'layer' && i.renderer?.startsWith('talking-head/') && i.data?.engineMissing).map((i) => ({ id: i.id, kind: i.data.event?.kind, label: i.label }));

// ---------------------------------------------------------------------------------------------------------------
// Sounds. A cue names a sound of the shipped palette by id; the hook mixer sets each one's own 10 ms peak a fixed
// number of dB under the voice around it, so the level is measured here the same way when ffmpeg is at hand.

export function peakDb(x, a0, b0) {
  a0 = Math.max(0, Math.trunc(a0 * 48)); b0 = Math.trunc(b0 * 48);
  const w = 480;
  const end = Math.min(b0, x.length);
  if (end - a0 < w) return -60;
  let best = 0;
  for (let i = a0; i + w <= end; i += w) {
    let s = 0;
    for (let j = i; j < i + w; j++) s += x[j] * x[j];
    best = Math.max(best, Math.sqrt(s / w));
  }
  return 20 * Math.log10(best + 1e-9);
}

function percentile(values, q) {
  const v = [...values].sort((a, b) => a - b);
  if (!v.length) return -60;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}

export function speechLevel(voice) {
  const durMs = Math.trunc((voice.length / 48000) * 1000);
  const peaks = [];
  for (let t = 0; t < durMs - 300; t += 300) peaks.push(peakDb(voice, t, t + 300));
  return percentile(peaks, 0.75);
}

export function hookGain({ voice, speech, sound, startMs, target }) {
  const own = peakDb(sound, 0, sound.length / 48);
  const v = Math.max(peakDb(voice, startMs - 200, startMs + sound.length / 48 + 200), speech - 3);
  return 10 ** ((v + target - own) / 20) * SFX_LEVEL;
}

function decoder(root) {
  const candidates = [join(root, 'node_modules', 'ffmpeg-static', 'ffmpeg'), 'ffmpeg'];
  const bin = candidates.find((c) => c === 'ffmpeg' || existsSync(c));
  return (file) => {
    const run = spawnSync(bin, ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
    if (run.status !== 0 || !run.stdout?.length) return null;
    const buf = run.stdout;
    return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
  };
}

function sfxCatalog(context) {
  const shipped = context.readJson('assets/talking-head/sfx/sfx.json', null);
  const byId = new Map();
  for (const s of shipped?.sounds ?? []) byId.set(s.id, s);
  return byId;
}

function soundFile(context, id, catalog, projectPath) {
  const entry = catalog.get(id);
  const names = [entry?.file, ...AUDIO_EXT.map((e) => `${id}${e}`)].filter(Boolean);
  for (const dir of [...SFX_DIRS, `${projectPath}/sfx`]) for (const name of names) if (context.exists(`${dir}/${name}`)) return `${dir}/${name}`;
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Markers: every spoken word's start, moved from the take's clock onto the cut's through spine-map.json.

export function wordMarkers(wordsText, spine, fps) {
  if (!wordsText || !spine?.segments) return [];
  const out = [];
  for (const line of String(wordsText).split(/\r?\n/)) {
    if (!line.trim()) continue;
    let w;
    try { w = JSON.parse(line); } catch { continue; }
    const start = w.start ?? w.startMs;
    if (!Number.isFinite(start)) continue;
    const seg = spine.segments.find((s) => start >= s.srcInMs && start < s.srcOutMs);
    if (!seg) continue;
    out.push({ frame: nearFrame(seg.spineInMs + (start - seg.srcInMs), fps), kind: 'cue', label: String(w.text ?? '').trim() });
  }
  const seen = new Set();
  return out.filter((m) => (seen.has(m.frame) ? false : seen.add(m.frame))).sort((a, b) => a.frame - b.frame);
}

// ---------------------------------------------------------------------------------------------------------------
// The document.

function placeAudio(tracks, items, item) {
  const sounds = tracks.filter((t) => t.kind === 'audio');
  for (const track of sounds) {
    const clash = items.some((o) => o.track === track.id && item.from < o.from + o.durationInFrames && o.from < item.from + item.durationInFrames);
    if (!clash) return track.id;
  }
  const track = { id: `sounds-${sounds.length + 1}`, name: `Sounds ${sounds.length + 1}`, kind: 'audio' };
  tracks.push(track);
  return track.id;
}

export async function read(context) {
  const rel = context.project.path;
  const captions = context.readJson(`${rel}/captions.json`, null);
  if (!captions || !context.exists(`${rel}/master.mp4`)) return null; // nothing cut yet: the finished video opens instead
  const spine = context.readJson(`${rel}/spine-map.json`, null);
  const fps = captions.fps ?? spine?.fps ?? 30;
  const width = captions.width ?? 1080;
  const height = captions.height ?? 1920;
  const st = captions.style ?? {};
  const style = captionStyle(st);
  const notes = [];

  const tracks = [
    { id: 'captions', name: 'Captions', kind: 'visual', keep: true },
    { id: 'graphics', name: 'Graphics', kind: 'visual', keep: true },
  ];
  const items = [];

  // The cut.
  const info = await context.probe(`${rel}/master.mp4`).catch(() => null);
  const videoFrames = Math.max(1, Math.round((info?.duration ?? (captions.durationMs ?? 0) / 1000) * fps));
  const total = Math.max(1, Math.min(videoFrames, frameAt(captions.durationMs ?? videoFrames * (1000 / fps), fps)));
  items.push({
    id: 'master', track: 'video', type: 'video', label: 'Talking head', from: 0, durationInFrames: total, trimStart: 0,
    src: `${rel}/master.mp4`, ...(context.exists(`${rel}/master-proxy.mp4`) ? { preview: `${rel}/master-proxy.mp4` } : {}),
    sourceDurationInFrames: videoFrames, volume: 1,
  });

  // Captions and titles.
  let hasTitle = false;
  // Older videos have pages that start before the one before them ends. The render shows the earlier page until it
  // ends, so the later one starts there, and is dropped when nothing of it is left.
  let shownUntil = -Infinity;
  (captions.pages ?? []).forEach((page, i) => {
    if (page.type === 'title') {
      const item = titleItem(page, i, fps, st, 'assets/');
      if (item) { items.push(item); hasTitle = true; }
      return;
    }
    if (page.fromMs < shownUntil) page = { ...page, fromMs: shownUntil };
    shownUntil = Math.max(shownUntil, page.toMs);
    const item = captionItem(page, i, fps, style);
    if (item) items.push(item);
  });

  // Cards and hook visuals. visuals.json is what the render drew; the hook files add any event it does not carry.
  const meta = context.readJson(`${rel}/assets/meta.json`, {}) ?? {};
  const events = [...(context.readJson(`${rel}/visuals.json`, null)?.events ?? [])];
  const hookIds = new Set();
  for (const name of context.list(rel).filter((f) => /^visuals\.hook.*\.json$/.test(f))) {
    for (const ev of context.readJson(`${rel}/${name}`, null)?.events ?? []) {
      hookIds.add(ev.id);
      if (!events.some((e) => e.id === ev.id)) events.push(ev);
    }
  }
  events.sort((a, b) => a.fromMs - b.fromMs);
  const soft = lookOf(st) === 'talking-head/creator-format-2';
  const known = engineKinds(context);
  for (const ev of events) {
    const { item, problems } = cardItem(ev, events, { fps, meta, captionStyle: st, hook: hookIds.has(ev.id), soft });
    notes.push(...problems.map((p) => `${ev.id}: ${p}`));
    if (!item) continue;
    if (known && !known.has(ev.kind)) {
      item.data.engineMissing = true;
      // The universal flag: the export leaves it out and says so, whatever format made it.
      item.missing = 'drawn by a newer Talking Head engine';
      notes.push(`${ev.id}: the installed Talking Head engine does not draw ${ev.kind}`);
    }
    // Two events never share a frame in the format's own render; if a hand-made file does, the later one goes up a row.
    const clash = items.some((o) => o.track === 'graphics' && item.from < o.from + o.durationInFrames && o.from < item.from + item.durationInFrames);
    if (clash) {
      if (!tracks.some((t) => t.id === 'graphics-2')) tracks.splice(tracks.findIndex((t) => t.id === 'graphics'), 0, { id: 'graphics-2', name: 'Graphics 2', kind: 'visual' });
      item.track = 'graphics-2';
    }
    items.push(item);
  }

  if (hasTitle) tracks.push({ id: 'text', name: 'Text', kind: 'visual', keep: true });
  tracks.push({ id: 'video', name: 'Video', kind: 'visual', keep: true });
  tracks.push({ id: 'sounds', name: 'Sounds', kind: 'audio', keep: true });

  // Sounds.
  const catalog = sfxCatalog(context);
  const decode = context.root ? decoder(context.root) : null;
  let voice = null;
  let speech = null;
  const cueFiles = context.list(rel).filter((f) => /^sfx-(hook|bridge|body).*\.json$/.test(f));
  for (const name of cueFiles) {
    const body = name.startsWith('sfx-body');
    const cues = context.readJson(`${rel}/${name}`, null)?.cues ?? [];
    for (const [n, cue] of cues.entries()) {
      const id = cue.id;
      const src = id ? soundFile(context, id, catalog, rel) : null;
      if (!src) { notes.push(`${name}: sound ${id ?? cue.file} is not in this folder`); continue; }
      const entry = catalog.get(id) ?? {};
      const startMs = cue.at - (cue.start ? 0 : (entry.peakOffsetMs ?? 0));
      const probe = await context.probe(src).catch(() => null);
      const lengthMs = probe?.duration ? probe.duration * 1000 : entry.ms ?? 500;
      let volume;
      if (body) volume = SFX_LEVEL * (entry.presence ?? 0.5) * (cue.gain ?? 1);
      else {
        const target = cue.target ?? FAMILY_TARGET[entry.family] ?? -11;
        volume = null;
        if (decode) {
          voice ??= decode(join(context.root, `${rel}/master.mp4`));
          if (voice) {
            speech ??= speechLevel(voice);
            const sound = decode(join(context.root, src));
            if (sound) volume = hookGain({ voice, speech, sound, startMs, target });
          }
        }
        if (volume == null) volume = SFX_LEVEL * (entry.presence ?? 0.5);
      }
      const startFrame = nearFrame(startMs, fps);
      const sourceFrames = Math.max(1, Math.ceil((lengthMs * fps) / 1000));
      const trimStart = startFrame < 0 ? -startFrame : 0;
      const item = {
        id: `sfx-${name.replace(/\.json$/, '')}-${n}`, type: 'audio', label: entry.title ?? id,
        from: Math.max(0, startFrame), durationInFrames: Math.max(1, sourceFrames - trimStart), trimStart,
        src, sourceDurationInFrames: sourceFrames, volume: Math.round(volume * 10000) / 10000,
      };
      item.track = placeAudio(tracks, items, item);
      items.push(item);
    }
  }

  const markers = wordMarkers(context.exists(`${rel}/words.json`) ? readText(context, `${rel}/words.json`) : null, spine, fps);
  return { fps, width, height, background: '#000000', tracks, items, markers, source: { notes, files: { captions: `${rel}/captions.json`, visuals: `${rel}/visuals.json` } } };
}

// words.json is one JSON object per line, which readJson cannot parse.
function readText(context, path) {
  if (typeof context.readText === 'function') return context.readText(path);
  if (!context.root) return null;
  try { return readFileSync(join(context.root, path), 'utf8'); } catch { return null; }
}
