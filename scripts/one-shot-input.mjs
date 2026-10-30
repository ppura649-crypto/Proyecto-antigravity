// A caption position belongs to one current original and a reviewed reading of that position.
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
export const placementRevision=record=>createHash('sha256').update(JSON.stringify(record)).digest('hex');
const band=value=>Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&value[0]>=0&&value[1]<=1&&value[0]<value[1];
export function currentShotPlacement(record,path,stat,root=process.cwd()){
 return !!(record&&stat&&typeof record.clip==='string'&&resolve(root,record.clip)===resolve(root,path)&&record.source?.bytes===stat.size&&record.source?.mtimeMs===stat.mtimeMs&&record.measured?.frames>=8&&band(record.band));
}
export function reviewedShot(record,reading,path,stat,root=process.cwd()){
 return !!(currentShotPlacement(record,path,stat,root)&&record.ok===true&&band(record.subject)&&(reading?.personVisible===true||reading?.facingCamera===true)&&reading.continuous===true&&reading.unedited===true&&typeof reading.finding==='string'&&reading.finding.trim()&&reading.bytes===stat.size&&reading.mtimeMs===stat.mtimeMs&&reading.placementRevision===placementRevision(record));
}
