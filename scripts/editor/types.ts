// The edit document as TypeScript sees it. edit-doc.mjs is the source of truth for its rules.
export type Transform = { x: number; y: number; scale: number; rotation: number; opacity: number; originX?: number; originY?: number };
export type TextStyle = {
  font?: string; size?: number; weight?: number; color?: string; align?: 'left' | 'center' | 'right';
  background?: string; stroke?: string; caps?: boolean; maxWidth?: number; shadow?: boolean;
  // A look registered by a pack ('<pack>/<name>') draws the item; without one, the editor's own look does.
  look?: string;
  // Captions only: the word being said, where the block sits (a fraction of the height), how words appear.
  activeColor?: string; y?: number; animation?: 'none' | 'pop' | 'karaoke' | 'word'; wordsPerPage?: number;
};
export type Keyframe = { frame: number; value: number; easing?: 'linear' | 'smooth' };
export type DetailEdit = { clockOffset?: number;
  text?: string; src?: string; color?: string; size?: number; hidden?: boolean;
  from?: number; to?: number; transform?: Partial<Pick<Transform, 'x' | 'y' | 'scale' | 'rotation' | 'opacity'>>;
  keyframes?: Partial<Record<'x' | 'y' | 'scale' | 'rotation' | 'opacity', Keyframe[]>>;
};
export type Word = { id?: string; text: string; from: number; to: number; edit?: DetailEdit };
export type ElementDefinition = { id: string; label: string; kind: 'group' | 'text' | 'image' | 'shape'; parent?: string; text?: string; src?: string; color?: string; size?: number; from?: number; to?: number };
export type CaptionPage = { from: number; to: number; lines: number[][] };
export type Crop = { l: number; t: number; r: number; b: number };
export type Item = {
  id: string; track: string; type: 'video' | 'audio' | 'image' | 'text' | 'caption' | 'layer';
  words?: Word[]; pages?: CaptionPage[]; crop?: Crop;
  link?: string; // items sharing a link move, select and delete together
  from: number; durationInFrames: number; trimStart?: number; label?: string;
  src?: string; preview?: string; sourceDurationInFrames?: number; volume?: number; speed?: number;
  fadeIn?: number; fadeOut?: number; fit?: 'cover' | 'contain'; size?: { w: number; h: number };
  motion?: { preset: 'rise' | 'slide' | 'zoom'; durationInFrames: number; offsetInFrames?: number };
  // Rounded corners of a clip or picture, in frame pixels.
  radius?: number;
  text?: string; style?: TextStyle;
  renderer?: string; data?: any;
  elements?: Record<string, DetailEdit>;
  transform?: Transform;
  thumb?: string;
  // Set by a pack when this item needs the agent before the export (agent.ts), or cannot be drawn here (left out).
  agent?: { task: string; note?: string; ref?: string; request?: any; done?: any; by?: string };
  missing?: string;
};
export type Track = { id: string; name: string; kind: 'visual' | 'audio'; hidden?: boolean; muted?: boolean; locked?: boolean; keep?: boolean };
export type Marker = { frame: number; kind: 'beat' | 'cue'; label?: string };
export type Doc = {
  version: number; project: string; format: string; name?: string;
  fps: number; width: number; height: number; durationInFrames: number; background?: string;
  tracks: Track[]; items: Item[]; markers?: Marker[];
  source?: { reader: string; readAt: string; files?: Record<string, string> };
  revision?: number;
};

// What a format gives the editor for its own layers: the component that draws one, and the few fields a person can
// change on it without knowing the format. A field reads its value off the item and writes a new item back.
export type LayerProps = { item: Item; doc: Doc; asset: (path: string) => string; mode: 'player' | 'render' };
export type Field = {
  key: string;
  label: string;
  kind: 'text' | 'longtext' | 'number' | 'color' | 'choice';
  choices?: { value: string; label: string }[];
  read: (item: Item) => any;
  write: (item: Item, value: any) => Item;
};
// fields may also be a function of the item, for a kind whose editable words differ from one item to the next.
export type LayerKind = { draw: React.FC<LayerProps>; fields?: Field[] | ((item: Item) => Field[]); label?: (item: Item) => string; elements?: ElementDefinition[] };

// Looks a pack registers, like a template in CapCut. A caption look draws one page of the universal caption words in
// the pack's style; a text look draws words placed by hand. `style` is what picking the look writes onto the item
// (a font, a size, colours), so a look can be only a preset and draw nothing of its own.
export type CaptionLookProps = {
  item: Item; doc: Doc; asset: (path: string) => string; mode: 'player' | 'render';
  frame: number; // on the item's own clock
  words: Word[]; page: CaptionPage; pageIndex: number; active: number; style: TextStyle;
};
export type TextLookProps = { item: Item; doc: Doc; asset: (path: string) => string; mode: 'player' | 'render'; frame: number; text: string; style: TextStyle };
export type CaptionLook = { label: string; draw?: React.FC<CaptionLookProps>; style?: TextStyle };
export type TextLook = { label: string; draw?: React.FC<TextLookProps>; style?: TextStyle; text?: string };
