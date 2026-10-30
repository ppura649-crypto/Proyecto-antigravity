import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,write,rootOf} from './lib.mjs';

// Keep the copied cut tools on their 30 fps timebase. The original and its transcript
// remain the evidence; the working picture changes cadence, never playback speed.
const here=path.dirname(fileURLToPath(import.meta.url));
const ffmpeg=process.env.KEYFRAMES_FFMPEG||'ffmpeg';
const ffprobe=process.env.KEYFRAMES_FFPROBE||'ffprobe';
const exists=p=>fs.existsSync(p);
export function fingerprint(file){
 const stat=fs.statSync(file),hash=crypto.createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(1024*1024);
 try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}
 return{path:path.resolve(file),size:stat.size,sha256:hash.digest('hex')};
}
export function probe(file){
 const data=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const video=data.streams.find(s=>s.codec_type==='video'),audio=data.streams.find(s=>s.codec_type==='audio');
 if(!video||!audio)throw Error('The original needs both a picture and its recorded audio.');
 const [n,d]=video.avg_frame_rate.split('/').map(Number);
 return{video,audio,fps:n/d,frames:Number(video.nb_frames),videoDuration:Number(video.duration??data.format.duration),audioDuration:Number(audio.duration??data.format.duration)};
}
function resolveFile(value,root,project){
 if(typeof value!=='string')return null;
 const options=path.isAbsolute(value)?[value]:[path.resolve(root,value),path.resolve(project,value)];
 return options.find(exists)??null;
}
function cutScript(root,name){
 const installed=path.join(root,'engine/split-explainer/scripts',name);
 return exists(installed)?installed:path.resolve(here,'../engine/scripts',name);
}
function python(root,name,args){
 execFileSync(process.execPath,[path.join(root,'scripts/py.mjs'),cutScript(root,name),...args],{cwd:root,stdio:'inherit'});
}
function transcriptFor(project,root,doc,original,explicit){
 if(explicit){const p=path.resolve(explicit);if(!exists(p))throw Error('The supplied word transcript is missing.');return p;}
 const saved=resolveFile(doc.transcript,root,project);if(saved)return saved;
 const mediaFile=path.join(root,'context/inputs/media.json');
 const media=exists(mediaFile)?read(mediaFile):{};
 for(const entry of Object.values(media)){
  if(entry&&resolveFile(entry.path,root,project)===original){const p=resolveFile(entry.transcript,root,project);if(p)return p;}
 }
 const local=path.join(project,'words.json');if(exists(local))return local;
 throw Error('Transcribe the complete original with intake first, or supply --transcript with its word timestamps.');
}
export function prepare(project,{transcript}={}){
 project=path.resolve(project);const root=rootOf(project),pj=path.join(project,'project.json'),doc=read(pj);
 if(doc.format!=='split-explainer')throw Error('This project belongs to another format.');
 if(exists(path.join(project,'cuts.json'))||exists(path.join(project,'locks.json')))throw Error('This project already has a cut. Continue its current files; do not replace its preparation.');
 const original=resolveFile(doc.originalSource??doc.source,root,project);
 if(!original)throw Error('The supplied original recording is missing.');
 const words=transcriptFor(project,root,doc,original,transcript),input=fingerprint(original),source=probe(original);
 const startDifference=Math.abs(Number(source.video.start_time??0)-Number(source.audio.start_time??0));
 if(startDifference>.001)throw Error('The original picture and audio have different start timestamps. Resolve their source-time alignment before preparing this recording; no offset has been guessed.');
 const duration=Math.max(source.videoDuration,source.audioDuration),frames=Math.ceil(duration*30-1e-6);
 if(!Number.isFinite(duration)||duration<=0||!Number.isSafeInteger(frames))throw Error('The original duration could not be measured.');
 const work=path.join(project,'.prepare');fs.mkdirSync(work,{recursive:true});
 const normalized=path.join(work,'source-30fps.mov'),receiptFile=path.join(project,'normalization.json');
 const prior=exists(receiptFile)?read(receiptFile):null;
 const reusable=exists(normalized)&&prior?.original?.sha256===input.sha256&&prior?.normalized?.sha256===fingerprint(normalized).sha256;
 if(!reusable){
  const temporary=path.join(work,'source-30fps.tmp.mov'),seconds=frames/30;
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',original,'-map','0:v:0','-map','0:a:0',
   '-vf',`setpts=PTS-STARTPTS,fps=fps=30:start_time=0:round=near,tpad=stop_mode=clone:stop_duration=${Math.max(1,seconds-source.videoDuration+.1)},trim=end_frame=${frames}`,
   '-af',`asetpts=PTS-STARTPTS,apad=whole_dur=${seconds}`,
   '-c:v','libx264','-g','1','-keyint_min','1','-sc_threshold','0','-crf','18','-preset','veryfast','-pix_fmt','yuv420p',
   '-c:a','pcm_s24le','-t',String(seconds),'-movflags','+faststart',temporary],{stdio:'inherit'});
  const checked=probe(temporary);if(checked.fps!==30||checked.frames!==frames)throw Error('Normalization did not produce the complete 30 fps picture.');
  fs.renameSync(temporary,normalized);
  write(receiptFile,{version:1,original:input,normalized:fingerprint(normalized),fps:30,frames,durationMs:frames*1000/30,
   sourceVideoDurationMs:source.videoDuration*1000,sourceAudioDurationMs:source.audioDuration*1000,
   timeline:{sourceTimeScale:1,sourceOffsetMs:0,description:'Source milliseconds are unchanged. Only picture cadence changes; shorter streams are padded at the tail to the final frame.'},at:new Date().toISOString()});
 }
 write(pj,{...doc,originalSource:original,source:normalized,transcript:words});
 python(root,'take.py',['prepare',project]);
 console.log(`Prepared the complete original at 30 fps: ${normalized}`);
 return read(receiptFile);
}
export function whole(project,decisionFile){
 project=path.resolve(project);const root=rootOf(project),doc=read(path.join(project,'project.json'));
 if(doc.format!=='split-explainer')throw Error('This project belongs to another format.');
 const decision=read(path.resolve(decisionFile));
 if(decision.mode!=='whole'||typeof decision.evidence!=='string'||!decision.evidence.trim()||typeof decision.reason!=='string'||!decision.reason.trim())throw Error('A whole-take decision needs mode: whole, the actual request as evidence, and its reason.');
 const receipt=read(path.join(project,'normalization.json'));
 if(fingerprint(doc.source).sha256!==receipt.normalized.sha256||!exists(path.join(project,'words.json')))throw Error('Prepare this original and its complete transcript before keeping the whole take.');
 if(exists(path.join(project,'cuts.json'))||exists(path.join(project,'locks.json')))throw Error('A cut already exists. Resolve that edit before choosing the whole take.');
 python(root,'take.py',['whole',project]);
 const master=path.join(project,'master.mp4'),info=probe(master);
 if(info.fps!==30||info.frames!==receipt.frames)throw Error('The whole master no longer matches the complete normalized picture.');
 const ms=info.frames*1000/30;
 const map={spineDurationMs:ms,fps:30,frames:info.frames,mode:'whole',segments:[{id:'whole',srcInMs:0,srcOutMs:ms,srcInFrame:0,srcOutFrame:info.frames,spineInMs:0,spineOutMs:ms,spineInFrame:0,spineOutFrame:info.frames}]};
 write(path.join(project,'spine-map.json'),map);
 write(path.join(project,'whole-take.json'),{version:1,mode:'whole',decision,original:receipt.original,master:fingerprint(master),map:fingerprint(path.join(project,'spine-map.json')),
  technical:{fps:30,frames:info.frames,recordedAudio:true,sourceTimeScale:1},inspection:{reviewed:false,evidence:''},at:new Date().toISOString()});
 console.log('Whole take mapped. Inspect its complete delivery, opening, ending and voice; record that inspection in whole-take.json.');
 return map;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),project=args[0];
 if(!project)throw Error('prepare.mjs <project> [--transcript <words>] | <project> --whole <decision.json>');
 if(args.includes('--whole')){const file=args[args.indexOf('--whole')+1];if(!file)throw Error('Supply the whole-take decision file.');whole(project,file);}
 else prepare(project,{transcript:args.includes('--transcript')?args[args.indexOf('--transcript')+1]:undefined});
}
