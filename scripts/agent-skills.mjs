#!/usr/bin/env node
// agent-skills.mjs [--json]
// Contract: offline check of the installed skills and agent entry points. Prints { ok, skills, issues }.
// A missing canonical skill fails even when every remaining mirror agrees. Does not start an agent or browser.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skillMirrorMatches } from './skill-mirrors.mjs';

export const SHARED_SKILLS = ['start', 'add', 'setup', 'stages', 'research', 'captions', 'footage', 'measuring'];

export function checkAgentSkills(root) {
  const issues = [];
  const read = path => { try { return readFileSync(join(root, path), 'utf8'); } catch { return ''; } };
  const json = path => { try { return JSON.parse(read(path)); } catch { issues.push(`${path}: missing or invalid JSON`); return {}; } };
  const registry = json('runtime.json');
  const directory = join(root, '.agents/skills');
  const skills = existsSync(directory) ? readdirSync(directory, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort() : [];
  const expected = new Set(SHARED_SKILLS);
  for (const pack of registry.packs ?? []) {
    expected.add(String(pack.command || pack.name).replace(/^[/\$]/, ''));
    const record = json(`.installed/${pack.name}.json`);
    for (const path of record.files ?? []) if (path.startsWith('.agents/skills/')) expected.add(path.split('/')[2]);
  }
  for (const name of new Set([...expected, ...skills])) {
    const path = `.agents/skills/${name}/SKILL.md`, text = read(path);
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!text) issues.push(`${path}: missing skill`);
    else if (!frontmatter || !/^name:\s*\S/m.test(frontmatter) || !/^description:\s*\S/m.test(frontmatter)) issues.push(`${path}: missing skill metadata`);
    else {
      // Shipped descriptions are one-line YAML scalars. A bare colon followed by a space turns
      // prose into an invalid mapping, which strict skill loaders silently omit from discovery.
      const description = frontmatter.match(/^description:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
      if (/[<>]/.test(description)) issues.push(`${path}: remove angle brackets from skill metadata`);
      if (description.startsWith('"')) {
        try { if (typeof JSON.parse(description) !== 'string') throw Error(); }
        catch { issues.push(`${path}: invalid quoted description`); }
      } else if (!description.startsWith("'") && /:(?:\s|$)/.test(description)) issues.push(`${path}: quote the description so its colon is valid YAML`);
      const declared = frontmatter.match(/^name:[ \t]*([a-z0-9-]+)[ \t]*$/m)?.[1];
      if (declared !== name) issues.push(`${path}: skill name must match its folder`);
    }
  }
  for (const agent of ['.claude', '.grok']) for (const name of skills) {
    if (!skillMirrorMatches(join(directory, name), join(root, agent, 'skills', name))) issues.push(`${agent}/skills/${name}: missing or outdated copy`);
  }
  if (read('CLAUDE.md').trim() !== '@AGENTS.md') issues.push('CLAUDE.md: must import AGENTS.md');
  if (!read('AGENTS.md').includes('hooks/session-start.mjs')) issues.push('AGENTS.md: missing session startup fallback');
  for (const file of ['hooks/session-start.mjs', 'hooks/session-start-json.mjs']) if (!read(file)) issues.push(`${file}: missing startup script`);
  for (const [file, event, command, nested] of [
    ['.claude/settings.json', 'SessionStart', 'node hooks/session-start.mjs', true],
    ['.grok/hooks/session-start.json', 'SessionStart', 'node hooks/session-start.mjs', true],
    ['.gemini/settings.json', 'SessionStart', 'node hooks/session-start-json.mjs', true],
    ['.cursor/hooks.json', 'sessionStart', 'node hooks/session-start-json.mjs --cursor', false],
  ]) {
    const settings = json(file);
    const entries = settings.hooks?.[event];
    const hooks = Array.isArray(entries) ? (nested ? entries.flatMap(e => Array.isArray(e.hooks) ? e.hooks : []) : entries) : [];
    if (!hooks.some(h => h.command === command && (!nested || h.type === 'command'))) issues.push(`${file}: missing session startup command`);
    if (file.startsWith('.gemini')) {
      const names = settings.context?.fileName;
      if (!(Array.isArray(names) ? names : [names]).includes('AGENTS.md')) issues.push(`${file}: context.fileName must include AGENTS.md`);
    }
  }
  return { ok: issues.length === 0, skills, issues };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkAgentSkills(process.cwd());
  console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : result.ok ? `${result.skills.length} skills and agent entry points checked` : result.issues.join('\n'));
  process.exitCode = result.ok ? 0 : 1;
}
