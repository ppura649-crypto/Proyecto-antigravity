import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
export function rootOf(p){let r=path.resolve(p);while(!fs.existsSync(path.join(r,'runtime.json'))&&path.dirname(r)!==r)r=path.dirname(r);if(!fs.existsSync(path.join(r,'runtime.json')))throw Error('Use an installed Keyframes workspace.');return r;}
export function write(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
export async function task(project,stage){const root=rootOf(project);const{beginTask}=await import(pathToFileURL(path.join(root,'scripts/task-status.mjs')).href);return beginTask({root,id:'split-explainer-'+path.basename(project).replace(/[^a-z0-9-]/gi,'-').toLowerCase(),label:'Working on your Split Explainer',project:path.basename(project),format:'split-explainer',stage});}
