// Validate authored caption timing and content independently of creative quality.
export function captionErrors(cues,plan){
 const errors=[];let last=0;
 const need=(value,message)=>{if(!value)errors.push(message)};
 const text=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim();
 const fonts=new Set(['CreatorCaption',...(plan.look?.fonts??[]).map(f=>f.family)]);
 const font=(item,tag)=>{if(item.fontFamily!==undefined)need(fonts.has(item.fontFamily),`${tag}: font family must be loaded from a project font asset.`)};
 if(!Array.isArray(cues))return ['Captions must be an array.'];
 for(const [i,c] of cues.entries()){
  const tag=`Caption ${i}`;
  need(Number.isInteger(c.from)&&Number.isInteger(c.to)&&c.from>=last&&c.to>c.from&&c.to<=plan.frames,`${tag}: overlaps or leaves the master timebase.`);last=c.to;
  need(typeof c.text==='string'&&c.text.trim(),`${tag}: empty text.`);
  font(c,tag);
  for(const k of ['x','y','width'])if(c[k]!==undefined)need(Number.isFinite(c[k])&&c[k]>=0&&c[k]<=1,`${tag}: ${k} must be a canvas fraction.`);
  if(c.yAnchor!==undefined)need(['top','center','bottom'].includes(c.yAnchor),`${tag}: invalid yAnchor.`);
  if(c.lines){
   need(Array.isArray(c.lines)&&c.lines.length>0,`${tag}: lines must contain text.`);
   if(!Array.isArray(c.lines))continue;
   const all=[];
   for(const line of c.lines){
    font(line,tag);
    need(Array.isArray(line.runs)&&line.runs.length>0,`${tag}: each line needs runs.`);
    for(const r of line.runs??[]){
     font(r,tag);
     need(typeof r.text==='string'&&r.text.trim(),`${tag}: empty run.`);all.push(r.text??'');
     const from=r.from??0,to=r.to??c.to-c.from;
     need(Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to>from&&to<=c.to-c.from,`${tag}: run times must remain inside the cue.`);
     if(r.dimAt!==undefined)need(Number.isInteger(r.dimAt)&&r.dimAt>=from&&r.dimAt<to,`${tag}: dimAt must lie inside the visible run.`);
     if(r.gradient)need(Array.isArray(r.gradient.colors)&&r.gradient.colors.length>=2,`${tag}: gradient needs at least two colors.`);
     if(r.enter)for(const k of ['duration','rise','blur'])if(r.enter[k]!==undefined)need(Number.isFinite(r.enter[k])&&r.enter[k]>=0,`${tag}: invalid entrance ${k}.`);
    }
   }
   need(text(all.join(' '))===text(c.text??''),`${tag}: styled runs differ from the declared caption text.`);
  }
 }
 return errors;
}
