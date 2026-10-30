// Keep recognized nonverbal annotations as evidence, separate from captionable words.
export function partitionTranscript(entries) {
  const words = [], events = [];
  for (const entry of entries) {
    const text = String(entry.text ?? '').trim();
    if (!text || !Number.isFinite(entry.start) || !Number.isFinite(entry.end) || entry.end <= entry.start) continue;
    (/^\[[\s\S]*\]$/.test(text) ? events : words).push({...entry, text});
  }
  return {words, events};
}
