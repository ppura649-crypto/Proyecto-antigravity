import {productDemoPrompt,productDemoForm,productDemoProject,productDemoPhases} from './product-demo.js';
import {agentPrompt,agentPicker,registerPromptSkills,syncAgentPrompts,watchAgentPrompts} from './agent-prompts.js';
import {productVoiceReady,productVoicePage,productVoiceDraft,productVoicePrompt,writeProductVoiceKey} from './product-demo-voice.js';
import {talkingVideoInstructions,talkingResumePrompt,splitVideoInstructions} from './talking-prompts.js';
import {talkingStylePage,talkingStyleName,talkingStyleSkill,talkingCreatePage,talkingCreatePrompt,writeTalkingStyle} from './talking-style.js';
import {onboardingView,onboardingRoute,mountOnboarding,writeOnboarding,setupPrompt} from './onboarding.js';
import {accountScreen, activityScreen} from './account-activity.js';
import {videoLibrary} from './video-library.js';
import {accountLabel,accountAvatar} from './account-identity.js';
import {WorkspaceClient} from './client.js';
import {reconcileLookDraft} from './look-draft.js';
import {talkingCaptionsPage,talkingCaptionsPrompt} from './talking-captions.js';
import {documentShelf, updateDocumentCards, filterDocuments} from './documents.js';
import {mountDocumentAnimations} from './document-motion.js';
import {beatCraftPage,beatReferenceRows,beatReferenceBadge,beatCraftPrompt} from './beat-craft.js';
import {montageReference} from './beat-reference-links.js';
import {beatOverview,beatInputsPage,beatNewPage,bindBeatPlayers,beatPreparationPrompt} from './beat-montage.js';
import {renderBeatLibrary,bindBeatLibrary,beatLibraryChrome,resetBeatLibraryDraft} from './beat-library.js';
import {listSetupDone,listDraft,listReelPage,mountListReel} from './list-reel.js';
import {oneShotPage,oneShotDraft,mountOneShot} from './one-shot.js';
import {fullVisualOverview,fullVisualNew,fullVisualProject,fullVisualResearchPrompt,fullVisualTranscriptPrompt} from './full-visual.js';
let oneShotController=null, onboardingController=null, onboardingMigration=false;

// Routes describe views. Only the files returned by the runtime describe completion.
document.documentElement.dataset.theme = 'light';
const $ = (q, root=document) => root.querySelector(q);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 home:'<path d="m3 10 9-7 9 7v10H14v-7h-4v7H3Z"/>',
 talk:'<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M9 7h6M8 15h8M10 18h4"/><circle cx="12" cy="11" r="1"/>',
 montage:'<path d="M3 5h18v14H3zM8 5v14M16 5v14M3 9h5M16 15h5"/>',
 list:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M10 18h4"/>',
 trial:'<path d="M8 3v5l-5 10a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3L16 8V3M6 3h12M6 15h12"/>',
 folder:'<path d="M3 6V4h7l2 3h9v13H3Z"/>', file:'<path d="M13 2H5v20h14V8ZM13 2v6h6M8 13h8M8 17h5"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 back:'<path d="m14 6-6 6 6 6"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>', plus:'<path d="M12 5v14M5 12h14"/>',
 check:'<path d="m5 12 4 4L19 6"/>', upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 chart:'<path d="M3 3v18h18M7 16V9M12 16V5M17 16v-5"/>',
 agent:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3M13 15h4"/>',
 visual:'<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8M10.5 11v5l4-2.5Z"/>',
 edit:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
const labels = {edit:['edit','Your own video, cut by hand.'],'full-visual':['visual','Any subject, explained word by word.'],'product-demo':['montage','Your product. A story people get.'], 'talking-head':['talk','Your voice. A sharper story.'], 'beat-montage':['montage','Every clip, on the beat.'], 'scroll-reel':['list','Good finds. One reel.'],phone:['phone','One shot. An idea worth saving.'],'trial-reels':['trial','More of what works for you.']};
const base = f => `/formats/${f.id}`;
const preview = Boolean(window.KEYFRAMES_PREVIEW);
const href = path => preview && location.protocol === 'file:' ? `?page=${encodeURIComponent(path)}` : path;
const link = (text, path, kind='', ico='') => `<a class="btn ${kind}" href="${esc(href(path))}" data-route="${esc(path)}" ${path.endsWith('/new')?'data-fresh="true"':''}>${ico ? icon(ico) : ''}${esc(text)}</a>`;
const button = (text, action, kind='', ico='') => `<button class="btn ${kind}" data-action="${esc(action)}">${ico ? icon(ico) : ''}${esc(text)}</button>`;
const heading = (title, subtitle='', actions='') => `<div class="page-heading"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${actions}</div>`;
// The video editor lives at /edit/<project>, a page of its own served by the workspace, so its links are plain links
// the router lets through. It is a desktop tool: on a phone the same place says so instead of opening it.
const editHref = id => '/edit/'+encodeURIComponent(id);
const canEdit = p => !preview && Boolean(p) && (p.format==='edit' || p.outputPaths?.length>0 || Boolean(p.preview));
const editLink = (id, text='Edit', kind='') => `<span class="edit-entry"><a class="btn ${kind}" href="${esc(editHref(id))}" data-editor="${esc(id)}">${icon('edit')}${esc(text)}</a><span class="edit-phone tiny">Edit on a computer</span></span>`;
const editExportNote = p => p?.edit?.exportRequest ? `<div class="edit-export-note" data-edit-export="${esc(p.id)}">${icon('clock')}<div><strong>Export requested</strong><span class="tiny">Paste this in chat to render your edit.</span></div>${button('Copy prompt','edit-export:'+p.id,'small-btn','copy')}</div>` : '';
const editBar = p => canEdit(p) ? `<div class="edit-bar">${editExportNote(p)}${editLink(p.id,'Edit video','primary')}</div>` : editExportNote(p);
const empty = (title, text) => `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
const field = (label, key, value='', placeholder='') => `<label class="field"><span>${esc(label)}</span><input type="text" data-field="${esc(key)}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
const select = (label,key,values,value) => `<label class="field"><span>${esc(label)}</span><select data-field="${esc(key)}">${values.map(v => {const [id,name] = Array.isArray(v) ? v : [v,v];return `<option value="${esc(id)}" ${id===value?'selected':''}>${esc(name)}</option>`;}).join('')}</select></label>`;
const count = d => `<label class="field"><span>How many?</span><input class="count-field" type="number" min="1" max="30" data-field="quantity" value="${esc(d.quantity || 1)}"></label>`;
let creatingEdit=false, snapshot, drafts={}, view, look, listController, documentMotion, lastStatus='connecting', pendingRoute, saveTimer, toastTimer;
const blobs = new Map();
const documents = new Map(), documentRequests = new Map(), documentEpochs = new Map();
const dataPath = () => preview && location.protocol==='file:' ? new URLSearchParams(location.search).get('page') || window.KEYFRAMES_PREVIEW.startPath || '/' : location.pathname;
const route = () => dataPath().split('?')[0].replace(/\/$/,'') || '/';
const format = id => snapshot.formats.find(f => f.id===id);
const setupDone = f => f?.id==='scroll-reel' ? listSetupDone(f) : f?.id==='talking-head' ? true : Boolean(f?.setup?.done && (!f.setup.requiredVersion || f.setup.version >= f.setup.requiredVersion));
const waiting = f => f.id==='trial-reels' && !snapshot.account.done;
const savedLook = a => ({card:a.dress||'plate',font:a.wordFont||'poppins',fonts:a.wordFonts||[a.wordFont||'poppins'],customFonts:a.customFonts||[],...(a.googleFont?{googleFont:a.googleFont}:{}),...(a.cardStyle?{cardStyle:a.cardStyle}:{}),opening:a.onscreen||'sentence-big',captionMode:a.captionMode||(['sentence-captions','visuals'].includes(a.onscreen)?'normal':'emphasized'),accent:(a.accent||'#E07850').toUpperCase()});
const finished = p => p.completed===true;
function formatAction(f,kind='small-btn'){
 if(f.id==='full-visual')return link('New video',base(f)+'/new',kind,'plus');
 if(f.id==='product-demo')return link(productVoiceReady(f)?'New film':'Set up Product Demo',base(f)+(productVoiceReady(f)?'/new':'/setup'),kind,productVoiceReady(f)?'plus':'arrow');
 if(f.id==='phone')return f.oneShot?.inputs?.total?link('New reel',base(f)+'/new',kind,'plus'):link('Add your inputs',base(f)+'/inputs',kind,'upload');
 if(f.id==='scroll-reel'&&!f.listReel?.inputs?.total)return link('Add your inputs',base(f)+'/inputs',kind,'upload');
 if(f.id==='scroll-reel')return link(listSetupDone(f)?'New List Reel':'Set up List Reel',base(f)+(listSetupDone(f)?'/new':'/setup'),kind,listSetupDone(f)?'plus':'arrow');
 if(f.id==='beat-montage')return link('Open montages',base(f),kind,'arrow');
 if(f.id==='trial-reels')return route().startsWith(base(f)) ? '' : link('View formats',base(f),kind,'arrow');
 if(waiting(f))return link('View progress','/setup',kind);
 if(!setupDone(f))return link('Setup',base(f)+'/setup',kind+' primary','arrow');
 if(f.id==='phone'&&f.materialKnown&&!f.materialReady&&inputFiles(f).length)return link('Check your shots',base(f)+'/material/prompt',kind,'arrow');
 if(f.materialKnown&&!f.materialReady)return link('Add footage',base(f)+'/new/footage',kind,'plus');
 if(f.id==='trial-reels'&&['originals','material'].includes(f.stage?.id))return link('Add originals',base(f)+'/new/footage',kind,'plus');
 return link('New '+f.name,base(f)+'/new',kind,'plus');
}

