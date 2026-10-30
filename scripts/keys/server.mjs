#!/usr/bin/env node
// keys/server.mjs [--keys NAME,NAME] [--voice openai|elevenlabs|fish] [--no-open]
// Contract: opens a one-shot local page on a random port, listing the keys the installed packs need
//   (plus any passed with --keys), writes the submitted values to .env.local (merging, never echoing), then exits.
//   Prints the URL. Exits 0 after one successful submit, 1 on error. Values never appear on stdout.
//   Each key is described on the page in the buyer's words: what it is for, and the numbered steps that get one,
//   with the links to click. A key with no entry in KEYS still gets a field, named by the pack that asked for it.
import { createServer } from "node:http";
import { readFileSync, existsSync, writeFileSync, lstatSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exec } from "node:child_process";
import { P, installedPacks, loadEnvNames, pageShell } from "../_lib.mjs";
import {productVoiceProviders} from '../workspace-ui/product-demo-voice.js';
import {productVoiceStatus} from '../product-demo-voice.mjs';

// What every key is and how to get one, in the words the buyer reads. Never the words we use here.
const KEYS = {
  COMPOSIO_API_KEY: {
    title: "The key that reads your account",
    what: "Composio connects your own account. Keyframes only reads it.",
    // Two steps, each one a real address the buyer can read before it opens. There is no third step saying to paste it:
    // the field is the next thing on the page.
    steps: [
      { do: "Sign up", link: "https://composio.dev" },
      { do: "Open API Keys", detail: "Choose your workspace and project, then API Keys. Create a key and copy it.", link: "https://dashboard.composio.dev" },
    ],
  },
  // Optional, never required: asked for only when a long clip transcribes slowly on this machine
  // (scripts/keys/server.mjs --keys OPENAI_API_KEY). With it, the words come from OpenAI in seconds.
  OPENAI_API_KEY: {
    title: "Faster transcription, optional",
    what: "With this key a long clip is transcribed in seconds instead of minutes. About a cent per minute of clip. The audio leaves your machine for that call and nothing else. Without it everything still works.",
    steps: [
      { do: "Sign in", link: "https://platform.openai.com" },
      { do: "Open API keys", detail: "Create a key and copy it.", link: "https://platform.openai.com/api-keys" },
    ],
  },
};

const here = dirname(fileURLToPath(import.meta.url));
const flag = process.argv.indexOf("--keys");
const extra = (flag >= 0 ? process.argv[flag + 1] ?? "" : "").split(",").filter(Boolean);
const voiceFlag=process.argv.indexOf('--voice');
const voice=voiceFlag>=0?productVoiceProviders.find(p=>p.id===process.argv[voiceFlag+1]&&p.key):null;
if(voiceFlag>=0&&!voice){console.error('Choose openai, elevenlabs or fish for the voice key page.');process.exit(1);}
if(voice)KEYS[voice.key]={title:voice.name+' voiceover',what:'Your film’s AI narration uses '+voice.name+'. '+voice.note,steps:[{do:'Open API keys',detail:'Create a key for this folder.',link:voice.url}]};
const packs=installedPacks();
const need = new Set(voice?[voice.key]:[...(packs.some(p=>p.needs?.account!==false)?['COMPOSIO_API_KEY']:[]), ...extra]);
const asked = new Map();
if(!voice)for (const p of packs) for (const k of (Array.isArray(p.needs?.keys) ? p.needs.keys : Object.keys(p.needs?.keys ?? {}))) { need.add(k); if (!asked.has(k)) asked.set(k, p.name); }
const have = new Set(loadEnvNames());
if(voice&&productVoiceStatus(process.cwd()).keys[voice.id])have.add(voice.key);

// A key the buyer already has elsewhere on this machine: say where it is, never read the value into the folder.
function foundElsewhere(name) {
  if (name !== "COMPOSIO_API_KEY" || have.has(name)) return null;
  if (process.env.COMPOSIO_API_KEY) return "the shell you are running this from";
  const home = process.env.HOME || process.env.USERPROFILE || "";
  for (const f of [".claude.json", ".mcp.json", ".codex/config.toml", ".grok/config.toml", ".cursor/mcp.json", ".gemini/settings.json", ".composio/user_data.json"]) {
    try { if (existsSync(join(home, f)) && /composio/i.test(readFileSync(join(home, f), "utf8"))) return `~/${f}`; } catch {}
  }
  return null;
}

const fields = [...need].map((name) => ({
  name, present: have.has(name), found: foundElsewhere(name),
  ...(KEYS[name] ?? { title: name, what: `${asked.get(name) ?? "A format you installed"} needs this key.`, steps: [] }),
}));
const html = pageShell("Your keys", readFileSync(join(here, "index.html"), "utf8").replace("__FIELDS__", JSON.stringify(fields)));

function merge(values) {
  const path = P(".env.local");
  if(existsSync(path)&&lstatSync(path).isSymbolicLink())throw Error('Keep keys in this folder.');
  const lines = existsSync(path) ? readFileSync(path, "utf8").split("\n") : [];
  const seen = new Set();
  const out = lines.map((l) => { const m = /^([A-Z0-9_]+)=/.exec(l); if (m && values[m[1]] !== undefined && values[m[1]] !== "") { seen.add(m[1]); return `${m[1]}=${values[m[1]]}`; } return l; });
  for (const [k, v] of Object.entries(values)) if (!seen.has(k) && v) out.push(`${k}=${v}`);
  writeFileSync(path, out.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
  chmodSync(path,0o600);
}

const server = createServer((req, res) => {
  const host=`127.0.0.1:${server.address().port}`;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
  if(req.headers.host!==host||(req.headers.origin&&req.headers.origin!==`http://${host}`)){res.writeHead(403);return res.end('Open your local key page.');}
  if (req.method === "GET") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(html); }
  if(req.method!=='POST'||req.headers.origin!==`http://${host}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){res.writeHead(403);return res.end('Save from your local key page.');}
  let body = "",size=0; req.on("data", (c) => {size+=c.length;if(size>32768){res.writeHead(413);res.end('Too much text.');req.destroy();return;}body+=c;});
  req.on("end", () => {
    try {
      const values = JSON.parse(body);
      if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid keys.');
      for (const k of Object.keys(values)) if (!need.has(k)) delete values[k];
      for(const value of Object.values(values))if(typeof value!=='string'||value.length>8192||/[\r\n\0]/.test(value))throw Error('Invalid key.');
      merge(values);
      res.writeHead(200, { "content-type": "text/plain" }); res.end("saved");
      console.log(`saved ${Object.keys(values).filter((k) => values[k]).length} key(s) to .env.local`);
      setTimeout(() => { server.close(); process.exit(0); }, 300);
    } catch (e) { res.writeHead(400); res.end("bad request"); }
  });
});
server.listen(0, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`keys page: ${url}`);
  const open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
  if(!process.argv.includes('--no-open'))exec(`${open} ${url}`, () => {});
});
