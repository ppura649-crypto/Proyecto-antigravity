// Picking a look replaces its owned fields, even though individual style edits merge with the current style.
// Explicit undefined clears old values during that merge; deleting keys here would keep the previous renderer.
const LOOK_KEYS = ['look', 'font', 'size', 'weight', 'color', 'activeColor', 'background', 'stroke', 'caps', 'shadow', 'animation', 'maxWidth', 'align'];
export function applyLook(style, look, { caption = false } = {}) {
  const next = { ...(style ?? {}) };
  for (const key of LOOK_KEYS) next[key] = undefined;
  const { y, wordsPerPage, ...rest } = look.style;
  return { ...next, ...rest, ...(caption && y != null && style?.y == null ? { y } : {}), ...(caption && wordsPerPage != null && style?.wordsPerPage == null ? { wordsPerPage } : {}) };
}
