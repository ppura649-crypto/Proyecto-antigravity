import {createDocumentScene} from './document-scenes.js';

// Surface points become shaded letters, with an actual depth buffer. The same
// projection makes the printable still and the live canvas agree exactly.
const documentRamp = ' .,:;irsXA253hMHGS#9B&@';
export function documentSeed(path) {
 let hash=2166136261;for(const char of path)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return (hash>>>0)/4294967296;
}
export function createDocumentRaster(cols=68,rows=36) {
 const count=cols*rows,depth=new Float32Array(count),ink=new Uint8Array(count),accent=new Uint8Array(count);
 return {cols,rows,ink,accent,draw(scene,time,{x=0,y=0,energy=0}={}) {
  depth.fill(-Infinity);ink.fill(0);accent.fill(0);
  const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),scale=Math.min(rows,cols*.6)*.32;
  scene(time,(px,py,pz,nx,ny,nz,tone=1,warm=0)=>{
   const tx=px*cy+pz*sy,tz=pz*cy-px*sy,ty=py*cx-tz*sx,z=tz*cx+py*sx;
   const perspective=4.8/(4.8-z);
   const col=Math.round(cols/2+tx*perspective*scale/.6),row=Math.round(rows/2-ty*perspective*scale);
   if(col<0||col>=cols||row<0||row>=rows)return;
   const index=row*cols+col;if(z<depth[index])return;
   const normalX=nx*cy+nz*sy,normalZ=nz*cy-nx*sy,normalY=ny*cx-normalZ*sx;
   const facing=normalZ*cx+ny*sx;
   const diffuse=Math.max(0,-normalX*.46+normalY*.62+facing*.63);
   const light=Math.min(1,(.23+.77*diffuse)*tone);
   const glyph=Math.max(1,Math.round(Math.pow(light,.82)*(documentRamp.length-1)));
   depth[index]=z;ink[index]=glyph;accent[index]=warm>.45?1:0;
  },energy);
  return this;
 },text() {
  return Array.from({length:rows},(_,row)=>Array.from(ink.subarray(row*cols,(row+1)*cols),i=>documentRamp[i]).join('')).join('\n');
 }};
}

