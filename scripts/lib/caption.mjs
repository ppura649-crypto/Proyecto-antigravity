// caption.mjs: one caption, measured. The only instrument for caption text in the folder.
// Contract: measure(text) returns what one caption is, in numbers and in a few short strings:
//   { chars, first_line, first_under_125, blocks, lines, facts, fact_mark, link, keyword, opens, closes,
//     hashtags, emoji, exclamations, questions, em_dashes, digits, words }
//   Nothing here decides whether a caption is good. It says what a caption IS, and the same function reads the
//   buyer's posted captions (captions.mjs, into context/captions.json) and every caption we write before it is
//   exported (checks/captionfit.mjs). Two functions would drift, and a check that measures a version differently
//   from the way the account was measured compares nothing: the numbers would disagree for no reason a person
//   could name. So there is one, here, and both sides import it.
//   `opens` and `closes` are the first two and last two words, lower case and stripped of punctuation, because
//   that is the grain at which an account's caption habits repeat ("comment plugin", "save this").

const LINK = /\b[a-z0-9-]+\.(com|co|ai|io|dev|org|net|sh|app|xyz)\b|ollama run|pip install|git clone|npx |brew install|uv add|docker run/i;
// A word in capitals that is a comment keyword and not an initialism everybody writes in capitals.
const NOT_A_KEYWORD = new Set(["AI", "GPU", "CPU", "RAM", "API", "LLM", "OCR", "MIT", "HTTP", "HTTPS", "JSON", "PDF", "CLI", "SDK", "URL", "CSS", "HTML", "SQL", "IDE", "MCP", "TTS", "STT", "RAG", "GGUF", "FREE", "NEW", "USD", "EUR"]);
const FACT = /^(>|-|•|\*|\d+[.)])\s*\S/;

const twoWords = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
export const linesOf = (t) => String(t ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
export const blocksOf = (t) => String(t ?? "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

export function measure(text) {
  const t = String(text ?? "").trim();
  const lines = linesOf(t);
  const first = lines[0] ?? "";
  const last = lines[lines.length - 1] ?? "";
  const facts = lines.filter((l) => FACT.test(l));
  const marks = facts.map((l) => (/^\d+[.)]/.test(l) ? "number" : l[0]));
  const keys = (t.match(/\b[A-Z][A-Z0-9]{2,}\b/g) ?? []).filter((w) => !NOT_A_KEYWORD.has(w));
  return {
    chars: t.length,
    words: t.split(/\s+/).filter(Boolean).length,
    lines: lines.length,
    blocks: blocksOf(t).length,
    first_line: first.length,
    first_under_125: first.length <= 125,
    facts: facts.length,
    // The mark this caption leads its fact lines with, when it keeps to one. An account that numbers its facts and
    // one that bullets them read as different people, and a version must keep the account's mark.
    fact_mark: marks.length ? (new Set(marks).size === 1 ? marks[0] : "mixed") : null,
    link: LINK.test(t),
    keyword: keys[0] ?? null,
    opens: twoWords(first),
    closes: twoWords(last),
    hashtags: (t.match(/#\w/g) ?? []).length,
    emoji: (t.match(/\p{Extended_Pictographic}/gu) ?? []).length,
    exclamations: (t.match(/!/g) ?? []).length,
    questions: (t.match(/\?/g) ?? []).length,
    em_dashes: (t.match(/[\u2014\u2013]/g) ?? []).length,
    digits: /\d/.test(t),
  };
}

// How close two captions are, as the share of one's three word runs the other also has.
// Descriptive only: a light Trial Reels rewrite can correctly have high overlap.
export function overlap(a, b) {
  const g = (t) => { const w = String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean); const s = new Set(); for (let i = 0; i + 2 < w.length; i++) s.add(w.slice(i, i + 3).join(" ")); return s; };
  const x = g(a), y = g(b);
  if (!x.size || !y.size) return 0;
  let n = 0; for (const k of x) if (y.has(k)) n++;
  return n / Math.min(x.size, y.size);
}
