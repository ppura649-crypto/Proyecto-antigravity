// One completion rule for the planner and app: distinct exported videos with their captions.
export function trialOutputProgress({ sources = [], outputs = [], roundId = '', target = 5, sourceTargets = {} } = {}) {
  const ids = [...new Set(sources)];
  const selected = new Set(ids);
  const unique = new Map(outputs.filter(output => selected.has(output.sourceId) && (output.roundId || '') === (roundId || '') && typeof output.path === 'string').map(output => [output.path, output]));
  const current = [...unique.values()];
  const counts = Object.fromEntries(ids.map(id => [id, current.filter(output => output.sourceId === id && (output.hasCaption === true || typeof output.caption?.text === 'string' && output.caption.text.trim())).length]));
  const targets = Object.fromEntries(ids.map(id => [id, Number.isInteger(sourceTargets[id]) && sourceTargets[id] > 0 ? sourceTargets[id] : target]));
  const finishedSources = ids.filter(id => counts[id] >= targets[id]).length;
  return {
    counts, targets,
    complete: ids.length > 0 && finishedSources === ids.length,
    batch: { sources: ids.length, finishedSources, remainingSources: ids.length - finishedSources, variations: current.length, target },
  };
}
