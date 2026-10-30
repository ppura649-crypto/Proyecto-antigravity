let doc, peaks, words = [], sel = -1, playing = false, pps = 64;
const video = document.getElementById('video');
const strip = document.getElementById('strip');
const playhead = document.getElementById('playhead');

const kept = () => doc.clips.filter(c => c.keep);
const byId = (id) => doc.clips.find(c => c.id === id);
const durS = (c) => ((c.outMs - c.inMs) / 1000).toFixed(1);
const msToBucket = (ms) => Math.floor(ms / peaks.bucketMs);
const cardW = (c) => Math.max(56, (c.outMs - c.inMs) / 1000 * pps);

function movePlayhead(tMs) {
  const ks = kept();
  let x = 0, placed = false;
  for (const c of ks) {
    const w = cardW(c) + 6;
    if (tMs < c.inMs) { placed = true; break; }
    if (tMs <= c.outMs) { x += (tMs - c.inMs) / (c.outMs - c.inMs) * (w - 6); placed = true; break; }
    x += w;
  }
  if (!placed) { playhead.style.display = 'none'; return; }
  playhead.style.display = 'block';
  playhead.style.left = x + 'px';
  if (!video.paused) {
    const tl = document.getElementById('timeline');
    if (x < tl.scrollLeft + 40 || x > tl.scrollLeft + tl.clientWidth - 120)
      tl.scrollTo({ left: Math.max(0, x - tl.clientWidth * 0.3) });
  }
}

