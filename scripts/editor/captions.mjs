// captions.mjs: spoken words, timed one by one, shown a page at a time. The same for every format: a format may decide
// the paging (pages), and may register a look that draws a page its own way, but the words, their timing and every
// change a person makes to them go through here. Pure, tested with node --test, shared by Edit.tsx and the inspector.
//
// A caption item: words [{ text, from, to }] in frames on the item's own clock (0 is where the item starts; trimStart
// skips into it), optional pages [{ from, to, lines: [[wordIndex...]] }], and style.

export const DEFAULT_WORDS_PER_PAGE = 3;

// ---------------------------------------------------------------------------------------------------------------
// Reading.

// The pages to show: the format's own when it decided them, otherwise a few words at a time, starting a new page
// after a pause so a page never waits on screen for words that come much later.
export function pagesOf(item, fps = 30) {
  const words = item.words ?? [];
  if (Array.isArray(item.pages) && item.pages.length) return item.pages.filter((p) => p.lines?.some((l) => l.length));
  const per = Math.max(1, Math.round(item.style?.wordsPerPage ?? DEFAULT_WORDS_PER_PAGE));
  const pause = Math.round(fps * 0.6);
  const groups = [];
  let current = [];
  words.forEach((word, i) => {
    const previous = words[i - 1];
    if (current.length && (current.length >= per || word.from - previous.to > pause)) { groups.push(current); current = []; }
    current.push(i);
  });
  if (current.length) groups.push(current);
  const hold = Math.round(fps * 0.25);
  return groups.map((group, g) => {
    const from = words[group[0]].from;
    const lastTo = words[group.at(-1)].to;
    const next = groups[g + 1] ? words[groups[g + 1][0]].from : Infinity;
    return { from, to: Math.max(from + 1, Math.min(next, lastTo + hold)), lines: [group] };
  });
}

export const pageAt = (pages, frame) => pages.find((p) => frame >= p.from && frame < p.to) ?? null;
export const pageIndexOf = (pages, wordIndex) => pages.findIndex((p) => p.lines.some((l) => l.includes(wordIndex)));

// The word being said: the one whose time holds the frame, or on a page the last one already started.
export function activeWord(words, frame, page = null) {
  const inside = words.findIndex((w) => frame >= w.from && frame < w.to);
  if (inside > -1) return inside;
  if (!page) return -1;
  let last = -1;
  for (const line of page.lines) for (const i of line) if (words[i] && words[i].from <= frame) last = Math.max(last, i);
  return last;
}

export const plainText = (item) => (item.words ?? []).map((w) => w.text).join(' ');

// ---------------------------------------------------------------------------------------------------------------
// Changing. Each returns a new item; word indices in pages follow every change.

// Pages after the words changed: map[old] is the list of new indices that old word became.
export function rebuildPages(pages, map) {
  if (!Array.isArray(pages) || !pages.length) return pages;
  const next = [];
  for (const page of pages) {
    const lines = page.lines.map((line) => line.flatMap((i) => map[i] ?? [])).filter((line) => line.length);
    if (lines.length) next.push({ ...page, lines });
  }
  return next;
}

const identity = (n) => Array.from({ length: n }, (_, i) => [i]);
const tokens = (text) => String(text ?? '').split(/\s+/).filter(Boolean);
const weight = (t) => Math.max(1, t.replace(/[^\p{L}\p{N}]/gu, '').length || t.length);

// Share [from, to) between tokens by their length, every word at least a frame.
export function spread(list, from, to) {
  const total = list.reduce((sum, t) => sum + weight(t), 0);
  const span = Math.max(list.length, to - from);
  let at = from;
  return list.map((text, k) => {
    const share = k === list.length - 1 ? from + span - at : Math.max(1, Math.round((span * weight(text)) / total));
    const word = { text, from: at, to: at + share };
    at += share;
    return word;
  });
}

// Change a word. Typing several words into one shares its time between them.
export function editWord(item, i, text) {
  const words = item.words ?? [];
  const w = words[i];
  if (!w) return item;
  const parts = tokens(text);
  if (!parts.length) return deleteWord(item, i);
  const replaced = parts.length === 1 ? [{ ...w, text: parts[0] }] : spread(parts, w.from, w.to).map((part, index) => ({ ...w, ...part, id: index === 0 ? w.id : undefined }));
  const map = identity(words.length).map((_, k) => (k < i ? [k] : k === i ? replaced.map((_, j) => i + j) : [k + replaced.length - 1]));
  return { ...item, words: [...words.slice(0, i), ...replaced, ...words.slice(i + 1)], pages: rebuildPages(item.pages, map) };
}

export function deleteWord(item, i) {
  const words = item.words ?? [];
  if (!words[i]) return item;
  const map = identity(words.length).map((_, k) => (k < i ? [k] : k === i ? [] : [k - 1]));
  return { ...item, words: words.filter((_, k) => k !== i), pages: rebuildPages(item.pages, map) };
}

// Join a word with the next one: one word, both their time.
export function mergeWord(item, i) {
  const words = item.words ?? [];
  const a = words[i], b = words[i + 1];
  if (!a || !b) return item;
  const merged = { ...a, text: `${a.text} ${b.text}`, from: a.from, to: b.to };
  const map = identity(words.length).map((_, k) => (k <= i ? [k] : k === i + 1 ? [] : [k - 1]));
  return { ...item, words: [...words.slice(0, i), merged, ...words.slice(i + 2)], pages: rebuildPages(item.pages, map) };
}

