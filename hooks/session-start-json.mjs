#!/usr/bin/env node
// Gemini and Cursor hooks require JSON, with different fields for the same startup context.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let additionalContext;
try {
  additionalContext = execFileSync(process.execPath, [fileURLToPath(new URL('./session-start.mjs', import.meta.url))], { encoding: 'utf8', timeout: 30000 }).trim();
} catch {
  additionalContext = 'For the agent: run node hooks/session-start.mjs to open the local workspace.';
}
console.log(JSON.stringify(process.argv.includes('--cursor')
  ? { additional_context: additionalContext }
  : { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext } }));
