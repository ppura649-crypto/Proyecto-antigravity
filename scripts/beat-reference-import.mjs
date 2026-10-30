#!/usr/bin/env node
// Import only explicitly saved video references. A downloaded file still needs the new-format study.
import {mkdirSync,readFileSync,existsSync,createWriteStream,renameSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {referenceLibrary,updateBeatReference} from './beat-references.mjs';
import {montageReference} from './workspace-ui/beat-reference-links.js';
import {safeFile} from './workspace-state.mjs';
import {loadEnv,ffbin,ffenv} from './_lib.mjs';
import {beginTask} from './task-status.mjs';
// The packaged ffprobe lives beside its libraries and only finds them through ffenv; every other binary keeps the plain environment.
const exec=(bin,args,cwd)=>new Promise((accept,reject)=>{
 const p=spawn(bin,args,{cwd,env:ffenv(bin),stdio:['ignore','pipe','pipe']});let out='',err='';
 const timer=setTimeout(()=>{p.kill('SIGTERM');reject(Error('The video took too long to download.'));},180000);
 p.stdout.on('data',b=>{if(out.length<2e6)out+=b;});p.stderr.on('data',b=>{if(err.length<10000)err+=b;});
 p.once('error',e=>{clearTimeout(timer);reject(e);});p.once('exit',code=>{clearTimeout(timer);code===0?accept(out):reject(Object.assign(Error('The video could not be downloaded.'),{detail:err}));});
});
export function downloadFailureMessage(error){
 const detail=String(error?.message||'')+' '+String(error?.detail||'');
 if(/needs Python|ffmpeg.*not found|ffprobe.*not found|No module named/i.test(detail)||error?.code==='ENOENT')return 'The video tools need setup. Your agent can fix them.';
 if(/short video/.test(detail))return 'The downloaded file needs a video under 3 minutes with its music.';
 if(/too long to download|timed? ?out|ETIMEDOUT/i.test(detail))return 'The download timed out.';
 if(/429|too many requests|rate.?limit/i.test(detail))return 'The site is limiting downloads right now.';
 if(/private video|private account|login required|log in|sign in/i.test(detail))return 'This video needs a login to download.';
 if(/HTTP Error (401|403)|forbidden|access denied/i.test(detail))return 'The site blocked this download.';
 if(/removed|deleted|not found|HTTP Error 404/i.test(detail))return 'This video is no longer available at that link.';
 return 'We couldn’t download this video.';
}
export function downloaderArgs(url,target){
 const ref=montageReference(url);
 // Instagram can omit duration. Probe the downloaded file before accepting it.
 // The output is a template, never a fixed name: Instagram serves picture and sound as two streams, and yt-dlp
 // refuses to merge two downloads into one fixed file name ("Fixed output name but more than one file to download").
 // With the extension left to yt-dlp and the merge and remux both set to mp4, the merged file still lands at target.
 const template=target.replace(/\.mp4$/i,'')+'.%(ext)s';
 return ['--ignore-config','--no-playlist','--no-cache-dir','--no-progress','--no-warnings','--socket-timeout','20','--retries','1','--fragment-retries','1','--max-filesize','300M','--match-filter','duration <=? 180','--js-runtimes','node','-f','bv*+ba/b','--merge-output-format','mp4','--remux-video','mp4','-o',template,'--',ref.url];
}
async function downloader(root){
 const venv=join(root,'.keyframes','video-import'),python=join(venv,process.platform==='win32'?'Scripts/python.exe':'bin/python');
 try{await exec('yt-dlp',['--version'],root);return ['yt-dlp',[]];}catch{}
 if(!existsSync(python)){
  mkdirSync(join(root,'.keyframes'),{recursive:true});let created=false;
  for(const bin of process.platform==='win32'?['python','python3']:['python3','python']){try{await exec(bin,['-m','venv',venv],root);created=true;break;}catch{}}
  if(!created)throw Error('The video importer needs Python. The agent can finish its setup.');
 }
 try{await exec(python,['-m','yt_dlp','--version'],root);}catch{await exec(python,['-m','pip','install','yt-dlp[default]'],root);}
 return [python,['-m','yt_dlp']];
}
async function ownInstagramUrl(root,ref){
 if(ref.platform!=='Instagram'||!process.env.COMPOSIO_API_KEY)return null;
 let posts=[];try{posts=JSON.parse(readFileSync(join(root,'context/posts.json'),'utf8'));}catch{}
 const p=posts.find(p=>{try{return montageReference(p.permalink||p.url||'').videoId===ref.videoId;}catch{return p.shortcode===ref.videoId;}});
 if(!p?.id)return null;
 const {Composio}=await import('@composio/core');const sdk=new Composio({apiKey:process.env.COMPOSIO_API_KEY});
 const accounts=await sdk.connectedAccounts.list({userIds:[process.env.COMPOSIO_USER_ID||'keyframes-owner'],toolkitSlugs:['instagram']});
 const account=accounts.items?.find(a=>a.status==='ACTIVE');if(!account)return null;
 const r=await sdk.tools.proxyExecute({connectedAccountId:account.id,endpoint:`/${encodeURIComponent(p.id)}?fields=media_url`,method:'GET'});
 return r.data?.media_url||null;
}
async function saveMedia(url,path){
 // Only the media host returned for the connected Instagram post is fetched here.
 const u=new URL(url);if(u.protocol!=='https:'||!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname))throw Error('This media link is unavailable.');
 const r=await fetch(u,{signal:AbortSignal.timeout(90000),redirect:'error'});if(!r.ok||!r.body)throw Error('This media link is unavailable.');
 let bytes=0;await pipeline(Readable.fromWeb(r.body),new Transform({transform(c,e,done){bytes+=c.length;done(bytes>300*1024**2?Error('This video is too large.'):null,c);}}),createWriteStream(path,{flags:'wx'}));
}
export async function importBeatReferences({root=process.cwd(),download,verify,composioUrl=ownInstagramUrl,composioOnly=false}={}){
 const task=beginTask({root,id:'beat-reference-import',label:'Getting your montage references'}),refs=referenceLibrary(root).items;
 let done=0;const results=[];
 try{
  for(const ref of refs){
   if(ref.source&&safeFile(root,ref.source)){results.push({id:ref.id,status:ref.status});done++;continue;}
   montageReference(ref.url);
   const folder=`workspace/library/beat-montage/references/${ref.id}`,dir=join(root,folder);
   mkdirSync(dir,{recursive:true});if(!safeFile(root,folder)?.stat.isDirectory())throw Error('The reference folder is unavailable.');
   const target=join(dir,'reference.mp4'),temporary=join(dir,'download.mp4');
   updateBeatReference(root,ref.id,{status:'downloading',message:null});task.update({stage:`Getting video ${done+1} of ${refs.length}`,completed:done,total:refs.length});
   try{
    let imported=false;
    try{const url=await composioUrl(root,ref);if(url){await saveMedia(url,temporary);imported=true;}}catch{rmSync(temporary,{force:true});}
    if(!imported){
     if(composioOnly)throw Error('Add this video file to continue.');
     if(download)await download(ref,temporary);else{const [bin,prefix]=await downloader(root);await exec(bin,[...prefix,...downloaderArgs(ref.url,temporary)],root);}
    }
    const probe=verify?await verify(temporary):JSON.parse(await exec(ffbin('ffprobe')||'ffprobe',['-v','error','-show_format','-show_streams','-of','json',temporary],root));
    if(!probe.streams?.some(s=>s.codec_type==='video')||!probe.streams.some(s=>s.codec_type==='audio')||!(Number(probe.format?.duration)>0&&Number(probe.format.duration)<=180))throw Error('Add a short video with its music.');
    renameSync(temporary,target);updateBeatReference(root,ref.id,{source:folder+'/reference.mp4',status:'ready-to-study',message:null});results.push({id:ref.id,status:'ready-to-study'});
   }catch(e){rmSync(temporary,{force:true});const message=downloadFailureMessage(e);updateBeatReference(root,ref.id,{status:'unavailable',message});results.push({id:ref.id,status:'unavailable',message});}
   done++;
  }
  const failed=results.filter(r=>r.status==='unavailable').length;
  task.update({completed:refs.length-failed,total:refs.length});
  if(failed)task.error(`${failed} video${failed===1?'':'s'} could not be downloaded. Upload ${failed===1?'it':'them'} to continue.`);
  else task.done('Reference downloads checked');return results;
 }catch(e){task.error('Reference import needs attention');throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 loadEnv();importBeatReferences({composioOnly:process.argv.includes('--composio-only')}).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
