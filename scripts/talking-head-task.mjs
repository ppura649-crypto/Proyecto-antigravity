// Progress for actual Talking Head operations, shared by Node and Python commands.
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { beginTask } from './task-status.mjs';

export function beginTalkingHeadTask({ project, stage, label = 'Working on your Talking Head' }) {
  const dir = resolve(project);
  let root = dir;
  while (!existsSync(resolve(root, 'runtime.json')) && dirname(root) !== root) root = dirname(root);
  if (!existsSync(resolve(root, 'runtime.json'))) throw new Error('This video must live in a Keyframes folder.');
  const id = 'talking-head-' + createHash('sha256').update(dir).digest('hex').slice(0, 16);
  return beginTask({ root, id, label, project: basename(dir), format: 'talking-head', stage });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), option = name => args[args.indexOf(name) + 1];
  if (!args.includes('--project') || !args.includes('--stage')) throw new Error('Name the video and its current operation.');
  const task = beginTalkingHeadTask({ project: option('--project'), stage: option('--stage') });
  let finished = false;
  try {
    for await (const line of createInterface({ input: process.stdin })) {
      const message = JSON.parse(line);
      if (message.status === 'done' || message.status === 'error') {
        task[message.status](message.stage); finished = true; break;
      }
      task.update(message);
    }
  } catch (error) { task.error(error.message); finished = true; process.exitCode = 1; }
  finally { if (!finished) task.error('Stopped before finishing'); }
}
