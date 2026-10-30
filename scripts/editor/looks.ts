// The looks the editor ships, and every look the installed packs add. A look is what picking it writes onto an item:
// a font, a size, colours, a box, an animation, and for a pack's look the component that draws it. The Add panel and
// the inspector list the same looks for every video, whatever format made it.
import { captionLooks, textLooks } from 'keyframes-layers';
import type { Item, TextStyle, Transform } from './types';

export type Look = { id: string; label: string; style: TextStyle; text?: string; y?: number; installed?: boolean };

// Words placed by hand. y is where the block sits, as a share of the height from the middle (negative is higher).
export const TEXT_PRESETS: Look[] = [
  { id: 'title', label: 'Title', text: 'Big title', y: -0.3, style: { font: 'montserrat', size: 112, weight: 900, color: '#FFFFFF', caps: true, shadow: true, maxWidth: 0.86 } },
  { id: 'subtitle', label: 'Subtitle', text: 'A short line under it', y: -0.18, style: { font: 'inter', size: 58, weight: 600, color: '#FFFFFF', shadow: true, maxWidth: 0.8 } },
  { id: 'label', label: 'Label', text: 'NEW', y: -0.36, style: { font: 'inter', size: 46, weight: 800, color: '#111111', background: '#FFFFFF', caps: true, shadow: false } },
  { id: 'hook', label: 'Hook', text: 'Nobody tells you this', y: -0.26, style: { font: 'poppins', size: 66, weight: 700, color: '#FFFFFF', stroke: '#000000', shadow: false, maxWidth: 0.82 } },
  { id: 'cta', label: 'Call to action', text: 'Comment GUIDE', y: 0.2, style: { font: 'sora', size: 54, weight: 800, color: '#111111', background: '#FFE14D', shadow: false } },
  { id: 'serif', label: 'Quote', text: 'Less, but better.', y: 0, style: { font: 'dmserif', size: 84, weight: 400, color: '#FFFFFF', shadow: true, maxWidth: 0.8 } },
];

// Spoken words. y here is where the caption block's middle sits, as a share of the height from the top.
export const CAPTION_PRESETS: Look[] = [
  { id: 'clean', label: 'Clean', style: { font: 'inter', size: 64, weight: 800, color: '#FFFFFF', activeColor: '#FFE14D', shadow: true, animation: 'none', wordsPerPage: 3, y: 0.7 } },
  { id: 'pop', label: 'Pop', style: { font: 'montserrat', size: 76, weight: 900, color: '#FFFFFF', activeColor: '#FFE14D', stroke: '#000000', caps: true, animation: 'pop', wordsPerPage: 2, y: 0.68 } },
  { id: 'karaoke', label: 'Karaoke', style: { font: 'poppins', size: 64, weight: 800, color: 'rgba(255,255,255,0.55)', activeColor: '#FFFFFF', shadow: true, animation: 'karaoke', wordsPerPage: 4, y: 0.72 } },
  { id: 'word', label: 'One word', style: { font: 'anton', size: 120, weight: 400, color: '#FFFFFF', activeColor: '#FFFFFF', stroke: '#000000', caps: true, animation: 'word', wordsPerPage: 1, y: 0.62 } },
  { id: 'boxed', label: 'Boxed', style: { font: 'inter', size: 54, weight: 700, color: '#111111', activeColor: '#DE3C18', background: '#FFFFFF', animation: 'none', wordsPerPage: 4, y: 0.74 } },
];

// A look marked `hidden` draws the items a reader gave it but is not offered to pick (Trial Reels' own letters: words
// that are pixels of the video, which no other text can wear).
const installed = (registry: Record<string, any>): Look[] =>
  Object.entries(registry ?? {}).filter(([, look]) => !look?.hidden).map(([id, look]) => ({ id, label: look.label ?? id.split('/').pop(), style: { ...(look.style ?? {}), look: id }, text: look.text, installed: true }));

export const allTextLooks = () => [...TEXT_PRESETS, ...installed(textLooks)];
export const allCaptionLooks = () => [...CAPTION_PRESETS, ...installed(captionLooks)];

// Native drawings expose only the fields they implement. A visible control must change the picture.
export function supportsStyle(style: TextStyle | undefined, key: keyof TextStyle, caption: boolean) {
  const look = style?.look ? (caption ? captionLooks : textLooks)[style.look] : null;
  return !look?.draw || (look.styleControls ?? []).includes(key);
}

export function lookFonts(style: TextStyle | undefined, caption: boolean): string[] | undefined {
  return style?.look ? (caption ? captionLooks : textLooks)[style.look]?.fonts : undefined;
}

export { applyLook } from './looks-core.mjs';

// Which look an item wears: the pack's by id, otherwise the built-in whose font and animation it matches.
export function currentLook(style: TextStyle | undefined, looks: Look[]) {
  if (style?.look) return looks.find((l) => l.id === style.look) ?? null;
  return looks.find((l) => !l.installed && l.style.font === style?.font && (l.style.animation ?? 'none') === (style?.animation ?? 'none') && (l.style.background ?? '') === (style?.background ?? '')) ?? null;
}

export const presetTransform = (look: Look, height: number): Partial<Transform> => ({ x: 0, y: Math.round((look.y ?? 0) * height), scale: 1, rotation: 0, opacity: 1 });
export const isWords = (item: Item) => item.type === 'text' || item.type === 'caption';

// Words whose look is fixed (a pack's hidden look, like Trial Reels' own letters): only the words change, never the look.
export const fixedLook = (style: TextStyle | undefined) => Boolean(style?.look && (textLooks as any)[style.look]?.hidden);
