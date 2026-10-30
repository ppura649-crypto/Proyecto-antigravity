// General clip understanding is shared. This crop and review belong only to Beat Montage.
import {createHash} from 'node:crypto';
export const beatPreparationPath='workspace/library/beat-montage.preparation.json';
export const beatMinimumClips=10;
export const beatSuggestedClips=20;
export const beatStyle={lineBand:.5,lineCap:.0126,lineFont:'fonts/PlayfairDisplay-Variable.ttf',lineCapRatio:.708,lineAdvanceEm:.4417,lineWeight:500,linePitchCaps:1.86,lineMaxWidth:.56,lineEdge:'stroke-shadow',lineStyle:'serif-centred',layout:'square'};
export const beatMember=(path)=>/(?:^|\/)workspace\/input\/beat-montage\//.test(String(path||'').replaceAll('\\','/'));
export const readingKey=read=>createHash('sha256').update(JSON.stringify(read||null)).digest('hex').slice(0,16);
export function preparedClip(record,media,reading,file=()=>true){
 if(!record||record.version!==1||record.source!==media?.mezzanine||record.readingKey!==readingKey(reading?.read))return false;
 if(record.status==='excluded')return !!record.reason?.trim();
 const window=record.usable,review=record.review;
 return !!(record.status==='ready'&&record.key&&review?.key===record.key&&['crop','colour','caption','motion'].every(k=>typeof review[k]==='string'&&review[k].trim())&&typeof review.personVisible==='boolean'&&Number.isFinite(window?.from)&&Number.isFinite(window?.to)&&window.from>=0&&window.to<=media.duration&&window.to>window.from&&record.video?.startsWith('workspace/library/mezzanine/beat-montage/')&&file(record.video)&&record.sheet&&file(record.sheet));
}
