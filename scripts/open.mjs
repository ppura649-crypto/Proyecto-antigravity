#!/usr/bin/env node
// open.mjs <path>...
// Contract: opens each path with what the machine already uses: a folder in Finder or Explorer, a video in the default
//   player, a page in the browser. Prints one line per path. Exits 1 when a path does not exist, before opening any.
//   A format presents a version through here, right after its page: the folder, then the video, so the buyer sees the
//   thing itself and never only a path in chat. macOS, Windows and Linux.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fail, openPath } from "./_lib.mjs";

const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!paths.length) fail("usage: open.mjs <path>...");
const missing = paths.filter((p) => !existsSync(p));
if (missing.length) fail(`does not exist: ${missing.join(", ")}`);
openPath(...paths);
for (const p of paths) console.log(`opened: ${resolve(p)}`);
