import React from 'react';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
function treatment(item:any,frame:number,start:number,end:number){
 const entered=frame>=start&&frame<end;
 const motion=item.enter??{};
 const amount=motion.duration?ease((frame-start+1)/motion.duration):1;
 const dim=item.dimAt!==undefined&&frame>=item.dimAt?(item.dimOpacity??.4):1;
 const style:any={
  display:'inline-block',whiteSpace:item.wrap?'normal':'pre',maxWidth:item.wrap?'100%':undefined,
  fontFamily:item.fontFamily,fontSize:item.size,fontWeight:item.fontWeight,
  fontStyle:item.fontStyle,letterSpacing:item.letterSpacing,
  color:item.color,textShadow:item.shadow,
  opacity:entered?amount*dim:0,
  transform:`translateY(${(1-amount)*(motion.rise??0)}px)`,
  filter:motion.blur?`blur(${(1-amount)*motion.blur}px)`:undefined,
 };
 if(item.reserveSpace===false&&!entered)style.display='none';
 if(item.gradient){style.backgroundImage=`linear-gradient(${item.gradient.angle??180}deg, ${item.gradient.colors.join(', ')})`;style.backgroundClip='text';style.WebkitBackgroundClip='text';style.color='transparent';}
 return style;
}

// Run times are relative to their caption, independently of the artifact's animation.
export const Caption:React.FC<any>=({cue,frame,plan,scene})=>{
 const look=plan.look;
 const local=frame-cue.from;
 const defaultY=scene.mode==='split'?(look.captionSplitY??.47):scene.mode==='visual'?(look.captionVisualY??.75):(look.captionPresenterY??.79);
 const lines=cue.lines??[{runs:[{text:cue.text,wrap:true}]}];
 const anchor=cue.yAnchor??'top';
 const base:any={
  position:'absolute',top:(cue.y??defaultY)*plan.height,
  left:(cue.x??.06)*plan.width,width:(cue.width??.88)*plan.width,
  transform:anchor==='bottom'?'translateY(-100%)':anchor==='center'?'translateY(-50%)':undefined,
  textAlign:cue.align??'center',fontFamily:cue.fontFamily??'CreatorCaption',
  fontSize:cue.size??look.captionSize??62,fontWeight:cue.fontWeight??900,
  fontStyle:cue.fontStyle??'normal',lineHeight:cue.lineHeight??1.04,
  letterSpacing:cue.letterSpacing??'-.035em',
  color:cue.color??(scene.mode==='presenter'?'white':scene.captionColor??look.ink),
  textShadow:cue.shadow??(scene.mode==='presenter'?'0 2px 8px #0009':'none'),
 };
 const motion=treatment(cue,local,0,cue.to-cue.from);
 return <div data-caption={cue.text} style={base}>
  <div style={{opacity:motion.opacity,filter:motion.filter,transform:motion.transform}}>
   {lines.map((line:any,i:number)=><div key={i} style={{fontFamily:line.fontFamily,fontSize:line.size,fontWeight:line.fontWeight,fontStyle:line.fontStyle,color:line.color,lineHeight:line.lineHeight,letterSpacing:line.letterSpacing,marginTop:i?(line.gap??0):0}}>
    {line.runs.map((run:any,j:number)=><span key={j} style={treatment(run,local,run.from??0,run.to??cue.to-cue.from)}>{run.text}</span>)}
   </div>)}
  </div>
 </div>;
};
