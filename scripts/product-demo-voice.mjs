// Voice setup uses saved preferences and key presence, never exposed credentials.
import {readFileSync,existsSync,lstatSync,mkdirSync,writeFileSync,renameSync,rmSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {normalizeProductVoice,productVoiceLabel,productVoiceProviders,productVoiceKeyName,PRODUCT_VOICE_VERSION} from './workspace-ui/product-demo-voice.js';
import {assertLookPreferences,makeLookPreferencesSync} from './look-preferences.mjs';
const start='<!-- keyframes:product-demo-voice:start -->',end='<!-- keyframes:product-demo-voice:end -->';
export function productVoiceStatus(root,env=process.env) {
  let values={};
  const file=join(root,'.env.local');
  if(existsSync(file)&&!lstatSync(file).isSymbolicLink()){
    for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(m)values[m[1]]=m[2].replace(/^["']|["']$/g,'').trim();}
  }
  return {keys:Object.fromEntries(productVoiceProviders.filter(p=>productVoiceKeyName(p.id)).map(p=>[p.id,Boolean(values[productVoiceKeyName(p.id)]||env[productVoiceKeyName(p.id)]?.trim()||(p.id==='fish'&&(values.FISH_AUDIO_API_KEY||env.FISH_AUDIO_API_KEY?.trim())))]))};
}
export class ProductVoiceKeyError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
export function saveProductVoiceKey(root,input) {
  root=realpathSync(root);
  const registry=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8'));
  // Product Demo and Full Visual both narrate with the buyer's own key, saved here the same way.
  if(!registry.packs?.some(p=>['product-demo','full-visual'].includes(p.name)))throw new ProductVoiceKeyError(400,'Use the folder with a voice format installed.');
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['provider','key'].includes(k)))throw new ProductVoiceKeyError(400,'Choose a voice service and paste its API key.');
  const provider=productVoiceProviders.find(p=>p.id===input.provider),name=productVoiceKeyName(input.provider);
  if(!provider||!name)throw new ProductVoiceKeyError(400,'Choose a voice service for this key.');
  const key=input.key??'';
  if(typeof key!=='string'||key.length>8192||/[\r\n\0]/.test(key)||key.trim()&&!/^[a-zA-Z0-9_.:/+=-]+$/.test(key.trim()))throw new ProductVoiceKeyError(400,'Paste only your API key.');
  const path=join(root,'.env.local');
  try{if(lstatSync(path).isSymbolicLink())throw new ProductVoiceKeyError(409,'Keep keys in the original Keyframes folder.');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!key.trim()){
    const status=productVoiceStatus(root);
    if(provider.key&&!status.keys[provider.id])throw new ProductVoiceKeyError(400,'Paste your '+provider.name+' API key.');
    return {ok:true,...status};
  }
  const previous=existsSync(path)?readFileSync(path,'utf8'):'';
  const lines=previous.split(/\r?\n/).filter(line=>line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/)?.[1]!==name);
  const content=lines.join('\n').replace(/\n*$/,'')+(lines.some(line=>line)?'\n':'')+name+'='+key.trim()+'\n';
  const temporary=path+'.'+randomUUID()+'.tmp';
  try{writeFileSync(temporary,content,{mode:0o600,flag:'wx'});renameSync(temporary,path);}finally{rmSync(temporary,{force:true});}
  return {ok:true,...productVoiceStatus(root)};
}
export function saveProductVoice(root,input,{preferencesRevision}={}) {
  root=resolve(root);
  const voice=normalizeProductVoice(input);
  const registry=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8'));
  if(!registry.packs?.some(p=>p.name==='product-demo'))throw Error('Use the folder with Product Demo installed.');
  for(const name of ['workspace','workspace/library','workspace/library/product-demo.json','workspace/library/product-demo.preferences.md']){
    const path=join(root,name);if(existsSync(path)&&lstatSync(path).isSymbolicLink())throw Error('Keep voice preferences inside your workspace.');
  }
  const folder=join(root,'workspace/library');mkdirSync(folder,{recursive:true});
  const file=join(folder,'product-demo.json'),prefPath='workspace/library/product-demo.preferences.md',pref=join(root,prefPath);
  const previous=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{};
  const text=existsSync(pref)?readFileSync(pref,'utf8'):'';
  assertLookPreferences({text,sync:previous.preferencesSync,start,end,path:prefPath,explicit:true,preferencesRevision});
  const clean=value=>value.replaceAll('<','&lt;').replaceAll('>','&gt;');
  const block=`${start}\n## Voice\n\n${voice.provider==='none'?'Use no voiceover.':`Use ${clean(productVoiceLabel(voice))} for narration. ${voice.voice?'Preferred voice: '+clean(voice.voice)+'.':'Choose a voice that suits the product.'}`}\n${end}`;
  const first=text.indexOf(start),last=text.indexOf(end);
  if((first<0)!==(last<0)||first>=0&&(last<first||text.indexOf(start,first+start.length)>=0||text.indexOf(end,last+end.length)>=0))throw Error('Repair the saved Voice section before changing it.');
  const markdown=first<0?text+(text?(text.endsWith('\n\n')?'':text.endsWith('\n')?'\n':'\n\n'):'')+block+'\n':text.slice(0,first)+block+text.slice(last+end.length);
  const data={...previous,answers:{...previous.answers,voice},setup:{...previous.setup,done:true,at:new Date().toISOString(),version:PRODUCT_VOICE_VERSION},preferencesSync:makeLookPreferencesSync(markdown,{start,end,path:prefPath})};
  const staged=[[pref,markdown],[file,JSON.stringify(data,null,2)+'\n']].map(([path,content])=>({path,content,temp:path+'.'+randomUUID()+'.tmp',old:existsSync(path)?readFileSync(path):null}));
  const written=[];
  try{for(const entry of staged)writeFileSync(entry.temp,entry.content);for(const entry of staged){renameSync(entry.temp,entry.path);written.push(entry);}}
  catch(error){for(const entry of written){if(entry.old===null)rmSync(entry.path);else writeFileSync(entry.path,entry.old);}throw error;}
  finally{for(const entry of staged)rmSync(entry.temp,{force:true});}
  return {ok:true,voice,preferences:prefPath,setup:data.setup,...productVoiceStatus(root)};
}
