#!/usr/bin/env node
// next.mjs [--json]
// Contract: says what happens now, across everything installed, so the buyer is never handed a menu and the agent never
//   chooses by hand. Reads context/start.json, runtime.json (the formats installed and what each says about going first
//   in its pack.json `first_run`), workspace/library/<pack>.json (setup and the stage its plan last wrote) and
//   (setup, the stage and the plan, all in the one file a format writes). The decision itself lives once, in
//   whatNext() of scripts/_lib.mjs, so the board and this
//   script can never disagree.
//   out: three lines on stdout, meant to be said and then run:
//        now: <the sentence to say to the buyer>
//        run: <the command to run in the same turn, or nothing>
//        why: <the format and where it is, for the agent, not for the buyer>
//        and, when other formats are installed and waiting, one line each saying why they wait.
//   --json prints the whole answer. Exits 0 always: this script answers, it never fails.
import { whatNext } from "./_lib.mjs";

const n = whatNext();
if (process.argv.includes("--json")) { console.log(JSON.stringify(n, null, 2)); process.exit(0); }
console.log(`now: ${n.say}`);
console.log(`run: ${n.run ?? ""}`);
console.log(`why: ${n.why}`);
for (const w of n.waiting) console.log(`wait: ${w.command ?? w.pack}${w.why ? ` (${w.why})` : ""}`);
