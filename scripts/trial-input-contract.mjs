// Shared input identity. Uploads are received first; the agent verifies what each file is for.
export const TRIAL_INPUTS = 'workspace/library/trial-reels.inputs.json';
// A direct batch request is separate from approval of a test the buyer has seen.
// Scope and count come from their words in chat; a browser selection cannot authorize a render.
export function trialBatch(state) {
  const batch=state?.batch;
  return batch?.authorized_at&&Number.isFinite(Date.parse(batch.authorized_at))&&typeof batch.instruction==='string'&&batch.instruction.trim()&&Array.isArray(batch.posts)&&batch.posts.length&&batch.posts.every(id=>typeof id==='string'&&id)&&Number.isInteger(batch.variations_per_source)&&batch.variations_per_source>0?batch:null;
}
export function instagramReel(value) {
  try {
    const url=new URL(String(value).trim());
    const match=/^\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname);
    if(url.protocol!=='https:'||!['instagram.com','www.instagram.com','m.instagram.com'].includes(url.hostname)||url.username||url.password||url.port||!match)return null;
    return {code:match[1],url:`https://www.instagram.com/reel/${match[1]}/`};
  } catch{return null;}
}
export const postCode = post => post.code || post.shortcode || instagramReel(post.permalink)?.code;
export function requestedReels(manifest,roundId=null) {
  return Object.entries(manifest?.formats??{}).flatMap(([formatId,f])=>(f.rounds??[]).filter(r=>!roundId||r.id===roundId).flatMap(r=>(r.links??[]).map(link=>({...instagramReel(typeof link==='string'?link:link.url),formatId,roundId:r.id})))).filter(r=>r.code);
}
export const roundFolder = (formatId,roundId) => `workspace/input/trial-reels/${formatId}${roundId?`/rounds/${roundId}`:''}`;
// A format whose test only changes words burned into the posted video needs nothing from the buyer: the agent has the
// posted file and its sound. It says so with `source: "posted"`, and the input step is then already done. Anything
// else still asks for the originals, because footage cannot be lifted out from under its own text.
export function trialNeeds(format) {
  if(format.source==='posted'&&!format.need?.length)return [];
  const asks=format.need?.filter(n=>n.type!=='connection'&&n.icon!=='instagram');
  // The page still falls back to one general ask for a format that says neither `source` nor `need`: the workspace and
  // its tests rest on it. The planner no longer does: it sends the agent back to decide (trialUndecided) before anything.
  return (asks?.length ? asks : [{id:'originals',what:'Your original footage',example:'The unedited clips behind this format.'}]).map((n,i) => ({...n,id:n.id || `need-${i+1}`}));
}
export function inputRemoved(manifest, formatId, media, root = '') {
  const local = value => String(value || '').replaceAll('\\','/').replace(root ? root.replaceAll('\\','/')+'/' : /^$/, '');
  return (manifest?.formats?.[formatId]?.removed ?? []).some(item =>
    item.mediaId && item.mediaId === media.id || [item.path,...item.paths??[]].filter(Boolean).some(path=>[media.path,media.mezzanine].some(p => local(p) === path || local(p).startsWith(path+'/'))));
}
// True when the reading has not yet said what this format's test needs.
export const trialUndecided = (format) => format.source!=='posted' && !format.need?.length && format.id!=='other';

export function needReady(need, needs, media, checks, file, manifest, formatId, root='') {
  const proof=checks?.[need.id];
  return !!(proof?.verified_at&&proof.paths?.length&&proof.paths.every(p=>file(p)&&!inputRemoved(manifest,formatId,{path:p},root))) || needs.length===1&&media.some(m=>!inputRemoved(manifest,formatId,m,root));
}
