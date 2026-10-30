// Actual subprocess activity is exposed to the shared workspace task reader.
import {spawn} from 'node:child_process';
import path from 'node:path';
import {task,rootOf} from './lib.mjs';
const[project,stage,...command]=process.argv.slice(2);if(!project||!stage||!command.length)throw Error('run.mjs <project> <stage> <command> [arguments]');
const progress=await task(project,stage);const child=spawn(command[0],command.slice(1),{cwd:rootOf(project),stdio:'inherit'});
child.on('error',e=>{progress.error(e.message);process.exitCode=1});child.on('exit',code=>{if(code===0)progress.done(stage+' complete');else progress.error(stage+' failed');process.exitCode=code??1});
