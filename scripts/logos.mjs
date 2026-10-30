#!/usr/bin/env node
// logos.mjs <domain or url> [<domain> ...] [--out workspace/library/logos] [--size 256]
// Contract: fetches a tool's icon from the internet, so nobody is asked for a logo. For each domain, in order: logo.dev
//   when LOGO_DEV_KEY is in .env.local (a free account at logo.dev; the buyer adds the key on the keys page with
//   `npm run keys -- --keys LOGO_DEV_KEY`), else Google's favicon service at --size, else DuckDuckGo's icon service.
//   Writes workspace/library/logos/<domain>.png (or .ico when that is all there is) and prints one line per domain with
//   the source used. A domain is what a tool's site is, not its name: github.com/KittenML is github.com; the research
//   skill finds the site first. Exits 1 when nothing came back for any domain.
import { P, loadEnv, fail } from "./_lib.mjs";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

loadEnv();
const args = process.argv.slice(2);
const targets = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--out" && args[i - 1] !== "--size");
if (!targets.length) fail("usage: logos.mjs <domain or url> [<domain> ...] [--out workspace/library/logos] [--size 256]");
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : P("workspace", "library", "logos");
const size = Number(args.includes("--size") ? args[args.indexOf("--size") + 1] : 256);
mkdirSync(outDir, { recursive: true });
const key = process.env.LOGO_DEV_KEY;
const domainOf = (t) => { try { return new URL(/^https?:/.test(t) ? t : `https://${t}`).hostname.replace(/^www\./, ""); } catch { return t.replace(/^www\./, ""); } };

async function get(url) { try { const r = await fetch(url, { headers: { "user-agent": "Keyframes/0.1" } }); if (!r.ok) return null; const buf = Buffer.from(await r.arrayBuffer()); return buf.length > 200 ? { buf, type: r.headers.get("content-type") ?? "" } : null; } catch { return null; } }
let ok = 0;
for (const t of targets) {
  const d = domainOf(t);
  const tries = [
    ...(key ? [{ src: "logo.dev", url: `https://img.logo.dev/${d}?token=${encodeURIComponent(key)}&size=${size}&format=png` }] : []),
    { src: "google favicons", url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${size}` },
    { src: "duckduckgo icons", url: `https://icons.duckduckgo.com/ip3/${d}.ico` },
  ];
  let got = null;
  for (const tr of tries) { got = await get(tr.url); if (got) { got.src = tr.src; break; } }
  if (!got) { console.log(`  ${d}: nothing came back`); continue; }
  const ext = /png/.test(got.type) ? "png" : /jpe?g/.test(got.type) ? "jpg" : /svg/.test(got.type) ? "svg" : /ico/.test(got.type) ? "ico" : "png";
  const out = join(outDir, `${d}.${ext}`);
  writeFileSync(out, got.buf); ok++;
  console.log(`  ${d}: ${got.src}, ${got.buf.length} bytes -> ${out.replace(P() + "/", "")}`);
}
if (!ok) process.exit(1);