// Letters are rasterized once per size, then stamped from a tiny atlas. Drawing
// many documents does not mean measuring and drawing thousands of text runs.
function documentGlyphAtlas(cell,dpr) {
 const width=Math.ceil(cell*.6*dpr),height=Math.ceil(cell*dpr),atlas=document.createElement('canvas');
 atlas.width=width*documentRamp.length;atlas.height=height*2;
 const ctx=atlas.getContext('2d');
 ctx.font=`500 ${cell*1.13*dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(let color=0;color<2;color++)for(let i=1;i<documentRamp.length;i++){
  ctx.fillStyle=color?'#BD492F':'#2E343C';ctx.globalAlpha=.46+.54*i/(documentRamp.length-1);
  ctx.fillText(documentRamp[i],i*width+width/2,color*height+height*.51);
 }
 return {atlas,width,height};
}

let documentMotionPaused=false,documentMotionTime=4;
export function mountDocumentAnimations(grid) {
 if(!grid)return null;
 const items=new Map(),atlases=new Map(),reduce=matchMedia('(prefers-reduced-motion: reduce)'),button=grid.parentElement.querySelector('[data-document-motion]');
 let raf=0,last=0,dead=false,hovered=null,focused=null;
 const paused=()=>documentMotionPaused||reduce.matches;
 const visible=item=>item.visible&&!item.tile.hidden;
 const runnable=()=>!dead&&!paused()&&!document.hidden&&[...items.values()].some(visible);
 function draw(item) {
  if(!item.raster)return;
  item.scene??=createDocumentScene(item.canvas.dataset.documentScene,item.seed);
  item.raster.draw(item.scene,documentMotionTime+item.seed*24,{x:item.x,y:item.y,energy:item.energy});
  const {ctx,w,h,cell,dpr,raster}=item,cw=cell*.6,x0=(w-raster.cols*cw)/2,y0=(h-raster.rows*cell)/2;
  const key=cell.toFixed(2)+':'+dpr;
  if(!atlases.has(key))atlases.set(key,documentGlyphAtlas(cell,dpr));
  const {atlas,width,height}=atlases.get(key);
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<raster.ink.length;i++)if(raster.ink[i]){
   ctx.drawImage(atlas,raster.ink[i]*width,raster.accent[i]*height,width,height,x0+(i%raster.cols)*cw,y0+Math.floor(i/raster.cols)*cell,cw,cell);
  }
  item.canvas.dataset.asciiReady='true';
 }
 function size(item) {
  const box=item.canvas.getBoundingClientRect();if(box.width<1||box.height<1)return;
  const dpr=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;
  if(item.w===w&&item.h===h&&item.dpr===dpr)return;
  Object.assign(item,{w,h,dpr,cell:Math.max(4.4,h/36)});
  item.canvas.width=Math.round(w*dpr);item.canvas.height=Math.round(h*dpr);item.ctx.setTransform(dpr,0,0,dpr,0,0);
  item.raster=createDocumentRaster(Math.floor(w/(item.cell*.6)),Math.floor(h/item.cell));draw(item);
 }
 function wake() {
  if(runnable()&&!raf){last=0;raf=requestAnimationFrame(tick);}
  else if(!runnable()&&raf){cancelAnimationFrame(raf);raf=0;last=0;}
 }
 function tick(now) {
  raf=0;if(!runnable())return;
  const delta=last?now-last:50;
  if(delta>=50){
   documentMotionTime+=Math.min(delta,100)/1000;last=now;
   for(const item of items.values())if(visible(item)){
    const active=item.tile===hovered||item.tile===focused;
    item.energy+=((active?1:0)-item.energy)*.18;
    item.x+=((active?item.targetX:0)-item.x)*.15;item.y+=((active?item.targetY:0)-item.y)*.15;
    draw(item);
   }
  }
  raf=requestAnimationFrame(tick);
 }
 const intersection=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const item=items.get(entry.target);if(!item)continue;
   item.visible=entry.isIntersecting;
   if(item.visible)size(item);
   else if(item.raster){
    // A large folder keeps only the visible sculptures in memory. The still
    // remains available while an object is outside the viewport.
    item.scene=null;item.raster=null;item.w=0;item.canvas.width=1;item.canvas.height=1;delete item.canvas.dataset.asciiReady;
   }
  }
  wake();
 });
 const resize=new ResizeObserver(entries=>{for(const entry of entries){const item=items.get(entry.target);if(item&&visible(item))size(item);}});
 function state() {
  if(button){button.setAttribute('aria-label',paused()?'Play document animations':'Pause document animations');button.title=button.getAttribute('aria-label');button.dataset.paused=String(paused());button.disabled=reduce.matches;}
  // Reduced motion freezes the same sculpture, including pointer movement.
  if(reduce.matches)for(const item of items.values()){item.x=0;item.y=0;item.energy=0;draw(item);}
  wake();
 }
 function sync() {
  const canvases=new Set(grid.querySelectorAll('[data-document-scene]'));
  for(const [canvas,item] of items)if(!canvases.has(canvas)){resize.unobserve(canvas);intersection.unobserve(canvas);items.delete(canvas);if(hovered===item.tile)hovered=null;if(focused===item.tile)focused=null;}
  for(const canvas of canvases)if(!items.has(canvas)){
   const ctx=canvas.getContext('2d');if(!ctx)continue;
   const tile=canvas.closest('[data-document-path]'),seed=documentSeed(tile.dataset.documentPath);
   const item={canvas,ctx,tile,seed,scene:null,visible:false,x:0,y:0,targetX:0,targetY:0,energy:0};
   items.set(canvas,item);intersection.observe(canvas);resize.observe(canvas);
  }
  wake();
 }
 function move(event) {
  const tile=event.target.closest('[data-document-path]');hovered=tile;
  if(!tile||event.pointerType==='touch'||paused())return;
  const canvas=tile.querySelector('canvas'),item=items.get(canvas);if(!item)return;
  const rect=canvas.getBoundingClientRect();item.targetY=Math.max(-.16,Math.min(.16,(event.clientX-rect.left-rect.width/2)/rect.width*.32));item.targetX=Math.max(-.12,Math.min(.12,(event.clientY-rect.top-rect.height/2)/rect.height*.24));
 }
 function leave(){hovered=null;}
 function focus(event){focused=event.target.closest('[data-document-path]');}
 function blur(event){focused=event.relatedTarget?.closest('[data-document-path]')||null;}
 function toggle(){documentMotionPaused=!documentMotionPaused;state();}
 grid.addEventListener('pointermove',move);grid.addEventListener('pointerleave',leave);grid.addEventListener('focusin',focus);grid.addEventListener('focusout',blur);
 button?.addEventListener('click',toggle);reduce.addEventListener('change',state);document.addEventListener('visibilitychange',wake);
 sync();state();
 return {sync,destroy(){
  dead=true;cancelAnimationFrame(raf);resize.disconnect();intersection.disconnect();items.clear();atlases.clear();
  grid.removeEventListener('pointermove',move);grid.removeEventListener('pointerleave',leave);grid.removeEventListener('focusin',focus);grid.removeEventListener('focusout',blur);
  button?.removeEventListener('click',toggle);reduce.removeEventListener('change',state);document.removeEventListener('visibilitychange',wake);
 }};
}
