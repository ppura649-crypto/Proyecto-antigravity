import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';

function presenterBackground(p){
 if(p.background===undefined)return null;
 if(typeof p.background!=='string'||!/^#[0-9a-fA-F]{6}$/.test(p.background))throw Error('presenter.background must be an opaque #RRGGBB color.');
 return p.background;
}

export async function presenterInputs(project,plan){
 const p=plan.look.presenter;if(!p)return null;
 presenterBackground(p);
 for(const k of ['imageX','imageY','imageWidth','panelTop','panelX','panelWidth','radius'])if(!Number.isInteger(p[k]))throw Error(`presenter.${k} needs an integer pixel measurement.`);
 if(p.imageWidth<=0||p.panelWidth<=0||p.radius<0||p.radius>p.panelWidth/2||p.panelTop<0||p.panelTop>=plan.height)throw Error('Invalid presenter panel dimensions.');
 const matte=path.resolve(project,p.matteFile??'presenter-matte.mkv');
 if(!fs.existsSync(matte))throw Error('Generate the real presenter matte before rendering.');
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-of','json',matte],{encoding:'utf8'}));
 const v=info.streams.find(s=>s.codec_type==='video');
 const rate=v?.avg_frame_rate.split('/').map(Number);
 if(!v||Number(v.nb_read_frames)!==plan.frames||Math.abs(rate[0]/rate[1]-plan.fps)>.001)throw Error('The presenter matte must match every master frame.');
 const mask=path.join(project,'.render','room-mask.png');
 const svg=`<svg width="${plan.width}" height="${plan.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="black"/><rect x="${p.panelX}" y="${p.panelTop}" width="${p.panelWidth}" height="${plan.height-p.panelTop+p.radius}" rx="${p.radius}" fill="white"/></svg>`;
 await sharp(Buffer.from(svg)).png().toFile(mask);
 return {matte,mask,...p};
}

// Presenter geometry per global frame, as FFmpeg expressions. States: full (the presenter crop),
// split (the measured panel placement) and off (the split placement below the frame). A split
// scene owns its transitions: into it at its start, out of it at its end, eased in and out.
export function motionTimeline(plan,p,W,H,fps){
 const look=plan.look,z=look.fullScale??1,fullW=Math.round(W*z/2)*2,fullH=Math.round(H*z/2)*2;
 const cropX=Math.floor((fullW-W)*(look.faceX??.5)/2)*2,cropY=Math.floor((fullH-H)*(look.faceY??.5)/2)*2;
 const imageH=Math.round(p.imageWidth*H/W),drop=H-p.panelTop+80;
 const full={ox:-cropX,oy:-cropY,sw:fullW,sh:fullH,L:0,R:W,T:0,r:0};
 const split={ox:p.imageX,oy:p.imageY,sw:p.imageWidth,sh:imageH,L:p.panelX,R:p.panelX+p.panelWidth,T:p.panelTop,r:p.radius};
 const off={...split,oy:split.oy+drop,T:split.T+drop};
 const a=p.animate===true?{}:p.animate,inF=a.in??18,outF=a.out??14,dropF=a.drop??12,riseF=a.rise??14;
 const windows=[],scenes=plan.scenes;
 scenes.forEach((s,i)=>{
  if(s.mode!=='split')return;
  const prev=scenes[i-1]?.mode,next=scenes[i+1]?.mode;
  if(prev==='presenter')windows.push({a:s.from,b:s.from+inF,A:full,B:split});
  if(prev==='visual')windows.push({a:s.from,b:s.from+riseF,A:off,B:split});
  if(next==='presenter')windows.push({a:s.to-outF,b:s.to,A:split,B:full});
  if(next==='visual')windows.push({a:s.to-dropF,b:s.to,A:split,B:off});
 });
 const expr=(key,g)=>{
  let out=String(split[key]);
  for(const w of windows.slice().reverse()){
   const u=`clip((${g}-${w.a})/${w.b-w.a},0,1)`;
   const ease=`if(lt(${u},0.5),4*pow(${u},3),1-pow(-2*${u}+2,3)/2)`;
   out=`if(between(${g},${w.a},${w.b-1}),${w.A[key]}+(${w.B[key]-w.A[key]})*${ease},${out})`;
  }
  return out;
 };
 return {windows,expr};
}

// Artifact, source-aligned human mask, then captions. The voice is mapped only at delivery.
export function composite({plan,master,sceneFile,captionFile,presenter,from,to,output,still=false}){
 const {width:W,height:H,fps}=plan,look=plan.look,seconds=(to-from)/fps;
 const intervals=plan.scenes.filter(s=>s.mode==='split');
 // Overlay timeline enable uses zero-based n. Integer gates include the exact first
 // scene frame; fractional seconds can round just above that frame's timestamp.
 const enable=still?(intervals.some(s=>from>=s.from&&from<s.to)?'1':'0'):(intervals.map(s=>`gte(n,${s.from-from})*lt(n,${s.to-from})`).join('+')||'0');
 // Matroska masks have millisecond timestamps. Seeking both files by seconds or
 // retaining their different timebases can pair a picture with an adjacent mask.
 // Select the same decoded frame indices, then put both on one exact frame clock.
 const input=['-i',master,'-i',sceneFile,'-i',captionFile];
 const frameClock=`trim=start_frame=${from}:end_frame=${to},settb=expr=1/${fps},setpts=N`;
 const filters=[`[0:v]${frameClock}[source]`,
  `[1:v]settb=expr=1/${fps},setpts=N[scene]`,
  `[2:v]settb=expr=1/${fps},setpts=N[captions]`];
 const zoom=look.fullScale??1,fullW=Math.round(W*zoom/2)*2,fullH=Math.round(H*zoom/2)*2;
 if(!Number.isFinite(zoom)||zoom<1)throw Error('fullScale must be at least 1.');
 // A steady crop belongs to a take. Source framing can change between takes;
 // these measured, scene-local offsets avoid either tracking jitter or a compromise crop.
 const coordinate=key=>{
  const fallback=look[key]??.5;
  let result=String(fallback);
  for(const s of plan.scenes.filter(s=>s.mode==='presenter'&&s.presenterCrop?.[key]!==undefined)){
   const value=s.presenterCrop[key];
   if(!Number.isFinite(value)||value<0||value>1)throw Error(`Invalid presenterCrop.${key} in ${s.id}.`);
   if(still){if(from>=s.from&&from<s.to)return String(value);}
   else result=`if(gte(n,${s.from-from})*lt(n,${s.to-from}),${value},${result})`;
  }
  return result;
 };
 const cropX=`floor((iw-ow)*(${coordinate('faceX')})/2)*2`;
 const cropY=`floor((ih-oh)*(${coordinate('faceY')})/2)*2`;
 const crop=`scale=${fullW}:${fullH}:force_original_aspect_ratio=increase,crop=${W}:${H}:x='${cropX}':y='${cropY}',setsar=1`;
 if(presenter){
  input.push('-i',presenter.matte,'-loop','1','-i',presenter.mask);
  const p=presenter,imageH=Math.round(p.imageWidth*H/W),len=still?1/fps:seconds,background=presenterBackground(p);
  filters.push(`[3:v]${frameClock}[matte]`,'[source]split=2[fullin][imagein]');
  if(background){
   // Crop the real mask exactly like the full source. It must not inherit split placement.
   // The upright master is 4:2:0, whose crop offsets round down to even pixels.
   // A grayscale mask otherwise keeps odd offsets and shifts the silhouette by one pixel.
   const maskCrop=crop;
   filters.push('[matte]split=2[fullmaskin][splitmaskin]',
    `[fullin]${crop},format=rgba[fullimage]`,
    `[fullmaskin]${maskCrop},format=gray[fullmask]`,
    '[fullimage][fullmask]alphamerge[fullperson]',
    `color=c=${background}:s=${W}x${H}:r=${fps}:d=${len},format=rgba[fullbackground]`,
    '[fullbackground][fullperson]overlay=0:0:format=auto:shortest=1[full]');
  }else filters.push(`[fullin]${crop}[full]`);
  filters.push(
   '[full][scene]overlay=0:0:format=auto[art]',
   `[imagein]scale=${p.imageWidth}:${imageH},format=rgba[image]`,
   `color=c=black@0:s=${W}x${H}:r=${fps}:d=${len},format=rgba[blank]`,
   `[blank][image]overlay=${p.imageX}:${p.imageY}:format=auto:shortest=1[placed]`,
   `[${background?'splitmaskin':'matte'}]scale=${p.imageWidth}:${imageH},format=gray[seg]`,
   `color=c=black:s=${W}x${H}:r=${fps}:d=${len},format=gray[maskblank]`,
   `[maskblank][seg]overlay=${p.imageX}:${p.imageY}:shortest=1,format=gray[segplaced]`,
   '[4:v]format=gray[room]');
  if(p.animate){
   // Animated presenter states. The picture, its real matte and the rounded panel move together
   // per frame: in from the full crop, out to it, down out of frame before a full visual and back
   // up after one. Expressions use the global frame so chunks and stills agree. perspective's `in`
   // counts from 1, geq's N from 0.
   const G=still?String(from):`(in-1+${from})`,Gq=still?String(from):`(N+${from})`;
   const geo=motionTimeline(plan,p,W,H,fps);
   const e=(key,g)=>geo.expr(key,g);
   const dest=g=>`x0='${e('ox',g)}':y0='${e('oy',g)}':x1='${e('ox',g)}+${e('sw',g)}':y1='${e('oy',g)}':x2='${e('ox',g)}':y2='${e('oy',g)}+${e('sh',g)}':x3='${e('ox',g)}+${e('sw',g)}':y3='${e('oy',g)}+${e('sh',g)}':sense=destination:eval=frame`;
   const h=2,wq=W/h,hq=H/h;
   const q=k=>`(${e(k,Gq)})/${h}`;
   const panel=`st(0,${q('L')});st(1,${q('R')});st(2,${q('T')});st(3,${q('r')});`+
    `if(between(X,ld(0),ld(1))*gte(Y,ld(2)),if(lt(Y,ld(2)+ld(3)),if(lt(X,ld(0)+ld(3)),lte(hypot(X-ld(0)-ld(3),Y-ld(2)-ld(3)),ld(3)),if(gt(X,ld(1)-ld(3)),lte(hypot(X-ld(1)+ld(3),Y-ld(2)-ld(3)),ld(3)),1)),1),0)*255`;
   filters.splice(filters.indexOf(`[imagein]scale=${p.imageWidth}:${imageH},format=rgba[image]`),7,
    `[imagein]scale=${W}:${H},perspective=${dest(G)}:interpolation=cubic,format=rgba[placed]`,
    `[${background?'splitmaskin':'matte'}]scale=${W-4}:${H-4},pad=${W}:${H}:2:2:black,format=gray,perspective=${dest(G)}[segplaced]`,
    `color=c=black:s=${wq}x${hq}:r=${fps}:d=${len},format=gray,geq=lum='${panel}',scale=${W}:${H}:flags=bicubic,format=gray[room]`);
   if(background)filters.push(
    // The panel owns only solid color; source pixels are revealed by the silhouette alone.
    `color=c=${background}:s=${W}x${H}:r=${fps}:d=${len},format=rgba[panelcolor]`,
    '[panelcolor][room]alphamerge[panel]',
    `[art][panel]overlay=0:0:enable='${enable}':format=auto[panelled]`,
    '[placed][segplaced]alphamerge[person]',
    `[panelled][person]overlay=0:0:enable='${enable}':format=auto[human]`);
   else filters.push("[segplaced][room]blend=all_expr='max(A,B)'[union]",
    '[placed][union]alphamerge[person]',`[art][person]overlay=0:0:enable='${enable}':format=auto[human]`);
  }else if(background){
   // The rounded panel owns only solid color. Source pixels are revealed by the silhouette alone.
   filters.push(`color=c=${background}:s=${W}x${H}:r=${fps}:d=${len},format=rgba[panelcolor]`,
    '[panelcolor][room]alphamerge[panel]',
    `[art][panel]overlay=0:0:enable='${enable}':format=auto[panelled]`,
    '[placed][segplaced]alphamerge[person]',
    `[panelled][person]overlay=0:0:enable='${enable}':format=auto[human]`);
  }else filters.push("[segplaced][room]blend=all_expr='max(A,B)'[union]",
   '[placed][union]alphamerge[person]',`[art][person]overlay=0:0:enable='${enable}':format=auto[human]`);
 }else{
  const top=Math.round(H*(look.splitTop??.56)/2)*2,lower=H-top;
  filters.push('[source]split=2[fullin][halfin]',`[fullin]${crop}[full]`,
   '[full][scene]overlay=0:0:format=auto[art]',
   `[halfin]scale=${W}:${lower}:force_original_aspect_ratio=increase,crop=${W}:${lower}:(iw-ow)*${look.faceX??.5}:(ih-oh)*${look.faceY??.5},setsar=1[half]`,
   `[art][half]overlay=0:${top}:enable='${enable}':format=auto[human]`);
 }
 filters.push('[human][captions]overlay=0:0:format=auto,format=yuv420p[out]');
 const args=['-hide_banner','-loglevel','error','-y',...input,'-filter_complex',filters.join(';'),'-map','[out]',
  ...(still?['-frames:v','1']:['-an','-frames:v',String(to-from),'-r',String(fps),'-c:v','libx264','-g','1','-crf','18','-preset','slow','-movflags','+faststart']),output];
 execFileSync('ffmpeg',args,{stdio:'inherit'});
}
