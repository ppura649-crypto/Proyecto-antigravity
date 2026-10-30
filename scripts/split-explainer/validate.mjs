import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {read} from './lib.mjs';
import {captionErrors} from './caption-check.mjs';
export function validate(project,{built=false}={}){
 const plan=read(path.join(project,'layout-plan.json'));const words=read(path.join(project,'aligned-words.json'));const errors=[];
 const need=(yes,msg)=>{if(!yes)errors.push(msg)};
 need(plan.fps===30,'Use the verified 30 fps master timebase.');need(plan.width===1080&&plan.height===1920,'The initial format is 1080x1920.');need(Number.isInteger(plan.frames)&&plan.frames>0,'frames must be a positive integer.');
 need(Array.isArray(plan.scenes)&&plan.scenes.length>0,'Plan the complete video.');need(plan.look&&typeof plan.look.background==='string','Resolve the project look first.');
 const top=plan.look?.splitTop??.56;need(top>=.35&&top<=.7,'splitTop must leave usable regions for both subjects.');
 if(plan.look?.fullScale!==undefined)need(Number.isFinite(plan.look.fullScale)&&plan.look.fullScale>=1,'fullScale must be at least 1.');
 const ids=new Set();let cursor=0;
 for(const s of plan.scenes??[]){
  need(typeof s.id==='string'&&!ids.has(s.id),`Duplicate or absent scene id: ${s.id}`);ids.add(s.id);
  need(Number.isInteger(s.from)&&Number.isInteger(s.to)&&s.from===cursor&&s.to>s.from,`${s.id}: gap, overlap or invalid frame bounds.`);cursor=s.to;
  need(['split','visual','presenter'].includes(s.mode),`${s.id}: unknown mode.`);
  for(const k of ['viewerQuestion','understanding','reason','captionJob',...(s.mode==='presenter'?[]:['initial','action','result'])])need(typeof s[k]==='string'&&s[k].trim().length>0,`${s.id}: missing ${k}.`);
  need(Array.isArray(s.anchors)&&s.anchors.length>0,`${s.id}: name at least one real spoken anchor.`);
  for(const a of s.anchors??[]){const w=words[a.wordIndex];need(Boolean(w),`${s.id}: unknown word index ${a.wordIndex}.`);need(Number.isInteger(a.frame)&&a.frame>=s.from&&a.frame<s.to,`${s.id}: anchor outside scene.`);need(typeof a.role==='string'&&a.role.length>0,`${s.id}: anchor needs a role.`);if(w)need(Math.abs(a.frame-plan.fps*w.fromMs/1000)<=2||Boolean(a.leadReason),`${s.id}: deliberate anticipation or delay needs a reason.`);}
  if(s.mode!=='presenter')need(typeof s.artifact==='string'&&s.artifact.length>0&&typeof s.provenance==='string'&&s.provenance.length>0,`${s.id}: identify the concrete artifact and its provenance.`);
  if(s.mode==='split')need(['faceX','faceY'].every(k=>Number.isFinite(plan.look?.[k])&&plan.look[k]>=0&&plan.look[k]<=1),`${s.id}: set faceX and faceY from the actual composed crop.`);
  if(s.visualHeight!==undefined)need(Number.isFinite(s.visualHeight)&&s.visualHeight>0&&s.visualHeight<=1,`${s.id}: visualHeight must be a fraction of the canvas.`);
 }
 need(cursor===plan.frames,'Timeline must end at the master frame count.');
 if(fs.existsSync(path.join(project,'spine-map.json')))need(read(path.join(project,'spine-map.json')).frames===plan.frames,'Plan duration differs from the cut master.');
 if(built){for(const n of ['master.mp4','visuals.tsx','captions.json'])need(fs.existsSync(path.join(project,n)),`Missing ${n}.`);if(fs.existsSync(path.join(project,'captions.json')))errors.push(...captionErrors(read(path.join(project,'captions.json')),plan));}
 if(errors.length)throw Error(errors.join('\n'));return plan;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const p=validate(path.resolve(process.argv[2]),{built:process.argv.includes('--built')});console.log(`${p.scenes.length} scenes, complete timeline, valid spoken anchors. Creative quality still requires inspection.`);}
