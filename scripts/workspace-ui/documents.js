import {createDocumentScene} from './document-scenes.js';
import {createDocumentRaster} from './document-motion.js';

// Documents keep their real paths. Their sculpture describes their role.
const documentEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const documentStills=new Map();
function documentType(path) {
 if(/(?:^|\/)(?:\d{4}-\d{2}-\d{2}-)?talking-head(?:[./-]|$)/i.test(path))return 'face';
 if(/(?:^|\/)(?:\d{4}-\d{2}-\d{2}-)?trial-reels(?:[./-]|$)/i.test(path))return 'trial-reels';
 if(/(?:^|\/)(?:\d{4}-\d{2}-\d{2}-)?(?:quick-cuts|beat-montage|scroll-reel|phone)(?:[./-]|$)/i.test(path))return 'quick-cuts';
 if(/preferences?\.md$/i.test(path))return 'preferences';
 if(/(?:profile|audience|about)\.md$/i.test(path))return 'profile';
 if(/(?:voice|words|transcript|captions|text-system)\.md$/i.test(path))return 'voice';
 if(/(?:formats|look|style|assets)\.md$/i.test(path))return 'formats';
 if(/(?:SKILL|AGENTS|CLAUDE|README|START-HERE|SPEC)\.md$/i.test(path))return 'instructions';
 return 'document';
}
export function documentArtwork(path) {
 const type=documentType(path);
 if(!documentStills.has(type))documentStills.set(type,createDocumentRaster().draw(createDocumentScene(type,0),4).text());
 return documentStills.get(type);
}
export function documentGroups(files,{formats=[]}={}) {
 const byPath=new Map(files.map(file=>[file.path,file]));
 const general=[['preferences','Preferences'],['profile','About you'],['voice','Voice'],['formats','Formats'],['text-system','On-screen words']].flatMap(([id,name])=>{
  const file=byPath.get(`context/${id}.md`);return file?[{...file,name}]:[];
 });
 const selected=new Map();
 for(const format of formats){
  for(const template of format.beat?.templates||[]){const path=template.preferencesPath;if(path&&/^workspace\/library\/beat-montage\/[a-z0-9-]+\/preferences\.md$/.test(path))selected.set(path,{...byPath.get(path),path,name:template.name,format:format.id,template:template.id});}
  const path=format.preferencesPath;
  if(!path||!/^workspace\/library\/[^/]+\.preferences\.md$/i.test(path)||selected.has(path))continue;
  const name=path==='workspace/library/quick-cuts.preferences.md'?'Quick Cuts':format.name;
  selected.set(path,{...byPath.get(path),path,name});
 }
 return [{id:'general',name:'General',files:general},{id:'formats',name:'Format preferences',files:[...selected.values()]}];
}
export function documentCards(files,{href=path=>path}={}) {
 return files.filter(file=>/\.md$/i.test(file.path)).map(file=>{
  const route='/files?file='+encodeURIComponent(file.path)+(file.template?'&format='+encodeURIComponent(file.format)+'&template='+encodeURIComponent(file.template):''),name=file.name||file.path.split('/').pop();
  return `<a class="ascii-document" href="${documentEscape(href(route))}" data-route="${documentEscape(route)}" data-document-path="${documentEscape(file.path)}" title="${documentEscape(file.path)}"><span class="ascii-document-stage" aria-hidden="true"><canvas class="ascii-document-canvas" width="1" height="1" data-document-scene="${documentType(file.path)}"></canvas><pre class="ascii-document-art">${documentEscape(documentArtwork(file.path))}</pre></span><span class="ascii-document-caption"><span class="ascii-document-name">${documentEscape(name)}</span><span class="ascii-document-open" aria-hidden="true">↗</span></span><span class="ascii-document-path">${documentEscape(file.path)}</span></a>`;
 }).join('');
}
export function documentShelf(files,{href,query='',formats=[]}={}) {
 const groups=documentGroups(files,{formats});
 const sections=groups.map(group=>`<section class="document-section" data-document-group="${group.id}" aria-labelledby="document-${group.id}-title" ${group.files.length?'':'hidden'}><h2 id="document-${group.id}-title">${group.name}</h2><div class="document-grid">${documentCards(group.files,{href})}</div></section>`).join('');
 return `<div class="document-toolbar"><label class="document-search"><span class="sr-only">Find a document</span><input type="search" id="document-search" placeholder="Find a document" value="${documentEscape(query)}" autocomplete="off" spellcheck="false" aria-controls="document-grid"></label><button class="document-motion-toggle" type="button" data-document-motion aria-label="Pause document animations" title="Pause document animations"><svg viewBox="0 0 20 20" aria-hidden="true"><path class="document-pause" d="M7 5v10M13 5v10"/><path class="document-play" d="m7 4 8 6-8 6Z"/></svg></button></div><div class="document-sections" id="document-grid">${sections}</div><div class="document-empty" id="document-empty" role="status" hidden><p>No matching documents.</p></div>`;
}
function reconcileDocumentCards(grid,files,options) {
 // Keep existing links and canvases in place during background refetches.
 // Keyboard focus, animation phase and pointer tilt belong to that document.
 const template=document.createElement('template');template.innerHTML=documentCards(files,options);
 const existing=new Map([...grid.children].map(tile=>[tile.dataset.documentPath,tile]));
 const focused=grid.contains(document.activeElement)?document.activeElement:null;
 const incoming=new Set([...template.content.children].map(tile=>tile.dataset.documentPath));
 for(const [path,tile] of existing)if(!incoming.has(path)){tile.remove();existing.delete(path);}
 let cursor=grid.firstElementChild;
 for(const next of template.content.children){
  const path=next.dataset.documentPath,tile=existing.get(path)||next.cloneNode(true);existing.delete(path);
  if(tile!==cursor)grid.insertBefore(tile,cursor);
  tile.href=next.href;tile.dataset.route=next.dataset.route;tile.title=next.title;tile.querySelector('.ascii-document-name').textContent=next.querySelector('.ascii-document-name').textContent;
  cursor=tile.nextElementSibling;
 }
 for(const tile of existing.values())tile.remove();
 if(focused?.isConnected&&document.activeElement!==focused)focused.focus({preventScroll:true});
}
export function updateDocumentCards(root,files,options) {
 for(const group of documentGroups(files,options))reconcileDocumentCards(root.querySelector(`[data-document-group="${group.id}"] .document-grid`),group.files,options);
}
export function filterDocuments(query='',root=document) {
 const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 let matches=0;
 for(const tile of root.querySelectorAll('[data-document-path]')){
  const name=(tile.dataset.documentPath+' '+tile.querySelector('.ascii-document-name').textContent).toLocaleLowerCase();
  tile.hidden=!words.every(word=>name.includes(word));
  if(!tile.hidden)matches++;
 }
 for(const section of root.querySelectorAll('[data-document-group]'))section.hidden=!section.querySelector('[data-document-path]:not([hidden])');
 const empty=root.querySelector('#document-empty');if(empty){empty.hidden=matches>0;empty.querySelector('p').textContent=query.trim()?'No matching documents.':'Your documents will appear here.';}
}
