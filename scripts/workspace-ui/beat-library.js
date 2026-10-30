import {montageReferences} from './beat-reference-links.js';
import {agentPrompt,syncAgentPrompts} from './agent-prompts.js';
import {beatReferenceBadge} from './beat-craft.js';

// The runtime files own saved state. This map only holds unfinished form choices.
const drafts = new Map(), mounts = new WeakMap();
const BASE = '/formats/beat-montage';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {plus:'M12 5v14M5 12h14',arrow:'M5 12h14m-5-5 5 5-5 5',close:'m6 6 12 12M6 18 18 6',upload:'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',play:'m8 5 11 7-11 7Z',check:'m5 12 4 4L19 6',music:'M9 18V5l11-2v13M9 8l11-2',montage:'M3 5h18v14H3zM8 5v14M16 5v14M3 9h5M16 15h5',copy:'M8 8h12v13H8zM16 8V3H3v13h5',heart:'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-2 11 12 21 12 21S26 11 20 5Z'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.montage}"/></svg>`;
const url = value => {const path=typeof value==='string'?value:value?.url||'';return /^(assets|workspace)\//.test(path)?'/media/'+path.split('/').map(encodeURIComponent).join('/'):path;};
const route = (id, page='setup') => `${BASE}/template/${encodeURIComponent(id)}/${page}`;
const button = (label, action, kind='', attrs='') => `<button type="button" class="bm-button ${kind ? 'bm-'+kind : ''}" data-bm-action="${esc(action)}" ${attrs}>${label}</button>`;
const anchor = (label, path, kind='') => `<a ${path.endsWith('/make')?'data-bm-start="true" ':''}class="bm-button ${kind ? 'bm-'+kind : ''}" data-route="${esc(path)}" href="${esc(path)}">${label}</a>`;
const heading = (title, line='', action='') => `<header class="bm-page-head"><div class="bm-heading-row"><h2 tabindex="-1">${esc(title)}</h2>${action}</div>${line ? `<p>${esc(line)}</p>` : ''}</header>`;
const fileButton = (label,kind,accept,multiple=false,attrs='') => `<label class="bm-file-button ${kind==='clip'&&!attrs.includes('webkitdirectory')?'bm-primary':''}">${kind==='clip'&&!attrs.includes('webkitdirectory')?icon('plus'):''}${esc(label)}<input type="file" data-bm-file="${kind}" accept="${accept}" ${multiple?'multiple':''} ${attrs}></label>`;
function draft(key) {
  if (!drafts.has(key)) drafts.set(key,{example:null,showAll:false,quantity:5,filter:'all',selected:[],selectedInputs:[],autoClips:true,links:[''],name:'',note:'',removed:null,openFiles:false,error:'',request:null,busy:false});
  return drafts.get(key);
}
function parts(sub='') {
  sub = String(sub).replace(/^\/formats\/beat-montage\/?/,'').replace(/^\//,'');
  const p=sub.split('/');
  if (p[0]==='inputs') return {id:'square',page:'inputs'};
  if (p[0]==='new') return {id:'square',page:'make'};
  if (p[0]==='setup') return {id:'square',page:'setup'};
  if (p[0]==='template') {let id;try{id=decodeURIComponent(p[1]||'');}catch{id='';}return {id,page:p[2]||'setup',detail:p[3]||''};}
  return {id:null,page:p[0]||'home'};
}
function allTemplates(f) {return Array.isArray(f?.beat?.templates)?f.beat.templates:[];}
function examples(t) {return Array.isArray(t?.examples)?t.examples:[];}
function clips(t) {return t?.inputs?.clips || t?.inputs?.files || [];}
function readyClips(t) {return clips(t).filter(c=>c.prepared===true || c.ready===true || c.status==='ready');}
function selectedId(t) {return t?.selectedExampleId ?? t?.setup?.exampleId ?? t?.selectedEdit ?? null;}
function example(t,d) {const list=examples(t);return list.find(e=>e.id===d.example)||list.find(e=>e.id===(t.displayExampleId||selectedId(t)))||list.find(e=>e.id===(t.defaultExampleId||t.featured))||list[0];}
function eligible(t) {return examples(t).filter(e=>e.audioAvailable!==false && e.audio?.available!==false && e.cutPlanReusable!==false && e.defaultEligible!==false);}
function ready(t) {return t?.generation?.ready===true;}
function generationClips(t,song=null) {const ids=song?[song]:t.generation?.planIds||[];return [...new Map(ids.flatMap(id=>(t.inputStates?.[id]?.clips||[]).filter(c=>c.prepared).map(c=>[c.path,c]))).values()];}
function count(t) {return t?.inputs?.total ?? clips(t).length;}
function outputList(t) {return (t.outputs || t.variations || []).filter(o=>url(o.url||o.src||o.video) && o.path);}
function media(e,id='bm-lead') {
  const src=url(e?.demoSrc||e?.demo||e?.src),poster=url(e?.demoPoster||e?.poster);
  return src ? `<div class="bm-reel"><video id="${id}" src="${esc(src)}" ${poster?`poster="${esc(poster)}"`:''} controls playsinline preload="none" aria-label="${esc(e.title||e.name||'Numbered cut preview')}"></video></div>` : '<div class="bm-empty"><p>The numbered preview will appear after the study.</p></div>';
}
function cuts(e,id='bm-lead') {
  if (!e?.fps || !e?.frames || !Array.isArray(e.cuts)) return '';
  const frames=[0,...e.cuts,e.frames];
  return `<div class="bm-timeline"><div class="bm-timeline-head"><strong>${frames.length-1} clip slots · ${(e.frames/e.fps).toFixed(1)}s</strong><span data-bm-cut-info>Tap a number to see its timing</span></div><div class="bm-cut-strip" data-bm-target="${id}">${frames.slice(0,-1).map((n,i)=>`<button type="button" class="bm-cut-slot" data-bm-action="seek" data-player="${id}" data-start="${n/e.fps}" data-end="${frames[i+1]/e.fps}" aria-pressed="false" aria-label="Clip ${i+1}, ${((frames[i+1]-n)/e.fps).toFixed(2)} seconds">${i+1}<small>${((frames[i+1]-n)/e.fps).toFixed(2)}s</small></button>`).join('')}</div></div>`;
}
function handoff(title,prompt,action='copy',description='',attrs='') {
  return `<section class="bm-prompt-block" data-bm-handoff><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}<pre data-bm-prompt>${esc(prompt||'')}</pre><div class="bm-actions">${button(icon('copy')+' Copy prompt',action,'primary',attrs)}</div><p class="bm-small">Paste into your Keyframes chat.</p></section>`;
}
function platformList() {return `<div class="bm-platform-list">${[['Instagram','https://www.instagram.com/reel/example/'],['TikTok','https://www.tiktok.com/@example/video/123'],['YouTube Shorts','https://www.youtube.com/shorts/abcdefghijk']].map(([name,link])=>`<span>${beatReferenceBadge(link)} ${name}</span>`).join('')}</div>`;}
function home(f) {
  const list=allTemplates(f),own=list.filter(t=>!['square','above'].includes(t.id)),ours=list.filter(t=>['square','above'].includes(t.id));
  const row=t=>{
    const e=example(t,{}),available=ready(t),n=count(t),target=available?'make':'setup';
    return `<a class="bm-template-row" href="${route(t.id,target)}" data-route="${route(t.id,target)}" data-bm-template-row="${esc(t.id)}" ${available?'data-bm-start="true"':''}><div class="bm-row-preview">${url(e?.demoPoster||e?.poster)?`<img src="${esc(url(e.demoPoster||e.poster))}" alt="${esc(t.name)} numbered cut preview" loading="lazy">`:icon('montage')}</div><div class="bm-row-copy"><h2>${esc(t.name)}</h2><p>${esc(t.line||t.description||'Your footage, in a format you can keep using.')}</p><span class="bm-row-facts">${available?`${t.generation?.readyCount ?? generationClips(t).length} inputs ready`:n?`${n} clips added`:examples(t).length?`${examples(t).length} ${t.id==='square'?'songs with cuts':'ways to make it'}`:'Reference study pending'} · 3 to 5 variations</span></div><span class="bm-row-status ${available?'bm-ready':''}">${available?'Generate now':n?'Prepare inputs':'Setup'}</span><span class="bm-row-arrow">${icon('arrow')}</span></a>`;
  };
  return `<div class="bm-home"><p class="bm-home-line">Your clips. A format you love. 3 to 5 versions to choose from.</p><div class="bm-montage-list"><a class="bm-template-row bm-craft-row" href="${BASE}/craft" data-route="${BASE}/craft"><div class="bm-craft-symbol">${icon('plus')}</div><div class="bm-row-copy"><h2>Craft Your Own</h2><p>Bring 3 to 5 examples in the same format. Make it your own.</p>${platformList()}</div><span class="bm-row-status">Create a format</span><span class="bm-row-arrow">${icon('arrow')}</span></a>${own.length?`<section class="bm-montage-group"><h2>Your montages</h2>${own.map(row).join('')}</section>`:''}<section class="bm-montage-group"><h2>Our templates</h2>${ours.map(row).join('')}</section></div></div>`;
}
function gallery(t,d) {
  const all=examples(t),shown=t.id==='square'||d.showAll?all:all.filter(e=>e.id!==example(t,d)?.id).slice(0,5);
  return `<div class="bm-section-intro"><h2>${t.id==='square'?'Songs & cuts':'Songs & variations'}</h2><span class="bm-small">${new Set(all.map(e=>e.audioId||e.audio?.recordingId).filter(Boolean)).size} songs · ${all.length} cut patterns</span></div><p class="bm-gallery-intro">Listen to a song and see its cuts. We can choose the music when you generate.</p><div class="bm-media-row ${t.id==='square'?'bm-all-cuts':''}">${shown.map(e=>`<article class="bm-mini-montage"><button type="button" data-bm-action="example" data-id="${esc(e.id)}" aria-label="Play ${esc(e.soundTitle||e.title)}" aria-pressed="${e.id===example(t,d)?.id}"><img src="${esc(url(e.demoPoster||e.poster))}" alt="${esc(e.variant||t.name)} numbered preview" loading="lazy"><h3>${esc(e.soundTitle||e.title)}</h3></button><p>${(e.cuts||[]).length+1} clips · ${e.frames&&e.fps?(e.frames/e.fps).toFixed(1)+'s':''}</p></article>`).join('')}</div>${t.id!=='square'&&all.length>6?button(d.showAll?'See fewer':'+ See all variations','all-examples','ghost'):''}`;
}
function activeProjects(t){
 const projects=(t.projects||[]).filter(p=>!p.completed);
 return projects.length?`<section class="bm-progress"><h2>In progress</h2>${projects.map(p=>`<a class="bm-project-row" href="${route(t.id,'project/'+encodeURIComponent(p.id))}" data-route="${route(t.id,'project/'+encodeURIComponent(p.id))}"><span><strong>${esc(p.name)}</strong><small>${esc(p.label)}</small></span>${icon('arrow')}</a>`).join('')}</section>`:'';
}
function projectPage(t,id){
 let key;try{key=decodeURIComponent(id);}catch{key=id;}const p=(t.projects||[]).find(p=>p.id===key);
 if(!p)return heading('This video is not available.')+anchor('Back to montage',route(t.id));
 return `<div class="bm-narrow">${heading(p.name,p.label,anchor('Back',route(t.id),'ghost'))}${p.preview?media({src:p.preview,poster:p.cover,title:p.name},'bm-project-video'):'<div class="bm-empty"><p>The current preview appears after this render is checked.</p></div>'}${p.completed?p.outputs.map(delivery).join(''):handoff('Continue in chat',p.prompt)}</div>`;
}
function delivery(o){
 const link=(label,file)=>file?.url?`<a class="bm-button bm-ghost" href="${esc(file.url)}" download>${label}</a>`:'';
 return `<div class="bm-delivery">${o.caption?.text?`<details><summary>Caption</summary><p class="bm-caption">${esc(o.caption.text)}</p>${button('Copy caption','copy-caption','ghost',`data-value="${esc(o.caption.text)}"`)}</details>`:''}${o.sound?.text?`<details><summary>Sound instructions</summary><p>${esc(o.sound.text)}</p></details>`:''}<div class="bm-actions">${link('Video',o)}${link('Cover',o.cover)}${link('Caption',o.caption)}${link('Sound instructions',o.sound)}</div></div>`;
}
function templateDocuments(t){
 const path=t.preferencesPath,href='/files?file='+encodeURIComponent(path)+'&format=beat-montage&template='+encodeURIComponent(t.id);
 return `<div class="bm-narrow">${heading('Documents','Your saved preferences for this montage.')}<a class="bm-project-row" href="${esc(href)}" data-route="${esc(href)}"><span><strong>${esc(t.name)} preferences</strong><small>Read and edit the real file.</small></span>${icon('arrow')}</a></div>`;
}
function overview(t,d,f) {
  if(!examples(t).length){const references={...f,beat:{...f.beat,references:(f.beat?.references||[]).filter(g=>g.templateId===t.id),unassignedReferences:[]}};return `<div class="bm-narrow">${heading('Learn your montage','Your references will become a format with its own clips, songs and cuts.')}${referenceStudies(references)}</div>`;}
  const e=example(t,d),n=count(t),isReady=ready(t);
  const needsSong=!examples(t).some(e=>e.eligible);
  const songAsk=needsSong?`<div class="bm-notice"><div><strong>This montage needs a song recording.</strong><p>We can prepare a matching recording in chat. Your clips can be added now.</p></div>${anchor('Prepare a song',route(t.id,'song/'+encodeURIComponent(e.id)),'primary')}</div>`:'';
  const next=`${songAsk}<div class="bm-next-step"><h2>${isReady?'Your next montage':n?'Make your inputs ready':'Your clips become this'}</h2><p>${isReady?'Five variations for today, with fresh clips and hooks.':n?'Your clips are added. Let’s prepare them for this montage.':t.description||t.line}</p><p class="bm-small">${isReady?'We choose fitting songs from this format. You can pick one too.':'Add your originals. We’ll show you what to film and prepare each clip.'}</p><div class="bm-actions">${isReady?anchor('Generate now '+icon('arrow'),route(t.id,'make'),'primary')+button('Craft one example','start-one'):anchor((n?'Prepare inputs':'Add your inputs')+' '+icon('plus'),route(t.id,'inputs'),'primary')}</div>${isReady?`<div class="bm-step-links">${anchor('Inputs',route(t.id,'inputs'),'ghost')}${anchor('Choose a song',route(t.id,'songs'),'ghost')}</div>`:'<p class="bm-step-note">Then ask for one example or five variations for today.</p>'}${outputList(t).length?anchor('See your variations ('+outputList(t).length+')',route(t.id,'variations'),'ghost'):''}</div>`;
  return `<div class="bm-overview">${activeProjects(t)}<section class="bm-setup-preview">${next}<div class="bm-showcase">${media(e)}<div class="bm-preview-meta"><strong>${esc(e?.soundTitle||e?.title||t.name)}</strong><span>Each number is one of your clips</span>${e?.audioAvailable===false?'<span>Audio unavailable</span>':''}</div></div></section>${e?`<details class="bm-timing-details"><summary>See every cut</summary>${cuts(e)}</details>`:''}${examples(t).length?isReady?`<details class="bm-ready-gallery"><summary>Explore songs & cuts</summary><section class="bm-section">${gallery(t,d)}</section></details>`:`<section class="bm-section">${gallery(t,d)}</section>`:''}</div>`;
}
function inputGuide(t,d) {const e=example(t,d);return t.variantGuides?.[e?.guideId||e?.id]||t.guides?.[e?.guideId||e?.id]||t.inputGuides?.[e?.id]||t.guide||t.inputGuide||null;}
function normalizeGuide(g) {
  if (!g) return null;
  const look=g.lookGuidance||g.lookGuide||{};
  return {...g,contextLine:g.contextLine||g.theme,groups:(g.groups||g.families||[]).map((x,i)=>({...x,id:x.id||'group-'+i,ideas:x.ideas||x.examples||x.clips||[],countLabel:x.countLabel||(typeof x.count==='object'?`${x.count.min} to ${x.count.max} clips`:`About ${x.count||6} clips`)})),look:{title:look.title||look.heading,lead:look.lead||look.instruction,tip:look.tip,examples:(look.examples||[]).map(e=>({...e,title:e.title||e.label,description:e.description||e.notice}))},shootTips:Array.isArray(g.shootTips)?g.shootTips:Object.values(g.shootTips||{}),preparationChecks:g.preparationChecks||g.cropChecks||[]};
}
function analysisPrompt(t,d) {const g=inputGuide(t,d),e=example(t,d);if(t.analysisPrompt&&e?.id&&t.displayExampleId&&e.id!==t.displayExampleId)return `Analyze my added clips for montage "${t.id}" using edit "${e.id}". Follow its clip guide, prepare the crops and review them in motion.`;return t.analysisPrompt||t.inputs?.analysisPrompt||g?.handoff?.analysisPrompt||g?.analysisPrompt||`Analyze my added clips for ${t.name} and make them ready, using its clip guide and crop checks.`;}
function clipPreview(c) {
  const source=url(c.preview||c.file||c.url||c.src),poster=url(c.poster||c.cover);
  return source?`<video src="${esc(source)}" ${poster?`poster="${esc(poster)}"`:''} controls muted playsinline preload="none" aria-label="${esc(c.name)}"></video>`:poster?`<img src="${esc(poster)}" alt="${esc(c.name)}" loading="lazy">`:`<span class="bm-clip-icon">${icon('montage')}</span>`;
}
function inputs(t,d,f) {
  const g=normalizeGuide(inputGuide(t,d)),list=clips(t),pending=list.filter(c=>!c.prepared&&!c.ready&&c.status!=='ready'&&!c.excluded),prepared=readyClips(t).length;
  const available=(t.availableClips||t.inputs?.availableClips||f.beat?.availableInputs||f.beat?.availableClips||f.availableClips||[]).filter(c=>!list.some(x=>x.path===c.path));
  const reuse=available.length?`<details class="bm-reuse"><summary>Choose clips from another montage or format</summary><p class="bm-small">Only the clips you choose will be added.</p><div class="bm-reuse-list">${available.map(c=>`<label><input type="checkbox" data-bm-reuse="${esc(c.path)}"><span>${esc(c.name)}<small>${esc(c.templateName||c.formatName||c.format||'Original clip')}</small></span></label>`).join('')}</div><div class="bm-actions">${button('Add selected clips','reuse')}</div></details>`:'';
  const files=list.length?`<details class="bm-added-clips" data-bm-files ${d.openFiles?'open':''}><summary>Added to ${esc(t.name)} (${list.length})</summary><div class="bm-clip-grid">${list.map(c=>`<article class="bm-clip-card"><div class="bm-clip-picture">${clipPreview(c)}<button type="button" class="bm-remove" data-bm-action="remove-input" data-path="${esc(c.path)}" aria-label="Remove ${esc(c.name)}">${icon('close')}</button></div><div class="bm-clip-name">${esc(c.name)}</div><small>${c.prepared||c.ready||c.status==='ready'?'Ready · Crop reviewed':c.excluded?'Left out'+(c.reason?' · '+esc(c.reason):''):'Needs analysis'}</small></article>`).join('')}</div></details>`:'';
  const undo=d.removed?`<div class="bm-input-status" role="status"><p>Clip removed from this montage.</p>${button('Undo','restore-input','ghost')}</div>`:'';
  const status=list.length?`<div class="bm-input-status"><p>${prepared} of ${list.length} clips ready. At least ${t.inputs?.originalFileMinimum||10} required.${pending.length?` ${pending.length} ${pending.length===1?'needs':'need'} analysis.`:''}</p>${pending.length?button('Go to prompt '+icon('arrow'),'jump-analysis','ghost'):ready(t)?anchor('Generate now',route(t.id,'make')):''}</div>`:'';
  const look=g?.look?.title?`<section class="bm-filming-look"><h2>${esc(g.look.title)}</h2><p>${esc(g.look.lead)}</p><div class="bm-filming-look-examples">${g.look.examples.map(e=>`<figure><img src="${esc(url(e.src))}" alt="${esc(e.description||e.title)}" loading="lazy"><figcaption>${esc(e.title)}</figcaption></figure>`).join('')}</div>${g.look.tip?`<p>${esc(g.look.tip)}</p>`:''}<p class="bm-small">${t.id==='square'?'Record originals without filters. We shape the shadows and contrast, then check the centered white words.':'Send the original clips. We prepare the crop and keep the people, action and setting clear.'}</p></section>`:'';
  const shots=g?`<section class="bm-personal-guide"><h2>${esc('10 to 20 original clips')}</h2><p class="bm-guide-theme">${esc(g.contextLine)}</p><p class="bm-guide-intro">Use what you already have, or film a few from each group.</p>${g.keyAsk?`<p class="bm-guide-purpose">${esc(g.keyAsk)} At least 10 reviewed originals. We keep this edit’s own usable-moment requirements.</p>`:''}${g.groups.map(group=>`<section class="bm-specific-shot-row"><div><h3>${esc(group.title)}</h3><span>${esc(group.countLabel)}</span></div><p>${esc(group.ideas.join(' '))}</p></section>`).join('')}<div class="bm-shoot-tips">${g.shootTips.map(tip=>`<p>${esc(tip)}</p>`).join('')}</div></section>`:'<section><h2>Your clip guide is being prepared.</h2><p>The reference study will tell us what to film for this montage.</p></section>';
  const edit=examples(t).length>1&&t.id!=='square'?`<label class="bm-field bm-edit-choice">Prepare clips for<select data-bm-field="input-edit">${examples(t).map(e=>`<option value="${esc(e.id)}" ${e.id===example(t,d)?.id?'selected':''}>${esc(e.variant||e.title)} · ${esc(e.soundTitle||'')}</option>`).join('')}</select></label>`:'';
  return `<div class="bm-input-flow">${heading('Add Input',t.id==='square'?'Let’s turn your work and your day into motivational montages.':`Let’s turn your clips into ${t.name} montages.`)}<div class="bm-input-stack"><section class="bm-input-upload"><div class="bm-drop-zone" data-bm-drop="clip">${icon('upload')}<h2>Add your clips</h2><p>Add 10 to 20 originals, or choose a folder.</p><div class="bm-actions">${fileButton('Choose clips','clip','video/*',true)}${fileButton('Choose folder','clip','video/*',true,'webkitdirectory')}</div></div>${reuse}${files}${undo}${status}${edit}</section>${look}${shots}${g?.preparationChecks?.length?`<details class="bm-preparation"><summary>What we check for this montage</summary><ul>${g.preparationChecks.map(x=>`<li>${esc(typeof x==='string'?x:x.label||x.description)}</li>`).join('')}</ul><p class="bm-small">A clip is ready after its prepared crop is reviewed in motion.</p></details>`:''}${handoff('Make your clips ready',analysisPrompt(t,d),'analyze',g?.preparationSummary||g?.handoff?.preparationLine||'We choose the moments, prepare each crop and check that the story still reads clearly.')}</div></div>`;
}
function songGroups(t) {
  const groups=new Map();
  for (const e of examples(t).filter(e=>e.audioAvailable!==false)) {const id=e.audioId||e.audio?.recordingId||e.id;if(!groups.has(id))groups.set(id,{id,title:e.soundTitle||e.title,plans:[]});groups.get(id).plans.push(e);}
  return [...groups.values()];
}
function songs(t) {
  const custom=(t.songs||[]).filter(s=>s.uploaded||s.kind==='uploaded'||!songGroups(t).some(g=>g.id===s.id));
  return `${heading('Songs & cuts',`Music and edits for ${t.name}.`,anchor(icon('plus')+' Add a song',route(t.id,'song-new'),'primary'))}<div class="bm-song-list">${custom.map(s=>`<article class="bm-song-row"><div class="bm-disc">${icon('music')}</div><div class="bm-song-info"><h3>${esc(s.title||s.name)}</h3><p>${esc(s.status==='ready'?'Beat edit ready':'Waiting for analysis')}</p></div>${anchor(s.status==='ready'?'See the cuts':'Copy analysis prompt',route(t.id,'song/'+encodeURIComponent(s.id)))}</article>`).join('')}${songGroups(t).map(s=>`<article class="bm-song-row"><a class="bm-disc" data-route="${route(t.id,'song/'+encodeURIComponent(s.plans[0].id))}" href="${route(t.id,'song/'+encodeURIComponent(s.plans[0].id))}" aria-label="Hear ${esc(s.title)}">${icon('play')}</a><div class="bm-song-info"><h3>${esc(s.title)}</h3><p>${s.plans.length>1?`${s.plans.length} different edits of the same sound`:`${(s.plans[0].cuts||[]).length+1} clips · ${(s.plans[0].frames/s.plans[0].fps).toFixed(1)}s`}</p></div>${anchor('Hear the cuts',route(t.id,'song/'+encodeURIComponent(s.plans[0].id)))}</article>`).join('')}</div><p class="bm-small bm-section">Add a song here to create another edit for ${esc(t.name)}.</p>`;
}
function songPrompt(t,s) {return s?.analysisPrompt||s?.prompt||`/new-format\nAnalyze "${s?.name||s?.title||'my uploaded song'}" as a new song for ${t.name}. Reuse a matching sound if we have it. Show me the cuts.`;}
function songUpload(t,s,d) {
  return `<div class="bm-narrow">${heading(s?'Your song':'Add a song',`Create a new beat edit for ${t.name}.`)}${s?`<div class="bm-wave-panel"><h3>${esc(s.filename||s.title||s.name)}</h3>${url(s.file||s.url||s.audio)?`<audio src="${esc(url(s.file||s.url||s.audio))}" controls preload="none"></audio>`:''}<p class="bm-small">${esc(s.status==='ready'?'Beat edit ready':'Saved. Ready to study.')}</p></div><label class="bm-field">Name this song<input type="text" maxlength="80" data-bm-field="song-name" data-song-id="${esc(s.id)}" value="${esc(d.songName??s.title??s.name)}"></label>${button('Save name','rename-song','',`data-id="${esc(s.id)}"`)}<p class="bm-small bm-section">We check for a sound you already have, then find a section and show its numbered cuts.</p>${handoff('Find its beat',songPrompt(t,{...s,name:d.songName??s.title??s.name}),'song-prompt','',`data-id="${esc(s.id)}"`)}`:`<label class="bm-field">Name your song <span class="bm-small">Optional</span><input type="text" maxlength="80" data-bm-field="new-song-name" value="${esc(d.newSongName||'')}" placeholder="My song"></label><div class="bm-drop-zone" data-bm-drop="song">${icon('music')}<h2>Add your song</h2><p>Choose an MP3, WAV or another audio file.</p><div class="bm-actions">${fileButton('Choose a song','song','audio/*')}</div></div><p class="bm-small bm-section">Your song is saved to this template. Then copy its prompt to find the beats.</p>`}</div>`;
}
function songDetail(t,d,id) {
  let key;try{key=decodeURIComponent(id);}catch{key=id;}
  const e=examples(t).find(x=>x.id===key),s=(t.songs||[]).find(x=>x.id===key);
  if (!e) return s?songUpload(t,s,d):heading('This song is not available.')+anchor('All songs',route(t.id,'songs'));
  const siblings=songGroups(t).find(s=>s.id===(e.audioId||e.audio?.recordingId))?.plans||[];
  return `${heading(e.soundTitle||e.title,`${t.name} · Every number is a place for one of your clips.`)}${siblings.length>1?`<div class="bm-notice"><div><strong>One sound, ${siblings.length} edits.</strong><p>Choose the timing you like.</p></div><div class="bm-actions">${siblings.map(s=>anchor(esc(s.variant||s.title),route(t.id,'song/'+encodeURIComponent(s.id)))).join('')}</div></div>`:''}<div class="bm-song-showcase">${media(e,'bm-song-player')}${cuts(e,'bm-song-player')}</div><div class="bm-actions">${e.audioAvailable===false||e.cutPlanReusable===false?button('Prepare this edit','prepare-edit','primary',`data-id="${esc(e.id)}"`):button('Craft one example with this song','use-song','primary',`data-id="${esc(e.id)}"`)}${anchor('All songs',route(t.id,'songs'))}</div>${d.editPrompt&&d.editPromptId===e.id&&(e.audioAvailable===false||e.cutPlanReusable===false)?handoff('Prepare this edit',d.editPrompt):''}`;
}
function makePrompt(t,d) {return `/quick-cuts\nGenerate ${d.quantity===1?'one '+t.name+' example':d.quantity+' '+t.name+' variations'}${d.selected.length?' like my selected versions':' with my ready clips'}. ${d.song?`Use ${examples(t).find(e=>e.id===d.song)?.soundTitle||'my selected song'}.`:'Choose fitting songs from this format.'} Vary the clips and hooks, and check every crop.`;}
function make(t,d) {
  const choices=generationClips(t,d.song),isReady=ready(t)&&(!d.song||t.generation.planIds.includes(d.song)),request=d.request;
  return `<div class="bm-narrow">${heading(d.selected.length?'Make more like these':'Make a montage','Your inputs are saved. We choose the clips and write the hooks.')}<div class="bm-make-summary"><h2>${esc(t.name)}</h2><p>${t.generation?.readyCount??choices.length} inputs ready · ${d.song?esc(examples(t).find(e=>e.id===d.song)?.soundTitle||'Selected song'):'Songs chosen for you'}</p><div class="bm-actions">${anchor('Inputs',route(t.id,'inputs'),'ghost')}${anchor('Browse songs',route(t.id,'songs'),'ghost')}</div></div><fieldset class="bm-quantity"><legend>What would you like?</legend><div class="bm-actions">${[1,5,10].map(n=>button(n===1?'One example':n+' variations','quantity','',`data-value="${n}" aria-pressed="${d.quantity===n}"`)).join('')}</div></fieldset><label class="bm-field">Music<select data-bm-field="generation-song"><option value="">Choose songs for me</option>${eligible(t).map(e=>`<option value="${esc(e.id)}" ${d.song===e.id?'selected':''}>${esc(e.soundTitle||e.title)}${songGroups(t).find(g=>g.id===(e.audioId||e.audio?.recordingId))?.plans.length>1?' · '+esc(e.variant||e.title):''}</option>`).join('')}</select></label><label class="bm-check"><input type="checkbox" data-bm-field="auto-clips" ${d.autoClips?'checked':''}>Choose the clips for me</label>${!d.autoClips?`<div class="bm-reuse-list">${choices.map(c=>`<label><input type="checkbox" data-bm-selected-input="${esc(c.path)}" ${d.selectedInputs.includes(c.path)?'checked':''}><span>${esc(c.name)}</span></label>`).join('')}</div>`:''}${!isReady?`<div class="bm-notice"><div><strong>${count(t)?'Prepare your inputs first.':'Add your inputs first.'}</strong><p>We need reviewed clips for this montage.</p></div>${anchor('Inputs',route(t.id,'inputs'))}</div>`:''}${request?`<p class="bm-small bm-section" role="status">Request saved. Paste its prompt to start.</p>`:''}${handoff('Copy your request',request?.prompt||makePrompt(t,d),'generate','',!isReady?'disabled':'')}</div>`;
}
function variations(t,d) {
  const outputs=outputList(t),list=outputs.filter(o=>d.filter!=='liked'||o.favorite);
  return `${activeProjects(t)}${heading('Your variations',`${t.name} · Keep your favourites. Try more whenever you like.`,anchor('Generate now',route(t.id,'make'),'primary'))}<div class="bm-segmented">${button('All '+outputs.length,'filter','',`data-value="all" aria-pressed="${d.filter==='all'}"`)}${button('Favourites '+outputs.filter(o=>o.favorite).length,'filter','',`data-value="liked" aria-pressed="${d.filter==='liked'}"`)}</div>${list.length?`<div class="bm-variation-grid">${list.map((o,i)=>`<article class="bm-variation-card ${d.selected.includes(o.id||o.path)?'bm-selected':''}"><button type="button" class="bm-select-variation" data-bm-action="select-output" data-id="${esc(o.id||o.path)}" aria-pressed="${d.selected.includes(o.id||o.path)}" aria-label="Select ${esc(o.name||'variation '+(i+1))}">${d.selected.includes(o.id||o.path)?icon('check'):''}</button>${media({src:o.url||o.src||o.video,poster:o.poster||o.cover,title:o.name},'bm-output-'+i)}<h3>${esc(o.name||'Variation '+(i+1))}</h3>${button(icon('heart')+(o.favorite?'Saved to favourites':'Keep this one'),'favorite','ghost',`data-id="${esc(o.id||o.path)}" data-value="${!o.favorite}" aria-pressed="${Boolean(o.favorite)}"`)}${delivery(o)}</article>`).join('')}</div>`:`<div class="bm-empty"><h2>${d.filter==='liked'?'No favourites yet.':'Your variations will appear here.'}</h2><p>${d.filter==='liked'?'Keep a version you like to find it here.':'Copy a montage request, then return when your agent has made the videos.'}</p></div>`}${d.selected.length?`<div class="bm-selection-bar"><strong>${d.selected.length} selected</strong>${button('Generate 10 more like these '+icon('arrow'),'more-selected','primary')}</div>`:''}${outputs.length?`<div class="bm-actions">${button('Generate 10 more variations','more')}${anchor('Try another montage',BASE,'ghost')}</div>`:''}`;
}
function referencePrompt(d) {return `/new-format\nLearn this format from ${d.links.filter(s=>s.trim()).length>1?'these examples':'this example'}${d.name?` as "${d.name}"`:''}. Keep matching examples in one format. Learn its cuts and captions, reuse matching sounds, and create its clip guide.\n${d.links.filter(s=>s.trim()).join('\n')||'Add a video link above.'}${d.note?'\nKeep: '+d.note:''}`;}
function referenceStudies(f) {
  const groups=[...(f.beat?.references||[])];
  if(f.beat?.unassignedReferences?.length)groups.push({id:'unassigned',name:'Earlier references',items:f.beat.unassignedReferences});
  if(!groups.length)return '';
  return `<section class="bm-section"><h2>Your studies</h2>${groups.map(group=>`<section class="bm-study-group"><div class="bm-heading-row"><h3>${esc(group.name||'Your montage')}</h3>${group.templateId?anchor('Setup',route(group.templateId)):''}</div>${(group.items||[]).map((r,i)=>{
    const failed=['unavailable','failed','download-failed'].includes(r.status)||(r.status==='error'&&!r.source),uploaded=Boolean(r.source),complete=r.studyStatus==='complete'||r.status==='ready';
    return `<article class="bm-reference-result"><div class="bm-heading-row"><h3>${beatReferenceBadge(r.url||'')} Video ${i+1}</h3><span class="${failed?'bm-error-text':'bm-small'}">${failed?'Download failed':complete?'Study ready':uploaded?'Video added':'Waiting for your agent'}</span></div><p class="bm-small"><a href="${esc(r.url)}" target="_blank" rel="noopener">Open reference ↗</a></p>${failed?`<div class="bm-notice"><div><strong>We couldn’t download this video.</strong><p>${esc(r.message||'Upload it with its music to continue.')}</p></div></div>${fileButton('Upload video','reference','video/*',false,`data-reference="${esc(r.id)}"`)}`:''}</article>`;
  }).join('')}${group.prompt?handoff(group.status==='complete'?'Use this study':'Continue the study',group.prompt):''}</section>`).join('')}</section>`;
}

function craft(f,d) {
  return `<div class="bm-narrow"><p class="bm-craft-intro">Bring a montage you love. Save a format you can keep using.</p><h2>Which videos do you like?</h2><p>We recommend 3 to 5 examples in the same format. Similar framing, captions and pacing; the songs can differ.</p>${platformList()}<p class="bm-small">One link per video. You can start with one.</p><div class="bm-reference-inputs">${d.links.map((r,i)=>`<div class="bm-reference-row"><span class="bm-platform">${beatReferenceBadge(r)}</span><input type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" data-bm-reference="${i}" value="${esc(r)}" placeholder="Paste a video link" aria-label="Video link ${i+1}">${button(icon('close'),'remove-reference','ghost',`data-index="${i}" aria-label="Remove link ${i+1}"`)}</div>`).join('')}</div>${button(icon('plus')+' Add another link','add-reference','ghost',d.links.length>=30?'disabled':'')}<details><summary>Give it a name or add a note</summary><label class="bm-field">Name your montage<input type="text" data-bm-field="craft-name" value="${esc(d.name)}" maxlength="80" placeholder="My behind the scenes"></label><label class="bm-field">Anything you want to keep? <span class="bm-small">Optional</span><textarea data-bm-field="craft-note" placeholder="The slow opening and the short hook.">${esc(d.note)}</textarea></label></details>${d.batchSaved?`<p class="bm-small bm-section" role="status">Your reference batch is saved.</p>${button('Start another format','new-batch','ghost')}`:''}<div class="bm-explanation"><h3>Each montage gets its own setup.</h3><p>The study works out its clips, crops, caption style, songs and cuts.</p></div>${referenceStudies(f)}${handoff('Learn this format',d.request?.prompt||referencePrompt(d),'save-references')}</div>`;
}

export function resetBeatLibraryDraft(workspaceId,templateId) {
  const d=draft((workspaceId||'workspace')+':'+templateId);
  d.quantity=5;d.song=null;d.selected=[];d.selectedInputs=[];d.autoClips=true;d.request=null;
}

export function beatLibraryChrome(f,sub='') {
  const p=parts(sub),t=allTemplates(f).find(t=>t.id===p.id);
  if (!t) return {title:p.page==='craft'?'Craft Your Own':'Beat Montage',back:p.page==='craft'?BASE:'/',tabs:[]};
  return {title:t.name,back:BASE,tabs:[['setup','Setup'],['inputs','Inputs'],['songs','Songs & cuts'],['variations','Variations'],['documents','Documents']].map(([page,label])=>({label,path:route(t.id,page),current:page===p.page||page==='variations'&&p.page==='project'||page==='songs'&&p.page.startsWith('song')||page==='setup'&&p.page==='overview'})),action:ready(t)&&p.page!=='make'?{label:'Generate now',path:route(t.id,'make')}:null};
}
export function renderBeatLibrary(f,snapshot,sub='',ui={}) {
  const p=parts(sub),key=(snapshot?.workspaceId||'workspace')+':'+(p.id||'craft'),d=draft(key),found=allTemplates(f).find(t=>t.id===p.id),t=found?{...found,inputs:found.inputStates?.[example(found,d)?.id]||found.inputs}:null;
  let body;
  if(t&&p.page==='song'){const pending=(f.beat?.requests||[]).filter(r=>r.templateId===t.id&&r.type==='edit-study'&&r.exampleId===p.detail&&r.status==='pending').at(-1);if(pending?.prompt){d.editPrompt=pending.prompt;d.editPromptId=p.detail;}}
  if(p.id&&!t) body=heading('This montage is not available.')+anchor('All montages',BASE);
  else if(!p.id) body=p.page==='craft'?craft(f,d):home(f);
  else body=p.page==='documents'?templateDocuments(t):p.page==='project'?projectPage(t,p.detail):p.page==='inputs'?inputs(t,d,f):p.page==='songs'?songs(t):p.page==='song-new'?songUpload(t,null,d):p.page==='song'?songDetail(t,d,p.detail):p.page==='make'?make(t,d):p.page==='variations'?variations(t,d):overview(t,d,f);
  if(t&&p.page==='variations'){const pending=(f.beat?.requests||[]).filter(r=>r.templateId===t.id&&r.type==='generation'&&r.status==='pending').at(-1);if(pending?.prompt)body+=handoff('Continue your montage',pending.prompt);}
  const html=`<div class="bm-library" aria-busy="${d.busy}" data-bm-key="${esc(key)}" data-bm-template="${esc(p.id||'')}" data-bm-example="${esc(t?example(t,d)?.id:'')}" data-bm-page="${esc(p.page)}" data-bm-sub="${esc(sub)}"><div class="bm-operation" role="status" ${d.busy?'':'hidden'}>Saving your files...</div><p class="bm-error-text" data-bm-error role="alert" ${d.error?'':'hidden'}>${esc(d.error)}</p>${body}</div>`;
  if (ui.href) return html.replace(/href="(\/formats\/beat-montage[^\"]*)"/g,(_,value)=>`href="${esc(ui.href(value.replaceAll('&amp;','&')))}"`);
  return html;
}

export function bindBeatLibrary(root,helpers={}) {
  syncAgentPrompts(root);
  mounts.get(root)?.abort();
  const controller=new AbortController(),signal=controller.signal;mounts.set(root,controller);
  const page=root.matches?.('.bm-library')?root:root.querySelector('.bm-library');if(!page)return {destroy:()=>controller.abort()};
  const d=draft(page.dataset.bmKey),templateId=page.dataset.bmTemplate,fetcher=helpers.fetcher||globalThis.fetch.bind(globalThis);
  const navigate=path=>helpers.navigate?helpers.navigate(path):location.assign(path);
  const rerender=()=>{if(helpers.render)helpers.render();else helpers.refresh?.();};
  const notify=message=>{if(helpers.toast)helpers.toast(message);else{const el=page.querySelector('.bm-operation');if(el){el.hidden=false;el.textContent=message;}}};
  const error=message=>{d.error=message;const current=root.querySelector('[data-bm-key="'+CSS.escape(page.dataset.bmKey)+'"]')||page;const el=current.querySelector('[data-bm-error]');if(el){el.hidden=!message;el.textContent=message;}};
  async function copy(value,{literal=false}={}) {
    if(!literal)value=agentPrompt(value);
    if(helpers.copy){await helpers.copy(value,literal?'Caption copied.':undefined,{literal});return;}
    try{await navigator.clipboard.writeText(value);}catch{const area=document.createElement('textarea');area.value=value;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('Select the prompt to copy it.');}
    notify('Copied. Paste into your Keyframes chat.');
  }
  async function write(payload) {
    const response=await fetcher(helpers.endpoint||'/api/beat-library',{method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'inputs'},body:JSON.stringify({templateId:templateId||undefined,...payload})});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||data.message||'This could not be saved. Try again.');return data;
  }
  async function refresh() {await helpers.refresh?.();if(helpers.render)helpers.render();}
  async function upload(files,kind,referenceId) {
    const source=[...files].filter(file=>kind==='clip'?file.type.startsWith('video/')||/\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name):true);
    if(!source.length)throw Error('Choose an original video file.');
    let last;
    for(let i=0;i<source.length;i++) {
      const file=source[i],params=new URLSearchParams({template:templateId,kind,name:file.webkitRelativePath||file.name});if(kind==='song'&&d.newSongName)params.set('title',d.newSongName);if(referenceId)params.set('reference',referenceId);
      const endpoint=kind==='reference'?(helpers.referenceUploadEndpoint||helpers.uploadEndpoint||'/api/beat-library/upload'):(helpers.uploadEndpoint||'/api/beat-library/upload');
      notify(`Saving ${i+1} of ${source.length}: ${file.name}`);
      const response=await fetcher(endpoint+'?'+params,{method:'PUT',headers:{'X-Keyframes-Write':'inputs','X-Keyframes-Filename':encodeURIComponent(file.name),'Content-Type':file.type||'application/octet-stream'},body:file});
      last=await response.json().catch(()=>({}));if(!response.ok){await refresh();throw Error((i?`${i} ${kind==='clip'?'clips':'files'} saved. `:'')+(last.error||last.message||'This file could not be saved. Try it again.'));}
    }
    d.openFiles=true;await refresh();
    if(kind==='song'){const id=last?.song?.id||last?.songId||last?.id;if(id)navigate(route(templateId,'song/'+encodeURIComponent(id)));notify('Song saved. Copy its prompt to find the beats.');}
    else notify(kind==='reference'?'Video added. Copy the prompt to continue its study.':`${source.length} clips added. Copy the prompt to analyze them.`);
  }
  const run=async fn=>{if(d.busy){notify('Saving your last change...');return;}d.busy=true;error('');page.setAttribute('aria-busy','true');try{await fn();}catch(e){error(e.message||'Something went wrong. Try again.');}finally{d.busy=false;page.removeAttribute('aria-busy');const current=root.querySelector('[data-bm-key="'+CSS.escape(page.dataset.bmKey)+'"]');current?.removeAttribute('aria-busy');const status=current?.querySelector('.bm-operation');if(status)status.hidden=true;}};
  page.addEventListener('click',event=>{
    const start=event.target.closest('[data-bm-start]');if(start){const target=parts(start.dataset.route||start.getAttribute('href'));resetBeatLibraryDraft(page.dataset.bmKey.split(':')[0],target.id);}
    const b=event.target.closest('[data-bm-action]');if(!b||b.disabled)return;
    event.preventDefault();event.stopPropagation();
    void run(async()=>{
      const action=b.dataset.bmAction,id=b.dataset.id;
      if(action==='copy-caption'){await copy(b.dataset.value,{literal:true});return;}
      if(action==='copy'){await copy(b.closest('[data-bm-handoff]').querySelector('[data-bm-prompt]').textContent);return;}
      if(action==='seek'){const video=page.querySelector('#'+b.dataset.player);if(video){video.currentTime=Number(b.dataset.start);await video.play();}return;}
      if(action==='example'){d.example=id;rerender();return;}
      if(action==='all-examples'){d.showAll=!d.showAll;rerender();return;}
      if(action==='jump-analysis'){page.querySelector('[data-bm-handoff]')?.scrollIntoView({block:'center',behavior:'smooth'});return;}
      if(action==='start-one'){resetBeatLibraryDraft(page.dataset.bmKey.split(':')[0],templateId);d.quantity=1;navigate(route(templateId,'make'));return;}
      if(action==='remove-input'){await write({action,path:b.dataset.path});d.removed=b.dataset.path;await refresh();return;}
      if(action==='restore-input'){await write({action,path:d.removed});d.removed=null;await refresh();return;}
      if(action==='reuse'){const paths=[...page.querySelectorAll('[data-bm-reuse]:checked')].map(e=>e.dataset.bmReuse);if(!paths.length)throw Error('Choose the clips to add.');await write({action:'reuse-inputs',paths});d.openFiles=true;await refresh();notify('Clips added. Copy the prompt to prepare them for this montage.');return;}
      if(action==='analyze'){const result=await write({action:'request-analysis',exampleId:page.dataset.bmExample||undefined});const prompt=result.prompt||result.request?.prompt||b.closest('[data-bm-handoff]').querySelector('[data-bm-prompt]').textContent;await copy(prompt);await refresh();return;}
      if(action==='rename-song'||action==='song-prompt'){const result=await write({action:'rename-song',songId:id,name:page.querySelector('[data-bm-field="song-name"]')?.value||d.songName});if(action==='song-prompt')await copy(result.prompt||result.song?.prompt||b.closest('[data-bm-handoff]').querySelector('[data-bm-prompt]').textContent);d.songName=undefined;await refresh();if(action==='rename-song')notify('Song name saved.');return;}
      if(action==='use-song'){await write({action:'select-edit',exampleId:id});resetBeatLibraryDraft(page.dataset.bmKey.split(':')[0],templateId);d.song=id;d.example=id;d.quantity=1;d.request=null;await refresh();navigate(route(templateId,'make'));return;}
      if(action==='prepare-edit'){if(d.editPrompt&&d.editPromptId===id){await copy(d.editPrompt);return;}const result=await write({action:'request-edit',exampleId:id});d.editPrompt=result.prompt||result.request?.prompt;d.editPromptId=id;await refresh();await copy(d.editPrompt);return;}
      if(action==='quantity'){d.quantity=Number(b.dataset.value);d.request=null;rerender();return;}
      if(action==='generate'){if(d.request?.prompt){await copy(d.request.prompt);return;}if(!d.autoClips&&!d.selectedInputs.length)throw Error('Choose a clip, or let us choose the clips for you.');const result=await write({action:'request-generation',quantity:d.quantity,exampleId:d.song||null,selectedOutputIds:d.selected,selectedInputPaths:d.autoClips?undefined:d.selectedInputs,more:d.quantity===10&&d.selected.length>0});d.request=result.request||result;await copy(result.prompt||result.request?.prompt);await refresh();return;}
      if(action==='favorite'){await write({action,outputId:id,value:b.dataset.value==='true'});await refresh();return;}
      if(action==='select-output'){d.selected=d.selected.includes(id)?d.selected.filter(x=>x!==id):[...d.selected,id];rerender();return;}
      if(action==='filter'){d.filter=b.dataset.value;rerender();return;}
      if(action==='more'||action==='more-selected'){d.quantity=10;d.song=null;d.selectedInputs=[];d.autoClips=true;d.request=null;if(action==='more')d.selected=[];navigate(route(templateId,'make'));return;}
      if(action==='add-reference'){d.links.push('');d.request=null;rerender();return;}
      if(action==='remove-reference'){d.links.splice(Number(b.dataset.index),1);if(!d.links.length)d.links=[''];d.request=null;rerender();return;}
      if(action==='new-batch'){d.links=[''];d.name='';d.note='';d.request=null;d.batchSaved=false;rerender();return;}
      if(action==='save-references'){if(d.request?.prompt){await copy(d.request.prompt);return;}const links=montageReferences(d.links.map(s=>s.trim()).filter(Boolean)).map(r=>r.url);const result=await write({action,links,name:d.name,note:d.note,templateId:d.batchSaved||undefined});d.batchSaved=result.templateId;d.request=result.request||result;await copy(result.prompt||result.request?.prompt);await refresh();return;}
    });
  },{signal});
  page.addEventListener('input',event=>{
    const e=event.target,field=e.dataset.bmField;
    if(e.dataset.bmReference!==undefined){d.links[Number(e.dataset.bmReference)]=e.value;d.request=null;e.closest('.bm-reference-row').querySelector('.bm-platform').innerHTML=beatReferenceBadge(e.value);}
    if(field==='craft-name'){d.name=e.value;d.request=null;}
    if(field==='craft-note'){d.note=e.value;d.request=null;}
    if(field==='new-song-name')d.newSongName=e.value;
    if(field==='song-name'){d.songName=e.value;const prompt=page.querySelector('[data-bm-prompt]');if(prompt)prompt.textContent=prompt.textContent.replace(/Analyze "[^"]*"/,`Analyze "${e.value}"`);}
    if(page.dataset.bmPage==='craft'){const prompt=page.querySelector(':scope > .bm-narrow > [data-bm-handoff] [data-bm-prompt]');if(prompt)prompt.textContent=referencePrompt(d);}
  },{signal});
  page.addEventListener('change',event=>{
    const e=event.target,field=e.dataset.bmField;
    if(e.dataset.bmFile){void run(()=>upload(e.files,e.dataset.bmFile,e.dataset.reference));return;}
    if(field==='input-edit'){void run(async()=>{await write({action:'select-edit',exampleId:e.value});d.example=e.value;await refresh();});return;}
    if(field==='generation-song'){d.song=e.value;d.selectedInputs=[];d.autoClips=true;d.request=null;rerender();return;}
    if(field==='auto-clips'){d.autoClips=e.checked;d.request=null;rerender();return;}
    if(e.dataset.bmSelectedInput){d.selectedInputs=e.checked?[...new Set([...d.selectedInputs,e.dataset.bmSelectedInput])]:d.selectedInputs.filter(p=>p!==e.dataset.bmSelectedInput);d.request=null;}
  },{signal});
  page.addEventListener('toggle',event=>{if(event.target.matches('[data-bm-files]'))d.openFiles=event.target.open;},{signal,capture:true});
  page.addEventListener('paste',event=>{if(event.target.dataset.bmReference===undefined)return;const links=event.clipboardData.getData('text').trim().split(/\s+/);if(links.length<2)return;event.preventDefault();d.links.splice(Number(event.target.dataset.bmReference),1,...links);d.links=[...new Set(d.links)].slice(0,30);d.request=null;rerender();},{signal});
  for(const type of ['dragover','dragleave','drop'])page.addEventListener(type,event=>{const zone=event.target.closest('[data-bm-drop]');if(!zone)return;event.preventDefault();zone.classList.toggle('bm-dragging',type==='dragover');if(type==='drop')void run(()=>upload(event.dataTransfer.files,zone.dataset.bmDrop));},{signal});
  page.querySelectorAll('video,audio').forEach(video=>{
    video.addEventListener('play',()=>page.querySelectorAll('video,audio').forEach(other=>{if(other!==video)other.pause();}),{signal});
    video.addEventListener('timeupdate',()=>{const strip=page.querySelector(`[data-bm-target="${video.id}"]`);strip?.querySelectorAll('.bm-cut-slot').forEach((slot,i)=>{const on=video.currentTime>=Number(slot.dataset.start)&&video.currentTime<Number(slot.dataset.end);slot.setAttribute('aria-pressed',String(on));if(on)strip.parentElement.querySelector('[data-bm-cut-info]').textContent=`Clip ${i+1} · ${(Number(slot.dataset.end)-Number(slot.dataset.start)).toFixed(2)}s`;});},{signal});
  });
  return {destroy:()=>controller.abort()};
}
