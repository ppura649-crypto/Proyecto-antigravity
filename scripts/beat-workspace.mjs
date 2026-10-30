// The input page reports intake and clip readings, never uploads as completed analysis.
import {beatMember,preparedClip,beatMinimumClips,beatSuggestedClips} from './beat-preparation.mjs';
export function beatInputState({files,media={},footage={},preparation={},localPath=x=>x,file=()=>true}) {
 const eligible=beatMember;
 const measured=footage.clips||{},catalog=media.clips||media;
 const byPath=new Map(Object.entries(catalog).filter(([,c])=>c?.path).flatMap(([hash,c])=>[c.path,...c.aliases||[]].map(p=>[localPath(p),{hash,...c}])));
 const seen=new Set();
 const clips=files.filter(f=>f.kind==='video'&&eligible(f.path)).flatMap(f=>{
  const c=byPath.get(f.path),r=c&&measured[c.hash],identity=c?.hash||f.path;
  if(seen.has(identity))return [];seen.add(identity);
  const h=r?.read?.human;
  const human=!!(h?.visible===true&&Number.isFinite(h.from)&&Number.isFinite(h.to)&&h.from>=0&&h.to<=c.duration&&h.to>h.from);
  const read=!!(c?.mezzanine&&file(localPath(c.mezzanine))&&r?.light&&r?.read?.what&&r?.read?.shows&&(h?.visible===false||human));
  const prep=c&&preparation.clips?.[c.hash],reviewed=read&&preparedClip(prep,c,r,p=>file(localPath(p))),excluded=reviewed&&prep.status==='excluded';
  const prepared=reviewed&&!excluded;
  return [{path:f.path,name:f.name,hash:c?.hash||null,measured:!!r?.light,read,prepared,excluded,reason:excluded?prep.reason:null,human:!!(read&&human&&prepared&&prep.review.personVisible&&Math.min(h.to,prep.usable.to)>Math.max(h.from,prep.usable.from)),...(prepared?{preview:file(localPath(prep.video)),sheet:file(localPath(prep.sheet)),usable:prep.usable,notes:[prep.review.crop,prep.review.colour,prep.review.caption,prep.review.motion]}:{})}];
 });
 const read=clips.filter(c=>c.read).length,human=clips.filter(c=>c.human).length,prepared=clips.filter(c=>c.prepared).length,excluded=clips.filter(c=>c.excluded).length;
 return {clips,total:clips.length,read,human,prepared,excluded,pending:clips.length-prepared-excluded,minimum:beatMinimumClips,suggested:beatSuggestedClips,ready:prepared>=beatMinimumClips&&human>0};
}