// Start a new page at a word. Without pages of its own, the item first takes the pages it was showing.
export function splitPage(item, i, fps = 30) {
  const words = item.words ?? [];
  if (!words[i]) return item;
  const pages = pagesOf(item, fps).map((p) => ({ ...p, lines: p.lines.map((l) => [...l]) }));
  const at = pageIndexOf(pages, i);
  if (at < 0) return item;
  const page = pages[at];
  const flat = page.lines.flat();
  if (flat[0] === i) return { ...item, pages };
  const before = page.lines.map((l) => l.filter((k) => k < i)).filter((l) => l.length);
  const after = page.lines.map((l) => l.filter((k) => k >= i)).filter((l) => l.length);
  const cut = words[i].from;
  pages.splice(at, 1, { ...page, to: cut, lines: before }, { ...page, from: cut, lines: after });
  return { ...item, pages };
}

// Join a page with the one after it.
export function joinPage(item, pageIndex, fps = 30) {
  const pages = pagesOf(item, fps);
  const a = pages[pageIndex], b = pages[pageIndex + 1];
  if (!a || !b) return item;
  const joined = { ...a, to: b.to, lines: [[...a.lines.flat(), ...b.lines.flat()]] };
  return { ...item, pages: [...pages.slice(0, pageIndex), joined, ...pages.slice(pageIndex + 2)] };
}

// Nudge when a word starts or ends (or both), never over its neighbours and never shorter than a frame.
export function nudgeWord(item, i, edge, delta) {
  const words = [...(item.words ?? [])];
  const w = words[i];
  if (!w) return item;
  const lo = i > 0 ? words[i - 1].to : 0;
  const hi = i < words.length - 1 ? words[i + 1].from : Math.max(w.to, item.durationInFrames ?? w.to) + (item.trimStart ?? 0);
  let { from, to } = w;
  if (edge === 'from' || edge === 'both') from = Math.max(lo, Math.min(to - 1, from + delta));
  if (edge === 'to' || edge === 'both') to = Math.min(Math.max(hi, to), Math.max(from + 1, to + delta));
  if (edge === 'both') { const len = w.to - w.from; if (to - from !== len) { if (delta > 0) from = to - len; else to = from + len; } }
  words[i] = { ...w, from, to };
  let pages = item.pages;
  if (Array.isArray(pages) && pages.length) {
    // A page that starts on this word starts with it.
    pages = pages.map((p) => (p.lines.flat()[0] === i ? { ...p, from: Math.min(p.from === w.from ? from : p.from, from) } : p));
  }
  return { ...item, words, pages };
}

const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Replace all the words with new text, keeping the timing of every word that is still there and sharing the time of
// the ones that changed. Pages follow.
export function retext(item, text) {
  const old = item.words ?? [];
  const next = tokens(text);
  if (!next.length) return { ...item, words: [], pages: rebuildPages(item.pages, old.map(() => [])) };
  if (!old.length) {
    const span = Math.max(next.length, item.durationInFrames ?? next.length * 10);
    return { ...item, words: spread(next, item.trimStart ?? 0, (item.trimStart ?? 0) + span) };
  }
  // Longest common run of words, by their letters.
  const n = old.length, m = next.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let a = n - 1; a >= 0; a--) for (let b = m - 1; b >= 0; b--) L[a][b] = norm(old[a].text) === norm(next[b]) && norm(next[b]) ? L[a + 1][b + 1] + 1 : Math.max(L[a + 1][b], L[a][b + 1]);
  const pairs = [];
  for (let a = 0, b = 0; a < n && b < m;) {
    if (norm(old[a].text) === norm(next[b]) && norm(next[b])) { pairs.push([a, b]); a++; b++; }
    else if (L[a + 1][b] >= L[a][b + 1]) a++;
    else b++;
  }
  pairs.push([n, m]);
  // Walk the kept words in order. Between two kept words, the old words that went away give their time to the new
  // words typed in their place. New words with nothing to replace take the pause before the next kept word, or share
  // the time of the word before them when there is no pause. Each new word joins the page of the old word it came from.
  const words = [];
  const map = old.map(() => []);
  let owner = -1; // the old word the last pushed word belongs to
  const push = (word, from) => { map[from]?.push(words.length); words.push(word); owner = from; };
  let a0 = 0, b0 = 0;
  for (const [a1, b1] of pairs) {
    const gapOld = old.slice(a0, a1), gapNew = next.slice(b0, b1);
    if (gapNew.length && gapOld.length) {
      for (const word of spread(gapNew, gapOld[0].from, gapOld.at(-1).to)) push(word, a0);
    } else if (gapNew.length) {
      const previous = words.at(-1);
      const start = previous ? previous.to : item.trimStart ?? 0;
      const stop = a1 < n ? old[a1].from : start + gapNew.length * 8;
      const home = owner > -1 ? owner : a1 < n ? a1 : -1;
      if (stop - start >= gapNew.length) {
        for (const word of spread(gapNew, start, stop)) push(word, home);
      } else if (previous) {
        words.pop();
        map[owner] = map[owner].filter((k) => k < words.length);
        for (const word of spread([previous.text, ...gapNew], previous.from, previous.to)) push(word, home);
      } else {
        const room = spread(gapNew, start, start + gapNew.length);
        for (const word of room) push(word, home);
      }
    }
    if (a1 < n) push({ ...old[a1], text: next[b1], from: Math.max(old[a1].from, words.at(-1)?.to ?? 0), to: Math.max(old[a1].to, (words.at(-1)?.to ?? 0) + 1) }, a1);
    a0 = a1 + 1; b0 = b1 + 1;
  }
  return { ...item, words, pages: rebuildPages(item.pages, map) };
}

// New caption words for an item added by hand: the text spread over its length.
export const wordsFor = (text, length) => spread(tokens(text), 0, Math.max(1, length));
