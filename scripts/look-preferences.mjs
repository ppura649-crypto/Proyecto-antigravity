// Structured look settings may not overwrite a person's direct Markdown correction.
import { createHash } from 'node:crypto';

const digest = text => createHash('sha256').update(String(text ?? '')).digest('hex');
function managed(text, start, end) {
  text = String(text ?? '');
  const first = text.indexOf(start), last = text.indexOf(end);
  if (first < 0 && last < 0) return { block: '', valid: true, exists: false };
  if (!start || !end || first < 0 || last < first || text.indexOf(start, first + start.length) >= 0 || text.indexOf(end, last + end.length) >= 0) return { block: text, valid: false, exists: true };
  return { block: text.slice(first, last + end.length).replace(/\r\n/g, '\n').trim(), valid: true, exists: true };
}
export function checkLookPreferences({ text = '', expectedText, sync, start = sync?.start, end = sync?.end, path = sync?.path } = {}) {
  const revision = digest(text);
  if (!start || !end) return { changed: false, tracked: false, valid: true, revision, managedHash: null, path };
  const current = managed(text, start, end);
  const expected = expectedText === undefined ? null : managed(expectedText, start, end);
  const expectedHash = sync?.version === 1 && typeof sync.hash === 'string' ? sync.hash : expected?.exists ? digest(expected.block) : null;
  const managedHash = current.exists ? digest(current.block) : null;
  return { changed: !current.valid || expectedHash !== null && managedHash !== expectedHash, tracked: expectedHash !== null, valid: current.valid, revision, managedHash, path };
}
export function assertLookPreferences(options = {}) {
  const state = checkLookPreferences(options);
  if (!state.changed) return state;
  // The agent may reconcile the person's exact current text into explicit answers.
  // A plain reuse or a stale acknowledgement can never erase that correction.
  if (state.valid && options.explicit === true && options.preferencesRevision === state.revision) return state;
  const path = options.path || options.sync?.path || 'the format preferences';
  const error = new Error(`Preferences changed in ${path}. Read that file, apply its meaning to the look answers, then save those answers with --preferences-revision ${state.revision}. Keep the person's corrections. No new approval is needed.`);
  error.code = 'PREFERENCES_CHANGED'; error.path = path; error.revision = state.revision;
  throw error;
}
export function makeLookPreferencesSync(text, { start, end, path } = {}) {
  const block = managed(text, start, end);
  if (!block.valid || !block.exists) throw new Error('Save a complete look section before recording its settings.');
  return { version: 1, path, start, end, hash: digest(block.block) };
}
