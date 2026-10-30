// Shared by the form and the local writer. Only individual video links belong in a study.
export function montageReference(raw) {
 let u;try{u=new URL(raw.trim());}catch{throw Error('Paste a full video link.');}
 if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Use an https video link.');
 const host=u.hostname.toLowerCase().replace(/^www\./,''),path=u.pathname;let platform,url,id;
 if(host==='instagram.com'){
  const m=path.match(/^\/(?:(?!share\/)[A-Za-z0-9_.]{1,30}\/)?(?:reel|reels|p)\/([A-Za-z0-9_-]+)\/?$/);
  const share=path.match(/^\/share\/reel\/([A-Za-z0-9_-]+)\/?$/);
  if(m){platform='Instagram';id=m[1];url=`https://www.instagram.com/reel/${id}/`;}
  else if(share){platform='Instagram';id='share-'+share[1];url=`https://www.instagram.com/share/reel/${share[1]}/`;}
 }else if(['youtube.com','m.youtube.com','youtu.be'].includes(host)){
  id=host==='youtu.be'?path.slice(1):path.match(/^\/shorts\/([A-Za-z0-9_-]+)\/?$/)?.[1]||(path==='/watch'?u.searchParams.get('v'):null);
  if(/^[A-Za-z0-9_-]{11}$/.test(id||'')){platform='YouTube Shorts';url=`https://www.youtube.com/shorts/${id}`;}
 }else if(['tiktok.com','m.tiktok.com'].includes(host)){
  const m=path.match(/^\/@[^/]+\/video\/(\d+)\/?$/),short=path.match(/^\/t\/([A-Za-z0-9]+)\/?$/);
  if(m){platform='TikTok';id=m[1];url=`https://www.tiktok.com${path.replace(/\/$/,'')}`;}
  else if(short){platform='TikTok';id='short-'+short[1];url=`https://www.tiktok.com/t/${short[1]}/`;}
 }else if(['vm.tiktok.com','vt.tiktok.com'].includes(host)&&/^\/[A-Za-z0-9]+\/?$/.test(path)){
  platform='TikTok';id='short-'+path.replaceAll('/','');url=`https://${host}/${id.slice(6)}/`;
 }
 if(!url)throw Error('Use an Instagram video, TikTok or YouTube Short link.');
 return {platform,videoId:id,url};
}
export function montageReferences(value) {
 const lines=Array.isArray(value)?value:String(value||'').trim().split(/\s+/).filter(Boolean);
 if(!lines.length)throw Error('Add at least one video link.');
 if(lines.length>30)throw Error('Add up to 30 video links at once.');
 const rows=lines.map((v,i)=>{try{return montageReference(v);}catch(e){throw Error(`Link ${i+1}: ${e.message}`);}});
 return [...new Map(rows.map(r=>[r.platform+':'+r.videoId,r])).values()];
}
