import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,staticFile,delayRender,continueRender,cancelRender} from 'remotion';
import {Caption} from './Caption';

// The human picture is composited by FFmpeg. This composition owns only graphics and captions.
export const Stage:React.FC<any>=({plan,captions,Visual,layer='all'})=>{
 const f=useCurrentFrame();const look=plan.look;const scene=plan.scenes.find((s:any)=>f>=s.from&&f<s.to);
 const [fontHandle]=React.useState(()=>delayRender('Load the chosen caption font'));
 React.useEffect(()=>{const fonts=[{family:'CreatorCaption',file:look.fontFile??'fonts/Inter-Black.ttf',weight:'900',style:'normal'},...(look.fonts??[])];Promise.all(fonts.map((f:any)=>new FontFace(f.family,`url(${staticFile(f.file)})`,{weight:String(f.weight??'400'),style:f.style??'normal'}).load())).then(faces=>{faces.forEach(face=>document.fonts.add(face));continueRender(fontHandle)}).catch(cancelRender)},[]);
 if(!scene)return null;
 const top=Math.round(plan.height*(look.splitTop??.56)/2)*2;
 const visualHeight=scene.mode==='split'?top:Math.round(plan.height*(scene.visualHeight??.7));
 const c=captions.find((p:any)=>f>=p.from&&f<p.to);
 const bg=scene.background??look.background;
 return <AbsoluteFill style={{background:'transparent'}}>
  {layer!=='captions'&&scene.mode!=='presenter'&&<>
   <div style={{position:'absolute',inset:0,height:scene.mode==='split'&&!look.presenter?top:plan.height,background:bg}}/>
   <div style={{position:'absolute',left:0,top:0,width:plan.width,height:visualHeight,overflow:'hidden'}}>
    <Sequence from={scene.from} durationInFrames={scene.to-scene.from} layout="none"><Visual scene={scene} frame={f-scene.from} width={plan.width} height={visualHeight} look={look}/></Sequence>
   </div>
  </>}
  {layer!=='scene'&&c&&<Caption cue={c} frame={f} plan={plan} scene={scene}/>}
 </AbsoluteFill>;
};
