import fs from 'node:fs';
import path from 'node:path';
import {read,write,rootOf} from './lib.mjs';
import {fingerprint} from './prepare.mjs';
const args=process.argv.slice(2),project=path.resolve(args[0]??''),root=rootOf(project);
const pj=path.join(project,'project.json');
if(args.includes('--init')){if(fs.existsSync(pj))throw Error('Project already exists. Resume its current files.');const i=args.indexOf('--source');if(i<0||!fs.existsSync(args[i+1]))throw Error('Supply --source with the original recording.');write(pj,{format:'split-explainer',source:path.resolve(args[i+1]),state:'draft',reviewMode:'self',created_at:new Date().toISOString()});}
if(read(pj).format!=='split-explainer')throw Error('This project belongs to another format.');
const exists=n=>fs.existsSync(path.join(project,n));
const before=args[args.indexOf('--before')+1];
if(args.includes('--before')&&before==='transcript'&&!exists('words.json'))throw Error('Prepare the complete word transcript first.');
const map=exists('spine-map.json')?read(path.join(project,'spine-map.json')):null;
const whole=exists('whole-take.json')?read(path.join(project,'whole-take.json')):null;
const wholeReady=exists('master.mp4')&&!exists('cuts.json')&&map?.mode==='whole'&&whole?.mode==='whole'
 &&whole.decision?.mode==='whole'&&Boolean(whole.decision?.evidence?.trim())&&Boolean(whole.decision?.reason?.trim())
 &&whole.inspection?.reviewed===true&&Boolean(whole.inspection?.evidence?.trim())
 &&whole.master?.sha256===fingerprint(path.join(project,'master.mp4')).sha256
 &&whole.map?.sha256===fingerprint(path.join(project,'spine-map.json')).sha256;
const cutReady=exists('master.mp4')&&exists('cuts.json')&&map&&map.mode!=='whole'&&exists('cleanup.json')&&exists('locks.json')&&Boolean(read(path.join(project,'locks.json')).cut);
const delivery=exists('delivery.json')?read(path.join(project,'delivery.json')):null;
const deliveredPath=typeof delivery?.output==='string'&&delivery.output.trim()?path.resolve(root,delivery.output):null;
const delivered=deliveredPath&&fs.existsSync(deliveredPath)&&fs.statSync(deliveredPath).isFile()&&fs.statSync(deliveredPath).size>0;
const rows=[['prepare','Preparation',Boolean(wholeReady||cutReady)],['plan','Visual plan',exists('visual-plan.md')&&exists('layout-plan.json')],['build','Visuals and captions',exists('visuals.tsx')&&exists('captions.json')],['render','Render',exists('final.mp4')],['deliver','Delivery',Boolean(delivered)]];
let prior=true;const steps=rows.map(([id,name,evidence])=>{const complete=prior&&evidence;prior=complete;return{id,name,state:complete?'done':'pending',evidence:Boolean(evidence)}});
const result={format:'split-explainer',steps,current:steps.find(s=>s.state!=='done')?.id??null,status:steps.every(s=>s.state==='done')?'complete':'active'};
write(path.join(project,'steps.json'),result);
if(!args.includes('--quiet'))console.log(JSON.stringify(result,null,2));
