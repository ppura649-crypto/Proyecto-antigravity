// Work only the agent can do. A pack's look or graphic may register `agent(item)`: given an item as the buyer left it,
// it returns { task, note, ref?, request?, done? } when the change needs the agent before the export (Trial Reels words
// that must be set again in the creator's own letters), or null. Every change the editor commits passes through
// withAgent, so the saved document always says what waits; the export refuses while any item carries `agent`, and
// `edit.mjs resolve` clears it once the agent has done it. `by` records which look asked, so a look that no longer
// asks (the words were put back) clears only its own request, never one a reader wrote.
import { captionLooks, layers, textLooks } from 'keyframes-layers';
import type { Doc, Item } from './types';

type Asker = { id: string; agent: (item: Item) => any };

function askerOf(item: Item): Asker | null {
  const look = item.type === 'text' ? item.style?.look : item.type === 'caption' ? item.style?.look : item.type === 'layer' ? item.renderer : null;
  if (!look) return null;
  const registry: Record<string, any> = (item.type === 'text' ? textLooks : item.type === 'caption' ? captionLooks : layers) ?? {};
  const fn = registry[look]?.agent;
  return typeof fn === 'function' ? { id: look, agent: fn } : null;
}

export function withAgent(doc: Doc): Doc {
  let changed = false;
  const items = doc.items.map((item) => {
    const asker = askerOf(item);
    const current = (item as any).agent ?? null;
    let wanted = current;
    if (asker) {
      const asked = asker.agent(item);
      wanted = asked ? { ...asked, by: asker.id } : null;
    } else if (current?.by) wanted = null; // the look that asked is gone from this item
    if (JSON.stringify(wanted) === JSON.stringify(current)) return item;
    changed = true;
    const { agent, ...rest } = item as any;
    return wanted ? { ...rest, agent: wanted } : rest;
  });
  return changed ? { ...doc, items } : doc;
}
