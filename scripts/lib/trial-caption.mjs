// Trial captions stay close to their own source, and travel with the exact video they describe.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
export const captionWords=text=>String(text??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean).join(' ');
export function captionProblems(variants,source='') {
 if(!Array.isArray(variants)||!variants.length)return ['No variation captions were supplied.'];
 const issues=[],seen=new Map(),original=String(source).trim();
 // A version carries no hashtags, so it is held to the length of the source without its own.
 const body=original.replace(/#[\p{L}\p{N}_]+/gu,'').replace(/[ \t]+/g,' ').trim();
 for(const v of variants){
  const text=typeof v.caption==='string'?v.caption.trim():'',words=captionWords(text);
  if(!words){issues.push(`${v.id}: write a caption for this variation.`);continue;}
  if(/[\u2013\u2014]/.test(text))issues.push(`${v.id}: remove em and en dashes.`);
  if(/#[\p{L}\p{N}_]+/u.test(text))issues.push(`${v.id}: remove hashtags.`);
  if(original&&words===captionWords(original))issues.push(`${v.id}: lightly rephrase the source caption; changing punctuation or case is not a rewrite.`);
  if(original&&Math.abs(text.length-body.length)>Math.max(50,body.length*.2))issues.push(`${v.id}: keep the caption close to the source length and retain its useful details.`);
  if(seen.has(words))issues.push(`${v.id}: give this variation its own wording; its caption repeats ${seen.get(words)}.`);
  seen.set(words,v.id);
 }
 return issues;
}
export function trialCaptionFiles(project,root) {
 const read=path=>JSON.parse(readFileSync(path,'utf8'));
 const plan=read(join(project,'props/variants.json'));
 const posts=read(join(root,'context/posts.json'));
 const source=posts.find(p=>p.id===plan.source_post);
 if(!source)throw Error('The source post is missing. Read it before exporting its captions.');
 const issues=captionProblems(plan.variants,source.caption||'');
 if(issues.length)throw Error(issues.join(' '));
 const videos=readdirSync(join(project,'renders')).filter(name=>name.endsWith('.mp4'));
 return videos.map(name=>{
  const id=name.slice(0,-4),variant=plan.variants.find(v=>v.id===id);
  if(!variant)throw Error(`${name}: this rendered video has no matching variation caption.`);
  const from=join(project,'renders',id+'.caption.txt');
  if(!existsSync(from))throw Error(`${name}: its caption file is missing.`);
  if(readFileSync(from,'utf8').trim()!==variant.caption.trim())throw Error(`${name}: its saved caption is empty or differs from the checked variation.`);
  return {from,to:id+'.caption.txt'};
 });
}
