// Requests keep every planned wording and original visible before a project exists.
import {readFileSync,writeFileSync,mkdirSync,renameSync,rmSync,lstatSync,existsSync} from 'node:fs';
import {join,dirname,resolve,relative} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export const ONE_SHOT_BATCHES='workspace/library/phone.batches.json';
const hash=value=>createHash('sha256').update(value).digest('hex');
const idOK=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(id);
const clipsOK=path=>typeof path==='string'&&/^workspace\/input\/(?:one-shot|phone|quick-cuts\/phone)\//.test(path)&&!path.split('/').some(p=>!p||p==='..'||p.startsWith('.'))&&/\.(mp4|mov|m4v|mkv|webm|avi)$/i.test(path)&&!path.includes('\\');
const problem=(message,status=400)=>Object.assign(Error(message),{status});
function safe(root,path,{create=false}={}) {
 const target=resolve(root,path),rel=relative(resolve(root),target);if(!rel||rel.startsWith('..')||rel.includes('\\'))throw problem('Keep this request inside your workspace.',403);
 let at=resolve(root);for(const part of rel.split('/')){at=join(at,part);try{if(lstatSync(at).isSymbolicLink())throw problem('Use regular workspace files.',403);}catch(error){if(error.code!=='ENOENT')throw error;}}
 if(create)mkdirSync(dirname(target),{recursive:true});return target;
}
function library(root){const path=safe(root,ONE_SHOT_BATCHES);let bytes=null;try{bytes=readFileSync(path);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!bytes)return {data:{version:1,batches:[]},revision:null};
 let data;try{data=JSON.parse(bytes);}catch{throw problem('Your batches are updating. Try again.',409);}
 if(data?.version!==1||!Array.isArray(data.batches)||data.batches.some(b=>!idOK(b?.id)||!Array.isArray(b.wordings)||!Array.isArray(b.pairs))||new Set(data.batches.map(b=>b.id)).size!==data.batches.length)throw problem('Your batch file needs a check in chat.',409);
 return {data,revision:hash(bytes)};
}
const pairId=(batch,wording,clip)=>'pair-'+hash(JSON.stringify([batch,wording,clip])).slice(0,24);
export function changeOneShotBatches(root,body={}) {
 const installed=JSON.parse(readFileSync(safe(root,'runtime.json'),'utf8'));if(!installed.packs?.some(p=>p.name==='quick-cuts'))throw problem('One-shot Reel is not installed.',404);
 if(!['request','update'].includes(body.action))throw problem('Choose a batch request.');
 const old=library(root);if(body.revision!==undefined&&body.revision!==old.revision)throw problem('The batch changed. Read it again before saving.',409);
 const id=body.id??randomUUID();if(!idOK(id))throw problem('Use a plain batch ID.');
 const previous=old.data.batches.find(b=>b.id===id);if(body.action==='request'&&previous)return readOneShotBatches(root).items.find(b=>b.id===id);
 if(body.action==='update'&&!previous)throw problem('This batch is missing.',404);
 const at=new Date().toISOString();let batch;
 if(body.action==='request'){
  if(!Number.isSafeInteger(body.wordings)||body.wordings<1||body.wordings>10000)throw problem('Choose a whole number of wording versions.');
  if(!Array.isArray(body.clipPaths)||body.clipPaths.length>1000||body.clipPaths.some(p=>!clipsOK(p)||!existsSync(safe(root,p))))throw problem('Choose your uploaded original clips.');
  if(!['auto','own','saved'].includes(body.choice)||body.choice==='own'&&(typeof body.topic!=='string'||!body.topic.trim()||body.topic.length>3000)||body.choice==='saved'&&!idOK(body.ideaId))throw problem('Choose an idea for this batch.');
  const clips=[...new Set(body.clipPaths)];if(clips.length*body.wordings>10000)throw problem('Split this request into smaller batches.');
  batch={id,title:body.choice==='own'?body.topic.trim():'Your next One-shot Reels',idea:{choice:body.choice,...(body.choice==='own'?{topic:body.topic.trim()}:{}),...(body.choice==='saved'?{id:body.ideaId}:{})},createdAt:at,updatedAt:at,requestedWordings:body.wordings,wordings:Array.from({length:body.wordings},(_,i)=>({id:'w'+(i+1)})),pairs:[]};
  batch.pairs=batch.wordings.flatMap(w=>clips.map(clip=>({id:pairId(id,w.id,clip),wordingId:w.id,clip})));
 }else{
  batch=structuredClone(previous);batch.updatedAt=at;
  if(body.title!==undefined){if(typeof body.title!=='string'||!body.title.trim()||body.title.length>300)throw problem('Keep the batch title short.');batch.title=body.title.trim();}
  for(const wording of body.wordings??[]){const existing=batch.wordings.find(w=>w.id===wording?.id);if(!existing)throw problem('Keep the existing wording IDs.');for(const key of ['hook','cta','caption'])if(wording[key]!==undefined){if(typeof wording[key]!=='string'||wording[key].length>5000)throw problem('Keep the wording and caption readable.');existing[key]=wording[key];}}
  for(const clip of body.addClips??[]){if(!clipsOK(clip)||!existsSync(safe(root,clip)))throw problem('Choose an uploaded original.');for(const w of batch.wordings){const key=pairId(id,w.id,clip);if(!batch.pairs.some(p=>p.id===key))batch.pairs.push({id:key,wordingId:w.id,clip});}}
  for(const pair of body.pairs??[]){const current=batch.pairs.find(p=>p.id===pair?.id);if(!current)throw problem('Keep the existing pair IDs.');if(pair.project!==undefined){if(typeof pair.project!=='string'||!/^workspace\/projects\/[a-z0-9][a-z0-9_-]*$/i.test(pair.project))throw problem('Link a project inside this workspace.');current.project=pair.project;}
   if(pair.excluded!==undefined){if(pair.excluded!==null&&(typeof pair.excluded!=='string'||!pair.excluded.trim()||pair.excluded.length>1000))throw problem('Say why this version is excluded.');current.excluded=pair.excluded;}}
 }
 if(batch.pairs.length>10000)throw problem('Split this request into smaller batches.');
 const data={...old.data,batches:previous?old.data.batches.map(b=>b.id===id?batch:b):[batch,...old.data.batches]},text=JSON.stringify(data,null,2)+'\n';if(Buffer.byteLength(text)>4*1024**2)throw problem('Split this request into a new workspace.',413);
 const path=safe(root,ONE_SHOT_BATCHES,{create:true}),temp=path+'.'+randomUUID()+'.tmp';try{writeFileSync(temp,text,{flag:'wx',mode:0o600});if(library(root).revision!==old.revision)throw problem('The batch changed. Read it again.',409);renameSync(temp,path);}finally{rmSync(temp,{force:true});}
 return readOneShotBatches(root).items.find(b=>b.id===id);
}
export function readOneShotBatches(root,projects=[]) {
 try{const {data,revision}=library(root);return {revision,items:data.batches.map(batch=>{
  const pairs=batch.pairs.map(pair=>{const matches=projects.filter(p=>p.format==='phone'&&(p.path===pair.project||p.data?.batchId===batch.id&&p.data?.pairId===pair.id));const candidate=matches.length===1?matches[0]:null;
   const duplicate=candidate&&batch.pairs.some(other=>other.id!==pair.id&&other.project===candidate.path);
   const project=candidate&&!duplicate&&(!candidate.data?.source||resolve(root,candidate.data.source)===resolve(root,pair.clip))&&(!candidate.data?.pairId||candidate.data.pairId===pair.id)?candidate:null;
   return {...pair,status:project?.completed?'complete':pair.excluded?'excluded':project?'active':'pending',...(project?{project:project.path,projectId:project.id,stage:project.progress?.current}:{}),...(matches.length>1?{reason:'This version links to more than one project.'}:{})};});
  const completed=pairs.filter(p=>p.status==='complete').length,excluded=pairs.filter(p=>p.status==='excluded').length,remaining=pairs.length-completed-excluded;
  return {...batch,path:ONE_SHOT_BATCHES,pairs,total:pairs.length,completed,excluded,remaining,pendingInputs:pairs.length===0,done:pairs.length>0&&remaining===0};
 })};}catch(error){return {items:[],revision:null,error:error.message};}
}
