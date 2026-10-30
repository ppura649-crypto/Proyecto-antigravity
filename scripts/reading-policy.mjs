// Account context is cheap. Video measurements belong to the installed format that needs them.
import { readJson, P } from './_lib.mjs';
import { existsSync } from 'node:fs';
import {TRIAL_INPUTS, requestedReels, postCode} from './trial-input-contract.mjs';

export const ACCOUNT_DAYS = 90;
export const TRIAL_DAYS = 180;
export const TRIAL_LIMIT = 50;
export const ACCOUNT_PREVIEWS = 12;
export const isVideo = p => /VIDEO|REEL/i.test(p.media_type ?? '');
export const recentPosts = (posts, days, at = Date.now()) => posts.filter(p => {
  const time = Date.parse(p.timestamp);
  return Number.isFinite(time) && time >= at - days * 864e5 && time <= at;
});
const metric = value => Number.isFinite(Number(value)) && value != null ? Number(value) : 0;
export const rankPosts = posts => [...posts].sort((a, b) =>
  metric(b.metrics?.reach ?? b.metrics?.plays) - metric(a.metrics?.reach ?? a.metrics?.plays) ||
  metric(b.metrics?.plays) - metric(a.metrics?.plays) || metric(b.metrics?.saves) - metric(a.metrics?.saves) || String(a.id).localeCompare(String(b.id)));
export const trialPosts = (posts, at = Date.now()) => rankPosts(recentPosts(posts, TRIAL_DAYS, at).filter(isVideo)).slice(0, TRIAL_LIMIT);
// Only links explicitly supplied by the buyer may extend the initial top 50.
export function trialSources(posts, at=Date.now(), manifest=readJson(P(TRIAL_INPUTS),{})) {
  const requested=new Set(requestedReels(manifest).map(r=>r.code)),selected=trialPosts(posts,at);
  return [...selected,...posts.filter(p=>isVideo(p)&&requested.has(postCode(p))&&!selected.some(s=>s.id===p.id))];
}
export const trialInstalled = () => (readJson(P('runtime.json'), {})?.packs ?? []).some(p => p.name === 'trial-reels');
export function representativeIds(posts, review, formatId = null) {
  const selected = new Set(posts.map(p => p.id));
  const ids = [];
  for (const f of review?.formats ?? []) {
    if (f.id === 'other' || formatId && f.id !== formatId) continue;
    const members = posts.filter(p => (f.posts ?? []).includes(p.id) || review.posts?.[p.id]?.format === f.id);
    const eligible = members;
    const explicit = (f.representatives ?? []).filter(id => selected.has(id) && eligible.some(p => p.id === id));
    ids.push(...(explicit.length ? explicit : eligible.map(p => p.id).slice(0, 3)));
  }
  return [...new Set(ids)];
}
// Child readers inherit the same bounded list. Running `text all` cannot escape it.
export function readingPosts() {
  const posts = readJson(P('context', 'posts.json'), null);
  if (!posts) return null;
  if (process.env.KEYFRAMES_READING_IDS) {
    const ids = new Set(JSON.parse(process.env.KEYFRAMES_READING_IDS));
    return posts.filter(p => ids.has(p.id));
  }
  return recentPosts(posts, ACCOUNT_DAYS);
}
export async function mapLimit(items, limit, fn) {
  const result = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, async () => {
    for (let i; (i = next++) < items.length;) result[i] = await fn(items[i], i);
  }));
  return result;
}

// Aggregate readers keep previous measured references without making the per-post readers scan them again.
export function referencePosts() {
  if (process.env.KEYFRAMES_READING_SCOPE !== 'trial-reels') return readingPosts();
  const current = new Set((readingPosts() ?? []).map(p => p.id));
  return trialSources(readJson(P('context', 'posts.json'), [])).filter(p => (current.has(p.id) || existsSync(P('context', 'structure', `${p.id}.json`))));
}
