import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {read,write} from './lib.mjs';
export function alignWords(words,map){
if(map.fps!==30||!Number.isInteger(map.frames)||map.frames<=0||!Array.isArray(map.segments)||!map.segments.length)throw Error('The master needs a complete 30 fps source map. Use the preparation adapter for a whole take.');
if(!words.length||words.some(w=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<=w.start||typeof w.text!=='string'||!w.text.trim()))throw Error('Alignment needs the complete word transcript in source milliseconds.');
for(const s of map.segments)if(![s.srcInMs,s.srcOutMs,s.spineInMs,s.spineOutMs].every(Number.isFinite)||s.srcOutMs<=s.srcInMs||s.spineOutMs<=s.spineInMs)throw Error('A source-map segment has invalid times.');
const aligned=[];
for(const[windex,w]of words.entries()){
 const overlaps=map.segments.map(s=>({s,n:Math.max(0,Math.min(w.end,s.srcOutMs)-Math.max(w.start,s.srcInMs))})).sort((a,b)=>b.n-a.n);
 if(!overlaps[0]?.n)continue;const{s}=overlaps[0];
 const fromMs=Math.max(w.start,s.srcInMs)-s.srcInMs+s.spineInMs;
 const toMs=Math.min(w.end,s.srcOutMs)-s.srcInMs+s.spineInMs;
 aligned.push({sourceIndex:windex,text:w.text,fromMs,toMs});
}
return aligned.sort((a,b)=>a.fromMs-b.fromMs);
}
export function alignProject(project){
project=path.resolve(project);const map=read(path.join(project,'spine-map.json'));
const words=fs.readFileSync(path.join(project,'words.json'),'utf8').split('\n').filter(l=>l.trim()).map(JSON.parse);
const aligned=alignWords(words,map);write(path.join(project,'aligned-words.json'),aligned);
console.log(`Mapped ${aligned.length} words to the master. Inspect boundary words and correct ASR evidence before planning.`);
return aligned;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))alignProject(process.argv[2]);
