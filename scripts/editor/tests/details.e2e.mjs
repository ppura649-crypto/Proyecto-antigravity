#!/usr/bin/env node
// Test word placement, animation, timing, history and click seeking in Playwright's bundled browser.
// Run from an install with --media-project <project containing a video> --port <port> [--shots <folder>].
// Creates and leaves one isolated test project. Optional --scene <disposable adapted paper project> also changes
// that copy's card and title. Never pass an original project as --scene. No personal browser or cookies are used.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
const args=process.argv.slice(2);
const arg=(key,fallback=null)=>{const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
const mediaProject=arg('media-project'),sceneProject=arg('scene');
if(!mediaProject)throw Error('Pass --media-project with a video item, plus --port and optionally --scene with a disposable Full Visual paper scene.');
const base='http://127.0.0.1:'+arg('port','58670'),shots=resolve(arg('shots','.keyframes/editor/detail-tests'));mkdirSync(shots,{recursive:true});
const headers={'content-type':'application/json','x-keyframes-write':'edit',origin:base};
const get=async id=>(await fetch(`${base}/api/edit?project=${id}`).then(r=>r.json())).doc;
const save=async(id,doc)=>{const current=await get(id);const r=await fetch(base+'/api/edit',{method:'PUT',headers,body:JSON.stringify({project:id,doc,revision:current.revision})});assert.equal(r.status,200,await r.text());};
const created=await fetch(base+'/api/edit/new',{method:'POST',headers,body:JSON.stringify({name:'Word editing checks',width:1080,height:1920,fps:30})}).then(r=>r.json());const id=created.project;assert.ok(id,JSON.stringify(created));
const reference=await get(mediaProject);const media=reference.items.find(i=>i.type==='video');
const fixture={...(await get(id)),durationInFrames:240,tracks:[{id:'c',kind:'visual',name:'Captions'},{id:'t',kind:'visual',name:'Text'},{id:'v',kind:'visual',name:'Video'},{id:'a',kind:'audio',name:'Sound'}],items:[
{id:'cap',type:'caption',track:'c',from:0,durationInFrames:240,words:'Move each word on its own'.split(' ').map((text,i)=>({text,from:i*35,to:i*35+25})),pages:[{from:0,to:240,lines:[[0,1,2],[3,4,5]]}],style:{size:80,font:'inter',y:.6,animation:'none'}},
{id:'text',type:'text',track:'t',from:30,durationInFrames:120,text:'Every moment',style:{size:90,color:'#ffffff'},transform:{x:0,y:-500,scale:1,rotation:0,opacity:1}},
{...media,id:'video',track:'v',from:0,durationInFrames:240,trimStart:30,speed:1,volume:0},
{id:'audio',type:'audio',track:'a',src:media.src,from:0,durationInFrames:240,volume:.5},
]};await save(id,fixture);writeFileSync(shots+'/test-project.json',JSON.stringify({id,url:base+created.url}));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1512,height:982}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
let passed=[];const check=(name,condition)=>{assert.ok(condition,name);passed.push(name);console.log('ok',name);};
const doc=()=>page.evaluate(()=>window.__keyframesEditor.doc());const frame=()=>page.evaluate(()=>window.__keyframesEditor.frame());const seek=f=>page.evaluate(f=>window.__keyframesEditor.seek(f),f);
const ready=async url=>{await page.goto(url);await page.waitForFunction(()=>window.__keyframesEditor);};
const field=async(name,value)=>{const f=page.locator(`input[name="${name}"]`);await f.fill(String(value));await f.press('Enter');};
const clickTime=async(frame,row)=>{const s=await page.locator('.tl-scroll').boundingBox();const geometry=await page.locator('.tl-scroll').evaluate(el=>({scroll:el.scrollLeft,ppf:Number(el.querySelector('.tl-sheet').dataset.ppf)}));const b=await page.locator(row).boundingBox();await page.mouse.click(s.x+168+frame*geometry.ppf-geometry.scroll,b.y+b.height/2);check(`seek ${row} ${frame}`,Math.abs((await frameRead())-frame)<=1);};const frameRead=frame;
try {
await ready(base+created.url);await page.waitForTimeout(700);
for(const [f,row] of [[45,'.clip[data-clip="cap"]'],[65,'.clip[data-clip="text"]'],[90,'.clip[data-clip="video"]'],[120,'.clip[data-clip="audio"]'],[72,'.tl-ruler']]) await clickTime(f,row);
await page.waitForFunction(()=>document.querySelectorAll('.clip-strip i').length>3);const strip=await page.locator('.clip-strip i').evaluateAll(es=>es.map(e=>Number(e.dataset.sourceTime)));check('thumbnails respect trim',strip[0]>=1);
await page.locator('.tl').getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(400);await clickTime(40,'.clip[data-clip="video"]');
check('purple captions',await page.locator('.clip[data-clip="cap"]').evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(73, 51, 104)'));
check('pink sound',await page.locator('.clip[data-clip="audio"]').evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(88, 43, 70)'));
check('rounded clips',await page.locator('.clip[data-clip="video"]').evaluate(e=>parseFloat(getComputedStyle(e).borderRadius)>=6));
await page.screenshot({path:shots+'/timeline.png'});
await page.locator('.clip[data-clip="cap"]').dblclick();await page.getByRole('option',{name:'each',exact:true}).click();await seek(50);await page.waitForTimeout(250);
check('six individual words',await page.locator('[data-detail-block]').count()===6);
await field('Selected x',90);await field('Selected y',-50);
check('only selected word moved',(await doc()).items.find(i=>i.id==='cap').words.filter(w=>w.edit).length===1);
const selectedId=(await doc()).items.find(i=>i.id==='cap').words[1].id;
check('word uses its saved transform',await page.locator(`[data-word-id="${selectedId}"]`).evaluate(e=>e.style.translate==='90px -50px'));
await seek(50);await page.getByRole('button',{name:'Add point here',exact:true}).click();await seek(100);await field('Selected x',190);await seek(75);await page.waitForTimeout(200);
check('animated word interpolates',await page.locator(`[data-word-id="${selectedId}"]`).evaluate(e=>e.style.translate==='140px -50px'));
await page.getByRole('button',{name:'Done editing inside',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
check('undo restores previous animation',(await doc()).items.find(i=>i.id==='cap').words[1].edit.keyframes.x.length===1);
await page.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForTimeout(850);check('autosave succeeds',await page.locator('[data-save]').getAttribute('data-save')==='saved');
await page.reload();await page.waitForFunction(()=>window.__keyframesEditor);check('word changes reopen',(await doc()).items.find(i=>i.id==='cap').words[1].edit.keyframes.x.length===2);
await page.locator('.clip[data-clip="cap"]').dblclick();await page.getByRole('option',{name:'on',exact:true}).click();await seek(130);await page.waitForTimeout(300);
const hit=page.locator(`[data-detail-hit="${(await doc()).items.find(i=>i.id==='cap').words[3].id}"]`);const b=await hit.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+24,b.y+b.height/2+12,{steps:6});await page.mouse.up();
const moved=(await doc()).items.find(i=>i.id==='cap').words[3].edit;check('canvas drag moves one word',moved.transform.x>60&&moved.transform.y>25);
const block=page.locator(`[data-detail-block="${selectedId}"]`);const bb=await block.boundingBox();const ppf=await page.locator('.tl-sheet').getAttribute('data-ppf');await page.mouse.click(bb.x+bb.width*.65,bb.y+bb.height/2);check('word block click seeks inside word',Math.abs(await frame()-Math.round(35+25*.65))<=1);
const beforeTiming=(await doc()).items.find(i=>i.id==='cap').words[1];await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();await page.mouse.move(bb.x+bb.width/2+5*Number(ppf),bb.y+bb.height/2,{steps:5});await page.mouse.up();const afterTiming=(await doc()).items.find(i=>i.id==='cap').words[1];check('word timing drags independently',afterTiming.from===beforeTiming.from+5&&afterTiming.to===beforeTiming.to+5);
await page.screenshot({path:shots+'/words.png'});await page.waitForTimeout(850);
if(sceneProject){
await ready(base+'/edit/'+sceneProject);await page.locator('.clip[data-clip="scene-paper"]').scrollIntoViewIfNeeded();await page.locator('.clip[data-clip="scene-paper"]').dblclick();await seek(965);await page.getByRole('option',{name:'Paper card',exact:true}).click();check('component selection keeps playhead',await frame()===965);
await page.waitForTimeout(250);const card=page.locator('[data-detail-hit="paper-card"]');const cb=await card.boundingBox();await page.mouse.move(cb.x+cb.width*.85,cb.y+cb.height*.85);await page.mouse.down();await page.mouse.move(cb.x+cb.width*.85+15,cb.y+cb.height*.85+10,{steps:5});await page.mouse.up();check('native card drag saves',(await doc()).items.find(i=>i.id==='scene-paper').elements['paper-card'].transform.x>30);
await page.getByRole('option',{name:'Paper title',exact:true}).click();await page.locator('textarea[name="Selected text"]').fill('Refusal follows a single direction');await page.locator('textarea[name="Selected text"]').blur();check('native title changes on canvas',await page.locator('[data-element-id="paper-title"]').textContent()==='Refusal follows a single direction');
await page.screenshot({path:shots+'/scene-edited.png'});await page.waitForTimeout(850);check('native scene saved',await page.locator('[data-save]').getAttribute('data-save')==='saved');
}
check('no browser errors',errors.length===0);writeFileSync(shots+'/e2e-results.json',JSON.stringify({passed,errors,project:id},null,2));
} finally {await browser.close();}
