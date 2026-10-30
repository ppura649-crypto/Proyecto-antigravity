import {readFileSync} from 'node:fs';
import {dirname,basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readListIdeas} from './workspace-list-reel.mjs';
import {phoneInputMember} from './workspace-list-inputs.mjs';
import {safeFile} from './workspace-state.mjs';
import {readOneShotProgress} from './one-shot-progress.mjs';
import {currentShotPlacement,reviewedShot} from './one-shot-input.mjs';
import {readOneShotBatches,changeOneShotBatches as changeBatches} from './one-shot-batches.mjs';
import {InputError} from './workspace-inputs.mjs';
export {readOneShotProgress};
export function changeOneShotBatches(root,body){try{return changeBatches(root,body);}catch(error){throw new InputError(error.status??400,error.message);}}
export function oneShotWorkspace({root,format,files,projects,media,read,file,localPath}) {
 const catalog=Array.isArray(media.clips)?media.clips:Object.values(media.clips||media), library=read('workspace/library/phone.inputs.json',{}), records=catalog.filter(c=>c&&typeof c==='object');
 const clips=files.filter(f=>f.kind==='video'&&f.size>0&&phoneInputMember(f.path)).map(f=>{
  const record=records.find(c=>[c.path,...c.aliases||[]].map(localPath).includes(f.path));
  const key=createHash('sha1').update(`${basename(f.path)}:${f.size}`).digest('hex').slice(0,16);
  const placement=read(`${dirname(f.path)}/.places/${key}.json`,null,true);
  const camera=read('context/inputs/one-shot.json',{}).clips?.[f.path],original=safeFile(root,f.path);
  const current=currentShotPlacement(placement,f.path,original?.stat,root),cameraReady=reviewedShot(placement,camera,f.path,original?.stat,root);
  const prepared=!!(cameraReady&&file(localPath(record?.mezzanine)));
  return {...f,preview:record?.mezzanine?file(localPath(record.mezzanine)):null,duration:record?.duration,thumbnail:(record?.thumbnails||[]).map(p=>file(localPath(p))).find(Boolean),prepared,analysis:{current,finding:cameraReady?camera.finding:null,why:current?placement.why:null,band:current?placement.band:null,sheet:current?file(localPath(placement.sheet),true):null}};
 });
 const selected=clips.find(c=>c.path===localPath(library.selected))?.path||clips[0]?.path||null;
 const available=files.filter(f=>f.kind==='video'&&f.size>0&&f.path.startsWith('workspace/input/')&&!phoneInputMember(f.path));
 const looks=['plain','wide-caps','poster','big-number','card'].map(id=>{const style=read(`packs/quick-cuts/styles/phone-${id}.json`,null)||read(`scripts/quick-cuts/styles/phone-${id}.json`,null);if(!style)return null;return {id,name:style.name,style,font:file('assets/quick-cuts/fonts/'+style.fonts.text)};}).filter(Boolean);
 const descriptor=(path,text=false)=>{const f=file(path);if(!f)return null;const source=safeFile(root,path);return {...f,...(text&&source&&source.stat.size<65536?{text:readFileSync(source.path,'utf8')}: {})};};
 for(const p of projects.filter(p=>p.format==='phone')){
  const state=p.oneShot||readOneShotProgress(p.path,{root}).oneShot;
  const base=state.delivered?p.outputPath:p.path;
  const currentVideo=state.checked?descriptor(base+(state.delivered?'/final.mp4':'/renders/final.mp4')):null;
  const previousRenders=p.files.filter(f=>f.kind==='video'&&(f.path.startsWith(p.path+'/renders/')||f.path.startsWith(p.outputPath+'/'))&&f.path!==currentVideo?.path);
  p.oneShot={...state,video:currentVideo,still:state.checked?descriptor(p.path+'/renders/still.png'):null,previousRenders,caption:descriptor(base+'/caption.txt',true),document:{...state.document,preview:state.document.ready?descriptor(p.path+'/document-preview.png'):null,html:state.document.ready?descriptor(base+'/document.html'):null,pdf:state.document.ready?descriptor(base+'/document.pdf'):null},reply:descriptor(base+'/reply.txt',true)};
 }
 const fonts=(read('assets/quick-cuts/fonts/fonts.json',{}).fonts||[]).map(face=>({...file('assets/quick-cuts/fonts/'+face.file),...face})).filter(face=>face.url);
 const custom=format.answers?.customFonts??[],registry=read('workspace/library/fonts/fonts.json',{}).fonts??[];
 for(const entry of registry){const chosen=custom.find(c=>c.id===entry.id&&c.family===entry.family);if(!chosen||typeof entry.file!=='string'||entry.file.startsWith('/')||entry.file.split('/').some(p=>p==='..'||p.startsWith('.')))continue;const installed=file('workspace/library/fonts/'+entry.file);if(installed?.kind==='font'&&!fonts.some(f=>f.id===entry.id))fonts.push({...chosen,...installed,name:entry.family,captionSafe:true});}
 return {fonts,batches:readOneShotBatches(root,projects),lookReading:read('workspace/library/phone.look.json',null),ideas:readListIdeas(root,projects.filter(p=>p.format==='phone'),'phone'),inputs:{clips,available,selected,total:clips.length,ready:clips.some(c=>c.path===selected&&c.prepared)},looks,documents:projects.filter(p=>p.format==='phone'&&p.oneShot?.document?.ready).map(p=>({project:p.id,...p.oneShot.document}))};
}
