const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);

// A saved look can acknowledge a draft, but cannot erase a different unfinished edit.
export function reconcileLookDraft(draft, saved) {
  const matches = stable(draft.look) === stable(saved);
  if (matches || !draft.setupDraft) {
    draft.look = structuredClone(saved);
    draft.lookBase = structuredClone(saved);
    draft.setupDraft = false;
    delete draft.lookConflict;
  } else if (!draft.lookBase || stable(draft.lookBase) !== stable(saved)) {
    draft.lookConflict = structuredClone(saved);
  }
  return draft;
}
