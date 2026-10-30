// Derive one-shot progress from current content and checked delivery files.
import {readFileSync,existsSync,statSync,realpathSync} from 'node:fs';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {documentProblems} from './one-shot-document.mjs';
export const oneShotHash = x => createHash('sha256').update(x).digest('hex');
export function oneShotFile(root,path) {try {const abs=resolve(root,path),rel=relative(realpathSync(root),realpathSync(abs));if(!rel||rel.startsWith('..')||isAbsolute(rel)||!statSync(abs).isFile())return null;return abs;}catch{return null;}}
export function oneShotJSON(root,path,fallback=null) {try {const p=oneShotFile(root,path);return p&&statSync(p).size<4*1024**2?JSON.parse(readFileSync(p,'utf8')):fallback;}catch{return fallback;}}
export const ONE_SHOT_FILES=['brief.md','content.json','research.md','caption.txt','document.json','document.html','document.pdf','document.check.json','reply.txt','props/phone-text.json','props/phone-geometry.json','props/phone-placement-request.json','props/checks.json','props/export.json','placement.review.json','renders/still.png','renders/final.mp4'];
export const ONE_SHOT_REQUIRED_CHECKS=['duration','still-exists','caption'];
export function oneShotChecksReady(wanted,results) {
 return Array.isArray(wanted)&&wanted.length>0&&wanted.every(c=>typeof c?.name==='string')&&new Set(wanted.map(c=>c.name)).size===wanted.length&&ONE_SHOT_REQUIRED_CHECKS.every(name=>wanted.some(c=>c.name===name))&&Array.isArray(results)&&results.length===wanted.length&&results.every((c,i)=>c?.name===wanted[i].name&&c.pass===true);
}
export function oneShotFingerprint(dir,{root=process.cwd()}={}) {
 const project=oneShotJSON(root,join(dir,'project.json'),{}),paths=[...ONE_SHOT_FILES,...['source','mezzanine','placement'].map(k=>project[k]).filter(Boolean)];
 const input=oneShotJSON(root,'context/inputs/one-shot.json',{}).clips?.[project.source];
 const camera=input?{personVisible:input.personVisible===true||input.facingCamera===true,continuous:input.continuous,unedited:input.unedited,bytes:input.bytes,mtimeMs:input.mtimeMs}:null;
 return oneShotHash(JSON.stringify([camera,...paths.map(p=>{const path=ONE_SHOT_FILES.includes(p)?join(dir,p):p,full=oneShotFile(root,path);if(!full)return [p,null];const st=statSync(full);return [p,/\.(mp4|mov|mkv)$/i.test(p)?[st.size,st.mtimeMs]:oneShotHash(readFileSync(full))];})]));
}
export function readOneShotProgress(dir,{root=process.cwd()}={}) {
 dir=resolve(root,dir);const project=oneShotJSON(root,join(dir,'project.json'),{}),content=oneShotJSON(root,join(dir,'content.json')),document=oneShotJSON(root,join(dir,'document.json'));
 const has=name=>{const f=oneShotFile(root,join(dir,name));return !!f&&statSync(f).size>0;};
 const caption=has('caption.txt')?readFileSync(join(dir,'caption.txt'),'utf8'):'';
 const sources=document?.sources||[],researchReady=Boolean(content?.hook?.trim()&&caption.trim()&&has('research.md')&&document&&!documentProblems(document,{fresh:false}).length);
 const paper=oneShotJSON(root,join(dir,'document.check.json'));
 const documentReady=Boolean(document&&paper?.pass&&paper.revision===oneShotHash(JSON.stringify(document))&&['document.html','document.pdf'].every(name=>has(name)&&paper.files?.[name]===oneShotHash(readFileSync(join(dir,name)))));
 const revision=oneShotFingerprint(dir,{root}),receipt=oneShotJSON(root,join(dir,'one-shot.check.json')),checks=oneShotJSON(root,join(dir,'check.json'),[]);
 const checked=!!(receipt?.revision===revision&&receipt.pass&&receipt.checksHash===oneShotHash(JSON.stringify(checks))&&oneShotChecksReady(oneShotJSON(root,join(dir,'props/checks.json')),checks));
 const delivery=oneShotJSON(root,join(dir,'delivery.json'));const output=project.output;
 const delivered=Boolean(checked&&output&&delivery?.revision===revision&&['final.mp4','caption.txt','document.html','document.pdf','reply.txt'].every(name=>{const f=oneShotFile(root,join(output,name));return f&&delivery.files?.[name]===oneShotHash(readFileSync(f));}));
 const current=delivered?'delivery':checked?'review':researchReady?'create':'research';
 const labels=[['research','Research'],['create','Reel & document'],['review','Review'],['delivery','Ready']];
 const pos=labels.findIndex(([id])=>id===current);
 return {steps:labels.map(([id,label],i)=>({id,label,status:delivered||i<pos?'done':i===pos?'current':'pending',owner:'agent'})),progress:{current:delivered?null:current,status:delivered?'complete':'active',completed:delivered?4:pos,total:4,revision},oneShot:{content,caption:{text:caption},research:{sources,ready:researchReady},document:{title:document?.title,summary:document?.summary,kind:document?.kind,ready:documentReady},needsFootage:!oneShotFile(root,project.source||''),checked,delivered,revision}};
}
