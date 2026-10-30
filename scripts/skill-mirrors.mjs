import { readdirSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

function contents(directory) {
  const rows = [];
  function visit(path, prefix = '') {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.DS_Store') continue;
      const file = join(path, entry.name), name = prefix + entry.name;
      if (lstatSync(file).isSymbolicLink()) throw Error('Skill copies must be regular files.');
      if (entry.isDirectory()) visit(file, name + '/');
      else rows.push([name, createHash('sha256').update(readFileSync(file)).digest('hex')]);
    }
  }
  visit(directory);
  return JSON.stringify(rows);
}

export function skillMirrorMatches(source, mirror) {
  try { return contents(source) === contents(mirror); } catch { return false; }
}
