// geometry.mjs: where things sit on the frame, and how a hand moves them. Pure, so it is tested with node --test and
// shared by the stage (which draws the handles) and Edit.tsx (which draws the item).
//
// Every visual item draws itself somewhere on the frame (its base box, in frame pixels), then its transform moves it:
// a point p of the drawing lands at D(p) = o + t + R(rotation) * scale * (p - o), where o is the origin and t the
// offset (x, y). That is exactly the CSS the composition writes: translate(x, y) rotate(r) scale(s) about o. The stage
// measures the base box once per frame and works out everything else from the transform, so handles follow a drag with
// no lag and a rotated item keeps a rotated box.

export const IDENTITY = Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
export const SAFE = Object.freeze({ top: 0.115, bottom: 0.2, right: 0.14 });
const RAD = Math.PI / 180;

export const full = (t) => ({ ...IDENTITY, ...(t ?? {}) });
export const originOf = (t, doc) => ({ x: t.originX ?? doc.width / 2, y: t.originY ?? doc.height / 2 });

// A point of the drawing to where it shows on the frame, and back.
export function apply(t, doc, p) {
  t = full(t);
  const o = originOf(t, doc);
  const c = Math.cos(t.rotation * RAD), s = Math.sin(t.rotation * RAD);
  const dx = (p.x - o.x) * t.scale, dy = (p.y - o.y) * t.scale;
  return { x: o.x + t.x + dx * c - dy * s, y: o.y + t.y + dx * s + dy * c };
}
export function invert(t, doc, q) {
  t = full(t);
  const o = originOf(t, doc);
  const c = Math.cos(-t.rotation * RAD), s = Math.sin(-t.rotation * RAD);
  const dx = q.x - o.x - t.x, dy = q.y - o.y - t.y;
  return { x: o.x + (dx * c - dy * s) / t.scale, y: o.y + (dx * s + dy * c) / t.scale };
}
// A vector (a drag) seen from inside the drawing: turned back and shrunk by the scale.
export function toLocal(t, v) {
  t = full(t);
  const c = Math.cos(-t.rotation * RAD), s = Math.sin(-t.rotation * RAD);
  return { x: (v.x * c - v.y * s) / t.scale, y: (v.x * s + v.y * c) / t.scale };
}

