#!/usr/bin/env node
// The few file steps of a video, the same on every system (no mkdir -p, cp, echo or find of a shell).
// Usage, from engine/talking-head:
//   node scripts/files.mjs mkdir <dir>...                 make the folders, with their parents (mkdir -p)
//   node scripts/files.mjs cp <from> <to>                 copy one file; <to> may be a folder (cp); a leading ~ is home
//   node scripts/files.mjs project <project_dir> <take>   write project.json {"format": "talking-head", "source": <take>}
//   node scripts/files.mjs output <project_dir> <file>    copy a delivered file to ../../workspace/output/<project folder name>/
//   node scripts/files.mjs clean                          delete the render bundles Remotion leaves in the temp folder
// Exits 1 with the reason on stderr when a step cannot be done.
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const [verb, ...args] = process.argv.slice(2);
const home = (p) => (p === "~" ? homedir() : /^~[\\/]/.test(p) ? join(homedir(), p.slice(2)) : p);
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const fail = (m) => { console.error(m); process.exit(1); };
const cp = (from, to) => {
  from = home(from); to = home(to);
  const dest = isDir(to) || /[\\/]$/.test(to) ? join(to, basename(from)) : to;
  try { copyFileSync(from, dest); } catch (e) { fail(`cp: ${e.message}`); }
  return dest;
};

if (verb === "mkdir" && args.length) for (const d of args) mkdirSync(home(d), { recursive: true });
else if (verb === "cp" && args.length === 2) cp(args[0], args[1]);
else if (verb === "project" && args.length === 2) {
  // the same line `echo '{"format": "talking-head", "source": "..."}'` wrote, with the path escaped as JSON needs
  writeFileSync(join(home(args[0]), "project.json"), `{"format": "talking-head", "source": ${JSON.stringify(home(args[1]))}}\n`);
}
else if (verb === "output" && args.length === 2) {
  const dir = resolve("../../workspace/output", basename(resolve(home(args[0]))));
  mkdirSync(dir, { recursive: true });
  console.log(cp(args[1], dir + "/"));
}
else if (verb === "clean" && !args.length) {
  const dir = tmpdir();
  for (const e of readdirSync(dir)) if (e.startsWith("remotion-webpack-bundle-")) rmSync(join(dir, e), { recursive: true, force: true });
}
else fail("usage: files.mjs mkdir <dir>... | cp <from> <to> | project <project_dir> <take> | output <project_dir> <file> | clean");