async function boot() {
  doc = await (await fetch('cuts.json')).json();
  window.baseLm = (await (await fetch('/cuts-meta')).json()).lm;
  peaks = await (await fetch('peaks.json')).json();
  words = (await (await fetch('words.json')).text()).split('\n').filter(Boolean).map(JSON.parse);
  document.getElementById('zoom').oninput = (e) => { pps = Number(e.target.value); layout(); };
  document.getElementById('save').onclick = save;
  document.addEventListener('keydown', keys);
  video.addEventListener('timeupdate', tick);
  video.addEventListener('seeked', () => movePlayhead(video.currentTime * 1000));
  const loop = () => { if (!video.paused) movePlayhead(video.currentTime * 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  layout();
  const first = kept()[0]; if (first) select(first.id);
}

function layout() {
  strip.querySelectorAll('.clip').forEach(e => e.remove());
  kept().forEach(c => strip.appendChild(card(c)));
  drawerList(); stats();
}

function card(c) {
  const el = document.createElement('div');
  el.className = 'clip' + (c.kind === 'hook' ? ' hook' : c.kind === 'cta' ? ' cta' : '') + (c.id === sel ? ' sel' : '');
  el.id = 'clip' + c.id;
  el.style.width = cardW(c) + 'px';
  const pos = kept().indexOf(c) + 1;
  el.innerHTML = `<div class="top"><span><b>${pos}</b>${c.kind && c.kind !== 'body' ? ' ' + c.kind : ''}</span>` +
    `<span class="dur">${durS(c)}s</span></div>` +
    `<canvas></canvas><div class="txt">${c.text}</div><div class="h l"></div><div class="h r"></div>`;
  el.onclick = (e) => {
    if (e.target.closest('.h')) return;
    const r = el.getBoundingClientRect();
    const ms = c.inMs + (e.clientX - r.left) / r.width * (c.outMs - c.inMs);
    video.currentTime = ms / 1000;
    movePlayhead(ms);
    select(c.id);
  };
  wave(el.querySelector('canvas'), c);
  edgeHandle(el.querySelector('.h.l'), c, 'l', el);
  edgeHandle(el.querySelector('.h.r'), c, 'r', el);
  return el;
}

function wave(cv, c) {
  const w = cardW(c), h = 86;
  cv.width = w * devicePixelRatio; cv.height = h * devicePixelRatio;
  const g = cv.getContext('2d'); g.scale(devicePixelRatio, devicePixelRatio);
  g.clearRect(0, 0, w, h);
  const b0 = msToBucket(c.inMs), b1 = msToBucket(c.outMs), n = Math.max(1, b1 - b0);
  g.fillStyle = 'rgba(57,211,83,0.75)';
  const bw = Math.max(1, w / n - 0.5);
  for (let i = 0; i < n; i++) {
    const v = peaks.peaks[b0 + i] || 0;
    const bh = Math.max(1, Math.pow(v, 0.7) * (h - 6));
    g.fillRect((i / n) * w, (h - bh) / 2, bw, bh);
  }
}

function edgeHandle(el, c, side, cardEl) {
  el.onpointerdown = (e) => {
    e.preventDefault(); e.stopPropagation();
    el.setPointerCapture(e.pointerId); el.classList.add('drag');
    const x0 = e.clientX, in0 = c.inMs, out0 = c.outMs;
    const i = doc.clips.indexOf(c);
    const lo = i > 0 ? doc.clips[i - 1].outMs : 0;
    const hi = i < doc.clips.length - 1 ? doc.clips[i + 1].inMs : doc.sourceDurationMs;
    el.onpointermove = (ev) => {
      const dms = (ev.clientX - x0) / pps * 1000;
      if (side === 'l') c.inMs = Math.round(Math.min(Math.max(in0 + dms, lo), c.outMs - 150));
      else c.outMs = Math.round(Math.max(Math.min(out0 + dms, hi), c.inMs + 150));
      cardEl.style.width = cardW(c) + 'px';
      cardEl.querySelector('.dur').textContent = durS(c) + 's';
      wave(cardEl.querySelector('canvas'), c);
    };
    el.onpointerup = () => { el.onpointermove = null; el.classList.remove('drag'); stats(); };
  };
}

function splitAtPlayhead() {
  const t = Math.round(video.currentTime * 1000);
  const c = kept().find(c => t > c.inMs + 80 && t < c.outMs - 80);
  if (!c) return;
  const mid = (w) => (w.start + w.end) / 2;
  const cw = words.filter(w => mid(w) >= c.inMs && mid(w) < c.outMs);
  const wa = cw.filter(w => mid(w) < t), wb = cw.filter(w => mid(w) >= t);
  const b = { ...c, id: Math.max(...doc.clips.map(x => x.id)) + 1, inMs: t, outMs: c.outMs };
  c.outMs = t;
  if (wa.length) { c.wordStart = wa[0].start; c.wordEnd = wa[wa.length - 1].end; c.text = wa.map(w => w.text).join(' '); }
  if (wb.length) { b.wordStart = wb[0].start; b.wordEnd = wb[wb.length - 1].end; b.text = wb.map(w => w.text).join(' '); }
  doc.clips.splice(doc.clips.indexOf(c) + 1, 0, b);
  layout(); select(b.id);
}

function select(id) {
  const prev = document.getElementById('clip' + sel);
  if (prev) prev.classList.remove('sel');
  sel = id;
  const el = document.getElementById('clip' + id);
  if (el) { el.classList.add('sel'); el.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
}

function tick() {
  if (!playing) return;
  const t = video.currentTime * 1000;
  const ks = kept();
  let cur = ks.find(c => t >= c.inMs - 20 && t < c.outMs);
  if (!cur) {
    const nxt = ks.find(c => c.inMs > t - 20);
    if (nxt) { video.currentTime = nxt.inMs / 1000; cur = nxt; }
    else { video.pause(); playing = false; return; }
  }
  if (cur.id !== sel) select(cur.id);
}

function toggleKeep(id) {
  const c = byId(id); if (!c) return;
  c.keep = !c.keep;
  if (!c.keep && sel === id) { const ks = kept(); sel = ks.length ? ks[0].id : -1; }
  layout();
}

function drawerList() {
  const dl = document.getElementById('dlist');
  const dropped = doc.clips.filter(c => !c.keep);
  document.querySelector('#drawer summary').textContent = `dropped clips (${dropped.length})`;
  dl.innerHTML = '';
  dropped.forEach(c => {
    const d = document.createElement('div');
    d.className = 'drow';
    d.innerHTML = `<span></span><span>${c.takeGroup ? 'T' + c.takeGroup : ''}</span>` +
      `<span class="t">${c.text}</span><span>${durS(c)}s</span><button class="restore">restore</button>`;
    d.querySelector('.restore').onclick = () => { c.keep = true; layout(); };
    dl.appendChild(d);
  });
}

function stats() {
  const secs = kept().reduce((a, c) => a + c.outMs - c.inMs, 0) / 1000;
  document.getElementById('stats').textContent = `${kept().length} clips · ${secs.toFixed(1)}s`;
  document.getElementById('dur').textContent = secs.toFixed(1) + 's';
}

function keys(e) {
  if (e.target.tagName === 'INPUT') return;
  const ks = kept(); const idx = ks.findIndex(c => c.id === sel);
  if (e.code === 'Space') { e.preventDefault(); if (video.paused) { playing = true; video.play(); } else { video.pause(); playing = false; } }
  else if (e.key === 'ArrowRight') { e.preventDefault(); if (idx < ks.length - 1) { select(ks[idx + 1].id); video.currentTime = ks[idx + 1].inMs / 1000; } }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (idx > 0) { select(ks[idx - 1].id); video.currentTime = ks[idx - 1].inMs / 1000; } }
  else if (e.key === 'Enter') { const c = byId(sel); if (c) { video.currentTime = c.inMs / 1000; playing = true; video.play(); } }
  else if (e.key.toLowerCase() === 'c') { e.preventDefault(); splitAtPlayhead(); }
  else if (e.key === 'k' || e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); if (sel >= 0) toggleKeep(sel); }
}

async function save() {
  const r = await fetch('/save', { method: 'POST', headers: { 'x-base-lm': window.baseLm || '' }, body: JSON.stringify(doc) });
  if (r.status === 409) { alert('cuts.json changed on disk (another edit). Refresh the page to load it, then redo your change.'); return; }
  if (r.ok) window.baseLm = (await r.json()).lm;
  document.getElementById('saved').textContent = r.ok ? 'saved ✓' : 'save failed';
  setTimeout(() => (document.getElementById('saved').textContent = ''), 2500);
}
boot();