const fvDraft = id => (drafts['fv:'+id] ||= {own:false,text:''});
const draft = id => {
 if (!drafts[id]) {
  const f=format(id), a=f?.answers || {};
  drafts[id]={files:[],quantity:1,transcript:'',transcribe:false,topic:'',subject:'',...a,look:savedLook(a),lookBase:savedLook(a)};
 }
 const d=drafts[id];if(id==='talking-head'&&!d.lookVersion){if(!format(id)?.answers?.wordFont&&!d.setupDraft)d.look=savedLook(format(id)?.answers||{});d.lookVersion=10;}
 return d;
};
function persist() { if(!snapshot)return; try {localStorage.setItem(`keyframes-workspace:${snapshot.workspaceId}`,JSON.stringify(drafts));}catch{} }
function restore() {try {drafts=JSON.parse(localStorage.getItem(`keyframes-workspace:${snapshot.workspaceId}`)||'{}');for(const [key,d] of Object.entries(drafts)){if(key.startsWith('pref:'))d.saving=false;if(d.list){d.list.saving=false;d.list.reusing=false;}}}catch{drafts={};} }
function toast(text) {$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500);}
function navigate(path, replace=false) {
 if (!path.startsWith('/') || path.startsWith('//')) return;
 persist();look?.destroy();look=null;listController?.destroy();listController=null;oneShotController?.destroy();oneShotController=null;
 if (!replace) history.replaceState({...history.state,scroll:window.scrollY},'',location.href);
 history[replace?'replaceState':'pushState']({scroll:0},'',href(path));
 render();window.scrollTo(0,0);$('#stage')?.focus({preventScroll:true});
 if(activeDocumentPath())readDocument(activeDocumentPath(),{force:true});
 client.refresh();
}
function navItem(text, path, ico) {return `<a class="nav-item ${route()===path || path!=='/'&&route().startsWith(path+'/')?'active':''}" href="${esc(href(path))}" data-route="${esc(path)}">${icon(ico)}${esc(text)}</a>`;}
function shell() {
 $('#app').innerHTML=`<div class="os-shell"><aside class="os-sidebar"><a class="os-wordmark" href="${href('/')}" data-route="/"><span class="kf-mark"></span>Keyframes</a><a class="workspace-name" href="${href('/account')}" data-route="/account">${accountAvatar(snapshot.account.profile||{},esc,'mini-avatar')}<span>${esc(accountLabel(snapshot.account.profile))}</span></a><nav class="os-nav" aria-label="Workspace">${navItem('Home','/','home')}${preview?'':navItem('New video','/new','plus').replace('nav-item ','nav-item desktop-nav-link ')}${navItem('Videos','/videos','montage')}${navItem('Documents','/files','file')}${navItem('Account','/account','chart').replace('nav-item ','nav-item mobile-nav-link ')}${navItem('Activity','/activity','clock').replace('nav-item ','nav-item mobile-nav-link ')}</nav><div class="nav-label">Your formats</div><nav class="os-nav formats-nav" aria-label="Formats">${snapshot.formats.map(f=>navItem(f.name,base(f),labels[f.id]?.[0])).join('')}</nav><div class="nav-bottom">${navItem('Account','/account','chart')}${navItem('Activity','/activity','clock')}<div class="local-status">${icon('folder')}Saved on your computer</div></div></aside><div class="os-main"><header class="os-topbar"><div class="crumb" id="crumb">Home</div><div class="top-right">${agentPicker({global:true})}<div class="top-metrics" id="metrics"></div><a href="${href('/activity')}" data-route="/activity" id="activity-count" class="small"></a><span class="status-note" id="connection" role="status"></span></div></header><div id="format-bar" class="format-bar" hidden></div><main class="os-content" id="stage" tabindex="-1"></main></div></div>`;
 if(preview && window.KEYFRAMES_PREVIEW.notice && !$('.preview-notice')){const note=window.KEYFRAMES_PREVIEW.notice;$('#keyframes-os').insertAdjacentHTML('beforeend',`<div class="preview-notice trial-preview-notice"><span>${esc(note.text)}</span><a href="${esc(note.href)}">${esc(note.link)} ${icon('arrow')}</a></div>`);}
 if(preview && !$('.preview-notice')) $('#keyframes-os').insertAdjacentHTML('beforeend',`<div class="preview-notice"><span>Design preview · Sample files</span><select aria-label="Preview scenario" id="preview-scenario"><option value="returning">Returning buyer</option><option value="first">First visit</option><option value="importing">Account importing</option><option value="trial-analysis">Trial Reels analysis</option><option value="talking">Talking Head only</option></select></div>`);
 chrome();
}
function chrome() {
 if(!snapshot)return;
 const identity=$('.workspace-name'),profile=snapshot.account.profile?.handle?snapshot.account.profile:{...snapshot.account.profile,handle:snapshot.onboarding?.handle,platform:snapshot.onboarding?.platform};
 const identityHTML=accountAvatar(profile,esc,'mini-avatar')+`<span>${esc(accountLabel(profile))}</span>`;
 if(identity&&identity.innerHTML!==identityHTML)identity.innerHTML=identityHTML;
 const accountEnabled=snapshot.account.enabled!==false;
 if(identity)identity.style.display=accountEnabled?'':'none';
 document.querySelectorAll('.nav-item[data-route="/account"]').forEach(el=>el.style.display=accountEnabled?'':'none');
 document.querySelectorAll('.nav-item[data-route="/new"]').forEach(el=>el.style.display=snapshot.formats.length?'':'none');
 $('#metrics').style.display=accountEnabled?'':'none';
 const nav=$('.formats-nav'),ids=snapshot.formats.map(f=>f.id).join(',');
 if(nav.dataset.formats!==ids){nav.innerHTML=snapshot.formats.map(f=>navItem(f.name,base(f),labels[f.id]?.[0])).join('');nav.dataset.formats=ids;}
 $('#metrics').innerHTML=[['posts',snapshot.metrics?.posts],['views',snapshot.metrics?.views ?? snapshot.metrics?.plays]].filter(([,v])=>v!=null).map(([k,v])=>`<span><b>${esc(Number(v).toLocaleString(undefined,{notation:'compact',maximumFractionDigits:1}))}</b>${k}</span>`).join('');
 const period=snapshot.metrics?.period;
 $('#metrics').title=period?.from ? `Posts from ${date(period.from)} to ${date(period.to)}` : 'Available posts';
 const tasks=(snapshot.tasks||[]).filter(t=>t.status==='running'&&!t.stale);
 $('#activity-count').innerHTML=tasks.length ? `${tasks.length} running` : '';
 const sourceIssue=lastStatus==='connected'&&snapshot.sourceIssues?.length;
 $('#connection').dataset.state=sourceIssue?'reconnecting':lastStatus;
 $('#connection').innerHTML=`<i></i>${sourceIssue?'File needs attention':{connecting:'Connecting',connected:preview?'Preview':'Up to date',reconnecting:'Reconnecting',unavailable:'Connection lost'}[lastStatus]}`;
 document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',route()===a.dataset.route || a.dataset.route!=='/'&&route().startsWith(a.dataset.route+'/') || view?.f&&a.dataset.route===base(view.f)));
}
const date = value => {const d=new Date(value);return Number.isNaN(+d)?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});};
const stageName = s => typeof s==='string' ? s : s?.label||s?.name||s?.title||s?.id||'';
const media = (file, controls=true) => !file ? '' : file.kind==='video' ? `<video src="${esc(file.url)}" ${controls?'controls':''} playsinline preload="metadata"></video>` : file.kind==='image' ? `<img src="${esc(file.url)}" alt="${esc(file.name)}" loading="lazy">` : '';
function tasksHTML(all=false) {
 const tasks=(snapshot.tasks||[]).filter(t=>all||t.status!=='done');
 return tasks.length ? `<div class="task-list">${tasks.map(t=>`<div class="task-row"><div class="task-title">${t.status==='running'&&!t.stale?'<i class="spin"></i>':icon(t.status==='done'?'check':'clock')}<strong>${esc(t.label||t.id)}</strong><span class="tiny">${esc(t.stale?'Last reported':t.status==='done'?'Complete':t.status==='error'?'Needs attention':t.status==='queued'?'Queued':t.status==='running'?'Running':'Waiting for agent')}</span></div><div class="tiny">${esc(t.stage||'')}${t.updatedAt?` · ${esc(date(t.updatedAt))}`:''}</div>${t.total>0&&t.completed!=null?`<progress max="${Number(t.total)}" value="${Number(t.completed)}" aria-label="${esc(t.label)}"></progress><p class="tiny">${Number(t.completed)} of ${Number(t.total)}</p>`:''}${t.status==='error'||t.stale?button('Copy resume prompt','task:'+t.id,'ghost small-btn'):''}</div>`).join('')}</div>` : '';
}
function projectRows(projects) {return projects.map(p=>{
 const thumb=p.files?.find(f=>f.kind==='image'),step=p.steps?.find(s=>s.id===p.progress?.current);
 const status=p.format==='edit'?(p.completed?'Exported':p.edit?.exportRequest?'Export requested':p.edit?.editedAt?'Edited':'Edit'):step?.label|| (p.format==='product-demo'?productDemoPhases.find(([id])=>id===p.data?.stage)?.[1]:null)|| (p.format==='talking-head'&&!p.steps?.length?'Steps not recorded':stageName(p.stage)||'In progress');
 const path='/projects/'+encodeURIComponent(p.id);
 return `<a class="project-row" data-project="${esc(p.id)}" data-route="${esc(path)}" href="${esc(href(path))}">${thumb?`<img src="${esc(thumb.url)}" alt="" loading="lazy">`:icon(labels[p.format]?.[0])}<div class="project-copy"><h3>${esc(p.name)}</h3><p class="tiny">${snapshot.formats.length>1&&format(p.format)?esc(format(p.format).name)+' · ':''}${esc(status)}${step?.owner==='you'?' · You review':p.progress?.total?` · ${Number(p.progress.completed)} of ${Number(p.progress.total)}`:''}</p>${p.steps?.length?`<div class="step-dots" aria-label="${Number(p.progress?.completed)||0} stages complete">${p.steps.map(s=>`<i data-state="${esc(s.status)}" title="${esc(s.label)}"></i>`).join('')}</div>`:''}</div><span class="project-open" aria-hidden="true">${icon('arrow')}</span></a>`;
}).join('');}
// New video with several formats: pick one. With a single format the home button already goes straight to it.
function newChooser() {
 return `<div class="center-flow">${heading('New video','Pick what to make.')}<div class="format-list">${snapshot.formats.map(f=>`<div class="format-row"><div class="format-symbol">${icon(labels[f.id]?.[0])}</div><a class="format-link" href="${href(base(f))}" data-route="${base(f)}"><h3>${esc(f.name)}</h3><p class="tiny">${esc(labels[f.id]?.[1]||'')}</p></a>${formatAction(f)}</div>`).join('')}</div></div>`;
}
function home() {
 const only=snapshot.formats.length===1&&snapshot.formats[0];
 let html=heading('What’s next?','Your next video starts here.',preview||!snapshot.formats.length?'':only?formatAction(only,'primary'):link('New video','/new','primary','plus'));
 html+=tasksHTML();
 if(snapshot.sourceIssues?.length)html+=sourceIssuesHTML();
 if(snapshot.account.questions?.length)html+=`<div class="mission"><div class="mission-mark">${icon('agent')}</div><div class="mission-copy"><h3>A few things only you know</h3><p>${snapshot.account.questions.length} short answers to make this yours.</p></div>${link('Answer','/setup/questions','primary','arrow')}</div>`;
 const accountTask=(snapshot.tasks||[]).some(t=>['profile','context'].includes(t.id)&&t.status!=='done');
 if(snapshot.account.enabled!==false&&!snapshot.account.done&&!snapshot.account.questions?.length&&!accountTask){
  const reading=snapshot.account.postsCount>0,ready=snapshot.onboarding?.stage==='prompt';
  html+=`<div class="mission"><div class="mission-mark">${icon('agent')}</div><div class="mission-copy"><h3>${reading?'Your account reading':ready?'Your setup prompt is ready':'Add your account when you’re ready'}</h3><p>${reading?'Your posts are here. Review what we learned.':ready?'Paste it into your agent chat whenever you’re ready.':'Start with your footage. Your account can come later.'}</p></div>${link(reading?'You review':ready?'Setup prompt':'Add account',reading?'/setup':ready?'/account/setup-prompt':'/account/connect','','arrow')}</div>`;
 }
 const active=snapshot.projects.filter(p=>!finished(p));
 if(active.length)html+=`<div class="section-title">Continue your work</div>${projectRows(active.slice(0,3))}<div style="height:35px"></div>`;
 // The latest finished videos, each one click from the editor.
 const recent=snapshot.outputs.filter(o=>o.projectId).slice(0,4);
 if(recent.length)html+=`<section class="recent-outputs"><div class="section-title">Your latest videos ${link('See all','/videos','small-btn')}</div>${outputCards(recent)}</section><div style="height:35px"></div>`;
 const edits=snapshot.projects.filter(p=>p.format==='edit');
 if(edits.length)html+=`<div class="section-title">Your edits</div>${projectRows(edits.slice(0,6))}<div style="height:35px"></div>`;
 if(!snapshot.formats.length)return html+empty('Add your first format','Copy the prompt into the chat open in this folder.')+button('Copy add prompt','add-pack','primary','copy');
 html+=`<div class="section-title">Your formats</div><div class="format-list">${snapshot.formats.map(f=>`<div class="format-row"><div class="format-symbol">${icon(labels[f.id]?.[0])}</div><a class="format-link" href="${href(base(f))}" data-route="${base(f)}"><h3>${esc(f.name)}</h3><p class="tiny">${esc(waiting(f)?'Waiting for your account':labels[f.id]?.[1]||'')}</p></a>${only?'':formatAction(f)}</div>`).join('')}</div>`;
 return html;
}
function accountSetup() {
 const a=snapshot.account;
 const steps=[['Your account',Boolean(a.profile?.handle||a.profile?.name)],['Your posts',a.postsCount>0],['Your context',a.done]];
 return `<div class="center-flow">${heading(a.done?'Your account is set up':'Make this yours',a.done?'You can update it whenever you like.':'Your account, your content.')}<div class="stage-list">${steps.map(([name,done],i)=>`<div class="stage-line">${done?icon('check'):'<i class="state-circle"></i>'}<span>${name}</span><span class="tiny">${done?'Read from your files':'Pending'}</span></div>`).join('')}</div>${tasksHTML(true)}${a.questions?.length?link('Answer your questions','/setup/questions','primary','arrow'):''}${a.readback?.length?link('Review your account','/setup/readback','','arrow'):''}${promptBox(a.done?'/start\nUpdate my account.':setupPrompt(snapshot.onboarding))}${link('Back to Home','/','ghost')}</div>`;
}
function formatChrome() {
 const host=$('#format-bar'),f=view?.f;
 host.hidden=!f;host.dataset.format=f?.id||'';
 if(!f){host.innerHTML='';return;}
 if(f.id==='talking-head'&&['talking-style','talking-create'].includes(view.kind)){host.innerHTML=`<div class="format-bar-inner"><div class="format-hero"><div class="format-symbol">${icon(labels[f.id]?.[0])}</div><h1>${esc(f.name)}</h1></div></div>`;return;}
 if(f.id==='beat-montage'&&(view.kind==='beat-library'||searchParams().get('template')&&activeDocumentPath())){
  const c=beatLibraryChrome(f,activeDocumentPath()?'template/'+encodeURIComponent(searchParams().get('template'))+'/documents':view.sub);
  host.innerHTML=`<div class="format-bar-inner"><div class="format-hero trial-format-hero"><a class="trial-back" href="${esc(href(c.back))}" data-route="${esc(c.back)}" aria-label="Back" title="Back">${icon('back')}</a><h1>${esc(c.title)}</h1>${c.action?`<a class="btn primary" href="${esc(href(c.action.path))}" data-route="${esc(c.action.path)}" data-bm-reset="${esc(c.action.path.split('/')[4])}">${esc(c.action.label)}</a>`:''}</div>${c.tabs?.length?`<nav class="os-tabs" aria-label="${esc(c.title)} pages">${c.tabs.map(t=>`<a href="${esc(href(t.path))}" data-route="${esc(t.path)}" ${t.current?'aria-current="page"':''}>${esc(t.label)}</a>`).join('')}</nav>`:''}</div>`;return;
 }
 let selected=f.id==='product-demo'&&['product-demo-voice','product-demo-voice-prompt'].includes(view.kind)?'voice':view.kind==='preferences'||activeDocumentPath()===f.preferencesPath?'preferences':['scroll-reel','phone'].includes(f.id)?(f.id==='phone'?view.shotPage==='look'?'look':view.shotPage?.startsWith('ideas')?'ideas':view.shotPage==='research'?'research':view.shotPage==='inputs'?'inputs':'overview':(view.listPage?.startsWith('setup')?'look':view.listPage?.startsWith('ideas')?'ideas':view.listPage?.startsWith('research')?'research':view.listPage==='inputs'?'inputs':'overview')):view.kind==='beat-inputs'?'inputs':view.sub?.startsWith('setup')?'look':'overview';
 if(view.kind==='talking-captions')selected='captions';
 const tabs=f.id==='product-demo'?[['overview','Overview',base(f)],['voice','Voice',base(f)+'/setup'],['preferences','Preferences',base(f)+'/preferences']]:['scroll-reel','phone'].includes(f.id)?[['overview','Overview',base(f)],['inputs','Add inputs',base(f)+'/inputs'],['ideas','Ideas',base(f)+'/ideas'],['research','Research',base(f)+'/research'],['preferences','Preferences',base(f)+'/preferences'],['look','Edit look',base(f)+'/setup/hook']]:f.id==='beat-montage'?[['overview','Overview',base(f)],['inputs','Add inputs',base(f)+'/inputs'],['preferences','Preferences',base(f)+'/preferences']]:f.id==='trial-reels'?[['overview','Your formats',base(f)],['preferences','Preferences',base(f)+'/preferences']]:f.id==='full-visual'?[]:[['overview','Overview',base(f)],['preferences','Preferences',base(f)+'/preferences'],...(f.id==='talking-head'?[['captions','Your captions',base(f)+'/captions']]:[['look','Edit look',base(f)+'/setup']])];
 const model=f.id==='trial-reels'&&view.sub?.startsWith('models/')?snapshot.trial?.formats.find(m=>m.id===decodeURIComponent(view.sub.slice(7))):null;
 if(model){host.innerHTML=`<div class="format-bar-inner"><div class="format-hero trial-format-hero"><a class="trial-back" href="${esc(href(base(f)))}" data-trial-back="${esc(model.id)}" aria-label="${trialInputDraft(model.id).adding||trialInputDraft(model.id).more?'Back to '+esc(model.name):'Back to formats'}" title="Back">${icon('back')}</a><h1>${esc(model.name)}</h1>${(model.canGenerate||model.approved)?preview&&window.KEYFRAMES_PREVIEW.workspaceUrl?`<a class="btn trial-primary" href="${esc(window.KEYFRAMES_PREVIEW.workspaceUrl)}/formats/trial-reels" target="_blank" rel="noopener">+ New trial reels</a>`:`<button class="btn trial-primary" data-trial-add="${esc(model.id)}">+ New trial reels</button>`:''}</div>${(model.canGenerate||model.approved)?`<p class="small trial-output-count">${model.batch?.sources?`${model.batch.finishedSources} of ${model.batch.sources} reels complete · `:''}${model.variationCount} variation${model.variationCount===1?'':'s'}</p>`:''}</div>`;return;}
 host.innerHTML=`<div class="format-bar-inner"><div class="format-hero">${f.id==='trial-reels'?`<a class="trial-back" href="${esc(href(view.sub?base(f):'/'))}" data-route="${view.sub?base(f):'/'}" aria-label="${view.sub?'Back to formats':'Back to Home'}" title="Back">${icon('back')}</a>`:`<div class="format-symbol">${icon(labels[f.id]?.[0])}</div>`}<h1>${esc(f.name)}</h1>${view.kind==='beat-inputs'||f.id==='product-demo'&&(['product-demo-new','product-demo-voice','product-demo-voice-prompt','project'].includes(view.kind)||view.kind==='format'&&!snapshot.projects.some(p=>p.format===f.id)&&!snapshot.outputs.some(p=>p.format===f.id))||f.id==='full-visual'&&(view.kind!=='format'||!snapshot.projects.some(p=>p.format===f.id)&&!snapshot.outputs.some(p=>p.format===f.id))?'':formatAction(f,'primary')}</div>${tabs.length?`<nav class="os-tabs" aria-label="${esc(f.name)} pages">${tabs.map(([id,name,path])=>`<a href="${esc(href(path))}" data-route="${path}" ${selected===id?'aria-current="page"':''}>${name}</a>`).join('')}</nav>`:''}</div>`;
}
function outputCards(outputs) {
 return `<div class="output-grid">${outputs.map(output=>{
  const path=output.projectId?'/projects/'+encodeURIComponent(output.projectId):'/files?file='+encodeURIComponent(output.path);
  const project=output.projectId?snapshot.projects.find(p=>p.id===output.projectId):null;
  const edited=project?.edit?.editedAt?'<span class="edit-state">Edited</span>':'';
  const poster=output.cover?.url||(!preview?'/api/edit/poster?path='+encodeURIComponent(output.path):'');
  return `<article class="output-card" data-output="${esc(output.path)}"><video src="${esc(output.url)}" ${poster?`poster="${esc(poster)}"`:''} controls playsinline preload="none" aria-label="${esc(output.name)}"></video><a href="${esc(href(path))}" data-route="${esc(path)}">${esc(output.name)}</a><span class="tiny">${esc(date(output.updatedAt))}${edited}</span>${output.projectId&&!preview?editLink(output.editId||output.projectId,'Edit','small-btn output-edit'):''}</article>`;
 }).join('')}</div>`;
}
function formatExample(f) {
 const copy={
  'beat-montage':['Your clips, on the beat.','Your footage cut to a song, with one line over it.','A finished reel, caption, cover and sound instructions.','Bring your clips. We choose the moments and make the edit.'],
  'scroll-reel':['Good finds. One reel.','Useful resources for your audience, shown over a clip of you.','A finished reel, caption, cover and the resource links.','Bring one desk clip. We research what is worth sharing.'],
  phone:['One shot. An idea worth saving.','A simple clip, a hook on screen and the useful answer in the caption.','A finished reel, complete caption, cover and sound instructions.','Start with one shot. We find the idea and write the words.'],
 }[f.id];
 if(!copy||!f.exampleVideo?.url&&!f.example?.url)return '';
 const video=f.exampleVideo;
 const reference=video?`<video src="${esc(video.url)}" ${f.example?.url?`poster="${esc(f.example.url)}"`:''} controls playsinline preload="metadata" aria-label="Watch a full ${esc(f.name)} example"></video>`:media(f.example);
 const credit=f.exampleCredit||'Format example';
 return `<section class="format-example" aria-label="${esc(f.name)} example"><figure>${reference}<figcaption>${esc(credit)}${f.exampleLink?` · <a href="${esc(f.exampleLink)}" target="_blank" rel="noreferrer">Original reel ↗</a>`:''}</figcaption></figure><div><h2>${copy[0]}</h2><p>${copy[1]}</p><div class="example-includes"><strong>You get</strong><p>${copy[2]}</p></div><p>${copy[3]}</p>${setupDone(f)?formatAction(f,'primary'):link('Make this mine',base(f)+'/setup','primary','arrow')}</div></section>`;
}
function detail(f) {
 if(f.id==='full-visual')return fullVisualOverview(f,snapshot,{esc,link,projectRows,outputCards});
 if(f.id==='product-demo'){
  const active=snapshot.projects.filter(p=>p.format===f.id&&!finished(p)),outputs=(snapshot.outputs||[]).filter(o=>o.format===f.id);
  return `${!outputs.length&&!active.length?`<div class="product-demo-project"><h2>Make your first product demo.</h2><p class="muted">We study your product, write the story and animate the film.</p><ol class="product-demo-intro"><li>Your product</li><li>Story &amp; voice</li><li>Animated film</li></ol><div class="button-row">${link(productVoiceReady(f)?'Make my first film':'Set up Product Demo',base(f)+(productVoiceReady(f)?'/new':'/setup'),'primary','arrow')}</div></div>`:''}${outputs.length?`<section class="recent-outputs"><div class="section-title">Your films</div>${outputCards(outputs)}</section>`:''}${active.length?`<section class="active-videos"><div class="section-title">In progress</div>${projectRows(active)}</section>`:''}`;
 }
 if(f.id==='beat-montage')return beatOverview(f,snapshot,beatDraft(),beatUI());
 if(f.id==='trial-reels')return trialDetail(f);
 const active=snapshot.projects.filter(p=>p.format===f.id&&!finished(p));
 const outputs=(snapshot.outputs||[]).filter(o=>o.format===f.id).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
 if(outputs.length)return `<section class="recent-outputs"><div class="section-title">Your videos</div>${outputCards(outputs)}</section>${active.length?`<section class="active-videos"><div class="section-title">In progress <span>${active.length}</span></div>${projectRows(active)}</section>`:''}`;
 const example=!outputs.length?formatExample(f):'';
 return `${example||(!setupDone(f)&&!waiting(f)?`<div class="mission"><div class="mission-copy"><h3>Your first ${esc(f.name.toLowerCase())}</h3><p>Choose your look once, then make it yours.</p></div>${link('Setup',base(f)+'/setup','primary','arrow')}</div>`:'')}${waiting(f)?`<div class="mission"><div class="mission-copy"><h3>Reading your account first</h3><p>Your best formats guide these variations.</p></div>${link('View progress','/setup','small-btn')}</div>`:''}${active.length?`<section class="active-videos"><div class="section-title">In progress <span>${active.length}</span></div>${projectRows(active)}</section>`:''}${outputs.length||!example?`<section class="recent-outputs"><div class="section-title">Recent outputs</div>${outputs.length?outputCards(outputs):empty('Your videos will appear here','Your five latest outputs, ready to watch.')}</section>`:''}`;
}
function stages(f) {return f.stages?.length?`<div class="mini-stages">${f.stages.map(s=>`<span class="${stageName(s)===stageName(f.stage)?'current':''}">${esc(stageName(s))}</span>`).join('')}</div>`:'';}
function progress(f,current,setup=false) {
 const paths=setup?['footage','look','prompt']:['footage','transcript','prompt'];
 return `<nav class="onboarding-track" aria-label="Video steps">${paths.map((p,i)=>`${i?'<span class="track-line"></span>':''}<span ${p===current?'aria-current="step"':''} class="${p===current?'current':''}">${{footage:'Footage',look:'Your look',transcript:'Transcript',prompt:'Prompt'}[p]}</span>`).join('')}</nav>`;
}
function formatFiles(f) {return snapshot.files.filter(file=>file.format===f.id||file.path.includes('/'+f.id+'/')||f.pack==='quick-cuts'&&file.path.includes('/quick-cuts/'));}
function inputFiles(f) {return snapshot.files.filter(file=>file.path.startsWith('workspace/input/')&&['video','image'].includes(file.kind) && (!file.format||file.format===f.id||file.format===f.pack));}
function selectedMedia(d) {
 for(const file of d.files||[]) {if(file.path){const live=snapshot.files.find(x=>x.path===file.path);if(live)return live;}else if(blobs.has(file.token))return {...file,url:blobs.get(file.token),kind:file.type?.startsWith('video/')?'video':'image'};}
 return null;
}
function footage(f,setup=false) {
 const d=draft(f.id);
 return `<div class="center-flow">${f.id==='talking-head'?progress(f,'footage',setup):''}${heading(f.id==='trial-reels'?'Your original footage':'Add your raw footage',f.id==='trial-reels'?'Use the unedited files behind your selected reels.':'Choose a file here, then attach it in chat.')}<label class="drop-zone">${icon('upload')}<strong>Drop footage here</strong><span class="tiny">or choose files</span><input id="footage-input" type="file" accept="video/*,image/*" multiple aria-label="Choose raw footage"></label><div id="chosen-files">${chosenFiles(d)}</div>${inputFiles(f).length?`<label class="field" style="margin-top:24px"><span>Already in your folder</span><select id="existing-footage"><option value="">Choose footage</option>${inputFiles(f).map(file=>`<option value="${esc(file.path)}">${esc(file.name)}</option>`).join('')}</select></label>`:''}<p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back',base(f),'ghost')}${button('Continue','footage-next','primary','arrow')}</div></div>`;
}
function chosenFiles(d) {return (d.files||[]).map((file,i)=>`<div class="file-row">${icon('file')}<div>${esc(file.name)}<span class="tiny">${esc(file.path?'In your folder':'Attach this file in chat')}</span></div><button class="btn ghost small-btn" data-remove="${i}" aria-label="Remove ${esc(file.name)}">Remove</button></div>`).join('');}

