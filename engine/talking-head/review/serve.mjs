// Review server: static files with Range support + POST /save -> cuts.json
// Usage: node serve.mjs <project_dir> [port]
import { createServer } from 'node:http';
import { createReadStream, statSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = process.argv[2];
const port = Number(process.argv[3] || 4321);
const reviewDir = dirname(fileURLToPath(import.meta.url));
if (!projectDir) { console.error('usage: node serve.mjs <project_dir> [port]'); process.exit(1); }

const MIME = { '.html': 'text/html', '.json': 'application/json', '.mov': 'video/quicktime', '.mp4': 'video/mp4', '.js': 'text/javascript', '.jpg': 'image/jpeg' };

function send(res, code, body, headers = {}) { res.writeHead(code, headers); res.end(body); }

function serveFile(req, res, path) {
  let st;
  try { st = statSync(path); } catch { return send(res, 404, 'not found'); }
  const type = MIME[extname(path)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    let start = m[1] ? Number(m[1]) : 0;
    let end = m[2] ? Number(m[2]) : Math.min(start + 4 * 1024 * 1024, st.size - 1);
    end = Math.min(end, st.size - 1);
    res.writeHead(206, {
      'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
      'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1,
    });
    createReadStream(path, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    createReadStream(path).pipe(res);
  }
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/save') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const doc = JSON.parse(body);
        const target = join(projectDir, 'cuts.json');
        const baseLm = req.headers['x-base-lm'];
        if (baseLm && existsSync(target) && String(statSync(target).mtimeMs) !== baseLm) {
          return send(res, 409, '{"error":"cuts.json changed on disk, refresh the page"}', { 'Content-Type': 'application/json' });
        }
        if (existsSync(target)) copyFileSync(target, join(projectDir, 'cuts.backup.json'));
        writeFileSync(target, JSON.stringify(doc, null, 1));
        send(res, 200, JSON.stringify({ ok: true, lm: String(statSync(target).mtimeMs) }), { 'Content-Type': 'application/json' });
        console.log(`saved cuts.json (${doc.clips.filter((c) => c.keep).length} kept)`);
      } catch (e) { send(res, 400, JSON.stringify({ error: String(e) })); }
    });
    return;
  }
  if (url.pathname === '/cuts-meta') {
    return send(res, 200, JSON.stringify({ lm: String(statSync(join(projectDir, 'cuts.json')).mtimeMs) }), { 'Content-Type': 'application/json' });
  }
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (name.includes('..')) return send(res, 400, 'no');
  const fromProject = ['cuts.json', 'peaks.json', 'words.json', 'source.mov', 'spine.mp4', 'contact.jpg'];
  serveFile(req, res, fromProject.includes(name) ? join(projectDir, name) : join(reviewDir, name));
}).listen(port, () => console.log(`review: http://localhost:${port}  project: ${projectDir}`));
