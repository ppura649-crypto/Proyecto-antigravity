#!/usr/bin/env node
// hooks/session-start.mjs
// Contract: ensure the buyer's local workspace is available and print its URL, then say when the account reading
//   is behind. Never open a browser or pull an account here. Registered by build-pack for each supported agent.
//   It used to pull thirty days of posts in the background instead. Two things were wrong with that. It read the
//   buyer's account without being asked, on a machine they had just opened; and it re-ran none of the readings, so it
//   left posts nothing had read and a formats grouping and a text budget measured before those posts existed, with
//   nobody able to notice. Refreshing is now something the buyer asks for, and asking runs the readings too.
import { existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { readJson } from "../scripts/_lib.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Hooks can run from a nested project. The installed hook itself identifies the buyer's folder.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
try {
  const url = execFileSync(process.execPath, [resolve(root, "scripts", "workspace.mjs"), "--ensure", "--no-open"], { cwd: root, encoding: "utf8", timeout: 15000 }).trim();
  if (url) console.log(`Your workspace: ${url}`);
} catch { console.log("The workspace could not open. For the agent: run node scripts/workspace.mjs --ensure --no-open again."); }

// An export the buyer asked for in the editor waits for the agent, even when they closed the chat before pasting it.
try {
  const { pendingExports } = await import("../scripts/edit-export.mjs");
  const waiting = pendingExports(root);
  if (waiting.length) console.log(`for the agent: ${waiting.length === 1 ? "an edited video is" : `${waiting.length} edited videos are`} waiting to export (${waiting.map((w) => w.project).join(", ")}). Read .agents/skills/edit/SKILL.md, then run node scripts/edit.mjs status and export each one.`);
} catch {}

const posts = resolve(root, "context", "posts.json");
const start = readJson(resolve(root, "context", "start.json"));
if (!start?.done || !existsSync(posts)) process.exit(0);
const age = Math.round((Date.now() - statSync(posts).mtimeMs) / 864e5);
let c;
try {
  c = JSON.parse(execFileSync(process.execPath, [resolve(root, "scripts", "context.mjs"), "--json"], { cwd: root, encoding: "utf8" }));
} catch { process.exit(0); }
// Two different things go out of date and they are fixed by two different hands. A reading a script makes is caught
// up by running the readings; a file the agent wrote from one of those readings has to be written again by the agent.
// Saying "say refresh" about the second would send the buyer to a command that cannot fix it.
const scripts = c.behind.length, written = c.written_behind.length;
if (!scripts && !written && age < 7) process.exit(0);
const lines = [];
if (scripts || age >= 7) lines.push(`${scripts ? `${scripts} reading${scripts === 1 ? " is" : "s are"} behind your posts` : `your posts were last read ${age} days ago`}. Say "refresh" to read your account again.`);
if (written) lines.push(`for the agent: ${c.written_behind.join(", ")} ${written === 1 ? "is" : "are"} older than the reading under ${written === 1 ? "it" : "them"}; write ${written === 1 ? "it" : "them"} again before writing anything from ${written === 1 ? "it" : "them"}.`);
console.log(lines.join("\n"));