function sourceIssuesHTML(){return `<div class="mission"><div class="mission-copy"><h3>A file needs attention</h3><p>Your last complete reading stays visible while your agent repairs it.</p></div>${button('Copy repair prompt','source-repair','small-btn','copy')}</div>`;}

function transcript(f) {
 const d=draft(f.id);
 return `<div class="center-flow">${progress(f,'transcript',!setupDone(f))}${heading('Your words.','Add the transcript, or let your agent transcribe the footage.')}<label class="field"><span>Transcript</span><textarea data-field="transcript" id="transcript" placeholder="Paste your transcript…" ${d.transcribe?'disabled':''}>${esc(d.transcript)}</textarea></label><label class="check-label"><input type="checkbox" data-field="transcribe" ${d.transcribe?'checked':''}>Transcribe my footage</label><p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back',base(f)+(setupDone(f)?'/new/footage':'/setup/look'),'ghost')}${button('Get prompt','transcript-next','primary','arrow')}</div></div>`;
}
function sounds(f,d) {
 const options=(f.sounds||snapshot.sounds||[]).filter(t=>!t.formats||t.formats.includes(f.id));
 return options.length?`<div class="field"><span>Sounds</span>${options.map(t=>`<label class="sound-choice"><input type="checkbox" data-sound="${esc(t.id)}" ${(d.sounds||[]).includes?.(t.id)?'checked':''}><span>${esc(t.title||t.id)}<small>${esc(t.owner||'')}${t.bpm?' · '+esc(t.bpm)+' BPM':''}</small></span>${/^https:\/\//.test(t.page||'')?`<a href="${esc(t.page)}" target="_blank" rel="noreferrer">Listen ↗</a>`:''}</label>`).join('')}</div>`:'<p class="setup-note">Your agent will show sounds that fit this format.</p>';
}
function quickDefaults(f) {
 const d=draft(f.id);
 const defaults=f.id==='beat-montage'?{preset:'fast-beat-cut',layout:'full',line_style:'serif centred'}:f.id==='scroll-reel'?{opening:'lockup',feel:'medium',cta:'save',face:'Barlow Condensed',accent:'keyframes'}:{shape:'authority',cta:'save',keyword:''};
 for(const [k,v] of Object.entries(defaults))d[k]??=v;
 if(d.accent==='chris')d.accent='reference'; // legacy alias: the 0.4.0 name of the reference accent
 return d;
}
function quickSetup(f) {
 const d=quickDefaults(f);
 let form='';
 if(f.id==='beat-montage')form=field('What will you film?','subject',d.subject,'Your work, your studio, your days…')+select('Rhythm','preset',[['fast-beat-cut','Fast beat cut'],['slow-hold','Slow hold'],['hook-then-burst','Hook then burst']],d.preset)+select('Frame','layout',[['full','Full frame'],['square','Square with bars']],d.layout)+select('Caption','line_style',[['serif centred','Serif, centred'],['own','My usual text look']],d.line_style);
 if(f.id==='scroll-reel')form=field('Your desk footage','shot',d.shot,'Choose below, or attach it in chat')+select('Opening','opening',[['lockup','Title'],['count','Big number'],['band','Title band'],['window-first','Window first']],d.opening)+field('Font','face',d.face)+select('Accent','accent',[['keyframes','Orange'],['reference','Yellow'],['from your account','From my account']],d.accent)+select('Scroll','feel',['soft','medium','hard'],d.feel)+select('Ending','cta',[['save','Save it'],['comment','Comment a keyword'],['link','Go to my link']],d.cta)+field('Comment keyword, if used','keyword',d.keyword);
 if(f.id==='phone')form=select('Hook shape','shape',[['authority','A trusted method'],['experiment','My own experiment'],['taunt','A challenge'],['tonight','Try this tonight'],['wall','A useful collection'],['number-title','A numbered list'],['one-prompt','One useful prompt'],['tells','Signs to look for'],['secret','A little-known idea']],d.shape)+select('Ending','cta',[['save','Save it'],['caption','Value in the caption'],['comment','Comment a keyword']],d.cta)+`<div id="keyword-field" ${d.cta==='comment'?'':'hidden'}>${field('Keyword and what you send','keyword',d.keyword,'TOOLS, my resource list')}</div><p class="setup-note">Words follow your framing. Your agent checks placement on each shot.</p>`;
 return heading(setupDone(f)?'Your saved look':`Set up ${f.name}`,setupDone(f)?'Change only what you want to update.':'Choose once. Use it for every reel.')+`<div class="setup-grid"><div class="setup-preview" id="quick-preview">${quickPreview(f,d)}</div><div class="setup-fields">${form}${sounds(f,d)}${f.id==='beat-montage'?field('Your own sounds, optional','own_sounds',d.own_sounds,'Attach your audio files in chat'):''}<div class="section-title">Your footage</div><label class="drop-zone">${icon('upload')}<span>Choose footage</span><input id="footage-input" type="file" accept="video/*,image/*" multiple aria-label="Choose footage"></label><div id="chosen-files">${chosenFiles(d)}</div>${fileRows(formatFiles(f).filter(x=>x.kind==='page'))}<p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back',base(f),'ghost')}${button('Get setup prompt','quick-setup-prompt','primary','arrow')}</div></div></div>`;
}
function quickPreview(f,d) {
 const selected=selectedMedia(d), image=selected||f.example;
 const picture=image?media(image,false):`<div style="height:100%;display:grid;place-items:center;padding:25px;text-align:center;font-size:12px;color:#cbd0d6">Your footage goes here</div>`;
 if(image&&image===f.example)return `<div class="format-mock">${f.exampleVideo?.url?`<video src="${esc(f.exampleVideo.url)}" poster="${esc(image.url)}" controls playsinline preload="metadata" aria-label="Watch a full ${esc(f.name)} example"></video>`:picture}</div><p class="preview-foot">${esc(f.exampleCredit||'Full format example')}. Your choices apply to your reel.</p>`;
 const words=f.id==='phone'?'Small ideas.\nUseful every day.':f.id==='scroll-reel'?'4 tools worth keeping':'A little of what I do.';
 return `<div class="format-mock ${f.id==='beat-montage'&&d.layout==='square'?'montage-square':''}">${picture}${f.id==='scroll-reel'?`<div class="mock-heading ${esc(d.opening)}" style="color:${d.accent==='reference'?'#F6FA87':d.accent==='keyframes'?'#e07850':'#fff'}">${words}</div><div class="mock-window"><div class="window-top"><i></i><i></i><i></i></div><strong>A useful find</strong><p>Show what makes it worth saving.</p><div class="mock-line"></div><div class="mock-line"></div></div>`:`<div class="mock-words ${d.line_style==='serif centred'?'serif':''}">${words}</div>`}${f.id==='phone'?'<div class="mock-cta">Keep this for later.</div>':''}</div><p class="preview-foot">${image?'Preview':'Layout preview'}</p>`;
}
const beatUploads=[];
const beatUI=()=>({esc,heading,link,button,icon,count,outputCards,projectRows,preview,workspaceUrl:window.KEYFRAMES_PREVIEW?.workspaceUrl});
const beatDraft=()=>{const d=draft('beat-montage');beatReferenceRows(d);return {...d,uploads:beatUploads};};
function beatUploadView(){if(['beat-inputs','beat-craft'].includes(view?.kind)||(view?.kind==='format'&&view.f?.id==='beat-montage')){const y=scrollY;render(true);scrollTo(0,y);}}
async function sendBeatFile(job){
 job.status='uploading';job.error='';beatUploadView();
 try{
  if(preview)throw Error('Add clips in your installed workspace. This is the design preview.');
  await new Promise((accept,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('PUT','/api/beat-inputs?'+new URLSearchParams({name:job.name,...job.referenceId?{reference:job.referenceId}:{}}));xhr.setRequestHeader('X-Keyframes-Write','inputs');
   xhr.upload.onprogress=e=>{if(e.lengthComputable){job.progress=e.loaded/e.total*100;const p=document.querySelector(`[data-beat-upload-progress="${job.id}"]`);if(p)p.value=job.progress;}};
   xhr.onload=()=>{let value;try{value=JSON.parse(xhr.responseText);}catch{}if(xhr.status>=200&&xhr.status<300)accept(value);else reject(Error(value?.error||'Upload failed. Try again.'));};
   xhr.onerror=()=>reject(Error('Connection lost. Try again.'));xhr.onabort=()=>reject(Error('Upload stopped. Try again.'));xhr.send(job.file);
  });
  job.status='done';job.file=null;await client.refresh();
 }catch(e){job.status='error';job.error=e.message;}
 beatUploadView();
}
async function addBeatFiles(files,referenceId=null){
 const incoming=Array.from(files).map(entry=>({file:entry.file||entry,name:entry.relativePath||entry.webkitRelativePath||entry.name}));
 const videos=incoming.filter(x=>/\.(mp4|mov|m4v|mkv|webm|avi)$/i.test(x.name));
 if(referenceId){const d=draft('beat-montage');d.referenceUploadErrors??={};delete d.referenceUploadErrors[referenceId];if(!videos.length){d.referenceUploadErrors[referenceId]='Choose a video file, such as MP4 or MOV.';beatUploadView();return;}}
 if(!videos.length)return error('Add original video clips.');
 const jobs=videos.map(x=>({...x,referenceId,id:crypto.randomUUID(),status:'queued',progress:0}));beatUploads.push(...jobs);beatUploadView();
 let next=0;await Promise.all([0,1].map(async()=>{while(next<jobs.length)await sendBeatFile(jobs[next++]);}));
}
function quickNew(f) {
 const d=draft(f.id);
 if(f.id==='trial-reels')return trialNew(f);
 return `<div class="center-flow">${heading(`New ${f.name}`,f.id==='beat-montage'?'Your saved footage, sounds and look.':'Your saved look is already included.')}${count(d)}${f.id!=='beat-montage'?field((snapshot.account.context?.readyForIdeas??snapshot.account.done)?'Topic, optional':'What should this be about?','topic',d.topic,(snapshot.account.context?.readyForIdeas??snapshot.account.done)?'Use what you know about me':snapshot.account.context?.audience?'An idea for your saved audience':'A topic and who it is for'):''}<p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back',base(f),'ghost')}${button('Get prompt','quick-new-prompt','primary','arrow')}</div></div>`;
}
function trialNew(f){
 const d=draft(f.id),sources=Array.isArray(f.answers?.sources)?f.answers.sources:[];
 if(!d.source&&sources[0])d.source=sources[0].id;
 return `<div class="center-flow">${heading('New Trial Reels','Vary a format that already worked.')}${sources.length?select('Start from','source',sources.map(s=>[s.id,s.line||s.family||s.code||s.id]),d.source):'<p class="setup-note">Your agent will use your saved format selection.</p>'}${count(d)}${link('Add or replace originals',base(f)+'/new/footage','ghost','plus')}<p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${link('Back',base(f),'ghost')}${button('Get prompt','quick-new-prompt','primary','arrow')}</div></div>`;
}
const trialUploads=new Map();
const trialInputDraft=id=>drafts['trial-inputs:'+id]??=( {drive:'',need:'',error:''} );
function trialTask() {return (snapshot.tasks||[]).filter(t=>(t.id==='profile'||String(t.id).startsWith('trial-'))&&t.status!=='done').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];}
function trialTaskView(task) {return task?`<div class="trial-work" role="status">${task.status==='running'&&!task.stale?'<i class="spin"></i>':icon('clock')}<div><strong>${esc(task.label)}</strong><p class="small">${task.stale?'Last reported: ':task.status==='error'?'Stopped: ':''}${esc(task.stage)}${task.total>0?` · ${Number(task.completed)||0} of ${Number(task.total)}`:''}</p>${task.stale||task.status==='error'?'<p class="small">Continue in chat to resume.</p>':''}</div></div>`:'';}
function trialImage(example,cls='') {return example?.thumbnail?`<img class="${cls}" src="${esc(example.thumbnail.url)}" alt="${esc(example.name||'Example from your reel')}" loading="lazy">`:example?.video?`<video class="${cls}" src="${esc(example.video.url)}" preload="metadata" playsinline aria-label="Example from your reel"></video>`:`<span class="trial-missing ${cls}">Preview pending</span>`;}
function trialHome(f) {
 const trial=snapshot.trial||{},models=trial.formats||[],state=trial.analysis?.status,task=trialTask(),incomplete=waiting(f)||!['ready','no-matches','empty'].includes(state);
 let intro=task?.status==='running'&&!task.stale?trialTaskView(task):'';
 if(!intro&&incomplete)intro=task?trialTaskView(task):`<div class="trial-continue">${promptBox(waiting(f)?'/start\nFinish my account context, then continue into Trial Reels.':'/trial-reels\nContinue identifying my best reels. Reuse the formats you already know.')}</div>`;
 if(!intro&&!models.length)intro=heading(state==='no-matches'?'Your best reels are talking heads':'No recent reels yet',state==='no-matches'?'These do not need a Trial Reels study.':'Trial Reels starts from videos you have already posted.');
 const rows=models.map(m=>{
  const path=base(f)+'/models/'+encodeURIComponent(m.id);
  const status=(m.canGenerate||m.approved)?m.complete?`${m.variationCount} variations ready`:`${m.batch?.remainingSources??m.posts} reels to finish`:m.screen==='test'?'Review your test':m.screen==='study'?m.studied?'Preparing your test':'Study your inputs':'Add your originals';
  return `<a class="trial-format-row" href="${esc(href(path))}" data-route="${esc(path)}">${trialImage(m.cover||m.examples?.[0],'trial-row-image')}<div class="trial-row-copy"><h2>${esc(m.name)}</h2><p>${esc(m.what)}</p><span class="trial-video-count">${Number(m.posts).toLocaleString()} selected reel${m.posts===1?'':'s'}</span></div><span class="trial-row-status" data-screen="${esc(m.screen)}">${esc(status)}</span><span class="trial-row-arrow">${icon('arrow')}</span></a>`;
 }).join('');
 return `<div class="trial-home">${intro}${rows?`<div class="trial-format-list">${rows}</div>`:''}${trial.reviewPage?`<a class="trial-reading-link" href="${esc(href('/pages?file='+encodeURIComponent(trial.reviewPage.path)))}" data-route="${esc('/pages?file='+encodeURIComponent(trial.reviewPage.path))}">View your saved account reading ${icon('arrow')}</a>`:''}${state==='no-matches'&&format('talking-head')?link('Open Talking Head','/formats/talking-head','','arrow'):''}</div>`;
}
function trialSource(e) {
 if(!e)return '';
 return `<article class="trial-source">${e.video?`<video src="${esc(e.video.url)}" ${e.thumbnail?`poster="${esc(e.thumbnail.url)}"`:''} controls playsinline preload="metadata" aria-label="Original reel"></video>`:trialImage(e)}${e.name?`<p class="small">${esc(e.name)}</p>`:''}${e.permalink?`<a class="small" href="${esc(e.permalink)}" target="_blank" rel="noreferrer">View on Instagram ↗</a>`:''}</article>`;
}
function trialInputs(model) {
 const d=trialInputDraft(model.id),jobs=trialUploads.get(model.id)||[];
 const requests=`<div class="trial-needs">${model.needs.map(n=>`<section class="trial-need"><div class="trial-need-title"><h3>${esc(n.what)}</h3></div>${n.example?`<p class="small">${esc(n.example)}</p>`:''}${n.without?`<p class="small">${esc(n.without)}</p>`:''}<div class="trial-source-grid">${n.references.map(trialSource).join('')}</div></section>`).join('')}</div>`;
 const files=(model.inputs||[]).map(i=>`<div class="trial-input-file"><div>${icon(i.kind==='drive'?'folder':'file')}<div>${i.kind==='drive'?`<a href="${esc(i.url)}" target="_blank" rel="noreferrer">${esc(i.name)}</a>`:esc(i.name)}<span class="tiny">${esc(i.status)}${i.bytes?` · ${trialBytes(i.bytes)}`:''}</span></div></div><button class="btn ghost small-btn" data-trial-remove="${esc(i.id)}" data-model="${esc(model.id)}" ${i.mediaId?`data-media="${esc(i.mediaId)}"`:''} aria-label="Remove ${esc(i.name)}">Remove</button></div>`).join('');
 const upload=preview?`<div class="trial-live-link"><p class="small">Uploads save into your folder in the working app.</p>${window.KEYFRAMES_PREVIEW.workspaceUrl?`<a class="btn primary" href="${esc(window.KEYFRAMES_PREVIEW.workspaceUrl)}/formats/trial-reels" target="_blank" rel="noopener">Open working app ↗</a>`:promptBox('Open my local Keyframes workspace so I can upload my originals.')}</div>`:`<div class="trial-upload-controls">${model.needs.length>1?`<label class="field"><span>Adding files for</span><select data-trial-need="${esc(model.id)}"><option value="">All inputs together</option>${model.needs.map(n=>`<option value="${esc(n.id)}" ${d.need===n.id?'selected':''}>${esc(n.what)}</option>`).join('')}</select></label>`:''}<div class="trial-drop" data-trial-drop="${esc(model.id)}"><span>${icon('upload')}Drop your files here</span><div><label class="btn small-btn">Choose files<input type="file" multiple data-trial-upload="${esc(model.id)}" aria-label="Upload files"></label><label class="btn ghost small-btn">Choose folder<input type="file" multiple webkitdirectory data-trial-upload="${esc(model.id)}" aria-label="Upload a folder"></label></div></div><details class="trial-drive" data-trial-detail="drive"><summary>Use a Google Drive folder</summary><div class="trial-drive-field"><label class="field"><span>Drive folder link</span><input type="url" data-trial-drive="${esc(model.id)}" value="${esc(d.drive)}" placeholder="https://drive.google.com/drive/folders/…"></label><button class="btn" data-trial-save-drive="${esc(model.id)}">Add folder</button></div></details></div>`;
 return `<section class="trial-inputs" data-trial-model="${esc(model.id)}">${heading('1) Add your input',model.without)}${requests}${files?`<div class="trial-input-files">${files}</div>`:''}${upload}<div class="trial-transfers" data-transfers="${esc(model.id)}" role="status" aria-live="polite">${trialTransferRows(jobs)}</div><p class="inline-alert" data-trial-error="${esc(model.id)}" role="alert">${esc(d.error)}</p>${model.removed?.length?`<details class="trial-more" data-trial-detail="removed"><summary>Removed inputs</summary>${model.removed.map(i=>`<div class="trial-input-file"><span>${esc(i.name)}</span><button class="btn ghost small-btn" data-trial-restore="${esc(i.id)}" data-model="${esc(model.id)}">Restore</button></div>`).join('')}</details>`:''}${d.more?`<button class="btn primary" data-trial-ready="${esc(model.id)}">Done</button>`:''}</section>`;
}
function trialCaption(model,item,{source=false}={}) {
 const text=item?.caption?.text;
 if(!text)return source?'':'<span class="trial-caption-pending">Caption pending</span>';
 const key=source?item.id:item.path;
 return `<details class="trial-caption" data-trial-detail="caption:${source?'source:':''}${esc(key)}"><summary>${source?'Original caption':'Caption'} ${icon('back')}</summary><p>${esc(text)}</p><button class="btn ghost small-btn" data-trial-caption="${esc(key)}" data-model="${esc(model.id)}" ${source?'data-source="true"':''}>${icon('copy')}Copy caption</button></details>`;
}
function trialVariation(model,o,index) {
 const posted=!!o.posted;
 return `<article class="trial-video-card output-card" data-output="${esc(o.path)}" data-posted="${posted}"><video src="${esc(o.url)}" ${o.cover?.url?`poster="${esc(o.cover.url)}"`:''} controls playsinline preload="${o.cover?.url?'none':'metadata'}" aria-label="Variation ${index}"></video><div class="trial-video-info"><div class="trial-video-title"><h3>Variation ${index}</h3><a href="${esc(o.url)}" download class="trial-download" aria-label="Download variation ${index}" title="Download">${icon('download')}</a></div>${trialCaption(model,o)}${o.projectId&&!preview?editLink(o.editId||o.projectId,'Edit','small-btn output-edit'):''}<label class="trial-post-control" data-saved="${posted}"><input type="checkbox" data-trial-posted="${esc(o.path)}" data-model="${esc(model.id)}" aria-label="Posted: variation ${index}" ${posted?'checked':''} ${preview&&!window.KEYFRAMES_PREVIEW.changeTrial?'disabled':''}><span>${posted?'Posted':'Mark as posted'}</span><span class="trial-post-saving" aria-hidden="true">Saving…</span></label></div></article>`;
}
function trialOriginalLink(source) {
 return source?.permalink?`<a class="trial-original-link" href="${esc(source.permalink)}" target="_blank" rel="noreferrer">Variations of <span>${esc(source.name||'your Instagram reel')}</span> ↗</a>`:'';
}
function trialOutputGroups(model,posted) {
 return model.outputGroups.map(g=>{
  const outputs=g.outputs.filter(o=>o.posted===posted);if(!outputs.length)return '';
  const linked=model.kind==='montage';
  const source=linked?`<header class="trial-group-heading">${trialOriginalLink(g.source)}</header>`:`<aside class="trial-output-source">${trialImage(g.source)}${trialOriginalLink(g.source)}</aside>`;
  return `<section class="trial-output-group ${linked?'trial-output-group--linked':''} ${g.outputs.length>4?'trial-output-group--wide':''}">${source}<div class="trial-variations">${outputs.map(o=>trialVariation(model,o,g.outputs.indexOf(o)+1)).join('')}</div></section>`;
 }).join('');
}
function trialBacklog(model) {
 const remaining=model.uncreated||[];if(!remaining.length)return '<p class="small" role="status">Every known reel already has a variation.</p>';
 const d=trialInputDraft(model.id),selected=new Set(d.queued||[]),count=remaining.filter(e=>selected.has(e.id)).length,n=model.variationTarget||4;
 return `<section class="trial-backlog trial-backlog-tab" aria-label="Reels without variations"><p class="small">Select the reels you want to make variations of.</p><div class="trial-backlog-list">${remaining.map(e=>`<div class="trial-backlog-row"><label><input type="checkbox" data-trial-queue="${esc(e.id)}" data-model="${esc(model.id)}" aria-label="Select ${esc(e.name||'reel')}" ${selected.has(e.id)?'checked':''}>${trialImage(e)}<span>${esc(e.name||'Your reel')}</span></label>${e.permalink?`<a href="${esc(e.permalink)}" target="_blank" rel="noreferrer" aria-label="Original on Instagram">↗</a>`:''}</div>`).join('')}</div><div class="trial-backlog-footer"><span>${count?`${count} reels × ${n} variations`:'Select reels for your next batch.'}</span><button class="btn trial-primary" data-trial-queue-copy="${esc(model.id)}" ${count?'':'disabled'}>${icon('copy')}Copy prompt${count?` · ${count*n} videos`:''}</button></div></section>`;
}
function trialOutputPage(f,model) {
 const requested=searchParams().get('tab'),tab=['output','uncreated','posted'].includes(requested)?requested:'uncreated';
 const tabs=[['output','Output',model.variationCount-model.postedCount],['uncreated','Not Yet Trialed',(model.uncreated||[]).length],['posted','Posted',model.postedCount]];
 const nav=`<nav class="os-tabs trial-output-tabs" aria-label="Trial reel views">${tabs.map(([key,label,count])=>{
  const path=base(f)+'/models/'+encodeURIComponent(model.id)+'?tab='+key;
  return `<a class="os-tab ${tab===key?'active':''}" href="${esc(href(path))}" data-route="${esc(path)}" ${tab===key?'aria-current="page"':''}>${label} <span class="trial-tab-count">${count}</span></a>`;
 }).join('')}</nav>`;
 const activeTask=(snapshot.tasks||[]).find(t=>t.status==='running'&&!t.stale&&(t.project&&model.projectIds.includes(t.project)||String(t.id).startsWith('trial-stack-')&&t.label==='Creating '+model.name));
 const groups=tab==='uncreated'?trialBacklog(model):trialOutputGroups(model,tab==='posted');
 const empty=tab==='posted'?'No variations marked as posted yet.':'Your unposted variations will appear here as they finish.';
 const resume=tab==='output'&&(model.canGenerate||model.approved)&&!model.complete?`<details class="trial-batch-resume" data-trial-detail="batch-resume"><summary>${model.batch?.remainingSources??model.posts} reels to finish <span>Continue in chat ${icon('arrow')}</span></summary>${promptBox('/trial-reels\nContinue the remaining variations for '+model.name+'. Use the saved batch request or test approval and matched originals. Make '+(model.variationTarget||4)+' per selected reel, counting any finished variations, each with a lightly rephrased source caption. Keep finished renders and add any missing captions. Resume unfinished work and show what is missing if an original is unavailable.')}</details>`:'';
 return `<div class="trial-detail trial-output-section">${nav}${trialTaskView(activeTask)}<p class="inline-alert" data-trial-error="${esc(model.id)}" role="alert">${esc(trialInputDraft(model.id).error)}</p><section aria-label="${tabs.find(([key])=>key===tab)[1]}" data-trial-view="${tab}">${groups||`<p class="small" role="status">${empty}</p>`}${resume}</section></div>`;
}
function trialDetail(f,id=null) {
 const models=snapshot.trial?.formats||[];
 if(!id||waiting(f)||!models.length)return trialHome(f);
 const model=models.find(m=>m.id===id);if(!model)return trialHome(f);
 const d=trialInputDraft(id);
 if(d.roundId!==model.roundId){d.roundId=model.roundId;d.more=false;d.need='';d.error='';}
 if(d.adding)return `<div class="trial-detail">${heading('Add your reels','Paste your Instagram reel links, one per line.')}<label class="field"><span class="sr-only">Instagram reel links</span><textarea data-trial-links="${esc(id)}" rows="5" placeholder="https://www.instagram.com/reel/…">${esc(d.links||'')}</textarea></label><p class="inline-alert" data-trial-error="${esc(id)}" role="alert">${esc(d.error)}</p><div class="flow-footer"><button class="btn ghost" data-trial-cancel="${esc(id)}">Cancel</button><button class="btn primary" data-trial-request="${esc(id)}">Add reels</button></div></div>`;
 const uploading=(trialUploads.get(id)||[]).some(j=>j.roundId===model.roundId&&j.status!=='done');
 if(model.screen==='inputs'||d.more||uploading)return `<div class="trial-detail">${trialInputs(model)}</div>`;
 if(model.screen==='study'){
  const task=(snapshot.tasks||[]).find(t=>t.status!=='done'&&(t.project&&model.projectIds.includes(t.project)||t.id===model.studyTaskId||t.id==='trial-study'&&String(t.label).includes(model.name)));
  return `<div class="trial-detail trial-single-job">${heading(model.title)}${trialTaskView(task)}${!task||task.stale||task.status!=='running'?promptBox(model.studied?model.prompt+'\nThe study is saved. Continue from it and make the test.':model.prompt):''}${!model.studied?`<button class="btn ghost small-btn" data-trial-more="${esc(id)}">Add or remove input</button>`:''}</div>`;
 }
 if(model.screen==='test'){
  const first=snapshot.projects.find(p=>p.id===model.firstProjectId),test=model.outputGroups.flatMap(g=>g.outputs).find(o=>o.projectId===model.firstProjectId)||first?.files?.find(o=>o.kind==='video');
  const original=model.examples.find(e=>e.id===first?.data?.source_post)||model.examples[0];
  const originalVideo=original?.video?`<video src="${esc(original.video.url)}" ${original.thumbnail?`poster="${esc(original.thumbnail.url)}"`:''} controls playsinline preload="metadata" aria-label="Original reel"></video>`:trialImage(original);
  const trialVideo=test?`<video src="${esc(test.url)}" ${test.cover?.url?`poster="${esc(test.cover.url)}"`:''} controls playsinline preload="metadata" aria-label="Test trial reel"></video>`:'<div class="trial-test-pending">Your test will appear here.</div>';
  return `<div class="trial-detail trial-test-page">${heading('Test Trial Reel')}<div class="trial-test"><figure class="trial-test-original"><figcaption>${original?.permalink?`<a href="${esc(original.permalink)}" target="_blank" rel="noreferrer">Original ↗</a>`:'Original'}</figcaption>${originalVideo}${trialCaption(model,original,{source:true})}</figure><span class="trial-test-arrow" aria-hidden="true">${icon('arrow')}</span><figure class="trial-test-result"><figcaption>Trial reel</figcaption>${trialVideo}${trialCaption(model,test)}</figure></div><div class="trial-test-handoff">${promptBox(model.testPrompt)}</div><p class="inline-alert" data-trial-error="${esc(id)}" role="alert">${esc(d.error)}</p></div>`;
 }
 return trialOutputPage(f,model);
}
function trialBytes(bytes){return bytes<1e6?`${Math.max(1,Math.round(bytes/1e3))} KB`:`${(bytes/1e6).toFixed(bytes<1e7?1:0)} MB`;}
function trialTransferRows(jobs){return jobs.filter(j=>j.status!=='done').map(j=>`<div class="trial-transfer"><div><span>${esc(j.name)}</span><span class="tiny">${j.status==='error'?esc(j.error):j.status==='saving'?'Saving…':`${Math.round(j.progress||0)}%`}</span></div>${j.status==='uploading'?`<progress max="100" value="${j.progress||0}" aria-label="Uploading ${esc(j.name)}"></progress>`:''}${j.status==='error'?`<button class="btn ghost small-btn" data-trial-retry="${j.id}" data-model="${esc(j.modelId)}">Retry</button>`:''}</div>`).join('');}
function trialTransfersUpdate(id){const host=document.querySelector(`[data-transfers="${CSS.escape(id)}"]`);if(host)host.innerHTML=trialTransferRows(trialUploads.get(id)||[]);}
async function trialChange(body) {
 if(preview){if(window.KEYFRAMES_PREVIEW.changeTrial)return window.KEYFRAMES_PREVIEW.changeTrial(body);throw Error('This is the preview. Add files in your installed workspace.');}
 const response=await fetch('/api/trial-inputs',{method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'inputs'},body:JSON.stringify(body)});
 const value=await response.json();if(!response.ok)throw Error(value.error||'Could not save this input.');return value;
}
function trialInputError(id,message){trialInputDraft(id).error=message;const el=document.querySelector(`[data-trial-error="${CSS.escape(id)}"]`);if(el)el.textContent=message;persist();}
async function trialSend(job) {
 job.status='uploading';job.progress=0;trialTransfersUpdate(job.modelId);
 try {
  if(preview){if(window.KEYFRAMES_PREVIEW.changeTrial)return window.KEYFRAMES_PREVIEW.changeTrial(body);throw Error('This is the preview. Add files in your installed workspace.');}
  await new Promise((accept,reject)=>{
   const xhr=new XMLHttpRequest(),params=new URLSearchParams({format:job.modelId,need:job.needId,name:job.name,round:job.roundId||''});
   xhr.open('PUT','/api/trial-inputs?'+params);xhr.setRequestHeader('X-Keyframes-Write','inputs');
   xhr.upload.onprogress=e=>{if(e.lengthComputable){job.progress=e.loaded/e.total*100;if(e.loaded===e.total)job.status='saving';trialTransfersUpdate(job.modelId);}};
   xhr.onload=()=>{let value;try{value=JSON.parse(xhr.responseText);}catch{}if(xhr.status>=200&&xhr.status<300)accept(value);else reject(Error(value?.error||'Upload failed. Retry this file.'));};
   xhr.onerror=()=>reject(Error('Connection lost. Retry this file.'));xhr.onabort=()=>reject(Error('Upload stopped. Retry this file.'));xhr.send(job.file);
  });
  job.status='done';job.file=null;await client.refresh();
 } catch(error){job.status='error';job.error=error.message;}
 trialTransfersUpdate(job.modelId);
}
async function trialAddFiles(id,files) {
 const model=snapshot.trial.formats.find(m=>m.id===id);if(!model)return;
 const needId=trialInputDraft(id).need||(model.needs.length===1?model.needs[0].id:'');
 const jobs=Array.from(files).map(file=>({id:crypto.randomUUID(),modelId:id,needId,roundId:model.roundId,file:file.file||file,name:file.relativePath||file.webkitRelativePath||file.name,status:'queued'}));
 trialUploads.set(id,[...(trialUploads.get(id)||[]),...jobs]);trialTransfersUpdate(id);
 // Stream two files at a time. A folder never has to fit in browser or server memory.
 let next=0;await Promise.all([0,1].map(async()=>{while(next<jobs.length)await trialSend(jobs[next++]);}));
 trialInputDraft(id).more=false;render(true);
}
async function trialDropFiles(items) {
 async function walk(entry,prefix='') {
  if(entry.isFile)return [await new Promise((accept,reject)=>entry.file(file=>accept({file,relativePath:prefix+file.name}),reject))];
  if(!entry.isDirectory)return [];
  const reader=entry.createReader(),children=[];let batch;
  do{batch=await new Promise((accept,reject)=>reader.readEntries(accept,reject));children.push(...batch);}while(batch.length);
  const results=[];for(const child of children)results.push(...await walk(child,prefix+entry.name+'/'));return results;
 }
 const entries=Array.from(items).map(i=>i.webkitGetAsEntry?.()).filter(Boolean),files=[];
 for(const entry of entries)files.push(...await walk(entry));return files;
}
function promptBox(text) {return `<pre class="prompt-box" id="prompt-text">${esc(text)}</pre>${button('Copy prompt','copy-prompt','primary','copy')}<p class="helper-note">Paste into the chat open in your Keyframes folder.</p>`;}
function footagePrompt(d) {
 return (d.files||[]).map(file=>file.path?`Use ${JSON.stringify(file.path)}.`:`I am attaching ${JSON.stringify(file.name)}. Place it in workspace/input before starting.`).join('\n');
}
function makePrompt(f,mode='new') {
 const d=draft(f.id), isSetup=mode==='setup';
 if(f.id==='beat-montage')return mode==='new'?`Make ${Number(d.quantity)||1} beat montage${Number(d.quantity)>1?'s':''}${d.montageId?' using my saved montage '+d.montageId:''}.`:'Analyse my Beat Montage clips.';
 if(mode==='material')return [f.command,footagePrompt(d),((d.files||[]).length?'Add these originals to my saved '+f.name+' library.':'Check the existing footage in my '+f.name+' library.')+' Keep my existing setup and look. Complete intake'+(f.id==='phone'?' and measure text placement for each shot':'')+', then show the next action in my workspace.'].filter(Boolean).join('\n\n');
 let lines=[f.command+(isSetup?' setup':''),footagePrompt(d)];
 if(f.pack==='quick-cuts')lines.push('Read my shared context/answers.json, profile.md and voice.md first. Reuse my saved audience and what they need help with across every format. Ask only what is still unknown, one short question at a time. Save new shared answers in context/answers.json and update profile.md; keep only the look and footage choices in this format’s setup. Never repeat an answered context question.');
 if(f.id==='talking-head'&&f.style&&f.style!=='classic'&&!isSetup)return ['/'+talkingStyleSkill(f),footagePrompt(d),d.transcribe?'Transcribe the raw footage.':`Transcript:\n${d.transcript||''}`,splitVideoInstructions(talkingStyleSkill(f),f.style==='split'?null:f.style),'Show progress and the next review in my Keyframes workspace. Never post anything.'].filter(Boolean).join('\n\n');
 if(f.id==='talking-head') {
  lines.push('Use my saved Talking Head look and preferences, or the default look if none is saved. Do not ask me to choose a look.');
  if(!isSetup)lines.push(d.transcribe?'Transcribe the raw footage.':`Transcript:\n${d.transcript||''}`,talkingVideoInstructions());
 } else if(isSetup) {
  const allowed=f.id==='beat-montage'?['subject','sounds','own_sounds','preset','layout','line_style']:f.id==='scroll-reel'?['shot','opening','face','accent','feel','cta','keyword','sounds']:['shots','placement','shape','cta','keyword','sounds'];
  const answers=Object.fromEntries(Object.entries(d).filter(([k,v])=>allowed.includes(k)&&v!==''&&v!=null));
  lines.push(`My setup choices: ${JSON.stringify(answers,null,2)}`,`Keep these in the ${f.id} setup in workspace/library/quick-cuts.json. Use any footage already in my library. Check missing inputs and show the next step here. Do not repeat choices I already answered.`,f.id==='phone'?'Measure text placement from each shot and keep it off my face.':'');
 } else {
  if(f.id==='trial-reels'&&d.source)lines.push('Vary the saved source '+JSON.stringify(d.source)+'.');
  lines.push(`Make ${Number(d.quantity)||1} ${f.name.toLowerCase()}${Number(d.quantity)>1?'s':''} using my saved setup and preferences.`,d.topic?`Brief: ${d.topic}`:f.id==='beat-montage'?'Reuse my saved footage and sounds.':f.id==='trial-reels'?'Use my saved source selection and matching originals.':'Choose the topic from my account context.',f.id==='trial-reels'?'Use unedited originals and show the first variation before making the rest.':'Show the first version for my review.');
 }
 if(!snapshot.account.done&&f.id!=='trial-reels')lines.push('My account reading may still be running. Continue the work that these inputs support; ask for a short brief only if a writing decision needs it.');
 lines.push('Show progress and the next review in my Keyframes workspace. Never post anything.');
 return lines.filter(Boolean).join('\n\n');
}
function handoff(f,setup=false,material=false) {
 return `<div class="center-flow">${f.id==='talking-head'&&!setup?progress(f,'prompt',!setupDone(f)):''}<div class="handoff-icon">${icon('agent')}</div>${heading(setup?'Your choices, ready to save.':'Your prompt is ready.','Copy it. Paste it into chat.')}<div class="sample-banner">${icon(labels[f.id]?.[0])}${esc(f.name)}</div>${!(f.id==='talking-head'&&setup)&&(draft(f.id).files||[]).some(x=>!x.path)?'<p class="small">Attach the selected footage with your prompt.</p>':''}${promptBox(makePrompt(f,material?'material':setup?'setup':'new'))}<div class="flow-footer">${link('Back to '+f.name,base(f),'ghost')}</div></div>`;
}
// Every Markdown surface uses the same file editor and the same revision check.
const documentKey = path => 'pref:'+path;
function knownDocument(path){return documents.get(path)||snapshot.preferences.find(p=>p.path===path)||snapshot.contextDocuments?.find(p=>p.path===path);}
function documentState(path){
 const saved=knownDocument(path),key=documentKey(path);
 if(!saved)return null;
 drafts[key]??={text:saved.text||'',base:saved.text||'',revision:saved.revision,editing:false};
 const d=drafts[key];
 if(d.revision===undefined&&d.base===saved.text)d.revision=saved.revision;
 if(!d.editing&&!d.saving&&d.text===d.base){d.text=saved.text;d.base=saved.text;d.revision=saved.revision;}
 return d;
}
function activeDocumentPath(){
 if(view?.kind==='preferences')return view.f?.preferencesPath||'context/preferences.md';
 if(['markdown','reading'].includes(view?.kind))return searchParams().get('file');
 return null;
}
function mergeDocument(doc){
 documents.set(doc.path,doc);
 const d=drafts[documentKey(doc.path)];
 if(d&&!d.saving){
  if(d.text===doc.text||(!d.editing&&d.text===d.base)){
   d.text=doc.text;d.base=doc.text;d.revision=doc.revision;d.conflict=null;d.error='';
  }else if(d.base===doc.text&&(d.revision===undefined||d.revision===doc.revision)){
   d.revision=doc.revision;d.conflict=null;
  }else if(d.revision!==doc.revision){d.conflict=doc;}
 }
}
async function readDocument(path,{force=false}={}){
 if(documentRequests.has(path))return documentRequests.get(path);
 const epoch=documentEpochs.get(path)||0,workspace=snapshot.workspaceId;
 const promise=(async()=>{
  try{
   const doc=preview?await window.KEYFRAMES_PREVIEW.readMarkdown(path):await fetch('/api/markdown?path='+encodeURIComponent(path),{cache:'no-store',signal:AbortSignal.timeout(10000)}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Could not read this file.');return body;});
   if(snapshot.workspaceId!==workspace||(documentEpochs.get(path)||0)!==epoch)return;
   if(drafts[documentKey(path)]?.saving)return;
   mergeDocument(doc);
   if(activeDocumentPath()===path){const d=documentState(path);if(d?.editing)updateDocumentStatus(path);else{const y=scrollY;render();scrollTo(0,y);}}
  }catch(e){
   if(snapshot.workspaceId!==workspace)return;
   const d=drafts[documentKey(path)];
   if(d){d.error='Could not read this file. Your draft is kept.';updateDocumentStatus(path);}
   else if(activeDocumentPath()===path){const target=$('#document-loading');if(target)target.innerHTML=`<p class="inline-alert">${esc(e.message)}</p>${button('Try again','retry-document','')}`;}
  }
 })();
 documentRequests.set(path,promise);
 try{await promise;}finally{if(documentRequests.get(path)===promise)documentRequests.delete(path);}
}
function editorStatus(d){
 if(d.saving)return 'Saving…';
 if(d.error)return d.error;
 if(d.conflict)return 'This file changed elsewhere. Your draft is kept.';
 if(d.text!==d.base)return 'Unsaved changes';
 if(d.revision==null)return 'Not saved yet';
 return preview?'Saved in this preview':'Saved to your folder';
}
function updateDocumentStatus(path){
 if(activeDocumentPath()!==path)return;
 const d=documentState(path);if(!d)return;
 const status=$('#document-status');if(status){status.textContent=editorStatus(d);status.classList.toggle('inline-alert',Boolean(d.error||d.conflict));}
 const save=$('[data-action="save-document"]');if(save){save.disabled=Boolean(d.saving);save.textContent=d.saving?'Saving…':d.conflict?'Save my version':'Save';}
 const conflict=$('#document-conflict');
 if(conflict){conflict.hidden=!d.conflict;const latest=conflict.querySelector('pre');if(latest)latest.textContent=d.conflict?.text||'';}
}
function preferenceSyncNotice(owner){return owner?.preferencesSync?.changed?`<div class="sample-banner"><span>Your file is saved. Apply its look changes for future videos.</span>${button('Copy update prompt','sync-preferences:'+owner.id,'small-btn','copy')}</div>`:'';}
function documentEditor(path,{title,subtitle='A file you own.',back='',extras=''}={}){
 const saved=knownDocument(path);
 if(!saved){queueMicrotask(()=>readDocument(path));return heading(title||path.split('/').pop(),subtitle,back)+`<div id="document-loading"><div class="skeleton"></div><p class="tiny">Opening your file…</p></div>`;}
 if(!documents.has(path))documents.set(path,saved);
 const d=documentState(path),key=documentKey(path);
 const owner=snapshot.formats.find(f=>f.preferencesPath===path);
 const syncNotice=`<div id="document-look-sync">${preferenceSyncNotice(owner)}</div>`;
 return syncNotice+heading(title||saved.name||path.split('/').pop(),subtitle,button(d.editing?'Read file':'Edit file','toggle-pref','','settings'))+`<p class="file-path">${esc(path)}</p>${d.editing?`<label class="field" style="margin-top:25px"><span>Your text</span><textarea id="preference-editor" data-pref="${esc(key)}" rows="15" placeholder="Write what matters to you.">${esc(d.text)}</textarea></label><div class="button-row">${button(d.conflict?'Save my version':'Save','save-document','primary','check')}${button('Use saved file','reset-pref','ghost')}${button('Download file','download-pref','ghost')}</div><p class="helper-note" id="document-status" role="status">${esc(editorStatus(d))}</p><details id="document-conflict" ${d.conflict?'':'hidden'}><summary>Compare with the saved file</summary><pre class="readable-file">${esc(d.conflict?.text||'')}</pre></details>`:`${saved.text?`<pre class="readable-file">${esc(saved.text)}</pre>`:empty('A fresh page','Add what matters to you.')}<div class="button-row">${button('Edit file','toggle-pref','','settings')}${button('Download file','download-pref','ghost')}</div>`}${back?`<div class="flow-footer">${back}</div>`:''}${extras}`;
}
function preferences(f){
 const path=f?.preferencesPath||'context/preferences.md';
 const extras=(f?.preferencesPath==='workspace/library/quick-cuts.preferences.md'?'<p class="helper-note">Shared by your Quick Cuts formats. Name the format when a preference is specific.</p>':'')+(!f?`<div class="section-title" style="margin-top:45px">Format preferences</div>${snapshot.formats.map(x=>`<div class="file-row">${icon(labels[x.id]?.[0])}<div>${esc(x.name)}</div>${link('Read file',base(x)+'/preferences','small-btn')}</div>`).join('')}`:'');
 return documentEditor(path,{title:f?f.name+' preferences':'Your preferences',subtitle:'Your taste, in a file you own.',extras});
}
async function saveDocument(){
 const path=activeDocumentPath(),d=documentState(path);if(!d||d.saving)return;
 // A second click after comparing a conflict explicitly saves this version.
 const revision=d.conflict?d.conflict.revision:d.revision;
 if(revision===undefined){await readDocument(path,{force:true});updateDocumentStatus(path);return;}
 const text=d.text,workspace=snapshot.workspaceId;
 d.saving=true;d.error='';documentEpochs.set(path,(documentEpochs.get(path)||0)+1);updateDocumentStatus(path);
 try{
  let doc;
  if(preview)doc=await window.KEYFRAMES_PREVIEW.saveMarkdown({path,text,revision});
  else{
   const response=await fetch('/api/markdown',{method:'PUT',headers:{'Content-Type':'application/json','X-Keyframes-Write':'markdown'},body:JSON.stringify({path,text,revision}),signal:AbortSignal.timeout(15000)});
   const body=await response.json();
   if(response.status===409){d.conflict=body.document;throw Error('This file changed elsewhere. Compare the saved file, then save your version.');}
   if(!response.ok)throw Error(body.error||'Could not save. Your draft is kept.');
   doc=body;
  }
  if(snapshot.workspaceId!==workspace)return;
  documents.set(path,doc);d.base=doc.text;d.revision=doc.revision;d.conflict=null;d.error='';
  // Typing during a save belongs to the next save; do not replace the editor node.
  persist();toast(preview?'Saved in this preview.':'Saved to your folder.');
  if(client.pending)await client.pending;
  await client.refresh();
 }catch(e){if(snapshot.workspaceId===workspace)d.error=['TypeError','AbortError','TimeoutError'].includes(e.name)?'Could not reach your folder. Your draft is kept.':e.message||'Could not save. Your draft is kept.';}
 finally{d.saving=false;if(snapshot.workspaceId===workspace){persist();updateDocumentStatus(path);if(activeDocumentPath()===path&&!d.editing)render();}}
}
function fileRows(files) {return files.map(file=>`<div class="file-row">${icon(['page','markdown'].includes(file.kind)?'file':'folder')}<div>${esc(file.name)}<span class="tiny">${esc(file.path)}</span></div>${file.kind==='page'?link('Open','/pages?file='+encodeURIComponent(file.path),'small-btn'):link('View','/files?file='+encodeURIComponent(file.path),'small-btn')}</div>`).join('');}
function searchParams() {const path=dataPath();return preview&&location.protocol==='file:'?new URLSearchParams(path.split('?')[1]||''):new URLSearchParams(location.search);}
function fileFormat() {
 const path=searchParams().get('file');if(!path)return null;
 const id=searchParams().get('format')||snapshot.files.find(f=>f.path===path)?.format||snapshot.projects.find(p=>path.startsWith(p.path+'/'))?.format||snapshot.formats.find(f=>f.preferencesPath===path)?.id;
 return format(id);
}
const editClipButton = (file, text='Edit') => `<span class="edit-entry">${button(text,'edit-clip:'+file.path,'small-btn','edit')}<span class="edit-phone tiny">Edit on a computer</span></span>`;
// The buyer's own clips, each one a new video in the editor in one click.
function clipShelf() {
 const clips=preview?[]:snapshot.files.filter(f=>f.kind==='video'&&f.path.startsWith('workspace/input/')).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,24);
 return clips.length?`<section class="clip-shelf"><div class="section-title">Your clips</div><p class="inline-alert" id="form-error" role="alert"></p><div class="output-grid">${clips.map(file=>`<article class="output-card"><video src="${esc(file.url)}" controls playsinline preload="metadata" aria-label="${esc(file.name)}"></video><a href="${esc(href('/files?file='+encodeURIComponent(file.path)))}" data-route="${esc('/files?file='+encodeURIComponent(file.path))}">${esc(file.name)}</a><span class="tiny">${esc(date(file.updatedAt))}</span>${editClipButton(file)}</article>`).join('')}</div></section>`:'';
}
function documentFiles() {return [...new Map([...(snapshot.markdownFiles||[]),...(snapshot.preferences||[])].map(file=>[file.path,file])).values()];}
function filesPage() {
 const chosen=searchParams().get('file');
 if(chosen&&/\.md$/i.test(chosen))return documentEditor(chosen,{back:link('All documents','/files','ghost')});
 if(chosen){const file=snapshot.files.find(f=>f.path===chosen);return heading(file?.name||'File unavailable','',link('All documents','/files','ghost'))+(file?`<div class="media-grid"><figure>${media(file)}<figcaption>${esc(file.path)}</figcaption></figure></div><div class="button-row"><a class="btn" href="${esc(file.url)}" download>Download file</a>${file.kind==='video'&&!preview?editClipButton(file,'Edit this clip'):''}</div><p class="inline-alert" id="form-error" role="alert"></p>`:empty('This file moved','Return to your files to find the latest version.'));}
 return heading('Your documents')+documentShelf(documentFiles(),{href,formats:snapshot.formats,query:drafts.documentQuery||''})+clipShelf();
}
function pageView() {
 const file=snapshot.files.find(f=>f.path===searchParams().get('file')&&f.kind==='page');
 return heading(file?.path==='workspace/trial-reels-review.html'?'Your saved account reading':file?.name||'Page unavailable','',file?.format==='trial-reels'?link('Back to formats','/formats/trial-reels','ghost','back'):link('Documents','/files','ghost'))+(file?`<iframe class="page-frame" src="${esc(file.url)}" title="${esc(file.name)}" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe><p class="helper-note">Review here. Send your choices back in chat.</p>`:empty('This page moved','Return to your format for its latest review.'));
}
function videoSteps(p) {
 if(p.format!=='talking-head')return '';
 if(!p.steps?.length)return `<aside class="video-checklist">${empty('Steps not recorded','Continue in chat to check this video’s progress.')}${button('Copy resume prompt','resume:'+p.id,'primary','copy')}</aside>`;
 const working=(snapshot.tasks||[]).some(task=>[p.id,p.path].includes(task.project)&&task.status==='running'&&!task.stale);
 return `<aside class="video-checklist"><div class="section-title">This video <span>${Number(p.progress?.completed)||0} / ${Number(p.progress?.total)||p.steps.length}</span></div><ol>${p.steps.map((step,i)=>`<li data-state="${esc(step.status)}" ${step.status==='current'?'aria-current="step"':''}><span class="step-marker">${step.status==='done'?icon('check'):i+1}</span><div><strong>${esc(step.label)}</strong><span class="tiny">${esc(step.status==='done'?'Done':step.status==='current'?step.owner==='you'?'You review':working?'Agent working':'Next for your agent':'Later')}</span>${step.status==='current'&&step.reason?`<p class="tiny">${esc(step.reason)}</p>`:''}</div></li>`).join('')}</ol>${finished(p)?'':button('Copy continue prompt','resume:'+p.id,'primary','copy')}</aside>`;
}
function projectView(id) {
 const p=snapshot.projects.find(x=>x.id===id);
 if(!p)return heading('Project unavailable')+link('Home','/','primary');
 if(p.format==='full-visual')return editBar(p)+fullVisualProject(p,format('full-visual'),draft('full-visual'),fvDraft(p.id),{esc,heading,button,link});
 if(p.format==='product-demo')return editBar(p)+productDemoProject(p,{esc,heading,link,button},snapshot.tasks);
 if(p.format==='edit')return editProjectView(p);
 const files=p.files||[];
 const featured=p.preview||null;
 const extras=files.filter(f=>['image','video'].includes(f.kind)&&f.path!==featured?.path);
 const visualPlan=p.format==='talking-head'&&(files.find(file=>file.path===p.path+'/visual-plan.md')||files.find(file=>file.path===p.path+'/plan.md'));
 return heading(p.name,'',`<div class="button-row">${visualPlan?link('Read visual plan','/files?file='+encodeURIComponent(visualPlan.path)+'&format=talking-head','','file'):''}${canEdit(p)?editLink(p.id,'Edit video',finished(p)?'primary':''):''}</div>`)+`<div class="video-workspace"><div class="video-review">${editExportNote(p)}${featured?`<figure class="video-feature">${media(featured)}</figure>`:empty('Your next preview is being prepared','Copy the next-step prompt to continue in chat.')+button('Copy next-step prompt','resume:'+p.id,'primary','copy')}${extras.length?`<details class="previous-media"><summary>Other saved files</summary><div class="media-grid">${extras.map(file=>`<figure>${media(file)}<figcaption>${esc(file.name)}</figcaption></figure>`).join('')}</div></details>`:''}${fileRows(files.filter(x=>x.kind==='page'))}<div class="button-row">${button('Copy review prompt','review:'+p.id,'','copy')}${button('Copy revision prompt','revision:'+p.id,'ghost','copy')}</div></div>${videoSteps(p)}</div>`;
}
// A video made by hand in the editor: no format, no steps. Its page holds what it exported and the way back in.
function editProjectView(p) {
 const outputs=snapshot.outputs.filter(o=>o.projectId===p.id);
 return heading(p.name,p.edit?.editedAt?'Edited '+date(p.edit.editedAt):'Your own video.',canEdit(p)?editLink(p.id,'Edit video','primary'):'')+editExportNote(p)+(outputs.length?`<section class="recent-outputs"><div class="section-title">Exported</div>${outputCards(outputs)}</section>`:empty('Nothing exported yet','Edit your video, then export it from the editor.'));
}
const shapes=[['9:16',1080,1920,'Reel'],['1:1',1080,1080,'Square'],['4:5',1080,1350,'Post'],['16:9',1920,1080,'Wide']];
function newVideoPage() {
 const d=drafts.newVideo||={name:'',shape:'9:16'};
 return `<div class="center-flow new-video">${heading('New video','Name it and pick a shape.')}<label class="field"><span>Name</span><input type="text" data-new-video="name" value="${esc(d.name)}" placeholder="My video" maxlength="80"></label><div class="shape-picker" role="radiogroup" aria-label="Shape">${shapes.map(([id,w,h,name])=>`<button type="button" class="shape-option" role="radio" aria-checked="${d.shape===id}" data-action="new-video-shape:${id}"><i style="width:${Math.round(64*w/Math.max(w,h))}px;height:${Math.round(64*h/Math.max(w,h))}px"></i><strong>${id}</strong><span class="tiny">${name}</span></button>`).join('')}</div><p class="inline-alert" id="form-error" role="alert">${esc(d.error||'')}</p><div class="edit-entry">${button(creatingEdit?'Opening':'Open the editor','new-video-create','primary','arrow')}<span class="edit-phone tiny">Edit on a computer</span></div></div>`;
}
// Both ways into a new edit go through the workspace, which makes the project folder and its empty timeline, or one
// holding the chosen clip. The editor then opens on it.
async function createEdit(body) {
 const response=await fetch('/api/edit/new',{method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'edit'},body:JSON.stringify(body)});
 const value=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(value.error||'This video could not be made.');
 const id=value.project?.id??value.id??value.project;
 if(typeof id!=='string')throw Error('This video could not be made.');
 location.href=editHref(id);
}
function accountOptions(){const q=searchParams();return {tab:['posts','notes'].includes(q.get('tab'))?q.get('tab'):'overview',range:['30','90','all'].includes(q.get('range'))?q.get('range'):'90',metric:['views','reach','saves','shares','comments','likes'].includes(q.get('metric'))?q.get('metric'):['views','likes','comments','reach'].find(key=>snapshot.account.posts?.some(p=>typeof p.metrics?.[key]==='number'&&Number.isFinite(p.metrics[key])))||'views',selected:drafts.accountSelectedPost};}
function evidenceUI(){return {esc,icon,link,button,date,heading,empty,href,preview};}
function accountPage(){return accountScreen(snapshot,evidenceUI(),accountOptions());}
function activityPage(){const q=searchParams();return activityScreen(snapshot,evidenceUI(),{filter:['attention','active','done'].includes(q.get('status'))?q.get('status'):'all',formatFilter:q.get('format')||'all',connected:lastStatus==='connected'});}
function accountRefresh(){return `<div class="account-page">${heading('Refresh your account','Bring your latest posts into the next video.',link('Back to account','/account','ghost'))}<div class="account-empty"><h2>Update what Keyframes knows</h2><p>Your agent reads your latest captions and a few previews, then updates the account notes you use in every format.</p></div><div class="account-prompt">${promptBox('/start\nRefresh my account.')}<p class="helper-note">Audience breakdowns, comment text and watch-time analysis need a separate reading. Missing metrics stay unreported.</p></div></div>`;}

