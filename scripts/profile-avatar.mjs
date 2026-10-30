// Cache the connected creator's picture locally. A missing picture never fails account reading.
import {mkdirSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

export async function saveProfileAvatar({root,url,previous={},fetcher=fetch,at=new Date().toISOString()}) {
  const oldPath = /^context\/profile\/[a-z0-9-]+\.(png|jpg|webp)$/.test(previous?.path ?? '') && existsSync(join(root,previous.path)) ? previous.path : null;
  const fallback = {path:oldPath,status:oldPath ? 'cached' : 'unavailable',checked_at:at};
  try {
    const source = new URL(url);
    if (source.protocol !== 'https:' || source.username || source.password) return fallback;
    const response = await fetcher(source.href,{signal:AbortSignal.timeout(8000),headers:{Accept:'image/jpeg,image/png,image/webp'}});
    if (!response.ok) return fallback;
    const limit = 5 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); return fallback; }
    const chunks = []; let length = 0;
    for await (const chunk of response.body) {
      length += chunk.length;
      if (length > limit) return fallback;
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const extension = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'webp' : null;
    if (!extension) return fallback;
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0,24);
    const path = `context/profile/avatar-${hash}.${extension}`, target = join(root,path);
    mkdirSync(join(root,'context/profile'),{recursive:true});
    if (!existsSync(target)) {
      const temp = `${target}.${randomUUID()}.tmp`;
      writeFileSync(temp,bytes); renameSync(temp,target);
    }
    return {path,status:'ready',checked_at:at};
  } catch { return fallback; }
}
