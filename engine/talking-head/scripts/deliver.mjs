#!/usr/bin/env node
// Deliver a project's render to ~/Downloads. The Node form of deliver.sh, step for step, for every system:
// same arguments, same checks in the same order, same messages, same files, same exit codes.
// Refuses a stale render, an existing name, and a file identical to an earlier version (a failed render's old
// captioned.mp4 was once ramped and shipped as the next version). The ramp comes from format.json
// {"ramp":{"hookEndS","rate"}} or ramp.json next to it; no ramp = straight copy. No project carries one
// ("don't sped up pls. Don't do that"): hook_build.py check refuses a ramp before this runs. Optional check frames
// from the DELIVERED file land in <project>/checks/.
// Usage: node scripts/deliver.mjs <project_dir> <downloads-name-without-ext> [seconds,seconds,...]
import { copyFileSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, closeSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { HERE, PyFloat, folder, parsePy, pyRepr, pyStr, pyTrue, python, runFf } from "./_run.mjs";

const argv = process.argv.slice(2);
for (const i of [0, 1]) if (argv[i] === undefined) { console.error(`deliver.mjs: $${i + 1}: unbound variable`); process.exit(1); }   // set -u
const P = folder(argv[0]) ?? (console.error(`cd: ${argv[0]}: No such file or directory`), "");
const NAME = argv[1] ?? "", SECS = argv[2] ?? "";
const R = resolve(HERE, "../remotion");
const SRC = process.env.SRC || `${P}/captioned.mp4`;   // SRC=... for a partial render
const OUT = `${homedir()}/Downloads/${NAME}.mp4`;
const isFile = (f) => { try { return statSync(f).isFile(); } catch { return false; } };
const isDir = (f) => { try { return statSync(f).isDirectory(); } catch { return false; } };
const step = (r) => r.status ?? 1;
if (!isFile(SRC)) { console.log(`no render at ${SRC}`); process.exit(1); }

// 0. approved layers are locked, the hook agrees with hook.json, the visual lint passes.
//    (every hook regression and the "i didn't mean all the cards" round were changes that reached an approved
//    layer from somewhere else. A delivery that carries one stops here.)
const S = HERE;
if (step(python(join(S, "lock_layer.py"), ["check", P], { stdio: "inherit" })) !== 0) process.exit(1);
if (isFile(`${P}/hook.json`) && step(python(join(S, "hook_build.py"), ["check", P], { stdio: "inherit" })) !== 0) process.exit(1);
//    a project older than hook.json still gets the one hook law that is mechanical: the title is whole on frame 0,
//    and no speed-up, ever: hook_build.py refuses one, but a project older than hook.json only meets this here.
try {
  const c = parsePy(readFileSync(join(P, "captions.json"), "utf8"));
  const t = c.pages.find((p) => p.type === "title");
  if (t && ("reveal" in t ? t.reveal : "none") !== "none") {
    console.error(`title page reveals '${pyStr(t.reveal)}': the hook is complete at frame 0 ` +
      `(02h-hook.md). Set reveal 'none' in caption-plan.json and in captions.json.`);
    process.exit(1);
  }
  for (const f of ["format.json", "ramp.json"]) {
    const fp = join(P, f);
    if (!existsSync(fp)) continue;
    const d = parsePy(readFileSync(fp, "utf8"));
    const r = d && "ramp" in d ? d.ramp : (f === "ramp.json" ? d : null);
    const rate = r && typeof r === "object" && "rate" in r ? r.rate : 1;
    const one = rate === 1 || rate === true || (rate instanceof PyFloat && rate.v === 1);   // Python's rate != 1
    if (pyTrue(r) && !one) {
      console.error(`${f} carries a speed ramp ${pyRepr(r)}: talking-head plays at 1x from frame 0. Delete it.`);
      process.exit(1);
    }
  }
} catch (e) { console.error(`${e.name}: ${e.message}`); process.exit(1); }
if (existsSync(`${P}/visuals.json`)) {
  if (isDir(`${P}/.locks/visuals`)) python(join(S, "lock_layer.py"), ["diff", P, "visuals"], { stdio: "inherit" });
  if ((process.env.LINT ?? "") !== "skip") {
    if (step(python(join(S, "lint_visuals.py"), [P], { stdio: "inherit" })) !== 0) {
      console.log("visual lint failed (LINT=skip <reason in chat> to ship anyway)"); process.exit(1);
    }
  } else {
    console.log("LINT=skip: visual lint bypassed, say why in chat");
  }
}

// 1. the render must be newer than everything that feeds it (their format file included)
const since = (() => { try { return lstatSync(SRC, { bigint: true }).mtimeNs; } catch { return null; } })();
const stale = [];
const newer = (f) => {
  let st; try { st = lstatSync(f, { bigint: true }); } catch { return; }
  if (since !== null && st.mtimeNs > since) stale.push(f);
  if (st.isDirectory()) for (const e of readdirSync(f)) newer(`${f}/${e}`);
};
for (const f of [`${P}/captions.json`, `${P}/visuals.json`, `${P}/format.json`, `${P}/master.mp4`, `${R}/src`, `${R}/../formats/creator-format-1.json`]) newer(f);
if (stale.length) { console.log("STALE render, these are newer than captioned.mp4:"); console.log(stale.join("\n")); process.exit(1); }

// 2. versions never overwrite
if (existsSync(OUT)) { console.log(`exists: ${OUT}, pick a new version name`); process.exit(1); }

// 3. ramp
let HOOK = "", RATE = "";
try {
  let r = null;
  for (const f of ["format.json", "ramp.json"]) {
    const fp = join(P, f);
    if (existsSync(fp)) {
      const d = parsePy(readFileSync(fp, "utf8")); r = d && "ramp" in d ? d.ramp : (f === "ramp.json" ? d : null);
      if (pyTrue(r)) break;
    }
  }
  if (pyTrue(r)) {
    if (!("hookEndS" in r) || !("rate" in r)) throw new Error(`KeyError: '${"hookEndS" in r ? "rate" : "hookEndS"}'`);
    [HOOK, RATE] = [pyStr(r.hookEndS), pyStr(r.rate)];
  } else [HOOK, RATE] = ["0", "1"];
} catch (e) { console.error(e.message); }
const copy = (from, to) => { try { copyFileSync(from, to); } catch (e) { console.error(`cp: ${e.message}`); } };
if (HOOK !== "0" && !process.env.NORAMP) {   // NORAMP=1 when SRC is already ramped
  const r = runFf("ffmpeg", ["-y", "-v", "error", "-i", SRC, "-filter_complex",
    `[0:v]trim=0:${HOOK},setpts=(PTS-STARTPTS)/${RATE}[v1];[0:a]atrim=0:${HOOK},asetpts=PTS-STARTPTS,atempo=${RATE}[a1];[0:v]trim=${HOOK},setpts=PTS-STARTPTS[v2];[0:a]atrim=${HOOK},asetpts=PTS-STARTPTS[a2];[v1][a1][v2][a2]concat=n=2:v=1:a=1[v][a]`,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
    `${P}/full-overlay-ramp.mp4`], { stdio: "inherit" });
  if (step(r) !== 0) process.exit(1);
  copy(`${P}/full-overlay-ramp.mp4`, OUT);
} else {
  copy(SRC, OUT);
}

// 4. must differ from every earlier version under the same name
const same = (a, b) => {
  if (statSync(a).size !== statSync(b).size) return false;
  const fa = openSync(a, "r"), fb = openSync(b, "r"), ba = Buffer.alloc(1 << 20), bb = Buffer.alloc(1 << 20);
  try {
    for (;;) {
      const na = readSync(fa, ba, 0, ba.length, null), nb = readSync(fb, bb, 0, bb.length, null);
      if (na !== nb || !ba.subarray(0, na).equals(bb.subarray(0, nb))) return false;
      if (na === 0) return true;
    }
  } finally { closeSync(fa); closeSync(fb); }
};
const cut = NAME.lastIndexOf("-v");
const PREFIX = cut < 0 ? NAME : NAME.slice(0, cut);
const downloads = `${homedir()}/Downloads`;
const earlier = (() => { try { return readdirSync(downloads).filter((n) => n.startsWith(`${PREFIX}-v`) && n.endsWith(".mp4") && n.length >= PREFIX.length + 6).sort(); } catch { return []; } })();
for (const n of earlier) {
  const f = `${downloads}/${n}`;
  if (!isFile(f) || f === OUT) continue;
  if (isFile(OUT) && same(f, OUT)) { rmSync(OUT, { force: true }); console.log(`IDENTICAL to ${f}, not delivered`); process.exit(1); }
}

// 5. check frames from the delivered file
if (SECS) {
  mkdirSync(`${P}/checks`, { recursive: true });
  for (const s of SECS.split(/[,\s]+/).filter(Boolean)) {
    const r = runFf("ffmpeg", ["-y", "-v", "error", "-ss", s, "-i", OUT, "-frames:v", "1", `${P}/checks/${NAME}-${s}.png`], { stdio: "inherit" });
    if (r.status === 0) console.log(`check: ${P}/checks/${NAME}-${s}.png`);
  }
}
const d = runFf("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", OUT], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
console.log(`Delivered: ${OUT} (${String(d.stdout ?? "").replace(/\n+$/, "")} s)`);
