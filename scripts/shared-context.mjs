// Shared account facts, read once and reused by every format.
// Contract: saved answers and account completion in; a public summary and unresolved questions out.
// Browser drafts never establish a saved answer. An explicit revisit still permits a correction.
const text = value => typeof value === 'string' ? value.trim() : '';
const known = value => typeof value === 'boolean' || typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) || (Array.isArray(value) && value.length > 0);
const paths = {
 audience: ['audience', 'for'], 'audience.for': ['audience', 'for'],
 audience_need: ['audience', 'need'], 'audience.need': ['audience', 'need'],
 credibility: ['credibility'], automation: ['funnel', 'dm_automation', 'enabled'],
 'funnel.dm_automation.enabled': ['funnel', 'dm_automation', 'enabled'],
 deliverable: ['funnel', 'deliverable'], 'funnel.deliverable': ['funnel', 'deliverable'],
 destination: ['funnel', 'destination'], 'funnel.destination': ['funnel', 'destination'],
};
export function unresolvedQuestions(questions, answers = {}) {
 return questions.filter(q => !q || q.revisit === true || !paths[q.id] || !known(paths[q.id].reduce((v, key) => v?.[key], answers)));
}
export function sharedContext(answers = {}, done = false) {
 const audience = text(answers.audience?.for), need = text(answers.audience?.need);
 return { saved: done, available: done || Boolean(audience || need), readyForIdeas: done || Boolean(audience && need), audience, need };
}