export const corners = (b) => [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
export const center = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

// Where the box shows: its turned corners, its middle, its size, and the upright box around it.
export function placed(box, t, doc) {
  t = full(t);
  const quad = corners(box).map((p) => apply(t, doc, p));
  const xs = quad.map((p) => p.x), ys = quad.map((p) => p.y);
  const bounds = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  return { quad, center: apply(t, doc, center(box)), w: box.w * t.scale, h: box.h * t.scale, rotation: t.rotation, bounds };
}

export function contains(box, t, doc, point) {
  const p = invert(t, doc, point);
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

// Move the origin to a new point without moving anything on screen: o + t stays put for the new origin once the
// offset takes up the difference, t' = t + (I - M)(o - o').
export function reorigin(t, doc, next) {
  t = full(t);
  const o = originOf(t, doc);
  const c = Math.cos(t.rotation * RAD), s = Math.sin(t.rotation * RAD);
  const dx = o.x - next.x, dy = o.y - next.y;
  const mx = (dx * c - dy * s) * t.scale, my = (dx * s + dy * c) * t.scale;
  return { ...t, x: t.x + dx - mx, y: t.y + dy - my, originX: next.x, originY: next.y };
}

const round = (v, step = 1) => Math.round(v / step) * step;
export const tidy = (t) => ({ ...t, x: round(t.x, 0.5), y: round(t.y, 0.5), scale: round(t.scale, 0.001), rotation: round(t.rotation, 0.1), ...(t.originX != null ? { originX: round(t.originX, 0.5), originY: round(t.originY, 0.5) } : {}) });

// ---------------------------------------------------------------------------------------------------------------
// Snapping a moved box. Ported in spirit from HyperFrames Studio's snapEngine (Apache 2.0): a few screen pixels of
// pull, the nearest target per axis wins, and nothing snaps until the hand has really moved.

export const SNAP_SCREEN_PX = 6;
export const ENGAGE_PX = 4;

// The lines a box can snap to: the frame's edges and middle, the safe zone's edges when shown, and every other item's
// edges and middle.
export function snapLines(doc, others = [], { safe = false } = {}) {
  const W = doc.width, H = doc.height;
  const x = [{ at: 0, kind: 'frame' }, { at: W / 2, kind: 'center' }, { at: W, kind: 'frame' }];
  const y = [{ at: 0, kind: 'frame' }, { at: H / 2, kind: 'center' }, { at: H, kind: 'frame' }];
  if (safe) {
    x.push({ at: W * (1 - SAFE.right), kind: 'safe' });
    y.push({ at: H * SAFE.top, kind: 'safe' }, { at: H * (1 - SAFE.bottom), kind: 'safe' });
  }
  for (const b of others) {
    x.push({ at: b.x, kind: 'item' }, { at: b.x + b.w / 2, kind: 'item' }, { at: b.x + b.w, kind: 'item' });
    y.push({ at: b.y, kind: 'item' }, { at: b.y + b.h / 2, kind: 'item' }, { at: b.y + b.h, kind: 'item' });
  }
  return { x, y };
}

function nearest(edges, lines, radius) {
  let best = null;
  for (const edge of edges) for (const line of lines) {
    const d = line.at - edge;
    if (Math.abs(d) <= radius && (!best || Math.abs(d) < Math.abs(best.d) - 1e-6 || (Math.abs(Math.abs(d) - Math.abs(best.d)) < 1e-6 && line.kind === 'center'))) best = { d, line };
  }
  return best;
}

// bounds: the upright box of what moves, before the move. dx, dy: the move in frame pixels. radius: frame pixels.
// Returns the move adjusted onto the nearest line per axis, and the lines to draw.
export function snapMove(bounds, dx, dy, lines, radius) {
  const b = { x: bounds.x + dx, y: bounds.y + dy, w: bounds.w, h: bounds.h };
  const guides = [];
  const sx = nearest([b.x, b.x + b.w / 2, b.x + b.w], lines.x, radius);
  const sy = nearest([b.y, b.y + b.h / 2, b.y + b.h], lines.y, radius);
  if (sx) { dx += sx.d; guides.push({ axis: 'x', at: sx.line.at, kind: sx.line.kind }); }
  if (sy) { dy += sy.d; guides.push({ axis: 'y', at: sy.line.at, kind: sy.line.kind }); }
  return { dx, dy, guides };
}

// ---------------------------------------------------------------------------------------------------------------
// Scaling from a corner. The opposite corner stays where it is (or the middle, with Alt), and the pull is measured
// along the diagonal, so the hand can wander and the size still follows it smoothly.

const OPPOSITE = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };
export const cornerPoint = (b, c) => ({ x: c.includes('w') ? b.x : b.x + b.w, y: c.includes('n') ? b.y : b.y + b.h });

export function scaleFromCorner(box, t, doc, corner, pointer, { fromCenter = false, min = 0.02, max = 20 } = {}) {
  t = full(t);
  const anchor = fromCenter ? center(box) : cornerPoint(box, OPPOSITE[corner]);
  const handle = cornerPoint(box, corner);
  const A = apply(t, doc, anchor);
  const diag = { x: handle.x - anchor.x, y: handle.y - anchor.y };
  const len2 = diag.x * diag.x + diag.y * diag.y;
  if (len2 < 1e-6) return t;
  const local = toLocal({ ...t, scale: 1 }, { x: pointer.x - A.x, y: pointer.y - A.y });
  const next = Math.max(min, Math.min(max, (local.x * diag.x + local.y * diag.y) / len2));
  return keepPoint(t, doc, anchor, next);
}

// Change the scale while one point of the drawing stays where it shows: t' = t + R (s - s')(q - o).
export function keepPoint(t, doc, q, scale) {
  t = full(t);
  const o = originOf(t, doc);
  const c = Math.cos(t.rotation * RAD), s = Math.sin(t.rotation * RAD);
  const k = t.scale - scale;
  const vx = (q.x - o.x) * k, vy = (q.y - o.y) * k;
  return { ...t, scale, x: t.x + vx * c - vy * s, y: t.y + vx * s + vy * c };
}

// ---------------------------------------------------------------------------------------------------------------
// Turning. Degrees in (-180, 180], pulled onto 0 and the quarter turns within a few degrees; Shift steps by 15.

export function normalizeAngle(a) {
  a = ((a % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}
export function snapAngle(a, { step = 0, pull = 4 } = {}) {
  a = normalizeAngle(a);
  if (step) return normalizeAngle(Math.round(a / step) * step);
  for (const target of [-180, -90, 0, 90, 180]) if (Math.abs(a - target) <= pull) return target === -180 ? 180 : target;
  return a;
}
export const angleOf = (c, p) => Math.atan2(p.y - c.y, p.x - c.x) / RAD;

// ---------------------------------------------------------------------------------------------------------------
// Pictures and clips. The box a picture or clip draws, the same rule Edit.tsx uses: its size centred on the frame,
// or the whole frame when it has none. A crop keeps the box and hides its edges, stored as fractions.

export function mediaBox(item, doc) {
  const size = item.size ?? (item.type === 'image' ? { w: doc.width * 0.6, h: doc.height * 0.4 } : { w: doc.width, h: doc.height });
  return { x: (doc.width - size.w) / 2, y: (doc.height - size.h) / 2, w: size.w, h: size.h };
}
export const NO_CROP = Object.freeze({ l: 0, t: 0, r: 0, b: 0 });
export function cropBox(box, crop) {
  const c = { ...NO_CROP, ...(crop ?? {}) };
  return { x: box.x + box.w * c.l, y: box.y + box.h * c.t, w: box.w * (1 - c.l - c.r), h: box.h * (1 - c.t - c.b) };
}
export const hasCrop = (crop) => Boolean(crop && (crop.l || crop.t || crop.r || crop.b));

// Pull one crop edge (n, s, e, w or a corner) by a move measured inside the drawing, in frame pixels. At least a
// tenth of the picture always shows.
export function dragCrop(crop, handle, local, box, keep = 0.1) {
  const c = { ...NO_CROP, ...(crop ?? {}) };
  const fx = local.x / box.w, fy = local.y / box.h;
  const clamp = (v, hi) => Math.max(0, Math.min(hi, v));
  if (handle.includes('w')) c.l = clamp(c.l + fx, 1 - keep - c.r);
  if (handle.includes('e')) c.r = clamp(c.r - fx, 1 - keep - c.l);
  if (handle.includes('n')) c.t = clamp(c.t + fy, 1 - keep - c.b);
  if (handle.includes('s')) c.b = clamp(c.b - fy, 1 - keep - c.t);
  const r4 = (v) => Math.round(v * 10000) / 10000;
  return { l: r4(c.l), t: r4(c.t), r: r4(c.r), b: r4(c.b) };
}

// Free resize of a picture or clip (Shift on a corner): the size changes and the opposite corner of what shows stays.
export function resizeMedia(item, doc, t, corner, pointer) {
  t = full(t);
  const base = mediaBox(item, doc);
  const shown = cropBox(base, item.crop);
  const anchor = cornerPoint(shown, OPPOSITE[corner]);
  const A = apply(t, doc, anchor);
  const local = toLocal(t, { x: pointer.x - A.x, y: pointer.y - A.y });
  const kx = Math.max(0.02, Math.abs(local.x) / shown.w), ky = Math.max(0.02, Math.abs(local.y) / shown.h);
  const size = { w: Math.round(base.w * kx), h: Math.round(base.h * ky) };
  const nextShown = cropBox(mediaBox({ ...item, size }, doc), item.crop);
  const nextAnchor = cornerPoint(nextShown, OPPOSITE[corner]);
  // Keep the anchor where it shows: the offset takes up how far the anchor moved inside the drawing.
  const c = Math.cos(t.rotation * RAD), s = Math.sin(t.rotation * RAD);
  const vx = (anchor.x - nextAnchor.x) * t.scale, vy = (anchor.y - nextAnchor.y) * t.scale;
  return { size, transform: { ...t, x: t.x + vx * c - vy * s, y: t.y + vx * s + vy * c } };
}

// How a new clip or picture first sits: a clip fills the frame when its shape matches, otherwise fits inside it; a
// picture takes 70 percent of the width.
export function fitNew(kind, natural, doc) {
  const W = doc.width, H = doc.height;
  if (!natural?.w || !natural?.h) return kind === 'image' ? { w: Math.round(W * 0.7), h: Math.round(W * 0.7) } : { w: W, h: H };
  const aspect = natural.w / natural.h;
  if (kind === 'video') {
    if (Math.abs(aspect - W / H) / (W / H) < 0.02) return { w: W, h: H };
    const k = Math.min(W / natural.w, H / natural.h);
    return { w: Math.round(natural.w * k), h: Math.round(natural.h * k) };
  }
  let w = W * 0.7, h = w / aspect;
  if (h > H * 0.8) { h = H * 0.8; w = h * aspect; }
  return { w: Math.round(w), h: Math.round(h) };
}

// ---------------------------------------------------------------------------------------------------------------
// Time typed by a person. "1:04.12" is one minute, four seconds and twelve frames (the way the editor shows time);
// "4.5" or "4.5s" is seconds; "120f" is frames.

export function parseTime(text, fps) {
  const s = String(text ?? '').trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^(\d+):(\d{1,2})(?:[.:](\d{1,2}))?$/);
  if (m) return Number(m[1]) * 60 * fps + Number(m[2]) * fps + Number(m[3] ?? 0);
  m = s.match(/^(\d+)\s*f$/);
  if (m) return Number(m[1]);
  m = s.match(/^(\d+(?:\.\d+)?)\s*s?$/);
  if (m) return Math.round(Number(m[1]) * fps);
  return null;
}
