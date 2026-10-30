// The Talking Head style the person picked once: Classic (the talking-head skill) or Split explainer (the
// split-explainer skill). The app reads it from workspace/library/talking-head.json; the agent reads the one
// sentence it leaves at the top of workspace/library/talking-head.preferences.md, which it reads before every video.
import { existsSync, readFileSync, realpathSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { talkingStyles as createdStyles } from './workspace-state.mjs';

export const talkingStyles = {
  classic: { name: 'Classic', skill: 'talking-head', line: 'Style: Classic. I talk the whole time and the visuals appear above me. Use the talking-head skill for my videos.' },
  split: { name: 'Split explainer', skill: 'split-explainer', line: 'Style: Split explainer. The screen splits between me and the visuals, and the visuals sometimes take the whole screen. Use the split-explainer skill for my videos.' },
};

export class TalkingStyleError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const atomic = (path, text) => {
  const temporary = path + '.' + randomUUID() + '.tmp';
  try { writeFileSync(temporary, text, { flag: 'wx' }); renameSync(temporary, path); } finally { rmSync(temporary, { force: true }); }
};

export function saveTalkingStyle(root, input) {
  root = realpathSync(root);
  const registry = JSON.parse(readFileSync(join(root, 'runtime.json'), 'utf8'));
  if (!registry.packs?.some((p) => p.name === 'talking-head')) throw new TalkingStyleError(400, 'Use the folder with Talking Head installed.');
  const style = input && typeof input === 'object' && !Array.isArray(input) ? input.style : null;
  const own = talkingStyles[style] ? null : createdStyles(root).find((t) => t.id === style);
  if (!talkingStyles[style] && !own) throw new TalkingStyleError(400, 'Pick one of the styles on this page.');
  const line = own ? `Style: ${own.name}. My own format, made with create-my-own. Use the ${own.skill} skill for my videos.` : talkingStyles[style].line;
  const library = join(root, 'workspace/library');
  mkdirSync(library, { recursive: true });
  const settingsPath = join(library, 'talking-head.json');
  let settings = {};
  try { settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {}; } catch { throw new TalkingStyleError(409, 'workspace/library/talking-head.json is not valid. Fix or remove it, then pick again.'); }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
  atomic(settingsPath, JSON.stringify({ ...settings, style }, null, 2) + '\n');
  // One sentence, rewritten in place: the preferences page holds what stays true, never a log.
  const pagePath = join(library, 'talking-head.preferences.md');
  const page = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : '# Talking Head preferences\n';
  const kept = page.split('\n').filter((l) => !/^Style: .*Use the [a-z0-9-]+ skill for my videos\.$/.test(l));
  const at = kept[0]?.startsWith('# ') ? 1 : 0;
  kept.splice(at, 0, '', line);
  atomic(pagePath, kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n'));
  return { ok: true, style };
}
