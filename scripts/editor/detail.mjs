// Per-word and per-component edits stay on their owning item. Stable IDs survive text and timing corrections;
// the same values and interpolation are used by the canvas, the inspector and the encoded export.
export const DETAIL_DEFAULTS = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
export function withWordIds(doc) {
  if (!doc.items.some(item => item.words?.some(word => !word.id))) return doc;
  return { ...doc, items: doc.items.map(item => {
    if (item.type !== 'caption' || !item.words?.some(word => !word.id)) return item;
    const used = new Set(item.words.map(w => w.id));
    return { ...item, words: item.words.map((word, i) => {
      if (word.id) return word;
      let id = `${item.id}-w${i}`, suffix = 0;
      while (used.has(id)) id = `${item.id}-w${i}-${++suffix}`;
      used.add(id);return { ...word, id };
    }) };
  }) };
}
export const wordId = (item, index) => item.words[index].id || `${item.id}-w${index}`;
export function valueAt(points, frame, fallback) {
  if (!points?.length) return fallback;
  const sorted = [...points].sort((a, b) => a.frame - b.frame);
  if (frame <= sorted[0].frame) return sorted[0].value;
  for (let i = 1; i < sorted.length; i++) if (frame <= sorted[i].frame) {
    const a = sorted[i - 1], b = sorted[i];
    let t = (frame - a.frame) / (b.frame - a.frame);
    if (a.easing === 'smooth') t = t * t * (3 - 2 * t);
    return a.value + (b.value - a.value) * t;
  }
  return sorted.at(-1).value;
}
export function detailTransform(edit = {}, frame = 0) {
  return Object.fromEntries(Object.entries(DETAIL_DEFAULTS).map(([key, value]) => [key, valueAt(edit.keyframes?.[key], frame + (edit.clockOffset ?? 0), edit.transform?.[key] ?? value)]));
}
export function detailCss(edit = {}, frame = 0) {
  const t = detailTransform(edit, frame);
  const clock = frame + (edit.clockOffset ?? 0);
  return {
    ...(t.x || t.y ? { translate: `${t.x}px ${t.y}px` } : {}),
    ...(t.scale !== 1 ? { scale: String(t.scale) } : {}),
    ...(t.rotation ? { rotate: `${t.rotation}deg` } : {}),
    ...(t.opacity !== 1 ? { opacity: t.opacity } : {}),
    ...(edit.color ? { color: edit.color, WebkitTextFillColor: edit.color } : {}),
    ...(edit.size ? { fontSize: edit.size } : {}),
    ...(edit.hidden || clock < (edit.from ?? -Infinity) || clock >= (edit.to ?? Infinity) ? { visibility: 'hidden' } : {}),
  };
}
export function setDetail(item, target, patch) {
  const merge = old => ({ ...old, ...patch, ...(patch.transform ? { transform: { ...old?.transform, ...patch.transform } } : {}) });
  if (target.kind === 'word') return { ...item, words: item.words.map((word, i) => wordId(item, i) === target.id ? { ...word, id: wordId(item, i), edit: merge(word.edit) } : word) };
  return { ...item, elements: { ...item.elements, [target.id]: merge(item.elements?.[target.id]) } };
}
export function setDetailValue(edit, key, value, frame, animate = false) {
  if (!animate && Math.abs(detailTransform(edit, frame)[key] - value) < 1e-9) return {};
  // Extending a caption to the left can put its old clock before zero. Rebase every property together before
  // writing a new point there, keeping both the old curves and the new point on a valid local clock.
  if (frame + (edit.clockOffset ?? 0) < 0 && (animate || edit.keyframes?.[key]?.length)) {
    const delta = -(edit.clockOffset ?? 0);
    const rebased = {
      clockOffset: 0,
      keyframes: Object.fromEntries(Object.entries(edit.keyframes ?? {}).map(([name, points]) => [name, points.map(p => ({ ...p, frame: p.frame + delta }))])),
      ...(edit.from != null ? { from: edit.from + delta } : {}),
      ...(edit.to != null ? { to: edit.to + delta } : {}),
    };
    return { ...rebased, ...setDetailValue({ ...edit, ...rebased }, key, value, frame, animate) };
  }
  frame += edit.clockOffset ?? 0;
  const points = edit.keyframes?.[key];
  if (points?.length || animate) {
    const next = (points ?? []).filter(p => p.frame !== frame).concat({ frame, value, easing: 'smooth' }).sort((a, b) => a.frame - b.frame);
    return { keyframes: { ...edit.keyframes, [key]: next } };
  }
  return { transform: { [key]: value } };
}
export function checkDetail(edit) {
  if (!edit || typeof edit !== 'object' || Array.isArray(edit)) return false;
  if (edit.clockOffset != null && !Number.isInteger(edit.clockOffset)) return false;
  if (edit.color != null && typeof edit.color !== 'string') return false;
  if (edit.hidden != null && typeof edit.hidden !== 'boolean') return false;
  for (const key of ['transform', 'keyframes']) if (edit[key] != null && (typeof edit[key] !== 'object' || Array.isArray(edit[key]))) return false;
  if (edit.text != null && typeof edit.text !== 'string') return false;
  if (edit.src != null && typeof edit.src !== 'string') return false;
  if (edit.size != null && (!Number.isFinite(edit.size) || edit.size <= 0)) return false;
  for (const key of ['from', 'to']) if (edit[key] != null && (!Number.isInteger(edit[key]) || edit[key] < 0)) return false;
  if (edit.from != null && edit.to != null && edit.to <= edit.from) return false;
  const valid = (key, value) => Number.isFinite(value) && (key !== 'scale' || value > 0) && (key !== 'opacity' || (value >= 0 && value <= 1));
  if (edit.transform && Object.entries(edit.transform).some(([key, value]) => !(key in DETAIL_DEFAULTS) || !valid(key, value))) return false;
  if (edit.keyframes) for (const [key, points] of Object.entries(edit.keyframes)) {
    if (!(key in DETAIL_DEFAULTS) || !Array.isArray(points)) return false;
    const seen = new Set();
    for (const p of points) {
      if (!p || !Number.isInteger(p.frame) || p.frame < 0 || seen.has(p.frame) || !valid(key, p.value) || (p.easing != null && !['linear', 'smooth'].includes(p.easing))) return false;
      seen.add(p.frame);
    }
  }
  return true;
}
