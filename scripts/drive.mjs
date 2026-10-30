#!/usr/bin/env node
// drive.mjs connect [--no-wait] | pull "<folder name or id>" [--to <dir>] | list "<folder name or id>"
// Contract: reads the buyer's OWN Google Drive through Composio (the same connection flow as Instagram: an approval
//   page opens in the browser, the script waits for it, nothing is typed in chat). connect: makes the connection and
//   exits 0 when it is active (2 with --no-wait after printing the link). list: prints the files of one folder, found by
//   its name (the newest folder of that name when several exist) or its id. pull: downloads every file of that folder,
//   subfolders included, into --to (default workspace/input/drive/<folder name>/), skipping files already there with the
//   same size, and writes <dir>/drive.json ({ folder, id, files: [ { name, id, path, bytes, mime } ], pulled_at }).
//   Then sort.mjs reads the folder. Nothing is uploaded, moved or renamed on Drive. Tool names verified on the live
//   toolkit on 2026-09-04: GOOGLEDRIVE_FIND_FOLDER, GOOGLEDRIVE_LIST_FILES, GOOGLEDRIVE_DOWNLOAD_FILE. The download
//   comes back as a link or a local path depending on the size; both are handled. Exits 1 with the reason on failure.
import { P, writeJson, now, loadEnv, fail, slug } from "./_lib.mjs";
import { mkdirSync, existsSync, writeFileSync, statSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { exec as shell } from "node:child_process";

loadEnv();
process.env.COMPOSIO_LOG_LEVEL ??= "error";
const [cmd, target, ...rest] = process.argv.slice(2);
if (!cmd || !["connect", "pull", "list"].includes(cmd)) fail('usage: drive.mjs connect [--no-wait] | pull "<folder>" [--to <dir>] | list "<folder>"');
const opt = (k, d = null) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const apiKey = process.env.COMPOSIO_API_KEY;
if (!apiKey) fail("COMPOSIO_API_KEY missing; run: npm run keys");
const API = "https://backend.composio.dev/api/v3";
const userId = process.env.COMPOSIO_USER_ID || "keyframes-owner";
const H = { "x-api-key": apiKey, "content-type": "application/json" };
const api = async (path, init) => { const r = await fetch(`${API}${path}`, { headers: H, ...init }); return r.json(); };
const TOOLS = ["GOOGLEDRIVE_FIND_FOLDER", "GOOGLEDRIVE_LIST_FILES", "GOOGLEDRIVE_DOWNLOAD_FILE", "GOOGLEDRIVE_GET_FILE_METADATA"];

let Composio, SessionPreset;
try { ({ Composio, SessionPreset } = await import("@composio/core")); } catch { fail("@composio/core not installed; run: npm install"); }
const composio = new Composio({ apiKey });
const openSession = () => composio.create(userId, { toolkits: ["googledrive"], tools: { googledrive: TOOLS }, manageConnections: false, sessionPreset: SessionPreset.DIRECT_TOOLS });

async function active() { try { const j = await api(`/connected_accounts?user_ids=${encodeURIComponent(userId)}&toolkit_slugs=googledrive`); return (j.items ?? []).find((a) => a.status === "ACTIVE") ?? null; } catch { return null; } }
async function connect() {
  let ac = null;
  try { const j = await api("/auth_configs?toolkit_slug=googledrive"); ac = ((j.items ?? []).find((a) => a.status === "ENABLED") ?? (j.items ?? [])[0])?.id ?? null; } catch {}
  if (!ac) { try { const j = await api("/auth_configs", { method: "POST", body: JSON.stringify({ toolkit: { slug: "googledrive" }, auth_config: { type: "use_composio_managed_auth" } }) }); ac = j.auth_config?.id ?? j.id ?? null; } catch {} }
  if (!ac) fail("Google Drive is not connected and no connection could be prepared. Add the Google Drive toolkit in your Composio dashboard, then run again.");
  const link = await api("/connected_accounts/link", { method: "POST", body: JSON.stringify({ auth_config_id: ac, user_id: userId }) });
  if (!link.redirect_url) fail(`connection link failed: ${JSON.stringify(link).slice(0, 200)}`);
  const wait = !(rest.includes("--no-wait") || target === "--no-wait");
  console.log(`Google Drive is not connected yet. ${wait ? "A page opened in your browser; approve" : "Open this link and approve"} with the Google account that holds the folder. The link is valid for ten minutes:\n${link.redirect_url}`);
  if (!wait) process.exit(2);
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
  shell(`${opener} "${link.redirect_url}"`, () => {});
  console.log("waiting up to ten minutes for the approval...");
  for (let i = 0; i < 120; i++) { await new Promise((r) => setTimeout(r, 5000)); if (await active()) { console.log("connected"); return; } }
  fail("no approval after ten minutes; run again to get a new link");
}

if (cmd === "connect") { if (await active()) { console.log("Google Drive is connected"); process.exit(0); } await connect(); process.exit(0); }
if (!target) fail(`usage: drive.mjs ${cmd} "<folder name or id>"`);
if (!(await active())) await connect();
const session = await openSession();
const exec = async (tool, args) => { try { const r = await session.execute(tool, args); if (r?.error) throw new Error(JSON.stringify(r.error).slice(0, 300)); return r.data ?? r; } catch (e) { fail(`${tool} failed: ${String(e?.message ?? e).slice(0, 300)}`); } };

// The folder: an id when it looks like one, else the newest folder of that name.
const looksLikeId = /^[A-Za-z0-9_-]{20,}$/.test(target) && !target.includes(" ");
let folder = null;
if (looksLikeId) folder = { id: target, name: target };
else {
  const found = await exec("GOOGLEDRIVE_FIND_FOLDER", { folder_name: target });
  const list = found.files ?? found.folders ?? found.items ?? (Array.isArray(found) ? found : []);
  const hit = list.filter((f) => (f.name ?? "").toLowerCase() === target.toLowerCase()).sort((a, b) => String(b.modifiedTime ?? "").localeCompare(String(a.modifiedTime ?? "")))[0] ?? list[0];
  if (!hit) fail(`no folder named "${target}" in your Drive; check the name in Drive and say it again`);
  folder = { id: hit.id, name: hit.name ?? target };
}

// Every file under it, subfolders included.
async function walk(id, prefix = "") {
  const out = [];
  let pageToken = null;
  do {
    const r = await exec("GOOGLEDRIVE_LIST_FILES", { q: `'${id}' in parents and trashed = false`, page_size: 200, fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime)", ...(pageToken ? { page_token: pageToken } : {}) });
    const files = r.files ?? r.items ?? [];
    for (const f of files) {
      if (f.mimeType === "application/vnd.google-apps.folder") out.push(...(await walk(f.id, `${prefix}${f.name}/`)));
      else out.push({ id: f.id, name: f.name, mime: f.mimeType, bytes: Number(f.size ?? 0), path: `${prefix}${f.name}`, modified: f.modifiedTime ?? null });
    }
    pageToken = r.nextPageToken ?? null;
  } while (pageToken);
  return out;
}
const files = await walk(folder.id);
if (cmd === "list") { console.log(`${folder.name}: ${files.length} files`); for (const f of files) console.log(`  ${f.path}  ${f.bytes ? `${(f.bytes / 1e6).toFixed(1)} MB` : ""}  ${f.mime}`); process.exit(0); }

// pull: each file to the folder, skipping what is already there with the same size.
const dir = opt("--to") ?? P("workspace", "input", "drive", slug(folder.name, 60));
mkdirSync(dir, { recursive: true });
let pulled = 0, kept = 0, failed = 0;
for (const f of files) {
  const dest = join(dir, f.path);
  mkdirSync(join(dest, ".."), { recursive: true });
  if (existsSync(dest) && f.bytes && statSync(dest).size === f.bytes) { kept++; continue; }
  try {
    const r = await exec("GOOGLEDRIVE_DOWNLOAD_FILE", { file_id: f.id });
    const file = r.file ?? r.downloaded_file ?? r;
    const url = file?.s3url ?? file?.url ?? file?.download_url ?? null;
    const local = file?.path ?? file?.file_path ?? file?.local_path ?? null;
    if (local && existsSync(local)) copyFileSync(local, dest);
    else if (url) { const res = await fetch(url); if (!res.ok) throw new Error(`download ${res.status}`); writeFileSync(dest, Buffer.from(await res.arrayBuffer())); }
    else if (typeof file?.content === "string") writeFileSync(dest, Buffer.from(file.content, file.encoding === "base64" ? "base64" : "utf8"));
    else throw new Error(`no file in the answer: ${JSON.stringify(r).slice(0, 160)}`);
    pulled++; console.log(`  pulled ${f.path}`);
  } catch (e) { failed++; console.log(`  failed ${f.path}: ${String(e?.message ?? e).slice(0, 160)}`); }
}
writeJson(join(dir, "drive.json"), { folder: folder.name, id: folder.id, files: files.map((f) => ({ ...f, local: join(dir, f.path) })), pulled_at: now() });
console.log(`drive: ${folder.name}: ${pulled} pulled, ${kept} already here, ${failed} failed -> ${dir}`);
if (failed) process.exit(1);
