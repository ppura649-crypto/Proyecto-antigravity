// What an item is called in the inspector and the add panel: by its type, never by the format that made it.
import { layers } from 'keyframes-layers';
import type { Item } from './types';

export const KIND_NAME: Record<Item['type'], string> = { video: 'Clip', audio: 'Sound', image: 'Picture', text: 'Text', caption: 'Captions', layer: 'Graphic' };

export function itemName(item: Item) {
  if (item.type === 'layer') return layers[item.renderer!]?.label?.(item) ?? item.label ?? 'Graphic';
  if (item.type === 'text') return item.text?.split('\n')[0] || 'Text';
  if (item.type === 'caption') return item.label || (item.words ?? []).slice(0, 5).map((w) => w.text).join(' ') || 'Captions';
  return item.label || (item.src ?? '').split('/').pop() || KIND_NAME[item.type];
}

export const kindIcon = (item: Item) => (item.type === 'layer' ? 'layer' : item.type === 'text' ? 'text' : item.type === 'caption' ? 'captions' : item.type === 'audio' ? 'sound' : item.type);