function questionsPage(){
 const qs=snapshot.account.questions||[],d=drafts.accountAnswers||{};
 const q=qs.find(q=>q.id===drafts.accountQuestion)||qs[0],index=qs.indexOf(q);
 if(!q)return `<div class="center-flow">${heading('Nothing to answer','Your saved context is used by every format.')}${link('Back to Home','/','primary')}</div>`;
 return `<div class="center-flow">${heading(q.ask,'One answer, saved for every format.')}${qs.length>1?`<p class="tiny">${index+1} of ${qs.length}</p>`:''}${q.options?.length?`<div class="button-row" style="margin-bottom:20px">${q.options.slice(0,3).map((option,i)=>`<button class="btn ${d[q.id]===option?'primary':''}" data-action="answer-option:${i}" aria-pressed="${d[q.id]===option}">${esc(option)}</button>`).join('')}</div>`:''}<label class="field"><span>${q.options?.length?'Choose above, or write your answer':'Your answer'}</span><textarea rows="3" style="min-height:100px" data-question="${esc(q.id)}">${esc(d[q.id]||'')}</textarea></label><p class="inline-alert" id="form-error" role="alert"></p><div class="flow-footer">${index>0?button('Back','question-back','ghost'):link('Back','/setup','ghost')}${index<qs.length-1?button('Continue','question-next','primary','arrow'):button('Copy answers','copy-answers','primary','copy')}</div><p class="helper-note">${index<qs.length-1?'Your answers stay here as you continue.':'Paste your answers in chat. Your agent saves them for all formats.'}</p></div>`;
}
function contextLinks(){return (snapshot.contextDocuments||[]).length?`<div class="section-title" style="margin-top:32px">What your account tells us</div>${snapshot.contextDocuments.map(d=>`<div class="file-row">${icon('file')}<div>${esc(d.name)}</div>${link('Read','/account/reading?file='+encodeURIComponent(d.path),'small-btn')}</div>`).join('')}`:'';}
function contextPage(){const path=searchParams().get('file');if(!path)return heading('Your account reading')+contextLinks();return documentEditor(path,{title:snapshot.contextDocuments?.find(d=>d.path===path)?.name,back:link('Back to account','/account','ghost')});}
function readbackPage(){return `<div class="center-flow">${heading('Does this sound like you?','One last check before your account is set up.')}<div class="stage-list">${(snapshot.account.readback||[]).map(line=>`<div class="stage-line"><span>${esc(line)}</span></div>`).join('')}</div>${snapshot.account.readback?.length?button('Copy confirmation','confirm-account','primary','copy'):empty('Your account is being read','The read-back appears here when your agent has finished.')}<label class="field" style="margin-top:28px"><span>Anything to correct?</span><textarea id="account-correction" style="min-height:100px">${esc(drafts.accountCorrection||'')}</textarea></label>${button('Copy correction','correct-account','','copy')}${contextLinks()}</div>`;}

