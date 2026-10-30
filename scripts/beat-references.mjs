// References teach a cut pattern. They never join the buyer's original footage library.
import {readFileSync,writeFileSync,mkdirSync,renameSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {safeFile} from './workspace-state.mjs';
import {InputError} from './workspace-inputs.mjs';
import {montageReferences} from './workspace-ui/beat-reference-links.js';
export const BEAT_REFERENCES='workspace/library/beat-montage.references.json';
export function referenceLibrary(root) {
 const file=safeFile(root,BEAT_REFERENCES);if(!file)return {version:1,items:[]};
 try{const data=JSON.parse(readFileSync(file.path,'utf8'));if(!Array.isArray(data.items))throw Error();return data;}catch{throw new InputError(409,'Your references are updating. Try again.');}
}
export function writeReferenceLibrary(root,data) {
 let path='';for(const part of dirname(BEAT_REFERENCES).split('/')){path+=(path?'/':'')+part;try{mkdirSync(join(root,path));}catch(e){if(e.code!=='EEXIST')throw e;}if(!safeFile(root,path)?.stat.isDirectory())throw new InputError(403,'References must stay in your workspace.');}
 const temp=join(root,BEAT_REFERENCES+'.'+randomUUID()+'.tmp');
 try{writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});renameSync(temp,join(root,BEAT_REFERENCES));}finally{rmSync(temp,{force:true});}
}
export function saveBeatReferences(root,body) {
 const runtime=safeFile(root,'runtime.json');if(!runtime||!JSON.parse(readFileSync(runtime.path,'utf8')).packs?.some(p=>p.name==='quick-cuts'))throw new InputError(404,'Beat Montage is not installed.');
 let refs;try{refs=montageReferences(body.links);}catch(e){throw new InputError(400,e.message);}
 const library=referenceLibrary(root),added=[];
 for(const r of refs){
  const id=createHash('sha256').update(r.platform+':'+r.videoId).digest('hex').slice(0,16);
  let item=library.items.find(i=>i.id===id);
  if(!item){item={...r,id,status:'saved',at:new Date().toISOString()};library.items.push(item);}
  added.push(item);
 }
 writeReferenceLibrary(root,library);return {items:added};
}
export function updateBeatReference(root,id,patch) {
 const library=referenceLibrary(root),item=library.items.find(i=>i.id===id);if(!item)throw new InputError(404,'This reference was not found.');
 Object.assign(item,patch,{updatedAt:new Date().toISOString()});writeReferenceLibrary(root,library);return item;
}
