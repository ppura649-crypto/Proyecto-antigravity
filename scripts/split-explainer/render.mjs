import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderStill,renderMedia,selectComposition} from '@remotion/renderer';
import {chromium} from 'playwright';
import {validate} from './validate.mjs';
import {read,rootOf,task,write} from './lib.mjs';
import {presenterInputs,composite} from './composite.mjs';

const args=process.argv.slice(2),project=path.resolve(args[0]??'');
const plan=validate(project,{built:true}),root=rootOf(project),master=path.join(project,'master.mp4');
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-of','json',file],{encoding:'utf8'}));
const info=probe(master),video=info.streams.find(s=>s.codec_type==='video');
if(!video||!info.streams.some(s=>s.codec_type==='audio'))throw Error('The master needs its picture and recorded voice.');
const rate=video.avg_frame_rate.split('/').map(Number);
if(Number(video.nb_read_frames)!==plan.frames||Math.abs(rate[0]/rate[1]-plan.fps)>.001)throw Error('Master cadence or frame count differs from the plan.');
const still=args.includes('--still'),range=args.includes('--range');
const chunkFrames=args.includes('--chunk-frames')?Number(args[args.indexOf('--chunk-frames')+1]):240;
if(!Number.isInteger(chunkFrames)||chunkFrames<30||chunkFrames>240)throw Error('Chunk frames must be an integer from30to240.');
const first=still?Number(args[args.indexOf('--still')+1]):range?Number(args[args.indexOf('--range')+1]):0;
const end=still?first+1:range?Number(args[args.indexOf('--range')+2]):plan.frames;
if(!Number.isInteger(first)||!Number.isInteger(end)||first<0||end>plan.frames||first>=end)throw Error('Invalid render frame interval.');
const work=path.join(project,'.render'),assets=path.join(project,'assets');
fs.mkdirSync(work,{recursive:true});fs.mkdirSync(path.join(assets,'fonts'),{recursive:true});
if(!plan.look.fontFile)fs.copyFileSync(path.join(root,'assets/split-explainer/fonts/Inter-Black.ttf'),path.join(assets,'fonts/Inter-Black.ttf'));
const stage=path.join(root,'engine/split-explainer/render/Stage.tsx'),entry=path.join(work,'entry.tsx');
fs.writeFileSync(entry,`import React from 'react';\nimport {registerRoot,Composition} from 'remotion';\nimport {Stage} from ${JSON.stringify(stage)};\nimport {Visual} from ${JSON.stringify(path.join(project,'visuals.tsx'))};\nconst Video=(props:any)=><Stage {...props} Visual={Visual}/>;\nregisterRoot(()=> <Composition id="SplitExplainer" component={Video} fps={${plan.fps}} width={${plan.width}} height={${plan.height}} durationInFrames={${plan.frames}} defaultProps={{plan:null,captions:[],layer:'all'}}/>);\n`);
const progress=await task(project,still?'Checking a composed frame':'Rendering your visual video');
try{
 const presenter=await presenterInputs(project,plan),browserExecutable=chromium.executablePath();
 const serveUrl=await bundle({entryPoint:entry,publicDir:assets,outDir:path.join(work,'bundle')});
 const props={plan,captions:read(path.join(project,'captions.json'))};
 const composition=await selectComposition({serveUrl,id:'SplitExplainer',inputProps:props,browserExecutable});
 const draw=async(layer,from,to)=>{
  const file=path.join(work,`${layer}-${from}-${to}.${still?'png':'mov'}`);
  const inputProps={...props,layer};
  const selected={...composition,props:inputProps};
  if(still)await renderStill({serveUrl,composition:selected,inputProps,output:file,frame:from,browserExecutable});
  else await renderMedia({serveUrl,composition:selected,inputProps,outputLocation:file,frameRange:[from,to-1],codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,browserExecutable,concurrency:Number(process.env.RENDER_CONCURRENCY??2),chromiumOptions:process.env.RENDER_GL?{gl:process.env.RENDER_GL}:{},onProgress:({progress:p})=>progress.update({stage:`${layer==='scene'?'Graphics':'Captions'}: frames ${from} to ${to}`,completed:Math.round(p*100),total:100})});
  return file;
 };
 fs.mkdirSync(path.join(project,'checks'),{recursive:true});
 let output;
 if(still){
  const sceneFile=await draw('scene',first,end),captionFile=await draw('captions',first,end);
  output=path.join(project,`checks/frame-${String(first).padStart(5,'0')}.png`);
  composite({plan,master,sceneFile,captionFile,presenter,from:first,to:end,output,still:true});
 }else{
  const parts=[];
  for(let from=first;from<end;from+=chunkFrames){
   const to=Math.min(end,from+chunkFrames),sceneFile=await draw('scene',from,to),captionFile=await draw('captions',from,to);
   const output=path.join(work,`part-${String(from).padStart(6,'0')}.mp4`);
   progress.update({stage:`Composing frames ${from} to ${to}`});
   composite({plan,master,sceneFile,captionFile,presenter,from,to,output});
   const checked=probe(output).streams.find(s=>s.codec_type==='video');
   if(Number(checked?.nb_read_frames)!==to-from)throw Error('A composed section has missing frames.');
   parts.push(output);fs.unlinkSync(sceneFile);fs.unlinkSync(captionFile);
  }
  const list=path.join(work,'parts.txt');fs.writeFileSync(list,parts.map(p=>`file '${path.basename(p)}'`).join('\n')+'\n');
  output=range?path.join(project,`checks/motion-${first}-${end}.mp4`):path.join(project,'final.mp4');
  const temporary=output.replace(/\.mp4$/,'.tmp.mp4');
  // AAC packet tails can extend slightly past the last picture. A full export preserves
  // every master packet; only a requested excerpt gets an explicit duration cap.
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,...(range?['-ss',String(first/plan.fps)]:[]),'-i',master,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a',range?'aac':'copy',...(range?['-t',String((end-first)/plan.fps)]:[]),'-movflags','+faststart',temporary],{stdio:'inherit'});
  const checked=probe(temporary),v=checked.streams.find(s=>s.codec_type==='video');
  if(Number(v.nb_read_frames)!==end-first||v.width!==plan.width||v.height!==plan.height)throw Error('Final picture differs from the complete render interval.');
  let voiceHash;
  if(!range){
   const hash=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();
   voiceHash=hash(master);if(hash(temporary)!==voiceHash)throw Error('Final voice packets differ from the master.');
  }
  fs.renameSync(temporary,output);
  if(!range)write(path.join(project,'render-check.json'),{frames:Number(v.nb_read_frames),expected:plan.frames,width:v.width,height:v.height,voice:'mapped once from master with stream copy',voiceHash,addedSound:false,presenterMatte:Boolean(presenter),captionLayer:'above presenter',at:new Date().toISOString()});
 }
 progress.done(still?'Frame ready':'Visual export ready for inspection');console.log(output);
}catch(e){progress.error(e.message);throw e;}