function listUI(){return {esc,icon,link,button,heading,empty,href,date,projectRows,outputCards,setupDone,navigate,copy,toast,persist,refresh:()=>client.refreshAfterWrite(),render:()=>{const y=scrollY;render(true);scrollTo(0,y);},params:searchParams(),preview,workspaceUrl:window.KEYFRAMES_PREVIEW?.workspaceUrl};}
function shotView(f,sub,project=null){const result=oneShotPage(f,snapshot,draft(f.id),sub,listUI(),project);return {f,sub,kind:'one-shot',shotPage:result.page,project:result.project,html:result.html};}
function listView(f,sub,project=null){const parent=draft(f.id),result=listReelPage(f,snapshot,parent,sub,listUI(),project);return {f,sub,kind:'list-reel',listPage:result.page,project:result.project,html:result.html};}

function resolveView() {
 const original=route().split('?')[0], path=snapshot.account.enabled===false&&original==='/'?original:onboardingRoute(original,snapshot.onboarding);
 if(path!==original)history.replaceState({scroll:0},'',href(path));
 if(/^\/onboarding(?:\/|$)/.test(path)||['/account/connect','/account/setup-prompt'].includes(path)){
  const entry=path.startsWith('/onboarding'),step=path.endsWith('/prompt')||path.endsWith('/setup-prompt')?'prompt':path.endsWith('/account')||path.endsWith('/connect')?'account':'welcome';
  return {kind:'onboarding',entry,step,html:onboardingView(step,snapshot,{esc,icon},entry)};
 }
 if(path==='/')return {kind:'home',html:home()};
 if(path==='/videos')return {kind:'videos',html:videoLibrary(snapshot,searchParams(),{esc,heading,link,outputCards,empty})};
 if(path==='/new-video')return {kind:'new-video',html:newVideoPage()};
 if(path==='/new'&&snapshot.formats.length===1&&snapshot.formats[0].id==='full-visual'){history.replaceState({scroll:0},'',href('/formats/full-visual/new'));const f=snapshot.formats[0];return {f,sub:'new',kind:'full-visual-new',html:fullVisualNew(draft(f.id),'new',{esc,heading,button,link})};}
 if(path==='/new')return {kind:'new-chooser',html:newChooser()};
 if(path==='/setup')return {kind:'account-setup',html:accountSetup()};
 if(path==='/setup/questions')return {kind:'questions',html:questionsPage()};
 if(path==='/setup/readback')return {kind:'readback',html:readbackPage()};
 if(path==='/account/refresh')return {kind:'account-refresh',html:accountRefresh()};
 if(path==='/account/reading')return {kind:'reading',html:contextPage()};
 if(path==='/files')return {f:fileFormat(),kind:/\.md$/i.test(searchParams().get('file')||'')?'markdown':'files',html:filesPage()};
 if(path==='/pages')return {f:fileFormat(),kind:'page',html:pageView()};
 if(path==='/preferences')return {kind:'preferences',html:preferences()};
 if(path==='/account')return {kind:'account',html:accountPage()};
 if(path==='/activity')return {kind:'activity',html:activityPage()};
 if(path.startsWith('/projects/')){const id=decodeURIComponent(path.slice(10)),p=snapshot.projects.find(p=>p.id===id);if(p?.format==='beat-montage'&&format('beat-montage')){const f=format('beat-montage'),sub='template/'+encodeURIComponent(p.beatMontage?.templateId||'square')+'/project/'+encodeURIComponent(p.id);return {kind:'beat-library',f,sub,html:editBar(p)+renderBeatLibrary(f,snapshot,sub,beatUI())};}if(p?.format==='phone'&&format('phone')){const shot=shotView(format('phone'),'project',p);return {...shot,html:editBar(p)+shot.html};}if(p?.format==='scroll-reel'&&format('scroll-reel')){const list=listView(format('scroll-reel'),'project',p);return {...list,html:editBar(p)+list.html};}return {kind:'project',f:format(p?.format),html:projectView(id)};}
 const match=path.match(/^\/formats\/([^/]+)(?:\/(.*))?$/);
 if(!match)return {kind:'unknown',html:heading('Page not found')+link('Home','/','primary')};
 const f=format(match[1]);
 if(!f)return {kind:'unknown',html:heading('This format isn’t installed.')+link('Home','/','primary')};
 const sub=match[2]||'', result={f,sub};
 if(sub==='preferences')return {...result,kind:'preferences',html:preferences(f)};
 if(f.id==='product-demo'&&['setup','setup/prompt','new','new/films','new/process','new/prompt'].includes(sub)){
  if(sub.startsWith('setup')||!productVoiceReady(f))return {...result,kind:sub==='setup/prompt'?'product-demo-voice-prompt':'product-demo-voice',html:productVoicePage(f,draft(f.id),{esc,heading,field,button,link},sub==='setup/prompt'?sub:'setup')};
  return {...result,kind:'product-demo-new',html:productDemoForm(draft(f.id),{esc,heading,field,button,link},sub,f)};
 }
 if(f.id==='full-visual'&&['new','new/prompt'].includes(sub))return {...result,kind:'full-visual-new',html:fullVisualNew(draft(f.id),sub,{esc,heading,button,link})};
 if(f.id==='scroll-reel')return listView(f,sub);
 if(f.id==='phone')return shotView(f,sub);
 if(f.id==='beat-montage')return {...result,kind:'beat-library',html:renderBeatLibrary(f,snapshot,sub,beatUI())};
 if(f.id==='talking-head'&&sub==='create')return {...result,kind:'talking-create',html:talkingCreatePage(f,draft(f.id),{esc,heading,button,link})};
 if(f.id==='talking-head'&&(sub==='style'||!f.style))return {...result,kind:'talking-style',html:talkingStylePage(f,{esc,heading,button,link})};
 if(!sub)return {...result,kind:'format',html:(f.id==='talking-head'?`<p class="th-style-current">Style: <strong>${esc(talkingStyleName(f))}</strong>${link('Change','/formats/talking-head/style','ghost small-btn')}</p>`:'')+detail(f)};
 if(f.id==='beat-montage'){
  if(sub==='craft')return {...result,kind:'beat-craft',html:beatCraftPage(f,beatDraft(),beatUI())};
  if(sub==='new'&&searchParams().get('montage'))draft(f.id).montageId=searchParams().get('montage');
  if(sub==='new'||sub==='new/prompt')return f.beatInputs?.ready?{...result,kind:'beat-new',html:beatNewPage(f,draft(f.id),beatUI())}:{...result,kind:'beat-inputs',html:beatInputsPage(f,snapshot,beatDraft(),beatUI())};
  if(['inputs','setup','setup/prompt','new/footage','material/prompt'].includes(sub))return {...result,kind:'beat-inputs',html:beatInputsPage(f,snapshot,beatDraft(),beatUI())};
 }
 if(f.id==='trial-reels' && (sub==='setup'||sub==='new'||sub.startsWith('models/')))return {...result,kind:'trial-format',html:trialDetail(f,sub.startsWith('models/')?decodeURIComponent(sub.slice(7)):null)};
 if(waiting(f))return {...result,kind:'waiting',html:heading('Your account comes first.','Trial Reels uses the formats that worked for you.')+tasksHTML(true)+link('View account setup','/setup','primary')};
 if(f.id==='talking-head'){
  if(sub==='new' || sub==='new/footage' || sub==='setup/footage' || sub==='setup'&&!setupDone(f)&&!selectedMedia(draft(f.id))&&!inputFiles(f).length)return {...result,kind:'footage',html:footage(f,!setupDone(f))};
  if(['setup','setup/look','look','captions'].includes(sub))return {...result,kind:'talking-captions',html:talkingCaptionsPage(f,draft(f.id),{esc,heading,button,link})};
  if(sub==='new/transcript')return {...result,kind:'transcript',html:transcript(f)};
  if(sub==='new/prompt'||sub==='setup/prompt')return {...result,kind:'prompt',html:handoff(f,sub==='setup/prompt')};
 }else{
  if(sub==='material/prompt')return {...result,kind:'prompt',html:handoff(f,false,true)};
  if(sub==='setup/prompt')return {...result,kind:'prompt',html:handoff(f,true)};
  if(sub==='new/prompt')return {...result,kind:'prompt',html:handoff(f)};
  if(sub==='setup'||sub==='new'&&!setupDone(f))return {...result,kind:'quick-setup',html:f.id==='trial-reels'?trialDetail(f):quickSetup(f)};
  if(sub==='new/footage')return {...result,kind:'footage',html:footage(f)};
  if(sub==='new'&&f.materialKnown&&!f.materialReady)return {...result,kind:'footage',html:footage(f)};
  if(sub==='new')return {...result,kind:'quick-new',html:quickNew(f)};
 }
 return {...result,kind:'unknown',html:heading('Page not found')+link('Back to '+f.name,base(f),'primary')};
}
function render(preserveMedia=false) {
 if(!snapshot)return;
 registerPromptSkills(snapshot.formats);
 const shotFocus=preserveMedia&&document.activeElement?.dataset.shotField?{field:document.activeElement.dataset.shotField,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 const shotDetails=preserveMedia?Array.from(document.querySelectorAll('[data-shot-detail][open]'),el=>el.dataset.shotDetail):[];
 const listFocus=preserveMedia&&document.activeElement?.closest('.lr')?{field:document.activeElement.dataset.listField,card:document.activeElement.dataset.listCard,cardField:document.activeElement.dataset.cardField,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 const listDetails=preserveMedia?Array.from(document.querySelectorAll('[data-list-detail][open]'),el=>el.dataset.listDetail):[];
 listController?.destroy();listController=null;oneShotController?.destroy();oneShotController=null;
 documentMotion?.destroy();documentMotion=null;
 look?.destroy();look=null;
 if(!$('#stage'))shell();
 const referenceFocus=preserveMedia&&document.activeElement?.dataset.beatLink?{id:document.activeElement.dataset.beatLink,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 const montageFocus=preserveMedia&&document.activeElement?.closest('.bm-library')?{field:document.activeElement.dataset.bmField,reference:document.activeElement.dataset.bmReference,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 const playing=preserveMedia?Array.from(document.querySelectorAll('#stage video')):[];
 const inputFocus=preserveMedia&&document.activeElement?.hasAttribute('data-trial-drive')?{id:document.activeElement.dataset.trialDrive,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 const beatDetails=preserveMedia?Array.from(document.querySelectorAll('[data-beat-detail][open]'),el=>el.dataset.beatDetail):[];
 const openDetails=preserveMedia?Array.from(document.querySelectorAll('[data-trial-detail][open]'),el=>el.dataset.trialDetail):[];
 onboardingController?.destroy();onboardingController=null;
 view=resolveView();$('#keyframes-os').classList.toggle('onboarding-mode',view.kind==='onboarding'&&view.entry);
 $('#stage').innerHTML=(snapshot.sourceIssues?.length&&!['home','onboarding'].includes(view.kind)?sourceIssuesHTML():'')+view.html;formatChrome();
 if(view.kind==='onboarding')onboardingController=mountOnboarding($('#stage'),{snapshot,entry:view.entry,navigate,copy,toast,saved:state=>{snapshot.onboarding={...state,done:state.done||snapshot.onboarding?.done};client.refreshAfterWrite();}});
 if(referenceFocus){const input=document.querySelector(`[data-beat-link="${CSS.escape(referenceFocus.id)}"]`);input?.focus({preventScroll:true});if(input&&referenceFocus.start!==null)input.setSelectionRange(referenceFocus.start,referenceFocus.end);}
 if($('#document-search')){filterDocuments(drafts.documentQuery||'');documentMotion=mountDocumentAnimations($('#document-grid'));}
 for(const detail of document.querySelectorAll('[data-beat-detail]'))detail.open=beatDetails.includes(detail.dataset.beatDetail);
 if(preserveMedia)for(const detail of document.querySelectorAll('[data-list-detail]'))detail.open=listDetails.includes(detail.dataset.listDetail);
 for(const detail of document.querySelectorAll('[data-trial-detail]'))detail.open=openDetails.includes(detail.dataset.trialDetail);
 for(const next of document.querySelectorAll('#stage video')){const i=playing.findIndex(old=>old.getAttribute('src')===next.getAttribute('src'));if(i>=0)next.replaceWith(playing.splice(i,1)[0]);}
 bindBeatLibrary(document,{navigate,refresh:()=>client.refreshAfterWrite(),render:()=>render(true),toast,copy,uploadEndpoint:'/api/beat-library/upload'});
 if(montageFocus){const selector=montageFocus.field?'[data-bm-field="'+CSS.escape(montageFocus.field)+'"]':montageFocus.reference!==undefined?'[data-bm-reference="'+CSS.escape(montageFocus.reference)+'"]':null,el=selector&&document.querySelector(selector);el?.focus({preventScroll:true});if(el&&typeof montageFocus.start==='number')try{el.setSelectionRange(montageFocus.start,montageFocus.end);}catch{}}
 if(inputFocus){const el=document.querySelector(`[data-trial-drive="${CSS.escape(inputFocus.id)}"]`);el?.focus({preventScroll:true});if(el&&inputFocus.start!==null&&el.type==='text')el.setSelectionRange(inputFocus.start,inputFocus.end);}
 if(view.kind==='one-shot')oneShotController=mountOneShot($('#stage'),{f:view.f,snapshot,d:oneShotDraft(view.f,draft(view.f.id)),page:view.shotPage,project:view.project,ui:listUI()});
 for(const el of document.querySelectorAll('[data-shot-detail]'))el.open=shotDetails.includes(el.dataset.shotDetail);
 if(shotFocus){const el=document.querySelector('[data-shot-field="'+CSS.escape(shotFocus.field)+'"]');el?.focus({preventScroll:true});try{el?.setSelectionRange(shotFocus.start,shotFocus.end);}catch{}}
 if(view.kind==='list-reel')listController=mountListReel($('#stage'),{f:view.f,snapshot,d:listDraft(view.f,draft(view.f.id)),page:view.listPage,project:view.project,ui:listUI()});
 if(listFocus){const selector=listFocus.field?'[data-list-field="'+CSS.escape(listFocus.field)+'"]':listFocus.card!==undefined?'[data-list-card="'+CSS.escape(listFocus.card)+'"][data-card-field="'+CSS.escape(listFocus.cardField||'')+'"]':null;const el=selector&&document.querySelector(selector);if(el){el.focus({preventScroll:true});if(typeof listFocus.start==='number'&&['text','url','search',undefined].includes(el.type)||el?.tagName==='TEXTAREA')try{el.setSelectionRange(listFocus.start,listFocus.end);}catch{}}}
 $('#crumb').textContent=view.f?view.f.name:view.kind==='home'?'Home':$('#stage h1')?.textContent||'Workspace';
 document.title=($('#stage h1')?.textContent||view.f?.name||'Workspace')+' / Keyframes';
 syncAgentPrompts(document);
 chrome();
}
function receive(next) {
 const first=!snapshot || snapshot.workspaceId!==next.workspaceId;
 const previous=snapshot;
 if(!first&&previous.onboarding?.done&&next.onboarding)next.onboarding.done=true;
 snapshot=next;
 if(first)restore();
 if(next.onboarding?.done&&!next.onboarding.persisted&&!onboardingMigration){
  onboardingMigration=true;
  writeOnboarding({action:'complete'}).then(state=>{if(snapshot.workspaceId===next.workspaceId)snapshot.onboarding=state;client.refreshAfterWrite();}).catch(()=>{}).finally(()=>{onboardingMigration=false;});
 }
 for(const f of next.formats){const d=drafts[f.id];if(!d)continue;const a=f.answers||{};if(f.id==='talking-head')reconcileLookDraft(d,savedLook(a));if(!d.setupDraft)Object.assign(d,a);}
 persist();
 if(view?.f)view.f=format(view.f.id)||view.f;
 if(first){documents.clear();documentRequests.clear();documentEpochs.clear();shell();render();if(activeDocumentPath())readDocument(activeDocumentPath(),{force:true});return;}
 chrome();formatChrome();
 if(view?.kind==='onboarding'){
  // Background file reads never wipe a handle or a key being typed.
  if(view.entry&&next.onboarding?.done)navigate('/',true);
  return;
 }
 if(view?.kind==='one-shot'){if(view.shotPage==='look'&&document.querySelector('.os-shot-font-dialog[open]')){oneShotController?.update({f:view.f,snapshot});return;}const y=scrollY;render(true);scrollTo(0,y);return;}
 if(view?.kind==='list-reel'&&format('scroll-reel')){
  const f=format('scroll-reel'),d=listDraft(f,draft('scroll-reel'));
  if(['setup/hook','setup/overlays','setup/cta','research/project','project'].includes(view.listPage)){const project=view.project?next.projects.find(p=>p.id===view.project.id):null;if(view.project&&!project){const y=scrollY;render(true);scrollTo(0,y);return;}listController?.update({f,snapshot,d,project:project?{...project,listLookLabel:f.answers?.label}:null});return;}
  const y=scrollY;render(true);scrollTo(0,y);return;
 }
 if(view?.kind==='files'&&$('#document-search')){
  updateDocumentCards($('#document-grid'),documentFiles(),{href,formats:snapshot.formats});
  filterDocuments($('#document-search').value);documentMotion?.sync();return;
 }
 const docPath=activeDocumentPath();
 if(docPath&&$('#document-look-sync'))$('#document-look-sync').innerHTML=preferenceSyncNotice(next.formats.find(f=>f.preferencesPath===docPath));
 if(docPath){const incoming=next.preferences.find(p=>p.path===docPath)||next.contextDocuments?.find(p=>p.path===docPath);if(incoming&&!drafts[documentKey(docPath)]?.saving)mergeDocument(incoming);if(drafts[documentKey(docPath)]?.editing)updateDocumentStatus(docPath);else{const y=scrollY;render();scrollTo(0,y);}readDocument(docPath,{force:true});return;}
 const passive=['product-demo-voice-prompt','home','format','beat-library','beat-inputs','beat-craft','trial-format','account','activity','waiting','account-setup','project','files','unknown'];
 if(passive.includes(view?.kind)||view?.kind==='questions'&&JSON.stringify(previous.account.questions)!==JSON.stringify(next.account.questions)||view?.kind==='readback'&&JSON.stringify(previous.account.readback)!==JSON.stringify(next.account.readback)) {
  const y=window.scrollY, focus=document.activeElement?.dataset.route;
  const control=document.activeElement?.matches('[data-account-control],[data-activity-format],[data-action^="account-post:"]')?{action:document.activeElement.dataset.action,account:document.activeElement.dataset.accountControl,activity:document.activeElement.hasAttribute('data-activity-format')}:null;
  render(true);window.scrollTo(0,y);
  if(focus)Array.from(document.querySelectorAll('[data-route]')).find(a=>a.dataset.route===focus)?.focus({preventScroll:true});
  if(control){const selector=control.action?'[data-action="'+CSS.escape(control.action)+'"]':control.account?'[data-account-control="'+control.account+'"]':'[data-activity-format]';document.querySelector(selector)?.focus({preventScroll:true});}
 } else if(view?.kind==='page'){
  const file=snapshot.files.find(f=>f.path===searchParams().get('file'));
  const frame=$('.page-frame');if(frame&&file&&frame.getAttribute('src')!==file.url)frame.src=file.url;
 } else if(view?.kind==='prompt'&&view.f){
  // Chat saving setup can change future routes, but a copied prompt stays stable on screen.
  if(!setupDone(previous.formats.find(f=>f.id===view.f.id))&&setupDone(format(view.f.id)))toast('Your setup is saved.');
 }
}
async function copy(text,message='Copied. Paste into chat.',{literal=false}={}) {
 if(!literal)text=agentPrompt(text);
 try {await navigator.clipboard.writeText(text);toast(message);}
 catch {const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(ok)toast(message);else {const prompt=$('#prompt-text');if(prompt){const selection=getSelection(),range=document.createRange();range.selectNodeContents(prompt);selection.removeAllRanges();selection.addRange(range);}toast('Select the prompt and copy it.');}}
}
function error(text){$('#form-error').textContent=text;$('#form-error').scrollIntoView({block:'nearest'});}
function addFiles(files) {
 if(!view?.f)return;
 const d=draft(view.f.id);
 for(const file of files){if(!/^(video|image)\//.test(file.type)&&!(/\.(mov|mp4|m4v|webm|mkv|jpg|jpeg|png|webp)$/i.test(file.name)))continue;
 const token=crypto.randomUUID();blobs.set(token,URL.createObjectURL(file));d.files.push({name:file.name,size:file.size,type:file.type||(/\.(jpg|jpeg|png|webp)$/i.test(file.name)?'image/jpeg':'video/mp4'),token});}
 persist();$('#chosen-files').innerHTML=chosenFiles(d);
 if(view.kind==='quick-setup')$('#quick-preview').innerHTML=quickPreview(view.f,d);
}
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function act(action) {
 if(action==='beat-more'){const d=draft('beat-montage');d.showAllBeats=!d.showAllBeats;persist();const y=scrollY;render(true);scrollTo(0,y);return;}
 if(action==='beat-link-add'||action.startsWith('beat-link-remove:')){
  const d=draft('beat-montage');
  const rows=beatReferenceRows(d);let focus;
  if(action==='beat-link-add'){if(rows.length>=30)return error('Add up to 30 video links at once.');focus={id:crypto.randomUUID(),value:''};rows.push(focus);}
  else {const index=rows.findIndex(r=>r.id===action.slice('beat-link-remove:'.length));if(index<0)return;delete d.referenceErrors?.[rows[index].id];if(rows.length===1)rows[0].value='';else rows.splice(index,1);focus=rows[Math.min(index,rows.length-1)];}
  d.craftError='';persist();render(true);document.querySelector(`[data-beat-link="${CSS.escape(focus.id)}"]`)?.focus();return;
 }
 if(action==='beat-craft'){
  const d=draft('beat-montage');
  const rows=beatReferenceRows(d),filled=rows.filter(r=>r.value.trim());d.referenceErrors={};d.craftError='';
  if(!filled.length)d.referenceErrors[rows[0].id]='Paste a video link.';
  for(const row of filled){try{montageReference(row.value);}catch(e){d.referenceErrors[row.id]=e.message;}}
  if(Object.keys(d.referenceErrors).length){render(true);document.querySelector(`[data-beat-link="${CSS.escape(Object.keys(d.referenceErrors)[0])}"]`)?.focus();return;}
  const prompt=beatCraftPrompt(d);
  if(!prompt)return error('Add up to 30 video links at once.');
  persist();return copy(prompt);
 }
 if(action.startsWith('beat-reference-retry:')){const job=beatUploads.find(j=>j.id===action.slice('beat-reference-retry:'.length)&&j.referenceId&&j.status==='error');if(job)await sendBeatFile(job);return;}
 if(action.startsWith('beat-reference-continue:')||action.startsWith('beat-reference-open:')){
  const id=action.split(':')[1],ref=format('beat-montage')?.beatReferences?.find(r=>r.id===id);if(!ref)return;
  return copy('/new-format\n\n'+(action.startsWith('beat-reference-continue:')?'Study the video I uploaded for this reference and show me its numbered cut preview.':'Open my Keyframes workspace so I can upload the video for this reference.')+'\n\n'+ref.url);
 }
 if(action==='beat-analyse')return copy(beatPreparationPrompt);
 if(action==='beat-reuse'){
  const d=draft('beat-montage');if(d.reusing)return;
  if(!d.reuseClips?.length)return error('Choose the clips to add.');
  if(preview)return toast('Open your workspace to add these clips.');
  d.reusing=true;d.reuseError='';render(true);
  try{const response=await fetch('/api/beat-inputs',{method:'POST',headers:{'Content-Type':'application/json','X-Keyframes-Write':'inputs'},body:JSON.stringify({paths:d.reuseClips})});const value=await response.json();if(!response.ok)throw Error(value.error||'These clips could not be added.');d.reuseClips=[];await client.refresh();toast('Clips added to Beat Montage.');}catch(e){d.reuseError=e.message;}finally{d.reusing=false;persist();render(true);}return;
 }
 if(action==='beat-retry'){for(const job of beatUploads.filter(j=>!j.referenceId&&j.status==='error'))await sendBeatFile(job);return;}
 if(action==='beat-make'){
  const d=draft('beat-montage');
  if(!Number.isInteger(Number(d.quantity))||d.quantity<1||d.quantity>30)return error('Choose between 1 and 30 reels.');
  if(!format('beat-montage')?.beatInputs?.ready)return navigate('/formats/beat-montage/inputs');
  return copy(makePrompt(format('beat-montage')));
 }
 const f=view?.f,d=f?draft(f.id):null;
 if(action.startsWith('account-post:')){drafts.accountSelectedPost=action.slice(13);render();document.querySelector('[data-action="'+CSS.escape(action)+'"]')?.focus({preventScroll:true});return;}
 if(action==='copy-prompt')return copy($('#prompt-text').textContent);
 if(action==='fv-next'){if(!String(d?.fvSubject||'').trim()){error('Write your subject first.');$('#fv-new-form textarea')?.focus();return;}return navigate('/formats/full-visual/new/prompt');}
 if(action==='fv-done'){const fd=draft('full-visual');fd.fvSubject='';fd.fvNotes='';persist();toast('Your video shows up here once the research starts.');return navigate('/formats/full-visual');}
 if(action.startsWith('fv-own:')){const pd=fvDraft(action.slice(7));pd.own=!pd.own;persist();return render(true);}
 if(action.startsWith('fv-caption:')){const o=snapshot.outputs.find(o=>o.projectId===action.slice(11)&&o.caption?.text);return o?copy(o.caption.text,'Caption copied.',{literal:true}):toast('No caption yet.');}
 if(action.startsWith('cap-mode:')){d.capMode=action.slice(9);persist();return render(true);}
 if(action.startsWith('th-style:')){
  if(preview)return toast('Open your workspace to pick a style.');
  const style=action.slice(9),tf=format('talking-head');
  try{await writeTalkingStyle(style);if(tf)tf.style=style;toast('Saved. Your videos use '+(talkingStyleName({...tf,style})||'it')+'.');await client.refreshAfterWrite();return navigate('/formats/talking-head');}
  catch(problem){error(problem.message);}
  return;
 }
 if(action==='fv-voice'){
  const form=$('#fv-voice-form'),key=$('#fv-key');if(!form||form.dataset.saving)return;
  if(!key.value.trim()){error('Paste your key first.');key.focus();return;}
  if(preview)return toast('Open your workspace to save your key.');
  form.dataset.saving='true';const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Saving…';
  try{f.voiceKeys=(await writeProductVoiceKey(d.fvVoice||'elevenlabs',key.value)).keys;key.value='';toast('Key saved.');await client.refreshAfterWrite();render(true);}
  catch(problem){if(form.isConnected){error(problem.message);key.focus();}}
  finally{delete form.dataset.saving;if(submit.isConnected){submit.disabled=false;submit.textContent='Save key';}}
  return;
 }
 if(action==='product-demo-back')return navigate('/formats/product-demo/new');
 if(action==='product-demo-voice-next'){
  const form=$('#product-demo-voice-form');if(!form||form.dataset.saving)return;
  try{productVoicePrompt(productVoiceDraft(f,d));}catch(problem){return error(problem.message);}
  if(preview)return toast('Open your workspace to save your key.');
  const key=$('#product-demo-key'),submit=form.querySelector('[type="submit"]'),controls=[...form.querySelectorAll('input,select,button')];
  form.dataset.saving='true';form.setAttribute('aria-busy','true');controls.forEach(el=>el.disabled=true);submit.textContent='Saving…';
  try{
   if(key){
    f.productVoice=await writeProductVoiceKey(d.productVoiceProvider,key.value);key.value='';
   }
   if(form.isConnected)return navigate('/formats/product-demo/setup/prompt');
  }catch(problem){if(form.isConnected){error(problem.message);controls.forEach(el=>el.disabled=false);key?.focus();}}
  finally{delete form.dataset.saving;form.removeAttribute('aria-busy');controls.forEach(el=>el.disabled=false);submit.textContent='Get setup prompt';}
  return;
 }
 if(action.startsWith('product-demo-film:')){const id=action.slice(18),liked=new Set(d.productFilms||[]);liked.has(id)?liked.delete(id):liked.add(id);d.productFilms=[...liked];persist();const y=scrollY;render(true);return scrollTo(0,y);}
 if(action==='product-demo-next'){try{productDemoPrompt(d);return navigate('/formats/product-demo/new/films');}catch(problem){error(problem.message);$('#product-demo-form input')?.focus();return;}}
 if(action.startsWith('answer-option:')||action==='question-next'||action==='question-back'){
  const qs=snapshot.account.questions||[],q=qs.find(q=>q.id===drafts.accountQuestion)||qs[0];if(!q)return;
  const index=qs.indexOf(q);drafts.accountAnswers??={};
  if(action.startsWith('answer-option:')){const answer=q.options?.[Number(action.split(':')[1])];if(answer==null)return;drafts.accountAnswers[q.id]=answer;}
  else{if(action==='question-next'&&!drafts.accountAnswers[q.id]?.trim())return error('Add your answer first.');drafts.accountQuestion=qs[index+(action==='question-next'?1:-1)]?.id||q.id;}
  persist();render();return;
 }
 if(action==='copy-answers'){const questions=snapshot.account.questions||[],d=drafts.accountAnswers||{};if(questions.some(q=>!d[q.id]?.trim()))return error('Answer the remaining questions first.');return copy('/start\nHere are my shared answers:\n'+questions.map(q=>'['+q.id+'] '+q.ask+'\n'+d[q.id]).join('\n\n')+'\n\nSave these once in context/answers.json, keeping the existing answers and read provenance. Use audience.for for audience and audience.need for audience_need. Reuse them in every format, remove answered questions from context/questions.json, update profile.md and show the read-back in my workspace. Do not repeat these questions when I change formats.');}
 if(action==='confirm-account')return copy('/start\nI reviewed the account read-back in my workspace. It is correct. Finish the remaining checks, mark account setup done when they pass, then continue straight into Trial Reels if it is installed. Otherwise show my next step on Home.');
 if(action==='correct-account')return copy('/start\nHere is my correction to the account read-back:\n'+(drafts.accountCorrection||'')+'\nUpdate the affected context files and show the revised read-back before completing setup.');
 if(action==='add-pack')return copy('/add\nHelp me add the Keyframes pack I downloaded to this folder.');
 if(action.startsWith('task:'))return copy(`Resume the task ${JSON.stringify(action.slice(5))}. Read its last recorded status, check what is already complete and continue only the missing work. Show progress in my workspace.`);
 if(action==='source-repair')return copy('Check these workspace files: '+JSON.stringify(snapshot.sourceIssues.map(issue=>issue.path))+'. Repair incomplete or invalid JSON from the original evidence, preserving all preferences and finished work. Keep independent work available. Refresh the workspace when the files are valid.');
 if(action.startsWith('sync-preferences:')){const f=format(action.slice(17));if(!f)return;return copy(f.command+' setup\nRead '+JSON.stringify(f.preferencesPath)+' and reconcile my saved look with my corrections there. Keep the current text and all other preferences. Write explicit look answers and use --preferences-revision '+(f.preferencesSync?.revision||'<current SHA256 of the preference file>')+' when saving them with the format look script. Update defaults for future videos only. Do this yourself; ask only if my intent cannot be inferred.');}
 if(action.startsWith('edit-export:')){const p=snapshot.projects.find(p=>p.id===action.slice(12));if(p?.edit?.exportRequest)return copy(p.edit.exportRequest.prompt);return;}
 if(action.startsWith('new-video-shape:')){const d=drafts.newVideo||={name:'',shape:'9:16'};d.shape=action.slice(16);d.name=$('[data-new-video="name"]')?.value??d.name;render(true);$(`[data-action="${CSS.escape(action)}"]`)?.focus({preventScroll:true});return;}
 if(action==='new-video-create'){const d=drafts.newVideo||={name:'',shape:'9:16'};if(creatingEdit)return;d.name=($('[data-new-video="name"]')?.value??d.name).trim();const [,width,height]=shapes.find(s=>s[0]===d.shape)||shapes[0];creatingEdit=true;d.error='';render(true);try{await createEdit({name:d.name||'My video',width,height,fps:30});drafts.newVideo={name:'',shape:d.shape};persist();}catch(e){creatingEdit=false;d.error=e.message;render(true);}return;}
 if(action.startsWith('edit-clip:')){const path=action.slice(10),file=snapshot.files.find(f=>f.path===path);if(!file)return;try{await createEdit({name:file.name.replace(/\.[^.]+$/,''),clip:file.path});}catch(e){error(e.message);}return;}
 if(action.startsWith('resume:')){const p=snapshot.projects.find(p=>p.id===action.slice(7));if(!p)return;if(p.format==='talking-head')return copy(talkingResumePrompt(p));if(p.format==='product-demo')return copy('/product-demo\nContinue '+JSON.stringify(p.path)+'. Read the current record and preferences, then finish the film, review and editable delivery.');return copy(p.beatMontage?.prompt||`${format(p.format)?.command||''}\nContinue ${JSON.stringify(p.path)} using the format skill. Refresh its steps.json from this video's files and approvals. Do the preparation, building and checks yourself, continuing until the next required layer or visual-plan approval. Show me that proposal in my workspace. Keep approved layers locked and record progress after each operation.`);}
 if(action.startsWith('review:')||action.startsWith('revision:')){
  const p=snapshot.projects.find(p=>p.id===action.split(':').slice(1).join(':'));
  return copy(action.startsWith('review:')?`Show me the current proposal for ${JSON.stringify(p.path)}. Follow the format skill and check the work yourself before showing it. Ask for the layer or visual-plan approval the skill requires, keep approved layers locked, and handle the preparation and checks yourself.`:`For ${JSON.stringify(p.path)}, here is what I want to change:\n[Add my correction here]\nKeep the rest. Update the format preference file when this is a lasting preference.`);
 }
 if(action==='footage-next'){
  if(!d.files?.length)return error('Choose your footage first.');
  return navigate(base(f)+(f.id==='talking-head'?setupDone(f)?'/new/transcript':'/setup/look':f.pack==='quick-cuts'?'/material/prompt':'/new/prompt'));
 }
 if(action==='transcript-next'){
  if(!d.files?.length)return error('Add your footage first.');
  if(!d.transcribe&&!d.transcript?.trim())return error('Paste a transcript or choose “Transcribe my footage”.');
  return navigate(base(f)+'/new/prompt');
 }
 if(action==='quick-new-prompt'){
  if(!Number.isInteger(Number(d.quantity))||d.quantity<1||d.quantity>30)return error('Choose between 1 and 30 reels.');
  if(['phone','scroll-reel'].includes(f.id)&&!(snapshot.account.context?.readyForIdeas??snapshot.account.done)&&!d.topic?.trim())return error(snapshot.account.context?.audience?'Add a short topic for your audience.':'Add a short topic and who it is for.');
  return navigate(base(f)+'/new/prompt');
 }
 if(action==='quick-setup-prompt'){
  if(f.id==='beat-montage'&&!d.subject?.trim())return error('Name what you want to film.');
  if(d.cta==='comment'&&!d.keyword?.trim())return error('Add your comment keyword and what it sends.');
  return navigate(base(f)+'/setup/prompt');
 }
 if(action==='save-document')return saveDocument();
 if(action==='retry-document')return readDocument(activeDocumentPath(),{force:true});
 if(['toggle-pref','download-pref','reset-pref'].includes(action)){
  const path=activeDocumentPath(),saved=knownDocument(path),d=documentState(path);if(!d)return;
  if(action==='toggle-pref'){d.editing=!d.editing;persist();render();if(d.editing)readDocument(path,{force:true});}
  if(action==='reset-pref'){const latest=d.conflict||saved;d.text=latest.text;d.base=latest.text;d.revision=latest.revision;d.conflict=null;d.error='';persist();render();}
  if(action==='download-pref')download(d.editing?d.text:saved.text,path.split('/').pop());
 }

}
function bind() {
 document.addEventListener('submit',e=>{if(e.target.id==='product-demo-form'){e.preventDefault();act('product-demo-next');}});
 document.addEventListener('submit',e=>{if(e.target.id==='fv-new-form'){e.preventDefault();act('fv-next');}if(e.target.id==='fv-voice-form'){e.preventDefault();act('fv-voice');}});
 document.addEventListener('submit',e=>{if(e.target.id==='product-demo-voice-form'){e.preventDefault();act('product-demo-voice-next');}});
 bindBeatPlayers(document);
 // Trial comparisons play one reel at a time, so their sound never overlaps.
 document.addEventListener('play',event=>{
  const video=event.target;if(!video.matches?.('.trial-detail video'))return;
  for(const other of document.querySelectorAll('.trial-detail video'))if(other!==video)other.pause();
 },true);
 document.addEventListener('click',async e=>{
  const back=e.target.closest('[data-trial-back]');
  if(back&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();const d=trialInputDraft(back.dataset.trialBack);if(d.adding||d.more){d.adding=false;d.more=false;d.error='';persist();render(true);}else navigate('/formats/trial-reels');return;}
  const toggle=e.target.closest('[data-trial-add],[data-trial-cancel],[data-trial-more],[data-trial-ready]');
  if(toggle){const id=toggle.dataset.trialAdd||toggle.dataset.trialCancel||toggle.dataset.trialMore||toggle.dataset.trialReady,d=trialInputDraft(id);d.adding=!!toggle.dataset.trialAdd;d.more=!!toggle.dataset.trialMore;d.error='';persist();render(true);return;}
  const queueCopy=e.target.closest('[data-trial-queue-copy]');
  if(queueCopy){const model=snapshot.trial.formats.find(m=>m.id===queueCopy.dataset.trialQueueCopy),selected=new Set(trialInputDraft(model.id).queued||[]),reels=(model.uncreated||[]).filter(e=>selected.has(e.id));if(reels.length)await copy('/trial-reels\nMake '+(model.variationTarget||4)+' variations of each selected reel below for '+model.name+'. Reuse the saved study and current originals. Check their fit, give every video a lightly rewritten source caption, and show the checked outputs. Keep all existing videos and posting marks.\n'+reels.map(e=>e.permalink||e.id).join('\n'));return;}
  const captionButton=e.target.closest('[data-trial-caption]');
  if(captionButton){const model=snapshot.trial.formats.find(m=>m.id===captionButton.dataset.model);const item=captionButton.dataset.source?model?.examples.find(e=>e.id===captionButton.dataset.trialCaption):model?.outputGroups.flatMap(g=>g.outputs).find(o=>o.path===captionButton.dataset.trialCaption);if(item?.caption?.text)await copy(item.caption.text,'Caption copied.',{literal:true});return;}
  const control=e.target.closest('[data-trial-save-drive],[data-trial-remove],[data-trial-restore],[data-trial-retry],[data-trial-request]');if(!control)return;
  const id=control.dataset.model||control.dataset.trialSaveDrive||control.dataset.trialRequest,d=trialInputDraft(id);
  if(control.dataset.trialRetry){const job=trialUploads.get(id)?.find(j=>j.id===control.dataset.trialRetry);if(job)await trialSend(job);return;}
  control.disabled=true;trialInputError(id,'');
  try {
   if(control.dataset.trialRequest){await trialChange({action:'request-reels',formatId:id,links:(d.links||'').split(/\s+/).filter(Boolean)});d.adding=false;d.links='';persist();}
   else if(control.dataset.trialSaveDrive){const model=snapshot.trial.formats.find(m=>m.id===id);await trialChange({action:'drive',formatId:id,roundId:model.roundId,needId:d.need||(model.needs.length===1?model.needs[0].id:''),url:d.drive});d.drive='';d.more=false;persist();}
   else if(control.dataset.trialRestore){await trialChange({action:'restore',formatId:id,id:control.dataset.trialRestore});toast('Input restored.');}
   else {await trialChange({action:control.dataset.media?'remove-media':'remove',formatId:id,id:control.dataset.trialRemove,mediaId:control.dataset.media});toast('Removed from this format. You can restore it below.');}
   await client.refresh();
  }catch(error){trialInputError(id,error.message);}finally{control.disabled=false;}
 });
 document.addEventListener('click',e=>{
  const a=e.target.closest('[data-route]');
  if(a&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();if(a.dataset.bmReset)resetBeatLibraryDraft(snapshot.workspaceId,decodeURIComponent(a.dataset.bmReset));if(a.dataset.fresh){const id=a.dataset.route.split('/')[2];delete drafts[id];draft(id);}navigate(a.dataset.route);return;}
  const action=e.target.closest('[data-action]');if(action){act(action.dataset.action);return;}
  const remove=e.target.closest('[data-remove]');if(remove&&view.f){const d=draft(view.f.id),[file]=d.files.splice(Number(remove.dataset.remove),1);if(file?.token&&blobs.has(file.token)){URL.revokeObjectURL(blobs.get(file.token));blobs.delete(file.token);}persist();$('#chosen-files').innerHTML=chosenFiles(d);}
 });
 document.addEventListener('paste',e=>{
  const el=e.target;if(!el.dataset.beatLink)return;
  const values=(e.clipboardData?.getData('text/plain')||'').trim().split(/\s+/).filter(Boolean);if(values.length<2)return;
  e.preventDefault();const d=draft('beat-montage');
  const rows=beatReferenceRows(d),index=rows.findIndex(r=>r.id===el.dataset.beatLink);if(index<0)return;
  if(rows.length-1+values.length>30)return error('Add up to 30 video links at once.');
  const incoming=values.map((value,i)=>({id:i?crypto.randomUUID():rows[index].id,value}));rows.splice(index,1,...incoming);d.referenceErrors={};d.craftError='';persist();render(true);document.querySelector(`[data-beat-link="${CSS.escape(incoming.at(-1).id)}"]`)?.focus();
 });
 document.addEventListener('input',e=>{
 if(e.target.dataset?.newVideo==='name'){(drafts.newVideo||={name:'',shape:'9:16'}).name=e.target.value;persist();return;}
  const el=e.target;
  if(el.dataset.beatLink){const d=draft('beat-montage'),row=beatReferenceRows(d).find(r=>r.id===el.dataset.beatLink);if(!row)return;row.value=el.value;delete d.referenceErrors?.[row.id];d.craftError='';const host=el.closest('[data-beat-link-row]');host.querySelector('.beat-link-brand').innerHTML=beatReferenceBadge(el.value);host.querySelector('.beat-link-error').hidden=true;el.removeAttribute('aria-invalid');el.setAttribute('aria-describedby','beat-link-help');if($('#form-error'))$('#form-error').textContent='';const prompt=beatCraftPrompt(d),box=$('#prompt-text');if(box){box.textContent=prompt;box.hidden=!prompt;}persist();return;}
  if(el.id==='document-search'){drafts.documentQuery=el.value;persist();filterDocuments(el.value);return;}
  if(el.dataset.trialLinks){trialInputDraft(el.dataset.trialLinks).links=el.value;persist();return;}
  if(el.dataset.trialDrive){trialInputDraft(el.dataset.trialDrive).drive=el.value;persist();return;}
  if(el.dataset.question){drafts.accountAnswers??={};drafts.accountAnswers[el.dataset.question]=el.value;persist();return;}
  if(el.dataset.own&&view?.f){const d=draft(view.f.id);d[el.dataset.own]=el.value;persist();const box=$('#prompt-text');if(box)box.textContent=agentPrompt(talkingCreatePrompt(d));return;}
  if(el.dataset.cap&&view?.f){const d=draft(view.f.id);d[el.dataset.cap]=el.value;persist();const box=$('#prompt-text');if(box)box.textContent=agentPrompt(talkingCaptionsPrompt(view.f,d));return;}
  if(el.dataset.fvText){const pd=fvDraft(el.dataset.fvText);pd.text=el.value;persist();const box=$('#prompt-text');if(box)box.textContent=agentPrompt(fullVisualTranscriptPrompt(el.dataset.fvText,pd.text));return;}
  if(el.id==='account-correction'){drafts.accountCorrection=el.value;persist();return;}
  if(el.dataset.pref){drafts[el.dataset.pref].text=el.value;drafts[el.dataset.pref].error='';persist();updateDocumentStatus(activeDocumentPath());return;}
  if(!view?.f||!el.dataset.field)return;
  const d=draft(view.f.id),key=el.dataset.field;
  d[key]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
  if(view.kind==='quick-setup')d.setupDraft=true;
  if(view.kind==='product-demo-voice')d.setupDraft=true;
  clearTimeout(saveTimer);saveTimer=setTimeout(persist,200);
  if(key==='transcribe')$('#transcript').disabled=d.transcribe;
  if(key==='cta'&&$('#keyword-field'))$('#keyword-field').hidden=d.cta!=='comment';
  if(view.kind==='quick-setup')$('#quick-preview').innerHTML=quickPreview(view.f,d);
 });
 document.addEventListener('change',async e=>{
  const el=e.target;
  if(el.dataset.field==='fvVoice'&&view?.f?.id==='full-visual'){draft('full-visual').fvVoice=el.value;persist();render(true);document.querySelector('[data-field="fvVoice"]')?.focus();return;}
  if(el.dataset.field==='productVoiceProvider'&&view?.f?.id==='product-demo'){draft(view.f.id).productVoiceProvider=el.value;persist();render();document.querySelector('[data-field="productVoiceProvider"]')?.focus();return;}
  if(el.dataset.accountControl){const q=accountOptions();q[el.dataset.accountControl]=el.value;navigate('/account?tab='+q.tab+'&range='+q.range+'&metric='+q.metric);document.querySelector('[data-account-control="'+el.dataset.accountControl+'"]')?.focus({preventScroll:true});return;}
  if(el.hasAttribute('data-activity-format')){navigate('/activity?status='+(searchParams().get('status')||'all')+'&format='+encodeURIComponent(el.value));document.querySelector('[data-activity-format]')?.focus({preventScroll:true});return;}
  if(el.dataset.trialPosted){const posted=el.checked,control=el.closest('.trial-post-control');el.disabled=true;control?.setAttribute('aria-busy','true');trialInputError(el.dataset.model,'');try{await trialChange({action:'posted',formatId:el.dataset.model,path:el.dataset.trialPosted,posted});await client.refreshAfterWrite();toast(posted?'Marked as posted.':'Moved to not posted.');}catch(error){el.checked=!posted;trialInputError(el.dataset.model,error.message);toast('Could not save the posting status.');}finally{el.disabled=false;control?.removeAttribute('aria-busy');}return;}
  if(el.dataset.beatReferenceUpload){addBeatFiles(el.files,el.dataset.beatReferenceUpload);el.value='';return;}
  if(el.hasAttribute('data-beat-upload')){addBeatFiles(el.files);el.value='';return;}
  if(el.dataset.beatReuse){const d=draft('beat-montage');d.reuseClips=(d.reuseClips||[]).filter(p=>p!==el.dataset.beatReuse);if(el.checked)d.reuseClips.push(el.dataset.beatReuse);persist();return;}
  if(el.dataset.trialUpload){trialAddFiles(el.dataset.trialUpload,el.files);el.value='';return;}
  if(el.dataset.trialQueue){const d=trialInputDraft(el.dataset.model),selected=new Set(d.queued||[]);el.checked?selected.add(el.dataset.trialQueue):selected.delete(el.dataset.trialQueue);d.queued=[...selected];persist();render(true);return;}
  if(el.dataset.trialNeed){trialInputDraft(el.dataset.trialNeed).need=el.value;persist();return;}
  if(el.id==='footage-input')addFiles(el.files);
  if(el.id==='existing-footage'&&el.value){const file=snapshot.files.find(f=>f.path===el.value),d=draft(view.f.id);if(file&&!d.files.some(f=>f.path===file.path))d.files.push({path:file.path,name:file.name,type:file.kind==='video'?'video/mp4':'image/jpeg'});persist();$('#chosen-files').innerHTML=chosenFiles(d);}
  if(el.dataset.sound){const d=draft(view.f.id);d.sounds=Array.isArray(d.sounds)?d.sounds:[];d.sounds=d.sounds.filter(s=>s!==el.dataset.sound);if(el.checked)d.sounds.push(el.dataset.sound);persist();}
  if(el.id==='preview-scenario'){window.KEYFRAMES_PREVIEW.setScenario(el.value);drafts={};snapshot=null;navigate(el.value==='trial-analysis'?'/formats/trial-reels':'/');client.refresh();}
 });
 document.addEventListener('dragover',e=>{const zone=e.target.closest('.drop-zone,[data-trial-drop],[data-beat-drop]');if(zone){e.preventDefault();zone.classList.add('dragging');}});
 document.addEventListener('dragleave',e=>e.target.closest('.drop-zone,[data-trial-drop],[data-beat-drop]')?.classList.remove('dragging'));
 document.addEventListener('drop',async e=>{const zone=e.target.closest('.drop-zone,[data-trial-drop],[data-beat-drop]');if(!zone)return;e.preventDefault();zone.classList.remove('dragging');if(zone.dataset.beatDrop){const fallback=Array.from(e.dataTransfer.files);try{const files=await trialDropFiles(e.dataTransfer.items);await addBeatFiles(files.length?files:fallback);}catch(e){error(e.message);}return;}if(zone.dataset.trialDrop){const id=zone.dataset.trialDrop,fallback=Array.from(e.dataTransfer.files);try{const files=await trialDropFiles(e.dataTransfer.items);await trialAddFiles(id,files.length?files:fallback);}catch(error){trialInputError(id,error.message);}return;}addFiles(e.dataTransfer.files);});
 window.addEventListener('popstate',()=>{render();window.scrollTo(0,history.state?.scroll||0);if(activeDocumentPath())readDocument(activeDocumentPath(),{force:true});client.refresh();});
 window.addEventListener('beforeunload',e=>{if([...trialUploads.values()].flat().concat(beatUploads).some(j=>['queued','uploading','saving'].includes(j.status))){e.preventDefault();e.returnValue='';}});
 window.addEventListener('pagehide',()=>{persist();client.stop();});
 window.addEventListener('pageshow',e=>{if(e.persisted)client.start();});
}
const client=new WorkspaceClient({source:preview?()=>window.KEYFRAMES_PREVIEW.snapshot():undefined,onData:receive,onStatus:status=>{lastStatus=status;if(snapshot)chrome();else if(status==='unavailable')$('#app').innerHTML=`<main class="os-content">${heading('Let’s reconnect.','Ask your agent to reopen this Keyframes workspace.')}<p class="small">This page will reconnect automatically.</p>${button('Try again','retry','primary')}</main>`;}});
watchAgentPrompts(document);
$('#app').innerHTML='<main class="os-content" aria-label="Loading workspace"><div class="skeleton title"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></main>';
if(location.protocol==='file:'&&!preview)$('#app').innerHTML='<main class="os-content"><h1>Open your workspace in chat.</h1><p>Ask your agent to open Keyframes. It will give you the local link.</p></main>';
else{bind();document.addEventListener('click',e=>{if(e.target.closest('[data-action="retry"]'))client.refresh();});client.start();}
// Useful for deterministic browser verification; it cannot mutate runtime files.
window.KEYFRAMES_WORKSPACE={refresh:()=>client.refresh(),get snapshot(){return snapshot;},navigate};

// A failed local image falls back to the initials already underneath it.
document.addEventListener('error',event=>{if(event.target.matches?.('img[data-account-avatar]'))event.target.remove();},true);
